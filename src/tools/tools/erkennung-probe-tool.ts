import type { Point } from '../../document-model'
import {
  zeichneOeffnungsVorschau,
  zeichneTreppenVorschau,
  zeichneWandVorschau,
} from '../../rendering'
import type { Tool, ToolContext } from '../tool'
import { t } from '../../sprache'

export function erzeugeErkennungsProbeTool(): Tool {
  let eckeA: Point | null = null
  let aktuell: Point | null = null

  function status(ctx: ToolContext) {
    if (eckeA) {
      ctx.setStatus(t('werkzeuge.erkennungProbe.gegenecke'))
      return
    }
    ctx.setStatus(t(`werkzeuge.erkennungProbe.${ctx.erkennungsProbenart()}`))
  }

  return {
    id: 'erkennung-probe',
    get bezeichnung() {
      return t('werkzeuge.erkennungProbe.bezeichnung')
    },
    bleibtAktiv: true,
    onActivate(ctx) {
      eckeA = null
      aktuell = null
      status(ctx)
    },
    onDeactivate() {
      eckeA = null
      aktuell = null
    },
    onPointerDown(info, ctx) {
      if (!eckeA) {
        eckeA = info.raw
        status(ctx)
        return
      }
      const von = eckeA
      eckeA = null
      aktuell = null
      if (Math.abs(info.raw.x - von.x) < 1e-6 || Math.abs(info.raw.y - von.y) < 1e-6) {
        status(ctx)
        return
      }
      ctx.meldeErkennungsProbe(von, info.raw)
      status(ctx)
      ctx.requestOverlayRedraw()
    },
    onPointerMove(info, ctx) {
      if (!eckeA) return
      aktuell = info.raw
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g, ctx) {
      const funde = ctx.erkennungsVorschau()
      zeichneWandVorschau(g, ctx.view, funde.waende)
      zeichneOeffnungsVorschau(g, ctx.view, funde.waende, funde.oeffnungen)
      zeichneTreppenVorschau(g, ctx.view, funde.treppen)

      if (!eckeA || !aktuell) return
      const a = ctx.view.worldToScreen(eckeA)
      const b = ctx.view.worldToScreen(aktuell)
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
      g.restore()
    },
  }
}
