import type { Sprache } from './sprachen'
import { katalogwoerterbuchEn } from './katalog/en'

export { fuehreWoerterbuchZusammen } from './katalog/zusammenfuehren'

export interface KatalogWoerterbuch {
  kataloge: Record<string, string>
  namen: Record<string, string>
  gruppen: Record<string, string>
  varianten: Record<string, string>
  datenBezeichnungen: Record<string, string>
  datenWerte: Record<string, string>
  texte: Record<string, string>
  slots: Record<string, string>
  kabeltypen: Record<string, string>
  zonen: Record<string, string>
  regelwerk: Record<string, string>
}

export type KatalogBereich = keyof KatalogWoerterbuch

const WOERTERBUECHER: Partial<Record<Sprache, KatalogWoerterbuch>> = {
  en: katalogwoerterbuchEn,
}

export function katalogWort(
  bereich: KatalogBereich,
  deutsch: string | undefined,
  sprache: Sprache,
): string | undefined {
  if (!deutsch || sprache === 'de') return undefined
  return WOERTERBUECHER[sprache]?.[bereich][deutsch]
}

export function katalogWoerterbuch(sprache: Sprache): KatalogWoerterbuch | undefined {
  return WOERTERBUECHER[sprache]
}
