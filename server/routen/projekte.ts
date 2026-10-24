import type { FastifyInstance, FastifyRequest } from 'fastify'
import { projektEingabeSchema, projektFilterSchema } from '../../src/document-model'
import {
  aendereProjekt,
  holeProjekt,
  kundenNamen,
  legeProjektAn,
  listePapierkorb,
  listeProjekte,
  loescheEndgueltig,
  stelleWiederHer,
  verschiebeInPapierkorb,
} from '../db/projekte'
import { loescheAssetDateien } from '../assets/speicher'
import { ApiFehler } from '../fehler'
import { serverText } from '../sprache'
import type { ServerKontext } from '../server'

function idAus(anfrage: FastifyRequest): string {
  return (anfrage.params as { id: string }).id
}

export function registriereProjektRouten(app: FastifyInstance, kontext: ServerKontext): void {
  app.get('/api/projekte', (anfrage) => {
    const filter = projektFilterSchema.parse(anfrage.query ?? {})
    return listeProjekte(kontext.db, filter)
  })

  app.post('/api/projekte', (anfrage, ausgabe) => {
    const eingabe = projektEingabeSchema.parse(anfrage.body ?? {})
    void ausgabe.status(201)
    return legeProjektAn(kontext.db, eingabe)
  })

  app.get('/api/projekte/:id', (anfrage) => {
    const projekt = holeProjekt(kontext.db, idAus(anfrage))
    if (!projekt) throw ApiFehler.nichtGefunden(serverText('server.projekte.nichtGefunden'))
    return projekt
  })

  app.put('/api/projekte/:id', (anfrage) => {
    const eingabe = projektEingabeSchema.parse(anfrage.body ?? {})
    const projekt = aendereProjekt(kontext.db, idAus(anfrage), eingabe)
    if (!projekt) throw ApiFehler.nichtGefunden(serverText('server.projekte.nichtGefunden'))
    return projekt
  })

  app.delete('/api/projekte/:id', (anfrage) => {
    const id = idAus(anfrage)
    const endgueltig = (anfrage.query as { endgueltig?: string } | undefined)?.endgueltig === '1'

    if (!endgueltig) {
      if (!verschiebeInPapierkorb(kontext.db, id)) {
        throw ApiFehler.nichtGefunden(serverText('server.projekte.nichtGefundenOderPapierkorb'))
      }
      return { papierkorb: true }
    }

    const ergebnis = loescheEndgueltig(kontext.db, id)
    if (!ergebnis) throw ApiFehler.nichtGefunden(serverText('server.projekte.nichtGefunden'))
    const freigegeben = loescheAssetDateien(kontext.konfiguration.assetOrdner, ergebnis.assets)
    return { papierkorb: false, ...ergebnis, freigegeben }
  })

  app.post('/api/projekte/:id/wiederherstellen', (anfrage) => {
    const projekt = stelleWiederHer(kontext.db, idAus(anfrage))
    if (!projekt) throw ApiFehler.nichtGefunden(serverText('server.projekte.nichtImPapierkorb'))
    return projekt
  })

  app.get('/api/papierkorb', () => listePapierkorb(kontext.db))

  app.get('/api/kunden', () => kundenNamen(kontext.db))
}
