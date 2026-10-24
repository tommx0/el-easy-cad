import type { IfcAPI } from 'web-ifc'
import type { Point } from '../document-model'
import type { IfcGeschoss } from './ifc-modell'
import { IFC_TYP, liesLaengenFaktor } from './ifc-modell'
import type { Schnittlinie } from './schnitt'

const BOGEN_SCHRITTE = 12

interface Fluegel {
  band: number
  gegen: number
}

export function fluegelFuer(
  art: string | null,
  breite: number,
  gespiegelt: boolean,
): Fluegel[] | null {
  const rechts = gespiegelt ? 0 : breite
  const links = gespiegelt ? breite : 0
  switch (art) {
    case 'SINGLE_SWING_RIGHT':
      return [{ band: rechts, gegen: links }]
    case 'SINGLE_SWING_LEFT':
      return [{ band: links, gegen: rechts }]
    case 'DOUBLE_DOOR_SINGLE_SWING':
      return [
        { band: 0, gegen: breite / 2 },
        { band: breite, gegen: breite / 2 },
      ]
    default:
      return null
  }
}

export function fluegelLinien(fluegel: Fluegel, tiefe: number): Schnittlinie[] {
  const radius = Math.abs(fluegel.gegen - fluegel.band)
  const offen: Point = { x: fluegel.band, y: tiefe + radius }
  const bogen: Point[] = []
  const start = fluegel.gegen > fluegel.band ? 0 : Math.PI
  const ende = Math.PI / 2
  for (let i = 0; i <= BOGEN_SCHRITTE; i++) {
    const w = start + ((ende - start) * i) / BOGEN_SCHRITTE
    bogen.push({ x: fluegel.band + radius * Math.cos(w), y: tiefe + radius * Math.sin(w) })
  }
  return [
    { geschlossen: false, punkte: [{ x: fluegel.band, y: tiefe }, offen] },
    { geschlossen: false, punkte: bogen },
  ]
}

function wert(attribut: unknown): unknown {
  return attribut && typeof attribut === 'object' && 'value' in attribut
    ? (attribut as { value: unknown }).value
    : attribut
}

export function oeffnungsart(
  tuer: Record<string, unknown>,
  typ: Record<string, unknown> | null,
): string | null {
  const eigene = wert(tuer.OperationType)
  if (typeof eigene === 'string' && eigene !== 'NOTDEFINED') return eigene
  const vomTyp = typ ? wert(typ.OperationType) : null
  return typeof vomTyp === 'string' ? vomTyp : null
}

export function tuerAufschlaege(
  api: IfcAPI,
  modell: number,
  geschoss: Pick<IfcGeschoss, 'schnittElemente'>,
  tiefeJeTuer: ReadonlyMap<number, number> = new Map(),
  bauteilVon: (expressId: number) => number | undefined = () => undefined,
): Schnittlinie[] {
  const tueren = geschoss.schnittElemente.filter(
    (id) => (api.GetLineType(modell, id) as number) === IFC_TYP.DOOR,
  )
  if (tueren.length === 0) return []
  const faktor = liesLaengenFaktor(api, modell)
  const typen = typZuordnung(api, modell)
  const linien: Schnittlinie[] = []

  for (const id of tueren) {
    const tuer = api.GetLine(modell, id) as Record<string, unknown>
    const platzierung = (tuer.ObjectPlacement as { value?: number } | null)?.value
    const breiteRoh = wert(tuer.OverallWidth)
    if (platzierung === undefined || typeof breiteRoh !== 'number' || breiteRoh <= 0) continue
    const typId = typen.get(id)
    const typ = typId !== undefined ? (api.GetLine(modell, typId) as Record<string, unknown>) : null

    const m = api.GetWorldTransformMatrix(modell, platzierung)
    const xAchse = { x: m[0], y: m[1] }
    const yAchse = { x: m[4], y: m[5] }
    if (Math.abs(m[2]) > 1e-3 || Math.abs(m[6]) > 1e-3) continue
    const gespiegelt = xAchse.x * yAchse.y - xAchse.y * yAchse.x < 0
    const fluegel = fluegelFuer(oeffnungsart(tuer, typ), breiteRoh * faktor, gespiegelt)
    if (!fluegel) continue

    const ursprung = { x: m[12] * faktor, y: m[13] * faktor }
    const zuWelt = (p: Point): Point => ({
      x: ursprung.x + p.x * xAchse.x + p.y * yAchse.x,
      y: ursprung.y + p.x * xAchse.y + p.y * yAchse.y,
    })
    const tiefe = tiefeJeTuer.get(id) ?? 0
    const bauteil = bauteilVon(id)
    for (const f of fluegel) {
      for (const linie of fluegelLinien(f, tiefe)) {
        linien.push({
          geschlossen: false,
          punkte: linie.punkte.map(zuWelt),
          ...(bauteil !== undefined ? { bauteil } : {}),
        })
      }
    }
  }
  return linien
}

export function typZuordnung(api: IfcAPI, modell: number): Map<number, number> {
  const zuordnung = new Map<number, number>()
  const vektor = api.GetLineIDsWithType(modell, IFC_TYP.RELDEFINESBYTYPE)
  for (let i = 0; i < vektor.size(); i++) {
    const rel = api.GetLine(modell, vektor.get(i)) as Record<string, unknown>
    const typ = (rel.RelatingType as { value?: number } | null)?.value
    if (typ === undefined) continue
    for (const objekt of (rel.RelatedObjects as { value?: number }[] | null) ?? []) {
      if (typeof objekt?.value === 'number') zuordnung.set(objekt.value, typ)
    }
  }
  return zuordnung
}
