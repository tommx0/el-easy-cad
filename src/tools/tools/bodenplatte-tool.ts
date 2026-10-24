import type { BodenplattenObjekt, Point } from '../../document-model'
import {
  distance,
  neueObjektBasis,
  STANDARD_BODENPLATTE_LINIENTYP,
  STANDARD_BODENPLATTE_STAERKE,
} from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { wendeWinkelSnapAn } from '../snapping'
import type { Tool, ToolContext } from '../tool'
import { enter, tastenHinweis, wirksam } from '../kontext-aktionen'
import { t } from '../../sprache'

const SCHLIESSEN_TOLERANZ_PX = 8

export function erzeugeBodenplatte(ctx: ToolContext, punkte: Point[]): BodenplattenObjekt {
  return {
    ...neueObjektBasis(ctx.aktiveEbeneId(), { linientyp: STANDARD_BODENPLATTE_LINIENTYP }),
    type: 'bodenplatte',
    punkte,
    staerke: STANDARD_BODENPLATTE_STAERKE,
    oberkante: 0,
    fuellung: null,
  }
}

function legeAn(ctx: ToolContext, punkte: Point[]) {
  ctx.commands.execute(
    erzeugeObjektHinzufuegenCommand(
      ctx.doc,
      ctx.aktivesBlattId(),
      erzeugeBodenplatte(ctx, punkte),
      t('werkzeuge.bodenplatte.zeichnen'),
    ),
  )
}

export function rechteckUmriss(a: Point, b: Point): Point[] | null {
  if (a.x === b.x || a.y === b.y) return null
  const [x1, x2] = [Math.min(a.x, b.x), Math.max(a.x, b.x)]
  const [y1, y2] = [Math.min(a.y, b.y), Math.max(a.y, b.y)]
  return [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ]
}

function zeichneUmriss(
  g: CanvasRenderingContext2D,
  ctx: ToolContext,
  punkte: Point[],
  geschlossen: boolean,
) {
  const screen = punkte.map((p) => ctx.view.worldToScreen(p))
  g.save()
  g.strokeStyle = '#2f7dd1'
  g.lineWidth = 1.5
  g.setLineDash([5, 4])
  g.beginPath()
  g.moveTo(screen[0].x, screen[0].y)
  for (const p of screen.slice(1)) g.lineTo(p.x, p.y)
  if (geschlossen) g.closePath()
  g.stroke()
  g.restore()
}

export function erzeugeBodenplatteTool(): Tool {
  let punkte: Point[] = []
  let aktuell: Point | null = null

  function zuruecksetzen() {
    punkte = []
    aktuell = null
  }

  function abschliessen(ctx: ToolContext) {
    if (punkte.length >= 3) {
      legeAn(ctx, [...punkte])
      zuruecksetzen()
      ctx.zurueckZuAuswahl()
      return
    }
    ctx.setStatus(t('werkzeuge.bodenplatte.zuWenigPunkte'))
  }

  return {
    id: 'bodenplatte',
    get bezeichnung() {
      return t('werkzeugnamen.bodenplatte')
    },
    kuerzel: 'UMSCHALT+B',
    onActivate(ctx) {
      zuruecksetzen()
      ctx.setStatus(
        t('werkzeuge.bodenplatte.status', {
          taste: tastenHinweis(t('werkzeuge.tasten.oderEnter')),
        }),
      )
    },
    onDeactivate() {
      zuruecksetzen()
    },
    onPointerDown(info, ctx) {
      const erster = punkte[0]
      if (
        erster &&
        punkte.length >= 3 &&
        ctx.view.laengeToScreen(distance(info.world, erster)) <= SCHLIESSEN_TOLERANZ_PX
      ) {
        abschliessen(ctx)
        return
      }
      const vorheriger = punkte[punkte.length - 1] ?? info.world
      punkte.push(wendeWinkelSnapAn(vorheriger, info.world, info.shiftKey && punkte.length > 0))
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
    tastenAktionen() {
      return wirksam(punkte.length >= 3 && enter(t('werkzeuge.bodenplatte.schliessen')))
    },
    onKeyDown(e, ctx) {
      if (e.key === 'Enter') {
        e.preventDefault()
        abschliessen(ctx)
      }
    },
    drawOverlay(g, ctx) {
      if (punkte.length === 0) return
      zeichneUmriss(g, ctx, aktuell ? [...punkte, aktuell] : punkte, punkte.length >= 2)
      const erster = ctx.view.worldToScreen(punkte[0])
      g.save()
      g.fillStyle = '#2f7dd1'
      g.beginPath()
      g.arc(erster.x, erster.y, 4, 0, Math.PI * 2)
      g.fill()
      g.restore()
    },
  }
}

export function erzeugeBodenplatteRechteckTool(): Tool {
  let ecke1: Point | null = null
  let ecke2: Point | null = null

  return {
    id: 'bodenplatterechteck',
    get bezeichnung() {
      return t('werkzeugnamen.bodenplatterechteck')
    },
    kuerzel: 'ALT+B',
    onActivate(ctx) {
      ecke1 = null
      ecke2 = null
      ctx.setStatus(t('werkzeuge.bodenplatte.ersteEcke'))
    },
    onDeactivate() {
      ecke1 = null
      ecke2 = null
    },
    onPointerDown(info, ctx) {
      if (!ecke1) {
        ecke1 = info.world
        ecke2 = info.world
        ctx.setStatus(t('werkzeuge.bodenplatte.gegenecke'))
        return
      }
      const umriss = rechteckUmriss(ecke1, info.world)
      if (!umriss) return
      legeAn(ctx, umriss)
      ecke1 = null
      ecke2 = null
      ctx.zurueckZuAuswahl()
    },
    onPointerMove(info, ctx) {
      if (!ecke1) return
      ecke2 = info.world
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g, ctx) {
      if (!ecke1 || !ecke2) return
      const umriss = rechteckUmriss(ecke1, ecke2)
      if (umriss) zeichneUmriss(g, ctx, umriss, true)
    },
  }
}
