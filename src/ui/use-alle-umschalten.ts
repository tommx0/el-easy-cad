import { useEffect, useRef } from 'react'
import { umzuschaltende, type GruppenUmschalter } from './symbolleiste-umschalter'
import { useAppContext } from './use-app-context'

interface Lauf {
  ziel: boolean
  erledigt: Set<string>
}

export function useAlleUmschalten(
  umschalter: readonly GruppenUmschalter[],
  schrittName: (ziel: boolean) => string,
): (ziel: boolean) => void {
  const { commands } = useAppContext()
  const nachlauf = useRef<Lauf | null>(null)

  function schalte(lauf: Lauf) {
    const offene = umzuschaltende(umschalter, lauf.ziel, lauf.erledigt)
    if (offene.length === 0) return
    const sammeln = !commands.sammeltGerade()
    if (sammeln) commands.beginneSammlung()
    for (const e of offene) {
      lauf.erledigt.add(e.id)
      e.aktion.ausfuehren()
    }
    if (sammeln) commands.beendeSammlung(schrittName(lauf.ziel))
  }

  useEffect(() => {
    const lauf = nachlauf.current
    if (!lauf) return
    nachlauf.current = null
    schalte(lauf)
  })

  return (ziel: boolean) => {
    const lauf = { ziel, erledigt: new Set<string>() }
    schalte(lauf)
    nachlauf.current = lauf
  }
}
