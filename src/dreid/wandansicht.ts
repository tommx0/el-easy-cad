import type { Point } from '../document-model'

export interface AnsichtsOeffnung {
  von: number
  bis: number
  unten: number
  oben: number
}

export interface AnsichtsFlaeche {
  umriss: Point[]
  loecher: Point[][]
}

export interface SzenenWandAbschnitt {
  von: Point
  bis: Point
  laenge: number
  innenVon: Point
  aussenVon: Point
  innenBis: Point
  aussenBis: Point
  ansicht: AnsichtsFlaeche[]
  fugeAmAnfang: boolean
  fugeAmEnde: boolean
  oeffnungen: { von: number; bis: number; info: { titel: string; zeilen: string[] } }[]
}

const RASTER_EPS = 1e-4
const ENDE_EPS = RASTER_EPS / 2

function stufen(werte: number[]): number[] {
  const sortiert = [...werte].sort((a, b) => a - b)
  const ergebnis: number[] = []
  for (const w of sortiert)
    if (ergebnis.length === 0 || w - ergebnis[ergebnis.length - 1] > RASTER_EPS) ergebnis.push(w)
  return ergebnis
}

function naechsterIndex(stufen: readonly number[], wert: number): number {
  let beste = 0
  for (let i = 1; i < stufen.length; i++)
    if (Math.abs(stufen[i] - wert) < Math.abs(stufen[beste] - wert)) beste = i
  return beste
}

const begrenzt = (w: number, max: number) => Math.min(max, Math.max(0, w))

export function wandAnsicht(
  laenge: number,
  hoehe: number,
  oeffnungen: readonly AnsichtsOeffnung[],
): AnsichtsFlaeche[] {
  if (laenge <= RASTER_EPS || hoehe <= RASTER_EPS) return []
  const offen = oeffnungen
    .map((o) => ({
      von: begrenzt(o.von, laenge),
      bis: begrenzt(o.bis, laenge),
      unten: begrenzt(o.unten, hoehe),
      oben: begrenzt(o.oben, hoehe),
    }))
    .filter((o) => o.bis - o.von > RASTER_EPS && o.oben - o.unten > RASTER_EPS)
  const us = stufen([0, laenge, ...offen.flatMap((o) => [o.von, o.bis])])
  const vs = stufen([0, hoehe, ...offen.flatMap((o) => [o.unten, o.oben])])
  us[0] = 0
  us[us.length - 1] = laenge
  vs[0] = 0
  vs[vs.length - 1] = hoehe
  const nu = us.length - 1
  const nv = vs.length - 1
  const voll = Array.from({ length: nu }, () => Array<boolean>(nv).fill(true))
  for (const o of offen) {
    const [i0, i1] = [naechsterIndex(us, o.von), naechsterIndex(us, o.bis)]
    const [j0, j1] = [naechsterIndex(vs, o.unten), naechsterIndex(vs, o.oben)]
    for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) voll[i][j] = false
  }
  const istVoll = (i: number, j: number) => i >= 0 && j >= 0 && i < nu && j < nv && voll[i][j]

  type Kante = { a: [number, number]; b: [number, number] }
  const kanten: Kante[] = []
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      if (!voll[i][j]) continue
      if (!istVoll(i, j - 1)) kanten.push({ a: [i, j], b: [i + 1, j] })
      if (!istVoll(i + 1, j)) kanten.push({ a: [i + 1, j], b: [i + 1, j + 1] })
      if (!istVoll(i, j + 1)) kanten.push({ a: [i + 1, j + 1], b: [i, j + 1] })
      if (!istVoll(i - 1, j)) kanten.push({ a: [i, j + 1], b: [i, j] })
    }

  const schluessel = (p: [number, number]) => `${p[0]},${p[1]}`
  const abgehend = new Map<string, Kante[]>()
  for (const k of kanten) {
    const s = schluessel(k.a)
    abgehend.set(s, [...(abgehend.get(s) ?? []), k])
  }
  const benutzt = new Set<Kante>()
  const richtung = (k: Kante) => [k.b[0] - k.a[0], k.b[1] - k.a[1]] as const
  const rang = (rein: Kante, raus: Kante) => {
    const [dx, dy] = richtung(rein)
    const [ex, ey] = richtung(raus)
    const kreuz = dx * ey - dy * ex
    return kreuz > 0 ? 0 : kreuz === 0 && dx * ex + dy * ey > 0 ? 1 : 2
  }

  const ringe: Point[][] = []
  for (const start of kanten) {
    if (benutzt.has(start)) continue
    const ring: [number, number][] = []
    let k: Kante | undefined = start
    while (k && !benutzt.has(k)) {
      benutzt.add(k)
      ring.push(k.a)
      const aktuell: Kante = k
      k = (abgehend.get(schluessel(k.b)) ?? [])
        .filter((x) => !benutzt.has(x))
        .sort((x, y) => rang(aktuell, x) - rang(aktuell, y))[0]
    }
    const punkte = ohneGeradeZwischenpunkte(ring).map(([i, j]) => ({ x: us[i], y: vs[j] }))
    if (punkte.length >= 3) ringe.push(punkte)
  }

  const flaechen: AnsichtsFlaeche[] = ringe
    .filter((r) => flaecheMitVorzeichen(r) > 0)
    .map((umriss) => ({ umriss, loecher: [] }))
  for (const loch of ringe.filter((r) => flaecheMitVorzeichen(r) < 0)) {
    const [p, q] = [loch[0], loch[1]]
    const l = Math.hypot(q.x - p.x, q.y - p.y) || 1
    const innen = {
      x: (p.x + q.x) / 2 + ((q.y - p.y) / l) * RASTER_EPS,
      y: (p.y + q.y) / 2 - ((q.x - p.x) / l) * RASTER_EPS,
    }
    flaechen.find((f) => punktInPolygon(innen, f.umriss))?.loecher.push(loch)
  }
  return flaechen
}

function ohneGeradeZwischenpunkte(ring: [number, number][]): [number, number][] {
  const n = ring.length
  return ring.filter((p, i) => {
    const a = ring[(i - 1 + n) % n]
    const b = ring[(i + 1) % n]
    return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0
  })
}

function flaecheMitVorzeichen(ring: readonly Point[]): number {
  let summe = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    summe += a.x * b.y - b.x * a.y
  }
  return summe / 2
}

function punktInPolygon(p: Point, polygon: readonly Point[]): boolean {
  let drin = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      drin = !drin
  }
  return drin
}

export function wandGrundrissPunkt(a: SzenenWandAbschnitt, u: number, w: number): Point {
  const zwischen = (p: Point, q: Point) => ({ x: p.x + (q.x - p.x) * w, y: p.y + (q.y - p.y) * w })
  if (u <= ENDE_EPS) return zwischen(a.innenVon, a.aussenVon)
  if (u >= a.laenge - ENDE_EPS) return zwischen(a.innenBis, a.aussenBis)
  const d = { x: (a.bis.x - a.von.x) / a.laenge, y: (a.bis.y - a.von.y) / a.laenge }
  const quer = (ecke: Point) => {
    const v = { x: ecke.x - a.von.x, y: ecke.y - a.von.y }
    const laengs = v.x * d.x + v.y * d.y
    return { x: v.x - d.x * laengs, y: v.y - d.y * laengs }
  }
  const qi = quer(a.innenVon)
  const qa = quer(a.aussenVon)
  return {
    x: a.von.x + d.x * u + qi.x + (qa.x - qi.x) * w,
    y: a.von.y + d.y * u + qi.y + (qa.y - qi.y) * w,
  }
}

export function oeffnungAmPunkt(
  abschnitte: readonly SzenenWandAbschnitt[],
  punkt: Point,
): { titel: string; zeilen: string[] } | null {
  for (const a of abschnitte) {
    const d = { x: (a.bis.x - a.von.x) / a.laenge, y: (a.bis.y - a.von.y) / a.laenge }
    const u = (punkt.x - a.von.x) * d.x + (punkt.y - a.von.y) * d.y
    const quer = Math.abs((punkt.x - a.von.x) * d.y - (punkt.y - a.von.y) * d.x)
    const halbe =
      Math.hypot(a.aussenVon.x - a.innenVon.x, a.aussenVon.y - a.innenVon.y) / 2 + RASTER_EPS
    if (quer > halbe) continue
    const o = a.oeffnungen.find((x) => u >= x.von - RASTER_EPS && u <= x.bis + RASTER_EPS)
    if (o) return o.info
  }
  return null
}
