import type { EtagenWirkverbindung, KomponentenObjekt } from '../document-model'
import type { KomponentenRenderKontext } from './object-renderer'
import { ermittleSymbolGeometrie } from './object-renderer'
import { slotFarbe } from './overlay-renderer'
import type { ViewTransform } from './view-transform'

const EINGEHEND_FARBE = '#d17d2f'
const SCHRIFTGROESSE_PX = 11
const ZEILENABSTAND_PX = 3
const ABSTAND_ZUM_SYMBOL_PX = 6
const ZEICHENBREITE_ANTEIL = 0.6

export function wirkverbindungsVerweisText(verweis: EtagenWirkverbindung): string {
  const pfeil = verweis.richtung === 'ausgehend' ? '→' : '←'
  return `${pfeil} ${verweis.blattName}: ${verweis.bezeichnung}`
}

export interface WirkverbindungsVerweisRechteck {
  verweis: EtagenWirkverbindung
  x: number
  y: number
  breite: number
  hoehe: number
}

export function wirkverbindungsVerweisRechtecke(
  view: ViewTransform,
  objekt: KomponentenObjekt,
  blattAnzeige: NonNullable<KomponentenRenderKontext['blattAnzeige']>,
  verweise: readonly EtagenWirkverbindung[],
): WirkverbindungsVerweisRechteck[] {
  const { mitte, halbXPx, halbYPx } = ermittleSymbolGeometrie(objekt, view, blattAnzeige)
  const radius = objekt.drehung === 0 ? halbYPx : Math.max(halbXPx, halbYPx)
  const links = mitte.x - (objekt.drehung === 0 ? halbXPx : radius)
  const schrift = SCHRIFTGROESSE_PX * view.zoomFaktor()
  const zeilenhoehe = schrift + ZEILENABSTAND_PX
  const oben = mitte.y + radius + ABSTAND_ZUM_SYMBOL_PX
  return verweise.map((verweis, index) => ({
    verweis,
    x: links,
    y: oben + index * zeilenhoehe,
    breite: wirkverbindungsVerweisText(verweis).length * schrift * ZEICHENBREITE_ANTEIL,
    hoehe: schrift,
  }))
}

export function zeichneWirkverbindungsVerweise(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  rechtecke: readonly WirkverbindungsVerweisRechteck[],
): void {
  if (rechtecke.length === 0) return
  const schrift = SCHRIFTGROESSE_PX * view.zoomFaktor()
  ctx.save()
  ctx.font = `${schrift}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 1
  for (const r of rechtecke) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.fillRect(r.x - 2, r.y - 1, r.breite + 4, r.hoehe + 2)
    const farbe =
      r.verweis.richtung === 'ausgehend' ? slotFarbe(r.verweis.slotIndex) : EINGEHEND_FARBE
    ctx.fillStyle = farbe
    ctx.fillText(wirkverbindungsVerweisText(r.verweis), r.x, r.y + r.hoehe / 2)
    ctx.beginPath()
    ctx.moveTo(r.x, r.y + r.hoehe)
    ctx.lineTo(r.x + r.breite, r.y + r.hoehe)
    ctx.strokeStyle = farbe
    ctx.stroke()
  }
  ctx.restore()
}

export function trefferWirkverbindungsVerweis(
  rechtecke: readonly WirkverbindungsVerweisRechteck[],
  punkt: { x: number; y: number },
): EtagenWirkverbindung | null {
  const treffer = rechtecke.find(
    (r) =>
      punkt.x >= r.x && punkt.x <= r.x + r.breite && punkt.y >= r.y && punkt.y <= r.y + r.hoehe,
  )
  return treffer?.verweis ?? null
}

export function zeichneWirkverbindungQuellHinweis(
  ctx: CanvasRenderingContext2D,
  zeigerScreen: { x: number; y: number },
  text: string,
): void {
  ctx.save()
  ctx.font = `${SCHRIFTGROESSE_PX}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const breite = ctx.measureText(text).width
  const x = zeigerScreen.x + 14
  const y = zeigerScreen.y + 14
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillRect(x - 3, y - 2, breite + 6, SCHRIFTGROESSE_PX + 4)
  ctx.fillStyle = '#808080'
  ctx.fillText(text, x, y)
  ctx.restore()
}
