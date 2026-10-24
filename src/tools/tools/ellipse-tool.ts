import type { Point } from '../../document-model'
import { neueObjektBasis } from '../../document-model'
import type { EllipseObjekt } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugeEllipseTool(): Tool {
  let mittelpunkt: Point | null = null
  let aktuell: Point | null = null

  return {
    id: 'ellipse',
    get bezeichnung() {
      return t('werkzeugnamen.ellipse')
    },
    kuerzel: 'EL',
    onActivate(ctx) {
      mittelpunkt = null
      aktuell = null
      ctx.setStatus(t('werkzeuge.ellipse.mittelpunkt'))
    },
    onDeactivate() {
      mittelpunkt = null
      aktuell = null
    },
    onPointerDown(info, ctx) {
      if (!mittelpunkt) {
        mittelpunkt = info.world
        ctx.setStatus(t('werkzeuge.ellipse.zweiterPunkt'))
        return
      }
      const radiusX = Math.abs(info.world.x - mittelpunkt.x)
      const radiusY = Math.abs(info.world.y - mittelpunkt.y)
      if (radiusX > 0 && radiusY > 0) {
        const objekt: EllipseObjekt = {
          ...neueObjektBasis(ctx.aktiveEbeneId()),
          type: 'ellipse',
          mittelpunkt,
          radiusX,
          radiusY,
          drehung: 0,
          fuellung: null,
        }
        ctx.commands.execute(
          erzeugeObjektHinzufuegenCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            objekt,
            t('werkzeuge.ellipse.zeichnen'),
          ),
        )
      }
      mittelpunkt = null
      aktuell = null
      ctx.zurueckZuAuswahl()
    },
    onPointerMove(info, ctx) {
      if (!mittelpunkt) return
      aktuell = info.world
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g, ctx) {
      if (!mittelpunkt || !aktuell) return
      const m = ctx.view.worldToScreen(mittelpunkt)
      const rx = ctx.view.laengeToScreen(Math.abs(aktuell.x - mittelpunkt.x))
      const ry = ctx.view.laengeToScreen(Math.abs(aktuell.y - mittelpunkt.y))
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.beginPath()
      g.ellipse(m.x, m.y, rx, ry, 0, 0, Math.PI * 2)
      g.stroke()
      g.restore()
    },
  }
}
