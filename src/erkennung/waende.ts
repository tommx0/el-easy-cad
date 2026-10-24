import type { Point } from '../document-model'
import { distanceToPolyline } from '../document-model'
import { t } from '../sprache'
import { fasseAchsstueckeZusammen } from './achsstuecke'
import type { GitterIndex } from './gitter-index'
import { erzeugeGitterIndex } from './gitter-index'
import type { Abbruchwaechter, ErkennungsGrenzen } from './grenzen'
import { ErkennungAbgebrochen, OHNE_GRENZE, STANDARD_GRENZEN, erzeugeWaechter } from './grenzen'
import type { OeffnungsUmfeld, OeffnungsVorschlag } from './oeffnungen'
import {
  STANDARD_OEFFNUNGS_OPTIONEN,
  erkenneOeffnungen,
  findeOeffnungsMerkmal,
  lueckenrahmen,
} from './oeffnungen'
import type { TreppenVorschlag } from './treppen'
import { erkenneTreppen } from './treppen'
import type { Planlinien, Plansegment } from './plansegment'
import { richtungsDifferenz, segmentRichtung } from './plansegment'
import { bereiteSegmenteAuf } from './segmente'
import type { Achsstueck } from './wand-paare'
import { findeAchsstuecke } from './wand-paare'
import type { WandVorschlag } from './wand-ketten'
import { bildeWandzuege, schliesseTStoesse } from './wand-ketten'
import type { WandToleranzen } from './wand-toleranzen'
import { STANDARD_EMPFINDLICHKEIT, aufbereitungAus, wandToleranzen } from './wand-toleranzen'

export interface WandErkennungsOptionen {
  staerkeMin: number
  staerkeMax: number
  mindestWandLaenge: number
  empfindlichkeit: number
}

const OEFFNUNGS_BREITE_MAX = 3

export const WAND_SUCHBEREICH_UNTERGRENZE = 0.05
export const WAND_SUCHBEREICH_OBERGRENZE = 0.6

export const STANDARD_WAND_ERKENNUNG: WandErkennungsOptionen = {
  staerkeMin: 0.1,
  staerkeMax: 0.5,
  mindestWandLaenge: 0.8,
  empfindlichkeit: STANDARD_EMPFINDLICHKEIT,
}

export function erkenneWaende(
  linien: Planlinien,
  optionen: WandErkennungsOptionen = STANDARD_WAND_ERKENNUNG,
  waechter: Abbruchwaechter = OHNE_GRENZE,
): WandVorschlag[] {
  const toleranzen = wandToleranzen(optionen.empfindlichkeit, linien.herkunft)

  const mindestSegmentLaenge = Math.min(0.08, optionen.mindestWandLaenge / 2)
  const segmente = bereiteSegmenteAuf(linien.segmente, {
    ...aufbereitungAus(toleranzen, mindestSegmentLaenge),
    waechter,
  })

  const kantenIndex = erzeugeGitterIndex(segmente, Math.max(optionen.staerkeMax, 0.5))
  const umfeld = umfeldAusIndex(segmente, linien.boegen, kantenIndex)
  const verbindetLuecke = (von: Point, bis: Point, staerke: number) => {
    if (kanteUeberdecktLuecke(segmente, kantenIndex, von, bis, staerke, toleranzen)) return true
    const mitte = { x: (von.x + bis.x) / 2, y: (von.y + bis.y) / 2 }
    const breite = Math.hypot(bis.x - von.x, bis.y - von.y)
    const richtung = Math.atan2(bis.y - von.y, bis.x - von.x)
    return findeOeffnungsMerkmal(lueckenrahmen(mitte, richtung, breite, staerke), umfeld) !== null
  }

  const achsen = findeAchsstuecke(
    segmente,
    {
      staerkeMin: optionen.staerkeMin,
      staerkeMax: optionen.staerkeMax,
      mindestUeberlappung: optionen.mindestWandLaenge,
      waechter,
    },
    toleranzen,
  )

  const zuege: WandVorschlag[] = []
  for (const gruppe of gruppiereNachStaerke(achsen)) {
    const zusammengefasst = fasseAchsstueckeZusammen(gruppe, {
      winkelToleranz: toleranzen.winkelToleranz,
      abstandToleranz: toleranzen.abstandToleranz,
      lueckenToleranz: toleranzen.lueckenToleranz,
      oeffnungsBreiteMax: OEFFNUNGS_BREITE_MAX,
      laeuftKanteDurch: verbindetLuecke,
      waechter,
    })

    zuege.push(
      ...bildeWandzuege(zusammengefasst, {
        eckFaktor: toleranzen.eckFaktor,
        mindestWandLaenge: optionen.mindestWandLaenge,
      }),
    )
  }

  schliesseTStoesse(zuege, toleranzen.eckFaktor)
  return entferneEingebettete(zuege)
}

function kanteUeberdecktLuecke(
  segmente: readonly Plansegment[],
  index: GitterIndex,
  von: Point,
  bis: Point,
  staerke: number,
  toleranzen: WandToleranzen,
): boolean {
  const laenge = Math.hypot(bis.x - von.x, bis.y - von.y)
  if (laenge <= 0) return false
  const laengs = { x: (bis.x - von.x) / laenge, y: (bis.y - von.y) / laenge }
  const quer = { x: -laengs.y, y: laengs.x }
  const achsWinkel = Math.atan2(laengs.y, laengs.x)
  const kantenToleranz = Math.max(toleranzen.abstandToleranz * 2, staerke * 0.25)

  for (const k of index.kandidatenFuerStrecke(von, bis)) {
    const segment = segmente[k]
    if (richtungsDifferenz(segmentRichtung(segment), achsWinkel) > toleranzen.winkelToleranz) {
      continue
    }
    const querA = (segment.a.x - von.x) * quer.x + (segment.a.y - von.y) * quer.y
    const querB = (segment.b.x - von.x) * quer.x + (segment.b.y - von.y) * quer.y
    const abstand = Math.abs((querA + querB) / 2)
    if (Math.abs(abstand - staerke / 2) > kantenToleranz) continue

    const tA = (segment.a.x - von.x) * laengs.x + (segment.a.y - von.y) * laengs.y
    const tB = (segment.b.x - von.x) * laengs.x + (segment.b.y - von.y) * laengs.y
    if (Math.min(tA, tB) <= laenge * 0.15 && Math.max(tA, tB) >= laenge * 0.85) return true
  }
  return false
}

function entferneEingebettete(zuege: readonly WandVorschlag[]): WandVorschlag[] {
  return zuege.filter((zug) => {
    const proben = probepunkte(zug.punkte)
    return !zuege.some((anderer) => {
      if (anderer === zug || anderer.staerke <= zug.staerke) return false
      const rand = anderer.staerke / 2
      return proben.every((p) => distanceToPolyline(p, anderer.punkte, false) <= rand)
    })
  })
}

function probepunkte(punkte: readonly Point[]): Point[] {
  const proben = [...punkte]
  for (let i = 0; i < punkte.length - 1; i++) {
    proben.push({
      x: (punkte[i].x + punkte[i + 1].x) / 2,
      y: (punkte[i].y + punkte[i + 1].y) / 2,
    })
  }
  return proben
}

export interface Bauteilfunde {
  waende: WandVorschlag[]
  oeffnungen: OeffnungsVorschlag[]
  treppen: TreppenVorschlag[]
  warnung?: string
}

export interface BauteilOptionen extends WandErkennungsOptionen {
  waendeSuchen?: boolean
  tuerenSuchen?: boolean
  fensterSuchen?: boolean
  treppenSuchen?: boolean
  oeffnungsBreiteMin?: number
  oeffnungsBreiteMax?: number
  farbe?: string | null
}

function umfeldFuer(linien: Planlinien): OeffnungsUmfeld {
  const index = erzeugeGitterIndex(linien.segmente, 1)
  return umfeldAusIndex(linien.segmente, linien.boegen, index)
}

function umfeldAusIndex(
  segmente: readonly Plansegment[],
  boegen: Planlinien['boegen'],
  index: GitterIndex,
): OeffnungsUmfeld {
  return {
    segmenteNahe: (von, bis) => index.kandidatenFuerStrecke(von, bis).map((i) => segmente[i]),
    boegenNahe: () => boegen,
  }
}

export function erkenneBauteile(
  linien: Planlinien,
  optionen: BauteilOptionen = STANDARD_WAND_ERKENNUNG,
  grenzen: ErkennungsGrenzen = STANDARD_GRENZEN,
): Bauteilfunde {
  const gefiltert = beschraenkeAufFarbe(linien, optionen.farbe)
  if (gefiltert.segmente.length > grenzen.maxSegmente) {
    throw new ErkennungAbgebrochen('menge')
  }

  const funde = erkenneAusLinien(gefiltert, optionen, erzeugeWaechter(grenzen.maxDauerMs))
  const gesamt = funde.waende.length + funde.oeffnungen.length + funde.treppen.length
  if (gesamt > grenzen.warnAbFunden) {
    return {
      ...funde,
      warnung: t('modell.erkennung.vieleFunde', { n: gesamt }),
    }
  }
  return funde
}

export function beschraenkeAufFarbe(
  linien: Planlinien,
  farbe: string | null | undefined,
): Planlinien {
  if (!farbe) return linien
  return {
    ...linien,
    segmente: linien.segmente.filter((s) => s.farbe === undefined || s.farbe === farbe),
  }
}

function erkenneAusLinien(
  linien: Planlinien,
  optionen: BauteilOptionen,
  waechter: Abbruchwaechter,
): Bauteilfunde {
  const treppen = optionen.treppenSuchen === false ? [] : erkenneTreppen(linien.segmente)
  if (optionen.waendeSuchen === false) return { waende: [], oeffnungen: [], treppen }

  const waende = entferneWaendeAufTreppen(erkenneWaende(linien, optionen, waechter), treppen)
  const tueren = optionen.tuerenSuchen !== false
  const fenster = optionen.fensterSuchen !== false
  const oeffnungen =
    tueren || fenster
      ? erkenneOeffnungen(
          waende,
          linien,
          {
            ...STANDARD_OEFFNUNGS_OPTIONEN,
            breiteMin: optionen.oeffnungsBreiteMin ?? STANDARD_OEFFNUNGS_OPTIONEN.breiteMin,
            breiteMax: optionen.oeffnungsBreiteMax ?? STANDARD_OEFFNUNGS_OPTIONEN.breiteMax,
          },
          umfeldFuer(linien),
        ).filter((o) => (o.art === 'tuer' ? tueren : fenster))
      : []
  return { waende, oeffnungen, treppen }
}

function entferneWaendeAufTreppen(
  waende: readonly WandVorschlag[],
  treppen: readonly TreppenVorschlag[],
): WandVorschlag[] {
  if (treppen.length === 0) return [...waende]
  return waende.filter((wand) => !treppen.some((treppe) => liegtAufTreppe(wand, treppe)))
}

function liegtAufTreppe(wand: WandVorschlag, treppe: TreppenVorschlag): boolean {
  const cos = Math.cos(-treppe.drehung)
  const sin = Math.sin(-treppe.drehung)
  const halbeBreite = treppe.breite / 2
  const halbeHoehe = treppe.hoehe / 2
  return wand.punkte.every((p) => {
    const dx = p.x - treppe.mitte.x
    const dy = p.y - treppe.mitte.y
    const u = dx * cos - dy * sin
    const v = dx * sin + dy * cos
    return Math.abs(u) <= halbeBreite && Math.abs(v) <= halbeHoehe
  })
}

function gruppiereNachStaerke(achsen: readonly Achsstueck[]): Achsstueck[][] {
  const sortiert = [...achsen].sort((a, b) => a.staerke - b.staerke)
  const gruppen: Achsstueck[][] = []
  let aktuell: Achsstueck[] = []

  for (const achse of sortiert) {
    if (aktuell.length === 0) {
      aktuell.push(achse)
      continue
    }
    const referenz = aktuell[0].staerke
    const toleranz = Math.max(0.015, referenz * 0.08)
    if (achse.staerke - referenz <= toleranz) {
      aktuell.push(achse)
    } else {
      gruppen.push(aktuell)
      aktuell = [achse]
    }
  }
  if (aktuell.length > 0) gruppen.push(aktuell)
  return gruppen
}
