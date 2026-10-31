import type { Texte } from '../texte'

export const verwaltungsdialoge: Texte['verwaltungsdialoge'] = {
  kuerzel: {
    strg: 'Ctrl',
    umschalt: 'Shift',
    alt: 'Alt',
    tasten: {
      leertaste: 'Space',
      pfeilHoch: 'Up Arrow',
      pfeilRunter: 'Down Arrow',
      pfeilLinks: 'Left Arrow',
      pfeilRechts: 'Right Arrow',
      pos1: 'Home',
      ende: 'End',
      bildAuf: 'Page Up',
      bildAb: 'Page Down',
      einfg: 'Ins',
      esc: 'Esc',
      entf: 'Del',
      ruecktaste: 'Backspace',
    },
    gesperrt: {
      escape: 'Esc cancels the current action.',
      enter: 'Enter finishes a polyline, trunk or hatching.',
      entf: 'Del deletes the selection.',
      ruecktaste: 'Backspace deletes the selection.',
      tab: 'Tab moves the focus.',
      plusMinus: '+ and - change the number of corners, wall thickness and mounting height.',
    },
  },
  notizAnsicht: {
    notiz: 'Note',
    platzhalter: 'Agreements, open points, on-site access details …',
  },
  pdfAnsicht: {
    pdfAnlage: 'PDF attachment',
    keineDatei: 'No file is stored for this attachment.',
  },
  serverHinweis: {
    titel: 'el.esy.CAD is not connected',
    appText:
      'el.esy.CAD starts its own companion server in the background. It is not responding ' +
      'at the moment – either it has not finished starting yet, or it has been stopped.',
    appHilft: 'This usually helps:',
    appWarten: 'Wait a moment and then click “Try again”.',
    appNeuStarten:
      'Quit el.esy.CAD completely (not just close the window) and start it again – ' +
      'this also restarts the companion server.',
    appFirewallVor: 'Check whether an antivirus or firewall program is blocking the connection to',
    appFirewallNach: 'and allow el.esy.CAD as an exception there.',
    datenVor: 'Your data is stored in',
    datenNach: 'and is not affected by this message.',
    webText:
      'Drawings, projects and the product catalogue are kept in the companion server. It is ' +
      'not running at the moment – or it has not finished starting yet.',
    webStarten: 'Start it in the project directory like this:',
    webEntwickelnVor: 'For development use',
    webEntwickelnNach: ' instead; it starts the user interface and the server together.',
    pruefe: 'Checking…',
    erneutVersuchen: 'Try again',
  },
  allgemein: {
    schliessen: 'Close',
    abbrechen: 'Cancel',
  },
  neueZeichnung: {
    titel: 'New drawing',
    name: 'Name',
    plansprache: 'Drawing language',
    art: 'Type',
    bauplan: 'Floor plan',
    schaltplan: 'Schematic',
    verteilerplanFuer: 'Distribution board diagram for +{kennzeichen}',
    hinweis:
      'The type cannot be changed later. On every sheet a schematic has the fixed print area ' +
      'A4 landscape 1:40 with a reference grid.',
  },
  demoHinweis: {
    titel: 'Trial version',
    text:
      'el.esy.CAD is running as a trial version – with the full range of functions, so that ' +
      'you can try everything before buying. In return, the print area and every printout, PDF ' +
      'and Excel workbook carry the notice “Trial version – no commercial use permitted”. ' +
      'Commercial use is not permitted.',
    resttage: { one: '{n} day remaining.', other: '{n} days remaining.' },
    laeuftHeuteAb: 'The trial version expires today.',
    lizenzEinspielen: 'Install licence…',
    verstanden: 'OK',
  },
  ueber: {
    titel: 'About el.esy.CAD Community',
    beschreibung:
      'el.esy.CAD – simple 2D CAD with functional depth for electrical and building services ' +
      'design.',
    version: 'Version {version}',
    lizenzen: 'Licences',
  },
  datenschutz: {
    titel: 'Privacy policy',
    bestaetigenHinweis:
      'Before you can use el.esy.CAD, you must read and confirm the following privacy policy.',
    programmBeenden: 'Quit program',
    akzeptiert: 'Read and accepted',
  },
  eula: {
    titel: 'End user licence agreement and beta test agreement',
    hinweis: 'Before you can use el.esy.CAD, you must read and confirm the following agreement.',
    bestaetigen: 'I confirm these terms and agreements',
  },
  produktlizenzSperre: {
    keinJson: 'This file is not valid JSON.',
    nichtEingespielt: 'The licence could not be installed.',
    titelTestAbgelaufen: 'Trial version expired',
    titelAbgelaufen: 'Licence expired',
    titelUngueltig: 'Licence file invalid',
    titelOhne: 'el.esy.CAD needs a licence',
    zuletztFuer: 'Last stored for',
    gueltigBis: ', valid until {datum}.',
    testAbgelaufen: 'The 30-day trial version has expired.',
    gesperrt:
      'Drawings, projects and the product catalogue are locked until a valid licence file has ' +
      'been installed.',
    wirdGeprueft: 'Checking…',
    dateiAuswaehlen: 'Select licence file…',
  },
  zusatzmodulEinstellungen: {
    einleitung:
      'For developing an add-on, el.esy.CAD loads it directly from a folder on this computer – without a package and without installing.',
    entwicklermodus: 'Developer mode',
    ordner: 'Folder with manifest.json and modul.js',
    gefunden:
      'Found: {name} {version}. el.esy.CAD reloads it before every command if a file has changed.',
    keinOrdner: 'No folder specified yet.',
    neuLaden: 'Reload now',
    hinweis:
      'An add-on from the folder has full access like any other. If it has the same identifier as an installed one, it replaces it while developer mode is on.',
  },
  zusatzmodule: {
    kiFreigabe: 'for AI assistant (Claude may call the commands)',
    keinEintrag: 'no entry chosen',
    waehlen: 'Choose…',
    entwicklung: 'Development',
    entwicklungHinweis:
      'from the development folder – switch off in the “Add-ons” tab of the settings',
    einstellungenLoeschen: 'Also delete the add-on’s settings',
    titel: 'Add-ons',
    hinzufuegen: 'Add add-on…',
    leer: 'No add-ons are installed.',
    aktiv: 'active',
    aktivHinweis: 'Active add-ons appear in the “Add-ons” menu.',
    entfernenHinweis: 'Choose the add-on you want to remove.',
    installiertAm: 'installed on {datum}',
    ungetestet: 'not tested with el.esy.CAD {app}',
    abgeschaltet: 'Switched off while loading: {fehler}',
    fehlerprotokoll: 'Error log',
    entfernen: 'Remove',
    entfernenTitel: 'Remove add-on',
    entfernenFrage: 'Remove the add-on “{name}”? Drawings stay unchanged.',
    hinzufuegenTitel: 'Add add-on',
    hersteller: 'Manufacturer (as stated by the add-on): {hersteller}',
    befehle: 'Commands: {liste}',
    warnungZugriff:
      'Add-ons have full access to el.esy.CAD and your projects. Only install add-ons from manufacturers you trust.',
    ersetztAeltere: 'Replaces the installed version {version}.',
    gleicheVersion: 'This version is already installed and will be reinstalled.',
    ersetztNeuere: 'Caution: older than the installed version {version}.',
    nichtGetestet: 'Tested up to el.esy.CAD {bis}, installed is {app}.',
    installieren: 'Install',
    aelterInstallieren: 'Install anyway',
  },
  fehlerprotokoll: {
    titel: 'Error log',
    nichtGeladen: 'The error log could not be loaded.',
    textdatei: 'Text file',
    hinweis:
      'Continuous, purely local file with debug information and error messages (at most ' +
      '5\u00a0MB) – helps to trace later errors. It only leaves this computer if you save it ' +
      'with “Download as TXT” and pass it on yourself.',
    wirdGeladen: 'Loading…',
    keineEintraege: 'No entries yet.',
    leer: '(empty)',
    aktualisieren: 'Refresh',
    herunterladen: 'Download as TXT',
  },
  tastenkuerzelDialog: {
    titel: 'Keyboard shortcut overview',
    mausUndSondertasten: 'Mouse and special keys',
    kuerzelAendern: 'Change shortcuts…',
    tasteEsc: 'Esc',
    tasteEscEsc: 'Esc Esc',
    tasteEnter: 'Enter',
    tastePlusMinus: '+ / -',
    tasteD: 'D (hold)',
    tasteMausrad: 'Mouse wheel',
    tasteRechtsZiehen: 'Right mouse button + drag',
    tasteRechtsklick: 'Right-click (without dragging)',
    esc: 'Cancel the current action / clear the selection',
    escEsc: 'Also return to the selection tool',
    enter: 'Finish polyline, trunk and hatching',
    plusMinus: 'Number of corners for a polygon, wall thickness, mounting height when placing',
    dHalten: 'Temporarily show all connection points on components',
    mausrad: 'Zoom to the mouse pointer',
    pannen: 'Pan',
    kontextmenue: 'Context menu',
  },
  werkzeugleiste: {
    titel: 'Tool sidebar',
    hinweis:
      'Drag to change the order; clear the box to hide a tool from the tool sidebar. Hidden ' +
      'tools remain available from the menu and by keyboard shortcut.',
    zuruecksetzenTitel: 'Reset tool sidebar',
    zuruecksetzenFrage: 'Reset order and visibility to the factory settings?',
    zuruecksetzen: 'Reset',
    aufStandard: 'Reset to default',
  },
  einstellungenAustausch: {
    titelEinspielen: 'Restore settings',
    titelSichern: 'Back up settings',
    hinweisEinspielen:
      'From “{datei}” (el.esy.CAD {version}). The ticked areas replace your current settings; ' +
      'custom cable types are added.',
    hinweisSichern:
      'The ticked areas are written to a file that you can restore in another el.esy.CAD ' +
      'installation or in the cloud.',
    nichtInDatei: 'Not in this file',
    uebernehmen: 'Apply',
    sichern: 'Back up…',
    gesichert: 'Settings backed up.',
    einspielenFehlgeschlagen: 'Restoring failed.',
    sichernFehlgeschlagen: 'Backup failed.',
    dateiBeschreibung: 'el.esy.CAD settings',
    dateinameTeil: 'Settings',
    nichtGelesen: 'The file could not be read.',
    firmenlogo: 'Company logo',
    kabeltypen: { one: '{n} cable type', other: '{n} cable types' },
    installationszonen: { one: '{n} installation zone', other: '{n} installation zones' },
    uebernommen: '{liste} applied.',
    bereiche: {
      oberflaeche: 'User interface',
      zeichnen: 'Drawing',
      autorouting: 'Auto-routing',
      firmenlogoUndKabeltypen: 'Company logo, cable types and installation zones',
    },
    bereichHinweise: {
      oberflaeche:
        'Tool sidebar and toolbar (order, visibility), sidebar, properties panel, appearance, ' +
        'keyboard shortcuts',
      zeichnen:
        'Object snap types, grid spacing, arrow key step sizes, dimension type, default ' +
        'heights, symbol size on the wall',
      autorouting: 'Costs, safety distance, search area, wall routing, automatic arrangement',
      firmenlogoUndKabeltypen:
        'Company logo for the title block, custom cable types and custom installation zones',
    },
  },
  meineLizenz: {
    titel: 'My licence',
    austauschen: 'Replace licence',
    status: 'Status',
    statusFehlt: 'No licence stored.',
    statusUngueltig: 'The licence is not valid.',
    statusAbgelaufen: 'The licence has expired.',
    statusGueltig: 'Licence valid.',
    restAbgelaufen: ' (expired)',
    restHeute: ' (expires today)',
    restTage: { one: ' ({n} day left)', other: ' ({n} days left)' },
    testversionTage: {
      one: 'Trial version, {n} day left.',
      other: 'Trial version, {n} days left.',
    },
    lizenziertFuer: 'Licensed to',
    gueltigAb: 'Valid from',
    gueltigBis: 'Valid until',
    zusatzmodule: 'Add-on modules',
    hinweisAustausch:
      'You receive the new licence file from the supplier. It only replaces the previous one ' +
      'once it is valid.',
    wirdGeprueft: 'Checking…',
    neueDatei: 'Install new licence file…',
    neueAktiv: 'The new licence is active.',
  },
  lizenzen: {
    titel: 'Licences and terms of use',
    abhaengigkeiten: 'Dependencies (open source)',
    komponenten:
      'This software uses the following open source components (all usable commercially):',
    bestimmungen: 'Licence terms',
    bestimmungenText:
      'All dependencies permit commercial use. They are under permissive licences ' +
      '(MIT/Apache 2.0); web-ifc and some Rust components of the desktop app are under the ' +
      'MPL 2.0 and are used unmodified.',
    nodeZweck: 'Runtime of the companion server (desktop app)',
    tauriZweck: 'Desktop app shell including its Rust libraries',
    vollstaendig:
      'The copyright notices and full licence texts of all third-party software the ' +
      'application contains (user interface, companion server, Node.js and the Rust components ' +
      'of the desktop app) are included with it.',
    texteAnzeigen: 'Show full licence texts',
    texteFehler: 'The licence texts could not be loaded.',
  },
  kiAssistent: {
    titel: 'AI assistant',
    geradeEben: 'just now',
    vorMinuten: '{n} min ago',
    vorStunden: '{n} h ago',
    kopiert: 'Copy placed on the clipboard.',
    selbstKopieren: 'Please copy the selected text with ⌘C or Ctrl+C.',
    kopieren: 'Copy',
    protokoll: 'AI log',
    protokollLeer: 'The assistant has not changed anything in this session yet.',
    aendernFehlgeschlagen: 'Change failed.',
    keineSchnittstelle: 'The companion server of this edition does not offer an AI interface.',
    einleitung:
      'An AI assistant such as Claude can read the open document – sheets, components, rooms, ' +
      'lists, the distribution tree of a distribution board, checks and screenshots – and ' +
      'change it: set properties, delete, move, rotate, replace, create sheets. It talks to ' +
      'el.esy.CAD via the Model Context Protocol (MCP), only on this computer. You bring the ' +
      'language model with your own Claude account.',
    datenweitergabe: 'Data sharing:',
    datenweitergabeText:
      'What the AI assistant reads – object lists, room names, lists and screenshots of the ' +
      'sheets – goes to the provider of the language model (for Claude, to Anthropic). Only ' +
      'switch the interface on if that is acceptable for the projects you open.',
    zustimmen: 'Agree and switch on',
    eingeschaltet: 'AI interface switched on',
    nurLesen: 'AI may only read',
    nurLesenHinweis:
      'Every change by the assistant is a separate undo step (“AI: …”). While you are working ' +
      'with a drawing tool, el.esy.CAD rejects its changes. With this box ticked it can only ' +
      'read.',
    verbunden: 'This window is connected.',
    verbindet: 'Connecting …',
    zuletztAngefragt: 'Last request from {name} {seit}.',
    nochNichtAngefragt: 'No AI assistant has made a request yet.',
    imTerminal: 'Run once in the terminal:',
    desktopVor:
      'In Claude Desktop, under Settings › Developer › “Edit Config”, add this to the file',
    desktopMitte: '(keep existing entries under',
    desktopNach: ') and restart Claude Desktop.',
    zugangstoken: 'Access token',
    tokenHinweis:
      'The token is contained in both entries above. A new token locks out all assistants set ' +
      'up so far – add the entries again afterwards.',
    neuesToken: 'Generate new token',
  },
  tastenkuerzel: {
    titel: 'Keyboard shortcuts',
    suchen: 'Search',
    suchePlatzhalter: 'Command or key…',
    nichtVergebbar: '{kuerzel} cannot be assigned: {grund}',
    zuruecksetzenTitel: 'Reset keyboard shortcuts',
    zuruecksetzenFrage: 'Discard all your own assignments and return to the factory settings?',
    fest: 'Fixed, cannot be changed',
    wieTitel:
      'Same shortcut as “{befehl}” – it opens the tool that suits the drawing. Can be set ' +
      'there.',
    wie: '{kuerzel} (as {befehl})',
    tasteDruecken: 'Press a key …',
    entfernen: 'Remove shortcut',
    entfernenVon: 'Remove shortcut of {befehl}',
    standardVon: 'Reset shortcut of {befehl} to default',
    konflikt: '{kuerzel} is assigned to “{befehl}” – reassign?',
    zuweisen: 'Assign',
    hinweis:
      'The assignments are stored in the project database and are kept when the program is ' +
      'updated. Esc, Enter, Del, + and − belong to the drawing tools and therefore cannot be ' +
      'assigned.',
    alleZuruecksetzen: 'Reset all to default',
  },
  symbolleiste: {
    titel: 'Toolbar',
    anzeigen: 'Show toolbar below the menu',
    hinweis:
      'Use the box to add a command to the toolbar or remove it; drag to change the order. ' +
      'Where the menu changes, the toolbar inserts a separator. With “Group”, commands can be ' +
      'combined into a named drop-down menu. Drawing tools are in the tool sidebar on the left.',
    zuruecksetzenTitel: 'Reset toolbar',
    zuruecksetzenFrage:
      'Reset the order, selection and your own groups of the toolbar to the factory settings?',
    neueGruppe: '+ New group…',
    neueGruppeTitel: 'New group',
    name: 'Name',
    umbenennen: 'Rename group',
    loeschen: 'Delete group',
    loeschenFrage:
      'Delete group “{name}”? Its commands stay in the toolbar, but are no longer grouped.',
    loeschenKnopf: 'Delete',
    gruppeZuweisen: 'Assign to a group',
    keineGruppe: '– no group –',
    zuklappen: 'Collapse',
    aufklappen: 'Expand',
    befehle: { one: '{n} command', other: '{n} commands' },
    gruppeLeer: 'No commands yet – choose “{name}” as the group for a command further down.',
  },
  einstellungenDialog: {
    titel: 'Program settings',
    entfernen: 'Remove',
    reiter: {
      allgemein: 'General',
      routing: 'Routing (A*)',
      objektfang: 'Object snap',
      leitungen: 'Cables & cable type',
      blatt: 'Sheet',
      firma: 'Company & title block',
      tastenkuerzel: 'Keyboard shortcuts',
      werkzeugleiste: 'Tool sidebar',
      symbolleiste: 'Toolbar',
      ki: 'AI assistant',
      module: 'Add-ons',
      lizenz: 'Licence',
    },
    lizenz: {
      titel: 'Licence',
      demo: 'Trial version (demo).',
      lizenziertFuer: 'Licensed to {name}.',
      keine: 'No valid licence stored.',
      hinweis:
        'All details of the licence and how to replace it with a new one can be found under ' +
        '“Help › My licence…”.',
      oeffnen: 'Open my licence…',
    },
    allgemein: {
      ersteSchritte: 'Getting started',
      einfuehrungZeigen: 'Show the introduction with the videos when the program starts',
      einfuehrungHinweis:
        'The same setting as the checkbox in the dialog itself. The introduction is always ' +
        'available under “Help › Getting started…”, even if it no longer appears at start-up.',
      tastenfunktionen: 'Key functions',
      kontextleiste: 'Show key functions as a bar while drawing',
      kontextleisteHinweis:
        'The bar shows what Space, Enter, digits and other keys currently do in the tool, and ' +
        'triggers them with a click. The same setting as “View › Key functions”. On a tablet ' +
        'the bar is always shown.',
      verteiler: 'Distribution board',
      stromkreisImPanel: 'Show circuit in the properties panel',
      stromkreisHinweis:
        'For components and cables connected via a terminal or fuse in the distribution board: ' +
        '“Circuit: UV1-F4 / X6 · RCD F2 · L2”. On the symbol and the cable label you switch the ' +
        'display per sheet under “Sheet › Show labels”.',
      raster: 'Grid',
      rasterBasis: 'Base grid spacing (m)',
      rasterHinweis:
        'The grid adapts automatically to the zoom level; this value sets the fineness as a ' +
        'starting point.',
      rasterSchaltplan:
        'This drawing is a schematic: its grid is fixed at {cm} cm – the spacing of the ' +
        'contacts of circuit breakers, fuses and contactor contacts. The value above applies ' +
        'only to floor plans.',
      nichtDruckbereich: 'Outside the print area',
      nichtDruckbereichFarbe: 'Colour',
      nichtDruckbereichDeckkraft: 'Opacity (%)',
      nichtDruckbereichStandard: 'Default',
      nichtDruckbereichHinweis:
        'Everything outside the print area is covered with this colour; the print area stays ' +
        'white. The background plan appears dimmed there, your objects stay fully visible. ' +
        '0 % turns the area off. Printing and export are not affected.',
      pfeiltasten: 'Moving with arrow keys',
      pfeiltaste: 'Arrow key (cm)',
      umschaltPfeiltaste: 'Shift + arrow key (cm)',
      pfeiltastenHinweis:
        'The arrow keys move selected components by this much – measured in real centimetres, ' +
        'independent of zoom and scale. Default: 5 cm and 100 cm.',
      installationshoehe: 'Mounting height',
      vorgabehoehe: 'Default height {nr} (cm)',
      vorgabehoeheEntfernen: 'Remove default height {cm} cm',
      hoeheHinzufuegen: 'Add height',
      vorgabehoehenHinweis:
        'These heights appear in the properties panel of a component as buttons next to the ' +
        '“Mounting height” field. Default: 30 cm and 110 cm.',
      kombinationen: 'Combinations on the wall',
      symbolgroesse: 'Symbol size (%)',
      kombinationenHinweis:
        'Components that sit in a combination on a wall are drawn this large, relative to their ' +
        'normal size. A change applies immediately to all combinations in the open drawing and ' +
        'to every other drawing as soon as it is opened. Default: {prozent} %.',
      gruppen: 'Groups and control assignments',
      verknuepfung: 'Offer group and control assignment after you route a cable',
      verknuepfungHinweis:
        'If a cable connects two devices for which a control assignment, a pairing of two ' +
        'switches or a device group makes sense, el.esy.CAD asks right away. You can also do ' +
        'this later by right-clicking the cable.',
      uebertragen: 'Transfer settings',
      sichern: 'Back up settings…',
      einspielen: 'Restore settings…',
      uebertragenHinweis:
        'Transfers the tool sidebar and toolbar, keyboard shortcuts, drawing and auto-routing ' +
        'settings, company logo and custom cable types by file to another installation or to ' +
        'the cloud.',
    },
    routing: {
      titel: 'Routing (cables)',
      kostenProMeter: 'Cost per metre of route length',
      kosten90: 'Cost per 90-degree bend',
      kostenHinweis:
        'Controls whether the auto-router prefers short routes or few bends. Only affects future ' +
        'routing, not cables that have already been drawn.',
      erstNachLoslassen: 'Only route cables again after releasing',
      erstNachLoslassenHinweis:
        'When you move, rotate or scale components, connected cables are otherwise ' +
        'recalculated continuously. When switched on, they stay in place while dragging and a ' +
        'dashed line shows the new connection; they are routed once on release. Helps if ' +
        'dragging is sluggish on large plans.',
      parallelAbstand: 'Spacing of parallel cables (cm)',
      parallelAbstandHinweis:
        'If several cables run along the same route, they lie this far apart – on a wall, away ' +
        'from it into the room. 0 places them on top of each other as before. Cables always bend ' +
        'at right angles.',
      feineinstellungen: 'A* fine-tuning',
      sicherheitsabstand: 'Clearance around components (cm)',
      sicherheitsabstandHinweis:
        'How much space a cable leaves around placed components. Smaller values allow cables to ' +
        'be routed more tightly; larger values more reliably prevent them from touching the ' +
        'component edge.',
      sucherweiterungen: 'Maximum search extensions',
      sucherweiterungenHinweis:
        'How often the auto-router enlarges its search area before it gives up and finds no ' +
        'path. Higher values solve more cases, but cost more computing time on every failed ' +
        'attempt.',
      wandfuehrung: 'Wall routing',
      wandfuehrungAn: 'Prefer routing cables along walls',
      wandfuehrungHinweis:
        'If there are walls on the sheet, the auto-router prefers to route cables along them at ' +
        'a fixed distance. Walls may still be crossed, but at a surcharge; door, window and ' +
        'penetration openings are free.',
      wandabstand: 'Distance to wall (cm)',
      bevorzugung: 'Preference (%)',
      aufschlag: 'Surcharge per wall crossing',
      bevorzugungHinweis:
        'The preference states by what percentage a metre along a wall is cheaper than ' +
        'elsewhere. The surcharge is calculated in the same units as the costs above (1 ≈ one ' +
        'metre of detour). A very high preference with a low surcharge can route a cable along ' +
        'the outside of an exterior wall.',
    },
    objektfang: {
      titel: 'Object snap',
      hinweis:
        'Which snap types the object snap offers when it is switched on (tool sidebar or View ' +
        'menu). “Nearest point” is off by default – it finds a hit on every edge and is intended ' +
        'as a fallback to be switched on deliberately.',
    },
    leitungsverlegung: {
      titel: 'Cable routing',
      schalter: 'Cable routing in floor plans',
      hinweis:
        'Cables, trunks, cable risers, connections in the distribution board and cable lists. ' +
        'When switched off, the floor plan is purely a placement tool: these functions are not ' +
        'offered, existing cables, trunks and cable risers are hidden but remain unchanged in ' +
        'the drawing. Schematics are not affected.',
      abgeschaltet:
        'Cable routing is switched off (“Cables & cable type” tab) – these settings currently have no effect.',
    },
    leitungen: {
      titel: 'Cables (this drawing)',
      standardKabeltyp: 'Default cable type for new cables',
      keinStandard: 'No default',
      standardKabeltypHinweis:
        'Assigned to every newly drawn cable. Cables already drawn remain unchanged – as with ' +
        'the routing costs. While drawing, the same field is also shown directly above the ' +
        'print area.',
      anschlussreserve: 'Connection allowance per cable end (cm)',
      anschlussreserveAendern: 'Change connection allowance',
      anschlussreserveHinweis:
        'Counts twice – once per cable end – in the routed length of the cable list. Unlike the ' +
        'values above, it is saved in the drawing and therefore looks the same for everyone who ' +
        'opens it or makes a printout.',
    },
    blatt: {
      zeichnungsart: 'Drawing type',
      istBauplan:
        'This drawing is a floor plan. The type is set when the drawing is created and controls ' +
        'which tools the sidebar offers.',
      istSchaltplan:
        'This drawing is a schematic. The type is set when the drawing is created and controls ' +
        'which tools the sidebar offers. Every sheet has the fixed print area A4 landscape at a ' +
        'scale of 1:40.',
      zeichenflaeche: 'Print area',
      zeichenflaecheAngaben: 'Sheet “{name}” · {format} {lage} · 1:{nenner}',
      ohneZeichenflaeche: 'Sheet “{name}” · no print area set up yet',
      hoch: 'portrait',
      quer: 'landscape',
      einrichten: 'Set up print area…',
      verwalten: 'Manage sheets…',
      beschriftung: 'Labels & symbol size',
    },
    firma: {
      titel: 'Company logo',
      hinweis:
        'Applies to all projects on this device. In the title block dialog, the current logo ' +
        'can be inserted into a cell – as a copy, so a later change of logo does not ' +
        'retroactively change title blocks already inserted.',
      nichtHochgeladen: 'The logo could not be uploaded.',
      wirdHochgeladen: 'Uploading…',
      anderesLogo: 'Upload a different logo…',
      hochladen: 'Upload company logo…',
    },
  },
  handbuch: {
    titel: 'User manual',
    druckTitel: 'el.esy.CAD – User manual',
    version: 'Version {version}',
    suchen: 'Search (e.g. trunk, PoE, origin)…',
    themen: 'Topics',
    drucken: 'Print / as PDF',
    nichtsGefunden: 'Nothing found.',
  },
  einfuehrung: {
    ersteSchritte: 'Getting started',
    titel: 'Getting started with el.esy.CAD',
    keineVideos:
      'No videos have been recorded for this edition yet. Everything described is in the user ' +
      'manual.',
    handgriffe: 'Individual steps',
    alleVideos: '← All videos',
    ausfuehrlich: 'In detail in the user manual',
    nichtMehrZeigen: 'Do not show at start-up again',
    weiter: 'Continue',
  },
  projekteFormat: {
    heute: 'today',
    gestern: 'yesterday',
    vorTagen: { one: '{n} day ago', other: '{n} days ago' },
    dokumente: { one: '{n} document', other: '{n} documents' },
  },
  dokumentSitzung: {
    dokumentFehlt: 'The document no longer exists.',
    schaltplanFehlt: 'The schematic no longer exists.',
    verteilerplanFehlt: 'The distribution board diagram no longer exists.',
    keinSchaltplan: '“{name}” is not a schematic.',
    konflikt:
      'The document has been changed elsewhere. Automatic saving is paused; “File › Save” ' +
      'saves your version anyway.',
    serverNichtErreichbar: 'Not saved – the server cannot be reached.',
    speichernFehlgeschlagen: 'Saving failed.',
  },
  projekte: {
    titel: 'Projects',
    papierkorb: 'Recycle bin',
    papierkorbHinweis: 'Can be restored until they are deleted permanently.',
    sichtbar: { one: '{n} visible', other: '{n} visible' },
    sichtbarGefiltert: { one: '{n} visible (filtered)', other: '{n} visible (filtered)' },
    startHinweis: 'Select a document or create a new project.',
    lizenziertFuer: 'Licensed to {name}',
    suchePlatzhalter: 'Customer, name, number',
    einstellungen: 'Program settings',
    einstellungenTitel: 'Program settings (install licence, check for updates)…',
    papierkorbOeffnen: 'Recycle bin…',
    zurueck: 'Back to the projects',
    status: {
      angebot: 'Quotation',
      inArbeit: 'In progress',
      abgeschlossen: 'Completed',
    },
    dokumentTyp: {
      zeichnung: 'Drawing',
      pdf: 'PDF attachment',
      notiz: 'Note',
      excel: 'Excel attachment',
    },
    statusfilter: 'Status filter',
    alle: 'All',
    archivierteZeigen: 'Show archived',
    keinTreffer: 'No project matches the filter.',
    nochKeinProjekt: 'No project created yet.',
    ohneKunde: 'No customer',
    archiviertKlein: 'archived',
    archiviert: 'Archived',
    neuesProjekt: 'New project',
    neuesProjektKnopf: 'New project…',
    bezeichnung: 'Name',
    importieren: 'Import…',
    muster: 'Sample project',
    musterArt: {
      bauplan: 'Detached house – floor plan only',
      elektro: 'Detached house – with components',
    },
    musterAngelegt: 'Sample project “{name}” created.',
    musterFehlgeschlagen: 'The sample project could not be created.',
    projektWaehlen: 'Select a project on the left – its details and documents then appear here.',
    geaendert: 'changed {zeitpunkt}',
    kunde: 'Customer',
    projektnummer: 'Project number',
    statusFeld: 'Status',
    notiz: 'Note',
    notizPlatzhalter: 'Short remark on the project',
    dokumente: 'Documents',
    listeAktualisieren: 'Refresh document list',
    keineDokumente: 'No documents yet – create one below.',
    herunterladen: 'Download',
    oeffnen: 'Open',
    zeichnungSchaltplan: 'Drawing · Schematic',
    zuletztGeaendert: 'Last changed',
    externOeffnen: 'Open externally',
    inExcelOeffnen: 'Open in Excel (view only – changes do not go back into the project)',
    imPdfProgrammOeffnen: 'Open in PDF program',
    umbenennen: 'Rename',
    umbenennenKnopf: 'Rename…',
    dokumentUmbenennen: 'Rename document',
    name: 'Name',
    loeschen: 'Delete',
    zeichnungNummer: 'Drawing {nr}',
    neueZeichnung: 'New drawing…',
    verteilerplanAssistent: 'Distribution board diagram wizard…',
    neueNotizTitel: 'New note',
    notizName: 'Note',
    neueNotiz: 'New note…',
    pdfAnhaengen: 'Attach PDF…',
    projektUmbenennen: 'Rename project',
    ausArchiv: 'Restore from archive',
    archivieren: 'Archive',
    zuGross: 'Project too large.',
    exportFehlgeschlagen: 'Export failed.',
    exportieren: 'Export…',
    inPapierkorb: 'Move to recycle bin',
    papierkorbLeer: 'The recycle bin is empty.',
    geloeschtAm: 'deleted on {datum}',
    wiederherstellen: 'Restore',
    wiederhergestellt: '“{name}” restored.',
    wiederherstellungFehlgeschlagen: 'Restoring failed.',
    endgueltigLoeschen: 'Delete permanently',
    endgueltigFrage:
      '“{name}” will be deleted irrevocably together with all documents and saved versions.',
    endgueltigGeloescht: 'Deleted: {anzahl}, {groesse} freed.',
    listeNichtGeladen: 'The list could not be loaded.',
    projektNichtAngelegt: 'The project could not be created.',
    aenderungFehlgeschlagen: 'Change failed.',
    imPapierkorb: '“{name}” is in the recycle bin.',
    loeschenFehlgeschlagen: 'Could not delete.',
    zeichnungNichtAngelegt: 'The drawing could not be created.',
    notizNichtAngelegt: 'The note could not be created.',
    pdfNichtAngelegt: 'The PDF attachment could not be created.',
    excelOhneInhalt: 'The Excel attachment has no content.',
    excelArbeitsmappe: 'Excel workbook',
    excelNichtHeruntergeladen: 'The Excel attachment could not be downloaded.',
    anlageOhneInhalt: 'The attachment has no content.',
    stattOeffnenHeruntergeladen:
      '“{name}” has been downloaded – a program cannot be started from the browser.',
    anlageNichtGeoeffnet: 'The attachment could not be opened.',
    umbenennenFehlgeschlagen: 'Renaming failed.',
    bereitsVorhanden: 'Project already exists',
    ersetzenFrage: '{meldung} Should it be replaced? Cancel creates a copy instead.',
    ersetzen: 'Replace',
    importFehlgeschlagen: 'Import failed.',
    importiert: '“{name}” imported: {anzahl}, {staende}.',
    staende: { one: '{n} saved version', other: '{n} saved versions' },
  },
}
