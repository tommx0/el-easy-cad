import type { IfcBauteilGruppe } from './ifc-bauteilgruppen'
import type { BoundingBox, Point } from './geometry'

export interface Kalibrierung {
  punktA: Point
  punktB: Point
  realLaengeMeter: number
  meterProEinheit: number
  kalibriertAm: string
  normmassstab?: number
}

export type DxfEntity = (
  | { type: 'linie'; start: Point; ende: Point }
  | { type: 'polylinie'; punkte: Point[]; geschlossen: boolean }
  | { type: 'kreis'; mittelpunkt: Point; radius: number }
  | { type: 'bogen'; mittelpunkt: Point; radius: number; startWinkel: number; endWinkel: number }
) & {
  bauteil?: number
}

export interface IfcBauteil {
  guid: string
  klasse: string
  name?: string
}

export interface HintergrundAusblendung {
  id: string
  eckeA: Point
  eckeB: Point
}

interface HintergrundDatei {
  assetId: string | null
  datenUrl: string | null
  ausblendungen: HintergrundAusblendung[]
}

export interface HintergrundPdf extends HintergrundDatei {
  typ: 'pdf'
  dateiname: string
  seite: number
  seitenAnzahl: number
  ausschnittOffset: Point
  breiteRoh: number
  hoeheRoh: number
  inhaltRoh?: BoundingBox
  kalibrierung: Kalibrierung | null
  umgewandelt?: boolean
}

export interface HintergrundDxf extends HintergrundDatei {
  typ: 'dxf'
  dateiname: string
  entities: DxfEntity[]
  breiteRoh: number
  hoeheRoh: number
  kalibrierung: Kalibrierung | null
}

export const BEKANNTE_HINTERGRUND_TYPEN: readonly string[] = ['pdf', 'dxf', 'ifc']

export interface HintergrundUnbekannt {
  typ: 'unbekannt'
  roh: { typ: string } & Record<string, unknown>
  ausblendungen?: undefined
}

export interface IfcLage {
  versatz: Point
  drehung: number
}

export interface HintergrundIfc extends HintergrundDatei {
  typ: 'ifc'
  dateiname: string
  schnitthoehe: number
  freieHoehe?: number
  lage: IfcLage
  entities: DxfEntity[]
  breiteRoh: number
  hoeheRoh: number
  umgewandelt?: boolean
  bauteile?: IfcBauteil[]
  ausgeblendeteGruppen?: IfcBauteilGruppe[]
}

export type Hintergrund = HintergrundPdf | HintergrundDxf | HintergrundIfc | HintergrundUnbekannt

export function istKalibriert(hintergrund: Hintergrund | null): boolean {
  if (hintergrund === null) return false
  if (hintergrund.typ === 'ifc' || hintergrund.typ === 'unbekannt') return true
  return hintergrund.kalibrierung !== null
}

export function istBekannterHintergrund(
  hintergrund: Hintergrund | null,
): hintergrund is HintergrundPdf | HintergrundDxf | HintergrundIfc {
  return hintergrund !== null && hintergrund.typ !== 'unbekannt'
}

export function istKalibrierbar(
  hintergrund: Hintergrund | null,
): hintergrund is HintergrundPdf | HintergrundDxf {
  return hintergrund !== null && hintergrund.typ !== 'unbekannt' && hintergrund.typ !== 'ifc'
}

export function hintergrundQuelle(
  hintergrund: Hintergrund,
  assetQuelle?: (assetId: string) => string,
): string | null {
  if (hintergrund.typ === 'unbekannt') return null
  if (hintergrund.assetId && assetQuelle) return assetQuelle(hintergrund.assetId)
  return hintergrund.datenUrl
}

export function hintergrundSchluessel(hintergrund: Hintergrund): string {
  if (hintergrund.typ === 'unbekannt') return 'unbekannt'
  return hintergrund.assetId ?? hintergrund.datenUrl?.slice(0, 64) ?? 'ohne-datei'
}
