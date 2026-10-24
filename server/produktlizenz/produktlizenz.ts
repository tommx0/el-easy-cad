import { sign, verify, type KeyObject } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { z } from 'zod'

export const PRODUKTLIZENZ_SCHEMA = z.object({
  formatVersion: z.literal(1),
  lizenznehmer: z.string().min(1),
  gueltigAb: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gueltigBis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  zusatz: z.record(z.string(), z.unknown()),
  signatur: z.string().min(1),
})

export type Produktlizenz = z.infer<typeof PRODUKTLIZENZ_SCHEMA>

export type ProduktlizenzStatus = 'fehlt' | 'ungueltig' | 'abgelaufen' | 'gueltig'

export const LIZENZ_MODULE = ['bim'] as const
export type LizenzModul = (typeof LIZENZ_MODULE)[number]

export function lizenzModule(lizenz: Pick<Produktlizenz, 'zusatz'> | null): LizenzModul[] {
  const roh = lizenz?.zusatz.module
  if (!Array.isArray(roh)) return []
  return LIZENZ_MODULE.filter((modul) => roh.includes(modul))
}

export const WARNUNG_TAGE_VOR_ABLAUF = 14

export interface ProduktlizenzPruefung {
  status: ProduktlizenzStatus
  lizenz: Produktlizenz | null
  tageBisAblauf: number | null
  warnungBaldAblaufend: boolean
}

function kanonischesJson(wert: unknown): string {
  if (Array.isArray(wert)) return `[${wert.map(kanonischesJson).join(',')}]`
  if (wert !== null && typeof wert === 'object') {
    const eintraege = Object.keys(wert as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${kanonischesJson((wert as Record<string, unknown>)[k])}`)
    return `{${eintraege.join(',')}}`
  }
  return JSON.stringify(wert)
}

function signierteDaten(lizenz: Omit<Produktlizenz, 'signatur'>): Buffer {
  return Buffer.from(kanonischesJson(lizenz), 'utf-8')
}

function pruefeSignatur(lizenz: Produktlizenz, oeffentlicherSchluessel: KeyObject): boolean {
  const { signatur, ...ohneSignatur } = lizenz
  try {
    return verify(
      null,
      signierteDaten(ohneSignatur),
      oeffentlicherSchluessel,
      Buffer.from(signatur, 'base64'),
    )
  } catch {
    return false
  }
}

export function signiereLizenz(
  daten: Omit<Produktlizenz, 'signatur'>,
  privaterSchluessel: KeyObject,
): Produktlizenz {
  const signatur = sign(null, signierteDaten(daten), privaterSchluessel).toString('base64')
  return { ...daten, signatur }
}

export function pruefeProduktlizenz(
  rohdaten: unknown,
  oeffentlicherSchluessel: KeyObject,
  heute: Date = new Date(),
): ProduktlizenzPruefung {
  const geparst = PRODUKTLIZENZ_SCHEMA.safeParse(rohdaten)
  if (!geparst.success) {
    return { status: 'ungueltig', lizenz: null, tageBisAblauf: null, warnungBaldAblaufend: false }
  }
  const lizenz = geparst.data
  if (!pruefeSignatur(lizenz, oeffentlicherSchluessel)) {
    return { status: 'ungueltig', lizenz, tageBisAblauf: null, warnungBaldAblaufend: false }
  }

  const heuteTag = heute.toISOString().slice(0, 10)
  if (heuteTag < lizenz.gueltigAb || heuteTag > lizenz.gueltigBis) {
    return { status: 'abgelaufen', lizenz, tageBisAblauf: null, warnungBaldAblaufend: false }
  }

  const millisekundenProTag = 24 * 60 * 60 * 1000
  const tageBisAblauf = Math.floor(
    (Date.parse(`${lizenz.gueltigBis}T00:00:00Z`) - Date.parse(`${heuteTag}T00:00:00Z`)) /
      millisekundenProTag,
  )
  return {
    status: 'gueltig',
    lizenz,
    tageBisAblauf,
    warnungBaldAblaufend: tageBisAblauf <= WARNUNG_TAGE_VOR_ABLAUF,
  }
}

export function leseLizenzDatei(pfad: string): unknown | undefined {
  if (!existsSync(pfad)) return undefined
  return JSON.parse(readFileSync(pfad, 'utf-8')) as unknown
}

export function schreibeLizenzDatei(pfad: string, rohdaten: unknown): void {
  writeFileSync(pfad, JSON.stringify(rohdaten, null, 2), 'utf-8')
}

export function ermittleProduktlizenzStatus(
  lizenzDatei: string,
  oeffentlicherSchluessel: KeyObject,
): ProduktlizenzPruefung {
  const rohdaten = leseLizenzDatei(lizenzDatei)
  if (rohdaten === undefined) {
    return { status: 'fehlt', lizenz: null, tageBisAblauf: null, warnungBaldAblaufend: false }
  }
  return pruefeProduktlizenz(rohdaten, oeffentlicherSchluessel)
}
