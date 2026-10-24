import type { BoundingBox, DxfEntity, IfcLage, Point } from '../document-model'

export interface StarreAusrichtung {
  drehung: number
  verschiebung: Point
  abstandPlan: number
  abstandIfc: number
  abweichung: number
}

export const AUSRICHTEN_WARNSCHWELLE = 0.01

function dreh(p: Point, w: number): Point {
  const c = Math.cos(w)
  const s = Math.sin(w)
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c }
}

export function berechneAusrichtung(
  planA: Point,
  planB: Point,
  ifcA: Point,
  ifcB: Point,
): StarreAusrichtung | null {
  const abstandPlan = Math.hypot(planB.x - planA.x, planB.y - planA.y)
  const abstandIfc = Math.hypot(ifcB.x - ifcA.x, ifcB.y - ifcA.y)
  if (abstandPlan < 1e-6 || abstandIfc < 1e-6) return null
  const drehung =
    Math.atan2(planB.y - planA.y, planB.x - planA.x) - Math.atan2(ifcB.y - ifcA.y, ifcB.x - ifcA.x)
  const mitteIfc = dreh({ x: (ifcA.x + ifcB.x) / 2, y: (ifcA.y + ifcB.y) / 2 }, drehung)
  const mittePlan = { x: (planA.x + planB.x) / 2, y: (planA.y + planB.y) / 2 }
  return {
    drehung,
    verschiebung: { x: mittePlan.x - mitteIfc.x, y: mittePlan.y - mitteIfc.y },
    abstandPlan,
    abstandIfc,
    abweichung: (abstandPlan - abstandIfc) / abstandIfc,
  }
}

export function wendeAusrichtungAn(
  p: Point,
  a: Pick<StarreAusrichtung, 'drehung' | 'verschiebung'>,
): Point {
  const q = dreh(p, a.drehung)
  return { x: q.x + a.verschiebung.x, y: q.y + a.verschiebung.y }
}

export function richteEntitiesAus(
  entities: readonly DxfEntity[],
  a: Pick<StarreAusrichtung, 'drehung' | 'verschiebung'>,
): DxfEntity[] {
  const f = (p: Point) => wendeAusrichtungAn(p, a)
  return entities.map((e): DxfEntity => {
    switch (e.type) {
      case 'linie':
        return { ...e, start: f(e.start), ende: f(e.ende) }
      case 'polylinie':
        return { ...e, punkte: e.punkte.map(f) }
      case 'kreis':
        return { ...e, mittelpunkt: f(e.mittelpunkt) }
      case 'bogen':
        return {
          ...e,
          mittelpunkt: f(e.mittelpunkt),
          startWinkel: e.startWinkel + a.drehung,
          endWinkel: e.endWinkel + a.drehung,
        }
    }
  })
}

export function verketteLage(
  importLage: IfcLage,
  a: Pick<StarreAusrichtung, 'drehung' | 'verschiebung'>,
  abzug: Point = { x: 0, y: 0 },
): IfcLage {
  const v = wendeAusrichtungAn(importLage.versatz, a)
  return {
    drehung: importLage.drehung + a.drehung,
    versatz: { x: v.x - abzug.x, y: v.y - abzug.y },
  }
}

export function verschiebeEntities(entities: readonly DxfEntity[], abzug: Point): DxfEntity[] {
  return richteEntitiesAus(entities, { drehung: 0, verschiebung: { x: -abzug.x, y: -abzug.y } })
}

export function huelleVonEntities(entities: readonly DxfEntity[]): BoundingBox | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const nimm = (p: Point, r = 0) => {
    minX = Math.min(minX, p.x - r)
    minY = Math.min(minY, p.y - r)
    maxX = Math.max(maxX, p.x + r)
    maxY = Math.max(maxY, p.y + r)
  }
  for (const e of entities) {
    if (e.type === 'linie') {
      nimm(e.start)
      nimm(e.ende)
    } else if (e.type === 'polylinie') {
      e.punkte.forEach((p) => nimm(p))
    } else {
      nimm(e.mittelpunkt, e.radius)
    }
  }
  return Number.isFinite(minX) ? { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } } : null
}
