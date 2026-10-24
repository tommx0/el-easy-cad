import type { Point } from '../document-model'
import { punktAufPfad, versetztePolylinie } from '../document-model'
import type { ViewTransform } from './view-transform'

export interface WandVorschauBand {
  punkte: Point[]
  staerke: number
}

const FUELLUNG = 'rgba(46, 160, 67, 0.35)'
const KONTUR = '#2ea043'

export function zeichneWandVorschau(
  g: CanvasRenderingContext2D,
  view: ViewTransform,
  baender: readonly WandVorschauBand[],
) {
  if (baender.length === 0) return
  g.save()
  g.fillStyle = FUELLUNG
  g.strokeStyle = KONTUR
  g.lineWidth = 1.5

  for (const band of baender) {
    if (band.punkte.length < 2) continue
    const aussen = versetztePolylinie(band.punkte, band.staerke / 2)
    const innen = versetztePolylinie(band.punkte, -band.staerke / 2)
    const ring = [...aussen, ...[...innen].reverse()].map((p) => view.worldToScreen(p))
    if (ring.length < 3) continue

    g.beginPath()
    g.moveTo(ring[0].x, ring[0].y)
    for (const p of ring.slice(1)) g.lineTo(p.x, p.y)
    g.closePath()
    g.fill()
    g.stroke()
  }

  g.restore()
}

export interface OeffnungsVorschauMarke {
  art: 'tuer' | 'fenster' | 'wanddurchbruch'
  wandIndex: number
  t: number
  breite: number
}

const TUER_FARBE = '#e0782f'
const FENSTER_FARBE = '#2f7dd1'
const DURCHBRUCH_FARBE = '#6e7781'

export function zeichneOeffnungsVorschau(
  g: CanvasRenderingContext2D,
  view: ViewTransform,
  baender: readonly WandVorschauBand[],
  marken: readonly OeffnungsVorschauMarke[],
) {
  if (marken.length === 0) return
  g.save()
  g.lineCap = 'butt'

  for (const marke of marken) {
    const band = baender[marke.wandIndex]
    if (!band || band.punkte.length < 2) continue
    const mitte = punktAufPfad(band.punkte, marke.t)
    const richtung = achsRichtung(band.punkte, marke.t)

    g.strokeStyle =
      marke.art === 'tuer' ? TUER_FARBE : marke.art === 'fenster' ? FENSTER_FARBE : DURCHBRUCH_FARBE
    g.lineWidth = Math.max(2, view.laengeToScreen(band.staerke))
    const halb = marke.breite / 2
    const von = view.worldToScreen({
      x: mitte.x - Math.cos(richtung) * halb,
      y: mitte.y - Math.sin(richtung) * halb,
    })
    const bis = view.worldToScreen({
      x: mitte.x + Math.cos(richtung) * halb,
      y: mitte.y + Math.sin(richtung) * halb,
    })
    g.beginPath()
    g.moveTo(von.x, von.y)
    g.lineTo(bis.x, bis.y)
    g.stroke()
  }

  g.restore()
}

function achsRichtung(punkte: Point[], t: number): number {
  const epsilon = 0.001
  const a = punktAufPfad(punkte, Math.max(0, t - epsilon))
  const b = punktAufPfad(punkte, Math.min(1, t + epsilon))
  return Math.atan2(b.y - a.y, b.x - a.x)
}

export interface TreppenVorschauMarke {
  mitte: Point
  breite: number
  hoehe: number
  drehung: number
}

const TREPPEN_FARBE = '#8957e5'

export function zeichneTreppenVorschau(
  g: CanvasRenderingContext2D,
  view: ViewTransform,
  treppen: readonly TreppenVorschauMarke[],
) {
  if (treppen.length === 0) return
  g.save()
  g.strokeStyle = TREPPEN_FARBE
  g.fillStyle = 'rgba(137, 87, 229, 0.18)'
  g.lineWidth = 1.5

  for (const treppe of treppen) {
    const cos = Math.cos(treppe.drehung)
    const sin = Math.sin(treppe.drehung)
    const halbB = treppe.breite / 2
    const halbH = treppe.hoehe / 2
    const ecken = (
      [
        [-halbB, -halbH],
        [halbB, -halbH],
        [halbB, halbH],
        [-halbB, halbH],
      ] as const
    ).map(([u, v]) =>
      view.worldToScreen({
        x: treppe.mitte.x + u * cos - v * sin,
        y: treppe.mitte.y + u * sin + v * cos,
      }),
    )

    g.beginPath()
    g.moveTo(ecken[0].x, ecken[0].y)
    for (const p of ecken.slice(1)) g.lineTo(p.x, p.y)
    g.closePath()
    g.fill()
    g.stroke()
  }

  g.restore()
}

export interface RaumVorschauMarke {
  punktImRaum: Point
  name: string
}

const RAUM_FARBE = '#b08800'

export function zeichneRaumVorschau(
  g: CanvasRenderingContext2D,
  view: ViewTransform,
  raeume: readonly RaumVorschauMarke[],
) {
  if (raeume.length === 0) return
  g.save()
  g.fillStyle = RAUM_FARBE
  g.font = '12px system-ui, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'top'
  for (const raum of raeume) {
    const p = view.worldToScreen(raum.punktImRaum)
    g.beginPath()
    g.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
    g.fill()
    g.fillText(raum.name, p.x, p.y + 6)
  }
  g.restore()
}
