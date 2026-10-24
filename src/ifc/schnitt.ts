import type { Point } from '../document-model'

export interface Schnittlinie {
  punkte: Point[]
  geschlossen: boolean
  bauteil?: number
}

export const SCHNITT_RASTER = 1e-4

export function schneideNetz(
  eckpunkte: ArrayLike<number>,
  indizes: ArrayLike<number>,
  matrix: ArrayLike<number>,
  hoehe: number,
  ausgabe: number[],
): void {
  const anzahl = Math.floor(eckpunkte.length / 6)
  if (anzahl === 0 || indizes.length < 3) return
  const m = matrix
  const wx = new Float64Array(anzahl)
  const wh = new Float64Array(anzahl)
  const wz = new Float64Array(anzahl)
  let unten = false
  let oben = false
  for (let i = 0; i < anzahl; i++) {
    const x = eckpunkte[i * 6]
    const y = eckpunkte[i * 6 + 1]
    const z = eckpunkte[i * 6 + 2]
    wx[i] = m[0] * x + m[4] * y + m[8] * z + m[12]
    const d = m[1] * x + m[5] * y + m[9] * z + m[13] - hoehe
    wh[i] = d === 0 ? Number.EPSILON : d
    wz[i] = m[2] * x + m[6] * y + m[10] * z + m[14]
    if (wh[i] < 0) unten = true
    else oben = true
  }
  if (!unten || !oben) return

  for (let t = 0; t + 2 < indizes.length; t += 3) {
    const a = indizes[t]
    const b = indizes[t + 1]
    const c = indizes[t + 2]
    const da = wh[a]
    const db = wh[b]
    const dc = wh[c]
    const ua = da < 0
    const ub = db < 0
    const uc = dc < 0
    if (ua === ub && ub === uc) continue
    let einzeln: number, p: number, q: number
    if (ua === ub) {
      einzeln = c
      p = a
      q = b
    } else if (ua === uc) {
      einzeln = b
      p = a
      q = c
    } else {
      einzeln = a
      p = b
      q = c
    }
    const s1 = wh[einzeln] / (wh[einzeln] - wh[p])
    const s2 = wh[einzeln] / (wh[einzeln] - wh[q])
    const x1 = wx[einzeln] + s1 * (wx[p] - wx[einzeln])
    const z1 = wz[einzeln] + s1 * (wz[p] - wz[einzeln])
    const x2 = wx[einzeln] + s2 * (wx[q] - wx[einzeln])
    const z2 = wz[einzeln] + s2 * (wz[q] - wz[einzeln])
    ausgabe.push(x1, -z1, x2, -z2)
  }
}

function schluessel(x: number, y: number): string {
  return `${Math.round(x / SCHNITT_RASTER)},${Math.round(y / SCHNITT_RASTER)}`
}

export function verketteStrecken(strecken: ArrayLike<number>): Schnittlinie[] {
  const anzahl = Math.floor(strecken.length / 4)
  const anfang: string[] = new Array<string>(anzahl)
  const ende: string[] = new Array<string>(anzahl)
  const anPunkt = new Map<string, number[]>()
  const benutzt = new Uint8Array(anzahl)
  const gesehen = new Set<string>()

  for (let i = 0; i < anzahl; i++) {
    const ka = schluessel(strecken[i * 4], strecken[i * 4 + 1])
    const kb = schluessel(strecken[i * 4 + 2], strecken[i * 4 + 3])
    anfang[i] = ka
    ende[i] = kb
    const kante = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
    if (ka === kb || gesehen.has(kante)) {
      benutzt[i] = 1
      continue
    }
    gesehen.add(kante)
    for (const k of [ka, kb]) {
      const liste = anPunkt.get(k)
      if (liste) liste.push(i)
      else anPunkt.set(k, [i])
    }
  }

  const punktVon = (i: number, amAnfang: boolean): Point =>
    amAnfang
      ? { x: strecken[i * 4], y: strecken[i * 4 + 1] }
      : { x: strecken[i * 4 + 2], y: strecken[i * 4 + 3] }

  const laufe = (startSchluessel: string): { punkte: Point[]; letzter: string } => {
    const punkte: Point[] = []
    let k = startSchluessel
    for (;;) {
      const naechste = anPunkt.get(k)?.find((j) => !benutzt[j])
      if (naechste === undefined) break
      benutzt[naechste] = 1
      const vorwaerts = anfang[naechste] === k
      punkte.push(punktVon(naechste, !vorwaerts))
      k = vorwaerts ? ende[naechste] : anfang[naechste]
    }
    return { punkte, letzter: k }
  }

  const linien: Schnittlinie[] = []
  for (let i = 0; i < anzahl; i++) {
    if (benutzt[i]) continue
    benutzt[i] = 1
    const vor = laufe(ende[i])
    let geschlossen = vor.letzter === anfang[i]
    let punkte: Point[]
    if (geschlossen) {
      punkte = [punktVon(i, true), punktVon(i, false), ...vor.punkte]
      punkte.pop()
    } else {
      const zurueck = laufe(anfang[i])
      punkte = [...zurueck.punkte.reverse(), punktVon(i, true), punktVon(i, false), ...vor.punkte]
      geschlossen = false
    }
    const vereinfacht = entferneGeradePunkte(punkte, geschlossen)
    if (vereinfacht.length >= 2) linien.push({ punkte: vereinfacht, geschlossen })
  }
  return linien
}

export function entferneGeradePunkte(punkte: Point[], geschlossen: boolean): Point[] {
  if (punkte.length < 3) return punkte
  const istGerade = (a: Point, b: Point, c: Point): boolean => {
    const dx = c.x - a.x
    const dy = c.y - a.y
    const laenge = Math.hypot(dx, dy)
    if (laenge < SCHNITT_RASTER) return true
    const abstand = Math.abs(dx * (b.y - a.y) - dy * (b.x - a.x)) / laenge
    if (abstand >= SCHNITT_RASTER) return false
    const projektion = ((b.x - a.x) * dx + (b.y - a.y) * dy) / (laenge * laenge)
    return projektion > 0 && projektion < 1
  }
  const ergebnis: Point[] = []
  for (let i = 0; i < punkte.length; i++) {
    const istRand = !geschlossen && (i === 0 || i === punkte.length - 1)
    if (istRand) {
      ergebnis.push(punkte[i])
      continue
    }
    const vorher = ergebnis.length > 0 ? ergebnis[ergebnis.length - 1] : punkte[punkte.length - 1]
    const nachher = punkte[(i + 1) % punkte.length]
    if (!istGerade(vorher, punkte[i], nachher)) ergebnis.push(punkte[i])
  }
  return ergebnis
}
