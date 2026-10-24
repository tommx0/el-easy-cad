import type { IfcAPI } from 'web-ifc'
import type {
  BauteilVorlagen,
  IfcLage,
  OeffnungsVorlage,
  Point,
  RaumVorlage,
  TreppenVorlage,
  WandVorlage,
} from '../document-model'
import {
  distance,
  naechsterPunktAufPfad,
  pfadGesamtLaenge,
  pointInPolygon,
  rohWinkelZuWelt,
  rohZuWelt,
} from '../document-model'
import {
  innererPunkt,
  polygonFlaeche,
  querAusdehnung,
  treppeAusPunkten,
  verbindeWandEnden,
  versetzteAchse,
  wandAusUmriss,
} from './bauteil-geometrie'
import type { HoehenIndex } from './ifc-modell'
import { IFC_TYP, bauteileInHoehe, liesLaengenFaktor, streameNetze } from './ifc-modell'
import { wendeLageAn } from './lage'
import { schneideNetz, verketteStrecken } from './schnitt'
import { fluegelFuer, oeffnungsart, typZuordnung } from './tuer-aufschlaege'

export const BAUTEIL_TYP = {
  WALL: 2391406946,
  WALLSTANDARDCASE: 3512223829,
  WALLELEMENTEDCASE: 4156078855,
  DOOR: IFC_TYP.DOOR,
  DOORSTANDARDCASE: 3242481149,
  WINDOW: 3304561284,
  WINDOWSTANDARDCASE: 486154966,
  STAIR: 331165859,
  STAIRFLIGHT: 4252922144,
  RAILING: 2262370178,
  SPACE: IFC_TYP.SPACE,
  RELASSOCIATESMATERIAL: 2655215786,
  MATERIALLAYERSETUSAGE: 1303795690,
  MATERIALLAYERSET: 3303938423,
  POLYLINE: 3724593414,
  TRIMMEDCURVE: 3593883385,
  LINE: 1281925730,
  INDEXEDPOLYCURVE: 2571569899,
} as const

const WAND_TYPEN = new Set<number>([
  BAUTEIL_TYP.WALL,
  BAUTEIL_TYP.WALLSTANDARDCASE,
  BAUTEIL_TYP.WALLELEMENTEDCASE,
])
const TUER_TYPEN = new Set<number>([BAUTEIL_TYP.DOOR, BAUTEIL_TYP.DOORSTANDARDCASE])
const FENSTER_TYPEN = new Set<number>([BAUTEIL_TYP.WINDOW, BAUTEIL_TYP.WINDOWSTANDARDCASE])

export const BAND_UNTER_EBENE = 1
export const BAND_UEBER_EBENE = 1.5
export const TREPPE_UNTER_EBENE = 2
export const TREPPE_UEBER_EBENE = 0.6

export function bauteilBand(hoehe: number): { unten: number; oben: number } {
  return { unten: hoehe - BAND_UNTER_EBENE, oben: hoehe + BAND_UEBER_EBENE }
}

export interface IfcBauteilHinweise {
  waendeGekruemmt: number
  waendeNichtAbleitbar: number
  oeffnungenOhneWand: number
  tuerenVereinfacht: number
  raeumeOhneUmriss: number
  raeumeZusammenfassung: number
}

export interface IfcBauteilfunde {
  waende: (WandVorlage & { ifcGuid: string })[]
  oeffnungen: (OeffnungsVorlage & { ifcGuid: string })[]
  treppen: (TreppenVorlage & { ifcGuid: string })[]
  raeume: (RaumVorlage & { ifcGuid: string })[]
  hinweise: IfcBauteilHinweise
}

interface Bezug {
  value: number
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

function bezugVon(attribut: unknown): number | undefined {
  const wert = (attribut as Bezug | null)?.value
  return typeof wert === 'number' ? wert : undefined
}

function bezuegeVon(attribut: unknown): number[] {
  if (!Array.isArray(attribut)) return []
  return attribut.map((b) => (b as Bezug)?.value).filter((v): v is number => typeof v === 'number')
}

function idsMitTyp(api: IfcAPI, modell: number, typ: number): number[] {
  const vektor = api.GetLineIDsWithType(modell, typ)
  const liste: number[] = []
  for (let i = 0; i < vektor.size(); i++) liste.push(vektor.get(i))
  return liste
}

function beziehungen(
  api: IfcAPI,
  modell: number,
  typ: number,
  von: string,
  nach: string,
): Map<number, number[]> {
  const ergebnis = new Map<number, number[]>()
  for (const id of idsMitTyp(api, modell, typ)) {
    const rel = api.GetLine(modell, id) as Record<string, unknown>
    const quelle = bezugVon(rel[von])
    if (quelle === undefined) continue
    const ziele = Array.isArray(rel[nach]) ? bezuegeVon(rel[nach]) : [bezugVon(rel[nach])]
    const liste = ergebnis.get(quelle) ?? []
    for (const ziel of ziele) if (ziel !== undefined) liste.push(ziel)
    ergebnis.set(quelle, liste)
  }
  return ergebnis
}

interface Netzdaten {
  punkte: Point[]
  hoehen: number[]
  strecken: number[]
  min: number
  max: number
}

function sammleNetze(
  api: IfcAPI,
  modell: number,
  ids: number[],
  hoehe: number,
  schneiden: ReadonlySet<number>,
): Map<number, Netzdaten> {
  const daten = new Map<number, Netzdaten>()
  if (ids.length === 0) return daten
  const eindeutig = [...new Set(ids)]
  streameNetze(api, modell, eindeutig, (netz) => {
    let eintrag = daten.get(netz.expressID)
    if (!eintrag) {
      eintrag = { punkte: [], hoehen: [], strecken: [], min: Infinity, max: -Infinity }
      daten.set(netz.expressID, eintrag)
    }
    for (let i = 0; i < netz.geometries.size(); i++) {
      const platziert = netz.geometries.get(i)
      const m = platziert.flatTransformation
      const geometrie = api.GetGeometry(modell, platziert.geometryExpressID)
      try {
        const v = api.GetVertexArray(geometrie.GetVertexData(), geometrie.GetVertexDataSize())
        for (let k = 0; k + 2 < v.length; k += 6) {
          const x = v[k]
          const y = v[k + 1]
          const z = v[k + 2]
          const h = m[1] * x + m[5] * y + m[9] * z + m[13]
          eintrag.punkte.push({
            x: m[0] * x + m[4] * y + m[8] * z + m[12],
            y: -(m[2] * x + m[6] * y + m[10] * z + m[14]),
          })
          eintrag.hoehen.push(h)
          if (h < eintrag.min) eintrag.min = h
          if (h > eintrag.max) eintrag.max = h
        }
        if (schneiden.has(netz.expressID)) {
          const indizes = api.GetIndexArray(geometrie.GetIndexData(), geometrie.GetIndexDataSize())
          schneideNetz(v, indizes, m, hoehe, eintrag.strecken)
        }
      } finally {
        geometrie.delete()
      }
    }
  })
  return daten
}

function schnittpunkte(daten: Netzdaten | undefined): Point[] {
  if (!daten) return []
  const punkte: Point[] = []
  for (let i = 0; i + 3 < daten.strecken.length; i += 4) {
    punkte.push({ x: daten.strecken[i], y: daten.strecken[i + 1] })
    punkte.push({ x: daten.strecken[i + 2], y: daten.strecken[i + 3] })
  }
  return punkte
}

type Achse = { art: 'gerade'; punkte: Point[] } | { art: 'gekruemmt' } | { art: 'keine' }

function liesAchse(api: IfcAPI, modell: number, element: Record<string, unknown>): Achse {
  const formId = bezugVon(element.Representation)
  if (formId === undefined) return { art: 'keine' }
  const form = api.GetLine(modell, formId) as Record<string, unknown>
  for (const repId of bezuegeVon(form.Representations)) {
    const rep = api.GetLine(modell, repId) as Record<string, unknown>
    if (textVon(rep.RepresentationIdentifier) !== 'Axis') continue
    const itemId = bezuegeVon(rep.Items)[0]
    if (itemId === undefined) continue
    const kurve = api.GetLine(modell, itemId, true) as Record<string, unknown>
    return achseAusKurve(kurve)
  }
  return { art: 'keine' }
}

function koordinaten(punkt: unknown): Point | null {
  const liste = (punkt as { Coordinates?: unknown[] } | null)?.Coordinates
  if (!Array.isArray(liste) || liste.length < 2) return null
  const x = zahlVon(liste[0])
  const y = zahlVon(liste[1])
  return x === null || y === null ? null : { x, y }
}

function achseAusKurve(kurve: Record<string, unknown>): Achse {
  const typ = kurve.type as number
  if (typ === BAUTEIL_TYP.POLYLINE) {
    const punkte = ((kurve.Points as unknown[]) ?? []).map(koordinaten)
    if (punkte.some((p) => p === null) || punkte.length < 2) return { art: 'keine' }
    return { art: 'gerade', punkte: punkte as Point[] }
  }
  if (typ === BAUTEIL_TYP.TRIMMEDCURVE) {
    const basis = kurve.BasisCurve as Record<string, unknown> | null
    if (!basis || basis.type !== BAUTEIL_TYP.LINE) return { art: 'gekruemmt' }
    const ursprung = koordinaten(basis.Pnt)
    const vektor = basis.Dir as Record<string, unknown> | null
    const richtung = (vektor?.Orientation as { DirectionRatios?: unknown[] } | null)
      ?.DirectionRatios
    const betrag = zahlVon(vektor?.Magnitude) ?? 1
    const rx = zahlVon(richtung?.[0])
    const ry = zahlVon(richtung?.[1])
    if (!ursprung || rx === null || ry === null) return { art: 'keine' }
    const l = Math.hypot(rx, ry) || 1
    const trimm = (liste: unknown): Point | null => {
      for (const eintrag of Array.isArray(liste) ? liste : []) {
        const p = koordinaten(eintrag)
        if (p) return p
        const parameter = zahlVon(eintrag)
        if (parameter !== null)
          return {
            x: ursprung.x + (rx / l) * betrag * parameter,
            y: ursprung.y + (ry / l) * betrag * parameter,
          }
      }
      return null
    }
    const a = trimm(kurve.Trim1)
    const b = trimm(kurve.Trim2)
    return a && b ? { art: 'gerade', punkte: [a, b] } : { art: 'keine' }
  }
  if (typ === BAUTEIL_TYP.INDEXEDPOLYCURVE) {
    const segmente = kurve.Segments
    if (
      Array.isArray(segmente) &&
      segmente.some((s) => /ARC/i.test(String((s as { name?: string })?.name ?? '')))
    )
      return { art: 'gekruemmt' }
    const liste = (kurve.Points as { CoordList?: unknown[][] } | null)?.CoordList ?? []
    const punkte = liste.map((c) => koordinaten({ Coordinates: c }))
    if (punkte.some((p) => p === null) || punkte.length < 2) return { art: 'keine' }
    return { art: 'gerade', punkte: punkte as Point[] }
  }
  return { art: 'keine' }
}

function platzierung(
  api: IfcAPI,
  modell: number,
  element: Record<string, unknown>,
): ArrayLike<number> | null {
  const id = bezugVon(element.ObjectPlacement)
  return id === undefined ? null : api.GetWorldTransformMatrix(modell, id)
}

function liesSchichten(
  api: IfcAPI,
  modell: number,
  materialId: number | undefined,
  faktor: number,
): { staerke: number; mitte: number | null } | null {
  if (materialId === undefined) return null
  const material = api.GetLine(modell, materialId) as Record<string, unknown>
  const typ = material.type as number
  let satzId: number | undefined
  let mitte: ((staerke: number) => number) | null = null
  if (typ === BAUTEIL_TYP.MATERIALLAYERSETUSAGE) {
    if (textVon(material.LayerSetDirection) !== 'AXIS2') return null
    satzId = bezugVon(material.ForLayerSet)
    const versatz = (zahlVon(material.OffsetFromReferenceLine) ?? 0) * faktor
    const richtung = textVon(material.DirectionSense) === 'NEGATIVE' ? -1 : 1
    mitte = (staerke) => versatz + (richtung * staerke) / 2
  } else if (typ === BAUTEIL_TYP.MATERIALLAYERSET) {
    satzId = materialId
  } else {
    return null
  }
  if (satzId === undefined) return null
  const satz = api.GetLine(modell, satzId) as Record<string, unknown>
  let staerke = 0
  for (const schichtId of bezuegeVon(satz.MaterialLayers)) {
    const schicht = api.GetLine(modell, schichtId) as Record<string, unknown>
    staerke += (zahlVon(schicht.LayerThickness) ?? 0) * faktor
  }
  if (!(staerke > 0)) return null
  return { staerke, mitte: mitte ? mitte(staerke) : null }
}

function zuWelt(m: ArrayLike<number>, p: Point, faktor: number): Point {
  return {
    x: (m[0] * p.x + m[4] * p.y + m[12]) * faktor,
    y: (m[1] * p.x + m[5] * p.y + m[13]) * faktor,
  }
}

const MINDEST_STEIGUNG = 0.3
const MINDEST_WANDLAENGE = 0.05
const MINDEST_DURCHDRINGUNG = 0.9

export function liesIfcBauteile(
  api: IfcAPI,
  modell: number,
  hoehe: number,
  index: HoehenIndex,
): IfcBauteilfunde {
  const faktor = liesLaengenFaktor(api, modell)
  const { unten, oben } = bauteilBand(hoehe)
  const typVon = (id: number) => api.GetLineType(modell, id) as number
  const zeileVon = (id: number) => api.GetLine(modell, id) as Record<string, unknown>
  const guidVon = (zeile: Record<string, unknown>, id: number) =>
    textVon(zeile.GlobalId) ?? String(id)
  const hinweise: IfcBauteilHinweise = {
    waendeGekruemmt: 0,
    waendeNichtAbleitbar: 0,
    oeffnungenOhneWand: 0,
    tuerenVereinfacht: 0,
    raeumeOhneUmriss: 0,
    raeumeZusammenfassung: 0,
  }

  const oeffnungenJeWand = beziehungen(
    api,
    modell,
    IFC_TYP.RELVOIDSELEMENT,
    'RelatingBuildingElement',
    'RelatedOpeningElement',
  )
  const fuellungJeOeffnung = beziehungen(
    api,
    modell,
    IFC_TYP.RELFILLSELEMENT,
    'RelatingOpeningElement',
    'RelatedBuildingElement',
  )
  const teile = beziehungen(api, modell, IFC_TYP.RELAGGREGATES, 'RelatingObject', 'RelatedObjects')
  const typen = typZuordnung(api, modell)
  const materialVon = new Map<number, number>()
  for (const [material, objekte] of beziehungen(
    api,
    modell,
    BAUTEIL_TYP.RELASSOCIATESMATERIAL,
    'RelatingMaterial',
    'RelatedObjects',
  ))
    for (const objekt of objekte) materialVon.set(objekt, material)

  const wandIds = bauteileInHoehe(index, hoehe).filter((id) => WAND_TYPEN.has(typVon(id)))
  const oeffnungIds = wandIds.flatMap((w) => oeffnungenJeWand.get(w) ?? [])
  const fuellIds = oeffnungIds.flatMap((o) => fuellungJeOeffnung.get(o) ?? [])

  const treppenEinheiten: { guidId: number; ids: number[]; lauf: boolean }[] = []
  const alleTreppen = idsMitTyp(api, modell, BAUTEIL_TYP.STAIR)
  const innereTreppen = new Set(
    alleTreppen.flatMap((t) => (teile.get(t) ?? []).filter((x) => typVon(x) === BAUTEIL_TYP.STAIR)),
  )
  const nachkommen = (id: number): number[] =>
    (teile.get(id) ?? [])
      .filter((t) => typVon(t) !== BAUTEIL_TYP.RAILING)
      .flatMap((t) => [t, ...nachkommen(t)])
  const laeufeInTreppen = new Set<number>()
  for (const treppe of alleTreppen) {
    if (innereTreppen.has(treppe)) continue
    const laeufe = nachkommen(treppe).filter((t) => typVon(t) === BAUTEIL_TYP.STAIRFLIGHT)
    for (const lauf of laeufe) laeufeInTreppen.add(lauf)
    if (laeufe.length > 0) {
      for (const lauf of laeufe) treppenEinheiten.push({ guidId: lauf, ids: [lauf], lauf: true })
    } else {
      treppenEinheiten.push({ guidId: treppe, ids: [treppe, ...nachkommen(treppe)], lauf: false })
    }
  }
  for (const lauf of idsMitTyp(api, modell, BAUTEIL_TYP.STAIRFLIGHT)) {
    if (!laeufeInTreppen.has(lauf)) treppenEinheiten.push({ guidId: lauf, ids: [lauf], lauf: true })
  }
  const raumIds = idsMitTyp(api, modell, BAUTEIL_TYP.SPACE)

  const netze = sammleNetze(
    api,
    modell,
    [
      ...wandIds,
      ...oeffnungIds,
      ...fuellIds,
      ...treppenEinheiten.flatMap((t) => t.ids),
      ...raumIds,
    ],
    hoehe,
    new Set([...wandIds, ...raumIds]),
  )

  const waende: (WandVorlage & { ifcGuid: string; expressId: number })[] = []
  for (const id of wandIds) {
    const zeile = zeileVon(id)
    const netz = netze.get(id)
    const schnitt = schnittpunkte(netz)
    const achse = liesAchse(api, modell, zeile)
    if (achse.art === 'gekruemmt') {
      hinweise.waendeGekruemmt++
      continue
    }
    const m = platzierung(api, modell, zeile)
    let wand: { punkte: Point[]; staerke: number } | null = null
    if (achse.art === 'gerade' && m) {
      const roh = achse.punkte.map((p) => zuWelt(m, p, faktor))
      const links = m[4] * -(roh[1].y - roh[0].y) + m[5] * (roh[1].x - roh[0].x) >= 0 ? 1 : -1
      const schichten = liesSchichten(
        api,
        modell,
        materialVon.get(id) ?? materialVon.get(typen.get(id) ?? -1),
        faktor,
      )
      const quer = querAusdehnung(roh, schnitt.length > 0 ? schnitt : (netz?.punkte ?? []))
      const gemessen =
        quer && quer.max - quer.min > 0.01
          ? { staerke: quer.max - quer.min, mitte: (quer.max + quer.min) / 2 }
          : null
      let staerke: number | null = null
      let mitte = 0
      if (schichten && schichten.mitte !== null) {
        staerke = schichten.staerke
        mitte = schichten.mitte * links
        if (gemessen && Math.abs(gemessen.mitte - mitte) > Math.max(0.02, staerke / 4)) {
          staerke = gemessen.staerke
          mitte = gemessen.mitte
        }
      } else if (gemessen) {
        staerke = gemessen.staerke
        mitte = gemessen.mitte
      } else if (schichten) {
        staerke = schichten.staerke
      }
      if (staerke !== null && pfadGesamtLaenge(roh) >= MINDEST_WANDLAENGE) {
        wand = { punkte: versetzteAchse(roh, mitte), staerke }
      }
    }
    if (!wand) {
      const umriss = verketteStrecken(netz?.strecken ?? []).map((l) => l.punkte)
      wand = umriss.length > 0 ? wandAusUmriss(umriss) : null
    }
    if (!wand) {
      hinweise.waendeNichtAbleitbar++
      continue
    }
    waende.push({ ...wand, ifcGuid: guidVon(zeile, id), expressId: id })
  }
  const verbunden = verbindeWandEnden(waende)

  const oeffnungen: (OeffnungsVorlage & { ifcGuid: string })[] = []
  const platzierteFuellungen = new Set<number>()
  verbunden.forEach((wand, wandIndex) => {
    const gesamt = pfadGesamtLaenge(wand.punkte)
    for (const oeffnungId of oeffnungenJeWand.get(wand.expressId) ?? []) {
      const fuellung = (fuellungJeOeffnung.get(oeffnungId) ?? []).find(
        (f) => TUER_TYPEN.has(typVon(f)) || FENSTER_TYPEN.has(typVon(f)),
      )
      if (fuellung === undefined && (fuellungJeOeffnung.get(oeffnungId) ?? []).length > 0) continue
      const netz =
        (fuellung !== undefined ? netze.get(fuellung) : undefined) ?? netze.get(oeffnungId)
      if (!netz || netz.punkte.length === 0) continue
      if (!(netz.min < oben && netz.max > unten)) continue
      let smin = Infinity
      let smax = -Infinity
      for (const p of netz.punkte) {
        const treffer = naechsterPunktAufPfad(wand.punkte, p)
        if (!treffer) continue
        smin = Math.min(smin, treffer.t * gesamt)
        smax = Math.max(smax, treffer.t * gesamt)
      }
      if (!(smax > smin)) continue
      const mitteS = (smin + smax) / 2
      const t = mitteS / gesamt

      if (fuellung === undefined) {
        const quer = querAusdehnung(wand.punkte, netz.punkte)
        if (!quer || quer.max - quer.min < MINDEST_DURCHDRINGUNG * wand.staerke) continue
        const zeile = zeileVon(oeffnungId)
        oeffnungen.push({
          art: 'wanddurchbruch',
          wandIndex,
          t,
          breite: smax - smin,
          gespiegelt: false,
          schwenkInnen: false,
          ifcGuid: guidVon(zeile, oeffnungId),
        })
        continue
      }

      platzierteFuellungen.add(fuellung)
      const zeile = zeileVon(fuellung)
      const breiteAttribut = zahlVon(zeile.OverallWidth)
      const breite = breiteAttribut && breiteAttribut > 0 ? breiteAttribut * faktor : smax - smin
      const guid = guidVon(zeile, fuellung)
      if (FENSTER_TYPEN.has(typVon(fuellung))) {
        oeffnungen.push({
          art: 'fenster',
          wandIndex,
          t,
          breite,
          gespiegelt: false,
          schwenkInnen: false,
          ifcGuid: guid,
        })
        continue
      }
      const anschlag = tuerAnschlag(api, modell, zeile, typen.get(fuellung), wand.punkte, t, faktor)
      if (anschlag.vereinfacht) hinweise.tuerenVereinfacht++
      oeffnungen.push({
        art: 'tuer',
        wandIndex,
        t,
        breite,
        gespiegelt: anschlag.gespiegelt,
        schwenkInnen: anschlag.schwenkInnen,
        ifcGuid: guid,
      })
    }
  })
  for (const [id, [min, max]] of index) {
    const typ = typVon(id)
    if (!TUER_TYPEN.has(typ) && !FENSTER_TYPEN.has(typ)) continue
    if (min < oben && max > unten && !platzierteFuellungen.has(id)) hinweise.oeffnungenOhneWand++
  }

  const treppen: (TreppenVorlage & { ifcGuid: string })[] = []
  for (const einheit of treppenEinheiten) {
    const punkte: Point[] = []
    const hoehen: number[] = []
    for (const id of einheit.ids) {
      const netz = netze.get(id)
      if (!netz) continue
      punkte.push(...netz.punkte)
      hoehen.push(...netz.hoehen)
    }
    if (punkte.length === 0) continue
    let anfang = Infinity
    let ende = -Infinity
    for (const h of hoehen) {
      if (h < anfang) anfang = h
      if (h > ende) ende = h
    }
    if (ende - anfang < MINDEST_STEIGUNG) continue
    if (!(anfang >= hoehe - TREPPE_UNTER_EBENE && anfang < hoehe + TREPPE_UEBER_EBENE)) continue
    const lage = treppeAusPunkten(punkte, hoehen)
    if (!lage) continue
    const zeile = zeileVon(einheit.guidId)
    const steigungen = einheit.lauf
      ? (zahlVon(zeile.NumberOfRisers) ?? zahlVon(zeile.NumberOfRiser))
      : null
    treppen.push({
      ...lage,
      ...(steigungen && steigungen >= 2 ? { stufenanzahl: Math.round(steigungen) } : {}),
      ifcGuid: guidVon(zeile, einheit.guidId),
    })
  }

  const raumKandidaten: { vorlage: RaumVorlage & { ifcGuid: string }; umriss: Point[] }[] = []
  for (const id of raumIds) {
    const netz = netze.get(id)
    if (!netz || !(netz.min < hoehe && netz.max > hoehe)) continue
    const zeile = zeileVon(id)
    const umrisse = verketteStrecken(netz.strecken).filter(
      (l) => l.geschlossen && l.punkte.length >= 3,
    )
    const umriss = umrisse.sort((a, b) => polygonFlaeche(b.punkte) - polygonFlaeche(a.punkte))[0]
    const punkt = umriss ? innererPunkt(umriss.punkte) : null
    if (!umriss || !punkt) {
      hinweise.raeumeOhneUmriss++
      continue
    }
    raumKandidaten.push({
      vorlage: { punktImRaum: punkt, name: raumName(zeile), ifcGuid: guidVon(zeile, id) },
      umriss: umriss.punkte,
    })
  }
  const raeume = raumKandidaten
    .filter((k, i) => {
      const umfasst = raumKandidaten.filter(
        (andere, j) => j !== i && pointInPolygon(andere.vorlage.punktImRaum, k.umriss),
      ).length
      if (umfasst >= 2) hinweise.raeumeZusammenfassung++
      return umfasst < 2
    })
    .map((k) => k.vorlage)

  return {
    waende: verbunden.map(({ expressId: _, ...w }) => w),
    oeffnungen,
    treppen,
    raeume,
    hinweise,
  }
}

function raumName(zeile: Record<string, unknown>): string {
  const nummer = textVon(zeile.Name)?.trim()
  const bezeichnung = textVon(zeile.LongName)?.trim()
  if (nummer && bezeichnung && nummer !== bezeichnung) return `${nummer} ${bezeichnung}`
  return bezeichnung || nummer || 'Raum'
}

function tuerAnschlag(
  api: IfcAPI,
  modell: number,
  tuer: Record<string, unknown>,
  typId: number | undefined,
  wand: Point[],
  t: number,
  faktor: number,
): { gespiegelt: boolean; schwenkInnen: boolean; vereinfacht: boolean } {
  const m = platzierung(api, modell, tuer)
  const breite = (zahlVon(tuer.OverallWidth) ?? 0) * faktor
  if (!m) return { gespiegelt: false, schwenkInnen: false, vereinfacht: true }
  const typ = typId !== undefined ? (api.GetLine(modell, typId) as Record<string, unknown>) : null
  const xAchse = { x: m[0], y: m[1] }
  const yAchse = { x: m[4], y: m[5] }
  const linkshaendig = xAchse.x * yAchse.y - xAchse.y * yAchse.x < 0
  const fluegel = breite > 0 ? fluegelFuer(oeffnungsart(tuer, typ), breite, linkshaendig) : null
  const ursprung = { x: m[12] * faktor, y: m[13] * faktor }

  const gesamt = pfadGesamtLaenge(wand)
  const epsilon = Math.min(0.001, 0.01 / Math.max(gesamt, 1e-6))
  const vor = punktAuf(wand, Math.max(0, t - epsilon))
  const nach = punktAuf(wand, Math.min(1, t + epsilon))
  const l = distance(vor, nach) || 1
  const richtung = { x: (nach.x - vor.x) / l, y: (nach.y - vor.y) / l }
  const mitte = punktAuf(wand, t)
  const schwenkInnen = richtung.x * yAchse.y - richtung.y * yAchse.x < 0
  if (!fluegel) return { gespiegelt: false, schwenkInnen, vereinfacht: true }

  const band = fluegel[0].band
  const bandPunkt = { x: ursprung.x + xAchse.x * band, y: ursprung.y + xAchse.y * band }
  const gespiegelt = (bandPunkt.x - mitte.x) * richtung.x + (bandPunkt.y - mitte.y) * richtung.y > 0
  return { gespiegelt, schwenkInnen, vereinfacht: fluegel.length > 1 }
}

function punktAuf(pfad: Point[], t: number): Point {
  const gesamt = pfadGesamtLaenge(pfad)
  let rest = t * gesamt
  for (let i = 0; i + 1 < pfad.length; i++) {
    const l = distance(pfad[i], pfad[i + 1])
    if (rest <= l || i + 2 === pfad.length) {
      const f = l > 0 ? Math.min(1, rest / l) : 0
      return {
        x: pfad[i].x + (pfad[i + 1].x - pfad[i].x) * f,
        y: pfad[i].y + (pfad[i + 1].y - pfad[i].y) * f,
      }
    }
    rest -= l
  }
  return pfad[0]
}

function runde(p: Point): Point {
  return { x: Math.round(p.x * 1e4) / 1e4, y: Math.round(p.y * 1e4) / 1e4 }
}

export function bauteileAufsBlatt(
  funde: Omit<IfcBauteilfunde, 'hinweise'>,
  lage: IfcLage,
  blatt: { ursprung: Point; massstab?: number | null; hintergrundDrehung?: number },
): BauteilVorlagen {
  const m = blatt.massstab ?? 1
  const lageBlatt = {
    ursprung: blatt.ursprung,
    massstab: blatt.massstab ?? null,
    hintergrundDrehung: blatt.hintergrundDrehung,
  }
  const welt = (p: Point): Point => runde(rohZuWelt(lageBlatt, wendeLageAn(p, lage)))
  return {
    waende: funde.waende.map((w) => ({ ...w, punkte: w.punkte.map(welt), staerke: w.staerke * m })),
    oeffnungen: funde.oeffnungen.map((o) => ({ ...o, breite: o.breite * m })),
    treppen: funde.treppen.map((t) => ({
      ...t,
      mitte: welt(t.mitte),
      breite: t.breite * m,
      hoehe: t.hoehe * m,
      drehung: rohWinkelZuWelt(lageBlatt, t.drehung + lage.drehung),
    })),
    raeume: funde.raeume.map((r) => ({ ...r, punktImRaum: welt(r.punktImRaum) })),
  }
}
