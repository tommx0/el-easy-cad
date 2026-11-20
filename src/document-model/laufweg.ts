import { distance, distanceToSegment, type Point } from './geometry'
import type { Objekt, WandObjekt } from './objekte'
import { ermittleWandAchsenStuecke, oeffnungenAufWand } from './wand'

export interface LaufwegOptionen {
  zelle?: number
  freiraum?: number
  wunschAbstand?: number
  vereinfachung?: number
  rand?: number
}

export interface Laufweg {
  punkte: Point[]
  laenge: number
}

const STANDARD = {
  zelle: 0.1,
  freiraum: 0.2,
  wunschAbstand: 0.8,
  vereinfachung: 0.15,
  rand: 1.5,
}

interface Strecke {
  a: Point
  b: Point
  halbe: number
}

export function laufwegHindernisse(objekte: readonly Objekt[]): Strecke[] {
  const strecken: Strecke[] = []
  for (const o of objekte) {
    if (o.type !== 'wand') continue
    const wand = o as WandObjekt
    const durchgaenge = oeffnungenAufWand(objekte, wand.id).filter((x) => x.type !== 'fenster')
    for (const achse of ermittleWandAchsenStuecke(wand, durchgaenge)) {
      for (let i = 0; i + 1 < achse.length; i++) {
        strecken.push({ a: achse[i], b: achse[i + 1], halbe: wand.staerke / 2 })
      }
    }
  }
  return strecken
}

export function sucheLaufweg(
  objekte: readonly Objekt[],
  start: Point,
  ziel: Point,
  optionen: LaufwegOptionen = {},
): Laufweg | null {
  const o = { ...STANDARD, ...optionen }
  const strecken = laufwegHindernisse(objekte)

  let minX = Math.min(start.x, ziel.x)
  let minY = Math.min(start.y, ziel.y)
  let maxX = Math.max(start.x, ziel.x)
  let maxY = Math.max(start.y, ziel.y)
  for (const s of strecken) {
    minX = Math.min(minX, s.a.x, s.b.x)
    minY = Math.min(minY, s.a.y, s.b.y)
    maxX = Math.max(maxX, s.a.x, s.b.x)
    maxY = Math.max(maxY, s.a.y, s.b.y)
  }
  minX -= o.rand
  minY -= o.rand
  maxX += o.rand
  maxY += o.rand
  const nx = Math.max(1, Math.ceil((maxX - minX) / o.zelle))
  const ny = Math.max(1, Math.ceil((maxY - minY) / o.zelle))
  const mitte = (i: number, j: number): Point => ({
    x: minX + (i + 0.5) * o.zelle,
    y: minY + (j + 0.5) * o.zelle,
  })

  const abstand = wandAbstaende(strecken, nx, ny, { x: minX, y: minY }, o.zelle, o.wunschAbstand)
  const frei = (k: number) => abstand[k] >= o.freiraum

  const zelleVon = (p: Point) => {
    const i = Math.min(nx - 1, Math.max(0, Math.floor((p.x - minX) / o.zelle)))
    const j = Math.min(ny - 1, Math.max(0, Math.floor((p.y - minY) / o.zelle)))
    return j * nx + i
  }
  const startZelle = naechsteFreieZelle(zelleVon(start), nx, ny, frei)
  const zielZelle = naechsteFreieZelle(zelleVon(ziel), nx, ny, frei)
  if (startZelle === null || zielZelle === null) return null

  const pfad = aStern(startZelle, zielZelle, nx, ny, frei, (k) => {
    const d = abstand[k]
    return d >= o.wunschAbstand ? 1 : 1 + 2 * ((o.wunschAbstand - d) / o.wunschAbstand)
  })
  if (!pfad) return null

  const zellPunkte = pfad.map((k) => mitte(k % nx, Math.floor(k / nx)))
  const roh = [start, ...zellPunkte, ziel]
  const punkte = vereinfache(entferneDoppelte(roh), o.vereinfachung)
  let laenge = 0
  for (let i = 0; i + 1 < punkte.length; i++) laenge += distance(punkte[i], punkte[i + 1])
  return { punkte, laenge }
}

function wandAbstaende(
  strecken: Strecke[],
  nx: number,
  ny: number,
  ursprung: Point,
  zelle: number,
  deckel: number,
): Float32Array {
  const abstand = new Float32Array(nx * ny).fill(deckel)
  const index = (wert: number, u: number) => (wert - u) / zelle - 0.5
  for (const s of strecken) {
    const reichweite = s.halbe + deckel
    const i0 = Math.max(0, Math.floor(index(Math.min(s.a.x, s.b.x) - reichweite, ursprung.x)))
    const i1 = Math.min(nx - 1, Math.ceil(index(Math.max(s.a.x, s.b.x) + reichweite, ursprung.x)))
    const j0 = Math.max(0, Math.floor(index(Math.min(s.a.y, s.b.y) - reichweite, ursprung.y)))
    const j1 = Math.min(ny - 1, Math.ceil(index(Math.max(s.a.y, s.b.y) + reichweite, ursprung.y)))
    for (let j = j0; j <= j1; j++) {
      const y = ursprung.y + (j + 0.5) * zelle
      for (let i = i0; i <= i1; i++) {
        const d = distanceToSegment({ x: ursprung.x + (i + 0.5) * zelle, y }, s.a, s.b) - s.halbe
        const k = j * nx + i
        if (d < abstand[k]) abstand[k] = d
      }
    }
  }
  return abstand
}

function naechsteFreieZelle(
  k: number,
  nx: number,
  ny: number,
  frei: (k: number) => boolean,
): number | null {
  if (frei(k)) return k
  const gesehen = new Uint8Array(nx * ny)
  const schlange = [k]
  gesehen[k] = 1
  const grenze = 2000
  for (let kopf = 0; kopf < schlange.length && kopf < grenze; kopf++) {
    const c = schlange[kopf]
    const i = c % nx
    const j = Math.floor(c / nx)
    for (const [di, dj] of VIER) {
      const ni = i + di
      const nj = j + dj
      if (ni < 0 || nj < 0 || ni >= nx || nj >= ny) continue
      const n = nj * nx + ni
      if (gesehen[n]) continue
      if (frei(n)) return n
      gesehen[n] = 1
      schlange.push(n)
    }
  }
  return null
}

const VIER = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

const ACHT = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
] as const

function aStern(
  start: number,
  ziel: number,
  nx: number,
  ny: number,
  frei: (k: number) => boolean,
  faktor: (k: number) => number,
): number[] | null {
  const n = nx * ny
  const g = new Float64Array(n).fill(Infinity)
  const vorher = new Int32Array(n).fill(-1)
  const fertig = new Uint8Array(n)
  const zi = ziel % nx
  const zj = Math.floor(ziel / nx)
  const h = (k: number) => {
    const dx = Math.abs((k % nx) - zi)
    const dy = Math.abs(Math.floor(k / nx) - zj)
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy)
  }
  const heap = new MinHeap()
  g[start] = 0
  heap.push(start, h(start))
  while (heap.size > 0) {
    const k = heap.pop()
    if (fertig[k]) continue
    if (k === ziel) break
    fertig[k] = 1
    const i = k % nx
    const j = Math.floor(k / nx)
    for (const [di, dj, l] of ACHT) {
      const ni = i + di
      const nj = j + dj
      if (ni < 0 || nj < 0 || ni >= nx || nj >= ny) continue
      const m = nj * nx + ni
      if (fertig[m] || !frei(m)) continue
      if (di !== 0 && dj !== 0 && (!frei(j * nx + ni) || !frei(nj * nx + i))) continue
      const kosten = g[k] + l * (faktor(k) + faktor(m)) * 0.5
      if (kosten < g[m]) {
        g[m] = kosten
        vorher[m] = k
        heap.push(m, kosten + h(m))
      }
    }
  }
  if (g[ziel] === Infinity) return null
  const pfad: number[] = []
  for (let k = ziel; k !== -1; k = vorher[k]) pfad.push(k)
  return pfad.reverse()
}

class MinHeap {
  private werte: number[] = []
  private prio: number[] = []
  get size() {
    return this.werte.length
  }
  push(wert: number, p: number) {
    this.werte.push(wert)
    this.prio.push(p)
    let i = this.werte.length - 1
    while (i > 0) {
      const e = (i - 1) >> 1
      if (this.prio[e] <= this.prio[i]) break
      this.tausche(i, e)
      i = e
    }
  }
  pop(): number {
    const oben = this.werte[0]
    const letzterWert = this.werte.pop()!
    const letztePrio = this.prio.pop()!
    if (this.werte.length > 0) {
      this.werte[0] = letzterWert
      this.prio[0] = letztePrio
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < this.werte.length && this.prio[l] < this.prio[m]) m = l
        if (r < this.werte.length && this.prio[r] < this.prio[m]) m = r
        if (m === i) break
        this.tausche(i, m)
        i = m
      }
    }
    return oben
  }
  private tausche(a: number, b: number) {
    ;[this.werte[a], this.werte[b]] = [this.werte[b], this.werte[a]]
    ;[this.prio[a], this.prio[b]] = [this.prio[b], this.prio[a]]
  }
}

function entferneDoppelte(punkte: Point[]): Point[] {
  return punkte.filter((p, i) => i === 0 || distance(p, punkte[i - 1]) > 1e-9)
}

export function vereinfache(punkte: Point[], toleranz: number): Point[] {
  if (punkte.length <= 2) return punkte
  let maxD = -1
  let maxI = 0
  const a = punkte[0]
  const b = punkte[punkte.length - 1]
  for (let i = 1; i < punkte.length - 1; i++) {
    const d = distanceToSegment(punkte[i], a, b)
    if (d > maxD) {
      maxD = d
      maxI = i
    }
  }
  if (maxD <= toleranz) return [a, b]
  const links = vereinfache(punkte.slice(0, maxI + 1), toleranz)
  const rechts = vereinfache(punkte.slice(maxI), toleranz)
  return [...links.slice(0, -1), ...rechts]
}
