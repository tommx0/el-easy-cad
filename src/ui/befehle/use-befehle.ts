import { createContext, useContext } from 'react'
import type { Aktionskarte, Befehlsaktion } from './aktionen'

export const BefehleContext = createContext<Aktionskarte | null>(null)

export function useBefehle(): Aktionskarte {
  const karte = useContext(BefehleContext)
  if (!karte) throw new Error('useBefehle muss innerhalb von <BefehleProvider> verwendet werden.')
  return karte
}

export function useBefehl(id: string): Befehlsaktion | undefined {
  return useBefehle()[id]
}
