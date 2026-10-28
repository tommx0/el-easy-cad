# Projekte und Dokumente

Ihre Arbeit ist dreistufig geordnet: **Kunde › Projekt › Dokument**. Ein Dokument ist entweder
eine Zeichnung, eine Notiz oder eine angehängte PDF. Alles liegt in einer Datenbank, die ein
kleiner Begleitprozess auf Ihrem Rechner verwaltet – Sie müssen nichts von Hand ablegen und
keine Dateinamen vergeben.

## Die Projektübersicht {#projektuebersicht}

![Die Projektübersicht mit Kunden, Projekten und Dokumenten](projekte-dialog.png)

{{befehl:datei.projekte}} öffnet die Übersicht; das Programm startet immer dort.

1. Links wählen oder suchen Sie den **Kunden**, „Neu“ legt einen an.
2. In der Mitte stehen dessen **Projekte** mit Status (Angebot, in Arbeit, abgeschlossen).
3. Rechts die **Dokumente** des Projekts. Ein Doppelklick öffnet eines.
4. Über „Neues Dokument“ wählen Sie die Art: Zeichnung, Notiz oder PDF-Anlage.

Zuletzt bearbeitete Dokumente erreichen Sie schneller über **Datei › Zuletzt bearbeitet**.

## Musterprojekte {#musterprojekte}

Zum Ausprobieren bringt das Programm zwei Musterprojekte mit, beide ein Einfamilienhaus mit
Keller, Erdgeschoss und Obergeschoss (12,00 × 9,00 m) unter dem Kunden **Muster**:

- **Einfamilienhaus – Bauplan:** nur das Gebäude – Wände, Türen, Fenster, Räume, Treppen,
  Steigschacht und Geschosshöhen. Hier lässt sich die eigene Elektroplanung beginnen.
- **Einfamilienhaus – Elektro:** dasselbe Haus mit platzierten Komponenten – Unterverteilung im
  Keller, je Raum Deckenleuchte und Schalter an der Tür, Steckdosen, Daten- und TV-Dosen.
  Leitungen und Trunks sind noch nicht verlegt – daran lässt sich das Verlegen ausprobieren.

Beim ersten Start legt das Programm beide einmal an – auf Deutsch, wenn die Oberfläche Deutsch
spricht, sonst auf Englisch. Haben Sie sie gelöscht oder verändert, legt **Musterprojekt** unten
in der Projektliste jederzeit ein neues an; gibt es dasselbe schon, entsteht eine Kopie.

## Zeichnung, Notiz und PDF-Anlage {#dokumentarten}

- **Zeichnung** – das eigentliche CAD-Dokument mit Blättern, Hintergrund und Objekten.
- **Notiz** – reiner Text, etwa für Absprachen oder offene Punkte zum Projekt.
- **PDF-Anlage** – ein mitgeführtes Dokument (Angebot, Datenblatt, Aufmaß), das in der
  Anwendung angezeigt wird, ohne dass Sie den Ordner wechseln müssen.

Excel-Listen aus dem Listenexport liegen ebenfalls als Anlage im Projekt; ein Klick auf ihren
Namen lädt sie herunter. Excel- und PDF-Anlagen haben in ihrer Zeile zusätzlich den Knopf
**Extern öffnen**: Er öffnet die Datei im zuständigen Programm Ihres Computers, etwa Excel oder
Ihrem PDF-Programm. Geöffnet wird eine Kopie zum Ansehen – Änderungen, die Sie dort machen,
kommen nicht ins Projekt zurück. Speichern Sie sie bei Bedarf in Excel unter eigenem Namen. In
der Browser-Fassung lädt der Knopf die Datei herunter, weil eine Webseite keine Programme starten
darf.

{{befehl:datei.neue-zeichnung}} legt eine leere Zeichnung im laufenden Projekt an. Bei einem
Bauplan öffnet sich danach gleich [Zeichenfläche einrichten](#zeichenflaeche-einrichten) – wie bei
einem neuen Blatt; **Abbrechen** verschiebt das auf später.

## Bauplan oder Schaltplan {#zeichnungsart}

Beim Anlegen einer Zeichnung wählen Sie neben dem Namen ihre **Art**:

- **Bauplan** (Vorgabe) – der Plan eines Gebäudes mit Hintergrundplan, Wänden, Leitungen und
  Trunks. Jede Zeichnung aus früheren Versionen ist ein Bauplan.
- **Schaltplan** – ein Stromlaufplan mit [Schaltverbindungen](#schaltverbindung),
  [Potentialen](#potential) und Betriebsmittelkennzeichen. Jedes Blatt hat die feste
  Zeichenfläche DIN A4 quer im Maßstab 1:40 mit einem
  [Koordinatennetz](#koordinatennetz) und ein festes [Raster](#raster) von 24 cm.
- **Verteilerplan für +UV1** – erscheint nur, wenn Sie {{befehl:datei.neue-zeichnung}} in einem
  geöffneten Bauplan wählen, der Verteiler ohne eigenen Verteilerplan enthält, je Verteiler ein
  Eintrag. Es entsteht
  ein Schaltplan, der gleich mit diesem Verteiler verknüpft ist, siehe
  [Verteilerplan verknüpfen](#verteilerplan).

Die Art gilt für alle Blätter der Zeichnung und lässt sich später **nicht mehr ändern**. Sie
bestimmt, welche Werkzeuge die Seitenleiste anbietet: Wände oder Leitungen gibt es im
Schaltplan nicht, Schaltverbindungen nicht im Bauplan. In der Dokumentliste steht bei einem
Schaltplan „Zeichnung · Schaltplan“.

Weil ein Schaltplan keinen Grundriss hat, sind dort auch die Befehle rund um das Gebäude
gesperrt: Hintergrund einlesen (und damit Kalibrieren und Ausblenden), Blatt ausrichten,
Etagen einfügen, Zeichenfläche verschieben, der Wandfang, die 3D-Ansicht und der IFC-Export.

## Sprache des Plans {#plansprache}

Jede Zeichnung hat eine eigene **Plansprache** (Deutsch oder English). In ihr steht alles, was
auf dem Blatt landet: Beschriftungen an Komponenten und Leitungen, die Feldnamen des
[Plankopfs](#plankopf), Listen und Plan-Einlagen, der Hinweis am Rand des Ausdrucks sowie der
Excel- und IFC-Export. Menüs, Dialoge und Meldungen sprechen dagegen die Sprache der Oberfläche
(siehe [Einstellungen](#einstellungen-abschnitte)). So lässt sich ein englischer Plan auch an
einem deutschen Arbeitsplatz zeichnen, und dieselbe Zeichnung druckt auf jedem Rechner gleich.

- Beim Anlegen einer Zeichnung steht die Plansprache auf der Sprache der Oberfläche; im Dialog
  lässt sie sich unter **Plansprache** ändern.
- Später ändern Sie sie in den Blatt-Eigenschaften (Eigenschaften-Panel ohne Auswahl) unter
  **Plansprache**. Sie gilt für die ganze Zeichnung und lässt sich rückgängig machen.
- Namen, die beim Anlegen entstanden sind – etwa „Blatt 2“, Raumnamen, Ebenen oder die Texte
  eines erzeugten Verteilerplans –, bleiben beim Umstellen, wie sie sind. Sie sind Ihr Inhalt
  und lassen sich von Hand umbenennen.
- Ein erzeugter Verteilerplan übernimmt die Plansprache seines Bauplans.
- Zeichnungen aus früheren Versionen sind deutsch.

Produktnamen aus den Katalogen und die Anleitung gibt es vorerst nur auf Deutsch.

## Austausch mit anderen Rechnern {#austausch}

Zeichnungen lassen sich als Datei weitergeben:

1. {{befehl:datei.export-zeichnung}} schreibt das geöffnete Dokument in eine Datei.
2. {{befehl:datei.import-zeichnung}} liest eine solche Datei wieder ein – auf einem anderen
   Rechner oder als Kopie in einem anderen Projekt.
3. Ganze Kataloge gehen denselben Weg: {{befehl:datei.import-katalog}}, siehe
   [Kataloge verwalten](#kataloge-verwalten).

> Die Zeichnungsdatei enthält den Hintergrundplan und alle verwendeten Katalogdaten. Der
> Empfänger braucht also nichts weiter.

:::nur-desktop
Ein ganzes Projekt mit allen Dokumenten exportieren Sie im Projekte-Dialog über
**Exportieren…**. Ein solches Projektpaket darf höchstens 500 MB groß sein; ist ein Projekt
größer, weist das Programm vor dem Export darauf hin.
:::

## Sicherung {#sicherung}

{{befehl:datei.sicherung}} legt eine Sicherung des gesamten Datenordners an – Datenbank und
angehängte Dateien in einem Stück. Machen Sie das regelmäßig; es ist der einzige Weg, einen
versehentlich gelöschten Kunden oder ein überschriebenes Projekt zurückzuholen.

:::nur-cloud
In der Cloud-Fassung sichert der Server; der Menüpunkt entfällt dort.
:::

:::nur-cloud
## Anmeldung, Konto und Freigaben {#anmeldung}

Beim Start melden Sie sich mit E-Mail-Adresse und Kennwort an. „Angemeldet bleiben“ hält die
Sitzung über das Schließen des Browsers hinaus; es ist immer nur **eine** Sitzung je Konto
aktiv – melden Sie sich anderswo an, wird die alte Sitzung beendet.

Über das Benutzermenü rechts oben erreichen Sie:

- **Konto** – Kennwort ändern, Zwei-Faktor-Anmeldung und Passkeys einrichten.
- **Freigaben** – ein Projekt für Betrachter freigeben. Der Empfänger erhält einen Kurzcode
  und sieht das Projekt, ohne es ändern zu können.
- **Änderungsverlauf** – was sich in den letzten Fassungen geändert hat.
:::
