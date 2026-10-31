import type { DocumentStore, Point } from '../../document-model'
import {
  distance,
  neueObjektBasis,
  STANDARD_WAND_FUELL_FARBE,
  zerlegeWandInSegmente,
} from '../../document-model'
import type { WandObjekt } from '../../document-model'
import type { Command } from '../command'
import { erzeugeObjektAendernCommand } from '../commands'
import { wendeWinkelSnapAn } from '../snapping'
import { ENDPUNKT_TOLERANZ_PX, findeWandEndpunkt } from '../wand-platzierung'
import type { Tool, ToolContext } from '../tool'
import { enter, plusMinus, tastenHinweis, wirksam } from '../kontext-aktionen'
import { t } from '../../sprache'

export const STAERKE_SCHRITT = 0.02

export function legeWandzugAn(ctx: ToolContext, punkte: Point[], label: string): void {
  const command = erzeugeWandzugCommand(
    ctx.doc,
    ctx.aktivesBlattId(),
    ctx.aktiveEbeneId(),
    punkte,
    ctx.wandStaerke(),
    label,
  )
  if (command) ctx.commands.execute(command)
}

export function erzeugeWandzugCommand(
  doc: DocumentStore,
  blattId: string,
  ebeneId: string,
  punkte: Point[],
  staerke: number,
  label: string,
): Command | null {
  if (punkte.length < 2) return null
  const wand: WandObjekt = {
    ...neueObjektBasis(ebeneId),
    type: 'wand',
    punkte,
    staerke,
    fuellung: { art: 'farbe', farbe: STANDARD_WAND_FUELL_FARBE, deckkraft: 1 },
  }
  const segmente = zerlegeWandInSegmente(wand)
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) => [...objekte, ...segmente])
}

export function erzeugeWandTool(): Tool {
  let punkte: Point[] = []
  let aktuell: Point | null = null

  function status(ctx: ToolContext) {
    const staerke = t('werkzeuge.wand.staerke', {
      cm: Math.round(ctx.wandStaerke() * 100),
      taste: tastenHinweis(t('werkzeuge.wand.staerkeTaste')),
    })
    ctx.setStatus(
      punkte.length === 0
        ? t('werkzeuge.wand.start', { staerke })
        : t('werkzeuge.wand.weiter', {
            staerke,
            taste: tastenHinweis(t('werkzeuge.tasten.oderEnter')),
          }),
    )
  }

  function reset() {
    punkte = []
    aktuell = null
  }

  function bereitFuerNaechsteWand(ctx: ToolContext) {
    reset()
    status(ctx)
    ctx.requestOverlayRedraw()
  }

  function abschliessen(ctx: ToolContext) {
    legeWandzugAn(ctx, [...punkte], t('werkzeuge.wand.zeichnen'))
    bereitFuerNaechsteWand(ctx)
  }

  function schliessToleranz(ctx: ToolContext): number {
    return ctx.view.laengeToWorld(ENDPUNKT_TOLERANZ_PX) + ctx.wandStaerke() * Math.SQRT1_2
  }

  return {
    id: 'wand',
    get bezeichnung() {
      return t('werkzeugnamen.wand')
    },
    kuerzel: 'UMSCHALT+ALT+W',
    zusaetzlicheFangarten: ['naechster'],
    onActivate(ctx) {
      reset()
      status(ctx)
    },
    onDeactivate() {
      reset()
    },
    onPointerDown(info, ctx) {
      if (punkte.length > 0) {
        if (punkte.length >= 3 && distance(info.raw, punkte[0]) <= schliessToleranz(ctx)) {
          punkte.push({ ...punkte[0] })
          abschliessen(ctx)
          return
        }
        const treffer = findeWandEndpunkt(ctx, info.world)
        const eigenerPunkt =
          treffer &&
          (distance(treffer.punkt, punkte[0]) < 1e-9 ||
            distance(treffer.punkt, punkte[punkte.length - 1]) < 1e-9)
        if (treffer && !eigenerPunkt) {
          punkte.push({ ...treffer.punkt })
          abschliessen(ctx)
          return
        }
      } else {
        const treffer = findeWandEndpunkt(ctx, info.world)
        if (treffer) {
          punkte.push({ ...treffer.punkt })
          status(ctx)
          ctx.requestOverlayRedraw()
          return
        }
      }
      const vorheriger = punkte[punkte.length - 1] ?? info.world
      const punkt = wendeWinkelSnapAn(vorheriger, info.world, info.shiftKey && punkte.length > 0)
      punkte.push(punkt)
      status(ctx)
      ctx.requestOverlayRedraw()
    },
    onPointerMove(info, ctx) {
      if (punkte.length === 0) return
      aktuell = wendeWinkelSnapAn(punkte[punkte.length - 1], info.world, info.shiftKey)
      ctx.requestOverlayRedraw()
    },
    konstruktionsStrecke() {
      if (punkte.length === 0 || !aktuell) return null
      return {
        von: punkte[punkte.length - 1],
        bis: aktuell,
        davor: punkte[punkte.length - 2] ?? null,
        eingebbar: true,
      }
    },
    onDoubleClick(_info, ctx) {
      if (punkte.length > 0) punkte.pop()
      abschliessen(ctx)
    },
    tastenAktionen(ctx) {
      return wirksam(
        plusMinus(
          t('werkzeuge.wand.staerkeGruppe'),
          `${(ctx.wandStaerke() * 100).toFixed(0)} cm`,
          t('werkzeuge.wand.duenner'),
          t('werkzeuge.wand.dicker'),
        ),
        punkte.length >= 2 && enter(t('werkzeuge.tasten.fertig')),
      )
    },
    onKeyDown(e, ctx) {
      if (e.key === 'Enter') {
        e.preventDefault()
        abschliessen(ctx)
        return
      }
      if (e.key === '+' || e.key === '=') {
        ctx.setWandStaerke(ctx.wandStaerke() + STAERKE_SCHRITT)
        status(ctx)
        ctx.requestOverlayRedraw()
      } else if (e.key === '-') {
        ctx.setWandStaerke(ctx.wandStaerke() - STAERKE_SCHRITT)
        status(ctx)
        ctx.requestOverlayRedraw()
      }
    },
    drawOverlay(g, ctx) {
      if (punkte.length === 0) return
      const alle = aktuell ? [...punkte, aktuell] : punkte
      const screenPunkte = alle.map((p) => ctx.view.worldToScreen(p))
      const staerkePx = Math.max(1, ctx.view.laengeToScreen(ctx.wandStaerke()))
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = staerkePx
      g.lineCap = 'butt'
      g.setLineDash([5, 4])
      g.beginPath()
      g.moveTo(screenPunkte[0].x, screenPunkte[0].y)
      for (const p of screenPunkte.slice(1)) g.lineTo(p.x, p.y)
      g.stroke()
      g.setLineDash([])
      g.lineWidth = 1.5
      for (const p of screenPunkte) {
        g.beginPath()
        g.arc(p.x, p.y, 3, 0, Math.PI * 2)
        g.fillStyle = '#2f7dd1'
        g.fill()
      }
      if (punkte.length >= 3) {
        const start = ctx.view.worldToScreen(punkte[0])
        g.beginPath()
        g.arc(start.x, start.y, 6, 0, Math.PI * 2)
        g.strokeStyle = '#2fa84f'
        g.lineWidth = 2
        g.stroke()
      }
      g.restore()
    },
  }
}
