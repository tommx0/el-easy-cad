import type { CatalogComponent, KabelschachtObjekt, Point, Zeichnung } from '../document-model'
import {
  beschreibeSchachtStraenge,
  ermittleSchachtStraenge,
  planUebersetzer,
  rechteckEcken,
  schachtEtagenVerweise,
  schaechteImVerbund,
  strangNamenImVerbund,
  strangTitel,
  strangTitelMitKlartext,
} from '../document-model'
import type { ViewTransform } from './view-transform'

const PFEIL_SPITZE_PX = 4
const PFEIL_MINDESTHOEHE_PX = 18
const BESCHRIFTUNG_ABSTAND_PX = 6
const ZEICHENBREITE_ANTEIL = 0.6

export interface SchachtEtagenZiel {
  blattId: string
  name: string
  schachtId: string
}

export interface SchachtStrangZeile {
  nummer: number
  name?: string
  text: string
}

export interface SchachtAnzeige {
  name: string
  kurzZeilen: string[]
  straengeZeilen: SchachtStrangZeile[]
  nachOben: SchachtEtagenZiel[]
  nachUnten: SchachtEtagenZiel[]
}

export function ermittleSchachtAnzeige(
  zeichnung: Zeichnung,
  blattId: string,
  schacht: KabelschachtObjekt,
  katalog?: readonly CatalogComponent[],
): SchachtAnzeige {
  const straenge = ermittleSchachtStraenge(zeichnung, schacht.verbundId)
  const eigeneStraenge = straenge.filter((s) =>
    s.anschluesse.some((a) => a.schachtId === schacht.id),
  )
  const namen = strangNamenImVerbund(zeichnung, schacht.verbundId)
  const name = (nummer: number): string | undefined => namen[String(nummer)]
  const benannt = eigeneStraenge.some((s) => name(s.nummer))
  const klartext = katalog
    ? beschreibeSchachtStraenge(zeichnung, schacht.verbundId, katalog, planUebersetzer(zeichnung))
    : []
  const verweise = schachtEtagenVerweise(zeichnung, blattId, schacht.verbundId)
  const imVerbund = schaechteImVerbund(zeichnung, schacht.verbundId)
  const ziel = (blatt: { id: string; name: string }): SchachtEtagenZiel => ({
    blattId: blatt.id,
    name: blatt.name,
    schachtId: imVerbund.find((g) => g.blattId === blatt.id)?.schacht.id ?? '',
  })
  return {
    name: schacht.name,
    kurzZeilen: benannt
      ? eigeneStraenge.map((s) => strangTitel(s.nummer, name(s.nummer)))
      : eigeneStraenge.length > 0
        ? [eigeneStraenge.map((s) => strangTitel(s.nummer)).join(' ')]
        : [],
    straengeZeilen: eigeneStraenge.map((strang) => ({
      nummer: strang.nummer,
      name: name(strang.nummer),
      text: klartext.find((k) => k.nummer === strang.nummer)?.kurz ?? '',
    })),
    nachOben: verweise.nachOben.map(ziel),
    nachUnten: verweise.nachUnten.map(ziel),
  }
}

export function zeichneKabelschacht(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  schacht: KabelschachtObjekt,
  anzeige?: SchachtAnzeige,
  ausgewaehlt = false,
) {
  const ecken = rechteckEcken(schacht).map((p) => view.worldToScreen(p))
  ctx.save()
  ctx.strokeStyle = schacht.farbe
  ctx.lineWidth = schacht.strichstaerke
  ctx.beginPath()
  ctx.moveTo(ecken[0].x, ecken[0].y)
  for (const p of ecken.slice(1)) ctx.lineTo(p.x, p.y)
  ctx.closePath()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(ecken[0].x, ecken[0].y)
  ctx.lineTo(ecken[2].x, ecken[2].y)
  ctx.moveTo(ecken[1].x, ecken[1].y)
  ctx.lineTo(ecken[3].x, ecken[3].y)
  ctx.stroke()

  if (anzeige) {
    zeichnePfeile(ctx, view, ecken, schacht.farbe, anzeige)
    if (!ausgewaehlt) {
      zeichneBeschriftung(ctx, view, ecken, schacht.farbe, [anzeige.name, ...anzeige.kurzZeilen])
    }
  }
  ctx.restore()
}

function auswahlZeilen(anzeige: SchachtAnzeige): string[] {
  return [
    anzeige.name,
    ...anzeige.straengeZeilen.map((z) =>
      z.name
        ? strangTitelMitKlartext(z.nummer, z.name, z.text)
        : z.text
          ? `S${z.nummer}  ${z.text}`
          : `S${z.nummer}`,
    ),
    ...etagenVerweisZeilen(anzeige).map((z) => z.text),
  ]
}

function ersterVerweisIndex(anzeige: SchachtAnzeige): number {
  return 1 + anzeige.straengeZeilen.length
}

export function zeichneSchachtEtagenVerweise(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  schacht: KabelschachtObjekt,
  anzeige: SchachtAnzeige,
) {
  const zeilen = auswahlZeilen(anzeige)
  if (zeilen.length === 0) return
  const ecken = rechteckEcken(schacht).map((p) => view.worldToScreen(p))
  const schriftgroesse = 11 * view.zoomFaktor()
  const abVerweise = ersterVerweisIndex(anzeige)
  ctx.save()
  ctx.fillStyle = schacht.farbe
  ctx.font = `${schriftgroesse}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  for (const [index, text] of zeilen.entries()) {
    const rechteck = zeilenRechteck(view, ecken, index, zeilen.length, text)
    ctx.fillText(text, rechteck.x, rechteck.y + rechteck.hoehe / 2)
    if (index >= abVerweise) {
      ctx.beginPath()
      ctx.moveTo(rechteck.x, rechteck.y + rechteck.hoehe)
      ctx.lineTo(rechteck.x + rechteck.breite, rechteck.y + rechteck.hoehe)
      ctx.strokeStyle = schacht.farbe
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
  ctx.restore()
}

export interface EtagenVerweisZeile {
  text: string
  blattId: string
  schachtId: string
}

export function etagenVerweisZeilen(anzeige: SchachtAnzeige): EtagenVerweisZeile[] {
  return [
    ...anzeige.nachOben.map((z) => ({ text: `↑ ${z.name}`, ...z })),
    ...anzeige.nachUnten.map((z) => ({ text: `↓ ${z.name}`, ...z })),
  ]
}

export interface Bildschirmzeile {
  x: number
  y: number
  breite: number
  hoehe: number
}

function zeilenRechteck(
  view: ViewTransform,
  eckenScreen: Point[],
  index: number,
  anzahl: number,
  text: string,
): Bildschirmzeile {
  const schriftgroesse = 11 * view.zoomFaktor()
  const zeilenabstand = schriftgroesse + 2
  const rechts = Math.max(...eckenScreen.map((p) => p.x))
  const mitteY = eckenScreen.reduce((summe, p) => summe + p.y, 0) / eckenScreen.length
  const erstesY = mitteY - ((anzahl - 1) * zeilenabstand) / 2
  return {
    x: rechts + BESCHRIFTUNG_ABSTAND_PX,
    y: erstesY + index * zeilenabstand - schriftgroesse / 2,
    breite: text.length * schriftgroesse * ZEICHENBREITE_ANTEIL,
    hoehe: schriftgroesse,
  }
}

export function etagenVerweisRechtecke(
  view: ViewTransform,
  schacht: KabelschachtObjekt,
  anzeige: SchachtAnzeige,
): { zeile: EtagenVerweisZeile; rechteck: Bildschirmzeile }[] {
  const ecken = rechteckEcken(schacht).map((p) => view.worldToScreen(p))
  const alle = auswahlZeilen(anzeige)
  const versatz = ersterVerweisIndex(anzeige)
  return etagenVerweisZeilen(anzeige).map((zeile, index) => ({
    zeile,
    rechteck: zeilenRechteck(view, ecken, versatz + index, alle.length, zeile.text),
  }))
}

function zeichnePfeile(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  eckenScreen: Point[],
  farbe: string,
  anzeige: SchachtAnzeige,
) {
  const minY = Math.min(...eckenScreen.map((p) => p.y))
  const maxY = Math.max(...eckenScreen.map((p) => p.y))
  const hoehePx = maxY - minY
  if (hoehePx < PFEIL_MINDESTHOEHE_PX) return
  const mitteX = eckenScreen.reduce((summe, p) => summe + p.x, 0) / eckenScreen.length
  const mitteY = (minY + maxY) / 2
  const laenge = Math.min(hoehePx / 4, 10 * view.zoomFaktor())
  const spitze = Math.min(PFEIL_SPITZE_PX * view.zoomFaktor(), laenge)

  ctx.save()
  ctx.strokeStyle = farbe
  ctx.fillStyle = farbe
  ctx.lineWidth = Math.max(1, view.zoomFaktor())
  if (anzeige.nachOben.length > 0) {
    zeichnePfeil(ctx, mitteX, mitteY - hoehePx / 6, -laenge, spitze)
  }
  if (anzeige.nachUnten.length > 0) {
    zeichnePfeil(ctx, mitteX, mitteY + hoehePx / 6, laenge, spitze)
  }
  ctx.restore()
}

function zeichnePfeil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  laenge: number,
  spitze: number,
) {
  const ende = y + laenge
  const richtung = Math.sign(laenge)
  ctx.beginPath()
  ctx.moveTo(x, y - laenge / 2)
  ctx.lineTo(x, ende)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, ende)
  ctx.lineTo(x - spitze / 2, ende + richtung * spitze)
  ctx.lineTo(x + spitze / 2, ende + richtung * spitze)
  ctx.closePath()
  ctx.fill()
}

function zeichneBeschriftung(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  eckenScreen: Point[],
  farbe: string,
  zeilen: string[],
) {
  const sichtbar = zeilen.filter((z) => z.length > 0)
  if (sichtbar.length === 0) return
  const schriftgroesse = 11 * view.zoomFaktor()
  const zeilenabstand = schriftgroesse + 2
  const rechts = Math.max(...eckenScreen.map((p) => p.x))
  const mitteY = eckenScreen.reduce((summe, p) => summe + p.y, 0) / eckenScreen.length
  let y = mitteY - ((sichtbar.length - 1) * zeilenabstand) / 2
  ctx.save()
  ctx.fillStyle = farbe
  ctx.font = `${schriftgroesse}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  for (const zeile of sichtbar) {
    ctx.fillText(zeile, rechts + BESCHRIFTUNG_ABSTAND_PX, y)
    y += zeilenabstand
  }
  ctx.restore()
}
