import type { Point } from '../document-model'
import { distance, pointInPolygon } from '../document-model'

export function konvexeHuelle(punkte: readonly Point[]): Point[] {
  const sortiert = [...punkte].sort((a, b) => a.x - b.x || a.y - b.y)
  if (sortiert.length < 3) return sortiert
  const kreuz = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const unten: Point[] = []
  for (const p of sortiert) {
    while (unten.length >= 2 && kreuz(unten[unten.length - 2], unten[unten.length - 1], p) <= 0)
      unten.pop()
    unten.push(p)
  }
  const oben: Point[] = []
  for (let i = sortiert.length - 1; i >= 0; i--) {
    const p = sortiert[i]
    while (oben.length >= 2 && kreuz(oben[oben.length - 2], oben[oben.length - 1], p) <= 0)
      oben.pop()
    oben.push(p)
  }
  unten.pop()
  oben.pop()
  return [...unten, ...oben]
}

export function polygonFlaeche(polygon: readonly Point[]): number {
  let summe = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    summe += a.x * b.y - b.x * a.y
  }
  return Math.abs(summe) / 2
}

export interface Rechteck {
  mitte: Point
  richtung: number
  laenge: number
  breite: number
}

export function kleinstesRechteck(punkte: readonly Point[]): Rechteck | null {
  const huelle = konvexeHuelle(punkte)
  if (huelle.length < 2) return null
  let bestes: Rechteck | null = null
  let besteFlaeche = Infinity
  for (let i = 0; i < huelle.length; i++) {
    const a = huelle[i]
    const b = huelle[(i + 1) % huelle.length]
    const l = distance(a, b)
    if (l < 1e-9) continue
    const ux = (b.x - a.x) / l
    const uy = (b.y - a.y) / l
    let minU = Infinity
    let maxU = -Infinity
    let minV = Infinity
    let maxV = -Infinity
    for (const p of huelle) {
      const u = p.x * ux + p.y * uy
      const v = -p.x * uy + p.y * ux
      minU = Math.min(minU, u)
      maxU = Math.max(maxU, u)
      minV = Math.min(minV, v)
      maxV = Math.max(maxV, v)
    }
    const flaeche = (maxU - minU) * (maxV - minV)
    if (flaeche >= besteFlaeche - 1e-12) continue
    besteFlaeche = flaeche
    const mu = (minU + maxU) / 2
    const mv = (minV + maxV) / 2
    const mitte = { x: mu * ux - mv * uy, y: mu * uy + mv * ux }
    const ausdehnungU = maxU - minU
    const ausdehnungV = maxV - minV
    bestes =
      ausdehnungU >= ausdehnungV
        ? { mitte, richtung: Math.atan2(uy, ux), laenge: ausdehnungU, breite: ausdehnungV }
        : { mitte, richtung: Math.atan2(ux, -uy), laenge: ausdehnungV, breite: ausdehnungU }
  }
  return bestes
}

const MINDEST_RECHTECKFUELLUNG = 0.85
const WANDSTAERKE_BEREICH = [0.03, 1.2] as const

export function wandAusUmriss(
  umrisse: readonly Point[][],
): { punkte: [Point, Point]; staerke: number } | null {
  const punkte = umrisse.flat()
  const rechteck = kleinstesRechteck(punkte)
  if (!rechteck || rechteck.breite <= 0) return null
  if (rechteck.breite < WANDSTAERKE_BEREICH[0] || rechteck.breite > WANDSTAERKE_BEREICH[1])
    return null
  if (rechteck.laenge < rechteck.breite) return null
  const huelle = konvexeHuelle(punkte)
  if (polygonFlaeche(huelle) < MINDEST_RECHTECKFUELLUNG * rechteck.laenge * rechteck.breite)
    return null
  const dx = (Math.cos(rechteck.richtung) * rechteck.laenge) / 2
  const dy = (Math.sin(rechteck.richtung) * rechteck.laenge) / 2
  return {
    punkte: [
      { x: rechteck.mitte.x - dx, y: rechteck.mitte.y - dy },
      { x: rechteck.mitte.x + dx, y: rechteck.mitte.y + dy },
    ],
    staerke: rechteck.breite,
  }
}

export function querAusdehnung(
  achse: readonly Point[],
  punkte: readonly Point[],
): { min: number; max: number } | null {
  if (achse.length < 2 || punkte.length === 0) return null
  let min = Infinity
  let max = -Infinity
  for (const p of punkte) {
    let besterAbstand = Infinity
    let bestesVorzeichen = 0
    for (let i = 0; i + 1 < achse.length; i++) {
      const a = achse[i]
      const b = achse[i + 1]
      const l = distance(a, b)
      if (l < 1e-9) continue
      const ux = (b.x - a.x) / l
      const uy = (b.y - a.y) / l
      const s = Math.max(0, Math.min(l, (p.x - a.x) * ux + (p.y - a.y) * uy))
      const q = { x: a.x + ux * s, y: a.y + uy * s }
      const d = distance(p, q)
      if (d < besterAbstand) {
        besterAbstand = d
        bestesVorzeichen = (p.x - a.x) * -uy + (p.y - a.y) * ux
      }
    }
    if (!Number.isFinite(besterAbstand)) continue
    const v = bestesVorzeichen >= 0 ? besterAbstand : -besterAbstand
    min = Math.min(min, v)
    max = Math.max(max, v)
  }
  return Number.isFinite(min) ? { min, max } : null
}

export function versetzteAchse(achse: readonly Point[], versatz: number): Point[] {
  if (Math.abs(versatz) < 1e-9 || achse.length < 2) return [...achse]
  const normale = (a: Point, b: Point): Point => {
    const l = distance(a, b) || 1
    return { x: -(b.y - a.y) / l, y: (b.x - a.x) / l }
  }
  return achse.map((p, i) => {
    const vor = i > 0 ? normale(achse[i - 1], p) : null
    const nach = i + 1 < achse.length ? normale(p, achse[i + 1]) : null
    const n = vor && nach ? { x: vor.x + nach.x, y: vor.y + nach.y } : (vor ?? nach!)
    const laenge = Math.hypot(n.x, n.y)
    const cos = vor && nach ? (vor.x * nach.x + vor.y * nach.y + 1) / 2 : 1
    const faktor = versatz / (laenge || 1) / Math.sqrt(Math.max(cos, 0.05))
    return { x: p.x + n.x * faktor, y: p.y + n.y * faktor }
  })
}

const KNOTEN_FANG = 0.005

export function verbindeWandEnden<T extends { punkte: Point[]; staerke: number }>(
  waende: readonly T[],
): T[] {
  const ergebnis = waende.map((w) => ({ ...w, punkte: [...w.punkte] }))
  type Ende = { wand: number; start: boolean }
  const enden: Ende[] = ergebnis.flatMap((w, i) =>
    w.punkte.length >= 2
      ? [
          { wand: i, start: true },
          { wand: i, start: false },
        ]
      : [],
  )
  const punktVon = (e: Ende) => {
    const p = ergebnis[e.wand].punkte
    return e.start ? p[0] : p[p.length - 1]
  }
  const setze = (e: Ende, q: Point) => {
    const p = ergebnis[e.wand].punkte
    p[e.start ? 0 : p.length - 1] = q
  }
  const richtungVon = (e: Ende): Point => {
    const p = ergebnis[e.wand].punkte
    const a = e.start ? p[0] : p[p.length - 1]
    const b = e.start ? p[1] : p[p.length - 2]
    const l = distance(a, b) || 1
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }
  }

  const gruppiert = new Set<number>()
  for (let i = 0; i < enden.length; i++) {
    if (gruppiert.has(i)) continue
    const gruppe = [i]
    for (let j = i + 1; j < enden.length; j++) {
      if (gruppiert.has(j) || enden[j].wand === enden[i].wand) continue
      if (distance(punktVon(enden[i]), punktVon(enden[j])) <= KNOTEN_FANG) gruppe.push(j)
    }
    if (gruppe.length < 2) continue
    for (const k of gruppe) gruppiert.add(k)
    const mitte = gruppe.reduce(
      (s, k) => ({
        x: s.x + punktVon(enden[k]).x / gruppe.length,
        y: s.y + punktVon(enden[k]).y / gruppe.length,
      }),
      { x: 0, y: 0 },
    )
    for (const k of gruppe) setze(enden[k], mitte)
  }

  for (let i = 0; i < enden.length; i++) {
    if (gruppiert.has(i)) continue
    const a = enden[i]
    const reichweite = (j: number) =>
      Math.max(ergebnis[a.wand].staerke, ergebnis[enden[j].wand].staerke) * 1.01
    const nachbarn: number[] = []
    for (let j = 0; j < enden.length; j++) {
      if (j === i || enden[j].wand === a.wand) continue
      if (distance(punktVon(a), punktVon(enden[j])) <= reichweite(j)) nachbarn.push(j)
    }
    if (nachbarn.length !== 1 || gruppiert.has(nachbarn[0])) continue
    const b = enden[nachbarn[0]]
    const ra = richtungVon(a)
    const rb = richtungVon(b)
    const kreuz = ra.x * rb.y - ra.y * rb.x
    if (Math.abs(kreuz) < 0.34) continue
    const pa = punktVon(a)
    const pb = punktVon(b)
    const s = ((pb.x - pa.x) * rb.y - (pb.y - pa.y) * rb.x) / kreuz
    const ecke = { x: pa.x + ra.x * s, y: pa.y + ra.y * s }
    const r = reichweite(nachbarn[0])
    if (distance(ecke, pa) > r || distance(ecke, pb) > r) continue
    setze(a, ecke)
    setze(b, ecke)
    gruppiert.add(i)
    gruppiert.add(nachbarn[0])
  }
  return ergebnis
}

export interface TreppenLage {
  mitte: Point
  breite: number
  hoehe: number
  drehung: number
}

export function treppeAusPunkten(
  punkte: readonly Point[],
  hoehen: readonly number[],
): TreppenLage | null {
  const rechteck = kleinstesRechteck(punkte)
  if (!rechteck || rechteck.breite < 0.1) return null
  const steigung = (winkel: number) => {
    const ux = Math.cos(winkel)
    const uy = Math.sin(winkel)
    let su = 0
    let sh = 0
    for (let i = 0; i < punkte.length; i++) {
      su += punkte[i].x * ux + punkte[i].y * uy
      sh += hoehen[i]
    }
    const mu = su / punkte.length
    const mh = sh / punkte.length
    let kov = 0
    let varianz = 0
    for (let i = 0; i < punkte.length; i++) {
      const u = punkte[i].x * ux + punkte[i].y * uy - mu
      kov += u * (hoehen[i] - mh)
      varianz += u * u
    }
    return varianz > 0 ? kov / varianz : 0
  }
  const laengs = steigung(rechteck.richtung)
  const quer = steigung(rechteck.richtung + Math.PI / 2)
  const laufLaengs = Math.abs(laengs) >= Math.abs(quer)
  let lauf = laufLaengs ? rechteck.richtung : rechteck.richtung + Math.PI / 2
  if ((laufLaengs ? laengs : quer) < 0) lauf += Math.PI
  const laenge = laufLaengs ? rechteck.laenge : rechteck.breite
  const breite = laufLaengs ? rechteck.breite : rechteck.laenge
  return { mitte: rechteck.mitte, breite, hoehe: laenge, drehung: lauf - Math.PI / 2 }
}

export function innererPunkt(polygon: readonly Point[]): Point | null {
  if (polygon.length < 3) return null
  const flaeche = polygonFlaeche(polygon)
  if (flaeche < 1e-6) return null
  let cx = 0
  let cy = 0
  let a = 0
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i]
    const q = polygon[(i + 1) % polygon.length]
    const k = p.x * q.y - q.x * p.y
    a += k
    cx += (p.x + q.x) * k
    cy += (p.y + q.y) * k
  }
  const schwerpunkt = { x: cx / (3 * a), y: cy / (3 * a) }
  const liste = [...polygon]
  const randabstand = (p: Point) => {
    let min = Infinity
    for (let i = 0; i < liste.length; i++) {
      const s = liste[i]
      const e = liste[(i + 1) % liste.length]
      const l2 = (e.x - s.x) ** 2 + (e.y - s.y) ** 2
      const t =
        l2 > 0
          ? Math.max(0, Math.min(1, ((p.x - s.x) * (e.x - s.x) + (p.y - s.y) * (e.y - s.y)) / l2))
          : 0
      min = Math.min(min, Math.hypot(p.x - (s.x + t * (e.x - s.x)), p.y - (s.y + t * (e.y - s.y))))
    }
    return min
  }
  if (pointInPolygon(schwerpunkt, liste) && randabstand(schwerpunkt) >= 0.15) return schwerpunkt
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of liste) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const schritte = 24
  let bester: Point | null = null
  let besterAbstand = 0
  for (let i = 0; i <= schritte; i++) {
    for (let j = 0; j <= schritte; j++) {
      const p = {
        x: minX + ((maxX - minX) * i) / schritte,
        y: minY + ((maxY - minY) * j) / schritte,
      }
      if (!pointInPolygon(p, liste)) continue
      const d = randabstand(p)
      if (d > besterAbstand) {
        besterAbstand = d
        bester = p
      }
    }
  }
  return bester ?? (pointInPolygon(schwerpunkt, liste) ? schwerpunkt : null)
}
