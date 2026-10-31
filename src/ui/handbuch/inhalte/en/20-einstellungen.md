# Settings

{{befehl:extras.einstellungen}} opens the program settings. They apply to the device, not to the
individual drawing – except for the section “Cables (this drawing)”.

## The sections in detail {#einstellungen-abschnitte}

The settings are spread over tabs:

| Tab | Section | What you set there |
|---|---|---|
| General | Language | Language of the user interface: same as the operating system, German or English – takes effect at once; the language of a drawing is separate, see [drawing language](#plansprache) |
| | Help tips | Whether and which [help tips](#hilfe-hinweise) appear for functions with several steps |
| | Key functions | Whether the [key function bar](#kontextleiste) appears |
| | Distribution board | Whether the [circuit](#stromkreis-zuordnung) appears in the properties panel |
| | Grid | Grid spacing and grid snap |
| | Outside the print area | Colour and opacity of the area around the [print area](#zeichenflaeche-einrichten) (default grey, 25 %; 0 % turns it off) |
| | Moving with arrow keys | Small and large step size |
| | Mounting height | The default heights behind the buttons in the properties panel |
| | Combinations on the wall | How large symbols appear in a [combination on the wall](#wandfang) (default 75 %) – applies at once to the open drawing |
| | Groups and control assignments | Whether a [group and control assignment](#wirkverbindungen) is offered after a cable has been routed |
| | Transfer settings | [Back up and restore](#einstellungen-sichern) as a file |
| Routing (A*) | Routing (cables) | Costs per metre and per bend, **only route cables again after releasing**, **spacing of parallel cables**, clearance and search area |
| | A* fine-tuning | Fine details of the path search |
| | Wall routing | Cables along walls, distance to the wall and surcharge per wall crossing |
| Object snap | Object snap | Which snap types are active |
| Cables & cable type | Cable routing | Whether a floor plan offers cables, trunks and cable risers (beta), see [Switching cable routing off](#leitungsverlegung-abschalten) – when off, this tab and “Routing” are greyed out |
| | Cables (this drawing) | Default cable type for new cables |
| Sheet | Drawing type | Whether the drawing is a floor plan or a schematic (display only, fixed from creation) |
| | Print area | Defaults for new sheets |
| | Labels & symbol size | Default sizes for text and symbols |
| Company & title block | Company logo | The logo for the [title block](#plankopf) |
| Keyboard shortcuts | | See [Assigning your own shortcuts](#kuerzel-vergeben) |
| Tool sidebar, toolbar | | Contents and order, see [Customising the interface](#symbolleiste-anpassen) |
| AI assistant | | The interface for Claude and other AI assistants, see [Working with an AI assistant](#ki-assistent) |
| Add-ons | Developer mode | Load an add-on directly from a folder, see [Add-ons](#zusatzmodule) |
| Licence | | Licence status, reference to [My licence](#lizenz) |

## Back up and transfer settings {#einstellungen-sichern}

So that you do not have to set everything up again on a new computer:

1. {{befehl:extras.einstellungen-sichern}} writes a file named
   `el-esy-cad-Settings-YYYY-MM-DD.json`.
2. {{befehl:extras.einstellungen-einspielen}} reads it back in. Beforehand, choose which areas
   should be applied:

| Area | Contents |
|---|---|
| User interface | Tool sidebar and toolbar (order, visibility), sidebar, properties panel, appearance, keyboard shortcuts |
| Drawing | Object snap types, grid spacing, area outside the print area, arrow key step sizes, dimension type, default heights, symbol size on the wall, cable routing on/off |
| Auto-routing | Costs, safety distance, search area, wall routing, automatic arrangement |
| Company logo, cable types and installation zones | Company logo for the title block, custom cable types and custom installation zones |

A ticked area **replaces** the settings there; areas that are not ticked remain unchanged.
Custom cable types are added. Before the restore, the program checks the whole file – a damaged
file changes nothing.

The access token of the [AI assistant](#ki-assistent) is not part of the backed-up settings – on
a new computer, you switch the interface on again.

## Working with an AI assistant {#ki-assistent}

An AI assistant such as **Claude** can read the open drawing and answer questions about it:
“Which cables have a free end?”, “How many socket outlets are on the upper floor?”, “Show me the
distribution tree of +UV1” or “Are any terminal numbers assigned twice?”. It connects to
el.esy.CAD via the Model Context Protocol (MCP) – only on this computer. You bring the language
model with your own Claude account; el.esy.CAD itself sends nothing to the internet.

The assistant receives the descriptions of its tools and the messages from el.esy.CAD in the
language of the user interface (German or English). What it writes into the drawing, for example
the name of a new room, is created in the drawing language. The names of the tools stay German in
every language, so that a connection, once set up, keeps working. After a change of language, the
assistant sees the new descriptions as soon as it reconnects.

The assistant **reads** sheets with all their objects, individual objects with their catalogue
entry, rooms, the catalogue, all lists (bill of materials, cable list with lengths, circuit
schedule and others), the distribution tree, a check for irregularities and screenshots of the
sheets.

It can also **change** the drawing: set properties on many objects at once (label, height,
mounting location, SM/FM, circuit, KNX, variable texts, reference designation; for cables the cable
type and description; for trunks and rooms the name), delete, move and rotate objects, replace
components with another entry from the same catalogue, and create sheets.

On a **floor plan** it also **draws**: it places components from the catalogue – at a point, in the
middle of a room, or on a wall with a distance and height, where they line up in a row and a
combination as with wall snap –, routes cables with auto-routing (between components,
to a free point, along a cable riser strand, through trunks to a free switch port or distribution
board, optionally connected to F/X/K), then creates a control assignment or device group if you
wish, re-routes cables, creates and connects trunks, and places walls, rooms, doors and windows.
Reference designations, terminal numbers and cable numbers are assigned by el.esy.CAD just as they
are by hand.

On a **schematic** it places components in a grid square (“C3”) or at a point – the snap point
always snaps to the grid so that the contacts line up –, sets potentials, and draws wires from
contact to contact via the terminal names (“A1” → “13”): single-line, also multi-pole, or
multi-line with parallel cores as with the tool, with a branch to another wire (which becomes a
junction point). Several single-line wires in one request are routed together so that they do not
overlap. If you wish, it arranges components automatically – using your settings from “Automatic
arrangement”.

At a **distribution board** on a floor plan, it proposes the board layout from the rooms, edits the
distribution tree in the same way as the distribution board dialog (creating and moving equipment
and circuits, renaming, changing phase, type and label, removing), assigns KNX actuators, renumbers
a terminal strip and generates the distribution board diagram. The diagram is created as a new
document in the project; el.esy.CAD asks whether you want to open it straight away – the assistant
never switches the document itself, and it does not overwrite an existing diagram. If a
distribution board diagram is already linked, the same limits apply as in the dialog.

In a schematic, its check for irregularities also finds wires with a free end, places where two
different potentials are connected, duplicate device reference designations and components outside
the grid.

The following applies:

- Every change is **one undo step** that begins with “AI:” – {{kuerzel:bearbeiten.rueckgaengig}}
  reverts it like any other. Only a newly generated distribution board diagram is a separate
  document and remains. If you ask the assistant itself to “undo”, it reverts only its own steps
  and stops at your first step of your own.
- While you are working with a drawing tool (anything except the selection tool), el.esy.CAD
  rejects its changes – your work is never interrupted. Reading continues.
- Each change briefly appears as a message and in the **AI log** on the AI assistant tab, with the
  time. The view does not jump; the log is empty after a reload.
- It does not change objects on locked layers or sheets that can only be viewed.

**Switching on:**

1. Open {{befehl:extras.einstellungen}} and select the **AI assistant** tab.
2. Read the note on data sharing and choose **Agree and switch on**. What the assistant reads –
   including room names and screenshots – goes to the provider of the language model; for Claude,
   that is Anthropic.
3. Add the finished entry to your AI assistant:
   - **Claude Code:** run the displayed command `claude mcp add …` once in the terminal.
   - **Claude Desktop:** add the displayed block to the file `claude_desktop_config.json`
     (Settings › Developer › “Edit Config”) and restart Claude Desktop.

Then open a drawing and ask the assistant. The status bar shows **AI ready** while the interface is
switched on, and **AI connected** when an assistant has made a request in the last few minutes;
clicking it opens the tab. The assistant always works with the window you last worked in.

**Keeping control:** The interface is switched off by default. When it is switched on, it accepts
only requests that carry the **access token** contained in the entry – other programs on the
computer cannot reach it without it. **Generate new token** locks out all assistants set up so far.
The **AI may only read** box forbids the assistant any change. Sheets that are view-only without
the BIM module are not handed to the assistant as an image either.

Like any program output, the assistant's answers should be checked before you rely on them.

## Add-ons {#zusatzmodule}

Add-ons are separate pieces of software that fit into el.esy.CAD – for example an add-on that
places socket outlets in every room. An add-on comes as a file with the extension **.eecmod** and
is managed from the **Add-ons** menu:

- {{befehl:module.hinzufuegen}} chooses an `.eecmod`. el.esy.CAD checks the file and, before
  installing, shows the add-on's name, version, manufacturer and commands. If the add-on is
  already installed, it says which version will be replaced; an older version is only installed
  after you confirm it explicitly.
- {{befehl:module.anzeigen}} lists all installed add-ons. The **active** box switches an add-on
  off without removing it – it then only disappears from the menu.
- {{befehl:module.entfernen}} opens the same list; **Remove** deletes the add-on after a
  confirmation. Drawings edited with the add-on stay unchanged and can still be opened, printed and
  edited without it.

Below the separator in the **Add-ons** menu are the commands of the active add-ons – one submenu
per add-on, or the entry itself if it has only one command. Like all other commands, they can be
added to the [toolbar](#symbolleiste-anpassen) and given a [shortcut of your own](#kuerzel-vergeben);
they appear there in the “Add-ons” group with the add-on's icon or a puzzle piece. If the add-on is
removed or switched off, they disappear, and when it is installed again, position and shortcut
come back.

An add-on can ask you things: with a **form** in the style of el.esy.CAD (often pre-filled with
the values chosen last), with a yes/no question or **in the plan** – then a hint appears in the
status bar (“Click the distribution board”, “Drag a rectangle”), and you click points or objects or
drag a rectangle. With several objects, Enter finishes the choice. Esc only ends that question;
what happens next is up to the add-on.

Some add-ons bring a **panel** of their own: either as a collapsible section on the right below the
properties or as a floating window above the drawing area that can be moved by its header and
closed with ✕. Such add-ons load as soon as the program starts, so their panel is there right away.

While an add-on command is working, the status bar shows “‹Add-on›: ‹command› …”, optionally with
progress in percent; the drawing area and the keyboard wait until it has finished. **Esc** or
**✕** in the indicator cancels the command.

Everything an add-on command changes in the drawing is **one undo step** named after the add-on –
{{kuerzel:bearbeiten.rueckgaengig}} undoes it. If a command stops with an error or you cancel it,
el.esy.CAD undoes its changes by itself; an error is recorded in the error log. If an add-on
cannot be loaded at all – for example because it was built for a different version of el.esy.CAD
–, el.esy.CAD switches it off; the list gives the reason. An add-on that was not tested with your
version is marked with ⚠ there but keeps running.

An add-on can store data of its own on objects. It stays in the drawing, goes along with copies and
does no harm if the add-on is missing. el.esy.CAD keeps the add-on's settings (such as the form
values chosen last) on this computer; when removing an add-on, the dialog asks whether to delete
them too.

**With the AI assistant:** If an add-on provides for it, Claude can call its commands too (see
[Working with an AI assistant](#ki-assistent)). No form appears then: Claude passes the values,
everything else stays as chosen last; instead of a click in the plan, it names the object. The
change is one undo step beginning with “AI:”. In the “Add-ons” dialog, the **for AI assistant** box
switches this off per add-on; **AI may only read** blocks changing add-on commands like all
others.

**Developing add-ons:** In the **Add-ons** tab of the settings, **developer mode** loads an add-on
directly from a folder on this computer – the folder with `manifest.json` and `modul.js`. It then
appears with the **Development** label in the list and the menu, and el.esy.CAD reloads it before
every command if a file has changed; **Reload now** forces this immediately. If it has the same
identifier as an installed add-on, it replaces that one while the mode is on.

**Trust:** Add-ons have full access to el.esy.CAD and your projects. They are not signed –
el.esy.CAD cannot check who built an add-on. Only install add-ons from manufacturers you trust.
Like any program output, what an add-on creates should be checked.
