import { erzeugeUebersetzer, QUELLSPRACHE } from '../sprache'
import type { Uebersetzer } from '../sprache'
import type { Blatt } from './blatt'
import type { Ebene } from './ebenen'
import { erzeugeEbene } from './ebenen'
import { uebernimmEbenen, zeichnungsEbenen } from './ebenen-synchron'
import type { Point } from './geometry'
import type { DxfEntity, HintergrundDxf, HintergrundIfc, HintergrundPdf } from './hintergrund'
import { istKalibriert } from './hintergrund'
import { hintergrundMassstab, rohWinkelZuWelt, rohZuWelt } from './hintergrund-lage'
import type { IfcBauteilGruppe } from './ifc-bauteilgruppen'
import {
  IFC_BAUTEILGRUPPEN,
  ifcGruppenEbenenName,
  ifcGruppeVonEntity,
  sichtbareIfcEntities,
} from './ifc-bauteilgruppen'
import type { Objekt } from './objekte'
import { neueObjektBasis } from './objekte'

export type HintergrundHerkunft = 'dxf' | 'ifc' | 'pdf'

export function grundrissEbenenName(tp: Uebersetzer = erzeugeUebersetzer(QUELLSPRACHE)): string {
  return tp('plan.vorgabe.ebene.grundriss')
}

export const EBENE_NAME_GRUNDRISS = grundrissEbenenName()

export const UMGEWANDELT_FARBE = '#7a8699'
export const UMGEWANDELT_STRICHSTAERKE = 1

export interface PlanLinie {
  a: Point
  b: Point
}

type UmwandelbarerHintergrund = HintergrundDxf | HintergrundIfc | HintergrundPdf

export function umwandelbarerHintergrund(
  blatt: Pick<Blatt, 'hintergrund'>,
  ersetzen = false,
): UmwandelbarerHintergrund | null {
  const h = blatt.hintergrund
  if (!h || h.typ === 'unbekannt') return null
  if (!istKalibriert(h)) return null
  if (h.typ !== 'dxf' && h.umgewandelt && !ersetzen) return null
  return h
}

export function objekteAusHintergrund(
  blatt: Pick<Blatt, 'hintergrund' | 'ursprung' | 'massstab' | 'hintergrundDrehung'>,
  ebene: string | ((gruppe: IfcBauteilGruppe | null) => string),
  pdfLinien: readonly PlanLinie[] = [],
): Objekt[] {
  const h = blatt.hintergrund
  if (!h || h.typ === 'unbekannt') return []
  const ebeneFuer = typeof ebene === 'string' ? () => ebene : ebene
  const herkunft: HintergrundHerkunft = h.typ
  const m = hintergrundMassstab(blatt)
  const welt = (p: Point): Point => rohZuWelt(blatt, p)
  const rechtecke = h.ausblendungen.map((a) => ({
    min: { x: Math.min(a.eckeA.x, a.eckeB.x), y: Math.min(a.eckeA.y, a.eckeB.y) },
    max: { x: Math.max(a.eckeA.x, a.eckeB.x), y: Math.max(a.eckeA.y, a.eckeB.y) },
  }))
  const verdeckt = (punkte: readonly Point[]) =>
    rechtecke.some((r) =>
      punkte.every((p) => p.x >= r.min.x && p.x <= r.max.x && p.y >= r.min.y && p.y <= r.max.y),
    )
  const basis = (e?: DxfEntity) => {
    const bauteil =
      h.typ === 'ifc' && e?.bauteil !== undefined ? h.bauteile?.[e.bauteil] : undefined
    const gruppe = h.typ === 'ifc' && e ? ifcGruppeVonEntity(h, e) : null
    return {
      ...neueObjektBasis(ebeneFuer(gruppe), {
        farbe: UMGEWANDELT_FARBE,
        strichstaerke: UMGEWANDELT_STRICHSTAERKE,
      }),
      ausHintergrund: herkunft,
      ...(bauteil ? { ausBauteil: bauteil.guid } : {}),
    }
  }

  const objekte: Objekt[] = []
  if (h.typ === 'pdf') {
    for (const l of pdfLinien) {
      if (verdeckt([l.a, l.b])) continue
      objekte.push({ ...basis(), type: 'linie', start: welt(l.a), ende: welt(l.b) })
    }
    return objekte
  }
  const entities = h.typ === 'ifc' ? sichtbareIfcEntities(h) : h.entities
  for (const e of entities) {
    if (e.type === 'linie') {
      if (verdeckt([e.start, e.ende])) continue
      objekte.push({ ...basis(e), type: 'linie', start: welt(e.start), ende: welt(e.ende) })
    } else if (e.type === 'polylinie') {
      if (e.punkte.length < 2 || verdeckt(e.punkte)) continue
      objekte.push({
        ...basis(e),
        type: 'polylinie',
        punkte: e.punkte.map(welt),
        geschlossen: e.geschlossen,
        fuellung: null,
      })
    } else {
      const r = e.radius
      const ecken = [
        { x: e.mittelpunkt.x - r, y: e.mittelpunkt.y - r },
        { x: e.mittelpunkt.x + r, y: e.mittelpunkt.y + r },
      ]
      if (verdeckt(ecken)) continue
      const mittelpunkt = welt(e.mittelpunkt)
      const radius = r * m
      objekte.push(
        e.type === 'kreis'
          ? { ...basis(e), type: 'kreis', mittelpunkt, radius, fuellung: null }
          : {
              ...basis(e),
              type: 'bogen',
              mittelpunkt,
              radius,
              startWinkel: rohWinkelZuWelt(blatt, e.startWinkel),
              endWinkel: rohWinkelZuWelt(blatt, e.endWinkel),
            },
      )
    }
  }
  return objekte
}

function sichereEbene(
  ebenen: Ebene[],
  passt: (e: Ebene) => boolean,
  neu: () => Ebene,
): { ebenen: Ebene[]; ebeneId: string } {
  const vorhanden = ebenen.find(passt)
  if (vorhanden) return { ebenen, ebeneId: vorhanden.id }
  let nach = ebenen.findIndex((e) => e.istHintergrundLayer)
  while (
    nach + 1 < ebenen.length &&
    (ebenen[nach + 1].istGrundrissLayer || ebenen[nach + 1].ifcGruppe)
  ) {
    nach++
  }
  const ebene = neu()
  const liste = [...ebenen]
  liste.splice(nach + 1, 0, ebene)
  return { ebenen: liste, ebeneId: ebene.id }
}

export function sichereGrundrissEbene(
  ebenen: readonly Ebene[],
  tp?: Uebersetzer,
): {
  ebenen: Ebene[]
  ebeneId: string
} {
  return sichereEbene(
    [...ebenen],
    (e) => !!e.istGrundrissLayer,
    () => ({ ...erzeugeEbene(grundrissEbenenName(tp)), istGrundrissLayer: true }),
  )
}

function sichereEbenenFuer(
  ebenen: readonly Ebene[],
  objekteOhneEbene: (ebene: (gruppe: IfcBauteilGruppe | null) => string) => Objekt[],
  tp: Uebersetzer | undefined,
): { ebenen: Ebene[]; objekte: Objekt[] } {
  const vorkommend = new Set<IfcBauteilGruppe | null>()
  objekteOhneEbene((gruppe) => {
    vorkommend.add(gruppe)
    return ''
  })
  const plan = tp ?? erzeugeUebersetzer(QUELLSPRACHE)
  let liste = [...ebenen]
  const idJeGruppe = new Map<IfcBauteilGruppe | null, string>()
  if (vorkommend.has(null)) {
    const r = sichereGrundrissEbene(liste, plan)
    liste = r.ebenen
    idJeGruppe.set(null, r.ebeneId)
  }
  for (const info of IFC_BAUTEILGRUPPEN) {
    if (!vorkommend.has(info.id)) continue
    const r = sichereEbene(
      liste,
      (e) => e.ifcGruppe === info.id,
      () => ({ ...erzeugeEbene(ifcGruppenEbenenName(info.id, plan)), ifcGruppe: info.id }),
    )
    liste = r.ebenen
    idJeGruppe.set(info.id, r.ebeneId)
  }
  return {
    ebenen: liste,
    objekte: objekteOhneEbene((gruppe) => idJeGruppe.get(gruppe) ?? ''),
  }
}

export interface UmwandelnErgebnis {
  blaetter: Blatt[]
  anzahl: number
  ersetzt: number
}

export function wandleHintergrundUm(
  blaetter: readonly Blatt[],
  blattId: string,
  optionen: { pdfLinien?: readonly PlanLinie[]; ersetzen?: boolean; tp?: Uebersetzer } = {},
): UmwandelnErgebnis | null {
  const blatt = blaetter.find((b) => b.id === blattId)
  if (!blatt) return null
  const h = umwandelbarerHintergrund(blatt, optionen.ersetzen)
  if (!h) return null
  const { ebenen, objekte: neue } = sichereEbenenFuer(
    zeichnungsEbenen(blaetter),
    (ebene) => objekteAusHintergrund(blatt, ebene, optionen.pdfLinien),
    optionen.tp,
  )
  const bleiben = optionen.ersetzen
    ? blatt.objekte.filter((o) => o.ausHintergrund !== h.typ)
    : blatt.objekte
  if (neue.length === 0 && bleiben.length === blatt.objekte.length) return null

  const umgewandelt: Blatt =
    h.typ === 'dxf'
      ? { ...blatt, hintergrund: null, objekte: [...neue, ...bleiben] }
      : {
          ...blatt,
          hintergrund: { ...h, umgewandelt: true },
          hintergrundSichtbar: false,
          objekte: [...neue, ...bleiben],
        }
  return {
    blaetter: blaetter.map((b) => uebernimmEbenen(b.id === blattId ? umgewandelt : b, ebenen)),
    anzahl: neue.length,
    ersetzt: blatt.objekte.length - bleiben.length,
  }
}

export function umwandelbareBlaetter(blaetter: readonly Blatt[]): Blatt[] {
  return blaetter.filter((b) => umwandelbarerHintergrund(b) !== null)
}

export interface UmwandelnAuftrag {
  blattId: string
  pdfLinien?: readonly PlanLinie[]
}

export interface UmwandelnMehrereErgebnis {
  blaetter: Blatt[]
  anzahl: number
  jeBlatt: { blattId: string; anzahl: number }[]
}

export function wandleHintergruendeUm(
  blaetter: readonly Blatt[],
  auftraege: readonly UmwandelnAuftrag[],
  tp?: Uebersetzer,
): UmwandelnMehrereErgebnis | null {
  let stand: Blatt[] = [...blaetter]
  let anzahl = 0
  const jeBlatt: UmwandelnMehrereErgebnis['jeBlatt'] = []
  for (const { blattId, pdfLinien } of auftraege) {
    const ergebnis = wandleHintergrundUm(stand, blattId, { pdfLinien, tp })
    if (!ergebnis) continue
    stand = ergebnis.blaetter
    anzahl += ergebnis.anzahl
    jeBlatt.push({ blattId, anzahl: ergebnis.anzahl })
  }
  return jeBlatt.length > 0 ? { blaetter: stand, anzahl, jeBlatt } : null
}
