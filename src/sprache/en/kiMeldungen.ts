import type { Texte } from '../texte'

export const kiMeldungen: Texte['kiMeldungen'] = {
  gemeinsam: {
    blattNurAnsicht: 'Sheet “{blatt}”: {grund}',
    blattUnbekannt: 'Unknown sheet "{blattId}".',
    ebeneGesperrt: 'layer locked',
    ausgemustert: '“{name}” has been retired.',
    keinKatalogeintrag: 'No catalogue entry "{id}".',
    keineWand: 'No wall with the ID "{id}".',
    wandOhneLaenge: 'The wall has no length.',
    schaltplanOhneWaende: 'A schematic has no walls.',
    keineKomponenteAuf: 'No component "{id}" on “{blatt}”.',
    keinKabelschachtAuf: 'No cable riser "{id}" on “{blatt}”.',
    keinTrunkAuf: 'No trunk "{id}" on “{blatt}”.',
    keinRaumAufBlatt: 'No room "{id}" on sheet “{blatt}”.',
    nichtNeuVerlegt: {
      one: '{n} cable could not be rerouted without crossing.',
      other: '{n} cables could not be rerouted without crossing.',
    },
  },
  ausfuehren: {
    werkzeugUnbekannt: 'This version of el.easy.CAD does not know the tool {werkzeug}.',
    eingabeUngueltig: 'Invalid input for {werkzeug}.',
    internerFehler: 'Internal error in el.easy.CAD: {fehler}',
  },
  kontext: {
    blattUnbekannt: 'Unknown sheet "{blattId}". Existing sheets: {liste}.',
  },
  schreiben: {
    labelVorspann: 'AI: ',
    unbekannteIds: {
      one: 'Unknown object ID: {liste}',
      other: 'Unknown object IDs: {liste}',
    },
    alleGesperrt: 'All of the given objects are on locked layers.',
    abgewiesen: 'el.easy.CAD rejected the change (sheet lock).',
    nichtsZuAendern: 'There was nothing to change.',
  },
  rueckgaengig: {
    nichtsMehr: 'There is nothing left to undo.',
    vomAnwender: 'The next step was made by the user (“{label}”) and stays.',
    nichtsZurueckgenommen: 'Nothing undone.',
    meldung: 'Undo: {schritte}',
  },
  objektLesen: {
    keinObjekt: 'No object with the ID "{id}".',
    hinweis:
      'Coordinates in the object are model coordinates; relative to the origin = model − origin.',
  },
  objektKurzform: {
    unbekannterKatalog: 'unknown ({id})',
  },
  verteilerbaumLesen: {
    verteilerFehlt: 'No distribution board +{kennzeichen} found.',
    keinVerteiler: 'This drawing has no distribution board.',
  },
  bildschirmfoto: {
    blatt: 'Sheet “{name}” ({id}).',
    ausschnitt: 'Sheet “{name}” ({id}), detail x {xMin}…{xMax} m, y {yMin}…{yMax} m.',
  },
  verteilerHilfen: {
    imBauplan:
      'The board layout is edited in the floor plan that contains the distribution board – please open the floor plan.',
    keinVerteiler:
      'No distribution board with the ID "{id}" (verteilerbaum_lesen without arguments lists the boards of the distribution tree).',
  },
  eigenschaftenSetzen: {
    felder: {
      beschriftung: 'label',
      installationshoeheM: 'height',
      montageort: 'mounting location',
      verlegung: 'SM/FM',
      stromkreis: 'circuit',
      stromkreisPolzahl: 'number of poles',
      knx: 'KNX',
      variableTexte: 'variable texts',
      kennzeichen: 'reference designation',
      kabeltyp: 'cable type',
      beschreibung: 'description',
      name: 'name',
      raumart: 'room type',
    },
    kennzeichenBelegt: {
      one: '{kennzeichen} is already used by {n} other piece of equipment ({blaetter}).',
      other: '{kennzeichen} is already used by {n} other pieces of equipment ({blaetter}).',
    },
    slotsNichtAngepasst:
      'Slots not adjusted ({feld}): occupied slots would be dropped – please decide in the properties panel.',
    kennzeichenNurEine:
      'kennzeichen (reference designation) applies to exactly one component per call.',
    keinPassendesFeld: 'no matching field for {typ}',
    keinFeldPasst: 'None of the fields ({felder}) matches the given objects.',
    variablerTextFehlt: 'None of the components has the variable text “{feld}”.',
    geaendert: {
      one: 'Changed {felder} on {n} object{blaetter}',
      other: 'Changed {felder} on {n} objects{blaetter}',
    },
  },
  objekteLoeschen: {
    geloescht: {
      one: 'Deleted {n} object{blaetter}',
      other: 'Deleted {n} objects{blaetter}',
    },
    mitgeloescht: {
      one: '{text}, {n} more deleted with it',
      other: '{text}, {n} more deleted with them',
    },
  },
  objekteVerschieben: {
    versatzOderZiel: 'Specify either dx/dy (offset) or nach (target point).',
    nachNurEine: 'nach applies to exactly one component only; otherwise specify dx/dy.',
    versatzNull: 'The offset is 0.',
    verschoben: {
      one: 'Moved {n} object by {dx} / {dy} m{blaetter}',
      other: 'Moved {n} objects by {dx} / {dy} m{blaetter}',
    },
  },
  objekteDrehen: {
    nurKomponenten: 'Only components can be rotated.',
    winkelNull: 'The angle is 0°.',
    gedreht: {
      one: 'Rotated {n} component by {winkel}°{blaetter}',
      other: 'Rotated {n} components by {winkel}°{blaetter}',
    },
  },
  komponenteAustauschen: {
    gruende: {
      anschluesse: 'connected cables would find no terminal on the new entry',
      ports: 'the new entry has fewer ports than are in use',
      modul: 'module carriers and modules of a different system cannot be replaced',
    },
    keinKatalogeintrag: 'No catalogue entry with the ID "{id}".',
    keineVariante: '“{name}” has no variant "{variante}" (available: {liste}).',
    keineVarianten: '“{name}” has no variant "{variante}" (available: none).',
    keineKomponente: 'not a component',
    knxAktor: 'KNX actuator – change the channels in the properties panel',
    andererKatalog: 'different catalogue',
    nichtsGetauscht: 'No component replaced: {gruende}.',
    nichtsPassend: 'No component replaced: nothing suitable.',
    getauscht: {
      one: 'Replaced {n} component with “{name}”{blaetter}',
      other: 'Replaced {n} components with “{name}”{blaetter}',
    },
  },
  blattAnlegen: {
    nameLeer: 'The name of the sheet is empty.',
    angelegt: 'Created sheet “{name}”',
    zeichenflaecheVonHand:
      'The user sets up the print area, just as when creating a sheet by hand.',
  },
  komponenteSetzen: {
    platzierung: 'Placement {nr}: {text}',
    wandZuKurz: 'The wall is only {laenge} m long (distance {abstand} m).',
    raumNichtAnWand: 'Room “{raum}” does not border the wall at this point.',
    raumOderSeite: 'At the wall, specify raumId (room) or seite (side).',
    netzfeldNurSchaltplan: 'Grid squares only exist in a schematic.',
    keineZeichenflaeche: 'Sheet “{blatt}” has no print area.',
    keinNetzfeld: '“{name}” is not a grid square of the A–H/1–6 reference grid.',
    eineLage:
      'Specify exactly one location: punkt (point), netzfeld (grid square), raumMitte (room centre) or wand (wall).',
    knxAktorVonHand: 'The user inserts KNX actuators with “Insert KNX actuator”.',
    keineVariante: '“{name}” has no variant "{variante}".',
    keinRaum: 'No room with the ID "{id}".',
    keineFreieFlaeche:
      'There is no free surface at this point of the wall (door, window or penetration?).',
    gesetzt: {
      one: 'Placed {n} component ({namen}){blaetter}',
      other: 'Placed {n} components ({namen}){blaetter}',
    },
  },
  leitungVerlegen: {
    leitung: 'Cable {nr}: {text}',
    eineArt:
      'An end needs exactly one kind: komponente (component), punkt (point), schacht (cable riser), switchport or verteiler (distribution board).',
    keinDockpunkt: 'The component has no connection point {nr}.',
    nurFuerTrunks: 'Connection point {nr} is for trunks only.',
    keinDockpunktFuerLeitungen: 'The component has no connection point for cables.',
    anschluesseNurVerteiler: 'anschluesse only exist on a distribution board.',
    vonNur: '"von" can only be komponente (component), punkt or schacht.',
    endeNur: 'This end can only be komponente (component), punkt or schacht.',
    geraetNichtAnKette: 'The device is not attached to this trunk chain.',
    keinPort: 'The device has no port {nr}.',
    portBelegt: 'Port {port} is already in use.',
    keinPortFrei: 'The device has no free port left.',
    verteilerNichtAnKette: 'The distribution board is not attached to this trunk chain.',
    keinWeg: 'No collision-free path found.',
    nurUeberTrunks: 'switchport and verteiler (distribution board) as an end only work via trunks.',
    einUndAustritt: 'Entry and exit in the trunk coincide.',
    nichtVerbunden: 'The two trunks are not connected to each other.',
    verknuepfung: {
      wirkverbindung: 'control assignment',
      abgleich: 'matching of two switches',
      gruppe: 'device group',
    },
    moeglich: '{art} (verknuepfen: true)',
    ende: {
      dock: 'component {id} · connection point {nr}',
      frei: 'free end',
      schacht: 'cable riser {id} · riser line {nr}',
      switchport: 'device {id} · port index {nr}',
      verteiler: 'distribution board {id}',
    },
    verlegt: {
      one: 'Routed {n} cable{blaetter}',
      other: 'Routed {n} cables{blaetter}',
    },
  },
  trunkAnlegen: {
    eineArt: 'A trunk end needs exactly one kind: komponente (component), trunk or schacht.',
    keinTrunkDockpunkt: 'The component has no trunk connection point.',
    endeVerloren: 'The trunk end can no longer be found after connecting.',
    trunkWeg: 'Trunk "{id}" is no longer on “{blatt}”.',
    angelegt: 'Created trunk “{name}” ({blatt})',
    verschmolzen: 'Merged into “{name}”.',
  },
  wandZeichnen: {
    punkteOderRechteck: 'Specify either punkte (points) or rechteck (rectangle).',
    rechteckZuKlein: 'The rectangle is too small for this wall thickness.',
    gezeichnet: 'Drew wall, {staerke} cm ({blatt})',
  },
  raumAnlegen: {
    nichtUmschlossen: 'No room can be created here – the area is not completely enclosed by walls.',
    schonVorhanden: 'Room “{name}” already exists here ({id}).',
    angelegt: 'Created room “{name}”, {flaeche} m² ({blatt})',
  },
  oeffnungSetzen: {
    passtNicht: 'The opening does not fit into the wall (length {laenge} m).',
    tuerEingesetzt: 'Inserted door {breite} cm ({blatt})',
    fensterEingesetzt: 'Inserted window {breite} cm ({blatt})',
  },
  leitungenNeuVerlegen: {
    keine: 'No automatically routed cable found to reroute.',
    neuVerlegt: {
      one: 'Rerouted {n} cable ({blatt})',
      other: 'Rerouted {n} cables ({blatt})',
    },
    ohneWeg: {
      one: '{n} cable without a collision-free path.',
      other: '{n} cables without a collision-free path.',
    },
  },
  potentialSetzen: {
    nurSchaltplan: 'Potentials only exist in a schematic.',
    nameFehlt: 'Potential {nr}: The name is missing.',
    eineLage: 'Potential {nr}: Specify exactly one location: punkt or netzfeld (grid square).',
    gesetzt: {
      one: 'Placed {n} potential ({namen}){blaetter}',
      other: 'Placed {n} potentials ({namen}){blaetter}',
    },
  },
  schaltverbindungZiehen: {
    verbindung: 'Wire {nr}: {text}',
    keinObjektAufBlatt: 'No object "{id}" on sheet “{blatt}”.',
    nurAnschluesse: {
      one: 'The component has only {n} terminal (index {index}).',
      other: 'The component has only {n} terminals (index {index}).',
    },
    keinAnschluss: 'No terminal “{anschluss}” – available: {liste}.',
    unbezeichnet: 'The terminals of this component are not designated – specify index 0–{max}.',
    eineArt:
      'Exactly one kind per end: kontakt (contact), potential, knoten (junction), verbindung (wire) or punkt (point).',
    keinBauteil: '"{id}" is not a component.',
    keinPotential: '"{id}" is not a potential.',
    keinKnotenpunkt: '"{id}" is not a junction.',
    keineSchaltverbindung: '"{id}" is not a wire.',
    nurSchaltplan: 'Wires only exist in a schematic.',
    polzahlOderAdern:
      'polzahl (number of poles, single-line) and adern (cores, multi-line) are mutually exclusive.',
    mehrlinigBezeichnung: 'In a multi-line wire the cores get their names themselves (L1/N/PE …).',
    zweiAbzweige: 'Two branches without a position – specify punkt at one end.',
    keinWeg: 'No free path found between the ends.',
    gezogen: {
      one: 'Drew {n} wire{blaetter}',
      other: 'Drew {n} wires{blaetter}',
    },
    gezogenMitAdern: {
      one: 'Drew {n} wire ({adern} cores){blaetter}',
      other: 'Drew {n} wires ({adern} cores){blaetter}',
    },
    gemeinsamNichtFrei: {
      one: '{n} wire could not be routed clear when routing together and keeps its first path.',
      other: '{n} wires could not be routed clear when routing together and keep their first path.',
    },
  },
  automatischAnordnen: {
    einBlatt: 'Arranging only works with objects of one sheet.',
    zuWenig: 'To arrange, specify at least two components or one connection.',
    angeordnet: {
      one: 'Arranged {n} component{blaetter}',
      other: 'Arranged {n} components{blaetter}',
    },
    neuVerlegt: {
      one: 'Rerouted {n} connection{blaetter}',
      other: 'Rerouted {n} connections{blaetter}',
    },
    nichtFrei: {
      one: '{n} connection could not be routed clear.',
      other: '{n} connections could not be routed clear.',
    },
    ueberdeckungen: {
      one: '{n} overlap with other objects.',
      other: '{n} overlaps with other objects.',
    },
    passtNicht: 'The arrangement does not fit completely on the print area.',
    einbauortVerlassen: 'The components have left their installation position in the floor plan.',
  },
  bestueckungVorschlagen: {
    keineRaeume: 'No rooms with a circuit to choose from.',
    keinStromkreis: 'No component in the selected rooms has a circuit (property “Circuit”).',
    vorgeschlagen: 'Proposed board layout of {verteiler} from rooms',
    planNeuErzeugen:
      'The linked distribution board diagram “{name}” only shows the new board layout once the user recreates it in the distribution board dialog.',
  },
  bestueckungAendern: {
    schritt: 'Step {nr}: {text}',
    eineArt:
      'Specify exactly one kind: betriebsmittel (equipment), stromkreise (circuits), umhaengen (move), umbenennen (rename), entfernen (remove) or aendern (change).',
    keinKnoten: 'No node “{name}” in the tree. Available: {liste}',
    neueAusDemPlan:
      'With a linked distribution board diagram, new equipment comes from the diagram.',
    mehrphasig:
      '“{name}” is multi-phase, but the distribution board has a single-phase supply – only 1- and 2-pole devices fit there.',
    knxAktoren: 'KNX actuators are created by knx_aktoren_zuordnen, together with their channels.',
    keinBetriebsmittel: '“{name}” is not equipment.',
    keinLeitungsschutzschalter: '“{name}” is not a circuit breaker.',
    keineKlemme: '“{name}” is not a terminal.',
    ohneZiel: 'Without a target only "kind" (to the supply).',
    hinterSichSelbst: 'A node cannot be placed behind itself.',
    nichtEinhaengbar: '{knoten} cannot be attached there.',
    kanalUmbenennen: '{knoten} is a channel – only the device can be renamed.',
    imPlanAendern: '{knoten} is in the distribution board diagram and is changed there.',
    keineLeistenklemme: '{knoten} is not a terminal of the terminal strip.',
    kennzeichenVergeben: '“{kennzeichen}” is empty or already in use in this distribution board.',
    imPlanEntfernen: '{knoten} is in the distribution board diagram and is removed there.',
    keinePhase: '{knoten} has no selectable phase.',
    keinTyp: '{knoten} has no changeable type.',
    nichtsAngegeben: 'Nothing to change specified.',
    erledigt: {
      betriebsmittel: '{n}× {name}',
      stromkreise: {
        one: '{n} circuit',
        other: '{n} circuits',
      },
      umgehaengt: '{knoten} moved',
      entfernt: '{knoten} removed',
      entferntMitAllem: '{knoten} removed (with everything behind it)',
      geaendert: '{knoten} changed',
    },
    label: 'Changed board layout of {verteiler} ({liste})',
  },
  knxAktorenZuordnen: {
    keineKlemme:
      'No terminal of this distribution board supplies a target of a KNX device (control assignments missing?).',
    alleZugeordnet: 'All KNX targets already have their channel.',
    zugeordnet: 'Assigned KNX actuators in {verteiler}',
  },
  klemmenleisteNummerieren: {
    keineLeiste: 'No terminal strip specified.',
    schaltplanOhneVerteiler:
      'In a schematic the terminal strip applies to all sheets – omit verteilerId (distribution board).',
    lueckenlos: '-{leiste} is already numbered without gaps.',
    nummeriert: 'Renumbered terminal strip -{leiste}',
    bauplanMitVerteiler:
      'In a floor plan the terminal strip is in the distribution board – specify verteilerId.',
    lueckenlosIn: '-{leiste} in {verteiler} is already numbered without gaps.',
    nummeriertIn: 'Renumbered terminal strip -{leiste} in {verteiler}',
  },
  verteilerplanErzeugen: {
    keinKennzeichen: 'The distribution board has no location designation.',
    schonVorhanden:
      'The distribution board diagram “{name}” already exists for {verteiler} – it will not be overwritten.',
    ohneProjekt: 'Without a project, no distribution board diagram can be created.',
    klemmenUeberfuehrt: 'Moved terminals of {verteiler} into the terminal strip -{leiste}',
    rueckgaengigMoeglich: '{schritt} (can be undone).',
    knxOffen: {
      one: '{n} KNX target without an actuator channel – running knx_aktoren_zuordnen first would have shown it in the diagram.',
      other:
        '{n} KNX targets without an actuator channel – running knx_aktoren_zuordnen first would have shown them in the diagram.',
    },
    angelegt: 'Created distribution board diagram “{name}”',
    neuesDokument:
      'The diagram is a new document in the project; the user decides whether to open it.',
  },
  pruefen: {
    leitungZweiFreieEnden: 'Cable {nummer} has two free ends.',
    leitungFreiesEnde: 'Cable {nummer} has a free end ({ende}).',
    ohneKatalog: 'Component without a catalogue entry ({id}).',
    komponente: 'Component',
    knappOhneRaum:
      '{name} is {cm} cm outside room “{raum}” and therefore belongs to no room ' +
      '(room circuit, name from the room, lists).',
    raumUngueltig: 'Room “{name}” is no longer enclosed by walls.',
    klemmeDoppelt: 'Terminal number {klemme} is used {n} times.',
    verlegeartAnfang: 'Cable {nummer} is {leitung} at its start, the component {komponente}.',
    verlegeartEnde: 'Cable {nummer} is {leitung} at its end, the component {komponente}.',
    unterPutz: 'flush-mounted',
    aufPutz: 'surface-mounted',
    verbindungZweiFreieEnden: 'Wire has two free ends.',
    verbindungFreiesEnde: 'Wire has a free end ({ende}).',
    benannteZweiFreieEnden: 'Wire “{name}” has two free ends.',
    benanntesFreiesEnde: 'Wire “{name}” has a free end ({ende}).',
    potentialeVerbunden: 'Different potentials are connected here: {namen}.',
    ausserhalbNetz: 'Component is outside the reference grid and has no location.',
    ausserhalbNetzMitKennzeichen:
      '-{kennzeichen} is outside the reference grid and has no location.',
    kennzeichenDoppelt: 'Reference designation -{kennzeichen} is used by {n} pieces of equipment.',
  },
}
