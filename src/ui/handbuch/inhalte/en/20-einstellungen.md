# Settings

{{befehl:extras.einstellungen}} opens the program settings. They apply to the device, not to the
individual drawing – except for the section “Cables (this drawing)”.

## The sections in detail {#einstellungen-abschnitte}

The settings are spread over tabs:

| Tab | Section | What you set there |
|---|---|---|
| General | Language | Language of the user interface: same as the operating system, German or English – takes effect at once; the language of a drawing is separate, see [drawing language](#plansprache) |
| | Key functions | Whether the [key function bar](#kontextleiste) appears |
| | Distribution board | Whether the [circuit](#stromkreis-zuordnung) appears in the properties panel |
| | Grid | Grid spacing and grid snap |
| | Moving with arrow keys | Small and large step size |
| | Mounting height | The default heights behind the buttons in the properties panel |
| | Combinations on the wall | How large symbols appear in a [combination on the wall](#wandfang) (default 75 %) – applies at once to the open drawing |
| | Groups and control assignments | Whether a [group and control assignment](#wirkverbindungen) is offered after a cable has been routed |
| | Transfer settings | [Back up and restore](#einstellungen-sichern) as a file |
| Routing (A*) | Routing (cables) | Costs per metre and per bend, **only route cables again after releasing**, **spacing of parallel cables**, clearance and search area |
| | A* fine-tuning | Fine details of the path search |
| | Wall routing | Cables along walls, distance to the wall and surcharge per wall crossing |
| Object snap | Object snap | Which snap types are active |
| Cables & cable type | Cables (this drawing) | Default cable type for new cables |
| Sheet | Drawing type | Whether the drawing is a floor plan or a schematic (display only, fixed from creation) |
| | Print area | Defaults for new sheets |
| | Labels & symbol size | Default sizes for text and symbols |
| Company & title block | Company logo | The logo for the [title block](#plankopf) |
| Keyboard shortcuts | | See [Assigning your own shortcuts](#kuerzel-vergeben) |
| Tool sidebar, toolbar | | Contents and order, see [Customising the interface](#symbolleiste-anpassen) |
| AI assistant | | The interface for Claude and other AI assistants, see [Working with an AI assistant](#ki-assistent) |
| Licence | | Licence status, reference to [My licence](#lizenz) |

## Back up and transfer settings {#einstellungen-sichern}

So that you do not have to set everything up again on a new computer:

1. {{befehl:extras.einstellungen-sichern}} writes a file named
   `el-easy-cad-Settings-YYYY-MM-DD.json`.
2. {{befehl:extras.einstellungen-einspielen}} reads it back in. Beforehand, choose which areas
   should be applied:

| Area | Contents |
|---|---|
| User interface | Tool sidebar and toolbar (order, visibility), sidebar, properties panel, appearance, keyboard shortcuts |
| Drawing | Object snap types, grid spacing, arrow key step sizes, dimension type, default heights, symbol size on the wall |
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
el.easy.CAD via the Model Context Protocol (MCP) – only on this computer. You bring the language
model with your own Claude account; el.easy.CAD itself sends nothing to the internet.

The assistant receives the descriptions of its tools and the messages from el.easy.CAD in the
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
Reference designations, terminal numbers and cable numbers are assigned by el.easy.CAD just as they
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
document in the project; el.easy.CAD asks whether you want to open it straight away – the assistant
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
- While you are working with a drawing tool (anything except the selection tool), el.easy.CAD
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
