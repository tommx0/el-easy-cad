# Blätter und Zeichenfläche

Eine Zeichnung besteht aus beliebig vielen **Blättern** – üblicherweise eines je Geschoss. Jedes
Blatt hat seinen eigenen Hintergrundplan, seine eigene Zeichenfläche und seinen eigenen Maßstab;
Katalog, Ebenen, Leitungsnummern und Trunkketten gelten dagegen für die ganze Zeichnung.

## Blätter anlegen und ordnen {#blaetter}

Über der Zeichnung liegt je Blatt ein Register. Ein Klick wechselt das Blatt, ein Doppelklick
benennt es um, Ziehen ändert die Reihenfolge. **+ Blatt** legt ein neues an – dabei öffnet sich
sofort [Zeichenfläche einrichten](#zeichenflaeche-einrichten), denn ohne Zeichenfläche ist ein
Blatt nicht druckbar. Dasselbe geschieht beim ersten Öffnen einer neu angelegten
Bauplan-Zeichnung für ihr erstes Blatt. Wer sie später festlegen will, schließt den Dialog mit
**Abbrechen**. In
einem [Schaltplan](#zeichnungsart) entfällt das: Dort bringt jedes neue Blatt seine feste
Zeichenfläche schon mit.

Passen nicht alle Register in die Breite, erscheinen links und rechts kleine Pfeile, die die
Leiste weiterrollen; auch das Mausrad über den Registern rollt sie. Das gerade geöffnete Blatt
wird dabei immer eingeblendet. Beim Umsortieren rollt die Leiste weiter, solange Sie das
gezogene Register über einem Pfeil halten.

{{befehl:blatt.verwaltung}} öffnet die Blattverwaltung: alle Blätter in einer Liste, zum Wechseln,
Umbenennen, Löschen und Anlegen.

## Etagen einfügen {#etagen}

Die Reihenfolge der Register ist zugleich die Reihenfolge der Etagen: weiter rechts liegt weiter
oben. In einem Bauplan öffnet **+ Blatt** deshalb ein kleines Menü:

- **Leeres Blatt** – wie bisher, ans Ende.
- **Etage darüber einfügen …** bzw. **Etage darunter einfügen …** – eine neue Etage direkt neben
  dem geöffneten Blatt, an der richtigen Stelle der Reihenfolge.

Beim Einfügen einer Etage fragt ein Dialog Name, lichte Raumhöhe und Deckenstärke ab. Alles ist
vom geöffneten Blatt vorbelegt („EG“ wird zu „1. OG“ bzw. „UG“), die Kote rechnet sich daraus:
darüber liegt der Fußboden um Raumhöhe und Decke des geöffneten Blattes höher, darunter um Decke
und Raumhöhe der neuen Etage tiefer. Sie können die Kote auch selbst eintragen. Hat das geöffnete
Blatt noch keine Kote, bekommt es 0,00 m.

Fügen Sie eine Etage zwischen zwei vorhandenen ein – etwa über dem EG, wenn es schon ein 1. OG
gibt –, machen ihr die vorhandenen Platz: Das 1. OG und alle Etagen darüber rücken um die Höhe der
neuen Etage nach oben (darunter entsprechend nach unten). Der Dialog zeigt, um wie viel; wer das
nicht möchte, nimmt das Häkchen heraus. Ist der vorgeschlagene Name schon vergeben, schlägt der
Dialog „1. OG (neu)“ vor – benennen Sie die Etagen dann nach Wunsch um.

Die neue Etage übernimmt vom geöffneten Blatt **Wände mit Türen, Fenstern und Wanddurchbrüchen,
Räume, Treppen und Bodenplatten** – deckungsgleich an derselben Stelle –, dazu Zeichenfläche,
Nullpunkt und Maßstab. Komponenten, Leitungen und der Hintergrundplan kommen nicht mit. Treppen
kommen nur beim Einfügen **darunter** mit: Eine Etage darüber zeigt die
[Treppen von unten](#treppen) ohnehin, weil sie dort ankommen. Was auf
der neuen Etage anders ist, ändern oder löschen Sie danach wie gewohnt. Rückgängig nimmt das
Einfügen in einem Schritt zurück.

{{befehl:blatt.etagen}} (Menü **Blatt**) zeigt alle Etagen von oben nach unten mit Kote, lichter
Raumhöhe und Deckenstärke – der einfachste Weg, die Höhen des ganzen Gebäudes zu prüfen und zu
ändern. Ein leeres Deckenfeld zeigt, was gerade gilt (aus den Koten berechnet oder angenommen).

Jede Etage hat dort zwei Höhenangaben, die Sie beide ändern können:

- **Kote** – die absolute Höhe des Fußbodens bezogen auf ±0,00, üblicherweise das EG: Keller
  negativ, Obergeschosse positiv.
- **Über Etage darunter** – die relative Höhe, also der Abstand zur Kote der Etage darunter
  (beim 1. OG über dem EG z. B. 2,70 m). Die unterste Etage hat keine.

Ändern Sie die relative Höhe, Raumhöhe oder Decke einer Etage, rücken die anderen Etagen um den
Unterschied mit, und zwar so, dass ±0,00 stehen bleibt: Über dem EG rücken die Etagen darüber
nach oben, im Keller rücken die Etagen darunter nach unten. Ohne Haken bei **Andere Etagen
mitführen** ändert sich nur die Kote der bearbeiteten Etage. Übernommen wird erst mit
**Übernehmen**.

## Geschossangaben und Installationszone {#geschossangaben}

Ist auf einem Blatt nichts ausgewählt, zeigt das Eigenschaften-Panel unter **Geschoss** vier
Angaben, die für Leitungslängen und den IFC-Export zählen:

- **Kote Fußboden** – die Höhe des Fußbodens dieser Etage in Metern. Haben zwei Etagen am
  [Kabelschacht](#kabelschacht) eine Kote, gilt ihr Abstand als Geschosshöhe.
- **Lichte Raumhöhe** – vom Fußboden bis zur Unterseite der Decke.
- **Deckenstärke** – wie dick die Rohdecke über dieser Etage ist, in cm. Leer zeigt das Feld den
  Wert, der gerade gilt: aus den Koten berechnet oder angenommen. Einzelne
  [Räume](#raeume) können davon abweichen. Für alle Etagen auf einmal gibt es die
  [Etagenübersicht](#etagen).
- **Installationszone** – wo die Leitungen waagerecht laufen. Jede Zone gibt es **auf** dem
  Bauteil (Aufputz, AP) und **in** ihm (Unterputz, UP), siehe die Tabelle.

| Zone | auf (AP) | in (UP) |
|---|---|---|
| Decke | unter der Decke | in der Mitte der Rohdecke |
| Obere Zone (30 cm unter der Decke) | auf der Wand | 3 cm in der Wand |
| Mittlere Zone (1,00 m) | auf der Wand | 3 cm in der Wand |
| Untere Zone (30 cm über dem Fußboden) | auf der Wand | 3 cm in der Wand |
| Boden | auf dem Fußboden | 5 cm im Fußbodenaufbau |

Die drei Wandzonen folgen DIN 18015-3. Auf und in der Wand liegt eine Leitung gleich hoch; in der
[3D-Ansicht](#dreid-ansicht) hat jede Zone eine eigene Farbe. Weitere Zonen legen Sie unter
[Eigene Installationszonen](#installationszonen) an.

Mit einer Installationszone rechnet el.esy.CAD die **senkrechten Stücke** mit: an jedem
Leitungsende von der Zone bis zur Montagehöhe des Geräts, und am Kabelschacht den Unterschied
der Zonen beider Etagen. Die Montagehöhe ist die Installationshöhe der Komponente, sonst die
übliche Höhe ihres Gerätetyps (Schalter 1,05 m, Dose 0,30 m …), sonst 1,05 m. Ein Gerät mit dem
[Montageort](#installationshoehe) Decke sitzt unter der Decke – dafür braucht es die lichte
Raumhöhe –, eines am Boden auf dem Fußboden. Die obere Zone
und die Decke brauchen zusätzlich die lichte Raumhöhe. Für „in der Decke“ zählt die Stärke der
Decke: die eingetragene Deckenstärke, sonst die Kote des Blattes darüber abzüglich der lichten
Raumhöhe; fehlt auch das, rechnet das Programm mit 20 cm.

Bis Version 0.10.13 lagen die Zonen „Decke“ und „Boden“ in der Rohdecke bzw. 5 cm im
Fußbodenaufbau. Seitdem heißen sie „Unter der Decke (AP)“ und „Auf dem Boden (AP)“; die
senkrechten Stücke älterer Zeichnungen mit diesen Zonen werden dadurch etwas kürzer bzw. länger.
Wer die alte Lage braucht, wählt „In der Decke“ bzw. „Im Boden“. Ohne diese Angaben bleibt alles wie bisher – die
[Leitungslängen](#leitungslaengen) ändern sich erst, wenn Sie die Zone setzen.

Die Zone am Blatt ist die **Vorgabe**. Laufen einzelne Leitungen anders – etwa die
Steckdosenkreise unten, Licht und Schalter oben –, stellen Sie die Zone an der
[Leitung](#leitung-zone) oder am [Trunk](#trunk-zone) um.

Darunter schalten Sie **Leitungen nur in Wand, Decke oder Boden** ein: Leitungen laufen dann an
den Wänden entlang, und wo sie einen Raum queren, liegen sie in der Zone, die Sie unter
**Raumquerung** wählen – unter oder in der Decke, auf oder im Boden. Mehr dazu unter
[Nur in Wand, Decke oder Boden](#nur-in-bauteilen).

Bei einem Blatt aus einem IFC-Modell kommt die Kote aus dem Modell, und die lichte Raumhöhe ist
aus der Decke darüber vorbelegt, soweit das Modell sie enthält – prüfen Sie den Wert. Die Zone
tragen Sie selbst ein. Was Sie am Blatt eingetragen haben, bleibt auch beim Einlesen einer neuen
IFC-Fassung erhalten.

## Eigene Installationszonen {#installationszonen}

Reichen die zehn Standardzonen nicht – etwa für einen Kabelkanal in 2,20 m Höhe oder Leitungen
8 cm tief im Estrich –, legen Sie unter {{befehl:katalog.installationszonen}} eigene an. Jede
Zone hat:

- eine **Bezeichnung**, unter der sie in allen Auswahllisten steht, und ein **Kürzel** (bis drei
  Zeichen) für die Kennzeichen auf dem Plan,
- das **Bauteil** – Decke, Wand oder Boden –,
- die **Verlegung**: auf dem Bauteil (AP) oder darin (UP); bei „in“ die **Tiefe** bis zur Mitte
  der Leitung. In der Decke ohne Tiefe liegt die Leitung in der Mitte der Rohdecke,
- bei der Wand die **Höhe**: über dem Fußboden oder unter der Decke gemessen,
- eine **Farbe** für die [3D-Ansicht](#dreid-ansicht).

Die Standardzonen lassen sich nicht ändern. Mit **Duplizieren** entsteht eine eigene Kopie, die
Sie frei anpassen. Mit **Aktiv** bzw. **Ausgeblendet** nehmen Sie eine Zone aus den
Auswahllisten, ohne dass Zeichnungen, die sie schon nutzen, etwas verlieren. Löschen lässt sich
nur eine eigene Zone, die die offene Zeichnung nicht verwendet.

Die eigenen Zonen gelten für alle Zeichnungen auf diesem Rechner. Jede Zeichnung trägt eine Kopie
der Zonen, die sie benutzt; so rechnet sie auch auf einem anderen Rechner gleich. Öffnen Sie dort
eine Zeichnung mit Zonen, die es noch nicht gibt, übernehmen Sie sie im selben Dialog mit
**In meine Zonen übernehmen**. Ändern Sie eine eigene Zone, rechnen alle Zeichnungen, die sie
nutzen, mit den neuen Werten – auch die Verlegelängen.

## Zeichenfläche einrichten {#zeichenflaeche-einrichten}

Die Zeichenfläche ist der blau gestrichelte Rahmen auf dem Blatt: genau sein Inhalt kommt später
aufs Papier. Links über dem Rahmen stehen Papierformat und Maßstab. Innerhalb des Rahmens bleibt
das Blatt weiß wie Papier, außerhalb ist es grau – der Hintergrundplan erscheint dort gedämpft,
Ihre eigenen Objekte bleiben voll sichtbar. Farbe und Deckkraft dieser Fläche stellen Sie unter
{{befehl:extras.einstellungen}} ein.

![Zeichenfläche einrichten: Format, Ausrichtung, Maßstab](zeichenflaeche.png)

1. {{befehl:blatt.zeichenflaeche-einrichten}} öffnen.
2. **Papierformat** wählen (A4, A3, A2, A1 oder A0).
3. **Hoch- oder Querformat** festlegen.
4. **Maßstab** wählen: aus der Liste (1:20, 1:50, 1:100, 1:200, 1:500) oder frei als 1:… eingetippt.
   Er bestimmt, wie viel Gebäude auf das Blatt passt. **Einmalig einpassen** schlägt einen
   Maßstab vor, bei dem die vorhandene Zeichnung auf das Blatt passt.

{{befehl:werkzeug.zeichenflaeche-verschieben}} legt die Fläche über den richtigen Ausschnitt
des Plans: Werkzeug wählen, Fläche an ihren neuen Platz ziehen.

## Koordinatennetz im Schaltplan {#koordinatennetz}

In einem [Schaltplan](#zeichnungsart) ist die Zeichenfläche jedes Blatts fest: **DIN A4 quer im
Maßstab 1:40**. Sie lässt sich weder einrichten noch verschieben –
{{befehl:blatt.zeichenflaeche-einrichten}} zeigt die Werte nur an.

Über die Fläche legt sich ein Koordinatennetz: acht Spalten **A–H** von links nach rechts und
sechs Zeilen **1–6** von oben nach unten. Die Buchstaben und Ziffern stehen im Rand, am
Bildschirm helfen zusätzlich blasse Feldlinien beim Platzieren; gedruckt wird nur die
Randbeschriftung. Die Statuszeile zeigt unter **Feld** das Feld unter dem Mauszeiger.

Jedes Bauteil hat damit einen **Ort** aus Blattname und Feld, etwa „Blatt 3-F2“. Maßgeblich
ist sein [Fangpunkt](#fangpunkt). Der Ort erscheint im Querverweis neben Spule und Kontaktblock
eines Relais sowie in der [Betriebsmittelliste](#betriebsmittelliste) und der
[Potentialliste](#potentialliste). Er wird nicht gespeichert, sondern stimmt nach dem Verschieben
eines Bauteils oder dem Umbenennen eines Blatts von selbst.

## Der Nullpunkt {#nullpunkt}

Der Nullpunkt ist der Bezugspunkt für Koordinatenanzeige, Raster und Fang. Beim Einrichten der
Zeichenfläche wird er automatisch auf deren Ecke gesetzt.

- {{befehl:werkzeug.nullpunkt}} setzt ihn irgendwohin, etwa auf eine Gebäudeecke. Ein zweiter
  Klick auf einen Punkt entlang einer Gebäudekante gibt ihm eine **Richtung**; das Symbol zeigt
  sie als Pfeil. Länge und Winkel stehen dabei in der Statuszeile, der Winkel lässt sich auch
  eintippen. Wer keine Richtung braucht, drückt nach dem ersten Klick Enter. Objektfang und Fang
  auf den Hintergrund helfen, Ecke und Kante genau zu treffen; das Raster fängt hier nicht.
- Mit dem Auswahlwerkzeug lässt er sich später verschieben; die Richtung bleibt dabei.
- {{befehl:blatt.nullpunkt-alle}} überträgt ihn samt Richtung auf alle Blätter – sinnvoll, damit
  übereinanderliegende Geschosse dieselben Koordinaten haben.
- {{befehl:blatt.nullpunkt-aufheben}} nimmt ihn zurück.

### Blätter übereinanderlegen {#blaetter-ausrichten}

Liegen die Grundrisse der Geschosse nicht genau übereinander – etwa weil ein Plan versetzt
oder schräg eingescannt ist –, richten Sie sie am Nullpunkt aus:

1. Setzen Sie auf jedem Blatt mit {{befehl:werkzeug.nullpunkt}} den Nullpunkt auf **dieselbe
   Gebäudeecke** und mit dem zweiten Klick die Richtung entlang **derselben Kante**, etwa der
   Außenwand nach rechts.
2. {{befehl:blatt.ausrichten}} zeigt alle Blätter. Vorgewählt sind die, die Nullpunkt und
   Richtung haben; die übrigen sind ausgegraut und nennen, was fehlt.
3. **Ausrichten** dreht jedes gewählte Blatt so, dass die Kante waagerecht liegt, und verschiebt
   es, bis der Nullpunkt bei 0,0 sitzt. Danach liegen die Geschosse deckungsgleich übereinander –
   auch in der 3D-Ansicht und im IFC-Export.

Gedreht werden der Hintergrund und alles Gezeichnete; Leitungen werden dabei nicht neu verlegt.
Texte und Beschriftungen wandern mit, bleiben aber waagerecht. Zeichenfläche und Plan-Einlagen
(Plankopf, Stückliste, Leitungsbaum …) werden nur verschoben, nicht gedreht – der Ausdruck bleibt
gerade. Ragt der gedrehte Plan danach über die Zeichenfläche hinaus, nennt der Hinweis die
Blätter; richten Sie die Zeichenfläche dort neu ein. Ein Rückgängig nimmt das Ausrichten aller
Blätter zurück.

## Ebenen {#ebenen}

Ebenen trennen die Zeichnung fachlich. Sie gelten für **alle Blätter** gemeinsam. Eine neue
Zeichnung bringt sechs Standardebenen mit: **Hintergrund**, **Bauelemente** (Wände, Türen,
Fenster, Durchbrüche, Treppen, Bodenplatten), **Räume**, **Komponenten** (alles Übrige, auch
Geometrie, Texte und Plan-Einlagen), **Leitungen** und **Bemaßung**.

{{befehl:blatt.ebenen}} öffnet die Verwaltung. Je Ebene stellen Sie ein:

- **Name** – auch die Standardebenen lassen sich umbenennen,
- **sichtbar** – ausgeblendete Ebenen werden weder gezeichnet noch gedruckt und sind nicht
  anklickbar. Die Ebene „Hintergrund“ schaltet den Hintergrundplan, und zwar je Blatt einzeln,
- **gesperrt** – Objekte einer gesperrten Ebene bleiben auswählbar, lassen sich aber nicht
  verschieben, drehen oder löschen,
- **Löschen** – die Objekte der Ebene wandern auf „Komponenten“ (bzw. eine andere verbliebene
  Ebene). Den Hintergrund und die letzte Ebene für Objekte können Sie nicht löschen.

Unten im Dialog legen Sie mit **+ Neue Ebene** eigene Ebenen an. Auf welcher Ebene neue Objekte
landen, wählen Sie im Eigenschaften-Panel (nichts ausgewählt) unter **Aktive Ebene**; gesperrte
Ebenen stehen dort nicht zur Wahl.

Ausnahmen von der aktiven Ebene: Leitungen, Trunks und Kabelschächte landen immer auf der Ebene
**Leitungen**, Räume immer auf der Ebene **Räume**. Blenden Sie „Leitungen“ aus, verschwinden also
Leitungen und Trunks samt ihrer Nummern und Beschriftungen gemeinsam.

Die Ebene eines vorhandenen Objekts ändern Sie im Eigenschaften-Panel.

## Was auf dem Blatt beschriftet wird {#beschriftungen}

Unter **Ansicht › Anzeigen** schalten Sie einzeln um, was an den Objekten steht – mit Kästchen,
das Menü bleibt dabei offen; **Alle an** und **Alle aus** schalten alles auf einmal.
Alle diese Schalter stehen auch im Aufklappmenü **Sichtbarkeit** der Symbolleiste – im Schaltplan
also auch die automatischen Beschriftungen: Potentialnamen, Kennzeichen und die Abgänge aus dem
Bauplan. Ganz oben stehen dort außerdem {{befehl:ansicht.hintergrund}} und {{befehl:ansicht.raster}}.
Wer seine Gruppe „Sichtbarkeit“ schon angepasst hatte, findet neue Schalter einmalig hinten
angehängt; was er danach wieder herausnimmt, bleibt draußen. Die Schalter lassen
sich auch einzeln in die [Symbolleiste](#symbolleiste-anpassen) legen.

| Schalter | Zeigt am Objekt |
|---|---|
| {{befehl:blatt.anzeige-bezeichnung}} | Den Produktnamen aus dem Katalog |
| {{befehl:blatt.anzeige-beschriftung}} | Ihre eigene Beschriftung der Komponente |
| {{befehl:blatt.anzeige-installationshoehe}} | Die Höhe über Fertigfußboden |
| {{befehl:blatt.anzeige-leitungsnummer}} | Die Nummer der Leitung im Trunk |
| {{befehl:blatt.anzeige-leitungstyp}} | Den Kabeltyp der Leitung |
| {{befehl:blatt.anzeige-leitungsbeschreibung}} | Ihren eigenen Text an der Leitung |
| {{befehl:blatt.anzeige-trunkname}} | Den Namen des Trunks |
| {{befehl:blatt.anzeige-trunkbeschreibung}} | Ihren eigenen Text am Trunk |
| {{befehl:blatt.anzeige-raumname}} | Den Raumnamen |
| {{befehl:blatt.anzeige-raumflaeche}} | Die errechnete Raumfläche |
| {{befehl:blatt.anzeige-potentialname}} | Die Bezeichnung (Potentialname) an Schaltverbindungen |
| {{befehl:blatt.anzeige-kennzeichen}} | Das Kennzeichen: „-F3“ am Schaltplansymbol, „+UV1“ am Verteiler |
| {{befehl:blatt.anzeige-abgaenge}} | Nur im Verteilerplan: Beschriftung und Leitungen aus dem Bauplan an jedem Betriebsmittel |
| {{befehl:blatt.anzeige-stromkreis}} | Nur im Bauplan: den [Stromkreis](#stromkreis-zuordnung) aus dem Verteiler, „UV1-F4 / X6“ |
| {{befehl:blatt.anzeige-stromkreis-schild}} | Nur im Bauplan: den Stromkreis am Leitungsschild, „12 → UV1-X6 (F4)“ |

Ganze Objektarten blenden Sie in derselben Spalte aus: {{befehl:blatt.anzeige-leitungen}}
und {{befehl:blatt.anzeige-trunks}} verbergen alle Leitungen bzw. Trunks des Blatts samt ihren
Nummern. Ausgeblendet sind sie wie auf einer ausgeblendeten Ebene weder zu sehen noch zu drucken
noch anzuklicken – in Leitungsliste, Stückliste und Leitungslängen zählen sie weiter mit. Beide
Schalter liegen auch in der Gruppe „Sichtbarkeit“ der Symbolleiste.

{{befehl:blatt.beschriftung-groesse}} stellt Schriftgröße der Beschriftungen und Symbolgröße der
Komponenten für das ganze Blatt ein – der schnellste Weg, einen überladenen Plan lesbar zu machen.
