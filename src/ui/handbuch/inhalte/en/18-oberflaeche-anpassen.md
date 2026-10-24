# Customising the interface

## Toolbar {#symbolleiste-anpassen}

The toolbar below the menu holds the commands you use most often. {{befehl:ansicht.symbolleiste}}
shows and hides it. In the program settings (or from the toolbar’s context menu, **Customise
toolbar…**), you choose which commands it contains and in what order. The switches for labels, grid
and snap can be added there too.

Use **+ New group…** to bundle several commands into a named drop-down menu – for example “Draw” or
“Evaluation” for a topic of your own. A command changes its group with the selection box in the list.
The drop-down menu itself shows its members with icon and name, as the main menu does.

From the factory, four groups are set up: **Visibility** (background, grid, and the switches for
labels, cables, trunks and rooms), **Sheet management** (sheets, print area, origin, loading the
background and showing or hiding it), **Catalogue** and **Snap** (all snap switches, see
[object snap](#objektfang)). The [3D view](#dreid-ansicht) is by default a button of its own in the
toolbar. **Reset to default** in the settings restores this factory layout.

## Tool sidebar {#seitenleiste}

{{befehl:ansicht.seitenleiste}} shows and hides the tool sidebar on the left edge.

- **Drag the width:** grab the right edge and drag it. From about 200 pixels, the sidebar shows a list
  with icon, shortcut and name (this is the factory setting); narrower, it shows only the icons.
- **Undock:** the button at the head of the sidebar detaches it, so that you can place it as a floating
  window anywhere you like.
- **Order and selection** of the tools are set in the program settings. Hide the tools you never use.

## Properties panel {#eigenschaften-panel}

{{befehl:ansicht.eigenschaften}} hides the right-hand column when you need more room for the drawing.
It always shows the settings of the selected object. If nothing is selected, it shows the defaults for
new objects and the background opacity.

## Key functions with the mouse {#kontextleiste}

Many tools have functions on individual keys while drawing or placing. The Space bar rotates a
component, the digits 1–5 choose the number of cores of a wire, M switches between multi-line and
single-line, and + and − change the wall thickness. So that you do not have to know these keys by
heart, el.easy.CAD shows a small context bar at the bottom of the work area. It shows exactly the keys
that currently do something:

- **A click** on a button works like pressing the key.
- **Switches** show their state with a tick. For the digits, the chosen value is highlighted. For + and
  −, the current value stands between them.
- **When a function is added** – for example “Assign port circuit” as soon as a cable runs into a trunk
  – its button lights up briefly.
- **Moving:** drag the bar by its handle ⋮⋮ to another place; it remembers the position. A double-click
  on the handle resets it.
- Without an active key – for example in the selection tool with nothing selected – the bar is hidden.

If you have selected something with the selection tool, the bar gets a red frame and, below the keys,
shows an additional row **Actions**. It offers the same functions as the right-click menu, for example
“Align”, “Distribute horizontally” and “Create device group from selection” for several components,
“Cable type” and “Assign port circuit ...” for a cable, or “Connect to another trunk ...” for a trunk.
Buttons marked ▾ open a selection. Only functions that are possible for the current selection are
offered. “Delete” is there as the Del key. “Add waypoint” and “Remove waypoint” appear only in the
right-click menu, because they act at the point you clicked.

{{befehl:ansicht.kontextleiste}} hides and shows the bar, and likewise the setting “Key functions”. While
the bar is shown, the hint at the bottom left no longer names the keys separately; with the bar hidden,
they appear there again.

## Small window, tablet and touch {#tablet}

When the window is narrow, both sidebars fold away automatically. A pointer at the edge brings them
back as a preview. On a tablet, you can work with your fingers:

| Gesture | Effect |
|---|---|
| Tap | Click |
| Drag with one finger | Draw or move an object |
| Two fingers together or apart | Zoom |
| Move two fingers | Pan the view |
| Long press | Context menu |

On a tablet, the [key functions bar](#kontextleiste) always appears, with larger buttons and always
with Esc for cancelling. It replaces the keys that are missing without a keyboard.

## Full screen {#vollbild}

{{befehl:ansicht.vollbild}} switches the program to full screen.
