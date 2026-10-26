import type { Tool, ToolContext } from '../tool'
import { leertaste, plusMinus, tastenHinweis, wirksam } from '../kontext-aktionen'
import type {
  KnxAktorArt,
  KnxAktorDaten,
  KomponentenObjekt,
  Point,
  SlotTreffer,
  WandflaechenTreffer,
} from '../../document-model'
import {
  findeNaechstenFreienSlot,
  findeKombinationUnter,
  findeWandflaeche,
  istSchaltplan,
  ordneAnWandEin,
  getBoundingBox,
  getFangpunkt,
  knxAktorArtVonKatalogId,
  knxAktorInstanzFelder,
  knxAktorKatalogId,
  neueKnxAktorDaten,
  naechstesFreiesKennzeichen,
  neueObjektBasis,
  positionFuerFangpunkt,
  rasteAufLinieEin,
  schleifeEin,
} from '../../document-model'
import {
  zeichneAbstandslinie,
  zeichneFangpunkt,
  zeichneObjekt,
  zeichneSlotHighlight,
} from '../../rendering'
import { ermittleAbstaende } from '../abstandsanzeige'
import { erzeugeObjektAendernCommand, erzeugeObjektHinzufuegenCommand } from '../commands'
import { erzeugeKomponentenInstanz, type KomponentenAuswahl } from '../komponente-bauen'
import { t } from '../../sprache'

const VORSCHAU_DECKKRAFT = 0.45
const EINSCHLEIF_FARBE = '#1E88E5'
export const MAGNET_TOLERANZ_PX = 10
export const WANDFANG_TOLERANZ_PX = 15
export const KOMBINATION_TREFFER_PX = 3

export function wandflaecheUnterZeiger(
  ctx: ToolContext,
  roh: Point,
  ohne: ReadonlySet<string> = new Set(),
): WandflaechenTreffer | null {
  if (!ctx.wandfangAktiv?.()) return null
  if (istSchaltplan(ctx.doc.getZeichnung())) return null
  const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
  if (!blatt) return null
  const aufKombination = findeKombinationUnter(
    blatt.objekte,
    roh,
    ctx.view.laengeToWorld(KOMBINATION_TREFFER_PX),
    ohne,
  )
  if (aufKombination) return aufKombination
  const toleranz = ctx.view.laengeToWorld(WANDFANG_TOLERANZ_PX)
  return findeWandflaeche(
    blatt.objekte,
    roh,
    toleranz,
    ctx.hintergrundLinienBei?.(roh, toleranz) ?? [],
  )
}

export function erzeugeKomponentenTool(art: 'komponente' | 'knx-aktor' = 'komponente'): Tool {
  let auswahl:
    | (KomponentenAuswahl & {
        knxAktor?: KnxAktorDaten
        knxKennzeichen?: string
      })
    | null = null
  let anzahl = 0
  let vorschauPosition: Point | null = null
  let magnetZiel: SlotTreffer | null = null
  let vorschauDrehung = 0
  let wandZiel: WandflaechenTreffer | null = null
  let hoeheCm: number | null = null

  function drehungSchritte(): number {
    return Math.round(vorschauDrehung / (Math.PI / 2)) % 4
  }

  function mitGewaehlterHoehe(treffer: WandflaechenTreffer | null): WandflaechenTreffer | null {
    if (!treffer || hoeheCm === null || treffer.kombinationHoeheCm === undefined) return treffer
    const { kombinationHoeheCm: _h, ...ohneHoehe } = treffer
    void _h
    return ohneHoehe
  }

  function hoehenText(): string {
    if (hoeheCm !== null) return `${hoeheCm} cm`
    if (auswahl?.montageort === 'decke') return t('werkzeuge.komponente.decke')
    if (auswahl?.montageort === 'boden') return t('werkzeuge.komponente.boden')
    return t('werkzeuge.komponente.standard')
  }

  function stufeHoehe(ctx: ToolContext, schritt: 1 | -1): number | null {
    const vorgaben = [...(ctx.installationshoehenVorgabenCm?.() ?? [])].sort((a, b) => a - b)
    const stufen: (number | null)[] = [null, ...vorgaben]
    const i = Math.max(0, stufen.indexOf(hoeheCm))
    return stufen[Math.min(stufen.length - 1, Math.max(0, i + schritt))]
  }

  function mitHoehe(ctx: ToolContext): boolean {
    return !istSchaltplan(ctx.doc.getZeichnung())
  }

  function status(ctx: ToolContext) {
    const taste = tastenHinweis(t('werkzeuge.komponente.tasteDreht'))
    if (auswahl?.knxAktor) {
      ctx.setStatus(
        anzahl === 0
          ? t('werkzeuge.komponente.knxPlatzieren', { taste })
          : t('werkzeuge.komponente.knxPlatziert', { n: anzahl }),
      )
      return
    }
    ctx.setStatus(
      anzahl === 0
        ? t('werkzeuge.komponente.platzieren', { taste })
        : t('werkzeuge.komponente.platziert', { n: anzahl, taste }),
    )
  }

  function erzeugeInstanz(ctx: ToolContext, fangZiel: Point): KomponentenObjekt | null {
    if (!auswahl) return null
    if (auswahl.knxAktor) return knxInstanz(ctx, fangZiel)
    return erzeugeKomponentenInstanz(
      auswahl,
      {
        zeichnung: ctx.doc.getZeichnung(),
        blatt: ctx.doc.getBlatt(ctx.aktivesBlattId()),
        ebeneId: ctx.aktiveEbeneId(),
        drehung: vorschauDrehung,
        hoeheCm,
        klemmenLeiste: ctx.klemmenLeiste?.(),
        bekannteVerteilerKennzeichen: ctx.bekannteVerteilerKennzeichen?.(),
      },
      fangZiel,
    )
  }

  function knxInstanz(ctx: ToolContext, fangZiel: Point): KomponentenObjekt | null {
    if (!auswahl?.knxAktor) return null
    const zeichnung = ctx.doc.getZeichnung()
    const instanz: KomponentenObjekt = {
      ...neueObjektBasis(ctx.aktiveEbeneId()),
      type: 'komponente',
      position: fangZiel,
      drehung: vorschauDrehung,
      catalogComponentId: auswahl.catalogComponentId,
      variantId: null,
      kombinierbar: false,
      ...knxAktorInstanzFelder(auswahl.knxAktor),
      geraeteKennzeichen:
        anzahl === 0 && auswahl.knxKennzeichen
          ? auswahl.knxKennzeichen
          : naechstesFreiesKennzeichen(zeichnung, 'K'),
    }
    return { ...instanz, position: positionFuerFangpunkt(instanz, fangZiel) }
  }

  function waehleKnxAktor(
    ctx: ToolContext,
    knxArt: KnxAktorArt,
    weiter: (gewaehlt: { daten: KnxAktorDaten; kennzeichen?: string } | null) => void,
  ) {
    const vorschlag = naechstesFreiesKennzeichen(ctx.doc.getZeichnung(), 'K')
    const daten = neueKnxAktorDaten(knxArt, knxArt === 'dimm' ? 4 : 8)
    if (!ctx.oeffneKnxAktorDialog) {
      weiter({ daten, kennzeichen: vorschlag })
      return
    }
    ctx.oeffneKnxAktorDialog({ daten, kennzeichen: vorschlag }, weiter)
  }

  function knxGewaehlt(
    ctx: ToolContext,
    gewaehlt: { daten: KnxAktorDaten; kennzeichen?: string } | null,
  ) {
    if (!gewaehlt) {
      ctx.zurueckZuAuswahl()
      return
    }
    auswahl = {
      catalogComponentId: knxAktorKatalogId(gewaehlt.daten.art),
      variantId: null,
      kennzeichenBuchstabe: 'K',
      knxAktor: gewaehlt.daten,
      knxKennzeichen: gewaehlt.kennzeichen,
    }
    status(ctx)
  }

  function anDerWand(ctx: ToolContext, objekt: KomponentenObjekt): KomponentenObjekt | null {
    const ziel = mitGewaehlterHoehe(wandZiel)
    if (!ziel || magnetZiel) return null
    const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
    if (!blatt) return null
    return ordneAnWandEin(blatt.objekte, objekt, ziel, ctx.doc.getZeichnung(), drehungSchritte())
      .komponente
  }

  function mitMagnet(objekt: KomponentenObjekt): KomponentenObjekt {
    if (!magnetZiel) return objekt
    return {
      ...objekt,
      position: magnetZiel.punkt,
      drehung: magnetZiel.drehung,
      groesseWelt: magnetZiel.slotGroesse,
      breiteWelt: undefined,
      hoehenFaktor: undefined,
      traegerId: magnetZiel.traegerId,
      slotIndex: magnetZiel.slotIndex,
    }
  }

  function aufLinie(ctx: ToolContext, objekt: KomponentenObjekt): KomponentenObjekt {
    if (magnetZiel || !istSchaltplan(ctx.doc.getZeichnung())) return objekt
    const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
    if (!blatt) return objekt
    return rasteAufLinieEin(blatt.objekte, objekt, vorschauDrehung === 0) ?? objekt
  }

  return {
    id: art,
    get bezeichnung() {
      return t(`werkzeugnamen.${art}`)
    },
    ...(art === 'komponente' ? { kuerzel: 'B' } : {}),
    bleibtAktiv: true,
    erneutAktivierbar: true,

    onActivate(ctx) {
      auswahl = null
      anzahl = 0
      vorschauDrehung = 0
      wandZiel = null
      if (art === 'knx-aktor') {
        ctx.setStatus(t('werkzeuge.komponente.knxZusammenstellen'))
        waehleKnxAktor(ctx, 'schalt-jalousie', (gewaehlt) => knxGewaehlt(ctx, gewaehlt))
        return
      }
      ctx.setStatus(t('werkzeuge.komponente.katalogWaehlen'))
      ctx.oeffneKomponentenPicker((ergebnis) => {
        if (!ergebnis) {
          ctx.zurueckZuAuswahl()
          return
        }
        const knxArt = knxAktorArtVonKatalogId(ergebnis.catalogComponentId)
        if (knxArt) {
          waehleKnxAktor(ctx, knxArt, (gewaehlt) => knxGewaehlt(ctx, gewaehlt))
          return
        }
        auswahl = ergebnis
        status(ctx)
      })
    },

    onDeactivate() {
      auswahl = null
      anzahl = 0
      vorschauPosition = null
      magnetZiel = null
      wandZiel = null
    },

    onAbbrechen(ctx) {
      auswahl = null
      anzahl = 0
      vorschauPosition = null
      magnetZiel = null
      wandZiel = null
      ctx.zurueckZuAuswahl()
      return true
    },

    tastenAktionen(ctx) {
      return wirksam(
        auswahl && leertaste(t('werkzeuge.tasten.drehen90')),
        auswahl &&
          mitHoehe(ctx) &&
          plusMinus(
            t('werkzeuge.komponente.hoehe'),
            hoehenText(),
            t('werkzeuge.komponente.niedriger'),
            t('werkzeuge.komponente.hoeher'),
          ),
      )
    },

    onKeyDown(e, ctx) {
      const hoeher = e.key === '+' || e.key === '='
      if ((hoeher || e.key === '-') && auswahl && mitHoehe(ctx)) {
        e.preventDefault()
        hoeheCm = stufeHoehe(ctx, hoeher ? 1 : -1)
        ctx.setStatus(t('werkzeuge.komponente.installationshoehe', { hoehe: hoehenText() }))
        ctx.requestOverlayRedraw()
        return
      }
      if (e.key !== ' ' || !auswahl) return
      e.preventDefault()
      vorschauDrehung = (vorschauDrehung + Math.PI / 2) % (2 * Math.PI)
      ctx.requestOverlayRedraw()
    },

    onPointerMove(info, ctx) {
      if (!auswahl) return
      magnetZiel = null
      if (auswahl.modulSystem) {
        const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
        const geist = erzeugeInstanz(ctx, info.raw)
        if (blatt && geist) {
          magnetZiel = findeNaechstenFreienSlot(
            blatt.objekte,
            info.raw,
            ctx.view.laengeToWorld(MAGNET_TOLERANZ_PX),
            geist,
          )
        }
      }
      wandZiel = magnetZiel ? null : wandflaecheUnterZeiger(ctx, info.raw)
      vorschauPosition = magnetZiel ? magnetZiel.punkt : info.world
      ctx.requestOverlayRedraw()
    },

    onPointerLeave(ctx) {
      if (!vorschauPosition && !magnetZiel) return
      vorschauPosition = null
      magnetZiel = null
      wandZiel = null
      ctx.requestOverlayRedraw()
    },

    onPointerDown(info, ctx) {
      let eingeschleift = 0
      const roh = erzeugeInstanz(ctx, magnetZiel ? magnetZiel.punkt : info.world)
      const objekt = roh ? mitMagnet(roh) : null
      if (!objekt) return
      const ziel = magnetZiel ? null : mitGewaehlterHoehe(wandZiel)
      if (ziel) {
        const zeichnung = ctx.doc.getZeichnung()
        const schritte = drehungSchritte()
        ctx.commands.execute(
          erzeugeObjektAendernCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            t('werkzeuge.komponente.anWand'),
            (objekte) => ordneAnWandEin(objekte, objekt, ziel, zeichnung, schritte).objekte,
          ),
        )
      } else if (istSchaltplan(ctx.doc.getZeichnung())) {
        const eingerastet = aufLinie(ctx, objekt)
        ctx.commands.execute(
          erzeugeObjektAendernCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            t('werkzeuge.komponente.platzierenLabel'),
            (objekte) => {
              const ergebnis = schleifeEin([...objekte, eingerastet], eingerastet.id)
              eingeschleift = ergebnis.anzahl
              return ergebnis.objekte
            },
          ),
        )
      } else {
        ctx.commands.execute(
          erzeugeObjektHinzufuegenCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            objekt,
            t('werkzeuge.komponente.platzierenLabel'),
          ),
        )
      }
      anzahl += 1
      vorschauPosition = info.world
      magnetZiel = null
      status(ctx)
      if (eingeschleift > 0)
        ctx.setStatus(t('werkzeuge.komponente.eingeschleift', { n: eingeschleift }))
    },

    drawOverlay(g, ctx) {
      if (!auswahl || !vorschauPosition) return
      const roh = erzeugeInstanz(ctx, vorschauPosition)
      if (!roh) return
      const wand = anDerWand(ctx, roh)
      const objekt = wand ?? aufLinie(ctx, mitMagnet(roh))
      if (magnetZiel) {
        zeichneSlotHighlight(g, ctx.view, magnetZiel)
      }
      g.save()
      g.globalAlpha = VORSCHAU_DECKKRAFT
      zeichneObjekt(g, ctx.view, objekt, ctx.komponentenRenderKontext())
      g.restore()
      const blattJetzt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (blattJetzt && !wand && !magnetZiel && istSchaltplan(ctx.doc.getZeichnung())) {
        const { objekte: neu, linien } = schleifeEin([...blattJetzt.objekte, objekt], objekt.id)
        for (const o of neu)
          if (o.type === 'schaltverbindung' && linien.includes(o.id))
            zeichneObjekt(g, ctx.view, { ...o, farbe: EINSCHLEIF_FARBE })
      }
      if (!magnetZiel && !wand) zeichneFangpunkt(g, ctx.view, getFangpunkt(objekt))

      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (blatt) {
        const bb = getBoundingBox(objekt)
        const mitte = { x: (bb.min.x + bb.max.x) / 2, y: (bb.min.y + bb.max.y) / 2 }
        const halbBreite = (bb.max.x - bb.min.x) / 2
        const halbHoehe = (bb.max.y - bb.min.y) / 2
        const abstaende = ermittleAbstaende(mitte, halbBreite, halbHoehe, blatt.objekte)
        for (const abstand of abstaende) {
          zeichneAbstandslinie(
            g,
            ctx.view,
            abstand.vonPunkt,
            abstand.zuPunkt,
            abstand.entfernungMeter,
          )
        }
      }
    },
  }
}
