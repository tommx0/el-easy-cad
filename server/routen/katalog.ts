import type { FastifyInstance } from 'fastify'
import { catalogComponentSchema, type CatalogComponent } from '../../src/document-model'
import {
  gruppen,
  leseEine,
  leseGefiltert,
  loesche,
  LoeschschutzFehler,
  schreibe,
  SqliteCatalogStore,
} from '../db/katalog'
import { leseKatalog } from '../db/kataloge'
import { holeUmstellungsHinweis } from '../katalog-umstellung'
import { ApiFehler } from '../fehler'
import { serverText } from '../sprache'
import type { ServerKontext } from '../server'

export function registriereKatalogRouten(app: FastifyInstance, kontext: ServerKontext): void {
  app.get('/api/katalog', (anfrage) => {
    const abfrage = (anfrage.query ?? {}) as {
      suche?: string
      hauptgruppe?: string
      untergruppe?: string
      katalogId?: string
      nurAktiveKataloge?: string
    }
    return leseGefiltert(kontext.db, {
      suche: abfrage.suche?.trim() || undefined,
      hauptgruppe: abfrage.hauptgruppe?.trim() || undefined,
      untergruppe: abfrage.untergruppe?.trim() || undefined,
      katalogId: abfrage.katalogId?.trim() || undefined,
      nurAktiveKataloge: abfrage.nurAktiveKataloge === '1',
    })
  })

  app.post('/api/katalog/umstellungshinweis', () => ({
    gesichert: holeUmstellungsHinweis(kontext.db),
  }))

  app.get('/api/katalog/gruppen', () => gruppen(kontext.db))

  app.get('/api/katalog/:id', (anfrage) => {
    const komponente = leseEine(kontext.db, (anfrage.params as { id: string }).id)
    if (!komponente)
      throw ApiFehler.nichtGefunden(serverText('server.katalog.komponenteNichtGefunden'))
    return komponente
  })

  app.put('/api/katalog/:id', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    const komponente = catalogComponentSchema.parse(anfrage.body ?? {}) as CatalogComponent
    if (komponente.id !== id) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.kennungAbweichend'))
    }
    const bestehend = leseEine(kontext.db, id)
    if (bestehend?.herkunft === 'standard' || komponente.herkunft === 'standard') {
      throw ApiFehler.geschuetzt(
        serverText('server.katalog.standardAendern', {
          name: bestehend?.name ?? komponente.name,
        }),
      )
    }
    schreibe(kontext.db, komponente)
    return komponente
  })

  app.delete('/api/katalog/:id', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    if (!leseEine(kontext.db, id)) {
      throw ApiFehler.nichtGefunden(serverText('server.katalog.komponenteNichtGefunden'))
    }
    try {
      loesche(kontext.db, id)
    } catch (fehler) {
      if (fehler instanceof LoeschschutzFehler) throw ApiFehler.geschuetzt(fehler.text)
      throw fehler
    }
    return { geloescht: true }
  })

  app.post('/api/katalog/:id/duplikat', async (anfrage, ausgabe) => {
    const store = new SqliteCatalogStore(kontext.db, kontext.konfiguration.assetOrdner)
    const id = (anfrage.params as { id: string }).id
    if (!leseEine(kontext.db, id)) {
      throw ApiFehler.nichtGefunden(serverText('server.katalog.komponenteNichtGefunden'))
    }
    const koerper = (anfrage.body ?? {}) as { zielKatalogId?: unknown }
    const zielKatalogId =
      typeof koerper.zielKatalogId === 'string' && koerper.zielKatalogId.length > 0
        ? koerper.zielKatalogId
        : undefined
    if (zielKatalogId !== undefined && !leseKatalog(kontext.db, zielKatalogId)) {
      throw ApiFehler.nichtGefunden(serverText('server.kataloge.zielNichtGefunden'))
    }
    void ausgabe.status(201)
    return await store.duplicate(id, zielKatalogId)
  })
}
