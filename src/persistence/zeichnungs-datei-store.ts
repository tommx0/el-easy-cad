import type { Zeichnung, ZeichnungsUebersicht } from '../document-model'

export interface ZeichnungsDateiStore {
  save(zeichnung: Zeichnung): Promise<void>
  load(id: string): Promise<Zeichnung>
  list(): Promise<ZeichnungsUebersicht[]>
}
