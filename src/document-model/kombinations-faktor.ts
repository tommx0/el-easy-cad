export const STANDARD_KOMBINATION_FAKTOR = 0.75
export const ALTER_KOMBINATION_FAKTOR = 0.5
export const KOMBINATION_FAKTOR_MIN = 0.25
export const KOMBINATION_FAKTOR_MAX = 1

let aktiv = STANDARD_KOMBINATION_FAKTOR

export function kombinationsFaktor(): number {
  return aktiv
}

export function bereinigterKombinationsFaktor(faktor: number): number {
  if (!Number.isFinite(faktor)) return STANDARD_KOMBINATION_FAKTOR
  return Math.min(KOMBINATION_FAKTOR_MAX, Math.max(KOMBINATION_FAKTOR_MIN, faktor))
}

export function setzeKombinationsFaktor(faktor: number): void {
  aktiv = bereinigterKombinationsFaktor(faktor)
}
