# Workflows

The other chapters describe each function on its own. This chapter shows how they work together in
practice: eleven typical tasks, each followed from start to finish using one continuous example.
Where a detail matters, a cross-reference leads to the relevant chapter.

The example is a small flat with a hallway, bathroom, kitchen, living/dining room and bedroom, 11 ×
8 m, as a floor plan at 1:50. Only the electrical installation is planned: switches, socket outlets,
luminaires, a sub-distribution board and, for building control, a KNX push-button sensor.

| Workflow | Purpose |
|---|---|
| [Import a plan, place components and name them](#ablauf-bauplan-einfach) | Quickly create an installation plan on an existing floor plan |
| [Draw a schematic by hand](#ablauf-schaltplan) | Draw a circuit diagram yourself |
| [Trace a plan and populate it](#ablauf-nachzeichnen) | Turn a plan (including a scan) into real walls, doors, windows and rooms |
| [Vector PDF: snap and convert](#ablauf-vektor-pdf) | Take over a CAD plan supplied as a PDF with precision |
| [Connect a distribution board to your own schematic](#ablauf-verteiler-schaltplan) | Attach a distribution board diagram you have drawn yourself to the distribution board in the floor plan |
| [Distribution board and diagram from the rooms](#ablauf-aus-raeumen) | Generate the distribution board and its diagram automatically from the plan – without a single cable |
| [Distribution board diagram from the board tree](#ablauf-baum) | Put the distribution board together yourself and generate the diagram from it |
| [Route cables and trunks, generate the diagram](#ablauf-leitungen) | Route cables by hand, connect them to terminals and generate the diagram from them |
| [Connect control devices and loads](#ablauf-wirkverbindungen) | Define which switch or KNX push-button controls which luminaire |
| [Align storeys and view them in 3D](#ablauf-etagen-3d) | Lay several storeys exactly on top of one another |
| [Revise a generated distribution board diagram](#ablauf-nacharbeiten) | Add to a generated diagram by hand and keep it up to date |

## Import a plan, place components and name them {#ablauf-bauplan-einfach}

The shortest way to an installation plan: the floor plan stays as it is, and the components go
straight onto it. Walls, rooms and cables are not needed for this.

**1. Create the project and drawing.** In the project overview ({{befehl:datei.projekte}}), add a
customer and a project, and in it **New drawing …** with the type **Floor plan** – see [Floor plan
or schematic](#zeichnungsart).

**2. Import the plan.** {{befehl:datei.import-hintergrund}} and choose the file. For a PDF, choose
the page and, if necessary, a section ([Import a plan](#plan-einlesen)). Then **Set up print area**
opens: set the format and the scale you want to print at later – for the example flat, A3 landscape
at 1:50.

**3. Bring to scale.** Use {{befehl:werkzeug.kalibrieren}} to click the two ends of a known distance
– here the dimension line “11.00” below the floor plan – and enter its true length in centimetres
(1100). The note “Not calibrated” disappears, and the status bar reports “Plan detected at scale
1:50” – the print area stays at A3 landscape 1:50 ([Standard scale](#kalibrieren)).

![Calibrating: the measured distance is given its true length](ablauf-bauplan-kalibrieren.png)

**4. Place components.** {{befehl:werkzeug.komponente}} opens the component picker. In the catalogue
**Electrical installation** you find switches, socket outlets, luminaires and distribution boards;
the search field finds “socket outlet” or “two-way switch” at once. Choose a product, **Place**, and
click on the plan – the tool stays active, and every further click places another copy. The Space
bar rotates by 90° before the click. In the context bar at the bottom, use **−**/**+** to choose the
mounting height of the next components (see [Combinations per height](#wandfang)).

With a vector plan (PDF from a CAD program, DXF), the components snap to the lines of the walls, as
to drawn walls. On a scanned plan, you place them freely at the wall edge.

**5. Name.** Click the component with the selection tool and, in the Properties panel under
**Label**, enter a text such as “Sink” or “Cooker”. If several components are selected (Ctrl +
click, Cmd + click on a Mac, or drag a frame), the panel shows their shared fields – so you can set
height, mounting location or AP/UP for all of them at once ([Change several components at
once](#installationshoehe)). If a symbol has its own text fields, fill them in under **Texts**
([Text on the symbol](#texte-ausfuellen)).

![The label in the Properties panel](ablauf-bauplan-beschriftung.png)

**6. What is shown on the symbol.** Under **Sheet › Show labels** you switch individually whether
the product name ({{befehl:blatt.anzeige-bezeichnung}}), your label and the mounting height
({{befehl:blatt.anzeige-installationshoehe}}) appear on the plan. In the picture below, product name
and height are hidden – what remains are the symbols with your labels and, at the distribution
board, its reference designation “+UV1”. If a label covers a neighbouring symbol, drag it with the
mouse to a free spot.

![Hallway and kitchen: components on the imported plan, labelled](ablauf-bauplan-komponenten.png)

**7. Evaluate and print.** {{befehl:werkzeug.stueckliste}} places the bill of materials on the sheet
([Bill of materials](#stueckliste)); {{befehl:datei.drucken}} or {{befehl:datei.export-plan}} output
the print area ([Printing](#drucken)).

## Draw a schematic by hand {#ablauf-schaltplan}

A circuit diagram is created in its own drawing of the type **Schematic**. The example shows a small
sub-distribution board: a four-pole residual current device (RCD), three circuits with one outgoing
terminal each.

![A distribution board diagram drawn by hand](ablauf-schaltplan-blatt.png)

**1. Create the drawing.** In the project overview, **New drawing …** with the type **Schematic**.
Each sheet is then DIN A4 landscape at 1:40, with the [reference grid](#koordinatennetz) A–H/1–6 and
a fixed grid of 24 cm. Instead of walls and cables, the sidebar offers the tools for wires and
potentials.

**2. Place symbols.** {{befehl:werkzeug.komponente}} and choose the catalogue **Circuit diagram
symbols** ([Overview](#stromlaufplan-symbole)). Each symbol hangs from its first contact and snaps
to the grid ([snap point](#fangpunkt)): if you place symbols one below another, their contacts line
up exactly, and the connections run without a kink. The program assigns the reference designations
itself – -F1, -F2 … for protective devices, X1:1, X1:2 … for terminals ([Reference
designations](#kennzeichen), [Terminal strip](#klemmen)).

**3. Supply.** With {{befehl:werkzeug.potential}} place the potentials L1, L2, L3, N and PE at the
edge. Potentials of the same name count as connected across the whole drawing
([Potentials](#potential)).

**4. Connect.** {{befehl:werkzeug.schaltverbindung}}: click one contact, then the next – the wire is
routed horizontally and vertically around the symbols. For several conductors at once, set the
number of cores beforehand with the number keys **2–5**; the further cores run at the contact
spacing and dock automatically ([wire](#schaltverbindung)). A bus line gets its **Name** (L1, N, PE)
in the Properties panel.

**5. Branch.** When drawing, click on an existing wire: a junction is created there, and the new
wire takes over its name – so the circuit breakers hang on L1, L2 and L3, and the terminals on N and
PE ([branch](#schaltverbindung)).

![Detail: RCD, bus lines with junctions, circuit breakers and outgoing terminals](ablauf-schaltplan-detail.png)

**6. Check.** The [equipment list](#betriebsmittelliste) ({{befehl:werkzeug.betriebsmittelliste}})
lists all reference designations with their location and warns about duplicates; the [potential
list](#potentialliste) ({{befehl:werkzeug.potentialliste}}) shows potentials that occur only once.
If the circuit continues on another sheet, a **Sheet reference** and an **Interruption point** join
the ends across the sheets.

If this diagram is to belong to a distribution board in the floor plan, continue with [Connect a
distribution board to your own schematic](#ablauf-verteiler-schaltplan).

## Trace a plan and populate it {#ablauf-nachzeichnen}

If you draw walls, doors, windows and rooms as real building elements, you get more than a picture:
rooms with area and name, components that snap to the wall, cables that run along the wall, the
distribution board populated from the rooms, the 3D view and the IFC export. This works with any
plan, even a scan.

**1. Import and calibrate the plan** as in [Workflow 1](#ablauf-bauplan-einfach).

**2. Set the origin.** {{befehl:werkzeug.nullpunkt}}: first click the lower left outer corner, then
a point along the lower outer wall. Coordinates in the status bar are then counted from this corner
– and further storeys can later be aligned to the same corner ([Origin](#nullpunkt)).

**3. Draw walls.** The outer walls are fastest with {{befehl:werkzeug.wandrechteck}}: set the wall
thickness in the bar at the top right (here 0.30 m), then click two opposite outer corners – the
walls lie inside the rectangle you have drawn. Draw inner walls with {{befehl:werkzeug.wand}} (set
the thickness beforehand to 0.115 m): a click on an existing wall joins there, and the joint is
cleanly trimmed ([Draw walls](#waende-zeichnen)). The wall lies with its **axis** on the points you
click.

![Tracing: outer walls and first inner walls are in place, the next wall is in progress](ablauf-nachzeichnen-waende.png)

**4. Doors and windows.** {{befehl:werkzeug.tuer}} and {{befehl:werkzeug.fenster}}: set the width
(and, for a window, the sill height) in the bar at the top right, then click on the wall. The
opening follows the wall; change the hinge side and the opening direction in the Properties panel
([Doors and windows](#tueren-und-fenster)).

**5. Rooms.** {{befehl:werkzeug.raum}} and click in each area. Name and area appear on the plan;
enter the name in the Properties panel ([Rooms](#raeume)).

**6. Check.** {{befehl:ansicht.hintergrund}} hides the plan – now you can see whether everything has
been traced. If the plan is simply too strong, the **Background** slider at the top right reduces
its opacity ([Visibility and opacity](#hintergrund-sichtbarkeit)).

![Traced: walls, doors, windows and rooms without the background](ablauf-nachzeichnen-raeume.png)

**7. Storey data.** If nothing is selected, the Properties panel shows under **Storey** the level,
clear room height, ceiling thickness and installation zone – the basis for cable lengths and 3D
([Storey data](#geschossangaben)).

**8. Populate.** Move with {{befehl:werkzeug.komponente}} to the wall: the component snaps to the
wall, with its top side facing the wall. Further components at the same height join next to it as a
**combination** (dotted frame, up to five); a different height forms a row of its own in front.
Choose the height of the next components before the click with **−**/**+** in the context bar.
Ceiling luminaires are placed freely in the room; they bring the mounting location **Ceiling** from
the catalogue ([Combinations per height](#wandfang), [Mounting location](#installationshoehe)).

![Bedroom and bathroom: switches, socket outlets and luminaires on the walls, combination at the bed](ablauf-nachzeichnen-komponenten.png)

## Vector PDF: snap and convert {#ablauf-vektor-pdf}

A PDF created by a CAD program contains real lines rather than an image. Object snap works on these:
wall corners, edges and intersections become snap points, and you trace with millimetre accuracy
without measuring.

> el.esy.CAD does not recognise walls, doors and rooms in a PDF by itself – they are created by
> tracing with snap. Finished building elements are taken over from an IFC model ([Take over
> building elements from IFC](#ifc-bauteile)).

**1. Import and calibrate** as in [Workflow 1](#ablauf-bauplan-einfach). Even a CAD plan drawn to
scale comes in without a scale and needs calibrating – best on a long distance such as the outer
wall.

**2. Switch snap on.** {{befehl:ansicht.objektfang}} must be on; {{befehl:ansicht.hintergrundfang}}
is on by default. Both switches are also at the top of the Properties panel. A green square at the
pointer shows that a point of the plan has been snapped ([Snap to the
background](#hintergrundfang)).

![Wall as rectangle: the second click snaps to the outer corner of the plan](ablauf-vektor-fang.png)

**3. Trace with snap.** Use {{befehl:werkzeug.wandrechteck}} to click the two outer corners of the
plan – the rectangle then has exactly the outer dimension. Because a wall lies with its axis on the
clicked points, for an inner wall you snap to the midpoint between its two faces: in the **Snap**
drop-down menu, switch on the snap mode **Midpoint** and click on the short end face of a wall, for
example next to a door opening – its midpoint lies exactly on the axis ([Object snap](#objektfang)).
Set doors, windows and rooms as in [Workflow 3](#ablauf-nachzeichnen).

**4. Convert the plan (if needed).** If you want to edit lines of the plan itself – move a wall,
delete a legend – {{befehl:blatt.hintergrund-umwandeln}} turns the plan into drawing elements. A
dialogue next to the plan states the number of lines beforehand and shows them in colour. They land on the layer **“Floor plan (converted)”**,
which you can lock or hide in {{befehl:blatt.ebenen}}; the PDF background stays on the sheet but is
hidden. Text and fills are not carried over ([Convert the plan](#hintergrund-umwandeln)).

![Convert background: 188 lines become drawing elements](ablauf-vektor-umwandeln.png)

**5. Populate.** Components snap to the lines of the plan just as they snap to drawn walls – even
without traced walls. For rooms, populating from rooms and the 3D view, however, you need real
walls.

## Connect a distribution board to your own schematic {#ablauf-verteiler-schaltplan}

You have drawn the circuit diagram of the distribution board yourself ([Workflow
2](#ablauf-schaltplan)) and want to connect it to the distribution board in the floor plan – so that
later every cable lands on its terminal, and the diagram shows under each terminal which cable goes
where.

**1. Place the distribution board.** In the floor plan, from the catalogue **Electrical
installation**, place the “Distribution board / control cabinet” on the wall. It receives the
location designation **+UV1** ([Distribution board](#verteiler)).

**2. Assign the plan.** Double-click the distribution board to open the distribution board dialogue.
**Assign existing schematic …** lists the schematics of the project; choose your own diagram and
click **Assign**. The designation +UV1 then appears in the schematic under **Distribution board
diagram for** – there you can also enter or remove the assignment ([Linking the distribution board
diagram](#verteilerplan)).

![Assigning your own schematic to the distribution board](ablauf-verteiler-zuordnen.png)

**3. Place equipment.** From now on the diagram determines which equipment the distribution board
has. Whatever is in the diagram but has no place yet in the board's tree is listed under **Not
placed yet**.

![The distribution board dialogue after assignment: the equipment from the diagram waits for its place](ablauf-verteiler-einordnen.png)

Drag each piece of equipment to its place in the circuit path: the RCD onto the **Supply**, the
circuit breakers onto the RCD, and each terminal (“-X1:1”, “-X1:2” …) after its circuit breaker.
Where you drop a row is decided by its height: at the top means before it, at the bottom means after
it, in the middle means behind it ([Populate the board](#verteiler-bestueckung)).

![Placed: RCD, circuit breakers and terminals in the tree](ablauf-verteiler-eingeordnet.png)

**4. Prepare for wiring.** In the **Phase** column enter the outer conductors, and under **Label**
enter for each terminal what it supplies (“Kitchen sockets”). The label appears in the diagram as
the first line at the terminal, and when connecting a cable you find the terminal by searching for
this word.

**5. Later: connect cables.** If a cable ends at the distribution board, the dialogue **Connect
cable … in distribution board +UV1** asks on which node it lands – see [Workflow
8](#ablauf-leitungen). Below the terminal in the diagram, the target designation then appears
automatically, for example “W9 · Socket outlet 1-gang” – or, instead of the catalogue name, the
label of the component. Assignment is always done in the floor plan; the diagram only reads.

## Distribution board and diagram from the rooms {#ablauf-aus-raeumen}

If a populated plan with rooms exists ([Workflow 3](#ablauf-nachzeichnen)), el.esy.CAD generates
the distribution board and from it the distribution board diagram – with no cable drawn at all. The
basis is the property **Circuit** of each component.

**1. Check the circuits.** Select a component: in the Properties panel, under **Circuit**, you see
which circuit it belongs to ([Populating from rooms](#verteiler-aus-raeumen)):

- **Default** – for socket outlets and luminaires the room circuit, for switches and push-buttons no
  circuit. The cooker connection unit brings **own circuit, 3~** from the catalogue.
- **Number 1 … 99** – a further circuit in the room, for example “Kitchen 1” for the worktop.
- Small rooms share one circuit via **Room circuit shared with** in the properties of the room.
- Tick **KNX** next to the control for loads that are switched via KNX – they receive an actuator
  channel.

![The cooker connection unit: own circuit, three-pole](ablauf-raeume-stromkreis.png)

**2. Suggest.** Place the distribution board (as in [Workflow 5](#ablauf-verteiler-schaltplan)),
double-click it, and choose **Suggest board layout from rooms …**. The dialogue shows the rooms with
ticks, the type (main or sub-distribution board), the supply, one RCD per sheet and the types. The
table below names for each circuit the components and the result, for example “F4 / X1:3”.

![Suggest board layout from rooms: one circuit per room, the cooker with its own](ablauf-raeume-vorschlag.png)

**3. Accept.** The distribution board dialogue shows the resulting tree: supply terminal, RCD, for
each circuit a circuit breaker with a terminal, and the labels from the room names. Everything in it
remains editable ([Populate the board](#verteiler-bestueckung)).

![The suggested tree in the distribution board dialogue](ablauf-raeume-baum.png)

**4. Assignment at the components.** Each component now knows its circuit, even though no cable
leads to the board: the symbol reads “UV1-F4 / X1:3”, and the Properties panel shows the whole chain
([Circuit at the components](#stromkreis-zuordnung)). Switch the display off with
{{befehl:blatt.anzeige-stromkreis}}.

![Kitchen: the symbol shows the circuit from the distribution board](ablauf-raeume-zuordnung.png)

**5. Generate the diagram.** In the distribution board dialogue, choose **Create distribution board
diagram …**. In its last step the wizard suggests reference designations and names, asks how many
fuses and terminals may appear on one sheet at most and how an RCD is divided if it no longer fits
on a sheet, and shows all sheets as a preview ([Generate distribution board
diagram](#verteilerplan-erzeugen)).

![The last step of the distribution board diagram wizard, with preview](ablauf-raeume-assistent.png)

**6. Result.** **Create** places the diagram as a new drawing in the project and links it to the
distribution board via +UV1. Sheet 1 contains the supply, the following sheets the circuits with
busbars in core colours, circuit breakers and terminals; below each terminal stands the target
designation.

![Sheet 2 of the generated distribution board diagram](ablauf-raeume-plan.png)

If the planning changes, suggest the board layout again: what already exists stays, what is new is
added, and what is no longer used is ready for removal. Afterwards el.esy.CAD asks whether the
linked diagram should be generated again – see [Workflow 11](#ablauf-nacharbeiten).

## Distribution board diagram from the board tree {#ablauf-baum}

Instead of starting from rooms, you put the distribution board together yourself – as a tree that
shows the circuit path: supply → RCD → circuit breaker → terminal. From this, the wizard generates
the diagram.

**1. Create the tree.** Double-click the distribution board. The **+** at a row adds something after
it:

- **Equipment after it …** – a symbol from the catalogue and the number, for example two RCDs at the
  supply,
- **Circuits after it …** – number, protective device and terminal: four circuit breakers, each with
  an outgoing terminal, after the first RCD, phases in turn,
- **Channel after it …** – a channel of a switching actuator.

![The menu at the “+” of a row](ablauf-baum-menue.png)

**2. Edit.** In each row you change the reference designation, type (B16, C16 …), phase and
**Label** – at the terminal, for example “Kitchen sink”. With the handle ⠿ you drag a row to another
position, **✕** removes it. **Renumber** counts a terminal strip through without gaps ([Populate the
board](#verteiler-bestueckung)).

![The finished tree: two RCDs with seven labelled circuits](ablauf-baum-fertig.png)

**3. Generate the diagram.** **Create distribution board diagram …** opens the wizard; in its last
step you check the reference designations, names, split and preview, and click **Create**.

![Wizard with a preview of the sheets](ablauf-baum-assistent.png)

Sheet 1 shows the supply with the bus L1, L2, L3, N and PE, the other sheets the circuits per RCD.
The labels from the tree appear at the symbols.

![Sheet 1: the supply](ablauf-baum-einspeisung.png)

![Sheet 2: the circuits of the first RCD](ablauf-baum-plan.png)

**Without any floor plan:** in the project overview, **Distribution board diagram wizard…**
({{befehl:datei.verteilerplan-assistent}}) starts with the question about the content. **Compose
from scratch** leads to the starting tree: main or sub-distribution board, supply, supply terminal,
number of RCDs and number of circuit breakers per RCD. After that comes the same tree as above.

![Wizard: the starting tree when composing from scratch](ablauf-baum-startbaum.png)

## Route cables and trunks, generate the diagram {#ablauf-leitungen}

In a populated floor plan you route the cables yourself – each with its own path, bundled into
trunks – and assign each one to a terminal in the distribution board. From this comes a distribution
board diagram that names the actual cables for every terminal.

**1. Populate the distribution board.** Set up the tree as in [Workflow 7](#ablauf-baum), with a
label for each terminal (“Kitchen sockets”, “Hallway” …).

**2. Trunk from the board.** {{befehl:werkzeug.trunk}}: start at the distribution board – trunks
dock at the top, bottom and sides in the middle – click waypoints, then **Enter**. In the example
the trunk runs through the hallway and along the kitchen wall ([Create a trunk](#trunk-anlegen)).

**3. Draw cables.** {{befehl:werkzeug.leitung}} onto the connection point of the first socket
outlet, then onto the trunk (entry), then – within the trunk – onto the exit at the distribution
board. If the cable runs through a trunk to which a distribution board is attached, the **Space
bar** opens the dialogue “Choose cable target” with the category **Distribution board** ([Put cables
into the trunk](#leitung-in-trunk)). If a cable ends directly at a connection point of the
distribution board, the dialogue asks at once.

![Choosing the cable target: searching for “flur” (hallway), terminal X1:4](ablauf-leitungen-ziel.png)

The search field only leaves matching nodes; choose the terminal. Below it stands the derived chain,
for example “X1:4 → F5 · RCD F1 · L1” ([Connect cables in the distribution
board](#verteiler-anschliessen)). You loop further socket outlets through from one socket outlet to
the next – they thereby belong to the same circuit.

**4. Check.** The cable label shows the target, for example “9 → UV1-X1:4 (F5)”; the symbol shows
the circuit ({{befehl:blatt.anzeige-stromkreis-schild}}, {{befehl:blatt.anzeige-stromkreis}}). The
[cable list](#leitungsliste) has a **Circuit** column; the [circuit
schedule](#stromkreisverzeichnis) sums everything up per distribution board.

![Hallway and kitchen: trunk, cables with target labels, distribution board +UV1](ablauf-leitungen-plan.png)

**5. Generate the diagram.** In the distribution board dialogue, choose **Create distribution board
diagram …** as in [Workflow 6](#ablauf-aus-raeumen). Below each terminal now stand the cables from
the floor plan, written vertically: cable number, cable type (if set) and target.

![The generated diagram: below the terminals the cables from the floor plan](ablauf-leitungen-verteilerplan.png)

The target designations follow the floor plan even after generation: a new cable on X1:2 appears in
the diagram without your having to generate it again.

## Connect control devices and loads {#ablauf-wirkverbindungen}

Which switch controls which luminaire is not a cable but a **control assignment**: from a slot of
the control device (button, rocker, channel) to a load or a device group. You connect conventional
switches via the cable; KNX push-buttons without one ([Control assignments](#wirkverbindungen)).

**Conventional – via the cable.** Draw the cable from the two-way switch in the hallway to the
luminaire as usual. Because both have a device type, el.esy.CAD asks what should follow from it:
which slot of the switch acts on the luminaire and what it is called – suggested from room and
control, “Light hallway”. If further switches hang on the cable (two-way or intermediate switching),
they appear below with their own slot choice ([When routing the cable](#wirkverbindungen)).

![After the cable from switch to luminaire: create control assignment](ablauf-wirk-leitung.png)

**KNX – with the tool.** {{befehl:werkzeug.wirkverbindung}}, then click the push-button sensor. If
it has several slots, choose the slot.

![Choosing the slot on the KNX 4-fold push-button sensor](ablauf-wirk-slot.png)

Then click all the luminaires that this button is to switch, and finish with **Enter**. If a slot
receives more than one target, el.esy.CAD combines the targets into a **device group** and asks for
name, control and the **KNX** tick box ([Device groups](#geraetegruppen)).

![Creating a device group: both luminaires in the living room, switched via KNX](ablauf-wirk-gruppe.png)

**Check.** Select the push-button sensor: dashed lines lead to its targets, and next to the symbol a
small graphic shows its slots. A click on a slot highlights its loads in yellow. You see all
assignments in tabular form in the [slot matrix](#slot-matrix), and on the plan in the [control
logic](#steuerungslogik) ({{befehl:werkzeug.steuerungslogik}}). You reach targets on another storey
by changing the sheet while the tool is active ([Across storeys](#wirkverbindungen)).

![The selected push-button sensor with its control assignments](ablauf-wirk-knx.png)

**Assign KNX actuators.** Once the distribution board is populated ([Workflow
6](#ablauf-aus-raeumen) or [Workflow 7](#ablauf-baum)), **Assign KNX actuators …** in the
distribution board dialogue opens the list of all terminals whose loads are switched via KNX. For
each terminal the dialogue suggests channel type and channel names and, with the spare capacity you
set, uses as few actuators as possible ([Assign KNX actuators](#knx-zuordnen)). In the generated
distribution board diagram, each channel appears as a contact between circuit breaker and terminal;
the actuators themselves are on their own actuator sheets. The [actuator channel
list](#aktorkanalliste) ({{befehl:werkzeug.aktorkanalliste}}) sums everything up.

![Assign KNX actuators: the luminaire group gets channel A1 of a new switching actuator](ablauf-wirk-aktoren.png)

## Align storeys and view them in 3D {#ablauf-etagen-3d}

Each storey is a sheet of its own with its own plan. So that the storeys line up in the 3D view, in
the IFC export and at the cable riser, align them to a common point.

**1. One sheet per storey.** Double-click the tab to rename it (“Ground floor”). **+ Sheet › Empty
sheet** creates the next one (“Upper floor”); further right means further up ([Sheets](#blaetter)).
If the ground floor is already drawn, **Insert storey above …** copies its walls, rooms and stairs
along with it ([Insert storeys](#etagen)).

**2. Import and calibrate the plan on each sheet.** For a multi-page PDF, choose the page of the
storey in the dialogue.

![The second page of the PDF for the upper floor](ablauf-etagen-pdf-seite.png)

**3. Set the origin on each sheet.** {{befehl:werkzeug.nullpunkt}} on the **same building corner**,
and with the second click along the **same outer wall** – on every sheet, even if the plan sits
differently on the paper or was scanned at a slant.

**4. Align.** {{befehl:blatt.ausrichten}} shows all sheets with origin and direction. **Align**
rotates and moves each selected sheet so that its origin lies at 0,0 and the edge is horizontal –
then the storeys lie exactly on top of one another ([Lay sheets on top of one another](#nullpunkt)).

![Aligning sheets at their origin](ablauf-etagen-ausrichten.png)

**5. Draw.** Walls, doors, windows and rooms per storey as in [Workflow 3](#ablauf-nachzeichnen) or
[Workflow 4](#ablauf-vektor-pdf), then the components.

**6. Set heights.** {{befehl:blatt.etagen}} shows all storeys from top to bottom with level, clear
height, ceiling and the distance to the storey below. If you change a height, the other storeys can,
if you wish, move along with it ([Insert storeys](#etagen)).

![The storey overview: upper floor 2.85 m above the ground floor](ablauf-etagen-uebersicht.png)

**7. 3D view.** {{befehl:ansicht.dreid}} shows both storeys one above the other, with the devices at
their mounting height. Drag to rotate, the mouse wheel zooms, **Fit view** shows everything again;
on the left you hide storeys and set how transparent walls and ceilings are ([3D
view](#dreid-ansicht), add-on module BIM). Cables between the storeys are run through a [cable
riser](#kabelschacht).

![3D view: ground floor and upper floor one above the other](ablauf-etagen-3d.png)

## Revise a generated distribution board diagram {#ablauf-nacharbeiten}

A generated distribution board diagram is then an ordinary schematic drawing: you add to it, move
and delete in it as in a diagram you have drawn yourself. Some things remain linked to the floor
plan, others do not.

| Stays linked (follows the floor plan) | Fixed in the diagram |
|---|---|
| Target designations: the cables from the floor plan under the terminals | Symbols, connections and sheets |
| Labels of the population, as the first line at the symbol | What you add or rearrange yourself |
| Channel labels of the KNX actuators | |
| Which equipment the distribution board has – the diagram determines it | |

**1. Insert and remove components.** If you place a component from the catalogue directly onto a
connection – for example a contactor contact between circuit breaker and terminal – el.esy.CAD cuts
the connection at the upper contact and continues it from the lower one. The preview shows the
affected connection in blue beforehand. If you delete such a component again, the connection becomes
continuous again ([Placing components in wires](#schaltverbindung)).

![A contactor contact is looped into the cable to -X1:1 – the preview shows it in blue](ablauf-nacharbeiten-einschleifen.png)

**2. Edit connections.** Segments, junctions and handles work as in any schematic ([Segments and
junctions](#schaltverbindung)). For a tidy section, {{befehl:bearbeiten.automatisch-anordnen}} helps
([Arrange automatically](#automatisch-anordnen)).

**3. Adjust the target designation.** Dragging moves it. In the Properties panel of the symbol you
choose the position (horizontal, vertical, left of the symbol), the text height and, if needed, a
text of your own; **Automatic again** reverts this ([Linking the distribution board
diagram](#verteilerplan)).

![The target designation of a terminal in the Properties panel](ablauf-nacharbeiten-zielbezeichnung.png)

**4. Renumber terminals.** Change the reference designation and terminal number in the Properties
panel. **Right-click a terminal › Renumber terminal strip -X1** counts the whole strip through again
([Terminal strip](#klemmen)).

**5. If the board layout changes.** If a circuit is added in the floor plan, you have two ways:

- **Rework by hand:** place a circuit breaker and a terminal with the same reference designations as in the board layout into the diagram. The distribution board dialogue shows in grey what the diagram still lacks; the [equipment list](#betriebsmittelliste) reports reference designations that are assigned in the floor plan but missing in the diagram.
- **Generate again:** after **Suggest board layout from rooms …**, el.esy.CAD asks whether the linked diagram should be generated again. Its content is replaced in the process – your own changes in the diagram are lost, and Undo in the floor plan does not reach the diagram. If you have reworked a lot, it is therefore better to carry on by hand.
