import type { Point } from './geometry'
import { distance, pfadGesamtLaenge } from './geometry'
import { ALTER_KOMBINATION_FAKTOR, kombinationsFaktor } from './kombinations-faktor'
import type {
  KomponentenKombination,
  KomponentenObjekt,
  KomponentenWandstelle,
  LeitungsObjekt,
  Objekt,
  TrunkObjekt,
  WandObjekt,
} from './objekte'
import type { Zeichnung } from './zeichnung'
import { getDockpoints } from './dockpoints'
import { montagehoeheMeter } from './hoehenfuehrung'
import { erzeugeId } from './id'
import {
  ermittleModulZustaendeFuerTraeger,
  istModulTraeger,
  moduleVonTraeger,
} from './modul-traeger'
import { ermittleOeffnungsGeometrie, oeffnungenAufWand } from './wand'

export const KOMBINATION_MAX = 5
export const REIHEN_ABSTAND_METER = 0.02
export const AP_WANDABSTAND_METER = 0.02

const EPS = 1e-6

export interface Strecke {
  a: Point
  b: Point
}

export interface WandflaechenTreffer {
  wandId: string | null
  t: number | null
  seite: 1 | -1
  fusspunkt: Point
  richtung: number
  abstand: number
  kombinationHoeheCm?: number
  komponenteId?: string
}

function einheit(r: number): Point {
  return { x: Math.cos(r), y: Math.sin(r) }
}

function links(u: Point): Point {
  return { x: -u.y, y: u.x }
}

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y
}

function normiereWinkel(r: number): number {
  let w = r % (2 * Math.PI)
  if (w <= -Math.PI) w += 2 * Math.PI
  if (w > Math.PI) w -= 2 * Math.PI
  return w
}

export function stehtAllein(k: KomponentenObjekt): boolean {
  return istModulTraeger(k) || k.kombinierbar === false
}

function schritteVon(k: KomponentenObjekt): number {
  return k.kombination?.drehungSchritte ?? 0
}

function einzelVon(k: KomponentenObjekt): number {
  return k.kombination?.drehungEinzeln ?? 0
}

export function breiteEntlangWand(
  k: KomponentenObjekt,
  schritte = schritteVon(k) + einzelVon(k),
): number {
  return schritte % 2 === 1 ? k.groesseWelt : (k.breiteWelt ?? k.groesseWelt)
}

function tiefeInDenRaum(k: KomponentenObjekt, schritte = schritteVon(k) + einzelVon(k)): number {
  return schritte % 2 === 1 ? (k.breiteWelt ?? k.groesseWelt) : k.groesseWelt
}

function dreheViertel(p: { a: number; b: number }, schritte: number): { a: number; b: number } {
  switch (schritte % 4) {
    case 1:
      return { a: -p.b, b: p.a }
    case 2:
      return { a: -p.a, b: -p.b }
    case 3:
      return { a: p.b, b: -p.a }
    default:
      return p
  }
}

const RAHMEN_ABSTAND_METER = 0.005

export const DECKE_REIHE_CM = 99_999
export const BODEN_REIHE_CM = -1

export function hoeheCm(k: KomponentenObjekt, zeichnung: Zeichnung): number {
  if (k.montageort === 'decke') return DECKE_REIHE_CM
  if (k.montageort === 'boden') return BODEN_REIHE_CM
  return Math.round(montagehoeheMeter(k, zeichnung) * 100)
}

function aufReihe(komponente: KomponentenObjekt, cm: number): KomponentenObjekt {
  if (cm === DECKE_REIHE_CM) return { ...komponente, montageort: 'decke' }
  if (cm === BODEN_REIHE_CM) return { ...komponente, montageort: 'boden' }
  const { montageort: _m, ...ohneOrt } = komponente
  void _m
  return { ...ohneOrt, installationshoehe: cm / 100 }
}

export function findeWandflaeche(
  objekte: readonly Objekt[],
  punkt: Point,
  toleranz: number,
  linien: readonly Strecke[] = [],
): WandflaechenTreffer | null {
  let bester: WandflaechenTreffer | null = null
  for (const o of objekte) {
    if (o.type !== 'wand' || o.punkte.length < 2) continue
    const gesamt = pfadGesamtLaenge(o.punkte)
    if (gesamt === 0) continue
    const oeffnungen = oeffnungenAufWand(objekte, o.id)
    let bisher = 0
    for (let i = 0; i < o.punkte.length - 1; i++) {
      const a = o.punkte[i]
      const b = o.punkte[i + 1]
      const laenge = distance(a, b)
      const vorher = bisher
      bisher += laenge
      if (laenge === 0) continue
      const treffer = aufStrecke(a, b, laenge, punkt, o.staerke / 2)
      if (!treffer || treffer.abstand > toleranz) continue
      const t = (vorher + treffer.entlang) / gesamt
      const inOeffnung = oeffnungen.some((oe) => Math.abs(oe.t - t) <= oe.breite / 2 / gesamt)
      if (inOeffnung) continue
      if (!bester || treffer.abstand < bester.abstand) {
        bester = {
          wandId: o.id,
          t,
          seite: treffer.seite,
          fusspunkt: treffer.fusspunkt,
          richtung: treffer.richtung,
          abstand: treffer.abstand,
        }
      }
    }
  }
  if (bester) return bester
  for (const linie of linien) {
    const laenge = distance(linie.a, linie.b)
    if (laenge === 0) continue
    const treffer = aufStrecke(linie.a, linie.b, laenge, punkt, 0)
    if (!treffer || treffer.abstand > toleranz) continue
    if (!bester || treffer.abstand < bester.abstand) {
      bester = {
        wandId: null,
        t: null,
        seite: treffer.seite,
        fusspunkt: treffer.fusspunkt,
        richtung: treffer.richtung,
        abstand: treffer.abstand,
      }
    }
  }
  return bester
}

function aufStrecke(a: Point, b: Point, laenge: number, punkt: Point, halbeStaerke: number) {
  const r = { x: (b.x - a.x) / laenge, y: (b.y - a.y) / laenge }
  const n = links(r)
  const v = { x: punkt.x - a.x, y: punkt.y - a.y }
  const entlang = dot(v, r)
  if (entlang < 0 || entlang > laenge) return null
  const quer = dot(v, n)
  const seite: 1 | -1 = quer >= 0 ? 1 : -1
  return {
    entlang,
    seite,
    abstand: Math.abs(Math.abs(quer) - halbeStaerke),
    fusspunkt: {
      x: a.x + r.x * entlang + n.x * seite * halbeStaerke,
      y: a.y + r.y * entlang + n.y * seite * halbeStaerke,
    },
    richtung: normiereWinkel(Math.atan2(r.y, r.x) + (seite > 0 ? 0 : Math.PI)),
  }
}

function ankerAusWand(
  wand: WandObjekt,
  t: number,
  seite: 1 | -1,
): { punkt: Point; richtung: number } | null {
  const geometrie = ermittleOeffnungsGeometrie(wand, { t })
  if (!geometrie) return null
  const n = links(einheit(geometrie.richtung))
  const halb = (wand.staerke / 2) * seite
  return {
    punkt: { x: geometrie.position.x + n.x * halb, y: geometrie.position.y + n.y * halb },
    richtung: normiereWinkel(geometrie.richtung + (seite > 0 ? 0 : Math.PI)),
  }
}

export function eingerechneterKombinationsFaktor(k: KomponentenObjekt): number {
  if (!k.kombination || stehtAllein(k)) return 1
  return k.kombinationsFaktor ?? ALTER_KOMBINATION_FAKTOR
}

function skaliert(k: KomponentenObjekt, faktor: number): KomponentenObjekt {
  return {
    ...k,
    groesseWelt: k.groesseWelt * faktor,
    ...(k.breiteWelt !== undefined ? { breiteWelt: k.breiteWelt * faktor } : {}),
  }
}

export function ohneWandbindung(k: KomponentenObjekt): KomponentenObjekt {
  if (!k.wandstelle && !k.kombination) return k
  const faktor = eingerechneterKombinationsFaktor(k)
  const { wandstelle: _w, kombination: _k, kombinationsFaktor: _f, ...rest } = k
  void _w
  void _k
  void _f
  return faktor === 1 ? rest : skaliert(rest, 1 / faktor)
}

function verkleinert(k: KomponentenObjekt): KomponentenObjekt {
  if (k.kombination || stehtAllein(k)) return k
  const faktor = kombinationsFaktor()
  return { ...skaliert(k, faktor), kombinationsFaktor: faktor }
}

function aufAktuellenFaktor(k: KomponentenObjekt): KomponentenObjekt {
  if (!k.kombination || stehtAllein(k)) return k
  const ziel = kombinationsFaktor()
  if (k.kombinationsFaktor === ziel) return k
  return {
    ...skaliert(k, ziel / eingerechneterKombinationsFaktor(k)),
    kombinationsFaktor: ziel,
  }
}

function vergleicheLage(a: KomponentenObjekt, b: KomponentenObjekt): number {
  const ka = a.kombination
  const kb = b.kombination
  return (ka?.nr ?? 0) - (kb?.nr ?? 0) || (ka?.platz ?? 0) - (kb?.platz ?? 0)
}

function gleicheWandstelle(a: KomponentenWandstelle, b: KomponentenWandstelle): boolean {
  return (
    a.id === b.id &&
    a.wandId === b.wandId &&
    a.t === b.t &&
    a.seite === b.seite &&
    distance(a.punkt, b.punkt) < EPS &&
    Math.abs(normiereWinkel(a.richtung - b.richtung)) < EPS
  )
}

function gleicheKombination(a: KomponentenKombination | undefined, b: KomponentenKombination) {
  return (
    !!a &&
    a.nr === b.nr &&
    a.platz === b.platz &&
    a.hoeheCm === b.hoeheCm &&
    Math.abs(a.reihenStart - b.reihenStart) < EPS &&
    !!a.reihenEnde === !!b.reihenEnde &&
    (a.drehungSchritte ?? 0) === (b.drehungSchritte ?? 0) &&
    (a.drehungEinzeln ?? 0) === (b.drehungEinzeln ?? 0)
  )
}

export function ordneWandstellen(objekte: Objekt[], zeichnung: Zeichnung): Objekt[] {
  if (!objekte.some((o) => o.type === 'komponente' && o.wandstelle)) return objekte
  const waende = new Map<string, WandObjekt>()
  const stellen = new Map<string, KomponentenObjekt[]>()
  for (const o of objekte) {
    if (o.type === 'wand') waende.set(o.id, o)
    if (o.type !== 'komponente' || !o.wandstelle) continue
    const liste = stellen.get(o.wandstelle.id)
    if (liste) liste.push(o)
    else stellen.set(o.wandstelle.id, [o])
  }

  const neu = new Map<string, KomponentenObjekt>()
  for (const glieder of stellen.values()) {
    let stelle = glieder[0].wandstelle!
    if (stelle.wandId !== null) {
      const wand = waende.get(stelle.wandId)
      const anker = wand && stelle.t !== null ? ankerAusWand(wand, stelle.t, stelle.seite) : null
      if (!anker) {
        for (const g of glieder) neu.set(g.id, ohneWandbindung(g))
        continue
      }
      stelle = { ...stelle, punkt: anker.punkt, richtung: anker.richtung }
    }
    for (const [id, k] of legeStelleAus(stelle, glieder, zeichnung)) neu.set(id, k)
  }

  const geaendert = new Map<string, KomponentenObjekt>()
  for (const alt of objekte) {
    if (alt.type !== 'komponente') continue
    const k = neu.get(alt.id)
    if (!k) continue
    const lageGleich =
      distance(alt.position, k.position) < EPS &&
      Math.abs(normiereWinkel(alt.drehung - k.drehung)) < EPS
    const bindungGleich =
      !!alt.wandstelle === !!k.wandstelle &&
      (!k.wandstelle || gleicheWandstelle(alt.wandstelle!, k.wandstelle)) &&
      (!k.kombination ? !alt.kombination : gleicheKombination(alt.kombination, k.kombination)) &&
      alt.groesseWelt === k.groesseWelt &&
      alt.breiteWelt === k.breiteWelt &&
      alt.kombinationsFaktor === k.kombinationsFaktor &&
      alt.verlegung === k.verlegung
    if (lageGleich && bindungGleich) continue
    geaendert.set(alt.id, lageGleich ? { ...k, position: alt.position, drehung: alt.drehung } : k)
  }
  if (geaendert.size === 0) return objekte

  for (const k of Array.from(geaendert.values())) {
    if (!istModulTraeger(k)) continue
    for (const [id, zustand] of ermittleModulZustaendeFuerTraeger(
      k,
      moduleVonTraeger(objekte, k.id),
    )) {
      const modul = objekte.find((o) => o.id === id)
      if (modul?.type === 'komponente') geaendert.set(id, { ...modul, ...zustand })
    }
  }

  const ergebnis = objekte.map((o) => geaendert.get(o.id) ?? o)
  return fuehreEndenNach(ergebnis, new Set(geaendert.keys()))
}

function mitVerlegung(
  k: KomponentenObjekt,
  verlegung: KomponentenObjekt['verlegung'],
): KomponentenObjekt {
  if (k.verlegung === verlegung) return k
  const { verlegung: _v, ...ohne } = k
  void _v
  return verlegung ? { ...ohne, verlegung } : ohne
}

function legeStelleAus(
  stelle: KomponentenWandstelle,
  glieder: readonly KomponentenObjekt[],
  zeichnung: Zeichnung,
): Map<string, KomponentenObjekt> {
  const u = einheit(stelle.richtung)
  const n = links(u)
  const ergebnis = new Map<string, KomponentenObjekt>()
  const mitHoehe = glieder.map((g) => ({ g: aufAktuellenFaktor(g), cm: hoeheCm(g, zeichnung) }))
  const hoehen = [...new Set(mitHoehe.map((x) => x.cm))].sort((a, b) => b - a)
  const alleStarts = glieder
    .map((g) => g.kombination?.reihenStart)
    .filter((s): s is number => s !== undefined)
  let tiefe = 0
  for (const [reihe, cm] of hoehen.entries()) {
    const inReihe = mitHoehe.filter((x) => x.cm === cm).map((x) => x.g)
    const ansaessig = inReihe.filter((g) => g.kombination?.hoeheCm === cm).sort(vergleicheLage)
    const zuzug = inReihe.filter((g) => g.kombination?.hoeheCm !== cm).sort(vergleicheLage)
    const kombis: KomponentenObjekt[][] = []
    let letzteNr: number | null = null
    for (const g of ansaessig) {
      const nr = g.kombination?.nr ?? 0
      if (nr !== letzteNr || kombis[kombis.length - 1].length >= KOMBINATION_MAX) {
        kombis.push([])
        letzteNr = nr
      }
      kombis[kombis.length - 1].push(g)
    }
    for (const g of zuzug) {
      const letzte = kombis[kombis.length - 1]
      if (!letzte || letzte.length >= KOMBINATION_MAX || stehtAllein(g)) kombis.push([g])
      else letzte.push(g)
    }
    const reihenStart =
      ansaessig[0]?.kombination?.reihenStart ??
      (alleStarts.length > 0 ? Math.min(...alleStarts) : -breiteEntlangWand(kombis[0][0]) / 2)
    let x = reihenStart
    let reihenTiefe = 0
    kombis.forEach((kombi, nr) => {
      const schritte = schritteVon(kombi[0])
      const verlegung = kombi[0].verlegung
      const abstand = reihe === 0 && verlegung !== 'in' ? AP_WANDABSTAND_METER : 0
      if (nr > 0) x += breiteEntlangWand(kombi[0], 0) / 2
      let a = 0
      const lokal = kombi.map((g) => {
        const w = breiteEntlangWand(g, einzelVon(g))
        const mitte = { a: a + w / 2, b: tiefeInDenRaum(g, einzelVon(g)) / 2 }
        a += w
        return mitte
      })
      const gedreht = lokal.map((p) => dreheViertel(p, schritte))
      const halbe = kombi.map((g) => ({
        a: breiteEntlangWand(g, schritte + einzelVon(g)) / 2,
        b: tiefeInDenRaum(g, schritte + einzelVon(g)) / 2,
      }))
      const aVon = Math.min(...gedreht.map((p, i) => p.a - halbe[i].a))
      const aBis = Math.max(...gedreht.map((p, i) => p.a + halbe[i].a))
      const bVon = Math.min(...gedreht.map((p, i) => p.b - halbe[i].b))
      const bBis = Math.max(...gedreht.map((p, i) => p.b + halbe[i].b))
      kombi.forEach((g, platz) => {
        const entlang = x + gedreht[platz].a - aVon
        const quer = tiefe + abstand + gedreht[platz].b - bVon
        const letzte = nr === kombis.length - 1 && platz === kombi.length - 1
        ergebnis.set(g.id, {
          ...mitVerlegung(g, verlegung),
          wandstelle: stelle,
          position: {
            x: stelle.punkt.x + u.x * entlang + n.x * quer,
            y: stelle.punkt.y + u.y * entlang + n.y * quer,
          },
          drehung: normiereWinkel(
            stelle.richtung + Math.PI + ((schritte + einzelVon(g)) * Math.PI) / 2,
          ),
          kombination: {
            nr,
            platz,
            hoeheCm: cm,
            reihenStart,
            ...(letzte ? { reihenEnde: true } : {}),
            ...(schritte ? { drehungSchritte: schritte } : {}),
            ...(einzelVon(g) ? { drehungEinzeln: einzelVon(g) } : {}),
          },
        })
      })
      x += aBis - aVon
      reihenTiefe = Math.max(reihenTiefe, abstand + bBis - bVon)
    })
    tiefe += reihenTiefe + REIHEN_ABSTAND_METER
  }
  return ergebnis
}

function fuehreEndenNach(objekte: Objekt[], ids: ReadonlySet<string>): Objekt[] {
  const komponenten = new Map<string, KomponentenObjekt>()
  for (const o of objekte) if (o.type === 'komponente' && ids.has(o.id)) komponenten.set(o.id, o)
  const dockpunkt = (objektId: string, index: number): Point | undefined => {
    const k = komponenten.get(objektId)
    return k ? getDockpoints(k)[index] : undefined
  }
  return objekte.map((o) => {
    if (o.type === 'leitung') return leitungNachgefuehrt(o, dockpunkt)
    if (o.type === 'trunk') return trunkNachgefuehrt(o, dockpunkt)
    return o
  })
}

type DockpunktFn = (objektId: string, index: number) => Point | undefined

function leitungNachgefuehrt(l: LeitungsObjekt, dockpunkt: DockpunktFn): LeitungsObjekt {
  let segmente = l.pfadSegmente
  const start = l.start.art === 'dock' ? dockpunkt(l.start.objektId, l.start.dockpunktIndex) : null
  if (start && segmente[0]?.length) {
    segmente = segmente.map((s, i) => (i === 0 ? setzeEnde(s, start, true) : s))
  }
  const ziel = l.ziel.art === 'dock' ? dockpunkt(l.ziel.objektId, l.ziel.dockpunktIndex) : null
  const letzter = segmente.length - 1
  if (ziel && segmente[letzter]?.length) {
    segmente = segmente.map((s, i) => (i === letzter ? setzeEnde(s, ziel, false) : s))
  }
  return segmente === l.pfadSegmente ? l : { ...l, pfadSegmente: segmente }
}

function trunkNachgefuehrt(t: TrunkObjekt, dockpunkt: DockpunktFn): TrunkObjekt {
  let wegpunkte = t.wegpunkte
  t.enden.forEach((ende, i) => {
    if (!ende.dockRef) return
    const p = dockpunkt(ende.dockRef.objektId, ende.dockRef.dockpunktIndex)
    if (!p) return
    const index = i === 0 ? 0 : wegpunkte.length - 1
    if (distance(wegpunkte[index], p) < EPS) return
    wegpunkte = wegpunkte.map((w, j) => (j === index ? p : w))
  })
  return wegpunkte === t.wegpunkte ? t : { ...t, wegpunkte }
}

function setzeEnde(pfad: Point[], p: Point, amAnfang: boolean): Point[] {
  const i = amAnfang ? 0 : pfad.length - 1
  const alt = pfad[i]
  if (distance(alt, p) < EPS) return pfad
  if (pfad.length < 2) return [p]
  const nachbar = pfad[amAnfang ? 1 : pfad.length - 2]
  let ecke: Point | null = null
  if (Math.abs(alt.y - nachbar.y) < EPS) ecke = { x: p.x, y: nachbar.y }
  else if (Math.abs(alt.x - nachbar.x) < EPS) ecke = { x: nachbar.x, y: p.y }
  const neu = ecke && distance(ecke, p) > EPS ? [p, ecke] : [p]
  return amAnfang ? [...neu, ...pfad.slice(1)] : [...pfad.slice(0, -1), ...neu.reverse()]
}

interface ReihenSpanne {
  von: number
  bis: number
}

function spanneVon(
  stelle: KomponentenWandstelle,
  glieder: readonly KomponentenObjekt[],
): ReihenSpanne {
  const u = einheit(stelle.richtung)
  let von = Infinity
  let bis = -Infinity
  for (const g of glieder) {
    const s = dot({ x: g.position.x - stelle.punkt.x, y: g.position.y - stelle.punkt.y }, u)
    const w = breiteEntlangWand(g) / 2
    von = Math.min(von, s - w)
    bis = Math.max(bis, s + w)
  }
  return { von, bis }
}

function gleicheFlaeche(treffer: WandflaechenTreffer, stelle: KomponentenWandstelle): boolean {
  if (treffer.wandId !== null)
    return stelle.wandId === treffer.wandId && stelle.seite === treffer.seite
  if (stelle.wandId !== null) return false
  if (Math.abs(normiereWinkel(stelle.richtung - treffer.richtung)) > 0.02) return false
  const n = links(einheit(stelle.richtung))
  const quer = dot(
    { x: treffer.fusspunkt.x - stelle.punkt.x, y: treffer.fusspunkt.y - stelle.punkt.y },
    n,
  )
  return Math.abs(quer) < 0.01
}

export interface WandEinordnung {
  komponente: KomponentenObjekt
  objekte: Objekt[]
}

export function ordneAnWandEin(
  objekte: readonly Objekt[],
  komponente: KomponentenObjekt,
  treffer: WandflaechenTreffer,
  zeichnung: Zeichnung,
  drehungSchritte = schritteVon(komponente),
): WandEinordnung {
  const zielCm = treffer.kombinationHoeheCm
  const k0 = verkleinert(
    zielCm !== undefined && hoeheCm(komponente, zeichnung) !== zielCm
      ? aufReihe(komponente, zielCm)
      : komponente,
  )
  const eigene = ((drehungSchritte % 4) + 4) % 4
  const nurKombi = (schritte: number) => (schritte ? { drehungSchritte: schritte } : {})
  const einzeln = einzelVon(komponente)
  const mit = (schritte: number) => ({
    ...nurKombi(schritte),
    ...(einzeln ? { drehungEinzeln: einzeln } : {}),
  })
  const w = breiteEntlangWand(k0, eigene + einzeln)
  const cm = hoeheCm(k0, zeichnung)
  const traeger = stehtAllein(k0)

  const stellen = new Map<string, KomponentenObjekt[]>()
  for (const o of objekte) {
    if (o.type !== 'komponente' || !o.wandstelle || o.id === komponente.id) continue
    if (!gleicheFlaeche(treffer, o.wandstelle)) continue
    const liste = stellen.get(o.wandstelle.id)
    if (liste) liste.push(o)
    else stellen.set(o.wandstelle.id, [o])
  }

  let ziel: {
    stelle: KomponentenWandstelle
    glieder: KomponentenObjekt[]
    s: number
    spanne: ReihenSpanne
  } | null = null
  let zielAbstand = Infinity
  for (const glieder of stellen.values()) {
    const stelle = glieder[0].wandstelle!
    const u = einheit(stelle.richtung)
    const s = dot(
      { x: treffer.fusspunkt.x - stelle.punkt.x, y: treffer.fusspunkt.y - stelle.punkt.y },
      u,
    )
    const spanne = spanneVon(stelle, glieder)
    const abstand = s < spanne.von ? spanne.von - s : s > spanne.bis ? s - spanne.bis : 0
    if (abstand <= w && abstand < zielAbstand) {
      ziel = { stelle, glieder, s, spanne }
      zielAbstand = abstand
    }
  }

  let eingeordnet: KomponentenObjekt
  let verankert: KomponentenObjekt | null = null
  let tauschPartner: KomponentenObjekt | null = null

  const neueStelle = (reihenStartAbFuss: number): KomponentenObjekt => ({
    ...k0,
    wandstelle: {
      id: erzeugeId('wandstelle'),
      wandId: treffer.wandId,
      t: treffer.t,
      seite: treffer.seite,
      punkt: treffer.fusspunkt,
      richtung: treffer.richtung,
    },
    kombination: { nr: 0, platz: 0, hoeheCm: cm, reihenStart: reihenStartAbFuss, ...mit(eigene) },
  })

  if (!ziel) {
    eingeordnet = neueStelle(-w / 2)
  } else if (traeger || ziel.glieder.some((g) => stehtAllein(g))) {
    const mitte = (ziel.spanne.von + ziel.spanne.bis) / 2
    const luecke = w / 2
    const start =
      ziel.s >= mitte ? ziel.spanne.bis + luecke - ziel.s : ziel.spanne.von - luecke - w - ziel.s
    eingeordnet = neueStelle(start)
  } else {
    const { stelle, glieder, s } = ziel
    const reihe = glieder.filter((g) => hoeheCm(g, zeichnung) === cm).sort(vergleicheLage)
    const eigeneReihe =
      komponente.wandstelle?.id === stelle.id && komponente.kombination?.hoeheCm === cm
    const partner =
      eigeneReihe && treffer.komponenteId
        ? reihe.find(
            (g) =>
              g.id === treffer.komponenteId && g.kombination!.nr === komponente.kombination!.nr,
          )
        : undefined
    if (partner) {
      const alt = komponente.kombination!
      tauschPartner = {
        ...partner,
        kombination: { ...partner.kombination!, nr: alt.nr, platz: alt.platz },
      }
      eingeordnet = {
        ...k0,
        wandstelle: stelle,
        kombination: {
          nr: partner.kombination!.nr,
          platz: partner.kombination!.platz,
          hoeheCm: cm,
          reihenStart: partner.kombination!.reihenStart,
          ...mit(schritteVon(partner)),
        },
      }
    } else if (reihe.length === 0) {
      const starts = glieder.map((g) => g.kombination?.reihenStart ?? 0)
      eingeordnet = {
        ...k0,
        wandstelle: stelle,
        kombination: {
          nr: 0,
          platz: 0,
          hoeheCm: cm,
          reihenStart: Math.min(...starts),
          ...mit(eigene),
        },
      }
    } else {
      const spanne = spanneVon(stelle, reihe)
      const reihenStart = reihe[0].kombination!.reihenStart
      const u = einheit(stelle.richtung)
      const lage = (g: KomponentenObjekt) =>
        dot({ x: g.position.x - stelle.punkt.x, y: g.position.y - stelle.punkt.y }, u)
      const ersteLinks = (kombi: KomponentenObjekt[]) => {
        const a = lage(kombi[0])
        const b = lage(kombi[kombi.length - 1])
        return a < b - EPS ? true : a > b + EPS ? false : null
      }
      let kombination: KomponentenKombination
      if (s > spanne.von + EPS && s < spanne.bis - EPS) {
        const naechste = reihe.reduce((a, b) =>
          Math.abs(lage(b) - s) < Math.abs(lage(a) - s) ? b : a,
        )
        const kombi = reihe.filter((g) => g.kombination!.nr === naechste.kombination!.nr)
        const links = s < lage(naechste)
        const davor = ersteLinks(kombi) === false ? !links : links
        kombination = {
          nr: naechste.kombination!.nr,
          platz: naechste.kombination!.platz + (davor ? -0.5 : 0.5),
          hoeheCm: cm,
          reihenStart,
          ...mit(schritteVon(naechste)),
        }
      } else {
        const nachRechts = s >= (spanne.von + spanne.bis) / 2
        const zielNr = nachRechts
          ? reihe[reihe.length - 1].kombination!.nr
          : reihe[0].kombination!.nr
        const kombi = reihe.filter((g) => g.kombination!.nr === zielNr)
        if (kombi.length >= KOMBINATION_MAX) {
          kombination = {
            nr: nachRechts ? zielNr + 1 : zielNr - 1,
            platz: 0,
            hoeheCm: cm,
            reihenStart,
            ...mit(eigene),
          }
        } else {
          const erste = kombi[0]
          const letzte = kombi[kombi.length - 1]
          const el = ersteLinks(kombi)
          const hinten = el === null ? nachRechts : nachRechts === el
          kombination = {
            nr: zielNr,
            platz: hinten ? letzte.kombination!.platz + 1 : erste.kombination!.platz - 1,
            hoeheCm: cm,
            reihenStart,
            ...mit(schritteVon(erste)),
          }
        }
      }
      const vorbild = reihe.find(
        (g) => g.kombination!.nr === kombination.nr && g.id !== komponente.id,
      )
      eingeordnet = {
        ...mitVerlegung(k0, vorbild ? vorbild.verlegung : k0.verlegung),
        wandstelle: stelle,
        kombination,
      }
      verankert = eigeneReihe ? null : reihe[0]
    }
  }

  const vorhanden = objekte.some((o) => o.id === komponente.id)
  const virtuell = objekte.map((o) =>
    o.id === komponente.id ? eingeordnet : o.id === tauschPartner?.id ? tauschPartner : o,
  )
  if (!vorhanden) virtuell.push(eingeordnet)
  let geordnet = ordneWandstellen(virtuell, zeichnung)
  if (verankert) {
    const anker = verankert
    const nachher = geordnet.find((o) => o.id === anker.id)
    const stelle = eingeordnet.wandstelle!
    const u = einheit(stelle.richtung)
    const versatz =
      nachher?.type === 'komponente'
        ? dot(
            { x: nachher.position.x - anker.position.x, y: nachher.position.y - anker.position.y },
            u,
          )
        : 0
    if (Math.abs(versatz) > EPS) {
      const reihenCm = eingeordnet.kombination!.hoeheCm
      geordnet = ordneWandstellen(
        geordnet.map((o) =>
          o.type === 'komponente' &&
          o.wandstelle?.id === stelle.id &&
          o.kombination?.hoeheCm === reihenCm
            ? {
                ...o,
                kombination: { ...o.kombination, reihenStart: o.kombination.reihenStart - versatz },
              }
            : o,
        ),
        zeichnung,
      )
    }
  }
  const ergebnis = geordnet.find((o) => o.id === komponente.id)
  return {
    komponente: ergebnis?.type === 'komponente' ? ergebnis : eingeordnet,
    objekte: geordnet,
  }
}

export function verschiebeWandstelle(
  objekte: readonly Objekt[],
  stelleId: string,
  delta: Point,
  treffer: WandflaechenTreffer | null,
  zeichnung: Zeichnung,
): Objekt[] {
  const neu = objekte.map((o) => {
    if (o.type !== 'komponente' || o.wandstelle?.id !== stelleId) return o
    const alt = o.wandstelle
    const wandstelle: KomponentenWandstelle = treffer
      ? {
          id: alt.id,
          wandId: treffer.wandId,
          t: treffer.t,
          seite: treffer.seite,
          punkt: treffer.fusspunkt,
          richtung: treffer.richtung,
        }
      : {
          ...alt,
          wandId: null,
          t: null,
          punkt: { x: alt.punkt.x + delta.x, y: alt.punkt.y + delta.y },
        }
    return { ...o, wandstelle }
  })
  return ordneWandstellen(neu, zeichnung)
}

export function gliederDerWandstelle(
  objekte: readonly Objekt[],
  stelleId: string,
): KomponentenObjekt[] {
  return objekte.filter(
    (o): o is KomponentenObjekt => o.type === 'komponente' && o.wandstelle?.id === stelleId,
  )
}

export function wandpunktVon(k: KomponentenObjekt): Point | null {
  if (!k.wandstelle) return null
  const u = einheit(k.wandstelle.richtung)
  const s = dot(
    { x: k.position.x - k.wandstelle.punkt.x, y: k.position.y - k.wandstelle.punkt.y },
    u,
  )
  return { x: k.wandstelle.punkt.x + u.x * s, y: k.wandstelle.punkt.y + u.y * s }
}

export function raumrichtungVon(k: KomponentenObjekt): Point | null {
  return k.wandstelle ? links(einheit(k.wandstelle.richtung)) : null
}

export function dreheKombinationen(objekte: Objekt[], ids: ReadonlySet<string>): Objekt[] {
  const schluessel = (k: KomponentenObjekt) =>
    `${k.wandstelle!.id}|${k.kombination!.hoeheCm}|${k.kombination!.nr}`
  const betroffen = new Set<string>()
  for (const o of objekte) {
    if (o.type === 'komponente' && ids.has(o.id) && o.wandstelle && o.kombination) {
      betroffen.add(schluessel(o))
    }
  }
  if (betroffen.size === 0) return objekte
  return objekte.map((o) => {
    if (o.type !== 'komponente' || !o.wandstelle || !o.kombination) return o
    if (!betroffen.has(schluessel(o))) return o
    const schritte = (schritteVon(o) + 1) % 4
    const { drehungSchritte: _d, ...kombination } = o.kombination
    void _d
    return {
      ...o,
      kombination: schritte ? { ...kombination, drehungSchritte: schritte } : kombination,
    }
  })
}

export function kombinationsRahmen(
  objekt: KomponentenObjekt,
  alle: readonly Objekt[],
): Point[] | null {
  const k = objekt.kombination
  const stelle = objekt.wandstelle
  if (!k || !stelle || stehtAllein(objekt)) return null
  const kombi = alle.filter(
    (o): o is KomponentenObjekt =>
      o.type === 'komponente' &&
      o.wandstelle?.id === stelle.id &&
      o.kombination?.hoeheCm === k.hoeheCm &&
      o.kombination.nr === k.nr,
  )
  if (kombi.length < 2) return null
  const erste = kombi.reduce((a, b) => (b.kombination!.platz < a.kombination!.platz ? b : a))
  if (erste.id !== objekt.id) return null
  const u = einheit(stelle.richtung)
  const n = links(u)
  let sVon = Infinity
  let sBis = -Infinity
  let qVon = Infinity
  let qBis = -Infinity
  for (const g of kombi) {
    const v = { x: g.position.x - stelle.punkt.x, y: g.position.y - stelle.punkt.y }
    const s = dot(v, u)
    const q = dot(v, n)
    const w = breiteEntlangWand(g) / 2
    const h = tiefeInDenRaum(g) / 2
    sVon = Math.min(sVon, s - w)
    sBis = Math.max(sBis, s + w)
    qVon = Math.min(qVon, q - h)
    qBis = Math.max(qBis, q + h)
  }
  const r = RAHMEN_ABSTAND_METER
  const ecke = (s: number, q: number): Point => ({
    x: stelle.punkt.x + u.x * s + n.x * q,
    y: stelle.punkt.y + u.y * s + n.y * q,
  })
  return [
    ecke(sVon - r, qVon - r),
    ecke(sBis + r, qVon - r),
    ecke(sBis + r, qBis + r),
    ecke(sVon - r, qBis + r),
  ]
}

export function dreheElemente(objekte: Objekt[], ids: ReadonlySet<string>): Objekt[] {
  return objekte.map((o) => {
    if (o.type !== 'komponente' || !ids.has(o.id) || !o.wandstelle || !o.kombination) return o
    const schritte = (einzelVon(o) + 1) % 4
    const { drehungEinzeln: _e, ...kombination } = o.kombination
    void _e
    return {
      ...o,
      kombination: schritte ? { ...kombination, drehungEinzeln: schritte } : kombination,
    }
  })
}

export function findeKombinationUnter(
  objekte: readonly Objekt[],
  punkt: Point,
  toleranz: number,
  ohne: ReadonlySet<string> = new Set(),
): WandflaechenTreffer | null {
  let bester: WandflaechenTreffer | null = null
  for (const o of objekte) {
    if (o.type !== 'komponente' || !o.wandstelle || !o.kombination || ohne.has(o.id)) continue
    if (stehtAllein(o)) continue
    const stelle = o.wandstelle
    const u = einheit(stelle.richtung)
    const n = links(u)
    const v = { x: punkt.x - o.position.x, y: punkt.y - o.position.y }
    const abstand = Math.max(
      0,
      Math.abs(dot(v, u)) - breiteEntlangWand(o) / 2,
      Math.abs(dot(v, n)) - tiefeInDenRaum(o) / 2,
    )
    if (abstand > toleranz || (bester && abstand >= bester.abstand)) continue
    const s = dot({ x: punkt.x - stelle.punkt.x, y: punkt.y - stelle.punkt.y }, u)
    bester = {
      wandId: stelle.wandId,
      t: tEntlang(objekte, stelle, s),
      seite: stelle.seite,
      fusspunkt: { x: stelle.punkt.x + u.x * s, y: stelle.punkt.y + u.y * s },
      richtung: stelle.richtung,
      abstand,
      kombinationHoeheCm: o.kombination.hoeheCm,
      ...(abstand === 0 ? { komponenteId: o.id } : {}),
    }
  }
  return bester
}

function tEntlang(
  objekte: readonly Objekt[],
  stelle: KomponentenWandstelle,
  s: number,
): number | null {
  if (stelle.wandId === null || stelle.t === null) return null
  const wand = objekte.find((o): o is WandObjekt => o.type === 'wand' && o.id === stelle.wandId)
  const laenge = wand ? pfadGesamtLaenge(wand.punkte) : 0
  if (laenge === 0) return stelle.t
  return Math.max(0, Math.min(1, stelle.t + (stelle.seite * s) / laenge))
}

export function verschiebePlatz(objekte: Objekt[], id: string, richtung: 1 | -1): Objekt[] {
  const k = objekte.find((o): o is KomponentenObjekt => o.type === 'komponente' && o.id === id)
  if (!k?.wandstelle || !k.kombination) return objekte
  const nachbar = nachbarImPlatz(objekte, k, richtung)
  if (!nachbar) return objekte
  return objekte.map((o) => {
    if (o.id === k.id)
      return { ...k, kombination: { ...k.kombination!, platz: nachbar.kombination!.platz } }
    if (o.id === nachbar.id)
      return { ...nachbar, kombination: { ...nachbar.kombination!, platz: k.kombination!.platz } }
    return o
  })
}

export function nachbarImPlatz(
  objekte: readonly Objekt[],
  k: KomponentenObjekt,
  richtung: 1 | -1,
): KomponentenObjekt | null {
  if (!k.wandstelle || !k.kombination) return null
  const { hoeheCm, nr, platz } = k.kombination
  return (
    objekte.find(
      (o): o is KomponentenObjekt =>
        o.type === 'komponente' &&
        o.wandstelle?.id === k.wandstelle!.id &&
        o.kombination?.hoeheCm === hoeheCm &&
        o.kombination.nr === nr &&
        o.kombination.platz === platz + richtung,
    ) ?? null
  )
}

export function kombinierbarkeitNachziehen(
  alt: KomponentenObjekt,
  kombinierbar: boolean | undefined,
): { patch: Partial<KomponentenObjekt>; basis: KomponentenObjekt } {
  const neu = kombinierbar === false ? false : undefined
  const loesen = alt.wandstelle !== undefined && (alt.kombinierbar === false) !== (neu === false)
  const basis = loesen ? ohneWandbindung(alt) : alt
  return {
    patch: {
      kombinierbar: neu,
      ...(loesen
        ? { wandstelle: undefined, kombination: undefined, kombinationsFaktor: undefined }
        : {}),
    },
    basis,
  }
}
