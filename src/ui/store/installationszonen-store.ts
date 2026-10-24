import { create } from 'zustand'
import type { ZonenDefinition } from '../../document-model'
import type { InstallationszonenStore } from '../../persistence'

interface InstallationszonenState {
  zonen: ZonenDefinition[]
  geladen: boolean
  laden: (store: InstallationszonenStore) => Promise<void>
}

export const useInstallationszonenStore = create<InstallationszonenState>((set) => ({
  zonen: [],
  geladen: false,
  laden: async (store) => {
    set({ zonen: await store.alle(), geladen: true })
  },
}))
