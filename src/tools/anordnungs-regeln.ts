import type {
  AnordnungsRegeln,
  BlattGeschoss,
  BoundingBox,
  LeitungsObjekt,
  Objekt,
  Point,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
} from '../document-model'
import {
  boundingBoxFromPoints,
  boundingBoxUeberlappt,
  getBoundingBox,
  getDockpoints,
  istAufgesetztesModul,
} from '../document-model'
import type { RoutingSettings } from '../routing'
import { ROUTING_ZELLGROESSE_METER } from '../routing'
import type { KammAuftrag } from './kamm-verdrahtung'
import { verlegeKammKanal } from './kamm-verdrahtung'
import {
  berechneVerdrahtung,
  ermittleNetze,
  kreuzungenZwischen,
  wendeVerdrahtungAn,
} from './verdrahtung'

type Geregelt = (LeitungsObjekt | SchaltverbindungObjekt) & { anordnung: AnordnungsRegeln }

function istGeregelt(o: Objekt): o is Geregelt {
  if (o.type === 'leitung') return o.anordnung !== undefined && !o.autoRoutingAus
  if (o.type === 'schaltverbindung') return o.anordnung !== undefined && o.autoRouting === true
  return false
}

function endObjekte(o: Geregelt): string[] {
  if (o.type === 'leitung') {
    return [o.start, o.ziel].flatMap((e) => (e.art === 'dock' ? [e.objektId] : []))
  }
  return [o.start, o.ziel].flatMap((e) =>
    e.art === 'dock' || e.art === 'potential' ? [e.objektId] : [],
  )
}

type Rahmen = (p: Point) => Point
const GLEICH: Rahmen = (p) => p
const GESPIEGELT: Rahmen = (p) => ({ x: -p.y, y: -p.x })

const KANTEN_TOLERANZ_METER = 0.02

interface Ende {
  knotenId: string
  punkt: Point
}

function kontaktVon(
  anschluss: SchaltverbindungAnschluss | LeitungsObjekt['start'],
  nachId: ReadonlyMap<string, Objekt>,
): Ende | null {
  if (anschluss.art === 'dock') {
    const k = nachId.get(anschluss.objektId)
    if (k?.type !== 'komponente') return null
    const index =
      'dockpunktIndizes' in anschluss ? anschluss.dockpunktIndizes[0] : anschluss.dockpunktIndex
    const punkt = getDockpoints(k)[index]
    return punkt ? { knotenId: k.id, punkt } : null
  }
  if (anschluss.art === 'potential') {
    const p = nachId.get(anschluss.objektId)
    return p?.type === 'potential' ? { knotenId: p.id, punkt: p.position } : null
  }
  return null
}

function verlaeufe(o: Objekt): Point[][] {
  if (o.type === 'leitung') return o.pfadSegmente.filter((s) => s.length >= 2)
  if (o.type === 'schaltverbindung' || o.type === 'trunk') return [o.wegpunkte]
  return []
}

function kammNeu(
  objekte: readonly Objekt[],
  gruppe: readonly Geregelt[],
  betroffen: ReadonlySet<string>,
  regeln: AnordnungsRegeln,
): Map<string, Point[]> {
  const f = regeln.richtung === 'links-rechts' ? GESPIEGELT : GLEICH
  const nachId = new Map(objekte.map((o) => [o.id, o]))
  const netze = ermittleNetze(objekte)
  const boxImRahmen = (id: string): BoundingBox => {
    const bb = getBoundingBox(nachId.get(id)!)
    return boundingBoxFromPoints([f(bb.min), f(bb.max)])
  }
  const istPotential = (id: string) => nachId.get(id)?.type === 'potential'

  interface Kandidat {
    id: string
    oben: Ende
    unten: Ende
    umgedreht: boolean
  }
  const einheiten = new Map<string, Kandidat[]>()
  for (const o of gruppe) {
    if (o.type === 'leitung' && o.pfadSegmente.length !== 1) continue
    if (
      o.type === 'schaltverbindung' &&
      [o.start, o.ziel].some((a) => a.art === 'schaltverbindung' || a.art === 'knoten')
    )
      continue
    const a = kontaktVon(o.start, nachId)
    const b = kontaktVon(o.ziel, nachId)
    if (!a || !b || a.knotenId === b.knotenId) continue
    const ba = boxImRahmen(a.knotenId)
    const bb = boxImRahmen(b.knotenId)
    let oben: Ende
    let unten: Ende
    if (ba.min.y > bb.max.y) [oben, unten] = [a, b]
    else if (bb.min.y > ba.max.y) [oben, unten] = [b, a]
    else continue
    const boxOben = boxImRahmen(oben.knotenId)
    const boxUnten = boxImRahmen(unten.knotenId)
    if (!istPotential(oben.knotenId) && f(oben.punkt).y > boxOben.min.y + KANTEN_TOLERANZ_METER)
      continue
    if (!istPotential(unten.knotenId) && f(unten.punkt).y < boxUnten.max.y - KANTEN_TOLERANZ_METER)
      continue
    const kandidat = { id: o.id, oben, unten, umgedreht: oben === b }
    einheiten.set(oben.knotenId, [...(einheiten.get(oben.knotenId) ?? []), kandidat])
  }

  const vorgaben = new Map<string, Point[]>()
  for (const [elternId, mitglieder] of einheiten) {
    if (!mitglieder.some((m) => betroffen.has(m.id))) continue
    const knotenIds = new Set([elternId, ...mitglieder.map((m) => m.unten.knotenId)])
    const obereKante = boxImRahmen(elternId).min.y
    const untereKante = Math.max(...mitglieder.map((m) => boxImRahmen(m.unten.knotenId).max.y))
    if (obereKante - untereKante < 2 * ROUTING_ZELLGROESSE_METER + regeln.bahnabstand) continue
    const auftraege: KammAuftrag[] = mitglieder.map((m) => ({
      id: m.id,
      netz: netze.get(m.id) ?? m.id,
      oben: f(m.oben.punkt),
      unten: f(m.unten.punkt),
    }))
    const xs = auftraege.flatMap((a) => [a.oben.x, a.unten.x])
    const kanal: BoundingBox = {
      min: { x: Math.min(...xs), y: untereKante },
      max: { x: Math.max(...xs), y: obereKante },
    }
    const imWeg = objekte.some((o) => {
      if (o.type === 'wand') return boundingBoxUeberlappt(boxImRahmen(o.id), kanal)
      if (o.type !== 'komponente' && o.type !== 'potential') return false
      if (knotenIds.has(o.id) || (istAufgesetztesModul(o) && knotenIds.has(o.traegerId)))
        return false
      return boundingBoxUeberlappt(boxImRahmen(o.id), kanal)
    })
    if (imWeg) continue
    const kamm = verlegeKammKanal(
      { obereKante, untereKante, auftraege },
      regeln.bahnabstand,
      ROUTING_ZELLGROESSE_METER,
    )
    if (!kamm) continue
    const welt = new Map(
      mitglieder.map((m) => {
        const punkte = kamm.get(m.id)!.map(f)
        return [m.id, m.umgedreht ? punkte.reverse() : punkte]
      }),
    )
    const eigene = new Set(mitglieder.map((m) => m.id))
    const fremd = objekte.filter(
      (o) =>
        (o.type === 'leitung' || o.type === 'schaltverbindung' || o.type === 'trunk') &&
        !eigene.has(o.id) &&
        !betroffen.has(o.id),
    )
    const stoert = mitglieder.some((m) =>
      fremd.some(
        (o) =>
          (netze.get(o.id) ?? o.id) !== (netze.get(m.id) ?? m.id) &&
          verlaeufe(o).some((v) => kreuzungenZwischen(welt.get(m.id)!, v) > 0),
      ),
    )
    if (stoert) continue
    for (const [id, punkte] of welt) vorgaben.set(id, punkte)
  }
  return vorgaben
}

export function verlegeNachAnordnungsRegeln(
  objekte: Objekt[],
  bewegt: ReadonlySet<string>,
  settings: RoutingSettings,
  geschoss?: BlattGeschoss,
  ausgenommen: ReadonlySet<string> = new Set(),
): Objekt[] {
  const bewegtAlle = new Set(bewegt)
  for (const o of objekte) {
    if (istAufgesetztesModul(o) && bewegt.has(o.traegerId)) bewegtAlle.add(o.id)
  }
  const geregelt = objekte.filter(istGeregelt)
  const betroffen = geregelt.filter(
    (o) => !ausgenommen.has(o.id) && endObjekte(o).some((id) => bewegtAlle.has(id)),
  )
  if (betroffen.length === 0) return objekte

  let stand = objekte
  const gruppen = new Map<string, Geregelt[]>()
  for (const o of betroffen)
    gruppen.set(o.anordnung.gruppe, [...(gruppen.get(o.anordnung.gruppe) ?? []), o])
  for (const [gruppenId, mitglieder] of gruppen) {
    const regeln = mitglieder[0].anordnung
    const ids = new Set(mitglieder.map((o) => o.id))
    const ganzeGruppe = stand.filter(
      (o): o is Geregelt =>
        istGeregelt(o) && o.anordnung.gruppe === gruppenId && !ausgenommen.has(o.id),
    )
    const vorgaben = regeln.kamm ? kammNeu(stand, ganzeGruppe, ids, regeln) : new Map()
    for (const id of vorgaben.keys()) ids.add(id)
    const ergebnis = berechneVerdrahtung(stand, ids, settings, {
      bahnabstandMeter: regeln.bahnabstand,
      geschoss,
      nurRechtwinklig: regeln.rechtwinklig,
      kreuzFaktor: regeln.kreuzFaktor,
      vorgaben,
      nachbessern: true,
    })
    stand = wendeVerdrahtungAn(stand, ergebnis)
  }
  return stand
}
