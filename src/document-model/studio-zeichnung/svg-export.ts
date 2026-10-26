import { type P, runde } from './geometrie'
import { symbolFarbwert } from '../symbol-palette'
import {
  type Farbe,
  type Radierung,
  type PfadSegment,
  type Stil,
  TEXT_SCHRIFT,
  TEXT_ZEILENHOEHE,
  type ZeichenElement,
  type Zeichnung,
} from './modell'

export const STUDIO_METADATEN_ID = 'katalog-studio-zeichnung'

const z = (n: number) => String(runde(n))

export function xmlText(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function farbeHex(f: Farbe): string {
  if (f === 'weiss') return '#fff'
  if (f === 'schwarz') return '#000'
  return symbolFarbwert(f)
}

export function stilAttribute(s: Stil): string {
  const teile: string[] = []
  if (s.strich > 0) {
    teile.push(
      `stroke="${farbeHex(s.strichFarbe)}"`,
      `stroke-width="${z(s.strich)}"`,
      'stroke-linecap="round"',
      'stroke-linejoin="round"',
    )
    if (s.gestrichelt) {
      const strich = Math.max(3, s.strich * 3)
      teile.push(`stroke-dasharray="${z(strich)} ${z(strich * 0.7)}"`)
    }
  } else {
    teile.push('stroke="none"')
  }
  teile.push(`fill="${s.fuellung === 'keine' ? 'none' : farbeHex(s.fuellung)}"`)
  return teile.join(' ')
}

export function pfadDaten(segmente: PfadSegment[]): string {
  return segmente
    .map((s) => {
      switch (s.typ) {
        case 'M':
        case 'L':
          return `${s.typ}${z(s.p.x)} ${z(s.p.y)}`
        case 'C':
          return `C${z(s.c1.x)} ${z(s.c1.y)} ${z(s.c2.x)} ${z(s.c2.y)} ${z(s.p.x)} ${z(s.p.y)}`
        case 'Q':
          return `Q${z(s.c.x)} ${z(s.c.y)} ${z(s.p.x)} ${z(s.p.y)}`
        case 'Z':
          return 'Z'
      }
    })
    .join(' ')
}

function drehAttribut(winkel: number, x: number, y: number): string {
  return Math.abs(winkel) > 1e-9 ? ` transform="rotate(${z(winkel)} ${z(x)} ${z(y)})"` : ''
}

function bogenD(e: Extract<ZeichenElement, { art: 'bogen' }>): string {
  const punkt = (w: number) => {
    const r = (w * Math.PI) / 180
    return `${z(e.mitte.x + e.radius * Math.cos(r))} ${z(e.mitte.y + e.radius * Math.sin(r))}`
  }
  const rr = z(e.radius)
  if (Math.abs(e.spanne) >= 360 - 1e-9) {
    return `M${punkt(e.start)} A${rr} ${rr} 0 0 1 ${punkt(e.start + 180)} A${rr} ${rr} 0 0 1 ${punkt(e.start)}`
  }
  const gross = Math.abs(e.spanne) > 180 ? 1 : 0
  const richtung = e.spanne >= 0 ? 1 : 0
  return `M${punkt(e.start)} A${rr} ${rr} 0 ${gross} ${richtung} ${punkt(e.start + e.spanne)}`
}

export function elementSvg(e: ZeichenElement): string {
  switch (e.art) {
    case 'linie':
      return `<line x1="${z(e.a.x)}" y1="${z(e.a.y)}" x2="${z(e.b.x)}" y2="${z(e.b.y)}" ${stilAttribute({ ...e, fuellung: 'keine' })}/>`
    case 'polylinie': {
      const punkte = e.punkte.map((p) => `${z(p.x)},${z(p.y)}`).join(' ')
      const tag = e.geschlossen ? 'polygon' : 'polyline'
      return `<${tag} points="${punkte}" ${stilAttribute(e.geschlossen ? e : { ...e, fuellung: 'keine' })}/>`
    }
    case 'rechteck': {
      const r = Math.min(e.radius, e.breite / 2, e.hoehe / 2)
      const rund = r > 0 ? ` rx="${z(r)}" ry="${z(r)}"` : ''
      return `<rect x="${z(e.mitte.x - e.breite / 2)}" y="${z(e.mitte.y - e.hoehe / 2)}" width="${z(e.breite)}" height="${z(e.hoehe)}"${rund} ${stilAttribute(e)}${drehAttribut(e.drehung, e.mitte.x, e.mitte.y)}/>`
    }
    case 'ellipse':
      if (Math.abs(e.rx - e.ry) < 1e-9) {
        return `<circle cx="${z(e.mitte.x)}" cy="${z(e.mitte.y)}" r="${z(e.rx)}" ${stilAttribute(e)}/>`
      }
      return `<ellipse cx="${z(e.mitte.x)}" cy="${z(e.mitte.y)}" rx="${z(e.rx)}" ry="${z(e.ry)}" ${stilAttribute(e)}${drehAttribut(e.drehung, e.mitte.x, e.mitte.y)}/>`
    case 'bogen':
      return `<path d="${bogenD(e)}" ${stilAttribute({ ...e, fuellung: 'keine' })}/>`
    case 'pfad':
      return `<path d="${pfadDaten(e.segmente)}" ${stilAttribute(e)}/>`
    case 'text': {
      const zeilen = e.text.split('\n')
      const zeilenHoehe = e.groesse * TEXT_ZEILENHOEHE
      const ersteY = e.position.y - ((zeilen.length - 1) * zeilenHoehe) / 2
      const anker =
        e.ausrichtung === 'links' ? 'start' : e.ausrichtung === 'mittig' ? 'middle' : 'end'
      const tspans = zeilen
        .map(
          (zeile, i) =>
            `<tspan x="${z(e.position.x)}" y="${z(ersteY + i * zeilenHoehe)}">${xmlText(zeile)}</tspan>`,
        )
        .join('')
      const fett = e.fett ? ' font-weight="bold"' : ''
      return `<text font-family="${TEXT_SCHRIFT}" font-size="${z(e.groesse)}"${fett} text-anchor="${anker}" dominant-baseline="central" fill="${farbeHex(e.farbe)}"${drehAttribut(e.drehung, e.position.x, e.position.y)}>${tspans}</text>`
    }
    case 'bild':
      return `<image href="${xmlText(e.datenUrl)}" x="${z(e.mitte.x - e.breite / 2)}" y="${z(e.mitte.y - e.hoehe / 2)}" width="${z(e.breite)}" height="${z(e.hoehe)}" preserveAspectRatio="none"${drehAttribut(e.drehung, e.mitte.x, e.mitte.y)}/>`
  }
}

function linienzug(punkte: P[], breite: number): string {
  const stroke = `stroke="#000" stroke-width="${z(breite)}" stroke-linecap="round" stroke-linejoin="round"`
  if (punkte.length === 1) {
    return `<circle cx="${z(punkte[0].x)}" cy="${z(punkte[0].y)}" r="${z(breite / 2)}" fill="#000"/>`
  }
  const liste = punkte.map((p) => `${z(p.x)},${z(p.y)}`).join(' ')
  return `<polyline points="${liste}" fill="none" ${stroke}/>`
}

function maskeSvg(id: string, radierungen: Radierung[], zeichnung: Zeichnung): string {
  const x = z(-zeichnung.breite)
  const y = z(-zeichnung.hoehe)
  const b = z(zeichnung.breite * 3)
  const h = z(zeichnung.hoehe * 3)
  const spuren = radierungen.map((r) => linienzug(r.punkte, r.breite)).join('')
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${b}" height="${h}"><rect x="${x}" y="${y}" width="${b}" height="${h}" fill="#fff"/>${spuren}</mask>`
}

export function elementeSvg(zeichnung: Zeichnung, idPraefix = 'radierung'): string {
  const masken: string[] = []
  const gruppen = zeichnung.elemente.map((e, index) => {
    const inhalt = elementSvg(e)
    if (!e.radierungen?.length) return inhalt
    const id = `${idPraefix}-${index}`
    masken.push(maskeSvg(id, e.radierungen, zeichnung))
    return `<g mask="url(#${id})">${inhalt}</g>`
  })
  return (masken.length > 0 ? `<defs>${masken.join('')}</defs>` : '') + gruppen.join('')
}

function metadatenJson(zeichnung: Zeichnung): string {
  return JSON.stringify(zeichnung)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
}

export function zeichnungZuSvg(zeichnung: Zeichnung, mitMetadaten = true): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${z(zeichnung.breite)} ${z(zeichnung.hoehe)}">`,
    mitMetadaten
      ? `<metadata id="${STUDIO_METADATEN_ID}">${metadatenJson(zeichnung)}</metadata>`
      : '',
    elementeSvg(zeichnung),
    '</svg>',
  ].join('')
}
