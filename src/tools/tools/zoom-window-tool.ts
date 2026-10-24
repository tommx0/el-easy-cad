import type { Point } from '../../document-model'
import { boundingBoxFromPoints } from '../../document-model'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugeZoomFensterTool(): Tool {
  let ecke1: Point | null = null
  let ecke2: Point | null = null

  return {
    id: 'zoom-fenster',
    get bezeichnung() {
      return t('werkzeugnamen.zoom-fenster')
    },
    onActivate(ctx) {
      ecke1 = null
      ecke2 = null
      ctx.setStatus(t('werkzeuge.zoomFenster.status'))
    },
    onDeactivate() {
      ecke1 = null
      ecke2 = null
    },
    onPointerDown(info) {
      ecke1 = info.raw
    },
    onPointerMove(info, ctx) {
      if (!ecke1) return
      ecke2 = info.raw
      ctx.requestOverlayRedraw()
    },
    onPointerUp(info, ctx) {
      if (!ecke1) return
      const bb = boundingBoxFromPoints([ecke1, info.raw])
      const breite = bb.max.x - bb.min.x
      const hoehe = bb.max.y - bb.min.y
      if (breite > 0 && hoehe > 0) {
        ctx.view.fitBoundingBox(bb, ctx.getCanvasGroesse())
      }
      ecke1 = null
      ecke2 = null
      ctx.zurueckZuAuswahl()
    },
    drawOverlay(g, ctx) {
      if (!ecke1 || !ecke2) return
      const a = ctx.view.worldToScreen(ecke1)
      const b = ctx.view.worldToScreen(ecke2)
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.setLineDash([4, 3])
      g.lineWidth = 1.5
      g.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
      g.restore()
    },
  }
}
