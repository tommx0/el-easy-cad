import { z } from 'zod'
import { t } from '../sprache'
import type { BoundingBox, Point } from './geometry'
import {
  boundingBoxFromPoints,
  distance,
  distanceToPolyline,
  distanceToSegment,
  expandBoundingBox,
  pointInBoundingBox,
  pointInPolygon,
} from './geometry'
import { istBunteSymbolFarbe, type SymbolFarbe, symbolFarbeSchema } from './symbol-palette'

export const SYMBOL_ZEICHNUNG_HOEHE = 100

export type SymbolStrich = 'duenn' | 'mittel' | 'dick'
export type SymbolTextGroesse = 'klein' | 'mittel' | 'gross'
export type SymbolPinsel = 'klein' | 'mittel' | 'gross'

export const SYMBOL_STRICH_BREITE: Record<SymbolStrich, number> = {
  duenn: 1,
  mittel: 2.5,
  dick: 5,
}

export const SYMBOL_PINSEL_BREITE: Record<SymbolPinsel, number> = {
  klein: 4,
  mittel: 10,
  gross: 20,
}

export const SYMBOL_TEXT_GROESSE: Record<SymbolTextGroesse, number> = {
  klein: 8,
  mittel: 12,
  gross: 18,
}

export const SYMBOL_TEXT_ZEILENHOEHE = 1.2
export const SYMBOL_SCHRIFT = 'Arial, Helvetica, sans-serif'

export interface SymbolRadierung {
  punkte: Point[]
  breite: number
}

interface SymbolElementBasis {
  id: string
  radierungen: SymbolRadierung[]
}

interface SymbolFarbig {
  farbe?: SymbolFarbe
}

interface SymbolFuellbar {
  fuellFarbe?: SymbolFarbe
}

export interface SymbolLinie extends SymbolElementBasis, SymbolFarbig {
  art: 'linie'
  a: Point
  b: Point
  strich: SymbolStrich
}

export interface SymbolPolylinie extends SymbolElementBasis, SymbolFarbig, SymbolFuellbar {
  art: 'polylinie'
  punkte: Point[]
  geschlossen: boolean
  gefuellt: boolean
  strich: SymbolStrich
}

export interface SymbolRechteck extends SymbolElementBasis, SymbolFarbig, SymbolFuellbar {
  art: 'rechteck'
  ecke: Point
  breite: number
  hoehe: number
  gefuellt: boolean
  strich: SymbolStrich
}

export interface SymbolKreis extends SymbolElementBasis, SymbolFarbig, SymbolFuellbar {
  art: 'kreis'
  mitte: Point
  radius: number
  gefuellt: boolean
  strich: SymbolStrich
}

export interface SymbolBogen extends SymbolElementBasis, SymbolFarbig {
  art: 'bogen'
  mitte: Point
  radius: number
  startWinkel: number
  endWinkel: number
  strich: SymbolStrich
}

export interface SymbolText extends SymbolElementBasis, SymbolFarbig {
  art: 'text'
  position: Point
  text: string
  groesse: SymbolTextGroesse
}

export interface SymbolFreihand extends SymbolElementBasis, SymbolFarbig {
  art: 'freihand'
  punkte: Point[]
  strich: SymbolStrich
}

export interface SymbolBild extends SymbolElementBasis {
  art: 'bild'
  datenUrl: string
  ecke: Point
  breite: number
  hoehe: number
}

export type SymbolElement =
  | SymbolLinie
  | SymbolPolylinie
  | SymbolRechteck
  | SymbolKreis
  | SymbolBogen
  | SymbolText
  | SymbolFreihand
  | SymbolBild

export interface SymbolZeichnung {
  version: 1
  breite: number
  hoehe: number
  elemente: SymbolElement[]
}

const punktSchema = z.object({ x: z.number(), y: z.number() })
const punkteSchema = z.array(punktSchema).max(50_000)
const strichSchema = z.enum(['duenn', 'mittel', 'dick'])
const farbig = { farbe: symbolFarbeSchema.optional() }
const fuellbar = { fuellFarbe: symbolFarbeSchema.optional() }
const basis = {
  id: z.string().min(1).max(100),
  radierungen: z
    .array(z.object({ punkte: punkteSchema.min(1), breite: z.number().positive() }))
    .max(5_000),
}

export const symbolZeichnungSchema = z.object({
  version: z.literal(1),
  breite: z.number().positive().max(10_000),
  hoehe: z.number().positive().max(10_000),
  elemente: z
    .array(
      z.discriminatedUnion('art', [
        z.object({
          ...basis,
          ...farbig,
          art: z.literal('linie'),
          a: punktSchema,
          b: punktSchema,
          strich: strichSchema,
        }),
        z.object({
          ...basis,
          ...farbig,
          ...fuellbar,
          art: z.literal('polylinie'),
          punkte: punkteSchema.min(1),
          geschlossen: z.boolean(),
          gefuellt: z.boolean(),
          strich: strichSchema,
        }),
        z.object({
          ...basis,
          ...farbig,
          ...fuellbar,
          art: z.literal('rechteck'),
          ecke: punktSchema,
          breite: z.number().nonnegative(),
          hoehe: z.number().nonnegative(),
          gefuellt: z.boolean(),
          strich: strichSchema,
        }),
        z.object({
          ...basis,
          ...farbig,
          ...fuellbar,
          art: z.literal('kreis'),
          mitte: punktSchema,
          radius: z.number().nonnegative(),
          gefuellt: z.boolean(),
          strich: strichSchema,
        }),
        z.object({
          ...basis,
          ...farbig,
          art: z.literal('bogen'),
          mitte: punktSchema,
          radius: z.number().nonnegative(),
          startWinkel: z.number(),
          endWinkel: z.number(),
          strich: strichSchema,
        }),
        z.object({
          ...basis,
          ...farbig,
          art: z.literal('text'),
          position: punktSchema,
          text: z.string().max(2_000),
          groesse: z.enum(['klein', 'mittel', 'gross']),
        }),
        z.object({
          ...basis,
          ...farbig,
          art: z.literal('freihand'),
          punkte: punkteSchema.min(1),
          strich: strichSchema,
        }),
        z.object({
          ...basis,
          art: z.literal('bild'),
          datenUrl: z
            .string()
            .max(20_000_000)
            .refine((url) => url.startsWith('data:image/'), {
              error: () => t('modell.symbolZeichnung.nurDatenbild'),
            }),
          ecke: punktSchema,
          breite: z.number().positive(),
          hoehe: z.number().positive(),
        }),
      ]),
    )
    .max(10_000),
})

export function leereSymbolZeichnung(breitenFaktor = 1, hoehenFaktor = 1): SymbolZeichnung {
  return {
    version: 1,
    breite: symbolZeichnungBreite(breitenFaktor),
    hoehe: symbolZeichnungBreite(hoehenFaktor),
    elemente: [],
  }
}

export function symbolZeichnungBreite(breitenFaktor: number | undefined): number {
  const faktor =
    breitenFaktor && Number.isFinite(breitenFaktor) && breitenFaktor > 0 ? breitenFaktor : 1
  return SYMBOL_ZEICHNUNG_HOEHE * faktor
}

export function istSymbolZeichnungLeer(zeichnung: SymbolZeichnung): boolean {
  return zeichnung.elemente.length === 0
}

const VOLLKREIS = Math.PI * 2

export function bogenSpanne(startWinkel: number, endWinkel: number): number {
  const spanne = (((endWinkel - startWinkel) % VOLLKREIS) + VOLLKREIS) % VOLLKREIS
  return spanne < 1e-9 ? VOLLKREIS : spanne
}

export function symbolStrichBreite(element: SymbolElement): number {
  return 'strich' in element ? SYMBOL_STRICH_BREITE[element.strich] : 0
}

function textZeilen(element: SymbolText): string[] {
  return element.text.split('\n')
}

function textRahmen(element: SymbolText): BoundingBox {
  const groesse = SYMBOL_TEXT_GROESSE[element.groesse]
  const zeilen = textZeilen(element)
  const breite = Math.max(1, ...zeilen.map((z) => z.length)) * groesse * 0.55
  const hoehe = zeilen.length * groesse * SYMBOL_TEXT_ZEILENHOEHE
  return {
    min: { x: element.position.x - breite / 2, y: element.position.y - hoehe / 2 },
    max: { x: element.position.x + breite / 2, y: element.position.y + hoehe / 2 },
  }
}

export function symbolElementRahmen(element: SymbolElement): BoundingBox {
  const halbStrich = symbolStrichBreite(element) / 2
  switch (element.art) {
    case 'linie':
      return expandBoundingBox(boundingBoxFromPoints([element.a, element.b]), halbStrich)
    case 'polylinie':
    case 'freihand':
      return expandBoundingBox(boundingBoxFromPoints(element.punkte), halbStrich)
    case 'rechteck':
    case 'bild':
      return expandBoundingBox(
        {
          min: element.ecke,
          max: { x: element.ecke.x + element.breite, y: element.ecke.y + element.hoehe },
        },
        halbStrich,
      )
    case 'kreis':
    case 'bogen':
      return expandBoundingBox(
        {
          min: { x: element.mitte.x - element.radius, y: element.mitte.y - element.radius },
          max: { x: element.mitte.x + element.radius, y: element.mitte.y + element.radius },
        },
        halbStrich,
      )
    case 'text':
      return textRahmen(element)
  }
}

function rechteckEcken(element: SymbolRechteck): Point[] {
  const { ecke, breite, hoehe } = element
  return [
    ecke,
    { x: ecke.x + breite, y: ecke.y },
    { x: ecke.x + breite, y: ecke.y + hoehe },
    { x: ecke.x, y: ecke.y + hoehe },
  ]
}

function abstandZuBogen(element: SymbolBogen, p: Point): number {
  const winkel = Math.atan2(p.y - element.mitte.y, p.x - element.mitte.x)
  const relativ = (((winkel - element.startWinkel) % VOLLKREIS) + VOLLKREIS) % VOLLKREIS
  if (relativ <= bogenSpanne(element.startWinkel, element.endWinkel)) {
    return Math.abs(distance(p, element.mitte) - element.radius)
  }
  const punktBei = (w: number) => ({
    x: element.mitte.x + element.radius * Math.cos(w),
    y: element.mitte.y + element.radius * Math.sin(w),
  })
  return Math.min(
    distance(p, punktBei(element.startWinkel)),
    distance(p, punktBei(element.endWinkel)),
  )
}

export function abstandZuSymbolElement(element: SymbolElement, p: Point): number {
  const halbStrich = symbolStrichBreite(element) / 2
  const kante = (d: number) => Math.max(0, d - halbStrich)
  switch (element.art) {
    case 'linie':
      return kante(distanceToSegment(p, element.a, element.b))
    case 'freihand':
      return kante(
        element.punkte.length === 1
          ? distance(p, element.punkte[0])
          : distanceToPolyline(p, element.punkte, false),
      )
    case 'polylinie':
      if (element.geschlossen && element.gefuellt && pointInPolygon(p, element.punkte)) return 0
      return kante(
        element.punkte.length === 1
          ? distance(p, element.punkte[0])
          : distanceToPolyline(p, element.punkte, element.geschlossen),
      )
    case 'rechteck': {
      const ecken = rechteckEcken(element)
      if (element.gefuellt && pointInPolygon(p, ecken)) return 0
      return kante(distanceToPolyline(p, ecken, true))
    }
    case 'kreis': {
      const d = distance(p, element.mitte)
      if (element.gefuellt && d <= element.radius) return 0
      return kante(Math.abs(d - element.radius))
    }
    case 'bogen':
      return kante(abstandZuBogen(element, p))
    case 'text':
    case 'bild': {
      const rahmen = symbolElementRahmen(element)
      const dx = Math.max(rahmen.min.x - p.x, 0, p.x - rahmen.max.x)
      const dy = Math.max(rahmen.min.y - p.y, 0, p.y - rahmen.max.y)
      return Math.hypot(dx, dy)
    }
  }
}

export function pinselTrifftSymbolElement(
  element: SymbolElement,
  p: Point,
  breite: number,
): boolean {
  if (!pointInBoundingBox(p, symbolElementRahmen(element), breite / 2)) return false
  return abstandZuSymbolElement(element, p) <= breite / 2
}

export function pinselAbdruecke(von: Point, bis: Point, breite: number): Point[] {
  const laenge = distance(von, bis)
  const schritte = Math.max(1, Math.ceil(laenge / Math.max(0.25, breite / 4)))
  const punkte: Point[] = []
  for (let i = 1; i <= schritte; i++) {
    const t = i / schritte
    punkte.push({ x: von.x + (bis.x - von.x) * t, y: von.y + (bis.y - von.y) * t })
  }
  return punkte
}

export function vonRadierungGetroffen(
  elemente: SymbolElement[],
  radierung: SymbolRadierung,
): Set<string> {
  const getroffen = new Set<string>()
  const [erster, ...rest] = radierung.punkte
  if (!erster) return getroffen
  const abdruecke = [erster]
  let vorher = erster
  for (const p of rest) {
    abdruecke.push(...pinselAbdruecke(vorher, p, radierung.breite))
    vorher = p
  }
  for (const element of elemente) {
    if (abdruecke.some((p) => pinselTrifftSymbolElement(element, p, radierung.breite))) {
      getroffen.add(element.id)
    }
  }
  return getroffen
}

function verschiebePunkt(p: Point, dx: number, dy: number): Point {
  return { x: p.x + dx, y: p.y + dy }
}

export function verschiebeSymbolElement(
  element: SymbolElement,
  dx: number,
  dy: number,
): SymbolElement {
  const v = (p: Point) => verschiebePunkt(p, dx, dy)
  const radierungen = element.radierungen.map((r) => ({ ...r, punkte: r.punkte.map(v) }))
  switch (element.art) {
    case 'linie':
      return { ...element, a: v(element.a), b: v(element.b), radierungen }
    case 'polylinie':
    case 'freihand':
      return { ...element, punkte: element.punkte.map(v), radierungen }
    case 'rechteck':
    case 'bild':
      return { ...element, ecke: v(element.ecke), radierungen }
    case 'kreis':
    case 'bogen':
      return { ...element, mitte: v(element.mitte), radierungen }
    case 'text':
      return { ...element, position: v(element.position), radierungen }
  }
}

export function skaliereSymbolBild(element: SymbolBild, faktor: number): SymbolBild {
  const mitte = { x: element.ecke.x + element.breite / 2, y: element.ecke.y + element.hoehe / 2 }
  const s = (p: Point) => ({
    x: mitte.x + (p.x - mitte.x) * faktor,
    y: mitte.y + (p.y - mitte.y) * faktor,
  })
  return {
    ...element,
    ecke: s(element.ecke),
    breite: element.breite * faktor,
    hoehe: element.hoehe * faktor,
    radierungen: element.radierungen.map((r) => ({
      punkte: r.punkte.map(s),
      breite: r.breite * faktor,
    })),
  }
}

export function eingepassteBildFlaeche(
  bildBreite: number,
  bildHoehe: number,
  flaecheBreite: number,
  flaecheHoehe: number,
): { ecke: Point; breite: number; hoehe: number } {
  const b = bildBreite > 0 ? bildBreite : 1
  const h = bildHoehe > 0 ? bildHoehe : 1
  const faktor = Math.min(flaecheBreite / b, flaecheHoehe / h)
  const breite = b * faktor
  const hoehe = h * faktor
  return { ecke: { x: (flaecheBreite - breite) / 2, y: (flaecheHoehe - hoehe) / 2 }, breite, hoehe }
}

export function symbolBildProzent(element: SymbolBild, zeichnung: SymbolZeichnung): number {
  const eingepasst = eingepassteBildFlaeche(
    element.breite,
    element.hoehe,
    zeichnung.breite,
    zeichnung.hoehe,
  )
  return (element.breite / eingepasst.breite) * 100
}

export function vereinfachePunkte(punkte: Point[], toleranz: number): Point[] {
  if (punkte.length <= 2) return punkte.slice()
  const behalten = new Array<boolean>(punkte.length).fill(false)
  behalten[0] = true
  behalten[punkte.length - 1] = true
  const stapel: [number, number][] = [[0, punkte.length - 1]]
  while (stapel.length > 0) {
    const [von, bis] = stapel.pop()!
    let groesster = 0
    let index = -1
    for (let i = von + 1; i < bis; i++) {
      const d = distanceToSegment(punkte[i], punkte[von], punkte[bis])
      if (d > groesster) {
        groesster = d
        index = i
      }
    }
    if (index !== -1 && groesster > toleranz) {
      behalten[index] = true
      stapel.push([von, index], [index, bis])
    }
  }
  return punkte.filter((_, i) => behalten[i])
}

export function symbolZeichnungIstFarbig(zeichnung: SymbolZeichnung): boolean {
  return zeichnung.elemente.some(
    (element) =>
      ('farbe' in element && istBunteSymbolFarbe(element.farbe)) ||
      ('fuellFarbe' in element &&
        'gefuellt' in element &&
        element.gefuellt &&
        istBunteSymbolFarbe(element.fuellFarbe)),
  )
}
