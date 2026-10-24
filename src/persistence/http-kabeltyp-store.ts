import type { Kabeltyp } from '../document-model'
import { holeJson, sendeJson, optional } from './api-client'
import type { KabeltypStore } from './kabeltyp-store'

export class HttpKabeltypStore implements KabeltypStore {
  alle(): Promise<Kabeltyp[]> {
    return holeJson<Kabeltyp[]>('/kabeltypen')
  }

  einer(id: string): Promise<Kabeltyp | undefined> {
    return optional(() => holeJson<Kabeltyp>(`/kabeltypen/${id}`))
  }

  async speichern(typ: Kabeltyp): Promise<void> {
    await sendeJson('PUT', `/kabeltypen/${typ.id}`, typ)
  }

  async loeschen(id: string): Promise<void> {
    await sendeJson('DELETE', `/kabeltypen/${id}`)
  }

  duplizieren(id: string): Promise<Kabeltyp> {
    return sendeJson<Kabeltyp>('POST', `/kabeltypen/${id}/duplikat`)
  }
}
