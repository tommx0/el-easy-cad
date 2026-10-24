import type { DatabaseSync } from 'node:sqlite'
import { alleZeilen, eineZeile } from './hilfen'

export interface AssetMeta {
  id: string
  mime: string
  groesse: number
  dateiname: string | null
  erstelltAm: string
}

interface AssetZeile {
  id: string
  mime: string
  groesse: number
  dateiname: string | null
  erstellt_am: string
}

function zuMeta(zeile: AssetZeile): AssetMeta {
  return {
    id: zeile.id,
    mime: zeile.mime,
    groesse: zeile.groesse,
    dateiname: zeile.dateiname,
    erstelltAm: zeile.erstellt_am,
  }
}

export function holeAsset(db: DatabaseSync, id: string): AssetMeta | undefined {
  const zeile = eineZeile<AssetZeile>(
    db.prepare('SELECT id, mime, groesse, dateiname, erstellt_am FROM assets WHERE id = ?'),
    id,
  )
  return zeile ? zuMeta(zeile) : undefined
}

export function legeAssetAn(db: DatabaseSync, meta: AssetMeta): { asset: AssetMeta; neu: boolean } {
  const vorhanden = holeAsset(db, meta.id)
  if (vorhanden) return { asset: vorhanden, neu: false }
  db.prepare(
    'INSERT INTO assets (id, mime, groesse, dateiname, erstellt_am) VALUES (?, ?, ?, ?, ?)',
  ).run(meta.id, meta.mime, meta.groesse, meta.dateiname, meta.erstelltAm)
  return { asset: meta, neu: true }
}

const ASSET_SCHLUESSEL = new Set(['assetId', 'blobId'])

export function sammleAssetIds(daten: unknown): string[] {
  const gefunden = new Set<string>()
  const besuche = (wert: unknown): void => {
    if (Array.isArray(wert)) {
      for (const eintrag of wert) besuche(eintrag)
      return
    }
    if (typeof wert !== 'object' || wert === null) return
    for (const [schluessel, inhalt] of Object.entries(wert)) {
      if (ASSET_SCHLUESSEL.has(schluessel) && typeof inhalt === 'string' && inhalt.length > 0) {
        gefunden.add(inhalt)
      } else {
        besuche(inhalt)
      }
    }
  }
  besuche(daten)
  return [...gefunden]
}

export function sammleAssetIdsAusText(text: string | null): string[] {
  if (!text) return []
  try {
    return sammleAssetIds(JSON.parse(text))
  } catch {
    return []
  }
}

export function synchronisiereReferenzen(
  db: DatabaseSync,
  quelleTyp: 'dokument' | 'stand' | 'katalog',
  quelleId: string,
  assetIds: string[],
): void {
  const pruefeVorhanden = db.prepare('SELECT 1 FROM assets WHERE id = ?')
  const bekannt = new Set(assetIds.filter((id) => pruefeVorhanden.get(id) !== undefined))
  const vorhanden = new Set(
    alleZeilen<{ asset_id: string }>(
      db.prepare('SELECT asset_id FROM asset_referenzen WHERE quelle_typ = ? AND quelle_id = ?'),
      quelleTyp,
      quelleId,
    ).map((z) => z.asset_id),
  )

  for (const id of vorhanden) {
    if (bekannt.has(id)) continue
    db.prepare(
      'DELETE FROM asset_referenzen WHERE asset_id = ? AND quelle_typ = ? AND quelle_id = ?',
    ).run(id, quelleTyp, quelleId)
  }
  for (const id of bekannt) {
    if (vorhanden.has(id)) continue
    db.prepare(
      'INSERT INTO asset_referenzen (asset_id, quelle_typ, quelle_id) VALUES (?, ?, ?)',
    ).run(id, quelleTyp, quelleId)
  }
}

export const SCHONFRIST_MS = 60 * 60 * 1000

export function entferneVerwaisteAssets(db: DatabaseSync): string[] {
  const grenze = new Date(Date.now() - SCHONFRIST_MS).toISOString()
  const verwaist = alleZeilen<{ id: string }>(
    db.prepare(
      `SELECT id FROM assets a
        WHERE NOT EXISTS (SELECT 1 FROM asset_referenzen r WHERE r.asset_id = a.id)
          AND NOT EXISTS (SELECT 1 FROM dokument_inhalte i WHERE i.asset_id = a.id)
          AND a.erstellt_am < ?`,
    ),
    grenze,
  )

  if (verwaist.length === 0) return []
  const loeschen = db.prepare('DELETE FROM assets WHERE id = ?')
  for (const asset of verwaist) loeschen.run(asset.id)
  return verwaist.map((a) => a.id)
}

export function entferneReferenzen(
  db: DatabaseSync,
  quelleTyp: 'dokument' | 'stand' | 'katalog',
  quelleIds: string[],
): void {
  if (quelleIds.length === 0) return
  const loeschen = db.prepare('DELETE FROM asset_referenzen WHERE quelle_typ = ? AND quelle_id = ?')
  for (const id of quelleIds) loeschen.run(quelleTyp, id)
}
