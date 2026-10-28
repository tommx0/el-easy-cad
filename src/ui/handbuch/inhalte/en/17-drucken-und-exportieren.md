# Printing and exporting

Printing always covers exactly the [print area](#zeichenflaeche-einrichten) of the current sheet – the
white area. Anything outside it is working area and appears neither on paper nor in the PDF.

In a [schematic](#zeichnungsart), the margin of the paper also shows the labels of the
[reference grid](#koordinatennetz) – columns A–H and rows 1–6. The faint grid lines on screen are not
printed.

## Print {#drucken}

{{video:11-drucken}}

1. Open {{befehl:datei.drucken}}.
2. Tick the sheets you want to print. Behind each one is its format and scale, for example “A4
   portrait · 1:50”.
3. Under **Paper**, paper size and orientation are preset to “As print area”. For this one printout,
   you can choose a different format (A4 to A0) or portrait or landscape, for example to output an A3
   sheet on an A4 printer. The whole page is then fitted to the paper. If the orientation does not
   match, it is rotated by 90° so that it reads from the right. Behind the sheet, the result is
   stated, for example “→ on A4 portrait, 71 %, rotated”. The scale on paper is then no longer
   correct; the setup of the sheet itself remains unchanged.
4. **Print** opens the print dialog of your system with the matching paper. There, choose **Actual
   size** and not “Fit to page”, otherwise the scale on paper will be wrong.

A print job runs on one paper size. If you tick several sheets of different formats and choose no
paper, the format of the first sheet applies, and the others are fitted to it.

![The print dialog with the sheet selection](druck.png)

## Export as PDF {#pdf-export}

{{befehl:datei.export-plan}} writes the ticked sheets as one PDF file, each sheet on one page. The PDF
is true to scale: 1:50 stays 1:50, as long as the recipient prints without scaling. A visible
background plan is output too. The paper choice works as it does for printing; with “As print area”,
each page keeps its own format.

Below each page is a short legal notice on the use of the plan. For a schematic, this notice leaves
out the sentence on scale, because a schematic has no dimensions to measure from.

## Lists to Excel {#excel-export}

{{befehl:datei.export-excel}} outputs the evaluated lists as an Excel workbook: one worksheet each for
the bill of materials, cable list, switch and patch panel assignments, trunk list, room list and
control logic. For each distribution board there is the [circuit schedule](#stromkreisverzeichnis)
(“Circuits +UV1”) and, where KNX actuators are installed, the
[actuator channel list](#aktorkanalliste) (“Actuator channels +UV1”). A sheet “Legal notices” is added
too. This is the route into your quotation costing, without typing anything in.

:::nur-desktop
## Export as IFC model {#ifc-export}

With the **BIM** add-on module, {{befehl:datei.export-ifc}} exports the electrical design together
with the building as an IFC model (IFC4) – for import into BIM programs such as Revit, Archicad or an
IFC viewer. Each sheet becomes a storey. If the sheet comes from an IFC model, the design in the BIM
program lies exactly above the architect’s model.

- **Devices** appear as boxes in their [IFC class](#komponente-anlegen) at their mounting height, with
  manufacturer, item number and [rated values](#komponente-anlegen) on the type. Frames and housings
  become an assembly of their modules. Accessories such as flush-mounted boxes belong to the device
  they sit on. Devices [flush-mounted](#verlegeart) sit in the wall, the ceiling or the floor; the
  property “Installation method” shows SM or FM.
- **Cables** run in their [installation zone](#leitung-zone) – inside a trunk, in the zone of the
  trunk; otherwise in their own zone or that of the sheet – perpendicular to the mounting height at
  the devices, and through the cable riser from storey to storey. Each cable states its installation
  zone and installation method (surface-mounted or flush-mounted).
- **Circuits:** If a cable in the distribution board sits on a fuse (also via a terminal behind it),
  all devices on that fuse – including those that are looped through – form one circuit (“+UV1-F3”).
  Otherwise, each cable number becomes a circuit made up of the cable and the devices connected to it.
- **Trunks** become one group per chain. If the [type](#trunk-ausfuehrung) is a cable duct, a cable
  tray or a conduit, the cable support is added with its dimensions.
- **Cable risers** appear as vertical shafts spanning the storey height.
- **Building elements** are included, with the same dimensions as in the [3D view](#dreid-ansicht):
  [walls](#waende-zeichnen) up to the top edge of the ceiling, with real openings in which doors and
  windows sit (a wall opening stays open); [stairs](#treppen) with their steps;
  [floor slabs](#bodenplatten); and [rooms](#raeume) with name, area and height (the room type is written as object type and as
  category in the room properties). Each device is also
  assigned to the room in which it stands. Building elements you took over from an IFC model keep its
  identifier, so a BIM program recognises them again.

If data is missing – for example the level of a sheet, the room height or the dimension of a channel –
the export calculates with usual values and then lists them. A schematic cannot be exported as IFC.

## 3D view {#dreid-ansicht}

Also with the **BIM** add-on module, {{befehl:ansicht.dreid}} (in the **View** menu, and by default
also in the [toolbar](#symbolleiste-anpassen)) shows the design in three dimensions – to check
whether mounting heights, installation zones and riser runs are right. You see the same as in the
[IFC export](#ifc-export): devices at their mounting height, cables with all their vertical sections,
channels, trays and conduits as solids, bundles as a broad line, and cable risers semi-transparent.
The storeys are stacked by their level. Each device appears with the symbol or image that it shows on
the plan, coloured as there and without background. It always turns to face you and stays legible from
a distance. Without a maintained graphic, a box stands in its place. To stop cables running freely
through rooms, switch on [Only in walls, ceilings or floors](#nur-in-bauteilen) on the sheet.

For orientation, the building stands behind the design, as far as you have drawn it:
[walls](#waende-zeichnen) up to the top edge of the ceiling, that is the
[clear room height](#geschossangaben) (2.75 m if not stated) plus the ceiling thickness of the storey.
Doors and wall openings are 2.01 m high; windows sit on a 0.90 m sill and are 1.26 m high. Stairs rise
in equal steps to the level of the storey above. Each step is a 5 cm thick tread, and the space under
the stairs stays free. Each room gets a thin floor slab, a ceiling above the clear room height in the
thickness of the room or storey, and a label with its name. Without rooms, there is one slab under all
walls and no ceiling. If you have drawn [floor slabs](#bodenplatten) on the sheet, only these appear,
in their position and thickness. Above every stair, the ceiling and floor slab of the storey above are
left out.

To set how large the device symbols appear, use the **Symbol size** slider under **Symbols** on the
left: 100 % is the size from the plan, and down to 10 % it gets proportionally smaller. The default is
50 %. The slider works the same up close as from a distance.

How transparent the building is, is set with three sliders under **Building** on the left, each from
0 % (hidden) to 100 % (opaque):

- **Front walls** – exterior walls whose outside faces the camera. Which walls these are changes by
  itself as you rotate: you always look in from outside, like into a dolls’ house. Default 15 %.
- **Interior and rear walls** – all other walls, along with floor slabs and stairs. Default 100 %.
- **Ceilings** – default 0 %, so that the view from above stays clear.

At 100 %, a building element hides what lies behind it, including cables in the wall and devices. To
see the whole installation, turn the sliders down. A click hits devices and cables first, even when a
transparent wall stands in front of them; an opaque wall intercepts the click. The program remembers
these settings and the symbol size for all drawings.

On sheets from an [IFC model](#ifc-import), the view loads the building from the saved IFC file – all
building elements of the storey, exactly beneath the design. Walls and ceilings from the model follow
the same sliders as the drawn ones. Doors, windows, stairs and other building elements stay
semi-transparent, so that they do not block the view. While this runs, the left side shows “Loading
building from the IFC model …”; the design is already visible beforehand. Walls, doors and rooms taken
over from the model are not drawn again by the view, but those you added by hand are. Sheets with a
free section have no storey and receive no building from the model.

- At the top, choose how you move: **Orbit** or **Walk** (see below).
- In **Orbit** mode, **dragging** rotates the view around its centre, **right-button drag** or
  **Shift + drag** moves it, and the **mouse wheel** zooms. **Fit to view** shows everything again and
  ends a walk.
- On the left, switch **storeys** on and off.
- Under **Colours**, choose whether everything is coloured as in the plan, **By installation zone**
  (each zone one colour, vertical sections grey) or **By device type**. The legend explains the
  colours.
- A **click** on a device, cable or trunk shows its name, storey and height on the left, or its cable
  type and routed length.

![3D view: building from the IFC model with semi-transparent front walls and opaque interior walls, with devices and a cable on the ground floor](dreid-ansicht.png)

**Walking:** This moves you through the building like a camera at eye height. When you switch, you
stand 1.60 m above the floor of the storey in which the centre of the previous view lay, and you look
in the same direction. You move freely, including through walls and ceilings:

- **W / S** or **Up / Down arrows**: forward and back; **A / D** or **Left / Right arrows**: sideways;
  **E / Q** or **Page Up / Page Down**: up and down. Forward, back and sideways stay horizontal, even
  when you are looking straight up or down.
- Holding **Shift** makes you four times as fast.
- **Dragging** with the mouse or finger turns your gaze: dragged to the right, you look right; dragged
  upwards, you look up. The **mouse wheel** carries you a little forward or back.
- Without a keyboard, for example on a tablet, you move with the buttons on the surface: the **arrow
  pad** at the bottom left for forward, back and sideways, and **up** and **down** at the bottom right.
  Holding a button down keeps you moving.
- **Orbit** switches back; the view then rotates around a point 5 m in front of you.

The view shows the state at the moment it is opened. The program remembers the viewing angle, and
whether you were orbiting or walking, for next time. Without a remembered viewing angle, the view fits
itself again once the IFC building has loaded. For a schematic, the command is not available.
:::

## Share the whole drawing {#zeichnung-weitergeben}

If the recipient is to keep working rather than only reading, pass on the drawing itself:
{{befehl:datei.export-zeichnung}} – see [exchange with other computers](#austausch).
