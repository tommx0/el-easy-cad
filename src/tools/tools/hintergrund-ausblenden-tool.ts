import type { HintergrundAusblendung, Point } from '../../document-model'
import {
  erzeugeId,
  istBekannterHintergrund,
  istHintergrundGesperrt,
  rohZuWelt,
  weltZuRoh,
} from '../../document-model'
import { erzeugeBlattAendernCommand } from '../commands'
import type { Tool } from '../tool'
import { t } from '../../sprache'

export function erzeugeHintergrundAusblendenTool(): Tool {
  let eckeA: Point | null = null
  let eckeB: Point | null = null

  return {
    id: 'hintergrund-ausblenden',
    get bezeichnung() {
      return t('werkzeugnamen.hintergrund-ausblenden')
    },
    onActivate(ctx) {
      eckeA = null
      eckeB = null
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt?.hintergrund) {
        ctx.setStatus(t('werkzeuge.hintergrund.keiner'))
        return
      }
      if (istHintergrundGesperrt(blatt.ebenen)) {
        ctx.setStatus(t('werkzeuge.hintergrund.gesperrt'))
        return
      }
      ctx.setStatus(t('werkzeuge.ausblenden.ersteEcke'))
    },
    onDeactivate() {
      eckeA = null
      eckeB = null
    },
    onPointerDown(info, ctx) {
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt || istHintergrundGesperrt(blatt.ebenen)) return
      const hintergrund = blatt.hintergrund
      if (!istBekannterHintergrund(hintergrund)) return

      if (!eckeA) {
        const roh = weltZuRoh(blatt, info.world)
        const getroffene = hintergrund.ausblendungen.find((ausblendung) =>
          punktInRechteck(roh, ausblendung.eckeA, ausblendung.eckeB),
        )
        if (getroffene) {
          ctx.commands.execute(
            erzeugeBlattAendernCommand(ctx.doc, blatt.id, t('werkzeuge.ausblenden.entfernen'), {
              hintergrund: {
                ...hintergrund,
                ausblendungen: hintergrund.ausblendungen.filter((a) => a.id !== getroffene.id),
              },
            }),
          )
          ctx.setStatus(t('werkzeuge.ausblenden.entfernt'))
          ctx.zurueckZuAuswahl()
          return
        }
        eckeA = info.world
        ctx.setStatus(t('werkzeuge.rechteck.gegenecke'))
        return
      }

      const eckeAWelt = eckeA
      const eckeBWelt = info.world
      if (eckeAWelt.x !== eckeBWelt.x && eckeAWelt.y !== eckeBWelt.y) {
        const rohEcken = [
          eckeAWelt,
          { x: eckeBWelt.x, y: eckeAWelt.y },
          eckeBWelt,
          { x: eckeAWelt.x, y: eckeBWelt.y },
        ].map((p) => weltZuRoh(blatt, p))
        const neu: HintergrundAusblendung = {
          id: erzeugeId('ausblendung'),
          eckeA: {
            x: Math.min(...rohEcken.map((p) => p.x)),
            y: Math.min(...rohEcken.map((p) => p.y)),
          },
          eckeB: {
            x: Math.max(...rohEcken.map((p) => p.x)),
            y: Math.max(...rohEcken.map((p) => p.y)),
          },
        }
        ctx.commands.execute(
          erzeugeBlattAendernCommand(ctx.doc, blatt.id, t('werkzeuge.ausblenden.ausblenden'), {
            hintergrund: { ...hintergrund, ausblendungen: [...hintergrund.ausblendungen, neu] },
          }),
        )
      }
      eckeA = null
      eckeB = null
      ctx.zurueckZuAuswahl()
    },
    onPointerMove(info, ctx) {
      if (!eckeA) return
      eckeB = info.world
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g, ctx) {
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt?.hintergrund) return
      g.save()
      g.strokeStyle = '#e0782f'
      g.lineWidth = 1.5
      g.setLineDash([4, 3])
      for (const { eckeA: a, eckeB: b } of blatt.hintergrund.ausblendungen ?? []) {
        const ecken = [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }].map((p) =>
          ctx.view.worldToScreen(rohZuWelt(blatt, p)),
        )
        g.beginPath()
        g.moveTo(ecken[0].x, ecken[0].y)
        for (const p of ecken.slice(1)) g.lineTo(p.x, p.y)
        g.closePath()
        g.stroke()
      }
      if (eckeA && eckeB) {
        g.strokeStyle = '#2f7dd1'
        g.setLineDash([5, 4])
        zeichneRechteck(g, ctx.view.worldToScreen(eckeA), ctx.view.worldToScreen(eckeB))
      }
      g.restore()
    },
  }
}

function punktInRechteck(p: Point, a: Point, b: Point): boolean {
  return (
    p.x >= Math.min(a.x, b.x) &&
    p.x <= Math.max(a.x, b.x) &&
    p.y >= Math.min(a.y, b.y) &&
    p.y <= Math.max(a.y, b.y)
  )
}

function zeichneRechteck(g: CanvasRenderingContext2D, a: Point, b: Point) {
  g.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
}
