import type { VerteilerDaten } from './objekte'

export type VerteilerArt = 'HV' | 'UV'

export function artVon(
  daten: Pick<VerteilerDaten, 'art' | 'kennzeichen'> | undefined,
): VerteilerArt {
  if (daten?.art) return daten.art
  return /^\+?\s*UV/i.test(daten?.kennzeichen ?? '') ? 'UV' : 'HV'
}
