import type { FastifyInstance } from 'fastify'
import { katalogSchema, type Katalog } from '../../src/document-model'
import {
  KatalogLoeschschutzFehler,
  leseAlleKataloge,
  leseKatalog,
  loescheKatalog,
  schreibeKatalog,
} from '../db/kataloge'
import { SqliteCatalogStore, VerschiebeschutzFehler } from '../db/katalog'
import { ApiFehler } from '../fehler'
import { serverText } from '../sprache'
import type { ServerKontext } from '../server'

export function registriereKatalogRegisterRouten(
  app: FastifyInstance,
  kontext: ServerKontext,
): void {
  app.get('/api/kataloge', (anfrage) => {
    const abfrage = (anfrage.query ?? {}) as { nurAktive?: string }
    return leseAlleKataloge(kontext.db, abfrage.nurAktive === '1')
  })

  app.get('/api/kataloge/:id', (anfrage) => {
    const katalog = leseKatalog(kontext.db, (anfrage.params as { id: string }).id)
    if (!katalog) throw ApiFehler.nichtGefunden(serverText('server.kataloge.nichtGefunden'))
    return katalog
  })

  app.put('/api/kataloge/:id', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    const katalog = katalogSchema.parse(anfrage.body ?? {}) as Katalog
    if (katalog.id !== id) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.kennungAbweichend'))
    }
    const bestehend = leseKatalog(kontext.db, id)
    if (!bestehend && katalog.herkunft === 'standard') {
      throw ApiFehler.geschuetzt(serverText('server.kataloge.standardAnlegen'))
    }
    const zuSchreiben: Katalog = !bestehend
      ? katalog
      : bestehend.herkunft === 'standard'
        ? { ...bestehend, aktiv: katalog.aktiv, sortierung: katalog.sortierung }
        : { ...katalog, herkunft: bestehend.herkunft }
    schreibeKatalog(kontext.db, zuSchreiben)
    return zuSchreiben
  })

  app.delete('/api/kataloge/:id', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    if (!leseKatalog(kontext.db, id))
      throw ApiFehler.nichtGefunden(serverText('server.kataloge.nichtGefunden'))
    try {
      const komponenten = loescheKatalog(kontext.db, id)
      return { geloescht: true, komponenten }
    } catch (fehler) {
      if (fehler instanceof KatalogLoeschschutzFehler) throw ApiFehler.geschuetzt(fehler.text)
      throw fehler
    }
  })

  app.post('/api/katalog/:id/verschieben', async (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    const ziel = (anfrage.body ?? {}) as { katalogId?: unknown }
    if (typeof ziel.katalogId !== 'string' || ziel.katalogId.length === 0) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.katalogIdFehlt'))
    }
    if (!leseKatalog(kontext.db, ziel.katalogId)) {
      throw ApiFehler.nichtGefunden(serverText('server.kataloge.zielNichtGefunden'))
    }
    const store = new SqliteCatalogStore(kontext.db, kontext.konfiguration.assetOrdner)
    try {
      await store.verschiebeKomponente(id, ziel.katalogId)
    } catch (fehler) {
      if (fehler instanceof VerschiebeschutzFehler) throw ApiFehler.geschuetzt(fehler.text)
      throw fehler
    }
    return { verschoben: true }
  })
}
