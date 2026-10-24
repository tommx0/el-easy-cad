import type { Point } from '../document-model'
import { distance, punktAufPfad } from '../document-model'
import { naechsterPunktAufPfad, pfadGesamtLaenge } from '../document-model'
import type { Planbogen, Planlinien, Plansegment } from './plansegment'
import { richtungsDifferenz, segmentLaenge, segmentRichtung } from './plansegment'
import type { WandVorschlag } from './wand-ketten'

export interface OeffnungsVorschlag {
  art: 'tuer' | 'fenster'
  wandIndex: number
  t: number
  breite: number
  gespiegelt: boolean
  schwenkInnen: boolean
}

export interface OeffnungsUmfeld {
  segmenteNahe(von: Point, bis: Point): readonly Plansegment[]
  boegenNahe(von: Point, bis: Point): readonly Planbogen[]
}

export function umfeldAusListe(linien: {
  segmente: readonly Plansegment[]
  boegen: readonly Planbogen[]
}): OeffnungsUmfeld {
  return {
    segmenteNahe: () => linien.segmente,
    boegenNahe: () => linien.boegen,
  }
}

export interface OeffnungsOptionen {
  breiteMin: number
  breiteMax: number
  winkelToleranz: number
}

export const STANDARD_OEFFNUNGS_OPTIONEN: OeffnungsOptionen = {
  breiteMin: 0.5,
  breiteMax: 3,
  winkelToleranz: (6 * Math.PI) / 180,
}

export function erkenneOeffnungen(
  zuege: readonly WandVorschlag[],
  linien: Planlinien,
  optionen: OeffnungsOptionen = STANDARD_OEFFNUNGS_OPTIONEN,
  umfeld: OeffnungsUmfeld = umfeldAusListe(linien),
): OeffnungsVorschlag[] {
  const ergebnis: OeffnungsVorschlag[] = []

  for (let wandIndex = 0; wandIndex < zuege.length; wandIndex++) {
    const zug = zuege[wandIndex]
    const gesamt = pfadGesamtLaenge(zug.punkte)
    if (gesamt === 0) continue

    for (const luecke of zug.luecken) {
      if (luecke.breite < optionen.breiteMin || luecke.breite > optionen.breiteMax) continue
      const lage = naechsterPunktAufPfad(zug.punkte, luecke.mitte)
      if (!lage) continue

      const rahmen = lueckenrahmen(
        lage.punkt,
        achsRichtungBei(zug.punkte, lage.t),
        luecke.breite,
        zug.staerke,
      )
      const merkmal = findeOeffnungsMerkmal(rahmen, umfeld, optionen)
      if (merkmal) {
        ergebnis.push({
          art: merkmal.art,
          wandIndex,
          t: lage.t,
          breite: luecke.breite,
          gespiegelt: merkmal.gespiegelt,
          schwenkInnen: merkmal.schwenkInnen,
        })
      }
    }
  }

  return ergebnis
}

export function findeOeffnungsMerkmal(
  rahmen: Lueckenrahmen,
  umfeld: OeffnungsUmfeld,
  optionen: OeffnungsOptionen = STANDARD_OEFFNUNGS_OPTIONEN,
): (Tuermerkmal & { art: 'tuer' | 'fenster' }) | null {
  const { anfang, ende } = raender(rahmen)
  const tuer =
    findeBogenMerkmal(rahmen, umfeld.boegenNahe(anfang, ende)) ??
    findeBlattMerkmal(rahmen, umfeld.segmenteNahe(anfang, ende), optionen)
  if (tuer) return { ...tuer, art: 'tuer' }
  if (hatFenstermerkmal(rahmen, umfeld.segmenteNahe(anfang, ende), optionen)) {
    return { art: 'fenster', gespiegelt: false, schwenkInnen: false }
  }
  return null
}

export function lueckenrahmen(
  mitte: Point,
  richtung: number,
  breite: number,
  staerke: number,
): Lueckenrahmen {
  return {
    mitte,
    breite,
    staerke,
    richtung,
    laengs: { x: Math.cos(richtung), y: Math.sin(richtung) },
    quer: { x: -Math.sin(richtung), y: Math.cos(richtung) },
  }
}

export interface Lueckenrahmen {
  mitte: Point
  breite: number
  staerke: number
  richtung: number
  laengs: Point
  quer: Point
}

function achsRichtungBei(punkte: readonly Point[], t: number): number {
  const pfad = [...punkte]
  const gesamt = pfadGesamtLaenge(pfad)
  const epsilon = Math.min(0.001, 0.01 / Math.max(gesamt, 1e-9))
  const a = punktAufPfad(pfad, Math.max(0, t - epsilon))
  const b = punktAufPfad(pfad, Math.min(1, t + epsilon))
  return distance(a, b) > 0 ? Math.atan2(b.y - a.y, b.x - a.x) : 0
}

function raender(rahmen: Lueckenrahmen): { anfang: Point; ende: Point } {
  const halb = rahmen.breite / 2
  return {
    anfang: {
      x: rahmen.mitte.x - rahmen.laengs.x * halb,
      y: rahmen.mitte.y - rahmen.laengs.y * halb,
    },
    ende: {
      x: rahmen.mitte.x + rahmen.laengs.x * halb,
      y: rahmen.mitte.y + rahmen.laengs.y * halb,
    },
  }
}

interface Tuermerkmal {
  gespiegelt: boolean
  schwenkInnen: boolean
}

function findeBogenMerkmal(
  rahmen: Lueckenrahmen,
  boegen: readonly Planbogen[],
): Tuermerkmal | null {
  const { anfang, ende } = raender(rahmen)
  const radiusToleranz = rahmen.breite * 0.35
  const randToleranz = Math.max(rahmen.breite * 0.3, rahmen.staerke)

  for (const bogen of boegen) {
    if (Math.abs(bogen.radius - rahmen.breite) > radiusToleranz) continue
    const amAnfang = distance(bogen.mittelpunkt, anfang) <= randToleranz
    const amEnde = distance(bogen.mittelpunkt, ende) <= randToleranz
    if (!amAnfang && !amEnde) continue

    const winkel = (bogen.startWinkel + bogen.endWinkel) / 2
    const punkt = {
      x: bogen.mittelpunkt.x + Math.cos(winkel) * bogen.radius,
      y: bogen.mittelpunkt.y + Math.sin(winkel) * bogen.radius,
    }
    return {
      gespiegelt: amEnde,
      schwenkInnen: querabstand(rahmen, punkt) < 0,
    }
  }
  return null
}

function findeBlattMerkmal(
  rahmen: Lueckenrahmen,
  segmente: readonly Plansegment[],
  optionen: OeffnungsOptionen,
): Tuermerkmal | null {
  const { anfang, ende } = raender(rahmen)
  const randToleranz = Math.max(rahmen.breite * 0.25, rahmen.staerke)
  const laengeMin = rahmen.breite * 0.6
  const laengeMax = rahmen.breite * 1.4

  for (const segment of segmente) {
    const laenge = segmentLaenge(segment)
    if (laenge < laengeMin || laenge > laengeMax) continue
    const querheit = richtungsDifferenz(segmentRichtung(segment), rahmen.richtung)
    if (querheit < Math.PI / 2 - optionen.winkelToleranz * 3) continue

    for (const [punkt, gegenueber] of [
      [segment.a, segment.b],
      [segment.b, segment.a],
    ] as const) {
      const amAnfang = distance(punkt, anfang) <= randToleranz
      const amEnde = distance(punkt, ende) <= randToleranz
      if (!amAnfang && !amEnde) continue
      return {
        gespiegelt: amEnde,
        schwenkInnen: querabstand(rahmen, gegenueber) < 0,
      }
    }
  }
  return null
}

function hatFenstermerkmal(
  rahmen: Lueckenrahmen,
  segmente: readonly Plansegment[],
  optionen: OeffnungsOptionen,
): boolean {
  const innenGrenze = rahmen.staerke / 2 - Math.min(rahmen.staerke * 0.2, 0.03)
  const { anfang, ende } = raender(rahmen)
  const tAnfang = laengsabstand(rahmen, anfang)
  const tEnde = laengsabstand(rahmen, ende)

  for (const segment of segmente) {
    if (richtungsDifferenz(segmentRichtung(segment), rahmen.richtung) > optionen.winkelToleranz) {
      continue
    }
    const quer = (querabstand(rahmen, segment.a) + querabstand(rahmen, segment.b)) / 2
    if (Math.abs(quer) > innenGrenze) continue

    const von = Math.min(laengsabstand(rahmen, segment.a), laengsabstand(rahmen, segment.b))
    const bis = Math.max(laengsabstand(rahmen, segment.a), laengsabstand(rahmen, segment.b))
    const gemeinsam = Math.min(bis, tEnde) - Math.max(von, tAnfang)
    if (gemeinsam > rahmen.breite * 0.6) return true
  }
  return false
}

function querabstand(rahmen: Lueckenrahmen, p: Point): number {
  return (p.x - rahmen.mitte.x) * rahmen.quer.x + (p.y - rahmen.mitte.y) * rahmen.quer.y
}

function laengsabstand(rahmen: Lueckenrahmen, p: Point): number {
  return (p.x - rahmen.mitte.x) * rahmen.laengs.x + (p.y - rahmen.mitte.y) * rahmen.laengs.y
}
