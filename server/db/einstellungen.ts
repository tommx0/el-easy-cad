import type { DatabaseSync } from 'node:sqlite'
import {
  appSettingsPatchSchema,
  type AppSettings,
  type AppSettingsPatch,
} from '../../src/persistence/settings-store'
import { alleZeilen } from './hilfen'

const PRAEFIX = 'app.'

interface EinstellungsZeile {
  schluessel: string
  wert: string
}

export function leseEinstellungen(db: DatabaseSync): Partial<AppSettings> {
  const zeilen = alleZeilen<EinstellungsZeile>(
    db.prepare(`SELECT schluessel, wert FROM einstellungen WHERE schluessel LIKE '${PRAEFIX}%'`),
  )
  const roh: Record<string, unknown> = {}
  for (const zeile of zeilen) {
    try {
      roh[zeile.schluessel.slice(PRAEFIX.length)] = JSON.parse(zeile.wert)
    } catch {}
  }
  const ergebnis: Record<string, unknown> = {}
  for (const [feld, wert] of Object.entries(roh)) {
    const geprueft = appSettingsPatchSchema.safeParse({ [feld]: wert })
    if (geprueft.success && Object.keys(geprueft.data).length === 1) ergebnis[feld] = wert
  }
  return ergebnis as Partial<AppSettings>
}

export function schreibeEinstellungen(db: DatabaseSync, patch: AppSettingsPatch): void {
  const stmt = db.prepare(
    `INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?)
       ON CONFLICT (schluessel) DO UPDATE SET wert = excluded.wert`,
  )
  for (const [feld, wert] of Object.entries(patch)) {
    if (wert === undefined) continue
    stmt.run(`${PRAEFIX}${feld}`, JSON.stringify(wert))
  }
}
