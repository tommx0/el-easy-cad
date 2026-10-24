export const SPRACHEN = ['de', 'en'] as const

export type Sprache = (typeof SPRACHEN)[number]

export const QUELLSPRACHE: Sprache = 'de'

export const RUECKFALLSPRACHE: Sprache = 'en'

export const FORMAT_KENNUNG: Record<Sprache, string> = { de: 'de-DE', en: 'en-GB' }

export const SPRACH_EIGENNAMEN: Record<Sprache, string> = { de: 'Deutsch', en: 'English' }

export const SPRACHWAHL_FREIGEGEBEN = true

export function istSprache(wert: unknown): wert is Sprache {
  return typeof wert === 'string' && (SPRACHEN as readonly string[]).includes(wert)
}

export function spracheAusKennung(kennung: string | null | undefined): Sprache {
  const teil = (kennung ?? '').trim().toLowerCase().split(/[-_]/)[0]
  return istSprache(teil) ? teil : RUECKFALLSPRACHE
}

export function wirksameOberflaechensprache(
  einstellung: string | null | undefined,
  systemKennung: string | null | undefined,
  freigegeben: boolean = SPRACHWAHL_FREIGEGEBEN,
): Sprache {
  if (!freigegeben) return QUELLSPRACHE
  if (einstellung) return spracheAusKennung(einstellung)
  return spracheAusKennung(systemKennung)
}
