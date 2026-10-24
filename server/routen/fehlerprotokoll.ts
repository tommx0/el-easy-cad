import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Fehlerprotokollierer } from '../fehlerprotokoll'
import { leseFehlerprotokoll } from '../fehlerprotokoll'
import type { ServerKontext } from '../server'

const CLIENT_EINGABE_SCHEMA = z.object({
  nachricht: z.string().trim().min(1).max(2000),
  stack: z.string().max(20000).optional(),
  kontext: z.string().max(2000).optional(),
})

export function registriereFehlerprotokollRouten(
  app: FastifyInstance,
  kontext: ServerKontext,
  fehlerprotokollierer: Fehlerprotokollierer,
): void {
  app.get('/api/fehlerprotokoll', () =>
    leseFehlerprotokoll(kontext.konfiguration.fehlerprotokollDatei),
  )

  app.post('/api/fehlerprotokoll', async (anfrage, ausgabe) => {
    const eingabe = CLIENT_EINGABE_SCHEMA.parse(anfrage.body)
    fehlerprotokollierer.protokolliere({
      quelle: 'client',
      nachricht: eingabe.nachricht,
      stack: eingabe.stack,
      kontext: eingabe.kontext,
    })
    void ausgabe.status(204).send()
  })
}
