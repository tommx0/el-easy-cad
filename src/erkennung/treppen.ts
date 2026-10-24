import type { Point } from '../document-model'
import { geradeAusSegment, projektion, seitlicherVersatz } from './gerade'
import type { Plansegment } from './plansegment'
import { richtungsDifferenz, segmentLaenge, segmentRichtung } from './plansegment'
import { erzeugeRichtungsIndex } from './richtungs-index'

export interface TreppenVorschlag {
  mitte: Point
  breite: number
  hoehe: number
  drehung: number
  stufenanzahl: number
}

export interface TreppenOptionen {
  laufbreiteMin: number
  laufbreiteMax: number
  stufentiefeMin: number
  stufentiefeMax: number
  mindestStufen: number
  winkelToleranz: number
}

export const STANDARD_TREPPEN_OPTIONEN: TreppenOptionen = {
  laufbreiteMin: 0.6,
  laufbreiteMax: 2,
  stufentiefeMin: 0.15,
  stufentiefeMax: 0.35,
  mindestStufen: 4,
  winkelToleranz: (4 * Math.PI) / 180,
}

export function erkenneTreppen(
  segmente: readonly Plansegment[],
  optionen: TreppenOptionen = STANDARD_TREPPEN_OPTIONEN,
): TreppenVorschlag[] {
  const kandidaten: number[] = []
  const laengen = segmente.map(segmentLaenge)
  segmente.forEach((_, i) => {
    if (laengen[i] >= optionen.laufbreiteMin && laengen[i] <= optionen.laufbreiteMax) {
      kandidaten.push(i)
    }
  })
  if (kandidaten.length < optionen.mindestStufen) return []

  const winkel = segmente.map(segmentRichtung)
  const index = erzeugeRichtungsIndex(
    kandidaten.map((i) => winkel[i]),
    optionen.winkelToleranz,
  )
  const nachbarn = (richtung: number) =>
    index.kandidatenFuer(richtung).map((pos) => kandidaten[pos])

  const verbraucht = new Set<number>()
  const ergebnis: TreppenVorschlag[] = []

  for (const start of kandidaten) {
    if (verbraucht.has(start)) continue
    const schar = sammleSchar(start, segmente, winkel, laengen, nachbarn, verbraucht, optionen)
    if (schar.length < optionen.mindestStufen) continue

    for (const i of schar) verbraucht.add(i)
    ergebnis.push(alsTreppe(schar, segmente, winkel[start]))
  }

  return ergebnis
}

function sammleSchar(
  start: number,
  segmente: readonly Plansegment[],
  winkel: readonly number[],
  laengen: readonly number[],
  nachbarn: (richtung: number) => number[],
  verbraucht: ReadonlySet<number>,
  optionen: TreppenOptionen,
): number[] {
  const gerade = geradeAusSegment(segmente[start])
  const laengsBereich = (s: Plansegment) => {
    const t1 = projektion(gerade, s.a)
    const t2 = projektion(gerade, s.b)
    return { von: Math.min(t1, t2), bis: Math.max(t1, t2) }
  }
  const eigen = laengsBereich(segmente[start])

  const parallele: { i: number; versatz: number }[] = []
  for (const j of nachbarn(gerade.winkel)) {
    if (verbraucht.has(j)) continue
    if (richtungsDifferenz(winkel[j], gerade.winkel) > optionen.winkelToleranz) continue
    if (Math.abs(laengen[j] - laengen[start]) > laengen[start] * 0.35) continue

    const bereich = laengsBereich(segmente[j])
    const gemeinsam = Math.min(bereich.bis, eigen.bis) - Math.max(bereich.von, eigen.von)
    if (gemeinsam < (eigen.bis - eigen.von) * 0.6) continue

    const versatz =
      (seitlicherVersatz(gerade, segmente[j].a) + seitlicherVersatz(gerade, segmente[j].b)) / 2
    parallele.push({ i: j, versatz })
  }

  parallele.sort((a, b) => a.versatz - b.versatz)
  const startIndex = parallele.findIndex((p) => p.i === start)
  if (startIndex < 0) return []

  const schar = [parallele[startIndex]]
  let stufenmass: number | null = null

  const passt = (abstand: number) => {
    if (abstand < optionen.stufentiefeMin || abstand > optionen.stufentiefeMax) return false
    if (stufenmass === null) return true
    return Math.abs(abstand - stufenmass) <= stufenmass * 0.2
  }

  for (let k = startIndex + 1; k < parallele.length; k++) {
    const abstand = parallele[k].versatz - schar[schar.length - 1].versatz
    if (!passt(abstand)) break
    stufenmass ??= abstand
    schar.push(parallele[k])
  }
  for (let k = startIndex - 1; k >= 0; k--) {
    const abstand = schar[0].versatz - parallele[k].versatz
    if (!passt(abstand)) break
    stufenmass ??= abstand
    schar.unshift(parallele[k])
  }

  return schar.map((p) => p.i)
}

function alsTreppe(
  schar: readonly number[],
  segmente: readonly Plansegment[],
  richtung: number,
): TreppenVorschlag {
  const laengs = { x: Math.cos(richtung), y: Math.sin(richtung) }
  const quer = { x: -Math.sin(richtung), y: Math.cos(richtung) }
  const punkte = schar.flatMap((i) => [segmente[i].a, segmente[i].b])

  const u = punkte.map((p) => p.x * laengs.x + p.y * laengs.y)
  const v = punkte.map((p) => p.x * quer.x + p.y * quer.y)
  const uMin = Math.min(...u)
  const uMax = Math.max(...u)
  const vMin = Math.min(...v)
  const vMax = Math.max(...v)
  const uMitte = (uMin + uMax) / 2
  const vMitte = (vMin + vMax) / 2

  return {
    mitte: {
      x: laengs.x * uMitte + quer.x * vMitte,
      y: laengs.y * uMitte + quer.y * vMitte,
    },
    breite: uMax - uMin,
    hoehe: vMax - vMin,
    drehung: richtung,
    stufenanzahl: schar.length + 1,
  }
}
