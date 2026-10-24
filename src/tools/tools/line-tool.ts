import type { Point } from '../../document-model'
import { neueObjektBasis } from '../../document-model'
import type { LinienObjekt } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { wendeWinkelSnapAn } from '../snapping'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugeLinienTool(): Tool {
  let start: Point | null = null
  let aktuell: Point | null = null

  return {
    id: 'linie',
    get bezeichnung() {
      return t('werkzeugnamen.linie')
    },
    kuerzel: 'L',
    onActivate(ctx) {
      start = null
      aktuell = null
      ctx.setStatus(t('werkzeuge.linie.startpunkt'))
    },
    onDeactivate() {
      start = null
      aktuell = null
    },
    onPointerDown(info, ctx) {
      if (!start) {
        start = info.world
        ctx.setStatus(t('werkzeuge.linie.endpunkt'))
        return
      }
      const ende = wendeWinkelSnapAn(start, info.world, info.shiftKey)
      const objekt: LinienObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'linie',
        start,
        ende,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.linie.zeichnen'),
        ),
      )
      start = null
      aktuell = null
      ctx.zurueckZuAuswahl()
    },
    onPointerMove(info, ctx) {
      if (!start) return
      aktuell = wendeWinkelSnapAn(start, info.world, info.shiftKey)
      ctx.requestOverlayRedraw()
    },
    konstruktionsStrecke() {
      return start && aktuell ? { von: start, bis: aktuell, davor: null, eingebbar: true } : null
    },
    drawOverlay(g, ctx) {
      if (!start || !aktuell) return
      const a = ctx.view.worldToScreen(start)
      const b = ctx.view.worldToScreen(aktuell)
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.beginPath()
      g.moveTo(a.x, a.y)
      g.lineTo(b.x, b.y)
      g.stroke()
      g.restore()
    },
  }
}
