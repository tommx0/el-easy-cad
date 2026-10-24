import { createContext, useContext, useSyncExternalStore } from 'react'
import type { Blatt, Zeichnung } from '../document-model'
import type { AppKontext } from './app-context'
import { useUiStore } from './store/ui-store'

export const AppContext = createContext<AppKontext | null>(null)

export function useAppContext(): AppKontext {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext muss innerhalb von <AppProvider> verwendet werden.')
  return ctx
}

export function useProject(): Zeichnung {
  const { doc } = useAppContext()
  return useSyncExternalStore(doc.subscribe, doc.getSnapshot, doc.getSnapshot)
}

export function useAktivesBlatt(): Blatt {
  const zeichnung = useProject()
  const blatt = zeichnung.blaetter.find((b) => b.id === zeichnung.aktivesBlattId)
  if (!blatt)
    throw new Error('Kein aktives Blatt in der Zeichnung gefunden - inkonsistenter Zustand.')
  return blatt
}

export function useCanUndo(): boolean {
  const { commands } = useAppContext()
  return useSyncExternalStore(commands.subscribe, () => commands.canUndo())
}

export function useCanRedo(): boolean {
  const { commands } = useAppContext()
  return useSyncExternalStore(commands.subscribe, () => commands.canRedo())
}

export function useAktivesToolId(): string {
  return useUiStore((s) => s.aktivesToolId)
}
