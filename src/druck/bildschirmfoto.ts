import type { Blatt, BoundingBox, LizenzModul, Zeichnung } from '../document-model'
import { istNurAnsicht, planUebersetzer, zeichenflaecheBoundingBox } from '../document-model'
import { t } from '../sprache'
import { ViewTransform } from '../rendering'
import { erzeugeDruckCanvas, type KomponentenRahmenBasis } from './druck-canvas'
import { berechneHinweisLayout, hinweisSchrift, type WortMesser } from './hinweis-streifen'
import { DRUCK_DPI, type DruckSeite, weltBoundingBoxInhalt } from './layout'
import { planHinweisMitLizenznehmer } from './rechtliche-hinweise'

const LEERER_BEREICH: BoundingBox = { min: { x: -5, y: -5 }, max: { x: 5, y: 5 } }
const RAND_ANTEIL = 0.03
const HINWEIS_SCHRITT_PX = 8
const HINWEIS_MAX_PX = 1200

function pxZuMm(px: number): number {
  return (px / DRUCK_DPI) * 25.4
}

export function bildschirmfotoBereich(blatt: Blatt, bereich: BoundingBox | null): BoundingBox {
  if (bereich) return bereich
  const inhalt = weltBoundingBoxInhalt(blatt)
  if (!inhalt) {
    return blatt.zeichenflaeche ? zeichenflaecheBoundingBox(blatt.zeichenflaeche) : LEERER_BEREICH
  }
  const rand = Math.max(inhalt.max.x - inhalt.min.x, inhalt.max.y - inhalt.min.y) * RAND_ANTEIL
  return {
    min: { x: inhalt.min.x - rand, y: inhalt.min.y - rand },
    max: { x: inhalt.max.x + rand, y: inhalt.max.y + rand },
  }
}

export function hinweisHoeheFuer(
  breitePx: number,
  messen: WortMesser,
  hinweis: { titel: string; text: string },
): number {
  for (let hoehe = HINWEIS_SCHRITT_PX * 4; hoehe < HINWEIS_MAX_PX; hoehe += HINWEIS_SCHRITT_PX) {
    if (berechneHinweisLayout({ x: 0, y: 0, breite: breitePx, hoehe }, messen, hinweis).passt) {
      return hoehe
    }
  }
  return HINWEIS_MAX_PX
}

export function bildschirmfotoSeite(
  blatt: Blatt,
  bereich: BoundingBox,
  maxKantePx: number,
  hinweisHoehe: (breitePx: number) => number,
): DruckSeite {
  const breiteWelt = Math.max(bereich.max.x - bereich.min.x, 0.01)
  const hoeheWelt = Math.max(bereich.max.y - bereich.min.y, 0.01)
  const scale = maxKantePx / Math.max(breiteWelt, hoeheWelt)
  const breitePx = Math.max(1, Math.round(breiteWelt * scale))
  const zeichenHoehePx = Math.max(1, Math.round(hoeheWelt * scale))
  const hinweisHoehePx = hinweisHoehe(breitePx)

  const view = new ViewTransform()
  view.scale = scale
  view.offset = { x: -bereich.min.x * scale, y: zeichenHoehePx + bereich.min.y * scale }

  const seiteHoehePx = zeichenHoehePx + hinweisHoehePx
  return {
    blattId: blatt.id,
    blattName: blatt.name,
    seiteBreiteMm: pxZuMm(breitePx),
    seiteHoeheMm: pxZuMm(seiteHoehePx),
    seiteBreitePx: breitePx,
    seiteHoehePx,
    zeichenBereichPx: { x: 0, y: 0, breite: breitePx, hoehe: zeichenHoehePx },
    hinweisBereichPx: { x: 0, y: zeichenHoehePx, breite: breitePx, hoehe: hinweisHoehePx },
    view,
  }
}

export async function erzeugeBildschirmfoto(
  blatt: Blatt,
  projekt: Zeichnung,
  komponentenRahmenBasis: KomponentenRahmenBasis,
  optionen: {
    bereich: BoundingBox | null
    maxKantePx: number
    module: readonly LizenzModul[]
    wasserzeichenAktiv: boolean
    lizenznehmer: string | null
  },
): Promise<string> {
  if (istNurAnsicht(blatt, optionen.module)) {
    throw new Error(t('druck.bildschirmfoto.nurAnsicht', { name: blatt.name }))
  }
  const messCtx = document.createElement('canvas').getContext('2d')
  if (!messCtx) throw new Error('Kein 2D-Context für das Bildschirmfoto.')
  const messen: WortMesser = (text, schnitt, groessePx) => {
    messCtx.font = hinweisSchrift(schnitt, groessePx)
    return messCtx.measureText(text).width
  }
  const hinweis = planHinweisMitLizenznehmer(
    optionen.lizenznehmer,
    projekt.zeichnungsart,
    planUebersetzer(projekt),
  )
  const seite = bildschirmfotoSeite(
    blatt,
    bildschirmfotoBereich(blatt, optionen.bereich),
    optionen.maxKantePx,
    (breitePx) => hinweisHoeheFuer(breitePx, messen, hinweis),
  )
  const canvas = await erzeugeDruckCanvas(
    seite,
    blatt,
    projekt,
    komponentenRahmenBasis,
    optionen.wasserzeichenAktiv,
    optionen.lizenznehmer,
  )
  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
}
