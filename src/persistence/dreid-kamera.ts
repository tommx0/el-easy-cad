import { z } from 'zod'

const PRAEFIX = 'eleasycad-3d-kamera:'

const vektor = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()])
const kameraSchema = z.object({
  position: vektor,
  ziel: vektor,
  modus: z.enum(['umkreisen', 'begehen']).optional(),
})

export type GemerkteDreidKamera = z.infer<typeof kameraSchema>

export function ladeDreidKamera(zeichnungId: string): GemerkteDreidKamera | null {
  try {
    const roh = window.localStorage.getItem(PRAEFIX + zeichnungId)
    if (!roh) return null
    const geprueft = kameraSchema.safeParse(JSON.parse(roh))
    return geprueft.success ? geprueft.data : null
  } catch {
    return null
  }
}

export function speichereDreidKamera(zeichnungId: string, kamera: GemerkteDreidKamera): void {
  try {
    window.localStorage.setItem(PRAEFIX + zeichnungId, JSON.stringify(kamera))
  } catch {}
}

const DECKKRAFT_SCHLUESSEL = 'eleasycad-3d-deckkraft'

const anteil = z.number().min(0).max(1)
const deckkraftSchema = z.object({ vorne: anteil, hinten: anteil, decken: anteil })

export type GemerkteDreidDeckkraft = z.infer<typeof deckkraftSchema>

export function ladeDreidDeckkraft(): GemerkteDreidDeckkraft | null {
  try {
    const roh = window.localStorage.getItem(DECKKRAFT_SCHLUESSEL)
    if (!roh) return null
    const geprueft = deckkraftSchema.safeParse(JSON.parse(roh))
    return geprueft.success ? geprueft.data : null
  } catch {
    return null
  }
}

export function speichereDreidDeckkraft(deckkraft: GemerkteDreidDeckkraft): void {
  try {
    window.localStorage.setItem(DECKKRAFT_SCHLUESSEL, JSON.stringify(deckkraft))
  } catch {}
}

const SYMBOLGROESSE_SCHLUESSEL = 'eleasycad-3d-symbolgroesse'

const symbolgroesseSchema = z.number().min(0.1).max(1)

export function ladeDreidSymbolgroesse(): number | null {
  try {
    const roh = window.localStorage.getItem(SYMBOLGROESSE_SCHLUESSEL)
    if (!roh) return null
    const geprueft = symbolgroesseSchema.safeParse(JSON.parse(roh))
    return geprueft.success ? geprueft.data : null
  } catch {
    return null
  }
}

export function speichereDreidSymbolgroesse(anteil: number): void {
  try {
    window.localStorage.setItem(SYMBOLGROESSE_SCHLUESSEL, JSON.stringify(anteil))
  } catch {}
}
