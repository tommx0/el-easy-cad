export type Papierformat = 'A4' | 'A3' | 'A2' | 'A1' | 'A0'
export type Ausrichtung = 'hoch' | 'quer'

const HOCHFORMAT_GROESSEN_MM: Record<Papierformat, { breite: number; hoehe: number }> = {
  A4: { breite: 210, hoehe: 297 },
  A3: { breite: 297, hoehe: 420 },
  A2: { breite: 420, hoehe: 594 },
  A1: { breite: 594, hoehe: 841 },
  A0: { breite: 841, hoehe: 1189 },
}

export const PAPIERFORMATE: Papierformat[] = ['A4', 'A3', 'A2', 'A1', 'A0']

export function papierGroesseMm(
  format: Papierformat,
  ausrichtung: Ausrichtung,
): { breiteMm: number; hoeheMm: number } {
  const basis = HOCHFORMAT_GROESSEN_MM[format]
  return ausrichtung === 'hoch'
    ? { breiteMm: basis.breite, hoeheMm: basis.hoehe }
    : { breiteMm: basis.hoehe, hoeheMm: basis.breite }
}
