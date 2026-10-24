import type { ZonenDefinition } from '../document-model'

export interface InstallationszonenStore {
  alle(): Promise<ZonenDefinition[]>
  speichern(zone: ZonenDefinition): Promise<void>
  loeschen(id: string): Promise<void>
}
