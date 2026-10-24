import type { CatalogComponent } from '../../document-model'
import { komponentenText } from '../../document-model'
import type { Sprache } from '../../sprache'

export function kategorienFuerKatalog(
  komponenten: readonly CatalogComponent[],
  katalogId: string,
  inaktiveKatalogIds: ReadonlySet<string>,
): string[] {
  return kategorieOptionenFuerKatalog(komponenten, katalogId, inaktiveKatalogIds, 'de').map(
    (o) => o.wert,
  )
}

export interface KategorieOption {
  wert: string
  text: string
}

export function kategorieOptionenFuerKatalog(
  komponenten: readonly CatalogComponent[],
  katalogId: string,
  inaktiveKatalogIds: ReadonlySet<string>,
  sprache: Sprache,
): KategorieOption[] {
  const kategorien = new Map<string, string>()
  for (const k of komponenten) {
    if (inaktiveKatalogIds.has(k.katalogId)) continue
    if (katalogId && k.katalogId !== katalogId) continue
    if (k.kategorie && !kategorien.has(k.kategorie)) {
      kategorien.set(k.kategorie, komponentenText(k, 'kategorie', sprache))
    }
  }
  return Array.from(kategorien, ([wert, text]) => ({ wert, text })).sort((a, b) =>
    a.text < b.text ? -1 : a.text > b.text ? 1 : 0,
  )
}
