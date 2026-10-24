# Projects and documents

Your work is organised in three levels: **customer › project › document**. A document is either a
drawing, a note or an attached PDF. Everything is kept in a database that a small background process
on your computer manages – you do not need to file anything by hand or choose file names.

## The project overview {#projektuebersicht}

![The project overview with customers, projects and documents](projekte-dialog.png)

{{befehl:datei.projekte}} opens the overview; the program always starts there.

1. On the left, select or search for the **customer**. “New” creates one.
2. In the middle are that customer's **projects**, with their status (quotation, in progress, completed).
3. On the right are the **documents** of the project. Double-click one to open it.
4. Choose the type with **New drawing…**, **New note…** or **Attach PDF…**.

Recently edited documents are quicker to reach via **File › Recently edited**.

## Drawing, note and PDF attachment {#dokumentarten}

- **Drawing** – the actual CAD document with sheets, background and objects.
- **Note** – plain text, for example for agreements or open points on the project.
- **PDF attachment** – a document you keep with the project (quotation, data sheet, survey) that is
  shown in the application, without you having to change folder.

Excel lists from the list export are also stored as attachments in the project; a click on their name
downloads them. Excel and PDF attachments also have an **Open externally** button in their row. It
opens the file in the program on your computer that handles it, such as Excel or your PDF program.
What opens is a copy for viewing – changes you make there do not flow back into the project. If you
want to keep them, save the copy in Excel under a new name. In the browser version the button
downloads the file, because a web page may not start programs.

{{befehl:datei.neue-zeichnung}} creates an empty drawing in the open project.

## Floor plan or schematic {#zeichnungsart}

When you create a drawing, choose its **type** next to the name:

- **Floor plan** (default) – the plan of a building with a background plan, walls, cables and trunks.
  Every drawing from earlier versions is a floor plan.
- **Schematic** – a circuit diagram with [wires](#schaltverbindung), [potentials](#potential) and
  equipment reference designations. Each sheet has the fixed print area A4 landscape at a scale of
  1:40, with a [reference grid](#koordinatennetz) and a fixed [grid](#raster) of 24 cm.
- **Distribution board diagram for +UV1** – appears only when you choose {{befehl:datei.neue-zeichnung}}
  in an open floor plan that contains a distribution board without its own distribution board diagram;
  there is one entry per board. It creates a schematic that is linked to this board straight away; see
  [Linking a distribution board diagram](#verteilerplan).

The type applies to all sheets of the drawing and **cannot be changed later**. It determines which
tools the sidebar offers: walls and cables do not exist in a schematic, and wires do not exist in a
floor plan. In the document list, a schematic is shown as “Drawing · Schematic”.

Because a schematic has no floor plan, the commands that relate to the building are also disabled
there: loading a background plan (and with it calibrating and masking), aligning sheets, inserting
storeys, moving the print area, wall snap, the 3D view and the IFC export.

## Drawing language {#plansprache}

Every drawing has its own **drawing language** (German or English). It applies to everything that
appears on the sheet: labels on components and cables, the field names of the [title block](#plankopf),
lists and plan inserts, the note at the edge of the printout, and the Excel and IFC export. Menus,
dialogues and messages, however, use the language of the user interface (see
[Settings](#einstellungen-abschnitte)). This way, an English drawing can be made at a German
workstation, and the same drawing prints identically on every computer.

- When you create a drawing, the drawing language follows the language of the user interface. In the
  dialogue you can change it under **Drawing language**.
- Later, change it in the sheet properties (properties panel with nothing selected) under
  **Drawing language**. It applies to the whole drawing and can be undone.
- Names that were created along the way – for example “Sheet 2”, room names, layers or the texts of a
  generated distribution board diagram – stay as they are when you switch. They are your content, and
  you can rename them by hand.
- A generated distribution board diagram takes over the drawing language of its floor plan.
- Drawings from earlier versions are German.

## Exchanging with other computers {#austausch}

Drawings can be passed on as a file:

1. {{befehl:datei.export-zeichnung}} writes the open document to a file.
2. {{befehl:datei.import-zeichnung}} reads such a file again – on another computer, or as a copy in
   another project.
3. Whole catalogues travel the same way: {{befehl:datei.import-katalog}}, see
   [Managing catalogues](#kataloge-verwalten).

> The drawing file contains the background plan and all catalogue data that is used. The recipient
> therefore needs nothing else.

:::nur-desktop
To export a whole project with all its documents, use **Export…** in the projects dialogue. Such a
project package may be at most 500 MB in size; if a project is larger, the program tells you before
the export.
:::

## Backup {#sicherung}

{{befehl:datei.sicherung}} creates a backup of the entire data folder – database and attached files in
one piece. Make one regularly; it is the only way to recover an accidentally deleted customer or an
overwritten project.

:::nur-cloud
In the cloud version the server makes the backup; the menu item is not available there.
:::

:::nur-cloud
## Sign-in, account and sharing {#anmeldung}

When you start, sign in with your e-mail address and password. “Stay signed in” keeps the session
open after the browser is closed. Only **one** session per account is active at a time: if you sign in
elsewhere, the old session ends.

From the user menu at the top right, you reach:

- **Account** – change your password, set up two-factor sign-in and passkeys.
- **Sharing** – share a project with viewers. The recipient receives a short code and can see the
  project without being able to change it.
- **Change history** – what has changed in the recent versions.
:::
