import type { BemassungObjekt, Point } from '../../document-model'
import { distance, neueObjektBasis } from '../../document-model'
import { zeichneObjekt } from '../../rendering'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { wendeWinkelSnapAn } from '../snapping'
import type { Tool } from '../tool'
import { t } from '../../sprache'

function berechneVersatz(a: Point, b: Point, p: Point): number {
  const laenge = distance(a, b)
  if (laenge === 0) return 0
  const richtung = { x: (b.x - a.x) / laenge, y: (b.y - a.y) / laenge }
  const normale = { x: -richtung.y, y: richtung.x }
  return (p.x - a.x) * normale.x + (p.y - a.y) * normale.y
}

export function erzeugeBemassungTool(): Tool {
  let start: Point | null = null
  let ende: Point | null = null
  let aktuell: Point | null = null

  function reset() {
    start = null
    ende = null
    aktuell = null
  }

  return {
    id: 'bemassung',
    get bezeichnung() {
      return t('werkzeugnamen.bemassung')
    },
    kuerzel: 'D',
    onActivate(ctx) {
      reset()
      ctx.setStatus(t('werkzeuge.bemassung.startpunkt'))
    },
    onDeactivate() {
      reset()
    },
    onPointerDown(info, ctx) {
      if (!start) {
        start = info.world
        ctx.setStatus(t('werkzeuge.bemassung.endpunkt'))
        return
      }
      if (!ende) {
        ende = wendeWinkelSnapAn(start, info.world, info.shiftKey)
        ctx.setStatus(t('werkzeuge.bemassung.versatz'))
        return
      }
      const versatz = berechneVersatz(start, ende, info.world)
      const objekt: BemassungObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'bemassung',
        start,
        ende,
        versatz,
        textOverride: null,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.bemassung.einfuegen'),
        ),
      )
      reset()
      ctx.zurueckZuAuswahl()
    },
    onPointerMove(info, ctx) {
      if (!start) return
      aktuell = ende ? info.world : wendeWinkelSnapAn(start, info.world, info.shiftKey)
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g, ctx) {
      if (!start || !aktuell) return
      if (!ende) {
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
        return
      }
      const versatz = berechneVersatz(start, ende, aktuell)
      const vorschau: BemassungObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'bemassung',
        start,
        ende,
        versatz,
        textOverride: null,
      }
      zeichneObjekt(g, ctx.view, vorschau)
    },
  }
}
