import { getDockpoints } from './dockpoints'
import { abstandZurWandoberflaeche, wandseitigeDockpunktIndizes } from './dockpunkte-wandseite'
import type { Point } from './geometry'
import type { KomponentenObjekt, Objekt } from './objekte'
import { getBoundingBox, mitKomponentenObenSortiert } from './objekte'
import { AP_WANDABSTAND_METER } from './wandstelle'

const INNEN_ABSTAND_METER = 0.01

export function dockpunktImInneren(komponente: KomponentenObjekt, punkt: Point): boolean {
  const bb = getBoundingBox(komponente)
  const t = INNEN_ABSTAND_METER
  return (
    punkt.x > bb.min.x + t &&
    punkt.x < bb.max.x - t &&
    punkt.y > bb.min.y + t &&
    punkt.y < bb.max.y - t
  )
}

function wandseitigHinterAnderen(komponente: KomponentenObjekt, index: number, punkt: Point) {
  if (!komponente.wandstelle) return false
  const anDerWand = INNEN_ABSTAND_METER + AP_WANDABSTAND_METER
  if (abstandZurWandoberflaeche(komponente.wandstelle, punkt) <= anDerWand) return false
  return wandseitigeDockpunktIndizes(komponente).includes(index)
}

export function inZeichenreihenfolge(
  objekte: readonly Objekt[],
  alle: readonly Objekt[] = objekte,
): Objekt[] {
  const komponenten = new Map<string, KomponentenObjekt>()
  for (const o of alle) if (o.type === 'komponente') komponenten.set(o.id, o)
  const imInneren = (objektId: string, index: number | undefined) => {
    const k = komponenten.get(objektId)
    const punkt = k && index !== undefined ? getDockpoints(k)[index] : undefined
    return (
      k !== undefined &&
      punkt !== undefined &&
      (dockpunktImInneren(k, punkt) || wandseitigHinterAnderen(k, index!, punkt))
    )
  }
  const oben = new Set<string>()
  for (const o of objekte) {
    if (o.type === 'leitung') {
      const innen = [o.start, o.ziel].some(
        (e) => e.art === 'dock' && imInneren(e.objektId, e.dockpunktIndex),
      )
      if (innen) oben.add(o.id)
    } else if (o.type === 'schaltverbindung') {
      const innen = [o.start, o.ziel].some(
        (e) => e.art === 'dock' && imInneren(e.objektId, e.dockpunktIndizes[0]),
      )
      if (innen) oben.add(o.id)
    }
  }
  if (oben.size === 0) return mitKomponentenObenSortiert(objekte)
  const sortiert = mitKomponentenObenSortiert(objekte.filter((o) => !oben.has(o.id)))
  return [...sortiert, ...objekte.filter((o) => oben.has(o.id))]
}
