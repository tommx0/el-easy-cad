import type {
  AbgangsText,
  KomponentenObjekt,
  Point,
  SenkrechterAbgangsRaum,
} from '../document-model'
import { add, rotatePoint } from '../document-model'
import type { Bildschirmrechteck } from './object-renderer'
import type { ViewTransform } from './view-transform'

export const ABGANG_SCHRIFT_METER = 0.1
const ABGANG_ABSTAND_METER = 0.08
const SPALTEN_RAND_METER = 0.24
const MIN_BREITE_METER = 0.96
const LINKS_BREITE_METER = 0.72
const ZEILENHOEHE = 1.2
const ABGANG_FARBE = '#404040'
const MIN_SCHRIFT_PX = 3
const MESS_SCHRIFT_PX = 100

function symbolHuelle(objekt: KomponentenObjekt): { min: Point; max: Point } {
  const halbX = (objekt.breiteWelt ?? objekt.groesseWelt) / 2
  const halbY = objekt.groesseWelt / 2
  const { x, y } = objekt.position
  const ecken = [
    { x: x - halbX, y: y - halbY },
    { x: x + halbX, y: y - halbY },
    { x: x + halbX, y: y + halbY },
    { x: x - halbX, y: y + halbY },
  ].map((p) => rotatePoint(p, objekt.position, objekt.drehung))
  return {
    min: { x: Math.min(...ecken.map((p) => p.x)), y: Math.min(...ecken.map((p) => p.y)) },
    max: { x: Math.max(...ecken.map((p) => p.x)), y: Math.max(...ecken.map((p) => p.y)) },
  }
}

export function abgangsVorgabeAnker(objekt: KomponentenObjekt): Point {
  const huelle = symbolHuelle(objekt)
  return { x: huelle.min.x, y: huelle.min.y - ABGANG_ABSTAND_METER }
}

export function abgangsVorgabeBreite(objekt: KomponentenObjekt): number {
  if (objekt.abgangstext?.ausrichtung === 'links') return LINKS_BREITE_METER
  const huelle = symbolHuelle(objekt)
  return Math.max(MIN_BREITE_METER, huelle.max.x - huelle.min.x + 2 * SPALTEN_RAND_METER)
}

export function abgangsZeilen(
  objekt: Pick<KomponentenObjekt, 'abgangstext' | 'dockpunkte'>,
  texte: readonly AbgangsText[],
): string[] {
  const eigener = objekt.abgangstext?.text
  if (eigener !== undefined) return eigener.split('\n')
  const ganz = texte.filter((t) => t.dockpunktIndex === null)
  const jeAnschluss = texte
    .filter((t) => t.dockpunktIndex !== null)
    .sort((a, b) => (a.dockpunktIndex ?? 0) - (b.dockpunktIndex ?? 0))
  const mitPrefix = jeAnschluss.length > 1
  const name = (index: number | null) =>
    index !== null && objekt.dockpunkte?.modus === 'frei'
      ? (objekt.dockpunkte.punkte[index]?.bezeichnung?.trim() ?? '')
      : ''
  return [
    ...ganz.flatMap((t) => t.zeilen),
    ...jeAnschluss.flatMap((t) => {
      const anschluss = name(t.dockpunktIndex)
      return mitPrefix && anschluss ? t.zeilen.map((z) => `${anschluss}: ${z}`) : t.zeilen
    }),
  ]
}

export function umbrechen(
  zeilen: readonly string[],
  maxBreite: number,
  messe: (text: string) => number,
): string[] {
  const ergebnis: string[] = []
  for (const zeile of zeilen) {
    const woerter = zeile.split(/\s+/).filter(Boolean)
    if (woerter.length === 0) {
      ergebnis.push('')
      continue
    }
    let aktuell = woerter[0]
    for (const wort of woerter.slice(1)) {
      const laenger = `${aktuell} ${wort}`
      if (messe(laenger) <= maxBreite) aktuell = laenger
      else {
        ergebnis.push(aktuell)
        aktuell = wort
      }
    }
    ergebnis.push(aktuell)
  }
  return ergebnis
}

export interface AbgangsBlock {
  zeilen: string[]
  schriftPx: number
  ankerWelt: Point
  obenLinksWelt: Point
  senkrecht: boolean
  links: boolean
  rechteck: Bildschirmrechteck
  symbolPunkt: Point
  versetzt: boolean
}

export function ermittleAbgangsBlock(
  mess: Pick<CanvasRenderingContext2D, 'font' | 'measureText'>,
  view: ViewTransform,
  objekt: KomponentenObjekt,
  texte: readonly AbgangsText[],
  raum?: SenkrechterAbgangsRaum,
  linksAnker?: Point,
): AbgangsBlock | null {
  const roh = abgangsZeilen(objekt, texte)
  if (roh.length === 0 || roh.every((z) => !z.trim())) return null
  const schriftMeter = objekt.abgangstext?.hoehe ?? ABGANG_SCHRIFT_METER
  const schriftPx = view.laengeToScreen(schriftMeter)
  if (schriftPx < MIN_SCHRIFT_PX) return null
  if (
    objekt.abgangstext?.ausrichtung === 'senkrecht' &&
    raum &&
    raum.oben - raum.unten >= 2 * schriftMeter
  )
    return senkrechterBlock(mess, view, objekt, roh, schriftMeter, schriftPx, raum)
  if (objekt.abgangstext?.ausrichtung === 'links' && linksAnker)
    return linkerBlock(mess, view, objekt, roh, schriftMeter, schriftPx, linksAnker)
  const breiteMeter = objekt.abgangstext?.breite ?? abgangsVorgabeBreite(objekt)
  mess.font = `${MESS_SCHRIFT_PX}px sans-serif`
  const zeilen = umbrechen(
    roh,
    (breiteMeter / schriftMeter) * MESS_SCHRIFT_PX,
    (t) => mess.measureText(t).width,
  )
  const breitePx =
    (Math.max(0, ...zeilen.map((z) => mess.measureText(z).width)) / MESS_SCHRIFT_PX) * schriftPx
  const ankerWelt = abgangsVorgabeAnker(objekt)
  const versatz = objekt.abgangstext?.versatz
  const obenLinksWelt = versatz ? add(ankerWelt, versatz) : ankerWelt
  const obenLinks = view.worldToScreen(obenLinksWelt)
  const huelle = symbolHuelle(objekt)
  return {
    zeilen,
    schriftPx,
    ankerWelt,
    obenLinksWelt,
    rechteck: {
      x: obenLinks.x,
      y: obenLinks.y,
      breite: breitePx,
      hoehe: zeilen.length * schriftPx * ZEILENHOEHE,
    },
    symbolPunkt: view.worldToScreen({ x: (huelle.min.x + huelle.max.x) / 2, y: huelle.min.y }),
    versetzt: versatz !== undefined && (versatz.x !== 0 || versatz.y !== 0),
    senkrecht: false,
    links: false,
  }
}

function linkerBlock(
  mess: Pick<CanvasRenderingContext2D, 'font' | 'measureText'>,
  view: ViewTransform,
  objekt: KomponentenObjekt,
  roh: readonly string[],
  schriftMeter: number,
  schriftPx: number,
  anker: Point,
): AbgangsBlock {
  const breiteMeter = objekt.abgangstext?.breite ?? abgangsVorgabeBreite(objekt)
  mess.font = `${MESS_SCHRIFT_PX}px sans-serif`
  const zeilen = umbrechen(
    roh,
    (breiteMeter / schriftMeter) * MESS_SCHRIFT_PX,
    (t) => mess.measureText(t).width,
  )
  const breitePx =
    (Math.max(0, ...zeilen.map((z) => mess.measureText(z).width)) / MESS_SCHRIFT_PX) * schriftPx
  const versatz = objekt.abgangstext?.versatz
  const rechtsObenWelt = versatz ? add(anker, versatz) : anker
  const rechtsOben = view.worldToScreen(rechtsObenWelt)
  const huelle = symbolHuelle(objekt)
  return {
    zeilen,
    schriftPx,
    ankerWelt: anker,
    obenLinksWelt: { x: rechtsObenWelt.x - view.laengeToWorld(breitePx), y: rechtsObenWelt.y },
    rechteck: {
      x: rechtsOben.x - breitePx,
      y: rechtsOben.y,
      breite: breitePx,
      hoehe: zeilen.length * schriftPx * ZEILENHOEHE,
    },
    symbolPunkt: view.worldToScreen({ x: huelle.min.x, y: (huelle.min.y + huelle.max.y) / 2 }),
    versetzt: versatz !== undefined && (versatz.x !== 0 || versatz.y !== 0),
    senkrecht: false,
    links: true,
  }
}

function senkrechterBlock(
  mess: Pick<CanvasRenderingContext2D, 'font' | 'measureText'>,
  view: ViewTransform,
  objekt: KomponentenObjekt,
  roh: readonly string[],
  schriftMeter: number,
  schriftPx: number,
  raum: SenkrechterAbgangsRaum,
): AbgangsBlock {
  mess.font = `${MESS_SCHRIFT_PX}px sans-serif`
  const zeilen = umbrechen(
    roh,
    ((raum.oben - raum.unten) / schriftMeter) * MESS_SCHRIFT_PX,
    (t) => mess.measureText(t).width,
  )
  const laengePx =
    (Math.max(0, ...zeilen.map((z) => mess.measureText(z).width)) / MESS_SCHRIFT_PX) * schriftPx
  const huelle = symbolHuelle(objekt)
  const blockBreite = zeilen.length * schriftMeter * ZEILENHOEHE
  const ankerWelt = { x: (huelle.min.x + huelle.max.x) / 2 - blockBreite / 2, y: raum.unten }
  const versatz = objekt.abgangstext?.versatz
  const startWelt = versatz ? add(ankerWelt, versatz) : ankerWelt
  const start = view.worldToScreen(startWelt)
  return {
    zeilen,
    schriftPx,
    ankerWelt,
    obenLinksWelt: startWelt,
    rechteck: {
      x: start.x,
      y: start.y - laengePx,
      breite: zeilen.length * schriftPx * ZEILENHOEHE,
      hoehe: laengePx,
    },
    symbolPunkt: view.worldToScreen({ x: (huelle.min.x + huelle.max.x) / 2, y: huelle.min.y }),
    versetzt: versatz !== undefined && (versatz.x !== 0 || versatz.y !== 0),
    senkrecht: true,
    links: false,
  }
}

export function zeichneAbgangsTexte(
  ctx: CanvasRenderingContext2D,
  view: ViewTransform,
  objekt: KomponentenObjekt,
  texte: readonly AbgangsText[],
  raum?: SenkrechterAbgangsRaum,
  linksAnker?: Point,
): void {
  ctx.save()
  const block = ermittleAbgangsBlock(ctx, view, objekt, texte, raum, linksAnker)
  if (!block) {
    ctx.restore()
    return
  }
  if (block.versetzt) {
    ctx.save()
    ctx.strokeStyle = 'rgba(120, 120, 120, 0.8)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(block.symbolPunkt.x, block.symbolPunkt.y)
    ctx.lineTo(
      block.links ? block.rechteck.x + block.rechteck.breite : block.rechteck.x,
      block.rechteck.y,
    )
    ctx.stroke()
    ctx.restore()
  }
  ctx.font = `${block.schriftPx}px sans-serif`
  ctx.fillStyle = ABGANG_FARBE
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  if (block.senkrecht) {
    const r = block.rechteck
    ctx.translate(r.x, r.y + r.hoehe)
    ctx.rotate(-Math.PI / 2)
    block.zeilen.forEach((zeile, i) => ctx.fillText(zeile, 0, i * block.schriftPx * ZEILENHOEHE))
    ctx.restore()
    return
  }
  ctx.textAlign = block.links ? 'right' : 'left'
  const x = block.links ? block.rechteck.x + block.rechteck.breite : block.rechteck.x
  block.zeilen.forEach((zeile, i) =>
    ctx.fillText(zeile, x, block.rechteck.y + i * block.schriftPx * ZEILENHOEHE),
  )
  ctx.restore()
}
