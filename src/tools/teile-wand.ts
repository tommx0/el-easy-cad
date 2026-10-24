import type { Point, WandObjekt } from '../document-model'
import { distance, naechsterPunktAufSegment, pfadGesamtLaenge, teilPfad } from '../document-model'
import { istGeschlossen, naechstesWandSegment } from './trim-wand'

const MINDEST_ABSTAND = 0.01 // 1 cm

export interface WandTeilungErgebnis {
  erstesStueck: Point[] | null
  zweitesStueck: Point[] | null
  tVon: number
  tBis: number
}

function tAufWand(punkte: readonly Point[], klickpunkt: Point, gesamt: number): number {
  if (gesamt === 0) return 0
  const i = naechstesWandSegment(klickpunkt, punkte)
  const a = punkte[i]
  const b = punkte[i + 1]
  const projektion = naechsterPunktAufSegment(klickpunkt, a, b)
  const bogenlaenge = pfadGesamtLaenge(punkte.slice(0, i + 1)) + distance(a, projektion)
  return bogenlaenge / gesamt
}

export function berechneWandTeilungErgebnis(
  wand: WandObjekt,
  punktA: Point,
  punktB: Point,
): WandTeilungErgebnis | null {
  const punkte = wand.punkte
  if (punkte.length < 2) return null
  if (istGeschlossen(punkte)) return null

  const gesamt = pfadGesamtLaenge(punkte)
  if (gesamt === 0) return null

  const tA = tAufWand(punkte, punktA, gesamt)
  const tB = tAufWand(punkte, punktB, gesamt)
  const tVon = Math.min(tA, tB)
  const tBis = Math.max(tA, tB)
  if ((tBis - tVon) * gesamt < MINDEST_ABSTAND) return null

  const erstesStueck = tVon <= 1e-9 ? null : teilPfad(punkte, 0, tVon)
  const zweitesStueck = tBis >= 1 - 1e-9 ? null : teilPfad(punkte, tBis, 1)

  return { erstesStueck, zweitesStueck, tVon, tBis }
}
