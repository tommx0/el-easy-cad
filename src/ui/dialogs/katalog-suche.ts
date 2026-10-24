import type { CatalogComponent } from '../../document-model'
import { komponentenSuchtexte } from '../../document-model'
import { SPRACHEN } from '../../sprache'

export function passtZurKatalogSuche(komponente: CatalogComponent, suchtext: string): boolean {
  const suche = suchtext.trim().toLowerCase()
  if (!suche) return true
  return [
    ...komponentenSuchtexte(komponente, SPRACHEN),
    komponente.hersteller ?? '',
    komponente.artikelnummer ?? '',
  ].some((text) => text.toLowerCase().includes(suche))
}
