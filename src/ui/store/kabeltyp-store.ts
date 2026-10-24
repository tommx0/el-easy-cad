import { create } from 'zustand'
import type { Kabeltyp } from '../../document-model'
import type { KabeltypStore } from '../../persistence'

const ZULETZT_BENUTZT_MAX = 8

interface KabeltypState {
  typen: Kabeltyp[]
  geladen: boolean
  zuletztBenutzt: string[]
  laden: (store: KabeltypStore) => Promise<void>
  merkeBenutzt: (id: string) => void
}

export const useKabeltypStore = create<KabeltypState>((set) => ({
  typen: [],
  geladen: false,
  zuletztBenutzt: [],
  laden: async (store) => {
    set({ typen: await store.alle(), geladen: true })
  },
  merkeBenutzt: (id) =>
    set((s) => ({
      zuletztBenutzt: [id, ...s.zuletztBenutzt.filter((x) => x !== id)].slice(
        0,
        ZULETZT_BENUTZT_MAX,
      ),
    })),
}))
