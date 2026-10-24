import { z } from 'zod'
import { katalogWort, type KatalogBereich, type Sprache } from '../sprache'

export type Uebersetzungen<T> = Record<string, T>

function uebersetzungenSchema<T extends z.ZodRawShape>(felder: T) {
  return z.record(z.string(), z.object(felder).partial()).optional()
}

export interface KatalogUebersetzung {
  name?: string
  beschreibung?: string
}

export interface KomponentenUebersetzung {
  name?: string
  kategorie?: string
  hauptgruppe?: string
  untergruppe?: string
  varianten?: Record<string, { farbe?: string; name?: string }>
  technischeDaten?: Record<string, { bezeichnung?: string; wert?: string }>
  texte?: Record<string, string>
  slots?: Record<string, string>
}

export interface BezeichnungsUebersetzung {
  bezeichnung?: string
}

export interface KabeltypUebersetzung {
  gruppe?: string
  bemerkung?: string
}

export const katalogUebersetzungenSchema = uebersetzungenSchema({
  name: z.string(),
  beschreibung: z.string(),
})

export const komponentenUebersetzungenSchema = uebersetzungenSchema({
  name: z.string(),
  kategorie: z.string(),
  hauptgruppe: z.string(),
  untergruppe: z.string(),
  varianten: z.record(
    z.string(),
    z.object({ farbe: z.string().optional(), name: z.string().optional() }),
  ),
  technischeDaten: z.record(
    z.string(),
    z.object({ bezeichnung: z.string().optional(), wert: z.string().optional() }),
  ),
  texte: z.record(z.string(), z.string()),
  slots: z.record(z.string(), z.string()),
})

export const bezeichnungsUebersetzungenSchema = uebersetzungenSchema({ bezeichnung: z.string() })

export const kabeltypUebersetzungenSchema = uebersetzungenSchema({
  gruppe: z.string(),
  bemerkung: z.string(),
})

function text(
  original: string,
  eigene: string | undefined,
  bereich: KatalogBereich,
  sprache: Sprache,
): string {
  if (sprache === 'de') return original
  return eigene || katalogWort(bereich, original, sprache) || original
}

export function katalogText(
  katalog: {
    name: string
    beschreibung?: string
    uebersetzungen?: Uebersetzungen<KatalogUebersetzung>
  },
  feld: 'name' | 'beschreibung',
  sprache: Sprache,
): string {
  const original = katalog[feld] ?? ''
  if (!original) return original
  return text(original, katalog.uebersetzungen?.[sprache]?.[feld], 'kataloge', sprache)
}

type KomponentenTextFeld = 'name' | 'kategorie' | 'hauptgruppe' | 'untergruppe'

interface KomponentenTextQuelle {
  name: string
  kategorie?: string
  hauptgruppe?: string
  untergruppe?: string
  uebersetzungen?: Uebersetzungen<KomponentenUebersetzung>
}

export function komponentenText(
  komponente: KomponentenTextQuelle,
  feld: KomponentenTextFeld,
  sprache: Sprache,
): string {
  const original = komponente[feld] ?? ''
  if (!original) return original
  return text(
    original,
    komponente.uebersetzungen?.[sprache]?.[feld],
    feld === 'name' ? 'namen' : 'gruppen',
    sprache,
  )
}

export function variantenText(
  komponente: Pick<KomponentenTextQuelle, 'uebersetzungen'>,
  variante: { id: string; farbe?: string; name?: string },
  feld: 'farbe' | 'name',
  sprache: Sprache,
): string {
  const original = variante[feld] ?? ''
  if (!original) return original
  return text(
    original,
    komponente.uebersetzungen?.[sprache]?.varianten?.[variante.id]?.[feld],
    'varianten',
    sprache,
  )
}

export function technischeDatenTexte(
  komponente: Pick<KomponentenTextQuelle, 'uebersetzungen'>,
  daten: Record<string, string> | undefined,
  sprache: Sprache,
): { schluessel: string; bezeichnung: string; wert: string }[] {
  return Object.entries(daten ?? {}).map(([schluessel, wert]) => {
    const eigene = komponente.uebersetzungen?.[sprache]?.technischeDaten?.[schluessel]
    return {
      schluessel,
      bezeichnung: text(schluessel, eigene?.bezeichnung, 'datenBezeichnungen', sprache),
      wert: wert ? text(wert, eigene?.wert, 'datenWerte', sprache) : wert,
    }
  })
}

export function variablerTextName(
  komponente: Pick<KomponentenTextQuelle, 'uebersetzungen'>,
  variable: string,
  sprache: Sprache,
): string {
  if (!variable) return variable
  return text(variable, komponente.uebersetzungen?.[sprache]?.texte?.[variable], 'texte', sprache)
}

export function slotVorlagenText(
  komponente: Pick<KomponentenTextQuelle, 'uebersetzungen'>,
  slot: { id: string; bezeichnung: string },
  sprache: Sprache,
): string {
  if (!slot.bezeichnung) return slot.bezeichnung
  return text(
    slot.bezeichnung,
    komponente.uebersetzungen?.[sprache]?.slots?.[slot.id],
    'slots',
    sprache,
  )
}

export function slotNameText(bezeichnung: string | undefined, sprache: Sprache): string {
  const original = bezeichnung?.trim() ?? ''
  if (!original) return original
  return text(original, undefined, 'slots', sprache)
}

export function kabeltypFeldText(
  kabeltyp: {
    gruppe: string
    bemerkung?: string
    uebersetzungen?: Uebersetzungen<KabeltypUebersetzung>
  },
  feld: 'gruppe' | 'bemerkung',
  sprache: Sprache,
): string {
  const original = kabeltyp[feld] ?? ''
  if (!original) return original
  return text(original, kabeltyp.uebersetzungen?.[sprache]?.[feld], 'kabeltypen', sprache)
}

export function zonenText(
  zone: { bezeichnung: string; uebersetzungen?: Uebersetzungen<BezeichnungsUebersetzung> },
  sprache: Sprache,
): string {
  return text(zone.bezeichnung, zone.uebersetzungen?.[sprache]?.bezeichnung, 'zonen', sprache)
}

export function regelwerkText(
  eintrag: { bezeichnung: string; uebersetzungen?: Uebersetzungen<BezeichnungsUebersetzung> },
  sprache: Sprache,
): string {
  return text(
    eintrag.bezeichnung,
    eintrag.uebersetzungen?.[sprache]?.bezeichnung,
    'regelwerk',
    sprache,
  )
}

export function komponentenSuchtexte(
  komponente: KomponentenTextQuelle,
  sprachen: readonly Sprache[],
): string[] {
  const felder: KomponentenTextFeld[] = ['name', 'kategorie', 'hauptgruppe', 'untergruppe']
  const texte = new Set<string>()
  for (const sprache of sprachen) {
    for (const feld of felder) {
      const wert = komponentenText(komponente, feld, sprache)
      if (wert) texte.add(wert)
    }
  }
  return [...texte]
}

interface UebersetzbareKomponente extends KomponentenTextQuelle {
  technischeDaten: Record<string, string>
  varianten: {
    id: string
    farbe?: string
    name?: string
    technischeDaten?: Record<string, string>
  }[]
  slotVorlagen?: { id: string; bezeichnung: string }[]
}

export function uebersetzteKomponente<T extends UebersetzbareKomponente>(
  komponente: T,
  sprache: Sprache,
): T {
  if (sprache === 'de') return komponente
  const daten = (werte: Record<string, string> | undefined) =>
    werte &&
    Object.fromEntries(
      technischeDatenTexte(komponente, werte, sprache).map((e) => [e.bezeichnung, e.wert]),
    )
  return {
    ...komponente,
    name: komponentenText(komponente, 'name', sprache),
    kategorie: komponente.kategorie && komponentenText(komponente, 'kategorie', sprache),
    hauptgruppe: komponente.hauptgruppe && komponentenText(komponente, 'hauptgruppe', sprache),
    untergruppe: komponente.untergruppe && komponentenText(komponente, 'untergruppe', sprache),
    technischeDaten: daten(komponente.technischeDaten) ?? {},
    varianten: komponente.varianten.map((v) => ({
      ...v,
      farbe: v.farbe && variantenText(komponente, v, 'farbe', sprache),
      name: v.name && variantenText(komponente, v, 'name', sprache),
      technischeDaten: daten(v.technischeDaten),
    })),
    slotVorlagen: komponente.slotVorlagen?.map((s) => ({
      ...s,
      bezeichnung: slotVorlagenText(komponente, s, sprache),
    })),
  }
}
