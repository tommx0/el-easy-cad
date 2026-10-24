export function skalaAusGroessenFaktor(faktor: number): number {
  const geklemmt = Math.min(5, Math.max(-5, faktor))
  return geklemmt >= 0 ? 1 + 0.2 * geklemmt : 1 + 0.16 * geklemmt
}

export function effektiverFaktor(lokal: number | undefined, blattFaktor: number): number {
  return lokal ?? blattFaktor
}

export function effektiveSichtbarkeit(lokal: boolean | undefined, blattSichtbar: boolean): boolean {
  return lokal ?? blattSichtbar
}
