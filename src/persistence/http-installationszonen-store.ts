import type { ZonenDefinition } from '../document-model'
import { holeJson, sendeJson } from './api-client'
import type { InstallationszonenStore } from './installationszonen-store'

export class HttpInstallationszonenStore implements InstallationszonenStore {
  alle(): Promise<ZonenDefinition[]> {
    return holeJson<ZonenDefinition[]>('/installationszonen')
  }

  async speichern(zone: ZonenDefinition): Promise<void> {
    await sendeJson('PUT', `/installationszonen/${encodeURIComponent(zone.id)}`, zone)
  }

  async loeschen(id: string): Promise<void> {
    await sendeJson('DELETE', `/installationszonen/${encodeURIComponent(id)}`)
  }
}
