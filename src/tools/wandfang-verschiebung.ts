import type {
  KomponentenKombination,
  KomponentenObjekt,
  KomponentenWandstelle,
  Objekt,
  Point,
  WandflaechenTreffer,
  Zeichnung,
} from '../document-model'
import {
  breiteEntlangWand,
  erzeugeId,
  gliederDerWandstelle,
  ohneWandbindung,
  ordneAnWandEin,
  ordneWandstellen,
} from '../document-model'
import { t } from '../sprache'

export interface WandVerschiebung {
  zustaende: Map<string, Partial<KomponentenObjekt>>
  nachbarn: Map<string, KomponentenKombination>
  label: string
}

function zustandVon(k: KomponentenObjekt): Partial<KomponentenObjekt> {
  return {
    position: k.position,
    drehung: k.drehung,
    groesseWelt: k.groesseWelt,
    breiteWelt: k.breiteWelt,
    wandstelle: k.wandstelle,
    kombination: k.kombination,
    kombinationsFaktor: k.kombinationsFaktor,
  }
}

function verschoben(p: Point, delta: Point): Point {
  return { x: p.x + delta.x, y: p.y + delta.y }
}

export function berechneWandVerschiebung(
  objekte: readonly Objekt[],
  komponentenIds: ReadonlySet<string>,
  objektIds: ReadonlySet<string>,
  delta: Point,
  zeigerZiel: WandflaechenTreffer | null,
  findeZiel: (punkt: Point) => WandflaechenTreffer | null,
  zeichnung: Zeichnung,
): WandVerschiebung | null {
  const zustaende = new Map<string, Partial<KomponentenObjekt>>()
  const nachbarn = new Map<string, KomponentenKombination>()

  if (objektIds.size === 1 && komponentenIds.size === 1) {
    const id = [...komponentenIds][0]
    const k = objekte.find((o): o is KomponentenObjekt => o.type === 'komponente' && o.id === id)
    if (!k) return null
    if (zeigerZiel) {
      const einordnung = ordneAnWandEin(objekte, k, zeigerZiel, zeichnung)
      const vomTraeger =
        k.traegerId !== undefined ? { traegerId: undefined, slotIndex: undefined } : {}
      zustaende.set(k.id, { ...zustandVon(einordnung.komponente), ...vomTraeger })
      for (const o of einordnung.objekte) {
        if (o.type !== 'komponente' || o.id === k.id || !o.kombination) continue
        const vorher = objekte.find((x) => x.id === o.id)
        if (vorher?.type !== 'komponente' || !vorher.kombination) continue
        if (o.wandstelle?.id === vorher.wandstelle?.id) nachbarn.set(o.id, o.kombination)
      }
      return { zustaende, nachbarn, label: t('werkzeuge.komponente.anWand') }
    }
    if (!k.wandstelle) return null
    zustaende.set(k.id, {
      ...zustandVon(ohneWandbindung(k)),
      position: verschoben(k.position, delta),
    })
    return { zustaende, nachbarn, label: t('werkzeuge.wandfang.loesen') }
  }

  const stellen = new Set<string>()
  for (const id of komponentenIds) {
    const o = objekte.find((x) => x.id === id)
    if (o?.type === 'komponente' && o.wandstelle) stellen.add(o.wandstelle.id)
  }
  if (stellen.size === 0) return null

  const umgesetzt = new Map<string, KomponentenObjekt>()
  const ziel = (punkt: Point, alt: KomponentenWandstelle, id: string): KomponentenWandstelle =>
    zielStelle(punkt, alt, id, zeigerZiel, findeZiel)
  for (const stelleId of stellen) {
    const glieder = gliederDerWandstelle(objekte, stelleId)
    const stelle = glieder[0].wandstelle!
    if (glieder.every((g) => komponentenIds.has(g.id))) {
      const neueStelle = ziel(verschoben(stelle.punkt, delta), stelle, stelle.id)
      for (const g of glieder) umgesetzt.set(g.id, { ...g, wandstelle: neueStelle })
      continue
    }
    const kombis = new Map<string, KomponentenObjekt[]>()
    for (const g of glieder) {
      const schluessel = `${g.kombination?.hoeheCm}|${g.kombination?.nr}`
      const liste = kombis.get(schluessel)
      if (liste) liste.push(g)
      else kombis.set(schluessel, [g])
    }
    for (const kombi of kombis.values()) {
      const gezogen = kombi.filter((g) => komponentenIds.has(g.id))
      if (gezogen.length === 0) continue
      if (gezogen.length < kombi.length) {
        for (const g of gezogen) {
          zustaende.set(g.id, {
            ...zustandVon(ohneWandbindung(g)),
            position: verschoben(g.position, delta),
          })
        }
        continue
      }
      const u = { x: Math.cos(stelle.richtung), y: Math.sin(stelle.richtung) }
      const anfang = Math.min(
        ...kombi.map(
          (g) =>
            (g.position.x - stelle.punkt.x) * u.x +
            (g.position.y - stelle.punkt.y) * u.y -
            breiteEntlangWand(g) / 2,
        ),
      )
      const punkt = { x: stelle.punkt.x + u.x * anfang, y: stelle.punkt.y + u.y * anfang }
      const neueStelle = ziel(verschoben(punkt, delta), stelle, erzeugeId('wandstelle'))
      for (const g of kombi) {
        const { reihenEnde: _e, ...kombination } = g.kombination!
        void _e
        umgesetzt.set(g.id, {
          ...g,
          wandstelle: neueStelle,
          kombination: { ...kombination, nr: 0, reihenStart: 0 },
        })
      }
    }
  }
  if (umgesetzt.size > 0) {
    const neu = ordneWandstellen(
      objekte.map((o) => umgesetzt.get(o.id) ?? o),
      zeichnung,
    )
    for (const o of neu) {
      if (o.type === 'komponente' && umgesetzt.has(o.id)) zustaende.set(o.id, zustandVon(o))
    }
  }
  return { zustaende, nachbarn, label: t('werkzeuge.auswahl.objekteVerschieben') }
}

function zielStelle(
  punkt: Point,
  alt: KomponentenWandstelle,
  id: string,
  zeigerZiel: WandflaechenTreffer | null,
  findeZiel: (punkt: Point) => WandflaechenTreffer | null,
): KomponentenWandstelle {
  let gesucht = punkt
  if (zeigerZiel) {
    const u = { x: Math.cos(zeigerZiel.richtung), y: Math.sin(zeigerZiel.richtung) }
    const s = (punkt.x - zeigerZiel.fusspunkt.x) * u.x + (punkt.y - zeigerZiel.fusspunkt.y) * u.y
    gesucht = { x: zeigerZiel.fusspunkt.x + u.x * s, y: zeigerZiel.fusspunkt.y + u.y * s }
  }
  const t = findeZiel(gesucht)
  if (t) {
    return {
      id,
      wandId: t.wandId,
      t: t.t,
      seite: t.seite,
      punkt: t.fusspunkt,
      richtung: t.richtung,
    }
  }
  return {
    id,
    wandId: null,
    t: null,
    seite: zeigerZiel?.seite ?? alt.seite,
    punkt: gesucht,
    richtung: zeigerZiel?.richtung ?? alt.richtung,
  }
}

export function wendeNachbarnAn(
  objekte: Objekt[],
  nachbarn: ReadonlyMap<string, KomponentenKombination>,
): Objekt[] {
  if (nachbarn.size === 0) return objekte
  return objekte.map((o) => {
    const kombination = o.type === 'komponente' ? nachbarn.get(o.id) : undefined
    return kombination && o.type === 'komponente' ? { ...o, kombination } : o
  })
}
