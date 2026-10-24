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

const MILLISEKUNDEN_PRO_TAG = 24 * 60 * 60 * 1000

function tageDifferenz(vonTag: string, bisTag: string): number {
  return Math.floor(
    (Date.parse(`${bisTag}T00:00:00Z`) - Date.parse(`${vonTag}T00:00:00Z`)) / MILLISEKUNDEN_PRO_TAG,
  )
}

export function ermittleBetriebsmodus(
  produktlizenz: ProduktlizenzPruefung,
  demoAktiv: boolean,
  demoStart: string,
  heute: Date = new Date(),
): BetriebsmodusErmittlung {
  if (produktlizenz.status === 'gueltig') {
    return { produktlizenz, betriebsmodus: 'lizenziert', resttageDemo: null }
  }
  if (produktlizenz.status !== 'fehlt' || !demoAktiv) {
    return { produktlizenz, betriebsmodus: 'gesperrt', resttageDemo: null }
  }

  const heuteTag = heute.toISOString().slice(0, 10)
  const resttageDemo = DEMO_DAUER_TAGE - tageDifferenz(demoStart, heuteTag)
  if (resttageDemo > 0) {
    return { produktlizenz, betriebsmodus: 'demo', resttageDemo }
  }
  return { produktlizenz, betriebsmodus: 'demo-abgelaufen', resttageDemo: 0 }
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
