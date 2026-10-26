import type { Texte } from '../texte'

export const werkzeuge: Texte['werkzeuge'] = {
  tasten: {
    leertaste: 'Space',
    entf: 'Del',
    strg: 'Ctrl',
    gerade: 'Straight',
    fertig: 'Done',
    punktZurueck: 'Undo point',
    drehen90: 'Rotate 90°',
    oderEnter: ' or Enter',
    oderEntf: ' or Del',
    slashEnter: '/Enter',
    strgGerade: ', straight while holding Ctrl',
  },
  aktorkanalliste: {
    status: 'Click to place the top-left corner of the actuator channel list.',
    einsetzen: 'Insert actuator channel list',
  },
  betriebsmittelliste: {
    status: 'Click to place the top-left corner of the equipment list.',
    einsetzen: 'Insert equipment list',
  },
  leitungsbaum: {
    status: 'Click to place the top-left corner of the cable tree.',
    einsetzen: 'Insert cable tree',
  },
  leitungsliste: {
    status: 'Click to place the top-left corner of the cable list.',
    einsetzen: 'Insert cable list',
  },
  plankopf: {
    status: 'Click to place the top-left corner of the title block.',
    einsetzen: 'Insert title block',
  },
  potentialliste: {
    status: 'Click to place the top-left corner of the potential list.',
    einsetzen: 'Insert potential list',
  },
  raumliste: {
    status: 'Click to place the top-left corner of the room list.',
    einsetzen: 'Insert room list',
  },
  steuerungslogik: {
    status: 'Click to place the top-left corner of the control logic table.',
    einsetzen: 'Insert control logic',
  },
  stromkreisverzeichnis: {
    status: 'Click to place the top-left corner of the circuit schedule.',
    einsetzen: 'Insert circuit schedule',
  },
  stueckliste: {
    status: 'Click to place the top-left corner of the bill of materials.',
    einsetzen: 'Insert bill of materials',
  },
  trunkliste: {
    status: 'Click to place the top-left corner of the trunk list.',
    einsetzen: 'Insert trunk list',
  },
  bogen: {
    mittelpunkt: 'Click the centre of the arc.',
    startpunkt: 'Click the start point of the arc (sets the radius).',
    endpunkt: 'Click the end point of the arc.',
    zeichnen: 'Draw arc',
  },
  kreis: {
    mittelpunkt: 'Click the centre.',
    radius: 'Click to set the radius.',
    zeichnen: 'Draw circle',
  },
  ellipse: {
    mittelpunkt: 'Click the centre of the ellipse.',
    zweiterPunkt: 'Click the second point (width/height).',
    zeichnen: 'Draw ellipse',
  },
  linie: {
    startpunkt: 'Click the start point.',
    endpunkt: 'Click the end point (Shift = snap angle, Esc = cancel).',
    zeichnen: 'Draw line',
  },
  punkt: {
    status: 'Click to place a point.',
    zeichnen: 'Draw point',
  },
  rechteck: {
    ersteEcke: 'Click the first corner.',
    gegenecke: 'Click the opposite corner.',
    zeichnen: 'Draw rectangle',
  },
  bemassung: {
    startpunkt: 'Click the start point of the distance to dimension.',
    endpunkt: 'Click the end point of the distance (Shift = snap angle).',
    versatz: 'Click to set the offset of the dimension line.',
    einfuegen: 'Insert dimension',
  },
  text: {
    status: 'Click to set the text position.',
    einfuegen: 'Insert text',
    inhalt: 'Text content:',
  },
  polylinie: {
    status: 'Click points, double-click{taste} to finish, Esc to cancel.',
    zeichnen: 'Draw polyline',
  },
  polygon: {
    mittelpunkt: 'Click the centre ({n} sides{taste}).',
    mittelpunktTaste: ', +/- changes the number',
    eckpunkt: 'Click a vertex (sets the radius and how far to rotate).',
    zeichnen: 'Draw polygon',
    seiten: 'Sides',
    weniger: 'Fewer sides',
    mehr: 'More sides',
    anzahl: '{n} sides.',
  },
  schraffur: {
    einfuegen: 'Insert hatching',
    status: 'Click outline points (pattern: {muster}{tasteM}). Double-click{tasteEnter} finishes.',
    statusTasteM: ', key M switches',
    wechseln: 'Switch pattern ({muster})',
    muster: 'Pattern: {muster}',
    musterName: {
      diagonal: 'diagonal',
      kreuz: 'cross',
      horizontal: 'horizontal',
      vertikal: 'vertical',
    },
  },
  bodenplatte: {
    zeichnen: 'Draw floor slab',
    zuWenigPunkte: 'A floor slab needs at least three vertex points.',
    status:
      'Click each vertex; clicking the first point or double-clicking{taste} closes the slab, Esc cancels.',
    schliessen: 'Close',
    ersteEcke: 'Click the first corner of the floor slab.',
    gegenecke: 'Click the opposite corner, Esc to cancel.',
  },
  hintergrund: {
    keiner: 'No background loaded - load a plan first via Sheet › Load background plan….',
    gesperrt: 'The layer “Background” is locked - unlock it in the layers dialog first.',
  },
  kalibrieren: {
    ifc: 'An IFC background is already to scale - Calibrate is not available here.',
    ersterPunkt: 'Click the first point of a known distance in the background.',
    zweiterPunkt: 'Click the second point of the known distance.',
    titel: 'Calibrate background',
    laenge: 'Real length of the marked distance (cm):',
    rohwert:
      'Screen distance before you calibrate: {distanz} m (raw value, replaced by your input)',
    erkannt: 'Plan detected at scale 1:{norm}. ',
    erkanntDruck: 'Plan detected at scale 1:{norm}, the print area prints at 1:{norm}. ',
    erkanntPasstNicht:
      'Plan detected at scale 1:{norm}, it does not fit on {papier} at that scale - the print area prints at 1:{nenner}. ',
    gesetzt:
      'Scale set: {massstab}The plan is therefore {breite} × {hoehe} m. If that is wrong, calibrate again - the real length is entered in centimetres.',
  },
  erkennungProbe: {
    bezeichnung: 'Detection: drag sample',
    gegenecke: 'Click the opposite corner of the sample.',
    wand: 'Drag a rectangle over a typical wall - wall thickness and colour are measured from it.',
    tuer: 'Drag a rectangle over a typical door - opening width and colour are measured from it.',
    fenster:
      'Drag a rectangle over a typical window - opening width and colour are measured from it.',
  },
  fenster: {
    wandZeigen: 'Point at a wall to insert a window (Esc ends).',
    klicken: 'Click to insert the window (Esc ends).',
    weitere: {
      one: '{n} window inserted – click to insert the window (Esc ends).',
      other: '{n} windows inserted – click to insert the window (Esc ends).',
    },
    einsetzen: 'Insert window',
  },
  tuer: {
    taste: 'Space switches hinge side/opening side, ',
    wandZeigen: 'Point at a wall to insert a door ({taste}Esc ends).',
    klicken: 'Click to insert the door ({taste}Esc ends).',
    weitere: {
      one: '{n} door inserted – click to insert the door ({taste}Esc ends).',
      other: '{n} doors inserted – click to insert the door ({taste}Esc ends).',
    },
    einsetzen: 'Insert door',
    anschlag: 'Switch hinge side',
    oeffnungsseite: 'Switch opening side',
  },
  wanddurchbruch: {
    wandZeigen: 'Point at a wall to insert a wall opening (Esc ends).',
    klicken: 'Click to insert the wall opening (Esc ends).',
    weitere: {
      one: '{n} wall opening inserted – click to insert the wall opening (Esc ends).',
      other: '{n} wall openings inserted – click to insert the wall opening (Esc ends).',
    },
    einsetzen: 'Insert wall opening',
  },
  ausblenden: {
    ersteEcke:
      'Click the first corner of the area to mask - or click an existing mask to remove it.',
    entfernen: 'Remove mask',
    entfernt: 'Mask removed.',
    ausblenden: 'Mask background area',
  },
  ifcAusrichten: {
    schritt1: 'Align 1/4: click a distinctive point in the existing plan (e.g. a building corner).',
    schritt2: 'Align 2/4: click a second point in the existing plan - as far away as possible.',
    schritt3: 'Align 3/4: click the same first point in the IFC floor plan (orange).',
    schritt4: 'Align 4/4: click the same second point in the IFC floor plan (orange).',
    keinGeschoss: 'No IFC storey to align.',
    warnung:
      ' The deviation is unusually large - are the points correct, and was the existing plan calibrated correctly? Your design is not scaled along.',
    titel: 'Apply IFC storey',
    frage:
      'Distance in the existing plan {plan} m, in the IFC model {ifc} m (deviation {prozent} %). The existing background will be replaced.{warnung}',
    uebernehmen: 'Apply',
    zusammen: 'The two points of a pair coincide - please try again.',
  },
  ifcBauteileVorschau: {
    status: 'Preview of the IFC building elements - apply or close in the dialog.',
  },
  kabelschacht: {
    ersteEcke:
      'Click a corner of the penetration – a second click on the same spot uses the default size.',
    einfuegen: 'Insert cable riser',
  },
  nullpunkt: {
    status: 'Click to set the origin of the sheet (reference for coordinates, grid and snap).',
    setzen: 'Set origin',
    richtung:
      'Click a point along a building edge – this direction becomes horizontal when aligning the sheets{taste}.',
    richtungTaste: ' (Enter: without direction)',
    ohneRichtung: 'Without direction',
  },
  raum: {
    status: 'Click inside an area enclosed by walls to create a room (Esc ends).',
    nichtUmschlossen: 'No room can be created here – the area is not completely enclosed by walls.',
    vorhanden: 'There is already a room in this area – selected.',
    anlegen: 'Create room',
  },
  treppe: {
    status: 'Click to place the stairs{taste}.',
    statusTaste: ' (Space rotates, key F switches the shape)',
    zeichnen: 'Draw stairs',
    formWechseln: 'Switch shape ({form})',
    form: {
      gerade: 'Straight',
      'u-podest': 'With half landing (180°)',
      'u-kehre': 'Winder without landing (180°)',
      'l-kehre': 'L-shaped stairs (90°)',
    },
  },
  potential: {
    status: 'Click to place a potential.',
    titel: 'Name potential',
    name: 'Name (e.g. L1, N, PE or free text):',
    hinweis:
      'Two potentials with the same name count as connected throughout the project. “PE” automatically gets the protective earth symbol.',
    setzen: 'Place potential',
  },
  zeichenflaeche: {
    keine: 'No print area set up - create one first via Sheet › Set up print area….',
    schaltplan: 'In a schematic the print area is fixed.',
    ziehen: 'Drag the print area to the desired position with the mouse button held down.',
    verschieben: 'Move print area',
  },
  zoomFenster: {
    status: 'Drag the area to zoom into.',
  },
  trimmen: {
    kante:
      'Click the cutting edge (line, polyline, rectangle, polygon, circle, arc, ellipse or wall).',
    keineKante: 'This object type cannot be used as a cutting edge.',
    ziel: 'Click the target (line or wall) (the clicked side is trimmed/extended). Esc selects a new cutting edge.',
    keinZiel: 'No line or wall found at this position.',
    keinSchnitt: 'No intersection with the cutting edge found.',
    wand: 'Trim/extend wall',
    linie: 'Trim/extend line',
  },
  wand: {
    staerke: 'Wall thickness {cm} cm{taste}',
    staerkeTaste: ' (+/- changes)',
    start: 'Click the start point. {staerke}.',
    weiter:
      'Click further points, click the start or a wall end to close/connect, double-click{taste} to finish, Esc to cancel. {staerke}.',
    zeichnen: 'Draw wall',
    staerkeGruppe: 'Wall thickness',
    duenner: 'Thinner',
    dicker: 'Thicker',
  },
  wandRechteck: {
    ersteEcke: 'Click the first outer corner. {staerke}.',
    gegenecke: 'Click the opposite outer corner, Esc to cancel. {staerke}.',
    zuKlein: 'Too small – the rectangle must be larger than twice the wall thickness.',
    zeichnen: 'Draw wall rectangle',
  },
  wandTeilen: {
    ersterPunkt: 'Click the first point on a wall.',
    keineWand: 'No wall found at this position.',
    zweiterPunkt: 'Click the second point on the same wall (Esc cancels).',
    ungueltig:
      'No valid section to split (too short or closed wall). Click the first point on a wall.',
    teilen: 'Split wall',
  },
  teilstueckZone: {
    taste: ', Enter ends',
    anklicken: 'Click segments of a cable{taste}.',
    gewaehlt: {
      one: '{n} segment selected – zone in the context bar or via right-click{taste}.',
      other: '{n} segments selected – zone in the context bar or via right-click{taste}.',
    },
  },
  switchplan: {
    status:
      'Click to place the top-left corner of the switch port plan - then select the switch in the properties panel.',
    einsetzen: 'Insert switch port plan',
    keinGeraet:
      'No switch placed in the drawing yet - the switch port plan stays empty until one can be selected.',
    eingesetzt:
      'Switch port plan inserted - now select the switch in the properties panel on the right.',
  },
  patchpanelplan: {
    status:
      'Click to place the top-left corner of the patch panel plan - then select the patch panel in the properties panel.',
    einsetzen: 'Insert patch panel plan',
    keinGeraet:
      'No patch panel placed in the drawing yet - the patch panel plan stays empty until one can be selected.',
    eingesetzt:
      'Patch panel plan inserted - now select the patch panel in the properties panel on the right.',
  },
  bemassungsreihe: {
    ersterPunkt: 'Click the first measuring point.',
    zweiterPunkt:
      'Click the second measuring point - sets the measuring direction (Shift = snap angle).',
    weitere:
      'Click further measuring points, double-click{tasteEnter} finishes. Right-click{tasteEntf} removes the last point.',
    abstand: 'Click to set the distance of the dimension line.',
    ketteEinfuegen: 'Insert chain dimension',
    parallelEinfuegen: 'Insert baseline dimension',
  },
  auswahlHinweis: {
    grund:
      'Click selects · Ctrl+click extends · drag a rectangle: multiple selection · drag moves · double-click edits{taste}',
    grundTaste: ' · Space rotates · Del deletes',
    leitung:
      'Cable: drag a segment to re-route · double-click inserts a waypoint · click a waypoint + Del removes it · drag the number to move it, double-click resets it',
    trunk:
      'Trunk: drag a segment to re-route · drag an end to extend, onto a trunk end to merge, onto a path to branch · double-click inserts a waypoint · drag the label to move it, with Shift the entry/exit point',
    wand: 'Wall: drag a vertex · double-click on an edge inserts a point · click a point + Del removes it · cut out a section: tool “Split wall”',
    polylinie:
      'Polyline: drag a vertex · double-click on an edge inserts a point · click a point + Del removes it',
    bodenplatte:
      'Floor slab: drag a vertex · double-click on an edge inserts a point · click a point + Del removes it · thickness and height in the properties panel',
  },
  komponente: {
    decke: 'Ceiling',
    boden: 'Floor',
    standard: 'Default',
    tasteDreht: 'Space rotates, ',
    knxPlatzieren: 'Click in the drawing to place the KNX actuator ({taste}Esc ends).',
    knxPlatziert: {
      one: '{n} KNX actuator placed – keep clicking or Esc to end.',
      other: '{n} KNX actuators placed – keep clicking or Esc to end.',
    },
    platzieren:
      'Click in the drawing to place the component ({taste}tool key for another component, Esc ends).',
    platziert: {
      one: '{n} component placed – keep clicking, {taste}tool key for another component or Esc to end.',
      other:
        '{n} components placed – keep clicking, {taste}tool key for another component or Esc to end.',
    },
    knxZusammenstellen: 'Configure KNX actuator ...',
    katalogWaehlen: 'Select a component from the catalogue ...',
    hoehe: 'Height',
    niedriger: 'Lower mounting height',
    hoeher: 'Higher mounting height',
    installationshoehe: 'Mounting height: {hoehe}',
    anWand: 'Place component on wall',
    platzierenLabel: 'Place component',
    eingeschleift: {
      one: 'Component looped into {n} connection – keep clicking or Esc to end.',
      other: 'Component looped into {n} connections – keep clicking or Esc to end.',
    },
  },
  leitung: {
    leerPort: 'Assign port circuit',
    leerVerteiler: 'Connect in distribution board',
    leerSchacht: 'Into the cable riser',
    leerZiel: 'Choose target in the bundle',
    woVerbunden: 'click the exit point - also on a connected trunk',
    woPfad: 'click the exit point on its path',
    imTrunk: 'In trunk “{name}”: {wo}{taste} (Esc = cancel).',
    imTrunkTaste: ' - or Space {was}',
    wasPort: 'to assign the port circuit',
    wasVerteiler: 'to connect in the distribution board',
    wasSchacht: 'to continue in the bundle into the cable riser',
    wasZiel:
      'for the target in the bundle (switch, patch panel, distribution board or cable riser)',
    zeichnen:
      'Click further points (straight segments). A target connection point, a trunk path or a cable riser finishes - el.easy.CAD routes there automatically from the last point set{tasteStrg}. Double-click{tasteEnter} ends with a free end, right-click{tasteEntf} removes the last point, Esc cancels.',
    nochKeinPunkt:
      'No point set yet - click another point first, then double-click or Enter ends the cable with a free end.',
    zeichnenLabel: 'Draw cable',
    fuer: 'Cable {nummer}',
    fortsetzung: 'Continuing at riser line {titel}. {status}',
    start: 'Click a start connection point or a free point.',
    startAmStrang: 'Start at riser line {titel}. {status}',
    austrittKette:
      'The exit point must lie on the path of “{name}” or a trunk connected to it (Esc = cancel).',
    austrittPfad: 'The exit point must lie on the path of “{name}” (Esc = cancel).',
    austrittGleich: 'The exit point must not coincide with the entry point.',
    nichtVerbunden: '“{austritt}” is not connected to “{eintritt}”.',
    keinPfadTrunk: 'No collision-free path to the trunk found - choose another point.',
    keinPfad: 'No collision-free path found - choose another target point.',
    ketteOhneZiel: 'Neither a switch nor a cable riser is attached to the chain of “{name}”.',
    keinPfadZumTrunk: 'No collision-free path to the trunk found.',
    freiesEnde: 'Free end',
    alleDockpunkte: 'All connection points',
    ketteOhneZielLeertaste:
      'Neither a switch nor a distribution board or cable riser is attached to the chain of “{name}” - click the exit point.',
  },
  schaltverbindung: {
    mehrlinigModus: { one: 'multi-line, {n} core', other: 'multi-line, {n} cores' },
    einlinigModus: 'single-line, pole count {n}',
    tastenMehrlinig: ' (number keys 1-5, M single-line, Tab side)',
    tastenEinlinig: ' (number keys 1-5, M multi-line)',
    start: 'Click a start connection point, a wire or a free point. {hinweis}.',
    weiter:
      'Clicking a free point sets a vertex, clicking a connection point or a wire finishes - from the last point it is routed there automatically{tasteStrg}. Double-click{tasteEnter} ends freely. {hinweis}.',
    zeichnen: 'Draw wire',
    zeichnenAdern: {
      one: 'Draw wire ({n} core)',
      other: 'Draw wire ({n} cores)',
    },
    keinWeg: 'No free path to the target found - choose another target point.',
    durchgeschleift: {
      one: 'Wire drawn through {n} component and split there.',
      other: 'Wire drawn through {n} components and split there.',
    },
    adern: 'Cores',
    pole: 'Poles',
    mehrlinig: 'Multi-line',
    seiteWechseln: 'Switch side',
    fertigFrei: 'Done (free end)',
  },
  trunk: {
    nurEinEnde: 'Only one end could be connected - the trunk has already been merged.',
    andererTrunk: 'the other trunk',
    verschmelzen: 'Merge trunks',
    verschmolzenMit: 'Merged with “{name}”.',
    verschmolzen: 'Trunks merged.',
    andocken: 'Attach trunk',
    angedocktAn: 'Attached to “{name}” as a branch.',
    angedockt: 'Trunk attached.',
    verbindenNicht: 'Connecting not possible.',
    anfangspunkt: 'The start point',
    endpunkt: 'The end point',
    gezogenesEnde: 'The dragged end',
    nichtVerbunden: 'Not connected.',
    zeichnenVerbinden: 'Draw and connect trunk',
    anSchacht: 'Connect trunk to cable riser',
    anStrang: 'Connected to riser line {titel}.',
    anschlussNicht: 'Connection not possible.',
    anfang: 'Click the start point of the trunk (or a “T” connection point on a switch).',
    weiter:
      'Click further points, double-click{tasteEnter} to finish (at least start + end), right-click{tasteEntf} removes the last point, Esc cancels. A start or end dropped on another trunk connects both after confirmation: at its end they merge, in the middle of its path a branch is created. Dropped on a cable riser, el.easy.CAD asks for the riser line that leads to the next storey.',
    zeichnen: 'Draw trunk',
  },
  trunkAblage: {
    verschmelzenTitel: 'Merge trunks?',
    abzweigTitel: 'Create branch?',
    verschmelzenFrage:
      '{ende} lies on the end of “{name}”. Merge both trunks into a single trunk? The cable numbers are reassigned; splitting them again afterwards is not supported.',
    abzweigFrage:
      '{ende} lies on the path of “{name}”. Attach there as a branch? Both trunks remain independent and only share the cable numbers.',
    verschmelzen: 'Merge',
    andocken: 'Attach',
  },
  auswahl: {
    durchlaufendNichtGeroutet: {
      one: '{n} cable running through could not be re-routed without collisions - please adjust manually.',
      other:
        '{n} cables running through could not be re-routed without collisions - please adjust manually.',
    },
    eingeschleift: {
      one: 'Component looped into {n} connection.',
      other: 'Component looped into {n} connections.',
    },
    angeschlossenNichtGeroutet: {
      one: '{n} connected cable could not be re-routed without collisions - please adjust manually.',
      other:
        '{n} connected cables could not be re-routed without collisions - please adjust manually.',
    },
    autoAusFrage: 'Turn off auto-route?',
    autoAusText:
      'Cable no. {nummer} has just been routed manually. Without auto-route its segments can be dragged freely from now on (no 90°/45° rule, no obstacle avoidance) and are no longer re-routed automatically when a connected component is moved.',
    ausschalten: 'Turn off',
    autoAus: 'Turn off auto-route',
    nummerVerschieben: 'Move cable number',
    eintrittsschild: 'Move entry label',
    austrittsschild: 'Move exit label',
    trunkBezeichnung: 'Move trunk name',
    raumbeschriftung: 'Move room label',
    zielbezeichnung: 'Move target designation',
    komponentenbeschriftung: 'Move component label',
    trunkEndeNicht: 'The trunk end cannot be dropped here - no collision-free path.',
    trunkEndeVerschieben: 'Move trunk end',
    modulMitLeitungen:
      'The module has connected cables/trunks and therefore does not snap onto a housing – disconnect it first to mount it.',
    knickEinfuegen: 'Insert bend',
    wegpunktNicht: 'The waypoint cannot be inserted here - no collision-free path.',
    wegpunktHinzufuegen: 'Add waypoint',
    punktHinzufuegen: 'Add point',
    beschriftungTitel: 'Edit label',
    beschriftungLabel: 'Label (free text, e.g. room/position):',
    beschriftungAendern: 'Change label',
    moduleMitGehaeuse:
      'Mounted modules are rotated/scaled with their housing – detach them first to transform them on their own.',
    loslassenSchacht: 'Releasing asks which riser line of the cable riser it continues on.',
    loslassenVerschmelzen: 'Releasing asks whether the two trunks are merged into one.',
    loslassenAbzweig: 'Releasing asks whether the trunk attaches here as a branch.',
    nullpunktVerschieben: 'Move origin',
    objekteDrehen: 'Rotate object(s)',
    objekteSkalieren: 'Scale object(s)',
    eintrittspunkt: 'Move entry point',
    austrittspunkt: 'Move exit point',
    punktNicht: 'The point cannot be dropped here - no collision-free path.',
    trunkSegment: 'Move trunk segment',
    leitungssegment: 'Move cable segment',
    segmentNicht: 'The segment cannot be dropped here - no collision-free path.',
    verbindungsende: 'Drag connection end',
    verbindungAendern: 'Change connection',
    autoAusVerbindung:
      'Auto-route turned off for this connection – it can be turned on again in the properties panel.',
    wandpunkt: 'Move wall point',
    plattenpunkt: 'Move slab point',
    polylinienpunkt: 'Move polyline point',
    positionAufWand: 'Change position on the wall',
    messpunkt: 'Move measuring point',
    masslinie: 'Move dimension line',
    nichtAngeschlossen: 'Not connected.',
    objekteVerschieben: 'Move objects',
    objektVerschieben: 'Move object',
    modulAufsetzen: 'Mount module',
    modulAbziehen: 'Detach module',
    knickEntfernen: 'Remove bend',
    wegpunktEntfernen: 'Remove waypoint',
    wegpunktNichtEntfernt: 'The waypoint cannot be removed - no collision-free path.',
    wandecke: 'Remove wall corner',
    eckpunktNicht: 'The vertex cannot be removed - only where exactly two wall segments meet.',
    punktEntfernen: 'Remove point',
    zuWenigePunkte: 'The point cannot be removed - too few points would remain.',
    gesperrt: 'The object is on a locked layer and cannot be deleted.',
    objekteLoeschen: { one: 'Delete {n} object', other: 'Delete {n} objects' },
    objektLoeschen: 'Delete object',
    komponentenDrehen: 'Rotate components',
    komponenteDrehen: 'Rotate component',
    kombinationDrehen: 'Rotate combination',
    komponentenVerschieben: 'Move components',
    komponenteVerschieben: 'Move component',
    loeschen: 'Delete',
  },
  wirkverbindung: {
    quelle: 'Click a control device, system device or sensor as the source (Esc = cancel).',
    sammeln: {
      one: '{n} target marked - click another target (clicking again removes it, targets on other storeys: switch sheet), right-click{taste} = finish (Esc = cancel).',
      other:
        '{n} targets marked - click another target (clicking again removes it, targets on other storeys: switch sheet), right-click{taste} = finish (Esc = cancel).',
    },
    typOhneSlots: 'This component cannot be a source (type “{typ}” has no slots of its own).',
    ohneTyp: 'This component cannot be a source (without a device type there are no slots).',
    keineSlots: 'This component has no slots yet (create them in the properties panel).',
    slotWaehlen: 'Choose slot...',
    kreislauf: 'Not possible: this would create a loop between slots.',
    unueblich: 'Target added (unusual combination: {quelle} → {ziel}). {status}',
    quellHinweis: 'Source: {blatt} · {komponente}',
  },
  commands: {
    blattAnlegen: 'Create sheet “{name}”',
    blattLoeschen: 'Delete sheet “{name}”',
    blattVerschieben: 'Move sheet “{name}”',
    umwandeln: 'Convert background to drawing elements',
    umwandelnBlaetter: {
      one: 'Convert background to drawing elements ({n} sheet)',
      other: 'Convert background to drawing elements ({n} sheets)',
    },
    umgewandeltErsetzen: 'Replace converted lines',
    symbolgroesse: 'Change symbol size on walls',
    ebeneLoeschen: 'Delete layer',
    typAendern: 'Change type',
    slotsAendern: 'Change slots',
    slotMatrixAendern: 'Change slot matrix',
    ansteuerungAendern: 'Change control',
    knxAendern: 'Change KNX',
    gruppeErstellen: 'Create device group',
    gruppeBeitreten: 'Join device group',
    gruppeVerlassen: 'Leave device group',
    gruppeLoeschen: 'Delete device group',
    gruppeAusAuswahl: 'Create device group from selection',
    gruppeUndWirkverbindung: 'Create group and control assignment',
    klemmenleisteNummerieren: 'Renumber terminal strip',
    knxAktorAendern: 'Change KNX actuator',
    nurInBauteilenAn: 'Cables only in wall, ceiling or floor',
    nurInBauteilenAus: 'Route cables freely again',
    raumquerung: 'Change room crossing',
    nurInBauteilenLeitungen: 'Change only in wall, ceiling or floor ({n} cables)',
    nurInBauteilenLeitung: 'Change only in wall, ceiling or floor',
    neuVerlegen: 'Re-route cables',
    reihenfolge: 'Change order',
    interneVerbindung: 'Create internal connection',
    trunkMitSichSelbst: 'A trunk cannot be merged with itself.',
    trunkAnSichSelbst: 'A trunk cannot attach to itself.',
    trunksSelbeGruppe: 'The two trunks already belong to the same group.',
  },
  katalogStand: {
    uebernehmen: 'Apply catalogue version',
  },
  wandfang: {
    loesen: 'Detach component from wall',
  },
  verdrahtung: {
    verlegen: 'Route connections',
  },
  trunkAusfuehrung: {
    kanal: 'Cable duct',
    trasse: 'Cable tray',
    rohr: 'Conduit',
    buendel: 'Bundle',
    titel: 'Different design',
    frage:
      '“{nameA}”: {ausfuehrungA}, “{nameB}”: {ausfuehrungB}. The design applies to the whole chain – which one should apply after connecting?',
  },
  trunkLoeschen: {
    einTrunk: 'this trunk',
    mehrereTrunks: 'these {n} trunks',
    anzahlLeitungen: { one: '{n} cable runs', other: '{n} cables run' },
    leitungen:
      '{leitungen} through {trunks}. They will be deleted too – including their assignment to switch or patch panel ports and their connection to the components. Chained trunks and branches are kept.',
    einSchacht: 'this cable riser',
    mehrereSchaechte: 'these {n} cable risers',
    anzahlAnschluesse: { one: '{n} connection is attached', other: '{n} connections are attached' },
    anschluesse:
      '{anschluesse} to {schaechte}. The affected ends lose their connection to the other storeys; the penetrations of the group on other sheets remain.',
    schachtTitel: { one: 'Delete cable riser?', other: 'Delete cable risers?' },
    trunkTitel: { one: 'Delete trunk?', other: 'Delete trunks?' },
  },
  anordnen: {
    oben: 'Top',
    unten: 'Bottom',
    links: 'Left',
    rechts: 'Right',
    horizontal: 'Centre horizontally',
    vertikal: 'Centre vertically',
    automatisch: 'Auto-arrange',
    neuVerlegen: 'Re-route connections',
  },
}
