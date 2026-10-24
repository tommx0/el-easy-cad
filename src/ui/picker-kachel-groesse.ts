export const PICKER_KACHEL_STANDARD = 160
export const PICKER_KACHEL_MIN = 90
export const PICKER_KACHEL_MAX = 280
export const PICKER_KACHEL_SCHRITT = 10

export const PICKER_KACHEL_KOMPAKT_BIS = 120

export function begrenzePickerKachelGroesse(groesse: number): number {
  if (!Number.isFinite(groesse)) return PICKER_KACHEL_STANDARD
  return Math.round(Math.min(Math.max(groesse, PICKER_KACHEL_MIN), PICKER_KACHEL_MAX))
}
