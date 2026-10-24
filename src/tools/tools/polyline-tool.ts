import type { Point } from '../../document-model'
import { neueObjektBasis } from '../../document-model'
import type { PolylinienObjekt } from '../../document-model'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { wendeWinkelSnapAn } from '../snapping'
import type { Tool, ToolContext } from '../tool'
import { enter, tastenHinweis, wirksam } from '../kontext-aktionen'
import { t } from '../../sprache'

export function erzeugePolylinienTool(): Tool {
  let punkte: Point[] = []
  let aktuell: Point | null = null

  function abschliessen(ctx: ToolContext) {
    if (punkte.length >= 2) {
      const objekt: PolylinienObjekt = {
        ...neueObjektBasis(ctx.aktiveEbeneId()),
        type: 'polylinie',
        punkte: [...punkte],
        geschlossen: false,
        fuellung: null,
      }
      ctx.commands.execute(
        erzeugeObjektHinzufuegenCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          objekt,
          t('werkzeuge.polylinie.zeichnen'),
        ),
      )
    }
    punkte = []
    aktuell = null
    ctx.zurueckZuAuswahl()
  }

  return {
    id: 'polylinie',
    get bezeichnung() {
      return t('werkzeugnamen.polylinie')
    },
    kuerzel: 'PL',
    onActivate(ctx) {
      punkte = []
      aktuell = null
      ctx.setStatus(
        t('werkzeuge.polylinie.status', {
          taste: tastenHinweis(t('werkzeuge.tasten.oderEnter')),
        }),
      )
    },
    onDeactivate() {
      punkte = []
      aktuell = null
    },
    onPointerDown(info, ctx) {
      const vorheriger = punkte[punkte.length - 1] ?? info.world
      const punkt = wendeWinkelSnapAn(vorheriger, info.world, info.shiftKey && punkte.length > 0)
      punkte.push(punkt)
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
      return wirksam(punkte.length >= 2 && enter(t('werkzeuge.tasten.fertig')))
    },
    onKeyDown(e, ctx) {
      if (e.key === 'Enter') {
        e.preventDefault()
        abschliessen(ctx)
      }
    },
    drawOverlay(g, ctx) {
      if (punkte.length === 0) return
      const screenPunkte = punkte.map((p) => ctx.view.worldToScreen(p))
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.beginPath()
      g.moveTo(screenPunkte[0].x, screenPunkte[0].y)
      for (const p of screenPunkte.slice(1)) g.lineTo(p.x, p.y)
      if (aktuell) {
        const a = ctx.view.worldToScreen(aktuell)
        g.lineTo(a.x, a.y)
      }
      g.stroke()
      g.setLineDash([])
      for (const p of screenPunkte) {
        g.beginPath()
        g.arc(p.x, p.y, 3, 0, Math.PI * 2)
        g.fillStyle = '#2f7dd1'
        g.fill()
      }
      g.restore()
    },
  }
}
