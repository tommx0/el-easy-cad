import type { AppSettings, SettingsStore } from './settings-store'

const STORAGE_KEY = 'eleasycad-einstellungen'
const UEBERNOMMEN_KEY = 'eleasycad-einstellungen-uebernommen'

export class LocalSettingsStore implements SettingsStore {
  async laden(): Promise<Partial<AppSettings>> {
    try {
      const roh = window.localStorage.getItem(STORAGE_KEY)
      if (!roh) return {}
      const daten: unknown = JSON.parse(roh)
      if (typeof daten !== 'object' || daten === null) return {}
      return daten as Partial<AppSettings>
    } catch {
      return {}
    }
  }

  async speichern(patch: Partial<AppSettings>): Promise<void> {
    try {
      const bisherige = await this.laden()
      const zusammengefuehrt = { ...bisherige, ...patch }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(zusammengefuehrt))
    } catch {}
  }
}

export async function uebernehmeAlteEinstellungen(ziel: SettingsStore): Promise<void> {
  try {
    if (window.localStorage.getItem(UEBERNOMMEN_KEY)) return
    const vorhanden = await ziel.laden()
    if (Object.keys(vorhanden).length === 0) {
      const alt = await new LocalSettingsStore().laden()
      if (Object.keys(alt).length > 0) await ziel.speichern(alt)
    }
    window.localStorage.setItem(UEBERNOMMEN_KEY, new Date().toISOString())
  } catch {}
}
