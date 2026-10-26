import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  istGueltigerEinstellungsSchluessel,
  vergleicheVersionen,
  ZUSATZMODUL_ENTWICKLUNG_VORSATZ,
  type ZusatzmodulEintrag,
  type ZusatzmodulEntwicklung,
  type ZusatzmodulVorschau,
} from '../../src/document-model'
import { APP_VERSION } from '../app-version'
import {
  leseZusatzmodul,
  loescheZusatzmodul,
  schreibeZusatzmodul,
  setzeZusatzmodulAktiv,
  setzeZusatzmodulKi,
} from '../db/zusatzmodule'
import {
  leseEntwicklung,
  leseModulEinstellung,
  loescheModulEinstellungen,
  MODUL_EINSTELLUNG_GROESSE_MAX,
  schreibeEntwicklung,
  schreibeModulEinstellung,
} from '../db/zusatzmodul-einstellungen'
import { ApiFehler } from '../fehler'
import { entwicklungsFund, zusatzmodulBestand } from '../module/bestand'
import { leseEntwicklungsDatei, leseEntwicklungsordner } from '../module/entwicklung'
import { entferneModulDateien, leseModulDatei, legeModulAb } from '../module/ablage'
import { MODUL_GROESSE_MAX, ModulPaketFehler, pruefeModulPaket } from '../module/paket'
import { alsText, serverText, uebersetzerFuer } from '../sprache'
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

  app.get('/api/zusatzmodule', (): ZusatzmodulEintrag[] => zusatzmodulBestand(kontext.db))

  function entwicklungsAntwort(anfrage: FastifyRequest): ZusatzmodulEntwicklung {
    const einstellung = leseEntwicklung(kontext.db)
    const fund = einstellung.ordner.trim() ? leseEntwicklungsordner(einstellung.ordner) : null
    return {
      ...einstellung,
      modul: fund?.ok ? fund.manifest : null,
      stand: fund?.ok ? fund.stand : null,
      fehler: fund && !fund.ok ? alsText(fund.fehler, uebersetzerFuer(anfrage)) : null,
    }
  }

  app.get('/api/zusatzmodule-entwicklung', (anfrage) => entwicklungsAntwort(anfrage))

  app.put('/api/zusatzmodule-entwicklung', (anfrage) => {
    const koerper = (anfrage.body ?? {}) as { aktiv?: unknown; ordner?: unknown }
    if (typeof koerper.aktiv !== 'boolean' || typeof koerper.ordner !== 'string') {
      throw ApiFehler.ungueltig(serverText('server.fehler.ungueltigeDaten'))
    }
    schreibeEntwicklung(kontext.db, { aktiv: koerper.aktiv, ordner: koerper.ordner.slice(0, 1000) })
    return entwicklungsAntwort(anfrage)
  })

  function pruefeSchluessel(schluessel: string): void {
    if (!istGueltigerEinstellungsSchluessel(schluessel)) {
      throw ApiFehler.ungueltig(serverText('server.zusatzmodule.schluesselUngueltig'))
    }
  }

  app.get('/api/zusatzmodule/:kennung/einstellungen/:schluessel', (anfrage) => {
    const { kennung, schluessel } = anfrage.params as { kennung: string; schluessel: string }
    pruefeSchluessel(schluessel)
    return { wert: leseModulEinstellung(kontext.db, kennung, schluessel) }
  })

  app.put('/api/zusatzmodule/:kennung/einstellungen/:schluessel', (anfrage) => {
    const { kennung, schluessel } = anfrage.params as { kennung: string; schluessel: string }
    pruefeSchluessel(schluessel)
    const wert = ((anfrage.body ?? {}) as { wert?: unknown }).wert
    if (JSON.stringify(wert ?? null).length > MODUL_EINSTELLUNG_GROESSE_MAX) {
      throw ApiFehler.ungueltig(
        serverText('server.zusatzmodule.einstellungZuGross', {
          hoechstens: String(MODUL_EINSTELLUNG_GROESSE_MAX / 1024),
        }),
      )
    }
    schreibeModulEinstellung(kontext.db, kennung, schluessel, wert)
    return { gespeichert: true }
  })

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
    const koerper = (anfrage.body ?? {}) as {
      aktiv?: unknown
      fehler?: unknown
      kiFreigabe?: unknown
    }
    const hatAktiv = typeof koerper.aktiv === 'boolean'
    const hatKi = typeof koerper.kiFreigabe === 'boolean'
    if (!hatAktiv && !hatKi) throw ApiFehler.ungueltig(serverText('server.fehler.ungueltigeDaten'))
    if (!leseZusatzmodul(kontext.db, kennung)) throw nichtInstalliert()
    if (hatAktiv) {
      const fehler = typeof koerper.fehler === 'string' ? koerper.fehler.slice(0, 2000) : null
      setzeZusatzmodulAktiv(kontext.db, kennung, koerper.aktiv as boolean, fehler)
    }
    if (hatKi) setzeZusatzmodulKi(kontext.db, kennung, koerper.kiFreigabe as boolean)
    return leseZusatzmodul(kontext.db, kennung)
  })

  app.delete('/api/zusatzmodule/:kennung', (anfrage) => {
    const kennung = (anfrage.params as { kennung: string }).kennung
    if (!loescheZusatzmodul(kontext.db, kennung)) throw nichtInstalliert()
    entferneModulDateien(datenordner, kennung)
    const behalten = (anfrage.query as { einstellungen?: string } | undefined)?.einstellungen
    if (behalten !== 'behalten') loescheModulEinstellungen(kontext.db, kennung)
    return { geloescht: true }
  })

  app.get('/api/zusatzmodule/:kennung/:version/*', (anfrage, ausgabe) => {
    const params = anfrage.params as { kennung: string; version: string; '*': string }
    let inhalt: Buffer | null
    if (params.version.startsWith(ZUSATZMODUL_ENTWICKLUNG_VORSATZ)) {
      const fund = entwicklungsFund(kontext.db)
      if (!fund?.ok || fund.manifest.kennung !== params.kennung) throw nichtInstalliert()
      inhalt = leseEntwicklungsDatei(fund.ordner, params['*'])
    } else {
      const eintrag = leseZusatzmodul(kontext.db, params.kennung)
      if (!eintrag || eintrag.manifest.version !== params.version) throw nichtInstalliert()
      inhalt = leseModulDatei(datenordner, params.kennung, params.version, params['*'])
    }
    if (!inhalt) {
      throw ApiFehler.nichtGefunden(serverText('server.zusatzmodule.dateiNichtGefunden'))
    }
    void ausgabe.header('content-type', inhaltstyp(params['*'])).header('cache-control', 'no-cache')
    return inhalt
  })
}
