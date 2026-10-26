import type { Texte } from '../texte'

export const katalogdialoge: Texte['katalogdialoge'] = {
  gemeinsam: {
    abbrechen: 'Cancel',
    schliessen: 'Close',
    uebernehmen: 'Apply',
    loeschen: 'Delete',
    duplizieren: 'Duplicate',
    bearbeiten: 'Edit',
    speichern: 'Save',
    standard: 'Built-in',
    eigen: 'Custom',
    aktiv: 'Active',
    inaktiv: 'Inactive',
    wiederAnbieten: 'Offer again',
    alleKataloge: 'All catalogues',
    alleKategorien: 'All categories',
    suche: 'Search by manufacturer/article number/name ...',
    keineKomponenten: 'No components found.',
    unbekannterFehler: 'Unknown error.',
    speichernFehlgeschlagen: 'Saving failed.',
    loeschenFehlgeschlagen: 'Delete failed.',
    importFehlgeschlagen: 'Import failed.',
    exportFehlgeschlagen: 'Export failed.',
  },

  katalogDialog: {
    titel: 'Product catalogue',
    vorlageSymbolVariante: 'Variant symbol',
    vorlageSymbolHaupt: 'Schematic symbol of the main component',
    vorlageBildVariante: 'Variant image',
    vorlageBisherigesSymbol: 'Previous symbol',
    dupliziert: 'Component duplicated.',
    geloescht: 'Component deleted.',
    alsEigeneAngelegt: 'Created as a custom component – now editable.',
    verschoben: 'Moved.',
    neuerKatalog: 'New catalogue',
    name: 'Name',
    katalogUmbenennen: 'Rename catalogue',
    katalogLoeschenTitel: 'Delete catalogue?',
    katalogLoeschenLeer: '“{name}” will be deleted.',
    katalogLoeschenMitKomponenten: {
      one:
        '“{name}” will be deleted together with {n} component. ' +
        'Components already placed lose their catalogue entry.',
      other:
        '“{name}” will be deleted together with {n} components. ' +
        'Components already placed lose their catalogue entry.',
    },
    katalogGeloescht: 'Catalogue deleted.',
    excelErgebnis:
      'Excel import: {komponenten} component(s), {varianten} variant(s), ' +
      '{grafiken} graphic(s) imported.',
    zipArchiv: 'ZIP archive',
    namePflicht: 'Name is a required field.',
    grafikPflicht: 'An image or schematic symbol is required – please upload at least one.',
    varianteFehler: 'Variant {nummer}: {fehler}',
    gespeichert: 'Saved.',
    kataloge: 'Catalogues',
    katalogAnlegenTitel: 'Create new catalogue',
    aktivSichtbar: 'active (visible in the place dialog)',
    mitgeliefertSchreibgeschuetzt: 'Built-in catalogues are read-only.',
    umbenennen: 'Rename…',
    exportieren: 'Export…',
    excelNichtMitgeliefert:
      'Built-in catalogues cannot be filled from Excel – create a custom catalogue for that.',
    excelTitel: 'Add many components with images and symbols from an Excel spreadsheet.',
    ausExcel: 'Import from Excel…',
    nurDeaktivieren: 'Built-in catalogues can only be deactivated.',
    katalogWaehlen: 'Select a catalogue to manage it.',
    katalogImportieren: 'Import catalogue…',
    bibliothekExportieren: 'Export library…',
    bibliothekImportieren: 'Import library…',
    neueKomponenteKnopf: '+ New component',
    komponenteAnsehen: 'View component',
    komponenteBearbeiten: 'Edit component',
    neueKomponente: 'New component',
    nurAnsichtHinweis:
      'Built-in components are read-only – changes come with catalogue and program updates. ' +
      'For your own adjustments, choose “Edit as custom component…”.',
    abgeleitetVon: 'Derived from “{name}”.',
    namePflichtLabel: 'Name *',
    hersteller: 'Manufacturer',
    artikelnummer: 'Article number',
    stromverbrauch: 'Max. power consumption (watts)',
    poeLeistung: 'PoE power draw (watts)',
    poeHinweis:
      'Only for devices powered over PoE – the basis of the PoE total at the switch. ' +
      'Leave empty if the device has its own power supply.',
    bemessungswerte: 'Ratings',
    bemessungHinweis:
      'For the IFC export (rating plate). Variants can specify individual values differently; ' +
      'empty fields are omitted.',
    kategorie: 'Category',
    typ: 'Type',
    keinTyp: 'No type',
    typHinweis:
      'Preselection for newly placed instances of this component – can still be changed in the ' +
      'properties panel of the drawing.',
    ansteuerung: 'Control',
    keineVorbelegung: 'No preset',
    ansteuerungHinweis:
      'Preselected control (e.g. dimming for a dimming actuator) for newly placed instances.',
    stromkreis: 'Circuit',
    stromkreisNachTyp: 'By device type',
    stromkreisKein: 'none',
    stromkreisRaum: 'Room circuit',
    stromkreisEigen: 'own circuit',
    stromkreisHinweis:
      'Default for “Suggest board layout from rooms” – by device type means room circuit for ' +
      'consumers and connection boxes, otherwise none.',
    polzahl: 'Number of poles',
    bauart: 'Design',
    bauartStandard: 'Standard (with ports: switch)',
    bauartPatchpanel: 'Patch panel',
    bauartVerteiler: 'Distribution board',
    bauartHinweis:
      'A distribution board receives a location designation (+UV1) and a board layout when ' +
      'placed; cables are connected in it to fuses, terminals and relays.',
    kennzeichen: 'Equipment reference designation (letter)',
    kennzeichenHinweis:
      'Automatically suggests “letter + next free number” as the equipment reference designation ' +
      'when placing (e.g. “F1”) – can be overwritten freely. Usual: F for circuit breaker/RCD/fuse, ' +
      'K for relay/contactor coil and contact block, X for terminals, P for meters. Leave empty ' +
      'for no suggestion.',
    rolle: 'Role (only for reference designation “K”)',
    keineAngabe: 'Not specified',
    spule: 'Coil',
    kontaktblock: 'Contact block',
    rolleHinweis:
      'Distinguishes a relay/contactor coil from its contact block – the basis of the orphan ' +
      'check in the equipment list (exactly one coil expected per reference designation).',
    slotMatrix: 'Slot matrix',
    spalten: { one: '{n} column', other: '{n} columns' },
    zeilen: 'rows',
    reihe: 'Row {nummer}',
    standardSpalten: { one: 'Default ({n} column)', other: 'Default ({n} columns)' },
    slotMatrixHinweis:
      'Grid layout in which newly placed instances show their slots (graphical slot matrix ' +
      'instead of a list) – can be changed freely on the placed component afterwards. Individual ' +
      'rows can be 1 or 2 columns wide, differing from the default number of columns.',
    slotVorlagen: 'Slot templates',
    slotAusserhalb: 'No longer fits the selected slot matrix – ignored when placing',
    slotNummer: 'Slot {nummer}',
    slotMitPosition: 'Slot {nummer} (row {zeile}, column {spalte})',
    slotBezeichnungPlatzhalter: 'Slot name, e.g. lighting on the stairs',
    nachOben: 'Move up',
    nachUnten: 'Move down',
    slotVorlageEntfernen: 'Remove slot template',
    slotVorlageHinzufuegen: '+ Add slot template',
    slotVorlagenHinweis:
      'Every newly placed instance of this component starts with exactly these slots – ' +
      'afterwards they can be changed or deleted freely in the properties panel of the drawing.',
    hauptgruppe: 'Main group',
    hauptgruppeHinweis: 'Product family, e.g. “Door communication”.',
    untergruppe: 'Subgroup',
    untergruppeHinweis:
      'Role in the system structure, e.g. “Door station”, “Flat station” or “System device”.',
    bildUndSymbol: 'Image and schematic symbol *',
    bildUndSymbolHinweis:
      'At least one of the two. Which one appears in the plan is set per sheet (Labelling & ' +
      'symbol size) or per component; if it is missing, the other one steps in.',
    symbolUndAnschluesse: 'Symbol and terminals',
    breitenfaktor: 'Width factor',
    breitenfaktorPlatzhalter: '1 (square)',
    breitenfaktorHinweis:
      'How much wider than tall the symbol is, e.g. 2 for a switch with many ports. ' +
      'Empty = square. Also applies to the canvas when drawing the symbol.',
    hoehenfaktor: 'Height factor',
    hoehenfaktorPlatzhalter: '1 (base height)',
    hoehenfaktorHinweis:
      'How much taller than the base size the symbol is, e.g. 2 for a tall terminal block. ' +
      'Texts and terminal designations keep their size. Empty = base height. Has no effect on ' +
      'module carriers.',
    kombinierbar: 'May be part of a combination',
    kombinierbarHinweis:
      'Grouped with others into a combination on the wall. Without the tick, the component ' +
      'snaps to the wall on its own, at normal size.',
    montageort: 'Mounting location',
    montageDecke: 'Ceiling',
    montageWand: 'Wall',
    montageBoden: 'Floor',
    montageortHinweis:
      'Default when placing, can be changed per component in the drawing. On the ceiling it ' +
      'sits below the ceiling, on the floor on the floor surface.',
    technischeDaten: 'Technical data',
    technischeDatenFormat: 'One entry per line, format “Key: Value”',
    varianten: 'Variants',
    varianteBezeichnung: 'Name (empty = inherited)',
    varianteFarbe: 'Colour/finish',
    varianteArtikelnummer: 'Article number (empty = inherited)',
    varianteEntfernen: 'Remove variant',
    varianteHinzufuegen: '+ Add variant',
    zeichnerTitelHaupt: 'Draw schematic symbol',
    zeichnerTitelVariante: 'Draw variant symbol',
    bildLaedt: 'Uploading image…',
    zurueck: 'Back',
    alsEigeneBearbeiten: 'Edit as custom component…',
    grafik: {
      produktbild: {
        titel: 'Product image',
        hochladenAria: 'Upload product image',
        hochladenTitel: 'Take the product image from an image file',
        entfernen: 'Remove product image',
      },
      schaltplansymbol: {
        titel: 'Schematic symbol',
        hochladenAria: 'Upload schematic symbol',
        hochladenTitel: 'Take the schematic symbol from an image file',
        entfernen: 'Remove schematic symbol',
      },
    },
    symbolBearbeiten: 'Edit symbol…',
    symbolZeichnen: 'Draw symbol…',
    hochladen: 'Upload…',
    varianteGrafik: {
      bild: {
        alt: 'Variant image',
        geerbt: 'Image inherited',
        eigenes: 'Own image (empty = inherited)',
        ersetzen: 'Replace image…',
        hochladen: 'Upload image…',
        entfernen: 'Remove own image (inherited again)',
      },
      symbol: {
        alt: 'Variant symbol',
        geerbt: 'Symbol inherited',
        eigenes: 'Own symbol (empty = inherited)',
        ersetzen: 'Replace symbol…',
        hochladen: 'Upload symbol…',
        entfernen: 'Remove own symbol (inherited again)',
      },
    },
    gezeichnetesBearbeiten: 'Edit symbol in the drawing editor',
    eigenesZeichnen: 'Draw own symbol',
    bearbeitenKlein: 'edit…',
    zeichnenKlein: 'draw…',
    geerbt: 'inherited',
    verschiebenTitel: 'Move to another catalogue',
  },

  katalogEntwurf: {
    nennstrom: 'Rated current',
    nennspannung: 'Rated voltage',
    polzahl: 'Number of poles',
    keineZahl: '{feld}: “{wert}” is not a number above 0.',
    keineGanzeZahl: '{feld}: “{wert}” is not a whole number above 0.',
    keineSchutzart: 'IP rating: “{wert}” is not a rating such as IP44.',
  },

  picker: {
    titel: 'Select component from the catalogue',
    variante: 'Variant',
    platzieren: 'Place',
    kachelgroesse: 'Tile size',
  },

  kabeltypen: {
    titel: 'Manage cable types',
    hinweis:
      'Applies to all drawings. Renaming affects every drawing that uses this cable type – ' +
      'including those already printed.',
    inBenutzung: '“{name}” is used in this drawing – deactivate it instead.',
    uebernommen: '{n} cable type(s) added.',
    nichtImBestand: '{n} cable type(s) of this drawing are not in the collection here.',
    inMeineUebernehmen: 'Add to my cable types',
    alle: 'All ({n})',
    suchen: 'Search…',
    ausAuswahl: 'Remove from the selection lists',
    mitgeliefertDuplizieren: 'Please duplicate built-in types – the copy can be changed freely.',
    nurDeaktivieren: 'Built-in types can only be deactivated.',
    keinGefunden: 'No cable type found.',
    eigeneGruppe: 'Custom cable types',
    neu: 'New cable type…',
    bezeichnung: 'Name (as shown in the plan)',
    gruppe: 'Group',
    bemerkung: 'Remark (only visible here, helps with searching)',
    aussendurchmesser: 'Outer diameter (mm, optional)',
    standardAendern: 'Change default cable type',
  },

  installationszonen: {
    titel: 'Manage installation zones',
    hinweis:
      'Applies to all drawings. If you change a custom zone, every drawing that uses it ' +
      'calculates with the new values the next time it is opened – route lengths change too.',
    inBenutzung: '“{name}” is used in this drawing – hide it instead.',
    uebernommen: '{n} installation zone(s) added.',
    uebernehmenFehlgeschlagen: 'Adding failed.',
    nichtImBestand: '{n} installation zone(s) of this drawing are not in the collection here.',
    inMeineUebernehmen: 'Add to my zones',
    ausAuswahl: 'Remove from the selection lists',
    ausgeblendet: 'Hidden',
    standardDuplizieren: 'Please duplicate built-in zones – the copy can be changed freely.',
    nurAusblenden: 'Built-in zones can only be hidden.',
    neu: 'New zone…',
    bezeichnung: 'Name (as shown in the selection lists)',
    kuerzel: 'Abbreviation (on the plan at sections, up to 3 characters)',
    bauteil: 'Building element',
    bauteilDecke: 'Ceiling',
    bauteilWand: 'Wall',
    bauteilBoden: 'Floor',
    verlegung: 'Cable route',
    verlegungAuf: 'on the building element (surface-mounted, SM)',
    verlegungIn: 'in the building element (flush-mounted, FM)',
    tiefe: 'Depth (cm, centre of the cable behind the surface of the building element)',
    tiefeRohdecke: 'Centre of the structural slab',
    hoeheGemessen: 'Height measured',
    ueberFussboden: 'above the floor',
    unterDecke: 'below the ceiling',
    abstand: 'Distance (cm, to the centre of the zone)',
    farbe3d: 'Colour in the 3D view',
    beschreibung: '{bauteil}, {art}',
    beschreibungMitHoehe: '{bauteil}, {art}, {hoehe}',
    artAuf: 'on (SM)',
    artIn: 'in (FM)',
    artInRohdecke: 'in (FM), centre of the structural slab',
    artInTiefe: 'in (FM), {tiefe} deep',
    hoeheUnterDecke: '{abstand} below the ceiling',
    hoeheUeberBoden: '{abstand} above the floor',
    zentimeter: '{wert} cm',
    keineAngabe: 'not specified',
    unbekannt: 'unknown zone “{zone}”',
  },

  paketZahlen: {
    katalogNeu: 'new catalogue',
    neu: '{n} new',
    aktualisiert: '{n} updated',
    unveraendert: '{n} unchanged',
    ausgemustert: '{n} retired',
    uebersprungen: '{n} skipped (ID already taken)',
    zurueckgezogen: 'catalogue withdrawn, {n} component(s) retired',
  },

  katalogImport: {
    eingespielt: '“{name}” imported: {zahlen}.',
    importiert: '“{name}” imported: {komponenten} component(s), {bilder} new image(s).',
    aktuell: '“{name}” is already up to date.',
    zurueckziehenTitel: 'Withdraw catalogue',
    zurueckziehenText:
      'The manufacturer is withdrawing the built-in catalogue “{name}”. It disappears from ' +
      'catalogue management and selection; components already placed remain unchanged in the ' +
      'drawings.',
    zurueckziehen: 'Withdraw',
    hinzufuegenTitel: 'Add catalogue',
    aktualisierenTitel: 'Update catalogue',
    mitgeliefertText:
      '“{name}” is a built-in catalogue: {zahlen}. Custom components remain unchanged; ' +
      'components already placed adopt the new version the next time their drawing is opened.',
    einspielen: 'Import',
    vorhandenTitel: 'Catalogue already exists',
    alsKopieFrage: '{meldung} Create as a copy?',
    alsKopie: 'Create as copy',
    ersetzenFrage: '{meldung} Should it be replaced? Cancel creates a copy instead.',
    ersetzen: 'Replace',
  },

  bibliothekImport: {
    titel: 'Import library',
    hinweis:
      'Exported on {datum} from {anwendung}. Choose for each catalogue what should happen. ' +
      'Placed components in drawings remain unchanged.',
    wirdGeprueft: 'Checking…',
    spalteKatalog: 'Catalogue',
    spalteKomponenten: 'Components',
    spalteStand: 'Status',
    spalteAktion: 'Action',
    auslassen: 'Skip',
    alsKopie: 'Create as copy',
    zurueckziehen: 'Withdraw',
    aktualisieren: 'Update',
    importieren: 'Import',
    ersetzen: 'Replace existing',
    hinweisEigene: 'Custom components – can only be added as an additional catalogue.',
    hinweisZurueckgezogen:
      'Withdrawn by the manufacturer – placed components remain in the drawings.',
    hinweisMitgeliefert: 'Built-in: {zahlen}',
    katalogNeu: 'new',
    hinweisAktuell: 'Built-in, already up to date.',
    hinweisNeu: 'New on this installation.',
    hinweisKennungStandard: 'This ID belongs here to the built-in catalogue “{name}”.',
    hinweisVorhanden: 'Already present as “{name}”.',
    nichtLesbar: 'Not readable.',
    fehlgeschlagen: 'failed',
    regelwerkFehler: 'Device types & rules: {fehler}',
    eingespielt: 'Imported: {namen}.',
    keineEingespielt: 'No catalogues imported.',
    regelwerkVersion: 'Device types & rules: version {version}.',
    fehlerListe: 'Errors: {liste}',
    regelwerkUebernehmen: 'Adopt device types & rules (version {neu}, here {hier})',
    regelwerkAktuell: 'Device types & rules: already version {hier} here – nothing to adopt',
    wirdEingespielt: 'Importing…',
    einspielen: 'Import',
    nichtOeffnen: 'The library could not be opened.',
    wirdZusammengestellt: 'Compiling library…',
  },

  excelImport: {
    titel: 'Import from Excel',
    titelMitZiel: 'Import from Excel – “{ziel}”',
    hinweis:
      'One row per component, image and symbol as a file name or linked in Excel with Ctrl+K ' +
      '(Mac: ⌘K). Components with the same article number are updated; empty cells change ' +
      'nothing. The sample files show the structure.',
    grafikBleibt: 'kept',
    grafikGewaehlt: '{name} (selected)',
    grafikFehlt: '{name} missing',
    statusNeu: 'new',
    statusAktualisiert: 'updated',
    statusFehler: 'Error',
    bildWaehlen: 'Select image file',
    symbolWaehlen: 'Select symbol file',
    waehlen: 'select…',
    auswahlZuruecknehmen: 'Clear selection',
    komponenten: 'Components',
    varianten: 'Variants',
    spalteZeile: 'Row',
    spalteStatus: 'Status',
    spalteKomponente: 'Component',
    spalteName: 'Name',
    spalteFarbeName: 'Colour / name',
    spalteArtikelnummer: 'Article number',
    spalteBild: 'Image',
    spalteSymbol: 'Symbol',
    spalteHinweise: 'Notes',
    excelWaehlen: 'Select Excel file…',
    nochKeineDatei: 'no file yet',
    ordnerWaehlen: 'Select image folder…',
    dateienWaehlen: 'Select image files…',
    grafikenBereit: '{n} graphic(s) ready',
    optional: 'optional',
    leeren: 'clear',
    vorschauLeer: 'The preview appears here once the Excel file has been selected.',
    keineZeilen: 'The spreadsheet contains no rows.',
    downloadFehlgeschlagen: 'Download failed.',
    musterHerunterladen: 'Download sample files',
    zusammenfassung: '{neu} new, {aktualisiert} updated',
    zusammenfassungMitFehlern:
      '{neu} new, {aktualisiert} updated, {fehler} faulty (will be skipped)',
    importiere: 'Importing…',
    zeilenImportieren: 'Import {n} row(s)',
  },

  dockpunkte: {
    titel: 'Connection points',
    standardHinweis:
      'Without your own definition, 8 standard points apply automatically (4 corners + 4 edge ' +
      'midpoints).',
    freiPlatzieren: '+ Place freely (mouse)',
    portgruppen: '+ Port groups',
    titelFrei: 'Connection points (placed freely)',
    titelPorts: 'Connection points (port groups)',
    zurueckStandard: 'Back to the 8 standard points',
    typPlatzhalter: 'Type (e.g. RJ45)',
    porttyp: 'Port type',
    anzahl: 'Count',
    anzahlPorts: 'Number of ports',
    reihen: 'Rows',
    portgruppeEntfernen: 'Remove port group',
    portgruppe: '+ Port group',
    trunkPunkte: 'Special trunk points (for trunks only, not for single cables)',
    lageOberkante: 'Position on the top edge (0 to 1)',
    trunkPunktEntfernen: 'Remove trunk point',
    trunkPunkt: '+ Trunk point',
    klickEntfernen: 'Click to remove',
    vorschauHinweis: 'Clicking an empty area sets a connection point; clicking a point removes it.',
    bezeichnung: 'Name',
    bezeichnungAria: 'Name of connection point {nummer}',
    bezeichnungTitel: 'Terminal designation, e.g. 13, A1, L1, PE',
    nurTrunk: 'trunk only',
    dockpunktEntfernen: 'Remove connection point',
    portVorschau: 'Preview of the connection points calculated from the port groups.',
  },

  fangpunkt: {
    titelEigen: 'Snap point (own definition)',
    titelStandard: 'Snap point (default)',
    zurueck: 'Back to default (first connection point)',
    hinweis:
      'When placing, this point hangs on the mouse pointer and snaps to the grid. Without your ' +
      'own definition it is the first connection point (the centre with 8 standard points). ' +
      'Clicking the symbol sets it; near a connection point or the centre it snaps there.',
    xAria: 'Snap point x (0 to 1)',
    yAria: 'Snap point y (0 to 1)',
  },

  textElemente: {
    titel: 'Texts (terminal designation, variable texts)',
    hinweis:
      'Clicking an empty area creates a text, clicking an existing one selects it, dragging ' +
      'moves it. Variable texts are only filled in in the drawing, per component, in the ' +
      'properties panel on the right.',
    links: 'left',
    mittig: 'centre',
    rechts: 'right',
    oben: 'top',
    unten: 'bottom',
    drehungWaagerecht: '0° – always horizontal',
    drehungMit: '{grad}° – rotates with it',
    neuerText: 'Text',
    neuesFeld: 'Field {nummer}',
    art: 'Kind',
    fest: 'Fixed text',
    variabel: 'Variable text',
    feldname: 'Field name',
    feldnamePlatzhalter: 'e.g. rated current',
    feldnameDoppelt:
      'Another text already has this field name – both will then always get the same value.',
    vorgabewert: 'Default value (empty = enter it in the drawing)',
    text: 'Text',
    schriftgroesse: 'Font size (% of symbol height)',
    waagerecht: 'Horizontal alignment',
    senkrecht: 'Vertical alignment',
    drehung: 'Rotate',
    fixiertHinweis:
      'The text is fixed to the symbol and rotates with the component like drawn text – even ' +
      'upside down.',
    gedrehtHinweis:
      'A rotated text rotates with the component but is never upside down – it always reads ' +
      'from below or from the right.',
    fixieren: 'Fix to symbol (rotates like drawn text)',
    inStueckliste: 'List in the bill of materials',
    fertig: 'Done',
  },

  symbolUndAnschluesse: {
    ohneGrafik:
      'First draw a symbol or upload an image – then connection points, snap point and text ' +
      'elements can be set on the symbol here.',
  },

  symbolZeichner: {
    titel: 'Draw symbol',
    werkzeuge: {
      auswahl: 'Select',
      linie: 'Line',
      polylinie: 'Polyline',
      rechteck: 'Rectangle',
      kreis: 'Circle',
      bogen: 'Arc',
      text: 'Text',
      freihand: 'Freehand',
      radierer: 'Eraser',
    },
    duenn: 'thin',
    mittel: 'medium',
    dick: 'thick',
    klein: 'small',
    gross: 'large',
    strichstaerke: 'Line weight',
    fuellung: 'Fill',
    textgroesse: 'Text size',
    vorlageUebernehmen: 'Adopt template',
    vorlageFehler: 'The template could not be adopted.',
    vektorHinweis:
      'Imported symbol: parts can be selected, moved, recoloured, erased and deleted. Draw new parts as usual.',
    bildgroesse: 'Image size',
    bildgroesseProzent: 'Image size (%)',
    zeichenwerkzeuge: 'Drawing tools',
    rueckgaengig: '↶ Undo',
    rueckgaengigTitel: 'Undo (Ctrl/⌘+Z)',
    wiederholen: '↷ Redo',
    wiederholenTitel: 'Redo (Ctrl/⌘+Shift+Z)',
    text: 'Text',
    vorschau: 'Preview',
    strich: 'Line',
    radiererGroesse: 'Eraser size',
    auswahlLoeschen: 'Delete selection',
    rasterUndFang: 'Grid and snap',
    vorlage: 'Template',
    blassEinblenden: 'show faded',
    alsTeilTitel:
      'Embeds the template permanently in the symbol – afterwards it can be added to and erased.',
    alsTeil: 'Adopt as part',
    einpassen: 'Fit view',
    navigationHinweis: 'Mouse wheel zooms; middle mouse button or Space + drag pans the view.',
    allesLoeschen: 'Delete all',
    verwerfenFrage: 'Really discard changes?',
    leerTitel: 'An empty drawing cannot be applied.',
  },

  symbolWerkzeuge: {
    radiererStatus:
      'Drag over the drawing to erase parts. The trace belongs to the elements it hits.',
    radieren: 'Erase',
    auswahlStatus:
      'Click an element or drag a selection frame (Shift adds). Dragging moves, Del deletes, ' +
      'double-clicking a text edits it.',
    textAendern: 'Change text',
    verschieben: 'Move',
    linieStart: 'Click the start point of the line.',
    linieEnde: 'Click the end point (Shift: 15° steps).',
    rechteckStart: 'Click the first corner of the rectangle.',
    rechteckEnde: 'Click the opposite corner.',
    kreisStart: 'Click the centre of the circle.',
    kreisEnde: 'Click a point on the circle (sets the radius).',
    polylinieStart: 'Click the first point of the polyline.',
    polylinieWeiter:
      'Click further points. Double-click or Enter finishes, clicking the start point closes, ' +
      'Backspace removes the last point.',
    bogenMitte: 'Click the centre of the arc.',
    bogenStart: 'Click the start point of the arc (sets the radius).',
    bogenEnde: 'Click the end point – the arc runs clockwise.',
    textStatus: 'Click the position for the text (centre of the text).',
    textEingeben: 'Enter text – Enter applies, Shift+Enter starts a new line.',
    freihandStatus: 'Draw with the mouse button held down or with your finger.',
  },

  slots: {
    weitereSlots: {
      one: '{n} further slot will then also point to the group instead of a single component.',
      other: '{n} further slots will then also point to the group instead of a single component.',
    },
    slotsEntfallen: 'Own slots of {namen} are dropped in the group.',
    slotsAendern: 'Change slots',
    tretenBei: {
      one: '{namen} joins the group “{gruppe}”.',
      other: '{namen} join the group “{gruppe}”.',
    },
    gruppeBildenTitel: 'Create device group',
    gruppeBildenText:
      '{slot} of {quelle} will then act on {ziele}. They are placed in a shared device group, ' +
      'and the slot then points to the group. “Cancel” discards the new control assignment.',
    gruppeAusWirkverbindung: 'Create device group from control assignment',
  },
}
