# Auswählen und bearbeiten

## Auswählen {#auswaehlen}

{{befehl:werkzeug.auswahl}} ist das Grundwerkzeug; zweimal **Esc** führt aus jedem anderen
Werkzeug dorthin zurück.

- **Klick** wählt ein Objekt; ein Klick ins Leere hebt die Auswahl auf.
- **Strg + Klick** (am Mac auch **Cmd + Klick**) nimmt ein Objekt zur Auswahl hinzu oder
  entfernt es wieder.
- **Rahmen aufziehen** (auf freier Fläche beginnen) wählt je nach Richtung:
  - von **links nach rechts** nur, was ganz im Rahmen liegt,
  - von **rechts nach links** zusätzlich alles, was der Rahmen nur berührt.

  Mit gehaltener **Strg**- bzw. **Cmd**-Taste erweitert der Rahmen die bestehende Auswahl, statt sie zu
  ersetzen.
- {{befehl:bearbeiten.alles-auswaehlen}} wählt alles auf dem Blatt,
  {{befehl:bearbeiten.auswahl-aufheben}} hebt die Auswahl auf.

Objekte auf unsichtbaren [Ebenen](#ebenen) lassen sich nicht auswählen. Objekte auf gesperrten
Ebenen können Sie auswählen und ansehen, aber nicht verschieben, drehen oder löschen.

## Verschieben, drehen, skalieren {#drehen-skalieren}

Ausgewählte Linien, Formen, Leitungen, Trunks und Bemaßungen leuchten blau entlang ihres
Verlaufs; um Komponenten, Texte und Tabellen liegt ein gestricheltes Rechteck. Beim Überfahren
mit der Maus erscheint dieselbe Markierung heller. Zum Bearbeiten hat die Auswahl Griffe:

- **Fläche ziehen** verschiebt die Auswahl.
- **Eckgriff ziehen** skaliert; **Umschalt** hält dabei die Seitenverhältnisse.
- **Drehgriff** oberhalb des Rechtecks dreht; **Umschalt** rastet auf 15°-Schritte.
- Die Pfeiltasten verschieben in kleinen Schritten.

Gedreht und skaliert wird um die Mitte der Auswahl. Im Eigenschaften-Panel stehen dieselben
Werte als Zahlenfelder, wenn ein einzelnes Objekt ausgewählt ist. Bei mehreren ausgewählten
Objekten zeigt das Panel die Felder, die alle gemeinsam haben (etwa Farbe und Ebene, bei lauter
Komponenten auch Beschriftung, Drehung und Darstellung) – eine Änderung dort gilt für alle
([Mehrere Komponenten ändern](#installationshoehe)).

> Leitungen an einer verschobenen Komponente werden automatisch neu verlegt – Sie müssen sie
> nicht von Hand nachziehen.

## Ausrichten und verteilen {#anordnen}

Sind mehrere Komponenten ausgewählt, bietet das Kontextmenü (Rechtsklick auf eine davon); bei
einer gemischten Auswahl mit Linien, Texten o. Ä. sind die Einträge ausgegraut:

- **Ausrichten** – Oben, Unten, Links, Rechts, Horizontal zentrieren oder Vertikal zentrieren.
- **Horizontal verteilen** und **Vertikal verteilen** – gleicher Abstand zwischen den
  Nachbarn. Vorgeschlagen wird der kleinste bereits vorhandene Abstand; Sie können im Dialog
  einen anderen Wert eintragen.
- **Als Grid verteilen** – erkennt Zeilen und Spalten der jetzigen Anordnung und richtet
  beide sauber aus. Im Dialog stellen Sie den Ursprung (X/Y in cm ab Nullpunkt) und den
  Abstand horizontal und vertikal getrennt ein.

Das ist der schnelle Weg zu einer ordentlichen Reihe Steckdosen oder einem Feld von Leuchten.

## Automatisch anordnen {#automatisch-anordnen}

{{befehl:bearbeiten.automatisch-anordnen}} räumt verstreute Komponenten samt ihren Verbindungen
auf. Sie finden den Befehl im Menü Bearbeiten, im Kontextmenü der Auswahl und in der
Kontextleiste unter „Aktionen“.

Es öffnet sich ein Dialog: links die Einstellungen, rechts bis zu sechs **Varianten** als
Vorschaubild. Unter jedem Bild stehen Kreuzungen, Knicke und die Länge der Verbindungen; die
empfohlene ist vorausgewählt. Klicken Sie eine Variante an und dann auf **Übernehmen**. Danach
ist alles mit einem Schritt {{befehl:bearbeiten.rueckgaengig}} wieder zurück. Oben im Dialog steht,
wie viele Komponenten und Verbindungen sich ändern – im Bauplan mit dem Hinweis, dass die
Komponenten ihren Einbauort verlassen.

So ordnet das Programm an:

- **Stufen.** Was miteinander verbunden ist, wird in Stufen angeordnet: von oben nach unten oder
  von links nach rechts, je Stufe eine Reihe. Kinder stehen symmetrisch unter ihrem Elternteil,
  in der Reihenfolge der Kontakte, an denen sie hängen. Wo es geht, stehen verbundene Kontakte
  genau übereinander, damit die Leitung gerade läuft – dafür dürfen die Lücken zwischen den
  Komponenten ungleich sein.
- **Kinder seitlich.** Sitzen die Kontakte auf den Seitenkanten, darf ein Kind auch neben seinem
  Elternteil stehen – die Verbindung ist dann ein kurzes gerades Stück.
- **Kamm.** Die Verbindungen eines Elternteils zu seinen Kindern laufen als paralleles Bündel
  zwischen den Reihen und zweigen erst kurz vor dem Ziel rechtwinklig ab.
- **Trunks** (nur im Bauplan). Laufen genug Leitungen eines Elternteils lang genug gemeinsam,
  wird aus dem Bündel ein Trunk: Die Leitungen treten darunter ein und über ihrem Ziel wieder
  aus, mit Nummernschildern wie beim Trunk-Werkzeug. Es gibt Varianten mit und ohne Trunk.
- **Kreuzungen vermeiden.** Reihenfolge und Verlegung sind so gewählt, dass sich Verbindungen
  möglichst nicht kreuzen und nicht aufeinanderliegen. Verbindungen desselben Potentials oder am
  selben Kontakt dürfen ein Stück gemeinsam laufen; die Adern einer mehrlinigen
  Schaltverbindung bleiben ein paralleles Bündel.

Die Varianten unterscheiden sich in Richtung, Wurzel (ganz oben steht die bisher oberste
Komponente, die mit den meisten Abgängen oder die Mitte des Netzes), Reihenfolge, seitlichen
Kindern und Trunks. Von den drei besten gibt es zusätzlich eine engere und eine weitere Fassung
(nicht, wenn Sie einen Abstand fest eingetragen haben). Bewertet wird zuerst nach Kreuzungen,
dann nach Knicken, Kabellänge und Fläche; Varianten, die dafür mehr als ein Viertel längere
Leitungen brauchen, stehen hinten. Die Karte nennt „mit Trunk“, „eng“ oder „weit“.

Die **Einstellungen** bleiben für das nächste Mal gemerkt (auch in der
[Einstellungen-Sicherung](#einstellungen-sichern)); **Einstellungen zurücksetzen** stellt die
Werkseinstellung wieder her:

- **Richtung** – automatisch (beide probieren), von oben nach unten oder von links nach rechts.
- **Bisherige Lage berücksichtigen** – oben steht dann, was schon jetzt oben steht, und die
  Reihenfolge folgt der bisherigen Lage.
- **Kinder auch seitlich**, **Je Stufe bündeln (Kamm)**, **Auf das Raster setzen**.
- **Abstand der Komponenten** und **Abstand der Reihen** in cm – leer heißt automatisch: nur so
  viel Platz wie nötig, die Beschriftung neben einem Symbol bleibt frei.
- **Bahnabstand** – wie weit parallele Verbindungen auseinanderliegen, in mm auf dem Papier.
- **Kreuzungen vermeiden** – gering, mittel oder stark: wie viel Umweg eine Verbindung machen
  darf, um nicht zu kreuzen. **Immer** zeigt nur Varianten ganz ohne Kreuzung; gibt es keine,
  sagt der Dialog das.
- **Trunks bilden** (Bauplan, mit Kamm) – ab wie vielen Leitungen (Vorgabe 5) und ab welcher
  gemeinsamen Länge (Vorgabe 2 m) ein Trunk entsteht.
- **Nur rechtwinklig verlegen** – im Schaltplan immer.
- **Lage des Ergebnisses** – die linke obere Ecke der Auswahl bleibt, oder alles steht mittig
  auf der Zeichenfläche.

Sind **nur Verbindungen** ausgewählt (auch eine einzelne Leitung oder Schaltverbindung), bleiben
die Komponenten stehen; der Dialog zeigt dann nur die Einstellungen zum Verlegen.

Gut zu wissen:

- Komponenten ohne Verbindung kommen in eine eigene Reihe ganz unten.
- An einer Wand eingeordnete Komponenten und Objekte auf gesperrten Ebenen bleiben stehen.
  Aufgesetzte Module wandern mit ihrem Gehäuse.
- Verbindungen stehen danach auf automatischer Verlegung, auch wenn sie vorher von Hand gelegt
  waren.
- **Verbindungen merken sich die Maßgaben.** Verschieben, drehen oder skalieren Sie später eine
  Komponente, verlegt das Programm ihre angeordneten Verbindungen beim Loslassen nach denselben
  Regeln neu – rechtwinklig, mit Bahnabstand und ohne Kreuzungen, wo es geht, und wieder als
  Kamm, solange die Reihen noch erkennbar sind. Während des Ziehens zeigt die Vorschau die
  schnelle Verlegung. Wer eine solche Leitung von Hand umlegt, nimmt sie aus diesen Regeln
  heraus; mit ausgeschalteter automatischer Verlegung ruhen sie.
- Eine Meldung weist darauf hin, wenn eine Verbindung keinen freien Weg fand, wenn das Ergebnis
  andere Komponenten überdeckt oder (im Schaltplan) nicht ganz auf die Zeichenfläche passt. Im
  Schaltplan rückt das Programm die Komponenten in diesem Fall vorher enger zusammen.

## Kopieren, einfügen, löschen {#kopieren}

{{befehl:bearbeiten.kopieren}}, {{befehl:bearbeiten.ausschneiden}} und
{{befehl:bearbeiten.einfuegen}} arbeiten wie gewohnt und auch über Blattgrenzen hinweg:
kopieren Sie eine Gruppe auf Blatt „EG“ und fügen Sie sie auf „OG“ wieder ein.
{{befehl:bearbeiten.loeschen}} entfernt die Auswahl.

Leitungen, die an einer gelöschten Komponente hängen, verschwinden mit ihr; ein Rückgängig holt
beides zurück. Nachgefragt wird vor dem Löschen eines Trunks, in dem Leitungen liegen (sie
verschwinden mit ihm), und eines Kabelschachts mit Anschlüssen (deren Leitungen bleiben, verlieren
aber die Verbindung in die anderen Etagen).

## Rückgängig {#rueckgaengig}

Jede Änderung am Dokument lässt sich zurücknehmen: {{befehl:bearbeiten.rueckgaengig}} und
{{befehl:bearbeiten.wiederholen}}. Der Verlauf umfasst die ganze Sitzung und gilt über alle
Blätter hinweg.

## Zoomen und Ausschnitt {#zoomen-und-schieben}

| Befehl | Wirkung |
|---|---|
| {{befehl:ansicht.zoom-rein}} / {{befehl:ansicht.zoom-raus}} | Schrittweise vergrößern und verkleinern |
| {{befehl:ansicht.zoom-alles}} | Alles einpassen |
| {{befehl:ansicht.zoom-100}} | Zurück auf 100 % |
| {{befehl:werkzeug.zoom-fenster}} | Ein Rechteck aufziehen, auf das gezoomt wird |
| {{befehl:ansicht.vollbild}} | Programm im Vollbild |

Schneller geht es mit der Maus: Rad zum Zoomen, rechte Maustaste gehalten zum Schieben.
