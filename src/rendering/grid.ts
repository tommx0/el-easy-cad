import type { Point } from '../document-model'
import type { ViewTransform } from './view-transform'

export const STANDARD_GRID_BASIS_SCHRITT = 1 // Meter
export const MIN_PIXEL_ABSTAND = 35

export interface GridSchritte {
  neben: number
  haupt: number
}

export function berechneGridSchritte(
  scale: number,
  basisSchritt = STANDARD_GRID_BASIS_SCHRITT,
): GridSchritte {
  const zielWelt = MIN_PIXEL_ABSTAND / scale
  let dekade = Math.pow(10, Math.floor(Math.log10(Math.max(zielWelt, 1e-6))))
  if (basisSchritt !== 1) dekade *= basisSchritt
  const kandidaten = [dekade, dekade * 2, dekade * 5]
  let neben = dekade * 10
  for (const kandidat of kandidaten) {
    if (kandidat * scale >= MIN_PIXEL_ABSTAND) {
      neben = kandidat
      break
    }
  }
  const haupt = dekade * 10
  return { neben, haupt: haupt > neben ? haupt : neben * 5 }
}

const MIN_PIXEL_ABSTAND_FEST = 6

export function ermittleGridSchritte(
  scale: number,
  basisSchritt: number,
  festerSchritt: number | null,
): GridSchritte {
  if (festerSchritt === null) return berechneGridSchritte(scale, basisSchritt)
  return { neben: festerSchritt, haupt: festerSchritt * 5 }
}

const URSPRUNG: Point = { x: 0, y: 0 }

export function snapAufGrid(punkt: Point, schritt: number, bezug: Point = URSPRUNG): Point {
  return {
    x: bezug.x + Math.round((punkt.x - bezug.x) / schritt) * schritt,
    y: bezug.y + Math.round((punkt.y - bezug.y) / schritt) * schritt,
  }
}

const OVERLAY_ALPHA = 0.45

const RASTER_FARBEN = { neben: '#e6e6e6', haupt: '#c9c9c9', achse: '#a9b8c9' }

export const PAPIER_FARBE = '#ffffff'

export function zeichneGrid(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  breite: number,
  hoehe: number,
  basisSchritt = STANDARD_GRID_BASIS_SCHRITT,
  overlay = false,
  bezug: Point = URSPRUNG,
  festerSchritt: number | null = null,
) {
  const farben = RASTER_FARBEN
  ctx.save()
  if (overlay) {
    ctx.globalAlpha = OVERLAY_ALPHA
  } else {
    ctx.fillStyle = PAPIER_FARBE
    ctx.fillRect(0, 0, breite, hoehe)
  }

  const { neben, haupt } = ermittleGridSchritte(view.scale, basisSchritt, festerSchritt)
  const eckeA = view.screenToWorld({ x: 0, y: 0 })
  const eckeB = view.screenToWorld({ x: breite, y: hoehe })
  const weltMin = { x: Math.min(eckeA.x, eckeB.x), y: Math.min(eckeA.y, eckeB.y) }
  const weltMax = { x: Math.max(eckeA.x, eckeB.x), y: Math.max(eckeA.y, eckeB.y) }

  const zeichneLinien = (schritt: number, farbe: string, linienBreite: number) => {
    ctx.strokeStyle = farbe
    ctx.lineWidth = linienBreite
    ctx.beginPath()
    const startX = bezug.x + Math.floor((weltMin.x - bezug.x) / schritt) * schritt
    for (let x = startX; x <= weltMax.x; x += schritt) {
      const sx = Math.round(view.worldToScreen({ x, y: 0 }).x) + 0.5
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, hoehe)
    }
    const startY = bezug.y + Math.floor((weltMin.y - bezug.y) / schritt) * schritt
    for (let y = startY; y <= weltMax.y; y += schritt) {
      const sy = Math.round(view.worldToScreen({ x: 0, y }).y) + 0.5
      ctx.moveTo(0, sy)
      ctx.lineTo(breite, sy)
    }
    ctx.stroke()
  }

  const nebenSichtbar = festerSchritt === null || neben * view.scale >= MIN_PIXEL_ABSTAND_FEST
  if (nebenSichtbar) zeichneLinien(neben, farben.neben, 1)
  if (haupt !== neben && haupt * view.scale >= MIN_PIXEL_ABSTAND_FEST) {
    zeichneLinien(haupt, farben.haupt, 1)
  }

  const ursprungScreen = view.worldToScreen(bezug)
  ctx.strokeStyle = farben.achse
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(Math.round(ursprungScreen.x) + 0.5, 0)
  ctx.lineTo(Math.round(ursprungScreen.x) + 0.5, hoehe)
  ctx.moveTo(0, Math.round(ursprungScreen.y) + 0.5)
  ctx.lineTo(breite, Math.round(ursprungScreen.y) + 0.5)
  ctx.stroke()

  ctx.restore()
}
