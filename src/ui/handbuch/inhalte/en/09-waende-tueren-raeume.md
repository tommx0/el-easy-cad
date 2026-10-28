# Walls, doors, windows, rooms and stairs

These tools draw building elements, not just lines: a wall has a thickness and joins the
neighbouring wall, a door cuts an opening into it, and a room detects its own area. They are in
the menu **Draw › Walls & rooms**.

## Drawing walls {#waende-zeichnen}

{{video:02-waende}}

1. Choose {{befehl:werkzeug.wand}}.
2. Set the **wall thickness** in the field at the top right, above the drawing area – **+** and
   **−** change it even while you are drawing.
3. Click the wall run as you would a polyline; **Enter** finishes, and a click on the start point
   closes the outline. For this it is enough to hit the visible end of the wall – the point snaps
   exactly to the start, and the corner is cleanly mitred.

Once complete, the wall run consists of individual **segments**, one for each stretch. They stay
joined at their corners, but can be selected, moved and edited one at a time. When you move a
segment, the adjoining segments lengthen or shorten along their own direction – a room stays
rectangular in the process.

A click on the end of an existing wall – as the first or last point – connects the new wall there.
If two walls meet in the middle, they are cleanly trimmed and look like one piece. With the wall
tool, the snap type “Nearest point” is always active, so you reliably dock onto an existing wall.

## Wall as rectangle {#wand-als-rechteck}

{{befehl:werkzeug.wandrechteck}} draws four connected walls at once:

1. Choose the tool and set the **wall thickness** (field above the drawing area, **+**/**−**).
2. Click one outer corner, then the opposite one.

The two clicks set the **outside dimensions** – the walls lie entirely inside the rectangle you
have drawn. The tool stays active for further rectangles.

![Walls with door and window](waende.png)

## Doors and windows {#tueren-und-fenster}

{{video:03-tueren-fenster}}

{{befehl:werkzeug.tuer}} and {{befehl:werkzeug.fenster}} place an opening **in** an existing wall:

1. Choose the tool.
2. Check the dimensions in the bar at the top right, above the drawing area: for the door, **Width**
   and **Height**; for the window also the **Sill height** – the height of the bottom edge above the
   floor. The values stay set for the next doors or windows.
3. Move over the wall – the opening hangs on the pointer and aligns itself with the wall.
4. Click to place it.

Dimensions, hinge side and swing direction can be changed afterwards in the properties panel; with
the select tool you can slide the opening along the wall. If the wall is deleted, its openings
disappear with it. The height and sill height do not appear on the plan, but they take effect in
the [3D view](#dreid-ansicht) and in the IFC export.

## Wall opening {#wanddurchbruch}

{{befehl:werkzeug.wanddurchbruch}} creates a pure cut-out without a door or window symbol – for pipe
penetrations, core holes and cable openings. Operation is as for doors and windows.

## Split wall {#wand-teilen}

{{befehl:werkzeug.wandteilen}} splits a wall at the point you click into two independent walls – this
is needed if only part of it is to have a different thickness or a different layer. Double-clicking
a wall with the select tool also splits it – without a gap, into two connected segments.

## Adjust corner points {#punkt-griffe}

Select a wall or a polyline and small handles appear at its corner points. Drag a handle and only
that point moves; adjoining walls stay connected and trim themselves again. This lets you correct a
skewed floor plan without redrawing everything. Press **Del** on a clicked corner point where
exactly two walls meet – both become one straight wall.

## Rooms {#raeume}

{{befehl:werkzeug.raum}} detects a room from the surrounding walls:

1. Choose the tool.
2. Click in the area that is to be the room.

The program looks for the closed outline and creates the room. Name and area are shown on the plan
(this can be switched off under **Sheet › Show labels**). If you change the walls, the room
recalculates its area. If you remove a partition between two rooms, they merge.

In the room's properties panel you set:

- the **Room type** (kitchen, bathroom, WC, children's room, bedroom, office, living room, dining
  room, utility room, hobby room, hall, terrace, storage room, cellar or other room). The name
  stays freely editable; the room type only supplies it while it is still “Room” or the name of
  the previous room type – a name you chose yourself, such as “Lea's room”, stays when you change
  the type. Add-on modules and the AI interface read the room type instead of guessing it from
  the name,
- the **Name** and **Font size** (in cm) of the label,
- **Name** and **Area** individually: follow the global setting, show or hide,
- a **fill** as for other closed shapes, see [Hatching and area fill](#schraffur-und-fuellung).

Name and area form a single label. Drag it to another position with the select tool; double-clicking
it puts it back at the centre of the room.

If the ceiling above a room is a different thickness from the rest of the storey, enter it under
**Ceiling thickness** in the properties panel; if left empty, the value of the
[storey](#geschossangaben) applies. It affects the ceiling above this room in the
[3D view](#dreid-ansicht).

**Room circuit shared with** in the properties panel combines this room's room circuit with that of
another room on the same sheet – for example, WC and storeroom with the hallway. This is used by
[board layout from rooms](#verteiler-aus-raeumen); numbered and own circuits stay with the room.

## Stairs {#treppen}

{{befehl:werkzeug.treppe}} places a staircase as a finished building element:

1. Choose the tool.
2. In the bar at the top right, above the drawing area, set **Shape**, **Length** and **Width**.
   Each shape remembers its own dimensions.
3. The stairs hang centred on the pointer; the **Space** bar turns them by 90°, and the **F** key
   switches the shape.
4. Click to place them.

The shapes:

| Shape | Description |
|---|---|
| Straight | One flight over the full length |
| With half landing (180°) | Two opposite flights with a square landing |
| Winder without landing (180°) | Two opposite flights with winders (2 winder steps) |
| L-shaped stairs (90°) | 90° turn with 3 winder steps; length and width adjustable for each flight |

Then set the following in the properties panel:

- **Shape** and **Number of steps** – the step division and the direction arrow follow from these
  automatically.
- **Reverse walking direction** – the arrow points the other way; the foot and the top swap sides.
- **Show step count** – switches the label with the number of steps on or off.
- For the L-shaped stairs only: **Length** and **Width** for each flight – **Flight A** lies on the
  starting side, **Flight B** at the angled end – as well as **Mirror L-shape horizontally** and
  **Mirror L-shape vertically**.

To change the size of a straight or U-shaped staircase, use the selection handles as with other
objects; see [Move, rotate, scale](#drehen-skalieren).

On the floor plan the stairs are **cut** as usual: from the foot up to the step at about 1.00 m
height the line is solid, a slanted cut line marks the section, and the rest up to the top is
dashed. The height of the steps comes from the level of the storey above, otherwise from the clear
room height and the ceiling of the sheet (see [storey details](#geschossangaben)); without height
data, the cut lies in the middle.

On the **sheet above** – the next tab to the right – the same staircase appears from the cut line up
to the top, solid, because it comes up there. It still belongs to the lower sheet: up there it
cannot be clicked or snapped to, and it is changed below. It also appears in the print and in the
PDF.

## Floor slabs {#bodenplatten}

A floor slab gives the storey a floor in the [3D view](#dreid-ansicht) in the shape and thickness
you need – also for platforms or plinths.

- {{befehl:werkzeug.bodenplatte}} draws the slab point by point. A click on the first point, a
  double-click or **Enter** closes the outline (from three points onwards).
- {{befehl:werkzeug.bodenplatterechteck}} draws it as a rectangle with two clicks.

On the plan only the dashed outline appears; line type and fill can be changed as for other shapes.
In the properties panel, set **Thickness** and **Top edge above finished floor** (default 25 cm and
0 cm, so the slab lies below the floor). Several selected slabs can be changed together. Edit the
outline as you would a polyline: drag a corner point, double-click an edge to add a point, and press
**Del** on a clicked point to remove it.

As soon as a sheet has a drawn floor slab, the 3D view no longer places its own thin slab under the
rooms there.

Above each staircase, the floor slab of the storey above – and the ceiling of the room the stairs
stand in – automatically gets an opening the size of the stairs. This applies in the 3D view and in
the IFC export; the slab on the plan stays as you drew it.
