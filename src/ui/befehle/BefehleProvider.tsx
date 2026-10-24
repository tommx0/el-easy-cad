import type { ReactNode } from 'react'
import { useBefehlsAktionen } from './aktionen'
import { BefehleContext } from './use-befehle'

export function BefehleProvider({ children }: { children: ReactNode }) {
  const { aktionen, versteckteEingaben } = useBefehlsAktionen()
  return (
    <BefehleContext.Provider value={aktionen}>
      {versteckteEingaben}
      {children}
    </BefehleContext.Provider>
  )
}
