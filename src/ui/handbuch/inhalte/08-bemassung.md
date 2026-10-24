# Bemaßung

Maße entstehen aus der Zeichnung: Sie klicken zwei Punkte ab, das Programm rechnet die Länge aus
der [Kalibrierung](#kalibrieren) und schreibt sie an die Maßlinie. Verschieben Sie später einen
der Punkte, ändert sich das Maß mit.

## Einzelmaß {#einzelmass}

1. {{befehl:werkzeug.bemassung}} wählen.
2. Ersten Messpunkt klicken (der Objektfang hilft, die Ecke genau zu treffen).
3. Zweiten Messpunkt klicken.
4. Die Maßlinie auf den gewünschten Abstand herausziehen und klicken.

![Einzel-, Ketten- und Parallelbemaßung](bemassung.png)

## Kettenbemaßung {#kettenbemassung}

{{befehl:werkzeug.kettenbemassung}} setzt mehrere Maße in einer durchgehenden Linie – Fenster,
Pfeiler, Achsen nacheinander. Setzen Sie Punkt für Punkt; jedes neue Maß schließt an das
vorige an. **Enter** beendet die Kette.

## Parallelbemaßung {#parallelbemassung}

{{befehl:werkzeug.parallelbemassung}} bemisst von **einem** Bezugspunkt aus zu mehreren Zielen;
die Maßlinien liegen gestaffelt übereinander. Auch hier beendet **Enter** die Reihe.

Beide Varianten liegen zusätzlich im Aufklappmenü am Bemaßungswerkzeug in der Seitenleiste.

## Maße nachbearbeiten {#masse-bearbeiten}

Wählen Sie ein Maß aus, können Sie im Eigenschaften-Panel:

- den **Maßtext** überschreiben (z. B. „≈ 3,25“ oder ein Zusatz wie „OK Rohdecke“),
- die **Nachkommastellen** und die Einheit der Anzeige ändern,
- den **Abstand** der Maßlinie vom gemessenen Objekt verschieben,
- die **Schriftgröße** anpassen.

Maße liegen üblicherweise auf einer eigenen [Ebene](#ebenen); so blenden Sie sie für eine
Präsentation mit einem Klick aus.
