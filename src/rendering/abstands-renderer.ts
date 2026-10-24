import type { Point } from '../document-model'
import type { ViewTransform } from './view-transform'

const FARBE = '#2f6fed'

export function zeichneAbstandslinie(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  vonPunkt: Point,
  zuPunkt: Point,
  entfernungMeter: number,
) {
  const a = view.worldToScreen(vonPunkt)
  const b = view.worldToScreen(zuPunkt)
  ctx.save()
  ctx.strokeStyle = FARBE
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()

  const text = `${entfernungMeter.toFixed(2)} m`
  const mitte = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  ctx.setLineDash([])
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const breite = ctx.measureText(text).width
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.fillRect(mitte.x - breite / 2 - 2, mitte.y - 7, breite + 4, 14)
  ctx.fillStyle = FARBE
  ctx.fillText(text, mitte.x, mitte.y)
  ctx.restore()
}
