import type { Point } from '../document-model'
import { distance } from '../document-model'

export const SPURFANG_VERWEILDAUER_MS = 400
export const SPURFANG_MAX_PUNKTE = 3
const GLEICHHEIT_TOLERANZ = 1e-6

export interface GemerkterPunkt {
  punkt: Point
  richtung: Point | null
  seit: number
}

export function merkeOderVergissPunkt(
  bisherige: readonly GemerkterPunkt[],
  kandidat: { punkt: Point; richtung: Point | null },
  jetzt: number,
): GemerkterPunkt[] {
  const index = bisherige.findIndex((g) => distance(g.punkt, kandidat.punkt) < GLEICHHEIT_TOLERANZ)
  if (index >= 0) {
    return bisherige.filter((_, i) => i !== index)
  }
  const erweitert = [
    ...bisherige,
    { punkt: kandidat.punkt, richtung: kandidat.richtung, seit: jetzt },
  ]
  return erweitert.length > SPURFANG_MAX_PUNKTE ? erweitert.slice(1) : erweitert
}

export interface Spurgerade {
  herkunft: number
  punkt: Point
  richtung: Point
}

export interface SpurTreffer {
  punkt: Point
  art: 'spur' | 'spurkreuz'
  geraden: readonly Spurgerade[]
}

function istAchsparallel(richtung: Point): boolean {
  return Math.abs(richtung.x) < 1e-9 || Math.abs(richtung.y) < 1e-9
}

function spurgeradenVon(gemerkt: GemerkterPunkt, herkunft: number): Spurgerade[] {
  const geraden: Spurgerade[] = [
    { herkunft, punkt: gemerkt.punkt, richtung: { x: 1, y: 0 } },
    { herkunft, punkt: gemerkt.punkt, richtung: { x: 0, y: 1 } },
  ]
  if (gemerkt.richtung && !istAchsparallel(gemerkt.richtung)) {
    geraden.push({ herkunft, punkt: gemerkt.punkt, richtung: gemerkt.richtung })
  }
  return geraden
}

function lotAufGerade(p: Point, gerade: Spurgerade): { projiziert: Point; distanz: number } {
  const dx = p.x - gerade.punkt.x
  const dy = p.y - gerade.punkt.y
  const t = dx * gerade.richtung.x + dy * gerade.richtung.y
  const projiziert = {
    x: gerade.punkt.x + t * gerade.richtung.x,
    y: gerade.punkt.y + t * gerade.richtung.y,
  }
  return { projiziert, distanz: distance(p, projiziert) }
}

function geradenSchnitt(a: Spurgerade, b: Spurgerade): Point | null {
  const nenner = a.richtung.x * b.richtung.y - a.richtung.y * b.richtung.x
  if (Math.abs(nenner) < 1e-9) return null
  const dx = b.punkt.x - a.punkt.x
  const dy = b.punkt.y - a.punkt.y
  const t = (dx * b.richtung.y - dy * b.richtung.x) / nenner
  return { x: a.punkt.x + t * a.richtung.x, y: a.punkt.y + t * a.richtung.y }
}

export function findeSpurTreffer(
  gemerktePunkte: readonly GemerkterPunkt[],
  zeiger: Point,
  toleranz: number,
): SpurTreffer | null {
  const geraden = gemerktePunkte.flatMap((g, i) => spurgeradenVon(g, i))
  const kandidaten = geraden
    .map((gerade) => ({ gerade, ...lotAufGerade(zeiger, gerade) }))
    .filter((k) => k.distanz <= toleranz)

  let bestesKreuz: { punkt: Point; distanz: number; geraden: Spurgerade[] } | null = null
  for (let i = 0; i < kandidaten.length; i++) {
    for (let j = i + 1; j < kandidaten.length; j++) {
      const a = kandidaten[i].gerade
      const b = kandidaten[j].gerade
      if (a.herkunft === b.herkunft) continue
      const schnitt = geradenSchnitt(a, b)
      if (!schnitt) continue
      const distanz = distance(zeiger, schnitt)
      if (distanz > toleranz) continue
      if (!bestesKreuz || distanz < bestesKreuz.distanz) {
        bestesKreuz = { punkt: schnitt, distanz, geraden: [a, b] }
      }
    }
  }
  if (bestesKreuz)
    return { punkt: bestesKreuz.punkt, art: 'spurkreuz', geraden: bestesKreuz.geraden }

  if (kandidaten.length === 0) return null
  const naechste = kandidaten.reduce((a, b) => (b.distanz < a.distanz ? b : a))
  return { punkt: naechste.projiziert, art: 'spur', geraden: [naechste.gerade] }
}
