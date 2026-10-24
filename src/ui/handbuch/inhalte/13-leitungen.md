# Leitungen

Eine Leitung verbindet zwei Anschlusspunkte. Den Weg dazwischen sucht das Programm selbst: Es
legt ein Raster über das Blatt, meidet platzierte Komponenten und findet den kürzesten Weg
(Autorouting). Sie können jederzeit eigene Stützpunkte vorgeben.

## Eine Leitung zeichnen {#leitung-zeichnen}

{{video:05-leitungen}}

1. {{befehl:werkzeug.leitung}} wählen.
2. Auf den **Dockpunkt** der ersten Komponente klicken (D gedrückt halten zeigt alle
   Dockpunkte).
3. Auf den Dockpunkt der zweiten Komponente klicken.

Fertig – die Leitung sucht sich ihren Weg, läuft um Komponenten herum und verlässt das Gerät
senkrecht zum Port statt quer durch das Gehäuse.

![Eine Leitung zwischen zwei Komponenten](leitung.png)

Eine Leitung läuft immer von der Seite auf einen Dockpunkt zu, die ihm am nächsten liegt – an
einem Kontakt an der Unterkante also senkrecht von unten. Liegt ein Dockpunkt im Inneren einer
Komponente, wird die Leitung über das Symbol gezeichnet, damit ihr letztes Stück sichtbar
bleibt.

## Komponenten an der Wand {#leitung-an-der-wand}

Hängt eine Komponente an der Wand ([Kombinationen je Höhe](#wandfang)), kommt die Leitung aus der
Wand – wie in der Installation. Das Werkzeug bietet dort nur die Dockpunkte auf der Wandseite an;
nur sie werden beim Zeichnen angezeigt und gefangen. Liegt die Komponente in einer Reihe weiter im
Raum oder steht die Kombination quer, läuft die Leitung von der Wand her über die Symbole davor.

**Auf und unter Putz:** Eine Komponente auf Putz (AP, die Vorgabe) steht im Plan 2 cm vor der
Wand. Die Leitung läuft in diesem Spalt auf der Wand entlang, 1 cm vor der Oberfläche, und biegt
mit einem kurzen Stück in den Dockpunkt – auch hinter den übrigen Komponenten an der Wand vorbei.
Eine Komponente unter Putz (UP) sitzt bündig an der Wand; ihre Leitung kommt aus der Wand. Die
Verlegeart stellen Sie im Eigenschaften-Panel der Komponente um
([Auf oder unter Putz](#verlegeart)).

- **Alle Dockpunkte:** Halten Sie Alt gedrückt, werden auch die übrigen Dockpunkte angeboten. In
  der Kontextleiste schaltet **Alle Dockpunkte** das für das Werkzeug dauerhaft um, bis Sie es
  verlassen – so geht es auch auf dem Tablet.
- **Ports und Klemmen:** Haben die Dockpunkte eine eigene Bedeutung (Switch-Ports, Klemmen wie
  L, N, PE), bleiben alle wählbar.
- **Bestehende Leitungen:** Setzen Sie eine angeschlossene Komponente an die Wand oder drehen Sie
  sie dort, sodass eine andere Seite zur Wand zeigt, wandern ihre Leitungen auf den nächsten
  Dockpunkt der Wandseite und werden neu verlegt – in einem Rückgängig-Schritt.

## Eigene Stützpunkte setzen {#leitung-stuetzpunkte}

Soll die Leitung einen bestimmten Weg nehmen, klicken Sie zwischendurch auf freie Punkte: Bis
dorthin verläuft sie genau über Ihre Punkte, und nur das letzte Stück zum Ziel wird automatisch
gesucht. So kombinieren Sie Handführung und Autorouting in einer Leitung.

- **Umschalt** gehalten rastet den nächsten freien Punkt auf 45°-Schritte zum letzten Punkt ein.
- **Rücktaste** oder **Entf** (auch ein Rechtsklick) nimmt den zuletzt gesetzten Punkt zurück.
- **Freies Ende:** Ein Doppelklick oder **Enter** beendet die Leitung am letzten Punkt, ohne
  Anschluss – etwa für einen Auslass, dessen Gerät noch nicht feststeht. Auch der Anfang darf
  frei liegen: Klicken Sie zu Beginn statt auf einen Dockpunkt ins Freie.
- **Esc** bricht die angefangene Leitung ab.

Eine Leitung mit eigenen Punkten wird ohne automatische Verlegung gespeichert: Verschieben Sie
später eine angeschlossene Komponente, wird sie mitgezogen, aber nicht neu gesucht.

**Letztes Stück gerade:** Halten Sie beim Klick auf den Ziel-Dockpunkt, den Trunk oder den
Kabelschacht **Strg** (am Mac **control**) gedrückt, wird auch dieses Stück nicht gesucht,
sondern als gerade Linie ab dem letzten Punkt gezogen – ohne Ausweichen und ohne
Installationszonen. Die Vorschau zeigt es, solange Strg gedrückt ist. Auf dem Tablet tippen Sie
dafür in der Kontextleiste auf **Gerade**; das gilt dann für das nächste Stück. Eine so
gezeichnete Leitung behält wie eine mit eigenen Stützpunkten ihren Verlauf.

Das automatische Verlegen lässt sich je Leitung im Eigenschaften-Panel abschalten; die Leitung
behält dann genau den gezeichneten Verlauf.

## Wandführung {#wandfuehrung}

In den Programmeinstellungen unter **Routing** schalten Sie die **Wandführung** ein: Leitungen
laufen dann bevorzugt an Wänden entlang, mit einstellbarem Abstand. Wände dürfen weiterhin
überall gequert werden – das Queren kostet nur einen Aufschlag, sodass der Weg an der Wand
entlang meist gewinnt. Ausgeschaltet verhält sich das Routing wie zuvor.

Weitere Routing-Einstellungen sind der Sicherheitsabstand zu Komponenten sowie die Zuschläge
für Richtungswechsel – wer weniger Ecken will, erhöht den Zuschlag.

So verlegt el.easy.CAD Leitungen immer:

- **Nur rechtwinklig** – keine Schrägen, wie ein Elektriker verlegt.
- **Parallel zu den Wänden**, auch wenn der Plan leicht schief abgezeichnet ist: Das Routing
  richtet sich nach der vorherrschenden Wandrichtung des Blatts.
- **Nebeneinander statt übereinander:** Laufen mehrere Leitungen dieselbe Strecke, liegen sie im
  eingestellten **Abstand paralleler Leitungen** (Vorgabe 3 cm) nebeneinander, an der Wand von ihr
  weg in den Raum. Das kurze Stück direkt am Gerät bleibt gemeinsam.

Bereits verlegte Leitungen bringt {{befehl:bearbeiten.leitungen-neu-verlegen}} (Menü Zeichnen,
Rechtsklick auf Leitungen) auf diesen Stand: die ausgewählten, ohne ausgewählte Leitung alle des
Blatts, in einem Rückgängig-Schritt. Leitungen mit eigenen Stützpunkten oder ausgeschaltetem
automatischen Verlegen bleiben, wie sie sind.

Durch ein **Fenster** verlegt das Routing nie eine Leitung, ob die Wandführung ein- oder
ausgeschaltet ist: Die Leitung quert die Wand neben dem Fenster. Vor dem Fenster an der Wand
entlang darf sie laufen. Nur zu einem Gerät am Fenster selbst, etwa einem Fensterkontakt, führt
sie an dieses Fenster heran.

## Kabeltyp und Zone vorab wählen {#kabeltyp-waehlen}

Während das Leitungswerkzeug aktiv ist, zeigt eine Leiste oben rechts über der Zeichnung, was
neue Leitungen bekommen:

- **Kabeltyp:** der Standard-Kabeltyp der Zeichnung. Ändern Sie ihn dort, ohne in die
  Einstellungen zu wechseln. Die Liste der Typen pflegen Sie über {{befehl:katalog.kabeltypen}}.
- **Installationszone:** „wie Blatt“ oder eine bestimmte [Zone](#leitung-zone). Sie gilt für alle
  Leitungen, die Sie danach zeichnen, bis Sie sie zurückstellen oder eine andere Zeichnung öffnen.
- **AP / UP:** wechselt auf dieselbe Zone mit der anderen Verlegeart, etwa von „Obere Zone auf der
  Wand (AP)“ auf „Obere Zone in der Wand“. Gibt es keine Zone gleicher Höhe mit der anderen
  Verlegeart, ist der Knopf ausgegraut.

Für eine vorhandene Leitung stehen Kabeltyp und Zone im Eigenschaften-Panel. Schneller geht der
Kabeltyp per Rechtsklick auf die Leitung (auch in der Zeile „Aktionen“ der
[Kontextleiste](#kontextleiste)) unter **Kabeltyp ▸**: oben „Kein Typ“ und die zuletzt benutzten
Typen, darunter alle aktiven Typen nach Gruppen. Sind mehrere Leitungen ausgewählt, bekommen alle
denselben Typ. Wie Sie die Kabeltypen einer ganzen Liste auf einmal ändern, steht unter
[Leitungsliste](#leitungsliste).

## Leitungsnummern und Beschriftung {#leitungsnummern}

Jede Leitung bekommt beim Zeichnen automatisch die nächste freie Nummer der ganzen Zeichnung –
über alle Blätter, ob sie durch einen Trunk läuft oder nicht. Eine gelöschte Leitung gibt ihre
Nummer wieder frei. Die Nummer steht als kleines Schild am Ein- und Austritt jedes Trunks, durch
den die Leitung läuft, bei einer Leitung ohne Trunk mittig auf ihrem Weg. Eine Leitung, die über
einen [Kabelschacht](#kabelschacht) auf der anderen Etage fortgesetzt wird, behält dort ihre
Nummer. Eigenen Text an der Leitung tragen Sie im Eigenschaften-Panel als Beschreibung ein. Was am Plan erscheint – Nummer, Kabeltyp, Länge –, schalten Sie unter
**Blatt › Beschriftungen anzeigen** um.

## Leitungslängen {#leitungslaengen}

Die Länge einer Leitung ergibt sich aus ihrem Verlauf, inklusive der Strecke durch einen
[Kabelschacht](#kabelschacht) über mehrere Geschosse. Voraussetzung ist ein
[kalibrierter](#kalibrieren) Plan.

Die **Anschlussreserve je Kabelende** ist der Zuschlag für das Auflegen; sie wird an beiden Enden
jeder Leitung hinzugerechnet. Sie gilt für die ganze Zeichnung, nicht je Leitung, und steht im
Eigenschaften-Panel einer ausgewählten [Leitungsliste](#leitungsliste) sowie in den
Programmeinstellungen unter **Leitungen & Kabeltyp**. Die Länge mit Reserve erscheint in der
Leitungsliste und im Excel-Export.

Haben die Blätter [Geschossangaben](#geschossangaben) mit einer Installationszone, kommen die
senkrechten Stücke von der Zone zu den Geräten hinzu. Sie stecken nur in der Länge mit Reserve
(Verlegelänge); die am Plan nachmessbare Länge bleibt, wie sie ist. Das Eigenschaften-Panel der
Leitung nennt den Höhenanteil eigens.

## Installationszone einer Leitung {#leitung-zone}

Ohne eigene Angabe läuft eine Leitung in der Installationszone ihres Blattes
([Geschossangaben](#geschossangaben)). Eine andere stellen Sie auf zwei Wegen ein: im
Eigenschaften-Panel unter **Installationszone** oder in der [Kontextleiste](#kontextleiste) bzw.
im Rechtsklick-Menü unter **Installationszone ▸**. Zur Wahl stehen die Zonen der
[Geschossangaben](#geschossangaben), je auf und in Decke, Wand und Boden; „wie Blatt“ nennt,
welche Zone gerade gilt, der Haken im Menü die eingestellte.
Markieren Sie mehrere Leitungen – etwa alle Steckdosenkreise eines Geschosses –, stellen Sie die
Zone für alle zugleich um; tragen sie verschiedene, zeigt das Feld „(verschieden)“. Sind auch
[Trunks](#trunk-zone) markiert, bekommen sie dieselbe Zone, andere Objekte bleiben unberührt.

Die Zone gilt für die freien Strecken der Leitung. Im [Trunk](#trunk-zone) liegt sie in dessen
Zone; wo die Zone wechselt, zählt das senkrechte Stück in der Verlegelänge mit. Läuft eine Leitung
über einen [Kabelschacht](#kabelschacht), hat sie auf jeder Etage ihre eigene Zone. Die obere Zone
und die Decke brauchen die lichte Raumhöhe des Blattes.

## Zone einzelner Teilstücke {#leitung-teilstuecke}

Läuft nur ein Stück einer Leitung anders – etwa unter einer Tür hindurch im Boden, der Rest oben –,
geben Sie diesem Stück eine eigene Zone. Wählen Sie die Leitung aus und klicken Sie in der
[Kontextleiste](#kontextleiste) oder im Rechtsklick-Menü auf **Teilstücke wählen**. Jetzt wählt
jeder Klick ein gerades Stück zwischen zwei Knicken aus, ein zweiter Klick wieder ab – auch Stücke
anderer Leitungen. Für die gewählten Stücke stellen Sie unter **Installationszone ▸** in der
Kontextleiste oder per Rechtsklick die Zone ein; „wie Leitung“ nimmt die eigene Zone wieder weg.
**Fertig** oder Esc beendet die Auswahl.

Stücke mit eigener Zone tragen auf dem Plan ein kleines Kürzel (D für Decke, O, M, U für oben,
Mitte, unten, B für Boden; mit angehängtem „i“ in Decke, Wand oder Boden, etwa Oi), solange die
Leitung ausgewählt ist; gedruckt wird es nicht. Das
Eigenschaften-Panel nennt, wie viele Stücke eine eigene Zone haben, und setzt sie auf Wunsch
zurück. Wo die Zone von Stück zu Stück wechselt, zählt das senkrechte Stück in der Verlegelänge
mit, und der IFC-Export führt die Leitung dort senkrecht.

Die Zone hängt an der Lage des Stücks: Fügen Sie einen Wegpunkt ein, behalten beide Hälften die
Zone, und ziehen Sie das Stück an eine andere Stelle, nimmt es seine Zone mit. Wird die Leitung neu
verlegt – etwa weil Sie ein Gerät verschieben –, liegen neu berechnete Stücke wieder in der Zone
der Leitung; ein Hinweis meldet, wenn dabei eine eigene Zone weggefallen ist. Stellen Sie die Zone
der ganzen Leitung um, gelten die eigenen Zonen der Stücke nicht mehr.

## Nur in Wand, Decke oder Boden {#nur-in-bauteilen}

Normalerweise sucht das Autorouting den günstigsten Weg im Grundriss, und die
[Installationszone](#leitung-zone) bestimmt nur die Höhe – eine Leitung in der oberen Zone liegt
dann auch mitten im Raum 30 cm unter der Decke. In der Wirklichkeit und in der
[3D-Ansicht](#dreid-ansicht) liegt eine Leitung aber nie frei im Raum. Schalten Sie deshalb in den
[Geschossangaben](#geschossangaben) des Blattes **Leitungen nur in Wand, Decke oder Boden** ein.
Liegt eine Leitung – selbst oder über die Vorgabe des Blatts – in einer **Wandzone** (oben, Mitte
oder unten, auf oder in der Wand), gilt das auf Blättern mit Wänden schon von selbst; nur wer es an
der Leitung ausdrücklich auf „aus“ stellt, verlegt sie frei:

- Leitungen laufen direkt **auf der Wand** entlang in ihrer Zone (oben, Mitte oder unten) – und
  zwar im **Raum des Geräts, an dem die Leitung beginnt**. Liegt die Zone **in der Wand** (etwa
  „Untere Zone in der Wand (3 cm)“), zeichnet der Plan die Leitung um die Tiefe in die Wand
  hinein, mit einem kurzen Querstück zum Gerät; Druck, Verlegelänge, IFC-Export und 3D-Ansicht
  rechnen mit derselben Lage. Angeklickt und bearbeitet wird die Leitung weiter auf ihrem Weg vor
  der Wand. Liegt das Zielgerät auf der
  anderen Seite einer Wand, wechselt die Leitung erst kurz vor dem Ziel durch die Wand. Nur wenn
  ein Gerät den Weg auf der Wand versperrt, läuft sie ein Stück in der Wand.
- Muss eine Leitung einen Raum **queren**, weil der Weg an der Wand viel länger wäre, liegt dieses
  Stück in der Zone, die unter **Raumquerung** eingestellt ist – unter der Decke, wenn Sie nichts
  wählen, sonst in der Decke, auf oder im Boden. An
  jedem Übergang geht die Leitung senkrecht hoch bzw. runter; die Verlegelänge, der
  [IFC-Export](#ifc-export) und die 3D-Ansicht rechnen damit.
- An **Türöffnungen** und Wanddurchbrüchen liegt eine Leitung aus der mittleren oder unteren Zone
  in der **oberen Zone**, also im Sturz über der Öffnung – auf der Wand bzw. in der Wand, wie sie
  vorher lag; eine Leitung, die ohnehin oben, in der Decke oder im Boden liegt, bleibt dort. An einem Fenster läuft sie in der Wand weiter. Kurze
  Stücke unter 50 cm, etwa am Ausgang eines Geräts, bleiben in der Wand.
- Hat das Blatt keine [Wände](#waende-zeichnen), quert jede Leitung den Raum, liegt also ganz in der
  Decke bzw. im Boden.

Beim Ein- und beim Ausschalten werden alle automatisch verlegten Leitungen des Blattes **neu
verlegt** – in einem Rückgängig-Schritt. Leitungen mit eigenen Stützpunkten oder ausgeschalteter
automatischer Verlegung behalten ihren Weg; nur ihre Raumquerungen kommen in Decke bzw. Boden.
Findet sich für eine Leitung kein Weg, bleibt sie, wie sie war, und ein Hinweis nennt die Anzahl.

Einzelne Leitungen weichen ab: Im Eigenschaften-Panel, in der [Kontextleiste](#kontextleiste) oder
per Rechtsklick stellen Sie **Nur in Wand, Decke oder Boden** auf „an“ oder „aus“; „wie Blatt“
folgt wieder dem Blatt. Auch das verlegt die betroffenen Leitungen neu. Ist die Leitung
ausgewählt, tragen ihre Raumquerungen auf dem Plan das Kürzel D bzw. B. Eine von Hand gesetzte
[Teilstück-Zone](#leitung-teilstuecke) geht vor. Trunks und Kabelschächte sind nicht betroffen.

## Leitungen nachbearbeiten {#leitung-bearbeiten}

- Verschieben Sie eine angeschlossene Komponente, wird die Leitung automatisch neu verlegt.
  Hakt das Ziehen auf großen Plänen, schalten Sie unter Einstellungen › Routing (A*) **Leitungen
  erst nach dem Loslassen neu verlegen** ein: Während des Ziehens bleibt die Leitung liegen, ein
  gestrichelter Strich zeigt den neuen Anschluss, verlegt wird einmal beim Loslassen. Das gilt
  auch für Schaltverbindungen im Schaltplan.
- An einer ausgewählten Leitung zeigt das Auswahlwerkzeug Griffe an den Knickpunkten
  (Wegpunkten) und auf den geraden Stücken. **Ziehen Sie ein Stück**, verschiebt es sich, und die
  Nachbarstücke werden um Hindernisse herum angepasst; einen **Wegpunkt** ziehen Sie ebenso an
  eine neue Stelle.
- **Wegpunkt einfügen:** Doppelklick auf ein Stück der Leitung oder Rechtsklick dort ›
  **Wegpunkt hinzufügen**. **Wegpunkt entfernen:** den Wegpunkt anklicken und **Entf** drücken
  oder Rechtsklick darauf › **Wegpunkt entfernen**.
- Nach einer solchen Änderung an einer automatisch verlegten Leitung fragt das Programm
  **„Automatische Verlegung ausschalten?“**. Mit **Ausschalten** lassen sich die Stücke künftig
  frei ziehen – ohne rechte Winkel und ohne Ausweichen –, und beim Verschieben einer
  angeschlossenen Komponente wird die Leitung nicht mehr neu verlegt. Lehnen Sie ab, bleibt Ihre
  Änderung trotzdem stehen. Den Schalter **Automatisch verlegen** im Eigenschaften-Panel stellen
  Sie jederzeit wieder um.
- Ein Leitungsende lässt sich nicht auf einen anderen Dockpunkt ziehen. Soll die Leitung an einem
  anderen Dockpunkt enden, löschen Sie sie und zeichnen sie neu.
- Im Rechtsklick-Menü der Leitung finden Sie außerdem **Kabeltyp ▸**, **Installationszone ▸**,
  bei einer Leitung im Trunk die Zuweisung eines [Switch-Ports](#switch-ports)
  (**Port-Stromkreis zuweisen …**, **Port-Stromkreis-Zuweisung lösen**) und
  [Im Verteiler anschließen …](#verteiler-anschliessen), das Fortsetzen und Lösen am
  [Kabelschacht](#kabelschacht) sowie **Gruppe/Wirkverbindung anlegen …** (siehe
  [Wirkverbindungen](#wirkverbindungen), „Gleich beim Verlegen der Leitung“).

## Schaltverbindung im Schaltplan {#schaltverbindung}

In einer Zeichnung der Art **[Schaltplan](#zeichnungsart)** tritt an die Stelle der Leitung
das Werkzeug {{befehl:werkzeug.schaltverbindung}}. Es bedient sich wie die Leitung: Die
Verbindung wird automatisch um die Symbole herum verlegt – im Schaltplan allerdings nur waagrecht
und senkrecht, ohne Schrägen, und dicht an den Symbolen: Sie biegt eine Rasterzelle (5 cm) vor
einem Kontakt ab. Der Sicherheitsabstand aus den Autorouting-Einstellungen gilt nur für Leitungen
im Bauplan. Die Schaltverbindung ist schwarz und trägt keine Leitungsnummer. Die Bauteile dazu
kommen aus dem Katalog [Stromlaufplan-Symbole](#stromlaufplan-symbole).

1. {{befehl:werkzeug.schaltverbindung}} wählen – dieselbe Taste wie im Bauplan für die Leitung.
2. Startpunkt anklicken – auf einem Dockpunkt oder frei im Blatt.
3. Zieldockpunkt anklicken: Die Verbindung wird dorthin automatisch verlegt und schließt ab.
   Möchten Sie den Weg selbst bestimmen, klicken Sie vorher Punkte ins Freie – verlegt wird dann
   nur noch das Stück ab dem letzten Punkt. Mit gedrückter **Strg**-Taste (Tablet: **Gerade** in
   der Kontextleiste) wird auch dieses Stück als gerade Linie gezogen. Ein Doppelklick oder Enter
   beendet die Verbindung frei. Wird die Vorschau rot, gibt es zu diesem Ziel keinen freien Weg.

Eine automatisch verlegte Verbindung wird **neu verlegt, wenn Sie ein angedocktes Bauteil
verschieben oder drehen** – schon beim Ziehen sehen Sie den neuen Verlauf. Haben Sie beim Zeichnen
eigene Punkte gesetzt, mit Strg gerade gezogen oder die Verbindung später mit den Griffen
geändert, behält sie ihre Form; nur das Endstück wird länger oder kürzer und bleibt dabei
waagrecht bzw. senkrecht. Das lässt
sich im Eigenschaften-Panel mit **Automatisch verlegen** jederzeit umschalten; dort geben Sie
der Verbindung auch ihre Bezeichnung.

**Potentialnamen.** Jede Schaltverbindung kann eine Bezeichnung tragen, etwa „L1“ oder „PE“.
Mehrlinig gezeichnete Adern sind vorbelegt: zwei Adern heißen L1 und N, drei L1, L2, L3, vier
zusätzlich N, fünf zusätzlich PE. Eine einzelne Verbindung bleibt unbenannt, eine einlinige
mehrpolige bekommt eine Sammelbezeichnung wie „L1, L2, L3“. Endet eine Verbindung auf einer
benannten Sammelleitung, übernimmt sie deren Namen. Ändern lässt sich die Bezeichnung jederzeit im
Eigenschaften-Panel. Sie steht grau oben rechts neben dem Anfang und dem Ende, ohne die Linie zu
berühren – an Knicken wiederholt sie sich nicht. Ausblenden lässt sie sich für das ganze
Blatt mit {{befehl:blatt.anzeige-potentialname}} oder einzeln im Eigenschaften-Panel. Dort
beschränkt **Bezeichnung nur am Anfang** sie auf den ersten Punkt – so stehen die Schienen im
erzeugten Verteilerplan.

**Blattverweis.** Läuft eine Leitung auf dem nächsten Blatt weiter, schalten Sie im
Eigenschaften-Panel oder per Rechtsklick (auch in der Zeile „Aktionen“ der Kontextleiste)
**Blattverweis an den Enden** ein – für einen ganzen Bus wählen Sie vorher alle Adern aus. Die
Leitung braucht dafür eine Bezeichnung. Gibt es auf einem Blatt davor bzw. danach
eine gleich benannte Leitung mit derselben Einstellung, steht am linken bzw. rechten Ende ein Pfeil
vom Blatt weg mit Blattnummer und Spalte des Gegenstücks, etwa „/1.H ◄ L1 ──── ► /3.A“. Der Name
steht dann vor der Leitung auf ihrer Höhe statt darüber. Die Verweise folgen von selbst, wenn Sie
Blätter umsortieren oder eine Leitung verschieben.

**Unterbrechungsstelle.** Endet eine Leitung frei und geht auf einem anderen Blatt weiter – etwa
eine Steuerleitung zu einem Gerät, das auf einem eigenen Blatt steht –, wählen Sie im Eigenschaften-Panel unter **Unterbrechungsstelle** „Quelle“ (geht weiter) bzw.
„Ziel“ (kommt von) und geben ihr eine Bezeichnung. Am freien Ende stehen dann Pfeil, Name und
Verweis, etwa „▶ L1-F3 /3.B“; eine Quelle nennt alle gleich benannten Ziele auf anderen Blättern,
ein Ziel seine Quelle. An einem senkrechten Ende stehen sie um 90° gedreht. Fehlt das Gegenstück,
sagt das Panel „keine Fortsetzung“.

**Linientyp.** Eine Schaltverbindung kann wie eine Linie durchgezogen, gestrichelt, gepunktet
oder strichpunktiert sein – etwa für Steuerleitungen oder eine mechanische Wirkverbindung. Den
Linientyp stellen Sie für eine oder mehrere ausgewählte Schaltverbindungen im
Eigenschaften-Panel ein. Die Polzahl-Kennzeichnung bleibt dabei durchgezogen. Mit
**Leiterfarbe** setzt mit einem Klick Schwarz, Braun, Grau, Blau oder Grün-Gelb – dieselben Farben,
die der erzeugte Verteilerplan verwendet. Grün-Gelb wechselt abschnittsweise zwischen Grün und Gelb
und stellt die Linie dafür auf durchgezogen. Für eigene Kombinationen wechselt **Zweifarbig** eine
durchgezogene Verbindung abschnittsweise zwischen ihrer Farbe und einer zweiten.

In einem neuen Schaltplan sind die Leitungsnummern und die Bezeichnungszeile der Komponenten
anfangs ausgeblendet; die Betriebsmittelkennzeichen bleiben sichtbar. Einblenden lässt sich beides
wie gewohnt.

Mit den **Zifferntasten 1–5** stellen Sie vor dem Zeichnen die Zahl der Adern ein. Ab 2 zeichnen
Sie damit **mehrlinig**: so viele parallele Adern, wie die Zahl angibt. Die Taste **M** wechselt
auf die **einlinige** Darstellung: Eine mehrpolige Schaltverbindung bündelt die Adern dann in
einer Linie (z. B. drei Phasen) mit dem üblichen Schrägstrich und der Polzahl und bindet
automatisch die passende Anzahl benachbarter Dockpunkte am angeklickten Bauteil mit ein. Eine
neue Ziffer ab 2 schaltet wieder auf mehrlinig, die 1 auf eine einzelne Linie.

Mehrlinig zeichnen Sie so viele parallele Adern, wie Sie eingestellt haben. Sie ziehen nur
die erste Ader – etwa von Kontakt 1 eines Leitungsschutzschalters zu Kontakt 1 der Klemmen
darunter –, die übrigen laufen im Kontaktabstand der Schaltplansymbole sichtbar mit, auch um jeden
Knick herum. Beim Abschluss dockt jede weitere Ader selbst an, wenn ihr Ende auf einem Dockpunkt
liegt; die Punkte, die sie treffen würden, sind schon beim Zeichnen markiert. Adern ohne Treffer
enden frei. Die Taste **Tab** legt die weiteren Adern auf die andere Seite der ersten, **M**
schaltet auf einlinig. Jede Ader ist danach eine eigene Schaltverbindung und lässt sich
einzeln bezeichnen, ändern oder löschen; ein einziges Rückgängig nimmt alle zusammen zurück.
Weil jede Ader für sich neu verlegt wird, laufen die Adern nach dem Verschieben eines Bauteils
unter Umständen nicht mehr parallel – dann zeichnen Sie sie neu.

### Abzweig von einer Sammelleitung {#abzweig}

Eine Schaltverbindung kann auch **auf einer anderen Schaltverbindung** beginnen oder enden:
Klicken Sie beim Zeichnen einfach auf die Linie. Das Ende rastet dort ein, an der Stelle entsteht
ein **Knotenpunkt** mit gefülltem Punkt, und die neue Verbindung übernimmt die Bezeichnung der
Linie, auf der sie endet (etwa „L1“). Die Linie wird am Knoten in zwei **Segmente** geteilt –
aus einer Sammelleitung mit einem Abzweig werden drei Segmente, die am Knoten zusammenhängen. Ein Anschluss eines Bauteils hat beim Klicken Vorrang
vor einer Linie. Der Punkt steht nur dort, wo sich die Linien tatsächlich verzweigen: Endet der
Abzweig genau am Ende der anderen Linie, ist das eine Ecke ohne Punkt.

Sie müssen die Linie nicht genau gegenüber dem Anschluss treffen: Liegt der Klick höchstens
**1 cm auf dem Papier** (bei 1:40 also 40 cm) neben der geraden Flucht vom Anschluss bzw. vom
letzten gesetzten Punkt, rückt der Verbindungspunkt dorthin, und die Verbindung läuft gerade
ohne Knick auf die Linie. Das gilt ebenso, wenn Sie auf einer Linie beginnen und an einem
Anschluss enden.

Zweigt eine **mehrlinige** Verbindung von einer mehrlinigen Sammelleitung ab, endet jede Ader an
*ihrer* Ader der Sammelleitung – es entsteht eine Treppe statt drei Linien, die alle bis zur
obersten Ader durchlaufen. Sie klicken nur mit der ersten Ader auf die Sammelleitung, die
übrigen Adern suchen sich ihre Partnerin selbst:

- Tragen alle Adern der Sammelleitung eine Bezeichnung, gilt deren Reihenfolge (L1, L2, L3, N,
  PE) – ab der angeklickten Ader.
- Sonst gilt die Lage: zuerst die Adern, die die erste Ader auf ihrem Weg schon gekreuzt hat.

Jede Ader übernimmt dabei die Bezeichnung ihrer Partnerin. Die Vorschau zeigt die Treppe schon
beim Zeichnen.

Die Verbindung bleibt bestehen: Verschieben Sie die Sammelleitung samt ihren Knoten, wandern die
Enden der Abzweige mit – ein senkrechter Abzweig bleibt senkrecht und wird länger oder kürzer.
Wird die Sammelleitung gelöscht, enden die Abzweige frei. Ein automatisch verlegter Abzweig trifft
die Sammelleitung immer senkrecht. Pläne aus früheren Fassungen werden beim Öffnen umgewandelt;
zu sehen ist danach dasselbe.

### Segmente und Knotenpunkte bearbeiten {#schaltverbindung-bearbeiten}

Jedes Segment ist eine eigene Schaltverbindung: einzeln auswählen, ändern oder löschen.

- **Knotenpunkt:** Ein Klick auf den Punkt wählt den Knoten – er geht den Linien darunter vor.
  Ziehen Sie ihn, folgen alle Segmente daran: automatisch verlegte werden schon beim Ziehen neu
  verlegt, die übrigen behalten ihre Form und laufen rechtwinklig nach. Löschen Sie einen Knoten,
  enden seine Segmente frei.
- **Griffe:** An einer ausgewählten Schaltverbindung zeigen sich Griffe – an den Enden (Ring), an
  jedem Knick (Quadrat) und in der Mitte jedes Teilstücks (Punkt).
  - *Ende ziehen* verkürzt oder verlängert. Lassen Sie es auf einem Anschluss, einem Potential,
    einem Knoten oder einer anderen Linie los, dockt es dort an (auf einer Linie entsteht ein
    neuer Knoten); im Freien endet es frei. Ein Kreis zeigt beim Ziehen, wo es andocken würde.
  - *Mitte eines Teilstücks ziehen* verschiebt es parallel; die Nachbarstücke werden länger oder
    kürzer. Liegt daneben ein Ende, entsteht ein Absatz.
  - *Knick ziehen* verschiebt den Knick, die Nachbarn passen sich an.
  - Alles bleibt waagrecht und senkrecht. Mit **Strg** beim Ziehen folgt nur der Punkt, auch schräg.
  - **Doppelklick** auf ein Teilstück fügt einen Knick ein, **Entf** am gewählten Knick entfernt ihn.
- **Automatik:** Wer eine automatisch verlegte Verbindung mit den Griffen ändert, schaltet ihr
  automatisches Verlegen ab – die Statuszeile sagt es, im Eigenschaften-Panel lässt es sich wieder
  einschalten.
- **Löschen** eines Segments räumt den Knoten auf: Bleiben dort zwei Segmente, werden sie wieder
  eine Linie; bleibt eines, endet es frei.
- **Bezeichnung:** Ändern Sie die Bezeichnung eines Segments, übernehmen alle über Knoten
  verbundenen Segmente sie – sie sind dasselbe Potential. Das Eigenschaften-Panel nennt, für wie
  viele Segmente sie gilt. Angezeigt wird sie wie bisher nur dort, wo sie eingeschaltet ist.

Einen gefüllten **Knotenpunkt** bekommt jede Stelle, an der sich miteinander verbundene
Schaltverbindungen verzweigen – also wo mindestens drei Äste zusammenlaufen. Das gilt auch, wenn
zwei Verbindungen vom selben Kontakt ausgehen, ein Stück gemeinsam laufen und sich dann trennen:
Der Punkt sitzt an der Trennstelle. Linien, die sich nur zufällig kreuzen oder berühren, ohne
verbunden zu sein, bekommen keinen Punkt. Eine kopierte Schaltverbindung ist dagegen immer lose.

> Senkrechte Verbindungen ohne Knick entstehen, wenn die Symbole mit eingeschaltetem Raster
> untereinander gesetzt werden – ihr [Fangpunkt](#fangpunkt) liegt dann auf demselben
> Rasterpunkt, und alle Kontakte stehen im Lot.

### Bauteile in Verbindungen setzen und herausnehmen {#schaltverbindung-einschleifen}

Im Schaltplan können Sie ein Bauteil direkt auf bestehende Schaltverbindungen setzen, etwa einen
Leitungsschutzschalter in eine durchgezeichnete Phase:

- **Einsetzen:** Laufen beim Platzieren Verbindungen durch die Pole des neuen Bauteils, wird jede
  am oberen Kontakt getrennt und ab dem unteren weitergeführt – das Stück dazwischen entfällt.
  Schon in der Vorschau sind die betroffenen Verbindungen mit ihrem neuen Verlauf blau
  hervorgehoben. Ein Rückgängig-Schritt nimmt Bauteil und Trennung gemeinsam zurück.
- **Phasenrichtig:** Trägt ein Pol eine Anschlussbezeichnung (L1, L2, L3, N, PE …), bekommt er die
  gleichnamige Verbindung unter dem Bauteil – auch wenn sie an anderer Stelle liegt; sie wird dann
  rechtwinklig zu ihrem Pol geführt. Pole ohne Bezeichnung nehmen die Verbindung, die durch sie
  läuft. Eine anders bezeichnete Verbindung kommt nie an einen bezeichneten Pol.
- **Herausnehmen:** Löschen Sie ein Bauteil, an dessen Pol oben und unten je eine Verbindung
  hängt, werden beide wieder eine durchgehende Linie ohne Lücke. Sie behält Bezeichnung und
  Darstellung der Verbindung am oberen Kontakt. Hängt an einem Kontakt keine oder mehr als eine
  Verbindung, enden die Linien dort wie bisher frei.

Das gilt für neu platzierte Bauteile; beim Verschieben eines vorhandenen Bauteils wird nichts
getrennt. Mehrpolig als eine Linie gezeichnete Verbindungen werden nicht eingeschleift.

## Potentiale {#potential}

Ein **Potential** benennt einen elektrischen Knoten (z. B. „L1“, „N“ oder „PE“) und gilt
zeichnungsweit: Zwei Vorkommen mit gleichem Namen – egal auf welchem Blatt – gelten als
verbunden, ohne dass eine Leitung dazwischen gezeichnet wird. So schließen Sie einen Schaltplan
ab, ohne jede Verbindung über mehrere Blätter zu ziehen.

1. {{befehl:werkzeug.potential}} wählen.
2. Auf dem Blatt klicken.
3. Namen eingeben – z. B. „PE“.

„PE“ bekommt automatisch das genormte Schutzerde-Symbol statt der üblichen Klemmenfahne. Eine
zweite, gleichwertige Art, ein Potential zu bilden: Geben Sie einer
[Schaltverbindung](#schaltverbindung) im Eigenschaften-Panel eine Bezeichnung – auch sie zählt
dann als Vorkommen desselben Potentials. Die [Potentialliste](#potentialliste) zeigt alle
Potentiale mit ihren Fundstellen; ein Potential mit nur einem Vorkommen gilt als verwaist und
wird dort markiert.
