import { useEffect, useMemo, useState } from 'react'
import { bearbeitbareSymbolZeichnung } from '../document-model'
import type { CatalogStore } from '../persistence'

export function useSymbolSvg(
  assetId: string | null,
  catalogStore: CatalogStore,
): { svg: string | null; bearbeitbar: boolean } {
  const [geladen, setGeladen] = useState<{ assetId: string; svg: string | null } | null>(null)

  useEffect(() => {
    if (!assetId) return
    let abgebrochen = false
    void catalogStore
      .getImageBlob(assetId)
      .then(async (blob) => {
        const istSvgKandidat =
          !!blob && (blob.type.includes('svg') || !blob.type.startsWith('image/'))
        const text = istSvgKandidat ? await blob.text() : null
        if (abgebrochen) return
        setGeladen({ assetId, svg: text && /<svg\b/i.test(text) ? text : null })
      })
      .catch(() => {
        if (!abgebrochen) setGeladen({ assetId, svg: null })
      })
    return () => {
      abgebrochen = true
    }
  }, [assetId, catalogStore])

  const svg = assetId && geladen?.assetId === assetId ? geladen.svg : null
  const bearbeitbar = useMemo(() => bearbeitbareSymbolZeichnung(svg) !== null, [svg])
  return { svg, bearbeitbar }
}
