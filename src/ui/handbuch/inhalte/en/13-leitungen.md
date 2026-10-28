# Cables

A cable connects two connection points. The program finds the route between them itself: it lays a grid over the sheet, avoids placed components and finds the shortest path (auto-routing). You can specify your own vertices at any time.

## Drawing a cable {#leitung-zeichnen}

{{video:05-leitungen}}

1. Select {{befehl:werkzeug.leitung}}.
2. Click the **connection point** of the first component (hold D to show all connection points).
3. Click the connection point of the second component.

That's it – the cable finds its own route, runs around components and leaves the device at right angles to the port instead of cutting across the housing.

![A cable between two components](leitung.png)

A cable always runs from the side towards the connection point nearest to it – at a contact on the bottom edge, therefore vertically from below. If a connection point lies inside a component, the cable is drawn over the symbol so that its last piece stays visible.

## Components on the wall {#leitung-an-der-wand}

If a component hangs on the wall ([combinations by height](#wandfang)), the cable comes out of the wall, as in the installation. The tool then offers only the connection points on the wall side; only these are shown and snapped to. If the component sits in a row further into the room, or the combination stands crosswise, the cable runs from the wall over the symbols in front of it.

**Surface-mounted and flush-mounted:** A surface-mounted component (SM, the default) stands 2 cm in front of the wall in the plan. The cable runs along the wall in this gap, 1 cm from the surface, and bends with a short piece into the connection point – also past the other components on the wall. A flush-mounted component (FM) sits flush with the wall; its cable comes out of the wall. You change the installation method in the properties panel of the component ([surface-mounted or flush-mounted](#verlegeart)).

- **All connection points:** Hold Alt and the other connection points are offered too. In the context bar, **All connection points** switches this on for the tool permanently until you leave it – this also works on the tablet.
- **Ports and terminals:** If the connection points have a meaning of their own (switch ports, terminals such as L, N, PE), they all stay selectable.
- **Existing cables:** If you place a connected component against the wall, or turn it so that another side faces the wall, its cables move to the next connection point on the wall side and are re-routed – in one undo step.

## Setting your own vertices {#leitung-stuetzpunkte}

If the cable is to take a particular route, click free points in between: up to there it runs exactly through your points, and only the last piece to the target is found automatically. This way you combine manual guidance and auto-routing in one cable.

- **Shift** held snaps the next free point to 45° steps from the last point.
- **Backspace** or **Del** (or a right-click) removes the last point you set.
- **Free end:** A double-click or **Enter** ends the cable at the last point, without a connection – for example for an outlet whose device is not yet decided. The start may also be free: click into the open area at the beginning instead of a connection point.
- **Esc** cancels the cable in progress.

A cable with its own vertices is saved without automatic routing: if you later move a connected component, it is moved along but not re-routed.

**Last piece straight:** Hold **Ctrl** (on a Mac, **control**) when you click the target connection point, the trunk or the cable riser, and this last piece is not routed either. It is drawn as a straight line from the last point – without evasion and without installation zones. The preview shows this as long as Ctrl is held. On the tablet, tap **Straight** in the context bar; it then applies to the next piece. A cable drawn this way keeps its course, like one with its own vertices.

Automatic routing can be switched off per cable in the properties panel; the cable then keeps exactly the course you drew.

## Wall routing {#wandfuehrung}

In the program settings under **Routing**, switch on **Wall routing**: cables then preferably run along the walls, at an adjustable distance. Walls may still be crossed anywhere – crossing only costs a surcharge, so the route along the wall usually wins. Switched off, routing behaves as before.

Further routing settings are the safety distance to components and the surcharges for changes of direction – if you want fewer corners, increase the surcharge.

This is how el.easy.CAD always routes cables:

- **Right angles only** – no diagonals, the way an electrician installs.
- **Parallel to the walls**, even if the plan was traced slightly skew: the routing follows the predominant wall direction of the sheet.
- **Side by side, not on top of one another:** If several cables run the same route, they lie next to each other at the set **spacing of parallel cables** (default 3 cm), away from the wall into the room. The short piece directly at the device stays shared.

Cables already laid can be brought up to this state with {{befehl:bearbeiten.leitungen-neu-verlegen}} (Draw menu, right-click on cables): the selected ones, or if none is selected, all cables on the sheet, in one undo step. Cables with their own vertices or with automatic routing switched off stay as they are.

A **window** is never crossed by a cable through the routing, whether wall routing is switched on or off: the cable crosses the wall next to the window. In front of the window, along the wall, it may run. Only to a device at the window itself, such as a window contact, does it lead up to this window. If the cable lies in a zone **below the sill** of the window, for example in the lower zone under a window with a 90 cm sill, it carries on there as in the wall – below the window there is wall after all.

## Choosing cable type and zone in advance {#kabeltyp-waehlen}

While the cable tool is active, a bar at the top right above the drawing shows what new cables receive:

- **Cable type:** the default cable type of the drawing. Change it there, without going to the settings. You maintain the list of types via {{befehl:katalog.kabeltypen}}.
- **Installation zone:** “as sheet” or a particular [zone](#leitung-zone). It applies to all cables you draw afterwards, until you reset it or open another drawing.
- **SM / FM:** switches to the same zone with the other installation method, for example from “Obere Zone auf der Wand (AP)” to “Obere Zone in der Wand”. If there is no zone of the same height with the other installation method, the button is greyed out.

For an existing cable, cable type and zone are in the properties panel. Quicker is the cable type via a right-click on the cable (also in the “Actions” row of the [context bar](#kontextleiste)) under **Cable type ▸**: at the top “No type” and the most recently used types, below them all active types by group. If several cables are selected, they all receive the same type. To change the cable types of a whole list at once, see [Cable list](#leitungsliste).

## Cable numbers and labels {#leitungsnummern}

Each cable automatically receives the next free number of the whole drawing – across all sheets, whether it runs through a trunk or not. A deleted cable frees its number again. The number appears as a small tag at the entry and exit of each trunk through which the cable runs; for a cable without a trunk, it sits in the middle of its route. A cable continued on the other storey via a [cable riser](#kabelschacht) keeps its number there. You enter your own text on the cable as a description in the properties panel. What appears on the plan – number, cable type, length – you switch under **Sheet › Show labels**.

## Cable lengths {#leitungslaengen}

The length of a cable results from its route, including the run through a [cable riser](#kabelschacht) across several storeys. A [calibrated](#kalibrieren) plan is required.

The **connection reserve per cable end** is the allowance for terminating; it is added at both ends of every cable. It applies to the whole drawing, not per cable, and is set in the properties panel of a selected [cable list](#leitungsliste) as well as in the program settings under **Cables & cable type**. The length including reserve appears in the cable list and in the Excel export.

If the sheets have [storey data](#geschossangaben) with an installation zone, the vertical pieces from the zone to the devices are added. They count only in the length including reserve (installation length); the length you can measure on the plan stays as it is. The properties panel of the cable names the height share separately.

## Installation zone of a cable {#leitung-zone}

Without its own setting, a cable runs in the installation zone of its sheet ([storey data](#geschossangaben)). You set a different one in two ways: in the properties panel under **Installation zone**, or in the [context bar](#kontextleiste) or the right-click menu under **Installation zone ▸**. The choices are the zones of the [storey data](#geschossangaben), each on and in ceiling, wall and floor. “As sheet” names the zone that currently applies; the tick in the menu marks the one you have set.

If you mark several cables – for example all socket circuits of a storey – the zone changes for all of them at once; if they carry different zones, the field shows “(different)”. If [trunks](#trunk-zone) are marked as well, they receive the same zone; other objects stay untouched.

The zone applies to the free stretches of the cable. In a [trunk](#trunk-zone) it lies in the zone of the trunk; where the zone changes, the vertical piece counts in the installation length. If a cable runs through a [cable riser](#kabelschacht), it has its own zone on each storey. The upper zone and the ceiling need the clear room height of the sheet.

## Zone of individual sections {#leitung-teilstuecke}

If only one piece of a cable runs differently – for example under a door in the floor, the rest above – give this piece its own zone. Select the cable and click **Select sections** in the [context bar](#kontextleiste) or in the right-click menu. Now each click selects a straight section between two bends, and a second click deselects it – including sections of other cables. For the selected sections, set the zone under **Installation zone ▸** in the context bar or via right-click; “as cable” removes a section’s own zone again. **Done** or Esc ends the selection.

Sections with their own zone carry a small code on the plan while the cable is selected: D for ceiling, O, M, U for upper, middle, lower, and B for floor. A “i” appended means “in” the ceiling, wall or floor, for example Oi. The code is not printed. The properties panel states how many sections have their own zone, and resets them on request. Where the zone changes from section to section, the vertical piece counts in the installation length, and the IFC export runs the cable vertically there.

The zone follows the position of the section: if you insert a waypoint, both halves keep the zone, and if you drag the section to another place, it takes its zone along. If the cable is re-routed – for example because you moved a device – newly calculated sections lie again in the zone of the cable; a notice reports if a section’s own zone was lost in the process. If you change the zone of the whole cable, the sections’ own zones no longer apply.

## Only in wall, ceiling or floor {#nur-in-bauteilen}

Normally auto-routing finds the cheapest route in the floor plan, and the [installation zone](#leitung-zone) determines only the height – a cable in the upper zone would then also run in the middle of the room, 30 cm below the ceiling. In reality, and in the [3D view](#dreid-ansicht), a cable never lies freely in the room. Therefore switch on **Cables only in wall, ceiling or floor** in the [storey data](#geschossangaben) of the sheet. If a cable – by its own setting or through the sheet default – lies in a **wall zone** (upper, middle or lower, on or in the wall), this applies by itself on sheets with walls. Only if you explicitly set it to “off” on the cable does it route freely:

- Cables run directly **along the wall** in their zone (upper, middle or lower) – and indeed in the **room of the device at which the cable begins**. If the zone lies **in the wall** (for example “Untere Zone in der Wand (3 cm)”), the plan draws the cable into the wall by its depth, with a short cross piece to the device. The plan, installation length, IFC export and 3D view all use the same position. You still click and edit the cable on its path in front of the wall. If the target device lies on the other side of a wall, the cable passes through the wall only shortly before the target. Only if a device blocks the path along the wall does it run a piece inside the wall.
- If a cable has to **cross** a room, because the route along the wall would be much longer, this piece lies in the zone set under **Room crossing** – under the ceiling if you choose nothing, otherwise in the ceiling, on or in the floor. At each transition the cable goes vertically up or down; the installation length, the [IFC export](#ifc-export) and the 3D view account for this.
- At **door openings** and wall penetrations, a cable from the middle or lower zone lies in the **upper zone**, that is in the lintel above the opening – on or in the wall, as it lay before. A cable already in the upper zone, the ceiling or the floor stays there. At a window it continues in the wall. Short pieces under 50 cm, for example at the output of a device, stay in the wall.
- If the sheet has no [walls](#waende-zeichnen), every cable crosses the room and therefore lies entirely in the ceiling or on the floor.

When you switch this on or off, all automatically routed cables of the sheet are **re-routed** – in one undo step. Cables with their own vertices or with automatic routing switched off keep their route; only their room crossings move into the ceiling or the floor. If no route is found for a cable, it stays as it was, and a notice gives the number.

Individual cables may deviate: in the properties panel, in the [context bar](#kontextleiste) or via right-click, set **Only in wall, ceiling or floor** to “on” or “off”; “as sheet” follows the sheet again. This also re-routes the affected cables. When the cable is selected, its room crossings show the code D or B on the plan, for ceiling or floor. A [section zone](#leitung-teilstuecke) set by hand takes precedence. Trunks and cable risers are not affected.

## Editing cables {#leitung-bearbeiten}

- If you move a connected component, the cable is re-routed automatically. If dragging stutters on large plans, switch on **Re-route cables only after releasing the mouse** under Settings › Routing (A*): while you drag, the cable stays where it is, a dashed line shows the new connection, and it is routed once when you let go. This also applies to wires in the schematic.
- On a selected cable, the selection tool shows handles at the bends (vertices) and on the straight pieces. **Drag a piece** and it moves, while the neighbouring pieces are adjusted around obstacles. You drag a **vertex** to a new place in the same way.
- **Insert a vertex:** double-click on a piece of the cable, or right-click there › **Add waypoint**. **Remove a vertex:** click the vertex and press **Del**, or right-click it › **Remove waypoint**.
- After such a change to an automatically routed cable, the program asks “Turn off automatic routing?”. With **Turn off**, the pieces can be dragged freely from then on – without right angles and without evasion – and moving a connected component no longer re-routes the cable. If you decline, your change nevertheless stays. You can switch **Route automatically** in the properties panel back on at any time.
- A cable end cannot be dragged to another connection point. If the cable is to end at a different connection point, delete it and draw it anew.
- The right-click menu of a cable also offers **Cable type ▸** and **Installation zone ▸**. For a cable in a trunk it offers the assignment of a [switch port](#switch-ports) (**Assign port circuit …**, **Remove port circuit assignment**), and [Connect in distribution board …](#verteiler-anschliessen). It also offers continuing and releasing at the [cable riser](#kabelschacht), and **Create group/control assignment …** (see [Control assignments](#wirkverbindungen), “Straight away when routing the cable”).

## Wire in the schematic {#schaltverbindung}

In a drawing of the type [schematic](#zeichnungsart), the tool {{befehl:werkzeug.schaltverbindung}} takes the place of the cable. It works like the cable: the connection is routed automatically around the symbols – in the schematic, however, only horizontally and vertically, without diagonals, and closely around the symbols: it bends one grid cell (5 cm) before a contact. The safety distance from the auto-routing settings applies only to cables in the installation plan. The wire is black and carries no cable number. The components for it come from the catalogue [Circuit diagram symbols](#stromlaufplan-symbole).

1. Select {{befehl:werkzeug.schaltverbindung}} – the same key as for the cable in the installation plan.
2. Click the start point – on a connection point or freely on the sheet.
3. Click the target connection point: the connection is routed there automatically and completes. If you want to determine the path yourself, click points into the open beforehand – then only the piece from the last point is routed. With **Ctrl** held (tablet: **Straight** in the context bar), this piece is also drawn as a straight line. A double-click or Enter ends the connection freely. If the preview turns red, there is no free path to this target.

An automatically routed connection is **re-routed when you move or rotate a connected component** – you see the new course already while dragging. If you set your own points while drawing, drew it straight with Ctrl, or changed it later with the handles, it keeps its shape; only the end piece gets longer or shorter and stays horizontal or vertical. You can switch this with **Route automatically** in the properties panel at any time; there you also give the connection its name.

**Potential names.** Each wire can carry a name, for example “L1” or “PE”. Multi-line wires are pre-named: two cores are called L1 and N, three L1, L2, L3, four additionally N, and five additionally PE. A single connection stays unnamed; a single-line multi-pole one receives a collective name such as “L1, L2, L3”. If a connection ends on a named bus wire, it takes over that name. You can change the name at any time in the properties panel. It is shown in grey at the top right, next to the start and the end, without touching the line – it does not repeat at bends. You can hide it for the whole sheet with {{befehl:blatt.anzeige-potentialname}}, or for single wires in the properties panel. There, **Name at the start only** limits it to the first point – this is how the rails appear in the generated distribution board diagram.

**Sheet reference.** If a cable continues on the next sheet, switch on **Sheet reference at the ends** in the properties panel or via right-click (also in the “Actions” row of the context bar). For a whole bus, select all its cores beforehand. The cable needs a name for this. If there is a same-named cable with the same setting on a sheet before or after, an arrow at the left or right end, pointing away from the sheet, shows the sheet number and column of the counterpart, for example “/1.H ◄ L1 ──── ► /3.A”. The name then stands in front of the cable at its height instead of above it. The references update automatically when you reorder sheets or move a cable.

**Interruption point.** If a cable ends freely and continues on another sheet – for example a control cable to a device that sits on its own sheet – choose “Source” (continues elsewhere) or “Target” (comes from elsewhere) under **Interruption point** in the properties panel, and give it a name. At the free end, an arrow, the name and the reference then appear, for example “▶ L1-F3 /3.B”. A source names all same-named targets on other sheets; a target names its source. At a vertical end they are rotated by 90°. If the counterpart is missing, the panel says “no continuation”.

**Line type.** A wire can be solid, dashed, dotted or dash-dot, for example for control cables or a mechanical control assignment. You set the line type for one or several selected wires in the properties panel. The pole-count marking stays solid. With **Conductor colour**, one click sets black, brown, grey, blue or green-yellow – the same colours that the generated distribution board diagram uses. Green-yellow alternates section by section between green and yellow, and sets the line to solid for this. For your own combinations, **Two-coloured** alternates a solid connection section by section between its colour and a second one.

In a new schematic, the cable numbers and the name line of the components are initially hidden; the reference designations stay visible. You can show both as usual.

With the **number keys 1–5** you set the number of cores before drawing. From 2 upwards you draw **multi-line**: as many parallel cores as the number indicates. The key **M** switches to **single-line** display: a multi-pole wire bundles the cores into one line (for example three phases) with the usual oblique stroke and the pole count, and automatically includes the matching number of neighbouring connection points on the clicked component. A new digit from 2 upwards switches back to multi-line; the 1 switches to a single line.

When drawing multi-line, you draw only the first core – for example from contact 1 of a circuit breaker to contact 1 of the terminals below. The other cores run along visibly at the contact spacing of the schematic symbols, also around each bend. On completion, each further core connects itself if its end lies on a connection point; the points they would hit are already marked while drawing. Cores without a hit end freely. The **Tab** key places the further cores on the other side of the first, and **M** switches to single-line. Each core is then its own wire and can be named, changed or deleted individually; one undo takes all of them back together. Because each core is re-routed on its own, the cores may no longer run in parallel after a component is moved – then draw them again.

### Branch from a bus wire {#abzweig}

A wire can also **begin or end on another wire**: while drawing, simply click on the line. The end snaps there, a **junction** with a filled dot is created at that point, and the new wire takes over the name of the line on which it ends (for example “L1”). At the junction, the line is split into **segments**: a bus wire with a branch becomes three segments that connect at the junction. When you click, a connection point of a component takes precedence over a line. The dot appears only where the wires actually branch: if the branch ends exactly at the end of the other line, that is a corner without a dot.

You need not hit the line exactly opposite the connection point: if the click lies at most **1 cm on paper** (at 1:40, therefore 40 cm) beside the straight alignment from the connection point, or from the last point you set, the connection point snaps there, and the connection runs straight onto the line without a bend. This also applies if you start on a line and end at a connection point.

If a **multi-line** wire branches off a multi-line bus wire, each core ends at *its* core of the bus wire. This creates a staircase instead of three lines that all run through to the top core. You click only with the first core on the bus wire; the other cores find their partner themselves:

- If all cores of the bus wire carry a name, their order applies (L1, L2, L3, N, PE) – from the clicked core onwards.
- Otherwise the position applies: first the cores that the first core has already crossed on its path.

Each core takes over the name of its partner. The preview shows the staircase already while drawing.

The connection remains in place: if you move the bus wire together with its junctions, the ends of the branches move with it – a vertical branch stays vertical and becomes longer or shorter. If the bus wire is deleted, the branches end freely. An automatically routed branch always meets the bus wire at right angles. Plans from earlier versions are converted when opened; afterwards they look the same.

### Editing segments and junctions {#schaltverbindung-bearbeiten}

Each segment is its own wire: select it individually, change it or delete it.

- **Junction:** A click on the dot selects the junction – it takes precedence over the lines beneath it. If you drag it, all segments attached to it follow: automatically routed ones are re-routed while you drag, the others keep their shape and run on at right angles. If you delete a junction, its segments end freely.
- **Handles:** On a selected wire, handles appear – at the ends (ring), at each bend (square) and in the middle of each section (dot).
  - *Drag an end* to shorten or lengthen it. If you release it on a connection point, a potential, a junction or another line, it attaches there (on a line, a new junction is created); in the open, it ends freely. While dragging, a circle shows where it would attach.
  - *Drag the middle of a section* to move it in parallel; the neighbouring sections become longer or shorter. If an end lies beside it, a step is created.
  - *Drag a bend* to move the bend; the neighbours adjust.
  - Everything stays horizontal and vertical. With **Ctrl** held while dragging, only the point follows, also diagonally.
  - **Double-click** on a section inserts a bend; **Del** on the selected bend removes it.
- **Automatic routing:** Whoever changes an automatically routed wire with the handles switches off its automatic routing. The status line says so, and the properties panel can switch it on again.
- **Deleting** a segment tidies up the junction: if two segments remain there, they become one line again; if one remains, it ends freely.
- **Name:** If you change the name of a segment, all segments connected via junctions take it over – they are the same potential. The properties panel states how many segments it applies to. The name is shown, as before, only where it is switched on.

A filled **junction dot** appears wherever connected wires branch – that is, where at least three branches meet. This also applies if two wires leave the same contact, run together for a stretch and then separate: the dot sits at the point of separation. Lines that merely cross or touch by chance, without being connected, get no dot. A copied wire, on the other hand, is always loose.

> Vertical connections without a bend arise when the symbols are placed one below another with the grid switched on – their [snap point](#fangpunkt) then lies on the same grid point, and all contacts line up.

### Inserting and removing components in wires {#schaltverbindung-einschleifen}

In the schematic you can place a component directly onto existing wires, for example a circuit breaker into a continuous phase:

- **Inserting:** If wires run through the poles of the new component while you place it, each one is cut at the upper contact and continued from the lower one – the piece between them is dropped. For components with contacts on the left and right, the same applies to horizontal wires. Already in the preview, the affected wires are highlighted in blue with their new course. One undo step takes back component and cut together.
- **Snapping:** You do not have to hit the wire exactly. If it lies anywhere within the outline of the component, the preview jumps across the wire until the nearest pole sits on it. If the wire runs across the poles – say a circuit breaker over a horizontal piece – the preview turns by 90° with it. If you rotated it yourself with the space bar, your rotation stays. This works on every straight piece of a wire with bends.
- **Drawing through:** If you draw a wire straight through a row of components – for example from the left contact of the first, holding **Ctrl** (tablet: **Straight**), to the right contact of the last, or via your own intermediate points – it is split at every component when you finish. You get partial wires from contact to contact that follow when you move a component. If the wire runs next to a pole but within the outline, it bends at right angles to the contact. Automatic routing, on the other hand, keeps the wire clear of the components.
- **Phase-correct:** If a pole carries a terminal designation (L1, L2, L3, N, PE …), it receives the wire of the same name under the component – even if that wire lies elsewhere; it is then routed at right angles to its pole. Poles without a designation take the wire that runs through them. A wire with a different name never connects to a designated pole.
- **Removing:** If you delete a component with one wire above and one below each pole, both become one continuous line without a gap. It keeps the name and appearance of the wire at the upper contact. If no wire, or more than one, hangs at a contact, the lines there end freely as before.

This also applies when you drag a single existing component onto a wire: it snaps on while you drag and is inserted when you release it. A pole that already has one of the component's own wires stays untouched. Moving several components at once or moving with the arrow keys cuts nothing. Multi-pole connections drawn as a single line are not inserted.

## Potentials {#potential}

A **potential** names an electrical node (for example “L1”, “N” or “PE”) and applies across the whole drawing: two occurrences with the same name – on whatever sheet – count as connected, without a wire being drawn between them. This lets you complete a schematic without drawing every connection across several sheets.

1. Select {{befehl:werkzeug.potential}}.
2. Click on the sheet.
3. Enter the name – for example “PE”.

“PE” automatically receives the standardised protective earth symbol instead of the usual terminal flag. A second, equivalent way to form a potential: give a [wire](#schaltverbindung) a name in the properties panel – it then also counts as an occurrence of the same potential. The [potential list](#potentialliste) shows all potentials with their locations; a potential with only one occurrence counts as orphaned and is marked there.
