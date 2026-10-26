# Getting started

This manual shows screenshots of the German version of the program; the labels in the
text follow the language you use.

el.easy.CAD is a drawing program for electrical and network planning in buildings. You place an
existing floor plan under the drawing as a background, bring it to scale with a known distance,
place components from a product catalogue, connect them with cables and bundle these into cable
bundles (trunks). At the end you print each sheet at a fixed scale and export bills of materials,
cable lists and switch lists to Excel.

Everything is calculated and saved on your own computer. There is no user account, and no drawing is
uploaded anywhere.

:::nur-cloud
In the cloud edition you sign in, and your projects are stored on your company's server. Everything else in this manual applies unchanged.
:::

## The interface at a glance {#oberflaeche}

![The interface: header, toolbar, tools, print area, properties, sheet tabs, status bar](oberflaeche.png)

1. **Header** with the program name, the version and the name of the open document. On the right you
   can see whether everything is saved.
2. **Menu bar** – File, Edit, Draw, Sheet, View, Catalogue, Extras, Help.
3. **Toolbar** with the commands you use most often. You can arrange it freely, see [Customise the
   toolbar](#symbolleiste-anpassen).
4. **Tool sidebar** on the left: all drawing tools, by default as a list with icon, keyboard
   shortcut and name. Drag the right edge to the left and only the icons remain, see
   [Sidebar](#seitenleiste).
5. **Print area** – the blue dashed frame is the later print area; the paper size and scale are
   shown on the left, above it. Anything outside it does not end up on paper.
6. **Properties** on the right: everything you can set on the selected object.
7. **Sheet tabs** above the drawing: one tab per sheet (for example per storey).
8. **Status bar** at the bottom: the active tool, what it expects next, coordinates, zoom and –
   while drawing – length and angle for typing in.

:::nur-desktop
## When the program starts {#programmstart}

The program opens with the project overview. At the first start and after every update, a notice
about non-commercial use also appears,
see [Program edition and licence](#lizenz).
After that, a dialog asks whether to check GitHub for updates, see [Updates](#updates).
:::

## Your first project in ten minutes {#erstes-projekt}

1. The program starts with the project overview ({{befehl:datei.projekte}}). There, add a customer,
   below it a project, and below that a document of the type “Drawing”. When a floor plan is
   opened for the first time, the program asks for the print area straight away – paper size,
   orientation and scale.
2. Load the floor plan: {{befehl:datei.import-hintergrund}}. PDF, DXF, PNG and JPG are read; for a
   multi-page PDF you choose the page and the section.
3. Bring the plan to scale: {{befehl:werkzeug.kalibrieren}}, click a known distance in the plan and
   type its true length. Without this step, neither the lengths nor the scale are correct.
4. Check the print area: if the paper size or scale no longer fits after calibrating, change it
   with {{befehl:blatt.zeichenflaeche-einrichten}}. Whatever lies in it ends up on paper later.
5. Place the first component: {{befehl:werkzeug.komponente}}, choose a product in the catalogue and
   click on the plan.
6. Connect two components: {{befehl:werkzeug.leitung}}, click the connection point of the first
   component, then that of the second – the cable finds its own route.
7. Print the result: {{befehl:datei.drucken}} or {{befehl:datei.export-plan}}.

> Saving happens continuously by itself. {{befehl:datei.speichern}} forces an immediate save – under
> normal circumstances you do not need it.

## Mouse and keyboard {#maus-und-tastatur}

| Action | Effect |
|---|---|
| Left mouse button | Draw, select, drag |
| Hold right mouse button + drag | Move the view |
| Right-click without dragging | Context menu for the object under the pointer |
| Mouse wheel | Zoom to the pointer |
| Esc | Cancel the current action, clear the selection |
| Esc, Esc (twice quickly) | Back to the selection tool |
| Enter | Finish a polyline, trunk or hatching |
| Del | Delete the selected objects |
| Hold D | Show all connection points of all components |

Each tool also has a keyboard shortcut – see [Keyboard shortcuts](#kuerzel-uebersicht). The status
bar always tells you what the active tool expects next.

## When something goes wrong {#wenn-etwas-schiefgeht}

- **Undo** ({{befehl:bearbeiten.rueckgaengig}}) reverses each step, as far back as you like;
  {{befehl:bearbeiten.wiederholen}} redoes it.
- If the program shows “Not connected”, the companion server is not running – close the program
  completely and start it again.
- If the program reports an error, it is recorded in the error log
  ({{befehl:hilfe.fehlerprotokoll}}), see [Error log](#fehlerprotokoll).
:::nur-cloud
  From there it can be sent as feedback.
:::
