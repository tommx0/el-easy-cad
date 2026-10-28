import { unzipSync, zipSync } from 'fflate'
import type { DatabaseSync } from 'node:sqlite'
import {
  catalogComponentSchema,
  erzeugeId,
  katalogSchema,
  planeStandardAbgleich,
  SEED_VERSION_STANDARD,
  type CatalogComponent,
  type Katalog,
  type StandardAbgleichPlan,
} from '../../src/document-model'
import { liesAssetDatei } from '../assets/speicher'
import { holeAsset, sammleAssetIds, type AssetMeta } from '../db/assets'
import { inTransaktion } from '../db/datenbank'
import { leseAlle, leseEine, leseGefiltert, schreibe } from '../db/katalog'
import { leseKatalog, schreibeKatalog } from '../db/kataloge'
import { PaketFehler, uebernimmAssets } from './paket'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

export const KATALOG_PAKET_VERSION = 1

export interface KatalogPaketInhalt {
  paketVersion: number
  erzeugtAm: string
  anwendung: string
  katalog: Katalog
  komponenten: CatalogComponent[]
  assets: AssetMeta[]
  herkunftTestversion?: boolean
}

const KATALOG_DATEI = 'katalog.json'
const ASSET_ORDNER = 'assets/'

export function packeKatalog(
  db: DatabaseSync,
  assetOrdner: string,
  katalog: Katalog,
  ausTestversion = false,
): Uint8Array {
  const komponenten = leseGefiltert(db, { katalogId: katalog.id })

  const assetIds = new Set<string>()
  for (const komponente of komponenten) {
    for (const id of sammleAssetIds(komponente)) assetIds.add(id)
  }

  const assets: AssetMeta[] = []
  const dateien: Record<string, Uint8Array> = {}
  for (const id of assetIds) {
    const meta = holeAsset(db, id)
    const daten = liesAssetDatei(assetOrdner, id)
    if (meta) assets.push(meta)
    if (daten) dateien[`${ASSET_ORDNER}${id}`] = new Uint8Array(daten)
  }

  const inhalt: KatalogPaketInhalt = {
    paketVersion: KATALOG_PAKET_VERSION,
    erzeugtAm: new Date().toISOString(),
    anwendung: 'el.esy.CAD',
    katalog,
    komponenten,
    assets,
    ...(ausTestversion ? { herkunftTestversion: true } : {}),
  }
  dateien[KATALOG_DATEI] = new TextEncoder().encode(JSON.stringify(inhalt, null, 2))
  return zipSync(dateien, { level: 0, mtime: new Date() })
}

export interface EntpacktesKatalogPaket {
  inhalt: KatalogPaketInhalt
  assetDaten: Map<string, Uint8Array>
}

export function entpackeKatalog(bytes: Uint8Array): EntpacktesKatalogPaket {
  let dateien: Record<string, Uint8Array>
  try {
    dateien = unzipSync(bytes)
  } catch {
    throw new PaketFehler(serverText('server.austausch.keinKatalogpaket'))
  }

  const katalogDatei = dateien[KATALOG_DATEI]
  if (!katalogDatei)
    throw new PaketFehler(serverText('server.austausch.dateiFehlt', { datei: KATALOG_DATEI }))

  let roh: KatalogPaketInhalt
  try {
    roh = JSON.parse(new TextDecoder().decode(katalogDatei)) as KatalogPaketInhalt
  } catch {
    throw new PaketFehler(serverText('server.austausch.keinJson', { datei: KATALOG_DATEI }))
  }
  if (roh.paketVersion > KATALOG_PAKET_VERSION) {
    throw new PaketFehler(
      serverText('server.austausch.neuereVersion', { version: String(roh.paketVersion) }),
    )
  }

  const katalog = katalogSchema.safeParse(roh.katalog)
  if (!katalog.success || !Array.isArray(roh.komponenten)) {
    throw new PaketFehler(serverText('server.austausch.falscheForm', { datei: KATALOG_DATEI }))
  }
  const komponenten: CatalogComponent[] = []
  for (const eintrag of roh.komponenten) {
    const geparst = catalogComponentSchema.safeParse(eintrag)
    if (!geparst.success) {
      throw new PaketFehler(serverText('server.austausch.unbekannteKomponente'))
    }
    komponenten.push(geparst.data as CatalogComponent)
  }

  const assetDaten = new Map<string, Uint8Array>()
  for (const [name, daten] of Object.entries(dateien)) {
    if (!name.startsWith(ASSET_ORDNER)) continue
    assetDaten.set(name.slice(ASSET_ORDNER.length), daten)
  }
  return {
    inhalt: { ...roh, katalog: katalog.data as Katalog, komponenten, assets: roh.assets ?? [] },
    assetDaten,
  }
}

export type KatalogKonfliktbehandlung = 'ersetzen' | 'kopie'

export class KatalogImportKonflikt extends Error {
  readonly katalogId: string
  readonly katalogName: string
  readonly nurKopie: boolean

  readonly text: ServerText

  constructor(katalogId: string, katalogName: string, nurKopie: boolean) {
    const text = serverText(
      nurKopie ? 'server.austausch.katalogNurKopie' : 'server.austausch.katalogVorhanden',
      { name: katalogName },
    )
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'KatalogImportKonflikt'
    this.katalogId = katalogId
    this.katalogName = katalogName
    this.nurKopie = nurKopie
  }
}

export interface KatalogImportErgebnis {
  katalogId: string
  name: string
  komponenten: number
  assetsNeu: number
  ersetzt: boolean
  alsKopie: boolean
  standard?: StandardkatalogZahlen
}

export interface StandardkatalogZahlen {
  katalogNeu: boolean
  neu: number
  aktualisiert: number
  unveraendert: number
  ausgemustert: number
  uebersprungen: number
  zurueckgezogen: boolean
}

export type KatalogImportVorschau =
  | ({ art: 'standard'; katalogId: string; name: string } & StandardkatalogZahlen)
  | { art: 'benutzer'; katalogId: string; name: string }

function istStandardkatalog(db: DatabaseSync, paket: EntpacktesKatalogPaket): boolean {
  if (paket.inhalt.katalog.herkunft !== 'standard') return false
  const vorhanden = leseKatalog(db, paket.inhalt.katalog.id)
  return !vorhanden || vorhanden.herkunft === 'standard'
}

function aktiveKomponenten(paket: EntpacktesKatalogPaket): CatalogComponent[] {
  return paket.inhalt.komponenten.filter((k) => !k.ausgemustert)
}

function standardPlan(db: DatabaseSync, paket: EntpacktesKatalogPaket): StandardAbgleichPlan {
  return planeStandardAbgleich(
    leseKatalog(db, paket.inhalt.katalog.id),
    leseAlle(db),
    paket.inhalt.katalog,
    aktiveKomponenten(paket),
  )
}

function zahlen(plan: StandardAbgleichPlan): StandardkatalogZahlen {
  return {
    katalogNeu: plan.katalog === 'anlegen',
    neu: plan.anlegen.length,
    aktualisiert: plan.ersetzen.length,
    unveraendert: plan.behalten.length,
    ausgemustert: plan.ausmustern.length,
    uebersprungen: plan.fremd.length,
    zurueckgezogen: plan.zurueckgezogen,
  }
}

export function vorschauKatalogPaket(db: DatabaseSync, bytes: Uint8Array): KatalogImportVorschau {
  const paket = entpackeKatalog(bytes)
  const { id: katalogId, name } = paket.inhalt.katalog
  if (!istStandardkatalog(db, paket)) return { art: 'benutzer', katalogId, name }
  return { art: 'standard', katalogId, name, ...zahlen(standardPlan(db, paket)) }
}

function spieleStandardkatalogEin(
  db: DatabaseSync,
  assetOrdner: string,
  paket: EntpacktesKatalogPaket,
): KatalogImportErgebnis {
  const assetsNeu = uebernimmAssets(db, assetOrdner, paket)
  return inTransaktion(db, () => {
    const plan = standardPlan(db, paket)
    const katalogId = paket.inhalt.katalog.id
    const vorhandenerKatalog = leseKatalog(db, katalogId)
    if (plan.katalog === 'anlegen' || plan.katalog === 'ersetzen') {
      schreibeKatalog(db, {
        ...paket.inhalt.katalog,
        herkunft: 'standard',
        aktiv: vorhandenerKatalog?.aktiv ?? true,
        seedVersion: paket.inhalt.katalog.seedVersion ?? SEED_VERSION_STANDARD,
      })
    }
    const zuSchreiben = new Set([...plan.anlegen, ...plan.ersetzen])
    const behalten = new Set(plan.behalten)
    for (const komponente of aktiveKomponenten(paket)) {
      if (zuSchreiben.has(komponente.id)) {
        const { ausgemustert: _a, abgeleitetVon: _b, ...inhalt } = komponente
        schreibe(db, {
          ...inhalt,
          katalogId,
          herkunft: 'standard',
          seedVersion: komponente.seedVersion ?? SEED_VERSION_STANDARD,
        })
      } else if (behalten.has(komponente.id)) {
        const vorhanden = leseEine(db, komponente.id)
        if (vorhanden && vorhanden.katalogId !== katalogId)
          schreibe(db, { ...vorhanden, katalogId })
      }
    }
    for (const id of plan.ausmustern) {
      const vorhanden = leseEine(db, id)
      if (vorhanden) schreibe(db, { ...vorhanden, ausgemustert: true })
    }
    return {
      katalogId,
      name: paket.inhalt.katalog.name,
      komponenten: aktiveKomponenten(paket).length,
      assetsNeu,
      ersetzt: false,
      alsKopie: false,
      standard: zahlen(plan),
    }
  })
}

export function importiereKatalogPaket(
  db: DatabaseSync,
  assetOrdner: string,
  bytes: Uint8Array,
  konflikt?: KatalogKonfliktbehandlung,
): KatalogImportErgebnis {
  const paket = entpackeKatalog(bytes)
  if (konflikt !== 'kopie' && istStandardkatalog(db, paket)) {
    return spieleStandardkatalogEin(db, assetOrdner, paket)
  }
  const vorhanden = leseKatalog(db, paket.inhalt.katalog.id)

  if (vorhanden && konflikt !== 'kopie') {
    if (!konflikt || vorhanden.herkunft === 'standard') {
      throw new KatalogImportKonflikt(
        vorhanden.id,
        vorhanden.name,
        vorhanden.herkunft === 'standard',
      )
    }
  }
  const alsKopie = Boolean(vorhanden) && konflikt === 'kopie'
  const ersetzt = Boolean(vorhanden) && konflikt === 'ersetzen'

  const assetsNeu = uebernimmAssets(db, assetOrdner, paket)

  return inTransaktion(db, () => {
    const katalogId = alsKopie ? erzeugeId('katalog-register') : paket.inhalt.katalog.id
    const katalog: Katalog = {
      ...paket.inhalt.katalog,
      id: katalogId,
      name: alsKopie ? `${paket.inhalt.katalog.name} (Kopie)` : paket.inhalt.katalog.name,
      herkunft: 'benutzer',
      seedVersion: undefined,
    }
    if (ersetzt) {
      db.prepare('DELETE FROM katalog_komponenten WHERE katalog_id = ?').run(katalogId)
    }
    schreibeKatalog(db, katalog)

    const vergeben = new Set<string>()
    const neueKennungNoetig = (id: string) =>
      alsKopie || vergeben.has(id) || leseEine(db, id) !== undefined

    for (const komponente of paket.inhalt.komponenten) {
      const id = neueKennungNoetig(komponente.id) ? erzeugeId('katalog') : komponente.id
      vergeben.add(id)
      schreibe(db, {
        ...komponente,
        id,
        katalogId,
        herkunft: 'benutzer',
        seedVersion: undefined,
        varianten: alsKopie
          ? komponente.varianten.map((v) => ({ ...v, id: erzeugeId('variante') }))
          : komponente.varianten,
      })
    }

    return {
      katalogId,
      name: katalog.name,
      komponenten: paket.inhalt.komponenten.length,
      assetsNeu,
      ersetzt,
      alsKopie,
    }
  })
}
