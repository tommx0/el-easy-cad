# Oberfläche anpassen

## Symbolleiste {#symbolleiste-anpassen}

Die Symbolleiste unter dem Menü enthält die Befehle, die Sie am häufigsten brauchen.
{{befehl:ansicht.symbolleiste}} blendet sie ein und aus. Über die Programmeinstellungen (oder
das Kontextmenü der Leiste) stellen Sie zusammen, welche Befehle darin stehen und in welcher
Reihenfolge – auch die Umschalter für Beschriftungen, Raster und Fang lassen sich dort
aufnehmen.

Über „+ Neue Gruppe…“ bündeln Sie mehrere Befehle zu einem benannten Aufklappmenü – etwa
„Zeichnen“ oder „Auswertung“ für ein eigenes Themengebiet. Ein Befehl wechselt seine Gruppe
über ein Auswahlfeld in der Liste; das Aufklappmenü selbst zeigt seine Mitglieder mit Symbol
und Name wie im Hauptmenü.

Ab Werk sind vier Gruppen eingerichtet: **Sichtbarkeit** (Hintergrund, Raster und die Schalter
für Beschriftungen, Leitungen, Trunks und Räume), **Blattverwaltung** (Blätter, Zeichenfläche,
Nullpunkt, Hintergrund laden und ausblenden), **Katalog** und **Fang** (alle Fang-Schalter, siehe [Objektfang](#objektfang)).
Die [3D-Ansicht](#dreid-ansicht) steht ab Werk als eigener Knopf in der Leiste.
**Auf Standard zurücksetzen** in den Einstellungen stellt diese Werksbelegung wieder her.

## Werkzeug-Seitenleiste {#seitenleiste}

{{befehl:ansicht.seitenleiste}} zeigt und verbirgt die Werkzeugleiste am linken Rand.

- **Breite ziehen**: Fassen Sie die rechte Kante und ziehen Sie sie. Ab etwa 200 Pixeln zeigt
  die Leiste eine Liste mit Symbol, Kürzel und Namen (so ist sie ab Werk eingestellt), schmaler
  nur die Symbole.
- **Abdocken**: Über den Knopf am Kopf der Leiste lösen Sie sie und stellen sie als schwebendes
  Fenster an eine beliebige Stelle.
- **Reihenfolge und Auswahl** der Werkzeuge stellen Sie in den Programmeinstellungen ein –
  Werkzeuge, die Sie nie brauchen, blenden Sie aus.

## Eigenschaften-Panel {#eigenschaften-panel}

{{befehl:ansicht.eigenschaften}} blendet die rechte Spalte aus, wenn Sie mehr Platz für die
Zeichnung brauchen. Sie zeigt immer die Einstellungen des ausgewählten Objekts; ist nichts
ausgewählt, die Vorgaben für neue Objekte und die Hintergrunddeckkraft.

## Tastenfunktionen mit der Maus {#kontextleiste}

Viele Werkzeuge haben beim Zeichnen oder Platzieren Funktionen auf einzelnen Tasten: Die
Leertaste dreht eine Komponente, die Ziffern 1–5 wählen die Zahl der Adern einer
Schaltverbindung, M schaltet zwischen mehr- und einlinig um, + und − ändern die Wandstärke. Damit Sie diese Tasten nicht
auswendig kennen müssen, blendet el.easy.CAD unten in der Zeichenfläche eine kleine Leiste ein.
Sie zeigt genau die Tasten, die im Augenblick etwas bewirken:

- **Ein Klick** auf einen Knopf wirkt wie der Druck auf die Taste.
- **Umschalter** zeigen ihren Stand mit einem Haken, bei Ziffern ist der gewählte Wert
  hervorgehoben, bei + und − steht der aktuelle Wert dazwischen.
- **Kommt eine Funktion hinzu** – etwa „Port-Stromkreis zuweisen“, sobald eine Leitung in einen
  Trunk läuft –, leuchtet ihr Knopf kurz auf.
- **Verschieben:** Ziehen Sie die Leiste am Griff ⋮⋮ an einen anderen Platz; sie merkt sich
  ihn. Ein Doppelklick auf den Griff setzt sie zurück.
- Ohne wirksame Taste, etwa im Auswahlwerkzeug ohne Auswahl, ist die Leiste ausgeblendet.

Haben Sie mit dem Auswahlwerkzeug etwas markiert, bekommt die Leiste einen roten Rahmen und zeigt
unter den Tasten zusätzlich die Zeile **Aktionen**: dieselben Funktionen wie das Menü der rechten Maustaste, etwa
„Ausrichten“, „Horizontal verteilen“ und „Gerätegruppe aus Auswahl bilden“ bei mehreren
Komponenten, „Kabeltyp“ und „Port-Stromkreis zuweisen …“ an einer Leitung oder „Anfang: Mit anderem
Trunk verbinden …“ an einem Trunk. Knöpfe mit ▾ klappen eine Auswahl auf. Es stehen nur
Funktionen da, die für die Auswahl gerade möglich sind. „Löschen“ finden Sie dort als Taste Entf;
„Wegpunkt hinzufügen/entfernen“ gibt es nur im Menü der rechten Maustaste, weil es an der
angeklickten Stelle wirkt.

{{befehl:ansicht.kontextleiste}} blendet die Leiste aus und wieder ein, ebenso die Einstellung
„Tastenfunktionen“. Ist sie eingeblendet, nennt der Hinweis unten links die Tasten nicht mehr
eigens – bei ausgeblendeter Leiste stehen sie wieder dort.

## Kleines Fenster, Tablet und Touch {#tablet}

Wird das Fenster schmal, klappen beide Seitenleisten automatisch ein; ein Zeiger an den Rand
holt sie als Vorschau zurück. Auf einem Tablet können Sie mit den Fingern arbeiten:

| Geste | Wirkung |
|---|---|
| Tippen | Klicken |
| Ziehen mit einem Finger | Zeichnen oder Objekt verschieben |
| Zwei Finger zusammen/auseinander | Zoomen |
| Zwei Finger schieben | Ausschnitt verschieben |
| Langes Drücken | Kontextmenü |

Auf dem Tablet erscheint die [Leiste mit den Tastenfunktionen](#kontextleiste) immer, mit
größeren Knöpfen und stets mit Esc zum Abbrechen – sie ersetzt die Tasten, die ohne Tastatur
fehlen.

## Vollbild {#vollbild}

{{befehl:ansicht.vollbild}} schaltet das Programm auf den ganzen Bildschirm.
