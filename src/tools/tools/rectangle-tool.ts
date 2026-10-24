import type { Point } from '../../document-model'
import { neueObjektBasis } from '../../document-model'
import type { RechteckObjekt } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { Tool } from '../tool'
import { t } from '../../sprache'

function rechteckAusEcken(a: Point, b: Point) {
  return {
    ursprung: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
    breite: Math.abs(b.x - a.x),
    hoehe: Math.abs(b.y - a.y),
  }
}

export function erzeugeRechteckTool(): Tool {
  let ecke1: Point | null = null
  let ecke2: Point | null = null

  return {
    id: 'rechteck',
    get bezeichnung() {
      return t('werkzeugnamen.rechteck')
    },
    kuerzel: 'R',
    onActivate(ctx) {
      ecke1 = null
      ecke2 = null
      ctx.setStatus(t('werkzeuge.rechteck.ersteEcke'))
    },
    onDeactivate() {
      ecke1 = null
      ecke2 = null
    },
    onPointerDown(info, ctx) {
      if (!ecke1) {
        ecke1 = info.world
        ctx.setStatus(t('werkzeuge.rechteck.gegenecke'))
        return
      }
      const { ursprung, breite, hoehe } = rechteckAusEcken(ecke1, info.world)
      if (breite > 0 && hoehe > 0) {
        const objekt: RechteckObjekt = {
          ...neueObjektBasis(ctx.aktiveEbeneId()),
          type: 'rechteck',
          ursprung,
          breite,
          hoehe,
          drehung: 0,
          fuellung: null,
        }
        ctx.commands.execute(
          erzeugeObjektHinzufuegenCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            objekt,
            t('werkzeuge.rechteck.zeichnen'),
          ),
        )
      }
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
      const { ursprung, breite, hoehe } = rechteckAusEcken(ecke1, ecke2)
      const a = ctx.view.worldToScreen(ursprung)
      const b = ctx.view.worldToScreen({ x: ursprung.x + breite, y: ursprung.y + hoehe })
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
      g.restore()
    },
  }
}
