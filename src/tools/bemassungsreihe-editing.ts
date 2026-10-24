import type { BemassungsreiheObjekt, Point } from '../document-model'
import {
  berechneReihenVersatz,
  distance,
  ermittleBemassungsreiheGeometrie,
} from '../document-model'
import { findeFormPunktIndex } from './form-editing'

export type BemassungsreiheGriff = { art: 'punkt'; index: number } | { art: 'versatz' }

export function findeBemassungsreiheGriff(
  objekt: BemassungsreiheObjekt,
  punkt: Point,
  toleranz: number,
): BemassungsreiheGriff | null {
  const index = findeFormPunktIndex(objekt.punkte, punkt, toleranz)
  if (index !== null) return { art: 'punkt', index }
  const { versatzGriff } = ermittleBemassungsreiheGeometrie(objekt)
  return distance(punkt, versatzGriff) <= toleranz ? { art: 'versatz' } : null
}

export function wendeBemassungsreiheGriffAn(
  objekt: BemassungsreiheObjekt,
  griff: BemassungsreiheGriff,
  ziel: Point,
): BemassungsreiheObjekt {
  if (griff.art === 'versatz') {
    return { ...objekt, versatz: berechneReihenVersatz(objekt.punkte[0], objekt.winkel, ziel) }
  }
  const punkte = [...objekt.punkte]
  punkte[griff.index] = ziel
  if (griff.index !== 0) return { ...objekt, punkte }
  const quer = berechneReihenVersatz(objekt.punkte[0], objekt.winkel, ziel)
  return { ...objekt, punkte, versatz: objekt.versatz - quer }
}
