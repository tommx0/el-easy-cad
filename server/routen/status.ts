import type { FastifyInstance } from 'fastify'
import { APP_VERSION } from '../app-version'
import { leseSchemaVersion } from '../db/migrationen'
import type { ServerKontext } from '../server'

function anzahl(kontext: ServerKontext, tabelle: string): number {
  const zeile = kontext.db.prepare(`SELECT COUNT(*) AS n FROM ${tabelle}`).get() as { n: number }
  return zeile.n
}

export function registriereStatusRouten(app: FastifyInstance, kontext: ServerKontext): void {
  app.get('/api/status', () => ({
    name: 'el.easy.CAD',
    version: APP_VERSION,
    schemaVersion: leseSchemaVersion(kontext.db),
    datenordner: kontext.konfiguration.datenordner,
    oberflaeche: kontext.konfiguration.statischesVerzeichnis !== null,
    bestand: {
      projekte: anzahl(kontext, 'projekte'),
      dokumente: anzahl(kontext, 'dokumente'),
      katalogKomponenten: anzahl(kontext, 'katalog_komponenten'),
      assets: anzahl(kontext, 'assets'),
    },
  }))
}
