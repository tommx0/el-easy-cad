import type { Blatt } from './blatt'

export function blaetterDesselbenIfcModells(blaetter: readonly Blatt[], blatt: Blatt): Blatt[] {
  const h = blatt.hintergrund
  if (h?.typ !== 'ifc' || !h.assetId) return []
  return blaetter.filter((b) => b.hintergrund?.typ === 'ifc' && b.hintergrund.assetId === h.assetId)
}
