import type { Plansegment } from './plansegment'

export interface Graubild {
  breite: number
  hoehe: number
  daten: Uint8Array
}

export interface RasterOptionen {
  schwelle: number
  winkelSchrittGrad: number
  mindestLaengePx: number
  lueckePx: number
  maxLinien: number
  maxAbstimmendePixel: number
}

export const STANDARD_RASTER_OPTIONEN: RasterOptionen = {
  schwelle: 128,
  winkelSchrittGrad: 1,
  mindestLaengePx: 25,
  lueckePx: 4,
  maxLinien: 600,
  maxAbstimmendePixel: 120_000,
}

export function erkenneRasterlinien(
  bild: Graubild,
  optionen: RasterOptionen = STANDARD_RASTER_OPTIONEN,
): Plansegment[] {
  const dunkel = sammleDunklePixel(bild, optionen.schwelle)
  if (dunkel.length === 0) return []

  const winkelAnzahl = Math.max(1, Math.round(180 / optionen.winkelSchrittGrad))
  const sinus = new Float64Array(winkelAnzahl)
  const kosinus = new Float64Array(winkelAnzahl)
  for (let t = 0; t < winkelAnzahl; t++) {
    const winkel = (Math.PI * t) / winkelAnzahl
    sinus[t] = Math.sin(winkel)
    kosinus[t] = Math.cos(winkel)
  }

  const diagonale = Math.ceil(Math.hypot(bild.breite, bild.hoehe))
  const rhoAnzahl = 2 * diagonale + 1
  const akku = new Int32Array(winkelAnzahl * rhoAnzahl)

  const schrittweite = Math.max(1, Math.ceil(dunkel.length / optionen.maxAbstimmendePixel))
  for (let i = 0; i < dunkel.length; i += schrittweite) {
    const { x, y } = dunkel[i]
    for (let t = 0; t < winkelAnzahl; t++) {
      const rho = Math.round(x * kosinus[t] + y * sinus[t]) + diagonale
      akku[t * rhoAnzahl + rho]++
    }
  }

  const mindestStimmen = Math.max(6, Math.round(optionen.mindestLaengePx / schrittweite / 2))
  const gewinner = findePeaks(akku, winkelAnzahl, rhoAnzahl, mindestStimmen, optionen.maxLinien)

  const belegt = pixelmaske(bild, optionen.schwelle)
  const segmente: Plansegment[] = []
  for (const peak of gewinner) {
    const winkel = (Math.PI * peak.t) / winkelAnzahl
    segmente.push(...abschnitteAufGeraden(belegt, bild, winkel, peak.rho - diagonale, optionen))
  }
  return segmente
}

function sammleDunklePixel(bild: Graubild, schwelle: number): { x: number; y: number }[] {
  const punkte: { x: number; y: number }[] = []
  for (let y = 0; y < bild.hoehe; y++) {
    const zeile = y * bild.breite
    for (let x = 0; x < bild.breite; x++) {
      if (bild.daten[zeile + x] <= schwelle) punkte.push({ x, y })
    }
  }
  return punkte
}

function pixelmaske(bild: Graubild, schwelle: number): Uint8Array {
  const maske = new Uint8Array(bild.breite * bild.hoehe)
  for (let i = 0; i < maske.length; i++) maske[i] = bild.daten[i] <= schwelle ? 1 : 0
  return maske
}

interface Peak {
  t: number
  rho: number
  stimmen: number
}

function findePeaks(
  akku: Int32Array,
  winkelAnzahl: number,
  rhoAnzahl: number,
  mindestStimmen: number,
  maxLinien: number,
): Peak[] {
  const umgebungT = 1
  const umgebungRho = 3
  const kandidaten: Peak[] = []

  for (let t = 0; t < winkelAnzahl; t++) {
    for (let rho = 0; rho < rhoAnzahl; rho++) {
      const wert = akku[t * rhoAnzahl + rho]
      if (wert < mindestStimmen) continue

      let istMaximum = true
      for (let dt = -umgebungT; dt <= umgebungT && istMaximum; dt++) {
        const tt = (t + dt + winkelAnzahl) % winkelAnzahl
        for (let dr = -umgebungRho; dr <= umgebungRho; dr++) {
          if (dt === 0 && dr === 0) continue
          const rr = rho + dr
          if (rr < 0 || rr >= rhoAnzahl) continue
          if (akku[tt * rhoAnzahl + rr] > wert) {
            istMaximum = false
            break
          }
        }
      }
      if (istMaximum) kandidaten.push({ t, rho, stimmen: wert })
    }
  }

  kandidaten.sort((a, b) => b.stimmen - a.stimmen)
  return kandidaten.slice(0, maxLinien)
}

function abschnitteAufGeraden(
  maske: Uint8Array,
  bild: Graubild,
  winkel: number,
  rho: number,
  optionen: RasterOptionen,
): Plansegment[] {
  const cos = Math.cos(winkel)
  const sin = Math.sin(winkel)
  const basisX = cos * rho
  const basisY = sin * rho
  const richtungX = -sin
  const richtungY = cos

  const grenze = Math.ceil(Math.hypot(bild.breite, bild.hoehe))
  const belegtBei = (s: number): boolean => {
    const x = basisX + richtungX * s
    const y = basisY + richtungY * s
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const px = Math.round(x) + dx
        const py = Math.round(y) + dy
        if (px < 0 || py < 0 || px >= bild.breite || py >= bild.hoehe) continue
        if (maske[py * bild.breite + px]) return true
      }
    }
    return false
  }

  const segmente: Plansegment[] = []
  let start: number | null = null
  let letzteBelegung: number | null = null

  const abschliessen = (ende: number) => {
    if (start === null) return
    const laenge = ende - start
    if (laenge >= optionen.mindestLaengePx) {
      segmente.push({
        a: { x: basisX + richtungX * start, y: basisY + richtungY * start },
        b: { x: basisX + richtungX * ende, y: basisY + richtungY * ende },
      })
    }
    start = null
  }

  for (let s = -grenze; s <= grenze; s++) {
    if (belegtBei(s)) {
      start ??= s
      letzteBelegung = s
    } else if (letzteBelegung !== null && s - letzteBelegung > optionen.lueckePx) {
      abschliessen(letzteBelegung)
      letzteBelegung = null
    }
  }
  if (letzteBelegung !== null) abschliessen(letzteBelegung)

  return segmente
}
