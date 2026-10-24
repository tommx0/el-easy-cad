import type { IfcAPI } from 'web-ifc'
import type { IfcBauteil, IfcBauteilGruppe } from '../document-model'
import { IFC_BAUTEILGRUPPEN, ifcGruppeVonKlasse } from '../document-model'
import type { Schnittlinie } from './schnitt'
import { schneideNetz, verketteStrecken } from './schnitt'
import { tuerAufschlaege } from './tuer-aufschlaege'

export const IFC_TYP = {
  PROJECT: 103090709,
  BUILDINGSTOREY: 3124254112,
  RELCONTAINEDINSPATIALSTRUCTURE: 3242617779,
  RELAGGREGATES: 160246688,
  RELVOIDSELEMENT: 1401173127,
  RELFILLSELEMENT: 3940055652,
  SPACE: 3856911033,
  OPENINGELEMENT: 3588315303,
  OPENINGSTANDARDCASE: 3079942009,
  SIUNIT: 448429030,
  CONVERSIONBASEDUNIT: 2889183280,
  DOOR: 395920057,
  RELDEFINESBYTYPE: 781010003,
  SLAB: 1529196076,
  SLABSTANDARDCASE: 3027962421,
  SLABELEMENTEDCASE: 3127900445,
  WALL: 2391406946,
  WALLSTANDARDCASE: 3512223829,
  WALLELEMENTEDCASE: 4156078855,
  CURTAINWALL: 3495092785,
  ROOF: 2016517767,
  COVERING: 1973544240,
} as const

export const NICHT_SCHNEIDEN = new Set<number>([
  IFC_TYP.SPACE,
  IFC_TYP.OPENINGELEMENT,
  IFC_TYP.OPENINGSTANDARDCASE,
])

export interface IfcGeschoss {
  expressId: number
  guid: string
  name: string
  kote: number
  basisHoehe: number
  elementAnzahl: number
  schnittElemente: number[]
}

interface Bezug {
  value: number
}

const SI_PRAEFIX: Record<string, number> = {
  EXA: 1e18,
  PETA: 1e15,
  TERA: 1e12,
  GIGA: 1e9,
  MEGA: 1e6,
  KILO: 1e3,
  HECTO: 1e2,
  DECA: 1e1,
  DECI: 1e-1,
  CENTI: 1e-2,
  MILLI: 1e-3,
  MICRO: 1e-6,
  NANO: 1e-9,
  PICO: 1e-12,
  FEMTO: 1e-15,
  ATTO: 1e-18,
}

function wertVon(attribut: unknown): unknown {
  return attribut && typeof attribut === 'object' && 'value' in attribut
    ? (attribut as { value: unknown }).value
    : attribut
}

function zahlVon(attribut: unknown): number | null {
  const wert = wertVon(attribut)
  return typeof wert === 'number' && Number.isFinite(wert) ? wert : null
}

function textVon(attribut: unknown): string | null {
  const wert = wertVon(attribut)
  return typeof wert === 'string' ? wert : null
}

function bezuegeVon(attribut: unknown): number[] {
  if (!Array.isArray(attribut)) return []
  return attribut.map((b) => (b as Bezug)?.value).filter((v): v is number => typeof v === 'number')
}

function ids(api: IfcAPI, modell: number, typ: number): number[] {
  const vektor = api.GetLineIDsWithType(modell, typ)
  const liste: number[] = []
  for (let i = 0; i < vektor.size(); i++) liste.push(vektor.get(i))
  return liste
}

function faktorEinerSiEinheit(einheit: Record<string, unknown>): number {
  const praefix = textVon(einheit.Prefix)
  return praefix ? (SI_PRAEFIX[praefix] ?? 1) : 1
}

export function liesLaengenFaktor(api: IfcAPI, modell: number): number {
  const projekt = ids(api, modell, IFC_TYP.PROJECT)[0]
  if (projekt === undefined) return 1
  const zeile = api.GetLine(modell, projekt, true) as Record<string, unknown>
  const zuordnung = zeile.UnitsInContext as { Units?: unknown[] } | null
  for (const einheit of zuordnung?.Units ?? []) {
    const e = einheit as Record<string, unknown>
    if (textVon(e.UnitType) !== 'LENGTHUNIT') continue
    if (e.type === IFC_TYP.SIUNIT) return faktorEinerSiEinheit(e)
    if (e.type === IFC_TYP.CONVERSIONBASEDUNIT) {
      const umrechnung = e.ConversionFactor as Record<string, unknown> | null
      const wert = zahlVon(umrechnung?.ValueComponent)
      const basis = umrechnung?.UnitComponent as Record<string, unknown> | null
      if (wert !== null) return wert * (basis ? faktorEinerSiEinheit(basis) : 1)
    }
  }
  return 1
}

export function liesGeschosse(api: IfcAPI, modell: number): IfcGeschoss[] {
  const faktor = liesLaengenFaktor(api, modell)

  const enthalten = new Map<number, number[]>()
  for (const id of ids(api, modell, IFC_TYP.RELCONTAINEDINSPATIALSTRUCTURE)) {
    const rel = api.GetLine(modell, id) as Record<string, unknown>
    const struktur = (rel.RelatingStructure as Bezug | null)?.value
    if (struktur === undefined) continue
    const liste = enthalten.get(struktur) ?? []
    liste.push(...bezuegeVon(rel.RelatedElements))
    enthalten.set(struktur, liste)
  }

  const teile = new Map<number, number[]>()
  for (const id of ids(api, modell, IFC_TYP.RELAGGREGATES)) {
    const rel = api.GetLine(modell, id) as Record<string, unknown>
    const ganzes = (rel.RelatingObject as Bezug | null)?.value
    if (ganzes === undefined) continue
    const liste = teile.get(ganzes) ?? []
    liste.push(...bezuegeVon(rel.RelatedObjects))
    teile.set(ganzes, liste)
  }

  const oeffnungen = new Map<number, number[]>()
  for (const id of ids(api, modell, IFC_TYP.RELVOIDSELEMENT)) {
    const rel = api.GetLine(modell, id) as Record<string, unknown>
    const element = (rel.RelatingBuildingElement as Bezug | null)?.value
    const oeffnung = (rel.RelatedOpeningElement as Bezug | null)?.value
    if (element === undefined || oeffnung === undefined) continue
    const liste = oeffnungen.get(element) ?? []
    liste.push(oeffnung)
    oeffnungen.set(element, liste)
  }
  const fuellungen = new Map<number, number[]>()
  for (const id of ids(api, modell, IFC_TYP.RELFILLSELEMENT)) {
    const rel = api.GetLine(modell, id) as Record<string, unknown>
    const oeffnung = (rel.RelatingOpeningElement as Bezug | null)?.value
    const element = (rel.RelatedBuildingElement as Bezug | null)?.value
    if (element === undefined || oeffnung === undefined) continue
    const liste = fuellungen.get(oeffnung) ?? []
    liste.push(element)
    fuellungen.set(oeffnung, liste)
  }

  const typVon = (id: number): number => api.GetLineType(modell, id) as number

  const geschosse: IfcGeschoss[] = []
  for (const id of ids(api, modell, IFC_TYP.BUILDINGSTOREY)) {
    const zeile = api.GetLine(modell, id) as Record<string, unknown>
    const direkt = (enthalten.get(id) ?? []).filter((e) => typVon(e) !== IFC_TYP.SPACE)

    const schnitt = new Set<number>()
    const offen = [...direkt]
    while (offen.length > 0) {
      const element = offen.pop() as number
      if (schnitt.has(element)) continue
      schnitt.add(element)
      offen.push(...(teile.get(element) ?? []))
      for (const oeffnung of oeffnungen.get(element) ?? []) {
        offen.push(...(fuellungen.get(oeffnung) ?? []))
      }
    }
    for (const element of [...schnitt]) {
      const typ = typVon(element)
      if (NICHT_SCHNEIDEN.has(typ) || typ === IFC_TYP.BUILDINGSTOREY) schnitt.delete(element)
    }

    const platzierung = (zeile.ObjectPlacement as Bezug | null)?.value
    const basisHoehe =
      platzierung !== undefined
        ? api.GetWorldTransformMatrix(modell, platzierung)[14] * faktor
        : (zahlVon(zeile.Elevation) ?? 0) * faktor
    const elevation = zahlVon(zeile.Elevation)

    geschosse.push({
      expressId: id,
      guid: textVon(zeile.GlobalId) ?? '',
      name: textVon(zeile.Name) || textVon(zeile.LongName) || `Geschoss ${geschosse.length + 1}`,
      kote: elevation !== null ? elevation * faktor : basisHoehe,
      basisHoehe,
      elementAnzahl: direkt.length,
      schnittElemente: [...schnitt],
    })
  }
  return geschosse.sort((a, b) => a.basisHoehe - b.basisHoehe)
}

type NetzRueckruf = Parameters<IfcAPI['StreamMeshes']>[2]

export function streameNetze(
  api: IfcAPI,
  modell: number,
  ids: number[],
  rueckruf: NetzRueckruf,
): void {
  try {
    api.StreamMeshes(modell, ids, rueckruf)
  } catch (fehler) {
    const kern = (api as unknown as { wasmModule?: Record<string, unknown> }).wasmModule
    const alt = kern?.StreamMeshes
    if (!(fehler instanceof Error) || !/expected 3/.test(fehler.message)) throw fehler
    if (typeof alt !== 'function') throw fehler
    ;(alt as (m: number, i: number[], r: NetzRueckruf) => void).call(kern, modell, ids, rueckruf)
  }
}

export type HoehenIndex = Map<number, [number, number]>

export function baueHoehenIndex(api: IfcAPI, modell: number): HoehenIndex {
  const index: HoehenIndex = new Map()
  streameAlleNetze(api, modell, (netz) => {
    if (NICHT_SCHNEIDEN.has(api.GetLineType(modell, netz.expressID) as number)) return
    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < netz.geometries.size(); i++) {
      const platziert = netz.geometries.get(i)
      const m = platziert.flatTransformation
      const geometrie = api.GetGeometry(modell, platziert.geometryExpressID)
      try {
        const v = api.GetVertexArray(geometrie.GetVertexData(), geometrie.GetVertexDataSize())
        for (let k = 0; k + 2 < v.length; k += 6) {
          const hoehe = m[1] * v[k] + m[5] * v[k + 1] + m[9] * v[k + 2] + m[13]
          if (hoehe < min) min = hoehe
          if (hoehe > max) max = hoehe
        }
      } finally {
        geometrie.delete()
      }
    }
    if (Number.isFinite(min)) {
      const bisher = index.get(netz.expressID)
      index.set(
        netz.expressID,
        bisher ? [Math.min(bisher[0], min), Math.max(bisher[1], max)] : [min, max],
      )
    }
  })
  return index
}

export function deckenAusdehnungen(
  api: IfcAPI,
  modell: number,
  index: HoehenIndex,
): [number, number][] {
  const ergebnis: [number, number][] = []
  for (const typ of [IFC_TYP.SLAB, IFC_TYP.SLABSTANDARDCASE, IFC_TYP.SLABELEMENTEDCASE])
    for (const id of ids(api, modell, typ)) {
      const ausdehnung = index.get(id)
      if (ausdehnung) ergebnis.push(ausdehnung)
    }
  return ergebnis
}

export function bauteileInHoehe(index: HoehenIndex, hoehe: number): number[] {
  const treffer: number[] = []
  for (const [id, [min, max]] of index) if (min < hoehe && max > hoehe) treffer.push(id)
  return treffer
}

export function schneideGeschoss(
  api: IfcAPI,
  modell: number,
  geschoss: IfcGeschoss,
  schnitthoehe: number,
  index: HoehenIndex = baueHoehenIndex(api, modell),
  bauteile?: IfcBauteil[],
): Schnittlinie[] {
  const hoehe = geschoss.basisHoehe + schnitthoehe
  const linien: Schnittlinie[] = []
  const gesehen = new Set<number>()
  const tuerenDesGeschosses = geschoss.schnittElemente.filter(
    (id) => (api.GetLineType(modell, id) as number) === IFC_TYP.DOOR,
  )
  const kandidaten = [...new Set([...bauteileInHoehe(index, hoehe), ...tuerenDesGeschosses])]
  if (kandidaten.length === 0) return linien
  const faktor = liesLaengenFaktor(api, modell)
  const tuerLagen = new Map<number, { ox: number; oy: number; yx: number; yy: number }>()
  for (const id of tuerenDesGeschosses) {
    const platzierung = (api.GetLine(modell, id) as { ObjectPlacement?: Bezug | null })
      .ObjectPlacement?.value
    if (platzierung === undefined) continue
    const m = api.GetWorldTransformMatrix(modell, platzierung)
    tuerLagen.set(id, { ox: m[12] * faktor, oy: m[13] * faktor, yx: m[4], yy: m[5] })
  }
  const tuerTiefen = new Map<number, number>()
  const bauteilVon = bauteilSammler(api, modell, bauteile)

  streameNetze(api, modell, kandidaten, (netz) => {
    if (gesehen.has(netz.expressID)) return
    gesehen.add(netz.expressID)
    const tuerLage = tuerLagen.get(netz.expressID)
    const strecken: number[] = []
    const anzahl = netz.geometries.size()
    for (let i = 0; i < anzahl; i++) {
      const platziert = netz.geometries.get(i)
      const geometrie = api.GetGeometry(modell, platziert.geometryExpressID)
      try {
        const eckpunkte = api.GetVertexArray(
          geometrie.GetVertexData(),
          geometrie.GetVertexDataSize(),
        )
        const indizes = api.GetIndexArray(geometrie.GetIndexData(), geometrie.GetIndexDataSize())
        schneideNetz(eckpunkte, indizes, platziert.flatTransformation, hoehe, strecken)
        if (tuerLage) {
          const tiefe = groessteTiefe(eckpunkte, platziert.flatTransformation, tuerLage)
          tuerTiefen.set(netz.expressID, Math.max(tuerTiefen.get(netz.expressID) ?? 0, tiefe))
        }
      } finally {
        geometrie.delete()
      }
    }
    if (strecken.length > 0)
      linien.push(...mitBauteil(verketteStrecken(strecken), bauteilVon, netz.expressID))
  })
  linien.push(...tuerAufschlaege(api, modell, geschoss, tuerTiefen, bauteilVon))
  return linien
}

export function bauteilSammler(
  api: IfcAPI,
  modell: number,
  bauteile: IfcBauteil[] | undefined,
): (expressId: number) => number | undefined {
  if (!bauteile) return () => undefined
  const indexJeElement = new Map<number, number>()
  return (expressId) => {
    const bekannt = indexJeElement.get(expressId)
    if (bekannt !== undefined) return bekannt
    const zeile = api.GetLine(modell, expressId) as Record<string, unknown>
    const name = textVon(zeile.Name)
    const eintrag: IfcBauteil = {
      guid: textVon(zeile.GlobalId) ?? String(expressId),
      klasse: api.GetNameFromTypeCode(api.GetLineType(modell, expressId) as number),
      ...(name ? { name } : {}),
    }
    bauteile.push(eintrag)
    indexJeElement.set(expressId, bauteile.length - 1)
    return bauteile.length - 1
  }
}

function mitBauteil(
  linien: Schnittlinie[],
  bauteilVon: (expressId: number) => number | undefined,
  expressId: number,
): Schnittlinie[] {
  const bauteil = bauteilVon(expressId)
  return bauteil === undefined ? linien : linien.map((l) => ({ ...l, bauteil }))
}

function streameAlleNetze(api: IfcAPI, modell: number, rueckruf: NetzRueckruf): void {
  try {
    api.StreamAllMeshes(modell, rueckruf)
  } catch (fehler) {
    const kern = (api as unknown as { wasmModule?: Record<string, unknown> }).wasmModule
    const alt = kern?.StreamAllMeshes
    if (!(fehler instanceof Error) || !/expected 2/.test(fehler.message)) throw fehler
    if (typeof alt !== 'function') throw fehler
    ;(alt as (m: number, r: NetzRueckruf) => void).call(kern, modell, rueckruf)
  }
}

export function schneideAlles(
  api: IfcAPI,
  modell: number,
  hoehe: number,
  index: HoehenIndex = baueHoehenIndex(api, modell),
  bauteile?: IfcBauteil[],
): Schnittlinie[] {
  const linien: Schnittlinie[] = []
  const gesehen = new Set<number>()
  const kandidaten = bauteileInHoehe(index, hoehe)
  if (kandidaten.length === 0) return linien
  const bauteilVon = bauteilSammler(api, modell, bauteile)
  streameNetze(api, modell, kandidaten, (netz) => {
    if (gesehen.has(netz.expressID)) return
    gesehen.add(netz.expressID)
    const strecken: number[] = []
    for (let i = 0; i < netz.geometries.size(); i++) {
      const platziert = netz.geometries.get(i)
      const geometrie = api.GetGeometry(modell, platziert.geometryExpressID)
      try {
        const eckpunkte = api.GetVertexArray(
          geometrie.GetVertexData(),
          geometrie.GetVertexDataSize(),
        )
        const indizes = api.GetIndexArray(geometrie.GetIndexData(), geometrie.GetIndexDataSize())
        schneideNetz(eckpunkte, indizes, platziert.flatTransformation, hoehe, strecken)
      } finally {
        geometrie.delete()
      }
    }
    if (strecken.length > 0) {
      linien.push(...mitBauteil(verketteStrecken(strecken), bauteilVon, netz.expressID))
    }
  })
  return linien
}

export function hoehenVersatz(
  geschosse: readonly Pick<IfcGeschoss, 'basisHoehe' | 'kote'>[],
): number {
  const erstes = geschosse[0]
  return erstes ? erstes.basisHoehe - erstes.kote : 0
}

function groessteTiefe(
  eckpunkte: ArrayLike<number>,
  m: ArrayLike<number>,
  lage: { ox: number; oy: number; yx: number; yy: number },
): number {
  let tiefe = -Infinity
  for (let i = 0; i + 2 < eckpunkte.length; i += 6) {
    const x = eckpunkte[i]
    const y = eckpunkte[i + 1]
    const z = eckpunkte[i + 2]
    const px = m[0] * x + m[4] * y + m[8] * z + m[12]
    const py = -(m[2] * x + m[6] * y + m[10] * z + m[14])
    tiefe = Math.max(tiefe, (px - lage.ox) * lage.yx + (py - lage.oy) * lage.yy)
  }
  return Number.isFinite(tiefe) ? tiefe : 0
}

export interface IfcGruppenAnzahl {
  gruppe: IfcBauteilGruppe
  anzahl: number
  klassen: { klasse: string; anzahl: number }[]
}

export function zaehleBauteilgruppen(
  api: IfcAPI,
  modell: number,
  geschosse: readonly Pick<IfcGeschoss, 'schnittElemente'>[],
): IfcGruppenAnzahl[] {
  const jeKlasse = new Map<string, number>()
  const gezaehlt = new Set<number>()
  for (const g of geschosse) {
    for (const id of g.schnittElemente) {
      if (gezaehlt.has(id)) continue
      gezaehlt.add(id)
      const typ = api.GetLineType(modell, id) as number
      if (NICHT_SCHNEIDEN.has(typ)) continue
      const klasse = api.GetNameFromTypeCode(typ)
      jeKlasse.set(klasse, (jeKlasse.get(klasse) ?? 0) + 1)
    }
  }
  return IFC_BAUTEILGRUPPEN.flatMap((info) => {
    const klassen = [...jeKlasse]
      .filter(([klasse]) => ifcGruppeVonKlasse(klasse) === info.id)
      .map(([klasse, anzahl]) => ({ klasse, anzahl }))
      .sort((a, b) => b.anzahl - a.anzahl)
    const anzahl = klassen.reduce((summe, k) => summe + k.anzahl, 0)
    return anzahl > 0 ? [{ gruppe: info.id, anzahl, klassen }] : []
  })
}
