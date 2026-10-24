# Drawing precisely

Freehand drawing is fine for a sketch. To get dimensions right, use the grid, snap, object snap,
tracking lines and entering length and angle from the keyboard.

## Grid and grid snap {#raster}

- {{befehl:ansicht.raster}} shows the grid.
- {{befehl:ansicht.fang}} forces every point you set onto the nearest grid point.

Set the grid spacing in the program settings. The reference point is the [origin](#nullpunkt) of
the sheet.

In a [schematic](#zeichnungsart) the grid is **fixed at 24 cm** – the spacing of the contacts of
circuit breakers, fuses and contactor contacts – and it changes neither with the zoom nor through
the program settings. If you place symbols with snap switched on, their contacts line up with one
another. When you zoom far out, el.easy.CAD hides the fine lines, but snapping still uses 24 cm.

## Object snap {#objektfang}

Object snap locks onto distinctive points of existing objects while you draw.
{{befehl:ansicht.objektfang}} switches it on and off. By default, all snap switches are in the
drop-down group **Snap** of the toolbar: wall snap, background snap, the seven snap types
individually, grid snap, object snap and tracking lines.

| Snap type | What it gives |
|---|---|
| Endpoint | Start, end and corners of objects, ends of arcs |
| Midpoint | Middle of an edge or arc |
| Centre | Centre of a circle, arc, ellipse, polygon, rectangle or component |
| Quadrant | The four points at 0°, 90°, 180° and 270° on a circle and ellipse |
| Connection point | Connection points of a component |
| Intersection | Crossing point of two objects |
| Nearest point | The point on an edge nearest to the pointer |

A snap marker appears at the snapped point; its shape shows the type.

You switch the snap types on and off one at a time with {{befehl:ansicht.objektfang-endpunkt}},
{{befehl:ansicht.objektfang-mitte}}, {{befehl:ansicht.objektfang-zentrum}},
{{befehl:ansicht.objektfang-quadrant}}, {{befehl:ansicht.objektfang-dock}},
{{befehl:ansicht.objektfang-schnitt}} and {{befehl:ansicht.objektfang-naechster}} – in the group
“Snap” or, if you prefer to have one of them as its own button, directly in the toolbar via
[Customise toolbar](#symbolleiste-anpassen).

> **Hold Alt** turns off all snapping for as long as the key stays down – so you can get close to
> an object without flipping the switch.

## Snap to the background {#hintergrundfang}

If a DXF plan, an IFC storey or a PDF vector plan lies under the sheet as background, object snap
also locks onto its lines – corners, edges and intersections of the floor plan become snap points
this way, without you having to trace anything. Intersections also apply between a plan line and
your own objects; if one of your objects and a plan line are equally close, your object wins.

{{befehl:ansicht.hintergrundfang}} switches this off and on again (on by default). It requires
object snap and only works while the background is visible – nothing is snapped in masked areas or
when the background is switched off. Scanned plans (images or PDFs without vector data) have no
lines to snap to.

By default, Endpoint, Connection point, Intersection and Nearest point are switched on – so wall
corners and the ends of individual plan lines are snapped to. For edge midpoints, also switch on
the Midpoint snap type. If you need the plan not just for snapping but for editing, you can
[convert it](#hintergrund-umwandeln).

## Tracking lines {#spurlinien}

{{befehl:ansicht.spurfang}} switches on the alignment lines: briefly hover over a snap point, and
the program remembers it and shows dashed guide lines when you are level with it horizontally or
vertically. This lets you set a point exactly below a corner without drawing guide lines.
Tracking lines require object snap.

## Enter length and angle {#konstruktionsmass}

While you draw, the status bar continuously shows the length, absolute angle and relative angle of
the open segment. These three fields are also input fields:

1. Type a **digit** while a segment is open – the character goes into the length field and the
   focus jumps there.
2. **Tab** switches between length, absolute angle and relative angle.
3. You may also fill in just one: if you type only the length, the direction comes from the mouse
   pointer; if you type only the angle, the mouse determines the length.
4. **Enter** sets the point like a mouse click, and the fields clear for the next segment.

In a [schematic](#zeichnungsart) these fields do not exist: there the fixed grid determines the
position, and the digits set the number of cores when you draw a wire.

The Shift key locks the direction to fixed angles – handy for purely horizontal or vertical runs.
