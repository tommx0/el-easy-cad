import type { FastifyInstance } from 'fastify'
import { appSettingsPatchSchema } from '../../src/persistence/settings-store'
import { leseEinstellungen, schreibeEinstellungen } from '../db/einstellungen'
import { synchronisiereReferenzen } from '../db/assets'
import type { ServerKontext } from '../server'

const FIRMENLOGO_QUELLE_ID = 'firmenlogo'

export function registriereEinstellungsRouten(app: FastifyInstance, kontext: ServerKontext): void {
  app.get('/api/einstellungen', () => leseEinstellungen(kontext.db))

  app.put('/api/einstellungen', (anfrage) => {
    const patch = appSettingsPatchSchema.parse(anfrage.body ?? {})
    schreibeEinstellungen(kontext.db, patch)
    const aktuell = leseEinstellungen(kontext.db)
    synchronisiereReferenzen(
      kontext.db,
      'katalog',
      FIRMENLOGO_QUELLE_ID,
      aktuell.firmenlogoAssetId ? [aktuell.firmenlogoAssetId] : [],
    )
    return aktuell
  })
}
