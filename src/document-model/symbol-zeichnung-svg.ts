import type { Point } from './geometry'
import { type SymbolFarbe, symbolFarbwert } from './symbol-palette'
import type { SymbolElement, SymbolRadierung, SymbolZeichnung } from './symbol-zeichnung'
import {
  SYMBOL_SCHRIFT,
  SYMBOL_STRICH_BREITE,
  SYMBOL_TEXT_GROESSE,
  SYMBOL_TEXT_ZEILENHOEHE,
  bogenSpanne,
  symbolZeichnungIstFarbig,
  symbolZeichnungSchema,
} from './symbol-zeichnung'

export const SYMBOL_ZEICHNUNG_METADATEN_ID = 'el-easy-cad-symbolzeichnung'

const METADATEN_MUSTER = new RegExp(
  `<metadata\\s+id="${SYMBOL_ZEICHNUNG_METADATEN_ID}"\\s*>([\\s\\S]*?)</metadata>`,
)

function zahl(wert: number): string {
  const gerundet = Math.round(wert * 100) / 100
  return String(Object.is(gerundet, -0) ? 0 : gerundet)
}

function xmlText(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function punkteListe(punkte: Point[]): string {
  return punkte.map((p) => `${zahl(p.x)},${zahl(p.y)}`).join(' ')
}

function farbwert(farbe: SymbolFarbe | undefined): string {
  return farbe === undefined || farbe === 'schwarz' ? '#000' : symbolFarbwert(farbe)
}

function strich(breite: number, farbe?: SymbolFarbe, fuellung: SymbolFarbe | null = null): string {
  const fill = fuellung === null ? 'none' : farbwert(fuellung)
  return `stroke="${farbwert(farbe)}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${zahl(breite)}" fill="${fill}"`
}

function fuellung(element: { gefuellt: boolean; fuellFarbe?: SymbolFarbe }): SymbolFarbe | null {
  return element.gefuellt ? (element.fuellFarbe ?? 'schwarz') : null
}

function linienzug(punkte: Point[], breite: number, farbe?: SymbolFarbe): string {
  if (punkte.length === 1) {
    return `<circle cx="${zahl(punkte[0].x)}" cy="${zahl(punkte[0].y)}" r="${zahl(breite / 2)}" fill="${farbwert(farbe)}"/>`
  }
  return `<polyline points="${punkteListe(punkte)}" ${strich(breite, farbe)}/>`
}

function bogenPfad(mitte: Point, radius: number, startWinkel: number, endWinkel: number): string {
  const spanne = bogenSpanne(startWinkel, endWinkel)
  const punktBei = (w: number) =>
    `${zahl(mitte.x + radius * Math.cos(w))} ${zahl(mitte.y + radius * Math.sin(w))}`
  const r = zahl(radius)
  if (spanne >= Math.PI * 2 - 1e-9) {
    const halb = startWinkel + Math.PI
    return `M ${punktBei(startWinkel)} A ${r} ${r} 0 0 1 ${punktBei(halb)} A ${r} ${r} 0 0 1 ${punktBei(startWinkel)}`
  }
  const gross = spanne > Math.PI ? 1 : 0
  return `M ${punktBei(startWinkel)} A ${r} ${r} 0 ${gross} 1 ${punktBei(startWinkel + spanne)}`
}

function elementSvg(element: SymbolElement): string {
  switch (element.art) {
    case 'linie':
      return `<line x1="${zahl(element.a.x)}" y1="${zahl(element.a.y)}" x2="${zahl(element.b.x)}" y2="${zahl(element.b.y)}" ${strich(SYMBOL_STRICH_BREITE[element.strich], element.farbe)}/>`
    case 'freihand':
      return linienzug(element.punkte, SYMBOL_STRICH_BREITE[element.strich], element.farbe)
    case 'polylinie': {
      const breite = SYMBOL_STRICH_BREITE[element.strich]
      if (element.punkte.length === 1) return linienzug(element.punkte, breite, element.farbe)
      const tag = element.geschlossen ? 'polygon' : 'polyline'
      const fuell = element.geschlossen ? fuellung(element) : null
      return `<${tag} points="${punkteListe(element.punkte)}" ${strich(breite, element.farbe, fuell)}/>`
    }
    case 'rechteck':
      return `<rect x="${zahl(element.ecke.x)}" y="${zahl(element.ecke.y)}" width="${zahl(element.breite)}" height="${zahl(element.hoehe)}" ${strich(SYMBOL_STRICH_BREITE[element.strich], element.farbe, fuellung(element))}/>`
    case 'kreis':
      return `<circle cx="${zahl(element.mitte.x)}" cy="${zahl(element.mitte.y)}" r="${zahl(element.radius)}" ${strich(SYMBOL_STRICH_BREITE[element.strich], element.farbe, fuellung(element))}/>`
    case 'bogen':
      return `<path d="${bogenPfad(element.mitte, element.radius, element.startWinkel, element.endWinkel)}" ${strich(SYMBOL_STRICH_BREITE[element.strich], element.farbe)}/>`
    case 'text': {
      const groesse = SYMBOL_TEXT_GROESSE[element.groesse]
      const zeilen = element.text.split('\n')
      const zeilenHoehe = groesse * SYMBOL_TEXT_ZEILENHOEHE
      const ersteZeileY = element.position.y - ((zeilen.length - 1) * zeilenHoehe) / 2
      const tspans = zeilen
        .map(
          (zeile, i) =>
            `<tspan x="${zahl(element.position.x)}" y="${zahl(ersteZeileY + i * zeilenHoehe)}">${xmlText(zeile)}</tspan>`,
        )
        .join('')
      return `<text font-family="${SYMBOL_SCHRIFT}" font-size="${zahl(groesse)}" text-anchor="middle" dominant-baseline="central" fill="${farbwert(element.farbe)}">${tspans}</text>`
    }
    case 'bild':
      return `<image href="${xmlText(element.datenUrl)}" x="${zahl(element.ecke.x)}" y="${zahl(element.ecke.y)}" width="${zahl(element.breite)}" height="${zahl(element.hoehe)}" preserveAspectRatio="none"/>`
  }
}

function maskeSvg(id: string, radierungen: SymbolRadierung[], zeichnung: SymbolZeichnung): string {
  const x = zahl(-zeichnung.breite)
  const y = zahl(-zeichnung.hoehe)
  const b = zahl(zeichnung.breite * 3)
  const h = zahl(zeichnung.hoehe * 3)
  const spuren = radierungen.map((r) => linienzug(r.punkte, r.breite)).join('')
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${b}" height="${h}"><rect x="${x}" y="${y}" width="${b}" height="${h}" fill="#fff"/>${spuren}</mask>`
}

function metadatenJson(zeichnung: SymbolZeichnung): string {
  return JSON.stringify(zeichnung)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
}

export function symbolZeichnungZuSvg(zeichnung: SymbolZeichnung): string {
  const masken: string[] = []
  const gruppen = zeichnung.elemente.map((element, index) => {
    const inhalt = elementSvg(element)
    if (element.radierungen.length === 0) return inhalt
    const id = `radierung-${index}`
    masken.push(maskeSvg(id, element.radierungen, zeichnung))
    return `<g mask="url(#${id})">${inhalt}</g>`
  })
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${zahl(zeichnung.breite)} ${zahl(zeichnung.hoehe)}">`,
    `<metadata id="${SYMBOL_ZEICHNUNG_METADATEN_ID}">${metadatenJson(zeichnung)}</metadata>`,
    masken.length > 0 ? `<defs>${masken.join('')}</defs>` : '',
    ...gruppen,
    '</svg>',
  ].join('')
}

function xmlEntitaetenAufloesen(text: string): string {
  return text
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
}

export function symbolZeichnungAusSvg(svg: string | null | undefined): SymbolZeichnung | null {
  if (!svg) return null
  const treffer = METADATEN_MUSTER.exec(svg)
  if (!treffer) return null
  let roh: unknown
  try {
    roh = JSON.parse(xmlEntitaetenAufloesen(treffer[1]))
  } catch {
    return null
  }
  const ergebnis = symbolZeichnungSchema.safeParse(roh)
  return ergebnis.success ? ergebnis.data : null
}

export function symbolSvgIstFarbig(svg: string | null | undefined): boolean {
  const zeichnung = symbolZeichnungAusSvg(svg)
  return zeichnung !== null && symbolZeichnungIstFarbig(zeichnung)
}
