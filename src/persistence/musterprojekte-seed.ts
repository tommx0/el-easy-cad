import type { Sprache } from '../sprache'
import bauplanDe from './seed-data/musterprojekte/einfamilienhaus-bauplan.de.json'
import bauplanEn from './seed-data/musterprojekte/einfamilienhaus-bauplan.en.json'
import elektroDe from './seed-data/musterprojekte/einfamilienhaus-elektro.de.json'
import elektroEn from './seed-data/musterprojekte/einfamilienhaus-elektro.en.json'
import type { MusterArt } from './musterprojekte'

export interface MusterDaten {
  kunde: string
  bezeichnung: string
  notiz: string
  dokument: string
  zeichnung: unknown
}

const DATEN: Record<MusterArt, Record<Sprache, MusterDaten>> = {
  bauplan: { de: bauplanDe, en: bauplanEn },
  elektro: { de: elektroDe, en: elektroEn },
}

export function musterSprache(sprache: Sprache): Sprache {
  return sprache === 'de' ? 'de' : 'en'
}

export function musterprojekt(art: MusterArt, sprache: Sprache): MusterDaten {
  return DATEN[art][musterSprache(sprache)]
}
