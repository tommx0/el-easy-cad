import { useEffect, useState } from 'react'
import type { KatalogBild } from '../document-model'
import type { CatalogStore } from '../persistence'

export function useKatalogBildUrl(
  bild: KatalogBild | undefined,
  catalogStore: CatalogStore,
): string | null {
  const [blobUrl, setBlobUrl] = useState<{ assetId: string; url: string } | null>(null)

  useEffect(() => {
    if (!bild) return
    let abgebrochen = false
    let objectUrl: string | null = null
    catalogStore.getImageBlob(bild.assetId).then((blob) => {
      if (abgebrochen || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setBlobUrl({ assetId: bild.assetId, url: objectUrl })
    })
    return () => {
      abgebrochen = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [bild, catalogStore])

  if (!bild) return null
  return blobUrl && blobUrl.assetId === bild.assetId ? blobUrl.url : null
}
