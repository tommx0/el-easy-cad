import type { BoundingBox, IfcLage, Point } from '../document-model'
import type { Schnittlinie } from './schnitt'

const WINKEL_SCHRITT = (0.25 * Math.PI) / 180
const MINDEST_DREHUNG = (0.05 * Math.PI) / 180

export function ermittleHauptrichtung(linien: Iterable<Schnittlinie>): number {
  const faecher = Math.round(Math.PI / 2 / WINKEL_SCHRITT)
  const gewicht = new Float64Array(faecher)
  const winkelSumme = new Float64Array(faecher)
  for (const linie of linien) {
    const n = linie.punkte.length
    const kanten = linie.geschlossen ? n : n - 1
    for (let i = 0; i < kanten; i++) {
      const a = linie.punkte[i]
      const b = linie.punkte[(i + 1) % n]
      const laenge = Math.hypot(b.x - a.x, b.y - a.y)
      if (laenge === 0) continue
      let winkel = Math.atan2(b.y - a.y, b.x - a.x) % (Math.PI / 2)
      if (winkel < 0) winkel += Math.PI / 2
      const fach = Math.floor(winkel / WINKEL_SCHRITT) % faecher
      gewicht[fach] += laenge
      winkelSumme[fach] += winkel * laenge
    }
  }
  let bestes = -1
  let besteSumme = 0
  for (let i = 0; i < faecher; i++) {
    const summe = gewicht[(i + faecher - 1) % faecher] + gewicht[i] + gewicht[(i + 1) % faecher]
    if (summe > besteSumme) {
      besteSumme = summe
      bestes = i
    }
  }
  if (bestes < 0) return 0
  let summe = 0
  let mitte = 0
  for (let k = -1; k <= 1; k++) {
    const roh = bestes + k
    const fach = (roh + faecher) % faecher
    const verschiebung = roh < 0 ? -Math.PI / 2 : roh >= faecher ? Math.PI / 2 : 0
    summe += gewicht[fach]
    mitte += winkelSumme[fach] + verschiebung * gewicht[fach]
  }
  let winkel = mitte / summe
  if (winkel >= Math.PI / 4) winkel -= Math.PI / 2
  if (winkel < -Math.PI / 4) winkel += Math.PI / 2
  return Math.abs(winkel) < MINDEST_DREHUNG ? 0 : winkel
}

export function wendeLageAn(p: Point, lage: IfcLage): Point {
  const cos = Math.cos(lage.drehung)
  const sin = Math.sin(lage.drehung)
  return {
    x: p.x * cos - p.y * sin + lage.versatz.x,
    y: p.x * sin + p.y * cos + lage.versatz.y,
  }
}

export function berechneLage(linien: Iterable<Schnittlinie>, drehung: number): IfcLage {
  const ohneVersatz: IfcLage = { versatz: { x: 0, y: 0 }, drehung }
  let minX = Infinity
  let minY = Infinity
  for (const linie of linien) {
    for (const p of linie.punkte) {
      const q = wendeLageAn(p, ohneVersatz)
      if (q.x < minX) minX = q.x
      if (q.y < minY) minY = q.y
    }
  }
  if (!Number.isFinite(minX)) return ohneVersatz
  return { versatz: { x: -minX, y: -minY }, drehung }
}

export function huelleVonLinien(linien: Iterable<Schnittlinie>): BoundingBox | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const linie of linien) {
    for (const p of linie.punkte) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }
  }
  if (!Number.isFinite(minX)) return null
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } }
}
