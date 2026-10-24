import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { z } from 'zod'
import type { Konfiguration } from '../konfiguration'
import type { LizenzModul, ProduktlizenzPruefung } from '../produktlizenz/produktlizenz'
import { LIZENZ_MODULE, lizenzModule } from '../produktlizenz/produktlizenz'

export const DEMO_DAUER_TAGE = 30

export type Betriebsmodus = 'lizenziert' | 'demo' | 'demo-abgelaufen' | 'gesperrt'

export interface BetriebsmodusErmittlung {
  produktlizenz: ProduktlizenzPruefung
  betriebsmodus: Betriebsmodus
  resttageDemo: number | null
}

export function freigeschalteteModule(ermittlung: BetriebsmodusErmittlung): LizenzModul[] {
  if (ermittlung.betriebsmodus === 'lizenziert') {
    return lizenzModule(ermittlung.produktlizenz.lizenz)
  }
  if (ermittlung.betriebsmodus === 'demo') return [...LIZENZ_MODULE]
  return []
}

export function ermittleBetriebsmodus(
  produktlizenz: ProduktlizenzPruefung,
  _demoAktiv: boolean,
  _demoStart: string,
  _heute: Date = new Date(),
): BetriebsmodusErmittlung {
  if (produktlizenz.status === 'gueltig') {
    return { produktlizenz, betriebsmodus: 'lizenziert', resttageDemo: null }
  }
  return { produktlizenz, betriebsmodus: 'demo', resttageDemo: null }
}

const DEMO_START_SCHEMA = z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })

function demoStartDateiPfad(datenordner: string): string {
  return `${datenordner}/demo-start.json`
}

function leseOderErzeugeDemoStartDatei(datenordner: string, heute: Date): string {
  const pfad = demoStartDateiPfad(datenordner)
  if (existsSync(pfad)) {
    const geparst = DEMO_START_SCHEMA.safeParse(JSON.parse(readFileSync(pfad, 'utf-8')))
    if (geparst.success) return geparst.data.start
  }
  const start = heute.toISOString().slice(0, 10)
  writeFileSync(pfad, JSON.stringify({ start }, null, 2), 'utf-8')
  return start
}

export function ermittleDemoStart(konfiguration: Konfiguration, heute: Date = new Date()): string {
  if (konfiguration.demoStartUeberschreibung) return konfiguration.demoStartUeberschreibung
  return leseOderErzeugeDemoStartDatei(konfiguration.datenordner, heute)
}
