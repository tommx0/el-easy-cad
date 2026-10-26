import type { KeyObject } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import fastifyStatic from '@fastify/static'
import Fastify, { type FastifyInstance } from 'fastify'
import { ApiFehler, nichtGefundenAntwort, registriereFehlerbehandlung } from './fehler'
import { serverText, uebersetzerFuer } from './sprache'
import { erzeugeFehlerprotokollierer } from './fehlerprotokoll'
import type { Konfiguration } from './konfiguration'
import { ermittleBetriebsmodusStatus } from './demo/betriebsmodus'
import { leseOeffentlichenSchluessel } from './produktlizenz/schluessel'
import { ASSET_GROESSE_MAX, registriereAssetRouten } from './routen/assets'
import { registriereAustauschRouten } from './routen/austausch'
import { registriereDokumentRouten } from './routen/dokumente'
import { registriereEinstellungsRouten } from './routen/einstellungen'
import { registriereRegelwerkRouten } from './routen/regelwerk'
import { registriereFehlerprotokollRouten } from './routen/fehlerprotokoll'
import { registriereKatalogRouten } from './routen/katalog'
import { registriereKiRouten } from './routen/ki'
import { KiBruecke } from './mcp/bruecke'
import { registriereKatalogRegisterRouten } from './routen/kataloge'
import { registriereKabeltypRouten } from './routen/kabeltypen'
import { registriereInstallationszonenRouten } from './routen/installationszonen'
import { registriereProjektRouten } from './routen/projekte'
import { registriereProduktlizenzRouten } from './routen/produktlizenz'
import { registriereStatusRouten } from './routen/status'
import { registriereZusatzmodulRouten } from './routen/zusatzmodule'

export interface ServerKontext {
  db: DatabaseSync
  konfiguration: Konfiguration
}

export interface ServerOptionen {
  protokoll?: boolean
  lizenzPruefung?: boolean
  demoPruefung?: boolean
  oeffentlicherSchluessel?: KeyObject
}

export async function erzeugeServer(
  kontext: ServerKontext,
  optionen: ServerOptionen = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: optionen.protokoll ?? false })

  app.addContentTypeParser(
    '*',
    { parseAs: 'buffer', bodyLimit: ASSET_GROESSE_MAX },
    (_a, koerper, fertig) => {
      fertig(null, koerper)
    },
  )

  const fehlerprotokollierer = erzeugeFehlerprotokollierer(
    kontext.konfiguration.fehlerprotokollDatei,
  )
  registriereFehlerbehandlung(app, fehlerprotokollierer)

  const oeffentlicherSchluessel = optionen.oeffentlicherSchluessel ?? leseOeffentlichenSchluessel()
  const OHNE_LIZENZ_ERLAUBTE_PFADE = new Set([
    '/api/status',
    '/api/produktlizenz',
    '/api/fehlerprotokoll',
  ])
  const lizenzPruefungAktiv = optionen.lizenzPruefung ?? true
  const demoPruefungAktiv = optionen.demoPruefung ?? true

  app.addHook('onRequest', async (anfrage) => {
    if (!lizenzPruefungAktiv) return
    if (!anfrage.url.startsWith('/api')) return
    const pfad = anfrage.url.split('?')[0] ?? anfrage.url
    if (OHNE_LIZENZ_ERLAUBTE_PFADE.has(pfad)) return
    const ermittlung = ermittleBetriebsmodusStatus(
      kontext,
      oeffentlicherSchluessel,
      demoPruefungAktiv,
    )
    if (ermittlung.betriebsmodus === 'lizenziert' || ermittlung.betriebsmodus === 'demo') return
    throw ApiFehler.lizenzErforderlich(serverText('server.lizenz.erforderlich'))
  })

  registriereStatusRouten(app, kontext)
  registriereFehlerprotokollRouten(app, kontext, fehlerprotokollierer)
  registriereProduktlizenzRouten(app, kontext, oeffentlicherSchluessel, demoPruefungAktiv)
  registriereProjektRouten(app, kontext)
  const demoOptionen = {
    demoDurchsetzungAktiv: lizenzPruefungAktiv && demoPruefungAktiv,
    oeffentlicherSchluessel,
  }
  registriereDokumentRouten(app, kontext, demoOptionen)
  registriereAssetRouten(app, kontext)
  registriereKatalogRouten(app, kontext)
  registriereKatalogRegisterRouten(app, kontext)
  registriereKabeltypRouten(app, kontext)
  registriereInstallationszonenRouten(app, kontext)
  registriereEinstellungsRouten(app, kontext)
  registriereRegelwerkRouten(app, kontext)
  registriereAustauschRouten(app, kontext, demoOptionen)
  registriereKiRouten(app, kontext, new KiBruecke())
  registriereZusatzmodulRouten(app, kontext)

  const statisch = kontext.konfiguration.statischesVerzeichnis
  if (statisch) {
    await app.register(fastifyStatic, { root: statisch, index: ['index.html'] })
  }

  app.setNotFoundHandler((anfrage, ausgabe) => {
    const istApi = anfrage.url.startsWith('/api') || anfrage.url.startsWith('/.well-known/')
    if (statisch && !istApi && anfrage.method === 'GET') {
      void ausgabe.sendFile('index.html')
      return
    }
    void ausgabe
      .status(404)
      .send(nichtGefundenAntwort(anfrage.method, anfrage.url, uebersetzerFuer(anfrage)))
  })

  return app
}
