import type { LinienObjekt, WandObjekt } from '../../document-model'
import { hitTestObjekte } from '../hit-test'
import { erzeugeObjektAendernCommand, erzeugeWandTrimCommand } from '../commands'
import {
  alsSchneidkante,
  schnittpunkteMitKante,
  waehleTrimEntscheidung,
  type Schneidkante,
} from '../trim-geometry'
import { berechneWandTrimErgebnis } from '../trim-wand'
import type { Tool, ToolContext } from '../tool'
import { t } from '../../sprache'

const TOLERANZ_PX = 6

export function erzeugeTrimTool(): Tool {
  let kante: Schneidkante | null = null

  function reset() {
    kante = null
  }

  return {
    id: 'trimmen',
    get bezeichnung() {
      return t('werkzeugnamen.trimmen')
    },
    kuerzel: 'TR',
    bleibtAktiv: true,
    onActivate(ctx) {
      reset()
      ctx.setStatus(t('werkzeuge.trimmen.kante'))
    },
    onDeactivate() {
      reset()
    },
    onPointerDown(info, ctx) {
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt) return
      const toleranz = ctx.view.laengeToWorld(TOLERANZ_PX)

      if (!kante) {
        const treffer = hitTestObjekte(blatt.objekte, info.raw, toleranz)
        if (!treffer) return
        const kandidat = alsSchneidkante(treffer)
        if (!kandidat) {
          ctx.setStatus(t('werkzeuge.trimmen.keineKante'))
          return
        }
        kante = kandidat
        ctx.setStatus(t('werkzeuge.trimmen.ziel'))
        return
      }

      const ziel = hitTestObjekte(
        blatt.objekte.filter(
          (o): o is LinienObjekt | WandObjekt => o.type === 'linie' || o.type === 'wand',
        ),
        info.raw,
        toleranz,
      ) as LinienObjekt | WandObjekt | null
      if (!ziel) {
        ctx.setStatus(t('werkzeuge.trimmen.keinZiel'))
        return
      }

      if (ziel.type === 'wand') {
        const ergebnis = berechneWandTrimErgebnis(ziel, info.raw, kante)
        if (!ergebnis) {
          ctx.setStatus(t('werkzeuge.trimmen.keinSchnitt'))
          return
        }
        const command = erzeugeWandTrimCommand(
          ctx.doc,
          ctx.aktivesBlattId(),
          ziel,
          ergebnis,
          t('werkzeuge.trimmen.wand'),
        )
        ctx.commands.execute(command)
        ctx.requestOverlayRedraw()
        return
      }

      const ergebnis = berechneTrimErgebnis(ziel, info.raw, kante)
      if (!ergebnis) {
        ctx.setStatus(t('werkzeuge.trimmen.keinSchnitt'))
        return
      }

      const command = erzeugeObjektAendernCommand(
        ctx.doc,
        ctx.aktivesBlattId(),
        t('werkzeuge.trimmen.linie'),
        (objekte) => objekte.map((o) => (o.id === ziel.id ? { ...ziel, ...ergebnis } : o)),
      )
      ctx.commands.execute(command)
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g: CanvasRenderingContext2D, ctx: ToolContext) {
      if (!kante) return
      if (kante.typ === 'kreis') {
        const m = ctx.view.worldToScreen(kante.mittelpunkt)
        const r = ctx.view.laengeToScreen(kante.radius)
        g.save()
        g.strokeStyle = '#e0782f'
        g.lineWidth = 2
        g.beginPath()
        g.arc(m.x, m.y, r, 0, Math.PI * 2)
        g.stroke()
        g.restore()
        return
      }
      if (kante.typ === 'bogen') {
        const m = ctx.view.worldToScreen(kante.mittelpunkt)
        const r = ctx.view.laengeToScreen(kante.radius)
        g.save()
        g.strokeStyle = '#e0782f'
        g.lineWidth = 2
        g.beginPath()
        g.arc(m.x, m.y, r, -kante.endWinkel, -kante.startWinkel)
        g.stroke()
        g.restore()
        return
      }
      g.save()
      g.strokeStyle = '#e0782f'
      g.lineWidth = 2
      for (const [a, b] of kante.segmente) {
        const sa = ctx.view.worldToScreen(a)
        const sb = ctx.view.worldToScreen(b)
        g.beginPath()
        g.moveTo(sa.x, sa.y)
        g.lineTo(sb.x, sb.y)
        g.stroke()
      }
      g.restore()
    },
  }
}

function berechneTrimErgebnis(
  ziel: LinienObjekt,
  klickpunkt: { x: number; y: number },
  kante: Schneidkante,
): { start: LinienObjekt['start']; ende: LinienObjekt['ende'] } | null {
  const a = ziel.start
  const b = ziel.ende
  const laenge2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  if (laenge2 === 0) return null
  const tKlick = ((klickpunkt.x - a.x) * (b.x - a.x) + (klickpunkt.y - a.y) * (b.y - a.y)) / laenge2

  const entscheidung = waehleTrimEntscheidung(tKlick, schnittpunkteMitKante(a, b, kante))
  if (!entscheidung) return null
  return entscheidung.seite === 'start'
    ? { start: entscheidung.punkt, ende: b }
    : { start: a, ende: entscheidung.punkt }
}
