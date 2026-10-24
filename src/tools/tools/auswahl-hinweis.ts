import type { Objekt } from '../../document-model'
import { tastenHinweis } from '../kontext-aktionen'
import { t } from '../../sprache'

export type AuswahlHinweisArt = 'grund' | 'leitung' | 'trunk' | 'wand' | 'polylinie' | 'bodenplatte'

export function auswahlHinweisArt(ausgewaehlt: readonly Objekt[]): AuswahlHinweisArt {
  if (ausgewaehlt.length !== 1) return 'grund'
  switch (ausgewaehlt[0].type) {
    case 'leitung':
      return 'leitung'
    case 'trunk':
      return 'trunk'
    case 'wand':
      return 'wand'
    case 'polylinie':
      return 'polylinie'
    case 'bodenplatte':
      return 'bodenplatte'
    default:
      return 'grund'
  }
}

export function auswahlHinweisText(art: AuswahlHinweisArt): string {
  if (art === 'grund') {
    return t('werkzeuge.auswahlHinweis.grund', {
      taste: tastenHinweis(t('werkzeuge.auswahlHinweis.grundTaste')),
    })
  }
  return t(`werkzeuge.auswahlHinweis.${art}`)
}
