import { t } from '../sprache'

export class ErkennungAbgebrochen extends Error {
  readonly grund: 'zeit' | 'menge'

  constructor(grund: 'zeit' | 'menge') {
    super(grund === 'zeit' ? t('modell.erkennung.zuLange') : t('modell.erkennung.zuVieleLinien'))
    this.name = 'ErkennungAbgebrochen'
    this.grund = grund
  }
}

export interface Abbruchwaechter {
  pruefe(): void
}

const SCHRITTE_JE_PRUEFUNG = 2000

export function erzeugeWaechter(maxDauerMs: number): Abbruchwaechter {
  const ende = Date.now() + maxDauerMs
  let schritte = 0
  return {
    pruefe() {
      if (++schritte < SCHRITTE_JE_PRUEFUNG) return
      schritte = 0
      if (Date.now() > ende) throw new ErkennungAbgebrochen('zeit')
    },
  }
}

export const OHNE_GRENZE: Abbruchwaechter = { pruefe: () => {} }

export interface ErkennungsGrenzen {
  maxDauerMs: number
  maxSegmente: number
  warnAbFunden: number
}

export const STANDARD_GRENZEN: ErkennungsGrenzen = {
  maxDauerMs: 15_000,
  maxSegmente: 400_000,
  warnAbFunden: 250,
}
