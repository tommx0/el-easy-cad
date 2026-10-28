# Network, distribution boards and control

## Switches, routers, patch panels {#netzwerkkomponenten}

Network devices are available as their own components in the catalogue. Every port is a separate connection point, so a cable does not go "to the switch", but to port 12. In the catalogue, the ports are stored as port groups (port type, number, rows, see [Connection points](#dockpunkte-grafisch)). The **design** decides whether a device with ports counts as a switch or as a patch panel. The power a device draws over PoE is stated on the end device (**PoE power consumption**), not on the switch. You enter the label of each individual port in the port dialog, separately for each placed switch.

## Assigning ports {#switch-ports}

When you draw a cable that runs through a trunk with a connected switch, the status bar shows *"In trunk “…”: click the exit point - or Space to assign the port circuit"*, and the [context bar with the key functions](#kontextleiste) shows **Assign port circuit**. "Connected" means: one end of the trunk or its chain is docked onto the trunk point of the switch or patch panel. Draw the trunk up to this point, see [Creating a trunk](#trunk-anlegen).

1. Press **Space** or click **Assign port circuit** – the port dialog opens.
2. It shows a **front view** of each connected switch with all its ports. Occupied ports cannot be selected.
3. Click a free port and **Assign** – this completes the cable.

![The switch port dialog with front view and PoE total](switch-ports.png)

Afterwards, the same is possible via the cable's context menu ("Assign port circuit ..."). A **double-click on a switch** opens the dialog as an overview: assignments, PoE total and the ports you can label freely. In the properties panel of the cable, the assignment is shown in plain text ("Port circuit: Switch 1 · P12 · Sheet 2") and can be removed there.

## PoE power budget {#poe}

Each connected device brings its PoE power consumption from the catalogue. The port dialog shows it per port in column **W** ("n/a" where the catalogue has no value), and above it the total of the switch, for example "12 of 24 ports used · PoE 62 W". The same total appears as a line of its own at the switch symbol on the plan.

el.easy.CAD does not know a budget for the switch: there is **no comparison and no warning** when it is overloaded. Check the total yourself against the switch's data sheet.

## Distribution boards: fuses, terminals, relays {#verteiler}

A distribution board – "Electrical distribution board / control cabinet" in the catalogue, or any component with the design **Distribution board** – receives a reference designation such as **+UV1** when placed. It appears on the symbol and can be changed in the properties panel. Trunks dock at the centre top, at the centre bottom and on both sides; cables dock at the edge points.

## Board layout {#verteiler-bestueckung}

A **double-click on the distribution board** (or **Board layout and assignment …** in the properties panel) opens the distribution board dialog. The board layout is a **tree that shows the path of the current**: at the top the supply, below it for example a fuse, then an RCD, behind it the circuit breakers (LS), then an actuator channel and finally the terminal.

- **Supply** at the top of the dialog: **Three-phase** (L1, L2, L3, N, PE) or **Single-phase** (L, N, PE). With single-phase, the tree only offers 1-pole and 2-pole devices. A multi-phase device (for example a 4-pole RCD or a 3-pole meter) is rejected, and the generated diagram shows only the bus L, N and PE at the top and only the rails L and N on the circuit sheets. If a multi-phase device is nevertheless in the tree, the summary names it. The wizard and "Suggest board layout from rooms" set the supply type from their own choice of three-phase or single-phase.
- **Type** next to it: **Main distribution board** or **Sub-distribution board**. Only a main distribution board gets an SLS switch, lightning protection and a meter in the generated diagram. A sub-distribution board has only the supply terminal at the bottom, with its connection to the bus. If nothing is selected, the reference designation decides: if it begins with "UV", it is a sub-distribution board, otherwise a main distribution board.

- **+** in a row adds something behind it: **Equipment after it …** (schematic symbol from the catalogue and quantity), **Circuits after it …** (quantity, protective device and terminal – this creates, for example, six LS with one terminal each, with the phases in turn L1, L2, L3) or **Channel after it …**. The **+** on the supply adds at the very top.
- Reference designations count on within each distribution board (F1, F2 …). Terminals go into the strip **X1** (or the one you chose last) and are counted there: X1:1, X1:2 … A multi-pole block gets one number per pole, and an outgoing terminal with L/N/PE gets one number (see [Terminal strip](#klemmen)).
- **Moving:** drag the handle ⠿ of a row onto another row. Dropped on the upper edge, it goes in front; on the lower edge, it goes after it; in the middle, it goes behind it. A click on the handle opens the "Upstream:" selection instead. Everything behind a moved row comes with it.
- In the row you change the reference designation, the type (for example "B16"), the phase and the **label** – at a terminal, for example "Kitchen socket outlets". A renamed reference designation takes its assigned cables with it. A terminal shows its full name "X1:3": entering "X2" moves it into strip X2 (next free number there), entering "X1:7" or "7" sets the number. A number that is already in use is rejected.
- **✕** removes a node. If something hangs behind it, el.easy.CAD asks whether to remove only this node (the rest moves up) or everything behind it. The options are **Only this node** and **Including everything after it**.

**Devices with channels:** For a switching actuator or a terminal block, each channel (K1:A3) or each terminal point (X1:3) can stand at its own place in the tree – K1:A1 after F3, K1:A2 after F4. The device itself appears under **Devices with channels** and shows there which of its channels are already placed. You add it there with **+ Device with channels …**, or directly via "Channel after it … › New device …". Each **terminal strip** is also listed there with its numbers, so you can see gaps at a glance. **Renumber** counts the terminals without gaps from 1, in the order of the tree; the assigned cables move with them.

If a [distribution board diagram](#verteilerplan) is linked, the diagram determines which equipment there is; you keep maintaining placement, phase and label here. Equipment that appears only in the diagram is listed under **Not placed yet**. Drag it onto a node – the terminals of a strip one by one ("-X1:3"), so that each one gets its own protective device behind it. Equipment that exists only in the board layout is shown in grey.

A [KNX actuator](#knx-aktor) from the catalogue "Circuit diagram symbols" asks for type, size and channel functions when it is inserted. Under "Devices with channels" you change them with **Edit channels …**. A blind pair is one node (K1:A3/A4); "Channel after it …" does not offer the partner A4 on its own.

## Assign KNX actuators {#knx-zuordnen}

If a light is switched by a KNX push-button, its terminal in the distribution board needs an actuator channel. **Assign KNX actuators …** above the tree in the distribution board dialog does this for all terminals at once:

- **Which terminals:** every terminal whose loads – including those looped through – are switched by KNX. This is the case with the **KNX** tick next to the control in the properties panel (for a device group, for all its members), or when the terminal is the target of a [control assignment](#wirkverbindungen) of a KNX device (KNX push-button sensor, KNX motion or presence detector, also via a device group). In the second case the tick is set and greyed out, with the trigger shown below it. Three lights on one terminal form one channel. Terminals from [rooms](#verteiler-aus-raeumen) without a cable count too.
- **Channel type from the control:** switching (also without a control and at socket outlets), dimming, or roller blind or venetian blind as a channel pair with an odd first channel. DALI, RGB and the like cannot be run through these actuators – the row says so. In the dialog you can change the channel type per terminal or choose "no channel".
- **Sizing:** whatever fits into the free channels of existing actuators goes there. For the rest, el.easy.CAD adds as few actuators as possible – the largest size, and for the remainder the smallest suitable one – with the **Spare in %** setting (default 20 %, remembered). A gap in front of a blind pair is filled by the next switching channel.
- **Channel name:** the name of the device group is suggested; otherwise the label of the terminal, the label of the switched component or a name from the room. You change it per terminal in the column **Channel name** – also for a channel that is already assigned, which is then renamed. If left empty, the channel stays unnamed.
- **Result in the tree:** the channel stands between the circuit breaker and the terminal (F3 → K1:A1 → X1:5) and carries the channel name as its label. Behind a blind pair, an outgoing terminal 1P+N+PE is replaced by 3P+N+PE: L1 runs the up movement, L2 the down movement.
- **Assign again:** assigned channels keep their number. New terminals fill the free channels and the spare capacity. Channels whose terminal no longer supplies a KNX target are offered for release in the dialog.
- **Notes** appear in the row – for example when a terminal has no protective device (then it gets no channel; first put a circuit breaker in front of it), or when it also supplies loads without a KNX target.

**Assign** is an undo step. Afterwards the component also shows the channel, for example "UV1-F3 / K1:A1 / X1:5". With a linked distribution board diagram, the dialog does not create actuators; it only uses the free channels of existing ones. The [distribution board diagram wizard](#verteilerplan-erzeugen) also offers the assignment before it creates a diagram from the distribution board of the open floor plan.

## Board layout from rooms {#verteiler-aus-raeumen}

You can equip a distribution board even without a single cable – from the rooms of the floor plan and the **Circuit** property of the components. To do so, choose **Suggest board layout from rooms …** in the distribution board dialog. This also works when a distribution board diagram is already linked – for example after you have deleted the cables in order to plan from rooms. After **Apply**, el.easy.CAD asks whether the linked diagram should be **recreated** from the new board layout. In doing so, its content is replaced: your own changes in the diagram are lost, and undo in the floor plan does not reach the diagram. If you decline, the diagram stays as it is, and the distribution board dialog shows in grey what the diagram is missing.

**Circuit of a component** (properties panel, also for several components at once):

| Value | Meaning |
|---|---|
| Default | from the catalogue; otherwise room circuit for loads and outlets, otherwise none |
| none | belongs to no circuit – for example network outlet, push-button, KNX sensor |
| Room circuit | one shared circuit for all components of the room that are set this way |
| Number 1 … 99 | a further circuit in the room; the same number in the same room means the same circuit |
| own circuit | an LS just for this device, with **number of poles** 1~ or 3~ (instantaneous water heater, cooker) |

The room circuit is not "number 1": Kitchen, Kitchen 1 and Kitchen 2 are three circuits. Small rooms share a circuit via **Room circuit shared with** in the properties panel of the [room](#raeume) – a WC and a storage room "shared with hall" give one terminal "Hall, storage room, WC". Instantaneous water heaters, heat pumps, sauna heaters and cooker connection boxes are set to "own circuit, 3~" in the supplied catalogue. An own circuit is named after room and device ("Kitchen instantaneous water heater"); if the component has a label, the circuit takes its name. Likewise, a KNX channel without a device group takes the component's label ahead of the room name.

**The dialog** shows the rooms of the floor plan per sheet, each with a tick (plus "without room" for components outside any room); the selection is remembered by the distribution board. A room that another distribution board already supplies is locked. Below that come the type, the supply, the supply terminal and – only for a main distribution board – the SLS switch, lightning protection (in parallel), the meter and the fuse after the meter (all only while the board layout is empty), **One RCD per sheet** with its type, the type of the LS, and **Assign KNX actuators straight away** with the spare capacity. The table shows each circuit with its components and the result, for example "F4 / X1:2".

- One **RCD** per sheet, labelled with the sheet name. Behind it, for each circuit, an LS with a **terminal** 1P+N+PE (3~: 3-pole LS, terminal 3P+N+PE). The phases go in turn.
- **KNX:** a KNX-switched device group, or a light without a group, gets its own terminal behind the LS of its room, with an actuator channel in front of it – as with [Assign KNX actuators](#knx-zuordnen). Conventionally switched lights simply hang on the terminal of the room.
- **Suggest again:** what is already there stays, with its reference designation, label and place in the tree; only new items are added. Nodes whose room or component is missing or has been deselected are listed under **No longer needed**, ready to be removed. Nodes you added by hand always stay.

**Apply** is an undo step. Afterwards the components know their [circuit](#stromkreis-zuordnung), although no cable runs to the distribution board.

## Connecting cables in a distribution board {#verteiler-anschliessen}

- If you dock a cable onto a distribution board, the dialog asks straight away where it should end. **Apply without terminal** leaves it docked only.
- If it runs through a trunk to which a distribution board is attached, the **Space** key opens the dialog "Choose cable target" with the category **Distribution board** – as with the [switch port](#switch-ports).
- The dialog shows the tree with a **search field**: "kitchen" or "X5" leaves only the matching nodes, with their path. Terminals are shown in bold with their label.
- Choose **one node** – usually the terminal. Fuse, RCD, upstream fuse, actuator channel and phase follow from the tree; below the selection, the chain is shown, for example "X6 → F4 · RCD F2 · L2". Several nodes are possible (a roller shutter on two channels), and for each selection you can specify a core. A node can carry any number of cables.
- Afterwards: right-click the cable → "Connect in distribution board ..." or, in the properties panel, **Change ...** or **Disconnect**.

## Circuit on the components {#stromkreis-zuordnung}

Whoever runs a cable to X6 has thereby also assigned the circuit, RCD and phase. The components at the other end receive this assignment automatically – including those looped through: if W12 runs from the distribution board to the first socket outlet and W13 from there to the second, both belong to F4. The propagation stops at the next distribution board (or switch). A component on two circuits lists both.

| Where | What | Hide with |
|---|---|---|
| On the symbol | label "UV1-F4 / X6", with actuator channel "UV1-F4 / K1:A1 / X6" | {{befehl:blatt.anzeige-stromkreis}}, per component in the properties panel |
| On the cable label | "12 → UV1-X6 (F4)" | {{befehl:blatt.anzeige-stromkreis-schild}} |
| Properties panel | "Circuit: UV1-F4 / X6 · RCD F2 · L2" | Settings › Distribution board |
| [Cable list](#leitungsliste), Excel | column "Circuit" | per cable list in the properties panel |

The IFC export also groups all devices assigned to each circuit.

**Without a cable:** if the board layout was suggested [from rooms](#verteiler-aus-raeumen), every terminal knows its room and circuit, or its KNX group. Components without a cable to the distribution board therefore receive their assignment from there. A cable always takes precedence. This assignment is not passed on.

**Only as long as the node exists:** the display follows every change. If you delete nodes, or the whole tree, in the distribution board dialog, the line on the components disappears. If a cable still sits on a reference designation that no longer exists, it assigns nothing, and the distribution board dialog lists it under "Assigned but not present". If a distribution board diagram is linked, only what the diagram still contains counts: if you delete a fuse, a terminal or all symbols there, the assignment of the components behind them is lost as well.

## Linking a distribution board diagram {#verteilerplan}

A distribution board diagram is a schematic drawing for exactly one distribution board. What carries the same reference designation is linked:

- in the floor plan, in the distribution board dialog, choose **Assign existing schematic …** and take the schematic from the list – the reference designation is entered in the schematic. Undo in the floor plan does not reach this; the assignment is released in the schematic. A schematic that already belongs to another distribution board is listed with "(Distribution board diagram for +UV2)". If you choose it, the button is called **Reassign**, and the other distribution board then has no diagram any more,
- in the schematic, in the sheet properties, enter **Distribution board diagram for** (for example "+UV1"),
- when creating a drawing, under "New drawing" choose the type **Distribution board diagram for +UV1** – offered for the distribution boards of the currently open floor plan – or
- on the distribution board, enter the reference designation of an existing distribution board diagram.

The distribution board diagram then shows, under each symbol – usually the terminal, the last component of the column – the **target designation**: the cables from the floor plan with their target ("W12 NYM-J 3x1,5 · Kitchen"). The target is the label of the component or, without a label, its name from the catalogue. The target designation is shown horizontally and broken to the width of the column, or vertically (see below). If cables sit on different terminal points, the terminal point is shown in front ("1: W4 …"). If a cable sits on a contact or a fuse behind which only one terminal hangs, it is shown at that terminal. {{befehl:blatt.anzeige-abgaenge}} hides the texts.

You can adjust the target designation: dragging moves it (a dashed line then leads to the symbol). In the symbol's properties panel you set the text height and width, or write your own text. Without your own text, it follows every change in the floor plan. **Automatic again**, **Reset position** and **Reset size** undo the adjustments.

**Position:** under **Target designation** in the properties panel, choose between *horizontal below the symbol*, *vertical, starting at the bottom edge of the grid* and *left of the symbol, below the reference designation*. You can do this for several selected symbols at once. On the left, the text sits right-aligned against the symbol, directly below the reference designation and the cross-reference ("-K1", "K1: Sheet 2-A2"). This way a newly created distribution board diagram places the label at contacts and circuit breakers, under which it would otherwise lie on the cable to the terminal. There, the text is broken at 0.72 m; the width can be changed.

**Vertical:**
Vertical means the whole text is turned 90° to the left and reads from bottom to top. All vertical target designations on a sheet start at the same height, just above the lower edge of the coordinate grid, and reach at most just below their symbol. If another symbol lies in between, they reach down to beneath that one. If a text is longer, it wraps, and the next line stands to the right of it. This way text and terminal do not overlap, and the text has much more room. A newly created distribution board diagram labels its terminals vertically straight away. If there is too little room below the symbol, the text stands horizontally.
Right-click a symbol → **Show outgoing feeders in floor plan** opens the floor plan with these cables selected. The [equipment list](#betriebsmittelliste) reports reference designations that are assigned in the floor plan but missing from the diagram.

Assignments are always made in the floor plan, where the cable lies; the distribution board diagram only reads.

## Creating a distribution board diagram {#verteilerplan-erzeugen}

The distribution board diagram is created by the **distribution board diagram wizard**. It opens in three places:

- in the distribution board dialog of the floor plan, if no diagram is linked, with **Create distribution board diagram …** – the content then comes from this distribution board,
- in the project overview, with **Distribution board diagram wizard …** next to "New drawing …",
- via {{befehl:datei.verteilerplan-assistent}} in the open project.

From the project overview and the menu, the first step asks where the content comes from: from a **distribution board of a floor plan** of the project, **From rooms of a floor plan**, or **Compose from scratch** – entirely without a floor plan. For rooms, the dialog from [Board layout from rooms](#verteiler-aus-raeumen) follows as a second step, then the tree. The floor plan is only read in this process. The assignment at its components arises only when a distribution board there takes over the tree. Composed from scratch, the wizard continues as follows:

1. **Starting tree:** main distribution board or sub-distribution board (the same choice as **Type** in the last step), three-phase or single-phase, and the supply terminal. Only for a main distribution board: SLS switch, lightning arrester (in parallel between terminal and SLS), meter and fuse after the meter, all ticked by default. A sub-distribution board starts with the terminal; the RCDs hang directly behind it. Also the number of RCDs and of LS per RCD, with their type (empty = catalogue default), and one outgoing terminal per LS. If you change the preset later, **Next** rebuilds the tree.
2. **Tree:** the same editor as in the distribution board dialog – labels, types, phases, further circuits, contacts and channels, moving nodes.

In the last step, the wizard suggests the reference designation and the name from **Type** (main distribution board +HV, sub-distribution board +UV), **Storey**, **Flat** and **Use**. For example: "+UV.OG1.WE2" and "Sub-distribution board OG1 WE 2 – Garage/wallbox (+UV.OG1.WE2)". If the reference designation is already taken in the project, the type counts on (+UV2.OG1.WE2). You can change both; **Apply suggestion** resets them to the suggestion. If the content comes from a floor plan, the reference designation of the distribution board stays – only this keeps the plan linked to it. Below that come at most fuses and at most terminals per sheet, the **Split** setting (both remembered), and a preview of all sheets. **Create** adds the diagram to the project as a new document.

The **Split** setting decides what happens to an RCD that no longer fits entirely on the sheet being filled:

- **New sheet when an RCD no longer fits completely** (default): it moves, with its circuits, to the next sheet. Two small RCDs continue to share one sheet.
- **Space-saving, continuous:** it starts in the free rest of the sheet with as many circuits as fit there, and continues on the next sheet. Its conductors run out at the right edge and come back in on the left, with a sheet reference. If not even one circuit fits beside it, it starts on the next sheet.

A newly composed tree, or one suggested from rooms, stays remembered in the diagram, together with the floor plan and the room selection. {{befehl:datei.verteilerplan-assistent}} in this diagram opens it again and creates a further diagram from it – the old diagram stays as it is. If you place an empty distribution board with the same reference designation in the floor plan, its dialog offers **Apply tree**.

- At the top run the rails L1, L2, L3 and N; the PE rail lies directly above the terminals. Through their names they are connected to the rails of the other sheets. The terminals sit low down, so there is room above them for further components.
- The rails enter from the left with their name, which stands in front of the cable at their height. If a later sheet still needs a rail, it runs on to the right edge – also across a sheet on which nothing hangs from it. At both ends, an arrow with sheet number and column shows where it continues, for example "/1.H ◄ L1" on the left and "► /3.A" on the right. The same applies to the bus of the supply and to the PE rail.
- The conductors carry their wire colours: everything connected to N is blue – the N rail, the N behind an RCD, the N cable above the PE rail, and the spurs to the terminals and coils. The PE is green-yellow; the outer conductors stay black.
- The conductors of one system – rails, collector lines behind an RCD, the output of the supply – lie half a grid apart everywhere. There are no dead ends: every conductor ends at its last branch, unless the rail continues on the next sheet. At the first and last branch, the cable is a corner without a connection point.
- The layout follows the tree of the board layout: for each circuit a column with its fuse, for each contact a branch with its terminals below, and terminals directly beside the fuse – including terminals on which no cable lies yet. The terminal numbers come unchanged from the board layout: a terminal of the strip (X1:3) is drawn as a single-pole terminal; an outgoing terminal with L/N/PE has its own symbol and its number. Single-pole terminals behind a three-pole protective device lie in turn on L1, L2 and L3.
- A contact block from the catalogue appears with its own symbol and all its poles – a three-pole main contact is thus drawn three-pole. An actuator channel appears as a simple normally open contact with the channel as its connection. A relay coil behind a contact stands beneath it, in its own row above the PE rail: A1 at the contact, A2 on N. Only terminals stand below the PE rail.
- RCDs and upstream fuses stand above their group, nested in their own rows. Their outputs become collector lines from the first to the last branch. Between the symbol and the first collector line there is room for the label. A pole with nothing hanging on it (all circuits on L1) stays open. The type ("63/0.03A type A") stands above the symbol, to the left, in front of the first pole.
- N and PE of the terminals are connected: above the PE rail runs an N cable, from which each terminal hangs by a short spur. A single conductor connects them with the N above – behind an RCD with its N ("N-F1"), as straight as possible under its N output, otherwise with the N rail. If the protective device itself has an N (RCD/LS, LS 1+N, four-pole), the N comes directly from its N output. A four-pole main contact switches the N as well; coils hang with A2 on the N cable below. The PE of each terminal hangs on the PE rail. Only where no cable runs past the symbols does the N cable carry its name, or a short named stub stands – the name connects it.
- Terminals from a board layout created before version 0.10.26 still each have their own reference designation (X1, X2, X3 …). The dialog then offers to move them into the terminal strip. The number stays (X7 becomes X1:7), and the cable assignments move with them. The same is possible in the board layout via the button **Move into terminal strip -X1**.
- The plan stays on the drawing area. If a group – an RCD with its circuits – no longer fits on the sheet, it moves entirely to the next one. If it is alone wider than a sheet, or has more fuses or terminals than set per sheet, it is split: the RCD stands with as many circuits as fit on the first sheet, and the rest follows on the next sheets. Its collector lines then carry names by pole and device ("L1-F1", "N-F1"), run to the right edge ("► /3.A") and come back in on the next sheet from the left ("/2.H ◄ L1-F1"). An RCD under an upstream fuse that fits on an empty sheet moves entirely to the next one.
- The first column stands a little away from the left edge, so that reference designation, cross-reference and label stay on the sheet, to the left of fuse and contact. Below the terminals there is room for their vertical target designation. If it gets too tight at the bottom (many levels above them and coils), the terminals move higher. If even that is not enough (very tall terminals), the summary says so; then move them by hand.
- The supply always stands on its own first sheet. If everything in the tree hangs behind a main switch or an upstream fuse, that chain is the supply. If the tree has none (for example, because the RCDs hang directly on the supply), the diagram adds the standard chain: for a main distribution board, a five-pole terminal -X0, a four-pole SLS switch with a four-pole lightning arrester in parallel in front of it, a three-pole meter and a three-pole fuse; for a sub-distribution board, only the five-pole terminal, with each pole directly on the bus. It receives the next free reference designations (for example -F15, -F16, -P1, -F17) and appears only in the diagram, not in the board layout. If you do not need it, change or delete the sheet. The supply runs from the bottom up: at the bottom the supply terminal, above it the devices in the order of the tree (for example SLS, meter, fuse), and at the top the bus L1, L2, L3, N and PE. The bus lies at the height of the rails of the other sheets and is connected to them through their names. If you place the terminal at the very top of the supply in the tree, it is used; otherwise the diagram adds a -X0 and says so in the summary. A surge arrester or lightning arrester without a node below it, which in the tree hangs beside a link of the chain, stands **in parallel**: to the right of the chain, each pole with a branch onto the cable from the link before to the next one, and its PE onto the PE. The N passes a device without an N pole (for example a three-pole fuse) and continues on. The PE of the terminals beside the devices runs up onto the bus.
- The labels of the board layout appear in the diagram as the first line at their symbol. {{befehl:blatt.anzeige-abgaenge}} shows and hides them.
- Relays and actuators stand on their own sheet, with a contact in the column and a cross-reference. If the sheet is full, the plan continues on a further sheet.
- [KNX actuators](#knx-aktor) stand as whole blocks on their own **actuator sheets**, behind the circuits, one below another, as many as fit. In the column, each channel stands like a relay, as a normally open contact "-K1" with the connection "A1" between LS and terminal, wired throughout and without connectors. A channel of a **dimming actuator** stands as a **triac**, as a dimmer actually switches. A blind pair is a contact block with two normally open contacts (A3, A4) that feed L1 (up) and L2 (down) of its terminal 3P+N+PE. Under each channel of the actuator stands the cross-reference to its contact ("/1.B"); at the contact, the back-reference to the actuator. Nothing on the actuator sheet is wired, not even KNX+, KNX-, L and N. The labels of the channels come live from the floor plan. The outgoing feeders stand at the contact and at the terminal, not under the actuator. The summary names the actuators with their used and free channels.

The diagram is generated once. Afterwards it is an ordinary drawing, and you carry changes to the board layout into it by hand.

## Control assignments {#wirkverbindungen}

{{video:09-wirkverbindung}}

Not every relationship is a cable: a push-button acts on a light, a motion detector acts on a group. {{befehl:werkzeug.wirkverbindung}} draws this logical connection – click the source, then click the target. It appears dashed on the plan and feeds into the [control logic](#steuerungslogik), not into the cable list.

Whether a component can be a source depends on its **device type** in the properties panel:

| Device type | Own slots (source) | Usual target | Control |
|---|---|---|---|
| Control device | yes, as a matrix | – | – |
| System device | yes | yes | – |
| Sensor | yes | – | – |
| Actuator | yes | – | yes |
| Display | yes | – | – |
| Load | – | yes | yes |
| Outlet | – | yes | – |
| Equipment, Generator, Transmitter, Receiver, Transmission device, PC, Server | – | – | – |

The table shows the supplied setting. Which device types exist, and what they can do, may be extended by a library update. If a type then has no slots of its own any more, the slots of a component already created are kept and remain visible – only new slots can then no longer be added.

**One slot, several targets, one group:** if a slot gets a second target – with the tool, in the properties panel, in the slot matrix, or in the dialog after a cable – el.easy.CAD combines the targets into a [device group](#geraetegruppen), even if they have different types. A dialog asks for the name (pre-filled from room and control, for example "Hallway lighting"), the control and KNX. Afterwards the slot points only to the group, and so does every other slot that pointed to one of the members. "Cancel" discards the new control assignment. If the slot already points to a group, the new target joins it without asking. Only two different groups on one slot stay side by side.

If a slot points to a type that is not a usual target, the program marks the connection as "Unusual combination: …" – it remains allowed nonetheless. If you change a component to a type without its own slots, the program asks before existing slots are lost.

The program shows the dashed lines as soon as you select a component involved. Lines between two control devices – for example to a second push-button that switches the same light – are always grey; the lines to the switched loads are coloured. On densely populated plans, they sometimes disturb more than they show. {{befehl:blatt.anzeige-wirkverbindungen}} hides them for the whole sheet – the small slot graphics on the components stay visible. The switch is in the **Sheet** menu and, like the label switches, can be placed on the toolbar.

### Straight after laying a cable {#wirkverbindung-aus-leitung}

If a cable connects two devices with a device type, el.easy.CAD asks straight away what should follow from it. Only the two ends of this one cable are examined. If it runs through a cable riser or ends in a trunk, the device at the other end counts (on the other storey, or at the switch port):

- **Switch → light** (source with slots → usual target): you choose the slot; the first free one is preselected. With a slot list, "New slot" is also possible. If further switches hang on this switch by cable (two-way or intermediate circuit), they appear below it with their own slot choice and are ticked in advance. If the light is in a device group, you choose whether the group or only this light is the target. A slot without a name takes the name from the field "Slot name", pre-filled from room and control, for example "Light hallway" (switching, dimming, DALI, RGB) or "Roller blind hallway" (roller blind, venetian blind). If the chosen slot already has a target, the dialog also shows the name, control and KNX of the device group that is created in the process.
- **Detector → detector** (two devices with a slot list, such as sensors): if one of them already has a slot with targets, a slot of the other can receive the same targets. Between two control devices (switches, push-buttons) no dialog appears – set their slots on the device itself.
- **Light → light** (same type, without own slots, with a control – by default the loads): both go into a device group (name pre-filled from the room; control and KNX taken from the lights, changeable in the dialog), or one joins the group of the other. If a slot pointed to one of the two, it then points to the group – so the other one is switched as well. If both already stand in different groups, el.easy.CAD creates nothing and says so in a message. Outlets (sockets, antenna, data and cooker outlets) and other types without a control form no group when wired.

Example: two-way switch → two-way switch, then to the first light, then to the second light. In the end, both two-way switches switch the group of both lights. If there is nothing to create, no dialog appears. **Create** is an undo step of its own; the cable remains. You can switch off the question in the settings under "Groups and control assignments". **Right-click on the cable › Create group/control assignment …** is available at any time.

### Across storeys {#wirkverbindungen-etagen}

A push-button on the ground floor may also switch a light on the upper floor – each storey is its own sheet. Click the source with {{befehl:werkzeug.wirkverbindung}}, then switch to the other storey via the sheet tabs and click the targets there. The tool remembers the source across the switch; the mouse pointer shows from which component the connection starts. Right-click or press Enter to finish, and you stay on the current sheet.

Because no line reaches onto another sheet, a selected component shows a **reference** under its symbol instead: "→ OG: Light hallway" for a connection that starts here, and "← EG: Push-button T1" for one that arrives here. Clicking the reference jumps to the other storey and selects its counterpart. The references follow the same switch as the lines and do not appear in the printout.

With a selected component, a small graphic next to the symbol shows its slots. Point the mouse at it and it is enlarged; below the graphic is the name of the slot under the pointer. A **click on a slot** highlights the loads it controls on the sheet in yellow – so you see at a glance what hangs on this button. A click on the same slot removes the highlight, and a click on another slot changes it; only one slot is highlighted at a time. The highlight is only visible on screen, not in the printout.

## Slot matrix and control {#slot-matrix}

You edit the slots of a device – the buttons of a push-button, the channels of an actuator – and their targets in the properties panel under **Type, slots and device group**. The assignment appears in the [control logic insert](#steuerungslogik) and in the Excel export, so the electrician sees without asking what acts on what.

- **Slot list** (system device, sensor, actuator, display): for each slot a **Name** and its targets. Under **Search target ...** or **Choose target ...** you add a component or a device group from the whole drawing; **×** removes a target. **+ Add slot** adds a further slot.
- **Slot matrix** (control device): the panel shows a small grid of the rockers. A click on it opens the dialog **Edit slot matrix**. At the top are **Columns (default)** and **Rows (compartments)**; next to them, 1 or 2 columns per row. A click on a cell shows the name and targets of this slot below. Occupied cells are highlighted.
- **Control** (actuator, load): how the target is controlled, for example switching, dimming, DALI or blind. Next to it is the **KNX** tick (also for outlets). In a device group, both apply to the whole group.
- **Controlled by** is shown at the top as soon as a slot of another component points to this one: source and slot, for viewing only. Changes are made at the source.

If a source has more than one slot, {{befehl:werkzeug.wirkverbindung}} asks, after the click on the source, in the dialog **Choose slot** which slot the new connection should get. On a control device this is a grid; otherwise it is a list. The number on a slot states its existing targets. With exactly one slot, the question is skipped.
