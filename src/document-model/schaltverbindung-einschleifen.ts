import { getDockpoints, istTrunkDockpunkt } from './dockpoints'
import { dockpunktBezeichnung } from './dockpunkt-bezeichnung'
import type { Point } from './geometry'
import { rotatePoint } from './geometry'
import { erzeugeId } from './id'
import type {
  KomponentenObjekt,
  Objekt,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
} from './objekte'
import { SCHALTPLAN_POLABSTAND } from './parallel-polylinie'
import { GLEICH, vereinfacheWegpunkte } from './schaltverbindung-geometrie'
import type { SegmentEnde } from './schaltverbindung-segmente'
import { mitPassenderUnterbrechung, verbindeSegmente } from './schaltverbindung-segmente'

const POL_TOLERANZ = 0.01

const UMWEG_VERSATZ = SCHALTPLAN_POLABSTAND / 2

export interface KontaktPol {
  oben: number
  unten: number
  namen: string[]
}

function lokal(k: KomponentenObjekt, p: Point): Point {
  return k.drehung === 0 ? p : rotatePoint(p, k.position, -k.drehung)
}

function welt(k: KomponentenObjekt, p: Point): Point {
  return k.drehung === 0 ? p : rotatePoint(p, k.position, k.drehung)
}

function norm(text: string | undefined | null): string | null {
  const t = text?.trim().toUpperCase()
  return t ? t : null
}

export function kontaktPole(k: KomponentenObjekt): KontaktPol[] {
  const punkte = getDockpoints(k).map((p, index) => ({ index, p: lokal(k, p) }))
  const gruppen: { x: number; punkte: typeof punkte }[] = []
  for (const eintrag of punkte) {
    if (istTrunkDockpunkt(k, eintrag.index)) continue
    const gruppe = gruppen.find((g) => Math.abs(g.x - eintrag.p.x) <= POL_TOLERANZ)
    if (gruppe) gruppe.punkte.push(eintrag)
    else gruppen.push({ x: eintrag.p.x, punkte: [eintrag] })
  }
  return gruppen
    .filter((g) => g.punkte.length === 2)
    .sort((a, b) => a.x - b.x)
    .flatMap((g) => {
      const [a, b] = g.punkte
      if (Math.abs(a.p.y - b.p.y) <= POL_TOLERANZ) return []
      const [oben, unten] = a.p.y > b.p.y ? [a, b] : [b, a]
      const namen = [oben.index, unten.index]
        .map((i) => norm(dockpunktBezeichnung(k.dockpunkte, i)))
        .filter((n): n is string => n !== null)
      return [{ oben: oben.index, unten: unten.index, namen }]
    })
}

function dockAn(k: KomponentenObjekt, index: number): SchaltverbindungAnschluss {
  return { art: 'dock', objektId: k.id, dockpunktIndizes: [index] }
}

function endenAmDock(
  objekte: readonly Objekt[],
  k: KomponentenObjekt,
  index: number,
): { segment: SchaltverbindungObjekt; ende: SegmentEnde }[] {
  const treffer: { segment: SchaltverbindungObjekt; ende: SegmentEnde }[] = []
  for (const o of objekte) {
    if (o.type !== 'schaltverbindung') continue
    for (const ende of ['start', 'ziel'] as const) {
      const a = ende === 'start' ? o.start : o.ziel
      if (
        a.art === 'dock' &&
        a.objektId === k.id &&
        a.dockpunktIndizes.length === 1 &&
        a.dockpunktIndizes[0] === index
      )
        treffer.push({ segment: o, ende })
    }
  }
  return treffer
}

export function verbindeDurchGeloeschte(
  objekte: readonly Objekt[],
  ids: ReadonlySet<string>,
): Objekt[] {
  let liste: Objekt[] = [...objekte]
  for (const k of objekte) {
    if (k.type !== 'komponente' || !ids.has(k.id)) continue
    for (const pol of kontaktPole(k)) {
      const oben = endenAmDock(liste, k, pol.oben)
      const unten = endenAmDock(liste, k, pol.unten)
      if (oben.length !== 1 || unten.length !== 1) continue
      const [a, b] = [oben[0], unten[0]]
      if (a.segment.id === b.segment.id || ids.has(a.segment.id) || ids.has(b.segment.id)) continue
      const zusammen = verbindeSegmente(a.segment, a.ende, b.segment, b.ende, a.segment)
      liste = liste
        .filter((o) => o.id !== b.segment.id)
        .map((o) => (o.id === a.segment.id ? zusammen : o))
    }
  }
  return liste
}

interface Kandidat {
  linie: SchaltverbindungObjekt
  segment: number
  x: number
  yMin: number
  yMax: number
  name: string | null
}

interface Zuordnung {
  pol: KontaktPol
  kandidat: Kandidat
  oben: Point
  unten: Point
  umweg: { hoehe: number; gasse: number | null; tief: number } | null
}

function kandidaten(objekte: readonly Objekt[], k: KomponentenObjekt): Kandidat[] {
  const liste: Kandidat[] = []
  for (const o of objekte) {
    if (o.type !== 'schaltverbindung' || o.polzahl !== 1 || o.wegpunkte.length < 2) continue
    const w = o.wegpunkte.map((p) => lokal(k, p))
    for (let i = 0; i < w.length - 1; i++) {
      const [a, b] = [w[i], w[i + 1]]
      if (Math.abs(a.x - b.x) > GLEICH) continue
      liste.push({
        linie: o,
        segment: i,
        x: a.x,
        yMin: Math.min(a.y, b.y),
        yMax: Math.max(a.y, b.y),
        name: norm(o.bezeichnung),
      })
    }
  }
  return liste
}

function deckt(kandidat: Kandidat, oben: Point, unten: Point): boolean {
  return kandidat.yMin <= unten.y + GLEICH && kandidat.yMax >= oben.y - GLEICH
}

function ordneZu(objekte: readonly Objekt[], k: KomponentenObjekt): Zuordnung[] {
  const pole = kontaktPole(k)
  if (pole.length === 0) return []
  const alle = kandidaten(objekte, k)
  const halb = (k.breiteWelt ?? k.groesseWelt) / 2
  const imBereich = (c: Kandidat) =>
    c.x >= k.position.x - halb - UMWEG_VERSATZ && c.x <= k.position.x + halb + UMWEG_VERSATZ
  const benutzt = new Set<string>()
  const zuordnungen: Zuordnung[] = []
  const kontakte = (pol: KontaktPol) => {
    const punkte = getDockpoints(k)
    return { oben: lokal(k, punkte[pol.oben]), unten: lokal(k, punkte[pol.unten]) }
  }
  const nimm = (pol: KontaktPol, auswahl: Kandidat[]) => {
    const { oben, unten } = kontakte(pol)
    const passend = auswahl
      .filter((c) => !benutzt.has(c.linie.id) && deckt(c, oben, unten))
      .sort((a, b) => Math.abs(a.x - oben.x) - Math.abs(b.x - oben.x))[0]
    if (!passend) return false
    benutzt.add(passend.linie.id)
    zuordnungen.push({ pol, kandidat: passend, oben, unten, umweg: null })
    return true
  }
  const offen: KontaktPol[] = []
  for (const pol of pole) {
    const gleichnamig = alle.filter((c) => imBereich(c) && c.name && pol.namen.includes(c.name))
    if (pol.namen.length === 0 || !nimm(pol, gleichnamig)) offen.push(pol)
  }
  for (const pol of offen) {
    const { oben } = kontakte(pol)
    nimm(
      pol,
      alle.filter(
        (c) =>
          Math.abs(c.x - oben.x) <= POL_TOLERANZ &&
          (pol.namen.length === 0 || !c.name || pol.namen.includes(c.name)),
      ),
    )
  }
  planeUmwege(zuordnungen)
  return zuordnungen
}

function planeUmwege(zuordnungen: Zuordnung[]) {
  const rest = zuordnungen
    .filter((z) => Math.abs(z.kandidat.x - z.oben.x) > POL_TOLERANZ)
    .sort((a, b) => a.oben.x - b.oben.x)
  const reihe: Zuordnung[] = []
  const ueberGasse: Zuordnung[] = []
  while (rest.length > 0) {
    const bereit = rest.find(
      (z) => !rest.some((y) => y !== z && Math.abs(y.oben.x - z.kandidat.x) <= POL_TOLERANZ),
    )
    const naechste = bereit ?? rest[0]
    rest.splice(rest.indexOf(naechste), 1)
    ;(bereit ? reihe : ueberGasse).push(naechste)
  }
  reihe.forEach((z, i) => {
    z.umweg = { hoehe: (i + 1) * UMWEG_VERSATZ, gasse: null, tief: 0 }
  })
  ueberGasse.forEach((z, j) => {
    const seite = Math.sign(z.kandidat.x - z.oben.x) || 1
    z.umweg = {
      hoehe: (reihe.length + j + 1) * UMWEG_VERSATZ,
      gasse: z.oben.x + seite * UMWEG_VERSATZ,
      tief: UMWEG_VERSATZ / (2 + j),
    }
  })
}

function wegZumKontakt(z: Zuordnung, richtung: 1 | -1, bezug: number, reichweite: number): Point[] {
  const kontakt = richtung === 1 ? z.oben : z.unten
  const x = z.kandidat.x
  if (!z.umweg) return [{ x, y: kontakt.y }]
  const hoehe = bezug + richtung * Math.min(z.umweg.hoehe, Math.max(0, reichweite))
  if (z.umweg.gasse === null)
    return [
      { x, y: hoehe },
      { x: kontakt.x, y: hoehe },
      { x: kontakt.x, y: kontakt.y },
    ]
  const tief = bezug + richtung * Math.min(z.umweg.tief, Math.max(0, reichweite))
  return [
    { x, y: hoehe },
    { x: z.umweg.gasse, y: hoehe },
    { x: z.umweg.gasse, y: tief },
    { x: kontakt.x, y: tief },
    { x: kontakt.x, y: kontakt.y },
  ]
}

export interface Eingeschleift {
  objekte: Objekt[]
  linien: string[]
}

export function schleifeEin(objekte: readonly Objekt[], komponenteId: string): Eingeschleift {
  const k = objekte.find(
    (o): o is KomponentenObjekt => o.id === komponenteId && o.type === 'komponente',
  )
  if (!k) return { objekte: objekte as Objekt[], linien: [] }
  const zuordnungen = ordneZu(objekte, k)
  if (zuordnungen.length === 0) return { objekte: objekte as Objekt[], linien: [] }
  const bezugOben = Math.max(...zuordnungen.map((z) => z.oben.y))
  const bezugUnten = Math.min(...zuordnungen.map((z) => z.unten.y))

  let liste: Objekt[] = [...objekte]
  const linien: string[] = []
  for (const z of zuordnungen) {
    const s = z.kandidat.linie
    const w = s.wegpunkte.map((p) => lokal(k, p))
    const i = z.kandidat.segment
    const weg = (punkte: Point[]) => vereinfacheWegpunkte(punkte.map((p) => welt(k, p)))
    const nachOben = wegZumKontakt(z, 1, bezugOben, z.kandidat.yMax - bezugOben)
    const nachUnten = wegZumKontakt(z, -1, bezugUnten, bezugUnten - z.kandidat.yMin)
    const obenAnschluss = dockAn(k, z.pol.oben)
    const untenAnschluss = dockAn(k, z.pol.unten)
    const anfangOben = w[i].y > w[i + 1].y
    const vorneWeg = anfangOben
      ? [...w.slice(0, i + 1), ...nachOben]
      : [...w.slice(0, i + 1), ...nachUnten]
    const hintenWeg = anfangOben
      ? [...[...nachUnten].reverse(), ...w.slice(i + 1)]
      : [...[...nachOben].reverse(), ...w.slice(i + 1)]
    const vorne = mitPassenderUnterbrechung({
      ...s,
      wegpunkte: weg(vorneWeg),
      ziel: anfangOben ? obenAnschluss : untenAnschluss,
    })
    const { anordnung: _anordnung, ...ohneAnordnung } = s
    void _anordnung
    const hinten = mitPassenderUnterbrechung({
      ...ohneAnordnung,
      id: erzeugeId('objekt'),
      wegpunkte: weg(hintenWeg),
      start: anfangOben ? untenAnschluss : obenAnschluss,
    })
    liste = liste.flatMap((o) => (o.id === s.id ? [vorne, hinten] : [o]))
    linien.push(vorne.id, hinten.id)
  }
  return { objekte: liste, linien }
}
