import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function berechneHash(daten: Buffer): string {
  return createHash('sha256').update(daten).digest('hex')
}

export function istGueltigerHash(id: string): boolean {
  return /^[0-9a-f]{64}$/.test(id)
}

export function assetPfad(assetOrdner: string, id: string): string {
  if (!istGueltigerHash(id)) throw new Error(`Ungültige Asset-Id: ${id}`)
  return join(assetOrdner, id)
}

export function schreibeAssetDatei(assetOrdner: string, id: string, daten: Buffer): boolean {
  mkdirSync(assetOrdner, { recursive: true })
  const pfad = assetPfad(assetOrdner, id)
  if (existsSync(pfad)) return false
  writeFileSync(pfad, daten)
  return true
}

export function liesAssetDatei(assetOrdner: string, id: string): Buffer | undefined {
  const pfad = assetPfad(assetOrdner, id)
  if (!existsSync(pfad)) return undefined
  return readFileSync(pfad)
}

export function assetDateiGroesse(assetOrdner: string, id: string): number | undefined {
  const pfad = assetPfad(assetOrdner, id)
  if (!existsSync(pfad)) return undefined
  return statSync(pfad).size
}

export function errateMimeTyp(daten: Buffer): string {
  if (daten.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf'
  if (daten.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png'
  if (daten.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg'
  return 'application/octet-stream'
}

export function loescheAssetDateien(assetOrdner: string, ids: string[]): number {
  let freigegeben = 0
  for (const id of ids) {
    if (!istGueltigerHash(id)) continue
    const pfad = join(assetOrdner, id)
    if (!existsSync(pfad)) continue
    freigegeben += statSync(pfad).size
    rmSync(pfad, { force: true })
  }
  return freigegeben
}
