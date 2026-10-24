import { erzeugeId } from './id'
import type { KabeltypUebersetzung, Uebersetzungen } from './katalog-uebersetzung'

export type KabeltypHerkunft = 'standard' | 'benutzer'

export interface Kabeltyp {
  id: string
  bezeichnung: string
  gruppe: string
  bemerkung?: string
  uebersetzungen?: Uebersetzungen<KabeltypUebersetzung>
  aussendurchmesserMm?: number
  herkunft: KabeltypHerkunft
  aktiv: boolean
  sortierung?: number
  seedVersion?: number
}

export function neuerKabeltyp(
  angaben: Partial<Kabeltyp> & Pick<Kabeltyp, 'bezeichnung' | 'gruppe'>,
): Kabeltyp {
  return {
    id: erzeugeId('kabeltyp'),
    herkunft: 'benutzer',
    aktiv: true,
    ...angaben,
  }
}

export function dupliziereKabeltyp(typ: Kabeltyp, neueBezeichnung?: string): Kabeltyp {
  return {
    ...typ,
    id: erzeugeId('kabeltyp'),
    bezeichnung: neueBezeichnung ?? `${typ.bezeichnung} (Kopie)`,
    herkunft: 'benutzer',
    seedVersion: undefined,
  }
}

export function sortiereKabeltypen(typen: readonly Kabeltyp[]): Kabeltyp[] {
  return [...typen].sort((a, b) => {
    const gruppe = a.gruppe.localeCompare(b.gruppe, 'de')
    if (gruppe !== 0) return gruppe
    const sortA = a.sortierung ?? Number.MAX_SAFE_INTEGER
    const sortB = b.sortierung ?? Number.MAX_SAFE_INTEGER
    if (sortA !== sortB) return sortA - sortB
    return a.bezeichnung.localeCompare(b.bezeichnung, 'de', { numeric: true })
  })
}

export function gruppiereKabeltypen(
  typen: readonly Kabeltyp[],
): { gruppe: string; typen: Kabeltyp[] }[] {
  const gruppen: { gruppe: string; typen: Kabeltyp[] }[] = []
  for (const typ of sortiereKabeltypen(typen)) {
    const letzte = gruppen[gruppen.length - 1]
    if (letzte && letzte.gruppe === typ.gruppe) letzte.typen.push(typ)
    else gruppen.push({ gruppe: typ.gruppe, typen: [typ] })
  }
  return gruppen
}

export function findeKabeltypNachBezeichnung(
  typen: readonly Kabeltyp[],
  bezeichnung: string,
): Kabeltyp | undefined {
  const gesucht = bezeichnung.trim().toLocaleLowerCase('de')
  if (!gesucht) return undefined
  return typen.find((t) => t.bezeichnung.trim().toLocaleLowerCase('de') === gesucht)
}

export function passtZuSuche(typ: Kabeltyp, suche: string): boolean {
  const woerter = suche.trim().toLocaleLowerCase('de').split(/\s+/).filter(Boolean)
  if (woerter.length === 0) return true
  const heuhaufen = `${typ.bezeichnung} ${typ.gruppe} ${typ.bemerkung ?? ''}`.toLocaleLowerCase(
    'de',
  )
  return woerter.every((wort) => heuhaufen.includes(wort))
}
