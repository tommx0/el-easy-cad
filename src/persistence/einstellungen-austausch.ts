import { z } from 'zod'
import type { Kabeltyp, ZonenDefinition } from '../document-model'
import { kabeltypSchema } from '../document-model/kabeltyp-schema'
import { zonenDefinitionSchema } from '../document-model/installationszonen-schema'
import { t, type Schluessel } from '../sprache'
import { appSettingsPatchSchema, type AppSettings, type AppSettingsPatch } from './settings-store'

export const EINSTELLUNGS_FORMAT = 'el-easy-cad-einstellungen'
export const EINSTELLUNGS_FORMAT_VERSION = 1

export type EinstellungsBereich =
  'oberflaeche' | 'zeichnen' | 'autorouting' | 'firmenlogoUndKabeltypen'

export const EINSTELLUNGS_BEREICHE: readonly EinstellungsBereich[] = [
  'oberflaeche',
  'zeichnen',
  'autorouting',
  'firmenlogoUndKabeltypen',
]

function textTabelle<K extends string>(
  schluessel: Record<K, Schluessel>,
): Readonly<Record<K, string>> {
  const tabelle = {} as Record<K, string>
  for (const k of Object.keys(schluessel) as K[]) {
    Object.defineProperty(tabelle, k, { enumerable: true, get: () => t(schluessel[k]) })
  }
  return tabelle
}

export const EINSTELLUNGS_BEREICH_LABELS = textTabelle<EinstellungsBereich>({
  oberflaeche: 'persistenz.einstellungen.bereichOberflaeche',
  zeichnen: 'persistenz.einstellungen.bereichZeichnen',
  autorouting: 'persistenz.einstellungen.bereichAutorouting',
  firmenlogoUndKabeltypen: 'persistenz.einstellungen.bereichFirmenlogoUndKabeltypen',
})

export const EINSTELLUNGS_BEREICH_HINWEISE = textTabelle<EinstellungsBereich>({
  oberflaeche: 'persistenz.einstellungen.hinweisOberflaeche',
  zeichnen: 'persistenz.einstellungen.hinweisZeichnen',
  autorouting: 'persistenz.einstellungen.hinweisAutorouting',
  firmenlogoUndKabeltypen: 'persistenz.einstellungen.hinweisFirmenlogoUndKabeltypen',
})

const BEREICH_FELDER = {
  oberflaeche: [
    'werkzeugleiste',
    'symbolleiste',
    'seitenleiste',
    'eigenschaftenSichtbar',
    'kontextleiste',
    'tastenkuerzel',
    'stromkreisImPanel',
    'sprache',
    'pickerKachelGroesse',
  ],
  zeichnen: [
    'objektfangArten',
    'gridBasisSchritt',
    'nichtDruckbereich',
    'pfeiltastenSchrittKleinMeter',
    'pfeiltastenSchrittGrossMeter',
    'bemassungVariante',
    'installationshoehenVorgabenCm',
    'kombinationsFaktor',
    'verteilerplan',
    'verknuepfungNachLeitung',
    'leitungsverlegung',
  ],
  autorouting: [
    'routingKostenProLaenge',
    'routingKosten90',
    'routingKosten45',
    'routingSicherheitsabstandMeter',
    'routingMaxSuchbereichErweiterungen',
    'routingWandfuehrung',
    'routingWandabstandMeter',
    'routingWandBevorzugung',
    'routingWandQuerungsKosten',
    'routingParallelAbstandMeter',
    'leitungenErstNachLoslassen',
    'automatischAnordnen',
  ],
} as const satisfies Record<
  Exclude<EinstellungsBereich, 'firmenlogoUndKabeltypen'>,
  readonly (keyof AppSettings)[]
>

function waehleFelder<const K extends keyof AppSettingsPatch>(
  felder: readonly K[],
): { [P in K]: true } {
  return Object.fromEntries(felder.map((f) => [f, true])) as { [P in K]: true }
}

const firmenlogoSchema = z.object({
  dateiname: z.string(),
  mime: z.string(),
  daten: z.string(),
})

export type FirmenlogoDaten = z.infer<typeof firmenlogoSchema>

const sicherungSchema = z.object({
  format: z.literal(EINSTELLUNGS_FORMAT),
  formatVersion: z.number().int().positive(),
  erstellt: z.string(),
  programmVersion: z.string(),
  bereiche: z.object({
    oberflaeche: appSettingsPatchSchema.pick(waehleFelder(BEREICH_FELDER.oberflaeche)).optional(),
    zeichnen: appSettingsPatchSchema.pick(waehleFelder(BEREICH_FELDER.zeichnen)).optional(),
    autorouting: appSettingsPatchSchema.pick(waehleFelder(BEREICH_FELDER.autorouting)).optional(),
    firmenlogoUndKabeltypen: z
      .object({
        firmenlogo: firmenlogoSchema.nullable(),
        kabeltypen: z.array(kabeltypSchema),
        installationszonen: z.array(zonenDefinitionSchema).optional(),
      })
      .optional(),
  }),
})

export type EinstellungsSicherung = z.infer<typeof sicherungSchema>

export interface SicherungEingabe {
  einstellungen: Partial<AppSettings>
  firmenlogo: FirmenlogoDaten | null
  kabeltypen: readonly Kabeltyp[]
  installationszonen?: readonly ZonenDefinition[]
  bereiche: readonly EinstellungsBereich[]
  programmVersion: string
  erstellt: Date
}

function auswahl(
  einstellungen: Partial<AppSettings>,
  felder: readonly (keyof AppSettings)[],
): AppSettingsPatch {
  const ergebnis: Record<string, unknown> = {}
  for (const feld of felder) {
    if (einstellungen[feld] !== undefined) ergebnis[feld] = einstellungen[feld]
  }
  return ergebnis as AppSettingsPatch
}

export function erzeugeSicherung(eingabe: SicherungEingabe): EinstellungsSicherung {
  const { einstellungen, bereiche } = eingabe
  return {
    format: EINSTELLUNGS_FORMAT,
    formatVersion: EINSTELLUNGS_FORMAT_VERSION,
    erstellt: eingabe.erstellt.toISOString(),
    programmVersion: eingabe.programmVersion,
    bereiche: {
      ...(bereiche.includes('oberflaeche') && {
        oberflaeche: auswahl(einstellungen, BEREICH_FELDER.oberflaeche),
      }),
      ...(bereiche.includes('zeichnen') && {
        zeichnen: auswahl(einstellungen, BEREICH_FELDER.zeichnen),
      }),
      ...(bereiche.includes('autorouting') && {
        autorouting: auswahl(einstellungen, BEREICH_FELDER.autorouting),
      }),
      ...(bereiche.includes('firmenlogoUndKabeltypen') && {
        firmenlogoUndKabeltypen: {
          firmenlogo: eingabe.firmenlogo,
          kabeltypen: eingabe.kabeltypen.filter((t) => t.herkunft === 'benutzer'),
          installationszonen: (eingabe.installationszonen ?? []).filter(
            (z) => z.herkunft === 'benutzer',
          ),
        },
      }),
    },
  }
}

export class UngueltigeEinstellungsDatei extends Error {
  constructor() {
    super(t('persistenz.einstellungen.ungueltigeDatei'))
    this.name = 'UngueltigeEinstellungsDatei'
  }
}

export function liesSicherung(text: string): EinstellungsSicherung {
  let roh: unknown
  try {
    roh = JSON.parse(text)
  } catch {
    throw new UngueltigeEinstellungsDatei()
  }
  const ergebnis = sicherungSchema.safeParse(roh)
  if (!ergebnis.success) throw new UngueltigeEinstellungsDatei()
  return ergebnis.data
}

export function enthalteneBereiche(sicherung: EinstellungsSicherung): EinstellungsBereich[] {
  return EINSTELLUNGS_BEREICHE.filter((b) => sicherung.bereiche[b] !== undefined)
}

export function einstellungsPatchAus(
  sicherung: EinstellungsSicherung,
  bereiche: readonly EinstellungsBereich[],
): AppSettingsPatch {
  return {
    ...(bereiche.includes('oberflaeche') ? sicherung.bereiche.oberflaeche : {}),
    ...(bereiche.includes('zeichnen') ? sicherung.bereiche.zeichnen : {}),
    ...(bereiche.includes('autorouting') ? sicherung.bereiche.autorouting : {}),
  }
}

export interface KabeltypUebernahme {
  zuSpeichern: Kabeltyp[]
  neu: number
  ersetzt: number
}

export function planeKabeltypUebernahme(
  vorhanden: readonly Kabeltyp[],
  ausDatei: readonly Kabeltyp[],
): KabeltypUebernahme {
  const nachId = new Map(vorhanden.map((t) => [t.id, t]))
  const nachBezeichnung = new Map(vorhanden.map((t) => [t.bezeichnung.trim().toLowerCase(), t]))
  const zuSpeichern: Kabeltyp[] = []
  let neu = 0
  let ersetzt = 0
  for (const roh of ausDatei) {
    const typ: Kabeltyp = { ...roh, herkunft: 'benutzer', seedVersion: undefined }
    const treffer = nachId.get(typ.id) ?? nachBezeichnung.get(typ.bezeichnung.trim().toLowerCase())
    if (treffer?.herkunft === 'standard') {
      if (treffer.bezeichnung.trim().toLowerCase() === typ.bezeichnung.trim().toLowerCase())
        continue
      zuSpeichern.push({ ...typ, id: `${typ.id}-eigen` })
      neu++
      continue
    }
    if (treffer) {
      zuSpeichern.push({ ...typ, id: treffer.id })
      ersetzt++
    } else {
      zuSpeichern.push(typ)
      neu++
    }
  }
  return { zuSpeichern, neu, ersetzt }
}

export function planeZonenUebernahme(
  vorhanden: readonly ZonenDefinition[],
  ausDatei: readonly ZonenDefinition[],
): { zuSpeichern: ZonenDefinition[]; neu: number; ersetzt: number } {
  const nachId = new Map(vorhanden.map((z) => [z.id, z]))
  const zuSpeichern: ZonenDefinition[] = []
  let neu = 0
  let ersetzt = 0
  for (const roh of ausDatei) {
    const treffer = nachId.get(roh.id)
    if (treffer?.herkunft === 'standard') continue
    zuSpeichern.push({ ...roh, herkunft: 'benutzer', seedVersion: undefined })
    if (treffer) ersetzt++
    else neu++
  }
  return { zuSpeichern, neu, ersetzt }
}

export function base64AusBytes(bytes: Uint8Array): string {
  let binaer = ''
  const block = 0x8000
  for (let i = 0; i < bytes.length; i += block) {
    binaer += String.fromCharCode(...bytes.subarray(i, i + block))
  }
  return btoa(binaer)
}

export function bytesAusBase64(daten: string): Uint8Array<ArrayBuffer> {
  const binaer = atob(daten)
  const bytes = new Uint8Array(new ArrayBuffer(binaer.length))
  for (let i = 0; i < binaer.length; i++) bytes[i] = binaer.charCodeAt(i)
  return bytes
}
