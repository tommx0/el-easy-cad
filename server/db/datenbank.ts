import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { migriere, type MigrationsErgebnis } from './migrationen'

export const IM_SPEICHER = ':memory:'

export interface GeoeffneteDatenbank {
  db: DatabaseSync
  migration: MigrationsErgebnis
}

export function oeffneDatenbank(pfad: string): GeoeffneteDatenbank {
  if (pfad !== IM_SPEICHER) {
    mkdirSync(dirname(pfad), { recursive: true })
  }
  const db = new DatabaseSync(pfad)

  if (pfad !== IM_SPEICHER) db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA busy_timeout = 5000')

  const migration = migriere(db)
  return { db, migration }
}

export function inTransaktion<T>(db: DatabaseSync, arbeit: () => T): T {
  if (db.isTransaction) return arbeit()

  db.exec('BEGIN')
  try {
    const ergebnis = arbeit()
    db.exec('COMMIT')
    return ergebnis
  } catch (fehler) {
    db.exec('ROLLBACK')
    throw fehler
  }
}
