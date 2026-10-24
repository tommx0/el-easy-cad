import type { Point } from './geometry'
import type { Ebene } from './ebenen'
import { erzeugeStandardEbenen, sichtbareObjekte, standardEbenenName } from './ebenen'
import type { Uebersetzer } from '../sprache'
import type { Hintergrund } from './hintergrund'
import type { KomponentenDarstellung } from './catalog'
import type { Objekt } from './objekte'
import { erzeugeId } from './id'
import type { Zeichenflaeche } from './zeichenflaeche'
import type { Zeichnungsart } from './zeichnungsart'
import { STANDARD_ZEICHNUNGSART, erzeugeSchaltplanZeichenflaeche } from './zeichnungsart'

export type Einheit = 'mm' | 'cm' | 'm' | 'km'

export const STANDARD_EINHEIT: Einheit = 'm'

export type Installationszone = string

export type Raumquerung = Installationszone

export interface BlattGeschoss {
  name?: string
  kote?: number
  raumhoehe?: number
  installationszone?: Installationszone
  deckenstaerke?: number
  nurInBauteilen?: boolean
  raumquerung?: Raumquerung
  ifcGuid?: string
}

export function aendereGeschoss(
  geschoss: BlattGeschoss | undefined,
  patch: Partial<BlattGeschoss>,
): BlattGeschoss | undefined {
  const neu: Record<string, unknown> = { ...geschoss, ...patch }
  for (const [schluessel, wert] of Object.entries(neu))
    if (wert === undefined) delete neu[schluessel]
  return Object.keys(neu).length > 0 ? (neu as BlattGeschoss) : undefined
}

export function geschossAusIfc(
  neu: BlattGeschoss | undefined,
  bisher: BlattGeschoss | undefined,
): BlattGeschoss | undefined {
  return aendereGeschoss(neu, {
    raumhoehe: bisher?.raumhoehe ?? neu?.raumhoehe,
    installationszone: bisher?.installationszone ?? neu?.installationszone,
    nurInBauteilen: bisher?.nurInBauteilen,
    raumquerung: bisher?.raumquerung,
  })
}

export interface Blatt {
  id: string
  name: string
  einheit: Einheit
  ursprung: Point
  nullpunkt: Point | null
  nullpunktRichtung?: number
  massstab: number | null
  hintergrundDrehung?: number
  hintergrund: Hintergrund | null
  hintergrundSichtbar: boolean
  hintergrundDeckkraft: number
  objekte: Objekt[]
  ebenen: Ebene[]
  aktiveEbeneId: string
  symbolSkalierung: number
  zeichenflaeche: Zeichenflaeche | null
  geschoss?: BlattGeschoss
  beschriftungSichtbar: boolean
  bezeichnungSichtbar: boolean
  leitungBezeichnungSichtbar: boolean
  leitungBeschreibungSichtbar: boolean
  leitungTypSichtbar: boolean
  trunkBezeichnungSichtbar: boolean
  trunkBeschreibungSichtbar: boolean
  raumNameSichtbar: boolean
  raumFlaecheSichtbar: boolean
  installationshoeheSichtbar: boolean
  wirkverbindungSichtbar: boolean
  leitungenSichtbar: boolean
  trunksSichtbar: boolean
  schaltverbindungBezeichnungSichtbar: boolean
  kennzeichenSichtbar: boolean
  abgaengeSichtbar: boolean
  stromkreisSichtbar: boolean
  stromkreisSchildSichtbar: boolean
  komponentenDarstellung: KomponentenDarstellung
  textGroessenFaktor: number
  symbolGroessenFaktor: number
}

export function erzeugeBlatt(
  name: string,
  zeichnungsart: Zeichnungsart = STANDARD_ZEICHNUNGSART,
  tp?: Uebersetzer,
): Blatt {
  const schaltplan = zeichnungsart === 'schaltplan'
  const ebenen = erzeugeStandardEbenen(tp)
  const aktiveEbeneName = standardEbenenName(schaltplan ? 'komponenten' : 'bauelemente', tp)
  const aktiveEbene = ebenen.find((e) => e.name === aktiveEbeneName) ?? ebenen[0]
  return {
    id: erzeugeId('blatt'),
    name,
    einheit: STANDARD_EINHEIT,
    ursprung: { x: 0, y: 0 },
    nullpunkt: null,
    massstab: null,
    hintergrund: null,
    hintergrundSichtbar: true,
    hintergrundDeckkraft: 1,
    objekte: [],
    ebenen,
    aktiveEbeneId: aktiveEbene.id,
    symbolSkalierung: 1,
    zeichenflaeche: schaltplan ? erzeugeSchaltplanZeichenflaeche() : null,
    beschriftungSichtbar: !schaltplan,
    bezeichnungSichtbar: !schaltplan,
    leitungBezeichnungSichtbar: !schaltplan,
    leitungBeschreibungSichtbar: true,
    leitungTypSichtbar: true,
    trunkBezeichnungSichtbar: true,
    trunkBeschreibungSichtbar: true,
    raumNameSichtbar: true,
    raumFlaecheSichtbar: true,
    installationshoeheSichtbar: true,
    wirkverbindungSichtbar: true,
    leitungenSichtbar: true,
    trunksSichtbar: true,
    schaltverbindungBezeichnungSichtbar: true,
    kennzeichenSichtbar: true,
    abgaengeSichtbar: true,
    stromkreisSichtbar: true,
    stromkreisSchildSichtbar: true,
    komponentenDarstellung: 'symbol',
    textGroessenFaktor: 0,
    symbolGroessenFaktor: 0,
  }
}

export function nullpunktVon(blatt: Pick<Blatt, 'nullpunkt'>): Point {
  return blatt.nullpunkt ?? { x: 0, y: 0 }
}

export function sichtbareObjekteAufBlatt<T extends Objekt>(
  blatt: Pick<Blatt, 'ebenen' | 'leitungenSichtbar' | 'trunksSichtbar'> & {
    objekte: readonly T[]
  },
  objekte: readonly T[] = blatt.objekte,
): T[] {
  const nachEbene = sichtbareObjekte(objekte, blatt.ebenen)
  if (blatt.leitungenSichtbar && blatt.trunksSichtbar) return nachEbene
  return nachEbene.filter(
    (o) =>
      !(o.type === 'leitung' && !blatt.leitungenSichtbar) &&
      !(o.type === 'trunk' && !blatt.trunksSichtbar),
  )
}
