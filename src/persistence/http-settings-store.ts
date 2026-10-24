import { holeJson, sendeJson } from './api-client'
import type { AppSettings, SettingsStore } from './settings-store'

export class HttpSettingsStore implements SettingsStore {
  laden(): Promise<Partial<AppSettings>> {
    return holeJson<Partial<AppSettings>>('/einstellungen')
  }

  async speichern(patch: Partial<AppSettings>): Promise<void> {
    await sendeJson('PUT', '/einstellungen', patch)
  }
}
