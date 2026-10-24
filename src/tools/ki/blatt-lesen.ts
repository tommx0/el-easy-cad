import { boundingBoxUeberlappt, getBoundingBox } from '../../document-model'
import type { KiBereich, KiErgebnis, KiKontext } from './kontext'
import { bereichImModell, waehleBlatt } from './kontext'
import { objektKurzform } from './objekt-kurzform'

export interface BlattLesenEingabe {
  blattId?: string
  typen?: string[]
  bereich?: KiBereich
  maxAnzahl?: number
}

const STANDARD_MAX_ANZAHL = 300

export function blattLesen(eingabe: BlattLesenEingabe, kontext: KiKontext): KiErgebnis {
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const katalog = new Map(kontext.katalogKomponenten().map((k) => [k.id, k]))
  const typen = eingabe.typen && eingabe.typen.length > 0 ? new Set(eingabe.typen) : null
  const bereich = eingabe.bereich ? bereichImModell(eingabe.bereich, blatt) : null
  const max = eingabe.maxAnzahl ?? STANDARD_MAX_ANZAHL

  const treffer = blatt.objekte.filter(
    (o) =>
      (!typen || typen.has(o.type)) &&
      (!bereich || boundingBoxUeberlappt(getBoundingBox(o), bereich)),
  )
  return {
    daten: {
      blatt: { id: blatt.id, name: blatt.name },
      anzahl: treffer.length,
      ...(treffer.length > max ? { abgeschnittenAuf: max } : {}),
      objekte: treffer.slice(0, max).map((o) => objektKurzform(o, blatt, katalog)),
    },
  }
}
