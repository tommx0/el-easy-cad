import type { Point } from '../../document-model'
import { angleBetween, distance, neueObjektBasis } from '../../document-model'
import type { BogenObjekt } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugeBogenTool(): Tool {
  let mittelpunkt: Point | null = null
  let radius = 0
  let startWinkel = 0
  let aktuell: Point | null = null

  function reset() {
    mittelpunkt = null
    radius = 0
    startWinkel = 0
    aktuell = null
  }

  return {
    id: 'bogen',
    get bezeichnung() {
      return t('werkzeugnamen.bogen')
    },
    kuerzel: 'A',
    onActivate(ctx) {
      reset()
      ctx.setStatus(t('werkzeuge.bogen.mittelpunkt'))
    },
    onDeactivate() {
      reset()
    },
    onPointerDown(info, ctx) {
      if (!mittelpunkt) {
        mittelpunkt = info.world
        ctx.setStatus(t('werkzeuge.bogen.startpunkt'))
        return
      }
      if (radius === 0) {
        radius = distance(mittelpunkt, info.world)
        startWinkel = angleBetween(mittelpunkt, info.world)
        ctx.setStatus(t('werkzeuge.bogen.endpunkt'))
        return
      }
      const endWinkel = angleBetween(mittelpunkt, info.world)
      const objekt: BogenObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'bogen',
        mittelpunkt,
        radius,
        startWinkel,
        endWinkel,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.bogen.zeichnen'),
        ),
      )
      reset()
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
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      if (radius === 0) {
        const r = ctx.view.laengeToScreen(distance(mittelpunkt, aktuell))
        g.beginPath()
        g.arc(m.x, m.y, r, 0, Math.PI * 2)
        g.stroke()
      } else {
        const r = ctx.view.laengeToScreen(radius)
        const endWinkel = angleBetween(mittelpunkt, aktuell)
        g.beginPath()
        g.arc(m.x, m.y, r, -endWinkel, -startWinkel)
        g.stroke()
      }
      g.restore()
    },
  }
}
