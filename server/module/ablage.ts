import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { istSichererModulPfad } from '../../src/document-model'
import type { GeprueftesModul } from './paket'

export function modulOrdner(datenordner: string): string {
  return join(datenordner, 'module')
}

function versionsOrdner(datenordner: string, kennung: string, version: string): string {
  return join(modulOrdner(datenordner), kennung, version)
}

export function legeModulAb(datenordner: string, modul: GeprueftesModul): void {
  const { kennung, version } = modul.manifest
  const ziel = versionsOrdner(datenordner, kennung, version)
  rmSync(ziel, { recursive: true, force: true })
  for (const [pfad, inhalt] of modul.dateien) {
    const datei = join(ziel, pfad)
    mkdirSync(dirname(datei), { recursive: true })
    writeFileSync(datei, inhalt)
  }
  const kennungOrdner = join(modulOrdner(datenordner), kennung)
  for (const andere of readdirSync(kennungOrdner)) {
    if (andere !== version) rmSync(join(kennungOrdner, andere), { recursive: true, force: true })
  }
}

export function entferneModulDateien(datenordner: string, kennung: string): void {
  rmSync(join(modulOrdner(datenordner), kennung), { recursive: true, force: true })
}

export function leseModulDatei(
  datenordner: string,
  kennung: string,
  version: string,
  pfad: string,
): Buffer | null {
  if (!istSichererModulPfad(pfad)) return null
  const datei = join(versionsOrdner(datenordner, kennung, version), pfad)
  return statSync(datei, { throwIfNoEntry: false })?.isFile() ? readFileSync(datei) : null
}
