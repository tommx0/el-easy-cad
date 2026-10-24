import type { Tool, ToolContext } from '../tool'
import { enter, tastenHinweis, wirksam } from '../kontext-aktionen'
import type {
  KomponentenObjekt,
  KomponentenTyp,
  Objekt,
  Point,
  SlotZiel,
  Zeichnung,
} from '../../document-model'
import {
  ermittleTypUndSlots,
  ermittleUrsprung,
  ermittleZielTyp,
  erzeugtZyklus,
  etagenVerweiseFuerZiele,
  komponentenBezeichnung,
  istUeblicheTypKombination,
  typBezeichnung,
  typHatSlots,
  zielSchluessel,
} from '../../document-model'
import { hitTestObjekte } from '../hit-test'
import { erzeugeSlotsAendernCommand } from '../commands'
import {
  wirkverbindungsVerweisRechtecke,
  zeichneSlotGrafiken,
  zeichneWirkverbindungQuellHinweis,
  zeichneWirkverbindungsVerweise,
  zeichneWirkverbindungVorschau,
  zeichneWirkverbindungZielHighlight,
  zeichneWirkverbindungZielLinien,
} from '../../rendering'
import { t } from '../../sprache'

const TOLERANZ_PX = 6

interface QuelleZustand {
  blattId: string
  objektId: string
  position: Point
  typ: KomponentenTyp
}

function findeKomponente(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
): KomponentenObjekt | undefined {
  return zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o): o is KomponentenObjekt => o.type === 'komponente' && o.id === objektId)
}

function ermittleZielObjekteAufBlatt(
  ziele: readonly SlotZiel[],
  blattId: string,
  objekte: readonly Objekt[],
): KomponentenObjekt[] {
  const ergebnis: KomponentenObjekt[] = []
  for (const ziel of ziele) {
    if (ziel.art === 'instanz') {
      if (ziel.blattId !== blattId) continue
      const objekt = objekte.find(
        (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === ziel.objektId,
      )
      if (objekt) ergebnis.push(objekt)
      continue
    }
    for (const objekt of objekte) {
      if (objekt.type === 'komponente' && objekt.gruppeId === ziel.gruppeId) ergebnis.push(objekt)
    }
  }
  return ergebnis
}

export function erzeugeWirkverbindungTool(): Tool {
  let quelle: QuelleZustand | null = null
  let slotId: string | null = null
  let urspruenglicheZiele: SlotZiel[] = []
  let gesammelt: SlotZiel[] = []
  let zeiger: Point | null = null
  let wartetAufSlotWahl = false

  function zuruecksetzen() {
    quelle = null
    slotId = null
    urspruenglicheZiele = []
    gesammelt = []
    zeiger = null
    wartetAufSlotWahl = false
  }

  function statusQuelleWaehlen(): string {
    return t('werkzeuge.wirkverbindung.quelle')
  }

  function statusSammeln(): string {
    const n = gesammelt.length
    return t('werkzeuge.wirkverbindung.sammeln', {
      n,
      taste: tastenHinweis(t('werkzeuge.tasten.slashEnter')),
    })
  }

  function slotStarten(ctx: ToolContext, q: QuelleZustand, gewaehlteSlotId: string) {
    const zeichnung = ctx.doc.getZeichnung()
    const objekt = findeKomponente(zeichnung, q.blattId, q.objektId)
    const slot = objekt
      ? ermittleTypUndSlots(objekt, zeichnung)?.slots.find((s) => s.id === gewaehlteSlotId)
      : null
    if (!slot) {
      zuruecksetzen()
      ctx.setStatus(statusQuelleWaehlen())
      return
    }
    slotId = gewaehlteSlotId
    urspruenglicheZiele = slot.ziele
    gesammelt = [...slot.ziele]
    ctx.setStatus(statusSammeln())
    ctx.requestOverlayRedraw()
  }

  function commitFallsVeraendert(ctx: ToolContext) {
    if (!quelle || !slotId) return
    const q = quelle
    const gewaehlteSlotId = slotId
    const urspruenglicheSchluessel = new Set(urspruenglicheZiele.map(zielSchluessel))
    const neueSchluessel = new Set(gesammelt.map(zielSchluessel))
    const veraendert =
      urspruenglicheSchluessel.size !== neueSchluessel.size ||
      [...urspruenglicheSchluessel].some((s) => !neueSchluessel.has(s))
    if (!veraendert) return
    const zeichnung = ctx.doc.getZeichnung()
    const objekt = findeKomponente(zeichnung, q.blattId, q.objektId)
    const aufgeloest = objekt ? ermittleTypUndSlots(objekt, zeichnung) : null
    if (!aufgeloest) return
    const neueZiele = gesammelt
    const slots = aufgeloest.slots.map((s) =>
      s.id === gewaehlteSlotId ? { ...s, ziele: neueZiele } : s,
    )
    if (ctx.slotsUebernehmen)
      ctx.slotsUebernehmen({ blattId: q.blattId, objektId: q.objektId }, slots)
    else ctx.commands.execute(erzeugeSlotsAendernCommand(ctx.doc, q.blattId, q.objektId, slots))
  }

  function abschliessen(ctx: ToolContext) {
    commitFallsVeraendert(ctx)
    zuruecksetzen()
    ctx.zurueckZuAuswahl()
  }

  return {
    id: 'wirkverbindung',
    get bezeichnung() {
      return t('werkzeugnamen.wirkverbindung')
    },

    onActivate(ctx) {
      zuruecksetzen()
      ctx.setStatus(statusQuelleWaehlen())
    },

    onDeactivate(ctx) {
      commitFallsVeraendert(ctx)
      zuruecksetzen()
    },

    onPointerMove(info, ctx) {
      zeiger = info.world
      if (quelle && slotId) ctx.requestOverlayRedraw()
    },

    onPointerLeave() {
      zeiger = null
    },

    onPointerDown(info, ctx) {
      if (wartetAufSlotWahl) return
      const blattId = ctx.aktivesBlattId()
      const blatt = ctx.doc.getBlatt(blattId)
      if (!blatt) return
      const toleranz = ctx.view.laengeToWorld(TOLERANZ_PX)
      const treffer = hitTestObjekte(blatt.objekte, info.raw, toleranz)

      if (!quelle) {
        if (!treffer || treffer.type !== 'komponente') return
        const zeichnung = ctx.doc.getZeichnung()
        const aufgeloest = ermittleTypUndSlots(treffer, zeichnung)
        if (!aufgeloest || !typHatSlots(aufgeloest.typ)) {
          ctx.setStatus(
            aufgeloest
              ? t('werkzeuge.wirkverbindung.typOhneSlots', { typ: typBezeichnung(aufgeloest.typ) })
              : t('werkzeuge.wirkverbindung.ohneTyp'),
          )
          return
        }
        if (aufgeloest.slots.length === 0) {
          ctx.setStatus(t('werkzeuge.wirkverbindung.keineSlots'))
          return
        }
        const q: QuelleZustand = {
          blattId,
          objektId: treffer.id,
          position: treffer.position,
          typ: aufgeloest.typ,
        }
        quelle = q
        if (aufgeloest.slots.length === 1) {
          slotStarten(ctx, q, aufgeloest.slots[0].id)
          return
        }
        wartetAufSlotWahl = true
        ctx.setStatus(t('werkzeuge.wirkverbindung.slotWaehlen'))
        ctx.oeffneSlotWahlDialog({ blattId, objektId: treffer.id }, (gewaehlteSlotId) => {
          wartetAufSlotWahl = false
          if (quelle !== q) return
          if (!gewaehlteSlotId) {
            quelle = null
            ctx.setStatus(statusQuelleWaehlen())
            return
          }
          slotStarten(ctx, q, gewaehlteSlotId)
        })
        return
      }

      if (!treffer || treffer.type !== 'komponente' || treffer.id === quelle.objektId) return
      const zeichnung = ctx.doc.getZeichnung()
      const neuesZiel: SlotZiel = treffer.gruppeId
        ? { art: 'gruppe', gruppeId: treffer.gruppeId }
        : { art: 'instanz', blattId, objektId: treffer.id }
      const schluessel = zielSchluessel(neuesZiel)
      const vorhandenIndex = gesammelt.findIndex((z) => zielSchluessel(z) === schluessel)
      if (vorhandenIndex >= 0) {
        gesammelt = gesammelt.filter((_, i) => i !== vorhandenIndex)
        ctx.setStatus(statusSammeln())
        ctx.requestOverlayRedraw()
        return
      }
      const quelleObjekt = findeKomponente(zeichnung, quelle.blattId, quelle.objektId)
      if (!quelleObjekt) {
        zuruecksetzen()
        ctx.setStatus(statusQuelleWaehlen())
        return
      }
      const ursprung = ermittleUrsprung(quelleObjekt, quelle.blattId)
      if (erzeugtZyklus(zeichnung, ursprung, neuesZiel)) {
        ctx.setStatus(t('werkzeuge.wirkverbindung.kreislauf'))
        return
      }
      gesammelt = [...gesammelt, neuesZiel]
      const zielTyp = ermittleZielTyp(neuesZiel, zeichnung)
      ctx.setStatus(
        zielTyp && !istUeblicheTypKombination(quelle.typ, zielTyp)
          ? t('werkzeuge.wirkverbindung.unueblich', {
              quelle: typBezeichnung(quelle.typ),
              ziel: typBezeichnung(zielTyp),
              status: statusSammeln(),
            })
          : statusSammeln(),
      )
      ctx.requestOverlayRedraw()
    },

    onRightClick(_info, ctx) {
      if (!quelle || !slotId) return false
      abschliessen(ctx)
      return true
    },

    tastenAktionen() {
      return wirksam(quelle && slotId && enter(t('werkzeuge.tasten.fertig')))
    },

    onKeyDown(e, ctx) {
      if (e.key !== 'Enter' || !quelle || !slotId) return
      e.preventDefault()
      abschliessen(ctx)
    },

    onAbbrechen(ctx) {
      if (!quelle || !slotId) return false
      abschliessen(ctx)
      return true
    },

    drawOverlay(g, ctx) {
      if (!quelle || !slotId) return
      const zeichnung = ctx.doc.getZeichnung()
      const aktivesBlattId = ctx.aktivesBlattId()
      const aktivesBlatt = ctx.doc.getBlatt(aktivesBlattId)
      const zielObjekte = ermittleZielObjekteAufBlatt(
        gesammelt,
        aktivesBlattId,
        aktivesBlatt?.objekte ?? [],
      )
      if (zielObjekte.length > 0) zeichneWirkverbindungZielHighlight(g, ctx.view, zielObjekte)
      const quelleObjekt = findeKomponente(zeichnung, quelle.blattId, quelle.objektId)
      if (aktivesBlattId !== quelle.blattId) {
        if (zeiger && quelleObjekt) {
          const quellBlatt = zeichnung.blaetter.find((b) => b.id === quelle?.blattId)
          zeichneWirkverbindungQuellHinweis(
            g,
            ctx.view.worldToScreen(zeiger),
            t('werkzeuge.wirkverbindung.quellHinweis', {
              blatt: quellBlatt?.name ?? '',
              komponente: komponentenBezeichnung(quelleObjekt, ctx.katalogKomponenten()),
            }),
          )
        }
        return
      }
      if (zielObjekte.length > 0) {
        zeichneWirkverbindungZielLinien(
          g,
          ctx.view,
          quelle.position,
          zielObjekte.map((o) => o.position),
        )
      }
      if (zeiger) zeichneWirkverbindungVorschau(g, ctx.view, quelle.position, zeiger)
      const aufgeloest = quelleObjekt ? ermittleTypUndSlots(quelleObjekt, zeichnung) : null
      if (quelleObjekt && aufgeloest && aktivesBlatt) {
        zeichneSlotGrafiken(g, ctx.view, [
          {
            blattId: quelle.blattId,
            objektId: quelle.objektId,
            position: quelle.position,
            typ: aufgeloest.typ,
            slots: aufgeloest.slots,
            slotMatrix: aufgeloest.slotMatrix,
            richtung: 'aktiv',
            hervorgehobeneSlotIds: [slotId],
          },
        ])
        const slotIndex = aufgeloest.slots.findIndex((s) => s.id === slotId)
        const verweise = etagenVerweiseFuerZiele(
          gesammelt,
          Math.max(0, slotIndex),
          quelle.blattId,
          zeichnung,
          ctx.katalogKomponenten(),
        )
        zeichneWirkverbindungsVerweise(
          g,
          ctx.view,
          wirkverbindungsVerweisRechtecke(ctx.view, quelleObjekt, aktivesBlatt, verweise),
        )
      }
    },
  }
}
