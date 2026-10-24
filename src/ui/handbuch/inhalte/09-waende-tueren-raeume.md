# Wände, Türen, Fenster, Räume und Treppen

Diese Werkzeuge zeichnen Bauteile, keine bloßen Linien: Eine Wand hat eine Stärke und schließt
an die Nachbarwand an, eine Tür schneidet eine Öffnung hinein, ein Raum erkennt seine Fläche
selbst. Sie stehen im Menü **Zeichnen › Wände & Räume**.

## Wände zeichnen {#waende-zeichnen}

{{video:02-waende}}

1. {{befehl:werkzeug.wand}} wählen.
2. Die **Wandstärke** oben rechts über der Zeichenfläche einstellen – **+** und **−** ändern sie
   auch während des Zeichnens.
3. Wandzug klicken wie eine Polylinie; **Enter** schließt ab, ein Klick auf den Anfangspunkt
   schließt den Umriss. Dafür genügt es, das sichtbare Wandende zu treffen – der Punkt rastet
   exakt auf den Anfang, die Ecke wird sauber auf Gehrung geschnitten.

Nach dem Abschluss besteht der Wandzug aus einzelnen **Segmenten**, eines je Teilstrecke. Sie
bleiben an ihren Ecken verbunden, lassen sich aber einzeln auswählen, verschieben und bearbeiten.
Verschieben Sie ein Segment, verlängern oder verkürzen sich die angrenzenden Segmente in ihrer
eigenen Richtung mit – ein Raum bleibt dabei rechtwinklig.

Ein Klick auf das Ende einer bestehenden Wand – als erster oder als letzter Punkt – schließt die
neue Wand dort an. Stoßen zwei Wände mitten aufeinander, werden sie sauber verschnitten und sehen
wie ein Stück aus. Beim Wandwerkzeug ist die Fangart „Nächster Punkt“ immer aktiv, damit Sie
zuverlässig an eine bestehende Wand andocken.

## Wand als Rechteck {#wand-als-rechteck}

{{befehl:werkzeug.wandrechteck}} zeichnet vier verbundene Wände auf einmal:

1. Werkzeug wählen und die **Wandstärke** einstellen (Feld über der Zeichenfläche, **+**/**−**).
2. Eine Außenecke klicken, dann die gegenüberliegende.

Die beiden Klicks bestimmen das **Außenmaß** – die Wände liegen vollständig innerhalb des
aufgezogenen Rechtecks. Das Werkzeug bleibt für weitere Rechtecke aktiv.

![Wände mit Tür und Fenster](waende.png)

## Türen und Fenster {#tueren-und-fenster}

{{video:03-tueren-fenster}}

{{befehl:werkzeug.tuer}} und {{befehl:werkzeug.fenster}} setzen eine Öffnung **in** eine
vorhandene Wand:

1. Werkzeug wählen.
2. In der Leiste oben rechts über der Zeichenfläche die Maße prüfen: bei der Tür **Breite** und
   **Höhe**, beim Fenster zusätzlich die **Brüstungshöhe** – die Höhe der Unterkante über dem
   Fußboden. Die Werte bleiben für die nächsten Türen bzw. Fenster stehen.
3. Auf die Wand fahren – die Öffnung hängt am Zeiger und richtet sich nach der Wand aus.
4. Klicken, um sie zu setzen.

Maße, Anschlagseite und Öffnungsrichtung lassen sich danach im Eigenschaften-Panel ändern; mit
dem Auswahlwerkzeug lässt sich die Öffnung entlang der Wand verschieben. Wird die Wand gelöscht,
verschwinden ihre Öffnungen mit. Höhe und Brüstungshöhe stehen nicht im Plan, wirken aber in der
[3D-Ansicht](#dreid-ansicht) und im IFC-Export.

## Wanddurchbruch {#wanddurchbruch}

{{befehl:werkzeug.wanddurchbruch}} erzeugt eine reine Aussparung ohne Tür- oder Fenstersymbol –
für Rohrdurchführungen, Kernbohrungen und Kabeldurchbrüche. Bedienung wie bei Tür und Fenster.

## Wand teilen {#wand-teilen}

{{befehl:werkzeug.wandteilen}} trennt eine Wand an der angeklickten Stelle in zwei eigenständige
Wände – nötig, wenn nur ein Teilstück eine andere Stärke oder eine andere Ebene bekommen soll.
Einen Doppelklick auf eine Wand mit dem Auswahlwerkzeug teilt sie ebenfalls – ohne Lücke, in zwei
verbundene Segmente.

## Eckpunkte nachziehen {#punkt-griffe}

Wählen Sie eine Wand oder eine Polylinie aus, erscheinen an ihren Eckpunkten kleine Griffe.
Ziehen Sie einen Griff, wandert nur dieser Punkt; angrenzende Wände bleiben verbunden und
verschneiden sich neu. So korrigieren Sie einen schief abgegriffenen Grundriss, ohne alles neu
zu zeichnen. Einen angeklickten Eckpunkt, an dem genau zwei Wände zusammentreffen, entfernt
**Entf** – beide werden zu einer geraden Wand.

## Räume {#raeume}

{{befehl:werkzeug.raum}} erkennt einen Raum aus den umgebenden Wänden:

1. Werkzeug wählen.
2. In die Fläche klicken, die der Raum sein soll.

Das Programm sucht die geschlossene Umgrenzung und legt den Raum an. Name und Fläche werden auf
dem Plan angezeigt (abschaltbar unter **Blatt › Beschriftungen anzeigen**). Ändern Sie die Wände,
rechnet der Raum seine Fläche neu. Entfernen Sie eine Trennwand zwischen zwei Räumen, verschmelzen
sie.

Im Eigenschaften-Panel des Raums stellen Sie ein:

- **Name** und **Schriftgröße** (in cm) der Beschriftung,
- **Name** und **Fläche** einzeln: Wie global, Anzeigen oder Ausblenden,
- eine **Füllung** wie bei anderen geschlossenen Formen, siehe
  [Schraffur und Flächenfüllung](#schraffur-und-fuellung).

Name und Fläche bilden ein gemeinsames Etikett. Ziehen Sie es mit dem Auswahlwerkzeug an eine
andere Stelle; ein Doppelklick darauf setzt es wieder in die Raummitte.

Hat die Decke über einem Raum eine andere Stärke als im übrigen Geschoss, tragen Sie sie im
Eigenschaften-Panel unter **Deckenstärke** ein; leer gilt die der [Etage](#geschossangaben). Sie
wirkt in der [3D-Ansicht](#dreid-ansicht) auf die Decke über diesem Raum.

**Raumstromkreis gemeinsam mit** im Eigenschaften-Panel legt den Raumstromkreis dieses Raums mit
dem eines anderen Raums auf demselben Blatt zusammen – etwa WC und Abstellraum mit dem Flur. Das
nutzt [Bestückung aus Räumen](#verteiler-aus-raeumen); nummerierte und eigene Stromkreise bleiben
beim Raum.

## Treppen {#treppen}

{{befehl:werkzeug.treppe}} setzt eine Treppe als fertiges Bauteil:

1. Werkzeug wählen.
2. In der Leiste oben rechts über der Zeichenfläche **Form**, **Länge** und **Breite** festlegen.
   Jede Form merkt sich ihre eigenen Maße.
3. Die Treppe hängt mittig am Zeiger; die Leertaste dreht sie um 90°, die Taste F wechselt die
   Form.
4. Klicken, um sie zu setzen.

Die Formen:

| Form | Beschreibung |
|---|---|
| Gerade | Ein Lauf über die volle Länge |
| Mit Mittelpodest (180°) | Zwei gegenläufige Läufe mit quadratischem Podest |
| Kehre ohne Podest (180°) | Zwei gegenläufige Läufe mit gewendelten Stufen (2 Wendelstufen) |
| L-Treppe (90°) | 90°-Wendung mit 3 Wendelstufen, Länge und Breite je Lauf einstellbar |

Danach stellen Sie im Eigenschaften-Panel ein:

- **Form** und **Stufenanzahl** – Stufenteilung und Richtungspfeil ergeben sich daraus von selbst.
- **Laufrichtung tauschen** – der Pfeil zeigt in die Gegenrichtung, Antritt und Austritt
  wechseln die Seite.
- **Stufenzahl anzeigen** – blendet die Beschriftung mit der Stufenzahl ein oder aus.
- Nur bei der L-Treppe: **Länge** und **Breite** je Lauf – **Lauf A** liegt an der Antrittseite,
  **Lauf B** am abgewinkelten Ende – sowie **L-Form horizontal spiegeln** und
  **L-Form vertikal spiegeln**.

Die Größe einer geraden oder U-förmigen Treppe ändern Sie wie bei anderen Objekten über die
Griffe der Auswahl, siehe [Verschieben, drehen, skalieren](#drehen-skalieren).

Im Grundriss ist die Treppe wie üblich **geschnitten**: Vom Antritt bis zur Stufe auf etwa
1,00 m Höhe ist sie durchgezogen, eine schräge Schnittlinie markiert den Schnitt, der Rest bis zum
Austritt ist gestrichelt. Die Höhe der Stufen ergibt sich aus der Kote der Etage darüber, sonst aus
lichter Raumhöhe und Decke des Blattes (siehe [Geschossangaben](#geschossangaben)); ohne
Höhenangaben liegt der Schnitt in der Mitte.

Auf dem **Blatt darüber** – dem nächsten Register rechts – erscheint dieselbe Treppe ab der
Schnittlinie bis zum Austritt, durchgezogen, weil sie dort heraufkommt. Sie gehört weiter zum
unteren Blatt: oben lässt sie sich nicht anklicken oder fangen, geändert wird sie unten. Sie
erscheint auch im Druck und im PDF.

## Bodenplatten {#bodenplatten}

Eine Bodenplatte gibt dem Geschoss in der [3D-Ansicht](#dreid-ansicht) einen Boden in der Form und
Stärke, die Sie brauchen – auch für Podeste oder Sockel.

- {{befehl:werkzeug.bodenplatte}} zeichnet die Platte Eckpunkt für Eckpunkt. Ein Klick auf den
  ersten Punkt, ein Doppelklick oder **Enter** schließt den Umriss (ab drei Punkten).
- {{befehl:werkzeug.bodenplatterechteck}} zieht sie mit zwei Klicks als Rechteck auf.

Im Plan erscheint nur der gestrichelte Umriss; Linientyp und Füllung lassen sich wie bei anderen
Formen ändern. Im Eigenschaften-Panel stellen Sie **Stärke** und **Oberkante über Fußboden** ein
(Vorgabe 25 cm und 0 cm, die Platte liegt dann unter dem Fußboden); mehrere ausgewählte Platten
ändern Sie zusammen. Den Umriss bearbeiten Sie wie eine Polylinie: Eckpunkt ziehen, Doppelklick
auf eine Kante fügt einen Punkt ein, ein angeklickter Punkt verschwindet mit Entf.

Sobald ein Blatt eine gezeichnete Bodenplatte hat, legt die 3D-Ansicht dort keine eigene dünne
Platte mehr unter die Räume.

Über jeder Treppe bekommt die Bodenplatte der Etage darüber – und die Decke des Raums, in dem die
Treppe steht – von selbst einen Ausschnitt in der Größe der Treppe. Das gilt in der 3D-Ansicht und
im IFC-Export; die Platte im Plan bleibt, wie Sie sie gezeichnet haben.
