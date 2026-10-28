import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { backup, type DatabaseSync } from 'node:sqlite'
import { zipSync } from 'fflate'
import type { Konfiguration } from '../konfiguration'

export const SICHERUNG_DATENBANK = 'el-easy-cad.db'
const SICHERUNG_ASSETS = 'assets/'

export async function erstelleSicherung(
  db: DatabaseSync,
  konfiguration: Konfiguration,
): Promise<Uint8Array> {
  const arbeitsordner = mkdtempSync(join(tmpdir(), 'eec-sicherung-'))
  const kopie = join(arbeitsordner, SICHERUNG_DATENBANK)

  try {
    await backup(db, kopie)
    const dateien: Record<string, Uint8Array> = {
      [SICHERUNG_DATENBANK]: new Uint8Array(readFileSync(kopie)),
    }

    for (const name of assetDateien(konfiguration.assetOrdner)) {
      dateien[`${SICHERUNG_ASSETS}${name}`] = new Uint8Array(
        readFileSync(join(konfiguration.assetOrdner, name)),
      )
    }

    return zipSync(dateien, { level: 0, mtime: new Date() })
  } finally {
    rmSync(arbeitsordner, { recursive: true, force: true })
  }
}

function assetDateien(assetOrdner: string): string[] {
  try {
    return readdirSync(assetOrdner).filter((name) => statSync(join(assetOrdner, name)).isFile())
  } catch {
    return []
  }
}

export function sicherungsDateiname(jetzt = new Date()): string {
  const datum = jetzt.toISOString().slice(0, 10)
  return `el-esy-cad-${datum}.zip`
}
