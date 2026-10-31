# Lists and plan inserts

Plan inserts are tables and diagrams that are derived from the drawing and placed **on** the sheet.
They keep themselves up to date: when a component is added, it appears in the bill of materials
without you having to enter it.

All inserts are in the **Inserts** menu. Operation is the same for all of them: choose
the tool and click on the sheet – the click sets the top left corner, and the insert grows with its
contents. You set the size, column widths and font size afterwards in the properties panel.

## Bill of materials {#stueckliste}

{{video:10-listen}}

{{befehl:werkzeug.stueckliste}} lists all placed components with quantity, name, manufacturer and
item number. In the properties panel, choose whether the list covers only the current sheet or the
entire drawing.

If components carry [variable texts](#variable-texte) that are marked for the bill of materials, a
**Details** column is added (“Rated current: B16”). Identical components with different details
then appear on separate lines.

In the floor plan, the name is followed by the [installation method](#verlegeart): “Single socket
outlet (FM)” and “Single socket outlet (SM)” are counted separately.

![Bill of materials and cable list as inserts on the sheet](einlagen.png)

## Switch port plan {#switchplan}

{{befehl:werkzeug.switchplan}} shows a port strip for each switch with its assignment: port, target,
cable number, PoE demand and the total per device. This is the patch list for commissioning.

## Patch panel plan {#patchpanelplan}

{{befehl:werkzeug.patchpanelplan}} does the same for patch panels – which port leads to which
outlet.

## Cable list {#leitungsliste}

{{befehl:werkzeug.leitungsliste}} lists all cables with number, type (cable type), From, To, the
sheets they run across, the **length** measured on the plan and the **routed length** (including
connection reserve, riser section and vertical pieces, see [cable lengths](#leitungslaengen)). If
cables are connected in a distribution board, the **Circuit** column is added (“UV1-F4 / X6 · RCD
F2”, also for cables that are looped through). It can be switched off in the properties panel of
the list. There you also set the **connection reserve per cable end**, which applies to the whole
drawing.

**Changing the cable type from the list:** Double-click the type cell of a row to open the dialog
**Change cable type** for this cable. The choice takes effect immediately – including on the
continuation of the cable through a cable riser. **Apply to all…** sets the same type for all cables
of the drawing, across all sheets, after a confirmation prompt; undo reverses it.

## Trunk list {#trunkliste}

{{befehl:werkzeug.trunkliste}} shows, for each trunk, which cables run in it and how many cores come
together – the basis for choosing the cable duct.

## Room list {#raumliste}

{{befehl:werkzeug.raumliste}} lists the [rooms](#raeume) with room type, name and area, with a total. The room type comes
before the name; a room without one leaves the cell empty. The Excel export has the column too.

## Equipment list {#betriebsmittelliste}

Only in a [schematic](#zeichnungsart): {{befehl:werkzeug.betriebsmittelliste}} lists each component
with its reference designation (e.g. “K1”, “F3”) – reference designation, component type and
[location](#koordinatennetz) (e.g. “Sheet 3-F2”) for each occurrence. For relays and contactors
(reference designation “K”), the list also checks whether each coil has at least one contact block
and vice versa. If the counterpart is missing, wherever it is, a note “No counterpart found”
appears. For the other reference designations (circuit breakers, RCDs, fuses, meters, terminals) a
single occurrence is normal, so there is no warning for them.

## Circuit schedule {#stromkreisverzeichnis}

{{befehl:werkzeug.stromkreisverzeichnis}} sets up the legend for the distribution board door: one
row per circuit with reference designation, type, phase, RCD, circuit name, terminals, cables, cable
type and devices, in the order of the tree. RCDs and upstream fuses appear as group rows above. A
circuit includes everything that hangs on its power path – cables on its terminals and channels, and
devices that are looped through. The circuit name is taken from the label of the fuse in the
[board layout](#verteiler-bestueckung); otherwise from its terminals, otherwise from the rooms of the
devices. You choose which distribution board is meant in the properties panel; in the
[distribution board diagram](#verteilerplan) it is the board of that diagram. The Excel export
contains one sheet per board, “Circuits +UV1”.

## Actuator channel list {#aktorkanalliste}

{{befehl:werkzeug.aktorkanalliste}} fills in the list of channels for each [KNX actuator](#knx-aktor)
of a distribution board – as a template for ETS programming and as a record for acceptance. Each
actuator gets a group row (-K1 switch/blind actuator 8-fold); below it, each channel gets a row – a
blind pair appears as “A3/A4” – with **Function**, **Label**, **Room** and **Load**, **Circuit** (for
example “UV1-F3 · RCD F1 · L2”), **Terminal** and **Triggered by**: the KNX device with rocker or
slot from the [control assignment](#wirkverbindungen). Free channels are shown as “spare”, and the
total counts used and spare channels. You choose which distribution board is meant in the properties
panel; in the distribution board diagram these are its actuators, supplemented by the floor plan; in
a schematic without a distribution board, the actuators with their own details. The Excel export
contains a sheet “Actuator channels +UV1”.

## Potential list {#potentialliste}

Only in a [schematic](#zeichnungsart): {{befehl:werkzeug.potentialliste}} lists all
[potentials](#potential) in the drawing, one row per name, with the number of occurrences and the
[locations](#koordinatennetz) where they appear. A named wire that runs across several fields
therefore appears only with its sheet. A potential with only one occurrence counts as orphaned: the
list flags it with “Only one occurrence”, because a potential should appear at least twice in order
to connect anything.

## Control logic {#steuerungslogik}

{{befehl:werkzeug.steuerungslogik}} shows what acts on what: source, slot, target and the type of
[control assignment](#wirkverbindungen).

With “Hide unassigned slots” in the properties panel, slots that switch nothing disappear. A device
with no control assignment at all stays in the list, with the row “no control assignment”, so that it
does not go unnoticed. The Excel export follows this setting as soon as a control logic table in the
project uses it.

## Cable tree {#leitungsbaum}

{{befehl:werkzeug.leitungsbaum}} draws the network structure as an organisation chart: from the
distribution board, via the trunk groups, to the end device, with lengths for each section. Below an
electrical distribution board, each circuit has an intermediate level (“F3 B16” with label, phase,
RCD and terminals), and below that the devices that hang on it – including those behind a terminal.
Unlike the lists, this is a graphic, which makes it well suited as an overview sheet for the client.

## Title block {#plankopf}

{{befehl:werkzeug.plankopf}} places a title block to DIN EN ISO 7200 on the sheet, 180 mm wide on
paper – it prints at the same size at every scale. From the factory it has five rows, with the fields
**Legal owner**, **Title**, **Supplementary title**, **Document type**, **Created by**, **Checked by**,
**Date**, **Scale**, **Drawing number**, **Sheet** and **Revision**. Only three are pre-filled: the
date with the day of insertion (as fixed text), the scale and the sheet name. The last two update
automatically.

1. Choose the tool and click on the sheet – the click sets the top left corner.
2. A double-click on the title block (or **Label fields…** in the properties panel) opens the dialog
   **Edit title block**.

In the dialog, everything is free. For each row you set the **Height** in mm; for each field the
**Label**, the **Content** and the **Share** (how wide the field is within its row). Under **Source**,
a field takes its content automatically from the drawing instead: name of the drawing, name of the
sheet, sheet x of y, scale of the sheet, sheet size, or today’s date. **Logo › Insert** places your
company logo in a field. You can add or delete fields and rows; **Restore DIN default** restores the
factory layout.

In the properties panel, you change the **Width on paper**; **Bottom right in the print area** moves
the title block to its usual place. Without a print area set up, it is shown for the time being as at
1:100.

Store the logo once in the program settings under **Company & title block**; it then applies to all
plans.
