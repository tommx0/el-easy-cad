import { mmZuPx, type Rechteck } from './layout'
import type { HinweisAbschnitt } from './rechtliche-hinweise'

const SCHRIFT_MAX_PT = 7
const SCHRIFT_MIN_PT = 4.5
const SCHRIFT_SCHRITT_PT = 0.25
const ZEILEN_FAKTOR = 1.3
const LINIE_ABSTAND_MM = 1.5
const TEXT_ABSTAND_MM = 1.8
const SYMBOL_SPALTE_MM = 7

export const HINWEIS_FARBE_TEXT = '#4a4a4a'
export const HINWEIS_FARBE_TITEL = '#1f1f1f'
export const HINWEIS_FARBE_LINIE = '#b8b8b8'

export type Schriftschnitt = 'titel' | 'text'

export function hinweisSchrift(schnitt: Schriftschnitt, groessePx: number): string {
  return `${schnitt === 'titel' ? '600 ' : ''}${groessePx}px sans-serif`
}

export interface HinweisWort {
  text: string
  schnitt: Schriftschnitt
  x: number
  y: number
}

export interface HinweisLayout {
  schriftPx: number
  linieY: number
  woerter: HinweisWort[]
  symbol: { mitteX: number; mitteY: number; groesse: number }
  passt: boolean
}

export type WortMesser = (text: string, schnitt: Schriftschnitt, groessePx: number) => number

const ptZuPx = (pt: number) => mmZuPx((pt * 25.4) / 72)

export function berechneHinweisLayout(
  bereich: Rechteck,
  messen: WortMesser,
  hinweis: HinweisAbschnitt,
): HinweisLayout {
  const linieY = bereich.y + mmZuPx(LINIE_ABSTAND_MM)
  const textOben = linieY + mmZuPx(TEXT_ABSTAND_MM)
  const textLinks = bereich.x + mmZuPx(SYMBOL_SPALTE_MM)
  const textBreite = bereich.breite - mmZuPx(SYMBOL_SPALTE_MM)
  const verfuegbareHoehe = bereich.y + bereich.hoehe - textOben

  const tokens: { text: string; schnitt: Schriftschnitt }[] = [
    ...`${hinweis.titel}.`.split(' ').map((text) => ({ text, schnitt: 'titel' as const })),
    ...hinweis.text.split(' ').map((text) => ({ text, schnitt: 'text' as const })),
  ].filter((t) => t.text.length > 0)

  let schriftPt = SCHRIFT_MAX_PT
  for (;;) {
    const schriftPx = ptZuPx(schriftPt)
    const zeilenHoehe = schriftPx * ZEILEN_FAKTOR
    const leerzeichen = messen(' ', 'text', schriftPx)
    const woerter: HinweisWort[] = []
    let zeile = 0
    let x = 0
    for (const token of tokens) {
      const breite = messen(token.text, token.schnitt, schriftPx)
      if (x > 0 && x + leerzeichen + breite > textBreite) {
        zeile++
        x = 0
      } else if (x > 0) {
        x += leerzeichen
      }
      woerter.push({ ...token, x: textLinks + x, y: textOben + zeilenHoehe * (zeile + 0.8) })
      x += breite
    }
    const hoehe = (zeile + 1) * zeilenHoehe
    const passt = hoehe <= verfuegbareHoehe
    if (passt || schriftPt - SCHRIFT_SCHRITT_PT < SCHRIFT_MIN_PT) {
      const groesse = Math.min(mmZuPx(4.2), Math.max(hoehe, zeilenHoehe) * 0.9)
      return {
        schriftPx,
        linieY,
        woerter,
        symbol: {
          mitteX: bereich.x + mmZuPx(SYMBOL_SPALTE_MM) / 2 - mmZuPx(0.5),
          mitteY: textOben + Math.min(hoehe, verfuegbareHoehe) / 2,
          groesse,
        },
        passt,
      }
    }
    schriftPt -= SCHRIFT_SCHRITT_PT
  }
}

export function zeichneHinweisStreifen(
  ctx: CanvasRenderingContext2D,
  bereich: Rechteck,
  hinweis: HinweisAbschnitt,
): void {
  ctx.save()
  const messen: WortMesser = (text, schnitt, groessePx) => {
    ctx.font = hinweisSchrift(schnitt, groessePx)
    return ctx.measureText(text).width
  }
  const layout = berechneHinweisLayout(bereich, messen, hinweis)

  ctx.beginPath()
  ctx.rect(bereich.x, bereich.y, bereich.breite, bereich.hoehe)
  ctx.clip()

  ctx.strokeStyle = HINWEIS_FARBE_LINIE
  ctx.lineWidth = mmZuPx(0.2)
  ctx.beginPath()
  ctx.moveTo(bereich.x, layout.linieY)
  ctx.lineTo(bereich.x + bereich.breite, layout.linieY)
  ctx.stroke()

  zeichneWarnsymbol(ctx, layout.symbol)

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  for (const wort of layout.woerter) {
    ctx.font = hinweisSchrift(wort.schnitt, layout.schriftPx)
    ctx.fillStyle = wort.schnitt === 'titel' ? HINWEIS_FARBE_TITEL : HINWEIS_FARBE_TEXT
    ctx.fillText(wort.text, wort.x, wort.y)
  }
  ctx.restore()
}

function zeichneWarnsymbol(
  ctx: CanvasRenderingContext2D,
  { mitteX, mitteY, groesse }: HinweisLayout['symbol'],
): void {
  const h = (groesse * Math.sqrt(3)) / 2
  const oben = { x: mitteX, y: mitteY - h / 2 }
  const links = { x: mitteX - groesse / 2, y: mitteY + h / 2 }
  const rechts = { x: mitteX + groesse / 2, y: mitteY + h / 2 }
  ctx.lineJoin = 'round'
  ctx.lineWidth = groesse * 0.09
  ctx.strokeStyle = HINWEIS_FARBE_TITEL
  ctx.beginPath()
  ctx.moveTo(oben.x, oben.y)
  ctx.lineTo(rechts.x, rechts.y)
  ctx.lineTo(links.x, links.y)
  ctx.closePath()
  ctx.stroke()

  ctx.lineCap = 'round'
  ctx.lineWidth = groesse * 0.1
  ctx.beginPath()
  ctx.moveTo(mitteX, mitteY - h * 0.14)
  ctx.lineTo(mitteX, mitteY + h * 0.18)
  ctx.stroke()
  ctx.fillStyle = HINWEIS_FARBE_TITEL
  ctx.beginPath()
  ctx.arc(mitteX, mitteY + h * 0.33, groesse * 0.055, 0, Math.PI * 2)
  ctx.fill()
}
