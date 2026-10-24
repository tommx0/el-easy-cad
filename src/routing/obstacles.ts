import type { BoundingBox, KomponentenObjekt, Objekt, Point } from '../document-model'
import {
  abstandZurWandoberflaeche,
  AP_WANDABSTAND_METER,
  dreheObjekt,
  rotatePoint,
  expandBoundingBox,
  getBoundingBox,
  getDockpoints,
  istAufgesetztesModul,
  richtungZurWand,
  wandAchsenAufBlatt,
  wandseitigeDockpunktIndizes,
} from '../document-model'
import { ROUTING_SICHERHEITSABSTAND_METER } from './constants'
import type { WandStrecke } from './waende'
import { waendeAlsRoutingStrecken } from './waende'

export interface RoutingHindernisse {
  boxen: BoundingBox[]
  waende: WandStrecke[]
  waendeMitFenstern?: WandStrecke[]
  raumGrenzen?: WandStrecke[]
  fensterSperren?: WandStrecke[]
  wandAnfahrten?: WandAnfahrt[]
  wandStreifen?: WandStreifen[]
  ausrichtung?: number
}

export interface WandStreifen {
  a: Point
  b: Point
  raum: Point
}

export interface WandAnfahrt {
  punkte: Point[]
  zurWand: Point
  durchlass: Point[]
  aufPutz: boolean
  oberflaeche: Point
}

export type RoutingHindernisseEingabe = RoutingHindernisse | BoundingBox[]

const AUSRICHTUNG_MIN = 2e-4

export function gebaeudeAusrichtung(objekte: readonly Objekt[]): number {
  let sx = 0
  let sy = 0
  for (const o of objekte) {
    if (o.type !== 'wand') continue
    for (let i = 1; i < o.punkte.length; i++) {
      const dx = o.punkte[i].x - o.punkte[i - 1].x
      const dy = o.punkte[i].y - o.punkte[i - 1].y
      const laenge = Math.hypot(dx, dy)
      if (laenge < 1e-9) continue
      const vier = 4 * Math.atan2(dy, dx)
      sx += laenge * Math.cos(vier)
      sy += laenge * Math.sin(vier)
    }
  }
  if (Math.hypot(sx, sy) < 1e-9) return 0
  const winkel = Math.atan2(sy, sx) / 4
  return Math.abs(winkel) < AUSRICHTUNG_MIN ? 0 : winkel
}

const NULLPUNKT = { x: 0, y: 0 }

function imRaster(o: Objekt, winkel: number): Objekt {
  const gedreht = dreheObjekt(o, NULLPUNKT, winkel)
  if (gedreht.type !== 'komponente' || !gedreht.wandstelle) return gedreht
  const stelle = gedreht.wandstelle
  return {
    ...gedreht,
    wandstelle: {
      ...stelle,
      punkt: rotatePoint(stelle.punkt, NULLPUNKT, winkel),
      richtung: stelle.richtung + winkel,
    },
  }
}

export function routingHindernisse(
  objekte: Objekt[],
  sicherheitsabstandMeter: number = ROUTING_SICHERHEITSABSTAND_METER,
): RoutingHindernisse {
  const ausrichtung = gebaeudeAusrichtung(objekte)
  if (ausrichtung === 0) return hindernisseInWeltachsen(objekte, sicherheitsabstandMeter)
  return {
    ...hindernisseInWeltachsen(
      objekte.map((o) => imRaster(o, -ausrichtung)),
      sicherheitsabstandMeter,
    ),
    ausrichtung,
  }
}

function hindernisseInWeltachsen(
  objekte: Objekt[],
  sicherheitsabstandMeter: number,
): RoutingHindernisse {
  const achsen = wandAchsenAufBlatt(objekte)
  return {
    boxen: komponentenAlsHindernisse(objekte, sicherheitsabstandMeter),
    waende: waendeAlsRoutingStrecken(objekte),
    waendeMitFenstern: achsen.waende,
    fensterSperren: achsen.fenster,
    raumGrenzen: objekte.flatMap((o) =>
      o.type === 'wand'
        ? o.punkte.slice(1).map((b, i) => ({ a: o.punkte[i], b, halbeStaerke: o.staerke / 2 }))
        : [],
    ),
    wandAnfahrten: wandAnfahrten(objekte),
    wandStreifen: wandStreifen(objekte, sicherheitsabstandMeter),
  }
}

function wandStreifen(objekte: readonly Objekt[], rand: number): WandStreifen[] {
  return objekte.flatMap((o) => {
    if (o.type !== 'komponente' || !o.wandstelle || o.verlegung === 'in') return []
    if (istAufgesetztesModul(o)) return []
    const stelle = o.wandstelle
    const ecken = boxEcken(getBoundingBox(o))
    const naechste = Math.min(...ecken.map((p) => abstandZurWandoberflaeche(stelle, p)))
    if (naechste > AP_WANDABSTAND_METER + 0.01) return []
    const u = { x: Math.cos(stelle.richtung), y: Math.sin(stelle.richtung) }
    const entlang = ecken.map((p) => (p.x - stelle.punkt.x) * u.x + (p.y - stelle.punkt.y) * u.y)
    const von = Math.min(...entlang) - rand
    const bis = Math.max(...entlang) + rand
    return [
      {
        a: { x: stelle.punkt.x + u.x * von, y: stelle.punkt.y + u.y * von },
        b: { x: stelle.punkt.x + u.x * bis, y: stelle.punkt.y + u.y * bis },
        raum: { x: -u.y, y: u.x },
      },
    ]
  })
}

function boxEcken(bb: BoundingBox): Point[] {
  return [bb.min, { x: bb.max.x, y: bb.min.y }, bb.max, { x: bb.min.x, y: bb.max.y }]
}

function wandAnfahrten(objekte: readonly Objekt[]): WandAnfahrt[] {
  const gebunden = objekte.filter(
    (o): o is KomponentenObjekt =>
      o.type === 'komponente' && o.wandstelle !== undefined && !istAufgesetztesModul(o),
  )
  return gebunden.flatMap((k) => {
    const indizes = wandseitigeDockpunktIndizes(k)
    if (indizes.length === 0) return []
    const punkte = getDockpoints(k)
    return [
      {
        punkte: indizes.map((i) => punkte[i]),
        zurWand: richtungZurWand(k.wandstelle!),
        aufPutz: k.verlegung !== 'in',
        oberflaeche: k.wandstelle!.punkt,
        durchlass: gebunden
          .filter((n) => n.id !== k.id && n.wandstelle!.id === k.wandstelle!.id)
          .map((n) => n.position),
      },
    ]
  })
}

export function komponentenAlsHindernisse(
  objekte: Objekt[],
  sicherheitsabstandMeter: number = ROUTING_SICHERHEITSABSTAND_METER,
): BoundingBox[] {
  return objekte
    .filter((o): o is Extract<Objekt, { type: 'komponente' }> => o.type === 'komponente')
    .filter((o) => !istAufgesetztesModul(o))
    .map((o) => expandBoundingBox(getBoundingBox(o), sicherheitsabstandMeter))
}
