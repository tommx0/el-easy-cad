import { z } from 'zod'
import { kabeltypUebersetzungenSchema } from './katalog-uebersetzung'

export const kabeltypSchema = z.object({
  id: z.string(),
  bezeichnung: z.string(),
  gruppe: z.string(),
  bemerkung: z.string().optional(),
  uebersetzungen: kabeltypUebersetzungenSchema,
  aussendurchmesserMm: z.number().positive().optional(),
  herkunft: z.enum(['standard', 'benutzer']),
  aktiv: z.boolean().default(true),
  sortierung: z.number().optional(),
  seedVersion: z.number().optional(),
})

export type KabeltypJson = z.infer<typeof kabeltypSchema>
