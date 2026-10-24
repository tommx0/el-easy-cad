import type { FastifyInstance } from 'fastify'
import {
  zonenDefinition,
  zonenDefinitionSchema,
  type ZonenDefinition,
} from '../../src/document-model'
import {
  leseAlleInstallationszonen,
  leseInstallationszone,
  loescheInstallationszone,
  schreibeInstallationszone,
  ZonenLoeschschutzFehler,
} from '../db/installationszonen'
import { ApiFehler } from '../fehler'
import { serverText } from '../sprache'
import type { ServerKontext } from '../server'

export function registriereInstallationszonenRouten(
  app: FastifyInstance,
  kontext: ServerKontext,
): void {
  app.get('/api/installationszonen', () => leseAlleInstallationszonen(kontext.db))

  app.put('/api/installationszonen/:id', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    const zone = zonenDefinitionSchema.parse(anfrage.body ?? {}) as ZonenDefinition
    if (zone.id !== id) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.kennungAbweichend'))
    }
    const standard = zonenDefinition(id)
    const gespeichert: ZonenDefinition = standard
      ? { ...(leseInstallationszone(kontext.db, id) ?? standard), aktiv: zone.aktiv }
      : { ...zone, herkunft: 'benutzer', seedVersion: undefined }
    schreibeInstallationszone(kontext.db, gespeichert)
    return gespeichert
  })

  app.delete('/api/installationszonen/:id', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    if (!leseInstallationszone(kontext.db, id))
      throw ApiFehler.nichtGefunden(serverText('server.installationszonen.nichtGefunden'))
    try {
      loescheInstallationszone(kontext.db, id)
    } catch (fehler) {
      if (fehler instanceof ZonenLoeschschutzFehler) throw ApiFehler.geschuetzt(fehler.text)
      throw fehler
    }
    return { geloescht: true }
  })
}
