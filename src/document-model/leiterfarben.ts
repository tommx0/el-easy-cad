import { STANDARD_FARBE, type SchaltverbindungObjekt } from './objekte'
import { t } from '../sprache'

export const N_LEITER_FARBE = '#1565c0'
export const PE_LEITER_FARBE = '#2e8b3a'
export const PE_LEITER_ZWEITE_FARBE = '#f2c200'

export interface Leiterfarbe {
  readonly name: string
  farbe: string
  zweiteFarbe?: string
}

export const LEITER_FARBEN: readonly Leiterfarbe[] = [
  {
    get name() {
      return t('beschriftung.leiterfarben.schwarz')
    },
    farbe: STANDARD_FARBE,
  },
  {
    get name() {
      return t('beschriftung.leiterfarben.braun')
    },
    farbe: '#7a4a1e',
  },
  {
    get name() {
      return t('beschriftung.leiterfarben.grau')
    },
    farbe: '#8a8a8a',
  },
  {
    get name() {
      return t('beschriftung.leiterfarben.blau')
    },
    farbe: N_LEITER_FARBE,
  },
  {
    get name() {
      return t('beschriftung.leiterfarben.gruenGelb')
    },
    farbe: PE_LEITER_FARBE,
    zweiteFarbe: PE_LEITER_ZWEITE_FARBE,
  },
]

export function leiterfarbePatch(
  l: Leiterfarbe,
): Partial<Pick<SchaltverbindungObjekt, 'farbe' | 'zweiteFarbe' | 'linientyp'>> {
  return l.zweiteFarbe
    ? { farbe: l.farbe, zweiteFarbe: l.zweiteFarbe, linientyp: 'standard' }
    : { farbe: l.farbe, zweiteFarbe: undefined }
}

export function hatLeiterfarbe(
  o: Pick<SchaltverbindungObjekt, 'farbe' | 'zweiteFarbe'>,
  l: Leiterfarbe,
): boolean {
  const gleich = (a: string | undefined, b: string | undefined) =>
    (a ?? '').toLowerCase() === (b ?? '').toLowerCase()
  return gleich(o.farbe, l.farbe) && gleich(o.zweiteFarbe, l.zweiteFarbe)
}
