import { z } from 'zod'
import { t } from '../sprache'
import { type GeraeteRegelwerk, geraeteRegelwerkSchema } from './geraete-regelwerk'

export const BIBLIOTHEK_PAKET_VERSION = 1
export const BIBLIOTHEK_DATEI = 'bibliothek.json'

export interface BibliothekPaketKatalog {
  id: string
  name: string
  herkunft: 'standard' | 'benutzer'
  komponenten: number
  datei: string
}

export interface BibliothekPaketInhalt {
  paketVersion: number
  erzeugtAm: string
  anwendung: string
  regelwerk: GeraeteRegelwerk
  kataloge: BibliothekPaketKatalog[]
}

const inhaltSchema = z.object({
  paketVersion: z.number().int(),
  erzeugtAm: z.string(),
  anwendung: z.string(),
  regelwerk: geraeteRegelwerkSchema,
  kataloge: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      herkunft: z.enum(['standard', 'benutzer']),
      komponenten: z.number().int().nonnegative(),
      datei: z.string(),
    }),
  ),
})

export function bibliothekKatalogDatei(katalogId: string): string {
  return `kataloge/${encodeURIComponent(katalogId)}.eeckat`
}

export class BibliothekPaketFehler extends Error {}

export function liesBibliothekInhalt(text: string): BibliothekPaketInhalt {
  let roh: unknown
  try {
    roh = JSON.parse(text)
  } catch {
    throw new BibliothekPaketFehler(
      t('modell.bibliothekPaket.keinJson', { datei: BIBLIOTHEK_DATEI }),
    )
  }
  const version = (roh as { paketVersion?: unknown } | null)?.paketVersion
  if (typeof version === 'number' && version > BIBLIOTHEK_PAKET_VERSION)
    throw new BibliothekPaketFehler(
      t('modell.bibliothekPaket.neuereVersion', { version: String(version) }),
    )
  const ergebnis = inhaltSchema.safeParse(roh)
  if (!ergebnis.success)
    throw new BibliothekPaketFehler(
      t('modell.bibliothekPaket.falscheForm', { datei: BIBLIOTHEK_DATEI }),
    )
  return ergebnis.data
}
