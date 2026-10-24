import type { Abbruchwaechter } from './grenzen'
import type { Gerade } from './gerade'
import { geradeAusSegment, projektion, punktAufGerade, seitlicherVersatz } from './gerade'
import type { Plansegment } from './plansegment'
import { richtungsDifferenz, segmentLaenge, segmentRichtung } from './plansegment'
import { erzeugeRichtungsIndex } from './richtungs-index'

export interface AufbereitungsOptionen {
  waechter?: Abbruchwaechter
  mindestSegmentLaenge: number
  winkelToleranz: number
  abstandToleranz: number
  lueckenToleranz: number
}

export function bereiteSegmenteAuf(
  segmente: readonly Plansegment[],
  optionen: AufbereitungsOptionen,
): Plansegment[] {
  const brauchbar = segmente.filter((s) => segmentLaenge(s) >= optionen.mindestSegmentLaenge)
  if (brauchbar.length === 0) return []

  const winkel = brauchbar.map(segmentRichtung)
  const index = erzeugeRichtungsIndex(winkel, optionen.winkelToleranz)
  const reihenfolge = brauchbar
    .map((s, i) => ({ i, laenge: segmentLaenge(s) }))
    .sort((a, b) => b.laenge - a.laenge)
    .map((e) => e.i)

  const zugeordnet = new Array<boolean>(brauchbar.length).fill(false)
  const ergebnis: Plansegment[] = []

  for (const start of reihenfolge) {
    optionen.waechter?.pruefe()
    if (zugeordnet[start]) continue
    zugeordnet[start] = true
    const gerade = geradeAusSegment(brauchbar[start])
    const mitglieder = [start]

    for (const kandidat of index.kandidatenFuer(gerade.winkel)) {
      if (zugeordnet[kandidat]) continue
      if (richtungsDifferenz(winkel[kandidat], gerade.winkel) > optionen.winkelToleranz) continue
      const s = brauchbar[kandidat]
      if (Math.abs(seitlicherVersatz(gerade, s.a)) > optionen.abstandToleranz) continue
      if (Math.abs(seitlicherVersatz(gerade, s.b)) > optionen.abstandToleranz) continue
      zugeordnet[kandidat] = true
      mitglieder.push(kandidat)
    }

    for (const intervall of verschmolzeneIntervalle(gerade, mitglieder, brauchbar, optionen)) {
      ergebnis.push({
        a: punktAufGerade(gerade, intervall.von),
        b: punktAufGerade(gerade, intervall.bis),
      })
    }
  }

  return ergebnis.filter((s) => segmentLaenge(s) >= optionen.mindestSegmentLaenge)
}

interface Intervall {
  von: number
  bis: number
}

function verschmolzeneIntervalle(
  gerade: Gerade,
  mitglieder: readonly number[],
  segmente: readonly Plansegment[],
  optionen: AufbereitungsOptionen,
): Intervall[] {
  const intervalle = mitglieder
    .map((i) => {
      const t1 = projektion(gerade, segmente[i].a)
      const t2 = projektion(gerade, segmente[i].b)
      return t1 <= t2 ? { von: t1, bis: t2 } : { von: t2, bis: t1 }
    })
    .sort((a, b) => a.von - b.von)

  const ergebnis: Intervall[] = []
  let laufend = intervalle[0]
  for (const naechstes of intervalle.slice(1)) {
    if (naechstes.von <= laufend.bis + optionen.lueckenToleranz) {
      laufend = { von: laufend.von, bis: Math.max(laufend.bis, naechstes.bis) }
    } else {
      ergebnis.push(laufend)
      laufend = naechstes
    }
  }
  ergebnis.push(laufend)
  return ergebnis
}
