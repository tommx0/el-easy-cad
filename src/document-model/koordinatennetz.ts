import type { Blatt } from './blatt'
import { getFangpunkt } from './dockpoints'
import type { Point } from './geometry'
import type { Objekt } from './objekte'
import type { Zeichenflaeche } from './zeichenflaeche'
import { zeichenflaecheBoundingBox } from './zeichenflaeche'
import type { Zeichnungsart } from './zeichnungsart'

export const NETZ_SPALTEN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const
export const NETZ_ZEILEN = 6

export interface Netzfeld {
  spalte: string
  zeile: number
}

export function netzfeldName(feld: Netzfeld): string {
  return `${feld.spalte}${feld.zeile}`
}

export function ermittleNetzfeld(z: Zeichenflaeche, p: Point): Netzfeld | null {
  const bb = zeichenflaecheBoundingBox(z)
  const breite = bb.max.x - bb.min.x
  const hoehe = bb.max.y - bb.min.y
  if (breite <= 0 || hoehe <= 0) return null
  if (p.x < bb.min.x || p.x > bb.max.x || p.y < bb.min.y || p.y > bb.max.y) return null
  const spalte = Math.min(
    NETZ_SPALTEN.length - 1,
    Math.floor(((p.x - bb.min.x) / breite) * NETZ_SPALTEN.length),
  )
  const zeile = Math.min(NETZ_ZEILEN - 1, Math.floor(((bb.max.y - p.y) / hoehe) * NETZ_ZEILEN))
  return { spalte: NETZ_SPALTEN[spalte], zeile: zeile + 1 }
}

export interface NetzTeilung {
  spaltenGrenzen: number[]
  zeilenGrenzen: number[]
  spalten: { name: string; x: number }[]
  zeilen: { name: string; y: number }[]
}

export function berechneNetzTeilung(z: Zeichenflaeche): NetzTeilung {
  const bb = zeichenflaecheBoundingBox(z)
  const spaltenBreite = (bb.max.x - bb.min.x) / NETZ_SPALTEN.length
  const zeilenHoehe = (bb.max.y - bb.min.y) / NETZ_ZEILEN
  return {
    spaltenGrenzen: Array.from(
      { length: NETZ_SPALTEN.length + 1 },
      (_, i) => bb.min.x + i * spaltenBreite,
    ),
    zeilenGrenzen: Array.from({ length: NETZ_ZEILEN + 1 }, (_, i) => bb.max.y - i * zeilenHoehe),
    spalten: NETZ_SPALTEN.map((name, i) => ({
      name,
      x: bb.min.x + (i + 0.5) * spaltenBreite,
    })),
    zeilen: Array.from({ length: NETZ_ZEILEN }, (_, i) => ({
      name: String(i + 1),
      y: bb.max.y - (i + 0.5) * zeilenHoehe,
    })),
  }
}

export function leseNetzfeld(name: string): Netzfeld | null {
  const treffer = /^\s*([A-Za-z])\s*(\d+)\s*$/.exec(name)
  if (!treffer) return null
  const spalte = treffer[1].toUpperCase()
  const zeile = Number(treffer[2])
  if (!(NETZ_SPALTEN as readonly string[]).includes(spalte)) return null
  if (zeile < 1 || zeile > NETZ_ZEILEN) return null
  return { spalte, zeile }
}

export function netzfeldMitte(z: Zeichenflaeche, feld: Netzfeld): Point {
  const teilung = berechneNetzTeilung(z)
  const i = (NETZ_SPALTEN as readonly string[]).indexOf(feld.spalte)
  return {
    x: (teilung.spaltenGrenzen[i] + teilung.spaltenGrenzen[i + 1]) / 2,
    y: (teilung.zeilenGrenzen[feld.zeile - 1] + teilung.zeilenGrenzen[feld.zeile]) / 2,
  }
}

export function formatiereOrt(blattName: string, feld: Netzfeld | null): string {
  return feld ? `${blattName}-${netzfeldName(feld)}` : blattName
}

export function ortsBezugspunkt(objekt: Objekt): Point | null {
  if (objekt.type === 'komponente') return getFangpunkt(objekt)
  if (objekt.type === 'potential') return objekt.position
  return null
}

export function ermittleOrt(
  zeichnungsart: Zeichnungsart,
  blatt: Pick<Blatt, 'name' | 'zeichenflaeche'>,
  objekt: Objekt,
): string | null {
  if (zeichnungsart !== 'schaltplan') return null
  const punkt = ortsBezugspunkt(objekt)
  if (!punkt) return null
  const feld = blatt.zeichenflaeche ? ermittleNetzfeld(blatt.zeichenflaeche, punkt) : null
  return formatiereOrt(blatt.name, feld)
}
