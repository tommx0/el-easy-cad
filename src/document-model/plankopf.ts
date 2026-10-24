import type { PlankopfObjekt, PlankopfZeile, PlankopfZelle, PlankopfQuelle } from './objekte'
import type { Zeichnung } from './zeichnung'
import { papierGroesseMm } from './papierformat'
import { planspracheVon, planUebersetzer } from './plansprache'
import { erzeugeUebersetzer, formatiereDatum, QUELLSPRACHE } from '../sprache'

export const PLANKOPF_STANDARD_BREITE_MM = 180

export const PLANKOPF_ERSATZ_MASSSTAB = 100

const BESCHRIFTUNG_ANTEIL = 0.42

const INNENRAND_ANTEIL = 0.12

export function plankopfMmZuWelt(mm: number, massstabNenner: number): number {
  return (mm * massstabNenner) / 1000
}

export function plankopfMassstabNenner(zeichnung: Zeichnung, blattId: string): number {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  return blatt?.zeichenflaeche?.massstabNenner ?? PLANKOPF_ERSATZ_MASSSTAB
}

export function plankopfNutztErsatzMassstab(zeichnung: Zeichnung, blattId: string): boolean {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  return !blatt?.zeichenflaeche
}

function zelle(
  beschriftung: string,
  spanne: number,
  ueberschreibung: Partial<PlankopfZelle> = {},
): PlankopfZelle {
  return { beschriftung, wert: '', quelle: null, spanne, logo: null, ...ueberschreibung }
}

export function erzeugeDinPlankopfZeilen(
  heute = new Date(),
  plansprache: string = QUELLSPRACHE,
): PlankopfZeile[] {
  const tp = erzeugeUebersetzer(plansprache)
  return [
    { hoeheMm: 10, zellen: [zelle(tp('druck.plankopf.felder.rechtlicherEigentuemer'), 4)] },
    { hoeheMm: 12, zellen: [zelle(tp('druck.plankopf.felder.benennung'), 4)] },
    {
      hoeheMm: 10,
      zellen: [
        zelle(tp('druck.plankopf.felder.ergaenzung'), 2),
        zelle(tp('druck.plankopf.felder.dokumentart'), 2),
      ],
    },
    {
      hoeheMm: 10,
      zellen: [
        zelle(tp('druck.plankopf.felder.erstelltVon'), 1),
        zelle(tp('druck.plankopf.felder.geprueftVon'), 1),
        zelle(tp('druck.plankopf.felder.datum'), 1, { wert: datumLesbar(heute, plansprache) }),
        zelle(tp('druck.plankopf.felder.massstab'), 1, { quelle: 'massstab' }),
      ],
    },
    {
      hoeheMm: 10,
      zellen: [
        zelle(tp('druck.plankopf.felder.zeichnungsnummer'), 2),
        zelle(tp('druck.plankopf.felder.blatt'), 1, { quelle: 'blattName' }),
        zelle(tp('druck.plankopf.felder.aenderung'), 1),
      ],
    },
  ]
}

export function datumLesbar(datum: Date, plansprache: string = QUELLSPRACHE): string {
  return formatiereDatum(datum, plansprache)
}

export function plankopfHoeheMm(objekt: PlankopfObjekt): number {
  return objekt.zeilen.reduce((summe, zeile) => summe + zeile.hoeheMm, 0)
}

export interface PlankopfZellenLayout {
  x: number
  y: number
  breite: number
  hoehe: number
  beschriftung: string
  text: string
  logo: { assetId: string; dateiname: string } | null
}

export interface PlankopfModell {
  zellen: PlankopfZellenLayout[]
  trennlinienY: number[]
  gesamtBreite: number
  gesamtHoehe: number
  beschriftungHoehe: number
  innenRand: number
}

export interface PlankopfKontext {
  zeichnung: Zeichnung
  blattId: string
}

export function loesePlankopfZelle(zelle: PlankopfZelle, kontext: PlankopfKontext): string {
  if (!zelle.quelle) return zelle.wert
  return loeseQuelle(zelle.quelle, kontext)
}

function loeseQuelle(quelle: PlankopfQuelle, kontext: PlankopfKontext): string {
  const { zeichnung, blattId } = kontext
  const index = zeichnung.blaetter.findIndex((b) => b.id === blattId)
  const blatt = index >= 0 ? zeichnung.blaetter[index] : undefined
  switch (quelle) {
    case 'zeichnungName':
      return zeichnung.name
    case 'blattName':
      return blatt?.name ?? ''
    case 'blattNummerVonAnzahl':
      return index >= 0
        ? planUebersetzer(zeichnung)('druck.plankopf.blattVonAnzahl', {
            nummer: String(index + 1),
            anzahl: String(zeichnung.blaetter.length),
          })
        : ''
    case 'massstab':
      return blatt?.zeichenflaeche ? `1:${blatt.zeichenflaeche.massstabNenner}` : ''
    case 'blattformat': {
      const flaeche = blatt?.zeichenflaeche
      if (!flaeche) return ''
      const { breiteMm, hoeheMm } = papierGroesseMm(flaeche.papierformat, flaeche.ausrichtung)
      return `${flaeche.papierformat} ${breiteMm}×${hoeheMm} mm`
    }
    case 'datumHeute':
      return datumLesbar(new Date(), planspracheVon(zeichnung))
  }
}

export function bauePlankopfModell(
  objekt: PlankopfObjekt,
  kontext: PlankopfKontext,
): PlankopfModell {
  const nenner = plankopfMassstabNenner(kontext.zeichnung, kontext.blattId)
  const zuWelt = (mm: number) => plankopfMmZuWelt(mm, nenner)

  const gesamtBreite = zuWelt(objekt.breiteMm)
  const zellen: PlankopfZellenLayout[] = []
  const trennlinienY: number[] = []

  let y = 0
  objekt.zeilen.forEach((zeile, zeilenIndex) => {
    const hoehe = zuWelt(zeile.hoeheMm)
    const summeSpannen = zeile.zellen.reduce((summe, z) => summe + Math.max(0, z.spanne), 0)
    if (summeSpannen > 0) {
      let x = 0
      for (const z of zeile.zellen) {
        const breite = (Math.max(0, z.spanne) / summeSpannen) * gesamtBreite
        zellen.push({
          x,
          y,
          breite,
          hoehe,
          beschriftung: z.beschriftung,
          text: z.logo ? '' : loesePlankopfZelle(z, kontext),
          logo: z.logo,
        })
        x += breite
      }
    }
    y += hoehe
    if (zeilenIndex < objekt.zeilen.length - 1) trennlinienY.push(y)
  })

  const kleinsteZeileMm = objekt.zeilen.reduce(
    (kleinste, zeile) => Math.min(kleinste, zeile.hoeheMm),
    Number.POSITIVE_INFINITY,
  )
  const basisHoehe = zuWelt(Number.isFinite(kleinsteZeileMm) ? kleinsteZeileMm : 10)

  return {
    zellen,
    trennlinienY,
    gesamtBreite,
    gesamtHoehe: y,
    beschriftungHoehe: basisHoehe * BESCHRIFTUNG_ANTEIL * 0.6,
    innenRand: basisHoehe * INNENRAND_ANTEIL,
  }
}

export function plankopfWertHoehe(zellenHoehe: number, modell: PlankopfModell): number {
  const rest = zellenHoehe - modell.beschriftungHoehe - modell.innenRand * 2
  return Math.max(modell.beschriftungHoehe, rest * 0.62)
}
