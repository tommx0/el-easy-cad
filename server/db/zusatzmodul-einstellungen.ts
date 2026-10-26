import type { DatabaseSync } from 'node:sqlite'
import type { ZusatzmodulEntwicklung } from '../../src/document-model'
import { eineZeile } from './hilfen'

const MODUL_PRAEFIX = 'zusatzmodul.'
const ENTWICKLUNG_SCHLUESSEL = 'entwicklung.zusatzmodul'

export const MODUL_EINSTELLUNG_GROESSE_MAX = 256 * 1024

function schluesselFuer(kennung: string, schluessel: string): string {
  return `${MODUL_PRAEFIX}${kennung}.${schluessel}`
}

export function leseModulEinstellung(
  db: DatabaseSync,
  kennung: string,
  schluessel: string,
): unknown {
  const zeile = eineZeile<{ wert: string }>(
    db.prepare('SELECT wert FROM einstellungen WHERE schluessel = ?'),
    schluesselFuer(kennung, schluessel),
  )
  if (!zeile) return null
  try {
    return JSON.parse(zeile.wert) as unknown
  } catch {
    return null
  }
}

export function schreibeModulEinstellung(
  db: DatabaseSync,
  kennung: string,
  schluessel: string,
  wert: unknown,
): void {
  const voll = schluesselFuer(kennung, schluessel)
  if (wert === null || wert === undefined) {
    db.prepare('DELETE FROM einstellungen WHERE schluessel = ?').run(voll)
    return
  }
  db.prepare(
    `INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?)
     ON CONFLICT (schluessel) DO UPDATE SET wert = excluded.wert`,
  ).run(voll, JSON.stringify(wert))
}

export function loescheModulEinstellungen(db: DatabaseSync, kennung: string): void {
  const praefix = `${MODUL_PRAEFIX}${kennung}.`
  db.prepare('DELETE FROM einstellungen WHERE substr(schluessel, 1, ?) = ?').run(
    praefix.length,
    praefix,
  )
}

export function leseEntwicklung(
  db: DatabaseSync,
): Pick<ZusatzmodulEntwicklung, 'aktiv' | 'ordner'> {
  const zeile = eineZeile<{ wert: string }>(
    db.prepare('SELECT wert FROM einstellungen WHERE schluessel = ?'),
    ENTWICKLUNG_SCHLUESSEL,
  )
  try {
    const roh = zeile ? (JSON.parse(zeile.wert) as Partial<ZusatzmodulEntwicklung>) : {}
    return {
      aktiv: roh.aktiv === true,
      ordner: typeof roh.ordner === 'string' ? roh.ordner : '',
    }
  } catch {
    return { aktiv: false, ordner: '' }
  }
}

export function schreibeEntwicklung(
  db: DatabaseSync,
  wert: Pick<ZusatzmodulEntwicklung, 'aktiv' | 'ordner'>,
): void {
  db.prepare(
    `INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?)
     ON CONFLICT (schluessel) DO UPDATE SET wert = excluded.wert`,
  ).run(ENTWICKLUNG_SCHLUESSEL, JSON.stringify({ aktiv: wert.aktiv, ordner: wert.ordner }))
}
