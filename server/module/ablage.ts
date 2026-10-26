import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  istGueltigeModulKennung,
  istGueltigeModulVersion,
  istSichererModulPfad,
} from '../../src/document-model'
import type { GeprueftesModul } from './paket'
import { pfadImOrdner } from './pfad'

export function modulOrdner(datenordner: string): string {
  return join(datenordner, 'module')
}

function kennungsOrdner(datenordner: string, kennung: string): string | null {
  if (!istGueltigeModulKennung(kennung)) return null
  return pfadImOrdner(modulOrdner(datenordner), kennung)
}

function versionsOrdner(datenordner: string, kennung: string, version: string): string | null {
  const ordner = kennungsOrdner(datenordner, kennung)
  if (!ordner || !istGueltigeModulVersion(version)) return null
  return pfadImOrdner(ordner, version)
}

export function legeModulAb(datenordner: string, modul: GeprueftesModul): void {
  const { kennung, version } = modul.manifest
  const ziel = versionsOrdner(datenordner, kennung, version)
  if (!ziel) throw new Error(`Ungueltige Modulkennung oder -version: ${kennung} ${version}`)
  rmSync(ziel, { recursive: true, force: true })
  for (const [pfad, inhalt] of modul.dateien) {
    const datei = pfadImOrdner(ziel, pfad)
    if (!datei) throw new Error(`Moduldatei ausserhalb des Modulordners: ${pfad}`)
    mkdirSync(dirname(datei), { recursive: true })
    writeFileSync(datei, inhalt)
  }
  const kennungOrdner = dirname(ziel)
  for (const andere of readdirSync(kennungOrdner)) {
    if (andere !== version) rmSync(join(kennungOrdner, andere), { recursive: true, force: true })
  }
}

export function entferneModulDateien(datenordner: string, kennung: string): void {
  const ordner = kennungsOrdner(datenordner, kennung)
  if (!ordner) throw new Error(`Ungueltige Modulkennung: ${kennung}`)
  rmSync(ordner, { recursive: true, force: true })
}

export function leseModulDatei(
  datenordner: string,
  kennung: string,
  version: string,
  pfad: string,
): Buffer | null {
  if (!istSichererModulPfad(pfad)) return null
  const ordner = versionsOrdner(datenordner, kennung, version)
  const datei = ordner ? pfadImOrdner(ordner, pfad) : null
  if (!datei) return null
  return statSync(datei, { throwIfNoEntry: false })?.isFile() ? readFileSync(datei) : null
}
