import type { Zeichenflaeche } from '../document-model'
import {
  ZEICHENFLAECHE_HINWEIS_HOEHE_MM,
  ZEICHENFLAECHE_RAND_MM,
  berechneNetzTeilung,
} from '../document-model'
import type { ViewTransform } from './view-transform'

export const NETZ_FARBE = '#5b7dd9'
export const NETZ_FELDLINIEN_FARBE = 'rgba(91, 125, 217, 0.18)'

const BESCHRIFTUNG_MM = 3.5
const TEILSTRICH_MM = 3

export interface NetzDarstellung {
  farbe: string
  linienbreitePx: number
  feldlinien: { farbe: string; linienbreitePx: number } | null
}

export function zeichneKoordinatennetz(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  z: Zeichenflaeche,
  darstellung: NetzDarstellung,
) {
  const mmZuWelt = (mm: number) => (mm * z.massstabNenner) / 1000
  const teilung = berechneNetzTeilung(z)
  const links = teilung.spaltenGrenzen[0]
  const rechts = teilung.spaltenGrenzen[teilung.spaltenGrenzen.length - 1]
  const oben = teilung.zeilenGrenzen[0]
  const unten = teilung.zeilenGrenzen[teilung.zeilenGrenzen.length - 1]
  const rand = mmZuWelt(ZEICHENFLAECHE_RAND_MM)
  const strich = mmZuWelt(TEILSTRICH_MM)
  const s = (x: number, y: number) => view.worldToScreen({ x, y })

  ctx.save()

  if (darstellung.feldlinien) {
    ctx.strokeStyle = darstellung.feldlinien.farbe
    ctx.lineWidth = darstellung.feldlinien.linienbreitePx
    ctx.beginPath()
    for (const x of teilung.spaltenGrenzen.slice(1, -1)) {
      linie(ctx, s(x, oben), s(x, unten))
    }
    for (const y of teilung.zeilenGrenzen.slice(1, -1)) {
      linie(ctx, s(links, y), s(rechts, y))
    }
    ctx.stroke()
  }

  ctx.strokeStyle = darstellung.farbe
  ctx.lineWidth = darstellung.linienbreitePx
  const lo = s(links, oben)
  const ru = s(rechts, unten)
  ctx.strokeRect(lo.x, lo.y, ru.x - lo.x, ru.y - lo.y)

  ctx.beginPath()
  for (const x of teilung.spaltenGrenzen.slice(1, -1)) {
    linie(ctx, s(x, oben), s(x, oben + strich))
    linie(ctx, s(x, unten), s(x, unten - strich))
  }
  for (const y of teilung.zeilenGrenzen.slice(1, -1)) {
    linie(ctx, s(links, y), s(links - strich, y))
    linie(ctx, s(rechts, y), s(rechts + strich, y))
  }
  ctx.stroke()

  const schriftPx = mmZuWelt(BESCHRIFTUNG_MM) * view.scale
  ctx.fillStyle = darstellung.farbe
  ctx.font = `${schriftPx}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const untenBeschriftung = unten - mmZuWelt(ZEICHENFLAECHE_HINWEIS_HOEHE_MM) - rand / 2
  for (const spalte of teilung.spalten) {
    const o = s(spalte.x, oben + rand / 2)
    ctx.fillText(spalte.name, o.x, o.y)
    const u = s(spalte.x, untenBeschriftung)
    ctx.fillText(spalte.name, u.x, u.y)
  }
  for (const zeile of teilung.zeilen) {
    const l = s(links - rand / 2, zeile.y)
    ctx.fillText(zeile.name, l.x, l.y)
    const r = s(rechts + rand / 2, zeile.y)
    ctx.fillText(zeile.name, r.x, r.y)
  }

  ctx.restore()
}

function linie(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
}
