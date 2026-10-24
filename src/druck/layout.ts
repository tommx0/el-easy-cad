import type {
  Ausrichtung,
  Blatt,
  BoundingBox,
  LizenzModul,
  Papierformat,
  Zeichenflaeche,
} from '../document-model'
import {
  ZEICHENFLAECHE_RAND_MM,
  ZEICHENFLAECHE_HINWEIS_HOEHE_MM,
  hintergrundRahmen,
  getBoundingBox,
  istBekannterHintergrund,
  istNurAnsicht,
  papierGroesseMm,
  unionBoundingBox,
  zeichenflaecheGroesseWelt,
  zeichenflaecheInhaltGroesseMm,
} from '../document-model'
import { ViewTransform } from '../rendering'

export const DRUCK_DPI = 200

export function mmZuPx(mm: number, dpi: number = DRUCK_DPI): number {
  return (mm / 25.4) * dpi
}

export interface Rechteck {
  x: number
  y: number
  breite: number
  hoehe: number
}

export interface DruckSeite {
  blattId: string
  blattName: string
  seiteBreiteMm: number
  seiteHoeheMm: number
  seiteBreitePx: number
  seiteHoehePx: number
  zeichenBereichPx: Rechteck
  hinweisBereichPx: Rechteck
  view: ViewTransform
}

export function berechneDruckSeite(
  blatt: Blatt,
  module: readonly LizenzModul[] = [],
): DruckSeite | null {
  const z = blatt.zeichenflaeche
  if (!z) return null
  if (istNurAnsicht(blatt, module)) return null

  const { breiteMm: seiteBreiteMm, hoeheMm: seiteHoeheMm } = papierGroesseMm(
    z.papierformat,
    z.ausrichtung,
  )
  const seiteBreitePx = mmZuPx(seiteBreiteMm)
  const seiteHoehePx = mmZuPx(seiteHoeheMm)
  const randPx = mmZuPx(ZEICHENFLAECHE_RAND_MM)
  const hinweisHoehePx = mmZuPx(ZEICHENFLAECHE_HINWEIS_HOEHE_MM)

  const zeichenBereichPx: Rechteck = {
    x: randPx,
    y: randPx,
    breite: seiteBreitePx - 2 * randPx,
    hoehe: seiteHoehePx - 2 * randPx - hinweisHoehePx,
  }
  const hinweisBereichPx: Rechteck = {
    x: randPx,
    y: zeichenBereichPx.y + zeichenBereichPx.hoehe,
    breite: seiteBreitePx - 2 * randPx,
    hoehe: hinweisHoehePx,
  }

  const scale = mmZuPx(1000 / Math.max(1, z.massstabNenner))

  const view = new ViewTransform()
  view.scale = scale
  view.offset = {
    x: zeichenBereichPx.x - z.ursprung.x * scale,
    y: zeichenBereichPx.y + zeichenBereichPx.hoehe + z.ursprung.y * scale,
  }

  return {
    blattId: blatt.id,
    blattName: blatt.name,
    seiteBreiteMm,
    seiteHoeheMm,
    seiteBreitePx,
    seiteHoehePx,
    zeichenBereichPx,
    hinweisBereichPx,
    view,
  }
}

export interface PapierWahl {
  papierformat: Papierformat | null
  ausrichtung: Ausrichtung | null
}

export const PAPIER_WIE_ZEICHENFLAECHE: PapierWahl = { papierformat: null, ausrichtung: null }

export function waehleAusgabePapier(
  z: Pick<Zeichenflaeche, 'papierformat' | 'ausrichtung'>,
  wahl: PapierWahl,
): { breiteMm: number; hoeheMm: number } {
  return papierGroesseMm(wahl.papierformat ?? z.papierformat, wahl.ausrichtung ?? z.ausrichtung)
}

export interface AusgabeSeite {
  breiteMm: number
  hoeheMm: number
  breitePx: number
  hoehePx: number
  gedreht: boolean
  skala: number
  transform: [number, number, number, number, number, number]
}

export function berechneAusgabeSeite(
  seite: Pick<DruckSeite, 'seiteBreiteMm' | 'seiteHoeheMm'>,
  papier: { breiteMm: number; hoeheMm: number },
): AusgabeSeite {
  const quelleQuer = seite.seiteBreiteMm > seite.seiteHoeheMm
  const papierQuer = papier.breiteMm > papier.hoeheMm
  const gedreht = quelleQuer !== papierQuer
  const breite = gedreht ? seite.seiteHoeheMm : seite.seiteBreiteMm
  const hoehe = gedreht ? seite.seiteBreiteMm : seite.seiteHoeheMm
  const skala = Math.min(papier.breiteMm / breite, papier.hoeheMm / hoehe)
  const versatzX = mmZuPx((papier.breiteMm - breite * skala) / 2)
  const versatzY = mmZuPx((papier.hoeheMm - hoehe * skala) / 2)
  const transform: AusgabeSeite['transform'] = gedreht
    ? [0, -skala, skala, 0, versatzX, versatzY + skala * mmZuPx(seite.seiteBreiteMm)]
    : [skala, 0, 0, skala, versatzX, versatzY]
  return {
    breiteMm: papier.breiteMm,
    hoeheMm: papier.hoeheMm,
    breitePx: mmZuPx(papier.breiteMm),
    hoehePx: mmZuPx(papier.hoeheMm),
    gedreht,
    skala,
    transform,
  }
}

export function weltBoundingBoxInhalt(blatt: Blatt): BoundingBox | null {
  let ergebnis: BoundingBox | null = null
  if (istBekannterHintergrund(blatt.hintergrund) && blatt.hintergrundSichtbar) {
    ergebnis = hintergrundRahmen(blatt, blatt.hintergrund)
  }
  for (const objekt of blatt.objekte) {
    if (objekt.type === 'leitung' && objekt.pfadSegmente.every((s) => s.length === 0)) continue
    const bb = getBoundingBox(objekt)
    ergebnis = ergebnis ? unionBoundingBox(ergebnis, bb) : bb
  }
  return ergebnis
}

export function schlageMassstabNennerVor(
  blatt: Blatt,
  papierformat: Papierformat,
  ausrichtung: Ausrichtung,
): number | null {
  const bb = weltBoundingBoxInhalt(blatt)
  if (!bb) return null
  const breiteM = bb.max.x - bb.min.x
  const hoeheM = bb.max.y - bb.min.y
  if (breiteM <= 0 && hoeheM <= 0) return null
  const inhaltMm = zeichenflaecheInhaltGroesseMm({ papierformat, ausrichtung })
  const nennerX = breiteM > 0 ? (breiteM * 1000) / inhaltMm.breite : 0
  const nennerY = hoeheM > 0 ? (hoeheM * 1000) / inhaltMm.hoehe : 0
  return Math.max(1, Math.ceil(Math.max(nennerX, nennerY)))
}

export function vorschlagZeichenflaecheUrsprung(
  blatt: Blatt,
  entwurf: Pick<Zeichenflaeche, 'papierformat' | 'ausrichtung' | 'massstabNenner'>,
): { x: number; y: number } {
  const bb = weltBoundingBoxInhalt(blatt)
  const groesse = zeichenflaecheGroesseWelt({ ...entwurf, ursprung: { x: 0, y: 0 } })
  if (!bb) return { x: 0, y: 0 }
  const inhaltZentrum = { x: (bb.min.x + bb.max.x) / 2, y: (bb.min.y + bb.max.y) / 2 }
  return {
    x: inhaltZentrum.x - groesse.breite / 2,
    y: inhaltZentrum.y - groesse.hoehe / 2,
  }
}
