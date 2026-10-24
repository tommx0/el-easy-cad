import type { Point } from '../../document-model'
import { nullpunktVon } from '../../document-model'
import { zeichneNullpunkt } from '../../rendering'
import { erzeugeBlattAendernCommand } from '../commands'
import { enter, tastenHinweis, wirksam } from '../kontext-aktionen'
import { wendeSnapAn } from '../snapping'
import type { PointerInfo, Tool, ToolContext } from '../tool'
import { t } from '../../sprache'

export function erzeugeNullpunktTool(): Tool {
  let punkt: Point | null = null
  let zeiger: Point | null = null

  function zuruecksetzen(ctx: ToolContext) {
    punkt = null
    zeiger = null
    ctx.setStatus(t('werkzeuge.nullpunkt.status'))
  }

  function setze(ctx: ToolContext, nullpunkt: Point, richtung: number | undefined) {
    ctx.commands.execute(
      erzeugeBlattAendernCommand(ctx.doc, ctx.aktivesBlattId(), t('werkzeuge.nullpunkt.setzen'), {
        nullpunkt,
        nullpunktRichtung: richtung,
      }),
    )
    punkt = null
    zeiger = null
    ctx.zurueckZuAuswahl()
  }

  return {
    id: 'nullpunkt',
    get bezeichnung() {
      return t('werkzeugnamen.nullpunkt')
    },
    kuerzel: 'O',
    onActivate(ctx) {
      zuruecksetzen(ctx)
    },
    onDeactivate() {
      punkt = null
      zeiger = null
    },
    onPointerDown(info, ctx) {
      if (info.button !== 0) return
      const p = ohneRasterfang(info, ctx)
      if (!punkt) {
        punkt = p
        zeiger = p
        ctx.setStatus(
          t('werkzeuge.nullpunkt.richtung', {
            taste: tastenHinweis(t('werkzeuge.nullpunkt.richtungTaste')),
          }),
        )
        ctx.requestOverlayRedraw()
        return
      }
      if (Math.hypot(p.x - punkt.x, p.y - punkt.y) < 1e-6) return
      setze(ctx, punkt, Math.atan2(p.y - punkt.y, p.x - punkt.x))
    },
    onPointerMove(info, ctx) {
      if (!punkt) return
      zeiger = ohneRasterfang(info, ctx)
      ctx.requestOverlayRedraw()
    },
    onKeyDown(e, ctx) {
      if (e.key === 'Enter' && punkt) setze(ctx, punkt, undefined)
    },
    tastenAktionen() {
      return wirksam(punkt && enter(t('werkzeuge.nullpunkt.ohneRichtung')))
    },
    konstruktionsStrecke() {
      return punkt && zeiger ? { von: punkt, bis: zeiger, davor: null, eingebbar: true } : null
    },
    drawOverlay(g, ctx) {
      if (!punkt || !zeiger) return
      const richtung =
        Math.hypot(zeiger.x - punkt.x, zeiger.y - punkt.y) > 1e-6
          ? Math.atan2(zeiger.y - punkt.y, zeiger.x - punkt.x)
          : undefined
      const a = ctx.view.worldToScreen(punkt)
      const b = ctx.view.worldToScreen(zeiger)
      g.save()
      g.strokeStyle = '#5b7dd9'
      g.lineWidth = 1.2
      g.setLineDash([6, 4])
      g.beginPath()
      g.moveTo(a.x, a.y)
      g.lineTo(b.x, b.y)
      g.stroke()
      g.restore()
      zeichneNullpunkt(g, ctx.view, punkt, richtung)
    },
  }
}

function ohneRasterfang(info: PointerInfo, ctx: ToolContext): Point {
  const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
  const raster = wendeSnapAn(
    info.raw,
    ctx.istSnapAktiv(),
    ctx.gridSchritt(),
    blatt ? nullpunktVon(blatt) : undefined,
  )
  const vomRaster = raster.x === info.world.x && raster.y === info.world.y
  return vomRaster ? info.raw : info.world
}
