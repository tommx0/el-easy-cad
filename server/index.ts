import { seedKatalogRegister } from '../src/persistence/catalog-seed'
import { seedKabeltypen } from '../src/persistence/kabeltyp-seed'
import { seedInstallationszonen } from '../src/persistence/installationszonen-seed'
import { raeumeVerwaisteAssetsAuf } from './assets/aufraeumen'
import { oeffneDatenbank } from './db/datenbank'
import { erzeugeFehlerprotokollierer } from './fehlerprotokoll'
import { KonfigurationsFehler, leseKonfiguration, type Konfiguration } from './konfiguration'
import { SqliteCatalogStore } from './db/katalog'
import { stelleAufStandardschutzUm } from './katalog-umstellung'
import { SqliteKabeltypStore } from './db/kabeltypen'
import { SqliteInstallationszonenStore } from './db/installationszonen'
import {
  leseEntwicklungsOeffentlichenSchluessel,
  leseEntwicklungsPrivatenSchluessel,
} from './produktlizenz/entwicklungsschluessel'
import {
  LIZENZ_MODULE,
  leseLizenzDatei,
  lizenzModule,
  pruefeProduktlizenz,
  schreibeLizenzDatei,
  signiereLizenz,
} from './produktlizenz/produktlizenz'
import { erzeugeServer } from './server'
import { STDIO_SCHALTER, TOKEN_UMGEBUNG, starteStdioWeiterleitung } from './mcp/stdio-weiterleitung'

const ENTWICKLUNGSBETRIEB = process.env.EL_EASY_CAD_ENTWICKLUNGSLIZENZ === '1'

const ENTWICKLUNGS_LIZENZNEHMER = 'Entwicklung (pnpm dev)'

function stelleEntwicklungslizenzSicher(konfiguration: Konfiguration): void {
  const vorhandene = leseLizenzDatei(konfiguration.lizenzDatei)
  if (vorhandene !== undefined) {
    const pruefung = pruefeProduktlizenz(vorhandene, leseEntwicklungsOeffentlichenSchluessel())
    const veralteteDevLizenz =
      pruefung.lizenz?.lizenznehmer === ENTWICKLUNGS_LIZENZNEHMER &&
      lizenzModule(pruefung.lizenz).length < LIZENZ_MODULE.length
    if (pruefung.status === 'gueltig' && !veralteteDevLizenz) return
  }
  const lizenz = signiereLizenz(
    {
      formatVersion: 1,
      lizenznehmer: ENTWICKLUNGS_LIZENZNEHMER,
      gueltigAb: '2020-01-01',
      gueltigBis: '2099-12-31',
      zusatz: { module: [...LIZENZ_MODULE] },
    },
    leseEntwicklungsPrivatenSchluessel(),
  )
  schreibeLizenzDatei(konfiguration.lizenzDatei, lizenz)
}

async function starte(): Promise<void> {
  const konfiguration = leseKonfiguration()

  const prozessFehlerprotokollierer = erzeugeFehlerprotokollierer(
    konfiguration.fehlerprotokollDatei,
  )
  process.on('uncaughtException', (fehler) => {
    prozessFehlerprotokollierer.protokolliere({
      quelle: 'server',
      stufe: 'FEHLER',
      nachricht: `Unbehandelte Exception: ${fehler.message}`,
      stack: fehler.stack,
    })
  })
  process.on('unhandledRejection', (grund) => {
    prozessFehlerprotokollierer.protokolliere({
      quelle: 'server',
      stufe: 'FEHLER',
      nachricht: `Unbehandelte Promise-Ablehnung: ${grund instanceof Error ? grund.message : String(grund)}`,
      stack: grund instanceof Error ? grund.stack : undefined,
    })
  })

  const { db, migration } = oeffneDatenbank(konfiguration.datenbankDatei)
  if (ENTWICKLUNGSBETRIEB) stelleEntwicklungslizenzSicher(konfiguration)
  const app = await erzeugeServer(
    { db, konfiguration },
    {
      protokoll: true,
      lizenzPruefung: true,
      oeffentlicherSchluessel: ENTWICKLUNGSBETRIEB
        ? leseEntwicklungsOeffentlichenSchluessel()
        : undefined,
    },
  )

  const katalog = new SqliteCatalogStore(db, konfiguration.assetOrdner)
  const umstellung = await stelleAufStandardschutzUm(db, konfiguration.assetOrdner)
  if (umstellung.gesichert.length > 0) {
    app.log.info(umstellung, 'Angepasste Standardkomponenten als eigene Komponenten gesichert')
  }
  const vorher = (await katalog.getComponents()).length
  await seedKatalogRegister(katalog)
  const nachher = (await katalog.getComponents()).length
  if (nachher !== vorher) {
    app.log.info({ vorher, nachher }, 'Standardkomponenten des Katalogs nachgezogen')
  }

  const kabeltypen = new SqliteKabeltypStore(db)
  const kabeltypenVorher = (await kabeltypen.alle()).length
  await seedKabeltypen(kabeltypen)
  const kabeltypenNachher = (await kabeltypen.alle()).length
  if (kabeltypenNachher !== kabeltypenVorher) {
    app.log.info(
      { vorher: kabeltypenVorher, nachher: kabeltypenNachher },
      'Mitgelieferte Kabeltypen nachgezogen',
    )
  }

  await seedInstallationszonen(new SqliteInstallationszonenStore(db))

  const aufgeraeumt = raeumeVerwaisteAssetsAuf(db, konfiguration.assetOrdner)
  if (aufgeraeumt.entfernt.length > 0) {
    app.log.info(
      { anzahl: aufgeraeumt.entfernt.length, freigegeben: aufgeraeumt.freigegeben },
      'Verwaiste Assets entfernt',
    )
  }

  if (migration.angewendet.length > 0) {
    app.log.info(
      { von: migration.vorher, auf: migration.nachher, schritte: migration.angewendet },
      'Datenbankschema migriert',
    )
  }

  const beende = (signal: string) => {
    void (async () => {
      app.log.info({ signal }, 'Server wird beendet')
      await app.close()
      db.close()
      process.exit(0)
    })()
  }
  process.on('SIGINT', () => beende('SIGINT'))
  process.on('SIGTERM', () => beende('SIGTERM'))

  await app.listen({ port: konfiguration.port, host: konfiguration.host })
  app.log.info({ datenordner: konfiguration.datenordner }, 'Datenordner')
}

function starteWeiterleitung(): Promise<void> {
  const { port } = leseKonfiguration()
  return starteStdioWeiterleitung({
    adresse: `http://127.0.0.1:${port}/mcp`,
    token: process.env[TOKEN_UMGEBUNG]?.trim() || null,
    eingabe: process.stdin,
    ausgabe: process.stdout,
    meldung: (text) => console.error(`el.easy.CAD: ${text}`),
  })
}

const programm = process.argv.includes(STDIO_SCHALTER) ? starteWeiterleitung() : starte()

programm.catch((fehler: unknown) => {
  if (fehler instanceof KonfigurationsFehler) {
    console.error(`Konfigurationsfehler: ${fehler.message}`)
  } else {
    console.error('Server konnte nicht gestartet werden:', fehler)
  }
  process.exit(1)
})
