import { assetUrl } from '../persistence'

type AssetBildCacheEintrag =
  { status: 'laedt' } | { status: 'bereit'; image: HTMLImageElement } | { status: 'fehler' }

const cache = new Map<string, AssetBildCacheEintrag>()

export function holeAssetBild(
  assetId: string | undefined,
  aufBereit: () => void,
): HTMLImageElement | null {
  if (!assetId) return null

  const eintrag = cache.get(assetId)
  if (eintrag?.status === 'bereit') return eintrag.image
  if (eintrag) return null // 'laedt' oder 'fehler' - kein erneuter Ladeversuch

  cache.set(assetId, { status: 'laedt' })
  ladeBild(assetId, aufBereit)
  return null
}

function ladeBild(assetId: string, aufBereit: () => void) {
  const image = new Image()
  image.onload = () => {
    cache.set(assetId, { status: 'bereit', image })
    aufBereit()
  }
  image.onerror = () => {
    cache.set(assetId, { status: 'fehler' })
  }
  image.src = assetUrl(assetId)
}

export function leereAssetBildCache() {
  cache.clear()
}
