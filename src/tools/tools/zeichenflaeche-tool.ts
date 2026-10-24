import type { Point } from '../../document-model'
import { istSchaltplan, planUebersetzer } from '../../document-model'
import { zeichneZeichenflaecheRahmen } from '../../rendering'
import { erzeugeBlattAendernCommand } from '../commands'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugeZeichenflaecheTool(): Tool {
  let ziehStart: Point | null = null
  let ursprungBeiStart: Point | null = null
  let aktuellerUrsprung: Point | null = null

  return {
    id: 'zeichenflaeche-verschieben',
    get bezeichnung() {
      return t('werkzeugnamen.zeichenflaeche-verschieben')
    },
    onActivate(ctx) {
      ziehStart = null
      ursprungBeiStart = null
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt?.zeichenflaeche) {
        ctx.setStatus(t('werkzeuge.zeichenflaeche.keine'))
        aktuellerUrsprung = null
        return
      }
      if (istSchaltplan(ctx.doc.getZeichnung())) {
        ctx.setStatus(t('werkzeuge.zeichenflaeche.schaltplan'))
        aktuellerUrsprung = null
        return
      }
      aktuellerUrsprung = blatt.zeichenflaeche.ursprung
      ctx.setStatus(t('werkzeuge.zeichenflaeche.ziehen'))
      ctx.requestOverlayRedraw()
    },
    onDeactivate() {
      ziehStart = null
      ursprungBeiStart = null
      aktuellerUrsprung = null
    },
    onPointerDown(info, ctx) {
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt?.zeichenflaeche || istSchaltplan(ctx.doc.getZeichnung())) return
      ziehStart = info.raw
      ursprungBeiStart = blatt.zeichenflaeche.ursprung
      aktuellerUrsprung = ursprungBeiStart
    },
    onPointerMove(info, ctx) {
      if (!ziehStart || !ursprungBeiStart) return
      const dx = info.raw.x - ziehStart.x
      const dy = info.raw.y - ziehStart.y
      aktuellerUrsprung = { x: ursprungBeiStart.x + dx, y: ursprungBeiStart.y + dy }
      ctx.requestOverlayRedraw()
    },
    onPointerUp(_info, ctx) {
      if (!ziehStart || !ursprungBeiStart || !aktuellerUrsprung) {
        ziehStart = null
        ursprungBeiStart = null
        return
      }
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      ziehStart = null
      ursprungBeiStart = null
      if (!blatt?.zeichenflaeche) return
      const neu = aktuellerUrsprung
      if (neu.x !== blatt.zeichenflaeche.ursprung.x || neu.y !== blatt.zeichenflaeche.ursprung.y) {
        const command = erzeugeBlattAendernCommand(
          ctx.doc,
          blatt.id,
          t('werkzeuge.zeichenflaeche.verschieben'),
          {
            zeichenflaeche: { ...blatt.zeichenflaeche, ursprung: neu },
          },
        )
        ctx.commands.execute(command)
      }
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g, ctx) {
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt?.zeichenflaeche) return
      const basis = aktuellerUrsprung ?? blatt.zeichenflaeche.ursprung
      const vorschau = { ...blatt.zeichenflaeche, ursprung: basis }
      zeichneZeichenflaecheRahmen(g, ctx.view, vorschau, planUebersetzer(ctx.doc.getZeichnung()))
    },
  }
}
