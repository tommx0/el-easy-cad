import type { Texte } from '../texte'

export const hinweise: Texte['hinweise'] = {
  dialog: {
    verstanden: 'Got it',
    nichtMehrZeigen: 'Do not show this tip again',
    handbuch: 'Details in the manual',
    wiederEinschalten: 'Turn back on: {{befehl:hilfe.hinweise}} or Settings › General.',
  },
  auswahl: {
    titel: 'Help tips',
    erklaerung:
      'For functions with several steps, a small dialog lists the steps in the order you need ' +
      'them. Here you choose which tips appear.',
    hauptschalter: 'Show help tips',
    hauptschalterHinweis:
      'Off: no tip appears any more. The selection below is kept and applies again as soon as ' +
      'you tick the box.',
    alleEin: 'Turn all on',
    schliessen: 'Close',
  },
  themen: {
    blatt: {
      name: 'New sheet or new drawing',
      titel: 'New sheet: turning it into a basis for planning',
      text: [
        'A new floor plan is still empty. These steps take you from the empty sheet to a plan ' +
          'on which you can place components – not every step is needed for every plan.',
        '',
        '1. **Choose paper size and scale.** In the **Set up print area** dialog you set the ' +
          'paper size and scale you will print at. You can change it later with ' +
          '{{befehl:blatt.zeichenflaeche-einrichten}}.',
        '2. **Load the background.** {{befehl:datei.import-hintergrund}} loads the layout as a ' +
          'PDF, DXF or image.',
        '3. **Choose page and section (for a PDF).** A multi-page PDF asks for the page; if the ' +
          'plan fills only part of the page, drag a frame around the section to be used.',
        '4. **Hide what gets in the way.** {{befehl:werkzeug.hintergrund-ausblenden}} hides ' +
          'areas with a rectangle – legends, title block, neighbouring storeys. Nothing is ' +
          'deleted; {{befehl:blatt.hintergrund-ausblendungen}} brings areas back.',
        '5. **Calibrate if needed.** If the plan says “Not calibrated”, choose ' +
          '{{befehl:werkzeug.kalibrieren}}, click both ends of a known distance (such as a ' +
          'dimension chain) and enter the real length. Only then do lengths, cable lengths and ' +
          'scale come out right.',
        '6. **Convert components – or draw walls.** From an IFC model, ' +
          '{{befehl:blatt.ifc-bauteile}} takes over walls, doors and windows; for a vector ' +
          'plan, {{befehl:blatt.hintergrund-umwandeln}} turns the lines into drawing elements. ' +
          'If neither is possible, draw them yourself: {{befehl:werkzeug.wand}}, ' +
          '{{befehl:werkzeug.tuer}}, {{befehl:werkzeug.fenster}} and {{befehl:werkzeug.raum}}.',
        '7. **Set the origin.** {{befehl:werkzeug.nullpunkt}} sets the reference point for ' +
          'coordinates, grid and snapping. Click a corner of the building, then click again ' +
          'along an outer wall. With several storeys, use the same corner on every sheet: only ' +
          'then can {{befehl:blatt.ausrichten}} stack the sheets on top of each other.',
      ].join('\n'),
    },
    verteiler: {
      name: 'Distribution board placed',
      titel: 'Distribution board: set up its contents and link it to a diagram',
      text: [
        'A distribution board gets a location designation such as **+UV1** when you place it. ' +
          'What it contains – fuses, RCDs, terminals – you set up afterwards in the ' +
          'distribution board dialog.',
        '',
        '1. **Open the dialog.** Double-click the distribution board, or **Board layout and ' +
          'assignment …** in the properties panel.',
        '2. **Link it to an existing diagram.** If you have already drawn the distribution ' +
          'board diagram as a schematic: **Assign existing schematic …**. From then on the ' +
          'diagram decides which equipment the board has.',
        '3. **Create it from the floor plan.** Without a diagram of your own, **Suggest board ' +
          'layout from rooms …** proposes circuit breakers and terminals from the rooms and ' +
          'the circuit of the components you placed. **Create distribution board diagram …** ' +
          '(also {{befehl:datei.verteilerplan-assistent}}) turns that into the schematic.',
        '4. **Build the tree.** The layout is a tree of the current path: supply, upstream ' +
          'fuse, RCD, circuit breaker, terminal. **+** in a row attaches something behind it; ' +
          'dragging rearranges.',
        '5. **Change and delete.** Rows can be moved and removed in the tree, and every change ' +
          'can be undone. With a linked diagram you change the equipment in the diagram; you ' +
          'can remove the link at any time.',
        '6. **Connect cables.** When a cable later ends at the distribution board, a dialog ' +
          'asks which terminal it lands on.',
      ].join('\n'),
    },
    trunk: {
      name: 'Laying a trunk',
      titel: 'Trunk: one route for many cables',
      text: [
        'A trunk bundles cables on a shared route – cable tray, channel, riser.',
        '',
        '1. **Click the route.** Point by point like a polyline. **Shift** snaps to 45°, ' +
          '**Backspace** takes back the last point.',
        '2. **Start at a device.** Switches, patch panels and distribution boards have their ' +
          'own trunk points (top, bottom, sides). Clicking one attaches the trunk end to the ' +
          'device; otherwise the end stays free.',
        '3. **Finish.** **Enter** or a double-click ends the trunk, **Esc** discards it.',
        '4. **Choose design and zone in advance.** The bar above the print area sets which ' +
          'design and installation zone new trunks get.',
        '5. **Continue.** Trunks can be joined into a chain, even across several sheets. ' +
          'Between storeys, use the cable riser.',
        '6. **Insert cables.** Afterwards, use {{befehl:werkzeug.leitung}} to draw the cables ' +
          'through the trunk.',
      ].join('\n'),
    },
    leitung: {
      name: 'Route cables',
      titel: 'Route cables',
      text: [
        'A cable connects two connection points. el.esy.CAD finds the route itself, but you ' +
          'can also guide it.',
        '',
        '1. **From connection point to connection point.** Click the connection point of the ' +
          'first component, then that of the second. Hold **D** to show all connection points.',
        '2. **Guide the route yourself.** Click free points before the target: the cable runs ' +
          'exactly there, and el.esy.CAD only finds the last stretch itself.',
        '3. **On walls.** If a component hangs on the wall, the cable comes out of the wall. ' +
          'Under **Routing** in the settings, **wall routing** makes cables run along walls ' +
          'by preference.',
        '4. **Zone, SM/FM and cable type in advance.** The bar at the top right above ' +
          'the drawing sets what new cables get. You manage the zones under ' +
          '{{befehl:katalog.installationszonen}}.',
        '5. **Through a trunk.** Click the trunk first (entry), then the exit. Inside the ' +
          'trunk, the **space bar** opens the dialog for the destination – switch, patch ' +
          'panel, cable riser or distribution board.',
        '6. **Adjust afterwards.** A selected cable shows handles at its ends and bends; a ' +
          'right-click offers the cable type, among other things.',
      ].join('\n'),
    },
    komponente: {
      name: 'Placing components',
      titel: 'Placing components',
      text: [
        '1. **Choose a product.** The component picker opens by itself. The search field ' +
          'filters by name and article number; if the product has variants, choose one below.',
        '2. **Place.** Click in the plan. The **space bar** rotates by 90° before the click. ' +
          'The tool stays active – every further click places another copy, **Esc** ends.',
        '3. **On the wall.** In a floor plan, components snap to walls; with a vector plan ' +
          'also to the lines of the background. Up to five form a combination side by side ' +
          'there.',
        '4. **Mounting height.** In the context bar at the bottom, **−** and **+** set the ' +
          'height of the next components. Each height forms its own row at the wall.',
        '5. **Mounting location and SM/FM.** In the properties panel you set whether a ' +
          'component sits on the ceiling, wall or floor, and whether it is surface-mounted ' +
          '(SM) or flush-mounted (FM).',
        '6. **Label.** Click it with the selection tool and enter a text under **Label** in ' +
          'the properties panel. Several selected components can be changed together.',
      ].join('\n'),
    },
    verbraucher: {
      name: 'Placing loads',
      titel: 'Load: place, name, control',
      text: [
        'A load – a luminaire, for example – is switched by control devices. To make that work ' +
          'later, it pays to set it up properly right away.',
        '',
        '1. **Place.** Click in the plan. At a wall it snaps to the wall; in a room you place ' +
          'it freely.',
        '2. **Rotate.** Before the click, the **space bar** rotates by 90°; later the handle on ' +
          'the selected component rotates it freely.',
        '3. **Name.** In the properties panel under **Label** (“Sink”, “Ceiling light ' +
          'hallway”). The name appears in the plan and in the lists.',
        '4. **Choose the control type.** In the panel under **Control**: switching, dimming, ' +
          'DALI and so on. It decides which control devices and actuator channels fit.',
        '5. **Form groups.** Select luminaires that always switch together with Ctrl + click ' +
          '(Cmd + click on a Mac) and right-click to **Create device group from selection**. ' +
          'The dialog asks for name, control and the **KNX** tick.',
        '6. **Connect.** Which switch operates it is set at the control device – via the cable ' +
          'or with {{befehl:werkzeug.wirkverbindung}}.',
      ].join('\n'),
    },
    befehlsgeraet: {
      name: 'Placing control devices',
      titel: 'Control device: set slots and connect',
      text: [
        'A control device – switch, push-button, KNX push-button sensor – operates loads or ' +
          'groups through its **slots** (rockers, buttons, channels).',
        '',
        '1. **Place.** Click in the plan, rotating with the **space bar** first.',
        '2. **Set slots.** In the properties panel the slots appear as a matrix like the ' +
          'rockers in a frame. Here you set number and names; on some devices the number ' +
          'comes from a text field, such as the number of rockers.',
        '3. **Connect conventionally.** Draw the cable from the switch to the load: ' +
          'el.esy.CAD asks which slot acts and proposes a name from room and control ' +
          '(“Light hallway”).',
        '4. **Connect without a cable.** {{befehl:werkzeug.wirkverbindung}}: click the control ' +
          'device, choose the slot if there are several, then click all targets and finish ' +
          'with **Enter**.',
        '5. **Group.** If a slot gets more than one target, el.esy.CAD combines them into a ' +
          '**device group** and asks for name, control and the **KNX** tick.',
        '6. **Check.** The selected control device shows dashed lines to its targets. All of ' +
          'it at a glance: {{befehl:werkzeug.steuerungslogik}}.',
      ].join('\n'),
    },
    dreid: {
      name: '3D view',
      titel: '3D view of the plan',
      text: [
        'The 3D view shows the plan in space – to check that mounting heights, installation ' +
          'zones and risers are right.',
        '',
        '1. **Operate.** Dragging rotates, the mouse wheel zooms, **Fit to view** shows ' +
          'everything again.',
        '2. **Storeys.** The sheets stack by their level. On the left you hide storeys and ' +
          'set how transparent walls and ceilings are. You manage the heights under ' +
          '{{befehl:blatt.etagen}}.',
        '3. **Congruent.** For the storeys to stand exactly on top of each other, set the same ' +
          'origin on every sheet and align them with {{befehl:blatt.ausrichten}}.',
        '4. **Building.** Walls, doors, windows, stairs and rooms appear as far as you have ' +
          'drawn them. Without them you only see the devices and cables.',
        '5. **Cables.** They run with all their vertical sections. Switch on **Only in wall, ' +
          'ceiling or floor** on the sheet so they do not run freely through the rooms.',
      ].join('\n'),
    },
  },
}
