import type { Point } from '../document-model'
import { distance } from '../document-model'
import type { RoutingGrid } from './grid'

export interface BelegteBahn {
  punkte: Point[]
  netz: string
  schluessel?: string
}

export interface Belegung {
  bahnen: BelegteBahn[]
  bahnabstandMeter: number
  kreuzFaktor?: number
}

export interface BelegungsAufruf {
  belegung: Belegung
  netz: string
}

export const ACHSE_WAAGRECHT = 1
export const ACHSE_SENKRECHT = 2
export const ACHSE_STEIGEND = 4
export const ACHSE_FALLEND = 8

export const ACHSE_JE_RICHTUNG: readonly number[] = [
  ACHSE_WAAGRECHT,
  ACHSE_STEIGEND,
  ACHSE_SENKRECHT,
  ACHSE_FALLEND,
  ACHSE_WAAGRECHT,
  ACHSE_STEIGEND,
  ACHSE_SENKRECHT,
  ACHSE_FALLEND,
]

export const BELEGUNG_LAENGS_FAKTOR = 10
export const BELEGUNG_NAHE_FAKTOR = 1

export interface BelegungsKosten {
  laengs: Uint8Array
  nahe: Uint8Array
  laengsFaktor: number
  naheFaktor: number
  kreuzKosten: number
}

function achseVon(a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ay <= ax * 0.4) return ACHSE_WAAGRECHT
  if (ax <= ay * 0.4) return ACHSE_SENKRECHT
  return dx * dy > 0 ? ACHSE_STEIGEND : ACHSE_FALLEND
}

function querVersatz(achse: number): { dx: number; dy: number } {
  if (achse === ACHSE_WAAGRECHT) return { dx: 0, dy: 1 }
  if (achse === ACHSE_SENKRECHT) return { dx: 1, dy: 0 }
  if (achse === ACHSE_STEIGEND) return { dx: -1, dy: 1 }
  return { dx: 1, dy: 1 }
}

export function rastereBelegung(
  grid: RoutingGrid,
  aufruf: BelegungsAufruf,
  freiUm: readonly Point[],
  kreuzKosten: number,
): BelegungsKosten | null {
  const { breite, hoehe, zellgroesse } = grid
  const laengs = new Uint8Array(breite * hoehe)
  const belegt: number[] = []
  for (const bahn of aufruf.belegung.bahnen) {
    if (bahn.netz === aufruf.netz) continue
    for (let i = 0; i < bahn.punkte.length - 1; i++) {
      const a = bahn.punkte[i]
      const b = bahn.punkte[i + 1]
      const laenge = distance(a, b)
      if (laenge < 1e-9) continue
      const achse = achseVon(a, b)
      const schritte = Math.ceil(laenge / (zellgroesse / 2))
      for (let s = 0; s <= schritte; s++) {
        const t = s / schritte
        const z = grid.weltZuZelle({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
        if (z.gx < 0 || z.gy < 0 || z.gx >= breite || z.gy >= hoehe) continue
        const index = z.gy * breite + z.gx
        if (laengs[index] === 0) belegt.push(index)
        laengs[index] |= achse
      }
    }
  }
  if (belegt.length === 0) return null

  const reichweite = Math.max(
    0,
    Math.ceil(aufruf.belegung.bahnabstandMeter / zellgroesse - 1e-9) - 1,
  )
  const nahe = new Uint8Array(breite * hoehe)
  for (const index of belegt) {
    const gx = index % breite
    const gy = (index - gx) / breite
    for (const achse of [ACHSE_WAAGRECHT, ACHSE_SENKRECHT, ACHSE_STEIGEND, ACHSE_FALLEND]) {
      if (!(laengs[index] & achse)) continue
      const { dx, dy } = querVersatz(achse)
      for (let d = 1; d <= reichweite; d++) {
        for (const seite of [1, -1]) {
          const nx = gx + dx * d * seite
          const ny = gy + dy * d * seite
          if (nx < 0 || ny < 0 || nx >= breite || ny >= hoehe) continue
          nahe[ny * breite + nx] |= achse
        }
      }
    }
  }
  const freiRadius = 2 * aufruf.belegung.bahnabstandMeter
  for (const p of freiUm) {
    const mitte = grid.weltZuZelle(p)
    const r = Math.ceil(freiRadius / zellgroesse)
    for (let gy = Math.max(0, mitte.gy - r); gy <= Math.min(hoehe - 1, mitte.gy + r); gy++) {
      for (let gx = Math.max(0, mitte.gx - r); gx <= Math.min(breite - 1, mitte.gx + r); gx++) {
        if (distance(grid.zelleZuWelt({ gx, gy }), p) <= freiRadius) nahe[gy * breite + gx] = 0
      }
    }
  }
  return {
    laengs,
    nahe,
    laengsFaktor: BELEGUNG_LAENGS_FAKTOR,
    naheFaktor: BELEGUNG_NAHE_FAKTOR,
    kreuzKosten,
  }
}
