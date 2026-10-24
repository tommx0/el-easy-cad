import type { Installationszone } from './blatt'
import type { BezeichnungsUebersetzung, Uebersetzungen } from './katalog-uebersetzung'

export type ZonenBauteil = 'wand' | 'decke' | 'boden'
export type ZonenVerlegung = 'auf' | 'in'

export interface WandzonenHoehe {
  bezug: 'boden' | 'decke'
  abstand: number
}

export interface ZonenDefinition {
  id: Installationszone
  bezeichnung: string
  uebersetzungen?: Uebersetzungen<BezeichnungsUebersetzung>
  kuerzel: string
  bauteil: ZonenBauteil
  verlegung: ZonenVerlegung
  tiefe?: number
  hoehe?: WandzonenHoehe
  farbe?: string
  herkunft: 'standard' | 'benutzer'
  aktiv: boolean
  sortierung?: number
  seedVersion?: number
}

export const AP_ABSTAND_METER = 0.01
export const ZONEN_ABSTAND_METER = 0.3
export const MITTLERE_ZONE_METER = 1.0
export const WAND_UP_TIEFE_METER = 0.03
export const BODEN_UP_TIEFE_METER = 0.05

const STANDARD_SEED_VERSION = 1

function standard(
  zone: Omit<ZonenDefinition, 'herkunft' | 'aktiv' | 'seedVersion'>,
): ZonenDefinition {
  return { ...zone, herkunft: 'standard', aktiv: true, seedVersion: STANDARD_SEED_VERSION }
}

export const STANDARD_ZONEN: readonly ZonenDefinition[] = [
  standard({
    id: 'decke',
    bezeichnung: 'Unter der Decke (AP)',
    kuerzel: 'D',
    bauteil: 'decke',
    verlegung: 'auf',
    farbe: '#b5563a',
  }),
  standard({
    id: 'decke-in',
    bezeichnung: 'In der Decke (Mitte der Rohdecke)',
    kuerzel: 'Di',
    bauteil: 'decke',
    verlegung: 'in',
    farbe: '#7e3a26',
  }),
  standard({
    id: 'oben',
    bezeichnung: 'Obere Zone auf der Wand (AP)',
    kuerzel: 'O',
    bauteil: 'wand',
    verlegung: 'auf',
    hoehe: { bezug: 'decke', abstand: ZONEN_ABSTAND_METER },
    farbe: '#e07b39',
  }),
  standard({
    id: 'oben-in',
    bezeichnung: 'Obere Zone in der Wand (3 cm)',
    kuerzel: 'Oi',
    bauteil: 'wand',
    verlegung: 'in',
    tiefe: WAND_UP_TIEFE_METER,
    hoehe: { bezug: 'decke', abstand: ZONEN_ABSTAND_METER },
    farbe: '#a6561f',
  }),
  standard({
    id: 'mitte',
    bezeichnung: 'Mittlere Zone auf der Wand (AP)',
    kuerzel: 'M',
    bauteil: 'wand',
    verlegung: 'auf',
    hoehe: { bezug: 'boden', abstand: MITTLERE_ZONE_METER },
    farbe: '#3c9d5d',
  }),
  standard({
    id: 'mitte-in',
    bezeichnung: 'Mittlere Zone in der Wand (3 cm)',
    kuerzel: 'Mi',
    bauteil: 'wand',
    verlegung: 'in',
    tiefe: WAND_UP_TIEFE_METER,
    hoehe: { bezug: 'boden', abstand: MITTLERE_ZONE_METER },
    farbe: '#276b3e',
  }),
  standard({
    id: 'unten',
    bezeichnung: 'Untere Zone auf der Wand (AP)',
    kuerzel: 'U',
    bauteil: 'wand',
    verlegung: 'auf',
    hoehe: { bezug: 'boden', abstand: ZONEN_ABSTAND_METER },
    farbe: '#3a7bd5',
  }),
  standard({
    id: 'unten-in',
    bezeichnung: 'Untere Zone in der Wand (3 cm)',
    kuerzel: 'Ui',
    bauteil: 'wand',
    verlegung: 'in',
    tiefe: WAND_UP_TIEFE_METER,
    hoehe: { bezug: 'boden', abstand: ZONEN_ABSTAND_METER },
    farbe: '#2556a0',
  }),
  standard({
    id: 'boden',
    bezeichnung: 'Auf dem Boden (AP)',
    kuerzel: 'B',
    bauteil: 'boden',
    verlegung: 'auf',
    farbe: '#8e6fd1',
  }),
  standard({
    id: 'boden-in',
    bezeichnung: 'Im Boden (5 cm)',
    kuerzel: 'Bi',
    bauteil: 'boden',
    verlegung: 'in',
    tiefe: BODEN_UP_TIEFE_METER,
    farbe: '#6248a6',
  }),
]

const STANDARD_VON = new Map(STANDARD_ZONEN.map((z) => [z.id, z]))

export function zonenDefinition(
  id: Installationszone | undefined,
  eigene: readonly ZonenDefinition[] = [],
): ZonenDefinition | undefined {
  if (id === undefined) return undefined
  return STANDARD_VON.get(id) ?? eigene.find((z) => z.id === id)
}

export function alleZonen(eigene: readonly ZonenDefinition[] = []): ZonenDefinition[] {
  return [...STANDARD_ZONEN, ...eigene.filter((z) => !STANDARD_VON.has(z.id))]
}

export function gegenstueckZone(
  zone: ZonenDefinition,
  verlegung: ZonenVerlegung,
  kandidaten: readonly ZonenDefinition[],
): ZonenDefinition | undefined {
  if (zone.verlegung === verlegung) return zone
  const gleicheHoehe = (a: WandzonenHoehe | undefined, b: WandzonenHoehe | undefined) =>
    a === undefined || b === undefined
      ? a === b
      : a.bezug === b.bezug && Math.abs(a.abstand - b.abstand) < 5e-4
  return kandidaten.find(
    (z) =>
      z.verlegung === verlegung && z.bauteil === zone.bauteil && gleicheHoehe(z.hoehe, zone.hoehe),
  )
}

export function brauchtRaumhoehe(zone: ZonenDefinition | undefined): boolean {
  return zone?.bauteil === 'decke' || zone?.hoehe?.bezug === 'decke'
}

export function hoeheDerZone(
  zone: ZonenDefinition,
  raumhoehe: number | undefined,
  deckenstaerke: number,
): number | null {
  switch (zone.bauteil) {
    case 'decke':
      if (raumhoehe === undefined) return null
      return zone.verlegung === 'auf'
        ? raumhoehe - AP_ABSTAND_METER
        : raumhoehe + (zone.tiefe ?? deckenstaerke / 2)
    case 'boden':
      return zone.verlegung === 'auf' ? AP_ABSTAND_METER : -(zone.tiefe ?? BODEN_UP_TIEFE_METER)
    case 'wand': {
      const hoehe = zone.hoehe ?? { bezug: 'boden', abstand: MITTLERE_ZONE_METER }
      if (hoehe.bezug === 'boden') return hoehe.abstand
      return raumhoehe === undefined ? null : Math.max(0, raumhoehe - hoehe.abstand)
    }
  }
}

export function durchgangsZone(
  zone: ZonenDefinition | undefined,
  eigene: readonly ZonenDefinition[] = [],
): Installationszone | undefined {
  if (zone?.bauteil !== 'wand' || zone.hoehe?.bezug === 'decke') return undefined
  let beste: ZonenDefinition | undefined
  for (const z of alleZonen(eigene)) {
    if (z.bauteil !== 'wand' || z.hoehe?.bezug !== 'decke' || z.verlegung !== zone.verlegung)
      continue
    if (!beste || z.hoehe.abstand < beste.hoehe!.abstand) beste = z
  }
  return beste?.id ?? 'oben'
}
