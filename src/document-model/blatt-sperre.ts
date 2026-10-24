import type { Blatt } from './blatt'
import { t } from '../sprache'

export type LizenzModul = 'bim'

export function nurAnsichtGrund(
  blatt: Pick<Blatt, 'hintergrund'>,
  module: readonly LizenzModul[],
): string | null {
  if (blatt.hintergrund?.typ === 'unbekannt') {
    return t('modell.blattSperre.unbekannterHintergrund')
  }
  if (blatt.hintergrund?.typ === 'ifc' && !module.includes('bim')) {
    return t('modell.blattSperre.ifcOhneModul')
  }
  return null
}

export function istNurAnsicht(
  blatt: Pick<Blatt, 'hintergrund'>,
  module: readonly LizenzModul[],
): boolean {
  return nurAnsichtGrund(blatt, module) !== null
}
