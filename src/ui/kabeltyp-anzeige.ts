import type { Kabeltyp } from '../document-model'
import { gruppiereKabeltypen, kabeltypFeldText, passtZuSuche } from '../document-model'
import { SPRACHEN, type Sprache } from '../sprache'

export interface KabeltypGruppeAnzeige {
  gruppe: string
  text: string
  typen: Kabeltyp[]
}

export function gruppiereKabeltypenAnzeige(
  typen: readonly Kabeltyp[],
  sprache: Sprache,
): KabeltypGruppeAnzeige[] {
  return gruppiereKabeltypen(typen)
    .map((g) => ({ ...g, text: kabeltypFeldText(g.typen[0], 'gruppe', sprache) }))
    .sort((a, b) => a.text.localeCompare(b.text, sprache))
}

export function kabeltypBemerkung(typ: Kabeltyp, sprache: Sprache): string | undefined {
  return typ.bemerkung ? kabeltypFeldText(typ, 'bemerkung', sprache) : undefined
}

export function kabeltypPasstZuSuche(typ: Kabeltyp, suche: string): boolean {
  const alle = (feld: 'gruppe' | 'bemerkung') =>
    [...new Set(SPRACHEN.map((s) => kabeltypFeldText(typ, feld, s)))].join(' ')
  return passtZuSuche({ ...typ, gruppe: alle('gruppe'), bemerkung: alle('bemerkung') }, suche)
}
