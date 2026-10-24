import type { GrafikStatus, ImportBlatt } from './dateien'

export type ZeilenStatus = 'neu' | 'aktualisiert' | 'fehler'

export interface ImportVorschauZeile {
  blatt: ImportBlatt
  zeile: number
  bezeichnung: string
  artikelnummer: string
  komponente?: string
  status: ZeilenStatus
  bild: GrafikStatus
  symbol: GrafikStatus
  fehler: string[]
  hinweise: string[]
}

export interface ImportVorschau {
  zeilen: ImportVorschauZeile[]
  dateiFehler: string[]
}

export function zaehleStatus(vorschau: ImportVorschau): Record<ZeilenStatus, number> {
  const anzahl: Record<ZeilenStatus, number> = { neu: 0, aktualisiert: 0, fehler: 0 }
  for (const z of vorschau.zeilen) anzahl[z.status]++
  return anzahl
}
