import {
  erzeugeUebersetzer,
  istSprache,
  oberflaechensprache,
  QUELLSPRACHE,
  RUECKFALLSPRACHE,
  SPRACHEN,
} from '../sprache'
import type { Sprache, Uebersetzer } from '../sprache'

export function planspracheVon(zeichnung: { plansprache?: string }): Sprache {
  const kennung = zeichnung.plansprache
  if (kennung === undefined || kennung === '') return QUELLSPRACHE
  return istSprache(kennung) ? kennung : RUECKFALLSPRACHE
}

export function planUebersetzer(zeichnung: { plansprache?: string }): Uebersetzer {
  return erzeugeUebersetzer(planspracheVon(zeichnung))
}

export function spracheDesUebersetzers(uebersetze: Uebersetzer): Sprache {
  return SPRACHEN.find((s) => erzeugeUebersetzer(s) === uebersetze) ?? oberflaechensprache()
}
