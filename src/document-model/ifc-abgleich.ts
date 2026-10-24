import type { BauteilVorlagen } from './bauteil-uebernahme'
import type { BoundingBox, Point } from './geometry'
import { boundingBoxFromPoints, unionBoundingBox } from './geometry'
import type { Objekt } from './objekte'
import { getBoundingBox } from './objekte'
import { punktAufPfad } from './trunk-kette'

function cm(wert: number): string {
  return String(Math.round(wert * 100))
}

function punkt(p: Point): string {
  return `${cm(p.x)},${cm(p.y)}`
}

function streuwert(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export interface IfcStaende {
  waende: string[]
  oeffnungen: string[]
  treppen: string[]
  raeume: string[]
}

export function ifcStaende(vorlagen: BauteilVorlagen): IfcStaende {
  return {
    waende: vorlagen.waende.map((w) =>
      streuwert(['wand', ...w.punkte.map(punkt), cm(w.staerke)].join('|')),
    ),
    oeffnungen: vorlagen.oeffnungen.map((o) => {
      const wand = vorlagen.waende[o.wandIndex]
      const ort = wand ? punktAufPfad(wand.punkte, o.t) : { x: 0, y: 0 }
      return streuwert(
        [o.art, punkt(ort), cm(o.breite), o.gespiegelt ? 1 : 0, o.schwenkInnen ? 1 : 0].join('|'),
      )
    }),
    treppen: vorlagen.treppen.map((t) =>
      streuwert(
        [
          'treppe',
          punkt(t.mitte),
          cm(t.breite),
          cm(t.hoehe),
          Math.round(t.drehung * 1000),
          t.stufenanzahl ?? '',
        ].join('|'),
      ),
    ),
    raeume: (vorlagen.raeume ?? []).map((r) =>
      streuwert(
        ['raum', r.name, Math.round(r.punktImRaum.x * 10), Math.round(r.punktImRaum.y * 10)].join(
          '|',
        ),
      ),
    ),
  }
}

export type IfcBauteilTyp = 'wand' | 'tuer' | 'fenster' | 'wanddurchbruch' | 'treppe' | 'raum'

export interface IfcAbweichung {
  art: 'geaendert' | 'neu' | 'weggefallen'
  bauteil: IfcBauteilTyp
  ifcGuid: string
  objektIds: string[]
  bereich: BoundingBox | null
  name?: string
}

const IFC_BAUTEIL_TYPEN = new Set<string>([
  'wand',
  'tuer',
  'fenster',
  'wanddurchbruch',
  'treppe',
  'raum',
])

function umPunkt(p: Point, halb: number): BoundingBox {
  return { min: { x: p.x - halb, y: p.y - halb }, max: { x: p.x + halb, y: p.y + halb } }
}

export function vergleicheIfcBauteile(
  objekte: readonly Objekt[],
  neu: BauteilVorlagen,
): IfcAbweichung[] {
  const jeGuid = new Map<string, Objekt[]>()
  for (const o of objekte) {
    if (o.ifcGuid === undefined || !IFC_BAUTEIL_TYPEN.has(o.type)) continue
    const liste = jeGuid.get(o.ifcGuid) ?? []
    liste.push(o)
    jeGuid.set(o.ifcGuid, liste)
  }
  if (jeGuid.size === 0) return []
  const vorhandeneTypen = new Set([...jeGuid.values()].flat().map((o) => o.type))
  const staende = ifcStaende(neu)

  const kandidaten: {
    guid: string
    typ: IfcBauteilTyp
    stand: string
    bereich: BoundingBox
    name?: string
  }[] = []
  neu.waende.forEach((w, i) => {
    if (!w.ifcGuid) return
    const bereich = boundingBoxFromPoints(w.punkte)
    kandidaten.push({ guid: w.ifcGuid, typ: 'wand', stand: staende.waende[i], bereich })
  })
  neu.oeffnungen.forEach((o, i) => {
    const wand = neu.waende[o.wandIndex]
    if (!o.ifcGuid || !wand) return
    const ort = punktAufPfad(wand.punkte, o.t)
    kandidaten.push({
      guid: o.ifcGuid,
      typ: o.art,
      stand: staende.oeffnungen[i],
      bereich: umPunkt(ort, Math.max(o.breite / 2, 0.3)),
    })
  })
  neu.treppen.forEach((t, i) => {
    if (!t.ifcGuid) return
    kandidaten.push({
      guid: t.ifcGuid,
      typ: 'treppe',
      stand: staende.treppen[i],
      bereich: umPunkt(t.mitte, Math.max(t.breite, t.hoehe) / 2),
    })
  })
  ;(neu.raeume ?? []).forEach((r, i) => {
    if (!r.ifcGuid) return
    kandidaten.push({
      guid: r.ifcGuid,
      typ: 'raum',
      stand: staende.raeume[i],
      bereich: umPunkt(r.punktImRaum, 1),
      name: r.name,
    })
  })

  const bereichVon = (liste: Objekt[]): BoundingBox =>
    liste.map(getBoundingBox).reduce((a, b) => unionBoundingBox(a, b))
  const raumName = (liste: Objekt[]) => {
    const raum = liste.find((o) => o.type === 'raum')
    return raum?.type === 'raum' ? raum.name : undefined
  }

  const ergebnis: IfcAbweichung[] = []
  const gesehen = new Set<string>()
  for (const k of kandidaten) {
    gesehen.add(k.guid)
    const vorhanden = jeGuid.get(k.guid)
    if (!vorhanden) {
      if (vorhandeneTypen.has(k.typ))
        ergebnis.push({
          art: 'neu',
          bauteil: k.typ,
          ifcGuid: k.guid,
          objektIds: [],
          bereich: k.bereich,
          ...(k.name ? { name: k.name } : {}),
        })
      continue
    }
    if (vorhanden.some((o) => o.ifcStand !== undefined && o.ifcStand !== k.stand)) {
      const name = raumName(vorhanden) ?? k.name
      ergebnis.push({
        art: 'geaendert',
        bauteil: k.typ,
        ifcGuid: k.guid,
        objektIds: vorhanden.map((o) => o.id),
        bereich: bereichVon(vorhanden),
        ...(name ? { name } : {}),
      })
    }
  }
  for (const [guid, liste] of jeGuid) {
    if (gesehen.has(guid)) continue
    const name = raumName(liste)
    ergebnis.push({
      art: 'weggefallen',
      bauteil: liste[0].type as IfcBauteilTyp,
      ifcGuid: guid,
      objektIds: liste.map((o) => o.id),
      bereich: bereichVon(liste),
      ...(name ? { name } : {}),
    })
  }
  const reihenfolge = { geaendert: 0, neu: 1, weggefallen: 2 }
  return ergebnis.sort((a, b) => reihenfolge[a.art] - reihenfolge[b.art])
}
