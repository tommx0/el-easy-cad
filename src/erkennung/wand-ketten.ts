import type { Point } from '../document-model'
import { distance, naechsterPunktAufSegment } from '../document-model'
import { geradeAusSegment, geradenSchnittpunkt } from './gerade'
import type { Achsstueck, Wandluecke } from './wand-paare'

export interface WandVorschlag {
  punkte: Point[]
  staerke: number
  luecken: Wandluecke[]
}

export interface KettenOptionen {
  eckFaktor: number
  mindestWandLaenge: number
}

type Endeindex = 0 | 1
interface Verbindung {
  achse: number
  ende: Endeindex
}

export function bildeWandzuege(
  achsen: readonly Achsstueck[],
  optionen: KettenOptionen,
): WandVorschlag[] {
  if (achsen.length === 0) return []
  const gruppenStaerke = mittlereStaerke(achsen)

  const punkte = achsen.map((a) => [a.a, a.b] as [Point, Point])
  const partner = achsen.map<[Verbindung | null, Verbindung | null]>(() => [null, null])
  const eckToleranz = gruppenStaerke * optionen.eckFaktor

  verbindeEcken(achsen, punkte, partner, eckToleranz)

  const zuege = verfolgeKetten(punkte, partner, achsen).map((k) => ({
    punkte: k.punkte,
    staerke: mittlereStaerke(k.achsen),
    luecken: k.luecken,
  }))
  return zuege.filter((z) => pfadLaenge(z.punkte) >= optionen.mindestWandLaenge)
}

function mittlereStaerke(achsen: readonly Achsstueck[]): number {
  if (achsen.length === 0) return 0
  const summe = achsen.reduce((s, a) => s + a.staerke, 0)
  return Math.round((summe / achsen.length) * 200) / 200
}

function verbindeEcken(
  achsen: readonly Achsstueck[],
  punkte: Point[][],
  partner: (Verbindung | null)[][],
  eckToleranz: number,
) {
  const enden: { achse: number; ende: Endeindex }[] = []
  for (let i = 0; i < achsen.length; i++) {
    enden.push({ achse: i, ende: 0 }, { achse: i, ende: 1 })
  }
  const vergeben = new Set<string>()
  const schluessel = (e: { achse: number; ende: Endeindex }) => `${e.achse}:${e.ende}`

  for (const ende of enden) {
    if (vergeben.has(schluessel(ende))) continue
    const nahe = enden.filter(
      (anderes) =>
        anderes.achse !== ende.achse &&
        !vergeben.has(schluessel(anderes)) &&
        distance(punkte[ende.achse][ende.ende], punkte[anderes.achse][anderes.ende]) <= eckToleranz,
    )
    if (nahe.length !== 1) continue

    const gegenueber = nahe[0]
    const ecke = eckPunkt(achsen[ende.achse], achsen[gegenueber.achse], punkte, ende, gegenueber)
    punkte[ende.achse][ende.ende] = ecke
    punkte[gegenueber.achse][gegenueber.ende] = ecke
    partner[ende.achse][ende.ende] = gegenueber
    partner[gegenueber.achse][gegenueber.ende] = ende
    vergeben.add(schluessel(ende))
    vergeben.add(schluessel(gegenueber))
  }
}

function eckPunkt(
  achseA: Achsstueck,
  achseB: Achsstueck,
  punkte: Point[][],
  endeA: { achse: number; ende: Endeindex },
  endeB: { achse: number; ende: Endeindex },
): Point {
  const schnitt = geradenSchnittpunkt(geradeAusSegment(achseA), geradeAusSegment(achseB))
  const a = punkte[endeA.achse][endeA.ende]
  const b = punkte[endeB.achse][endeB.ende]
  if (!schnitt) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const grenze = Math.max(distance(a, b) * 4, 0.5)
  if (distance(schnitt, a) > grenze) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  return schnitt
}

function verfolgeKetten(
  punkte: Point[][],
  partner: (Verbindung | null)[][],
  achsen: readonly Achsstueck[],
): { punkte: Point[]; luecken: Wandluecke[]; achsen: Achsstueck[] }[] {
  const besucht = new Set<number>()
  const zuege: { punkte: Point[]; luecken: Wandluecke[]; achsen: Achsstueck[] }[] = []

  const ketteAb = (start: number, startEnde: Endeindex) => {
    const ergebnis: Point[] = []
    const luecken: Wandluecke[] = []
    const beteiligte: Achsstueck[] = []
    let achse = start
    let eintritt: Endeindex = startEnde
    for (;;) {
      besucht.add(achse)
      beteiligte.push(achsen[achse])
      luecken.push(...(achsen[achse].luecken ?? []))
      const austritt: Endeindex = eintritt === 0 ? 1 : 0
      if (ergebnis.length === 0) ergebnis.push(punkte[achse][eintritt])
      ergebnis.push(punkte[achse][austritt])
      const weiter = partner[achse][austritt]
      if (!weiter) break
      if (besucht.has(weiter.achse)) break
      achse = weiter.achse
      eintritt = weiter.ende
    }
    return { punkte: ergebnis, luecken, achsen: beteiligte }
  }

  for (let i = 0; i < punkte.length; i++) {
    if (besucht.has(i)) continue
    if (partner[i][0] === null) zuege.push(ketteAb(i, 0))
    else if (partner[i][1] === null) zuege.push(ketteAb(i, 1))
  }
  for (let i = 0; i < punkte.length; i++) {
    if (!besucht.has(i)) zuege.push(ketteAb(i, 0))
  }
  return zuege
}

export function schliesseTStoesse(zuege: WandVorschlag[], eckFaktor: number) {
  for (const zug of zuege) {
    const toleranz = zug.staerke * eckFaktor
    const ersterPunkt = zug.punkte[0]
    const letzterPunkt = zug.punkte[zug.punkte.length - 1]
    if (distance(ersterPunkt, letzterPunkt) < 1e-9) continue
    for (const endeIndex of [0, zug.punkte.length - 1]) {
      const punkt = zug.punkte[endeIndex]
      let bester: { punkt: Point; abstand: number } | null = null
      for (const anderer of zuege) {
        if (anderer === zug) continue
        for (let i = 0; i < anderer.punkte.length - 1; i++) {
          const lot = naechsterPunktAufSegment(punkt, anderer.punkte[i], anderer.punkte[i + 1])
          const abstand = distance(punkt, lot)
          if (abstand > toleranz) continue
          if (!bester || abstand < bester.abstand) bester = { punkt: lot, abstand }
        }
      }
      if (bester) zug.punkte[endeIndex] = bester.punkt
    }
  }
}

function pfadLaenge(punkte: readonly Point[]): number {
  let summe = 0
  for (let i = 0; i < punkte.length - 1; i++) summe += distance(punkte[i], punkte[i + 1])
  return summe
}
