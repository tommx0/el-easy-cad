import type { Blatt } from './blatt'
import type { BoundingBox } from './geometry'
import { unionBoundingBox } from './geometry'
import { istBekannterHintergrund } from './hintergrund'
import { hintergrundRahmen } from './hintergrund-lage'
import { getBoundingBox } from './objekte'
import type { Ausrichtung, Papierformat } from './papierformat'
import type { Zeichenflaeche } from './zeichenflaeche'
import {
  zeichenflaecheBoundingBox,
  zeichenflaecheGroesseWelt,
  zeichenflaecheInhaltGroesseMm,
} from './zeichenflaeche'

export function weltBoundingBoxInhalt(blatt: Blatt): BoundingBox | null {
  let ergebnis: BoundingBox | null = null
  if (istBekannterHintergrund(blatt.hintergrund) && blatt.hintergrundSichtbar) {
    ergebnis = hintergrundRahmen(blatt, blatt.hintergrund)
  }
  for (const objekt of blatt.objekte) {
    if (objekt.type === 'leitung' && objekt.pfadSegmente.every((s) => s.length === 0)) continue
    const bb = getBoundingBox(objekt)
    ergebnis = ergebnis ? unionBoundingBox(ergebnis, bb) : bb
  }
  return ergebnis
}

export function schlageMassstabNennerVor(
  blatt: Blatt,
  papierformat: Papierformat,
  ausrichtung: Ausrichtung,
): number | null {
  const bb = weltBoundingBoxInhalt(blatt)
  if (!bb) return null
  const breiteM = bb.max.x - bb.min.x
  const hoeheM = bb.max.y - bb.min.y
  if (breiteM <= 0 && hoeheM <= 0) return null
  const inhaltMm = zeichenflaecheInhaltGroesseMm({ papierformat, ausrichtung })
  const nennerX = breiteM > 0 ? (breiteM * 1000) / inhaltMm.breite : 0
  const nennerY = hoeheM > 0 ? (hoeheM * 1000) / inhaltMm.hoehe : 0
  return Math.max(1, Math.ceil(Math.max(nennerX, nennerY)))
}

export function vorschlagZeichenflaecheUrsprung(
  blatt: Blatt,
  entwurf: Pick<Zeichenflaeche, 'papierformat' | 'ausrichtung' | 'massstabNenner'>,
): { x: number; y: number } {
  const bb = weltBoundingBoxInhalt(blatt)
  const groesse = zeichenflaecheGroesseWelt({ ...entwurf, ursprung: { x: 0, y: 0 } })
  if (!bb) return { x: 0, y: 0 }
  const inhaltZentrum = { x: (bb.min.x + bb.max.x) / 2, y: (bb.min.y + bb.max.y) / 2 }
  return {
    x: inhaltZentrum.x - groesse.breite / 2,
    y: inhaltZentrum.y - groesse.hoehe / 2,
  }
}

export interface ZeichenflaecheUeberstand {
  links?: number
  rechts?: number
  oben?: number
  unten?: number
}

const UEBERSTAND_TOLERANZ_M = 1e-4

export function zeichenflaecheUeberstand(blatt: Blatt): ZeichenflaecheUeberstand | null {
  if (!blatt.zeichenflaeche) return null
  const inhalt = weltBoundingBoxInhalt(blatt)
  if (!inhalt) return null
  const flaeche = zeichenflaecheBoundingBox(blatt.zeichenflaeche)
  const seiten: [keyof ZeichenflaecheUeberstand, number][] = [
    ['links', flaeche.min.x - inhalt.min.x],
    ['rechts', inhalt.max.x - flaeche.max.x],
    ['oben', inhalt.max.y - flaeche.max.y],
    ['unten', flaeche.min.y - inhalt.min.y],
  ]
  const ueberstand: ZeichenflaecheUeberstand = {}
  for (const [seite, wert] of seiten) if (wert > UEBERSTAND_TOLERANZ_M) ueberstand[seite] = wert
  return Object.keys(ueberstand).length > 0 ? ueberstand : null
}
