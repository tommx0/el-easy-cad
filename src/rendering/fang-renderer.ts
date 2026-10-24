import type { Point } from '../document-model'
import { add } from '../document-model'
import type { ViewTransform } from './view-transform'

export type FangmarkenArt =
  'endpunkt' | 'mitte' | 'zentrum' | 'quadrant' | 'dock' | 'schnitt' | 'naechster'

export const OBJEKTFANG_TOLERANZ_PX = 10

const FARBE = '#1f9e52'
const MARKE_HALB_PX = 4.5

export function zeichneFangmarke(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  punkt: Point,
  art: FangmarkenArt,
) {
  const p = view.worldToScreen(punkt)
  const r = MARKE_HALB_PX
  ctx.save()
  ctx.strokeStyle = FARBE
  ctx.fillStyle = FARBE
  ctx.lineWidth = 1.5
  switch (art) {
    case 'endpunkt':
      ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2)
      break
    case 'mitte':
      ctx.beginPath()
      ctx.moveTo(p.x, p.y - r)
      ctx.lineTo(p.x + r, p.y + r)
      ctx.lineTo(p.x - r, p.y + r)
      ctx.closePath()
      ctx.stroke()
      break
    case 'zentrum':
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.stroke()
      break
    case 'quadrant':
      ctx.beginPath()
      ctx.moveTo(p.x, p.y - r)
      ctx.lineTo(p.x + r, p.y)
      ctx.lineTo(p.x, p.y + r)
      ctx.lineTo(p.x - r, p.y)
      ctx.closePath()
      ctx.stroke()
      break
    case 'dock':
      ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'schnitt':
      ctx.beginPath()
      ctx.moveTo(p.x - r, p.y - r)
      ctx.lineTo(p.x + r, p.y + r)
      ctx.moveTo(p.x + r, p.y - r)
      ctx.lineTo(p.x - r, p.y + r)
      ctx.stroke()
      break
    case 'naechster':
      ctx.beginPath()
      ctx.moveTo(p.x - r, p.y - r)
      ctx.lineTo(p.x + r, p.y - r)
      ctx.lineTo(p.x, p.y)
      ctx.closePath()
      ctx.moveTo(p.x - r, p.y + r)
      ctx.lineTo(p.x + r, p.y + r)
      ctx.lineTo(p.x, p.y)
      ctx.closePath()
      ctx.stroke()
      break
  }
  ctx.restore()
}

export function zeichneGemerkterPunktMarke(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  punkt: Point,
) {
  const p = view.worldToScreen(punkt)
  const y = p.y - MARKE_HALB_PX - 5
  ctx.save()
  ctx.strokeStyle = FARBE
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(p.x - 3, y)
  ctx.lineTo(p.x + 3, y)
  ctx.moveTo(p.x, y - 3)
  ctx.lineTo(p.x, y + 3)
  ctx.stroke()
  ctx.restore()
}

export function zeichneSpurlinie(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  punkt: Point,
  richtung: Point,
  canvasBreite: number,
  canvasHoehe: number,
) {
  const p1 = view.worldToScreen(punkt)
  const p2 = view.worldToScreen(add(punkt, richtung))
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const laenge = Math.hypot(dx, dy)
  if (laenge === 0) return
  const ux = dx / laenge
  const uy = dy / laenge
  const reichweite = (canvasBreite + canvasHoehe) * 2
  ctx.save()
  ctx.strokeStyle = FARBE
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(p1.x - ux * reichweite, p1.y - uy * reichweite)
  ctx.lineTo(p1.x + ux * reichweite, p1.y + uy * reichweite)
  ctx.stroke()
  ctx.restore()
}
