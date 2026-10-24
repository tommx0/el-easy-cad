import type {
  BoundingBox,
  Ebene,
  KomponentenObjekt,
  Objekt,
  Point,
  PotentialObjekt,
  SchaltverbindungAnschluss,
  Zeichnungsart,
} from '../document-model'
import {
  erzeugeId,
  boundingBoxFromPoints,
  boundingBoxUeberlappt,
  getBoundingBox,
  getDockpoints,
  getFangpunkt,
  istAufgesetztesModul,
  istBearbeitbar,
  positionFuerFangpunkt,
  unionBoundingBox,
} from '../document-model'
import { ROUTING_ZELLGROESSE_METER } from '../routing'
import type { KammAuftrag } from './kamm-verdrahtung'
import { verlegeKammKanal, zaehleKammBahnen } from './kamm-verdrahtung'
import { ermittleNetze } from './verdrahtung'

export const NOETIG_BAHNEN = 2
export const NOETIG_SYMBOLE = 0.5
const ENG_MINDESTENS_BAHNEN = 1.5
const TRUNK_SCHILD_RAUM_METER = 0.3
export const BAUPLAN_RASTER_METER = ROUTING_ZELLGROESSE_METER
const VERKLEINERUNG_STUFEN = [1, 0.75, 0.5, 0.25]
const FLUCHT_TOLERANZ_METER = 0.01
const KANTEN_TOLERANZ_METER = 0.02
const SORTIER_DURCHGAENGE = 6
const VERTAUSCH_RUNDEN = 20

export interface AnordnenVariante {
  richtung: 'oben-unten' | 'links-rechts'
  wurzel: 'oben' | 'abgaenge' | 'mitte'
  reihenfolge: 'lage' | 'optimiert'
  seitlich: boolean
  trunks: boolean
  abstandFaktor: number
}

export const ERSTE_FASSUNG: AnordnenVariante = {
  richtung: 'oben-unten',
  wurzel: 'oben',
  reihenfolge: 'lage',
  seitlich: false,
  trunks: false,
  abstandFaktor: 1,
}

type Rahmen = (p: Point) => Point

const GLEICH: Rahmen = (p) => p
const GESPIEGELT: Rahmen = (p) => ({ x: -p.y, y: -p.x })

function boxImRahmen(bb: BoundingBox, f: Rahmen): BoundingBox {
  return boundingBoxFromPoints([f(bb.min), f(bb.max)])
}

type KnotenObjekt = KomponentenObjekt | PotentialObjekt

interface Knoten {
  id: string
  objekt: KnotenObjekt
  weltBox: BoundingBox
  box: BoundingBox
  breite: number
  hoehe: number
  versatz: Point
  symbolVersatz: Point
  symbolBreite: number
  symbolHoehe: number
}

interface Kontakt {
  von: Point | null
  zu: Point | null
}

type Kanten = Map<string, Map<string, Kontakt[]>>

function ermittleKnoten(
  objekte: readonly Objekt[],
  auswahlIds: ReadonlySet<string>,
  ebenen: readonly Ebene[],
  f: Rahmen,
  beschriftungen: Readonly<Record<string, BoundingBox>> = {},
): Map<string, Knoten> {
  const knoten = new Map<string, Knoten>()
  const mitteVon = (bb: BoundingBox) => ({
    x: (bb.min.x + bb.max.x) / 2,
    y: (bb.min.y + bb.max.y) / 2,
  })
  for (const o of objekte) {
    if (!auswahlIds.has(o.id) || !istBearbeitbar(o, ebenen)) continue
    if (o.type === 'komponente' && (istAufgesetztesModul(o) || o.wandstelle)) continue
    if (o.type !== 'komponente' && o.type !== 'potential') continue
    const symbolWelt = getBoundingBox(o)
    const text = beschriftungen[o.id]
    const weltBox = text
      ? unionBoundingBox(symbolWelt, verschobeneBox(text, o.position.x, o.position.y))
      : symbolWelt
    const box = boxImRahmen(weltBox, f)
    const symbol = boxImRahmen(symbolWelt, f)
    const position = f(o.position)
    const mitte = mitteVon(box)
    const symbolMitte = mitteVon(symbol)
    knoten.set(o.id, {
      id: o.id,
      objekt: o,
      weltBox,
      box,
      breite: box.max.x - box.min.x,
      hoehe: box.max.y - box.min.y,
      versatz: { x: position.x - mitte.x, y: position.y - mitte.y },
      symbolVersatz: { x: position.x - symbolMitte.x, y: position.y - symbolMitte.y },
      symbolBreite: symbol.max.x - symbol.min.x,
      symbolHoehe: symbol.max.y - symbol.min.y,
    })
  }
  return knoten
}

export function zaehleKnoten(
  objekte: readonly Objekt[],
  auswahlIds: ReadonlySet<string>,
  ebenen: readonly Ebene[],
): Set<string> {
  return new Set(ermittleKnoten(objekte, auswahlIds, ebenen, GLEICH).keys())
}

function knotenVon(
  id: string,
  knoten: ReadonlyMap<string, Knoten>,
  nachId: ReadonlyMap<string, Objekt>,
): Knoten | null {
  const direkt = knoten.get(id)
  if (direkt) return direkt
  const o = nachId.get(id)
  if (o && istAufgesetztesModul(o)) return knoten.get(o.traegerId) ?? null
  return null
}

interface Ende {
  knoten: Knoten
  kontakt: Point | null
}

function dockEnde(
  objektId: string,
  index: number,
  knoten: ReadonlyMap<string, Knoten>,
  nachId: ReadonlyMap<string, Objekt>,
  f: Rahmen,
): Ende[] {
  const k = knotenVon(objektId, knoten, nachId)
  const o = nachId.get(objektId)
  if (!k || o?.type !== 'komponente') return []
  const punkt = getDockpoints(o)[index]
  if (!punkt) return [{ knoten: k, kontakt: null }]
  const relativ = { x: punkt.x - k.objekt.position.x, y: punkt.y - k.objekt.position.y }
  return [{ knoten: k, kontakt: f(relativ) }]
}

function schaltEnden(
  anschluss: SchaltverbindungAnschluss,
  knoten: ReadonlyMap<string, Knoten>,
  nachId: ReadonlyMap<string, Objekt>,
  f: Rahmen,
  tiefe = 0,
): Ende[] {
  if (anschluss.art === 'dock') {
    return dockEnde(anschluss.objektId, anschluss.dockpunktIndizes[0], knoten, nachId, f)
  }
  if (anschluss.art === 'potential') {
    const k = knoten.get(anschluss.objektId)
    return k ? [{ knoten: k, kontakt: { x: 0, y: 0 } }] : []
  }
  if (anschluss.art === 'schaltverbindung' && tiefe === 0) {
    const sammel = nachId.get(anschluss.objektId)
    if (sammel?.type !== 'schaltverbindung') return []
    return [sammel.start, sammel.ziel]
      .flatMap((a) => schaltEnden(a, knoten, nachId, f, 1))
      .map((e) => ({ ...e, kontakt: null }))
  }
  if (anschluss.art === 'knoten' && tiefe === 0) {
    const ids = anschluss.objektId
    return [...nachId.values()]
      .flatMap((o) =>
        o.type !== 'schaltverbindung'
          ? []
          : o.start.art === 'knoten' && o.start.objektId === ids
            ? [o.ziel]
            : o.ziel.art === 'knoten' && o.ziel.objektId === ids
              ? [o.start]
              : [],
      )
      .flatMap((a) => schaltEnden(a, knoten, nachId, f, 1))
      .map((e) => ({ ...e, kontakt: null }))
  }
  return []
}

function verbindungsEnden(
  o: Objekt,
  knoten: ReadonlyMap<string, Knoten>,
  nachId: ReadonlyMap<string, Objekt>,
  f: Rahmen,
): { start: Ende[]; ziel: Ende[] } | null {
  if (o.type === 'leitung') {
    return {
      start:
        o.start.art === 'dock'
          ? dockEnde(o.start.objektId, o.start.dockpunktIndex, knoten, nachId, f)
          : [],
      ziel:
        o.ziel.art === 'dock'
          ? dockEnde(o.ziel.objektId, o.ziel.dockpunktIndex, knoten, nachId, f)
          : [],
    }
  }
  if (o.type === 'schaltverbindung') {
    return {
      start: schaltEnden(o.start, knoten, nachId, f),
      ziel: schaltEnden(o.ziel, knoten, nachId, f),
    }
  }
  return null
}

function ermittleKanten(
  objekte: readonly Objekt[],
  knoten: ReadonlyMap<string, Knoten>,
  nachId: ReadonlyMap<string, Objekt>,
  f: Rahmen,
): Kanten {
  const kanten: Kanten = new Map()
  const fuegeHinzu = (a: Ende, b: Ende) => {
    if (a.knoten.id === b.knoten.id) return
    for (const [x, y, kontakt] of [
      [a, b, { von: a.kontakt, zu: b.kontakt }],
      [b, a, { von: b.kontakt, zu: a.kontakt }],
    ] as const) {
      const nachbarn = kanten.get(x.knoten.id) ?? new Map<string, Kontakt[]>()
      nachbarn.set(y.knoten.id, [...(nachbarn.get(y.knoten.id) ?? []), kontakt])
      kanten.set(x.knoten.id, nachbarn)
    }
  }
  for (const o of objekte) {
    const enden = verbindungsEnden(o, knoten, nachId, f)
    if (!enden) continue
    for (const x of enden.start) for (const y of enden.ziel) fuegeHinzu(x, y)
  }
  return kanten
}

const mitteX = (k: Knoten) => (k.box.min.x + k.box.max.x) / 2
const mitteY = (k: Knoten) => (k.box.min.y + k.box.max.y) / 2

function ermittleGruppen(knoten: ReadonlyMap<string, Knoten>, kanten: Kanten): Knoten[][] {
  const gesehen = new Set<string>()
  const gruppen: Knoten[][] = []
  for (const k of knoten.values()) {
    if (gesehen.has(k.id) || !kanten.has(k.id)) continue
    const gruppe: Knoten[] = []
    const offen = [k.id]
    gesehen.add(k.id)
    while (offen.length > 0) {
      const id = offen.pop()!
      gruppe.push(knoten.get(id)!)
      for (const n of kanten.get(id)?.keys() ?? []) {
        if (!gesehen.has(n)) {
          gesehen.add(n)
          offen.push(n)
        }
      }
    }
    gruppen.push(gruppe)
  }
  const links = (g: Knoten[]) => Math.min(...g.map((k) => k.box.min.x))
  return gruppen.sort((a, b) => links(a) - links(b))
}

function abstaende(start: string, kanten: Kanten): Map<string, number> {
  const abstand = new Map([[start, 0]])
  const offen = [start]
  for (let i = 0; i < offen.length; i++) {
    for (const n of kanten.get(offen[i])?.keys() ?? []) {
      if (abstand.has(n)) continue
      abstand.set(n, abstand.get(offen[i])! + 1)
      offen.push(n)
    }
  }
  return abstand
}

function waehleWurzel(gruppe: Knoten[], kanten: Kanten, art: AnordnenVariante['wurzel']): Knoten {
  const oben = (a: Knoten, b: Knoten) => mitteY(b) - mitteY(a) || mitteX(a) - mitteX(b)
  const grad = (k: Knoten) => kanten.get(k.id)?.size ?? 0
  if (art === 'oben') return [...gruppe].sort(oben)[0]
  if (art === 'abgaenge') return [...gruppe].sort((a, b) => grad(b) - grad(a) || oben(a, b))[0]
  const exzentrizitaet = new Map(
    gruppe.map((k) => [k.id, Math.max(...abstaende(k.id, kanten).values())]),
  )
  return [...gruppe].sort(
    (a, b) =>
      exzentrizitaet.get(a.id)! - exzentrizitaet.get(b.id)! || grad(b) - grad(a) || oben(a, b),
  )[0]
}

function ermittleStufen(gruppe: Knoten[], kanten: Kanten, variante: AnordnenVariante): string[][] {
  const wurzel = waehleWurzel(gruppe, kanten, variante.wurzel)
  const nachId = new Map(gruppe.map((k) => [k.id, k]))
  const stufe = new Map([[wurzel.id, 0]])
  const offen = [wurzel.id]
  for (let i = 0; i < offen.length; i++) {
    const id = offen[i]
    const nachbarn = [...(kanten.get(id)?.keys() ?? [])]
    if (variante.reihenfolge === 'lage')
      nachbarn.sort((a, b) => mitteX(nachId.get(a)!) - mitteX(nachId.get(b)!))
    for (const n of nachbarn) {
      if (stufe.has(n)) continue
      stufe.set(n, stufe.get(id)! + 1)
      offen.push(n)
    }
  }
  const stufen: string[][] = []
  for (const id of offen) (stufen[stufe.get(id)!] ??= []).push(id)
  if (variante.reihenfolge === 'lage') {
    for (const reihe of stufen)
      reihe.sort((a, b) => mitteX(nachId.get(a)!) - mitteX(nachId.get(b)!))
  }
  return stufen
}

function kontaktAnteil(k: Knoten, kontakt: Point | null): number {
  if (!kontakt || k.symbolBreite <= 0) return 0
  return Math.max(-0.45, Math.min(0.45, (k.symbolVersatz.x + kontakt.x) / k.symbolBreite))
}

function kreuzungen(
  stufen: string[][],
  kanten: Kanten,
  knoten: ReadonlyMap<string, Knoten>,
): number {
  let summe = 0
  for (let s = 0; s < stufen.length - 1; s++) {
    const unten = new Map(stufen[s + 1].map((id, i) => [id, i]))
    const paare: [number, number][] = []
    stufen[s].forEach((id, i) => {
      for (const [n, kontakte] of kanten.get(id) ?? []) {
        const j = unten.get(n)
        if (j === undefined) continue
        for (const k of kontakte) {
          paare.push([
            i + kontaktAnteil(knoten.get(id)!, k.von),
            j + kontaktAnteil(knoten.get(n)!, k.zu),
          ])
        }
      }
    })
    for (let a = 0; a < paare.length; a++) {
      for (let b = a + 1; b < paare.length; b++) {
        if ((paare[a][0] - paare[b][0]) * (paare[a][1] - paare[b][1]) < 0) summe++
      }
    }
  }
  return summe
}

function sortiereNachSchwerpunkt(
  reihe: string[],
  bezug: string[],
  kanten: Kanten,
  knoten: ReadonlyMap<string, Knoten>,
): string[] {
  const platz = new Map(bezug.map((id, i) => [id, i]))
  const schluessel = new Map(
    reihe.map((id, i) => {
      const plaetze: number[] = []
      for (const [n, kontakte] of kanten.get(id) ?? []) {
        const p = platz.get(n)
        if (p === undefined) continue
        for (const k of kontakte) plaetze.push(p + kontaktAnteil(knoten.get(n)!, k.zu))
      }
      return [id, plaetze.length > 0 ? plaetze.reduce((a, b) => a + b, 0) / plaetze.length : i]
    }),
  )
  const alt = new Map(reihe.map((id, i) => [id, i]))
  return [...reihe].sort(
    (a, b) => schluessel.get(a)! - schluessel.get(b)! || alt.get(a)! - alt.get(b)!,
  )
}

function waehleEltern(
  id: string,
  platz: ReadonlyMap<string, number>,
  kanten: Kanten,
): string | undefined {
  const eltern = [...(kanten.get(id)?.keys() ?? [])]
    .filter((n) => platz.has(n))
    .sort((a, b) => platz.get(a)! - platz.get(b)!)
  return eltern[Math.floor((eltern.length - 1) / 2)]
}

function baumReihenfolge(
  stufen: string[][],
  kanten: Kanten,
  knoten: ReadonlyMap<string, Knoten>,
): string[][] {
  const ergebnis = [[...stufen[0]]]
  for (let s = 1; s < stufen.length; s++) {
    const platz = new Map(ergebnis[s - 1].map((id, i) => [id, i]))
    const vorher = new Map(stufen[s].map((id, i) => [id, i]))
    const schluessel = new Map(
      stufen[s].map((id) => {
        const e = waehleEltern(id, platz, kanten)
        if (e === undefined) return [id, Infinity]
        const kontakt = kanten.get(e)?.get(id)?.[0]?.von ?? null
        return [id, platz.get(e)! + kontaktAnteil(knoten.get(e)!, kontakt)]
      }),
    )
    ergebnis.push(
      [...stufen[s]].sort(
        (a, b) => schluessel.get(a)! - schluessel.get(b)! || vorher.get(a)! - vorher.get(b)!,
      ),
    )
  }
  return ergebnis
}

function minimiereKreuzungen(
  stufen: string[][],
  kanten: Kanten,
  knoten: ReadonlyMap<string, Knoten>,
): string[][] {
  let beste = baumReihenfolge(stufen, kanten, knoten)
  let besteZahl = kreuzungen(beste, kanten, knoten)
  let aktuell = beste.map((r) => [...r])
  for (let d = 0; d < SORTIER_DURCHGAENGE && besteZahl > 0; d++) {
    for (let s = 1; s < aktuell.length; s++)
      aktuell[s] = sortiereNachSchwerpunkt(aktuell[s], aktuell[s - 1], kanten, knoten)
    for (let s = aktuell.length - 2; s >= 0; s--)
      aktuell[s] = sortiereNachSchwerpunkt(aktuell[s], aktuell[s + 1], kanten, knoten)
    const zahl = kreuzungen(aktuell, kanten, knoten)
    if (zahl < besteZahl) {
      beste = aktuell.map((r) => [...r])
      besteZahl = zahl
    }
    aktuell = aktuell.map((r) => [...r])
  }
  for (let runde = 0; runde < VERTAUSCH_RUNDEN && besteZahl > 0; runde++) {
    let besser = false
    for (const reihe of beste) {
      for (let i = 0; i < reihe.length - 1; i++) {
        ;[reihe[i], reihe[i + 1]] = [reihe[i + 1], reihe[i]]
        const zahl = kreuzungen(beste, kanten, knoten)
        if (zahl < besteZahl) {
          besteZahl = zahl
          besser = true
        } else {
          ;[reihe[i], reihe[i + 1]] = [reihe[i + 1], reihe[i]]
        }
      }
    }
    if (!besser) break
  }
  return beste
}

type Kontur = [number, number][]

interface Teilbaum {
  x: Map<string, number>
  kontur: Kontur
}

function versatzRechts(a: Kontur, b: Kontur, abstand: number): number {
  let versatz = -Infinity
  for (let d = 0; d < Math.min(a.length, b.length); d++) {
    versatz = Math.max(versatz, a[d][1] + abstand - b[d][0])
  }
  return versatz === -Infinity ? 0 : versatz
}

function vereinige(a: Kontur, b: Kontur, versatzB: number): Kontur {
  const ergebnis: Kontur = []
  for (let d = 0; d < Math.max(a.length, b.length); d++) {
    const bv: [number, number] | undefined = b[d] && [b[d][0] + versatzB, b[d][1] + versatzB]
    if (a[d] && bv) ergebnis.push([Math.min(a[d][0], bv[0]), Math.max(a[d][1], bv[1])])
    else ergebnis.push((a[d] ?? bv)!)
  }
  return ergebnis
}

interface Flucht {
  eltern: string
  kontaktEltern: Point
  kontaktKind: Point
}

interface Baum {
  kinder: Map<string, string[]>
  kontaktPaar: Map<string, Flucht>
  flucht: Map<string, Flucht>
  seitlich: Map<string, { links?: string; rechts?: string }>
  seitFlucht: Map<string, Flucht>
}

function ersterKontakt(kanten: Kanten, eltern: string, kind: string) {
  return (kanten.get(eltern)?.get(kind) ?? [])
    .filter((k): k is { von: Point; zu: Point } => k.von !== null && k.zu !== null)
    .sort((a, b) => a.von.x - b.von.x)[0]
}

function baueBaum(
  stufen: string[][],
  kanten: Kanten,
  knoten: ReadonlyMap<string, Knoten>,
  seitlich: boolean,
): Baum {
  const kinder = new Map<string, string[]>()
  for (let s = 1; s < stufen.length; s++) {
    const platz = new Map(stufen[s - 1].map((id, i) => [id, i]))
    for (const id of stufen[s]) {
      const e = waehleEltern(id, platz, kanten)!
      kinder.set(e, [...(kinder.get(e) ?? []), id])
    }
  }
  const baum: Baum = {
    kinder,
    kontaktPaar: new Map(),
    flucht: new Map(),
    seitlich: new Map(),
    seitFlucht: new Map(),
  }

  if (seitlich) {
    const kanteSeite = (k: Knoten, kontakt: Point): -1 | 0 | 1 => {
      const relativ = k.symbolVersatz.x + kontakt.x
      if (relativ >= k.symbolBreite / 2 - KANTEN_TOLERANZ_METER) return 1
      if (relativ <= -k.symbolBreite / 2 + KANTEN_TOLERANZ_METER) return -1
      return 0
    }
    for (const [eltern, liste] of kinder) {
      const e = knoten.get(eltern)!
      const plaetze: { links?: string; rechts?: string } = {}
      for (const kind of liste) {
        if ((kinder.get(kind)?.length ?? 0) > 0 || (kanten.get(kind)?.size ?? 0) !== 1) continue
        const kontakt = ersterKontakt(kanten, eltern, kind)
        if (!kontakt) continue
        const seite = kanteSeite(e, kontakt.von)
        if (seite === 0 || kanteSeite(knoten.get(kind)!, kontakt.zu) !== -seite) continue
        const platz = seite === 1 ? 'rechts' : 'links'
        if (plaetze[platz]) continue
        plaetze[platz] = kind
        baum.seitFlucht.set(kind, {
          eltern,
          kontaktEltern: kontakt.von,
          kontaktKind: kontakt.zu,
        })
      }
      if (plaetze.links || plaetze.rechts) {
        baum.seitlich.set(eltern, plaetze)
        kinder.set(
          eltern,
          liste.filter((k) => k !== plaetze.links && k !== plaetze.rechts),
        )
      }
    }
  }

  for (const [eltern, liste] of kinder) {
    for (const kind of liste) {
      const kontakt = ersterKontakt(kanten, eltern, kind)
      if (kontakt) {
        baum.kontaktPaar.set(kind, { eltern, kontaktEltern: kontakt.von, kontaktKind: kontakt.zu })
      }
    }
  }
  return baum
}

function legeTeilbaumAus(
  id: string,
  baum: Baum,
  knoten: ReadonlyMap<string, Knoten>,
  abstand: number,
): Teilbaum {
  const k = knoten.get(id)!
  const seit = baum.seitlich.get(id)
  const x = new Map<string, number>()
  let eigeneLinks = -k.breite / 2
  let eigeneRechts = k.breite / 2
  if (seit?.rechts) {
    const s = knoten.get(seit.rechts)!
    x.set(seit.rechts, k.breite / 2 + abstand + s.breite / 2)
    eigeneRechts = k.breite / 2 + abstand + s.breite
  }
  if (seit?.links) {
    const s = knoten.get(seit.links)!
    x.set(seit.links, -(k.breite / 2 + abstand + s.breite / 2))
    eigeneLinks = -(k.breite / 2 + abstand + s.breite)
  }
  const eigene: [number, number] = [eigeneLinks, eigeneRechts]
  const kinder = baum.kinder.get(id) ?? []
  if (kinder.length === 0) {
    x.set(id, 0)
    return { x, kontur: [eigene] }
  }

  const teile = kinder.map((kind) => legeTeilbaumAus(kind, baum, knoten, abstand))
  const mindest = teile.slice(1).map((t, i) => versatzRechts(teile[i].kontur, t.kontur, abstand))
  const versatzBis = [0]
  for (const m of mindest) versatzBis.push(versatzBis[versatzBis.length - 1] + m)
  const gepackt = versatzBis.map((v) => v - versatzBis[versatzBis.length - 1] / 2)
  const ziel = kinder.map((kind, i) => {
    const paar = baum.kontaktPaar.get(kind)
    if (!paar) return gepackt[i]
    const kindKnoten = knoten.get(kind)!
    return k.versatz.x + paar.kontaktEltern.x - (kindKnoten.versatz.x + paar.kontaktKind.x)
  })
  const kindX = geradeAusgerichtet(ziel, versatzBis)
  let kontur: Kontur = []
  const unten = new Map<string, number>()
  teile.forEach((teil, i) => {
    if (kontur.length > 0)
      kindX[i] = Math.max(kindX[i], versatzRechts(kontur, teil.kontur, abstand))
    for (const [n, v] of teil.x) unten.set(n, v + kindX[i])
    kontur =
      kontur.length === 0
        ? verschobeneKontur(teil.kontur, kindX[i])
        : vereinige(kontur, teil.kontur, kindX[i])
  })
  kinder.forEach((kind, i) => {
    const paar = baum.kontaktPaar.get(kind)
    if (paar && Math.abs(kindX[i] - ziel[i]) < 1e-9) baum.flucht.set(kind, paar)
  })
  x.set(id, 0)
  for (const [n, v] of unten) x.set(n, v)
  return { x, kontur: [eigene, ...kontur] }
}

function verschobeneKontur(kontur: Kontur, versatz: number): Kontur {
  return kontur.map(([a, b]): [number, number] => [a + versatz, b + versatz])
}

export function geradeAusgerichtet(
  ziel: readonly number[],
  versatzBis: readonly number[],
): number[] {
  const werte = ziel.map((z, i) => z - versatzBis[i])
  const bloecke: { werte: number[]; wert: number }[] = []
  const median = (liste: number[]) => {
    const sortiert = [...liste].sort((a, b) => a - b)
    return sortiert[Math.floor((sortiert.length - 1) / 2)]
  }
  for (const w of werte) {
    bloecke.push({ werte: [w], wert: w })
    while (
      bloecke.length > 1 &&
      bloecke[bloecke.length - 2].wert > bloecke[bloecke.length - 1].wert
    ) {
      const oben = bloecke.pop()!
      const davor = bloecke.pop()!
      const vereint = [...davor.werte, ...oben.werte]
      bloecke.push({ werte: vereint, wert: median(vereint) })
    }
  }
  const lagen: number[] = []
  for (const b of bloecke)
    for (let i = 0; i < b.werte.length; i++) lagen.push(b.wert + versatzBis[lagen.length])
  return lagen
}

interface Auslegung {
  mitten: Map<string, Point>
  tiefe: Map<string, number>
  baum: Baum
}

interface AuslegeAbstaende {
  komponenten: number
  reihen: number
  bahn: number
  buendeln: boolean
  rasterReserve: number
}

function legeAus(
  knoten: ReadonlyMap<string, Knoten>,
  kanten: Kanten,
  variante: AnordnenVariante,
  abstand: AuslegeAbstaende,
  kammKanaele: (tiefe: ReadonlyMap<string, number>, x: (id: string) => number) => KammAuftrag[][],
): Auslegung {
  const gruppen = ermittleGruppen(knoten, kanten)
  const tiefe = new Map<string, number>()
  const baum: Baum = {
    kinder: new Map(),
    kontaktPaar: new Map(),
    flucht: new Map(),
    seitlich: new Map(),
    seitFlucht: new Map(),
  }
  const x = new Map<string, number>()
  let kontur: Kontur = []
  for (const gruppe of gruppen) {
    const stufen = minimiereKreuzungen(ermittleStufen(gruppe, kanten, variante), kanten, knoten)
    stufen.forEach((reihe, s) => reihe.forEach((id) => tiefe.set(id, s)))
    const teilBaum = baueBaum(stufen, kanten, knoten, variante.seitlich)
    const teil = legeTeilbaumAus(stufen[0][0], teilBaum, knoten, abstand.komponenten)
    for (const [e, l] of teilBaum.kinder) baum.kinder.set(e, l)
    for (const [kind, f] of teilBaum.kontaktPaar) baum.kontaktPaar.set(kind, f)
    for (const [kind, f] of teilBaum.flucht) baum.flucht.set(kind, f)
    for (const [e, s] of teilBaum.seitlich) baum.seitlich.set(e, s)
    for (const [kind, f] of teilBaum.seitFlucht) {
      baum.seitFlucht.set(kind, f)
      tiefe.set(kind, tiefe.get(f.eltern)!)
    }
    const versatz =
      kontur.length === 0 ? 0 : versatzRechts(kontur, teil.kontur, abstand.komponenten)
    for (const [id, v] of teil.x) x.set(id, v + versatz)
    kontur = kontur.length === 0 ? teil.kontur : vereinige(kontur, teil.kontur, versatz)
  }

  const dy = new Map<string, number>()
  for (const [kind, f] of baum.seitFlucht) {
    const e = knoten.get(f.eltern)!
    const k = knoten.get(kind)!
    dy.set(kind, e.versatz.y + f.kontaktEltern.y - (k.versatz.y + f.kontaktKind.y))
  }

  const anzahlStufen = Math.max(0, ...[...tiefe.values()].map((t) => t + 1))
  const oberhalb = Array.from({ length: anzahlStufen }, () => 0)
  const unterhalb = Array.from({ length: anzahlStufen }, () => 0)
  for (const [id, t] of tiefe) {
    const k = knoten.get(id)!
    const d = dy.get(id) ?? 0
    oberhalb[t] = Math.max(oberhalb[t], k.hoehe / 2 + d)
    unterhalb[t] = Math.max(unterhalb[t], k.hoehe / 2 - d)
  }

  const bahnen = Array.from({ length: anzahlStufen }, () => 0)
  const mitTrunk = new Set<number>()
  if (abstand.buendeln) {
    const kanaele = kammKanaele(tiefe, (id) => x.get(id)!)
    kanaele.forEach((auftraege, t) => {
      bahnen[t] = zaehleKammBahnen(auftraege, abstand.bahn)
      if (auftraege?.some((a) => a.netz.startsWith(TRUNK_NETZ))) mitTrunk.add(t)
    })
  } else {
    const kontaktX = (id: string, kontakt: Point) =>
      x.get(id)! + knoten.get(id)!.versatz.x + kontakt.x
    for (const [id, t] of tiefe) {
      for (const [n, kontakte] of kanten.get(id) ?? []) {
        if (tiefe.get(n) !== t + 1) continue
        for (const k of kontakte) {
          const gerade =
            k.von !== null &&
            k.zu !== null &&
            Math.abs(kontaktX(id, k.von) - kontaktX(n, k.zu)) <= FLUCHT_TOLERANZ_METER
          if (!gerade) bahnen[t]++
        }
      }
    }
  }
  const kanalHoehe = (t: number) => {
    if (!abstand.buendeln) return abstand.reihen + bahnen[t] * abstand.bahn
    const bahnenHoehe = Math.max(0, bahnen[t] - 1) * abstand.bahn
    const reserve = bahnen[t] > 0 ? abstand.rasterReserve : 0
    const rand = mitTrunk.has(t)
      ? Math.max(abstand.reihen, 2 * TRUNK_SCHILD_RAUM_METER)
      : abstand.reihen
    return rand + bahnenHoehe + reserve
  }

  const reihenMitte: number[] = []
  let oben = 0
  for (let t = 0; t < anzahlStufen; t++) {
    reihenMitte.push(oben - oberhalb[t])
    oben -= oberhalb[t] + unterhalb[t] + kanalHoehe(t)
  }

  const mitten = new Map<string, Point>()
  for (const [id, t] of tiefe) {
    mitten.set(id, { x: x.get(id)!, y: reihenMitte[t] + (dy.get(id) ?? 0) })
  }

  const einzelne = [...knoten.values()]
    .filter((k) => !tiefe.has(k.id))
    .sort((a, b) => mitteX(a) - mitteX(b))
  if (einzelne.length > 0) {
    const hoehe = Math.max(...einzelne.map((k) => k.hoehe))
    const mitteReihe = oben - hoehe / 2
    let links = kontur.length > 0 ? Math.min(...kontur.map(([a]) => a)) : 0
    for (const k of einzelne) {
      mitten.set(k.id, { x: links + k.breite / 2, y: mitteReihe })
      links += k.breite + abstand.komponenten
    }
  }
  return { mitten, tiefe, baum }
}

export interface AnordnenOptionen {
  zeichnungsart: Zeichnungsart
  rasterSchritt: number | null
  rasterBezug: Point
  bahnabstandMeter: number
  rahmen: BoundingBox | null
  einpassen?: boolean
  ebenen: readonly Ebene[]
  komponentenAbstand?: number | null
  reihenAbstand?: number | null
  buendeln?: boolean
  lage?: 'ecke' | 'mitte'
  trunks?: TrunkGrenze | null
  beschriftungen?: Readonly<Record<string, BoundingBox>>
}

export interface AnordnenErgebnis {
  positionen: Map<string, Point>
  ueberlappungen: number
  passtNicht: boolean
  kamm: Map<string, Point[]>
  trunks: NeuerTrunk[]
  trunkLeitungen: Map<string, TrunkLeitung>
}

function rasterPunkt(p: Point, schritt: number, bezug: Point): Point {
  return {
    x: bezug.x + Math.round((p.x - bezug.x) / schritt) * schritt,
    y: bezug.y + Math.round((p.y - bezug.y) / schritt) * schritt,
  }
}

function symbolGroesse(knoten: ReadonlyMap<string, Knoten>): number {
  const groessen = [...knoten.values()]
    .map((k) => Math.max(k.symbolBreite, k.symbolHoehe))
    .sort((a, b) => a - b)
  return groessen[Math.floor(groessen.length / 2)] ?? 0
}

function verschobeneBox(bb: BoundingBox, dx: number, dy: number): BoundingBox {
  return {
    min: { x: bb.min.x + dx, y: bb.min.y + dy },
    max: { x: bb.max.x + dx, y: bb.max.y + dy },
  }
}

interface Zusammenhang {
  knoten: Map<string, Knoten>
  kanten: Kanten
  nachId: Map<string, Objekt>
  f: Rahmen
  netze: Map<string, string>
}

function kammAuftraege(
  objekte: readonly Objekt[],
  z: Zusammenhang,
  tiefe: ReadonlyMap<string, number>,
  baum: Pick<Baum, 'seitFlucht'> | null,
  lage: (id: string) => Point,
  trunks: TrunkGrenze | null,
): KammAuftrag[][] {
  const kanaele: KammAuftrag[][] = []
  for (const o of objekte) {
    if (o.type === 'leitung' && o.pfadSegmente.length !== 1) continue
    if (
      o.type === 'schaltverbindung' &&
      [o.start, o.ziel].some((a) => a.art === 'schaltverbindung' || a.art === 'knoten')
    )
      continue
    const enden = verbindungsEnden(o, z.knoten, z.nachId, z.f)
    if (!enden || enden.start.length !== 1 || enden.ziel.length !== 1) continue
    const [a, b] = [enden.start[0], enden.ziel[0]]
    if (!a.kontakt || !b.kontakt || a.knoten.id === b.knoten.id) continue
    if (baum?.seitFlucht.has(a.knoten.id) || baum?.seitFlucht.has(b.knoten.id)) continue
    const ta = tiefe.get(a.knoten.id)
    const tb = tiefe.get(b.knoten.id)
    if (ta === undefined || tb === undefined || Math.abs(ta - tb) !== 1) continue
    const [ob, un] = ta < tb ? [a, b] : [b, a]
    const randY = (e: Ende) => e.knoten.symbolVersatz.y + e.kontakt!.y
    const potential = (e: Ende) => e.knoten.objekt.type === 'potential'
    if (!potential(ob) && randY(ob) > -ob.knoten.symbolHoehe / 2 + KANTEN_TOLERANZ_METER) continue
    if (!potential(un) && randY(un) < un.knoten.symbolHoehe / 2 - KANTEN_TOLERANZ_METER) continue
    const punkt = (e: Ende) => {
      const p = lage(e.knoten.id)
      return { x: p.x + e.kontakt!.x, y: p.y + e.kontakt!.y }
    }
    ;(kanaele[Math.min(ta, tb)] ??= []).push({
      id: ta < tb ? o.id : `${o.id}#umgedreht`,
      netz: z.netze.get(o.id) ?? o.id,
      oben: punkt(ob),
      unten: punkt(un),
      gruppe: ob.knoten.id,
      leitung: o.type === 'leitung',
    })
  }
  if (trunks) markiereTrunkGruppen(kanaele, trunks)
  return kanaele
}

export interface TrunkGrenze {
  mindestLeitungen: number
  mindestLaenge: number
}

const TRUNK_NETZ = 'trunk:'
const GERADE = 1e-6

function markiereTrunkGruppen(kanaele: KammAuftrag[][], grenze: TrunkGrenze) {
  kanaele.forEach((auftraege, t) => {
    const gruppen = new Map<string, KammAuftrag[]>()
    for (const a of auftraege ?? []) {
      if (!a.leitung || !a.gruppe) continue
      gruppen.set(a.gruppe, [...(gruppen.get(a.gruppe) ?? []), a])
    }
    for (const [gruppe, mitglieder] of gruppen) {
      const schraeg = mitglieder.filter((a) => Math.abs(a.oben.x - a.unten.x) > GERADE)
      const xs = schraeg.flatMap((a) => [a.oben.x, a.unten.x])
      if (schraeg.length < grenze.mindestLeitungen) continue
      if (Math.max(...xs) - Math.min(...xs) < grenze.mindestLaenge) continue
      for (const a of mitglieder) a.netz = `${TRUNK_NETZ}${gruppe}:${t}`
    }
  })
}

export function berechneAnordnung(
  objekte: readonly Objekt[],
  auswahlIds: ReadonlySet<string>,
  optionen: AnordnenOptionen,
  variante: AnordnenVariante = ERSTE_FASSUNG,
): AnordnenErgebnis {
  const f = variante.richtung === 'links-rechts' ? GESPIEGELT : GLEICH
  const knoten = ermittleKnoten(objekte, auswahlIds, optionen.ebenen, f, optionen.beschriftungen)
  const leer: AnordnenErgebnis = {
    positionen: new Map(),
    ueberlappungen: 0,
    passtNicht: false,
    kamm: new Map(),
    trunks: [],
    trunkLeitungen: new Map(),
  }
  if (knoten.size < 2) return leer
  const nachId = new Map(objekte.map((o) => [o.id, o]))
  const z: Zusammenhang = {
    knoten,
    kanten: ermittleKanten(objekte, knoten, nachId, f),
    nachId,
    f,
    netze: ermittleNetze(objekte),
  }
  const noetig = Math.max(
    Math.max(NOETIG_BAHNEN * optionen.bahnabstandMeter, NOETIG_SYMBOLE * symbolGroesse(knoten)) *
      variante.abstandFaktor,
    ENG_MINDESTENS_BAHNEN * optionen.bahnabstandMeter,
  )
  const grund = optionen.komponentenAbstand ?? noetig
  const reihen = optionen.reihenAbstand ?? optionen.komponentenAbstand ?? noetig
  const alt = [...knoten.values()].map((k) => k.weltBox).reduce(unionBoundingBox)

  let ergebnis: ReturnType<typeof legeAusUndSetze> | null = null
  let passtNicht = false
  for (const faktor of VERKLEINERUNG_STUFEN) {
    ergebnis = legeAusUndSetze(objekte, z, variante, optionen, alt, {
      komponenten: grund * faktor,
      reihen: reihen * faktor,
      bahn: optionen.bahnabstandMeter,
      buendeln: optionen.buendeln ?? false,
      rasterReserve: optionen.rasterSchritt ?? 0,
    })
    const r = optionen.einpassen === false ? null : optionen.rahmen
    passtNicht =
      r !== null &&
      (ergebnis.huelle.min.x < r.min.x - 1e-6 ||
        ergebnis.huelle.max.x > r.max.x + 1e-6 ||
        ergebnis.huelle.min.y < r.min.y - 1e-6 ||
        ergebnis.huelle.max.y > r.max.y + 1e-6)
    if (!passtNicht) break
  }
  const { positionen, huelle, kamm, trunks, trunkLeitungen } = ergebnis!

  const neueBoxen = [...knoten.values()].map((k) => {
    const p = positionen.get(k.id)!
    return verschobeneBox(k.weltBox, p.x - k.objekt.position.x, p.y - k.objekt.position.y)
  })
  let ueberlappungen = 0
  for (const o of objekte) {
    if (o.type !== 'komponente' && o.type !== 'potential') continue
    if (knoten.has(o.id) || knotenVon(o.id, knoten, nachId)) continue
    const box = getBoundingBox(o)
    if (!boundingBoxUeberlappt(box, huelle)) continue
    const innen = {
      min: { x: box.min.x + 1e-3, y: box.min.y + 1e-3 },
      max: { x: box.max.x - 1e-3, y: box.max.y - 1e-3 },
    }
    if (neueBoxen.some((b) => boundingBoxUeberlappt(b, innen))) ueberlappungen++
  }
  return { positionen, ueberlappungen, passtNicht, kamm, trunks, trunkLeitungen }
}

function legeAusUndSetze(
  objekte: readonly Objekt[],
  z: Zusammenhang,
  variante: AnordnenVariante,
  optionen: AnordnenOptionen,
  alt: BoundingBox,
  abstand: AuslegeAbstaende,
): KammErgebnis & { positionen: Map<string, Point>; huelle: BoundingBox } {
  const { knoten, f } = z
  const trunkGrenze = variante.trunks ? (optionen.trunks ?? null) : null
  const { mitten, tiefe, baum } = legeAus(knoten, z.kanten, variante, abstand, (t, x) =>
    kammAuftraege(
      objekte,
      z,
      t,
      null,
      (id) => ({ x: x(id) + knoten.get(id)!.versatz.x, y: 0 }),
      trunkGrenze,
    ),
  )

  const roh = new Map<string, Point>()
  for (const [id, m] of mitten) {
    const k = knoten.get(id)!
    roh.set(id, f({ x: m.x + k.versatz.x, y: m.y + k.versatz.y }))
  }
  const huelleVon = (positionen: ReadonlyMap<string, Point>) =>
    [...positionen]
      .map(([id, p]) => {
        const k = knoten.get(id)!
        return verschobeneBox(k.weltBox, p.x - k.objekt.position.x, p.y - k.objekt.position.y)
      })
      .reduce(unionBoundingBox)
  const vorher = huelleVon(roh)
  const r = optionen.rahmen
  const dx =
    optionen.lage === 'mitte' && r
      ? (r.min.x + r.max.x) / 2 - (vorher.min.x + vorher.max.x) / 2
      : alt.min.x - vorher.min.x
  const dy =
    optionen.lage === 'mitte' && r
      ? (r.min.y + r.max.y) / 2 - (vorher.min.y + vorher.max.y) / 2
      : alt.max.y - vorher.max.y

  const rang = (id: string) => (tiefe.get(id) ?? Infinity) + (baum.seitFlucht.has(id) ? 0.5 : 0)
  const positionen = new Map<string, Point>()
  for (const id of [...roh.keys()].sort((a, b) => rang(a) - rang(b))) {
    const k = knoten.get(id)!
    const p = roh.get(id)!
    let position: Point = { x: p.x + dx, y: p.y + dy }
    if (optionen.rasterSchritt !== null) {
      if (k.objekt.type === 'komponente') {
        const verschoben = { ...k.objekt, position }
        const ziel = rasterPunkt(
          getFangpunkt(verschoben),
          optionen.rasterSchritt,
          optionen.rasterBezug,
        )
        position = positionFuerFangpunkt(verschoben, ziel)
      } else {
        position = rasterPunkt(position, optionen.rasterSchritt, optionen.rasterBezug)
      }
    }
    const imRahmen = f(position)
    const flucht = baum.flucht.get(id)
    const elternFlucht = flucht && positionen.get(flucht.eltern)
    if (flucht && elternFlucht) {
      imRahmen.x = f(elternFlucht).x + flucht.kontaktEltern.x - flucht.kontaktKind.x
    }
    const seit = baum.seitFlucht.get(id)
    const elternSeit = seit && positionen.get(seit.eltern)
    if (seit && elternSeit) {
      imRahmen.y = f(elternSeit).y + seit.kontaktEltern.y - seit.kontaktKind.y
    }
    positionen.set(id, f(imRahmen))
  }

  const kamm: KammErgebnis = abstand.buendeln
    ? verlegeKamm(objekte, z, tiefe, baum, positionen, abstand.bahn, trunkGrenze)
    : { kamm: new Map(), trunks: [], trunkLeitungen: new Map() }
  return { ...kamm, positionen, huelle: huelleVon(positionen) }
}

export interface NeuerTrunk {
  id: string
  wegpunkte: Point[]
}

export interface TrunkLeitung {
  pfadSegmente: [Point[], Point[]]
  durchgang: { trunkId: string; eintrittT: number; austrittT: number }
}

interface KammErgebnis {
  kamm: Map<string, Point[]>
  trunks: NeuerTrunk[]
  trunkLeitungen: Map<string, TrunkLeitung>
}

function verlegeKamm(
  objekte: readonly Objekt[],
  z: Zusammenhang,
  tiefe: ReadonlyMap<string, number>,
  baum: Baum,
  positionen: ReadonlyMap<string, Point>,
  bahnabstand: number,
  trunkGrenze: TrunkGrenze | null,
): KammErgebnis {
  const { knoten, f } = z
  const lage = (id: string) => f(positionen.get(id)!)
  const boxImRahmenNeu = (id: string) => {
    const k = knoten.get(id)!
    const p = positionen.get(id)!
    return boxImRahmen(
      verschobeneBox(k.weltBox, p.x - k.objekt.position.x, p.y - k.objekt.position.y),
      f,
    )
  }
  const hindernisse = objekte
    .filter(
      (o) =>
        o.type === 'wand' ||
        ((o.type === 'komponente' || o.type === 'potential') &&
          !knoten.has(o.id) &&
          !knotenVon(o.id, knoten, z.nachId)),
    )
    .map((o) => boxImRahmen(getBoundingBox(o), f))

  const ergebnis: KammErgebnis = { kamm: new Map(), trunks: [], trunkLeitungen: new Map() }
  const kanaele = kammAuftraege(objekte, z, tiefe, baum, lage, trunkGrenze)
  kanaele.forEach((auftraege, t) => {
    if (!auftraege || auftraege.length === 0) return
    const obere = [...tiefe].filter(([, s]) => s === t).map(([id]) => boxImRahmenNeu(id))
    const untere = [...tiefe].filter(([, s]) => s === t + 1).map(([id]) => boxImRahmenNeu(id))
    if (obere.length === 0 || untere.length === 0) return
    const obereKante = Math.min(...obere.map((b) => b.min.y))
    const untereKante = Math.max(...untere.map((b) => b.max.y))
    const xs = auftraege.flatMap((a) => [a.oben.x, a.unten.x])
    const kanalBox: BoundingBox = {
      min: { x: Math.min(...xs), y: untereKante },
      max: { x: Math.max(...xs), y: obereKante },
    }
    if (hindernisse.some((h) => boundingBoxUeberlappt(h, kanalBox))) return
    const verlaeufe = verlegeKammKanal(
      { obereKante, untereKante, auftraege },
      bahnabstand,
      ROUTING_ZELLGROESSE_METER,
    )
    if (!verlaeufe) return

    const trunkGruppen = new Map<string, KammAuftrag[]>()
    for (const a of auftraege) {
      if (a.netz.startsWith(TRUNK_NETZ))
        trunkGruppen.set(a.netz, [...(trunkGruppen.get(a.netz) ?? []), a])
    }
    const inTrunk = new Set<string>()
    for (const mitglieder of trunkGruppen.values()) {
      const y = mitglieder.map((a) => verlaeufe.get(a.id)!).find((v) => v.length === 4)![1].y
      const xsTrunk = mitglieder.flatMap((a) => [a.oben.x, a.unten.x])
      const links = Math.min(...xsTrunk)
      const rechts = Math.max(...xsTrunk)
      const trunkId = erzeugeId('trunk')
      ergebnis.trunks.push({ id: trunkId, wegpunkte: [f({ x: links, y }), f({ x: rechts, y })] })
      const tVon = (x: number) => (x - links) / (rechts - links)
      for (const a of mitglieder) {
        inTrunk.add(a.id)
        const umgedreht = a.id.endsWith('#umgedreht')
        const oben = [a.oben, { x: a.oben.x, y }].map(f)
        const unten = [{ x: a.unten.x, y }, a.unten].map(f)
        ergebnis.trunkLeitungen.set(umgedreht ? a.id.slice(0, -'#umgedreht'.length) : a.id, {
          pfadSegmente: umgedreht ? [[...unten].reverse(), [...oben].reverse()] : [oben, unten],
          durchgang: {
            trunkId,
            eintrittT: tVon(umgedreht ? a.unten.x : a.oben.x),
            austrittT: tVon(umgedreht ? a.oben.x : a.unten.x),
          },
        })
      }
    }

    for (const [id, punkte] of verlaeufe) {
      if (inTrunk.has(id)) continue
      const welt = punkte.map(f)
      if (id.endsWith('#umgedreht'))
        ergebnis.kamm.set(id.slice(0, -'#umgedreht'.length), welt.reverse())
      else ergebnis.kamm.set(id, welt)
    }
  })
  return ergebnis
}
