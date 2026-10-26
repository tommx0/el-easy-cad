import {
  drehung,
  EINHEIT,
  type Matrix,
  mittlererMassstab,
  skalierung,
  verketten,
  verschiebung,
} from './geometrie'
import {
  type Farbe,
  type Fuellung,
  neueElementId,
  type Stil,
  transformieren,
  type TextAusrichtung,
  type ZeichenElement,
  type Zeichnung,
  ZEICHNUNG_HOEHE,
} from './modell'
import { symbolFarbeZuWert } from '../symbol-palette'
import { lesePfad } from './pfad-lesen'
import { STUDIO_METADATEN_ID } from './svg-export'
import { entitaetenAufloesen, istElement, leseXml, textInhalt, type XmlElement } from './xml'

export interface ImportErgebnis {
  zeichnung: Zeichnung
  hinweise: string[]
}

interface Erbe {
  stroke: string
  strokeWidth: number
  fill: string
  dash: boolean
  fontSize: number
  fontWeight: string
  textAnchor: string
  baseline: string
  sichtbar: boolean
}

const ERBE_START: Erbe = {
  stroke: 'none',
  strokeWidth: 1,
  fill: '#000',
  dash: false,
  fontSize: 16,
  fontWeight: 'normal',
  textAnchor: 'start',
  baseline: 'auto',
  sichtbar: true,
}

const BENANNTE_FARBEN: Record<string, [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  silver: [192, 192, 192],
  yellow: [255, 255, 0],
  orange: [255, 165, 0],
}

export function farbeAbbilden(wert: string): Fuellung {
  const w = wert.trim().toLowerCase()
  if (!w || w === 'none' || w === 'transparent') return 'keine'
  if (w === 'currentcolor') return 'schwarz'
  const palette = symbolFarbeZuWert(w)
  if (palette) return palette
  let rgb: [number, number, number] | null = BENANNTE_FARBEN[w] ?? null
  const hex = /^#([0-9a-f]{3,8})$/.exec(w)
  if (hex) {
    const h = hex[1]
    const kurz = h.length === 3 || h.length === 4
    const kanal = (i: number) =>
      kurz ? parseInt(h[i] + h[i], 16) : parseInt(h.slice(i * 2, i * 2 + 2), 16)
    rgb = [kanal(0), kanal(1), kanal(2)]
  }
  const rgbFn = /^rgba?\(([^)]*)\)$/.exec(w)
  if (rgbFn) {
    const teile = rgbFn[1].split(/[\s,/]+/).filter(Boolean)
    const kanal = (t: string) => (t.endsWith('%') ? (parseFloat(t) * 255) / 100 : parseFloat(t))
    rgb = [kanal(teile[0]), kanal(teile[1]), kanal(teile[2])]
    if (teile[3] !== undefined && parseFloat(teile[3]) === 0) return 'keine'
  }
  if (!rgb) return 'schwarz'
  const helligkeit = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
  return helligkeit >= 0.5 ? 'weiss' : 'schwarz'
}

function stilWerte(e: XmlElement): Record<string, string> {
  const werte: Record<string, string> = { ...e.attribute }
  const style = e.attribute.style
  if (style) {
    for (const teil of style.split(';')) {
      const [k, ...v] = teil.split(':')
      if (k && v.length > 0) werte[k.trim()] = v.join(':').trim()
    }
  }
  return werte
}

function laenge(wert: string | undefined, standard: number): number {
  if (wert === undefined) return standard
  const n = parseFloat(wert)
  return Number.isFinite(n) ? n : standard
}

function erbeAktualisieren(erbe: Erbe, e: XmlElement): Erbe {
  const w = stilWerte(e)
  return {
    stroke: w.stroke ?? erbe.stroke,
    strokeWidth: laenge(w['stroke-width'], erbe.strokeWidth),
    fill: w.fill ?? erbe.fill,
    dash:
      w['stroke-dasharray'] !== undefined
        ? w['stroke-dasharray'] !== 'none' && w['stroke-dasharray'].trim() !== ''
        : erbe.dash,
    fontSize: laenge(w['font-size'], erbe.fontSize),
    fontWeight: w['font-weight'] ?? erbe.fontWeight,
    textAnchor: w['text-anchor'] ?? erbe.textAnchor,
    baseline: w['dominant-baseline'] ?? erbe.baseline,
    sichtbar: erbe.sichtbar && w.display !== 'none' && w.visibility !== 'hidden',
  }
}

export function leseTransform(wert: string | undefined): Matrix {
  if (!wert) return EINHEIT
  let m: Matrix = EINHEIT
  const muster = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g
  for (const t of wert.matchAll(muster)) {
    const n = t[2]
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
    let teil: Matrix = EINHEIT
    switch (t[1]) {
      case 'matrix':
        teil = [n[0], n[1], n[2], n[3], n[4], n[5]]
        break
      case 'translate':
        teil = verschiebung(n[0] ?? 0, n[1] ?? 0)
        break
      case 'scale':
        teil = skalierung(n[0] ?? 1, n[1] ?? n[0] ?? 1)
        break
      case 'rotate':
        teil = drehung(n[0] ?? 0, { x: n[1] ?? 0, y: n[2] ?? 0 })
        break
      case 'skewX':
        teil = [1, 0, Math.tan(((n[0] ?? 0) * Math.PI) / 180), 1, 0, 0]
        break
      case 'skewY':
        teil = [1, Math.tan(((n[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0]
        break
    }
    m = verketten(m, teil)
  }
  return m
}

function stilAus(erbe: Erbe, m: Matrix, fuellbar: boolean): Stil {
  const strichFarbe = farbeAbbilden(erbe.stroke)
  const strich = strichFarbe === 'keine' ? 0 : erbe.strokeWidth * mittlererMassstab(m)
  return {
    strich: Math.round(strich * 100) / 100,
    strichFarbe: strichFarbe === 'keine' ? 'schwarz' : strichFarbe,
    gestrichelt: erbe.dash,
    fuellung: fuellbar ? farbeAbbilden(erbe.fill) : 'keine',
  }
}

function punkteListe(wert: string | undefined): { x: number; y: number }[] {
  const zahlen = (wert ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number)
  const punkte: { x: number; y: number }[] = []
  for (let i = 0; i + 1 < zahlen.length; i += 2) punkte.push({ x: zahlen[i], y: zahlen[i + 1] })
  return punkte
}

const UEBERSPRUNGEN = new Set(['metadata', 'title', 'desc', 'defs', 'style', 'sodipodi:namedview'])

function leseViewBox(svg: XmlElement): { x: number; y: number; breite: number; hoehe: number } {
  const vb = svg.attribute.viewBox?.split(/[\s,]+/).map(Number)
  if (vb && vb.length === 4 && vb.every(Number.isFinite) && vb[2] > 0 && vb[3] > 0) {
    return { x: vb[0], y: vb[1], breite: vb[2], hoehe: vb[3] }
  }
  const breite = laenge(svg.attribute.width, 100)
  const hoehe = laenge(svg.attribute.height, 100)
  return { x: 0, y: 0, breite, hoehe }
}

export function svgSeitenverhaeltnis(svg: string): number | null {
  try {
    const vb = leseViewBox(leseXml(svg))
    return vb.breite / vb.hoehe
  } catch {
    return null
  }
}

export function studioZeichnungAusSvg(svg: string): Zeichnung | null {
  const muster = new RegExp(`<metadata\\s+id="${STUDIO_METADATEN_ID}"\\s*>([\\s\\S]*?)</metadata>`)
  const treffer = muster.exec(svg)
  if (!treffer) return null
  try {
    const roh = JSON.parse(entitaetenAufloesen(treffer[1])) as Zeichnung
    if (roh.version !== 1 || !Array.isArray(roh.elemente)) return null
    return roh
  } catch {
    return null
  }
}

export function svgImportieren(
  svg: string,
  breitenFaktor: number,
  hoehenFaktor = 1,
): ImportErgebnis {
  const zielBreite = ZEICHNUNG_HOEHE * breitenFaktor
  const zielHoehe = ZEICHNUNG_HOEHE * hoehenFaktor
  const eigene = studioZeichnungAusSvg(svg)
  if (eigene) {
    if (Math.abs(eigene.breite - zielBreite) < 1e-6 && Math.abs(eigene.hoehe - zielHoehe) < 1e-6) {
      return { zeichnung: eigene, hinweise: [] }
    }
    const m = skalierung(zielBreite / eigene.breite, zielHoehe / eigene.hoehe)
    return {
      zeichnung: {
        ...eigene,
        breite: zielBreite,
        hoehe: zielHoehe,
        elemente: eigene.elemente.map((e) => transformieren(e, m)),
      },
      hinweise: [],
    }
  }

  const hinweise = new Set<string>()
  const wurzel = leseXml(svg)
  if (wurzel.name !== 'svg') throw new Error('Die Datei ist kein SVG.')
  const vb = leseViewBox(wurzel)
  const basis = verketten(
    skalierung(zielBreite / vb.breite, zielHoehe / vb.hoehe),
    verschiebung(-vb.x, -vb.y),
  )
  const elemente: ZeichenElement[] = []

  const hinzu = (roh: ZeichenElement, m: Matrix) => elemente.push(transformieren(roh, m))

  const besuche = (e: XmlElement, erbeAussen: Erbe, mAussen: Matrix) => {
    const name = e.name.replace(/^svg:/, '')
    if (UEBERSPRUNGEN.has(name) || name.startsWith('sodipodi:') || name.startsWith('inkscape:')) {
      return
    }
    const erbe = erbeAktualisieren(erbeAussen, e)
    if (!erbe.sichtbar) return
    const m = verketten(mAussen, leseTransform(e.attribute.transform))
    const a = e.attribute
    if (a.mask || a['clip-path'] || a.filter) {
      hinweise.add('Masken, Beschneidungen und Filter wurden nicht übernommen.')
    }
    const id = neueElementId()
    switch (name) {
      case 'svg':
      case 'g':
      case 'a':
      case 'switch':
        for (const kind of e.kinder) if (istElement(kind)) besuche(kind, erbe, m)
        return
      case 'line':
        hinzu(
          {
            art: 'linie',
            id,
            a: { x: laenge(a.x1, 0), y: laenge(a.y1, 0) },
            b: { x: laenge(a.x2, 0), y: laenge(a.y2, 0) },
            ...stilAus(erbe, m, false),
          },
          m,
        )
        return
      case 'rect': {
        const breite = laenge(a.width, 0)
        const hoehe = laenge(a.height, 0)
        if (breite <= 0 || hoehe <= 0) return
        const rx = a.rx !== undefined ? laenge(a.rx, 0) : laenge(a.ry, 0)
        const ry = a.ry !== undefined ? laenge(a.ry, 0) : rx
        hinzu(
          {
            art: 'rechteck',
            id,
            mitte: { x: laenge(a.x, 0) + breite / 2, y: laenge(a.y, 0) + hoehe / 2 },
            breite,
            hoehe,
            radius: Math.min(rx, ry),
            drehung: 0,
            ...stilAus(erbe, m, true),
          },
          m,
        )
        return
      }
      case 'circle':
      case 'ellipse': {
        const rx = name === 'circle' ? laenge(a.r, 0) : laenge(a.rx, 0)
        const ry = name === 'circle' ? rx : laenge(a.ry, rx)
        if (rx <= 0 || ry <= 0) return
        hinzu(
          {
            art: 'ellipse',
            id,
            mitte: { x: laenge(a.cx, 0), y: laenge(a.cy, 0) },
            rx,
            ry,
            drehung: 0,
            ...stilAus(erbe, m, true),
          },
          m,
        )
        return
      }
      case 'polyline':
      case 'polygon': {
        const punkte = punkteListe(a.points)
        if (punkte.length < 2) return
        const geschlossen = name === 'polygon'
        const offenGefuellt = !geschlossen && farbeAbbilden(erbe.fill) !== 'keine'
        hinzu(
          offenGefuellt
            ? {
                art: 'pfad',
                id,
                segmente: [
                  { typ: 'M', p: punkte[0] },
                  ...punkte.slice(1).map((p) => ({ typ: 'L' as const, p })),
                ],
                ...stilAus(erbe, m, true),
              }
            : { art: 'polylinie', id, punkte, geschlossen, ...stilAus(erbe, m, geschlossen) },
          m,
        )
        return
      }
      case 'path': {
        if (!a.d) return
        try {
          const segmente = lesePfad(a.d)
          if (segmente.length === 0) return
          hinzu({ art: 'pfad', id, segmente, ...stilAus(erbe, m, true) }, m)
        } catch {
          hinweise.add('Ein Pfad mit unlesbaren Daten wurde übersprungen.')
        }
        return
      }
      case 'text':
        textLesen(e, erbe, m, elemente)
        return
      case 'image': {
        const href = a.href ?? a['xlink:href'] ?? ''
        if (!href.startsWith('data:')) {
          hinweise.add('Verlinkte Bilder (keine eingebetteten data:-Bilder) wurden übersprungen.')
          return
        }
        const breite = laenge(a.width, 0)
        const hoehe = laenge(a.height, 0)
        if (breite <= 0 || hoehe <= 0) return
        if (a.preserveAspectRatio && a.preserveAspectRatio !== 'none') {
          hinweise.add('Ein Bild wird gestreckt statt mit Seitenverhältnis eingepasst.')
        }
        hinzu(
          {
            art: 'bild',
            id,
            mitte: { x: laenge(a.x, 0) + breite / 2, y: laenge(a.y, 0) + hoehe / 2 },
            breite,
            hoehe,
            drehung: 0,
            datenUrl: href,
          },
          m,
        )
        return
      }
      case 'use':
        hinweise.add('Verweise (<use>) wurden nicht übernommen.')
        return
      case 'linearGradient':
      case 'radialGradient':
      case 'mask':
      case 'clipPath':
      case 'pattern':
      case 'filter':
      case 'symbol':
      case 'marker':
        return
      default:
        hinweise.add(`Unbekanntes SVG-Element <${name}> wurde übersprungen.`)
    }
  }

  besuche(wurzel, ERBE_START, basis)
  if (/url\(#/.test(svg)) hinweise.add('Farbverläufe und Muster wurden als einfarbig übernommen.')
  return {
    zeichnung: { version: 1, breite: zielBreite, hoehe: zielHoehe, elemente },
    hinweise: [...hinweise],
  }
}

function textLesen(e: XmlElement, erbe: Erbe, m: Matrix, elemente: ZeichenElement[]) {
  const stuecke: { x: number; y: number; text: string; erbe: Erbe }[] = []
  const x0 = laenge(e.attribute.x?.split(/[\s,]+/)[0], 0)
  const y0 = laenge(e.attribute.y?.split(/[\s,]+/)[0], 0)
  let rest = ''
  for (const kind of e.kinder) {
    if (!istElement(kind)) {
      rest += kind.text
      continue
    }
    if (kind.name !== 'tspan') continue
    const tErbe = erbeAktualisieren(erbe, kind)
    const eigenePosition = kind.attribute.x !== undefined || kind.attribute.y !== undefined
    if (eigenePosition) {
      stuecke.push({
        x: laenge(kind.attribute.x?.split(/[\s,]+/)[0], x0),
        y: laenge(kind.attribute.y?.split(/[\s,]+/)[0], y0),
        text: textInhalt(kind),
        erbe: tErbe,
      })
    } else {
      rest += textInhalt(kind)
    }
  }
  if (rest.trim()) stuecke.unshift({ x: x0, y: y0, text: rest, erbe })

  for (const s of stuecke) {
    const text = s.text.replace(/\s+/g, ' ').trim()
    if (!text) continue
    const groesse = s.erbe.fontSize
    const mittig = s.erbe.baseline === 'central' || s.erbe.baseline === 'middle'
    const y = mittig ? s.y : s.y - 0.35 * groesse
    const anker = s.erbe.textAnchor
    const ausrichtung: TextAusrichtung =
      anker === 'middle' ? 'mittig' : anker === 'end' ? 'rechts' : 'links'
    const gewicht = s.erbe.fontWeight
    const fett = gewicht === 'bold' || gewicht === 'bolder' || parseInt(gewicht, 10) >= 600
    const farbe = farbeAbbilden(s.erbe.fill)
    elemente.push(
      transformieren(
        {
          art: 'text',
          id: neueElementId(),
          position: { x: s.x, y },
          text,
          groesse,
          ausrichtung,
          drehung: 0,
          fett,
          farbe: (farbe === 'keine' ? 'schwarz' : farbe) as Farbe,
        },
        m,
      ),
    )
  }
}
