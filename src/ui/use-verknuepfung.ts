import { useSyncExternalStore } from 'react'
import { useAppContext } from './use-app-context'
import type { VerknuepfungsStand } from './verknuepfung'

export function useVerknuepfung(): VerknuepfungsStand {
  const { verknuepfung } = useAppContext()
  return useSyncExternalStore(verknuepfung.subscribe, verknuepfung.getStand)
}
