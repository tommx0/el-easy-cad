import type { Blatt, BlattGeschoss, Installationszone } from './blatt'
import { typDefinition } from './geraete-regelwerk'
import { hoeheDerZone, zonenDefinition, type ZonenDefinition } from './installationszonen'
import { ermittleTypUndSlots } from './geraetegruppen-ableitung'
import type { KomponentenObjekt } from './objekte'
import type { Zeichnung } from './zeichnung'

export const RUECKFALL_MONTAGEHOEHE_METER = 1.05
export const RUECKFALL_RAUMHOEHE_METER = 2.75
export const GERAETE_TIEFE_METER = 0.08
export const DECKENSTAERKE_ANNAHME_METER = 0.2
const DECKENSTAERKE_HOECHSTENS_METER = 1.0

export function zonenHoeheMeter(
  geschoss: BlattGeschoss | undefined,
  zone: Installationszone | undefined = geschoss?.installationszone,
  deckenstaerke: number = DECKENSTAERKE_ANNAHME_METER,
  eigene: readonly ZonenDefinition[] = [],
): number | null {
  const definition = zonenDefinition(zone, eigene)
  return definition ? hoeheDerZone(definition, geschoss?.raumhoehe, deckenstaerke) : null
}

export function wirksameZone(
  stueck: { installationszone?: Installationszone } | undefined,
  blatt: Blatt | undefined,
): Installationszone | undefined {
  return stueck?.installationszone ?? blatt?.geschoss?.installationszone
}

export function deckenstaerkeAusKoten(
  kote: number | undefined,
  raumhoehe: number | undefined,
  koteDarueber: number | undefined,
): number {
  if (kote === undefined || raumhoehe === undefined || koteDarueber === undefined)
    return DECKENSTAERKE_ANNAHME_METER
  const staerke = koteDarueber - kote - raumhoehe
  return staerke > 0 && staerke <= DECKENSTAERKE_HOECHSTENS_METER
    ? staerke
    : DECKENSTAERKE_ANNAHME_METER
}

export type DeckenstaerkeQuelle = 'feld' | 'koten' | 'annahme'

export function deckenstaerkeMitQuelle(
  zeichnung: Zeichnung,
  blatt: Blatt | undefined,
): { meter: number; quelle: DeckenstaerkeQuelle } {
  const eigene = blatt?.geschoss?.deckenstaerke
  if (eigene !== undefined) return { meter: eigene, quelle: 'feld' }
  const kote = blatt?.geschoss?.kote
  if (kote === undefined) return { meter: DECKENSTAERKE_ANNAHME_METER, quelle: 'annahme' }
  let darueber: number | undefined
  for (const b of zeichnung.blaetter) {
    const k = b.geschoss?.kote
    if (k !== undefined && k > kote && (darueber === undefined || k < darueber)) darueber = k
  }
  const meter = deckenstaerkeAusKoten(kote, blatt?.geschoss?.raumhoehe, darueber)
  return { meter, quelle: meter === DECKENSTAERKE_ANNAHME_METER ? 'annahme' : 'koten' }
}

export function deckenstaerkeMeter(zeichnung: Zeichnung, blatt: Blatt | undefined): number {
  return deckenstaerkeMitQuelle(zeichnung, blatt).meter
}

export function stueckZonenHoeheMeter(
  stueck: { installationszone?: Installationszone } | undefined,
  blatt: Blatt | undefined,
  zeichnung: Zeichnung,
): number | null {
  const zone = wirksameZone(stueck, blatt)
  const eigene = zeichnung.installationszonen ?? []
  return zonenHoeheMeter(
    blatt?.geschoss,
    zone,
    zonenDefinition(zone, eigene)?.bauteil === 'decke'
      ? deckenstaerkeMeter(zeichnung, blatt)
      : undefined,
    eigene,
  )
}

export function montagehoeheMeter(
  komponente: KomponentenObjekt,
  zeichnung: Zeichnung,
  blatt: Blatt | undefined = blattDerKomponente(zeichnung, komponente.id),
): number {
  if (komponente.montageort === 'decke') {
    const raumhoehe = blatt?.geschoss?.raumhoehe ?? RUECKFALL_RAUMHOEHE_METER
    return raumhoehe - GERAETE_TIEFE_METER / 2
  }
  if (komponente.montageort === 'boden') return GERAETE_TIEFE_METER / 2
  if (komponente.installationshoehe !== undefined) return komponente.installationshoehe
  const typ = ermittleTypUndSlots(komponente, zeichnung)?.typ
  return (
    (typ ? typDefinition(typ)?.standardMontagehoehe : undefined) ?? RUECKFALL_MONTAGEHOEHE_METER
  )
}

export function endSenkrechteMeter(
  zone: number | null,
  komponente: KomponentenObjekt,
  zeichnung: Zeichnung,
  blatt?: Blatt,
): number | null {
  if (zone === null) return null
  const ort = blatt ?? blattDerKomponente(zeichnung, komponente.id)
  if (komponente.montageort === 'decke' && ort?.geschoss?.raumhoehe === undefined) return null
  return Math.abs(zone - montagehoeheMeter(komponente, zeichnung, ort))
}

function blattDerKomponente(zeichnung: Zeichnung, objektId: string): Blatt | undefined {
  return zeichnung.blaetter.find((b) => b.objekte.some((o) => o.id === objektId))
}

export interface ZonenStelle {
  blattId: string
  zone: number | null
}

function oberesUndUnteres(zeichnung: Zeichnung, a: Blatt, b: Blatt): [Blatt, Blatt] {
  const koteA = a.geschoss?.kote
  const koteB = b.geschoss?.kote
  if (koteA !== undefined && koteB !== undefined && koteA !== koteB)
    return koteA > koteB ? [a, b] : [b, a]
  return zeichnung.blaetter.indexOf(a) > zeichnung.blaetter.indexOf(b) ? [a, b] : [b, a]
}

export function zonenUnterschiedMeter(
  zeichnung: Zeichnung,
  a: ZonenStelle,
  b: ZonenStelle,
): number {
  if (a.blattId === b.blattId || a.zone === null || b.zone === null) return 0
  const blattA = zeichnung.blaetter.find((x) => x.id === a.blattId)
  const blattB = zeichnung.blaetter.find((x) => x.id === b.blattId)
  if (!blattA || !blattB) return 0
  const [oben] = oberesUndUnteres(zeichnung, blattA, blattB)
  return oben === blattA ? a.zone - b.zone : b.zone - a.zone
}
