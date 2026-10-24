import { z } from 'zod'
import type { BetriebsmodusErmittlung } from '../demo/demo'
import type { Produktlizenz } from './produktlizenz'

const UNTERSTUETZER_SCHEMA = z.object({
  stufe: z.string().trim().min(1),
  kommerziell: z.boolean(),
})

export type UnterstuetzerAngaben = z.infer<typeof UNTERSTUETZER_SCHEMA>

export function unterstuetzerAngaben(lizenz: Produktlizenz | null): UnterstuetzerAngaben | null {
  const roh = lizenz?.zusatz.unterstuetzer
  const geprueft = UNTERSTUETZER_SCHEMA.safeParse(roh)
  return geprueft.success ? geprueft.data : null
}

export function kommerziellErlaubt(ermittlung: BetriebsmodusErmittlung): boolean {
  if (ermittlung.betriebsmodus !== 'lizenziert') return false
  return unterstuetzerAngaben(ermittlung.produktlizenz.lizenz)?.kommerziell === true
}
