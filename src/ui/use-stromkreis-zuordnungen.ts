import type { StromkreisZuordnung } from '../document-model'
import { ermittleStromkreisZuordnungen } from '../document-model'
import { useKatalogStore } from './store/katalog-store'
import { useProject } from './use-app-context'
import { useVerknuepfung } from './use-verknuepfung'
import { verteilerplanZeichnungen } from './verknuepfung'

export function useStromkreisZuordnungen(
  objektId: string,
  art: 'komponente' | 'leitung',
): StromkreisZuordnung[] {
  const zeichnung = useProject()
  const katalog = useKatalogStore((s) => s.komponenten)
  const plaene = verteilerplanZeichnungen(useVerknuepfung())
  const zuordnungen = ermittleStromkreisZuordnungen(zeichnung, katalog, plaene)
  return (
    (art === 'komponente' ? zuordnungen.komponenten : zuordnungen.leitungen).get(objektId) ?? []
  )
}
