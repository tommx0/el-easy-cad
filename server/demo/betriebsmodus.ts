import type { KeyObject } from 'node:crypto'
import { ermittleProduktlizenzStatus } from '../produktlizenz/produktlizenz'
import type { ServerKontext } from '../server'
import { ermittleBetriebsmodus } from './demo'
import type { BetriebsmodusErmittlung } from './demo'

export type { BetriebsmodusErmittlung } from './demo'

export function ermittleBetriebsmodusStatus(
  kontext: ServerKontext,
  oeffentlicherSchluessel: KeyObject,
  demoPruefungAktiv: boolean,
  heute: Date = new Date(),
): BetriebsmodusErmittlung {
  const produktlizenz = ermittleProduktlizenzStatus(
    kontext.konfiguration.lizenzDatei,
    oeffentlicherSchluessel,
  )
  return ermittleBetriebsmodus(produktlizenz, demoPruefungAktiv, '', heute)
}

export function ergaenzeHerkunftTestversion(inhalt: string | null): string | null {
  if (!inhalt) return inhalt
  let geparst: unknown
  try {
    geparst = JSON.parse(inhalt)
  } catch {
    return inhalt // Kein gueltiges JSON ist nicht die Sache dieser Ergaenzung.
  }
  if (geparst === null || typeof geparst !== 'object') return inhalt
  const zeichnung = geparst as { herkunftTestversion?: unknown }
  if (zeichnung.herkunftTestversion === true) return inhalt
  zeichnung.herkunftTestversion = true
  return JSON.stringify(zeichnung)
}
