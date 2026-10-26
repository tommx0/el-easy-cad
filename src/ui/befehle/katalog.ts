import type { LizenzModul } from '../../document-model'
import { FANGARTEN_RANGFOLGE } from '../../tools'
import { ALLE_BLATT_SICHTBARKEITEN } from './blatt-sichtbarkeit'
import { FANGART_BEFEHL_ID } from '../objektfang-namen'
import type { Kuerzel } from './kuerzel'
import { t, type Schluessel, type Uebersetzer } from '../../sprache'

export type BefehlGruppe =
  | 'werkzeuge'
  | 'datei'
  | 'bearbeiten'
  | 'blatt'
  | 'ansicht'
  | 'katalog'
  | 'extras'
  | 'module'
  | 'hilfe'

export function befehlName(id: string, uebersetze: Uebersetzer = t): string {
  return uebersetze(`befehle.${id}` as Schluessel)
}

export function gruppenName(gruppe: BefehlGruppe, uebersetze: Uebersetzer = t): string {
  return uebersetze(`befehle.gruppe.${gruppe}` as Schluessel)
}

export interface Befehl {
  id: string
  gruppe: BefehlGruppe
  standard: Kuerzel | null
  werkzeugId?: string
  festeAnzeige?: string
  werkzeugTaste?: { taste: string; hinweis: string }
  modul?: LizenzModul
  auchBeimTippen?: boolean
  kuerzelWie?: string
}

const WERKZEUGE: Befehl[] = [
  { id: 'werkzeug.auswahl', standard: null, festeAnzeige: 'Esc Esc' },
  { id: 'werkzeug.komponente', standard: 'B' },
  { id: 'werkzeug.leitung', standard: 'W' },
  {
    id: 'werkzeug.schaltverbindung',
    standard: null,
    kuerzelWie: 'werkzeug.leitung',
  },
  { id: 'werkzeug.potential', standard: null },
  { id: 'werkzeug.knx-aktor', standard: null },
  { id: 'werkzeug.trunk', standard: 'U' },
  { id: 'werkzeug.wirkverbindung', standard: null },
  { id: 'werkzeug.kabelschacht', standard: 'V' },
  { id: 'werkzeug.linie', standard: 'L' },
  { id: 'werkzeug.polylinie', standard: 'Y' },
  { id: 'werkzeug.rechteck', standard: 'R' },
  { id: 'werkzeug.wand', standard: 'UMSCHALT+W' },
  { id: 'werkzeug.wandrechteck', standard: 'ALT+R' },
  { id: 'werkzeug.tuer', standard: 'UMSCHALT+T' },
  { id: 'werkzeug.fenster', standard: 'UMSCHALT+F' },
  { id: 'werkzeug.wanddurchbruch', standard: 'ALT+W' },
  { id: 'werkzeug.raum', standard: null },
  { id: 'werkzeug.treppe', standard: 'ALT+T' },
  { id: 'werkzeug.bodenplatte', standard: 'UMSCHALT+B' },
  { id: 'werkzeug.bodenplatterechteck', standard: 'ALT+B' },
  { id: 'werkzeug.kreis', standard: 'C' },
  { id: 'werkzeug.bogen', standard: 'A' },
  { id: 'werkzeug.ellipse', standard: 'E' },
  { id: 'werkzeug.polygon', standard: 'G' },
  { id: 'werkzeug.punkt', standard: 'N' },
  { id: 'werkzeug.text', standard: 'T' },
  { id: 'werkzeug.bemassung', standard: 'D' },
  { id: 'werkzeug.kettenbemassung', standard: 'UMSCHALT+D' },
  { id: 'werkzeug.parallelbemassung', standard: 'ALT+D' },
  { id: 'werkzeug.schraffur', standard: 'H' },
  { id: 'werkzeug.trimmen', standard: 'X' },
  { id: 'werkzeug.wandteilen', standard: null },
  { id: 'werkzeug.stueckliste', standard: 'S' },
  { id: 'werkzeug.switchplan', standard: 'P' },
  { id: 'werkzeug.patchpanelplan', standard: null },
  { id: 'werkzeug.leitungsliste', standard: 'F' },
  { id: 'werkzeug.trunkliste', standard: 'J' },
  { id: 'werkzeug.raumliste', standard: null },
  { id: 'werkzeug.betriebsmittelliste', standard: null },
  {
    id: 'werkzeug.stromkreisverzeichnis',
    standard: null,
  },
  { id: 'werkzeug.aktorkanalliste', standard: null },
  { id: 'werkzeug.potentialliste', standard: null },
  { id: 'werkzeug.steuerungslogik', standard: null },
  { id: 'werkzeug.leitungsbaum', standard: 'Z' },
  { id: 'werkzeug.plankopf', standard: 'Q' },
  { id: 'werkzeug.nullpunkt', standard: 'O' },
  { id: 'werkzeug.kalibrieren', standard: 'K' },
  {
    id: 'werkzeug.hintergrund-ausblenden',
    standard: null,
  },
  { id: 'werkzeug.zeichenflaeche-verschieben', standard: null },
  { id: 'werkzeug.zoom-fenster', standard: null },
].map((befehl) => ({
  ...befehl,
  gruppe: 'werkzeuge' as const,
  werkzeugId: befehl.id.slice('werkzeug.'.length),
}))

const UEBRIGE: Befehl[] = [
  {
    id: 'datei.projekte',
    gruppe: 'datei',
    standard: 'STRG+Home',
    auchBeimTippen: true,
  },
  { id: 'datei.neue-zeichnung', gruppe: 'datei', standard: 'STRG+N' },
  {
    id: 'datei.verteilerplan-assistent',
    gruppe: 'datei',
    standard: null,
  },
  {
    id: 'datei.speichern',
    gruppe: 'datei',
    standard: 'STRG+S',
    auchBeimTippen: true,
  },
  {
    id: 'datei.import-zeichnung',
    gruppe: 'datei',
    standard: 'STRG+O',
  },
  {
    id: 'datei.import-hintergrund',
    gruppe: 'datei',
    standard: null,
  },
  { id: 'datei.import-katalog', gruppe: 'datei', standard: null },
  {
    id: 'datei.import-bibliothek',
    gruppe: 'datei',
    standard: null,
  },
  {
    id: 'datei.export-bibliothek',
    gruppe: 'datei',
    standard: null,
  },
  {
    id: 'datei.export-zeichnung',
    gruppe: 'datei',
    standard: 'STRG+UMSCHALT+S',
  },
  {
    id: 'datei.export-plan',
    gruppe: 'datei',
    standard: null,
  },
  {
    id: 'datei.export-excel',
    gruppe: 'datei',
    standard: null,
  },
  {
    id: 'datei.export-ifc',
    gruppe: 'datei',
    standard: null,
    modul: 'bim',
  },
  { id: 'datei.drucken', gruppe: 'datei', standard: 'STRG+P' },
  {
    id: 'datei.sicherung',
    gruppe: 'datei',
    standard: null,
  },

  { id: 'bearbeiten.rueckgaengig', gruppe: 'bearbeiten', standard: 'STRG+Z' },
  { id: 'bearbeiten.wiederholen', gruppe: 'bearbeiten', standard: 'STRG+Y' },
  {
    id: 'bearbeiten.ausschneiden',
    gruppe: 'bearbeiten',
    standard: 'STRG+X',
  },
  { id: 'bearbeiten.kopieren', gruppe: 'bearbeiten', standard: 'STRG+C' },
  { id: 'bearbeiten.einfuegen', gruppe: 'bearbeiten', standard: 'STRG+V' },
  {
    id: 'bearbeiten.loeschen',
    gruppe: 'bearbeiten',
    standard: null,
    festeAnzeige: 'Entf',
  },
  {
    id: 'bearbeiten.alles-auswaehlen',
    gruppe: 'bearbeiten',
    standard: 'STRG+A',
  },
  {
    id: 'bearbeiten.auswahl-aufheben',
    gruppe: 'bearbeiten',
    standard: null,
  },
  {
    id: 'bearbeiten.leitungen-neu-verlegen',
    gruppe: 'bearbeiten',
    standard: null,
  },
  {
    id: 'bearbeiten.automatisch-anordnen',
    gruppe: 'bearbeiten',
    standard: null,
  },

  {
    id: 'blatt.zeichenflaeche-einrichten',
    gruppe: 'blatt',
    standard: null,
  },
  {
    id: 'blatt.beschriftung-groesse',
    gruppe: 'blatt',
    standard: null,
  },
  ...ALLE_BLATT_SICHTBARKEITEN.map(({ id }) => ({
    id,
    gruppe: 'blatt' as const,
    standard: null,
  })),
  {
    id: 'blatt.nullpunkt-alle',
    gruppe: 'blatt',
    standard: null,
  },
  { id: 'blatt.nullpunkt-aufheben', gruppe: 'blatt', standard: null },
  {
    id: 'blatt.ausrichten',
    gruppe: 'blatt',
    standard: null,
  },
  { id: 'blatt.verwaltung', gruppe: 'blatt', standard: null },
  { id: 'blatt.etagen', gruppe: 'blatt', standard: null },
  {
    id: 'blatt.hintergrund-ausblendungen',
    gruppe: 'blatt',
    standard: null,
  },
  {
    id: 'blatt.hintergrund-loeschen',
    gruppe: 'blatt',
    standard: null,
  },
  {
    id: 'blatt.hintergrund-umwandeln',
    gruppe: 'blatt',
    standard: null,
  },
  {
    id: 'blatt.ifc-nachladen',
    gruppe: 'blatt',
    standard: null,
    modul: 'bim',
  },
  {
    id: 'blatt.ifc-bauteilgruppen',
    gruppe: 'blatt',
    standard: null,
    modul: 'bim',
  },
  {
    id: 'blatt.ifc-bauteile',
    gruppe: 'blatt',
    standard: null,
    modul: 'bim',
  },
  { id: 'blatt.ebenen', gruppe: 'blatt', standard: null },

  { id: 'ansicht.zoom-rein', gruppe: 'ansicht', standard: null },
  { id: 'ansicht.zoom-raus', gruppe: 'ansicht', standard: null },
  { id: 'ansicht.zoom-alles', gruppe: 'ansicht', standard: null },
  { id: 'ansicht.zoom-100', gruppe: 'ansicht', standard: null },
  { id: 'ansicht.raster', gruppe: 'ansicht', standard: null },
  { id: 'ansicht.fang', gruppe: 'ansicht', standard: null },
  { id: 'ansicht.objektfang', gruppe: 'ansicht', standard: null },
  ...FANGARTEN_RANGFOLGE.map((art) => ({
    id: FANGART_BEFEHL_ID[art],
    gruppe: 'ansicht' as const,
    standard: null,
  })),
  { id: 'ansicht.spurfang', gruppe: 'ansicht', standard: null },
  {
    id: 'ansicht.hintergrundfang',
    gruppe: 'ansicht',
    standard: null,
  },
  { id: 'ansicht.wandfang', gruppe: 'ansicht', standard: null },
  { id: 'ansicht.hintergrund', gruppe: 'ansicht', standard: null },
  { id: 'ansicht.vollbild', gruppe: 'ansicht', standard: null },
  { id: 'ansicht.dreid', gruppe: 'ansicht', standard: null, modul: 'bim' },
  { id: 'ansicht.symbolleiste', gruppe: 'ansicht', standard: null },
  {
    id: 'ansicht.seitenleiste',
    gruppe: 'ansicht',
    standard: null,
  },
  {
    id: 'ansicht.eigenschaften',
    gruppe: 'ansicht',
    standard: null,
  },
  {
    id: 'ansicht.kontextleiste',
    gruppe: 'ansicht',
    standard: null,
  },

  { id: 'katalog.oeffnen', gruppe: 'katalog', standard: null },
  {
    id: 'katalog.komponente-neu',
    gruppe: 'katalog',
    standard: null,
  },
  { id: 'katalog.kabeltypen', gruppe: 'katalog', standard: null },
  {
    id: 'katalog.installationszonen',
    gruppe: 'katalog',
    standard: null,
  },

  {
    id: 'extras.einstellungen',
    gruppe: 'extras',
    standard: null,
  },
  {
    id: 'extras.tastenkuerzel',
    gruppe: 'extras',
    standard: null,
  },
  {
    id: 'extras.einstellungen-sichern',
    gruppe: 'extras',
    standard: null,
  },
  {
    id: 'extras.einstellungen-einspielen',
    gruppe: 'extras',
    standard: null,
  },
  {
    id: 'extras.modulfelder-reparieren',
    gruppe: 'extras',
    standard: null,
  },
  { id: 'module.hinzufuegen', gruppe: 'module', standard: null },
  { id: 'module.anzeigen', gruppe: 'module', standard: null },
  { id: 'module.entfernen', gruppe: 'module', standard: null },
  {
    id: 'hilfe.handbuch',
    gruppe: 'hilfe',
    standard: 'F1',
  },
  { id: 'hilfe.ueber', gruppe: 'hilfe', standard: null },
  { id: 'hilfe.meine-lizenz', gruppe: 'hilfe', standard: null },
  {
    id: 'hilfe.lizenzen',
    gruppe: 'hilfe',
    standard: null,
  },
  {
    id: 'hilfe.fehlerprotokoll',
    gruppe: 'hilfe',
    standard: null,
  },
]

const WERKZEUG_TASTEN: { taste: string; hinweis: Schluessel }[] = [
  { taste: 'M', hinweis: 'befehle.tastenHinweis.M' },
]

export const BEFEHLE: Befehl[] = [...WERKZEUGE, ...UEBRIGE]

export function befehleMitModulen(module: readonly LizenzModul[]): Befehl[] {
  return BEFEHLE.filter((b) => !b.modul || module.includes(b.modul))
}

export const BEFEHL_NACH_ID: Record<string, Befehl> = Object.fromEntries(
  BEFEHLE.map((befehl) => [befehl.id, befehl]),
)

export const STANDARD_KUERZEL: Record<string, string | null> = Object.fromEntries(
  BEFEHLE.map((befehl) => [
    befehl.id,
    befehl.kuerzelWie ? (BEFEHL_NACH_ID[befehl.kuerzelWie]?.standard ?? null) : befehl.standard,
  ]),
)

export function werkzeugTastenHinweis(taste: string): string | null {
  const eintrag = WERKZEUG_TASTEN.find((e) => e.taste === taste)
  return eintrag ? t(eintrag.hinweis) : null
}

export function geltendeKuerzel(
  abweichungen: Record<string, string | null>,
): Record<string, string | null> {
  const belegung = { ...STANDARD_KUERZEL }
  for (const [id, kuerzel] of Object.entries(abweichungen)) {
    if (id in belegung && !BEFEHL_NACH_ID[id].kuerzelWie) belegung[id] = kuerzel
  }
  for (const befehl of BEFEHLE) {
    if (befehl.kuerzelWie) belegung[befehl.id] = belegung[befehl.kuerzelWie] ?? null
  }
  return belegung
}

export function kuerzelZuBefehl(belegung: Record<string, string | null>): Record<string, string> {
  const karte: Record<string, string> = {}
  for (const [id, kuerzel] of Object.entries(belegung)) {
    if (kuerzel && !BEFEHL_NACH_ID[id]?.kuerzelWie) karte[kuerzel] = id
  }
  return karte
}

export function kuerzelPartner(befehlId: string): string[] {
  const eigner = BEFEHL_NACH_ID[befehlId]?.kuerzelWie ?? befehlId
  return [eigner, ...BEFEHLE.filter((b) => b.kuerzelWie === eigner).map((b) => b.id)]
}
