import type { Point } from '../../document-model'
import type { Tool, ToolContext } from '../tool'
import { plusMinus, tastenHinweis, wirksam } from '../kontext-aktionen'
import { legeWandzugAn, STAERKE_SCHRITT } from './wand-tool'
import { t } from '../../sprache'

export function rechteckWandAchse(a: Point, b: Point, staerke: number): Point[] | null {
  const minX = Math.min(a.x, b.x)
  const maxX = Math.max(a.x, b.x)
  const minY = Math.min(a.y, b.y)
  const maxY = Math.max(a.y, b.y)
  if (maxX - minX <= 2 * staerke || maxY - minY <= 2 * staerke) return null
  const h = staerke / 2
  const start = { x: minX + h, y: minY + h }
  return [
    start,
    { x: maxX - h, y: minY + h },
    { x: maxX - h, y: maxY - h },
    { x: minX + h, y: maxY - h },
    { ...start },
  ]
}

export function erzeugeWandRechteckTool(): Tool {
  let ecke1: Point | null = null
  let ecke2: Point | null = null

  function status(ctx: ToolContext, meldung?: string) {
    const staerke = t('werkzeuge.wand.staerke', {
      cm: Math.round(ctx.wandStaerke() * 100),
      taste: tastenHinweis(t('werkzeuge.wand.staerkeTaste')),
    })
    const schritt = t(
      ecke1 ? 'werkzeuge.wandRechteck.gegenecke' : 'werkzeuge.wandRechteck.ersteEcke',
      {
        staerke,
      },
    )
    ctx.setStatus(meldung ? `${meldung} ${schritt}` : schritt)
  }

  function reset() {
    ecke1 = null
    ecke2 = null
  }

  return {
    id: 'wandrechteck',
    get bezeichnung() {
      return t('werkzeugnamen.wandrechteck')
    },
    kuerzel: 'ALT+R',
    zusaetzlicheFangarten: ['naechster'],
    onActivate(ctx) {
      reset()
      status(ctx)
    },
    onDeactivate() {
      reset()
    },
    onPointerDown(info, ctx) {
      if (!ecke1) {
        ecke1 = info.world
        ecke2 = info.world
        status(ctx)
        ctx.requestOverlayRedraw()
        return
      }
      const achse = rechteckWandAchse(ecke1, info.world, ctx.wandStaerke())
      if (!achse) {
        status(ctx, t('werkzeuge.wandRechteck.zuKlein'))
        return
      }
      legeWandzugAn(ctx, achse, t('werkzeuge.wandRechteck.zeichnen'))
      reset()
      status(ctx)
      ctx.requestOverlayRedraw()
    },
    onPointerMove(info, ctx) {
      if (!ecke1) return
      ecke2 = info.world
      ctx.requestOverlayRedraw()
    },
    tastenAktionen(ctx) {
      return wirksam(
        plusMinus(
          t('werkzeuge.wand.staerkeGruppe'),
          `${(ctx.wandStaerke() * 100).toFixed(0)} cm`,
          t('werkzeuge.wand.duenner'),
          t('werkzeuge.wand.dicker'),
        ),
      )
    },
    onKeyDown(e, ctx) {
      if (e.key === '+' || e.key === '=') {
        ctx.setWandStaerke(ctx.wandStaerke() + STAERKE_SCHRITT)
      } else if (e.key === '-') {
        ctx.setWandStaerke(ctx.wandStaerke() - STAERKE_SCHRITT)
      } else {
        return
      }
      status(ctx)
      ctx.requestOverlayRedraw()
    },
    drawOverlay(g, ctx) {
      if (!ecke1 || !ecke2) return
      const a = ctx.view.worldToScreen(ecke1)
      const b = ctx.view.worldToScreen(ecke2)
      g.save()
      g.strokeStyle = '#2f7dd1'
      g.lineWidth = 1.5
      g.setLineDash([5, 4])
      g.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y))
      const achse = rechteckWandAchse(ecke1, ecke2, ctx.wandStaerke())
      if (achse) {
        const punkte = achse.map((p) => ctx.view.worldToScreen(p))
        g.setLineDash([])
        g.globalAlpha = 0.35
        g.lineWidth = Math.max(1, ctx.view.laengeToScreen(ctx.wandStaerke()))
        g.lineJoin = 'miter'
        g.beginPath()
        g.moveTo(punkte[0].x, punkte[0].y)
        for (const p of punkte.slice(1, -1)) g.lineTo(p.x, p.y)
        g.closePath()
        g.stroke()
      }
      g.restore()
    },
  }
}
