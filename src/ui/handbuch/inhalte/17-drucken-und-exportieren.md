# Drucken und exportieren

Gedruckt wird immer genau die [Zeichenfläche](#zeichenflaeche-einrichten) des aktuellen Blattes –
der weiße Bereich. Was außerhalb liegt, ist Arbeitsfläche und erscheint weder auf dem Papier
noch in der PDF.

Im [Schaltplan](#zeichnungsart) steht im Papierrand zusätzlich die Beschriftung des
[Koordinatennetzes](#koordinatennetz) – die Spalten A–H und die Zeilen 1–6. Die blassen
Feldlinien vom Bildschirm werden nicht gedruckt.

## Drucken {#drucken}

{{video:11-drucken}}

1. {{befehl:datei.drucken}} öffnen.
2. Die Blätter ankreuzen, die gedruckt werden sollen – hinter jedem steht sein Format und
   Maßstab, etwa „A4 Hochformat · 1:50“.
3. Unter **Papier** sind Papierformat und Ausrichtung mit „Wie Zeichenfläche“ vorbelegt. Für
   diesen einen Ausdruck können Sie ein anderes Format (A4 bis A0) oder Hoch- bzw. Querformat
   wählen, etwa um ein A3-Blatt auf einem A4-Drucker auszugeben. Die ganze Seite wird dann auf
   das Papier eingepasst; passt die Ausrichtung nicht, wird sie um 90° gedreht und liest sich
   von rechts. Hinter dem Blatt steht, was geschieht, etwa „→ auf A4 Hochformat, 71 %,
   gedreht“. Der Maßstab stimmt auf dem Papier dann nicht mehr; die Einrichtung des Blattes
   bleibt unverändert.
4. **Drucken** öffnet den Druckdialog Ihres Systems mit dem passenden Papier. Wählen Sie dort
   **Originalgröße** und nicht „an Seite anpassen“, sonst stimmt der Maßstab auf dem Papier
   nicht.

Ein Druckauftrag läuft auf einem Papier. Kreuzen Sie mehrere Blätter mit verschiedenen Formaten
an und wählen kein Papier, gilt das Format des ersten Blattes – die übrigen werden darauf
eingepasst.

![Der Druckdialog mit der Blattauswahl](druck.png)

## Als PDF ausgeben {#pdf-export}

{{befehl:datei.export-plan}} schreibt die angekreuzten Blätter als eine PDF-Datei, jedes Blatt
eine Seite. Die PDF ist maßhaltig: 1:50 bleibt 1:50, solange der Empfänger ohne Skalierung
druckt. Ein sichtbarer Hintergrundplan wird mit ausgegeben. Die Papierwahl wirkt wie beim
Drucken; mit „Wie Zeichenfläche“ behält jede Seite ihr eigenes Format.

Unten auf jedem Ausdruck steht ein kurzer rechtlicher Hinweis zur Verwendung des Plans. Beim
Schaltplan fehlt darin der Satz zum Maßstab, weil ein Schaltplan keine Maße zum Abgreifen hat.

## Listen nach Excel {#excel-export}

{{befehl:datei.export-excel}} gibt die ausgewerteten Listen als Excel-Mappe aus – je ein
Arbeitsblatt für Stückliste, Leitungsliste, Switch- und Patchpanelbelegung, Trunkliste,
Raumliste und Steuerungslogik, je Verteiler das [Stromkreisverzeichnis](#stromkreisverzeichnis)
(„Stromkreise +UV1“) und, wo KNX-Aktoren eingeordnet sind, die
[Aktorkanalliste](#aktorkanalliste) („Aktorkanäle +UV1“), dazu ein Blatt „Rechtliches“. Das ist der Weg in die
Angebotskalkulation, ohne irgendetwas abzutippen.

:::nur-desktop
## Als IFC-Modell exportieren {#ifc-export}

Mit dem Zusatzmodul **BIM** gibt {{befehl:datei.export-ifc}} die Elektroplanung samt Gebäude als
IFC-Modell (IFC4) aus – zum Einlesen in BIM-Programme wie Revit, Archicad oder einen IFC-Viewer. Jedes Blatt
wird ein Geschoss; stammt das Blatt aus einem IFC-Modell, liegt die Planung im BIM-Programm genau
über dem Modell des Architekten.

- **Geräte** erscheinen als Quader in ihrer [IFC-Klasse](#komponente-anlegen) auf der
  Montagehöhe, mit Hersteller, Artikelnummer und [Bemessungswerten](#komponente-anlegen) am
  Typ. Rahmen und Gehäuse werden eine Baugruppe aus ihren Modulen; Zubehör wie Einbaudosen
  gehört zu dem Gerät, auf dem es liegt. Geräte [unter Putz](#verlegeart) liegen in der Wand,
  der Decke oder dem Boden, die Eigenschaft „Verlegeart“ nennt AP bzw. UP.
- **Leitungen** laufen in ihrer [Installationszone](#leitung-zone) – im Trunk in dessen Zone,
  sonst in der eigenen oder der des Blattes –, an den Geräten
  senkrecht zur Montagehöhe und im Kabelschacht von Etage zu Etage. Jede Leitung nennt ihre
  Installationszone und Verlegeart (Aufputz/Unterputz).
- **Stromkreise:** Liegt eine Leitung im Verteiler auf einer Sicherung (auch über eine Klemme
  dahinter), bilden alle Geräte an dieser Sicherung – durchgeschleifte eingeschlossen – einen
  Stromkreis („+UV1-F3“). Sonst wird jede Leitungsnummer ein Stromkreis aus der Leitung und den
  angeschlossenen Geräten.
- **Trunks** werden je Kette eine Gruppe; ist die [Ausführung](#trunk-ausfuehrung) ein Kanal,
  eine Trasse oder ein Leerrohr, kommt der Kabelträger mit seiner Abmessung dazu.
- **Kabelschächte** erscheinen als senkrechte Schächte über die Geschosshöhe.
- **Bauteile** kommen mit, in denselben Maßen wie in der [3D-Ansicht](#dreid-ansicht):
  [Wände](#waende-zeichnen) bis zur Oberkante der Decke mit echten Öffnungen, in denen Türen und
  Fenster sitzen (ein Wanddurchbruch bleibt offen), [Treppen](#treppen) aus ihren Stufen,
  [Bodenplatten](#bodenplatten) und [Räume](#raeume) mit Name, Fläche und Höhe (die Raumart steht als Objekttyp und als
  Kategorie in den Raumeigenschaften). Jedes Gerät wird
  zusätzlich dem Raum zugeordnet, in dem es steht. Bauteile, die Sie aus einem IFC-Modell
  übernommen haben, behalten dessen Kennung – ein BIM-Programm erkennt sie wieder.

Fehlen Angaben – etwa die Kote eines Blattes, die Raumhöhe oder die Abmessung eines Kanals –,
rechnet der Export mit üblichen Werten und nennt sie danach in einer Liste. Ein Schaltplan lässt
sich nicht als IFC exportieren.

## 3D-Ansicht {#dreid-ansicht}

Ebenfalls mit dem Zusatzmodul **BIM** zeigt {{befehl:ansicht.dreid}} (Menü **Ansicht**, ab
Werk auch in der [Symbolleiste](#symbolleiste-anpassen)) die Planung räumlich – zur Kontrolle, ob
Montagehöhen, Installationszonen und Steigstrecken stimmen. Zu sehen ist dasselbe wie im
[IFC-Export](#ifc-export): Geräte auf ihrer Montagehöhe, Leitungen mit allen senkrechten
Stücken, Kanäle, Trassen und Rohre als Körper, Bündel als breite Linie, Kabelschächte
halbtransparent. Die Geschosse liegen nach ihrer Kote übereinander. Jedes Gerät erscheint mit
dem Symbol bzw. Bild, das es auch im Plan zeigt, eingefärbt wie dort und ohne Hintergrund; es
dreht sich immer zum Betrachter und bleibt auch aus der Entfernung lesbar. Ohne gepflegte Grafik
steht an seiner Stelle ein Quader. Damit Leitungen nicht frei durch die Räume laufen, schalten Sie
am Blatt [Nur in Wand, Decke oder Boden](#nur-in-bauteilen) ein.

Zur Orientierung steht das Gebäude dahinter, soweit Sie es gezeichnet haben:
[Wände](#waende-zeichnen) bis zur Oberkante der Decke, also [lichte Raumhöhe](#geschossangaben)
(ohne Angabe 2,75 m) plus Deckenstärke der Etage. Jede Wand ist ein durchgehender Körper, aus dem
Türen, Fenster und Wanddurchbrüche ausgespart sind – ohne Fuge über oder unter der Öffnung. Ein
Klick in die Öffnung oder auf das Wandstück darüber bzw. darunter zeigt die Tür oder das Fenster.
Türen und Wanddurchbrüche sind 2,01 m hoch, Fenster sitzen auf 0,90 m Brüstung und sind 1,26 m hoch.
Treppen steigen in gleichen Stufen bis zur Kote des Geschosses darüber; jede Stufe ist eine
5 cm starke Trittplatte, unter der Treppe bleibt der Raum frei. Jeder Raum bekommt eine
dünne Bodenplatte, eine Decke über der lichten Raumhöhe in der Deckenstärke des Raums bzw. der
Etage und ein Schild mit seinem Namen; ohne
Räume liegt eine Platte unter allen Wänden, und es gibt keine Decke. Haben Sie auf dem Blatt
[Bodenplatten](#bodenplatten) gezeichnet, stehen nur diese in ihrer Lage und Stärke. Über jeder
Treppe sind Decke und Bodenplatte der Etage darüber ausgespart.

Wie groß die Gerätesymbole erscheinen, stellen Sie links unter **Symbole** mit dem Regler
**Symbolgröße** ein: 100 % ist die Größe aus dem Plan, darunter bis 10 % entsprechend kleiner;
Vorgabe 50 %. Der Regler wirkt aus der Nähe wie aus der Entfernung gleich.

Wie durchsichtig das Gebäude ist, stellen Sie links unter **Gebäude** mit drei Reglern ein, je von
0 % (ausgeblendet) bis 100 % (undurchsichtig):

- **Vordere Wände** – Außenwände, deren Außenseite zur Kamera zeigt. Welche das sind, ändert sich
  beim Drehen von selbst: Man schaut wie in ein Puppenhaus immer von außen hinein. Vorgabe 15 %.
- **Innen- und hintere Wände** – alle übrigen Wände samt Bodenplatten und Treppen. Vorgabe 100 %.
- **Decken** – Vorgabe 0 %, damit der Blick von oben frei bleibt.

Bei 100 % verdeckt ein Bauteil, was dahinter liegt, auch Leitungen in der Wand und Geräte. Wer
die ganze Installation sehen will, stellt die Regler herunter. Ein Klick trifft zuerst Geräte und
Leitungen, auch wenn eine durchsichtige Wand davor steht; eine undurchsichtige fängt den Klick ab.
Diese Einstellungen und die Symbolgröße merkt sich das Programm für alle Zeichnungen.

Auf Blättern aus einem [IFC-Modell](#ifc-import) lädt die Ansicht das Gebäude aus der
gespeicherten IFC-Datei nach – alle Bauteile des Geschosses, genau unter der Planung. Wände und
Decken aus dem Modell folgen denselben Reglern wie die gezeichneten; Türen, Fenster, Treppen und
übrige Bauteile bleiben halbtransparent, damit sie den Blick nicht verbauen. Solange das läuft, steht links „Gebäude aus dem IFC-Modell wird geladen …“; die Planung
ist schon vorher zu sehen. Aus dem Modell übernommene Wände, Türen und Räume zeichnet die Ansicht
dann nicht noch einmal, von Hand ergänzte schon. Blätter mit einem freien Schnitt haben kein
Geschoss und bekommen kein Gebäude aus dem Modell.

- Oben wählen Sie, wie Sie sich bewegen: **Umkreisen** oder **Begehen** (siehe unten).
- Beim **Umkreisen** dreht **Ziehen** die Ansicht um ihre Mitte, **Rechtsklick-Ziehen** oder
  **Umschalt-Ziehen** verschiebt sie, das **Mausrad** zoomt. **Einpassen** zeigt wieder alles und
  beendet ein Begehen.
- Links blenden Sie **Geschosse** ein und aus.
- Unter **Farben** wählen Sie, ob alles wie im Plan gefärbt wird, **nach Installationszone** (jede
  Zone eine Farbe, senkrechte Stücke grau) oder **nach Gerätetyp**; die Legende erklärt die
  Farben.
- Ein **Klick** auf ein Gerät, eine Leitung oder einen Trunk zeigt links Name, Geschoss und Höhe
  bzw. Kabeltyp und Verlegelänge.

![3D-Ansicht: Gebäude aus dem IFC-Modell mit durchsichtigen vorderen und undurchsichtigen inneren Wänden, darin Geräte und eine Leitung im Erdgeschoss](dreid-ansicht.png)

**Begehen:** So gehen Sie durch das Gebäude wie mit einer Kamera auf Augenhöhe. Beim Umschalten
stehen Sie 1,60 m über dem Fußboden des Geschosses, in dem die Mitte der bisherigen Ansicht lag,
und schauen in dieselbe Richtung. Sie bewegen sich frei – auch durch Wände und Decken hindurch:

- **W / S** oder **Pfeil hoch / runter**: vor und zurück; **A / D** oder **Pfeil links / rechts**:
  seitlich; **E / Q** oder **Bild hoch / Bild runter**: hoch und runter. Vor, zurück und seitlich
  bleiben waagerecht, auch wenn Sie gerade nach oben oder unten schauen.
- Mit gehaltener **Umschalttaste** geht es viermal so schnell.
- **Ziehen** mit der Maus oder dem Finger dreht den Blick – nach rechts gezogen schauen Sie nach
  rechts, nach oben gezogen nach oben. Das **Mausrad** trägt Sie ein Stück vor oder zurück.
- Ohne Tastatur, etwa auf dem Tablet, bewegen Sie sich mit den Knöpfen auf der Fläche: das
  **Steuerkreuz** links unten für vor, zurück und seitlich, rechts unten **hoch** und **runter**.
  Gedrückt halten heißt weitergehen.
- **Umkreisen** führt zurück; die Ansicht dreht sich dann um einen Punkt 5 m vor Ihnen.

Die Ansicht zeigt den Stand beim Öffnen; den Blickwinkel und ob Sie gerade umkreisen oder begehen,
merkt sich das Programm für das nächste Mal. Ohne gemerkten Blickwinkel passt sie sich nach dem Laden des IFC-Gebäudes neu ein. Bei einem Schaltplan ist der Befehl nicht verfügbar.
:::

## Die ganze Zeichnung weitergeben {#zeichnung-weitergeben}

Soll der Empfänger weiterarbeiten statt nur zu lesen, geben Sie die Zeichnung selbst weiter:
{{befehl:datei.export-zeichnung}} – siehe [Austausch mit anderen Rechnern](#austausch).
