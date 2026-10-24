import type { KeyObject } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { ermittleBetriebsmodusStatus, type BetriebsmodusErmittlung } from '../demo/betriebsmodus'
import { freigeschalteteModule, type Betriebsmodus } from '../demo/demo'
import { ApiFehler } from '../fehler'
import { serverText } from '../sprache'
import type { Schluessel } from '../../src/sprache'
import {
  pruefeProduktlizenz,
  schreibeLizenzDatei,
  type LizenzModul,
  type ProduktlizenzPruefung,
} from '../produktlizenz/produktlizenz'
import { leseOeffentlichenSchluessel } from '../produktlizenz/schluessel'
import {
  kommerziellErlaubt,
  unterstuetzerAngaben,
  type UnterstuetzerAngaben,
} from '../produktlizenz/unterstuetzer'
import type { ServerKontext } from '../server'

export interface LizenzDetails {
  firma: string
  gueltigAb: string
}

export interface ProduktlizenzAntwort {
  status: ProduktlizenzPruefung['status']
  lizenznehmer: string | null
  gueltigBis: string | null
  tageBisAblauf: number | null
  warnungBaldAblaufend: boolean
  betriebsmodus: Betriebsmodus
  resttageDemo: number | null
  details: LizenzDetails | null
  module: LizenzModul[]
  unterstuetzer: UnterstuetzerAngaben | null
  kommerziell: boolean
}

function zuAntwort(ermittlung: BetriebsmodusErmittlung): ProduktlizenzAntwort {
  const { produktlizenz } = ermittlung
  return {
    status: produktlizenz.status,
    lizenznehmer: produktlizenz.lizenz?.lizenznehmer ?? null,
    gueltigBis: produktlizenz.lizenz?.gueltigBis ?? null,
    tageBisAblauf: produktlizenz.tageBisAblauf,
    warnungBaldAblaufend: produktlizenz.warnungBaldAblaufend,
    betriebsmodus: ermittlung.betriebsmodus,
    resttageDemo: ermittlung.resttageDemo,
    details: produktlizenz.lizenz
      ? { firma: produktlizenz.lizenz.lizenznehmer, gueltigAb: produktlizenz.lizenz.gueltigAb }
      : null,
    module: freigeschalteteModule(ermittlung),
    unterstuetzer: unterstuetzerAngaben(produktlizenz.lizenz),
    kommerziell: kommerziellErlaubt(ermittlung),
  }
}

const STATUS_MELDUNG: Record<ProduktlizenzPruefung['status'], Schluessel> = {
  fehlt: 'server.lizenz.fehlt',
  ungueltig: 'server.lizenz.ungueltig',
  abgelaufen: 'server.lizenz.abgelaufen',
  gueltig: 'server.lizenz.gueltig',
}

export function registriereProduktlizenzRouten(
  app: FastifyInstance,
  kontext: ServerKontext,
  oeffentlicherSchluessel: KeyObject = leseOeffentlichenSchluessel(),
  demoPruefungAktiv = true,
): void {
  app.get('/api/produktlizenz', () =>
    zuAntwort(ermittleBetriebsmodusStatus(kontext, oeffentlicherSchluessel, demoPruefungAktiv)),
  )

  app.post('/api/produktlizenz', (anfrage) => {
    const pruefung = pruefeProduktlizenz(anfrage.body, oeffentlicherSchluessel)
    if (pruefung.status !== 'gueltig') {
      throw ApiFehler.ungueltig(serverText(STATUS_MELDUNG[pruefung.status]))
    }
    schreibeLizenzDatei(kontext.konfiguration.lizenzDatei, anfrage.body)
    return zuAntwort({ produktlizenz: pruefung, betriebsmodus: 'lizenziert', resttageDemo: null })
  })
}
