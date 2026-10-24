import type {
  Objekt,
  TuerObjekt,
  FensterObjekt,
  WanddurchbruchObjekt,
  WandObjekt,
  WandOeffnungBasis,
} from './objekte'
import type { Point } from './geometry'
import { angleBetween, distance, pfadGesamtLaenge, teilPfad } from './geometry'
import { punktAufPfad } from './trunk-kette'

export type WandOeffnung = TuerObjekt | FensterObjekt | WanddurchbruchObjekt

export function oeffnungenAufWand(objekte: readonly Objekt[], wandId: string): WandOeffnung[] {
  return objekte.filter(
    (o): o is WandOeffnung =>
      (o.type === 'tuer' || o.type === 'fenster' || o.type === 'wanddurchbruch') &&
      o.wandId === wandId,
  )
}

export function ermittleOeffnungsGeometrie(
  wand: WandObjekt,
  oeffnung: Pick<WandOeffnungBasis, 't'>,
): { position: Point; richtung: number } | null {
  if (wand.punkte.length < 2) return null
  const gesamt = pfadGesamtLaenge(wand.punkte)
  if (gesamt === 0) return null
  const t = Math.max(0, Math.min(1, oeffnung.t))
  const position = punktAufPfad(wand.punkte, t)
  const epsilon = Math.min(0.001, 0.01 / gesamt)
  const a = punktAufPfad(wand.punkte, Math.max(0, t - epsilon))
  const b = punktAufPfad(wand.punkte, Math.min(1, t + epsilon))
  const richtung = distance(a, b) > 0 ? angleBetween(a, b) : 0
  return { position, richtung }
}

export interface BenachbarteWandpunkte {
  vorher: { punkt: Point; abstandMeter: number }
  nachher: { punkt: Point; abstandMeter: number }
}

export function ermittleBenachbarteEckpunkte(
  wand: WandObjekt,
  t: number,
): BenachbarteWandpunkte | null {
  const punkte = wand.punkte
  if (punkte.length < 2) return null
  const gesamt = pfadGesamtLaenge(punkte)
  if (gesamt === 0) return null
  const ziel = Math.max(0, Math.min(1, t)) * gesamt
  let kumuliert = 0
  for (let i = 0; i < punkte.length - 1; i++) {
    const segLaenge = distance(punkte[i], punkte[i + 1])
    const naechsteKumuliert = kumuliert + segLaenge
    if (ziel <= naechsteKumuliert || i === punkte.length - 2) {
      return {
        vorher: { punkt: punkte[i], abstandMeter: Math.max(0, ziel - kumuliert) },
        nachher: { punkt: punkte[i + 1], abstandMeter: Math.max(0, naechsteKumuliert - ziel) },
      }
    }
    kumuliert = naechsteKumuliert
  }
  return null
}

export function expandiereWaendeMitOeffnungen(
  objekte: readonly Objekt[],
  transformierteObjekte: Map<string, Objekt>,
): void {
  for (const [wandId, wandNeu] of Array.from(transformierteObjekte)) {
    if (wandNeu.type !== 'wand') continue
    for (const oeffnung of oeffnungenAufWand(objekte, wandId)) {
      const geometrie = ermittleOeffnungsGeometrie(wandNeu, oeffnung)
      if (!geometrie) continue
      const aktuell = transformierteObjekte.get(oeffnung.id) ?? oeffnung
      transformierteObjekte.set(oeffnung.id, { ...aktuell, ...geometrie })
    }
  }
}

export function nachgefuehrteOeffnungen(objekte: readonly Objekt[]): Objekt[] {
  const waende = new Map(
    objekte.filter((o): o is WandObjekt => o.type === 'wand').map((w) => [w.id, w] as const),
  )
  return objekte.map((o) => {
    if (o.type !== 'tuer' && o.type !== 'fenster' && o.type !== 'wanddurchbruch') return o
    const wand = waende.get(o.wandId)
    if (!wand) return o
    const geometrie = ermittleOeffnungsGeometrie(wand, o)
    if (!geometrie) return o
    if (
      o.position.x === geometrie.position.x &&
      o.position.y === geometrie.position.y &&
      o.richtung === geometrie.richtung
    ) {
      return o
    }
    return { ...o, ...geometrie }
  })
}

interface Intervall {
  tVon: number
  tBis: number
}

function ermittleOeffnungsIntervalle(
  oeffnungen: readonly WandOeffnungBasis[],
  gesamt: number,
): Intervall[] {
  const roh = oeffnungen
    .map((o) => {
      const halbT = o.breite / 2 / gesamt
      return { tVon: Math.max(0, o.t - halbT), tBis: Math.min(1, o.t + halbT) }
    })
    .filter((i) => i.tBis > i.tVon)
    .sort((a, b) => a.tVon - b.tVon)

  const verschmolzen: Intervall[] = []
  for (const i of roh) {
    const letztes = verschmolzen[verschmolzen.length - 1]
    if (letztes && i.tVon <= letztes.tBis) {
      letztes.tBis = Math.max(letztes.tBis, i.tBis)
    } else {
      verschmolzen.push({ ...i })
    }
  }
  return verschmolzen
}

function ermittleFesteIntervalle(oeffnungsIntervalle: Intervall[]): Intervall[] {
  const ergebnis: Intervall[] = []
  let cursor = 0
  for (const i of oeffnungsIntervalle) {
    if (i.tVon > cursor) ergebnis.push({ tVon: cursor, tBis: i.tVon })
    cursor = Math.max(cursor, i.tBis)
  }
  if (cursor < 1) ergebnis.push({ tVon: cursor, tBis: 1 })
  return ergebnis
}

export interface WandTeilstueck {
  aussen: Point[]
  innen: Point[]
  startOffen?: boolean
  endeOffen?: boolean
}

export interface WandAnschluss {
  nachbarPunkt: Point
  nachbarStaerke: number
}

export interface WandAnschluesse {
  start: WandAnschluss | null
  ende: WandAnschluss | null
}

export function ermittleWandAchsenStuecke(
  wand: WandObjekt,
  oeffnungen: readonly WandOeffnungBasis[],
): Point[][] {
  if (wand.punkte.length < 2) return []
  const gesamt = pfadGesamtLaenge(wand.punkte)
  if (gesamt === 0) return []

  const feste = ermittleFesteIntervalle(ermittleOeffnungsIntervalle(oeffnungen, gesamt))
  return feste
    .filter(({ tVon, tBis }) => tBis - tVon > 1e-9)
    .map(({ tVon, tBis }) => teilPfad(wand.punkte, tVon, tBis))
}

export function ermittleWandTeilstuecke(
  wand: WandObjekt,
  oeffnungen: readonly WandOeffnungBasis[],
  anschluesse?: WandAnschluesse,
): WandTeilstueck[] {
  const halbe = wand.staerke / 2
  const achsen = ermittleWandAchsenStuecke(wand, oeffnungen)
  const wandStart = wand.punkte[0]
  const wandEnde = wand.punkte[wand.punkte.length - 1]
  return achsen.map((achse) => {
    const aussen = versetztePolylinie(achse, halbe)
    const innen = versetztePolylinie(achse, -halbe)
    let startOffen = true
    let endeOffen = true
    if (anschluesse?.start && distance(achse[0], wandStart) < 1e-9) {
      const eck = gehrungAmEnde(achse, halbe, anschluesse.start, true)
      if (eck) {
        aussen[0] = eck.aussen
        innen[0] = eck.innen
        startOffen = false
      }
    }
    if (anschluesse?.ende && distance(achse[achse.length - 1], wandEnde) < 1e-9) {
      const eck = gehrungAmEnde(achse, halbe, anschluesse.ende, false)
      if (eck) {
        aussen[aussen.length - 1] = eck.aussen
        innen[innen.length - 1] = eck.innen
        endeOffen = false
      }
    }
    return { aussen, innen, startOffen, endeOffen }
  })
}

export function normiert(v: Point): Point | null {
  const laenge = Math.hypot(v.x, v.y)
  return laenge < 1e-12 ? null : { x: v.x / laenge, y: v.y / laenge }
}

function gehrungsPunkt(
  von: Point,
  knoten: Point,
  nach: Point,
  versatzVon: number,
  versatzNach: number,
): Point | null {
  const u1 = normiert({ x: knoten.x - von.x, y: knoten.y - von.y })
  const u2 = normiert({ x: nach.x - knoten.x, y: nach.y - knoten.y })
  if (!u1 || !u2) return null
  const a = { x: knoten.x - u1.y * versatzVon, y: knoten.y + u1.x * versatzVon }
  const b = { x: knoten.x - u2.y * versatzNach, y: knoten.y + u2.x * versatzNach }
  const kreuz = u1.x * u2.y - u1.y * u2.x
  if (Math.abs(kreuz) < 1e-9) {
    const gleichlaufend = u1.x * u2.x + u1.y * u2.y > 0
    return gleichlaufend && Math.abs(versatzVon - versatzNach) < 1e-9 ? b : null
  }
  const s = ((b.x - a.x) * u2.y - (b.y - a.y) * u2.x) / kreuz
  const punkt = { x: a.x + u1.x * s, y: a.y + u1.y * s }
  const grenze = MITER_GRENZE * Math.max(Math.abs(versatzVon), Math.abs(versatzNach))
  return distance(punkt, knoten) > grenze ? null : punkt
}

export function gehrungAmEnde(
  achse: Point[],
  halbeStaerke: number,
  anschluss: WandAnschluss,
  amStart: boolean,
): { aussen: Point; innen: Point } | null {
  if (achse.length < 2) return null
  const halbeNachbar = anschluss.nachbarStaerke / 2
  const eck = (seite: 1 | -1) =>
    amStart
      ? gehrungsPunkt(
          anschluss.nachbarPunkt,
          achse[0],
          achse[1],
          seite * halbeNachbar,
          seite * halbeStaerke,
        )
      : gehrungsPunkt(
          achse[achse.length - 2],
          achse[achse.length - 1],
          anschluss.nachbarPunkt,
          seite * halbeStaerke,
          seite * halbeNachbar,
        )
  const aussen = eck(1)
  const innen = eck(-1)
  return aussen && innen ? { aussen, innen } : null
}

const MITER_GRENZE = 4

export function versetztePolylinie(pfad: Point[], versatz: number): Point[] {
  if (pfad.length < 2) return pfad.slice()
  if (versatz === 0) return pfad.slice()

  const geschlossen =
    pfad.length > 2 &&
    Math.abs(pfad[0].x - pfad[pfad.length - 1].x) < 1e-9 &&
    Math.abs(pfad[0].y - pfad[pfad.length - 1].y) < 1e-9

  const normalen: Point[] = []
  for (let i = 0; i < pfad.length - 1; i++) {
    const dx = pfad[i + 1].x - pfad[i].x
    const dy = pfad[i + 1].y - pfad[i].y
    const laenge = Math.hypot(dx, dy) || 1
    normalen.push({ x: -dy / laenge, y: dx / laenge })
  }

  return pfad.map((punkt, i) => {
    if (i === 0 || i === pfad.length - 1) {
      if (geschlossen)
        return gehrterPunkt(punkt, normalen[normalen.length - 1], normalen[0], versatz)
      const n = i === 0 ? normalen[0] : normalen[normalen.length - 1]
      return verschobenerPunkt(punkt, n, versatz)
    }
    return gehrterPunkt(punkt, normalen[i - 1], normalen[i], versatz)
  })
}

function gehrterPunkt(punkt: Point, n1: Point, n2: Point, versatz: number): Point {
  let mx = n1.x + n2.x
  let my = n1.y + n2.y
  let mLaenge = Math.hypot(mx, my)
  if (mLaenge < 1e-6) {
    mx = n1.x
    my = n1.y
    mLaenge = 1
  }
  mx /= mLaenge
  my /= mLaenge
  const cosHalberWinkel = mx * n1.x + my * n1.y
  const faktor = cosHalberWinkel > 1 / MITER_GRENZE ? 1 / cosHalberWinkel : MITER_GRENZE
  return verschobenerPunkt(punkt, { x: mx, y: my }, versatz * faktor)
}

function verschobenerPunkt(punkt: Point, normale: Point, versatz: number): Point {
  return { x: punkt.x + normale.x * versatz, y: punkt.y + normale.y * versatz }
}

export function verschobenesT(
  altesT: number,
  alteLaenge: number,
  versatzLaenge: number,
  umgekehrt: boolean,
  neueGesamtLaenge: number,
): number {
  if (neueGesamtLaenge === 0) return altesT
  const lokaleLaenge = (umgekehrt ? 1 - altesT : altesT) * alteLaenge
  return (versatzLaenge + lokaleLaenge) / neueGesamtLaenge
}
