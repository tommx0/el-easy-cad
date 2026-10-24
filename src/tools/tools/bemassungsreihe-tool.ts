import type { BemassungsreiheObjekt, Point } from '../../document-model'
import {
  berechneReihenVersatz,
  distance,
  neueObjektBasis,
  STANDARD_STAFFELABSTAND,
} from '../../document-model'
import { zeichneObjekt } from '../../rendering'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import { wendeWinkelSnapAn } from '../snapping'
import type { Tool, ToolContext } from '../tool'
import { enter, entf, tastenHinweis, wirksam } from '../kontext-aktionen'
import { t } from '../../sprache'

const VORSCHAU_VERSATZ_PX = 30

const DOPPELKLICK_TOLERANZ_PX = 5

export function erzeugeBemassungsreiheTool(art: BemassungsreiheObjekt['art']): Tool {
  let punkte: Point[] = []
  let aktuell: Point | null = null
  let versatzPhase = false

  const id = art === 'kette' ? 'kettenbemassung' : 'parallelbemassung'

  function reset() {
    punkte = []
    aktuell = null
    versatzPhase = false
  }

  function winkel(): number {
    return Math.atan2(punkte[1].y - punkte[0].y, punkte[1].x - punkte[0].x)
  }

  function objektMit(
    ctx: ToolContext,
    messpunkte: Point[],
    versatz: number,
  ): BemassungsreiheObjekt {
    return {
      ...neueObjektBasis(ctx.aktiveEbeneId()),
      type: 'bemassungsreihe',
      art,
      punkte: messpunkte,
      winkel: winkel(),
      versatz,
      gesamtmass: false,
      staffelabstand: STANDARD_STAFFELABSTAND,
    }
  }

  function statusPunkte(ctx: ToolContext) {
    if (punkte.length === 0) {
      ctx.setStatus(t('werkzeuge.bemassungsreihe.ersterPunkt'))
    } else if (punkte.length === 1) {
      ctx.setStatus(t('werkzeuge.bemassungsreihe.zweiterPunkt'))
    } else {
      ctx.setStatus(
        t('werkzeuge.bemassungsreihe.weitere', {
          tasteEnter: tastenHinweis(t('werkzeuge.tasten.oderEnter')),
          tasteEntf: tastenHinweis(t('werkzeuge.tasten.oderEntf')),
        }),
      )
    }
  }

  function punkteAbschliessen(ctx: ToolContext) {
    if (punkte.length < 2) return
    versatzPhase = true
    ctx.setStatus(t('werkzeuge.bemassungsreihe.abstand'))
    ctx.requestOverlayRedraw()
  }

  function letztenPunktEntfernen(ctx: ToolContext) {
    if (versatzPhase) versatzPhase = false
    else punkte.pop()
    statusPunkte(ctx)
    ctx.requestOverlayRedraw()
  }

  return {
    id,
    get bezeichnung() {
      return t(`werkzeugnamen.${id}`)
    },
    onActivate(ctx) {
      reset()
      statusPunkte(ctx)
    },
    onDeactivate() {
      reset()
    },
    onPointerDown(info, ctx) {
      if (versatzPhase) {
        const versatz = berechneReihenVersatz(punkte[0], winkel(), info.world)
        ctx.commands.execute(
          erzeugeObjektHinzufuegenCommand(
            ctx.doc,
            ctx.aktivesBlattId(),
            objektMit(ctx, [...punkte], versatz),
            t(
              art === 'kette'
                ? 'werkzeuge.bemassungsreihe.ketteEinfuegen'
                : 'werkzeuge.bemassungsreihe.parallelEinfuegen',
            ),
          ),
        )
        reset()
        ctx.zurueckZuAuswahl()
        return
      }
      if (punkte.length === 1) {
        const zweiter = wendeWinkelSnapAn(punkte[0], info.world, info.shiftKey)
        if (distance(zweiter, punkte[0]) < 1e-9) return
        punkte.push(zweiter)
      } else {
        punkte.push(info.world)
      }
      statusPunkte(ctx)
      ctx.requestOverlayRedraw()
    },
    onPointerMove(info, ctx) {
      if (punkte.length === 0) return
      aktuell =
        punkte.length === 1 && !versatzPhase
          ? wendeWinkelSnapAn(punkte[0], info.world, info.shiftKey)
          : info.world
      ctx.requestOverlayRedraw()
    },
    onDoubleClick(_info, ctx) {
      if (versatzPhase) return
      const n = punkte.length
      if (
        n >= 3 &&
        distance(punkte[n - 1], punkte[n - 2]) <= ctx.view.laengeToWorld(DOPPELKLICK_TOLERANZ_PX)
      ) {
        punkte.pop()
      }
      punkteAbschliessen(ctx)
    },
    onRightClick(_info, ctx) {
      if (punkte.length === 0) return false
      letztenPunktEntfernen(ctx)
      return true
    },
    tastenAktionen() {
      return wirksam(
        !versatzPhase && punkte.length >= 2 && enter(t('werkzeuge.tasten.fertig')),
        punkte.length > 0 && entf(t('werkzeuge.tasten.punktZurueck')),
      )
    },
    onKeyDown(e, ctx) {
      if (e.key === 'Enter') {
        e.preventDefault()
        punkteAbschliessen(ctx)
        return
      }
      if ((e.key === 'Backspace' || e.key === 'Delete') && punkte.length > 0) {
        e.preventDefault()
        letztenPunktEntfernen(ctx)
      }
    },
    konstruktionsStrecke() {
      if (versatzPhase || punkte.length === 0 || !aktuell) return null
      return {
        von: punkte[punkte.length - 1],
        bis: aktuell,
        davor: punkte[punkte.length - 2] ?? null,
        eingebbar: true,
      }
    },
    drawOverlay(g, ctx) {
      if (punkte.length === 0) return
      if (punkte.length === 1) {
        if (!aktuell) return
        const a = ctx.view.worldToScreen(punkte[0])
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
      const vorschau = versatzPhase
        ? objektMit(ctx, punkte, aktuell ? berechneReihenVersatz(punkte[0], winkel(), aktuell) : 0)
        : objektMit(
            ctx,
            aktuell ? [...punkte, aktuell] : punkte,
            ctx.view.laengeToWorld(VORSCHAU_VERSATZ_PX),
          )
      g.save()
      zeichneObjekt(g, ctx.view, vorschau)
      g.fillStyle = '#2f7dd1'
      for (const p of punkte) {
        const s = ctx.view.worldToScreen(p)
        g.beginPath()
        g.arc(s.x, s.y, 3, 0, Math.PI * 2)
        g.fill()
      }
      g.restore()
    },
  }
}
