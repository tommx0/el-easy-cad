import type { Kabeltyp } from '../document-model'

export interface KabeltypStore {
  alle(): Promise<Kabeltyp[]>
  einer(id: string): Promise<Kabeltyp | undefined>
  speichern(typ: Kabeltyp): Promise<void>
  loeschen(id: string): Promise<void>
  duplizieren(id: string): Promise<Kabeltyp>
}
