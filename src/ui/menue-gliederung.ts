import type { Schluessel } from '../sprache'
import { BLATT_SICHTBARKEITEN, OBJEKT_SICHTBARKEITEN } from './befehle/blatt-sichtbarkeit'
import { FANGART_BEFEHL_ID } from './objektfang-namen'

export interface MenueBefehl {
  id: string
  kurz?: Schluessel
}

export interface MenueSpalte {
  titel: Schluessel
  art: 'kacheln' | 'schalter' | 'zuletzt' | 'module'
  befehle: readonly MenueBefehl[]
}

export interface Hauptmenue {
  id: string
  titel: Schluessel
  spalten: readonly MenueSpalte[]
}

function b(id: string, kurz?: Schluessel): MenueBefehl {
  return kurz ? { id, kurz } : { id }
}

const SICHTBARKEIT_KURZ: Record<string, Schluessel> = {
  'blatt.anzeige-bezeichnung': 'menue.schalter.bezeichnung',
  'blatt.anzeige-beschriftung': 'menue.schalter.beschriftung',
  'blatt.anzeige-installationshoehe': 'menue.schalter.installationshoehe',
  'blatt.anzeige-leitungsnummer': 'menue.schalter.leitungsnummer',
  'blatt.anzeige-leitungstyp': 'menue.schalter.leitungstyp',
  'blatt.anzeige-leitungsbeschreibung': 'menue.schalter.leitungsbeschreibung',
  'blatt.anzeige-trunkname': 'menue.schalter.trunkname',
  'blatt.anzeige-trunkbeschreibung': 'menue.schalter.trunkbeschreibung',
  'blatt.anzeige-raumname': 'menue.schalter.raumname',
  'blatt.anzeige-raumflaeche': 'menue.schalter.raumflaeche',
  'blatt.anzeige-potentialname': 'menue.schalter.potentialname',
  'blatt.anzeige-kennzeichen': 'menue.schalter.kennzeichen',
  'blatt.anzeige-abgaenge': 'menue.schalter.abgaenge',
  'blatt.anzeige-stromkreis': 'menue.schalter.stromkreis',
  'blatt.anzeige-stromkreis-schild': 'menue.schalter.stromkreisSchild',
  'blatt.anzeige-wirkverbindungen': 'menue.schalter.wirkverbindungen',
  'blatt.anzeige-leitungen': 'menue.schalter.leitungen',
  'blatt.anzeige-trunks': 'menue.schalter.trunks',
}

export const HAUPTMENUE: readonly Hauptmenue[] = [
  {
    id: 'datei',
    titel: 'menue.datei',
    spalten: [
      {
        titel: 'menue.spalte.dokument',
        art: 'kacheln',
        befehle: [
          b('datei.projekte'),
          b('datei.neue-zeichnung'),
          b('datei.verteilerplan-assistent'),
          b('datei.speichern', 'menue.kachel.speichern'),
        ],
      },
      {
        titel: 'menue.spalte.austausch',
        art: 'kacheln',
        befehle: [
          b('datei.import-zeichnung', 'menue.kachel.importZeichnung'),
          b('datei.export-zeichnung', 'menue.kachel.exportZeichnung'),
          b('datei.export-plan', 'menue.kachel.exportPlan'),
          b('datei.export-excel', 'menue.kachel.exportExcel'),
          b('datei.export-ifc', 'menue.kachel.exportIfc'),
        ],
      },
      {
        titel: 'menue.spalte.ausgabe',
        art: 'kacheln',
        befehle: [b('datei.drucken'), b('datei.sicherung', 'menue.kachel.sicherung')],
      },
      { titel: 'menue.spalte.zuletzt', art: 'zuletzt', befehle: [] },
    ],
  },
  {
    id: 'bearbeiten',
    titel: 'menue.bearbeiten',
    spalten: [
      {
        titel: 'menue.spalte.verlauf',
        art: 'kacheln',
        befehle: [b('bearbeiten.rueckgaengig'), b('bearbeiten.wiederholen')],
      },
      {
        titel: 'menue.spalte.zwischenablage',
        art: 'kacheln',
        befehle: [
          b('bearbeiten.ausschneiden'),
          b('bearbeiten.kopieren'),
          b('bearbeiten.einfuegen'),
          b('bearbeiten.loeschen'),
        ],
      },
      {
        titel: 'menue.spalte.auswahl',
        art: 'kacheln',
        befehle: [b('bearbeiten.alles-auswaehlen'), b('bearbeiten.auswahl-aufheben')],
      },
      {
        titel: 'menue.spalte.anordnen',
        art: 'kacheln',
        befehle: [b('bearbeiten.automatisch-anordnen'), b('bearbeiten.leitungen-neu-verlegen')],
      },
    ],
  },
  {
    id: 'zeichnen',
    titel: 'menue.zeichnen',
    spalten: [
      {
        titel: 'menue.spalte.planung',
        art: 'kacheln',
        befehle: [
          b('werkzeug.auswahl'),
          b('werkzeug.komponente', 'menue.kachel.komponente'),
          b('werkzeug.leitung'),
          b('werkzeug.trunk'),
          b('werkzeug.kabelschacht'),
          b('werkzeug.wirkverbindung'),
          b('werkzeug.schaltverbindung'),
          b('werkzeug.potential'),
          b('werkzeug.knx-aktor', 'menue.kachel.knxAktor'),
        ],
      },
      {
        titel: 'menue.spalte.bau',
        art: 'kacheln',
        befehle: [
          b('werkzeug.wand'),
          b('werkzeug.wandrechteck'),
          b('werkzeug.tuer'),
          b('werkzeug.fenster'),
          b('werkzeug.wanddurchbruch'),
          b('werkzeug.raum'),
          b('werkzeug.treppe'),
          b('werkzeug.bodenplatte'),
          b('werkzeug.bodenplatterechteck'),
          b('werkzeug.wandteilen'),
        ],
      },
      {
        titel: 'menue.spalte.geometrie',
        art: 'kacheln',
        befehle: [
          b('werkzeug.linie'),
          b('werkzeug.polylinie'),
          b('werkzeug.rechteck'),
          b('werkzeug.kreis'),
          b('werkzeug.bogen'),
          b('werkzeug.ellipse'),
          b('werkzeug.polygon'),
          b('werkzeug.punkt'),
          b('werkzeug.text'),
          b('werkzeug.schraffur'),
          b('werkzeug.bemassung'),
          b('werkzeug.kettenbemassung'),
          b('werkzeug.parallelbemassung'),
          b('werkzeug.trimmen'),
        ],
      },
      {
        titel: 'menue.spalte.zeichenhilfen',
        art: 'schalter',
        befehle: [
          b('ansicht.fang', 'menue.schalter.fangRaster'),
          b('ansicht.objektfang', 'menue.schalter.objektfang'),
          b('ansicht.spurfang', 'menue.schalter.spurlinien'),
          b('ansicht.hintergrundfang', 'menue.schalter.fangHintergrund'),
          b('ansicht.wandfang', 'menue.schalter.wandfang'),
        ],
      },
    ],
  },
  {
    id: 'einlagen',
    titel: 'menue.einlagen',
    spalten: [
      {
        titel: 'menue.spalte.listen',
        art: 'kacheln',
        befehle: [
          b('werkzeug.stueckliste', 'menue.kachel.stueckliste'),
          b('werkzeug.leitungsliste', 'menue.kachel.leitungsliste'),
          b('werkzeug.trunkliste', 'menue.kachel.trunkliste'),
          b('werkzeug.raumliste', 'menue.kachel.raumliste'),
          b('werkzeug.betriebsmittelliste', 'menue.kachel.betriebsmittelliste'),
          b('werkzeug.stromkreisverzeichnis', 'menue.kachel.stromkreisverzeichnis'),
          b('werkzeug.aktorkanalliste', 'menue.kachel.aktorkanalliste'),
          b('werkzeug.potentialliste', 'menue.kachel.potentialliste'),
        ],
      },
      {
        titel: 'menue.spalte.plaene',
        art: 'kacheln',
        befehle: [
          b('werkzeug.switchplan', 'menue.kachel.switchplan'),
          b('werkzeug.patchpanelplan', 'menue.kachel.patchpanelplan'),
          b('werkzeug.leitungsbaum', 'menue.kachel.leitungsbaum'),
          b('werkzeug.steuerungslogik', 'menue.kachel.steuerungslogik'),
        ],
      },
      {
        titel: 'menue.spalte.blatt',
        art: 'kacheln',
        befehle: [b('werkzeug.plankopf', 'menue.kachel.plankopf')],
      },
    ],
  },
  {
    id: 'blatt',
    titel: 'menue.blatt',
    spalten: [
      {
        titel: 'menue.spalte.blatt',
        art: 'kacheln',
        befehle: [
          b('blatt.verwaltung'),
          b('blatt.zeichenflaeche-einrichten', 'menue.kachel.zeichenflaeche'),
          b('werkzeug.zeichenflaeche-verschieben', 'menue.kachel.flaecheVerschieben'),
          b('blatt.etagen'),
          b('blatt.ebenen', 'menue.kachel.ebenen'),
          b('blatt.beschriftung-groesse', 'menue.kachel.schriftSymbol'),
        ],
      },
      {
        titel: 'menue.spalte.nullpunkt',
        art: 'kacheln',
        befehle: [
          b('werkzeug.nullpunkt', 'menue.kachel.nullpunktSetzen'),
          b('blatt.nullpunkt-alle', 'menue.kachel.nullpunktAlle'),
          b('blatt.ausrichten', 'menue.kachel.nullpunktAusrichten'),
          b('blatt.nullpunkt-aufheben', 'menue.kachel.nullpunktAufheben'),
        ],
      },
      {
        titel: 'menue.spalte.hintergrund',
        art: 'kacheln',
        befehle: [
          b('datei.import-hintergrund', 'menue.kachel.hintergrundEinlesen'),
          b('blatt.ifc-nachladen', 'menue.kachel.ifcNachladen'),
          b('werkzeug.kalibrieren'),
          b('werkzeug.hintergrund-ausblenden', 'menue.kachel.ausblenden'),
          b('blatt.hintergrund-ausblendungen', 'menue.kachel.ausblendungen'),
          b('blatt.hintergrund-umwandeln', 'menue.kachel.umwandeln'),
          b('blatt.ifc-bauteile', 'menue.kachel.ifcBauteile'),
          b('blatt.ifc-bauteilgruppen', 'menue.kachel.ifcGruppen'),
          b('blatt.hintergrund-loeschen', 'menue.kachel.hintergrundLoeschen'),
        ],
      },
    ],
  },
  {
    id: 'ansicht',
    titel: 'menue.ansicht',
    spalten: [
      {
        titel: 'menue.spalte.zoom',
        art: 'kacheln',
        befehle: [
          b('ansicht.zoom-rein'),
          b('ansicht.zoom-raus'),
          b('werkzeug.zoom-fenster'),
          b('ansicht.zoom-alles'),
          b('ansicht.zoom-100', 'menue.kachel.zoom100'),
          b('ansicht.dreid'),
        ],
      },
      {
        titel: 'menue.spalte.anzeigen',
        art: 'schalter',
        befehle: [
          b('ansicht.hintergrund', 'menue.schalter.hintergrund'),
          b('ansicht.raster', 'menue.schalter.raster'),
          ...[...BLATT_SICHTBARKEITEN, ...OBJEKT_SICHTBARKEITEN].map(({ id }) =>
            b(id, SICHTBARKEIT_KURZ[id]),
          ),
          b('blatt.anzeige-wirkverbindungen', 'menue.schalter.wirkverbindungen'),
        ],
      },
      {
        titel: 'menue.spalte.oberflaeche',
        art: 'schalter',
        befehle: [
          b('ansicht.symbolleiste'),
          b('ansicht.seitenleiste'),
          b('ansicht.eigenschaften'),
          b('ansicht.kontextleiste', 'menue.schalter.tastenfunktionen'),
          b('ansicht.vollbild'),
        ],
      },
    ],
  },
  {
    id: 'katalog',
    titel: 'menue.katalog',
    spalten: [
      {
        titel: 'menue.spalte.katalog',
        art: 'kacheln',
        befehle: [
          b('katalog.oeffnen', 'menue.kachel.katalogOeffnen'),
          b('katalog.komponente-neu', 'menue.kachel.komponenteNeu'),
        ],
      },
      {
        titel: 'menue.spalte.vorgaben',
        art: 'kacheln',
        befehle: [
          b('katalog.kabeltypen', 'menue.kachel.kabeltypen'),
          b('katalog.installationszonen', 'menue.kachel.installationszonen'),
        ],
      },
      {
        titel: 'menue.spalte.austausch',
        art: 'kacheln',
        befehle: [
          b('datei.import-katalog', 'menue.kachel.katalogImport'),
          b('datei.import-bibliothek', 'menue.kachel.bibliothekImport'),
          b('datei.export-bibliothek', 'menue.kachel.bibliothekExport'),
        ],
      },
    ],
  },
  {
    id: 'extras',
    titel: 'menue.extras',
    spalten: [
      {
        titel: 'menue.spalte.einstellungen',
        art: 'kacheln',
        befehle: [
          b('extras.einstellungen'),
          b('extras.einstellungen-sichern'),
          b('extras.einstellungen-einspielen'),
          b('extras.modulfelder-reparieren'),
        ],
      },
      {
        titel: 'menue.spalte.module',
        art: 'module',
        befehle: [b('module.anzeigen')],
      },
    ],
  },
  {
    id: 'hilfe',
    titel: 'menue.hilfe',
    spalten: [
      {
        titel: 'menue.spalte.lernen',
        art: 'kacheln',
        befehle: [
          b('hilfe.handbuch'),
          b('hilfe.hinweise'),
          b('extras.tastenkuerzel', 'menue.kachel.tastenkuerzel'),
        ],
      },
      {
        titel: 'menue.spalte.programm',
        art: 'kacheln',
        befehle: [
          b('hilfe.ueber'),
          b('hilfe.meine-lizenz'),
          b('hilfe.update-suche'),
          b('hilfe.fehlerprotokoll'),
        ],
      },
      {
        titel: 'menue.spalte.rechtliches',
        art: 'kacheln',
        befehle: [b('hilfe.lizenzen', 'menue.kachel.fremdbibliotheken')],
      },
    ],
  },
]

export const OHNE_MENUEPLATZ: ReadonlySet<string> = new Set([
  ...Object.values(FANGART_BEFEHL_ID),
  'module.hinzufuegen',
  'module.entfernen',
  'hilfe.befehlssuche',
])

export const MENUEORT: ReadonlyMap<string, { menue: Hauptmenue; spalte: MenueSpalte }> = new Map(
  HAUPTMENUE.flatMap((menue) =>
    menue.spalten.flatMap((spalte) => spalte.befehle.map(({ id }) => [id, { menue, spalte }])),
  ) as [string, { menue: Hauptmenue; spalte: MenueSpalte }][],
)
