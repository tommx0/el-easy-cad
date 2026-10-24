import type { Point, WandObjekt } from '../../document-model'
import { hitTestObjekte } from '../hit-test'
import { erzeugeWandTeilenCommand } from '../commands'
import { berechneWandTeilungErgebnis } from '../teile-wand'
import type { Tool, ToolContext } from '../tool'
import { t } from '../../sprache'

const TOLERANZ_PX = 6

export function erzeugeWandTeilenTool(): Tool {
  let ersterPunkt: Point | null = null
  let wandId: string | null = null

  function reset() {
    ersterPunkt = null
    wandId = null
  }

  return {
    id: 'wandteilen',
    get bezeichnung() {
      return t('werkzeugnamen.wandteilen')
    },
    kuerzel: 'WT',
    bleibtAktiv: true,
    onActivate(ctx) {
      reset()
      ctx.setStatus(t('werkzeuge.wandTeilen.ersterPunkt'))
    },
    onDeactivate() {
      reset()
    },
    onPointerDown(info, ctx) {
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt) return
      const toleranz = ctx.view.laengeToWorld(TOLERANZ_PX)

      const waende = blatt.objekte.filter((o): o is WandObjekt => o.type === 'wand')
      const treffer = hitTestObjekte(waende, info.raw, toleranz) as WandObjekt | null
      if (!treffer) {
        ctx.setStatus(t('werkzeuge.wandTeilen.keineWand'))
        return
      }

      if (!ersterPunkt || wandId !== treffer.id) {
        ersterPunkt = info.raw
        wandId = treffer.id
        ctx.setStatus(t('werkzeuge.wandTeilen.zweiterPunkt'))
        ctx.requestOverlayRedraw()
        return
      }

      const ergebnis = berechneWandTeilungErgebnis(treffer, ersterPunkt, info.raw)
      reset()
      if (!ergebnis) {
        ctx.setStatus(t('werkzeuge.wandTeilen.ungueltig'))
        ctx.requestOverlayRedraw()
        return
      }

      const command = erzeugeWandTeilenCommand(
        ctx.doc,
        ctx.aktivesBlattId(),
        treffer,
        ergebnis,
        t('werkzeuge.wandTeilen.teilen'),
      )
      ctx.commands.execute(command)
      ctx.setStatus(t('werkzeuge.wandTeilen.ersterPunkt'))
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g: CanvasRenderingContext2D, ctx: ToolContext) {
      if (!ersterPunkt) return
      const p = ctx.view.worldToScreen(ersterPunkt)
      g.save()
      g.fillStyle = '#e0782f'
      g.beginPath()
      g.arc(p.x, p.y, 4, 0, Math.PI * 2)
      g.fill()
      g.restore()
    },
  }
}
