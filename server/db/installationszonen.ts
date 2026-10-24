import type { DatabaseSync } from 'node:sqlite'
import { zonenDefinitionSchema, type ZonenDefinition } from '../../src/document-model'
import type { InstallationszonenStore } from '../../src/persistence/installationszonen-store'
import { alleZeilen, eineZeile, zuSqlBoolean } from './hilfen'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

interface ZonenZeile {
  daten: string
}

function geparst(zeile: ZonenZeile): ZonenDefinition | null {
  try {
    const ergebnis = zonenDefinitionSchema.safeParse(JSON.parse(zeile.daten))
    return ergebnis.success ? (ergebnis.data as ZonenDefinition) : null
  } catch {
    return null
  }
}

export function leseAlleInstallationszonen(db: DatabaseSync): ZonenDefinition[] {
  return alleZeilen<ZonenZeile>(
    db.prepare(
      `SELECT daten FROM installationszonen
        ORDER BY herkunft = 'benutzer', sortierung IS NULL, sortierung, rowid`,
    ),
  )
    .map(geparst)
    .filter((z): z is ZonenDefinition => z !== null)
}

export function leseInstallationszone(db: DatabaseSync, id: string): ZonenDefinition | undefined {
  const zeile = eineZeile<ZonenZeile>(
    db.prepare('SELECT daten FROM installationszonen WHERE id = ?'),
    id,
  )
  return zeile ? (geparst(zeile) ?? undefined) : undefined
}

export function schreibeInstallationszone(db: DatabaseSync, zone: ZonenDefinition): void {
  db.prepare(
    `INSERT INTO installationszonen (id, bezeichnung, herkunft, aktiv, sortierung, seed_version, daten)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET
       bezeichnung = excluded.bezeichnung, herkunft = excluded.herkunft, aktiv = excluded.aktiv,
       sortierung = excluded.sortierung, seed_version = excluded.seed_version,
       daten = excluded.daten`,
  ).run(
    zone.id,
    zone.bezeichnung,
    zone.herkunft,
    zuSqlBoolean(zone.aktiv),
    zone.sortierung ?? null,
    zone.seedVersion ?? null,
    JSON.stringify(zone),
  )
}

export class ZonenLoeschschutzFehler extends Error {
  readonly text: ServerText

  constructor(bezeichnung: string) {
    const text = serverText('server.installationszonen.loeschschutz', { bezeichnung })
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'ZonenLoeschschutzFehler'
  }
}

export function loescheInstallationszone(db: DatabaseSync, id: string): void {
  const vorhanden = eineZeile<{ bezeichnung: string; herkunft: string }>(
    db.prepare('SELECT bezeichnung, herkunft FROM installationszonen WHERE id = ?'),
    id,
  )
  if (!vorhanden) return
  if (vorhanden.herkunft === 'standard') throw new ZonenLoeschschutzFehler(vorhanden.bezeichnung)
  db.prepare('DELETE FROM installationszonen WHERE id = ?').run(id)
}

export class SqliteInstallationszonenStore implements InstallationszonenStore {
  private readonly db: DatabaseSync

  constructor(db: DatabaseSync) {
    this.db = db
  }

  alle(): Promise<ZonenDefinition[]> {
    return Promise.resolve(leseAlleInstallationszonen(this.db))
  }

  speichern(zone: ZonenDefinition): Promise<void> {
    schreibeInstallationszone(this.db, zone)
    return Promise.resolve()
  }

  loeschen(id: string): Promise<void> {
    loescheInstallationszone(this.db, id)
    return Promise.resolve()
  }
}
