import type { DatabaseSync } from 'node:sqlite'
import { dupliziereKabeltyp, kabeltypSchema, type Kabeltyp } from '../../src/document-model'
import type { KabeltypStore } from '../../src/persistence/kabeltyp-store'
import { alleZeilen, ausSqlBoolean, eineZeile, zuSqlBoolean } from './hilfen'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

interface KabeltypZeile {
  daten: string
}

function geparst(zeile: KabeltypZeile): Kabeltyp | null {
  try {
    const ergebnis = kabeltypSchema.safeParse(JSON.parse(zeile.daten))
    return ergebnis.success ? (ergebnis.data as Kabeltyp) : null
  } catch {
    return null
  }
}

export function leseAlleKabeltypen(db: DatabaseSync, nurAktive = false): Kabeltyp[] {
  const wo = nurAktive ? 'WHERE aktiv = 1' : ''
  return alleZeilen<KabeltypZeile>(
    db.prepare(
      `SELECT daten FROM kabeltypen ${wo}
        ORDER BY gruppe COLLATE NOCASE, sortierung IS NULL, sortierung, bezeichnung COLLATE NOCASE`,
    ),
  )
    .map(geparst)
    .filter((t): t is Kabeltyp => t !== null)
}

export function leseKabeltyp(db: DatabaseSync, id: string): Kabeltyp | undefined {
  const zeile = eineZeile<KabeltypZeile>(
    db.prepare('SELECT daten FROM kabeltypen WHERE id = ?'),
    id,
  )
  return zeile ? (geparst(zeile) ?? undefined) : undefined
}

export function schreibeKabeltyp(db: DatabaseSync, typ: Kabeltyp): void {
  db.prepare(
    `INSERT INTO kabeltypen
       (id, bezeichnung, gruppe, bemerkung, aussendurchmesser_mm, herkunft, aktiv, sortierung, seed_version, daten)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       bezeichnung = excluded.bezeichnung, gruppe = excluded.gruppe,
       bemerkung = excluded.bemerkung, aussendurchmesser_mm = excluded.aussendurchmesser_mm,
       herkunft = excluded.herkunft, aktiv = excluded.aktiv,
       sortierung = excluded.sortierung, seed_version = excluded.seed_version,
       daten = excluded.daten`,
  ).run(
    typ.id,
    typ.bezeichnung,
    typ.gruppe,
    typ.bemerkung ?? null,
    typ.aussendurchmesserMm ?? null,
    typ.herkunft,
    zuSqlBoolean(typ.aktiv),
    typ.sortierung ?? null,
    typ.seedVersion ?? null,
    JSON.stringify(typ),
  )
}

export class KabeltypLoeschschutzFehler extends Error {
  readonly text: ServerText

  constructor(bezeichnung: string) {
    const text = serverText('server.kabeltypen.loeschschutz', { bezeichnung })
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'KabeltypLoeschschutzFehler'
  }
}

export function loescheKabeltyp(db: DatabaseSync, id: string): void {
  const vorhanden = eineZeile<{ bezeichnung: string; herkunft: string }>(
    db.prepare('SELECT bezeichnung, herkunft FROM kabeltypen WHERE id = ?'),
    id,
  )
  if (!vorhanden) return
  if (vorhanden.herkunft === 'standard') throw new KabeltypLoeschschutzFehler(vorhanden.bezeichnung)
  db.prepare('DELETE FROM kabeltypen WHERE id = ?').run(id)
}

export function istKabeltypAktiv(db: DatabaseSync, id: string): boolean {
  const zeile = eineZeile<{ aktiv: unknown }>(
    db.prepare('SELECT aktiv FROM kabeltypen WHERE id = ?'),
    id,
  )
  return zeile !== undefined && ausSqlBoolean(zeile.aktiv)
}

export class SqliteKabeltypStore implements KabeltypStore {
  private readonly db: DatabaseSync

  constructor(db: DatabaseSync) {
    this.db = db
  }

  alle(): Promise<Kabeltyp[]> {
    return Promise.resolve(leseAlleKabeltypen(this.db))
  }

  einer(id: string): Promise<Kabeltyp | undefined> {
    return Promise.resolve(leseKabeltyp(this.db, id))
  }

  speichern(typ: Kabeltyp): Promise<void> {
    schreibeKabeltyp(this.db, typ)
    return Promise.resolve()
  }

  loeschen(id: string): Promise<void> {
    loescheKabeltyp(this.db, id)
    return Promise.resolve()
  }

  duplizieren(id: string): Promise<Kabeltyp> {
    const original = leseKabeltyp(this.db, id)
    if (!original) throw new Error(`Kabeltyp ${id} nicht gefunden.`)
    const kopie = dupliziereKabeltyp(original)
    schreibeKabeltyp(this.db, kopie)
    return Promise.resolve(kopie)
  }
}
