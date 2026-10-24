import { STANDARD_ZONEN } from '../document-model'
import type { InstallationszonenStore } from './installationszonen-store'

export async function seedInstallationszonen(store: InstallationszonenStore): Promise<void> {
  const vorhandene = new Map((await store.alle()).map((z) => [z.id, z]))
  for (const standard of STANDARD_ZONEN) {
    const vorhanden = vorhandene.get(standard.id)
    if (!vorhanden) {
      await store.speichern(standard)
      continue
    }
    if (vorhanden.herkunft !== 'standard') continue
    if ((standard.seedVersion ?? 1) <= (vorhanden.seedVersion ?? 1)) continue
    await store.speichern({ ...standard, aktiv: vorhanden.aktiv })
  }
}
