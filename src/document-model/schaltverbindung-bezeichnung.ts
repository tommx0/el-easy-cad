import type { Point } from './geometry'

const VORBELEGUNG: Record<number, readonly string[]> = {
  2: ['L1', 'N'],
  3: ['L1', 'L2', 'L3'],
  4: ['L1', 'L2', 'L3', 'N'],
  5: ['L1', 'L2', 'L3', 'N', 'PE'],
}

export function standardAderBezeichnungen(anzahl: number): (string | undefined)[] {
  const namen = VORBELEGUNG[anzahl] ?? []
  return Array.from({ length: anzahl }, (_, i) => namen[i])
}

export function sammelBezeichnung(polzahl: number): string | undefined {
  return polzahl > 1 ? standardAderBezeichnungen(polzahl).join(', ') : undefined
}

export function bezeichnungsStellen(wegpunkte: readonly Point[]): Point[] {
  if (wegpunkte.length < 2) return []
  return [wegpunkte[0], wegpunkte[wegpunkte.length - 1]]
}
