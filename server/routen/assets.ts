import type { FastifyInstance } from 'fastify'
import {
  assetDateiGroesse,
  berechneHash,
  istGueltigerHash,
  liesAssetDatei,
  schreibeAssetDatei,
} from '../assets/speicher'
import { holeAsset, legeAssetAn } from '../db/assets'
import { jetzt } from '../db/hilfen'
import { ApiFehler } from '../fehler'
import { serverText } from '../sprache'
import type { ServerKontext } from '../server'

export const ASSET_GROESSE_MAX = 100 * 1024 * 1024

export function registriereAssetRouten(app: FastifyInstance, kontext: ServerKontext): void {
  app.post('/api/assets', { bodyLimit: ASSET_GROESSE_MAX }, (anfrage, ausgabe) => {
    const daten = anfrage.body
    if (!Buffer.isBuffer(daten) || daten.length === 0) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.dateiinhaltFehlt'))
    }

    const id = berechneHash(daten)
    const dateiname = (anfrage.query as { dateiname?: string } | undefined)?.dateiname ?? null
    const mime = anfrage.headers['content-type'] ?? 'application/octet-stream'

    schreibeAssetDatei(kontext.konfiguration.assetOrdner, id, daten)
    const { asset, neu } = legeAssetAn(kontext.db, {
      id,
      mime: mime.split(';')[0]?.trim() ?? 'application/octet-stream',
      groesse: daten.length,
      dateiname,
      erstelltAm: jetzt(),
    })

    void ausgabe.status(neu ? 201 : 200)
    return { ...asset, neu }
  })

  app.get('/api/assets/:id', (anfrage, ausgabe) => {
    const id = (anfrage.params as { id: string }).id
    if (!istGueltigerHash(id))
      throw ApiFehler.ungueltig(serverText('server.assets.kennungUngueltig'))

    const meta = holeAsset(kontext.db, id)
    const daten = liesAssetDatei(kontext.konfiguration.assetOrdner, id)
    if (!meta || !daten) throw ApiFehler.nichtGefunden(serverText('server.assets.nichtGefunden'))

    void ausgabe
      .header('content-type', meta.mime)
      .header('cache-control', 'public, max-age=31536000, immutable')
    return daten
  })

  app.get('/api/assets/:id/meta', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    if (!istGueltigerHash(id))
      throw ApiFehler.ungueltig(serverText('server.assets.kennungUngueltig'))
    const meta = holeAsset(kontext.db, id)
    if (!meta) throw ApiFehler.nichtGefunden(serverText('server.assets.nichtGefunden'))
    return {
      ...meta,
      dateiVorhanden: assetDateiGroesse(kontext.konfiguration.assetOrdner, id) !== undefined,
    }
  })
}
