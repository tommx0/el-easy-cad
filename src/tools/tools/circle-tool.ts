import type { Point } from '../../document-model'
import { distance, neueObjektBasis } from '../../document-model'
import type { KreisObjekt } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugeKreisTool(): Tool {
  let mittelpunkt: Point | null = null
  let aktuell: Point | null = null

  return {
    id: 'kreis',
    get bezeichnung() {
      return t('werkzeugnamen.kreis')
    },
    kuerzel: 'C',
    onActivate(ctx) {
      mittelpunkt = null
      aktuell = null
      ctx.setStatus(t('werkzeuge.kreis.mittelpunkt'))
    },
    onDeactivate() {
      mittelpunkt = null
      aktuell = null
    },
    onPointerDown(info, ctx) {
      if (!mittelpunkt) {
        mittelpunkt = info.world
        ctx.setStatus(t('werkzeuge.kreis.radius'))
        return
      }
      const radius = distance(mittelpunkt, info.world)
      if (radius > 0) {
        const objekt: KreisObjekt = {
          ...neueObjektBasis(ctx.aktiveEbeneId()),
          type: 'kreis',
          mittelpunkt,
          radius,
          fuellung: null,
        }
        ctx.commands.execute(
          erzeugeObjektHinzufuegenCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            objekt,
            t('werkzeuge.kreis.zeichnen'),
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
      const r = ctx.view.laengeToScreen(distance(mittelpunkt, aktuell))
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.beginPath()
      g.arc(m.x, m.y, r, 0, Math.PI * 2)
      g.stroke()
      g.restore()
    },
  }
}
