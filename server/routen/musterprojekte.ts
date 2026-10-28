import type { FastifyInstance } from 'fastify'
import { istMusterArt } from '../../src/persistence/musterprojekte'
import { ApiFehler } from '../fehler'
import { legeMusterprojektAn, legeMusterprojekteBeimErstenStartAn } from '../musterprojekte'
import type { ServerKontext } from '../server'
import { anfrageSprache, serverText } from '../sprache'

export function registriereMusterprojektRouten(app: FastifyInstance, kontext: ServerKontext): void {
  const { db, konfiguration } = kontext

  app.post('/api/musterprojekte/erster-start', (anfrage) => ({
    angelegt: konfiguration.musterprojekteBeimStart
      ? legeMusterprojekteBeimErstenStartAn(db, konfiguration.assetOrdner, anfrageSprache(anfrage))
      : [],
  }))

  app.post<{ Params: { muster: string } }>('/api/musterprojekte/:muster', (anfrage) => {
    const { muster } = anfrage.params
    if (!istMusterArt(muster)) {
      throw ApiFehler.nichtGefunden(serverText('server.projekte.musterUnbekannt'))
    }
    return legeMusterprojektAn(db, konfiguration.assetOrdner, muster, anfrageSprache(anfrage))
  })
}
