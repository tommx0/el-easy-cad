import type { Point } from '../document-model'
import type { Abbruchwaechter } from './grenzen'
import type { Gerade } from './gerade'
import { geradeAusSegment, projektion, punktAufGerade, seitlicherVersatz } from './gerade'
import { richtungsDifferenz, segmentRichtung } from './plansegment'
import { erzeugeRichtungsIndex } from './richtungs-index'
import type { Achsstueck } from './wand-paare'

export interface ZusammenfassOptionen {
  waechter?: Abbruchwaechter
  winkelToleranz: number
  abstandToleranz: number
  lueckenToleranz: number
  oeffnungsBreiteMax: number
  laeuftKanteDurch?: (von: Point, bis: Point, staerke: number) => boolean
}

interface Abschnitt {
  von: number
  bis: number
  traeger: Set<number>
  staerkeSumme: number
  anzahl: number
  luecken: { mitte: number; breite: number }[]
}

export function fasseAchsstueckeZusammen(
  achsen: readonly Achsstueck[],
  optionen: ZusammenfassOptionen,
): Achsstueck[] {
  if (achsen.length === 0) return []

  const alsSegment = achsen.map((a) => ({ a: a.a, b: a.b }))
  const winkel = alsSegment.map(segmentRichtung)
  const index = erzeugeRichtungsIndex(winkel, optionen.winkelToleranz)
  const reihenfolge = achsen
    .map((a, i) => ({ i, laenge: Math.hypot(a.b.x - a.a.x, a.b.y - a.a.y) }))
    .sort((x, y) => y.laenge - x.laenge)
    .map((e) => e.i)

  const zugeordnet = new Array<boolean>(achsen.length).fill(false)
  const ergebnis: Achsstueck[] = []

  for (const start of reihenfolge) {
    optionen.waechter?.pruefe()
    if (zugeordnet[start]) continue
    zugeordnet[start] = true
    const gerade = geradeAusSegment(alsSegment[start])
    const mitglieder = [start]

    for (const kandidat of index.kandidatenFuer(gerade.winkel)) {
      if (zugeordnet[kandidat]) continue
      if (richtungsDifferenz(winkel[kandidat], gerade.winkel) > optionen.winkelToleranz) continue
      const s = alsSegment[kandidat]
      if (Math.abs(seitlicherVersatz(gerade, s.a)) > optionen.abstandToleranz) continue
      if (Math.abs(seitlicherVersatz(gerade, s.b)) > optionen.abstandToleranz) continue
      zugeordnet[kandidat] = true
      mitglieder.push(kandidat)
    }

    for (const abschnitt of verschmolzeneAbschnitte(gerade, mitglieder, achsen, optionen)) {
      ergebnis.push({
        a: punktAufGerade(gerade, abschnitt.von),
        b: punktAufGerade(gerade, abschnitt.bis),
        staerke: abschnitt.staerkeSumme / abschnitt.anzahl,
        traeger: [...abschnitt.traeger],
        luecken: abschnitt.luecken.map((l) => ({
          mitte: punktAufGerade(gerade, l.mitte),
          breite: l.breite,
        })),
      })
    }
  }

  return ergebnis
}

function verschmolzeneAbschnitte(
  gerade: Gerade,
  mitglieder: readonly number[],
  achsen: readonly Achsstueck[],
  optionen: ZusammenfassOptionen,
): Abschnitt[] {
  const abschnitte = mitglieder
    .map((i): Abschnitt => {
      const t1 = projektion(gerade, achsen[i].a)
      const t2 = projektion(gerade, achsen[i].b)
      return {
        von: Math.min(t1, t2),
        bis: Math.max(t1, t2),
        traeger: new Set(achsen[i].traeger),
        staerkeSumme: achsen[i].staerke,
        anzahl: 1,
        luecken: [],
      }
    })
    .sort((a, b) => a.von - b.von)

  const ergebnis: Abschnitt[] = []
  let laufend = abschnitte[0]
  for (const naechstes of abschnitte.slice(1)) {
    const luecke = naechstes.von - laufend.bis
    const staerke = laufend.staerkeSumme / laufend.anzahl
    const durchgehend =
      [...naechstes.traeger].some((t) => laufend.traeger.has(t)) ||
      (optionen.laeuftKanteDurch?.(
        punktAufGerade(gerade, laufend.bis),
        punktAufGerade(gerade, naechstes.von),
        staerke,
      ) ??
        false)
    const verbinden =
      luecke <= optionen.lueckenToleranz || (durchgehend && luecke <= optionen.oeffnungsBreiteMax)

    if (verbinden) {
      const luecken: Abschnitt['luecken'] = [...laufend.luecken, ...naechstes.luecken]
      if (luecke > optionen.lueckenToleranz) {
        luecken.push({ mitte: (laufend.bis + naechstes.von) / 2, breite: luecke })
      }
      laufend = {
        von: laufend.von,
        bis: Math.max(laufend.bis, naechstes.bis),
        traeger: new Set([...laufend.traeger, ...naechstes.traeger]),
        staerkeSumme: laufend.staerkeSumme + naechstes.staerkeSumme,
        anzahl: laufend.anzahl + naechstes.anzahl,
        luecken,
      }
    } else {
      ergebnis.push(laufend)
      laufend = naechstes
    }
  }
  ergebnis.push(laufend)
  return ergebnis
}
