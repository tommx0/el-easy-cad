# Geometrie zeichnen

Die Geometriewerkzeuge stehen im Menü **Zeichnen › Geometrie** und in der Werkzeug-Seitenleiste.
Alle arbeiten nach demselben Muster: Werkzeug wählen, Punkte setzen, mit Esc abbrechen. Das
Werkzeug bleibt nach dem Zeichnen aktiv, Sie können also gleich das nächste Objekt zeichnen.

## Linien und Polylinien {#linien-und-polylinien}

- {{befehl:werkzeug.linie}} zeichnet eine einzelne Strecke: Anfang klicken, Ende klicken.
- {{befehl:werkzeug.polylinie}} zeichnet einen durchgehenden Zug: weiterklicken, so oft Sie
  wollen, **Enter** schließt ab. Ein Klick auf den Anfangspunkt schließt die Form.

Längen und Winkel geben Sie dabei wie unter [Länge und Winkel eingeben](#konstruktionsmass)
beschrieben über die Tastatur ein.

## Rechteck, Kreis, Bogen, Ellipse, Polygon {#rechteck-kreis-bogen}

| Werkzeug | Bedienung |
|---|---|
| {{befehl:werkzeug.rechteck}} | Zwei gegenüberliegende Ecken klicken |
| {{befehl:werkzeug.kreis}} | Mittelpunkt klicken, Radius aufziehen |
| {{befehl:werkzeug.bogen}} | Anfang, Ende und Wölbung klicken |
| {{befehl:werkzeug.ellipse}} | Mittelpunkt klicken, beide Halbachsen aufziehen |
| {{befehl:werkzeug.polygon}} | Mittelpunkt und Radius; **+** und **−** ändern die Eckenzahl |

## Punkt und Text {#punkt-und-text}

- {{befehl:werkzeug.punkt}} setzt eine Markierung, etwa als Bezugspunkt für eine Bemaßung.
- {{befehl:werkzeug.text}} setzt eine Beschriftung: Stelle klicken, Text eingeben. Schriftgröße,
  Ausrichtung und Drehung stellen Sie danach im Eigenschaften-Panel ein.

## Schraffur und Flächenfüllung {#schraffur-und-fuellung}

{{befehl:werkzeug.schraffur}} füllt einen Bereich: Umriss klicken, **Enter** schließt ihn ab.
Die Taste **M** schaltet während des Zeichnens die Schraffurart um.

Geschlossene Formen – Rechteck, Kreis, Ellipse, Polygon und geschlossene Polylinien – können
Sie auch direkt füllen: Objekt auswählen und im Eigenschaften-Panel unter **Füllung** Farbe,
Muster und Deckkraft einstellen. Die Deckkraft der Füllung ist unabhängig von der Linienfarbe,
eine Fläche kann also durchscheinend über dem Hintergrundplan liegen.

## Trimmen und Verlängern {#trimmen}

{{befehl:werkzeug.trimmen}} kürzt oder verlängert Linien bis zum nächsten Schnittpunkt:
Werkzeug wählen und auf das Stück klicken, das weg soll – oder auf das Ende, das bis zur
nächsten Kante wachsen soll. Wände werden dabei wie Linien behandelt.

## Linienart, Farbe und Stärke {#linienart}

Im Eigenschaften-Panel stellen Sie für die ausgewählten Objekte **Farbe** und **Strichstärke**
ein. Linien, Polylinien, Rechtecke, Kreise, Bögen, Ellipsen, Polygone, Wände, Treppen,
Bodenplatten und Schaltverbindungen haben zusätzlich einen **Linientyp**: Standard
(durchgezogen), Gestrichelt, Gepunktet oder Strich-Punkt. Neue Objekte beginnen immer mit den
Standardwerten; ändern Sie sie danach, gern für mehrere ausgewählte Objekte auf einmal.
