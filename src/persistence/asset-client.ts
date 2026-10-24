import { holeBlob, sendeDatei, API_BASIS } from './api-client'

export interface AssetAntwort {
  id: string
  mime: string
  groesse: number
  dateiname: string | null
  erstelltAm: string
  neu: boolean
}

export async function ladeAssetHoch(datei: Blob, dateiname?: string): Promise<string> {
  const abfrage = dateiname ? `?dateiname=${encodeURIComponent(dateiname)}` : ''
  const antwort = await sendeDatei<AssetAntwort>(`/assets${abfrage}`, datei)
  return antwort.id
}

export function assetUrl(assetId: string): string {
  return `${API_BASIS}/assets/${assetId}`
}

export function holeAssetBlob(assetId: string): Promise<Blob> {
  return holeBlob(`/assets/${assetId}`)
}
