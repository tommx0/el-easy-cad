import type { Point } from '../document-model'
import type { Gerade } from './gerade'
import { geradeAusSegment, projektion, punktAufGerade, seitlicherVersatz } from './gerade'
import type { Plansegment } from './plansegment'
import { richtungsDifferenz, segmentLaenge } from './plansegment'
import { erzeugeGitterIndex } from './gitter-index'
import type { Abbruchwaechter } from './grenzen'
import type { WandToleranzen } from './wand-toleranzen'

export interface Wandluecke {
  mitte: Point
  breite: number
}

export interface Achsstueck {
  a: Point
  b: Point
  staerke: number
  luecken?: Wandluecke[]
  traeger: number[]
}

export interface PaarOptionen {
  waechter?: Abbruchwaechter
  staerkeMin: number
  staerkeMax: number
  mindestUeberlappung: number
}

export function findeAchsstuecke(
  segmente: readonly Plansegment[],
  optionen: PaarOptionen,
  toleranzen: WandToleranzen,
): Achsstueck[] {
  const geraden = segmente.map(geradeAusSegment)
  const laengen = segmente.map(segmentLaenge)
  const index = erzeugeGitterIndex(segmente, Math.max(optionen.staerkeMax, 0.5))
  const ergebnis: Paarkandidat[] = []

  for (let i = 0; i < segmente.length; i++) {
    optionen.waechter?.pruefe()
    const gerade = geraden[i]
    const nachbarn = index.kandidatenFuer(i)
    for (const j of nachbarn) {
      optionen.waechter?.pruefe()
      if (j <= i) continue
      if (richtungsDifferenz(geraden[j].winkel, gerade.winkel) > toleranzen.winkelToleranz) continue

      const versatzA = seitlicherVersatz(gerade, segmente[j].a)
      const versatzB = seitlicherVersatz(gerade, segmente[j].b)
      if (Math.abs(versatzA - versatzB) > toleranzen.keilToleranz) continue

      const versatz = (versatzA + versatzB) / 2
      const staerke = Math.abs(versatz)
      if (staerke < optionen.staerkeMin || staerke > optionen.staerkeMax) continue

      const ueberlappung = ueberlappungsIntervall(gerade, laengen[i], segmente[j])
      if (!ueberlappung) continue
      if (ueberlappung.bis - ueberlappung.von < optionen.mindestUeberlappung) continue

      if (
        hatZwischenlinie(
          { i, j, versatz, von: ueberlappung.von, bis: ueberlappung.bis, gerade },
          segmente,
          geraden,
          nachbarn,
          optionen,
          toleranzen,
        )
      ) {
        continue
      }

      ergebnis.push({
        achse: {
          a: punktAufGerade(gerade, ueberlappung.von, versatz / 2),
          b: punktAufGerade(gerade, ueberlappung.bis, versatz / 2),
          staerke,
          traeger: [i, j],
        },
        laenge: ueberlappung.bis - ueberlappung.von,
        bereiche: [
          { linie: i, von: ueberlappung.von, bis: ueberlappung.bis },
          {
            linie: j,
            ...projektionsIntervall(geraden[j], {
              a: punktAufGerade(gerade, ueberlappung.von),
              b: punktAufGerade(gerade, ueberlappung.bis),
            }),
          },
        ],
      })
    }
  }

  return jedeLinieNurEinmalBelegt(ergebnis)
}

interface Paarkandidat {
  achse: Achsstueck
  laenge: number
  bereiche: { linie: number; von: number; bis: number }[]
}

function jedeLinieNurEinmalBelegt(kandidaten: readonly Paarkandidat[]): Achsstueck[] {
  const sortiert = [...kandidaten].sort(
    (a, b) => b.laenge - a.laenge || a.achse.staerke - b.achse.staerke,
  )
  const belegt = new Map<number, { von: number; bis: number }[]>()
  const ergebnis: Achsstueck[] = []

  for (const kandidat of sortiert) {
    const kollidiert = kandidat.bereiche.some((bereich) => {
      const vergeben = belegt.get(bereich.linie) ?? []
      const eigeneLaenge = bereich.bis - bereich.von
      return vergeben.some((anderer) => {
        const gemeinsam = Math.min(anderer.bis, bereich.bis) - Math.max(anderer.von, bereich.von)
        return gemeinsam > eigeneLaenge / 2
      })
    })
    if (kollidiert) continue

    for (const bereich of kandidat.bereiche) {
      const vergeben = belegt.get(bereich.linie) ?? []
      vergeben.push({ von: bereich.von, bis: bereich.bis })
      belegt.set(bereich.linie, vergeben)
    }
    ergebnis.push(kandidat.achse)
  }

  return ergebnis
}

interface Intervall {
  von: number
  bis: number
}

function projektionsIntervall(gerade: Gerade, segment: Plansegment): Intervall {
  const t1 = projektion(gerade, segment.a)
  const t2 = projektion(gerade, segment.b)
  return { von: Math.min(t1, t2), bis: Math.max(t1, t2) }
}

function ueberlappungsIntervall(
  gerade: Gerade,
  laengeI: number,
  segmentJ: Plansegment,
): Intervall | null {
  const iv = projektionsIntervall(gerade, segmentJ)
  const von = Math.max(0, iv.von)
  const bis = Math.min(laengeI, iv.bis)
  return bis > von ? { von, bis } : null
}

interface PaarLage {
  i: number
  j: number
  versatz: number
  von: number
  bis: number
  gerade: Gerade
}

function hatZwischenlinie(
  paar: PaarLage,
  segmente: readonly Plansegment[],
  geraden: readonly Gerade[],
  nachbarn: readonly number[],
  optionen: PaarOptionen,
  toleranzen: WandToleranzen,
): boolean {
  const rand = Math.max(toleranzen.abstandToleranz * 2, optionen.staerkeMin * 0.4)
  const laenge = paar.bis - paar.von
  const vorzeichen = paar.versatz >= 0 ? 1 : -1

  for (const k of nachbarn) {
    if (k === paar.i || k === paar.j) continue
    if (richtungsDifferenz(geraden[k].winkel, paar.gerade.winkel) > toleranzen.winkelToleranz) {
      continue
    }
    const versatzK =
      (seitlicherVersatz(paar.gerade, segmente[k].a) +
        seitlicherVersatz(paar.gerade, segmente[k].b)) /
      2
    const lage = versatzK * vorzeichen
    if (lage <= rand || lage >= Math.abs(paar.versatz) - rand) continue

    const lageK = projektionsIntervall(paar.gerade, segmente[k])
    const gemeinsam = Math.min(lageK.bis, paar.bis) - Math.max(lageK.von, paar.von)
    if (gemeinsam > laenge / 2) return true
  }
  return false
}
