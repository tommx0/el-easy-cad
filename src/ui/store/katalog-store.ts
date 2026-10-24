import { create } from 'zustand'
import type { CatalogComponent, Katalog } from '../../document-model'
import { mitEingebautenKomponenten } from '../../document-model'
import type { CatalogStore, KatalogRegisterStore } from '../../persistence'

interface KatalogState {
  komponenten: CatalogComponent[]
  kataloge: Katalog[]
  geladen: boolean
  laden: (store: CatalogStore & Partial<KatalogRegisterStore>) => Promise<void>
}

export const useKatalogStore = create<KatalogState>((set) => ({
  komponenten: [],
  kataloge: [],
  geladen: false,
  laden: async (store) => {
    const komponenten = await store.getComponents()
    const kataloge = store.getKataloge ? await store.getKataloge() : []
    set({ komponenten: mitEingebautenKomponenten(komponenten), kataloge, geladen: true })
  },
}))

export function zaehleJeKatalog(komponenten: readonly CatalogComponent[]): Map<string, number> {
  const anzahl = new Map<string, number>()
  for (const k of komponenten) anzahl.set(k.katalogId, (anzahl.get(k.katalogId) ?? 0) + 1)
  return anzahl
}
