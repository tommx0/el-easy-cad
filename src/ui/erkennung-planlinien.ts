import type { Blatt, Point } from '../document-model'
import {
  rohZuWelt,
  hintergrundQuelle,
  istBekannterHintergrund,
  istKalibriert,
  sichtbareIfcEntities,
} from '../document-model'
import type { Planlinien } from '../erkennung'
import { dxfAlsPlanlinien } from '../erkennung'
import { assetUrl } from '../persistence'
import { ladePdfPlansegmente, ladePdfRastersegmente } from '../rendering'

export async function ladePlanlinien(blatt: Blatt): Promise<Planlinien | null> {
  const hintergrund = blatt.hintergrund
  if (!istBekannterHintergrund(hintergrund) || !istKalibriert(hintergrund)) return null
  const nachWelt = (roh: Point) => rohZuWelt(blatt, roh)

  if (hintergrund.typ === 'dxf' || hintergrund.typ === 'ifc') {
    const entities =
      hintergrund.typ === 'ifc' ? sichtbareIfcEntities(hintergrund) : hintergrund.entities
    return dxfAlsPlanlinien(entities, nachWelt)
  }

  const quelle = hintergrundQuelle(hintergrund, assetUrl)
  if (!quelle) return null

  const vektoren = await ladePdfPlansegmente(hintergrund, quelle)
  if (vektoren.length >= MINDEST_VEKTORSEGMENTE) {
    return {
      herkunft: 'pdf-vektor',
      segmente: vektoren.map((s) => ({ a: nachWelt(s.a), b: nachWelt(s.b) })),
      boegen: [],
    }
  }

  const ausBild = await ladePdfRastersegmente(hintergrund, quelle)
  return {
    herkunft: 'raster',
    segmente: ausBild.map((s) => ({ a: nachWelt(s.a), b: nachWelt(s.b) })),
    boegen: [],
  }
}

const MINDEST_VEKTORSEGMENTE = 10
