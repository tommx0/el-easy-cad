import type { KatalogBild } from '../document-model'
import { assetUrl } from '../persistence'

type KatalogBildCacheEintrag =
  { status: 'laedt' } | { status: 'bereit'; image: HTMLImageElement } | { status: 'fehler' }

const cache = new Map<string, KatalogBildCacheEintrag>()

export function bildCacheSchluessel(bild: KatalogBild): string {
  return `blob:${bild.assetId}`
}

export function holeKatalogBild(
  bild: KatalogBild | undefined,
  aufBereit: () => void,
): HTMLImageElement | null {
  if (!bild) return null

  const schluessel = bildCacheSchluessel(bild)
  const eintrag = cache.get(schluessel)
  if (eintrag?.status === 'bereit') return eintrag.image
  if (eintrag) return null // 'laedt' oder 'fehler' - kein erneuter Ladeversuch

  cache.set(schluessel, { status: 'laedt' })
  ladeBild(bild, schluessel, aufBereit)
  return null
}

function ladeBild(bild: KatalogBild, schluessel: string, aufBereit: () => void) {
  const image = new Image()
  image.onload = () => {
    cache.set(schluessel, { status: 'bereit', image })
    aufBereit()
  }
  image.onerror = () => {
    cache.set(schluessel, { status: 'fehler' })
  }

  image.src = assetUrl(bild.assetId)
}

export function leereKatalogBildCache() {
  cache.clear()
}
