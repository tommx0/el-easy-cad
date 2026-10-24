import type { DatabaseSync } from 'node:sqlite'
import {
  dupliziereCatalogComponent,
  type CatalogComponent,
  type Katalog,
} from '../../src/document-model'
import { catalogComponentSchema } from '../../src/document-model'
import type { KatalogStoreMitRegister } from '../../src/persistence/catalog-store'
import { leseAlleKataloge, leseKatalog, loescheKatalog, schreibeKatalog } from './kataloge'
import { berechneHash, liesAssetDatei, schreibeAssetDatei } from '../assets/speicher'
import { legeAssetAn, sammleAssetIds, synchronisiereReferenzen } from './assets'
import { inTransaktion } from './datenbank'
import { alleZeilen, eineZeile, jetzt } from './hilfen'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

export class SqliteCatalogStore implements KatalogStoreMitRegister {
  private readonly db: DatabaseSync
  private readonly assetOrdner: string

  constructor(db: DatabaseSync, assetOrdner: string) {
    this.db = db
    this.assetOrdner = assetOrdner
  }

  getComponents(): Promise<CatalogComponent[]> {
    return Promise.resolve(leseAlle(this.db))
  }

  getComponent(id: string): Promise<CatalogComponent | undefined> {
    return Promise.resolve(leseEine(this.db, id))
  }

  upsertComponent(c: CatalogComponent): Promise<void> {
    schreibe(this.db, c)
    return Promise.resolve()
  }

  deleteComponent(id: string): Promise<void> {
    loesche(this.db, id)
    return Promise.resolve()
  }

  duplicate(id: string, zielKatalogId?: string): Promise<CatalogComponent> {
    const original = leseEine(this.db, id)
    if (!original) throw new Error(`Katalogkomponente ${id} nicht gefunden.`)
    const kopie = dupliziereCatalogComponent(original, undefined, zielKatalogId)
    schreibe(this.db, kopie)
    return Promise.resolve(kopie)
  }

  getKataloge(): Promise<Katalog[]> {
    return Promise.resolve(leseAlleKataloge(this.db))
  }

  upsertKatalog(katalog: Katalog): Promise<void> {
    schreibeKatalog(this.db, katalog)
    return Promise.resolve()
  }

  deleteKatalog(id: string): Promise<number> {
    return Promise.resolve(loescheKatalog(this.db, id))
  }

  verschiebeKomponente(komponentenId: string, katalogId: string): Promise<void> {
    const komponente = leseEine(this.db, komponentenId)
    if (!komponente) throw new Error(`Katalogkomponente ${komponentenId} nicht gefunden.`)
    if (komponente.herkunft === 'standard') throw new VerschiebeschutzFehler(komponente.name)
    if (!leseKatalog(this.db, katalogId)) throw new Error(`Katalog ${katalogId} nicht gefunden.`)
    schreibe(this.db, { ...komponente, katalogId })
    return Promise.resolve()
  }

  async putImageBlob(blob: Blob): Promise<string> {
    const daten = Buffer.from(await blob.arrayBuffer())
    const id = berechneHash(daten)
    schreibeAssetDatei(this.assetOrdner, id, daten)
    legeAssetAn(this.db, {
      id,
      mime: blob.type || 'application/octet-stream',
      groesse: daten.length,
      dateiname: null,
      erstelltAm: jetzt(),
    })
    return id
  }

  getImageBlob(blobId: string): Promise<Blob | undefined> {
    const daten = liesAssetDatei(this.assetOrdner, blobId)
    return Promise.resolve(daten ? new Blob([new Uint8Array(daten)]) : undefined)
  }
}

interface KatalogZeile {
  daten: string
}

function geparst(zeile: KatalogZeile): CatalogComponent | null {
  try {
    const ergebnis = catalogComponentSchema.safeParse(JSON.parse(zeile.daten))
    return ergebnis.success ? (ergebnis.data as CatalogComponent) : null
  } catch {
    return null
  }
}

export function leseAlle(db: DatabaseSync): CatalogComponent[] {
  return alleZeilen<KatalogZeile>(
    db.prepare(
      `SELECT daten FROM katalog_komponenten
        ORDER BY hauptgruppe COLLATE NOCASE, untergruppe COLLATE NOCASE, name COLLATE NOCASE`,
    ),
  )
    .map(geparst)
    .filter((c): c is CatalogComponent => c !== null)
}

export function leseEine(db: DatabaseSync, id: string): CatalogComponent | undefined {
  const zeile = eineZeile<KatalogZeile>(
    db.prepare('SELECT daten FROM katalog_komponenten WHERE id = ?'),
    id,
  )
  return zeile ? (geparst(zeile) ?? undefined) : undefined
}

export function schreibe(db: DatabaseSync, c: CatalogComponent): void {
  inTransaktion(db, () => {
    db.prepare(
      `INSERT INTO katalog_komponenten
         (id, katalog_id, name, hersteller, artikelnummer, kategorie, hauptgruppe, untergruppe,
          wattzahl, poe_leistung_watt, breiten_faktor, seed_version, herkunft, daten)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         katalog_id = excluded.katalog_id,
         name = excluded.name, hersteller = excluded.hersteller,
         artikelnummer = excluded.artikelnummer, kategorie = excluded.kategorie,
         hauptgruppe = excluded.hauptgruppe, untergruppe = excluded.untergruppe,
         wattzahl = excluded.wattzahl, poe_leistung_watt = excluded.poe_leistung_watt,
         breiten_faktor = excluded.breiten_faktor, seed_version = excluded.seed_version,
         herkunft = excluded.herkunft, daten = excluded.daten`,
    ).run(
      c.id,
      c.katalogId,
      c.name,
      c.hersteller ?? null,
      c.artikelnummer ?? null,
      c.kategorie ?? null,
      c.hauptgruppe ?? null,
      c.untergruppe ?? null,
      c.wattzahl ?? null,
      c.poeLeistungWatt ?? null,
      c.breitenFaktor ?? null,
      c.seedVersion ?? null,
      c.herkunft,
      JSON.stringify(c),
    )
    synchronisiereReferenzen(db, 'katalog', c.id, sammleAssetIds(c))
  })
}

export class VerschiebeschutzFehler extends Error {
  readonly text: ServerText

  constructor(name: string) {
    const text = serverText('server.katalog.verschiebeschutz', { name })
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'VerschiebeschutzFehler'
  }
}

export class LoeschschutzFehler extends Error {
  readonly text: ServerText

  constructor(name: string) {
    const text = serverText('server.katalog.loeschschutz', { name })
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'LoeschschutzFehler'
  }
}

export function loesche(db: DatabaseSync, id: string): void {
  const vorhanden = eineZeile<{ name: string; herkunft: string }>(
    db.prepare('SELECT name, herkunft FROM katalog_komponenten WHERE id = ?'),
    id,
  )
  if (!vorhanden) return
  if (vorhanden.herkunft === 'standard') throw new LoeschschutzFehler(vorhanden.name)

  inTransaktion(db, () => {
    synchronisiereReferenzen(db, 'katalog', id, [])
    db.prepare('DELETE FROM katalog_komponenten WHERE id = ?').run(id)
  })
}

export interface KatalogFilter {
  suche?: string
  hauptgruppe?: string
  untergruppe?: string
  katalogId?: string
  nurAktiveKataloge?: boolean
}

export function leseGefiltert(db: DatabaseSync, filter: KatalogFilter): CatalogComponent[] {
  const bedingungen: string[] = []
  const werte: string[] = []

  if (filter.katalogId) {
    bedingungen.push('katalog_id = ?')
    werte.push(filter.katalogId)
  }
  if (filter.nurAktiveKataloge) {
    bedingungen.push(
      '(NOT EXISTS (SELECT 1 FROM kataloge k WHERE k.id = katalog_id)' +
        ' OR EXISTS (SELECT 1 FROM kataloge k WHERE k.id = katalog_id AND k.aktiv = 1))',
    )
  }
  if (filter.hauptgruppe) {
    bedingungen.push('hauptgruppe = ?')
    werte.push(filter.hauptgruppe)
  }
  if (filter.untergruppe) {
    bedingungen.push('untergruppe = ?')
    werte.push(filter.untergruppe)
  }
  if (filter.suche) {
    bedingungen.push('(name LIKE ? OR hersteller LIKE ? OR artikelnummer LIKE ?)')
    const muster = `%${filter.suche}%`
    werte.push(muster, muster, muster)
  }

  const wo = bedingungen.length > 0 ? `WHERE ${bedingungen.join(' AND ')}` : ''
  return alleZeilen<KatalogZeile>(
    db.prepare(
      `SELECT daten FROM katalog_komponenten ${wo}
        ORDER BY hauptgruppe COLLATE NOCASE, untergruppe COLLATE NOCASE, name COLLATE NOCASE`,
    ),
    ...werte,
  )
    .map(geparst)
    .filter((c): c is CatalogComponent => c !== null)
}

export function gruppen(db: DatabaseSync): { hauptgruppen: string[]; untergruppen: string[] } {
  const lies = (spalte: 'hauptgruppe' | 'untergruppe') =>
    alleZeilen<Record<string, string>>(
      db.prepare(
        `SELECT DISTINCT ${spalte} AS wert FROM katalog_komponenten
          WHERE ${spalte} IS NOT NULL AND ${spalte} <> ''
          ORDER BY wert COLLATE NOCASE`,
      ),
    ).map((z) => z.wert as string)
  return { hauptgruppen: lies('hauptgruppe'), untergruppen: lies('untergruppe') }
}
