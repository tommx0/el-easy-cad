# Selecting and editing

## Selecting {#auswaehlen}

{{befehl:werkzeug.auswahl}} is the basic tool; pressing **Esc** twice takes you back to it from any
other tool.

- **Click** selects an object; a click on empty space clears the selection.
- **Ctrl + click** (on a Mac also **Cmd + click**) adds an object to the selection or removes it
  again.
- **Drag a frame** (start on empty space) selects depending on the direction:
  - from **left to right** only what lies entirely within the frame,
  - from **right to left** additionally everything the frame merely touches.

  With the **Ctrl** or **Cmd** key held down, the frame extends the existing selection instead of
  replacing it.
- {{befehl:bearbeiten.alles-auswaehlen}} selects everything on the sheet;
  {{befehl:bearbeiten.auswahl-aufheben}} clears the selection.

Objects on hidden [layers](#ebenen) cannot be selected. Objects on locked layers can be selected and
viewed, but not moved, rotated or deleted.

## Move, rotate, scale {#drehen-skalieren}

Selected lines, shapes, cables, trunks and dimensions glow blue along their course; components,
texts and tables are surrounded by a dashed rectangle. When you hover over an object, the same
highlight appears lighter. To edit, the selection has handles:

- **Drag the area** moves the selection.
- **Drag a corner handle** scales it; **Shift** keeps the proportions.
- The **rotation handle** above the rectangle rotates it; **Shift** snaps to 15° steps.
- The arrow keys move the selection in small steps.

Rotation and scaling take place around the centre of the selection. The properties panel shows the
same values as number fields when a single object is selected. With several objects selected, the
panel shows the fields they have in common (for example colour and layer; if they are all
components, also label, rotation and display). A change there applies to all of them
([Change several components](#installationshoehe)).

> Cables attached to a moved component are re-routed automatically – you do not need to adjust
> them by hand.

## Align and distribute {#anordnen}

When several components are selected, the context menu (right-click on one of them) offers the
following. With a mixed selection that includes lines, texts or similar, the entries are greyed out:

- **Align** – Top, Bottom, Left, Right, Centre horizontally or Centre vertically.
- **Distribute horizontally** and **Distribute vertically** – equal spacing between neighbours. The
  smallest existing spacing is suggested; in the dialog you can enter a different value.
- **Distribute as grid** – detects the rows and columns of the current arrangement and aligns both
  neatly. In the dialog you set the starting point (X/Y in cm from the origin) and the spacing,
  horizontally and vertically separately.

This is the quick way to a tidy row of socket outlets or a grid of luminaires.

## Auto-arrange {#automatisch-anordnen}

{{befehl:bearbeiten.automatisch-anordnen}} tidies up scattered components together with their
connections. You will find the command in the Edit menu, in the context menu of the selection, and
in the context bar under “Actions”.

A dialog opens: the settings on the left and, on the right, up to six **variants** as preview
images. Beneath each image are the crossings, bends and the length of the connections; the
recommended variant is preselected. Click a variant and then **Apply**. Afterwards, everything can
be reverted in one step with {{befehl:bearbeiten.rueckgaengig}}. At the top of the dialog, it says
how many components and connections will change – in a floor plan, with the note that the
components leave their mounting location.

This is how the program arranges:

- **Tiers.** Items connected to each other are arranged in tiers, top to bottom or left to right,
  one row per tier. Children stand symmetrically below their parent, in the order of the contacts
  they hang on. Where possible, connected contacts sit exactly above one another so the cable runs
  straight – for this, the gaps between the components may differ.
- **Children to the side.** If the contacts sit on the side edges, a child may also stand beside its
  parent – the connection is then a short straight piece.
- **Comb.** The connections from a parent to its children run as a parallel bundle between the rows,
  and branch off at right angles only shortly before the target.
- **Trunks** (floor plan only). If enough cables of a parent run together for long enough, the bundle
  becomes a trunk: the cables enter below it and leave again above their target, with cable labels
  as in the trunk tool. There are variants with and without a trunk.
- **Avoiding crossings.** Order and routing are chosen so that connections as far as possible do not
  cross and do not lie on top of one another. Connections of the same potential or at the same
  contact may run together for a stretch; the cores of a multi-core wire stay a parallel bundle.

The variants differ in direction, root (at the top stands the component that was previously
uppermost, the one with the most outgoing connections, or the centre of the network), order,
children to the side, and trunks. For the three best, there is also a tighter and a wider version
(not if you have entered a fixed spacing). Ranking is first by crossings, then by bends, cable length
and area; variants that need more than a quarter longer cables for this are placed at the back. The
card says “with trunk”, “tight” or “wide”.

The **settings** are remembered for next time (also in the [settings backup](#einstellungen-sichern));
**Reset settings** restores the factory defaults:

- **Direction** – automatic (try both), top to bottom, or left to right.
- **Take current position into account** – at the top stands what is already at the top now, and
  the order follows the current position.
- **Children also to the side**, **Bundle per tier (comb)**, **Snap to grid**.
- **Component spacing** and **Row spacing** in cm – empty means automatic: only as much room as
  needed, so the label beside a symbol stays clear.
- **Track spacing** – how far apart parallel connections lie, in mm on paper.
- **Avoid crossings** – low, medium or strong: how much of a detour a connection may make to avoid
  crossing. **Always** shows only variants without any crossing; if there are none, the dialog says
  so.
- **Form trunks** (floor plan, with comb) – from how many cables (default 5) and from what shared
  length (default 2 m) a trunk is created.
- **Route at right angles only** – always in the schematic.
- **Position of the result** – the top left corner of the selection stays, or everything is centred
  on the print area.

If only **connections** are selected (including a single cable or wire), the components stay where
they are; the dialog then shows only the settings for routing.

Good to know:

- Components without a connection go into their own row at the very bottom.
- Components mounted on a wall and objects on locked layers stay where they are. Attached modules
  move with their housing.
- Connections are set to automatic routing afterwards, even if they were previously routed by hand.
- **Connections remember their specifications.** If you later move, rotate or scale a component, the
  program re-routes its arranged connections when you release it, following the same rules – at
  right angles, with track spacing and without crossings where possible, and again as a comb, as long
  as the rows are still recognisable. While dragging, the preview shows the quick routing. If you
  route such a cable by hand, it is taken out of these rules; with automatic routing switched off,
  they are paused.
- A message warns you if a connection found no free path, if the result covers other components, or
  (in the schematic) if it does not fully fit on the print area. In the schematic, the program first
  moves the components closer together in this case.

## Copy, paste, delete {#kopieren}

{{befehl:bearbeiten.kopieren}}, {{befehl:bearbeiten.ausschneiden}} and
{{befehl:bearbeiten.einfuegen}} work as usual, and also across sheet boundaries: copy a group on the
sheet “Ground floor” and paste it onto the sheet “Upper floor”. {{befehl:bearbeiten.loeschen}}
removes the selection.

Cables attached to a deleted component disappear with it; an undo brings both back. Before you
delete a trunk that contains cables, the program asks for confirmation (the cables disappear with
it). It does the same before you delete a cable riser with connections: their cables stay, but lose
the connection to the other storeys.

## Undo {#rueckgaengig}

Every change to the document can be reversed: {{befehl:bearbeiten.rueckgaengig}} and
{{befehl:bearbeiten.wiederholen}}. The history covers the whole session and applies across all
sheets.

## Zoom and pan {#zoomen-und-schieben}

| Command | Effect |
|---|---|
| {{befehl:ansicht.zoom-rein}} / {{befehl:ansicht.zoom-raus}} | Enlarge and reduce step by step |
| {{befehl:ansicht.zoom-alles}} | Fit everything |
| {{befehl:ansicht.zoom-100}} | Back to 100 % |
| {{befehl:werkzeug.zoom-fenster}} | Drag out a rectangle to zoom to |
| {{befehl:ansicht.vollbild}} | Program full screen |

Faster with the mouse: use the wheel to zoom, and hold the right mouse button to pan.
