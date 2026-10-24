import type { Kabeltyp } from './kabeltyp'
import { sortiereKabeltypen } from './kabeltyp'
import type { LeitungsObjekt } from './objekte'
import type { Zeichnung } from './zeichnung'

export function benutzteKabeltypIds(zeichnung: Zeichnung): Set<string> {
  const ids = new Set<string>()
  if (zeichnung.standardKabeltypId) ids.add(zeichnung.standardKabeltypId)
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'leitung' && objekt.kabeltypId) ids.add(objekt.kabeltypId)
    }
  }
  return ids
}

export function abgeglicheneKabeltypen(
  zeichnung: Zeichnung,
  globaleTypen: readonly Kabeltyp[],
): Kabeltyp[] {
  const benutzt = benutzteKabeltypIds(zeichnung)
  const global = new Map(globaleTypen.map((t) => [t.id, t]))
  const mitgefuehrt = new Map(zeichnung.kabeltypen.map((t) => [t.id, t]))

  const neu: Kabeltyp[] = []
  for (const id of benutzt) {
    const typ = global.get(id) ?? mitgefuehrt.get(id)
    if (typ) neu.push(typ)
  }
  const sortiert = sortiereKabeltypen(neu)
  return gleicheKabeltypen(zeichnung.kabeltypen, sortiert) ? zeichnung.kabeltypen : sortiert
}

export function gleicheKabeltypen(a: readonly Kabeltyp[], b: readonly Kabeltyp[]): boolean {
  if (a.length !== b.length) return false
  return a.every((links, i) => {
    const rechts = b[i]
    return (
      links.id === rechts.id &&
      links.bezeichnung === rechts.bezeichnung &&
      links.gruppe === rechts.gruppe &&
      links.bemerkung === rechts.bemerkung &&
      links.aussendurchmesserMm === rechts.aussendurchmesserMm &&
      links.herkunft === rechts.herkunft &&
      links.aktiv === rechts.aktiv &&
      links.sortierung === rechts.sortierung
    )
  })
}

export function kabeltypText(
  leitung: Pick<LeitungsObjekt, 'kabeltypId' | 'typ'>,
  kabeltypen: readonly Kabeltyp[],
): string | null {
  if (leitung.kabeltypId) {
    const typ = kabeltypen.find((t) => t.id === leitung.kabeltypId)
    if (typ) return typ.bezeichnung
  }
  return leitung.typ?.trim() || null
}

export function unbekannteKabeltypen(
  zeichnung: Zeichnung,
  globaleTypen: readonly Kabeltyp[],
): Kabeltyp[] {
  const bekannt = new Set(globaleTypen.map((t) => t.id))
  return zeichnung.kabeltypen.filter((t) => !bekannt.has(t.id))
}
