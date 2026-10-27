# Background plan

Almost every project starts with an existing floor plan. The background plan lies beneath the drawing,
is never changed, and serves as a true-to-scale template.

## Loading a plan {#plan-einlesen}

{{video:01-hintergrundplan}}

{{befehl:datei.import-hintergrund}} loads PDF and DXF files as well as image files (PNG, JPG).

1. Select the file.
2. For a **PDF**, the page and section dialogue appears: page previews on the left, the chosen page on
   the right. If you need only part of the plan, drag a rectangle there. This saves memory and keeps
   the drawing clear.
3. For **DXF**, the lines are taken over directly; the colours and line widths of the template are
   kept.

![Choosing the page and section of a PDF](pdf-import.png)

The plan belongs to the sheet, not to the whole drawing: each storey gets its own.

:::nur-desktop
## IFC model as floor plan {#ifc-import}

With the **BIM** add-on, {{befehl:datei.import-hintergrund}} also reads the architect's IFC model (file
extension `.ifc`, up to 80 MB). Instead of a drawing, the program cuts each storey horizontally and
places the cut underneath as a floor plan.

1. Select the IFC file. After a short time, the list of storeys appears, with height and number of
   building elements. Auxiliary levels with only a few building elements are not preselected; empty
   ones are hidden.
2. A click on a storey shows a preview on the right. The tick box in front of it decides whether it is
   taken over.
3. Under **Building elements** are the element groups of the model with their counts: walls, doors,
   windows, structure (columns, beams), stairs and railings, ceilings and roof, other. Untick anything
   that only makes the floor plan busy, such as the timber beams of a roof structure; the preview shows
   the effect at once.
4. The **cut height** is usually 1.00 m above the floor. Anything lying lower (stair treads, furniture)
   does not appear. **Align building straight** rotates a floor plan that lies at an angle in the model,
   so that the walls run horizontally.
5. **Apply**: each selected storey becomes its own sheet, named as in the model, placed after the
   existing sheets. A single storey goes onto the current sheet if nothing has been drawn on it yet.

![Choosing the storeys of an IFC model, with a preview on the right](ifc-import.png)

If a model packs everything into a single storey, add your own sections under **Custom sections**. For
each section, enter a name and a height above project zero; each section gets its own sheet.

![Imported ground floor with door swings and an automatically set-up print area](ifc-grundriss.png)

The floor plan is true to scale straight away: calibrating is not needed, and it is disabled on these
sheets. All sheets from the same IFC file lie exactly on top of each other, including storeys added
later. The program derives door swings from the information in the model.

Unticked element groups are only hidden, not lost. {{befehl:blatt.ifc-bauteilgruppen}} shows them again
on the current sheet, or hides more of them, without reading the file again. Hidden items are neither
drawn nor printed, snapped to or converted. A new version of the model keeps each sheet's selection.

**The model arrives later:** if the current sheet already has a plan – for example a PDF plan – select
exactly this one storey in the dialogue. Then align it: click two distinctive points in the existing
plan (for example two building corners), then the same two points in the orange IFC floor plan. The
program rotates and moves the floor plan into place underneath without scaling it, and reports the
difference between the two distances. A large difference points to an inaccurate calibration of the
old plan. Your planning stays where it is; the earlier background is replaced.

**New version of the model:** if the architect sends a revised IFC file, {{befehl:blatt.ifc-nachladen}}
reads it in. A dialogue assigns the storeys of the new file to your IFC sheets, by the identifier in the
model or otherwise by name. Storeys that cannot be found you assign by hand, or leave out. Each sheet is
cut again with its previous cut height and position; your planning stays unchanged. One undo step takes
everything back. If you have [converted a storey into drawing elements](#hintergrund-umwandeln), the new
version also replaces these lines. Before that, the program asks, because changes you made to them would
be lost. Copies of such lines, and everything you drew yourself, remain.

Without the add-on, a sheet with an IFC floor plan can only be viewed; it cannot be edited or printed.
{{befehl:hilfe.meine-lizenz}} shows which add-on modules your licence contains.
:::

:::nur-desktop
## Taking over building elements from IFC {#ifc-bauteile}

The IFC floor plan is at first a background made of lines. {{befehl:blatt.ifc-bauteile}} turns the model
into real walls, doors, windows, wall penetrations, stairs and rooms: the same objects you would
otherwise draw yourself, edited with the same tools (BIM add-on).

1. Open the sheet with the IFC storey and choose the command. The program reads the IFC file that was
   saved on import and shows the building elements in colour on the plan: walls green, doors orange,
   windows blue, penetrations grey, stairs purple, rooms with a dot and name. The dialogue leaves the
   print area free; pan and zoom to check the preview.
2. The dialogue lists the types of building element with their counts. Untick what you do not need.
   Without walls, doors, windows and penetrations also drop out.
3. Below that, you see what is not taken over, or only in simplified form, such as curved walls, sliding
   doors, or areas like “GFA” that combine other rooms.
4. **Apply** places everything on the active layer. One undo takes back the whole step.

If further sheets come from the same IFC file, such as all storeys of an import, the program asks
first: **This sheet only** or **All sheets**. With all sheets, the dialogue goes through the sheets one
after another – see [Sheet by sheet](#blatt-fuer-blatt). Each sheet receives its building elements on its
own active layer. A sheet whose storey cannot be found in the model is skipped and named.

What results:

- **Walls** with axis and thickness from the model, joined at the corners with mitres. If the model has
  no axis, the program derives it from the section. Curved and irregular walls remain lines in the
  background.
- **Doors and windows** sit in their wall, with the width and, for doors, the hinge side and swing
  direction from the model. Sliding, pivot and double-leaf doors are taken over as single-leaf doors;
  check the hinge side there.
- **Stairs** come as a straight flight for each run, with the number of treads from the model and an
  arrow from the lower to the upper end. To change the form, use the properties.
- **Rooms** receive their number and name from the model. Their area results from the walls, as with the
  [room tool](#raeume). A room that is not enclosed by walls is not created; the message after applying
  gives the count.

Only what lies at the sheet's height belongs to it: walls and rooms that the cut height meets, doors,
windows and penetrations around the cut height, and stairs that begin on this storey. A second call adds
nothing twice; what has already been taken over is recognised by its identifier from the model. The
background lines remain underneath. With {{befehl:blatt.ifc-bauteilgruppen}}, you can hide walls, doors
and windows there, for example.

Taken-over building elements are ordinary drawing objects. A [new version of the model](#ifc-import)
does not adjust them by itself, so your changes to them remain. Instead, after reloading, a list opens
showing, for each sheet, the taken-over building elements that are **changed in the model**, **new in
the model** or **no longer in the model**. **Show** jumps to the element and selects it. You decide
whether to adjust it, delete it, or add it again with {{befehl:blatt.ifc-bauteile}}. What you have
changed only by hand is not listed; the comparison is between the model and its state when it was taken
over. New elements are listed only for types you have already taken over on the sheet.
:::

## Calibrating – bringing the plan to scale {#kalibrieren}

Without calibration, the program does not know how many centimetres one pixel is. Lengths, scale and
cable lengths then stay empty.

1. Choose {{befehl:werkzeug.kalibrieren}}.
2. Click the start and end point of a line whose true length you know: a dimension on the plan, a door
   width, a wall length.
3. Enter the true length in centimetres and confirm.

The “not calibrated” note above the drawing disappears, and the status bar shows the size the plan now
has. If that does not match the building, you have probably mistyped by a factor of ten. The print area
moves along, so the plan stays within it.

**Standard scale of a PDF:** a PDF knows its paper size. If the plan is drawn at a common scale (1:1 to
1:1000, including 1:25 and 1:250), el.easy.CAD recognises this when you calibrate, even if your click
is a millimetre or two off. The calibration then applies exactly at this scale, and the status bar
reports, for example, “Plan detected at scale 1:50”. The print area keeps this scale as long as the plan
content fits on the chosen paper. A surrounding drawing border and white page margin do not count; they
may be cut off when printing. So an A3 PDF at 1:50 prints at 1:50 again on A3. If the plan does not fit,
for example an A1 PDF on A3, the print area chooses the next suitable scale and says which one. For a
plan printed “fitted to the page” with an awkward scale, the program keeps the scale as you clicked it.

You can calibrate again at any time. In doing so, **only the background** is rescaled. Your own objects
keep their size and position on the sheet, and they no longer match the plan if the scale changes
significantly. Therefore, calibrate before you draw. A background from IFC is true to scale from the
start and cannot be calibrated.

## Visibility and opacity {#hintergrund-sichtbarkeit}

- {{befehl:ansicht.hintergrund}} hides the plan completely and shows it again (also in the
  **Visibility** drop-down of the toolbar).
- The **Opacity** slider (in the properties, when nothing is selected) reduces the contrast of the plan,
  so that your own drawing stands out more clearly.
- {{befehl:blatt.hintergrund-loeschen}} removes the plan from the sheet.

## Masking distracting parts {#hintergrund-ausblenden}

Old labels, legends or stamps on the plan can be covered without changing the file:

1. Choose {{befehl:werkzeug.hintergrund-ausblenden}}.
2. Click the first corner of the area to be hidden, then the opposite corner.

The mask also applies when printing and in the PDF export. Click with the tool on an existing mask to
remove it again. {{befehl:blatt.hintergrund-ausblendungen}} lists all masks on a sheet, and you can
lift individual ones.

## Converting the plan into drawing elements {#hintergrund-umwandeln}

You can snap directly to the lines of a DXF or PDF vector plan with the [object snap](#hintergrundfang).
If you want to edit the floor plan beyond that, for example delete, move or add lines,
{{befehl:blatt.hintergrund-umwandeln}} turns the plan into real drawing elements: lines, polylines,
circles and arcs, in the same grey display. Beforehand, a dialogue next to the plan states how many lines there will be; on the plan they appear in
colour. **Convert** creates them.

If other sheets have a plan that can be converted, the program asks first: **This sheet only** or
**All sheets**. With all sheets, the dialogue goes through the sheets one after another – see
[Sheet by sheet](#blatt-fuer-blatt). A scanned PDF plan without lines is skipped.

- The elements land on a separate layer, **“Floor plan (converted)”**, which is created the first time
  you convert. Use it to hide, show or lock the floor plan.
- A **DXF plan** is removed from the sheet during conversion, otherwise every line would appear twice.
- A **PDF plan** stays on the sheet but is hidden. Only the lines are carried over, not the text and not
  the fills. If you need those, show the plan again. Scanned plans contain no lines and cannot be
  converted.
- Anything you have hidden is not taken over.
- The plan must be calibrated first. Afterwards there would be no background left to recalibrate against.

:::nur-desktop
An **IFC storey** can also be converted (BIM add-on). It remains on the sheet for reloading and export,
but is hidden. A new version of the model replaces the converted lines after asking.

With an IFC storey, each element group goes onto its own layer, **“Walls (IFC)”**, **“Doors (IFC)”**,
**“Windows (IFC)”** and so on. Only lines without a building element reference land on “Floor plan
(converted)”. Each line knows which building element it comes from: the properties name the building
element and its class, and **Select entire building element** in the context menu or the context bar
selects all lines of that element. This way, you can remove a wall that appears twice in the model with
one click and Delete.
:::

One undo step takes the conversion back completely.

## Sheet by sheet {#blatt-fuer-blatt}

Applies to {{befehl:blatt.ifc-bauteile}} and {{befehl:blatt.hintergrund-umwandeln}} when you have
chosen “All sheets”:

- The dialogue switches to the first sheet and shows its preview (“Sheet 1 of 3”).
- **Next** includes the sheet and moves on, **Skip** leaves it out, **Back** goes back one sheet. A
  skipped sheet is included again with **Next**.
- For IFC building elements each sheet has its own ticks; a new sheet starts with those of the
  previous one.
- On the last sheet, **Apply** or **Convert** creates everything – one undo takes it back on all
  sheets. Afterwards you are back on the sheet where you started.
- If you click a sheet tab yourself during the run, the dialogue jumps to that sheet; a sheet that is
  not part of it closes the dialogue. Sheets you passed over this way without looking at them are not
  included.

## Sheets from a newer version {#hintergrund-neuere-version}

If you open a drawing that was edited with a newer version of el.easy.CAD, a sheet may contain a
background that this version does not know yet. The drawing still loads. A note appears above the
affected sheet, and the plan itself stays invisible.

Such a sheet can only be **viewed**. You can pan and zoom the view, but you cannot draw, select, rename
or delete anything, and it is neither printed nor output as PDF. You work on the other sheets as usual.
Parts lists, cable lists and cable lengths also include the contents of the locked sheet. When you save,
the background stays unchanged; in the newer version it is visible again.
