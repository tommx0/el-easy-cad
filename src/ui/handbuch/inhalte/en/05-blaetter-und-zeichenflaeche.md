# Sheets and print area

A drawing consists of any number of **sheets**, usually one per storey. Each sheet has its own
background plan, its own print area and its own scale. The catalogue, layers, cable numbers and trunk
chains, however, apply to the whole drawing.

## Creating and arranging sheets {#blaetter}

Above the drawing there is a tab for each sheet. A click switches sheet, a double-click renames it, and
dragging changes the order. **+ Sheet** adds a new one. The [print area setup](#zeichenflaeche-einrichten)
opens straight away, because a sheet without a print area cannot be printed. If you want to set it up
later, close the dialogue with **Cancel**. In a [schematic](#zeichnungsart) this does not apply: there,
every new sheet already comes with its fixed print area.

If not all tabs fit across the width, small arrows appear at the left and right that scroll the bar.
The mouse wheel over the tabs scrolls it too. The sheet you have open always stays in view. When you
reorder tabs, the bar keeps scrolling for as long as you hold the dragged tab over an arrow.

{{befehl:blatt.verwaltung}} opens sheet management: all sheets in a list, for switching, renaming,
deleting and creating.

## Inserting storeys {#etagen}

The order of the tabs is also the order of the storeys: further right means higher up. In a floor plan,
**+ Sheet** therefore opens a small menu:

- **Empty sheet** – as before, added at the end.
- **Insert storey above …** or **Insert storey below …** – a new storey directly next to the open sheet,
  at the right place in the order.

When you insert a storey, a dialogue asks for name, clear room height and ceiling thickness. Everything
is pre-filled from the open sheet: “EG” (ground floor) becomes “1. OG” (first floor) above it, or “UG”
(basement) below it. The level is calculated from these values. Above the open sheet, the floor lies
higher by the room height and ceiling of the open sheet; below it, the floor lies lower by the ceiling
and room height of the new storey. You can also enter the level yourself. If the open sheet has no level
yet, it gets 0.00 m.

If you insert a storey between two existing ones, for example above the ground floor when there is
already a first floor, the existing storeys make room for it. The first floor and all storeys above it
move up by the height of the new storey; storeys below move down accordingly. The dialogue shows by how
much. If you do not want this, untick the box. If the suggested name is already taken, the dialogue
suggests “1. OG (neu)”. Rename the storeys afterwards as you wish.

The new storey takes over **walls with doors, windows and wall penetrations, rooms, stairs and floor
slabs** from the open sheet, congruent in the same place. It also takes over the print area, origin and
scale. Components, cables and the background plan are not carried over. Stairs come along only when you
insert **below**: a storey above shows the [stairs from below](#treppen) anyway, because they arrive
there. Change or delete whatever is different on the new storey afterwards, as usual. Undo takes back the
insertion in one step.

{{befehl:blatt.etagen}} (**Sheet** menu) shows all storeys from top to bottom, with level, clear room
height and ceiling thickness. It is the simplest way to check and change the heights of the whole
building. An empty ceiling field shows what currently applies, calculated from the levels or assumed.

There, each storey has two height values, and you can change both:

- **Level** – the absolute height of the floor relative to ±0.00, usually the ground floor. Basements are
  negative; upper floors are positive.
- **Above storey below** – the relative height, that is, the distance to the level of the storey below.
  For the first floor above the ground floor, for example, this is 2.70 m. The lowest storey has no value.

If you change the relative height, clear room height or ceiling of a storey, the other storeys move by
the difference, so that ±0.00 stays where it is. Above the ground floor, the storeys above move up; in the
basement, the storeys below move down. Without a tick at **Move other storeys along**, only the level of
the storey you are editing changes. Changes take effect only with **Apply**.

## Storey data and installation zone {#geschossangaben}

If nothing is selected on a sheet, the properties panel shows four values under **Storey**. They count
for cable lengths and for the IFC export:

- **Floor level** – the height of this storey's floor in metres. If two storeys at the
  [cable riser](#kabelschacht) have a level, their difference counts as the storey height.
- **Clear room height** – from the floor to the underside of the ceiling.
- **Ceiling thickness** – how thick the structural slab above this storey is, in cm. If the field is
  empty, it shows the value that currently applies: calculated from the levels, or assumed. Individual
  [rooms](#raeume) may deviate from it. For all storeys at once, use the [storey overview](#etagen).
- **Installation zone** – where the cables run horizontally. Each zone exists **on** the building element
  (surface-mounted, SM) and **in** it (flush-mounted, FM). See the table.

| Zone | on (SM) | in (FM) |
|---|---|---|
| Ceiling | under the ceiling | in the middle of the structural slab |
| Upper zone (30 cm below the ceiling) | on the wall | 3 cm into the wall |
| Middle zone (1.00 m) | on the wall | 3 cm into the wall |
| Lower zone (30 cm above the floor) | on the wall | 3 cm into the wall |
| Floor | on the floor | 5 cm into the floor build-up |

The three wall zones follow DIN 18015-3. On and in the wall, a cable runs at the same height. In the
[3D view](#dreid-ansicht), each zone has its own colour. You can add further zones under
[Custom installation zones](#installationszonen).

With an installation zone, el.easy.CAD also calculates the **vertical sections**: at each cable end, from
the zone to the mounting height of the device, and at the cable riser, the difference between the zones of
both storeys. The mounting height is the installation height of the component. Otherwise it is the usual
height of its device type (switch 1.05 m, socket 0.30 m …), and otherwise 1.05 m. A device with the
[mounting location](#installationshoehe) ceiling sits under the ceiling; for this, the clear room height
is needed. A device at floor level sits on the floor. The upper zone and the ceiling also need the clear
room height. For “in the ceiling”, the thickness of the ceiling counts: the entered ceiling thickness,
otherwise the level of the sheet above minus the clear room height. If that is missing too, the program
uses 20 cm.

Up to version 0.10.13, the zones “Ceiling” and “Floor” were located in the structural slab and 5 cm into
the floor build-up, respectively. Since then they are called “Under the ceiling (SM)” and “On the floor
(SM)”. The vertical sections of older drawings with these zones become slightly shorter or longer
accordingly. If you need the old position, choose “In the ceiling” or “In the floor”. If you change
nothing, everything stays as before; the [cable lengths](#leitungslaengen) change only when you set the
zone.

The zone on the sheet is the **default**. If individual cables run differently, for example the socket
circuits at the bottom, or lighting and switches at the top, change the zone on the [cable](#leitung-zone)
or on the [trunk](#trunk-zone).

Below that, you can switch on **cables only in wall, ceiling or floor**. Cables then run along the walls.
Where they cross a room, they lie in the zone you select under **Room crossing**: under or in the ceiling,
on or in the floor. More on this under [Only in wall, ceiling or floor](#nur-in-bauteilen).

On a sheet from an IFC model, the level comes from the model, and the clear room height is pre-filled from
the ceiling above, as far as the model contains it. Check the value. You enter the zone yourself. What you
have entered on the sheet is kept even when a new IFC version is read in.

## Custom installation zones {#installationszonen}

If the ten standard zones are not enough, for example for a cable duct at 2.20 m height or for cables
8 cm deep in the screed, set up your own under {{befehl:katalog.installationszonen}}. Each zone has:

- a **name**, under which it appears in all selection lists, and an **abbreviation** (up to three
  characters) for the references on the plan,
- the **building element**: ceiling, wall or floor,
- the **installation method**: on the building element (SM) or in it (FM). For “in”, the **depth** to the
  centre of the cable. In a ceiling without a depth, the cable lies in the middle of the structural slab,
- for a wall, the **height**: measured above the floor or below the ceiling,
- a **colour** for the [3D view](#dreid-ansicht).

The standard zones cannot be changed. With **Duplicate**, you create your own copy, which you can adjust
freely. With **Active** or **Hidden**, you remove a zone from the selection lists without any drawing that
already uses it losing anything. You can delete only a custom zone that the open drawing does not use.

Custom zones apply to all drawings on this computer. Each drawing carries a copy of the zones it uses, so
it calculates the same way on another computer. If you open a drawing there that uses zones that do not
exist yet, adopt them in the same dialogue with **Add to my zones**. If you change a custom zone, every
drawing that uses it calculates with the new values, including the cable lengths.

## Setting up the print area {#zeichenflaeche-einrichten}

The print area is the blue dashed frame on the sheet. Exactly its content ends up on paper. Above the frame,
on the left, are the paper size and scale.

![Setting up the print area: format, orientation, scale](zeichenflaeche.png)

1. Open {{befehl:blatt.zeichenflaeche-einrichten}}.
2. Choose the **paper size** (A4, A3, A2, A1 or A0).
3. Set **portrait or landscape**.
4. Choose the **scale**: from the list (1:20, 1:50, 1:100, 1:200, 1:500), or type it freely as 1:…. It
   determines how much building fits on the sheet. **Fit once** suggests a scale at which the existing
   drawing fits on the sheet.

{{befehl:werkzeug.zeichenflaeche-verschieben}} places the area over the correct section of the plan.
Choose the tool, then drag the area to its new position.

## Coordinate grid in the schematic {#koordinatennetz}

In a [schematic](#zeichnungsart), the print area of each sheet is fixed: **DIN A4 landscape at a scale of
1:40**. It can be neither set up nor moved. {{befehl:blatt.zeichenflaeche-einrichten}} only shows the values.

A coordinate grid lies over the area: eight columns **A–H** from left to right, and six rows **1–6** from
top to bottom. The letters and digits stand in the margin. On screen, faint field lines also help when
placing components; only the margin labels are printed. The status bar shows the **Square** under the
mouse pointer.

Each component therefore has a **location** made up of the sheet name and the square, for example
“Sheet 3-F2”. What counts is its [snap point](#fangpunkt). The location appears in the cross-reference next
to the coil and contact block of a relay, as well as in the [equipment list](#betriebsmittelliste) and the
[potential list](#potentialliste). It is not stored. It updates by itself after you move a component or
rename a sheet.

## The origin {#nullpunkt}

The origin is the reference point for the coordinate display, the grid and snap. When you set up the print
area, the origin is placed automatically on its corner.

- {{befehl:werkzeug.nullpunkt}} places it anywhere, for example on a building corner. A second click on a
  point along a building edge gives it a **direction**; the symbol shows the direction as an arrow. Length
  and angle appear in the status bar, and you can also type the angle. If you do not need a direction,
  press Enter after the first click. Object snap and snap to background help you hit the corner and edge
  exactly; the grid does not snap here.
- You can move it later with the selection tool; the direction stays.
- {{befehl:blatt.nullpunkt-alle}} transfers it, including its direction, to all sheets. This is useful so
  that storeys lying on top of each other have the same coordinates.
- {{befehl:blatt.nullpunkt-aufheben}} removes it.

### Aligning sheets on top of each other {#blaetter-ausrichten}

If the floor plans of the storeys do not lie exactly on top of each other, for example because a plan is
offset or was scanned at an angle, align them at the origin:

1. On every sheet, use {{befehl:werkzeug.nullpunkt}} to set the origin on **the same building corner**. With
   the second click, set the direction along **the same edge**, for example the outer wall to the right.
2. {{befehl:blatt.ausrichten}} shows all sheets. Those that have an origin and a direction are preselected.
   The others are greyed out and say what is missing.
3. **Align** rotates each selected sheet so that the edge lies horizontal, and moves it until the origin sits
   at 0.0. Afterwards the storeys lie exactly on top of each other, including in the 3D view and in the IFC
   export.

The background and everything drawn are rotated; cables are not re-routed. Texts and labels move along but
stay horizontal. The print area and plan inserts (title block, parts list, cable tree …) are only moved, not
rotated, so the printout stays upright. If the rotated plan then extends beyond the print area, the notice
names the sheets. Set up the print area again there. One undo takes back the alignment of all sheets.

## Layers {#ebenen}

Layers separate the drawing by discipline. They apply to **all sheets** together. A new drawing comes with
six standard layers: **Background**, **Building elements** (walls, doors, windows, penetrations, stairs,
floor slabs), **Rooms**, **Components** (everything else, including geometry, texts and plan inserts),
**Cables** and **Dimensions**.

{{befehl:blatt.ebenen}} opens the management. For each layer, you set:

- **Name**. The standard layers can also be renamed.
- **Visible**. Hidden layers are neither drawn nor printed, and cannot be clicked. The layer “Background”
  switches the background plan, and it does so for each sheet individually.
- **Locked**. Objects on a locked layer remain selectable, but they cannot be moved, rotated or deleted.
- **Delete**. The objects of the layer move to “Components”, or to another remaining layer. You cannot delete
  the background, or the last layer that holds objects.

At the bottom of the dialogue, **+ New layer** creates your own layers. You choose the layer on which new
objects land in the properties panel (with nothing selected), under **Active layer**. Locked layers are not
available there.

There are exceptions to the active layer. Cables, trunks and cable risers always land on the layer
**Cables**, and rooms always land on the layer **Rooms**. If you hide “Cables”, cables and trunks disappear
together with their numbers and labels.

You change the layer of an existing object in the properties panel.

## What is labelled on the sheet {#beschriftungen}

Under **Sheet › Show labels**, you switch individually what is shown on the objects. All these switches
are also in the **Visibility** drop-down of the toolbar. In a schematic, this includes the automatic labels:
potential names, reference designations and the outgoing connections from the floor plan. At the very top
of the list there are also {{befehl:ansicht.hintergrund}} and {{befehl:ansicht.raster}}. If you had already
adjusted your **Visibility** group, the new switches appear once, at the end. Anything you remove again
afterwards stays removed. You can also place the switches individually in the [toolbar](#symbolleiste-anpassen).

| Switch | Shows on the object |
|---|---|
| {{befehl:blatt.anzeige-bezeichnung}} | The product name from the catalogue |
| {{befehl:blatt.anzeige-beschriftung}} | Your own label for the component |
| {{befehl:blatt.anzeige-installationshoehe}} | The height above finished floor |
| {{befehl:blatt.anzeige-leitungsnummer}} | The number of the cable in the trunk |
| {{befehl:blatt.anzeige-leitungstyp}} | The cable type of the cable |
| {{befehl:blatt.anzeige-leitungsbeschreibung}} | Your own text on the cable |
| {{befehl:blatt.anzeige-trunkname}} | The name of the trunk |
| {{befehl:blatt.anzeige-trunkbeschreibung}} | Your own text on the trunk |
| {{befehl:blatt.anzeige-raumname}} | The room name |
| {{befehl:blatt.anzeige-raumflaeche}} | The calculated room area |
| {{befehl:blatt.anzeige-potentialname}} | The designation (potential name) on wires |
| {{befehl:blatt.anzeige-kennzeichen}} | The reference designation: “-F3” on the schematic symbol, “+UV1” on the distribution board |
| {{befehl:blatt.anzeige-abgaenge}} | Distribution board diagram only: label and cables from the floor plan at each piece of equipment |
| {{befehl:blatt.anzeige-stromkreis}} | Floor plan only: the [circuit](#stromkreis-zuordnung) from the distribution board, “UV1-F4 / X6” |
| {{befehl:blatt.anzeige-stromkreis-schild}} | Floor plan only: the circuit on the cable label, “12 → UV1-X6 (F4)” |

Whole object types are hidden in the **Sheet** menu, directly below. {{befehl:blatt.anzeige-leitungen}} and
{{befehl:blatt.anzeige-trunks}} hide all cables and trunks on the sheet, together with their numbers. Hidden,
as on a hidden layer, they are neither visible, printed nor selectable. In the cable list, parts list and cable
lengths, they still count. Both switches are also in the **Visibility** group of the toolbar.

{{befehl:blatt.beschriftung-groesse}} sets the text size of the labels and the symbol size of the components
for the whole sheet. It is the quickest way to make an overloaded plan legible.
