import type { Texte } from '../texte'

export const ki: Texte['ki'] = {
  werkzeuge: {
    schema: {
      bereich: 'Rectangle in metres, relative to the origin of the sheet (y points upwards).',
      blattId:
        'Id of the sheet from dokument_uebersicht (document overview). If omitted: the active sheet.',
      objektIds: 'Ids from blatt_lesen; the objects may lie on different sheets.',
      punkt: 'Point in metres from the origin of the sheet.',
      genauEineArt: 'Specify exactly one kind.',
      dockpunkt:
        'Index of the connection point from objekt_lesen; if omitted, the most suitable one.',
      kennzeichen:
        'Reference designation of the equipment, e.g. "F3"; a terminal as "X1:4" (strip:number).',
      anschluss: 'Terminal on the equipment, e.g. "2".',
      anschluesse: 'Only at a distribution board: the terminals the cable lands on there.',
      kontaktAnschluss:
        'Terminal designation such as "A1" or "13" (objekt_lesen) or connection point index.',
      potential: 'Object id of a potential.',
      knoten: 'Object id of a junction.',
      verbindungPunkt:
        'Approximate position on the wire; if omitted, the position nearest to the other end.',
      verbindung: 'Branch on another wire (becomes a junction).',
      freiesEnde: 'Free end.',
      verteilerId:
        'Object id of the distribution board in the open floor plan (verteilerbaum_lesen, the ' +
        'distribution tree, lists them when called without arguments).',
      trunkKomponente: 'Object id of a component with a trunk connection point.',
      trunkTrunk: 'Id of a trunk on the same sheet.',
      aendernHinweis:
        'Each call is one undo step. Rejected while the user is working with a drawing tool or ' +
        '“AI may only read” is switched on.',
    },
    dokumentUebersicht: {
      titel: 'Document overview',
      beschreibung:
        'The document open in el.esy.CAD: project, drawing type (floor plan or schematic), ' +
        'sheets with id, storey, scale, origin and number of objects per type, plus the active ' +
        'sheet. Call this first – every other tool needs the sheet ids.',
    },
    blattLesen: {
      titel: 'Read sheet',
      beschreibung:
        'The objects of a sheet in short form: id, type, position (metres from the origin) and ' +
        'the most important details (name, catalogue name, room, cable number, terminals). Can ' +
        'be filtered by object type (e.g. "komponente" = component, "leitung" = cable, "trunk", ' +
        '"raum" = room, "wand" = wall) and by an area. objekt_lesen returns all properties of an ' +
        'object.',
      typen: 'Only these object types, e.g. ["komponente", "leitung"] (component, cable).',
      maxAnzahl: 'At most this many objects (default 300).',
    },
    objektLesen: {
      titel: 'Read object',
      beschreibung:
        'All properties of an object as JSON, as stored in the drawing (coordinates in it are ' +
        'model coordinates; the origin of the sheet is included). For components additionally ' +
        'the catalogue entry and the connection points with their position.',
      objektId: 'Id from blatt_lesen (read sheet).',
    },
    raeumeLesen: {
      titel: 'Read rooms',
      beschreibung:
        'The rooms of a sheet (or of all sheets) with name, area in m², outline, storey and the ' +
        'components in them as a count per catalogue entry. The ids of the components only with ' +
        'mitIds – for objekt_lesen or a specific question about individual components.',
      alleBlaetter: 'Rooms of all sheets instead of just one.',
      mitIds: 'Also the ids of the components per catalogue entry (default: no).',
    },
    katalogSuchen: {
      titel: 'Search catalogue',
      beschreibung:
        'Searches the product catalogue by name, manufacturer, article number or category. ' +
        'Returns per hit the id, catalogue, device type, mounting location, variants and the ' +
        'number of connection points. Retired components are omitted.',
      text: 'Search text; several words must all occur.',
      geraetetyp: 'Only this device type (field "typ").',
      katalogId: 'Only this catalogue.',
      maxAnzahl: 'Default 30.',
    },
    listeLesen: {
      titel: 'Read list',
      beschreibung:
        'One of the lists of el.esy.CAD as a table (columns, rows, total) – the same data as ' +
        'the plan insert and the Excel export. The cable list contains the cable lengths. The ' +
        'circuit schedule and the actuator channel list apply per distribution board. Values ' +
        'of art: stueckliste = bill of materials, leitungsliste = cable list, trunkliste = trunk ' +
        'list, raumliste = room list, switchports = switch ports, patchfelder = patch panels, ' +
        'steuerungslogik = control logic, betriebsmittelliste = equipment list, potentialliste ' +
        '= potential list, stromkreisverzeichnis = circuit schedule, aktorkanalliste = actuator ' +
        'channel list.',
      umfang: '"projekt" = whole drawing (default) or "blatt" = only one sheet.',
      verteiler: 'Location designation of the distribution board without "+", e.g. "UV1".',
    },
    verteilerbaumLesen: {
      titel: 'Read distribution tree',
      beschreibung:
        'The board layout of a distribution board as a tree along the current path (upstream ' +
        'fuse → RCD → circuit breaker (LS) → channel → terminal): per node the reference ' +
        'designation, type, name, phase and depth. Without arguments, the distribution boards ' +
        'of the drawing to choose from.',
      verteiler:
        'Location designation without "+", e.g. "UV1". If omitted: list of the distribution boards.',
    },
    pruefen: {
      titel: 'Check drawing',
      beschreibung:
        'Looks for anomalies: cables with a free end, components without a catalogue entry, ' +
        'invalid rooms, duplicate terminal numbers, cables whose installation method (AP/UP, ' +
        'i.e. SM/FM) does not match the connected component, and components up to 30 cm beside ' +
        'a room that therefore belong to no room (usually ended up in the wall). In a ' +
        'schematic additionally: wires with a free end, nets with two different potentials, ' +
        'duplicate device reference designations and components outside the reference grid ' +
        'A–H/1–6.',
      blattId: 'Only this sheet. If omitted: all sheets.',
    },
    bildschirmfoto: {
      titel: 'Screenshot',
      beschreibung:
        'An image (PNG) of a sheet, rendered as in the printout – without area the whole ' +
        'content of the sheet, with area only that section. For checking position and ' +
        'arrangement.',
      maxKantePx: 'Longer image edge in pixels (default 1568).',
    },
    eigenschaftenSetzen: {
      titel: 'Set properties',
      beschreibung:
        'Sets properties on one or many objects at once, by the same means as the properties ' +
        'panel. Each field only applies to the object types it fits (component: beschriftung ' +
        '(label), installationshoeheM (mounting height), montageort (mounting location: ' +
        'wand/decke/boden = wall/ceiling/floor), verlegung (installation method AP/UP, which ' +
        'also affects how connected cables are routed), stromkreis (circuit), stromkreisPolzahl ' +
        '(number of poles of the circuit), knx, variableTexte (variable texts), kennzeichen ' +
        '(reference designation); cable: kabeltyp (cable type), beschreibung (description); ' +
        'trunk: name, beschreibung; room: name, raumart).',
      beschriftung: 'Empty deletes the label.',
      installationshoeheM: 'Mounting height in metres; null = default.',
      verlegung:
        '"AP" = surface-mounted, "UP" = flush-mounted – applies to the whole combination on the wall.',
      stromkreis:
        'vorgabe (default), kein (none), raum (room circuit), eigen (own circuit) or the number ' +
        'within the room.',
      stromkreisPolzahl: 'Number of poles of an own circuit; null = default.',
      variableTexte:
        'Field name -> value of the variable texts, e.g. {"Wippen": "2"} (Wippen = rockers).',
      kennzeichen: 'Equipment reference designation, only for exactly one component.',
      kabeltyp: 'Name of a cable type, e.g. "NYM-J 3x1,5"; unknown = free text.',
      raumart:
        'Room type (kueche, bad, wc, kind, schlafen, arbeiten, wohnen, essen, hauswirtschaft, ' +
        'hobby, flur, freisitz, abstell, keller, sonstige). Without name, the room takes the ' +
        'name of the room type as long as it still has a default name.',
      mindestensEinFeld: 'Specify at least one field.',
    },
    objekteLoeschen: {
      titel: 'Delete objects',
      beschreibung:
        'Deletes objects like the Del key: docked cables and references are cleaned up as ' +
        'well; the response lists everything that was deleted along with them.',
    },
    objekteVerschieben: {
      titel: 'Move objects',
      beschreibung:
        'Moves objects by an offset in metres, or exactly one component to a point (metres ' +
        'from the origin). Connected cables and trunks are rerouted.',
      dx: 'Offset to the right in metres.',
      dy: 'Offset upwards in metres.',
      nach: 'Target point for exactly one component, metres from the origin.',
    },
    objekteDrehen: {
      titel: 'Rotate components',
      beschreibung:
        'Rotates components, each about its snap point; positive = anticlockwise. Connected ' +
        'cables are rerouted.',
    },
    komponenteAustauschen: {
      titel: 'Replace component',
      beschreibung:
        'Replaces components with another entry of the same catalogue, or only the variant ' +
        '(same katalogId, different varianteId). Position, label, reference designation and ' +
        'terminals are kept; a component whose connections would find no terminal on the new ' +
        'entry is not replaced.',
      katalogId: 'Id of the catalogue entry from katalog_suchen.',
      varianteId: 'If omitted: the variant with the lowest article number.',
    },
    blattAnlegen: {
      titel: 'Create sheet',
      beschreibung:
        'Creates an empty sheet – after the given one or at the end. The user’s view does not ' +
        'change; the user sets up the print area themselves.',
      nachBlattId: 'The new sheet is inserted after this one.',
    },
    komponenteSetzen: {
      titel: 'Place components',
      beschreibung:
        'Places new components from the catalogue (up to 200 per call). Position per ' +
        'component, exactly one of: punkt (point, metres from the origin; the snap point of the ' +
        'symbol goes there, usually the first terminal, as when clicking), raumMitte (room id; ' +
        'centre of the symbol at the centre of the room, for ceiling components) or wand (wall ' +
        'id from blatt_lesen (read sheet), distance from the first wall point in m, plus raumId or seite ' +
        '(side) – the app places it in a row by height and combination, like snapping to a ' +
        'wall). In a schematic additionally netzfeld (grid square, "C3": centre of the symbol ' +
        'at the centre of the square); there the snap point always snaps to the 0.24 m grid so ' +
        'that contacts line up. The app assigns reference designations and terminal numbers.',
      katalogId: 'Id from katalog_suchen (catalogue search).',
      varianteId: 'If omitted: lowest article number.',
      blattId: 'Only for punkt and netzfeld (grid square); otherwise taken from the room or wall.',
      netzfeld: 'Schematic only: grid square of the reference grid A–H/1–6, e.g. "C3".',
      raumMitte: 'Room id from raeume_lesen.',
      abstandM: 'From the first point of the wall, in m.',
      raumId: 'Room on whose side the component sits.',
      seite:
        'Without raumId (room): links/rechts = left/right of the wall direction (first -> second point).',
      hoeheM: 'Mounting height; if omitted, the standard height of the device type.',
      drehungGrad: 'Only for punkt, raumMitte (room centre) and netzfeld (grid square).',
    },
    leitungVerlegen: {
      titel: 'Route cables',
      beschreibung:
        'Routes new cables (up to 100 per call) by auto-routing. Ends (von = from, nach = to), ' +
        'each exactly one kind: komponente (component: object id, optionally connection point ' +
        'index; at a distribution board optionally anschluesse = terminals on F/X/K), punkt ' +
        '(free end), schacht (cable riser id, optionally strang = riser line; without riser ' +
        'line a new one), switchport (switch/patch panel on a trunk chain, optionally port; ' +
        'without port the first free one) or verteiler (distribution board on a trunk chain). ' +
        'switchport, verteiler and a riser on the chain require trunks and are only allowed as ' +
        '"nach" – the cable then ends in the bundle. trunks: entry into the first trunk near ' +
        '"von", exit from the last one near "nach". verknuepfen: afterwards creates a control ' +
        'assignment, a copied control assignment (two switches) or a device group, as the ' +
        'dialog suggests.',
      blattId: 'If omitted: the sheet of the ends, or the active one.',
      austrittTrunkId: 'Last trunk of the chain; if omitted, the same as the entry trunk.',
      verknuepfen: 'Create a control assignment/copied control assignment/group between the ends.',
    },
    leitungenNeuVerlegen: {
      titel: 'Reroute cables',
      beschreibung:
        'Reroutes cables of a sheet – all automatically routed ones or only the ones given.',
      leitungIds: 'If omitted: all of the sheet.',
    },
    trunkAnlegen: {
      titel: 'Create trunk',
      beschreibung:
        'Creates a trunk (cable bundle) from waypoints (metres from the origin). Each end ' +
        'optionally connected: komponente (trunk connection point of the component; the end ' +
        'jumps there), trunk (merged at its end or docked onto its path) or schacht (riser line ' +
        'of a cable riser; without strang = riser line a new one).',
    },
    wandZeichnen: {
      titel: 'Draw wall',
      beschreibung:
        'Draws a wall run (punkte = points on the wall axis, metres from the origin; ' +
        'geschlossen = closed connects the last point to the first) or a rectangle wall ' +
        '(rechteck: two corners of the outer dimensions). Thickness, if omitted, as currently set.',
    },
    raumAnlegen: {
      titel: 'Create room',
      beschreibung:
        'Creates a room at the location enclosed by walls (like a click with the room tool).',
      punkt: 'A point inside the room, metres from the origin.',
      raumart:
        'Room type (kueche, bad, wc, kind, schlafen, arbeiten, wohnen, essen, hauswirtschaft, ' +
        'hobby, flur, freisitz, abstell, keller, sonstige). Without name, the room is named after it.',
    },
    oeffnungSetzen: {
      titel: 'Place door or window',
      beschreibung:
        'Places a door or a window (art "tuer" = door, "fenster" = window) in a wall: wall id, ' +
        'distance of the centre of the opening from the first wall point in m. Dimensions, if ' +
        'omitted, as in the building element defaults.',
      bruestungM: 'Window only (sill height).',
      gespiegelt: 'Door only: hinged on the other side.',
      schwenkInnen: 'Door only: opens towards the other side of the wall.',
    },
    potentialSetzen: {
      titel: 'Place potentials',
      beschreibung:
        'Places potentials in the schematic (L1, N, PE or any name; potentials with the same ' +
        'name count as connected throughout the project) – each with exactly one position: ' +
        'punkt or netzfeld (grid square). The point snaps to the grid.',
      netzfeld: 'e.g. "A1"',
    },
    schaltverbindungZiehen: {
      titel: 'Draw wires',
      beschreibung:
        'Draws wires in the schematic (up to 100 per call). Ends (von/nach), each exactly one ' +
        'kind: kontakt (contact: component and terminal), potential, knoten (junction), ' +
        'verbindung (branch) or punkt (free). Single-line: one core, with polzahl (number of ' +
        'poles) as a multi-pole combined representation. Multi-line: adern 2–5 cores run in ' +
        'parallel at the pole spacing, as when drawing by hand; further cores dock where their ' +
        'end lies on a contact, at a branch they form a staircase. Without wegpunkte ' +
        '(waypoints) the app routes horizontally/vertically around the symbols; all single-line ' +
        'wires of one call together, without overlapping.',
      polzahl: 'Single-line multi-pole; includes the neighbouring contacts.',
      adern: 'Multi-line.',
      seiteUmgekehrt: 'Multi-line: further cores on the other side.',
      bezeichnung: 'Single-line only; e.g. "L1".',
      wegpunkte: 'Own vertices; the app routes the last section to the target.',
    },
    automatischAnordnen: {
      titel: 'Arrange automatically',
      beschreibung:
        'Arranges components of a sheet automatically in tiers from top to bottom and reroutes ' +
        'their connections together (best variant, the user’s saved settings). In a floor plan ' +
        'the components leave their installation location in the process.',
    },
    bestueckungVorschlagen: {
      titel: 'Suggest board layout from rooms',
      beschreibung:
        'Suggests the board layout of a distribution board from the property "Stromkreis" ' +
        '(circuit) of the components in the selected rooms (one RCD per sheet, one circuit ' +
        'breaker (LS) with terminal per circuit, KNX targets with their own terminal) and ' +
        'applies it. Not possible if a distribution board diagram is already linked. A ' +
        'proposal: pass the check notice of the response (pruefhinweis) on to the user.',
      raumId: 'If omitted: "without room" of this sheet.',
      raeume: 'If omitted: the rooms selected last, or all not yet supplied.',
      knx: 'Assign KNX actuators right away; default yes.',
      verwaisteBehalten: 'Keep nodes whose room is no longer selected; default no.',
    },
    bestueckungAendern: {
      titel: 'Change board layout',
      beschreibung:
        'Edits the distribution tree like the distribution board dialog, steps in order (up to ' +
        '50). Nodes are named as in verteilerbaum_lesen ("F3", "X1:4", "K1:A3"). Each step ' +
        'exactly one kind: betriebsmittel (equipment: catalogue entry after a node), stromkreise ' +
        '(circuits: number of circuit breakers (LS) with terminal), umhaengen (move; art kind = ' +
        'as child, davor = before, dahinter = after), umbenennen (rename device or terminal ' +
        'number), entfernen (remove), aendern (change phase, type, label). With a linked ' +
        'distribution board diagram only what is not in it.',
      hinter: 'Node; if omitted, at the supply.',
      schutzKatalogId: 'If omitted: the circuit breaker (LS) chosen last.',
      klemmeKatalogId: 'null = without terminal; if omitted, the one chosen last.',
      ziel: 'Node; null only with "kind" = the supply.',
      neu: 'Reference designation ("F12"), or at a terminal "X2", "X1:7".',
      typ: 'Variable text "Typ" (type), e.g. "B16".',
    },
    knxAktorenZuordnen: {
      titel: 'Assign KNX actuators',
      beschreibung:
        'Assigns an actuator channel (suggested channel type, reserve) to every terminal whose ' +
        'consumer is switched by a KNX device via a control assignment, creates missing ' +
        'actuators and releases channels without a KNX target – like the dialog with all ' +
        'suggestions. A proposal: pass the check notice of the response (pruefhinweis) on to ' +
        'the user.',
      reserveProzent: 'If omitted: the saved one.',
      freigeben: 'Release channels without a KNX target; default yes.',
    },
    klemmenleisteNummerieren: {
      titel: 'Number terminal strip',
      beschreibung:
        'Renumbers a terminal strip consecutively from 1 – in a schematic the placed terminals ' +
        'on all sheets, in a floor plan in the board layout of the distribution board ' +
        '(verteilerId required; cable assignments follow).',
      leiste: 'e.g. "X1"; if omitted, the one chosen last.',
      verteilerId: 'Floor plan only.',
    },
    verteilerplanErzeugen: {
      titel: 'Generate distribution board diagram',
      beschreibung:
        'Generates a distribution board diagram (schematic) from the distribution tree of a ' +
        'distribution board in the open floor plan as a new document in the project, linked via ' +
        'the location designation. The open document stays open; the user is asked whether to ' +
        'open the diagram. An existing diagram of the same distribution board is not ' +
        'overwritten. Cannot be undone. A proposal: pass the check notice of the response ' +
        '(pruefhinweis) on to the user.',
      name: 'If omitted: the usual suggestion.',
    },
    rueckgaengig: {
      titel: 'Undo',
      beschreibung:
        'Undoes the most recent changes made by the AI and stops at the first step the user ' +
        'made themselves – their work always stays.',
      anzahl: 'Default 1.',
    },
  },
  protokoll: {
    anleitung:
      'el.esy.CAD is a CAD tool for electrical and network planning. The tools work on the ' +
      'document currently open in el.esy.CAD. Call dokument_uebersicht first. Lengths in ' +
      'metres, coordinates in metres from the origin of the sheet, y points upwards. Objects ' +
      'are addressed by their id from blatt_lesen. Each call of a modifying tool is one undo ' +
      'step; rueckgaengig only undoes your own steps. Before changing anything, check what is ' +
      'affected and tell the user the result. A floor plan is a building layout with ' +
      'components, cables and trunks; a schematic (distribution board diagram) shows equipment ' +
      'with wires in the reference grid A–H/1–6. The board layout of a distribution board ' +
      'lives in the floor plan; the distribution board diagram is generated from it with ' +
      'verteilerplan_erzeugen. Call pruefen after drawing. Tool and parameter names are ' +
      'German and stay as they are.',
    ohneName: 'tools/call requires a name.',
    unbekanntesWerkzeug: 'Unknown tool: {name}',
    nurLesen: '“AI may only read” is switched on in el.esy.CAD – this tool changes the drawing.',
    ungueltigeEingabe: 'Invalid input for {werkzeug} – {gruende}',
    eingabe: 'input',
    keinJsonRpc: 'Not a JSON-RPC 2.0 message.',
    unbekannteMethode: 'Unknown method: {methode}',
    unerwartet: 'Unexpected error',
  },
  bruecke: {
    keineApp:
      'el.esy.CAD is not open or the AI interface is not connected there yet. Please start ' +
      'el.esy.CAD and open a document.',
    getrennt: 'The connection to el.esy.CAD was interrupted during the call.',
    zeitlimit: 'el.esy.CAD did not respond within {sekunden} s.',
    kiAssistent: 'AI assistant',
  },
  routen: {
    fremderUrsprung: 'Access from this page is not allowed.',
    ausgeschaltet: 'The AI interface is switched off in el.esy.CAD (Settings › AI assistant).',
    tokenFalsch:
      'Access token missing or wrong. el.esy.CAD shows the current command under ' +
      'Settings › AI assistant.',
    keinJson: 'Not valid JSON.',
  },
  stdio: {
    keinJson: 'Not valid JSON.',
    laeuftNicht: 'el.esy.CAD is not running – please start the app.',
    antwortStatus: 'el.esy.CAD responded with {status}.',
    tokenFehlt: '{variable} is not set – el.esy.CAD will reject every call.',
  },
}
