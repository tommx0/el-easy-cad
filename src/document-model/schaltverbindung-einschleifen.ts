import { getDockpoints, getFangpunkt, istTrunkDockpunkt } from './dockpoints'
import { dockpunktBezeichnung } from './dockpunkt-bezeichnung'
import type { Point } from './geometry'
import { boundingBoxUeberlappt, distance, rotatePoint } from './geometry'
import { erzeugeId } from './id'
import type {
  KomponentenObjekt,
  Objekt,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
} from './objekte'
import { getBoundingBox } from './objekte'
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

export type PolAchse = 'senkrecht' | 'waagrecht'
const ACHSEN: readonly PolAchse[] = ['senkrecht', 'waagrecht']

interface Rahmen {
  position: Point
  drehung: number
}

function rahmenVon(k: KomponentenObjekt, achse: PolAchse): Rahmen {
  return { position: k.position, drehung: k.drehung + (achse === 'waagrecht' ? Math.PI / 2 : 0) }
}

function lokal(r: Rahmen, p: Point): Point {
  return r.drehung === 0 ? p : rotatePoint(p, r.position, -r.drehung)
}

function welt(r: Rahmen, p: Point): Point {
  return r.drehung === 0 ? p : rotatePoint(p, r.position, r.drehung)
}

function halbQuer(k: KomponentenObjekt, achse: PolAchse): number {
  return (achse === 'senkrecht' ? (k.breiteWelt ?? k.groesseWelt) : k.groesseWelt) / 2
}

function lotAufLinie(a: Point, b: Point, p: Point): Point {
  if (Math.abs(a.x - b.x) <= GLEICH) return { x: a.x - p.x, y: 0 }
  if (Math.abs(a.y - b.y) <= GLEICH) return { x: 0, y: a.y - p.y }
  const laenge = distance(a, b)
  const d = { x: (b.x - a.x) / laenge, y: (b.y - a.y) / laenge }
  const t = (p.x - a.x) * d.x + (p.y - a.y) * d.y
  return { x: a.x + t * d.x - p.x, y: a.y + t * d.y - p.y }
}

function norm(text: string | undefined | null): string | null {
  const t = text?.trim().toUpperCase()
  return t ? t : null
}

export function kontaktPole(k: KomponentenObjekt, achse: PolAchse = 'senkrecht'): KontaktPol[] {
  const r = rahmenVon(k, achse)
  const punkte = getDockpoints(k).map((p, index) => ({ index, p: lokal(r, p) }))
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
    for (const pol of ACHSEN.flatMap((achse) => kontaktPole(k, achse))) {
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

function freiePole(
  objekte: readonly Objekt[],
  k: KomponentenObjekt,
  achse: PolAchse,
  nurLinien?: ReadonlySet<string>,
): KontaktPol[] {
  if (!nurLinien) return kontaktPole(k, achse)
  const belegt = (index: number) =>
    endenAmDock(objekte, k, index).some((e) => !nurLinien.has(e.segment.id))
  return kontaktPole(k, achse).filter((pol) => !belegt(pol.oben) && !belegt(pol.unten))
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

function kandidaten(
  objekte: readonly Objekt[],
  r: Rahmen,
  nurLinien?: ReadonlySet<string>,
): Kandidat[] {
  const liste: Kandidat[] = []
  for (const o of objekte) {
    if (o.type !== 'schaltverbindung' || o.polzahl !== 1 || o.wegpunkte.length < 2) continue
    if (nurLinien && !nurLinien.has(o.id)) continue
    const w = o.wegpunkte.map((p) => lokal(r, p))
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

function ordneZu(
  objekte: readonly Objekt[],
  k: KomponentenObjekt,
  achse: PolAchse,
  nurLinien?: ReadonlySet<string>,
): Zuordnung[] {
  const pole = freiePole(objekte, k, achse, nurLinien)
  if (pole.length === 0) return []
  const r = rahmenVon(k, achse)
  const alle = kandidaten(objekte, r, nurLinien)
  const halb = halbQuer(k, achse)
  const imBereich = (c: Kandidat) =>
    c.x >= k.position.x - halb - UMWEG_VERSATZ && c.x <= k.position.x + halb + UMWEG_VERSATZ
  const imInneren = (c: Kandidat) => Math.abs(c.x - k.position.x) < halb - GLEICH
  const benutzt = new Set<string>()
  const zuordnungen: Zuordnung[] = []
  const kontakte = (pol: KontaktPol) => {
    const punkte = getDockpoints(k)
    return { oben: lokal(r, punkte[pol.oben]), unten: lokal(r, punkte[pol.unten]) }
  }
  const namePasst = (pol: KontaktPol, c: Kandidat) =>
    pol.namen.length === 0 || !c.name || pol.namen.includes(c.name)
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
  const nochOffen: KontaktPol[] = []
  for (const pol of offen) {
    const { oben } = kontakte(pol)
    const genau = alle.filter((c) => Math.abs(c.x - oben.x) <= POL_TOLERANZ && namePasst(pol, c))
    if (!nimm(pol, genau)) nochOffen.push(pol)
  }
  for (const pol of nochOffen)
    nimm(
      pol,
      alle.filter((c) => imInneren(c) && namePasst(pol, c)),
    )
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
  anzahl: number
}

function laenge(punkte: readonly Point[]): number {
  let summe = 0
  for (let i = 1; i < punkte.length; i++) summe += distance(punkte[i - 1], punkte[i])
  return summe
}

export function schleifeEin(
  objekte: readonly Objekt[],
  komponenteId: string,
  nurLinien?: ReadonlySet<string>,
): Eingeschleift {
  const unveraendert = { objekte: objekte as Objekt[], linien: [], anzahl: 0 }
  const k = objekte.find(
    (o): o is KomponentenObjekt => o.id === komponenteId && o.type === 'komponente',
  )
  if (!k) return unveraendert
  let achse: PolAchse = 'senkrecht'
  let zuordnungen: Zuordnung[] = []
  for (const a of ACHSEN) {
    zuordnungen = ordneZu(objekte, k, a, nurLinien)
    achse = a
    if (zuordnungen.length > 0) break
  }
  if (zuordnungen.length === 0) return unveraendert
  const r = rahmenVon(k, achse)
  const dock = getDockpoints(k)
  const bezugOben = Math.max(...zuordnungen.map((z) => z.oben.y))
  const bezugUnten = Math.min(...zuordnungen.map((z) => z.unten.y))

  let liste: Objekt[] = [...objekte]
  const linien: string[] = []
  for (const z of zuordnungen) {
    const s = z.kandidat.linie
    const w = s.wegpunkte.map((p) => lokal(r, p))
    const i = z.kandidat.segment
    const [a, b] = [s.wegpunkte[i], s.wegpunkte[i + 1]]
    const aufLinie = (p: Point) => {
      const lot = lotAufLinie(a, b, p)
      return { x: p.x + lot.x, y: p.y + lot.y }
    }
    const zumKontakt = (punkte: Point[], kontakt: number) => {
      const weltPunkte = punkte.map((p) => welt(r, p))
      weltPunkte[0] = aufLinie(z.umweg ? weltPunkte[0] : dock[kontakt])
      if (z.umweg) weltPunkte[weltPunkte.length - 1] = { ...dock[kontakt] }
      return weltPunkte
    }
    const nachOben = zumKontakt(
      wegZumKontakt(z, 1, bezugOben, z.kandidat.yMax - bezugOben),
      z.pol.oben,
    )
    const nachUnten = zumKontakt(
      wegZumKontakt(z, -1, bezugUnten, bezugUnten - z.kandidat.yMin),
      z.pol.unten,
    )
    const obenAnschluss = dockAn(k, z.pol.oben)
    const untenAnschluss = dockAn(k, z.pol.unten)
    const anfangOben = w[i].y > w[i + 1].y
    const vorneWeg = vereinfacheWegpunkte([
      ...s.wegpunkte.slice(0, i + 1),
      ...(anfangOben ? nachOben : nachUnten),
    ])
    const hintenWeg = vereinfacheWegpunkte([
      ...[...(anfangOben ? nachUnten : nachOben)].reverse(),
      ...s.wegpunkte.slice(i + 1),
    ])
    const vorne = mitPassenderUnterbrechung({
      ...s,
      wegpunkte: vorneWeg,
      ziel: anfangOben ? obenAnschluss : untenAnschluss,
    })
    const { anordnung: _anordnung, ...ohneAnordnung } = s
    void _anordnung
    const hinten = mitPassenderUnterbrechung({
      ...ohneAnordnung,
      id: erzeugeId('objekt'),
      wegpunkte: hintenWeg,
      start: anfangOben ? untenAnschluss : obenAnschluss,
    })
    let stuecke: SchaltverbindungObjekt[]
    if (laenge(vorneWeg) <= GLEICH) stuecke = [mitPassenderUnterbrechung({ ...hinten, id: s.id })]
    else if (laenge(hintenWeg) <= GLEICH) stuecke = [vorne]
    else stuecke = [vorne, hinten]
    liste = liste.flatMap((o) => (o.id === s.id ? stuecke : [o]))
    linien.push(...stuecke.map((st) => st.id))
  }
  return { objekte: liste, linien, anzahl: zuordnungen.length }
}

export function rasteAufLinieEin(
  objekte: readonly Objekt[],
  k: KomponentenObjekt,
  drehenErlaubt: boolean,
  nurLinien?: ReadonlySet<string>,
): KomponentenObjekt | null {
  const varianten = [k]
  if (drehenErlaubt) {
    const zentrum = getFangpunkt(k)
    varianten.push({
      ...k,
      position: rotatePoint(k.position, zentrum, Math.PI / 2),
      drehung: (k.drehung + Math.PI / 2) % (2 * Math.PI),
    })
  }
  for (const v of varianten) {
    const dock = getDockpoints(v)
    let bester: { abstand: number; versatz: Point } | null = null
    for (const achse of ACHSEN) {
      const pole = freiePole(objekte, v, achse, nurLinien)
      if (pole.length === 0) continue
      const r = rahmenVon(v, achse)
      const halb = halbQuer(v, achse)
      for (const c of kandidaten(objekte, r, nurLinien)) {
        if (Math.abs(c.x - v.position.x) >= halb - GLEICH) continue
        for (const pol of pole) {
          const oben = lokal(r, dock[pol.oben])
          if (!deckt(c, oben, lokal(r, dock[pol.unten]))) continue
          const abstand = Math.abs(c.x - oben.x)
          if (bester && bester.abstand <= abstand) continue
          const w = c.linie.wegpunkte
          bester = { abstand, versatz: lotAufLinie(w[c.segment], w[c.segment + 1], dock[pol.oben]) }
        }
      }
    }
    if (bester)
      return {
        ...v,
        position: { x: v.position.x + bester.versatz.x, y: v.position.y + bester.versatz.y },
      }
  }
  return null
}

export function fremdeLinien(objekte: readonly Objekt[], komponenteId: string): Set<string> {
  const haengtAn = (a: SchaltverbindungAnschluss) => a.art === 'dock' && a.objektId === komponenteId
  return new Set(
    objekte
      .filter(
        (o): o is SchaltverbindungObjekt =>
          o.type === 'schaltverbindung' && !haengtAn(o.start) && !haengtAn(o.ziel),
      )
      .map((o) => o.id),
  )
}

export function schleifeLinienDurch(
  objekte: readonly Objekt[],
  linienIds: readonly string[],
): { objekte: Objekt[]; bauteile: number } {
  let liste: Objekt[] = [...objekte]
  const ids = new Set(linienIds)
  let bauteile = 0
  for (const k of objekte) {
    if (k.type !== 'komponente') continue
    const umriss = getBoundingBox(k)
    const beruehrt = liste.some(
      (o) =>
        o.type === 'schaltverbindung' &&
        ids.has(o.id) &&
        boundingBoxUeberlappt(getBoundingBox(o), umriss),
    )
    if (!beruehrt) continue
    const ergebnis = schleifeEin(liste, k.id, ids)
    if (ergebnis.anzahl === 0) continue
    liste = ergebnis.objekte
    for (const id of ergebnis.linien) ids.add(id)
    bauteile += 1
  }
  return { objekte: liste, bauteile }
}
