const MAX_RASTER_KANTE = 2048
const MIN_RASTER_KANTE = 16
const CACHE_BUDGET_PIXEL = 24_000_000

export type RasterErzeuger = (breite: number, hoehe: number) => HTMLCanvasElement | null

const standardErzeuger: RasterErzeuger = (breite, hoehe) => {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = breite
  canvas.height = hoehe
  return canvas
}

let erzeuger: RasterErzeuger = standardErzeuger
const cache = new Map<string, HTMLCanvasElement>()
let belegtePixel = 0

export function rasterKante(px: number): number {
  const gewuenscht = Math.max(MIN_RASTER_KANTE, Math.ceil(px))
  return Math.min(MAX_RASTER_KANTE, 2 ** Math.ceil(Math.log2(gewuenscht)))
}

export function holeEingefaerbtesSymbol(
  image: CanvasImageSource,
  schluessel: string,
  farbe: string,
  zielBreitePx: number,
  zielHoehePx: number,
): HTMLCanvasElement | null {
  const breite = rasterKante(zielBreitePx)
  const hoehe = rasterKante(zielHoehePx)
  const cacheSchluessel = `${schluessel}|${farbe}|${breite}x${hoehe}`
  const vorhanden = cache.get(cacheSchluessel)
  if (vorhanden) {
    cache.delete(cacheSchluessel)
    cache.set(cacheSchluessel, vorhanden)
    return vorhanden
  }

  const canvas = erzeuger(breite, hoehe)
  const c = canvas?.getContext('2d')
  if (!canvas || !c) return null
  c.drawImage(image, 0, 0, breite, hoehe)
  c.globalCompositeOperation = 'saturation'
  c.fillStyle = '#000000'
  c.fillRect(0, 0, breite, hoehe)
  c.globalCompositeOperation = 'screen'
  c.fillStyle = farbe
  c.fillRect(0, 0, breite, hoehe)
  c.globalCompositeOperation = 'destination-in'
  c.drawImage(image, 0, 0, breite, hoehe)
  c.globalCompositeOperation = 'source-over'

  cache.set(cacheSchluessel, canvas)
  belegtePixel += breite * hoehe
  for (const [alterSchluessel, alt] of cache) {
    if (belegtePixel <= CACHE_BUDGET_PIXEL || alterSchluessel === cacheSchluessel) break
    cache.delete(alterSchluessel)
    belegtePixel -= alt.width * alt.height
  }
  return canvas
}

export function setzeRasterErzeugerFuerTests(neu: RasterErzeuger | null) {
  erzeuger = neu ?? standardErzeuger
  cache.clear()
  belegtePixel = 0
}
