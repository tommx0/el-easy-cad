import { z } from 'zod'
import { bezeichnungsUebersetzungenSchema } from './katalog-uebersetzung'

export const zonenDefinitionSchema = z.object({
  id: z.string().min(1),
  bezeichnung: z.string(),
  uebersetzungen: bezeichnungsUebersetzungenSchema,
  kuerzel: z.string().max(3),
  bauteil: z.enum(['wand', 'decke', 'boden']),
  verlegung: z.enum(['auf', 'in']),
  tiefe: z.number().finite().min(0).optional(),
  hoehe: z
    .object({ bezug: z.enum(['boden', 'decke']), abstand: z.number().finite().min(0) })
    .optional(),
  farbe: z.string().optional(),
  herkunft: z.enum(['standard', 'benutzer']),
  aktiv: z.boolean().default(true),
  sortierung: z.number().optional(),
  seedVersion: z.number().optional(),
})

export type ZonenDefinitionJson = z.infer<typeof zonenDefinitionSchema>
