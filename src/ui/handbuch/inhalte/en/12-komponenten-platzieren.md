# Place components

## Place a component {#komponente-platzieren}

{{video:04-bauteile}}

1. Choose {{befehl:werkzeug.komponente}} – the component selection opens.
2. Choose the catalogue and product (the search field filters by name and article number). The category list only shows what occurs in the selected catalogue. If the product has [variants](#katalog-varianten), choose the **Variant** below it. With the **Tile size** slider at the top right you make the tiles smaller to see more symbols at once, or larger to recognise them better; the size is remembered.
3. Click on the drawing. The component hangs from its [snap point](#fangpunkt) at the pointer and can be turned by 90° with the Space bar before you click.

As long as the tool stays active, you place further units of the same product – for a row of sockets, therefore, choose once and click several times.

![Placing a component with connection points and label](komponente.png)

> **Hold down D** shows the connection points of all components on the sheet. This way you see at a glance where a cable can connect.

## Snap point: aligning symbols on the grid {#fangpunkt}

Every component has a **snap point** – the small magenta cross in a circle that appears at the pointer when placing and on an individually selected component. This point hangs from the mouse pointer and, with the grid switched on, lands exactly on a grid point. The object snap also applies to it.

- If the component has connections of its own (schematic symbols, switches), the snap point is its **first connection point**, e.g. contact 1 or L1 or port 1. Otherwise it is the centre.
- **Moving:** When you drag with the mouse, the snap point of the component you grab snaps into place; a group selected along with it follows. A component that was previously next to the grid snaps in at this moment.
- **Rotating** with the Space bar turns around the snap point – an aligned symbol stays aligned.

In the schematic this means: place a three-pole circuit breaker over a terminal block, and L1, L2 and L3 stand exactly above terminals 1, 2 and 3, and the [wires](#schaltverbindung) run straight down without a bend. The supplied schematic symbols all share the same pole spacing for this purpose.

> This applies as long as both symbols are set in the same size. Anyone who scales a component by hand, or changes the sheet's symbol size in between, also changes its pole spacing – then the further contacts no longer line up.

Where the snap point sits is set in the catalogue ([Set snap point](#fangpunkt-setzen)).

## On the wall: combinations by height {#wandfang}

In a floor plan, components snap to walls. If the component comes close to a wall surface at the pointer, it jumps to the wall: its top against the wall, its underside towards the room. Snapping happens at drawn walls – including imported and converted ones – and at straight lines of a background plan, as long as [snapping to the background](#hintergrundfang) is switched on. Nothing snaps in door and window openings.

- **Combination:** If a component of the same mounting height is already at that spot, the new one sits beside it, at the end nearer to the pointer. At most **five** form a combination. The sixth starts a new combination directly beside it.
- **Other height:** Each height forms its own **row** at the same spot, parallel to the wall. The highest lies directly against the wall; the others follow in front of it in descending order of height.
- **Size:** In a combination, symbols appear smaller so that five next to each other have room – by default at 75 % of their normal size. You set the value under “Combinations on the wall” in the [settings](#einstellungen-abschnitte). A change applies immediately to all combinations in the open drawing, and to each further one as soon as you open it; Undo takes it back together with the setting.
- **Frame:** A combination of at least two components is outlined with a grey dotted border. A single component on the wall stays without a frame.
- **Rotating:** Select a component of the combination. In the context bar at the bottom, under **Actions**, there are two buttons (with several components selected, they are also in the right-click menu):
  - **Rotate combination 90°** turns the whole combination as one block. Turned across, it runs from the wall into the room, with the first component on the wall; rows at another height move behind it. Turned by 180° it lies mirrored against the wall. The Space bar does the same – when placing, for the new combination at the pointer.
  - **Rotate element 90°** turns only the selected component in its place. If the symbol is not square, the neighbours move accordingly.

  When a component joins an existing combination, it takes over that combination's rotation; it keeps its own rotation as an element.
- **Labels as a list:** The names of all components at one spot stand in smaller type, one below the other, to the right of the spot – row by row, in the order of the places. Drag the list away with the mouse and it moves as a whole. A label moved on its own stays with its component.
- **Height next to the row:** The height (“h= 30 cm”, “Ceiling”, “Floor”) is shown once per row, directly before its first component – on a horizontal wall, therefore, to the left of the row, at its height. So with several rows you see at once which height belongs to which.
- **Height before the click:** In the context bar, use **−** and **+** to choose the mounting height for the next components: **Standard** (the usual height of the device type) or one of the default heights from the settings. The choice stays until you change it.

**Adding later:** Place a component directly onto an existing combination – also onto a row further into the room – and it goes in there, beside the component under the pointer, on the side where the pointer is. The others move along. If the height in the context bar is set to **Standard**, the component takes over the height of the combination; if you have explicitly chosen a height, it gets its own row at that spot. If the combination is already full, the last one starts a new combination beside it.

**Moving** works the same way: a component dragged out of a combination snaps to another wall or combination – or stands free, at normal size, if there is no wall there. The others move together.

**Changing the order:** Drag a component onto another in the same combination – the two swap places. Dragged into another combination in the same row, it is inserted there. Or select it and move it one place further with **Move position forward** or **Move position back** under **Actions** in the context bar.

**Moving a whole combination:** Select one of its components and click **Select combination** under **Actions** in the context bar. Then drag one of the highlighted components: the combination moves as a block, with its order and rotation, and snaps to the wall under the pointer – also onto another wall. What remains in the old place moves up. Select all components of one spot (all rows) to move the whole spot. If you change the mounting height in the properties panel, the component moves into the row of its new height.

If you move, rotate or lengthen the wall, the combinations move with it. If the wall is deleted, the components stay free in their place. A spot on a background line, by contrast, stays where it is. Copied components come out free-standing.

Cables reach a component on the wall from the wall side – see [Components on the wall](#leitung-an-der-wand).

A **module carrier** (System 106) also snaps to the wall, but it does not take further components into its combination; others sit beside it. The same applies to components for which **May be part of a combination** is switched off in the [product catalogue](#dockpunkte-grafisch) – they stay at normal size.

{{befehl:ansicht.wandfang}} switches wall snapping off and on again (on by default). In the 3D view and in the IFC export, all devices of a spot sit on the wall surface. The rows beside one another are only the display in the floor plan. The devices of a combination stand there **one above the other**, like in a vertical multi-gang frame: the first at the top at mounting height, the others in their order closely below (1 cm gap). Ceiling and floor devices remain side by side.

## Distances to wall and neighbours {#abstandsanzeige}

While a component hangs from the pointer – and likewise while you move a single component with the mouse – el.esy.CAD shows the distance to the nearest component above, below, left and right: a dashed blue line with a measurement.

Distances are measured to the nearest **wall**, **stairs**, the nearest **cable riser** or the nearest **component**, in each case to its facing outer side. Doors, windows and wall openings belong to the wall – the line ends there at the outside of the wall, not at the opening symbol. Freely drawn lines, labels and dimensions do not count as targets.

## Mounting location, mounting height and label {#installationshoehe}

In the properties panel, under **Mounting location**, you set where a device sits:

- **Wall** – at its mounting height (the normal case),
- **Ceiling** – under the ceiling; it follows the clear room height of the sheet and moves along when you change it,
- **Floor** – on the floor, e.g. a floor tank.

Light outlets and ceiling luminaires come with **Ceiling** from the catalogue. The mounting location can still be changed afterwards for each component, also for several selected at once. If you explicitly choose a height with **−**/**+** when placing, even a ceiling device goes onto the wall.

Only on the **wall** do you enter the **mounting height** (height above finished floor). For the usual values – switch, socket, parapet – there are buttons. The height is shown on the label in the plan, together with the [installation method](#verlegeart) (“h= 105 cm FM”). For ceiling and floor devices the height is omitted; there only “SM” or “FM” is shown. In a [combination on the wall](#wandfang) the height is shown once per row, next to its first component. Ceiling and floor devices also snap to the wall, in their own row marked “Ceiling” or “Floor”: the ceiling row directly on the wall, the floor row at the very front.

The label itself (name, article number, height) can be dragged with the mouse to a free spot if it covers another symbol. Which details appear at all is switched under **Sheet › Show labels**.

In a **schematic** there is no mounting height – input and display are omitted there. Name and label are hidden on new schematic sheets and can be turned on via the same menu.

**Changing several components at once:** If several components are selected, the properties panel shows their shared fields – rotation, label, mounting location, installation method, [circuit](#verteiler-aus-raeumen), mounting height, display, the visibility of name, label and height, and text and symbol size. What you change there applies to all selected components; one **Undo** takes the change back for all. If the components have different values, the field reads “(different)” until you set a value. The mounting height only appears if all of them sit on the wall; modules placed on a housing still rotate with their housing. Terminal designations, device type and device group are set for each component individually.

## Surface-mounted or flush-mounted (SM/FM) {#verlegeart}

Under **Installation method** in the properties panel, you set whether a device is **surface-mounted (SM)** or **flush-mounted (FM)** – depending on whether it sits in the wall, in the ceiling (e.g. a recessed spotlight) or in the floor (e.g. a floor tank). Every component comes onto the sheet as SM; you switch to FM manually, also for several selected at once.

A [combination on the wall](#wandfang) is always entirely surface-mounted or entirely flush-mounted: if you change one of its components, the others follow. A component you put into a combination takes over the combination's installation method.

The installation method affects

- the **label** in the plan: “h= 105 cm FM”; on a row it is shown once, and only if the row mixes SM and FM does it stand before each combination,
- the [bill of materials](#stueckliste): SM and FM devices are listed on separate lines,
- the [3D view](#dreid-ansicht) and the [IFC export](#ifc-export): an FM device lies flush with its front in the wall, ceiling or floor,
- the **position on the wall** in the plan: a row on the wall stands 2 cm proud of the surface when surface-mounted, so that the cable between wall and device can run on the wall ([Components on the wall](#leitung-an-der-wand)); when flush-mounted it lies flush against the wall. When you switch, the combination moves accordingly, and the cable ends follow straight away.

Otherwise the symbol stays where it is, and connected cables keep their zone. If a cable at its end lies in an [installation zone](#leitung-zone) with a different installation method than the device – e.g. an SM cable at an FM box – the properties panel of the component or of the cable points this out.

## Fill in texts on the symbol {#texte-ausfuellen}

If a component carries [variable texts](#variable-texte) or fixed labels, they appear in the properties panel under **Texts** – variable texts with their field name. Contact and terminal designations of the connections (e.g. “13”, “A1”, “PE”) you change below, under **Terminal designations**, e.g. to renumber a terminal. A line break (Enter) in the field gives a multi-line text on the symbol; an empty field does not appear in the plan at all.

If you select several components carrying the same variable text, fill it in for all of them at once. If they have different values, the field shows “(different)”.

When replacing a component, values already entered in fields of the same name are kept.

If a field determines the [number of slots](#slotanzahl-aus-text), a note appears below it. The slots adjust as soon as you leave the field or press Enter – text and slots are taken back by one single Undo. If slots would be removed to which targets are already assigned, the program asks first; **Cancel** then applies only the text. If the field contains no number, the slots remain unchanged. If the component is part of a [device group](#geraetegruppen), the slots belong to the group and the number has no effect.

## Circuit diagram symbols from the catalogue {#stromlaufplan-symbole}

For [schematics](#zeichnungsart), el.esy.CAD brings the catalogue **Circuit diagram symbols**: standardised circuit symbols, not products of a manufacturer. It is organised by category:

| Category | Contents |
|---|---|
| Protective devices | 1- to 4-pole circuit breakers, RCD/FI switches, fuses, SLS switches, surge arresters and lightning arresters |
| Meters | Power and energy meters, 2- and 3-pole |
| Relays & contactors | Coils (including multi-function timing relays), contact blocks with normally open and normally closed contacts, contactor main contacts, triac (dimmer channel), and the two [KNX actuators](#knx-aktor) |
| Terminals | Terminal blocks and outgoing terminals, 1- to 12-pole, outgoing terminals 1P+N+PE and 3P+N+PE |

All symbols have the same pole spacing, so that components placed one above the other line up (see [snap point](#fangpunkt)). Each one comes with its reference letter – F for protective devices, P for meters, K for relays and contactors, X for terminals – and coils and contact blocks with their role for the [cross-reference](#kennzeichen).

## Reference designation on the symbol {#kennzeichen}

Components with equipment reference designations – fuses, terminals, relays from the schematic symbols – carry it on the symbol as “-F3”, and a [distribution board](#verteiler) carries its location designation as “+UV1”. In the schematic it stands to the left of the symbol, in the floor plan to the right; it can be moved like any label. It is changed in the properties panel under **Reference designation**. If the designation is already assigned, the program asks: symbols with the same reference designation count as one piece of equipment. A coil and the contacts of a relay share their reference designation without a question, and terminals share their strip (see below).
{{befehl:blatt.anzeige-kennzeichen}} hides the reference designations on a sheet.

The suggestion when placing – the letter plus the next free number, e.g. “F4” – comes from the catalogue via the **reference designation letter** of the component ([Create a component](#komponente-anlegen)).

**Cross-reference for relays and contactors.** If a K reference designation has exactly one **coil** and at least one **contact block**, the program adds to the label on the symbol the location of its counterpart: to the coil the locations of all its contact blocks, and to each contact block the location of the coil, e.g. “K1: sheet 3-F2”. In the schematic the location is sheet and grid square in the [reference grid](#koordinatennetz); in the floor plan only the sheet. The reference is not saved; it is always correct after each move, rename or deletion. If the coil is missing or there are two, no reference is shown, and the [equipment list](#betriebsmittelliste) flags such a reference designation. A [KNX actuator](#knx-aktor) names its contacts per channel instead.

## Terminal strip and terminal number {#klemmen}

For terminals, the reference designation is the **strip** (X1, X2 …), plus the **terminal number**: X1:1, X1:2, X1:3 and so on.

- A new terminal goes into strip **X1** – or into the strip you last chose by hand – and receives the number after the highest one in this strip anywhere in the project. After deletions, gaps remain; this is intended.
- A multi-pole terminal block takes one number **per pole** (X1:3, X1:4, X1:5). An outgoing terminal with L, N and PE is a **set with one number** (X1:4) – its conductors are still called L, N and PE, e.g. “X1:4 N” in the cable list.
- **Changing the reference designation** (e.g. to X2) moves the terminal into that strip; it receives the next numbers there.
- **Terminal** in the properties panel is the first number; the other poles follow without gaps (10 gives X1:10–12 on a three-pole block). Change individual poles under “Terminal designations”. A number already assigned in the strip is not accepted.
- If terminals of the same strip stand directly next to each other, “-X1” is shown only at the first.
- **Right-click a terminal › Renumber terminal strip -X1** counts the whole strip up from 1 without gaps – sheet by sheet, from top to bottom and from left to right. The connections remain where they are. The function is also in the context bar under “Actions”.

Existing plans with their own X per terminal remain as they are.

## KNX actuator in the schematic {#knx-aktor}

el.esy.CAD draws KNX switching, blind and dimming actuators itself, matched to the number of their channels: a rectangle with the title (“Switching/blind actuator 8-fold”), at the bottom an input per channel with an arrow into the device and an output with an arrow out, above them the channel designation A1, A2 … and the function together with the label. At the top sit the bus terminals KNX+ and KNX- and, at a distance, L and N. All connections lie on the grid of the schematic.

{{befehl:werkzeug.knx-aktor}} opens the dialog in which you put the actuator together. Both actuators are also in the catalogue under “Circuit diagram symbols” (KNX › Actuators).

- **Type:** switching/blind actuator (4, 8, 16 or 24 channels) or dimming actuator (1, 2 or 4 channels).
- **Function per channel:** Switching, Staircase light, Timed switching, Heating, Blind, Roller shutter, or free / Dimming. **Blind** and **Roller shutter** exist only on odd channels: they take up the next one – A1 raises, A2 lowers. Mixing is allowed, e.g. blinds on A1/A2 and A5/A6, with the remaining channels switching. In the symbol, a bracket groups the pair together.
- **Label per channel,** e.g. “Light kitchen”. The texts stand horizontally and as small as needed; if the space does not suffice, they are rotated by 90° like the target designation.
- **Reference designation:** the suggestion is the next free K (-K1, -K2 …).
- **Show L/N supply** switches L and N at the top on or off.

After **Insert**, the actuator hangs from the mouse pointer like any component and snaps with the input of A1 to the grid. It is changed in the properties panel via **Edit channels …**: a larger actuator gets the new channels added on the right, and connected wires stay at their channel. If it becomes smaller and something hangs on a channel that drops away, el.esy.CAD asks first; those connections remain as free ends. The 24-channel actuator is wider than a sheet and is therefore laid out in two rows: A1–A12 above, A13–A24 below. The upper row ends at the right, and the lower row begins at the left with a curved break line. The lower row carries the reference designation and title with “(continued)” – so you can see that both are one device.

In the bill of materials each actuator is counted by type and size, e.g. “KNX switching actuator 8-fold” or “KNX switching/blind actuator 8-fold” with a blind pair – without manufacturer and article number. The earlier, fixed-drawn actuators from the catalogue remain in existing plans as they are.

## Replace components {#austauschen}

A placed component – or several selected at once – can later be replaced with another entry from the same catalogue. Select it with the selection tool and click **Replace …** under **Actions** in the bar at the bottom; with several components it is also in the right-click menu. The catalogue dialog then shows only the catalogue the components come from.

Position, rotation, label, device reference designation, type and slots including their control assignments remain, as do the values entered for variable texts of the same name. Connected cables stay at their connection and are re-routed to its new position. If the new entry lacks an occupied connection – for example, it has fewer ports than are in use – this component remains unchanged, and a note gives the reason. If the selected components come from different catalogues, they cannot be replaced together.

## Image or schematic symbol {#bild-oder-symbol}

Every component can be shown as a product image or as a schematic symbol. The switch applies either to the whole sheet or only to the selected component – so you can draw an installation plan with symbols and an assembly plan with photos from the same drawing. Symbols can additionally be coloured.

**Colours of the symbols:** As long as a component has the **default colour**, its symbol appears exactly as drawn – a red fire detector red, a network symbol with a grey box and green lights in these colours. This applies whether the symbol is supplied, drawn in the symbol editor or the Catalogue Studio, or uploaded as a file. The same applies to texts and terminal designations with their own colour. If you choose a different colour in the properties panel, symbol and texts are drawn in that colour.

You set the symbol size for the whole sheet via {{befehl:blatt.beschriftung-groesse}}; the size of a single object is set in the properties panel.

## Modular carrier (System 106) and slots {#modultraeger}

A modular carrier – such as a System 106 housing – has slots into which modules snap:

1. Place the modular carrier like any other component.
2. Select a module from the catalogue and drag it over the carrier: the free slots are shown as magnetic points.
3. On release, the module snaps into the slot.

If the carrier is fully occupied, its frame is hidden so that the modules stand neatly against one another. {{befehl:extras.modulfelder-reparieren}} adds slot details to older drawings that were made before this function existed.

## Device groups and slot matrix {#geraetegruppen}

Several components that are logically one device – e.g. three lights in the hall that always switch together, or the individual rockers of a switch assembly – are combined into a **device group**. The group has exactly one type, one control and one slot list; its members no longer have their own. A control assignment to the group reaches all members, also on different sheets.

The **slot matrix** is the display of the slots of an **operating device**: a grid like the rockers of a switch frame, instead of a list. How you edit slots and targets is described under [Slot matrix and control](#slot-matrix).

A group is created in the properties panel (“+ Create new group from this component”), by right-clicking a multiple selection (“Create device group from selection”), or automatically as soon as a slot receives a second target (see [control assignments](#wirkverbindungen)). Each time, a dialog asks for **Name**, **Control** and the **KNX** checkbox of the group. These are pre-filled from the members, because within the group only the group's own settings apply afterwards, no longer those of the individual components. “Cancel” creates no group.

In the properties panel of a component, under **Device group**, you choose an existing group to join or “Standalone (no group)”. For a member there are also **Group name**, **Leave group** and **Delete group (all members)**; the control then applies to the whole group.
