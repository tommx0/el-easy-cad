import { z } from 'zod'
import { erzeugeEbene, type Ebene } from './ebenen'
import type { Point } from './geometry'
import { neueObjektBasis } from './objekte'
import type {
  Fuellung,
  KreisObjekt,
  LinienObjekt,
  Objekt,
  PlankopfObjekt,
  PolylinienObjekt,
  RechteckObjekt,
  TextObjekt,
} from './objekte'

export const GRUNDFORM_HOECHSTZAHL = 2000

const punktSchema = z.object({ x: z.number(), y: z.number() })

const fuellungSchema = z.object({
  farbe: z.string(),
  deckkraft: z.number().min(0).max(1).optional(),
  schraffur: z.enum(['diagonal', 'kreuz', 'horizontal', 'vertikal']).optional(),
  abstandM: z.number().positive().optional(),
})

const gemeinsam = {
  farbe: z.string().optional(),
  strichstaerke: z.number().positive().max(50).optional(),
  linientyp: z.enum(['standard', 'gestrichelt', 'gepunktet', 'strichpunkt']).optional(),
  ebene: z.string().min(1).max(80).optional(),
  modulDaten: z.record(z.string(), z.unknown()).optional(),
}

const pfeilSchema = z.enum(['anfang', 'ende', 'beide'])

export const grundformSchema = z.discriminatedUnion('art', [
  z.object({
    art: z.literal('linie'),
    von: punktSchema,
    bis: punktSchema,
    pfeil: pfeilSchema.optional(),
    ...gemeinsam,
  }),
  z.object({
    art: z.literal('polylinie'),
    punkte: z.array(punktSchema).min(2),
    geschlossen: z.boolean().optional(),
    pfeil: pfeilSchema.optional(),
    fuellung: fuellungSchema.optional(),
    ...gemeinsam,
  }),
  z.object({
    art: z.literal('rechteck'),
    von: punktSchema,
    bis: punktSchema,
    fuellung: fuellungSchema.optional(),
    ...gemeinsam,
  }),
  z.object({
    art: z.literal('kreis'),
    mittelpunkt: punktSchema,
    radius: z.number().positive(),
    fuellung: fuellungSchema.optional(),
    ...gemeinsam,
  }),
  z.object({
    art: z.literal('text'),
    position: punktSchema,
    inhalt: z.string().min(1).max(2000),
    hoehe: z.number().positive(),
    ausrichtung: z.enum(['links', 'mittig', 'rechts']).optional(),
    drehungGrad: z.number().optional(),
    ...gemeinsam,
  }),
  z.object({
    art: z.literal('plankopf'),
    position: punktSchema,
    breiteMm: z.number().positive().max(2000),
    zeilen: z
      .array(
        z.object({
          hoeheMm: z.number().positive().max(200),
          zellen: z
            .array(
              z.object({
                beschriftung: z.string().max(200).optional(),
                wert: z.string().max(500).optional(),
                teile: z
                  .array(z.object({ text: z.string().max(500), farbe: z.string().optional() }))
                  .max(20)
                  .optional(),
                spanne: z.number().positive().optional(),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
    ...gemeinsam,
  }),
])

export type Grundform = z.infer<typeof grundformSchema>

export type GrundformMitId = Grundform & { id: string }

function zuFuellung(f: z.infer<typeof fuellungSchema> | undefined): Fuellung | null {
  if (!f) return null
  return f.schraffur
    ? {
        art: 'schraffur',
        farbe: f.farbe,
        muster: f.schraffur,
        abstand: f.abstandM,
        deckkraft: f.deckkraft ?? 1,
      }
    : { art: 'farbe', farbe: f.farbe, deckkraft: f.deckkraft ?? 1 }
}

function ausFuellung(f: Fuellung | null): z.infer<typeof fuellungSchema> | undefined {
  if (!f) return undefined
  return {
    farbe: f.farbe,
    ...(f.deckkraft !== 1 ? { deckkraft: f.deckkraft } : {}),
    ...(f.art === 'schraffur' ? { schraffur: f.muster ?? 'diagonal' } : {}),
    ...(f.art === 'schraffur' && f.abstand !== undefined ? { abstandM: f.abstand } : {}),
  }
}

export function grundformZuObjekt(g: Grundform, ebeneId: string, bezug: Point): Objekt {
  const p = (q: { x: number; y: number }): Point => ({ x: q.x + bezug.x, y: q.y + bezug.y })
  const basis = neueObjektBasis(ebeneId, {
    ...(g.farbe !== undefined ? { farbe: g.farbe } : {}),
    ...(g.strichstaerke !== undefined ? { strichstaerke: g.strichstaerke } : {}),
    ...(g.linientyp !== undefined ? { linientyp: g.linientyp } : {}),
    ...(g.modulDaten && Object.keys(g.modulDaten).length > 0 ? { modulDaten: g.modulDaten } : {}),
  })
  switch (g.art) {
    case 'linie':
      return {
        ...basis,
        type: 'linie',
        start: p(g.von),
        ende: p(g.bis),
        ...(g.pfeil ? { pfeil: g.pfeil } : {}),
      } satisfies LinienObjekt
    case 'polylinie': {
      const punkte = g.punkte.map(p)
      return {
        ...basis,
        type: 'polylinie',
        punkte,
        geschlossen: g.geschlossen === true && punkte.length >= 3,
        fuellung: zuFuellung(g.fuellung),
        ...(g.pfeil ? { pfeil: g.pfeil } : {}),
      } satisfies PolylinienObjekt
    }
    case 'rechteck': {
      const a = p(g.von)
      const b = p(g.bis)
      return {
        ...basis,
        type: 'rechteck',
        ursprung: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
        breite: Math.abs(b.x - a.x),
        hoehe: Math.abs(b.y - a.y),
        drehung: 0,
        fuellung: zuFuellung(g.fuellung),
      } satisfies RechteckObjekt
    }
    case 'kreis':
      return {
        ...basis,
        type: 'kreis',
        mittelpunkt: p(g.mittelpunkt),
        radius: g.radius,
        fuellung: zuFuellung(g.fuellung),
      } satisfies KreisObjekt
    case 'text':
      return {
        ...basis,
        type: 'text',
        position: p(g.position),
        inhalt: g.inhalt,
        hoehe: g.hoehe,
        drehung: ((g.drehungGrad ?? 0) * Math.PI) / 180,
        ...(g.ausrichtung && g.ausrichtung !== 'links' ? { ausrichtung: g.ausrichtung } : {}),
      } satisfies TextObjekt
    case 'plankopf':
      return {
        ...basis,
        type: 'plankopf',
        position: p(g.position),
        breiteMm: g.breiteMm,
        zeilen: g.zeilen.map((z) => ({
          hoeheMm: z.hoeheMm,
          zellen: z.zellen.map((c) => ({
            beschriftung: c.beschriftung ?? '',
            wert: c.teile?.length ? c.teile.map((t) => t.text).join('') : (c.wert ?? ''),
            quelle: null,
            spanne: c.spanne ?? 1,
            logo: null,
            ...(c.teile?.length
              ? {
                  teile: c.teile.map((t) => ({
                    text: t.text,
                    ...(t.farbe ? { farbe: t.farbe } : {}),
                  })),
                }
              : {}),
          })),
        })),
      } satisfies PlankopfObjekt
  }
}

export function objektZuGrundform(
  o: Objekt,
  bezug: Point,
  ebenen: readonly Ebene[],
): GrundformMitId | null {
  const m = (q: Point) => ({ x: q.x - bezug.x, y: q.y - bezug.y })
  const gemeinsameFelder = {
    id: o.id,
    farbe: o.farbe,
    strichstaerke: o.strichstaerke,
    linientyp: o.linientyp,
    ebene: ebenen.find((e) => e.id === o.ebeneId)?.name,
    ...(o.modulDaten ? { modulDaten: o.modulDaten } : {}),
  }
  switch (o.type) {
    case 'linie':
      return {
        ...gemeinsameFelder,
        art: 'linie',
        von: m(o.start),
        bis: m(o.ende),
        ...(o.pfeil ? { pfeil: o.pfeil } : {}),
      }
    case 'polylinie':
      return {
        ...gemeinsameFelder,
        art: 'polylinie',
        punkte: o.punkte.map(m),
        geschlossen: o.geschlossen,
        ...(o.pfeil ? { pfeil: o.pfeil } : {}),
        ...(o.fuellung ? { fuellung: ausFuellung(o.fuellung) } : {}),
      }
    case 'rechteck':
      return {
        ...gemeinsameFelder,
        art: 'rechteck',
        von: m(o.ursprung),
        bis: m({ x: o.ursprung.x + o.breite, y: o.ursprung.y + o.hoehe }),
        ...(o.fuellung ? { fuellung: ausFuellung(o.fuellung) } : {}),
      }
    case 'kreis':
      return {
        ...gemeinsameFelder,
        art: 'kreis',
        mittelpunkt: m(o.mittelpunkt),
        radius: o.radius,
        ...(o.fuellung ? { fuellung: ausFuellung(o.fuellung) } : {}),
      }
    case 'text':
      return {
        ...gemeinsameFelder,
        art: 'text',
        position: m(o.position),
        inhalt: o.inhalt,
        hoehe: o.hoehe,
        ...(o.ausrichtung ? { ausrichtung: o.ausrichtung } : {}),
        ...(o.drehung ? { drehungGrad: (o.drehung * 180) / Math.PI } : {}),
      }
    case 'plankopf':
      return {
        ...gemeinsameFelder,
        art: 'plankopf',
        position: m(o.position),
        breiteMm: o.breiteMm,
        zeilen: o.zeilen.map((z) => ({
          hoeheMm: z.hoeheMm,
          zellen: z.zellen.map((c) => ({
            beschriftung: c.beschriftung,
            wert: c.wert,
            spanne: c.spanne,
            ...(c.teile ? { teile: c.teile } : {}),
          })),
        })),
      }
    default:
      return null
  }
}

export function loeseEbenenAuf(
  namen: Iterable<string>,
  vorhandene: readonly Ebene[],
): { ebenen: Ebene[]; idFuer: (name: string) => string; neu: Ebene[] } {
  const ebenen = [...vorhandene]
  const neu: Ebene[] = []
  const finde = (name: string) =>
    ebenen.find((e) => !e.istHintergrundLayer && e.name.toLowerCase() === name.toLowerCase())
  for (const name of namen) {
    if (finde(name)) continue
    const ebene = erzeugeEbene(name)
    ebenen.push(ebene)
    neu.push(ebene)
  }
  return { ebenen, neu, idFuer: (name) => finde(name)!.id }
}
