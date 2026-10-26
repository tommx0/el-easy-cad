import { z } from 'zod'
import type { UpdateSuche } from './update-suche'

export const STANDARD_INSTALLATIONSHOEHEN_CM: readonly number[] = [30, 110]

export interface AppSettings {
  gridBasisSchritt: number
  routingKostenProLaenge: number
  routingKosten90: number
  routingKosten45: number
  routingSicherheitsabstandMeter: number
  routingMaxSuchbereichErweiterungen: number
  routingWandfuehrung: boolean
  routingWandabstandMeter: number
  routingWandBevorzugung: number
  routingWandQuerungsKosten: number
  routingParallelAbstandMeter: number
  tastenkuerzel: Record<string, string | null>
  objektfangArten: string[]
  firmenlogoAssetId: string | null
  firmenlogoDateiname: string | null
  werkzeugleiste: {
    reihenfolge: string[]
    ausgeblendet: string[]
  }
  symbolleiste: {
    reihenfolge: string[]
    eingeblendet: string[] | null
    anzeigen: boolean
    gruppen?: { id: string; name: string; befehle: string[] }[]
  }
  symbolleisteNachtraege: string[]
  seitenleiste: {
    sichtbar: boolean
    angedockt: boolean
    breite?: number
  }
  eigenschaftenSichtbar: boolean
  kontextleiste: {
    sichtbar: boolean
    versatz: { x: number; y: number } | null
  }
  datenschutzAkzeptiertStand: string | null
  bemassungVariante: 'bemassung' | 'kettenbemassung' | 'parallelbemassung'
  pfeiltastenSchrittKleinMeter: number
  pfeiltastenSchrittGrossMeter: number
  installationshoehenVorgabenCm: number[]
  kombinationsFaktor: number
  pickerKachelGroesse: number
  einfuehrungBeimStartZeigen: boolean
  automatischAnordnen: AutomatischAnordnenGespeichert
  verteilerplan: VerteilerplanGespeichert
  stromkreisImPanel: boolean
  sprache: string | null
  communityHinweisVersion: string | null
  updateSuche: UpdateSuche
  verknuepfungNachLeitung: boolean
  leitungenErstNachLoslassen: boolean
}

export const verteilerplanSchema = z
  .object({
    maxSicherungenJeBlatt: z.number().int().min(1).max(64),
    maxKlemmenJeBlatt: z.number().int().min(1).max(128),
    aufteilung: z.enum(['ganz', 'fortlaufend']),
    stromkreisSchutzId: z.string(),
    stromkreisKlemmeId: z.string().nullable(),
    knxReserveProzent: z.number().int().min(0).max(200),
  })
  .partial()

export type VerteilerplanGespeichert = z.infer<typeof verteilerplanSchema>

export const automatischAnordnenSchema = z
  .object({
    richtung: z.enum(['automatisch', 'oben-unten', 'links-rechts']),
    lageBeruecksichtigen: z.boolean(),
    kinderSeitlich: z.boolean(),
    komponentenAbstandCm: z.number().finite().positive().nullable(),
    reihenAbstandCm: z.number().finite().positive().nullable(),
    bahnabstandMm: z.number().finite().positive().nullable(),
    kreuzungen: z.enum(['gering', 'mittel', 'stark', 'immer']),
    nurRechtwinklig: z.boolean(),
    buendeln: z.boolean(),
    raster: z.boolean(),
    lage: z.enum(['ecke', 'mitte']),
    trunksBilden: z.boolean(),
    trunkMindestLeitungen: z.number().int().min(2),
    trunkMindestLaengeM: z.number().finite().positive(),
  })
  .partial()

export type AutomatischAnordnenGespeichert = z.infer<typeof automatischAnordnenSchema>

export interface SettingsStore {
  laden(): Promise<Partial<AppSettings>>
  speichern(patch: Partial<AppSettings>): Promise<void>
}

export const appSettingsPatchSchema = z.object({
  gridBasisSchritt: z.number().finite().positive().optional(),
  routingKostenProLaenge: z.number().finite().nonnegative().optional(),
  routingKosten90: z.number().finite().nonnegative().optional(),
  routingKosten45: z.number().finite().nonnegative().optional(),
  routingSicherheitsabstandMeter: z.number().finite().nonnegative().optional(),
  routingMaxSuchbereichErweiterungen: z.number().finite().int().positive().optional(),
  routingWandfuehrung: z.boolean().optional(),
  routingWandabstandMeter: z.number().finite().nonnegative().optional(),
  routingWandBevorzugung: z.number().finite().min(0).max(0.8).optional(),
  routingWandQuerungsKosten: z.number().finite().nonnegative().optional(),
  routingParallelAbstandMeter: z.number().finite().nonnegative().optional(),
  tastenkuerzel: z.record(z.string(), z.string().nullable()).optional(),
  objektfangArten: z.array(z.string()).optional(),
  firmenlogoAssetId: z.string().nullable().optional(),
  firmenlogoDateiname: z.string().nullable().optional(),
  werkzeugleiste: z
    .object({
      reihenfolge: z.array(z.string()),
      ausgeblendet: z.array(z.string()),
    })
    .optional(),
  symbolleiste: z
    .object({
      reihenfolge: z.array(z.string()),
      eingeblendet: z.array(z.string()).nullable(),
      anzeigen: z.boolean(),
      gruppen: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().min(1),
            befehle: z.array(z.string()),
          }),
        )
        .optional(),
    })
    .optional(),
  symbolleisteNachtraege: z.array(z.string()).optional(),
  seitenleiste: z
    .object({
      sichtbar: z.boolean(),
      angedockt: z.boolean(),
      breite: z.number().optional(),
    })
    .optional(),
  eigenschaftenSichtbar: z.boolean().optional(),
  kontextleiste: z
    .object({
      sichtbar: z.boolean(),
      versatz: z.object({ x: z.number().finite(), y: z.number().finite() }).nullable(),
    })
    .optional(),
  datenschutzAkzeptiertStand: z.string().nullable().optional(),
  betatestAkzeptiertStand: z.string().nullable().optional(),
  theme: z.enum(['hell', 'dunkel', 'system']).optional(),
  bemassungVariante: z.enum(['bemassung', 'kettenbemassung', 'parallelbemassung']).optional(),
  feedbackServerUrl: z
    .union([z.literal(''), z.string().url()])
    .nullable()
    .optional(),
  pfeiltastenSchrittKleinMeter: z.number().finite().positive().optional(),
  pfeiltastenSchrittGrossMeter: z.number().finite().positive().optional(),
  installationshoehenVorgabenCm: z.array(z.number().finite().nonnegative()).optional(),
  kombinationsFaktor: z.number().finite().positive().optional(),
  pickerKachelGroesse: z.number().finite().positive().optional(),
  einfuehrungBeimStartZeigen: z.boolean().optional(),
  automatischAnordnen: automatischAnordnenSchema.optional(),
  verteilerplan: verteilerplanSchema.optional(),
  stromkreisImPanel: z.boolean().optional(),
  sprache: z.string().nullable().optional(),
  communityHinweisVersion: z.string().nullable().optional(),
  updateSuche: z.enum(['fragen', 'immer', 'nie']).optional(),
  verknuepfungNachLeitung: z.boolean().optional(),
  leitungenErstNachLoslassen: z.boolean().optional(),
})

export type AppSettingsPatch = z.infer<typeof appSettingsPatchSchema>
