import type { Point } from './geometry'
import type { TreppenObjekt } from './objekte'
import { rechteckEcken } from './objekte'
import { ermittleTreppenGeometrie } from './treppe'

const EPS = 1e-9
const MIN_FLAECHE = 1e-4

export function treppenUmriss(treppe: TreppenObjekt): Point[] {
  if (treppe.form === 'l-kehre') {
    const kontur = ermittleTreppenGeometrie(treppe).kontur
    if (kontur && kontur.length >= 3) return kontur
  }
  return rechteckEcken(treppe)
}

export function polygonFlaeche(p: readonly Point[]): number {
  let a = 0
  for (let i = 0; i < p.length; i++) {
    const q = p[i]
    const r = p[(i + 1) % p.length]
    a += q.x * r.y - r.x * q.y
  }
  return a / 2
}

function gegenUhr(p: readonly Point[]): Point[] {
  return polygonFlaeche(p) < 0 ? [...p].reverse() : [...p]
}

function kreuz(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

function imPolygon(punkt: Point, poly: readonly Point[]): boolean {
  let innen = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (Math.abs(kreuz(a, b, punkt)) < EPS && aufStrecke(punkt, a, b)) return true
    if (a.y > punkt.y !== b.y > punkt.y) {
      const x = ((b.x - a.x) * (punkt.y - a.y)) / (b.y - a.y) + a.x
      if (punkt.x < x) innen = !innen
    }
  }
  return innen
}

function aufStrecke(p: Point, a: Point, b: Point): boolean {
  return (
    p.x >= Math.min(a.x, b.x) - EPS &&
    p.x <= Math.max(a.x, b.x) + EPS &&
    p.y >= Math.min(a.y, b.y) - EPS &&
    p.y <= Math.max(a.y, b.y) + EPS
  )
}

function kreuzen(a: Point, b: Point, c: Point, d: Point): boolean {
  const d1 = kreuz(c, d, a)
  const d2 = kreuz(c, d, b)
  const d3 = kreuz(a, b, c)
  const d4 = kreuz(a, b, d)
  return d1 * d2 < -EPS && d3 * d4 < -EPS
}

function liegtIn(innen: readonly Point[], aussen: readonly Point[]): boolean {
  if (!innen.every((p) => imPolygon(p, aussen))) return false
  for (let i = 0; i < innen.length; i++)
    for (let j = 0; j < aussen.length; j++)
      if (
        kreuzen(innen[i], innen[(i + 1) % innen.length], aussen[j], aussen[(j + 1) % aussen.length])
      )
        return false
  return true
}

function konvexeTeile(poly: readonly Point[], tiefe = 0): Point[][] {
  const p = gegenUhr(poly)
  const n = p.length
  const i = p.findIndex((q, k) => kreuz(p[(k - 1 + n) % n], q, p[(k + 1) % n]) < -EPS)
  if (i === -1 || tiefe > 8) return [p]
  const von = p[(i - 1 + n) % n]
  const r = { x: p[i].x - von.x, y: p[i].y - von.y }
  let bester: { t: number; j: number; punkt: Point } | null = null
  for (let j = 0; j < n; j++) {
    if (j === i || (j + 1) % n === i) continue
    const a = p[j]
    const b = p[(j + 1) % n]
    const s = { x: b.x - a.x, y: b.y - a.y }
    const nenner = r.x * s.y - r.y * s.x
    if (Math.abs(nenner) < EPS) continue
    const t = ((a.x - p[i].x) * s.y - (a.y - p[i].y) * s.x) / nenner
    const u = ((a.x - p[i].x) * r.y - (a.y - p[i].y) * r.x) / nenner
    if (t <= EPS || u < -EPS || u > 1 + EPS) continue
    if (!bester || t < bester.t)
      bester = { t, j, punkt: { x: p[i].x + r.x * t, y: p[i].y + r.y * t } }
  }
  if (!bester) return [p]
  const teil1: Point[] = [p[i]]
  for (let k = (i + 1) % n; k !== (bester.j + 1) % n; k = (k + 1) % n) teil1.push(p[k])
  teil1.push(bester.punkt)
  const teil2: Point[] = [bester.punkt]
  for (let k = (bester.j + 1) % n; k !== i; k = (k + 1) % n) teil2.push(p[k])
  teil2.push(p[i])
  return [...konvexeTeile(teil1, tiefe + 1), ...konvexeTeile(teil2, tiefe + 1)]
}

function beschneide(polygon: readonly Point[], fenster: readonly Point[]): Point[] {
  let ergebnis = [...polygon]
  for (let i = 0; i < fenster.length && ergebnis.length > 0; i++) {
    const a = fenster[i]
    const b = fenster[(i + 1) % fenster.length]
    const eingang = ergebnis
    ergebnis = []
    for (let k = 0; k < eingang.length; k++) {
      const p = eingang[k]
      const q = eingang[(k + 1) % eingang.length]
      const pInnen = kreuz(a, b, p) >= -EPS
      const qInnen = kreuz(a, b, q) >= -EPS
      if (pInnen) ergebnis.push(p)
      if (pInnen !== qInnen) {
        const dp = kreuz(a, b, p)
        const dq = kreuz(a, b, q)
        const t = dp / (dp - dq)
        ergebnis.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t })
      }
    }
  }
  return ergebnis
}

export function aussparungenInPlatte(
  platte: readonly Point[],
  oeffnungen: readonly (readonly Point[])[],
): Point[][] | null {
  if (platte.length < 3) return []
  const plattenFlaeche = Math.abs(polygonFlaeche(platte))
  const loecher: Point[][] = []
  for (const umriss of oeffnungen) {
    if (umriss.length < 3) continue
    if (liegtIn(umriss, platte)) {
      loecher.push([...umriss])
      continue
    }
    for (const teil of konvexeTeile(umriss)) {
      const schnitt = beschneide(platte, teil)
      if (schnitt.length >= 3 && Math.abs(polygonFlaeche(schnitt)) > MIN_FLAECHE)
        loecher.push(schnitt)
    }
  }
  const ausgespart = loecher.reduce((summe, l) => summe + Math.abs(polygonFlaeche(l)), 0)
  return ausgespart >= plattenFlaeche - MIN_FLAECHE ? null : loecher
}
