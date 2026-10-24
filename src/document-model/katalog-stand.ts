import type { CatalogComponent, Katalog } from './catalog'

export const SEED_VERSION_STANDARD = 1

const OHNE_INHALT = new Set(['seedVersion', 'herkunft', 'ausgemustert', 'abgeleitetVon'])

export function normierteKomponente(k: CatalogComponent): string {
  return JSON.stringify(normiere(k, true))
}

function normiere(wert: unknown, oberste = false): unknown {
  if (Array.isArray(wert)) return wert.length > 0 ? wert.map((w) => normiere(w)) : undefined
  if (wert && typeof wert === 'object') {
    const ergebnis: Record<string, unknown> = {}
    for (const schluessel of Object.keys(wert).sort()) {
      if (oberste && OHNE_INHALT.has(schluessel)) continue
      const n = normiere((wert as Record<string, unknown>)[schluessel])
      if (n !== undefined) ergebnis[schluessel] = n
    }
    return ergebnis
  }
  return wert
}

export function komponentenFingerabdruck(k: CatalogComponent): string {
  const text = normierteKomponente(k)
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}

export type StandardEintragAktion = 'anlegen' | 'ersetzen' | 'behalten' | 'fremd'

export function standardEintragAktion(
  vorhanden: Pick<CatalogComponent, 'herkunft' | 'seedVersion' | 'ausgemustert'> | undefined,
  neueVersion: number | undefined,
  reaktivieren = false,
): StandardEintragAktion {
  if (!vorhanden) return 'anlegen'
  if (vorhanden.herkunft !== 'standard') return 'fremd'
  const alt = vorhanden.seedVersion ?? SEED_VERSION_STANDARD
  const neu = neueVersion ?? SEED_VERSION_STANDARD
  if (neu > alt) return 'ersetzen'
  if (reaktivieren && vorhanden.ausgemustert && neu === alt) return 'ersetzen'
  return 'behalten'
}

export interface StandardAbgleichPlan {
  katalog: StandardEintragAktion
  anlegen: string[]
  ersetzen: string[]
  behalten: string[]
  fremd: string[]
  ausmustern: string[]
  zurueckgezogen: boolean
}

export function planeStandardAbgleich(
  vorhandenerKatalog: Pick<Katalog, 'herkunft' | 'seedVersion'> | undefined,
  vorhandene: readonly Pick<
    CatalogComponent,
    'id' | 'katalogId' | 'herkunft' | 'seedVersion' | 'ausgemustert'
  >[],
  neuerKatalog: Pick<Katalog, 'id' | 'seedVersion' | 'ausgemustert'>,
  neue: readonly Pick<CatalogComponent, 'id' | 'seedVersion'>[],
): StandardAbgleichPlan {
  const ermittelt = standardEintragAktion(
    vorhandenerKatalog ? { ...vorhandenerKatalog, ausgemustert: false } : undefined,
    neuerKatalog.seedVersion,
  )
  const katalogAktion =
    neuerKatalog.ausgemustert && ermittelt === 'anlegen' ? 'behalten' : ermittelt
  const mindestensSoNeu =
    !vorhandenerKatalog ||
    (neuerKatalog.seedVersion ?? SEED_VERSION_STANDARD) >=
      (vorhandenerKatalog.seedVersion ?? SEED_VERSION_STANDARD)

  const nachId = new Map(vorhandene.map((k) => [k.id, k]))
  const plan: StandardAbgleichPlan = {
    katalog: katalogAktion,
    anlegen: [],
    ersetzen: [],
    behalten: [],
    fremd: [],
    ausmustern: [],
    zurueckgezogen: !!neuerKatalog.ausgemustert && katalogAktion === 'ersetzen',
  }
  for (const k of neue) {
    plan[standardEintragAktion(nachId.get(k.id), k.seedVersion, mindestensSoNeu)].push(k.id)
  }
  if (mindestensSoNeu) {
    const imNeuenStand = new Set(neue.map((k) => k.id))
    for (const k of vorhandene) {
      if (
        k.katalogId === neuerKatalog.id &&
        k.herkunft === 'standard' &&
        !k.ausgemustert &&
        !imNeuenStand.has(k.id)
      ) {
        plan.ausmustern.push(k.id)
      }
    }
  }
  return plan
}
