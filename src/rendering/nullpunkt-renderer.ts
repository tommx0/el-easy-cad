import type { Point } from '../document-model'
import type { ViewTransform } from './view-transform'

const RADIUS_PX = 9
const ACHSE_UEBERSTAND_PX = 6

const FARBE = '#5b7dd9'
const PFEIL_PX = 34
const PFEILSPITZE_PX = 7

export function zeichneNullpunkt(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  nullpunkt: Point,
  richtung?: number,
) {
  const p = view.worldToScreen(nullpunkt)
  const r = RADIUS_PX
  const achse = r + ACHSE_UEBERSTAND_PX

  ctx.save()
  ctx.strokeStyle = FARBE
  ctx.fillStyle = FARBE
  ctx.lineWidth = 1.2

  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
  ctx.arc(p.x, p.y, r, -Math.PI / 2, 0)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(p.x, p.y)
  ctx.arc(p.x, p.y, r, Math.PI / 2, Math.PI)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(p.x - achse, p.y)
  ctx.lineTo(p.x + achse, p.y)
  ctx.moveTo(p.x, p.y - achse)
  ctx.lineTo(p.x, p.y + achse)
  ctx.stroke()

  if (richtung !== undefined) {
    const dx = Math.cos(richtung)
    const dy = -Math.sin(richtung)
    const spitze = { x: p.x + dx * PFEIL_PX, y: p.y + dy * PFEIL_PX }
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(p.x + dx * r, p.y + dy * r)
    ctx.lineTo(spitze.x, spitze.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(spitze.x, spitze.y)
    ctx.lineTo(
      spitze.x - dx * PFEILSPITZE_PX - dy * PFEILSPITZE_PX * 0.6,
      spitze.y - dy * PFEILSPITZE_PX + dx * PFEILSPITZE_PX * 0.6,
    )
    ctx.lineTo(
      spitze.x - dx * PFEILSPITZE_PX + dy * PFEILSPITZE_PX * 0.6,
      spitze.y - dy * PFEILSPITZE_PX - dx * PFEILSPITZE_PX * 0.6,
    )
    ctx.closePath()
    ctx.fill()
  }

  ctx.font = '11px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('0,0', p.x + achse + 3, p.y + 3)

  ctx.restore()
}
