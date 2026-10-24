export const SEITENLEISTE_BREITE_STANDARD = 214
export const SEITENLEISTE_BREITE_MIN = 112
export const SEITENLEISTE_BREITE_MAX = 360

export const SEITENLEISTE_LISTE_AB = 200

export function begrenzeSeitenleistenBreite(breite: number): number {
  if (!Number.isFinite(breite)) return SEITENLEISTE_BREITE_STANDARD
  return Math.round(Math.min(Math.max(breite, SEITENLEISTE_BREITE_MIN), SEITENLEISTE_BREITE_MAX))
}

export function istListenansicht(breite: number): boolean {
  return breite >= SEITENLEISTE_LISTE_AB
}
