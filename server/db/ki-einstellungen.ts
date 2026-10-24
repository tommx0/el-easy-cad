import { randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { alleZeilen } from './hilfen'

const PRAEFIX = 'ki.'

export interface KiEinstellungen {
  aktiv: boolean
  nurLesen: boolean
  zustimmungAm: string | null
  token: string | null
}

const STANDARD: KiEinstellungen = {
  aktiv: false,
  nurLesen: false,
  zustimmungAm: null,
  token: null,
}

interface Zeile {
  schluessel: string
  wert: string
}

export function leseKiEinstellungen(db: DatabaseSync): KiEinstellungen {
  const zeilen = alleZeilen<Zeile>(
    db.prepare(`SELECT schluessel, wert FROM einstellungen WHERE schluessel LIKE '${PRAEFIX}%'`),
  )
  const ergebnis = { ...STANDARD }
  for (const zeile of zeilen) {
    let wert: unknown
    try {
      wert = JSON.parse(zeile.wert)
    } catch {
      continue
    }
    switch (zeile.schluessel.slice(PRAEFIX.length)) {
      case 'aktiv':
        if (typeof wert === 'boolean') ergebnis.aktiv = wert
        break
      case 'nurLesen':
        if (typeof wert === 'boolean') ergebnis.nurLesen = wert
        break
      case 'zustimmungAm':
        if (typeof wert === 'string') ergebnis.zustimmungAm = wert
        break
      case 'token':
        if (typeof wert === 'string' && wert.length > 0) ergebnis.token = wert
        break
    }
  }
  return ergebnis
}

export function schreibeKiEinstellungen(db: DatabaseSync, patch: Partial<KiEinstellungen>): void {
  const stmt = db.prepare(
    `INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?)
       ON CONFLICT (schluessel) DO UPDATE SET wert = excluded.wert`,
  )
  for (const [feld, wert] of Object.entries(patch)) {
    if (wert === undefined) continue
    stmt.run(`${PRAEFIX}${feld}`, JSON.stringify(wert))
  }
}

export function erzeugeKiToken(): string {
  return randomBytes(24).toString('base64url')
}
