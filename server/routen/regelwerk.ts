import type { FastifyInstance } from 'fastify'
import { geraeteRegelwerkSchema } from '../../src/document-model'
import { gueltigesRegelwerk, uebernimmRegelwerk } from '../db/regelwerk'
import { ApiFehler } from '../fehler'
import { serverText } from '../sprache'
import type { ServerKontext } from '../server'

export function registriereRegelwerkRouten(app: FastifyInstance, kontext: ServerKontext): void {
  app.get('/api/regelwerk', () => gueltigesRegelwerk(kontext.db))

  app.post('/api/regelwerk', (anfrage) => {
    const geprueft = geraeteRegelwerkSchema.safeParse(anfrage.body ?? {})
    if (!geprueft.success) throw ApiFehler.ungueltig(serverText('server.regelwerk.ungueltig'))
    return uebernimmRegelwerk(kontext.db, geprueft.data)
  })
}
