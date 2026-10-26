import type { DatabaseSync } from 'node:sqlite'
import {
  zusatzmodulManifestSchema,
  type ZusatzmodulEintrag,
  type ZusatzmodulManifest,
} from '../../src/document-model'
import { alleZeilen, ausSqlBoolean, eineZeile, jetzt, zuSqlBoolean } from './hilfen'

interface ModulZeile {
  kennung: string
  aktiv: number
  ki: number
  installiert_am: string
  fehler: string | null
  manifest: string
}

function geparst(zeile: ModulZeile): ZusatzmodulEintrag | null {
  try {
    const manifest = zusatzmodulManifestSchema.safeParse(JSON.parse(zeile.manifest))
    if (!manifest.success) return null
    return {
      manifest: manifest.data,
      aktiv: ausSqlBoolean(zeile.aktiv),
      installiertAm: zeile.installiert_am,
      fehler: zeile.fehler,
      kiFreigabe: ausSqlBoolean(zeile.ki),
    }
  } catch {
    return null
  }
}

const SPALTEN = 'kennung, aktiv, ki, installiert_am, fehler, manifest'

export function leseZusatzmodule(db: DatabaseSync): ZusatzmodulEintrag[] {
  return alleZeilen<ModulZeile>(db.prepare(`SELECT ${SPALTEN} FROM zusatzmodule`))
    .map(geparst)
    .filter((e): e is ZusatzmodulEintrag => e !== null)
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
}

export function leseZusatzmodul(db: DatabaseSync, kennung: string): ZusatzmodulEintrag | undefined {
  const zeile = eineZeile<ModulZeile>(
    db.prepare(`SELECT ${SPALTEN} FROM zusatzmodule WHERE kennung = ?`),
    kennung,
  )
  return zeile ? (geparst(zeile) ?? undefined) : undefined
}

export function schreibeZusatzmodul(
  db: DatabaseSync,
  manifest: ZusatzmodulManifest,
): ZusatzmodulEintrag {
  const installiertAm = jetzt()
  db.prepare(
    `INSERT INTO zusatzmodule (kennung, version, aktiv, installiert_am, fehler, manifest)
       VALUES (?, ?, 1, ?, NULL, ?)
     ON CONFLICT (kennung) DO UPDATE SET
       version = excluded.version, aktiv = 1, installiert_am = excluded.installiert_am,
       fehler = NULL, manifest = excluded.manifest`,
  ).run(manifest.kennung, manifest.version, installiertAm, JSON.stringify(manifest))
  return leseZusatzmodul(db, manifest.kennung)!
}

export function setzeZusatzmodulAktiv(
  db: DatabaseSync,
  kennung: string,
  aktiv: boolean,
  fehler: string | null,
): ZusatzmodulEintrag | undefined {
  db.prepare('UPDATE zusatzmodule SET aktiv = ?, fehler = ? WHERE kennung = ?').run(
    zuSqlBoolean(aktiv),
    fehler,
    kennung,
  )
  return leseZusatzmodul(db, kennung)
}

export function setzeZusatzmodulKi(
  db: DatabaseSync,
  kennung: string,
  freigabe: boolean,
): ZusatzmodulEintrag | undefined {
  db.prepare('UPDATE zusatzmodule SET ki = ? WHERE kennung = ?').run(
    zuSqlBoolean(freigabe),
    kennung,
  )
  return leseZusatzmodul(db, kennung)
}

export function loescheZusatzmodul(db: DatabaseSync, kennung: string): boolean {
  return db.prepare('DELETE FROM zusatzmodule WHERE kennung = ?').run(kennung).changes > 0
}
