import type { BoundingBox, Point } from './geometry'
import type { Ausrichtung, Papierformat } from './papierformat'
import { papierGroesseMm } from './papierformat'
import { rohZuWelt, ursprungFuerMitte } from './hintergrund-lage'

export interface Zeichenflaeche {
  papierformat: Papierformat
  ausrichtung: Ausrichtung
  massstabNenner: number
  ursprung: Point
}

export const ZEICHENFLAECHE_RAND_MM = 10
export const ZEICHENFLAECHE_HINWEIS_HOEHE_MM = 16

export const MASSSTAB_LISTE = [20, 50, 100, 200, 500] as const

export function zeichenflaecheInhaltGroesseMm(
  z: Pick<Zeichenflaeche, 'papierformat' | 'ausrichtung'>,
): {
  breite: number
  hoehe: number
} {
  const { breiteMm, hoeheMm } = papierGroesseMm(z.papierformat, z.ausrichtung)
  return {
    breite: breiteMm - 2 * ZEICHENFLAECHE_RAND_MM,
    hoehe: hoeheMm - 2 * ZEICHENFLAECHE_RAND_MM - ZEICHENFLAECHE_HINWEIS_HOEHE_MM,
  }
}

export function zeichenflaecheGroesseWelt(z: Zeichenflaeche): { breite: number; hoehe: number } {
  const mm = zeichenflaecheInhaltGroesseMm(z)
  return {
    breite: (mm.breite * z.massstabNenner) / 1000,
    hoehe: (mm.hoehe * z.massstabNenner) / 1000,
  }
}

function sichereRohGroesse(rohGroesse: { breiteRoh: number; hoeheRoh: number }): {
  breiteRoh: number
  hoeheRoh: number
} {
  return {
    breiteRoh: rohGroesse.breiteRoh > 0 ? rohGroesse.breiteRoh : 1,
    hoeheRoh: rohGroesse.hoeheRoh > 0 ? rohGroesse.hoeheRoh : 1,
  }
}

function gedrehteRohGroesse(
  rohGroesse: { breiteRoh: number; hoeheRoh: number },
  drehung: number,
): { breiteRoh: number; hoeheRoh: number } {
  const sicher = sichereRohGroesse(rohGroesse)
  if (drehung === 0) return sicher
  const cos = Math.abs(Math.cos(drehung))
  const sin = Math.abs(Math.sin(drehung))
  return {
    breiteRoh: sicher.breiteRoh * cos + sicher.hoeheRoh * sin,
    hoeheRoh: sicher.breiteRoh * sin + sicher.hoeheRoh * cos,
  }
}

function zentriereHintergrund(
  rohGroesse: { breiteRoh: number; hoeheRoh: number },
  z: Zeichenflaeche,
  massstab: number,
  drehung = 0,
): Point {
  const flaeche = zeichenflaecheGroesseWelt(z)
  if (drehung !== 0)
    return ursprungFuerMitte(
      { massstab, hintergrundDrehung: drehung },
      sichereRohGroesse(rohGroesse),
      { x: z.ursprung.x + flaeche.breite / 2, y: z.ursprung.y + flaeche.hoehe / 2 },
    )
  const { breiteRoh, hoeheRoh } = sichereRohGroesse(rohGroesse)
  return {
    x: z.ursprung.x + (flaeche.breite - breiteRoh * massstab) / 2,
    y: z.ursprung.y + (flaeche.hoehe - hoeheRoh * massstab) / 2,
  }
}

export function berechneHintergrundEinpassung(
  rohGroesse: { breiteRoh: number; hoeheRoh: number },
  z: Zeichenflaeche,
  drehung = 0,
): { massstab: number; ursprung: Point } {
  const flaeche = zeichenflaecheGroesseWelt(z)
  const { breiteRoh, hoeheRoh } = gedrehteRohGroesse(rohGroesse, drehung)
  const massstab = Math.min(flaeche.breite / breiteRoh, flaeche.hoehe / hoeheRoh)
  return { massstab, ursprung: zentriereHintergrund(rohGroesse, z, massstab, drehung) }
}

function erforderlicherNenner(
  rohGroesse: { breiteRoh: number; hoeheRoh: number },
  z: Zeichenflaeche,
  massstab: number,
  drehung = 0,
): number {
  const mm = zeichenflaecheInhaltGroesseMm(z)
  const { breiteRoh, hoeheRoh } = gedrehteRohGroesse(rohGroesse, drehung)
  return Math.max(
    (breiteRoh * massstab * 1000) / mm.breite,
    (hoeheRoh * massstab * 1000) / mm.hoehe,
  )
}

const NENNER_LISTEN_TOLERANZ = 1.5

function waehleNenner(ziel: number): number {
  const sicher = Math.max(1, ziel)
  const ausListe = MASSSTAB_LISTE.find((n) => n >= sicher)
  if (ausListe !== undefined && ausListe <= sicher * NENNER_LISTEN_TOLERANZ) return ausListe
  const stufe = sicher < 100 ? 5 : sicher < 500 ? 10 : 50
  return Math.ceil(sicher / stufe) * stufe
}

export function berechneKalibrierAnpassung(
  rohGroesse: { breiteRoh: number; hoeheRoh: number },
  z: Zeichenflaeche,
  massstabAlt: number,
  massstabNeu: number,
  drehung = 0,
  norm?: NormVorgabe,
): { zeichenflaeche: Zeichenflaeche; ursprung: Point } {
  const mitNorm = norm ? kalibrierAnpassungMitNorm(rohGroesse, z, massstabNeu, drehung, norm) : null
  if (mitNorm) return mitNorm
  const faktor = massstabAlt > 0 && massstabNeu > 0 ? massstabNeu / massstabAlt : 1
  const ziel = Math.max(
    z.massstabNenner * faktor,
    erforderlicherNenner(rohGroesse, z, massstabNeu, drehung),
  )
  const zeichenflaeche: Zeichenflaeche = { ...z, massstabNenner: waehleNenner(ziel) }
  return {
    zeichenflaeche,
    ursprung: zentriereHintergrund(rohGroesse, zeichenflaeche, massstabNeu, drehung),
  }
}

export interface NormVorgabe {
  nenner: number
  inhaltRoh: BoundingBox | null
}

function kalibrierAnpassungMitNorm(
  rohGroesse: { breiteRoh: number; hoeheRoh: number },
  z: Zeichenflaeche,
  massstab: number,
  drehung: number,
  norm: NormVorgabe,
): { zeichenflaeche: Zeichenflaeche; ursprung: Point } | null {
  const zeichenflaeche: Zeichenflaeche = { ...z, massstabNenner: norm.nenner }
  const flaeche = zeichenflaecheGroesseWelt(zeichenflaeche)
  const eps = 1e-6
  const mitte = { x: z.ursprung.x + flaeche.breite / 2, y: z.ursprung.y + flaeche.hoehe / 2 }
  const lage = { massstab, hintergrundDrehung: drehung }

  if (norm.inhaltRoh) {
    const inhalt = norm.inhaltRoh
    const groesse = gedrehteRohGroesse(
      { breiteRoh: inhalt.max.x - inhalt.min.x, hoeheRoh: inhalt.max.y - inhalt.min.y },
      drehung,
    )
    if (
      groesse.breiteRoh * massstab > flaeche.breite + eps ||
      groesse.hoeheRoh * massstab > flaeche.hoehe + eps
    )
      return null
    const inhaltMitte = {
      x: (inhalt.min.x + inhalt.max.x) / 2,
      y: (inhalt.min.y + inhalt.max.y) / 2,
    }
    const ohneVersatz = rohZuWelt({ ...lage, ursprung: { x: 0, y: 0 } }, inhaltMitte)
    return { zeichenflaeche, ursprung: { x: mitte.x - ohneVersatz.x, y: mitte.y - ohneVersatz.y } }
  }

  const { breiteMm, hoeheMm } = papierGroesseMm(z.papierformat, z.ausrichtung)
  const seite = gedrehteRohGroesse(rohGroesse, drehung)
  if (
    seite.breiteRoh * massstab > (breiteMm * norm.nenner) / 1000 + eps ||
    seite.hoeheRoh * massstab > (hoeheMm * norm.nenner) / 1000 + eps
  )
    return null
  return {
    zeichenflaeche,
    ursprung: zentriereHintergrund(rohGroesse, zeichenflaeche, massstab, drehung),
  }
}

export function berechneZeichenflaecheFuerPlan(
  huelle: BoundingBox,
  vorlage: Pick<Zeichenflaeche, 'papierformat'> | null,
): Zeichenflaeche {
  const breite = Math.max(huelle.max.x - huelle.min.x, 0.01)
  const hoehe = Math.max(huelle.max.y - huelle.min.y, 0.01)
  const entwurf = {
    papierformat: vorlage?.papierformat ?? 'A3',
    ausrichtung: breite >= hoehe ? ('quer' as const) : ('hoch' as const),
  }
  const roh = { breiteRoh: breite, hoeheRoh: hoehe }
  const massstabNenner = waehleNenner(
    erforderlicherNenner(roh, { ...entwurf, massstabNenner: 1, ursprung: huelle.min }, 1),
  )
  const flaeche = zeichenflaecheGroesseWelt({ ...entwurf, massstabNenner, ursprung: huelle.min })
  return {
    ...entwurf,
    massstabNenner,
    ursprung: {
      x: (huelle.min.x + huelle.max.x) / 2 - flaeche.breite / 2,
      y: (huelle.min.y + huelle.max.y) / 2 - flaeche.hoehe / 2,
    },
  }
}

export function zeichenflaecheBoundingBox(z: Zeichenflaeche): BoundingBox {
  const { breite, hoehe } = zeichenflaecheGroesseWelt(z)
  return { min: z.ursprung, max: { x: z.ursprung.x + breite, y: z.ursprung.y + hoehe } }
}
