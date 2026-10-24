import type { Point } from '../document-model'
import type { Plansegment } from './plansegment'

export interface PdfOperatorCodes {
  constructPath: number
  transform: number
  save: number
  restore: number
  paintFormXObjectBegin: number
  paintFormXObjectEnd: number
  zeichnendeOps: readonly number[]
  strichOps: readonly number[]
  setStrokeRGBColor: number
  setFillRGBColor: number
}

export interface PdfOperatorliste {
  fnArray: readonly number[]
  argsArray: readonly unknown[]
}

export type Matrix = readonly [number, number, number, number, number, number]

export const EINHEITSMATRIX: Matrix = [1, 0, 0, 1, 0, 0]

const MINDEST_SEGMENTLAENGE_PT = 0.3

const DRAW_MOVE_TO = 0
const DRAW_LINE_TO = 1
const DRAW_CURVE_TO = 2
const DRAW_QUADRATIC_CURVE_TO = 3
const DRAW_CLOSE_PATH = 4

export function pdfOperatorenAlsSegmente(
  liste: PdfOperatorliste,
  codes: PdfOperatorCodes,
  basis: Matrix = EINHEITSMATRIX,
): Plansegment[] {
  const segmente: Plansegment[] = []
  const zeichnend = new Set(codes.zeichnendeOps)
  const strichOp = new Set(codes.strichOps)
  let ctm: Matrix = basis
  const stapel: Matrix[] = []
  let strichfarbe: string | undefined
  let fuellfarbe: string | undefined

  for (let i = 0; i < liste.fnArray.length; i++) {
    const fn = liste.fnArray[i]
    const args = liste.argsArray[i]

    if (fn === codes.setStrokeRGBColor) {
      strichfarbe = alsFarbe(args)
    } else if (fn === codes.setFillRGBColor) {
      fuellfarbe = alsFarbe(args)
    } else if (fn === codes.save) {
      stapel.push(ctm)
    } else if (fn === codes.restore) {
      ctm = stapel.pop() ?? basis
    } else if (fn === codes.transform) {
      const matrix = alsMatrix(args)
      if (matrix) ctm = multipliziere(ctm, matrix)
    } else if (fn === codes.paintFormXObjectBegin) {
      stapel.push(ctm)
      const matrix = Array.isArray(args) ? alsMatrix(args[0]) : null
      if (matrix) ctm = multipliziere(ctm, matrix)
    } else if (fn === codes.paintFormXObjectEnd) {
      ctm = stapel.pop() ?? basis
    } else if (fn === codes.constructPath) {
      if (!Array.isArray(args)) continue
      const [zeichenOp, daten] = args as [unknown, unknown]
      if (typeof zeichenOp !== 'number' || !zeichnend.has(zeichenOp)) continue
      const pfad = pfadDaten(daten)
      const farbe = strichOp.has(zeichenOp) ? strichfarbe : fuellfarbe
      if (pfad) segmente.push(...pfadAlsSegmente(pfad, ctm, farbe))
    }
  }

  return segmente
}

function pfadDaten(daten: unknown): ArrayLike<number> | null {
  if (Array.isArray(daten) && daten.length > 0) {
    const erstes = daten[0]
    if (Array.isArray(erstes) || ArrayBuffer.isView(erstes)) return erstes as ArrayLike<number>
  }
  if (ArrayBuffer.isView(daten)) return daten as unknown as ArrayLike<number>
  return null
}

function alsFarbe(args: unknown): string | undefined {
  const wert = Array.isArray(args) ? args[0] : args
  return typeof wert === 'string' && wert.startsWith('#') ? wert : undefined
}

function pfadAlsSegmente(
  daten: ArrayLike<number>,
  ctm: Matrix,
  farbe: string | undefined,
): Plansegment[] {
  const segmente: Plansegment[] = []
  let aktuell: Point | null = null
  let unterpfadStart: Point | null = null

  const linieNach = (ziel: Point) => {
    if (aktuell && Math.hypot(ziel.x - aktuell.x, ziel.y - aktuell.y) >= MINDEST_SEGMENTLAENGE_PT) {
      segmente.push(farbe ? { a: aktuell, b: ziel, farbe } : { a: aktuell, b: ziel })
    }
    aktuell = ziel
  }

  for (let i = 0; i < daten.length;) {
    switch (daten[i++]) {
      case DRAW_MOVE_TO: {
        aktuell = wende(ctm, daten[i++], daten[i++])
        unterpfadStart = aktuell
        break
      }
      case DRAW_LINE_TO: {
        linieNach(wende(ctm, daten[i++], daten[i++]))
        break
      }
      case DRAW_CURVE_TO: {
        i += 4
        aktuell = wende(ctm, daten[i++], daten[i++])
        break
      }
      case DRAW_QUADRATIC_CURVE_TO: {
        i += 2
        aktuell = wende(ctm, daten[i++], daten[i++])
        break
      }
      case DRAW_CLOSE_PATH: {
        if (unterpfadStart) linieNach(unterpfadStart)
        break
      }
      default:
        return segmente
    }
  }

  return segmente
}

function wende(m: Matrix, x: number, y: number): Point {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] }
}

function multipliziere(aussen: Matrix, innen: Matrix): Matrix {
  return [
    innen[0] * aussen[0] + innen[1] * aussen[2],
    innen[0] * aussen[1] + innen[1] * aussen[3],
    innen[2] * aussen[0] + innen[3] * aussen[2],
    innen[2] * aussen[1] + innen[3] * aussen[3],
    innen[4] * aussen[0] + innen[5] * aussen[2] + aussen[4],
    innen[4] * aussen[1] + innen[5] * aussen[3] + aussen[5],
  ]
}

function alsMatrix(wert: unknown): Matrix | null {
  if (!Array.isArray(wert) || wert.length < 6) return null
  if (wert.slice(0, 6).some((z) => typeof z !== 'number' || !Number.isFinite(z))) return null
  return wert.slice(0, 6) as unknown as Matrix
}
