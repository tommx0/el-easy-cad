# Trunks and cable riser

A **trunk** is a cable bundle: a drawn path in which several cables run together. Instead of pulling twenty individual cables across the plan, you run one trunk from the distribution board to the hallway and let the cables run inside it. A **cable riser** is the same thing in the vertical: the connection between the storeys.

## Creating a trunk {#trunk-anlegen}

{{video:06-trunk}}

1. Select {{befehl:werkzeug.trunk}}.
2. Click the course like a polyline – point by point. **Shift** snaps the next point to 45° steps; **Backspace**, **Del** or a right-click removes the last point.
3. **Enter** or a double-click completes the trunk; **Esc** discards it.

![A trunk with cables inside and cable number tags](trunk.png)

A new trunk receives the next free name of the drawing (“Trunk1”, “Trunk2” …). Its two ends carry a label “Trunk1 A” and “Trunk1 B”. If several trunks belong to a [chain](#trunks-verbinden), they share the name; the sections are then named automatically “Trunk1.1”, “Trunk1.2” … – they cannot be named individually. A new name in the properties panel applies to the whole chain.

The ends are free; they do not dock onto ordinary connection points of components. The exception is **trunk points** provided specifically for this, for example at the top of a switch, patch panel or distribution board (in the catalogue, “trunk only” or “+ Trunk point”). Click on them while drawing: the trunk end snaps there and stays bound to it. Via a trunk attached in this way, you later assign cables to a [port](#switch-ports). End points and intermediate points can later be moved with the selection tool; waypoints you add via right-click and remove there again.

**Set in advance:** While the trunk tool is active, a bar at the top right above the drawing shows what new trunks receive: the [trunk type](#trunk-ausfuehrung) with its dimensions, and the [installation zone](#trunk-zone), together with the **SM / FM** button for the same zone with the other installation method. The choice applies to all following trunks until you reset it or open another drawing. If a new trunk ends on a chain with a different trunk type, el.esy.CAD asks which one should apply when they are connected.

## Placing cables in the trunk {#leitung-in-trunk}

{{video:07-leitung-in-trunk}}

When drawing a cable, click on the trunk path:

1. Click the connection point of the source.
2. Click the trunk – this is the **entry point**; from here the cable follows the bundle.
3. Click the trunk again – this is the **exit point**.
4. Click the target connection point.

The [cable number](#leitungsnummern) appears as a small tag at the entry and exit. If you drag a tag with the selection tool, only the label moves; a double-click resets it. Holding **Shift**, by contrast, moves the entry or exit point itself along the trunk – the number stays.

{{video:08-ueber-trunk-weiter}}

A cable may run through several trunks one after another, but it may enter and exit each trunk only once.

## Connecting trunks {#trunks-verbinden}

Trunks can be connected into **chains**. A chain shares its name, colour, line weight and [trunk type](#trunk-ausfuehrung); a cable can run in it from one section into the next.

**On the same sheet** – with the mouse:

- Drag a trunk end with the selection tool onto the **end** of another trunk (or finish a new trunk there). el.esy.CAD asks, and **merges** both into one trunk.
- If the end lands **in the middle of** another trunk, a **branch** is created after confirmation.
- “Cancel” leaves the end simply where it was dropped, without a connection.

**Across sheet boundaries** – for example from the ground floor to the first floor – this works only via the context menu: right-click a free trunk end › **Connect to another trunk ...**. In the dialog, choose the **Target sheet**, the **Target trunk** and its end (A or B). If you choose the same sheet there, both trunks are merged as above. If the two chains have different trunk types, el.esy.CAD asks which should apply.

An end connected across sheets carries, instead of the simple label, a blue reference, for example “Trunk1.1 B → OG / Trunk1.2”. A click on it jumps to the counterpart on the other sheet. Right-click a connected end › **Disconnect** releases the chaining again; for an end at the cable riser, release it there with **Disconnect from cable riser**.

## Trunk type: bundle, duct, tray, conduit {#trunk-ausfuehrung}

A trunk is initially a loose **bundle**. In the properties panel, under **Trunk type**, you set whether the cables instead lie in a **cable duct**, on a **cable tray** or in a **conduit**, and state the dimension in centimetres: width and height for duct and tray, the diameter for a conduit. The setting applies to the whole [chain](#trunks-verbinden). If two chains with different trunk types meet when connected, el.esy.CAD asks which should apply; if only one side has a trunk type, that one applies. It changes nothing on the plan, in the cable lengths or in the bill of materials; it is needed for the IFC export.

## Installation zone of a trunk {#trunk-zone}

A trunk, too, runs in the installation zone of its sheet if you give it no setting of its own ([storey data](#geschossangaben)). Under **Installation zone** in the properties panel, or in the [context bar](#kontextleiste), you set its own zone – for example a cable duct under the ceiling or a conduit in the floor, while the socket cables run lower down. The zone applies to all cables in the trunk, not to their [own zones](#leitung-zone): they lie in the carrier. Where a cable enters or leaves the trunk, the height difference counts as a vertical piece in the installation length; in the IFC export, the carrier lies at this height. Unlike the trunk type, the zone applies only to this section, not to the whole chain – a chain across the cable riser connects different storeys.

## Cable riser {#kabelschacht}

The cable riser connects sheets vertically – a riser zone, a core drilling, a cable duct between storeys.

1. Select {{befehl:werkzeug.kabelschacht}}.
2. Click the first corner and the opposite corner of the penetration.
3. In the dialog, choose an **existing riser group** or create a new one (“Schacht Nord”).

If both clicks lie practically on top of each other, a riser of standard size is created around this point. The same riser group is placed on each storey at the corresponding position – this is how the program knows that it is the same cable riser. Which storey lies above which follows from the levels of the sheets, or otherwise from their order (further right means higher) – see [Storeys](#etagen).

### Connecting cables and trunks {#schacht-anschliessen}

If you place the end of a cable or trunk on the cable riser, the connection dialog asks:

- **Choose existing riser line** – the list shows, for each riser line, its number, its contents and the storeys on which it is already connected (“S2 – Trunk 2 (ground floor, 1st floor)”).
- **Create new riser line** – for the connection to which something is later attached on another storey.

{{video:12-kabelschacht-leitung}}

**Continuing on the other storey:** right-click a cable that ends at the riser › **Continue on “OG” (S2 …)**. This switches to that sheet, shows the penetration there and starts the cable tool directly on this riser line – you only click the target. For each storey on which the group occurs and the riser line is still free, there is a separate entry.

**Releasing:** A cable end cannot be pulled away from the riser. Right-click the cable › **Disconnect start from cable riser** or **Disconnect end from cable riser** frees it again. For a trunk, use the entry **Disconnect from cable riser** at the trunk end.

{{video:13-kabelschacht-trunk}}

Besides name, dimensions and rotation, the properties panel of a cable riser shows:

- **Change riser group …** assigns the penetration to another riser group. If connections are already attached, the program asks beforehand: riser line numbers apply only within one group, so the connections are released; the ends remain in place.
- **Riser lines at this penetration**, with their contents (see below).
- **Continues to** names the sheets above (↑) and below (↓) on which the riser group occurs; a click jumps there.

### Naming riser lines {#strang-benennen}

A riser line can carry a name, for example “Riser flat 3” or “Data 1st floor”. You give it when connecting: in the connection dialog, below the riser line list, there is the field **Riser line name**. For a new riser line it is empty; for an existing one, it shows the current name, which you can change if you wish. The same field appears in the target dialog when a cable runs in the bundle as far as the riser. The name is optional.

Change the name afterwards in the properties panel – at the cable riser, in the list “Riser lines at this penetration”, or at the cable or trunk attached to the riser line (“Riser line S2 (Schacht Nord)”). It is applied when you leave the field or press Enter. A name applies to the whole riser group, and therefore to all storeys.

At the penetration, the name appears next to the number (“S2 Riser flat 3”), also in the printout. In dialogs, in the panel and in the cable tree, what is attached to the riser line follows after it. As long as no riser line of a penetration has a name, the short line “S1 S2 S3” remains there.

A riser line connects exactly two connections. The run in the riser enters the [cable length](#leitungslaengen). The storey height is shown in the properties panel of the cable riser; if both storeys have a [level](#geschossangaben), the distance between them applies, and the field only displays it (“from storey data”).

> A cable stays in the bundle up to the riser and is continued on the other storey. So you do not draw two separate cables, but one continuous cable.

## Showing the contents of a trunk or cable riser {#inhalt-anzeigen}

What lies in a trunk, or runs through a cable riser, is shown by right-clicking the trunk or the riser › **Show contents …**. If the trunk or riser is selected, the entry also appears in the context bar under “Actions”.

At the top of the dialog is a **cross-section**: each cable is a circle in its colour, with the cable number. A trunk is a frame around its cables – round for a conduit, square for duct and tray. In the cable riser, each riser line has a group with its number and name. If a cable runs in the bundle up to the riser, its circle lies within the frame of the trunk, and its own riser line number stands small beside it. The cross-section is an overview, not a true-scale plan: all circles are the same size.

Below it follows the **list** with number, description, both ends, cable type and length; for a trunk, also the sections; for a riser, the riser line. A click on a circle marks the row, and vice versa. **Show** jumps to the cable in the plan and selects it.

- For a **trunk**, the dialog shows the whole chain, also on other storeys. Cables that do not run through the clicked section are shown paler.
- For a **cable riser**, it shows what runs through this penetration.

In the dialog you can change the name of the trunk, the names of the riser lines, and the description and cable type of each cable. Every change takes effect in the plan at once and can be undone individually. Text fields apply their change when you leave them or press Enter.
