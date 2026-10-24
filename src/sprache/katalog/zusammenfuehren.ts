import type { KatalogBereich, KatalogWoerterbuch } from '../katalogwoerterbuch'

export function fuehreWoerterbuchZusammen(
  ...teile: Partial<KatalogWoerterbuch>[]
): KatalogWoerterbuch {
  const ergebnis: KatalogWoerterbuch = {
    kataloge: {},
    namen: {},
    gruppen: {},
    varianten: {},
    datenBezeichnungen: {},
    datenWerte: {},
    texte: {},
    slots: {},
    kabeltypen: {},
    zonen: {},
    regelwerk: {},
  }
  for (const teil of teile) {
    for (const bereich of Object.keys(teil) as KatalogBereich[]) {
      Object.assign(ergebnis[bereich], teil[bereich])
    }
  }
  return ergebnis
}
