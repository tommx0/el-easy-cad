import type { Blatt } from './blatt'
import type { BoundingBox, Point } from './geometry'

export const PDF_PUNKT_MM = 25.4 / 72

export const NORMMASSSTAEBE = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000] as const

export const NORMMASSSTAB_TOLERANZ = 0.02

export function pdfMassstabNenner(meterProEinheit: number): number {
  return (meterProEinheit * 1000) / PDF_PUNKT_MM
}

export function meterProPdfPunkt(nenner: number): number {
  return (nenner * PDF_PUNKT_MM) / 1000
}

export function erkenneNormmassstab(nenner: number): number | null {
  if (!(nenner > 0) || !Number.isFinite(nenner)) return null
  for (const norm of NORMMASSSTAEBE) {
    if (Math.abs(nenner - norm) <= norm * NORMMASSSTAB_TOLERANZ) return norm
  }
  return null
}

export function planMassstabNenner(blatt: Pick<Blatt, 'hintergrund' | 'massstab'>): number | null {
  const h = blatt.hintergrund
  if (h?.typ !== 'pdf' || !h.kalibrierung || !blatt.massstab) return null
  return h.kalibrierung.normmassstab ?? pdfMassstabNenner(blatt.massstab)
}

export function planMassstabText(nenner: number): string {
  const gerundet = Math.round(nenner * 10) / 10
  return `1 : ${Number.isInteger(gerundet) ? gerundet : gerundet.toFixed(1)}`
}

const RAHMEN_ANTEIL = 0.8
const RAHMEN_RUNDEN = 2
const RAHMEN_ABSTAND_BLATT = 0.1
const RAHMEN_ABSTAND_ZWEITER = 0.03

export function pdfInhaltsrahmen(
  linien: { a: Point; b: Point }[],
  breite: number,
  hoehe: number,
): BoundingBox | null {
  const klemme = (p: Point): Point => ({
    x: Math.min(Math.max(p.x, 0), breite),
    y: Math.min(Math.max(p.y, 0), hoehe),
  })
  let rest = linien.map((l) => ({ a: klemme(l.a), b: klemme(l.b) }))
  let rahmen = umschliessend(rest)
  let bezug: BoundingBox = { min: { x: 0, y: 0 }, max: { x: breite, y: hoehe } }
  let abstand = RAHMEN_ABSTAND_BLATT
  for (let runde = 0; rahmen && runde < RAHMEN_RUNDEN; runde++) {
    if (!liegtNahAn(rahmen, bezug, abstand)) break
    const toleranz = Math.max(rahmen.max.x - rahmen.min.x, rahmen.max.y - rahmen.min.y) * 0.002
    const aufDemRand = rest.filter((l) => liegtAufRand(l, rahmen!, toleranz))
    const gedeckt = aufDemRand.reduce((s, l) => s + Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y), 0)
    const umfang = 2 * (rahmen.max.x - rahmen.min.x + rahmen.max.y - rahmen.min.y)
    if (umfang <= 0 || gedeckt < umfang * RAHMEN_ANTEIL) break
    const innen = rest.filter((l) => !aufDemRand.includes(l))
    const neu = umschliessend(innen)
    if (!neu) break
    rest = innen
    bezug = rahmen
    abstand = RAHMEN_ABSTAND_ZWEITER
    rahmen = neu
  }
  return rahmen
}

function umschliessend(linien: { a: Point; b: Point }[]): BoundingBox | null {
  if (linien.length === 0) return null
  const xs = linien.flatMap((l) => [l.a.x, l.b.x])
  const ys = linien.flatMap((l) => [l.a.y, l.b.y])
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  }
}

function liegtNahAn(r: BoundingBox, bezug: BoundingBox, anteil: number): boolean {
  const bx = (bezug.max.x - bezug.min.x) * anteil
  const by = (bezug.max.y - bezug.min.y) * anteil
  return (
    r.min.x - bezug.min.x <= bx &&
    bezug.max.x - r.max.x <= bx &&
    r.min.y - bezug.min.y <= by &&
    bezug.max.y - r.max.y <= by
  )
}

function liegtAufRand(l: { a: Point; b: Point }, r: BoundingBox, t: number): boolean {
  const nah = (u: number, v: number) => Math.abs(u - v) <= t
  const waagerecht = nah(l.a.y, l.b.y)
  const senkrecht = nah(l.a.x, l.b.x)
  if (waagerecht && (nah(l.a.y, r.min.y) || nah(l.a.y, r.max.y))) return true
  return senkrecht && (nah(l.a.x, r.min.x) || nah(l.a.x, r.max.x))
}
