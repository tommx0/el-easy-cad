# Genau zeichnen

Zeichnen von Hand reicht für eine Skizze. Damit Maße stimmen, gibt es Raster, Fang, Objektfang,
Spurlinien und die Eingabe von Länge und Winkel über die Tastatur.

## Raster und Rasterfang {#raster}

- {{befehl:ansicht.raster}} zeigt das Raster.
- {{befehl:ansicht.fang}} zwingt jeden gesetzten Punkt auf den nächsten Rasterpunkt.

Die Rasterweite stellen Sie in den Programmeinstellungen ein. Bezugspunkt ist der
[Nullpunkt](#nullpunkt) des Blattes.

In einem [Schaltplan](#zeichnungsart) ist das Raster **fest auf 24 cm** eingestellt – den Abstand
der Kontakte von Leitungsschutzschaltern, Sicherungen und Schützkontakten – und ändert sich weder
mit dem Zoom noch über die Programmeinstellungen. Setzen Sie die Symbole mit eingeschaltetem
Fang, fluchten ihre Kontakte untereinander. Weit herausgezoomt blendet el.easy.CAD die feinen
Linien aus, gefangen wird trotzdem auf 24 cm.

## Objektfang {#objektfang}

Der Objektfang rastet auf markante Punkte vorhandener Objekte ein, während Sie zeichnen.
{{befehl:ansicht.objektfang}} schaltet ihn ein und aus. In der Symbolleiste liegen ab Werk alle
Fang-Schalter in der Aufklappgruppe **Fang**: Wandfang, Hintergrundfang, die sieben Fangarten
einzeln, Raster-Fang, Objektfang und Spurfang.

| Fangart | Was sie liefert |
|---|---|
| Endpunkt | Anfang, Ende und Ecken von Objekten, Bogenenden |
| Mittelpunkt | Mitte einer Kante oder eines Bogens |
| Zentrum | Mittelpunkt von Kreis, Bogen, Ellipse, Polygon, Rechteck oder Komponente |
| Quadrant | Die vier Punkte bei 0°, 90°, 180° und 270° an Kreis und Ellipse |
| Dockpunkt | Anschlusspunkte einer Komponente |
| Schnittpunkt | Kreuzungspunkt zweier Objekte |
| Nächster Punkt | Der zeigernächste Punkt auf einer Kante |

Am gefangenen Punkt erscheint eine Fangmarke, deren Form die Art anzeigt.

Die Fangarten schalten Sie einzeln mit {{befehl:ansicht.objektfang-endpunkt}},
{{befehl:ansicht.objektfang-mitte}}, {{befehl:ansicht.objektfang-zentrum}},
{{befehl:ansicht.objektfang-quadrant}}, {{befehl:ansicht.objektfang-dock}},
{{befehl:ansicht.objektfang-schnitt}} und {{befehl:ansicht.objektfang-naechster}} – in der
Gruppe „Fang“ oder, wer eine davon lieber als eigenen Knopf sieht, über
[Symbolleiste anpassen](#symbolleiste-anpassen) direkt in der Leiste.

> **Alt gedrückt halten** hält jeden Fang an, solange die Taste unten ist – so kommen Sie
> dicht neben ein Objekt, ohne den Schalter umzulegen.

## Fang auf den Hintergrund {#hintergrundfang}

Liegt ein DXF-Plan, ein IFC-Geschoss oder ein PDF-Vektorplan als Hintergrund unter dem Blatt,
fängt der Objektfang auch auf dessen Linien – Wandecken, Kanten und Schnittpunkte des Grundrisses
werden so zu Fangpunkten, ohne dass Sie etwas nachzeichnen müssen. Schnittpunkte gelten auch
zwischen einer Planlinie und Ihren eigenen Objekten; liegen ein eigenes Objekt und eine Planlinie
gleich nah, gewinnt Ihr Objekt.

{{befehl:ansicht.hintergrundfang}} schaltet das ab und wieder ein (ab Werk an). Es setzt den
Objektfang voraus und wirkt nur, solange der Hintergrund zu sehen ist – in ausgeblendeten
Bereichen und bei ausgeschaltetem Hintergrund wird nicht gefangen. Gescannte Pläne (Bilder oder
PDFs ohne Vektoren) haben keine Linien zum Fangen.

Ab Werk sind Endpunkt, Dockpunkt, Schnittpunkt und Nächster Punkt eingeschaltet – Wandecken und
die Enden einzelner Planlinien werden also gefangen; für Kantenmitten schalten Sie zusätzlich die
Fangart Mittelpunkt zu. Wer den Plan nicht nur zum Fangen, sondern zum Bearbeiten braucht, kann ihn
[umwandeln](#hintergrund-umwandeln).

## Spurlinien {#spurlinien}

{{befehl:ansicht.spurfang}} schaltet die Fluchtlinien zu: Fahren Sie einen Fangpunkt kurz an,
merkt das Programm ihn sich und zeigt gestrichelte Hilfslinien, wenn Sie waagerecht oder
senkrecht in seiner Flucht stehen. So setzen Sie einen Punkt genau unter eine Ecke, ohne
Hilfslinien zeichnen zu müssen. Spurlinien setzen den Objektfang voraus.

## Länge und Winkel eingeben {#konstruktionsmass}

Beim Zeichnen zeigt die Statuszeile fortlaufend Länge, absoluten und relativen Winkel des
offenen Teilstücks. Diese drei Felder sind zugleich Eingabefelder:

1. Tippen Sie eine **Ziffer**, während ein Teilstück offen ist – das Zeichen landet im
   Längenfeld und der Fokus springt dorthin.
2. **Tab** wechselt zwischen Länge, Winkel absolut und Winkel relativ.
3. Sie dürfen auch nur eines füllen: nur Länge getippt, kommt die Richtung weiter vom
   Mauszeiger; nur Winkel getippt, bestimmt die Maus die Länge.
4. **Enter** setzt den Punkt wie ein Mausklick, die Felder leeren sich für das nächste
   Teilstück.

In einem [Schaltplan](#zeichnungsart) gibt es diese Felder nicht: Dort bestimmt das feste Raster
die Lage, und die Ziffern stellen beim Zeichnen einer Schaltverbindung die Zahl der Adern ein.

Die Umschalttaste rastet die Richtung auf feste Winkel – praktisch für rein waagerechte oder
senkrechte Strecken.
