import type { Point } from '../document-model'
import type { Plansegment } from './plansegment'

export interface GitterIndex {
  kandidatenFuer(index: number): number[]
  kandidatenFuerStrecke(a: Point, b: Point): number[]
}

export function erzeugeGitterIndex(
  segmente: readonly Plansegment[],
  zellgroesse: number,
): GitterIndex {
  const groesse = Math.max(zellgroesse, 1e-6)
  const zellen = new Map<string, number[]>()
  const schluessel = (sx: number, sy: number) => `${sx}:${sy}`

  const zellenVon = (segment: Plansegment): string[] => {
    const laenge = Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y)
    const schritte = Math.max(1, Math.ceil((laenge / groesse) * 2))
    const gesehen = new Set<string>()
    for (let i = 0; i <= schritte; i++) {
      const t = i / schritte
      const x = segment.a.x + (segment.b.x - segment.a.x) * t
      const y = segment.a.y + (segment.b.y - segment.a.y) * t
      gesehen.add(schluessel(Math.floor(x / groesse), Math.floor(y / groesse)))
    }
    return [...gesehen]
  }

  const zellenJeSegment: string[][] = segmente.map((segment, index) => {
    const liste = zellenVon(segment)
    for (const zelle of liste) {
      const bewohner = zellen.get(zelle)
      if (bewohner) bewohner.push(index)
      else zellen.set(zelle, [index])
    }
    return liste
  })

  const nachbarnVon = (zellenliste: readonly string[]): number[] => {
    const gefunden = new Set<number>()
    for (const zelle of zellenliste) {
      const [sx, sy] = zelle.split(':').map(Number)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (const anderer of zellen.get(schluessel(sx + dx, sy + dy)) ?? []) {
            gefunden.add(anderer)
          }
        }
      }
    }
    return [...gefunden]
  }

  return {
    kandidatenFuer(index) {
      const gefunden = new Set<number>()
      for (const zelle of zellenJeSegment[index]) {
        const [sx, sy] = zelle.split(':').map(Number)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (const anderer of zellen.get(schluessel(sx + dx, sy + dy)) ?? []) {
              if (anderer !== index) gefunden.add(anderer)
            }
          }
        }
      }
      return [...gefunden]
    },
    kandidatenFuerStrecke(a, b) {
      return nachbarnVon(zellenVon({ a, b }))
    },
  }
}
