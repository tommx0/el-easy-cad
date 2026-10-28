import type { Texte } from '../texte'

export const persistenz: Texte['persistenz'] = {
  dateiAuswahl: {
    zeichnung: 'el.esy.CAD drawing',
  },
  apiClient: {
    nichtErreichbar: 'The el.esy.CAD server cannot be reached.',
    serverAntwort: 'The server responded with {status}.',
  },
  projektAustausch: {
    downloadFehlgeschlagen: 'Download failed ({status}).',
    exportDateiname: 'Export',
    archiv: 'Archive',
  },
  bibliothek: {
    nichtLesbar: 'The file is not a readable el.esy.CAD library.',
    dateiFehlt: '“{datei}” is missing from the file.',
    katalogFehlt: 'The catalogue “{name}” is missing from the file.',
  },
  einstellungen: {
    ungueltigeDatei: 'Not a valid el.esy.CAD settings file.',
    bereichOberflaeche: 'User interface',
    bereichZeichnen: 'Drawing',
    bereichAutorouting: 'Auto-routing',
    bereichFirmenlogoUndKabeltypen: 'Company logo, cable types and installation zones',
    hinweisOberflaeche:
      'Tool sidebar and toolbar (order, visibility), sidebar, properties panel, appearance, keyboard shortcuts',
    hinweisZeichnen:
      'Object snap types, grid spacing, arrow key step sizes, dimension style, default heights, symbol size on the wall',
    hinweisAutorouting: 'Costs, safety clearance, search area, wall routing, arrange automatically',
    hinweisFirmenlogoUndKabeltypen:
      'Company logo for the title block, custom cable types and custom installation zones',
  },
  zeichnungsDatei: {
    speichernAbgebrochen: 'Saving cancelled.',
    nichtAutomatischLadbar:
      'The file cannot be loaded automatically - please select it again via “Open”.',
    keineLeseberechtigung: 'No read permission was granted for the file.',
    keineSchreibberechtigung: 'No write permission was granted for the file.',
    dateinameErforderlich: 'File name required.',
    dateinameVorgabe: 'Drawing',
  },
  katalogExcel: {
    keineZahl: '“{spalte}”: “{wert}” is not a valid number.',
    nichtNull: '“{spalte}” must not be 0.',
    keineGanzeZahl: '“{spalte}”: “{wert}” is not a whole number greater than 0.',
    keineSchutzart: '“{spalte}”: “{wert}” is not a protection rating such as IP44.',
    typUnbekannt: '“{spalte}”: “{wert}” is unknown (allowed: {erlaubt}).',
    blattFehlt: 'The file does not contain a sheet “{blatt}”.',
    spalteFehlt: 'The sheet “{blatt}” is missing the column “{spalte}” in row 1.',
    spalteLeer: '“{spalte}” is empty.',
    artikelnummerMehrfach: 'Article number occurs more than once (rows {zeilen}).',
    variantenSpalteFehlt:
      'The sheet “{blatt}” is missing the column “{spalte}” – variants are skipped.',
    varianteOhneAngaben: 'A variant needs at least a colour, name or article number.',
    keineArbeitsmappe: 'The file is not a readable Excel workbook (.xlsx).',
    bilddateiFehlt: 'Image file “{name}” not found.',
    symboldateiFehlt: 'Symbol file “{name}” not found.',
    ohneGrafik: 'Neither image nor symbol – at least one is required.',
    grundkomponenteFehlerhaft: 'Base component (row {zeile}) contains errors.',
    keineGrundkomponente:
      'No component with article number “{artikelnummer}” in the file or catalogue.',
  },
}
