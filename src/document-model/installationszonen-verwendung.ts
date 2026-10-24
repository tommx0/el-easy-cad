import { t } from '../sprache'
import { erzeugeId } from './id'
import { STANDARD_ZONEN, type ZonenDefinition } from './installationszonen'
import type { Zeichnung } from './zeichnung'

const STANDARD_IDS = new Set(STANDARD_ZONEN.map((z) => z.id))

export function benutzteZonenIds(zeichnung: Zeichnung): Set<string> {
  const ids = new Set<string>()
  for (const blatt of zeichnung.blaetter) {
    if (blatt.geschoss?.installationszone) ids.add(blatt.geschoss.installationszone)
    if (blatt.geschoss?.raumquerung) ids.add(blatt.geschoss.raumquerung)
    for (const o of blatt.objekte) {
      if ((o.type === 'leitung' || o.type === 'trunk') && o.installationszone)
        ids.add(o.installationszone)
      if (o.type === 'leitung') for (const t of o.teilstueckZonen ?? []) ids.add(t.zone)
    }
  }
  return ids
}

export function abgeglicheneInstallationszonen(
  zeichnung: Zeichnung,
  bestand: readonly ZonenDefinition[],
  { aufraeumen = false }: { aufraeumen?: boolean } = {},
): ZonenDefinition[] | undefined {
  const global = new Map(bestand.map((z) => [z.id, z]))
  const mitgefuehrt = new Map((zeichnung.installationszonen ?? []).map((z) => [z.id, z]))
  const ids = benutzteZonenIds(zeichnung)
  if (!aufraeumen) for (const id of mitgefuehrt.keys()) ids.add(id)
  const neu: ZonenDefinition[] = []
  for (const id of [...ids].sort()) {
    if (STANDARD_IDS.has(id)) continue
    const zone = global.get(id) ?? mitgefuehrt.get(id)
    if (zone) neu.push(zone)
  }
  const bisher = zeichnung.installationszonen ?? []
  const gleich =
    bisher.length === neu.length &&
    bisher.every((z, i) => JSON.stringify(z) === JSON.stringify(neu[i]))
  if (gleich) return zeichnung.installationszonen
  return neu.length > 0 ? neu : undefined
}

export function unbekannteInstallationszonen(
  zeichnung: Zeichnung,
  bestand: readonly ZonenDefinition[],
): ZonenDefinition[] {
  const bekannt = new Set(bestand.map((z) => z.id))
  return (zeichnung.installationszonen ?? []).filter((z) => !bekannt.has(z.id))
}

export function erzeugeInstallationszone(
  bezeichnung = t('generatoren.installationszonen.neu'),
): ZonenDefinition {
  return {
    id: erzeugeId('zone'),
    bezeichnung,
    kuerzel: 'Z',
    bauteil: 'wand',
    verlegung: 'auf',
    hoehe: { bezug: 'boden', abstand: 1 },
    herkunft: 'benutzer',
    aktiv: true,
  }
}

export function dupliziereInstallationszone(
  zone: ZonenDefinition,
  neueBezeichnung?: string,
): ZonenDefinition {
  return {
    ...zone,
    id: erzeugeId('zone'),
    bezeichnung:
      neueBezeichnung ?? t('generatoren.installationszonen.kopie', { name: zone.bezeichnung }),
    herkunft: 'benutzer',
    aktiv: true,
    seedVersion: undefined,
  }
}
