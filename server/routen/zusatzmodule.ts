import type { FastifyInstance } from 'fastify'
import { vergleicheVersionen, type ZusatzmodulVorschau } from '../../src/document-model'
import { APP_VERSION } from '../app-version'
import {
  leseZusatzmodul,
  leseZusatzmodule,
  loescheZusatzmodul,
  schreibeZusatzmodul,
  setzeZusatzmodulAktiv,
} from '../db/zusatzmodule'
import { ApiFehler } from '../fehler'
import { entferneModulDateien, leseModulDatei, legeModulAb } from '../module/ablage'
import { MODUL_GROESSE_MAX, ModulPaketFehler, pruefeModulPaket } from '../module/paket'
import { serverText } from '../sprache'
import type { ServerKontext } from '../server'

const INHALTSTYPEN: Record<string, string> = {
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  css: 'text/css; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

function inhaltstyp(pfad: string): string {
  const endung = pfad.split('.').pop()?.toLowerCase() ?? ''
  return INHALTSTYPEN[endung] ?? 'application/octet-stream'
}

function paketAusAnfrage(koerper: unknown): Uint8Array {
  if (!Buffer.isBuffer(koerper) || koerper.length === 0) {
    throw ApiFehler.ungueltig(serverText('server.anfrage.paketdateiFehlt'))
  }
  return new Uint8Array(koerper)
}

function pruefe(bytes: Uint8Array) {
  try {
    return pruefeModulPaket(bytes, APP_VERSION)
  } catch (fehler) {
    if (fehler instanceof ModulPaketFehler) throw ApiFehler.ungueltig(fehler.text)
    throw fehler
  }
}

function nichtInstalliert(): ApiFehler {
  return ApiFehler.nichtGefunden(serverText('server.zusatzmodule.nichtGefunden'))
}

export function registriereZusatzmodulRouten(app: FastifyInstance, kontext: ServerKontext): void {
  const datenordner = kontext.konfiguration.datenordner
  const bodyLimit = MODUL_GROESSE_MAX + 1024 * 1024

  app.get('/api/zusatzmodule', () => leseZusatzmodule(kontext.db))

  app.post('/api/zusatzmodule/vorschau', { bodyLimit }, (anfrage): ZusatzmodulVorschau => {
    const { manifest } = pruefe(paketAusAnfrage(anfrage.body))
    const installiert = leseZusatzmodul(kontext.db, manifest.kennung)?.manifest.version ?? null
    const d = installiert === null ? null : vergleicheVersionen(manifest.version, installiert)
    return {
      manifest,
      installiert,
      vergleich: d === null ? 'neu' : d > 0 ? 'neuer' : d === 0 ? 'gleich' : 'aelter',
    }
  })

  app.post('/api/zusatzmodule', { bodyLimit }, (anfrage) => {
    const modul = pruefe(paketAusAnfrage(anfrage.body))
    legeModulAb(datenordner, modul)
    return schreibeZusatzmodul(kontext.db, modul.manifest)
  })

  app.put('/api/zusatzmodule/:kennung', (anfrage) => {
    const kennung = (anfrage.params as { kennung: string }).kennung
    const koerper = (anfrage.body ?? {}) as { aktiv?: unknown; fehler?: unknown }
    if (typeof koerper.aktiv !== 'boolean') {
      throw ApiFehler.ungueltig(serverText('server.fehler.ungueltigeDaten'))
    }
    const fehler = typeof koerper.fehler === 'string' ? koerper.fehler.slice(0, 2000) : null
    const eintrag = setzeZusatzmodulAktiv(kontext.db, kennung, koerper.aktiv, fehler)
    if (!eintrag) throw nichtInstalliert()
    return eintrag
  })

  app.delete('/api/zusatzmodule/:kennung', (anfrage) => {
    const kennung = (anfrage.params as { kennung: string }).kennung
    if (!loescheZusatzmodul(kontext.db, kennung)) throw nichtInstalliert()
    entferneModulDateien(datenordner, kennung)
    return { geloescht: true }
  })

  app.get('/api/zusatzmodule/:kennung/:version/*', (anfrage, ausgabe) => {
    const params = anfrage.params as { kennung: string; version: string; '*': string }
    const eintrag = leseZusatzmodul(kontext.db, params.kennung)
    if (!eintrag || eintrag.manifest.version !== params.version) throw nichtInstalliert()
    const inhalt = leseModulDatei(datenordner, params.kennung, params.version, params['*'])
    if (!inhalt) {
      throw ApiFehler.nichtGefunden(serverText('server.zusatzmodule.dateiNichtGefunden'))
    }
    void ausgabe.header('content-type', inhaltstyp(params['*'])).header('cache-control', 'no-cache')
    return inhalt
  })
}
