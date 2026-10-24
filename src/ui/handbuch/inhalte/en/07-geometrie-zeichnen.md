# Drawing geometry

The geometry tools are in the menu **Draw › Geometry** and in the tool sidebar. They all work the
same way: choose the tool, set points, cancel with Esc. The tool stays active after drawing, so you
can draw the next object straight away.

## Lines and polylines {#linien-und-polylinien}

- {{befehl:werkzeug.linie}} draws a single straight segment: click the start, click the end.
- {{befehl:werkzeug.polylinie}} draws a continuous run: keep clicking as often as you like, and
  **Enter** finishes. A click on the start point closes the shape.

To do this, enter lengths and angles from the keyboard as described under
[Enter length and angle](#konstruktionsmass).

## Rectangle, circle, arc, ellipse, polygon {#rechteck-kreis-bogen}

| Tool | How to use it |
|---|---|
| {{befehl:werkzeug.rechteck}} | Click two opposite corners |
| {{befehl:werkzeug.kreis}} | Click the centre, drag out the radius |
| {{befehl:werkzeug.bogen}} | Click start, end and bulge |
| {{befehl:werkzeug.ellipse}} | Click the centre, drag out both semi-axes |
| {{befehl:werkzeug.polygon}} | Click centre and radius; **+** and **−** change the number of corners |

## Point and text {#punkt-und-text}

- {{befehl:werkzeug.punkt}} sets a marker, for example as a reference point for a dimension.
- {{befehl:werkzeug.text}} sets a label: click a position, type the text. Set the text size,
  alignment and rotation afterwards in the properties panel.

## Hatching and area fill {#schraffur-und-fuellung}

{{befehl:werkzeug.schraffur}} fills an area: click the outline, and **Enter** closes it. The **M**
key switches the hatching type while you draw.

You can also fill closed shapes – rectangle, circle, ellipse, polygon and closed polylines –
directly: select the object and, in the properties panel under **Fill**, set colour, pattern and
opacity. The opacity of the fill is independent of the line colour, so an area can lie
semi-transparently over the background plan.

## Trim and extend {#trimmen}

{{befehl:werkzeug.trimmen}} shortens or lengthens lines up to the next intersection: select the
tool and click the piece that should go – or the end that should grow up to the next edge. Walls
are treated like lines here.

## Line type, colour and weight {#linienart}

In the properties panel, set **Colour** and **Line weight** for the selected objects. Lines,
polylines, rectangles, circles, arcs, ellipses, polygons, walls, stairs, floor slabs and wires also
have a **Line type**: Default (solid), Dashed, Dotted or Dash-dot. New objects always start with
the default values; you can change them afterwards, including for several selected objects at once.
