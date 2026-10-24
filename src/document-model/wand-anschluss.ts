import type { Objekt, WandObjekt } from './objekte'
import type { Point } from './geometry'
import { distance } from './geometry'
import { erzeugeId } from './id'
import { naechsterPunktAufPfad, punktAufPfad } from './trunk-kette'
import type { WandAnschluss, WandAnschluesse, WandTeilstueck } from './wand'
import {
  ermittleOeffnungsGeometrie,
  ermittleWandTeilstuecke,
  normiert,
  oeffnungenAufWand,
} from './wand'

export const WAND_KNOTEN_TOLERANZ = 1e-4

export function istGleicherKnoten(a: Point, b: Point): boolean {
  return distance(a, b) <= WAND_KNOTEN_TOLERANZ
}

export interface WandEnde {
  wand: WandObjekt
  istStart: boolean
}

function endpunkt(wand: WandObjekt, istStart: boolean): Point {
  return istStart ? wand.punkte[0] : wand.punkte[wand.punkte.length - 1]
}

function nachbarpunktAmEnde(wand: WandObjekt, istStart: boolean): Point {
  return istStart ? wand.punkte[1] : wand.punkte[wand.punkte.length - 2]
}

function istAnSichGeschlossen(wand: WandObjekt): boolean {
  return wand.punkte.length > 2 && istGleicherKnoten(wand.punkte[0], endpunkt(wand, false))
}

export function wandEndenAm(
  objekte: readonly Objekt[],
  punkt: Point,
  ausschlussIds?: ReadonlySet<string>,
): WandEnde[] {
  const ergebnis: WandEnde[] = []
  for (const o of objekte) {
    if (o.type !== 'wand' || o.punkte.length < 2 || ausschlussIds?.has(o.id)) continue
    if (istAnSichGeschlossen(o)) continue
    if (istGleicherKnoten(o.punkte[0], punkt)) ergebnis.push({ wand: o, istStart: true })
    if (istGleicherKnoten(endpunkt(o, false), punkt)) ergebnis.push({ wand: o, istStart: false })
  }
  return ergebnis
}

export function ermittleWandAnschluesse(
  wand: WandObjekt,
  objekte: readonly Objekt[],
): WandAnschluesse {
  if (wand.punkte.length < 2 || istAnSichGeschlossen(wand)) return { start: null, ende: null }
  const eigene = new Set([wand.id])
  const anschluss = (istStart: boolean): WandAnschluss | null => {
    const enden = wandEndenAm(objekte, endpunkt(wand, istStart), eigene)
    if (enden.length !== 1) return null
    const { wand: nachbar, istStart: nachbarIstStart } = enden[0]
    return {
      nachbarPunkt: nachbarpunktAmEnde(nachbar, nachbarIstStart),
      nachbarStaerke: nachbar.staerke,
    }
  }
  return { start: anschluss(true), ende: anschluss(false) }
}

export function zerlegeWandInSegmente(wand: WandObjekt): WandObjekt[] {
  if (wand.punkte.length <= 2) return [wand]
  const segmente: WandObjekt[] = []
  for (let i = 0; i < wand.punkte.length - 1; i++) {
    const a = wand.punkte[i]
    const b = wand.punkte[i + 1]
    if (istGleicherKnoten(a, b)) continue
    segmente.push({
      ...wand,
      id: segmente.length === 0 ? wand.id : erzeugeId(),
      punkte: [a, b],
    })
  }
  return segmente.length > 0 ? segmente : [{ ...wand, punkte: wand.punkte.slice(0, 2) }]
}

export interface WandUmbau {
  alt: WandObjekt
  neueIds: readonly string[]
  versatz?: Point
}

export function ordneOeffnungenZu(
  objekte: readonly Objekt[],
  umbauten: ReadonlyMap<string, WandUmbau>,
): Objekt[] {
  if (umbauten.size === 0) return [...objekte]
  const waende = new Map(
    objekte.filter((o): o is WandObjekt => o.type === 'wand').map((w) => [w.id, w] as const),
  )
  return objekte.map((o) => {
    if (o.type !== 'tuer' && o.type !== 'fenster' && o.type !== 'wanddurchbruch') return o
    const umbau = umbauten.get(o.wandId)
    if (!umbau) return o
    const alt = punktAufPfad(umbau.alt.punkte, o.t)
    const ort = umbau.versatz ? { x: alt.x + umbau.versatz.x, y: alt.y + umbau.versatz.y } : alt
    let beste: { wand: WandObjekt; t: number; distanz: number } | null = null
    for (const id of umbau.neueIds) {
      const wand = waende.get(id)
      if (!wand) continue
      const treffer = naechsterPunktAufPfad(wand.punkte, ort)
      if (treffer && (!beste || treffer.distanz < beste.distanz)) {
        beste = { wand, t: treffer.t, distanz: treffer.distanz }
      }
    }
    if (!beste) return o
    const geometrie = ermittleOeffnungsGeometrie(beste.wand, { t: beste.t })
    return { ...o, wandId: beste.wand.id, t: beste.t, ...(geometrie ?? {}) }
  })
}

export function zerlegeWaendeInSegmente(objekte: Objekt[]): Objekt[] {
  if (!objekte.some((o) => o.type === 'wand' && o.punkte.length > 2)) return objekte
  const umbauten = new Map<string, WandUmbau>()
  const ergebnis: Objekt[] = []
  for (const o of objekte) {
    if (o.type !== 'wand' || o.punkte.length <= 2) {
      ergebnis.push(o)
      continue
    }
    const segmente = zerlegeWandInSegmente(o)
    ergebnis.push(...segmente)
    if (oeffnungenAufWand(objekte, o.id).length > 0) {
      umbauten.set(o.id, { alt: o, neueIds: segmente.map((s) => s.id) })
    }
  }
  return ordneOeffnungenZu(ergebnis, umbauten)
}

function schnittGeraden(p: Point, u: Point, q: Point, v: Point): Point | null {
  const kreuz = u.x * v.y - u.y * v.x
  if (Math.abs(kreuz) < 1e-9) return null
  const s = ((q.x - p.x) * v.y - (q.y - p.y) * v.x) / kreuz
  return { x: p.x + u.x * s, y: p.y + u.y * s }
}

function mitEndpunkt(wand: WandObjekt, istStart: boolean, punkt: Point): WandObjekt {
  const punkte = [...wand.punkte]
  punkte[istStart ? 0 : punkte.length - 1] = punkt
  return { ...wand, punkte }
}

export function nachgefuehrteWandAnschluesse(
  vorher: readonly Objekt[],
  nachher: readonly Objekt[],
  bewegteWandIds: ReadonlySet<string>,
): Objekt[] {
  if (bewegteWandIds.size === 0) return [...nachher]
  const alteWaende = new Map(
    vorher.filter((o): o is WandObjekt => o.type === 'wand').map((w) => [w.id, w] as const),
  )
  const neueWaende = new Map(
    nachher.filter((o): o is WandObjekt => o.type === 'wand').map((w) => [w.id, w] as const),
  )
  const geaendert = new Map<string, WandObjekt>()
  const aktuell = (id: string) => geaendert.get(id) ?? neueWaende.get(id)!
  const versatzVon = new Map<string, Point>()

  for (const id of bewegteWandIds) {
    const alt = alteWaende.get(id)
    const neu = neueWaende.get(id)
    if (!alt || !neu || alt.punkte.length < 2 || istAnSichGeschlossen(alt)) continue
    const versatz = { x: neu.punkte[0].x - alt.punkte[0].x, y: neu.punkte[0].y - alt.punkte[0].y }
    versatzVon.set(id, versatz)
    if (Math.hypot(versatz.x, versatz.y) < 1e-12) continue
    for (const istStart of [true, false]) {
      const knotenAlt = endpunkt(alt, istStart)
      const partner = wandEndenAm(vorher, knotenAlt).filter((e) => !bewegteWandIds.has(e.wand.id))
      if (partner.length === 0) continue
      const eigeneRichtung = normiert({
        x: endpunkt(alt, !istStart).x - knotenAlt.x,
        y: endpunkt(alt, !istStart).y - knotenAlt.y,
      })
      const knotenVerschoben = { x: knotenAlt.x + versatz.x, y: knotenAlt.y + versatz.y }
      const fuehrend = partner.filter((e) => {
        const r = normiert({
          x: nachbarpunktAmEnde(e.wand, e.istStart).x - knotenAlt.x,
          y: nachbarpunktAmEnde(e.wand, e.istStart).y - knotenAlt.y,
        })
        return (
          r && eigeneRichtung && Math.abs(r.x * eigeneRichtung.y - r.y * eigeneRichtung.x) > 1e-6
        )
      })
      let knotenNeu = knotenVerschoben
      if (fuehrend.length === 1 && eigeneRichtung) {
        const f = fuehrend[0]
        const fern = nachbarpunktAmEnde(f.wand, f.istStart)
        const r = normiert({ x: knotenAlt.x - fern.x, y: knotenAlt.y - fern.y })
        const schnitt = r ? schnittGeraden(knotenVerschoben, eigeneRichtung, fern, r) : null
        if (schnitt) knotenNeu = schnitt
      }
      geaendert.set(id, mitEndpunkt(aktuell(id), istStart, knotenNeu))
      for (const e of partner) {
        geaendert.set(e.wand.id, mitEndpunkt(aktuell(e.wand.id), e.istStart, knotenNeu))
      }
    }
  }

  if (geaendert.size === 0) return [...nachher]
  const ergebnis = nachher.map((o) => geaendert.get(o.id) ?? o)
  const umbauten = new Map<string, WandUmbau>()
  for (const id of geaendert.keys()) {
    const alt = alteWaende.get(id)
    if (alt) umbauten.set(id, { alt, neueIds: [id], versatz: versatzVon.get(id) })
  }
  return ordneOeffnungenZu(ergebnis, umbauten)
}

export function verschiebeWandKnoten(
  objekte: readonly Objekt[],
  alterPunkt: Point,
  neuerPunkt: Point,
): Objekt[] {
  const enden = wandEndenAm(objekte, alterPunkt)
  if (enden.length === 0) return [...objekte]
  const geaendert = new Map<string, WandObjekt>()
  for (const e of enden) {
    geaendert.set(
      e.wand.id,
      mitEndpunkt(geaendert.get(e.wand.id) ?? e.wand, e.istStart, neuerPunkt),
    )
  }
  const umbauten = new Map<string, WandUmbau>()
  for (const e of enden) umbauten.set(e.wand.id, { alt: e.wand, neueIds: [e.wand.id] })
  return ordneOeffnungenZu(
    objekte.map((o) => geaendert.get(o.id) ?? o),
    umbauten,
  )
}

export function teileWandSegment(
  objekte: readonly Objekt[],
  wandId: string,
  punkt: Point,
): Objekt[] | null {
  const wand = objekte.find((o): o is WandObjekt => o.type === 'wand' && o.id === wandId)
  if (!wand || wand.punkte.length < 2) return null
  const treffer = naechsterPunktAufPfad(wand.punkte, punkt)
  if (!treffer) return null
  const teilung = treffer.punkt
  if (wand.punkte.some((p) => distance(p, teilung) < 0.01)) return null
  let segmentIndex = 0
  let besteDistanz = Infinity
  for (let i = 0; i < wand.punkte.length - 1; i++) {
    const d =
      naechsterPunktAufPfad([wand.punkte[i], wand.punkte[i + 1]], teilung)?.distanz ?? Infinity
    if (d < besteDistanz) {
      besteDistanz = d
      segmentIndex = i
    }
  }
  const vorne: WandObjekt = {
    ...wand,
    punkte: [...wand.punkte.slice(0, segmentIndex + 1), teilung],
  }
  const hinten: WandObjekt = {
    ...wand,
    id: erzeugeId(),
    punkte: [teilung, ...wand.punkte.slice(segmentIndex + 1)],
  }
  const ergebnis: Objekt[] = []
  for (const o of objekte) {
    if (o.id === wand.id) ergebnis.push(vorne, hinten)
    else ergebnis.push(o)
  }
  return ordneOeffnungenZu(
    ergebnis,
    new Map([[wand.id, { alt: wand, neueIds: [vorne.id, hinten.id] }]]),
  )
}

export function vereinigeWandSegmente(
  objekte: readonly Objekt[],
  punkt: Point,
  behalteId: string,
): Objekt[] | null {
  const enden = wandEndenAm(objekte, punkt)
  if (enden.length !== 2 || enden[0].wand.id === enden[1].wand.id) return null
  const behalten = enden.find((e) => e.wand.id === behalteId)
  const weg = enden.find((e) => e.wand.id !== behalteId)
  if (!behalten || !weg) return null
  const a = endpunkt(behalten.wand, !behalten.istStart)
  const b = endpunkt(weg.wand, !weg.istStart)
  if (istGleicherKnoten(a, b)) return null
  const vereint: WandObjekt = {
    ...behalten.wand,
    punkte: behalten.istStart ? [b, a] : [a, b],
  }
  const ergebnis = objekte
    .filter((o) => o.id !== weg.wand.id)
    .map((o) => (o.id === vereint.id ? vereint : o))
  return ordneOeffnungenZu(
    ergebnis,
    new Map([
      [behalten.wand.id, { alt: behalten.wand, neueIds: [vereint.id] }],
      [weg.wand.id, { alt: weg.wand, neueIds: [vereint.id] }],
    ]),
  )
}

function abstandZurStrecke(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const laenge2 = dx * dx + dy * dy
  const t = laenge2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / laenge2
  const s = Math.max(0, Math.min(1, t))
  return distance(p, { x: a.x + dx * s, y: a.y + dy * s })
}

function imWandUmriss(p: Point, teil: Pick<WandTeilstueck, 'aussen' | 'innen'>): boolean {
  const ring = [...teil.aussen, ...[...teil.innen].reverse()]
  for (let i = 0; i < ring.length; i++) {
    if (abstandZurStrecke(p, ring[i], ring[(i + 1) % ring.length]) <= WAND_KNOTEN_TOLERANZ) {
      return true
    }
  }
  let innen = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      innen = !innen
    }
  }
  return innen
}

export function istStirnseiteVerdeckt(
  von: Point,
  bis: Point,
  andere: readonly Pick<WandTeilstueck, 'aussen' | 'innen'>[],
): boolean {
  const minX = Math.min(von.x, bis.x) - WAND_KNOTEN_TOLERANZ
  const maxX = Math.max(von.x, bis.x) + WAND_KNOTEN_TOLERANZ
  const minY = Math.min(von.y, bis.y) - WAND_KNOTEN_TOLERANZ
  const maxY = Math.max(von.y, bis.y) + WAND_KNOTEN_TOLERANZ
  const kandidaten = andere.filter((teil) => {
    const punkte = [...teil.aussen, ...teil.innen]
    return (
      punkte.some((q) => q.x >= minX) &&
      punkte.some((q) => q.x <= maxX) &&
      punkte.some((q) => q.y >= minY) &&
      punkte.some((q) => q.y <= maxY)
    )
  })
  if (kandidaten.length === 0) return false
  const STICHPROBEN = 10
  for (let k = 0; k <= STICHPROBEN; k++) {
    const t = k / STICHPROBEN
    const p = { x: von.x + (bis.x - von.x) * t, y: von.y + (bis.y - von.y) * t }
    if (!kandidaten.some((teil) => imWandUmriss(p, teil))) return false
  }
  return true
}

export function ermittleWandKontur(
  wand: WandObjekt,
  alleObjekte: readonly Objekt[],
): WandTeilstueck[] {
  return ermittleWandTeilstuecke(
    wand,
    oeffnungenAufWand(alleObjekte, wand.id),
    ermittleWandAnschluesse(wand, alleObjekte),
  )
}
