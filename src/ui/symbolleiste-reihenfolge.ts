import { t, type Schluessel } from '../sprache'
import { FANGARTEN_RANGFOLGE } from '../tools'
import { ALLE_BLATT_SICHTBARKEITEN } from './befehle/blatt-sichtbarkeit'
import { FANGART_BEFEHL_ID } from './objektfang-namen'

export type SymbolleistenBereich =
  'datei' | 'bearbeiten' | 'blatt' | 'ansicht' | 'katalog' | 'extras'

export const BEREICH_LABELS: Readonly<Record<SymbolleistenBereich, string>> = {
  get datei() {
    return t('menue.datei')
  },
  get bearbeiten() {
    return t('menue.bearbeiten')
  },
  get blatt() {
    return t('menue.blatt')
  },
  get ansicht() {
    return t('menue.ansicht')
  },
  get katalog() {
    return t('menue.katalog')
  },
  get extras() {
    return t('menue.extras')
  },
}

export interface SymbolleistenEintrag {
  id: string
  bereich: SymbolleistenBereich
}

export interface SymbolleistenGruppe {
  id: string
  name: string
  befehle: string[]
}

export const SYMBOLLEISTE_ANGEBOT: readonly SymbolleistenEintrag[] = [
  ...(
    [
      'datei.projekte',
      'datei.neue-zeichnung',
      'datei.speichern',
      'datei.import-zeichnung',
      'datei.export-zeichnung',
      'datei.export-plan',
      'datei.export-excel',
      'datei.drucken',
      'datei.sicherung',
    ] as const
  ).map((id) => ({ id, bereich: 'datei' as const })),
  ...(
    [
      'bearbeiten.rueckgaengig',
      'bearbeiten.wiederholen',
      'bearbeiten.ausschneiden',
      'bearbeiten.kopieren',
      'bearbeiten.einfuegen',
      'bearbeiten.loeschen',
      'bearbeiten.alles-auswaehlen',
      'bearbeiten.auswahl-aufheben',
    ] as const
  ).map((id) => ({ id, bereich: 'bearbeiten' as const })),
  ...(
    [
      'blatt.verwaltung',
      'blatt.zeichenflaeche-einrichten',
      'werkzeug.zeichenflaeche-verschieben',
      'blatt.beschriftung-groesse',
      ...ALLE_BLATT_SICHTBARKEITEN.map((eintrag) => eintrag.id),
      'werkzeug.nullpunkt',
      'blatt.nullpunkt-alle',
      'blatt.nullpunkt-aufheben',
      'datei.import-hintergrund',
      'werkzeug.kalibrieren',
      'werkzeug.hintergrund-ausblenden',
      'blatt.hintergrund-ausblendungen',
      'blatt.hintergrund-loeschen',
      'blatt.hintergrund-umwandeln',
      'blatt.ebenen',
    ] as const
  ).map((id) => ({ id, bereich: 'blatt' as const })),
  ...(
    [
      'ansicht.zoom-rein',
      'ansicht.zoom-raus',
      'werkzeug.zoom-fenster',
      'ansicht.zoom-alles',
      'ansicht.zoom-100',
      'ansicht.raster',
      'ansicht.fang',
      'ansicht.objektfang',
      ...FANGARTEN_RANGFOLGE.map((art) => FANGART_BEFEHL_ID[art]),
      'ansicht.spurfang',
      'ansicht.hintergrundfang',
      'ansicht.wandfang',
      'ansicht.hintergrund',
      'ansicht.seitenleiste',
      'ansicht.eigenschaften',
      'ansicht.kontextleiste',
      'ansicht.vollbild',
      'ansicht.dreid',
    ] as const
  ).map((id) => ({ id, bereich: 'ansicht' as const })),
  ...(
    [
      'katalog.oeffnen',
      'katalog.komponente-neu',
      'katalog.kabeltypen',
      'katalog.installationszonen',
      'datei.import-katalog',
    ] as const
  ).map((id) => ({ id, bereich: 'katalog' as const })),
  ...(
    [
      'extras.einstellungen',
      'extras.tastenkuerzel',
      'extras.einstellungen-sichern',
      'extras.einstellungen-einspielen',
      'extras.modulfelder-reparieren',
    ] as const
  ).map((id) => ({ id, bereich: 'extras' as const })),
]

export const SYMBOLLEISTE_BEREICH: Record<string, SymbolleistenBereich> = Object.fromEntries(
  SYMBOLLEISTE_ANGEBOT.map((eintrag) => [eintrag.id, eintrag.bereich]),
)

const GRUPPE_SICHTBARKEIT = 'gruppe-sichtbarkeit'
const SICHTBARKEIT_SCHALTPLAN = [
  'blatt.anzeige-potentialname',
  'blatt.anzeige-kennzeichen',
  'blatt.anzeige-abgaenge',
  'blatt.anzeige-stromkreis',
  'blatt.anzeige-stromkreis-schild',
] as const
const SICHTBARKEIT_ANSICHT = ['ansicht.hintergrund', 'ansicht.raster'] as const
const SICHTBARKEIT_OBJEKTE = ['blatt.anzeige-leitungen', 'blatt.anzeige-trunks'] as const
const SICHTBARKEIT_ALLE = [
  ...SICHTBARKEIT_ANSICHT,
  'blatt.anzeige-wirkverbindungen',
  'blatt.anzeige-leitungen',
  'blatt.anzeige-trunks',
  'blatt.anzeige-bezeichnung',
  'blatt.anzeige-beschriftung',
  'blatt.anzeige-installationshoehe',
  'blatt.anzeige-leitungsnummer',
  'blatt.anzeige-leitungstyp',
  'blatt.anzeige-leitungsbeschreibung',
  'blatt.anzeige-trunkname',
  'blatt.anzeige-trunkbeschreibung',
  'blatt.anzeige-raumname',
  'blatt.anzeige-raumflaeche',
  ...SICHTBARKEIT_SCHALTPLAN,
] as const
const GRUPPE_BLATTVERWALTUNG = 'gruppe-blattverwaltung'
const GRUPPE_KATALOG = 'gruppe-katalog'
const GRUPPE_FANG = 'gruppe-fang'

export const SYMBOLLEISTE_STANDARD_GRUPPEN: readonly SymbolleistenGruppe[] = [
  {
    id: GRUPPE_SICHTBARKEIT,
    name: 'Sichtbarkeit',
    befehle: [...SICHTBARKEIT_ALLE],
  },
  {
    id: GRUPPE_BLATTVERWALTUNG,
    name: 'Blattverwaltung',
    befehle: [
      'blatt.verwaltung',
      'blatt.zeichenflaeche-einrichten',
      'werkzeug.zeichenflaeche-verschieben',
      'blatt.beschriftung-groesse',
      'werkzeug.nullpunkt',
      'blatt.nullpunkt-alle',
      'blatt.nullpunkt-aufheben',
      'datei.import-hintergrund',
      'werkzeug.kalibrieren',
      'werkzeug.hintergrund-ausblenden',
      'blatt.hintergrund-ausblendungen',
      'blatt.hintergrund-loeschen',
    ],
  },
  {
    id: GRUPPE_KATALOG,
    name: 'Katalog',
    befehle: [
      'katalog.oeffnen',
      'katalog.komponente-neu',
      'katalog.kabeltypen',
      'datei.import-katalog',
    ],
  },
  {
    id: GRUPPE_FANG,
    name: 'Fang',
    befehle: [
      'ansicht.wandfang',
      'ansicht.hintergrundfang',
      'ansicht.objektfang-naechster',
      'ansicht.objektfang-schnitt',
      'ansicht.objektfang-dock',
      'ansicht.objektfang-quadrant',
      'ansicht.objektfang-zentrum',
      'ansicht.objektfang-mitte',
      'ansicht.objektfang-endpunkt',
      'ansicht.fang',
      'ansicht.objektfang',
      'ansicht.spurfang',
    ],
  },
]

const WERKS_GRUPPEN_NAMEN: Record<string, Schluessel> = {
  [GRUPPE_SICHTBARKEIT]: 'symbolleiste.werksGruppen.sichtbarkeit',
  [GRUPPE_BLATTVERWALTUNG]: 'symbolleiste.werksGruppen.blattverwaltung',
  [GRUPPE_KATALOG]: 'symbolleiste.werksGruppen.katalog',
  [GRUPPE_FANG]: 'symbolleiste.werksGruppen.fang',
}

export function gruppenAnzeigeName(gruppe: SymbolleistenGruppe, uebersetze = t): string {
  const schluessel = WERKS_GRUPPEN_NAMEN[gruppe.id]
  const werksName = SYMBOLLEISTE_STANDARD_GRUPPEN.find((g) => g.id === gruppe.id)?.name
  return schluessel && gruppe.name === werksName ? uebersetze(schluessel) : gruppe.name
}

export const SYMBOLLEISTE_STANDARD_REIHENFOLGE: readonly string[] = [
  'datei.projekte',
  'datei.neue-zeichnung',
  'datei.speichern',
  'datei.import-zeichnung',
  'datei.export-zeichnung',
  'datei.export-plan',
  'datei.export-excel',
  'datei.drucken',
  'datei.sicherung',
  'bearbeiten.rueckgaengig',
  'bearbeiten.wiederholen',
  'bearbeiten.ausschneiden',
  'bearbeiten.kopieren',
  'bearbeiten.einfuegen',
  'bearbeiten.loeschen',
  'bearbeiten.alles-auswaehlen',
  'bearbeiten.auswahl-aufheben',
  'blatt.ebenen',
  'ansicht.zoom-rein',
  'ansicht.zoom-raus',
  'werkzeug.zoom-fenster',
  'ansicht.zoom-alles',
  'ansicht.zoom-100',
  GRUPPE_SICHTBARKEIT,
  GRUPPE_BLATTVERWALTUNG,
  GRUPPE_KATALOG,
  'ansicht.seitenleiste',
  'ansicht.eigenschaften',
  'ansicht.vollbild',
  'extras.einstellungen',
  'extras.tastenkuerzel',
  'extras.einstellungen-sichern',
  'extras.einstellungen-einspielen',
  'extras.modulfelder-reparieren',
  'blatt.hintergrund-umwandeln',
  'ansicht.kontextleiste',
  'ansicht.dreid',
  GRUPPE_FANG,
]

export interface SymbolleistenNachtrag {
  id: string
  gruppe: string
  befehle: readonly string[]
  verschieben?: boolean
}

export const SYMBOLLEISTE_NACHTRAEGE: readonly SymbolleistenNachtrag[] = [
  { id: '2026-10-20-sichtbarkeit', gruppe: GRUPPE_SICHTBARKEIT, befehle: SICHTBARKEIT_SCHALTPLAN },
  {
    id: '2026-10-21-sichtbarkeit-objekte',
    gruppe: GRUPPE_SICHTBARKEIT,
    befehle: SICHTBARKEIT_OBJEKTE,
  },
  {
    id: '2026-10-21-sichtbarkeit-ansicht',
    gruppe: GRUPPE_SICHTBARKEIT,
    befehle: SICHTBARKEIT_ANSICHT,
    verschieben: true,
  },
  {
    id: '2026-10-21-sichtbarkeit-alle',
    gruppe: GRUPPE_SICHTBARKEIT,
    befehle: SICHTBARKEIT_ALLE,
    verschieben: true,
  },
]

function findeNachtragsGruppe(
  gruppen: readonly SymbolleistenGruppe[],
  gruppenId: string,
): SymbolleistenGruppe | undefined {
  const perId = gruppen.find((g) => g.id === gruppenId)
  if (perId) return perId
  const werksName = SYMBOLLEISTE_STANDARD_GRUPPEN.find((g) => g.id === gruppenId)?.name
  if (!werksName) return undefined
  const name = werksName.trim().toLowerCase()
  return gruppen.find((g) => g.name.trim().toLowerCase() === name)
}

export function ergaenzeSymbolleistenGruppen(
  gruppen: readonly SymbolleistenGruppe[],
  eingeblendet: readonly string[] | null,
  erledigt: readonly string[],
  nachtraege: readonly SymbolleistenNachtrag[] = SYMBOLLEISTE_NACHTRAEGE,
): { gruppen: SymbolleistenGruppe[]; erledigt: string[] } {
  const lose = new Set(eingeblendet ?? SYMBOLLEISTE_STANDARD_SICHTBAR)
  let ergebnis = [...gruppen]
  const fertig = [...erledigt]
  for (const nachtrag of nachtraege) {
    if (fertig.includes(nachtrag.id)) continue
    fertig.push(nachtrag.id)
    const ziel = findeNachtragsGruppe(ergebnis, nachtrag.gruppe)
    if (!ziel) continue
    const gruppiert = new Set(ergebnis.flatMap((g) => g.befehle))
    const neu = nachtrag.befehle.filter((id) =>
      nachtrag.verschieben ? !ziel.befehle.includes(id) : !gruppiert.has(id) && !lose.has(id),
    )
    if (neu.length === 0) continue
    ergebnis = ergebnis.map((g) =>
      g.id === ziel.id
        ? { ...g, befehle: [...g.befehle, ...neu] }
        : nachtrag.verschieben
          ? { ...g, befehle: g.befehle.filter((id) => !neu.includes(id)) }
          : g,
    )
  }
  return { gruppen: ergebnis, erledigt: fertig }
}

export const SYMBOLLEISTE_STANDARD_SICHTBAR: readonly string[] = [
  'datei.neue-zeichnung',
  'datei.export-plan',
  'datei.drucken',
  'bearbeiten.rueckgaengig',
  'bearbeiten.wiederholen',
  'bearbeiten.ausschneiden',
  'bearbeiten.kopieren',
  'bearbeiten.einfuegen',
  'bearbeiten.loeschen',
  'ansicht.zoom-rein',
  'ansicht.zoom-raus',
  'werkzeug.zoom-fenster',
  'ansicht.zoom-alles',
  'ansicht.fang',
  'ansicht.objektfang',
  'ansicht.spurfang',
  'extras.einstellungen',
  'ansicht.dreid',
]

export function vollstaendigeSymbolleiste(
  eigeneReihenfolge: readonly string[],
  gruppen: readonly SymbolleistenGruppe[] = [],
): string[] {
  const angebot = SYMBOLLEISTE_ANGEBOT.map((eintrag) => eintrag.id)
  const gruppenIds = gruppen.map((gruppe) => gruppe.id)
  const gruppiert = new Set(gruppen.flatMap((gruppe) => gruppe.befehle))
  const bekannt = new Set([...angebot, ...gruppenIds])
  const eigene = eigeneReihenfolge.filter(
    (id, index) => bekannt.has(id) && !gruppiert.has(id) && eigeneReihenfolge.indexOf(id) === index,
  )
  const fehlend = [...angebot, ...gruppenIds].filter(
    (id) => !eigene.includes(id) && !gruppiert.has(id),
  )
  return [...eigene, ...fehlend]
}

export function ermittleSymbolleiste(
  eigeneReihenfolge: readonly string[],
  eingeblendet: readonly string[] | null,
  gruppen: readonly SymbolleistenGruppe[] = [],
): string[] {
  const sichtbar = new Set(eingeblendet ?? SYMBOLLEISTE_STANDARD_SICHTBAR)
  const gruppenIds = new Set(gruppen.map((gruppe) => gruppe.id))
  return vollstaendigeSymbolleiste(eigeneReihenfolge, gruppen).filter(
    (id) => gruppenIds.has(id) || sichtbar.has(id),
  )
}

export function gruppiereSymbolleiste(ids: readonly string[]): string[][] {
  const gruppen: string[][] = []
  let letzterBereich: SymbolleistenBereich | null = null
  for (const id of ids) {
    const bereich = SYMBOLLEISTE_BEREICH[id] ?? null
    if (gruppen.length === 0 || bereich !== letzterBereich) gruppen.push([])
    gruppen[gruppen.length - 1].push(id)
    letzterBereich = bereich
  }
  return gruppen
}
