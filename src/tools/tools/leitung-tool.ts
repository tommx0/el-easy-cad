import type { Tool, ToolContext } from '../tool'
import {
  enter,
  entf,
  gerade as geradeKnopf,
  GERADE_TASTE,
  leertaste,
  tastenHinweis,
  wirksam,
} from '../kontext-aktionen'
import type {
  KomponentenObjekt,
  LeitungsEndpunkt,
  LeitungsVerteilerAnschluss,
  LeitungsZiel,
  Point,
  TrunkDurchgang,
  TrunkObjekt,
  Zeichnung,
} from '../../document-model'
import { angeboteneDockpunkte, dockpunktBezeichnung } from '../../document-model'
import {
  austrittTRichtungSchacht,
  austrittTRichtungSwitch,
  ermittleSchaechteAnKette,
  ermittleSwitchesAnKette,
  ermittleTrunkKette,
  ermittleVerteilerAnKette,
  findeNaechstenDockpunkt,
  findeTrunkWeg,
  naechsterPunktAufPfad,
  punktAufPfad,
  schachtAnschlussPunkt,
  trunkAnzeigeName,
  verteilerAmEnde,
} from '../../document-model'
import { fuerLeitung, routePath, routingHindernisse } from '../../routing'
import { baueLeitungsObjekt, LEITUNG_STANDARD_FARBE, neueLeitungsNummer } from '../leitung-bauen'
import type { StrangBenennung } from '../commands'
import {
  erzeugeObjektHinzufuegenCommand,
  mitStrangBenennung,
  strangTitelAmSchacht,
} from '../commands'
import { wendeWinkelSnapAn } from '../snapping'
import type { SchachtAblageZiel } from '../schacht-ablage'
import { findeSchachtAblageZiel } from '../schacht-ablage'
import type { ToolVorgabe } from '../tool'
import { zeichneDockpunktHighlight, zeichneTrunkEndeHighlight } from '../../rendering'
import { t } from '../../sprache'

const DOCKPUNKT_TOLERANZ_PX = 10
const TRUNK_PFAD_TOLERANZ_PX = 10
const SCHACHT_TOLERANZ_PX = 8
const VORSCHAU_FARBE_GUELTIG = '#2f7dd1'
const VORSCHAU_FARBE_KEIN_PFAD = '#d1382f'
export const ALLE_DOCKPUNKTE_TASTE = 'AlleDockpunkte'

function komponentenAufBlatt(ctx: ToolContext): KomponentenObjekt[] {
  const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
  if (!blatt) return []
  return blatt.objekte.filter((o): o is KomponentenObjekt => o.type === 'komponente')
}

function hatEingeschraenkteKomponente(ctx: ToolContext): boolean {
  return komponentenAufBlatt(ctx).some((k) => angeboteneDockpunkte(k) !== null)
}

function schachtAufBlatt(ctx: ToolContext, schachtId: string) {
  const objekt = ctx.doc.getBlatt(ctx.aktivesBlattId())?.objekte.find((o) => o.id === schachtId)
  return objekt && objekt.type === 'kabelschacht' ? objekt : null
}

function trunksAufBlatt(ctx: ToolContext): TrunkObjekt[] {
  const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
  if (!blatt) return []
  return blatt.objekte.filter((o): o is TrunkObjekt => o.type === 'trunk')
}

interface TrunkTreffer {
  trunk: TrunkObjekt
  punkt: Point
  t: number
  distanz: number
}

function findeNaechstenTrunkTreffer(
  trunks: TrunkObjekt[],
  punkt: Point,
  toleranz: number,
  nurTrunkIds?: ReadonlySet<string>,
): TrunkTreffer | null {
  let bester: TrunkTreffer | null = null
  for (const trunk of trunks) {
    if (nurTrunkIds && !nurTrunkIds.has(trunk.id)) continue
    const treffer = naechsterPunktAufPfad(trunk.wegpunkte, punkt)
    if (!treffer || treffer.distanz > toleranz) continue
    if (!bester || treffer.distanz < bester.distanz) bester = { trunk, ...treffer }
  }
  return bester
}

function verbundeneTrunkIdsAufBlatt(ctx: ToolContext, trunkId: string): Set<string> {
  const blattId = ctx.aktivesBlattId()
  const kette = ermittleTrunkKette(ctx.doc.getZeichnung(), blattId, trunkId)
  return new Set(kette.filter((g) => g.blattId === blattId).map((g) => g.trunk.id))
}

function trunkName(ctx: ToolContext, trunk: TrunkObjekt): string {
  return trunkAnzeigeName(ctx.doc.getZeichnung(), ctx.aktivesBlattId(), trunk.id)
}

function zieleAnKette(ctx: ToolContext, trunk: TrunkObjekt) {
  const zeichnung = ctx.doc.getZeichnung()
  const blattId = ctx.aktivesBlattId()
  const nurSwitches = ermittleSwitchesAnKette(zeichnung, blattId, trunk.id).length
  const verteiler = ermittleVerteilerAnKette(zeichnung, blattId, trunk.id).length
  return {
    switches: nurSwitches + verteiler,
    verteiler,
    schaechte: ermittleSchaechteAnKette(zeichnung, blattId, trunk.id).length,
  }
}

function leertasteImTrunk(ctx: ToolContext, trunk: TrunkObjekt): string | null {
  const ziele = zieleAnKette(ctx, trunk)
  if (ziele.switches === 0 && ziele.schaechte === 0) return null
  if (ziele.schaechte === 0 && ziele.verteiler === 0) return t('werkzeuge.leitung.leerPort')
  if (ziele.schaechte === 0 && ziele.verteiler === ziele.switches)
    return t('werkzeuge.leitung.leerVerteiler')
  if (ziele.switches === 0) return t('werkzeuge.leitung.leerSchacht')
  return t('werkzeuge.leitung.leerZiel')
}

function statusImTrunk(
  ctx: ToolContext,
  trunk: TrunkObjekt,
  ketteAufBlatt: ReadonlySet<string>,
): string {
  const ziele = zieleAnKette(ctx, trunk)
  const wo = t(
    ketteAufBlatt.size > 1 ? 'werkzeuge.leitung.woVerbunden' : 'werkzeuge.leitung.woPfad',
  )
  const name = trunkName(ctx, trunk)
  if (ziele.switches === 0 && ziele.schaechte === 0) {
    return t('werkzeuge.leitung.imTrunk', { name, wo, taste: '' })
  }
  const was = t(
    ziele.schaechte === 0 && ziele.verteiler === 0
      ? 'werkzeuge.leitung.wasPort'
      : ziele.schaechte === 0 && ziele.verteiler === ziele.switches
        ? 'werkzeuge.leitung.wasVerteiler'
        : ziele.switches === 0
          ? 'werkzeuge.leitung.wasSchacht'
          : 'werkzeuge.leitung.wasZiel',
  )
  return t('werkzeuge.leitung.imTrunk', {
    name,
    wo,
    taste: tastenHinweis(t('werkzeuge.leitung.imTrunkTaste', { was })),
  })
}

export function erzeugeLeitungTool(): Tool {
  let startEndpunkt: LeitungsEndpunkt | null = null
  let segmentStart: Point | null = null
  let stuetzpunkte: Point[] = []
  let manuelleAnzahl = 0
  let letztesZielRoh: Point | null = null
  let hoverDock: ReturnType<typeof findeNaechstenDockpunkt> = null
  let hoverTrunk: TrunkTreffer | null = null
  let hoverSchacht: SchachtAblageZiel | null = null
  let startAmSchacht: { schachtId: string; strang: number } | null = null
  let startBenennung: StrangBenennung | null = null
  let fertigeSegmente: Point[][] = []
  let durchgaenge: TrunkDurchgang[] = []
  let aktuellerEintritt: {
    trunk: TrunkObjekt
    eintrittT: number
    ketteAufBlatt: Set<string>
  } | null = null
  let altGehalten = false
  let alleDockpunkte = false
  let strgGehalten = false
  let geradeEinmal = false
  let geradeVerlegt = false

  function dockpunktFilter() {
    return altGehalten || alleDockpunkte ? undefined : angeboteneDockpunkte
  }

  function zuruecksetzen() {
    startAmSchacht = null
    startBenennung = null
    startEndpunkt = null
    segmentStart = null
    stuetzpunkte = []
    manuelleAnzahl = 0
    letztesZielRoh = null
    hoverDock = null
    hoverTrunk = null
    hoverSchacht = null
    fertigeSegmente = []
    durchgaenge = []
    aktuellerEintritt = null
    geradeEinmal = false
    geradeVerlegt = false
  }

  function routingAnker(): Point | null {
    return stuetzpunkte.length > 0 ? stuetzpunkte[stuetzpunkte.length - 1] : segmentStart
  }

  function abschnittMit(pfad: Point[]): Point[] {
    return [segmentStart as Point, ...stuetzpunkte, ...pfad.slice(1)]
  }

  function hindernisseFuerAbschnitt(ctx: ToolContext) {
    const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
    return routingHindernisse(blatt?.objekte ?? [], ctx.routingSettings().sicherheitsabstandMeter)
  }

  function berechneEndstueck(ctx: ToolContext, ziel: Point, gerade: boolean) {
    const anker = routingAnker()
    if (!anker) return null
    if (gerade) return [anker, ziel]
    return routePath(anker, ziel, hindernisseFuerAbschnitt(ctx), routingFuerNeueLeitung(ctx))
  }

  function endstueckGesetzt(gerade: boolean) {
    if (!gerade) return
    geradeVerlegt = true
    geradeEinmal = false
  }

  function routingFuerNeueLeitung(ctx: ToolContext) {
    const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
    const zone = ctx.verlegeVorgaben().leitungZone
    return fuerLeitung(
      ctx.routingSettings(),
      zone ? { installationszone: zone } : undefined,
      blatt?.geschoss,
      ctx.doc.getZeichnung().installationszonen,
    )
  }

  function statusZeichnen(): string {
    return t('werkzeuge.leitung.zeichnen', {
      tasteStrg: tastenHinweis(t('werkzeuge.tasten.strgGerade')),
      tasteEnter: tastenHinweis(t('werkzeuge.tasten.oderEnter')),
      tasteEntf: tastenHinweis(t('werkzeuge.tasten.oderEntf')),
    })
  }

  function mitFreiemEndeAbschliessen(ctx: ToolContext) {
    if (!segmentStart || aktuellerEintritt) return
    if (stuetzpunkte.length === 0) {
      ctx.setStatus(t('werkzeuge.leitung.nochKeinPunkt'))
      return
    }
    leitungAbschliessen(ctx, { art: 'frei' }, [...fertigeSegmente, [segmentStart, ...stuetzpunkte]])
  }

  function letztenStuetzpunktEntfernen(ctx: ToolContext) {
    if (stuetzpunkte.length === 0) return
    stuetzpunkte.pop()
    manuelleAnzahl--
    ctx.setStatus(statusZeichnen())
    ctx.requestOverlayRedraw()
  }

  function ermittleNummer(zeichnung: Zeichnung, ziel: LeitungsZiel): number {
    return neueLeitungsNummer(zeichnung, [startEndpunkt, ziel])
  }

  function leitungAbschliessen(
    ctx: ToolContext,
    ziel: LeitungsZiel,
    segmente: Point[][],
    zielBenennung?: StrangBenennung,
    verteilerAnschluesse: LeitungsVerteilerAnschluss[] = [],
  ) {
    const zone = ctx.verlegeVorgaben().leitungZone
    const objekt = baueLeitungsObjekt({
      zeichnung: ctx.doc.getZeichnung(),
      blatt: ctx.doc.getBlatt(ctx.aktivesBlattId()),
      ersatzEbeneId: ctx.aktiveEbeneId(),
      start: startEndpunkt as LeitungsEndpunkt,
      ziel,
      segmente,
      durchgaenge,
      zone,
      selbstVerlegt: manuelleAnzahl > 0 || geradeVerlegt,
      parallelAbstandMeter: ctx.routingSettings().parallelAbstandMeter,
      verteilerAnschluesse,
    })
    const hinzufuegen = erzeugeObjektHinzufuegenCommand(
      ctx.doc,
      ctx.aktivesBlattId(),
      objekt,
      t('werkzeuge.leitung.zeichnenLabel'),
    )
    const benennungen = [startBenennung, zielBenennung].filter(
      (b): b is StrangBenennung => b?.name !== undefined,
    )
    if (benennungen.length === 0) ctx.commands.execute(hinzufuegen)
    else ctx.commands.push(mitStrangBenennung(ctx.doc, hinzufuegen, benennungen))
    if (zone) ctx.zonenZugewiesen()
    zuruecksetzen()
    ctx.zurueckZuAuswahl()
    ctx.leitungVerknuepfen?.(ctx.aktivesBlattId(), objekt.id)
  }

  function abschliessenMitVerteilerFrage(
    ctx: ToolContext,
    ziel: LeitungsZiel,
    segmente: Point[][],
  ) {
    const start = startEndpunkt
    if (!start) return
    const zeichnung = ctx.doc.getZeichnung()
    const blattId = ctx.aktivesBlattId()
    const leitung = { start, ziel }
    const enden = (['ziel', 'start'] as const).filter(
      (ende) => verteilerAmEnde(zeichnung, blattId, leitung, ende) !== null,
    )
    if (enden.length === 0) {
      leitungAbschliessen(ctx, ziel, segmente)
      return
    }
    const nummer = ermittleNummer(zeichnung, ziel)
    const gesammelt: LeitungsVerteilerAnschluss[] = []
    const frage = (i: number) => {
      if (startEndpunkt !== start) return
      if (i >= enden.length) {
        leitungAbschliessen(ctx, ziel, segmente, undefined, gesammelt)
        return
      }
      const am = verteilerAmEnde(zeichnung, blattId, leitung, enden[i])!
      ctx.oeffneVerteilerDialog(
        {
          blattId: am.blattId,
          objektId: am.verteiler.id,
          fuer: t('werkzeuge.leitung.fuer', { nummer: String(nummer) }),
        },
        (auswahl) => {
          for (const a of auswahl ?? []) gesammelt.push({ ...a, ende: enden[i] })
          frage(i + 1)
        },
      )
    }
    frage(0)
  }

  function oeffneZielImBuendel(
    ctx: ToolContext,
    eintritt: { trunk: TrunkObjekt; eintrittT: number; ketteAufBlatt: Set<string> },
  ) {
    const blattId = ctx.aktivesBlattId()
    ctx.oeffneSwitchPortDialog(
      { quelle: { art: 'trunk', blattId, trunkId: eintritt.trunk.id }, schachtErlaubt: true },
      (ziel) => {
        if (aktuellerEintritt !== eintritt) return
        if (!ziel) {
          ctx.setStatus(statusImTrunk(ctx, eintritt.trunk, eintritt.ketteAufBlatt))
          return
        }
        if (ziel.art === 'schacht') {
          durchgaenge.push({
            trunkId: eintritt.trunk.id,
            eintrittT: eintritt.eintrittT,
            austrittT: austrittTRichtungSchacht(
              ctx.doc.getZeichnung(),
              blattId,
              eintritt.trunk.id,
              ziel.schachtId,
            ),
          })
          aktuellerEintritt = null
          leitungAbschliessen(
            ctx,
            { art: 'schacht', objektId: ziel.schachtId, strang: ziel.strang },
            [...fertigeSegmente, []],
            { blattId, schachtId: ziel.schachtId, strang: ziel.strang, name: ziel.name },
          )
          return
        }
        durchgaenge.push({
          trunkId: eintritt.trunk.id,
          eintrittT: eintritt.eintrittT,
          austrittT: austrittTRichtungSwitch(
            ctx.doc.getZeichnung(),
            blattId,
            eintritt.trunk.id,
            ziel.objektId,
          ),
        })
        aktuellerEintritt = null
        if (ziel.art === 'verteiler') {
          leitungAbschliessen(
            ctx,
            { art: 'verteiler', blattId: ziel.blattId, objektId: ziel.objektId },
            [...fertigeSegmente, []],
            undefined,
            ziel.anschluesse.map((a) => ({ ...a, ende: 'ziel' as const })),
          )
          return
        }
        leitungAbschliessen(
          ctx,
          {
            art: 'switchport',
            blattId: ziel.blattId,
            objektId: ziel.objektId,
            portIndex: ziel.portIndex,
          },
          [...fertigeSegmente, []],
        )
      },
    )
  }

  return {
    id: 'leitung',
    get bezeichnung() {
      return t('werkzeugnamen.leitung')
    },
    kuerzel: 'W',

    onActivate(ctx, vorgabe?: ToolVorgabe) {
      zuruecksetzen()
      alleDockpunkte = false
      if (vorgabe?.art === 'leitung-am-schacht') {
        startAmSchacht = { schachtId: vorgabe.schachtId, strang: vorgabe.strang }
        startEndpunkt = { art: 'schacht', objektId: vorgabe.schachtId, strang: vorgabe.strang }
        const titel = strangTitelAmSchacht(ctx.doc, {
          blattId: ctx.aktivesBlattId(),
          schachtId: vorgabe.schachtId,
          strang: vorgabe.strang,
        })
        ctx.setStatus(t('werkzeuge.leitung.fortsetzung', { titel, status: statusZeichnen() }))
        return
      }
      ctx.setStatus(t('werkzeuge.leitung.start'))
    },

    onDeactivate() {
      zuruecksetzen()
    },

    onPointerMove(info, ctx) {
      strgGehalten = info.ctrlKey
      const toleranzDock = ctx.view.laengeToWorld(DOCKPUNKT_TOLERANZ_PX)
      const toleranzTrunk = ctx.view.laengeToWorld(TRUNK_PFAD_TOLERANZ_PX)

      if (aktuellerEintritt) {
        hoverDock = null
        hoverTrunk = findeNaechstenTrunkTreffer(
          trunksAufBlatt(ctx),
          info.raw,
          toleranzTrunk,
          aktuellerEintritt.ketteAufBlatt,
        )
        ctx.requestOverlayRedraw()
        return
      }

      altGehalten = info.altKey
      hoverDock = findeNaechstenDockpunkt(
        komponentenAufBlatt(ctx),
        info.raw,
        toleranzDock,
        'leitung',
        dockpunktFilter(),
      )
      hoverTrunk = hoverDock
        ? null
        : findeNaechstenTrunkTreffer(trunksAufBlatt(ctx), info.raw, toleranzTrunk)
      hoverSchacht =
        hoverDock || hoverTrunk
          ? null
          : findeSchachtAblageZiel(
              ctx.doc.getBlatt(ctx.aktivesBlattId())?.objekte ?? [],
              info.raw,
              ctx.view.laengeToWorld(SCHACHT_TOLERANZ_PX),
            )
      if (startAmSchacht && fertigeSegmente.length === 0 && stuetzpunkte.length === 0) {
        const schacht = schachtAufBlatt(ctx, startAmSchacht.schachtId)
        if (schacht) segmentStart = schachtAnschlussPunkt(schacht, info.world)
      }
      const anker = routingAnker()
      if (anker) {
        letztesZielRoh = hoverDock
          ? hoverDock.punkt
          : hoverTrunk
            ? hoverTrunk.punkt
            : (hoverSchacht?.punkt ?? wendeWinkelSnapAn(anker, info.world, info.shiftKey))
      }
      ctx.requestOverlayRedraw()
    },

    onPointerDown(info, ctx) {
      strgGehalten = info.ctrlKey
      const gerade = info.ctrlKey || geradeEinmal
      if (!segmentStart && startAmSchacht) {
        const schacht = schachtAufBlatt(ctx, startAmSchacht.schachtId)
        if (schacht) {
          segmentStart = schachtAnschlussPunkt(schacht, info.world)
          ctx.requestOverlayRedraw()
          return
        }
      }
      if (!segmentStart) {
        if (hoverDock) {
          startEndpunkt = {
            art: 'dock',
            objektId: hoverDock.objektId,
            dockpunktIndex: hoverDock.dockpunktIndex,
          }
          segmentStart = hoverDock.punkt
        } else if (hoverSchacht) {
          const ziel = hoverSchacht
          ctx.oeffneSchachtAnschlussDialog(
            { blattId: ctx.aktivesBlattId(), schachtId: ziel.schachtId, art: 'leitung' },
            (ergebnis) => {
              if (!ergebnis || ergebnis.art !== 'strang') return
              const { strang } = ergebnis
              startEndpunkt = { art: 'schacht', objektId: ziel.schachtId, strang }
              startAmSchacht = { schachtId: ziel.schachtId, strang }
              startBenennung = {
                blattId: ctx.aktivesBlattId(),
                schachtId: ziel.schachtId,
                strang,
                name: ergebnis.name,
              }
              segmentStart = ziel.punkt
              ctx.setStatus(
                t('werkzeuge.leitung.startAmStrang', {
                  titel: strangTitelAmSchacht(ctx.doc, startBenennung),
                  status: statusZeichnen(),
                }),
              )
              ctx.requestOverlayRedraw()
            },
          )
          return
        } else {
          startEndpunkt = { art: 'frei' }
          segmentStart = info.world
        }
        ctx.setStatus(statusZeichnen())
        ctx.requestOverlayRedraw()
        return
      }

      if (aktuellerEintritt) {
        const eintritt = aktuellerEintritt
        if (!hoverTrunk) {
          ctx.setStatus(
            t(
              eintritt.ketteAufBlatt.size > 1
                ? 'werkzeuge.leitung.austrittKette'
                : 'werkzeuge.leitung.austrittPfad',
              { name: trunkName(ctx, eintritt.trunk) },
            ),
          )
          return
        }
        const austritt = hoverTrunk
        if (
          austritt.trunk.id === eintritt.trunk.id &&
          Math.abs(austritt.t - eintritt.eintrittT) < 1e-6
        ) {
          ctx.setStatus(t('werkzeuge.leitung.austrittGleich'))
          return
        }
        const weg = findeTrunkWeg(
          ctx.doc.getZeichnung(),
          ctx.aktivesBlattId(),
          eintritt.trunk.id,
          austritt.trunk.id,
        )
        if (!weg) {
          ctx.setStatus(
            t('werkzeuge.leitung.nichtVerbunden', {
              austritt: trunkName(ctx, austritt.trunk),
              eintritt: trunkName(ctx, eintritt.trunk),
            }),
          )
          return
        }
        weg.forEach((glied, index) => {
          if (index > 0) fertigeSegmente.push([])
          durchgaenge.push({
            trunkId: glied.trunk.id,
            eintrittT: glied.eintrittT ?? eintritt.eintrittT,
            austrittT: glied.austrittT ?? austritt.t,
          })
        })
        segmentStart = austritt.punkt
        stuetzpunkte = []
        aktuellerEintritt = null
        hoverTrunk = null
        ctx.setStatus(statusZeichnen())
        ctx.requestOverlayRedraw()
        return
      }

      if (
        hoverTrunk &&
        startAmSchacht &&
        fertigeSegmente.length === 0 &&
        stuetzpunkte.length === 0
      ) {
        const schachtId = startAmSchacht.schachtId
        if (hoverTrunk.trunk.enden.some((e) => e.schachtRef?.objektId === schachtId)) {
          const eintrittT = austrittTRichtungSchacht(
            ctx.doc.getZeichnung(),
            ctx.aktivesBlattId(),
            hoverTrunk.trunk.id,
            schachtId,
          )
          fertigeSegmente.push([])
          aktuellerEintritt = {
            trunk: hoverTrunk.trunk,
            eintrittT,
            ketteAufBlatt: verbundeneTrunkIdsAufBlatt(ctx, hoverTrunk.trunk.id),
          }
          segmentStart = punktAufPfad(hoverTrunk.trunk.wegpunkte, eintrittT)
          hoverTrunk = null
          ctx.setStatus(
            statusImTrunk(ctx, aktuellerEintritt.trunk, aktuellerEintritt.ketteAufBlatt),
          )
          ctx.requestOverlayRedraw()
          return
        }
      }
      if (hoverTrunk) {
        const pfad = berechneEndstueck(ctx, hoverTrunk.punkt, gerade)
        if (!pfad) {
          ctx.setStatus(t('werkzeuge.leitung.keinPfadTrunk'))
          return
        }
        fertigeSegmente.push(abschnittMit(pfad))
        endstueckGesetzt(gerade)
        stuetzpunkte = []
        aktuellerEintritt = {
          trunk: hoverTrunk.trunk,
          eintrittT: hoverTrunk.t,
          ketteAufBlatt: verbundeneTrunkIdsAufBlatt(ctx, hoverTrunk.trunk.id),
        }
        segmentStart = hoverTrunk.punkt
        hoverTrunk = null
        ctx.setStatus(statusImTrunk(ctx, aktuellerEintritt.trunk, aktuellerEintritt.ketteAufBlatt))
        ctx.requestOverlayRedraw()
        return
      }

      if (!hoverDock && !hoverSchacht) {
        stuetzpunkte.push(letztesZielRoh ?? info.world)
        manuelleAnzahl++
        ctx.setStatus(statusZeichnen())
        ctx.requestOverlayRedraw()
        return
      }

      const endstueck = berechneEndstueck(ctx, letztesZielRoh ?? info.world, gerade)
      if (!endstueck) {
        ctx.setStatus(t('werkzeuge.leitung.keinPfad'))
        return
      }

      if (hoverSchacht) {
        const ziel = hoverSchacht
        const abschnitt = abschnittMit(endstueck)
        const ankerVorSchacht = routingAnker()
        const abschnittsStartVorSchacht = segmentStart
        const stuetzpunkteVorSchacht = [...stuetzpunkte]
        ctx.oeffneSchachtAnschlussDialog(
          {
            blattId: ctx.aktivesBlattId(),
            schachtId: ziel.schachtId,
            art: 'leitung',
            trunkErlaubt: true,
          },
          (ergebnis) => {
            if (!ergebnis) return
            if (ergebnis.art === 'trunk') {
              const trunk = trunksAufBlatt(ctx).find((t) => t.id === ergebnis.trunkId)
              if (!trunk || !ankerVorSchacht || !abschnittsStartVorSchacht) return
              const ziele = zieleAnKette(ctx, trunk)
              if (ziele.switches === 0 && ziele.schaechte === 0) {
                ctx.setStatus(t('werkzeuge.leitung.ketteOhneZiel', { name: trunkName(ctx, trunk) }))
                return
              }
              const blattId = ctx.aktivesBlattId()
              const eintrittT = austrittTRichtungSchacht(
                ctx.doc.getZeichnung(),
                blattId,
                trunk.id,
                ziel.schachtId,
              )
              const eintrittPunkt = punktAufPfad(trunk.wegpunkte, eintrittT)
              const eintrittsPfad = gerade
                ? [ankerVorSchacht, eintrittPunkt]
                : routePath(
                    ankerVorSchacht,
                    eintrittPunkt,
                    hindernisseFuerAbschnitt(ctx),
                    routingFuerNeueLeitung(ctx),
                  )
              if (!eintrittsPfad) {
                ctx.setStatus(t('werkzeuge.leitung.keinPfadZumTrunk'))
                return
              }
              fertigeSegmente.push([
                abschnittsStartVorSchacht,
                ...stuetzpunkteVorSchacht,
                ...eintrittsPfad.slice(1),
              ])
              endstueckGesetzt(gerade)
              stuetzpunkte = []
              aktuellerEintritt = {
                trunk,
                eintrittT,
                ketteAufBlatt: verbundeneTrunkIdsAufBlatt(ctx, trunk.id),
              }
              segmentStart = eintrittPunkt
              oeffneZielImBuendel(ctx, aktuellerEintritt)
              return
            }
            endstueckGesetzt(gerade)
            leitungAbschliessen(
              ctx,
              { art: 'schacht', objektId: ziel.schachtId, strang: ergebnis.strang },
              [...fertigeSegmente, abschnitt],
              {
                blattId: ctx.aktivesBlattId(),
                schachtId: ziel.schachtId,
                strang: ergebnis.strang,
                name: ergebnis.name,
              },
            )
          },
        )
        return
      }

      const dock = hoverDock as NonNullable<typeof hoverDock>
      const zielEndpunkt: LeitungsEndpunkt = {
        art: 'dock',
        objektId: dock.objektId,
        dockpunktIndex: dock.dockpunktIndex,
      }
      endstueckGesetzt(gerade)
      abschliessenMitVerteilerFrage(ctx, zielEndpunkt, [
        ...fertigeSegmente,
        abschnittMit(endstueck),
      ])
    },

    konstruktionsStrecke() {
      if (aktuellerEintritt || !letztesZielRoh) return null
      const von = routingAnker()
      if (!von) return null
      const eingebbar = !hoverDock && !hoverTrunk && !hoverSchacht
      const davor =
        stuetzpunkte.length >= 2
          ? stuetzpunkte[stuetzpunkte.length - 2]
          : stuetzpunkte.length === 1
            ? segmentStart
            : null
      return { von, bis: letztesZielRoh, davor, eingebbar }
    },

    tastenAktionen(ctx) {
      const leer = aktuellerEintritt && leertasteImTrunk(ctx, aktuellerEintritt.trunk)
      return wirksam(
        leer && leertaste(leer),
        segmentStart &&
          !aktuellerEintritt &&
          stuetzpunkte.length > 0 &&
          enter(t('werkzeuge.leitung.freiesEnde')),
        stuetzpunkte.length > 0 && entf(t('werkzeuge.tasten.punktZurueck')),
        segmentStart && !aktuellerEintritt && geradeKnopf(geradeEinmal || strgGehalten),
        !aktuellerEintritt &&
          hatEingeschraenkteKomponente(ctx) && {
            taste: ALLE_DOCKPUNKTE_TASTE,
            kennung: 'Alt',
            beschriftung: t('werkzeuge.leitung.alleDockpunkte'),
            an: alleDockpunkte,
          },
      )
    },

    dockpunkteAngeboten() {
      return dockpunktFilter() ?? null
    },

    onKeyDown(e, ctx) {
      if (e.key === 'Control' || e.key === GERADE_TASTE) {
        if (e.key === 'Control') strgGehalten = true
        else geradeEinmal = !geradeEinmal
        ctx.requestOverlayRedraw()
        return
      }
      if (e.key === ALLE_DOCKPUNKTE_TASTE) {
        alleDockpunkte = !alleDockpunkte
        hoverDock = null
        ctx.requestOverlayRedraw()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        mitFreiemEndeAbschliessen(ctx)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        letztenStuetzpunktEntfernen(ctx)
        return
      }
      if (e.key !== ' ' || !aktuellerEintritt) return
      e.preventDefault()
      const eintritt = aktuellerEintritt
      const ziele = zieleAnKette(ctx, eintritt.trunk)
      if (ziele.switches === 0 && ziele.schaechte === 0) {
        ctx.setStatus(
          t('werkzeuge.leitung.ketteOhneZielLeertaste', { name: trunkName(ctx, eintritt.trunk) }),
        )
        return
      }
      oeffneZielImBuendel(ctx, eintritt)
    },

    onKeyUp(e, ctx) {
      if (e.key !== 'Control') return
      strgGehalten = false
      ctx.requestOverlayRedraw()
    },

    onDoubleClick(_info, ctx) {
      if (!segmentStart || aktuellerEintritt) return
      if (stuetzpunkte.length > 0) {
        stuetzpunkte.pop()
        manuelleAnzahl--
      }
      mitFreiemEndeAbschliessen(ctx)
    },

    onRightClick(_info, ctx) {
      if (stuetzpunkte.length === 0) return false
      letztenStuetzpunktEntfernen(ctx)
      return true
    },

    drawOverlay(g, ctx) {
      if (hoverDock) {
        const komponente = komponentenAufBlatt(ctx).find((k) => k.id === hoverDock!.objektId)
        zeichneDockpunktHighlight(
          g,
          ctx.view,
          hoverDock.punkt,
          dockpunktBezeichnung(komponente?.dockpunkte, hoverDock.dockpunktIndex),
        )
      }
      if (hoverTrunk) {
        zeichneTrunkEndeHighlight(g, ctx.view, hoverTrunk.punkt)
      }
      if (hoverSchacht) {
        const mitte = ctx.view.worldToScreen(hoverSchacht.punkt)
        g.save()
        g.strokeStyle = VORSCHAU_FARBE_GUELTIG
        g.lineWidth = 2
        g.strokeRect(mitte.x - 5, mitte.y - 5, 10, 10)
        g.restore()
      }

      if (fertigeSegmente.length > 0) {
        g.save()
        g.strokeStyle = LEITUNG_STANDARD_FARBE
        g.lineWidth = 1.5
        for (const segment of fertigeSegmente) {
          if (segment.length < 2) continue
          const punkte = segment.map((p) => ctx.view.worldToScreen(p))
          g.beginPath()
          g.moveTo(punkte[0].x, punkte[0].y)
          for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
          g.stroke()
        }
        g.restore()
      }

      if (segmentStart && stuetzpunkte.length > 0) {
        const punkte = [segmentStart, ...stuetzpunkte].map((p) => ctx.view.worldToScreen(p))
        g.save()
        g.strokeStyle = LEITUNG_STANDARD_FARBE
        g.lineWidth = 1.5
        g.beginPath()
        g.moveTo(punkte[0].x, punkte[0].y)
        for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
        g.stroke()
        g.fillStyle = LEITUNG_STANDARD_FARBE
        for (const p of punkte.slice(1)) {
          g.beginPath()
          g.arc(p.x, p.y, 3, 0, Math.PI * 2)
          g.fill()
        }
        g.restore()
      }

      if (aktuellerEintritt) {
        return
      }

      const anker = routingAnker()
      if (!anker || !letztesZielRoh) return

      const zeigtAufAnschluss = Boolean(hoverDock || hoverTrunk || hoverSchacht)
      const vorschauPfad = zeigtAufAnschluss
        ? berechneEndstueck(ctx, letztesZielRoh, strgGehalten || geradeEinmal)
        : null

      g.save()
      g.setLineDash([5, 4])
      g.lineWidth = 1.5
      if (vorschauPfad) {
        g.strokeStyle = VORSCHAU_FARBE_GUELTIG
        g.beginPath()
        const punkte = vorschauPfad.map((p) => ctx.view.worldToScreen(p))
        g.moveTo(punkte[0].x, punkte[0].y)
        for (const p of punkte.slice(1)) g.lineTo(p.x, p.y)
        g.stroke()
      } else {
        g.strokeStyle = zeigtAufAnschluss ? VORSCHAU_FARBE_KEIN_PFAD : VORSCHAU_FARBE_GUELTIG
        const a = ctx.view.worldToScreen(anker)
        const b = ctx.view.worldToScreen(letztesZielRoh)
        g.beginPath()
        g.moveTo(a.x, a.y)
        g.lineTo(b.x, b.y)
        g.stroke()
      }
      g.restore()
    },
  }
}
