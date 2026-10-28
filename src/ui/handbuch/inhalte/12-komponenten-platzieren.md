# Komponenten platzieren

## Eine Komponente setzen {#komponente-platzieren}

{{video:04-bauteile}}

1. {{befehl:werkzeug.komponente}} wählen – die Komponentenauswahl öffnet sich.
2. Katalog und Produkt wählen (das Suchfeld filtert nach Bezeichnung und Artikelnummer). Die
   Kategorienliste zeigt nur, was im gewählten Katalog vorkommt. Hat das Produkt
   [Varianten](#katalog-varianten), wählen Sie darunter die **Variante**. Mit dem Regler
   **Kachelgröße** oben rechts machen Sie die Kacheln kleiner, um mehr Symbole auf einmal zu
   sehen, oder größer, um sie besser zu erkennen; die Größe bleibt gespeichert.
3. Auf die Zeichnung klicken. Die Komponente hängt an ihrem [Fangpunkt](#fangpunkt) am Zeiger
   und lässt sich vor dem Klick mit der Leertaste um 90° drehen.

Solange das Werkzeug aktiv bleibt, setzen Sie weitere Exemplare desselben Produkts – für eine
Reihe Steckdosen also einmal wählen und mehrfach klicken.

![Komponente platzieren mit Dockpunkten und Beschriftung](komponente.png)

> **D gedrückt halten** zeigt die Dockpunkte aller Komponenten auf dem Blatt. So sehen Sie
> sofort, wo eine Leitung andocken kann.

## Fangpunkt: Symbole im Raster ausrichten {#fangpunkt}

Jede Komponente hat einen **Fangpunkt** – das kleine magentafarbene Kreuz im Kreis, das beim Platzieren
am Zeiger und an einer einzeln ausgewählten Komponente erscheint. Dieser Punkt hängt am
Mauszeiger und landet bei eingeschaltetem Raster genau auf einem Rasterpunkt. Auch der
Objektfang wirkt auf ihn.

- Hat die Komponente eigene Anschlüsse (Schaltplansymbole, Switches), ist der Fangpunkt ihr
  **erster Dockpunkt**, also z. B. Kontakt 1 bzw. L1 oder Port 1. Sonst ist es die Mitte.
- **Verschieben:** Beim Ziehen mit der Maus rastet der Fangpunkt der angefassten Komponente ein,
  eine mitausgewählte Gruppe folgt. Ein Bauteil, das bisher neben dem Raster lag, rastet dabei ein.
- **Drehen** mit der Leertaste dreht um den Fangpunkt – ein ausgerichtetes Symbol bleibt
  ausgerichtet.

Im Schaltplan heißt das: Stellen Sie einen 3-poligen Leitungsschutzschalter über einen
Klemmenblock, stehen L1, L2 und L3 genau über den Klemmen 1, 2 und 3, und die
[Schaltverbindungen](#schaltverbindung) laufen ohne Knick senkrecht durch. Die mitgelieferten
Schaltplansymbole haben dafür alle denselben Polabstand.

> Das gilt, solange beide Symbole in derselben Größe gesetzt sind. Wer eine Komponente von Hand
> skaliert oder die Symbolgröße des Blatts zwischendurch ändert, verändert auch ihren
> Polabstand – dann fluchten die weiteren Kontakte nicht mehr.

Wo der Fangpunkt liegt, legen Sie im Katalog fest ([Fangpunkt setzen](#fangpunkt-setzen)).

## An der Wand: Kombinationen je Höhe {#wandfang}

In einem Bauplan fangen Komponenten an Wänden. Kommt die Komponente am Zeiger einer
Wandoberfläche nahe, springt sie an die Wand: mit der Oberseite an die Wand, die Unterseite zum
Raum. Gefangen wird an gezeichneten Wänden – auch an übernommenen und umgewandelten – und an
geraden Linien eines Hintergrundplans, solange der [Fang auf den Hintergrund](#hintergrundfang)
eingeschaltet ist. In Tür- und Fensteröffnungen fängt nichts.

- **Kombination:** Liegt an der Stelle schon eine Komponente in derselben Installationshöhe,
  setzt sich die neue daneben, an das Ende, das dem Zeiger näher liegt. Höchstens **fünf**
  bilden eine Kombination. Die sechste beginnt direkt daneben eine neue Kombination.
- **Andere Höhe:** Jede Höhe bildet an derselben Stelle eine eigene **Reihe** parallel zur Wand.
  Die höchste liegt direkt an der Wand, davor die übrigen absteigend nach ihrer Höhe.
- **Größe:** In einer Kombination erscheinen Symbole kleiner, damit auch fünf nebeneinander
  Platz haben – ab Werk mit 75 % ihrer normalen Größe. Den Wert stellen Sie in den
  [Einstellungen](#einstellungen-abschnitte) unter „Kombinationen an der Wand“ ein. Eine Änderung
  gilt sofort für alle Kombinationen der offenen Zeichnung und für jede weitere, sobald Sie sie
  öffnen; Rückgängig nimmt sie samt Einstellung zurück.
- **Rahmen:** Eine Kombination aus mindestens zwei Komponenten ist grau gepunktet umrandet. Eine einzelne
  Komponente an der Wand bleibt ohne Rahmen.
- **Drehen:** Wählen Sie eine Komponente der Kombination aus. In der Kontextleiste unten stehen
  unter **Aktionen** zwei Knöpfe (bei mehreren ausgewählten auch im Menü der rechten Maustaste):
  - **Kombination drehen 90°** dreht die ganze Kombination als Block. Quer gestellt läuft sie von
    der Wand in den Raum, die erste Komponente an der Wand; Reihen in anderer Höhe rücken dahinter.
    Um 180° gedreht liegt sie gespiegelt an der Wand. Dasselbe macht die Leertaste – beim Setzen
    für die neue Kombination am Zeiger.
  - **Element drehen 90°** dreht nur die ausgewählte Komponente auf ihrem Platz. Ist das Symbol
    nicht quadratisch, rücken die Nachbarn entsprechend.

  Kommt eine Komponente zu einer bestehenden Kombination hinzu, übernimmt sie deren Drehung; ihre
  eigene Drehung als Element behält sie.
- **Beschriftung als Liste:** Die Bezeichnungen aller Komponenten einer Stelle stehen in kleinerer
  Schrift untereinander rechts neben der Stelle – Reihe für Reihe in der Reihenfolge der Plätze.
  Ziehen Sie die Liste mit der Maus weg, wandert sie als Ganzes. Eine einzeln verschobene
  Beschriftung bleibt bei ihrer Komponente.
- **Höhe neben der Reihe:** Die Höhe („h= 30 cm“, „Decke“, „Boden“) steht einmal je Reihe, direkt
  vor deren erster Komponente – an einer waagerechten Wand also links neben der Reihe, auf ihrer
  Höhe. So sehen Sie bei mehreren Reihen sofort, welche Höhe zu welcher gehört.
- **Höhe vor dem Klick:** In der Kontextleiste wählen Sie mit **−** und **+** die
  Installationshöhe für die nächsten Komponenten: **Standard** (die übliche Höhe des Gerätetyps)
  oder eine der Vorgabehöhen aus den Einstellungen. Die Wahl bleibt stehen, bis Sie sie ändern.

**Nachträglich hinzufügen:** Setzen Sie eine Komponente direkt auf eine bestehende Kombination –
auch auf eine Reihe weiter im Raum –, kommt sie dort hinein, neben die Komponente unter dem Zeiger
auf der Seite, auf der der Zeiger steht. Die übrigen rücken. Steht die Höhe in der Kontextleiste auf
**Standard**, übernimmt sie dabei die Höhe der Kombination; haben Sie eine Höhe ausdrücklich
gewählt, bekommt sie an dieser Stelle ihre eigene Reihe. Ist die Kombination schon voll, beginnt
die letzte daneben eine neue.

Beim **Verschieben** gilt dasselbe: Eine aus der Kombination gezogene Komponente fängt an einer
anderen Wand oder Kombination – oder steht frei und wieder in normaler Größe, wenn dort keine Wand
ist. Die übrigen rücken zusammen.

**Reihenfolge ändern:** Ziehen Sie eine Komponente auf eine andere derselben Kombination – die
beiden tauschen ihre Plätze. In eine andere Kombination derselben Reihe gezogen, wird sie dort
eingefügt. Oder wählen Sie sie aus und rücken sie in der Kontextleiste unter **Aktionen** mit
**Platz nach vorn** bzw. **Platz nach hinten** um einen Platz weiter.

**Ganze Kombination verschieben:** Wählen Sie eine ihrer Komponenten aus und klicken Sie in der
Kontextleiste unter **Aktionen** auf **Kombination auswählen**. Ziehen Sie dann eine der markierten
Komponenten: Die Kombination wandert als Block mit Reihenfolge und Drehung und fängt an der Wand,
über der der Zeiger steht – auch an einer anderen Wand. Was an der alten Stelle bleibt, rückt
zusammen. Markieren Sie alle Komponenten einer Stelle (alle Reihen), verschieben Sie die ganze
Stelle. Ändern Sie die Installationshöhe im Eigenschaften-Panel, wechselt die
Komponente in die Reihe ihrer neuen Höhe.

Verschiebt, dreht oder verlängert man die Wand, wandern die Kombinationen mit. Wird die Wand
gelöscht, bleiben die Komponenten frei an ihrem Platz. Eine Stelle an einer Hintergrundlinie
bleibt dagegen liegen, wo sie ist. Kopierte Komponenten kommen frei heraus.

Leitungen kommen an einer Komponente an der Wand von der Wandseite – siehe
[Komponenten an der Wand](#leitung-an-der-wand).

Ein **Modulträger** (System 106) fängt ebenfalls an der Wand, nimmt aber keine weiteren
Komponenten neben sich in seine Kombination auf. Andere setzen sich daneben. Genauso verhalten sich
Komponenten, bei denen im Katalog **Darf Teil einer Kombination sein** abgeschaltet ist
([Produktkatalog](#dockpunkte-grafisch)) – sie bleiben dabei in normaler Größe.

{{befehl:ansicht.wandfang}} schaltet den Wandfang ab und wieder ein (ab Werk an). In der
3D-Ansicht und im IFC-Export sitzen alle Geräte einer Stelle auf der Wandoberfläche. Die Reihen
nebeneinander sind nur die Darstellung im Grundriss. Die Geräte einer Kombination stehen dort
**übereinander** wie in einem senkrechten Mehrfachrahmen: das erste oben auf der Montagehöhe, die
übrigen in ihrer Reihenfolge eng darunter (1 cm Luft). Decken- und Bodengeräte bleiben
nebeneinander.

## Abstände zu Wand und Nachbarn {#abstandsanzeige}

Während eine Komponente am Zeiger hängt – und ebenso, während Sie eine einzelne Komponente mit
der Maus verschieben – zeigt el.esy.CAD nach oben, unten, links und rechts den Abstand zum
nächsten Bauteil an: gestrichelte blaue Linie mit Metermaß.

Gemessen wird bis zur nächsten **Wand**, **Treppe**, zum nächsten **Kabelschacht** oder zur
nächsten **Komponente**, und zwar jeweils an deren zugewandte Außenseite. Türen, Fenster und
Wanddurchbrüche gehören zur Wand – die Linie endet dort an der Wandaußenseite, nicht am
Öffnungssymbol. Frei gezeichnete Linien, Beschriftungen und Bemaßungen zählen nicht als Ziel.

## Montageort, Installationshöhe und Beschriftung {#installationshoehe}

Im Eigenschaften-Panel legen Sie unter **Montageort** fest, wo ein Gerät sitzt:

- **Wand** – auf seiner Installationshöhe (der Normalfall),
- **Decke** – unter der Decke; es folgt der lichten Raumhöhe des Blattes und wandert mit, wenn
  Sie diese ändern,
- **Boden** – auf dem Fußboden, etwa ein Bodentank.

Leuchtenauslässe und Deckenleuchten kommen mit **Decke** aus dem Katalog; der Montageort lässt sich
aber je Komponente nachträglich umstellen, auch für mehrere ausgewählte auf einmal. Wählen Sie beim
Platzieren mit **−**/**+** ausdrücklich eine Höhe, kommt auch ein Deckengerät an die Wand.

Nur an der **Wand** tragen Sie die **Installationshöhe** ein (Höhe über Fertigfußboden). Für die
üblichen Werte – Schalter, Steckdose, Brüstung – gibt es Knöpfe; die Höhe wird an der Beschriftung
im Plan angezeigt, zusammen mit der [Verlegeart](#verlegeart) („h= 105 cm UP“). An Decke und Boden
entfällt die Höhe, dort steht nur „AP“ bzw. „UP“. In einer
[Kombination an der Wand](#wandfang) steht die Höhe einmal je Reihe neben deren erster Komponente; auch Decken- und Bodengeräte
fangen an der Wand, in einer eigenen Reihe mit der Angabe „Decke“ bzw. „Boden“ – die Deckenreihe
direkt an der Wand, die Bodenreihe ganz vorn.

Die Beschriftung selbst (Bezeichnung, Artikelnummer, Höhe) lässt sich mit der Maus an eine
freie Stelle ziehen, wenn sie ein anderes Symbol überdeckt. Welche Angaben überhaupt erscheinen,
schalten Sie unter **Blatt › Beschriftungen anzeigen** um.

In einem **Schaltplan** gibt es keine Installationshöhe – Eingabe und Anzeige entfallen dort.
Bezeichnung und Beschriftung sind auf neuen Schaltplanblättern zunächst ausgeblendet und lassen
sich über dasselbe Menü einschalten.

**Mehrere Komponenten auf einmal ändern:** Sind mehrere Komponenten ausgewählt, zeigt das
Eigenschaften-Panel ihre gemeinsamen Felder – Drehung, Beschriftung, Montageort, Verlegeart,
[Stromkreis](#verteiler-aus-raeumen), Installationshöhe, Darstellung, die Sichtbarkeit von Bezeichnung, Beschriftung und Höhe sowie
Text- und Symbolgröße. Was Sie dort ändern, übernehmen alle ausgewählten Komponenten; ein
**Rückgängig** nimmt die Änderung für alle zurück. Haben die Komponenten verschiedene Werte, steht
im Feld „(verschieden)“, bis Sie einen Wert setzen. Die Installationshöhe erscheint nur, wenn alle
an der Wand sitzen; auf ein Gehäuse aufgesetzte Module drehen weiterhin mit ihrem Gehäuse.
Anschlussbezeichnungen, Gerätetyp und Gerätegruppe stellen Sie je Komponente einzeln ein.

## Auf oder unter Putz (AP/UP) {#verlegeart}

Unter **Verlegeart** im Eigenschaften-Panel legen Sie fest, ob ein Gerät **auf Putz (AP)** sitzt
oder **unter Putz (UP)** – je nach Montageort in der Wand, in der Decke (etwa ein Einbaustrahler)
oder im Boden (etwa ein Bodentank). Jede Komponente kommt als AP auf das Blatt; UP stellen Sie
von Hand um, auch für mehrere ausgewählte auf einmal.

Eine [Kombination an der Wand](#wandfang) sitzt immer ganz auf oder ganz unter Putz: Stellen Sie
eine ihrer Komponenten um, ziehen die übrigen mit. Eine Komponente, die Sie in eine Kombination
setzen, übernimmt deren Verlegeart.

Die Verlegeart wirkt auf

- die **Beschriftung** im Plan: „h= 105 cm UP“; an einer Reihe einmal, und nur wenn die Reihe
  AP und UP mischt, steht sie vor jeder Kombination,
- die [Stückliste](#stueckliste): AP- und UP-Geräte stehen in eigenen Zeilen,
- die [3D-Ansicht](#dreid-ansicht) und den [IFC-Export](#ifc-export): Ein UP-Gerät liegt mit der
  Vorderseite bündig in der Wand, Decke oder dem Boden,
- die **Lage an der Wand** im Plan: Die Reihe an der Wand steht auf Putz 2 cm vor der
  Oberfläche, damit die Leitung zwischen Wand und Gerät auf der Wand laufen kann
  ([Komponenten an der Wand](#leitung-an-der-wand)); unter Putz liegt sie bündig an der Wand.
  Beim Umstellen rückt die Kombination entsprechend, die Enden der Leitungen ziehen gerade nach.

Sonst bleibt das Symbol, wo es ist, und die angeschlossenen Leitungen behalten ihre Zone. Liegt
eine Leitung an ihrem Ende in einer [Installationszone](#leitung-zone) mit anderer Verlegeart
als das Gerät – etwa eine AP-Leitung an einer UP-Dose –, weist das Eigenschaften-Panel der
Komponente bzw. der Leitung darauf hin.

## Texte auf dem Symbol ausfüllen {#texte-ausfuellen}

Trägt eine Komponente [variable Texte](#variable-texte) oder feste Beschriftungen, stehen sie im
Eigenschaften-Panel unter **Texte** – variable Texte mit ihrem Feldnamen. Kontakt- und
Klemmenbezeichnungen der Anschlüsse (z. B. „13“, „A1“, „PE“) ändern Sie darunter unter
**Anschlussbezeichnungen**, etwa um eine Klemme neu zu nummerieren. Ein Zeilenumbruch
(Eingabetaste) im Feld ergibt einen mehrzeiligen Text auf dem Symbol; ein leeres Feld erscheint
im Plan gar nicht.

Wählen Sie mehrere Komponenten aus, die denselben variablen Text tragen, füllen Sie ihn für alle
zugleich aus. Haben sie unterschiedliche Werte, zeigt das Feld „(verschieden)“.

Beim Austauschen einer Komponente bleiben eingetragene Werte gleichnamiger Felder erhalten.

Bestimmt ein Feld die [Slot-Anzahl](#slotanzahl-aus-text), steht darunter ein Hinweis. Die Slots
passen sich an, sobald Sie das Feld verlassen oder die Eingabetaste drücken – Text und Slots
nimmt ein einziges Rückgängig zurück. Fallen dabei Slots weg, denen schon Ziele zugeordnet sind,
fragt das Programm vorher nach; **Abbrechen** übernimmt dann nur den Text. Steht im Feld keine
Zahl, bleiben die Slots unverändert. Ist die Komponente Teil einer
[Gerätegruppe](#geraetegruppen), gehören die Slots der Gruppe, und die Zahl wirkt nicht.

## Schaltplansymbole aus dem Katalog {#stromlaufplan-symbole}

Für [Schaltpläne](#zeichnungsart) bringt el.esy.CAD den Katalog **Stromlaufplan-Symbole** mit:
genormte Schaltzeichen, keine Produkte eines Herstellers. Er ist nach Kategorien gegliedert:

| Kategorie | Inhalt |
|---|---|
| Schutzgeräte | Leitungsschutzschalter 1- bis 4-polig, RCD/FI-Schutzschalter, Schmelzsicherungen, SLS-Schalter, Überspannungs- und Blitzschutzableiter |
| Zähler | Leistungs-/Arbeitszähler 2- und 3-polig |
| Relais & Schütze | Spulen (auch Multifunktionszeitrelais), Kontaktblöcke mit Schließern und Öffnern, Schütz-Hauptkontakte, Triac (Dimmkanal) sowie die beiden [KNX-Aktoren](#knx-aktor) |
| Klemmen | Klemmenblöcke und Abgangsklemmen 1- bis 12-polig, Abgangsklemmen 1P+N+PE und 3P+N+PE |

Alle Symbole haben denselben Polabstand, damit übereinandergesetzte Bauteile fluchten (siehe [Fangpunkt](#fangpunkt)). Jedes bringt seinen
Kennzeichen-Buchstaben mit – F für Schutzgeräte, P für Zähler, K für Relais und Schütze, X für
Klemmen –, Spulen und Kontaktblöcke dazu ihre Rolle für den [Querverweis](#kennzeichen).

## Kennzeichen am Symbol {#kennzeichen}

Komponenten mit Betriebsmittelkennzeichen – Sicherungen, Klemmen, Relais aus den Schaltplansymbolen
– tragen es am Symbol als „-F3“, ein [Verteiler](#verteiler) sein Ortskennzeichen als „+UV1“.
Im Schaltplan steht es links neben dem Symbol, im Bauplan rechts; verschieben lässt es sich wie
jede Beschriftung. Geändert wird es im Eigenschaften-Panel unter **Kennzeichen**. Ist es schon vergeben, fragt das
Programm nach: Symbole mit gleichem Kennzeichen gelten als ein Betriebsmittel. Spule und Kontakte
eines Relais teilen ihr Kennzeichen ohne Rückfrage, Klemmen ihre Leiste (siehe unten).
{{befehl:blatt.anzeige-kennzeichen}} blendet die Kennzeichen eines Blatts aus.

Den Vorschlag beim Platzieren – Buchstabe plus nächste freie Zahl, etwa „F4“ – liefert der
Katalog über den **Betriebsmittelkennzeichen-Buchstaben** der Komponente
([Eine Komponente anlegen](#komponente-anlegen)).

**Querverweis bei Relais und Schützen.** Gibt es zu einem K-Kennzeichen genau eine **Spule** und
mindestens einen **Kontaktblock**, ergänzt das Programm die Beschriftung am Symbol um den Ort
des Gegenstücks: an die Spule die Orte all ihrer Kontaktblöcke, an jeden Kontaktblock den Ort der Spule,
etwa „K1: Blatt 3-F2“. Im Schaltplan ist der Ort Blatt und Feld im
[Koordinatennetz](#koordinatennetz), im Bauplan nur das Blatt. Der Verweis wird nicht
gespeichert, sondern stimmt nach jedem Verschieben, Umbenennen oder Löschen von selbst. Fehlt die
Spule oder gibt es zwei davon, steht kein Verweis; die
[Betriebsmittelliste](#betriebsmittelliste) markiert ein solches Kennzeichen. Ein
[KNX-Aktor](#knx-aktor) nennt seine Kontakte stattdessen je Kanal.

## Klemmenleiste und Klemmennummer {#klemmen}

Bei Klemmen ist das Kennzeichen die **Leiste** (X1, X2 …), dazu kommt die **Klemmennummer**:
X1:1, X1:2, X1:3 und so weiter.

- Eine neue Klemme kommt in die Leiste **X1** – oder in die, die Sie zuletzt von Hand gewählt
  haben – und bekommt die Nummer nach der höchsten, die es in dieser Leiste im ganzen Projekt
  gibt. Nach dem Löschen bleiben Lücken, das ist so gewollt.
- Ein mehrpoliger Klemmenblock belegt eine Nummer **je Pol** (X1:3, X1:4, X1:5). Eine
  Abgangsklemme mit L, N und PE ist ein **Satz mit einer Nummer** (X1:4) – ihre Leiter heißen
  weiter L, N und PE, in der Leitungsliste etwa „X1:4 N“.
- **Kennzeichen** ändern (z. B. auf X2) verschiebt die Klemme in diese Leiste; sie bekommt dort die
  nächsten Nummern.
- **Klemme** im Eigenschaften-Panel ist die erste Nummer; die übrigen Pole folgen lückenlos
  (10 ergibt bei einem dreipoligen Block X1:10–12). Einzelne Pole ändern Sie unter
  „Anschlussbezeichnungen“. Eine Nummer, die in der Leiste schon vergeben ist, wird nicht
  übernommen.
- Stehen Klemmen derselben Leiste direkt nebeneinander, steht „-X1“ nur an der ersten.
- **Rechtsklick auf eine Klemme › Klemmenleiste -X1 neu nummerieren** zählt die ganze Leiste
  lückenlos ab 1 – Blatt für Blatt, von oben nach unten und von links nach rechts. Die
  Verbindungen bleiben, wo sie sind. Die Funktion steht auch in der Kontextleiste unter
  „Aktionen“.

Schon vorhandene Pläne mit einem eigenen X je Klemme bleiben, wie sie sind.

## KNX-Aktor im Schaltplan {#knx-aktor}

Schalt-, Jalousie- und Dimmaktoren für KNX zeichnet el.esy.CAD selbst, passend zur Zahl ihrer
Kanäle: ein Rechteck mit dem Titel („Schalt-/Jalousieaktor 8fach“), unten je Kanal ein Eingang
mit Pfeil ins Gerät und ein Ausgang mit Pfeil hinaus, darüber die Kanalbezeichnung A1, A2 … und
die Funktion samt Beschriftung. Oben sitzen die Busklemmen KNX+ und KNX- und mit Abstand L und
N. Alle Anschlüsse liegen im Raster des Schaltplans.

{{befehl:werkzeug.knx-aktor}} öffnet den Dialog, in dem Sie den Aktor zusammenstellen; die beiden
Aktoren stehen auch im Katalog unter „Stromlaufplan-Symbole“ (KNX › Aktoren).

- **Art:** Schalt-/Jalousieaktor (4, 8, 16 oder 24 Kanäle) oder Dimmaktor (1, 2 oder 4 Kanäle).
- **Funktion je Kanal:** Schalten, Treppenlicht, Zeitschalten, Heizen, Jalousie, Rollladen oder
  frei bzw. Dimmen. **Jalousie** und **Rollladen** gibt es nur auf ungeraden Kanälen: Sie
  belegen den nächsten mit – A1 fährt auf, A2 ab. Gemischt ist erlaubt, etwa Jalousien auf A1/A2
  und A5/A6, die übrigen Kanäle schalten. Im Symbol fasst eine Klammer das Paar zusammen.
- **Beschriftung je Kanal,** etwa „Licht Küche“. Die Texte stehen waagerecht und so klein wie
  nötig; reicht der Platz nicht, stehen sie wie die Zielbezeichnung um 90° gedreht.
- **Kennzeichen:** Vorschlag ist das nächste freie K (-K1, -K2 …).
- **Versorgung L/N anzeigen** blendet L und N oben ein oder aus.

Nach **Einfügen** hängt der Aktor am Mauszeiger wie jede Komponente und fängt mit dem Eingang
von A1 auf dem Raster. Ändern lässt er sich im Eigenschaften-Panel über **Kanäle bearbeiten …**:
Ein größerer Aktor bekommt die neuen Kanäle rechts dazu, angeschlossene Verbindungen bleiben an
ihrem Kanal. Wird er kleiner und hängt an einem wegfallenden Kanal etwas, fragt el.esy.CAD vorher;
diese Verbindungen bleiben als freie Enden stehen. Der 24fach-Aktor ist breiter als ein Blatt und
steht deshalb zweireihig: A1–A12 oben, A13–A24 darunter. Die obere Reihe endet rechts, die
untere beginnt links mit einer geschwungenen Bruchkante, und die untere trägt Kennzeichen und
Titel mit „(Fortsetzung)“ – so sieht man, dass beide ein Gerät sind.

In der Stückliste zählt jeder Aktor nach Art und Größe, etwa „KNX Schaltaktor 8fach“ oder
„KNX Schalt-/Jalousieaktor 8fach“ mit Jalousiepaar – ohne Hersteller und Artikelnummer. Die
früheren fest gezeichneten Aktoren aus dem Katalog bleiben in bestehenden Plänen, wie sie sind.

## Komponenten austauschen {#austauschen}

Eine platzierte Komponente – oder mehrere ausgewählte auf einmal – lässt sich nachträglich gegen
einen anderen Eintrag desselben Katalogs tauschen: Wählen Sie sie mit dem Auswahlwerkzeug aus und
klicken Sie in der Leiste unten unter **Aktionen** auf **Austauschen …** (bei mehreren
Komponenten steht es auch im Menü der rechten Maustaste). Der Katalogdialog zeigt dann nur den
Katalog, aus dem die Komponenten stammen.

Position, Drehung, Beschriftung, Gerätekennzeichen, Typ und Slots samt Wirkverbindungen bleiben
erhalten, ebenso eingetragene Werte gleichnamiger variabler Texte. Angeschlossene Leitungen bleiben
an ihrem Anschluss und werden an dessen neue Lage verlegt. Hat der neue Eintrag einen belegten
Anschluss nicht – etwa weniger Ports, als belegt sind –, bleibt diese Komponente unverändert, und
ein Hinweis nennt den Grund. Stammen die ausgewählten Komponenten aus verschiedenen Katalogen,
lassen sie sich nicht gemeinsam austauschen.

## Bild oder Schaltplansymbol {#bild-oder-symbol}

Jede Komponente kann als Produktbild oder als Schaltplansymbol dargestellt werden. Die
Umschaltung gilt wahlweise für das ganze Blatt oder nur für die ausgewählte Komponente – so
zeichnen Sie einen Installationsplan mit Symbolen und einen Montageplan mit Fotos aus derselben
Zeichnung. Symbole lassen sich zusätzlich einfärben.

**Farben der Symbole:** Solange eine Komponente die **Standardfarbe** hat, erscheint ihr Symbol
genau so, wie es gezeichnet ist – ein roter Brandmelder rot, ein Netzwerksymbol mit grauem Kasten
und grünen Leuchten in diesen Farben, gleich ob das Symbol mitgeliefert, im Symbolzeichner oder im
Katalog-Studio gezeichnet oder als Datei hochgeladen ist. Dasselbe gilt für Texte und
Anschlussbezeichnungen mit eigener Farbe. Wählen Sie im Eigenschaften-Panel eine andere Farbe,
werden Symbol und Texte in dieser Farbe gezeichnet.

Die Symbolgröße für das ganze Blatt stellen Sie über {{befehl:blatt.beschriftung-groesse}} ein,
die eines einzelnen Objekts im Eigenschaften-Panel.

## Modulträger (System 106) und Slots {#modultraeger}

Ein Modulträger – etwa ein Gehäuse des Systems 106 – hat Slots, in die Module einrasten:

1. Modulträger wie jede andere Komponente platzieren.
2. Ein Modul aus dem Katalog auswählen und über den Träger ziehen: die freien Slots werden als
   Magnetpunkte angezeigt.
3. Beim Loslassen rastet das Modul in den Slot ein.

Ist der Träger voll belegt, wird der Rahmen ausgeblendet, damit die Module sauber aneinander
stehen. {{befehl:extras.modulfelder-reparieren}} trägt Slot-Angaben in älteren Zeichnungen nach,
die vor dieser Funktion entstanden sind.

## Gerätegruppen und Slot-Matrix {#geraetegruppen}

Mehrere Komponenten, die logisch eins sind, fassen Sie zu einer **Gerätegruppe** zusammen –
etwa drei Leuchten im Flur, die immer gemeinsam schalten, oder die einzelnen Wippen eines
Schalterverbunds. Die Gruppe hat genau einen Typ, eine Ansteuerung und eine Slot-Liste; die
Mitglieder führen solange keine eigenen. Eine Wirkverbindung auf die Gruppe erreicht alle
Mitglieder, auch auf verschiedenen Blättern.

Die **Slot-Matrix** ist die Darstellung der Slots eines **Bediengeräts**: ein Raster wie die Wippen
eines Tasterrahmens, statt einer Liste. Wie Sie Slots und Ziele bearbeiten, steht unter
[Slot-Matrix und Ansteuerung](#slot-matrix).

Eine Gruppe entsteht im Eigenschaften-Panel („Neue Gruppe aus dieser Komponente“), per Rechtsklick
auf eine Mehrfachauswahl („Gerätegruppe aus Auswahl bilden“) oder von selbst, sobald ein Slot ein
zweites Ziel bekommt (siehe [Wirkverbindungen](#wirkverbindungen)). Jedes Mal fragt ein Dialog
**Name**, **Ansteuerung** und den Haken **KNX** der Gruppe ab – vorbelegt aus den Mitgliedern,
denn in der Gruppe gelten danach nur noch ihre Angaben, nicht mehr die der einzelnen Komponenten.
„Abbrechen“ legt keine Gruppe an.

Im Eigenschaften-Panel einer Komponente wählen Sie unter **Gerätegruppe** eine vorhandene Gruppe
zum Beitreten oder „Eigenständig“. Für ein Mitglied stehen dort zusätzlich **Gruppenname**,
**Gruppe verlassen** und **Gruppe löschen (alle Mitglieder)**; die Ansteuerung gilt dann für die
ganze Gruppe.
