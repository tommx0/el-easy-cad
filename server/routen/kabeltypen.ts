import type { FastifyInstance } from 'fastify'
import { kabeltypSchema, type Kabeltyp } from '../../src/document-model'
import {
  KabeltypLoeschschutzFehler,
  leseAlleKabeltypen,
  leseKabeltyp,
  loescheKabeltyp,
  schreibeKabeltyp,
  SqliteKabeltypStore,
} from '../db/kabeltypen'
import { ApiFehler } from '../fehler'
import { serverText } from '../sprache'
import type { ServerKontext } from '../server'

export function registriereKabeltypRouten(app: FastifyInstance, kontext: ServerKontext): void {
  app.get('/api/kabeltypen', (anfrage) => {
    const abfrage = (anfrage.query ?? {}) as { nurAktive?: string }
    return leseAlleKabeltypen(kontext.db, abfrage.nurAktive === '1')
  })

  app.get('/api/kabeltypen/:id', (anfrage) => {
    const typ = leseKabeltyp(kontext.db, (anfrage.params as { id: string }).id)
    if (!typ) throw ApiFehler.nichtGefunden(serverText('server.kabeltypen.nichtGefunden'))
    return typ
  })

  app.put('/api/kabeltypen/:id', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    const typ = kabeltypSchema.parse(anfrage.body ?? {}) as Kabeltyp
    if (typ.id !== id) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.kennungAbweichend'))
    }
    schreibeKabeltyp(kontext.db, typ)
    return typ
  })

  app.delete('/api/kabeltypen/:id', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    if (!leseKabeltyp(kontext.db, id))
      throw ApiFehler.nichtGefunden(serverText('server.kabeltypen.nichtGefunden'))
    try {
      loescheKabeltyp(kontext.db, id)
    } catch (fehler) {
      if (fehler instanceof KabeltypLoeschschutzFehler) throw ApiFehler.geschuetzt(fehler.text)
      throw fehler
    }
    return { geloescht: true }
  })

  app.post('/api/kabeltypen/:id/duplikat', async (anfrage, ausgabe) => {
    const id = (anfrage.params as { id: string }).id
    if (!leseKabeltyp(kontext.db, id))
      throw ApiFehler.nichtGefunden(serverText('server.kabeltypen.nichtGefunden'))
    void ausgabe.status(201)
    return await new SqliteKabeltypStore(kontext.db).duplizieren(id)
  })
}
