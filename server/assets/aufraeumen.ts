import type { DatabaseSync } from 'node:sqlite'
import { entferneVerwaisteAssets } from '../db/assets'
import { loescheAssetDateien } from './speicher'

export interface AufraeumErgebnis {
  entfernt: string[]
  freigegeben: number
}

export function raeumeVerwaisteAssetsAuf(db: DatabaseSync, assetOrdner: string): AufraeumErgebnis {
  const entfernt = entferneVerwaisteAssets(db)
  return { entfernt, freigegeben: loescheAssetDateien(assetOrdner, entfernt) }
}
