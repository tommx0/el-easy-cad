import type { BoundingBox, Point } from '../../document-model/geometry'
import type {
  SymbolPinsel,
  SymbolStrich,
  SymbolTextGroesse,
  SymbolZeichnung,
} from '../../document-model/symbol-zeichnung'
import type { SymbolFarbe } from '../../document-model/symbol-palette'
import type { SymbolZeichnerZustand } from './zeichner-zustand'

export type SymbolWerkzeugId =
  | 'auswahl'
  | 'linie'
  | 'polylinie'
  | 'rechteck'
  | 'kreis'
  | 'bogen'
  | 'text'
  | 'freihand'
  | 'radierer'

export interface SymbolZeichnerEinstellungen {
  strich: SymbolStrich
  gefuellt: boolean
  pinsel: SymbolPinsel
  textGroesse: SymbolTextGroesse
  farbe: SymbolFarbe
  fuellFarbe: SymbolFarbe
}

export function farbenAus(
  e: Pick<SymbolZeichnerEinstellungen, 'farbe' | 'fuellFarbe'>,
  gefuellt = false,
): { farbe?: SymbolFarbe; fuellFarbe?: SymbolFarbe } {
  return {
    ...(e.farbe !== 'schwarz' ? { farbe: e.farbe } : {}),
    ...(gefuellt && e.fuellFarbe !== 'schwarz' ? { fuellFarbe: e.fuellFarbe } : {}),
  }
}

export interface SymbolZeigerEreignis {
  punkt: Point
  roh: Point
  umschalt: boolean
  doppelklick: boolean
  gedrueckt: boolean
}

export interface SymbolWerkzeugKontext {
  zustand: SymbolZeichnerZustand
  einstellungen(): SymbolZeichnerEinstellungen
  toleranz(): number
  setStatus(text: string): void
  frageText(position: Point, anfangswert: string, fertig: (text: string | null) => void): void
}

export type SymbolHilfsgrafik =
  | { art: 'linienzug'; punkte: Point[]; geschlossen?: boolean }
  | { art: 'kreis'; mitte: Point; radius: number }
  | { art: 'rahmen'; box: BoundingBox; auswahl?: boolean }
  | { art: 'pinsel'; mitte: Point; radius: number }
  | { art: 'markierung'; punkt: Point }

export interface SymbolWerkzeug {
  id: SymbolWerkzeugId
  fangen: boolean
  aktiviere(k: SymbolWerkzeugKontext): void
  runter(e: SymbolZeigerEreignis, k: SymbolWerkzeugKontext): void
  bewegt(e: SymbolZeigerEreignis, k: SymbolWerkzeugKontext): void
  hoch(e: SymbolZeigerEreignis, k: SymbolWerkzeugKontext): void
  taste(taste: string, k: SymbolWerkzeugKontext): boolean
  abbrechen(k: SymbolWerkzeugKontext): boolean
  vorschau(zeichnung: SymbolZeichnung, k: SymbolWerkzeugKontext): SymbolZeichnung
  hilfsgrafik(k: SymbolWerkzeugKontext): SymbolHilfsgrafik[]
}

export function winkelFang(von: Point, p: Point): Point {
  const dx = p.x - von.x
  const dy = p.y - von.y
  const laenge = Math.hypot(dx, dy)
  if (laenge === 0) return p
  const schritt = Math.PI / 12
  const winkel = Math.round(Math.atan2(dy, dx) / schritt) * schritt
  return { x: von.x + laenge * Math.cos(winkel), y: von.y + laenge * Math.sin(winkel) }
}

export function neueSymbolElementId(): string {
  return crypto.randomUUID()
}

export function mitElement(
  zeichnung: SymbolZeichnung,
  element: SymbolZeichnung['elemente'][number] | null,
): SymbolZeichnung {
  return element ? { ...zeichnung, elemente: [...zeichnung.elemente, element] } : zeichnung
}
