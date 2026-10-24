import type { DatabaseSync } from 'node:sqlite'
import { katalogSchema, type Katalog } from '../../src/document-model'
import { inTransaktion } from './datenbank'
import { alleZeilen, ausSqlBoolean, eineZeile, zuSqlBoolean } from './hilfen'
import { synchronisiereReferenzen } from './assets'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

interface KatalogZeile {
  daten: string
}

function geparst(zeile: KatalogZeile): Katalog | null {
  try {
    const ergebnis = katalogSchema.safeParse(JSON.parse(zeile.daten))
    return ergebnis.success ? (ergebnis.data as Katalog) : null
  } catch {
    return null
  }
}

export function leseAlleKataloge(db: DatabaseSync, nurAktive = false): Katalog[] {
  const wo = nurAktive ? 'WHERE aktiv = 1' : ''
  return alleZeilen<KatalogZeile>(
    db.prepare(
      `SELECT daten FROM kataloge ${wo}
        ORDER BY sortierung IS NULL, sortierung, name COLLATE NOCASE`,
    ),
  )
    .map(geparst)
    .filter((k): k is Katalog => k !== null)
}

export function leseKatalog(db: DatabaseSync, id: string): Katalog | undefined {
  const zeile = eineZeile<KatalogZeile>(db.prepare('SELECT daten FROM kataloge WHERE id = ?'), id)
  return zeile ? (geparst(zeile) ?? undefined) : undefined
}

export function schreibeKatalog(db: DatabaseSync, katalog: Katalog): void {
  db.prepare(
    `INSERT INTO kataloge (id, name, beschreibung, hersteller, herkunft, aktiv, sortierung, seed_version, daten)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       name = excluded.name, beschreibung = excluded.beschreibung,
       hersteller = excluded.hersteller, herkunft = excluded.herkunft,
       aktiv = excluded.aktiv, sortierung = excluded.sortierung,
       seed_version = excluded.seed_version, daten = excluded.daten`,
  ).run(
    katalog.id,
    katalog.name,
    katalog.beschreibung ?? null,
    katalog.hersteller ?? null,
    katalog.herkunft,
    zuSqlBoolean(katalog.aktiv),
    katalog.sortierung ?? null,
    katalog.seedVersion ?? null,
    JSON.stringify(katalog),
  )
}

export class KatalogLoeschschutzFehler extends Error {
  readonly text: ServerText

  constructor(name: string) {
    const text = serverText('server.kataloge.loeschschutz', { name })
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'KatalogLoeschschutzFehler'
  }
}

export function loescheKatalog(db: DatabaseSync, id: string): number {
  const vorhanden = leseKatalog(db, id)
  if (!vorhanden) return 0
  if (vorhanden.herkunft === 'standard') throw new KatalogLoeschschutzFehler(vorhanden.name)

  return inTransaktion(db, () => {
    const komponentenIds = alleZeilen<{ id: string }>(
      db.prepare('SELECT id FROM katalog_komponenten WHERE katalog_id = ?'),
      id,
    ).map((z) => z.id)
    for (const komponentenId of komponentenIds) {
      synchronisiereReferenzen(db, 'katalog', komponentenId, [])
    }
    db.prepare('DELETE FROM katalog_komponenten WHERE katalog_id = ?').run(id)
    db.prepare('DELETE FROM kataloge WHERE id = ?').run(id)
    return komponentenIds.length
  })
}

export function zaehleKomponentenJeKatalog(db: DatabaseSync): Map<string, number> {
  const zeilen = alleZeilen<{ katalog_id: string; anzahl: number }>(
    db.prepare(
      'SELECT katalog_id, COUNT(*) AS anzahl FROM katalog_komponenten GROUP BY katalog_id',
    ),
  )
  return new Map(zeilen.map((z) => [z.katalog_id, z.anzahl]))
}

export function istKatalogAktiv(db: DatabaseSync, id: string): boolean {
  const zeile = eineZeile<{ aktiv: unknown }>(
    db.prepare('SELECT aktiv FROM kataloge WHERE id = ?'),
    id,
  )
  return zeile !== undefined && ausSqlBoolean(zeile.aktiv)
}
