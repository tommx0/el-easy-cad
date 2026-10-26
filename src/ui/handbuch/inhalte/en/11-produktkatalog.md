# Product catalogue

The catalogue supplies the components you place in the plan: name, article number, manufacturer, image, schematic symbol, dimensions, connection points and – for network devices – ports and PoE data. Several ready-made catalogues are included; your own catalogues come in addition to them.

## Manage catalogues {#kataloge-verwalten}

{{befehl:katalog.oeffnen}} opens the catalogue management.

![The catalogue dialog: catalogues on the left, components as cards](katalog.png)

- On the left, the **catalogue tabs**: “All catalogues” and below it each individual catalogue with its number of components. Use **+** to create a catalogue of your own. Your own components end up in the catalogue “Custom components”.
- **Built-in catalogues are read-only.** Clicking one of their cards only shows the component. **Edit as custom component…** creates a copy that you can change freely; it remembers which component it was made from. Built-in catalogues can only be set active or inactive, not renamed or deleted.
- On the right, the **components** as cards with symbol, name and category. The search field filters by manufacturer, article number and name; the list next to it filters by category. It only offers the categories that occur in the catalogue selected on the left.
- **Duplicate** under a card creates a copy that you can change freely – the most convenient way to make your own variant.
- A catalogue can be exported on its own and passed on; **Import catalogue…** ({{befehl:datei.import-katalog}}) reads such a file back in.

## Update built-in catalogues {#kataloge-aktualisieren}

New versions of the built-in catalogues come with every program update – or in advance as a single catalogue file (`.eeckat`), without reinstalling the program.

1. Choose {{befehl:datei.import-katalog}} and open the catalogue file.
2. el.easy.CAD recognises a built-in catalogue and shows beforehand what changes: how many components are new, updated, unchanged or retired. **Import** applies the new version. If the catalogue is already up to date, nothing happens.

In detail:

- Only newer content is applied. An older file does not roll anything back.
- **Your own components remain unchanged** – including those you derived from a built-in component.
- A component that the manufacturer has withdrawn is **retired**: it no longer appears when placing or in catalogue management, but it stays in existing plans.
- If the manufacturer withdraws a **whole catalogue**, it disappears from the catalogue tabs as well; the preview states this before you import. Components from that catalogue that are already placed remain unchanged in the drawings.
- **Components already placed are updated** as soon as you open a drawing: image and symbol immediately, connection points, dimensions and text positions when the drawing is opened. Connected cables stay at their connection point – it is found again via its position or terminal designation – and are re-routed. Terminal numbers, terminal designations and the values of variable texts remain. A note tells you how many components were adjusted; {{befehl:bearbeiten.rueckgaengig}} takes the update back. If no counterpart can be found any more for an occupied connection point, the cable is disconnected there and the note asks you to check.

## All catalogues at once: the library {#bibliothek}

{{befehl:datei.export-bibliothek}} (**Catalogue** menu or catalogue management) writes all catalogues – your own as well as built-in ones – together with the **device types and rules** into a single file (`.eecbib`). This is the convenient backup of your catalogue stock and the way to move it to another computer.

{{befehl:datei.import-bibliothek}} reads such a file in. Beforehand a dialog lists each catalogue contained and proposes what should happen; you can change this for each catalogue:

- **Built-in catalogues** are updated if the file contains newer content – as described above. If the catalogue is already up to date, it is set to “Skip”.
- **Custom catalogues** that do not exist here yet are imported. If one with the same ID already exists, it is initially set to “Skip” – choose “Replace existing” or “Create as copy”.
- **Custom components** are only added as an additional catalogue, so that they do not merge with the catalogue here that collects your own components.
- **Device types & rules** – which device types exist, which slots they have, which targets are usual and which control types there are – are adopted if the file contains a newer version. The manufacturer maintains these rules; they cannot be changed in el.easy.CAD itself.

## Create a component {#komponente-anlegen}

**+ New component** at the top right ({{befehl:katalog.komponente-neu}}) creates a new component – in the custom catalogue selected on the left, otherwise in “Custom components”. The form is long; only **Name** and an image or symbol are required. Enter everything else as far as you need it.

1. Enter **Name**, **Manufacturer** and **Article number**.
2. **Max. power consumption** and – only for devices fed via PoE – **PoE power draw** in watts. The PoE value feeds the [PoE total](#poe) at the switch.
3. Enter the **ratings** where known: rated current (A), rated voltage (V), number of poles and IP rating as on the rating plate, e.g. “16”, “230”, “3” and “IP44”. They are needed for the IFC export; empty fields are simply left out. A variant takes over the values of the main component – for a variant enter only what differs, e.g. “IP44” for the damp-location version.
4. Choose a **category** or type a new one – the component selection filters by it.
5. **Type** is the device type: one of the 14 roles from operating device to server (overview under [control assignments](#wirkverbindungen)). It determines which slots, usual targets and controls the component has; “No type” is allowed. It is only the default for newly placed components and can still be changed in the properties panel.
   - For types with a control (actuator, load) you can preset the **control**, e.g. “Dimming” for a dimming actuator.
   - Under **Circuit** you set how the component counts in the [distribution board from rooms](#verteiler-aus-raeumen): by device type, none, room circuit, or own circuit with a **number of poles** (1~ or 3~, for example for a cooker). The default also applies to components already placed, as long as nothing of their own has been set there.
   - For types with slots (and for components without a type), below are the **slot templates** – the slots with which every newly placed component starts – and, for an operating device, the **slot matrix** (1 or 2 columns, number of rows, individual rows of a different width). See [Device groups and slot matrix](#geraetegruppen).
6. **IFC class** and **IFC type** determine what the component appears as in an IFC (BIM) model. By default it follows the preset of the device type – a junction box, for example, as a socket outlet, an operating device as a switch. If a component differs from that, choose the suitable class from the list here, e.g. “Luminaire” for a light outlet, or for a junction box the type DATAOUTLET for a data outlet. If no type fits, choose “custom type” and enter a name, e.g. “weather station”. Without a device type and without your own entry, the component stays unassigned in the IFC model. Accessories such as flush-mounted boxes or mounting sets get the class “Accessory – part of the device”: in the IFC model they are added to the device they sit on. The setting applies to all placed components of this entry and travels with the catalogue export.
7. **Design** is independent of the type and determines the behaviour in the plan: **Standard** (a component with ports then counts as a switch), **Patch panel** or **Distribution board**. A distribution board receives a location designation (+UV1) and a [board layout](#verteiler) when placed.
8. **Equipment reference designation (letter)** – for example F for circuit breakers, RCDs and fuses, K for relay and contactor coils and their contact blocks, X for terminals, P for meters. When placing, the program suggests the letter plus the next free number (“F1”); if left empty, there is no suggestion. For the letter K the **role** also appears: **Coil** or **Contact block**. It is the basis for the [cross-reference](#kennzeichen) on the symbol and for the check in the [equipment list](#betriebsmittelliste) (exactly one coil per reference designation).
9. **Main group** (product family, e.g. “Door communication”) and **Subgroup** (role in the installation, e.g. “Door station”) organise the component in the catalogue.
10. Upload a **product image** and/or a **schematic symbol** as an image file – at least one of the two. You can also [draw a symbol yourself](#symbol-zeichnen).
11. Under **Symbol and terminals** set the size, mounting location and connection points; see [Set connection points and labels graphically](#dockpunkte-grafisch).
12. **Technical data** as free lines “Key: Value” and – if needed – **variants**; see [Variants](#katalog-varianten).

Modular carriers such as the System 106 housings are created in the Catalogue Studio; the catalogue dialog of el.easy.CAD has no field for them.

## Set connection points and labels graphically {#dockpunkte-grafisch}

In the **Symbol and terminals** section of the catalogue dialog you work directly on the symbol or product image – so one must be uploaded or drawn first.

1. **Connection points:** Without your own definition, every component has 8 standard points (four corners, four edge centres). **+ Place freely (mouse)** takes them over as a starting point: a click on a free spot of the image sets a connection point, a click on an existing point removes it. Below the image all points are listed with their position; **trunk only** reserves a point for trunks. For switches and patch panels, choose **+ Port groups** instead – per group the port type, number and rows, plus optional special trunk points on the upper edge. **×** returns to the 8 standard points.
2. Each freely placed connection point can carry a **name** in the field next to it (e.g. “13”, “A1”, “L1”, “PE”). It appears in the plan to the upper right of the connection, appears in the cable list as “X1:3” (reference designation:name), and is shown when a cable or wire is connected to the connection point. The selection next to the name gives it its own **text colour**; “like the component” keeps it in the component colour.
3. **Texts** on the symbol – such as labels or [variable texts](#variable-texte) – are placed with a click in the text preview and dragged to their position. They can also have their own **text colour**. Own colours apply in the plan as long as the component has the default colour.
4. The **width factor** stretches wide devices such as switches without distorting the image. The **height factor** makes a symbol correspondingly taller, e.g. for a long terminal block. Catalogue texts and terminal designations keep their size; for modular carriers the factor has no effect.
5. **May be part of a combination** (on by default) determines whether the component groups with others into a [combination](#wandfang) on the wall. Without the tick it snaps alone to the wall, in normal size, and takes no other component next to it – for example for a sub-distribution board. The same field exists in the Catalogue Studio (inspector, Module section).
6. **Mounting location** (ceiling, wall or floor, wall by default) is the default when placing – in the plan it can be changed per component ([Mounting location](#installationshoehe)). This field also exists in the Catalogue Studio.

## Variable texts {#variable-texte}

A variable text is a place on the symbol whose content you enter only in the plan, for each component – for example the rated current and characteristic of a circuit breaker (“B16”) or the cross-section of a terminal.

1. Click the desired spot in the text preview of the catalogue dialog. The new text is selected straight away; dragging moves it.
2. Under **Kind** choose “Variable text” and give a **field name**, e.g. “Rated current”. Under this name the field later appears in the properties panel.
3. Optionally enter a **default value**. If it stays empty, the preview shows the field name in square brackets; in the plan nothing appears until you enter a value.
4. Set the **font size** (as a percentage of the symbol height) and the **alignment**. The text grows with the symbol. Under **Rotation** it can be turned in 90° steps: at “0°” it always stays horizontal, even when the component is rotated. A rotated text turns with the component, but never stands upside down – it always reads from below or from the right. This applies to fixed and variable texts alike.
   If a variable text should instead sit rigidly on the symbol, like a text drawn into the symbol, tick **Fix to symbol**: it then rotates with the component into every position, and at 180° also upside down. In this case the rotation gives the angle relative to the symbol.
5. Tick **List in the bill of materials** if the value distinguishes the material – then it appears in the [bill of materials](#stueckliste) in the column “Details”.

Components already placed keep their texts. New variable texts appear on your own components only on those placed afterwards; built-in components are updated when the drawing is opened (see [Update built-in catalogues](#kataloge-aktualisieren)).

## Variants {#katalog-varianten}

If a product comes in several colours or versions, do not create separate components for it; create variants instead:

1. Open the component in the catalogue dialog and, below **Variants**, click **+ Add variant**.
2. For each variant enter **Colour/finish**, e.g. “pure white glossy”, plus, if needed, its own **article number**, **name**, its own **image** or **symbol** and differing **ratings**. Empty fields are inherited from the component.
3. Save.

When placing, the field **Variant** appears below the component selection; the variant with the lowest article number is preselected. If a component has variants, one of them is always set. In the [bill of materials](#stueckliste) each variant appears as its own line with its article number. Change the variant later via [Replace components](#austauschen).

## Slot count from a variable text {#slotanzahl-aus-text}

A variable text can also determine the number of slots – for example “Number of rockers” on a touch sensor. This is set in the Catalogue Studio on the **Slots** tab under **Slot count depends on**. The first number in the text counts: “3”, “3-fold” and “Rockers: 3” each give 3. For device types with a slot list this is the number of slots (at most 32); for types with a slot grid it is the number of rows (at most 8). New slots first take the names of the slot templates, then counting continues (“Button 3”, “Button 4” …).

## Set snap point {#fangpunkt-setzen}

Below the connection points a separate preview shows the [snap point](#fangpunkt) – the point that hangs from the mouse pointer when placing and snaps to the grid. Without your own setting, it is the first connection point (shown dashed); with the 8 standard points it is the centre.

1. Click in the snap point preview. Near a connection point or the centre, the point snaps there; the fields x and y below allow exact values (0 to 1).
2. **×** next to the heading removes the setting; then the first connection point applies again.

Components of your own that are already placed keep their snap point – a change applies to all components placed afterwards.

## Draw a symbol yourself {#symbol-zeichnen}

If a schematic symbol is missing, draw it yourself in the catalogue dialog: lines, circles, arcs and text on a grid, plus an eraser. The result is saved as an SVG with the component and behaves like a purchased symbol – it can be coloured in the plan and resized.

- **Arc:** Choose the “Arc” tool, then click in turn the centre point, the start (this sets the radius) and the end. The arc runs clockwise from the start to the end.
- **Eraser:** Drag over the drawing with the mouse button held down. The trail belongs to the elements it touches – if you move an element, the hole moves with it; elements drawn later are unaffected. Choose the brush size in the bar.
- **Colour:** Draw lines and text in one of eight colours (black, white, grey, red, orange, yellow, green, blue); closed shapes you fill in one of these colours as well. The chosen colour applies to new elements and to the selection. In the plan each symbol appears in its own colours as long as the component has the default colour. If you choose another colour for the component, the symbol is coloured like any other in that colour.
- **Change an existing symbol:** A built-in, uploaded or Catalogue Studio symbol also opens with all its parts via **Edit symbol…**, so you do not have to redraw it. The parts can be selected, moved, recoloured, erased and deleted; set line and text size as usual and change texts by double-clicking. The shape of a part itself (for example the curve of an arc) stays as it is – draw anything new on top. If an SVG contains something that cannot be taken over without loss (masks, gradients), it is shown only as a background template, as before.

## Many components at once: Excel import {#excel-import}

For larger custom catalogues there is the bulk import from an Excel workbook: select the catalogue on the left, then **Import from Excel…**. Built-in catalogues cannot be filled this way. One row per component, with columns for name, manufacturer, article number, dimensions, ratings (rated current, rated voltage, number of poles, IP rating), image file, symbol file and variants. Download the **sample files** with all columns and example rows in the import dialog via **Download sample files** – fill these in rather than setting up the columns yourself.

Enter images and symbols as file names; when importing, you also select the matching folder.

For the English interface and English plans there are optional columns **Name (en)**, **Category (en)**, **Main group (en)** and **Subgroup (en)**, and on the “Variants” sheet **Colour/finish (en)** as well. Empty cells change nothing; without English text the German appears. Older tables without these columns can still be read.

## Cable types {#kabeltypen}

{{befehl:katalog.kabeltypen}} manages the cable types (NYM-J 3×1,5, Cat.7, …). They apply across all drawings, not only in the open project; renaming a type affects every drawing that uses it.

- On the left, filter by **Group**; a search field at the top searches.
- The **built-in types** (marked “Built-in”) cannot be edited or deleted, only removed from the selection via **Active**/**Inactive**. **Duplicate** creates a copy that you can change freely.
- **New cable type…** or **Edit** for your own types asks for **Name** (as it appears in the plan), **Group**, a **Remark** (visible only in the dialog, helps with searching) and, optionally, the **outer diameter** in mm.
- If an open drawing contains cable types that are missing here, **Add to my cable types** adds them to your stock.

Which type a cable uses is set when drawing, in the properties panel or via right-click – see [Set cable type and zone in advance](#kabeltyp-waehlen).
