import type { Zeichenflaeche } from './zeichenflaeche'
import { t, type Uebersetzer } from '../sprache'

export type Zeichnungsart = 'bauplan' | 'schaltplan'

export const STANDARD_ZEICHNUNGSART: Zeichnungsart = 'bauplan'

export const SCHALTPLAN_MASSSTAB_NENNER = 40

export function erzeugeSchaltplanZeichenflaeche(): Zeichenflaeche {
  return {
    papierformat: 'A4',
    ausrichtung: 'quer',
    massstabNenner: SCHALTPLAN_MASSSTAB_NENNER,
    ursprung: { x: 0, y: 0 },
  }
}

export function istSchaltplan(zeichnung: { zeichnungsart: Zeichnungsart }): boolean {
  return zeichnung.zeichnungsart === 'schaltplan'
}

export const SCHALTPLAN_RASTER = 0.24

export function festerRasterSchritt(zeichnung: { zeichnungsart: Zeichnungsart }): number | null {
  return istSchaltplan(zeichnung) ? SCHALTPLAN_RASTER : null
}

export function zeichnungsartName(art: Zeichnungsart, uebersetze: Uebersetzer = t): string {
  return uebersetze(
    art === 'schaltplan' ? 'druck.zeichnungsart.schaltplan' : 'druck.zeichnungsart.bauplan',
  )
}
