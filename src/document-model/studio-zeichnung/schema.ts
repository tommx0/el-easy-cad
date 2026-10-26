import { z } from 'zod'
import { symbolFarbeSchema } from '../symbol-palette'
import type { PfadSegment, ZeichenElement } from './modell'

const punkt = z.object({ x: z.number(), y: z.number() })
const zahl = z.number().finite()

const stil = {
  strich: z.number().min(0).max(1_000),
  strichFarbe: symbolFarbeSchema,
  gestrichelt: z.boolean(),
  fuellung: z.union([z.literal('keine'), symbolFarbeSchema]),
}

const basis = { id: z.string().min(1).max(100) }

const segment: z.ZodType<PfadSegment> = z.discriminatedUnion('typ', [
  z.object({ typ: z.literal('M'), p: punkt }),
  z.object({ typ: z.literal('L'), p: punkt }),
  z.object({ typ: z.literal('C'), c1: punkt, c2: punkt, p: punkt }),
  z.object({ typ: z.literal('Q'), c: punkt, p: punkt }),
  z.object({ typ: z.literal('Z') }),
])

export const studioElementSchema: z.ZodType<ZeichenElement> = z.discriminatedUnion('art', [
  z.object({ ...basis, ...stil, art: z.literal('linie'), a: punkt, b: punkt }),
  z.object({
    ...basis,
    ...stil,
    art: z.literal('polylinie'),
    punkte: z.array(punkt).min(1).max(50_000),
    geschlossen: z.boolean(),
  }),
  z.object({
    ...basis,
    ...stil,
    art: z.literal('rechteck'),
    mitte: punkt,
    breite: z.number().nonnegative(),
    hoehe: z.number().nonnegative(),
    radius: z.number().nonnegative(),
    drehung: zahl,
  }),
  z.object({
    ...basis,
    ...stil,
    art: z.literal('ellipse'),
    mitte: punkt,
    rx: z.number().nonnegative(),
    ry: z.number().nonnegative(),
    drehung: zahl,
  }),
  z.object({
    ...basis,
    ...stil,
    art: z.literal('bogen'),
    mitte: punkt,
    radius: z.number().nonnegative(),
    start: zahl,
    spanne: zahl,
  }),
  z.object({ ...basis, ...stil, art: z.literal('pfad'), segmente: z.array(segment).max(50_000) }),
  z.object({
    ...basis,
    art: z.literal('text'),
    position: punkt,
    text: z.string().max(2_000),
    groesse: z.number().positive().max(1_000),
    ausrichtung: z.enum(['links', 'mittig', 'rechts']),
    drehung: zahl,
    fett: z.boolean(),
    farbe: symbolFarbeSchema,
  }),
  z.object({
    ...basis,
    art: z.literal('bild'),
    mitte: punkt,
    breite: z.number().positive(),
    hoehe: z.number().positive(),
    drehung: zahl,
    datenUrl: z
      .string()
      .max(20_000_000)
      .refine((url) => url.startsWith('data:image/')),
  }),
])
