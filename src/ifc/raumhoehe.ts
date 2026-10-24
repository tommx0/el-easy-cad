export const MINDEST_RAUMHOEHE_METER = 1.8
const DECKEN_TOLERANZ_METER = 0.6

export function lichteRaumhoehe(
  basis: number,
  darueber: number,
  decken: readonly (readonly [number, number])[],
): number | null {
  const zaehler = new Map<number, number>()
  for (const [unten, oben] of decken) {
    if (Math.abs(oben - darueber) > DECKEN_TOLERANZ_METER) continue
    if (unten - basis < MINDEST_RAUMHOEHE_METER || unten >= darueber) continue
    const zentimeter = Math.round((unten - basis) * 100)
    zaehler.set(zentimeter, (zaehler.get(zentimeter) ?? 0) + 1)
  }
  let beste: [number, number] | null = null
  for (const eintrag of zaehler)
    if (!beste || eintrag[1] > beste[1] || (eintrag[1] === beste[1] && eintrag[0] > beste[0]))
      beste = eintrag
  return beste ? beste[0] / 100 : null
}

export function lichteRaumhoehen(
  geschosse: readonly { expressId: number; basisHoehe: number }[],
  decken: readonly (readonly [number, number])[],
): Map<number, number> {
  const sortiert = [...geschosse].sort((a, b) => a.basisHoehe - b.basisHoehe)
  const ergebnis = new Map<number, number>()
  for (const g of sortiert) {
    const darueber = sortiert.find((x) => x.basisHoehe - g.basisHoehe >= MINDEST_RAUMHOEHE_METER)
    if (!darueber) continue
    const hoehe = lichteRaumhoehe(g.basisHoehe, darueber.basisHoehe, decken)
    if (hoehe !== null) ergebnis.set(g.expressId, hoehe)
  }
  return ergebnis
}
