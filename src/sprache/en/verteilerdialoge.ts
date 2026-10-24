import type { Texte } from '../texte'

export const verteilerdialoge: Texte['verteilerdialoge'] = {
  allgemein: {
    abbrechen: 'Cancel',
    schliessen: 'Close',
    uebernehmen: 'Apply',
    keineAngabe: 'Not specified',
    bitteWaehlen: 'Please choose ...',
    slotNummer: 'Slot {nummer}',
  },
  gruppeBilden: {
    bilden: 'Create group',
    name: 'Group name',
    nameBeispiel: 'e.g. Hallway lighting',
    ansteuerung: 'Control',
    knxGanzeGruppe: 'KNX (whole group)',
  },
  kabeltyp: {
    titel: 'Change cable type',
    feld: 'Cable type',
    kabelNummer: 'Cable no. {nummer}',
    fuerAlleKnopf: 'Apply to all…',
    fuerAlleTitel: 'Apply cable type to all cables',
    fuerAlleNachricht:
      'Changes the cable type of every cable in this drawing – across all sheets. ' +
      'This can affect a great many cables (undo with Ctrl+Z).',
    fuerAlleBestaetigen: 'Apply to all',
  },
  slotWahl: {
    titel: 'Choose slot',
  },
  trunkVerbinden: {
    titel: 'Connect to another trunk',
    zielBlatt: 'Target sheet',
    zielTrunk: 'Target trunk',
    keineTrunks: 'No trunks available on this sheet (apart from the source trunk).',
    zielEnde: 'Target end',
    ende: '{name} end {ende}',
    endeBelegt: '{name} end {ende} (already connected)',
    verbinden: 'Connect',
  },
  schachtVerbund: {
    steigschacht: 'Shaft',
    neu: 'New shaft',
    name: 'Name',
    geschosshoehe: 'Storey height above (m)',
    geschosshoeheHinweis:
      'Distance to the next cable riser of this shaft on a higher sheet – counts towards the ' +
      'length of cables running through. Irrelevant at the topmost cable riser.',
  },
  schachtAnschluss: {
    titel: 'Connection in cable riser “{name}”',
    trunkAn: 'Connect trunk to',
    leitungAn: 'Connect cable to',
    neuerStrang: 'New riser line S{nummer}',
    strangName: 'Name of riser line S{nummer} (optional)',
    strangNameBeispiel: 'e.g. Riser flat 3',
    oderTrunk: 'or run straight into a trunk attached here',
    inTrunk: 'Run into “{name}”',
    trunkOhneZiel: 'not attached to anything – no switch, patch panel or further cable riser yet',
    nochLeer:
      'Nothing of this kind rises in this shaft yet – the connection creates the first riser ' +
      'line.',
    anschliessen: 'Connect',
    zielSwitches: { one: '{n} switch/patch panel', other: '{n} switches/patch panels' },
    zielSchaechte: { one: '{n} further cable riser', other: '{n} further cable risers' },
    erreicht: 'reaches {ziele}',
    hinweisGleichesBlatt:
      'An end on this sheet is already attached to this riser line – on a single storey, ' +
      'merging or a branch is usually the right choice.',
    belegt: 'occupied – a cable connects exactly two storeys',
    schonAngeschlossen: 'this object is already attached here',
  },
  inhalt: {
    titel: 'Contents',
    titelTrunk: 'Contents of “{name}”',
    titelSchacht: 'Contents of cable riser “{name}”',
    objektFehlt: 'The object no longer exists.',
    trunkUmbenennen: 'Rename trunk',
    trunkLeer: 'There is no cable in this trunk chain yet.',
    schachtLeer: 'No cable runs through this penetration yet.',
    nummer: 'No.',
    beschreibung: 'Description',
    vonNach: 'from → to',
    kabeltyp: 'Cable type',
    laenge: 'Length',
    teilstuecke: 'Sections',
    strang: 'Riser line',
    zeigen: 'Show',
    beschreibungVon: 'Description of cable {nummer}',
    beschreibungAendern: 'Change cable description',
    name: 'Name',
    strangImSchacht: 'Riser line S{nummer} ({schacht})',
    strangNummer: 'Riser line S{nummer}',
    teilstueckeListe: 'Sections: {liste}',
    blattListe: 'Sheet: {liste}',
    blassHinweis: 'faded cables do not run through the section you clicked.',
    durchbruch: 'Penetration on “{ort}”. The cable riser name is changed in the properties panel.',
    durchbruchWeiter:
      'Penetration on “{ort}” – continues {weiter}. The cable riser name is changed in the ' +
      'properties panel.',
    querschnitt: 'Cross-section',
  },
  schaltplanZuordnen: {
    titel: 'Assign schematic',
    lesefehler: 'The schematics of the project could not be read.',
    zugeordnetTitel: 'Distribution board diagram assigned',
    zugeordnetNachricht:
      '“{name}” is now the distribution board diagram for {kennzeichen}. Open it now?',
    oeffnen: 'Open',
    fehlgeschlagen: 'Assignment failed.',
    keinKennzeichen: 'The distribution board has no reference designation.',
    erklaerung:
      'The chosen schematic becomes the distribution board diagram for {kennzeichen}. From then ' +
      'on it determines which equipment the distribution board contains; the board layout here ' +
      'is kept, and anything missing from the diagram is shown in grey. The assignment can be ' +
      'removed in the schematic under “Distribution board diagram for”.',
    liestPlaene: 'Reading the schematics of the project …',
    keinePlaene:
      'There is no other schematic in the project – “Create distribution board diagram …” ' +
      'creates one.',
    schaltplan: 'Schematic',
    verteilerplanFuer: 'Distribution board diagram for {kennzeichen}',
    umhaengenWarnung:
      '“{name}” currently belongs to {kennzeichen}; that distribution board will then no longer ' +
      'have a distribution board diagram.',
    laeuft: 'Assigning …',
    umhaengen: 'Reassign',
    zuordnen: 'Assign',
  },
  knxAktor: {
    titel: 'Insert KNX actuator',
    artSchaltJalousie: 'Switching/blind actuator',
    artDimm: 'Dimming actuator',
    baugroesse: 'Size',
    fach: '{n}-fold',
    kennzeichen: 'Reference designation',
    versorgung: 'Show L/N supply',
    kanal: 'Channel',
    funktion: 'Function',
    beschriftung: 'Label',
    ab: 'Down ({funktion})',
    auf: 'Up',
    funktionVon: 'Function {name}',
    beschriftungVon: 'Label {name}',
    einfuegen: 'Insert',
  },
  knxZuordnen: {
    titel: 'Assign KNX actuators',
    titelMit: 'Assign KNX actuators – {kennzeichen}',
    verteilerFehlt: 'The distribution board no longer exists.',
    erklaerung:
      'Terminals whose load is switched by a KNX device via a control assignment. Each terminal ' +
      'gets a channel; a blind pair always starts on an odd channel. Existing channels keep ' +
      'their number.',
    reserve: 'Spare in %',
    keineKlemmen:
      'No terminal of this distribution board supplies a target of a KNX device. Control ' +
      'assignments are created in the floor plan with the “Control assignment” tool.',
    klemme: 'Terminal',
    kanalname: 'Channel name',
    ziele: 'Targets',
    kanal: 'Channel',
    ergebnis: 'Result',
    geraete: 'Devices: {liste}',
    geraet: '-{kennzeichen} {titel} – {belegt} used, {frei} free',
    geraetNeu: '-{kennzeichen} {titel} (new) – {belegt} used, {frei} free',
    freigeben: 'Release channels (no KNX target any more)',
    zuordnen: 'Assign',
    kanalnameFuer: 'Channel name for {name}',
    ohneNamen: 'unnamed',
    vorhanden: 'existing',
    kanalFuer: 'Channel for {name}',
    keinKanal: 'no channel',
  },
  verknuepfen: {
    titel: 'Group and control assignment',
    nichtsAnzulegen: 'There is nothing to create between the two ends of this cable.',
    slotFrei: '{name} (free)',
    slotMitZielen: { one: '{name} · {n} target', other: '{name} · {n} targets' },
    geraetegruppe: 'Device group',
    autoGruppe:
      '{slot} of {quelle} then acts on {mitglieder} – they are put into a common device ' +
      'group, and the slot points to the group.',
    neuerSlot: 'New slot',
    wirkTitel: 'Create control assignment',
    wirkFrage: 'Cable {nummer} connects {quelle} to {ziel}. Which slot should act on {ziel}?',
    perLeitung: 'connected by cable',
    ziel: 'Target',
    zielGruppe: 'Group “{name}”',
    zielNur: 'only {name}',
    slotBezeichnung: 'Slot name (for slots without a name)',
    anlegen: 'Create',
    abgleichTitel: 'Copy control assignment',
    abgleichText:
      'Cable {nummer} connects {von} to {nach} – for example a two-way switching circuit. A ' +
      'slot of {nach} can receive the same targets.',
    slotVon: 'Slot of {name}',
    wirktAuf: 'Acts on: {ziele}',
    uebernimmtAuf: 'copies to slot of {name}',
    beitretenTitel: 'Join device group',
    bildenTitel: 'Create device group',
    beitretenText: 'Cable {nummer}: {name} joins the group “{gruppe}”.',
    bildenText: 'Cable {nummer} connects {a} to {b}. Both are put into a common device group.',
    umgelenkt: {
      one:
        '{n} slot then points to the group instead of a single component – so the other one ' +
        'is switched as well.',
      other:
        '{n} slots then point to the group instead of a single component – so the other one ' +
        'is switched as well.',
    },
    beitreten: 'Join',
  },
  slotMatrix: {
    titel: 'Edit slot matrix',
    entfernenTitel: 'Remove slots?',
    entfernenNachricht: {
      one: 'The matrix shape is reduced – {n} slot with assigned targets will be lost.',
      other: 'The matrix shape is reduced – {n} slots with assigned targets will be lost.',
    },
    verkleinern: 'Reduce',
    kreislauf: 'Not possible: this would create a loop between slots.',
    spaltenStandard: 'Columns (default)',
    einBreit: '1 (wide push-button)',
    zweiSchmal: '2 (narrow push-buttons side by side)',
    zeilen: 'Rows (compartments)',
    spaltenInReihe: 'Columns in row {reihe}',
    spalten: { one: '{n} column', other: '{n} columns' },
    bezeichnung: 'Name',
    bezeichnungOptional: 'Name (optional)',
    fertig: 'Done',
  },
  raeume: {
    titel: 'Suggest board layout from rooms',
    titelMit: 'Suggest board layout from rooms – {kennzeichen}',
    keineRaeume:
      'The floor plan has no rooms and no components with a circuit. Rooms are drawn with the ' +
      '“Room” tool; the circuit is set in the properties panel of the component.',
    blattAlle: '{name} (all)',
    versorgtVon: 'supplied by {name}',
    netz: 'Supply',
    drehstrom: 'Three-phase 3~ 400 V',
    wechselstrom: 'Single-phase 1~ 230 V',
    einspeiseklemme: 'Supply terminal -X0',
    sls: 'SLS switch',
    blitzschutz: 'Lightning protection (parallel)',
    zaehler: 'Meter',
    sicherungNachZaehler: 'Fuse after the meter',
    rcdJeBlatt: 'One RCD per sheet',
    rcdTyp: 'RCD type (empty = catalogue)',
    rcdTypBeispiel: 'e.g. 40A/0.03A type A',
    lsTyp: 'LS type (empty = catalogue)',
    lsTypBeispiel: 'e.g. B16',
    knxGleich: 'Assign KNX actuators straight away',
    keineKomponenten: 'There is no component with a circuit in the selected rooms.',
    blatt: 'Sheet',
    stromkreis: 'Circuit',
    bauteile: 'Components',
    knxAktoren: 'KNX actuators: {liste}',
    verwaist: 'No longer needed (source missing or room deselected)',
    entfernen: 'Remove {text}',
    fehlend: 'Not in the catalogue, therefore omitted: {liste}',
    neuErzeugenTitel: 'Recreate distribution board diagram?',
    neuErzeugenNachricht:
      'Recreate “{name}” from the new board layout? The content of the diagram is replaced – ' +
      'your own changes in it are lost, and undo in the floor plan does not reach the diagram. ' +
      'Without recreating, the distribution board dialog shows what the diagram is missing.',
    neuErzeugen: 'Recreate',
    neuErzeugt: '“{name}” recreated.',
    neuErzeugenFehler: 'Recreating failed.',
    verknuepft:
      'Linked to “{name}” – after applying, the diagram can be recreated from the new board ' +
      'layout.',
    erklaerung:
      'For each selected room an LS with terminal for the room circuit, for each number and ' +
      'each separate circuit; one RCD per sheet. KNX-switched groups and loads get a channel ' +
      'with their own terminal. Anything already there stays.',
    art: 'Type',
  },
  switchPort: {
    titelIntern: 'Connect internally – choose target port',
    titelBelegung: 'Port assignment',
    titelZiel: 'Choose cable target',
    titelPort: 'Choose port circuit',
    internErklaerung:
      'Connects {port} of {geraet} directly to a port of another device reachable via trunks ' +
      '– without a cable on the plan.',
    diesemGeraet: 'this device',
    nichtsAmTrunk:
      'Neither a switch nor a cable riser is attached to this trunk. A switch counts as ' +
      'connected as soon as a trunk end docks onto one of its “T” points.',
    keinGeraet: 'No further device reachable via a trunk.',
    rubrikSwitch: 'Switch',
    rubrikPatchpanel: 'Patch panel',
    rubrikVerteiler: 'Distribution board',
    rubrikSchacht: 'Cable riser',
    etage: 'Storey',
    geraetetyp: 'Device type',
    filter: 'Filter',
    alle: 'All',
    alleAnzeigen: 'Show all ({n})',
    zurueck: 'Back',
    verbinden: 'Connect',
    trennenUndo: 'Disconnect internal connection',
    beschriftungUndo: 'Change port label',
    leitung: 'Cable',
    strangBelegt: 'occupied – a riser line connects two storeys',
    listeEinblenden: 'Show port list',
    listeAusblenden: 'Hide port list',
    kennzahlen: '{belegt} of {gesamt} ports used · PoE {watt} W',
    frontansicht: 'Front view {name}',
    port: 'Port',
    ltg: 'Cable',
    geraet: 'Device',
    aktion: 'Action',
    intern: '{geraet}/{port} (internal)',
    unbekannt: 'unknown',
    frei: 'free',
    nichtGepflegt: 'n/a',
    verbindenKnopf: 'Connect…',
    trennen: 'Disconnect',
    tooltipFrei: '{port} (free)',
    tooltipFreiMit: '{port} (free) - {beschriftung}',
    tooltipLeitung: 'Cable {nummer}',
    poeNichtGepflegt: 'PoE power not specified',
    beschriftungGesperrt: 'Label of the connected component – change it there',
  },
  verteiler: {
    titel: 'Distribution board',
    titelAnschliessen: 'Connect {was} in distribution board {kennzeichen}',
    titelMit: 'Distribution board {kennzeichen}',
    ohneAnschluss: 'Apply without terminal',
    zuweisen: 'Assign',
    komponente: 'Component',
    nurBestueckung: {
      one:
        '{n} item of equipment in the board layout is missing from the distribution board ' +
        'diagram (grey) – add it there or remove it here.',
      other:
        '{n} items of equipment in the board layout are missing from the distribution board ' +
        'diagram (grey) – add them there or remove them here.',
    },
    ohneGegenstueck: 'Assigned but not present: {liste} – please reassign.',
    planBaum: '“{name}” brings a tree from the distribution board diagram wizard ({n} nodes).',
    planBaumUndo: 'Apply tree from distribution board diagram',
    planBaumUebernehmen: 'Apply tree',
    knxOffen: {
      one: '{n} terminal is switched by KNX devices but has no actuator channel yet.',
      other: '{n} terminals are switched by KNX devices but have no actuator channel yet.',
    },
    knxHinweis: 'KNX actuators: suggest and create channels for the targets of the KNX devices.',
    knxZuordnenKnopf: 'Assign KNX actuators …',
    raeumeMitPlan: 'LS and terminals from rooms – the linked diagram can be recreated afterwards.',
    raeumeOhnePlan: 'Without cables: LS and terminals from rooms and the “Circuit” property.',
    raeumeKnopf: 'Suggest board layout from rooms …',
    knotenBelegt: '{belegt} of {anzahl} nodes used',
    netzartUndo: 'Change supply type',
    drehstrom: 'Three-phase (L1, L2, L3, N, PE)',
    wechselstrom: 'Single-phase (L, N, PE)',
    artUndo: 'Change distribution board type',
    plan: 'Distribution board diagram: {name} – its equipment applies.',
    weiterePlaene: {
      one: '({n} other diagram has the same reference designation; the first one applies.)',
      other: '({n} other diagrams have the same reference designation; the first one applies.)',
    },
    plaeneLesen: 'Reading the distribution board diagrams of the project …',
    keinPlan: 'No distribution board diagram linked – the board layout here applies.',
    planErzeugenKnopf: 'Create distribution board diagram …',
    schaltplanZuordnenKnopf: 'Assign existing schematic …',
    katalogeintragFehlt: 'Catalogue entry missing',
    kanalName: 'Channel {kanal} · {name}',
    kanalFunktion: 'Channel {kanal} {funktion} · {name}',
    nochLeerAuswahl:
      'No equipment yet – fill the board in the overview (double-click the distribution board).',
    suchen: 'Search by label or reference designation, e.g. “Kitchen” or “X5”',
    auswahlHinweis:
      'Click a node – usually the terminal. Fuse, RCD and phase follow from the tree. Several ' +
      'nodes are possible, and several cables may share one node.',
    nochNichtEingeordnet: '{name} · not placed yet',
    nichtsGefunden: 'Nothing found.',
    gewaehlt: 'Selected',
    ader: 'Core (optional)',
    aderBeispiel: 'e.g. 1, L, bl',
    entfernen: 'Remove',
    klemmeUndo: 'Change terminal',
    schonNummeriert: '-{leiste} is already numbered without gaps.',
    nummerierenUndo: 'Renumber terminal strip',
    leisteIstGeraet: '-{leiste} is still a separate device – rename it first.',
    ueberfuehrenUndo: 'Move terminals into the terminal strip',
    kennzeichenVergeben: '“{kennzeichen}” is empty or already used in this distribution board.',
    kennzeichenUndo: 'Change reference designation',
    entfernenUndo: 'Remove equipment',
    entfernenLeitungen: {
      one: '{n} cable is connected to {name}; it will be disconnected.',
      other: '{n} cables are connected to {name}; they will be disconnected.',
    },
    entfernenTitel: 'Remove {name}?',
    entfernenKinder:
      'Further nodes are attached after {name}. Remove only this node (the nodes after it ' +
      'move up to its place) or everything after it as well?',
    nurDiesen: 'Only this node',
    mitAllem: 'Including everything after it',
    knxHinzufuegenUndo: 'Add KNX actuator',
    hinzufuegenTitel: 'Add equipment',
    anzahl: 'Quantity “{name}”',
    waehlenTitel: 'Choose equipment',
    weiter: 'Next',
    kanaeleBearbeiten: 'Edit channels of -{kennzeichen}',
    kanalFieleWeg:
      '{liste} is placed in the tree and would be lost – remove it from the tree first.',
    knxAendernUndo: 'Change KNX actuator',
    umhaengenUndo: 'Move node',
    einordnenUndo: 'Place equipment',
    betriebsmittelDahinter: 'Equipment after it …',
    stromkreiseDahinter: 'Circuits after it …',
    kanalDahinter: 'Channel after it …',
    stromkreiseUndo: 'Add circuits',
    alteKlemmen: {
      one: '{n} terminal still has its own reference designation ({liste}) instead of a number in the strip.',
      other:
        '{n} terminals still have their own reference designation ({liste}) instead of a number in the ' +
        'strip.',
    },
    inLeisteKnopf: 'Move into terminal strip -{leiste}',
    spalteKennzeichen: 'Desig.',
    spalteTyp: 'Type',
    spaltePhase: 'Phase',
    spalteLeitungen: 'Cables',
    spalteGeraete: 'Devices',
    einspeisung: 'Supply',
    dahinterAnlegen: 'Add after it',
    hinterEinspeisung: 'Add after the supply',
    nochLeer: 'Still empty – use “+” on the supply to add equipment or circuits straight away.',
    klemmenUndo: 'Add terminals',
    kanalGeraetUndo: 'Add device with channels',
    kanalGeraetWaehlen: 'Choose device with channels',
    hinzufuegen: 'Add',
    nichtEingeordnetTitel: 'Not placed yet',
    nichtEingeordnetHinweis:
      'Listed in the distribution board diagram but without a place here yet – drag onto a node.',
    nichtImPlan: 'not in the distribution board diagram',
    griffTitel: 'Drag to move – click: choose upstream node',
    aufklappen: 'Expand',
    zuklappen: 'Collapse',
    typUndo: 'Change type',
    phaseUndo: 'Change phase',
    beschriftungBeispiel: 'e.g. Kitchen socket outlets',
    beschriftungUndo: 'Change label',
    hinterKnoten: 'Add after {knoten}',
    knotenEntfernen: 'Remove {name}',
    vorgeschaltet: 'Upstream:',
    falschesNetzTitel: 'Does not match the supply',
    falschesNetz:
      '“{name}” is multi-phase. The distribution board is single-phase – only 1- and 2-pole ' +
      'devices fit there. The supply type is set at the top of the distribution board dialog.',
    ok: 'OK',
    anzahlFeld: 'Quantity',
    schutzgeraet: 'Protective device',
    klemmeDahinter: 'Terminal after it',
    ohneKlemme: 'no terminal',
    kanalEinordnenUndo: 'Place channel',
    klemmeEinordnenUndo: 'Place terminal',
    keinKanalGeraet: 'No device with channels yet.',
    neuesGeraet: 'New device …',
    einordnen: 'Place',
    kanalGeraeteTitel: 'Devices with channels',
    kanalGeraeteLeer:
      'Switching actuators and terminal blocks whose channels appear individually in the tree – ' +
      'add them via “+” › “Channel after it …” or here.',
    klemmenleiste: 'Terminal strip',
    kanalEingeordnet: '{name} placed',
    kanalFrei: '{name} free',
    kanaeleBearbeitenKnopf: 'Edit channels …',
    neuNummerierenTitel: 'Without gaps from 1 in the order of the tree',
    neuNummerieren: 'Renumber',
    kanalGeraetNeu: '+ Device with channels …',
  },
  assistent: {
    titel: 'Distribution board diagram wizard',
    schritt: 'Step {nummer}/{gesamt}',
    angelegtTitel: 'Distribution board diagram created',
    angelegtNachricht: '“{name}” is now in the project. Open it now?',
    anlegenFehler: 'Creating failed.',
    keinProjekt: 'Open a project first or choose one in the overview.',
    raeumeHinweis:
      'Rooms from “{name}”: an LS with terminal for each room circuit, number and separate ' +
      'circuit, one RCD per sheet, KNX targets with a channel. Refine in the tree afterwards. ' +
      'The floor plan is only read.',
    bauplaeneLesen: 'Reading floor plans …',
    baumFuer:
      'The tree for {kennzeichen} – edit it as in the distribution board dialog: “+” adds ' +
      'equipment, circuits or channels after a node, the handle drags a node to another place.',
    baumNeu:
      'The tree of the new distribution board – edit it as in the distribution board dialog: ' +
      '“+” adds equipment, circuits or channels after a node, the handle drags a node to ' +
      'another place.',
    maxSicherungen: 'Maximum fuses per sheet',
    maxKlemmen: 'Maximum terminals per sheet',
    aufteilung: 'Split',
    aufteilungGanz: 'New sheet when an RCD no longer fits completely',
    aufteilungFortlaufend: 'Space-saving, continuous – the RCD continues on the next sheet',
    ueberfuehren: {
      one:
        'Move {n} terminal with its own reference designation ({liste}) into terminal strip -{leiste} – ' +
        'the number stays, e.g. {alt} → {neu}',
      other:
        'Move {n} terminals with their own reference designation ({liste}) into terminal strip -{leiste} ' +
        '– the number stays, e.g. {alt} → {neu}',
    },
    zusammenfassung: '{blaetter} sheets · {stromkreise} circuits · {rcd} RCD',
    zurueck: '‹ Back',
    laeuft: 'Creating …',
    erzeugen: 'Create',
    weiter: 'Next ›',
    quelleBauplan: 'Use a distribution board from a floor plan',
    keinVerteiler: 'No floor plan of the project has a distribution board.',
    verteilerEintrag: '{kennzeichen} · {plan} · {n} nodes',
    verteilerOffen: '{kennzeichen} · {plan} (open) · {n} nodes',
    quelleRaeume: 'From the rooms of a floor plan',
    keinBauplan: 'The project has no floor plan.',
    quelleRaeumeHinweis:
      'Without cables: LS and terminals from the rooms and the “Circuit” property of the ' +
      'components, KNX channels from the “KNX” tick and the control assignments.',
    quelleNeu: 'Compose from scratch',
    quelleNeuHinweis:
      'Starting tree from a quick preset, then refine it in the same editor as in the ' +
      'distribution board dialog. The tree is remembered in the diagram.',
    blitzschutz: 'Lightning arrester (parallel between terminal and SLS)',
    lsJeRcd: 'LS per RCD',
    klemmeJeLs: 'One outgoing terminal 1P+N+PE per LS',
    vorgabeGeaendert:
      'A changed preset rebuilds the tree on Next – changes made to it are then lost.',
    etageBeispiel: 'e.g. 1F',
    wohnung: 'Flat',
    wohnungBeispiel: 'e.g. Flat 2',
    verwendung: 'Use',
    verwendungBeispiel: 'e.g. Garage/wallbox',
    kennzeichenFest:
      'The reference designation of the distribution board – only this keeps the diagram linked to it.',
    vorschlag: 'Apply suggestion',
    aktoren: '{anzahl} ({titel}) · {kanaele} used · {frei} free',
    aktorenAnzahl: { one: '{n} KNX actuator', other: '{n} KNX actuators' },
    kanaeleBelegt: { one: '{n} channel', other: '{n} channels' },
  },
}
