import { z } from 'zod'
import { t } from '../sprache'
import { DOKUMENT_TYPEN, PROJEKT_STATUS } from './verwaltung'

const getrimmt = z.string().trim()

const optionalerText = getrimmt
  .transform((wert) => (wert.length > 0 ? wert : null))
  .nullable()
  .default(null)

export const projektEingabeSchema = z.object({
  kunde: getrimmt.default(''),
  bezeichnung: getrimmt.min(1, { error: () => t('modell.verwaltung.projektbezeichnungLeer') }),
  projektnummer: optionalerText,
  notiz: optionalerText,
  status: z.enum(PROJEKT_STATUS).default('in_arbeit'),
  archiviert: z.boolean().default(false),
})

export type ProjektEingabe = z.infer<typeof projektEingabeSchema>

export const dokumentEingabeSchema = z.object({
  typ: z.enum(DOKUMENT_TYPEN),
  name: getrimmt.min(1, { error: () => t('modell.verwaltung.dokumentnameLeer') }),
  reihenfolge: z.number().int().nonnegative().optional(),
  quelleDokumentId: z.string().nullable().optional(),
})

export type DokumentEingabe = z.infer<typeof dokumentEingabeSchema>

export const dokumentAenderungSchema = z.object({
  name: getrimmt.min(1, { error: () => t('modell.verwaltung.dokumentnameLeer') }).optional(),
  reihenfolge: z.number().int().nonnegative().optional(),
})

export type DokumentAenderung = z.infer<typeof dokumentAenderungSchema>

export const dokumentInhaltEingabeSchema = z.object({
  formatVersion: z.number().int().positive(),
  version: z.number().int().nonnegative(),
  inhalt: z.string().nullable().default(null),
  assetId: z.string().nullable().default(null),
})

export type DokumentInhaltEingabe = z.infer<typeof dokumentInhaltEingabeSchema>

export const standEingabeSchema = z.object({
  name: getrimmt.min(1, { error: () => t('modell.verwaltung.standNameLeer') }),
  bemerkung: optionalerText,
})

export type StandEingabe = z.infer<typeof standEingabeSchema>

export const projektFilterSchema = z.object({
  suche: getrimmt.optional(),
  status: z.enum(PROJEKT_STATUS).optional(),
  archiviert: z
    .enum(['true', 'false', 'alle'])
    .default('false')
    .transform((wert) => (wert === 'alle' ? 'alle' : wert === 'true')),
})

export type ProjektFilter = z.infer<typeof projektFilterSchema>
