import type { Kabeltyp } from '../document-model'
import type { KabeltypStore } from './kabeltyp-store'
import rohdaten from './seed-data/kabeltypen.json'

interface KabeltypRoh {
  id: string
  bezeichnung: string
  gruppe: string
  bemerkung?: string
  aussendurchmesser_mm?: number
  sortierung?: number
  seed_version?: number
}

interface KabeltypSeedDatei {
  seed_version: number
  kabeltypen: KabeltypRoh[]
}

export const KABELTYP_SEED_VERSION_STANDARD = 1

function zuKabeltyp(roh: KabeltypRoh, dateiVersion: number): Kabeltyp {
  return {
    id: roh.id,
    bezeichnung: roh.bezeichnung,
    gruppe: roh.gruppe,
    bemerkung: roh.bemerkung,
    aussendurchmesserMm: roh.aussendurchmesser_mm,
    herkunft: 'standard',
    aktiv: true,
    sortierung: roh.sortierung,
    seedVersion: roh.seed_version ?? dateiVersion,
  }
}

export async function seedKabeltypen(store: KabeltypStore): Promise<void> {
  const daten = rohdaten as unknown as KabeltypSeedDatei
  const dateiVersion = daten.seed_version ?? KABELTYP_SEED_VERSION_STANDARD
  const vorhandene = new Map((await store.alle()).map((t) => [t.id, t]))

  for (const roh of daten.kabeltypen) {
    const vorhanden = vorhandene.get(roh.id)
    const neu = zuKabeltyp(roh, dateiVersion)
    if (!vorhanden) {
      await store.speichern(neu)
      continue
    }
    if (vorhanden.herkunft !== 'standard') continue
    const gespeicherteVersion = vorhanden.seedVersion ?? KABELTYP_SEED_VERSION_STANDARD
    if ((neu.seedVersion ?? KABELTYP_SEED_VERSION_STANDARD) <= gespeicherteVersion) continue
    await store.speichern({ ...neu, aktiv: vorhanden.aktiv })
  }
}

export function anzahlMitgelieferterKabeltypen(): number {
  return (rohdaten as unknown as KabeltypSeedDatei).kabeltypen.length
}
