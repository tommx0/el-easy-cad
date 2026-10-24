import type { DatabaseSync } from 'node:sqlite'
import {
  type GeraeteRegelwerk,
  geraeteRegelwerkSchema,
  neueresRegelwerk,
} from '../../src/document-model'
import { MITGELIEFERTES_REGELWERK } from '../../src/persistence/regelwerk-seed'

const SCHLUESSEL = 'geraete-regelwerk'

export function leseGespeichertesRegelwerk(db: DatabaseSync): GeraeteRegelwerk | null {
  const zeile = db
    .prepare('SELECT wert FROM einstellungen WHERE schluessel = ?')
    .get(SCHLUESSEL) as { wert: string } | undefined
  if (!zeile) return null
  try {
    const ergebnis = geraeteRegelwerkSchema.safeParse(JSON.parse(zeile.wert))
    return ergebnis.success ? ergebnis.data : null
  } catch {
    return null
  }
}

export function gueltigesRegelwerk(db: DatabaseSync): GeraeteRegelwerk {
  return neueresRegelwerk(MITGELIEFERTES_REGELWERK, leseGespeichertesRegelwerk(db))
}

export function uebernimmRegelwerk(
  db: DatabaseSync,
  regelwerk: GeraeteRegelwerk,
): { regelwerk: GeraeteRegelwerk; uebernommen: boolean } {
  const bisher = gueltigesRegelwerk(db)
  if (regelwerk.version <= bisher.version) return { regelwerk: bisher, uebernommen: false }
  db.prepare(
    `INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?)
       ON CONFLICT (schluessel) DO UPDATE SET wert = excluded.wert`,
  ).run(SCHLUESSEL, JSON.stringify(regelwerk))
  return { regelwerk, uebernommen: true }
}
