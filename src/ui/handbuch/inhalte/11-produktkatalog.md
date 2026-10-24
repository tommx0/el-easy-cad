# Produktkatalog

Der Katalog liefert die Komponenten, die Sie in den Plan setzen: Bezeichnung, Artikelnummer,
Hersteller, Bild, Schaltplansymbol, Maße, Anschlusspunkte (Dockpunkte) und – bei
Netzwerkgeräten – Ports und PoE-Daten. Mitgeliefert werden mehrere fertige Kataloge; eigene
kommen daneben.

## Kataloge verwalten {#kataloge-verwalten}

{{befehl:katalog.oeffnen}} öffnet die Katalogverwaltung.

![Die Katalogverwaltung: Kataloge links, Komponenten als Karten](katalog.png)

- Links das **Katalogregister**: „Alle Kataloge“ und darunter jeder einzelne mit seiner
  Komponentenzahl. Über **+** legen Sie einen eigenen Katalog an. Eigene Komponenten landen im
  Katalog „Eigene Komponenten“.
- **Mitgelieferte Kataloge sind schreibgeschützt.** Ein Klick auf eine ihrer Karten zeigt die
  Komponente nur an. **Als eigene Komponente bearbeiten…** legt eine Kopie an, die Sie frei
  ändern können; sie merkt sich, aus welcher Komponente sie entstanden ist. Mitgelieferte
  Kataloge lassen sich nur aus- und einschalten („aktiv“), nicht umbenennen oder löschen.
- Rechts die **Komponenten** als Karten mit Symbol, Name und Kategorie. Das Suchfeld filtert
  nach Hersteller, Artikelnummer und Name, die Auswahlliste daneben nach Kategorie. Sie bietet
  nur die Kategorien an, die im links gewählten Katalog vorkommen.
- **Duplizieren** unter einer Karte legt eine Kopie an, die Sie frei ändern können – der
  bequemste Weg zu einer eigenen Variante.
- Ein Katalog lässt sich einzeln ausgeben und weitergeben; **Katalog importieren…**
  ({{befehl:datei.import-katalog}}) liest eine solche Datei wieder ein.

## Mitgelieferte Kataloge aktualisieren {#kataloge-aktualisieren}

Neue Fassungen der mitgelieferten Kataloge kommen mit jedem Programmupdate – oder vorab als
einzelne Katalogdatei (`.eeckat`), ohne das Programm neu zu installieren.

1. {{befehl:datei.import-katalog}} wählen und die Katalogdatei öffnen.
2. el.easy.CAD erkennt einen mitgelieferten Katalog und zeigt vorher, was sich ändert: wie viele
   Komponenten neu, aktualisiert, unverändert oder ausgemustert sind. **Einspielen** übernimmt
   den neuen Stand. Ist der Katalog schon aktuell, passiert nichts.

Dabei gilt:

- Übernommen wird nur, was neuer ist. Eine ältere Datei dreht nichts zurück.
- **Ihre eigenen Komponenten bleiben unverändert** – auch die, die Sie aus einer mitgelieferten
  Komponente abgeleitet haben.
- Eine Komponente, die der Hersteller zurückgezogen hat, wird **ausgemustert**: Sie erscheint
  weder beim Platzieren noch in der Katalogverwaltung, bleibt aber in bestehenden Plänen
  erhalten.
- Zieht der Hersteller einen **ganzen Katalog** zurück, verschwindet er genauso aus dem
  Katalogregister; die Vorschau nennt das vor dem Einspielen. Bereits platzierte Komponenten aus
  diesem Katalog bleiben in den Zeichnungen unverändert.
- **Bereits platzierte Komponenten ziehen nach**, sobald Sie eine Zeichnung öffnen: Bild und
  Symbol sofort, Anschlüsse, Maße und Textlagen beim Öffnen. Angeschlossene Leitungen bleiben an
  ihrem Anschluss – er wird über seine Lage oder Anschlussbezeichnung wiedergefunden – und werden
  neu verlegt. Ihre Klemmen- und Anschlussbezeichnungen und die Werte variabler Texte bleiben.
  Ein Hinweis nennt, wie viele Komponenten angepasst wurden; {{befehl:bearbeiten.rueckgaengig}}
  nimmt das Nachziehen zurück. Findet sich für einen belegten Anschluss kein Gegenstück mehr,
  wird die Leitung dort gelöst und der Hinweis fordert zum Prüfen auf.

## Alle Kataloge auf einmal: die Bibliothek {#bibliothek}

{{befehl:datei.export-bibliothek}} (Menü **Katalog** oder Katalogverwaltung) schreibt alle
Kataloge – eigene wie mitgelieferte – zusammen mit den **Gerätetypen und Regeln** in eine
einzige Datei (`.eecbib`). Das ist die bequeme Sicherung Ihres Katalogbestands und der Weg, ihn
auf einen anderen Rechner zu bringen.

{{befehl:datei.import-bibliothek}} liest eine solche Datei ein. Vorher zeigt ein Dialog jeden
enthaltenen Katalog und schlägt vor, was geschehen soll; Sie können es je Katalog ändern:

- **Mitgelieferte Kataloge** werden aktualisiert, wenn die Datei Neueres enthält – wie oben
  beschrieben. Ist er schon aktuell, steht er auf „Auslassen“.
- **Eigene Kataloge**, die es hier noch nicht gibt, werden importiert. Gibt es einen mit
  derselben Kennung schon, steht er zunächst auf „Auslassen“ – wählen Sie „Vorhandenen
  ersetzen“ oder „Als Kopie anlegen“.
- **Eigene Komponenten** kommen nur als zusätzlicher Katalog hinzu, damit sie nicht mit dem
  hiesigen Auffangkatalog verschmelzen.
- **Gerätetypen & Regeln** – welche Gerätetypen es gibt, welche Slots sie haben, welche Ziele
  üblich sind und welche Ansteuerungen es gibt – werden übernommen, wenn die Datei eine neuere
  Fassung enthält. Diese Regeln pflegt der Hersteller; selbst ändern lassen sie sich in
  el.easy.CAD nicht.

## Eine Komponente anlegen {#komponente-anlegen}

**+ Neue Komponente** rechts oben ({{befehl:katalog.komponente-neu}}) legt eine neue Komponente an –
im links gewählten eigenen Katalog, sonst in „Eigene Komponenten“. Das Formular ist lang; nur **Name** und ein Bild oder Symbol sind
Pflicht, alles andere tragen Sie ein, soweit es gebraucht wird.

1. **Name**, **Hersteller** und **Artikelnummer** eintragen.
2. **Stromverbrauch max.** und – nur für Geräte, die über PoE gespeist werden –
   **PoE-Leistungsaufnahme** in Watt. Die PoE-Angabe ergibt die [PoE-Summe](#poe) am Switch.
3. **Bemessungswerte** eintragen, soweit bekannt: Nennstrom (A), Nennspannung (V), Polzahl und
   IP-Schutzart wie auf dem Typenschild, z. B. „16“, „230“, „3“ und „IP44“. Sie werden für den
   IFC-Export gebraucht; leere Felder bleiben einfach weg. Eine Variante übernimmt die Werte der
   Hauptkomponente – tragen Sie bei ihr nur ein, was abweicht, etwa „IP44“ für die
   Feuchtraum-Ausführung.
4. **Kategorie** wählen oder neu eintippen – nach ihr filtert die Komponentenauswahl.
5. **Typ** ist der Gerätetyp: eine der 14 Rollen von Bediengerät bis Server (Übersicht unter
   [Wirkverbindungen](#wirkverbindungen)). Er legt fest, welche Slots, üblichen Ziele und
   Ansteuerungen die Komponente hat; „Kein Typ“ ist erlaubt. Er ist nur die Vorauswahl für neu
   platzierte Komponenten und bleibt im Eigenschaften-Panel änderbar.
   - Bei Typen mit Ansteuerung (Aktor, Verbraucher) lässt sich die **Ansteuerung** vorbelegen,
     z. B. „Dimmen“ für einen Dimmaktor.
   - Unter **Stromkreis** steht, wie die Komponente bei der
     [Bestückung aus Räumen](#verteiler-aus-raeumen) zählt: nach Gerätetyp, kein,
     Raumstromkreis oder eigener Stromkreis mit **Polzahl** (1~ oder 3~, etwa für einen Herd).
     Die Vorgabe wirkt auch an schon platzierten Komponenten, solange dort nichts Eigenes
     eingestellt ist.
   - Bei Typen mit Slots (und ohne Typ) stehen darunter die **Slot-Vorlagen** – die Slots, mit denen jede neu
     platzierte Komponente startet – und beim Bediengerät die **Slot-Matrix** (1 oder 2 Spalten,
     Zahl der Zeilen, einzelne Reihen abweichend breit), siehe
     [Gerätegruppen und Slot-Matrix](#geraetegruppen).
6. **IFC-Klasse** und **IFC-Typ** bestimmen, als was die Komponente in einem IFC-Modell
   (BIM) erscheint. Ab Werk gilt die Vorgabe des Gerätetyps – eine Anschlussdose etwa als
   Steckdose, ein Bediengerät als Schalter. Weicht eine Komponente davon ab, wählen Sie hier
   die passende Klasse aus der Liste, z. B. „Leuchte“ für einen Leuchtenauslass oder bei einer
   Anschlussdose den Typ DATAOUTLET für eine Datendose. Passt keiner der Typen, wählen Sie
   „eigener Typ“ und geben einen Namen ein, etwa „Wetterstation“. Ohne Gerätetyp und ohne
   eigene Angabe bleibt die Komponente im IFC-Modell ohne Zuordnung. Zubehör wie Einbaudosen
   oder Befestigungssets bekommt die Klasse „Zubehör – Teil des Geräts“: Es wird im IFC-Modell
   dem Gerät zugeschlagen, auf dem es liegt. Die Angabe gilt für alle platzierten Komponenten
   dieses Eintrags und reist beim Katalogexport mit.
7. **Bauart** ist unabhängig vom Typ und bestimmt das Verhalten im Plan: **Standard** (eine
   Komponente mit Ports gilt dann als Switch), **Patchpanel** oder **Verteiler** – ein Verteiler
   bekommt beim Platzieren ein Ortskennzeichen (+UV1) und eine [Bestückung](#verteiler).
8. **Betriebsmittelkennzeichen (Buchstabe)** – etwa F für Leitungsschutzschalter, RCD und
   Sicherungen, K für Relais- und Schützspulen und ihre Kontaktblöcke, X für Klemmen, P für
   Zähler. Beim Platzieren schlägt das Programm Buchstabe plus nächste freie Zahl vor („F1“);
   leer heißt kein Vorschlag. Beim Buchstaben K erscheint zusätzlich die **Rolle**: **Spule** oder
   **Kontaktblock**. Sie ist die Grundlage für den [Querverweis](#kennzeichen) am Symbol und die
   Prüfung in der [Betriebsmittelliste](#betriebsmittelliste) (genau eine Spule je Kennzeichen).
9. **Hauptgruppe** (Produktfamilie, z. B. „Türkommunikation“) und **Untergruppe** (Rolle im
   Anlagenaufbau, z. B. „Türstation“) ordnen die Komponente im Katalog.
10. **Produktbild** und/oder **Schaltplansymbol** als Bilddatei hochladen – mindestens eines von
    beiden. Ein Symbol können Sie auch [selbst zeichnen](#symbol-zeichnen).
11. Unter **Symbol und Anschlüsse** stellen Sie Größe, Montageort und Anschlüsse ein, siehe
    [Dockpunkte und Beschriftung grafisch setzen](#dockpunkte-grafisch).
12. **Technische Daten** als freie Zeilen „Schlüssel: Wert“ und – bei Bedarf – **Varianten**,
    siehe [Varianten](#katalog-varianten).

Modulträger wie die Gehäuse des Systems 106 legen Sie im Katalog-Studio an; im Katalogdialog von
el.easy.CAD gibt es dafür kein Feld.

## Dockpunkte und Beschriftung grafisch setzen {#dockpunkte-grafisch}

Im Abschnitt **Symbol und Anschlüsse** des Katalogdialogs arbeiten Sie direkt am Symbol bzw.
Produktbild – es muss also zuerst eines hochgeladen oder gezeichnet sein.

1. **Dockpunkte:** Ohne eigene Festlegung hat jede Komponente 8 Standardpunkte (vier Ecken, vier
   Kantenmitten). **+ Frei platzieren (Maus)** übernimmt sie als Ausgangspunkt: Ein Klick auf
   eine freie Stelle des Bildes setzt einen Dockpunkt, ein Klick auf einen Punkt entfernt ihn.
   Unter dem Bild stehen alle Punkte mit ihrer Lage; **nur Trunk** reserviert einen Punkt für
   Trunks. Für Switches und Patchpanels wählen Sie stattdessen **+ Portgruppen** – je Gruppe
   Porttyp, Anzahl und Reihen, dazu optional Trunk-Sonderpunkte auf der Oberkante. **×** führt
   zurück zu den 8 Standardpunkten.
2. Jeder frei gesetzte Dockpunkt kann im Feld daneben eine **Bezeichnung** tragen (z. B. „13“,
   „A1“, „L1“, „PE“).
   Sie steht im Plan rechts oberhalb neben dem Anschluss, erscheint in der Leitungsliste als
   „X1:3“ (Kennzeichen:Bezeichnung) und wird beim Andocken einer Leitung oder Schaltverbindung
   am Anschluss eingeblendet. Die Auswahl neben der Bezeichnung gibt ihr eine eigene
   **Schriftfarbe**; „wie die Komponente“ lässt sie in der Komponentenfarbe.
3. **Texte** auf dem Symbol – etwa Beschriftungen oder [variable Texte](#variable-texte) –
   legen Sie mit einem Klick in die Text-Vorschau an und ziehen sie an ihre Stelle. Auch sie
   können eine eigene **Schriftfarbe** haben. Eigene Farben gelten im Plan, solange die
   Komponente die Standardfarbe hat.
4. Der **Breitenfaktor** streckt breite Geräte wie Switches, ohne das Bild zu verzerren. Der
   **Höhenfaktor** macht ein Symbol entsprechend höher, etwa für einen langen Klemmenblock.
   Katalogtexte und Anschlussbezeichnungen bleiben dabei gleich groß; bei Modulträgern wirkt er
   nicht.
5. **Darf Teil einer Kombination sein** (ab Werk an) legt fest, ob sich die Komponente an der Wand
   mit anderen zu einer [Kombination](#wandfang) zusammenfasst. Ohne Haken fängt sie allein an der
   Wand, in normaler Größe, und nimmt keine andere neben sich auf – etwa für einen
   Unterverteiler. Dasselbe Feld gibt es im Katalog-Studio (Inspektor, Abschnitt Modul).
6. **Montageort** (Decke, Wand oder Boden, ab Werk Wand) ist die Vorgabe beim Platzieren – im
   Plan lässt er sich je Komponente umstellen ([Montageort](#installationshoehe)). Auch dieses
   Feld steht im Katalog-Studio.

## Variable Texte {#variable-texte}

Ein variabler Text ist ein Platz auf dem Symbol, dessen Inhalt Sie erst im Plan je Komponente
eintragen – zum Beispiel Nennstrom und Charakteristik eines Leitungsschutzschalters („B16“) oder
der Querschnitt einer Klemme.

1. In der Text-Vorschau des Katalogdialogs auf die gewünschte Stelle klicken. Der neue Text ist
   gleich ausgewählt; Ziehen verschiebt ihn.
2. Unter **Art** „Variabler Text“ wählen und einen **Feldnamen** vergeben, etwa „Nennstrom“.
   Unter diesem Namen erscheint das Feld später im Eigenschaften-Panel.
3. Optional einen **Vorgabewert** eintragen – bleibt er leer, zeigt die Vorschau den Feldnamen in
   eckigen Klammern; auf dem Plan steht dann nichts, bis Sie einen Wert eintragen.
4. **Schriftgröße** (in Prozent der Symbolhöhe) und **Ausrichtung** einstellen. Der Text wächst
   mit dem Symbol mit. Unter **Drehung** lässt er sich in 90°-Schritten drehen: Bei „0°“ bleibt
   er immer waagerecht, auch wenn die Komponente gedreht wird. Ein gedrehter Text dreht mit der
   Komponente mit, steht aber nie auf dem Kopf – er liest sich immer von unten oder von rechts.
   Das gilt für feste und variable Texte gleichermaßen.
   Soll ein variabler Text dagegen starr am Symbol sitzen wie ein ins Symbol gezeichneter Text,
   haken Sie **Am Symbol fixieren** an: Er dreht sich dann mit der Komponente in jede Lage mit,
   bei 180° auch auf den Kopf. Die Drehung gibt in diesem Fall den Winkel relativ zum Symbol an.
5. **In der Stückliste aufführen** anhaken, wenn der Wert das Material unterscheidet – dann
   erscheint er in der [Stückliste](#stueckliste) in der Spalte „Angaben“.

Bereits platzierte Komponenten behalten ihre Texte – neue variable Texte erscheinen bei eigenen
Komponenten an denen, die danach gesetzt werden; mitgelieferte ziehen beim Öffnen der Zeichnung
nach (siehe [Kataloge aktualisieren](#kataloge-aktualisieren)).

## Varianten {#katalog-varianten}

Gibt es ein Produkt in mehreren Farben oder Ausführungen, legen Sie dafür keine eigenen
Komponenten an, sondern Varianten:

1. Die Komponente im Katalogdialog öffnen und unten unter **Varianten** auf
   **+ Variante hinzufügen** klicken.
2. Je Variante **Farbe/Ausführung** eintragen, etwa „reinweiß glänzend“, dazu bei Bedarf eine
   eigene **Artikelnummer**, **Bezeichnung**, ein eigenes **Bild** oder **Symbol** und abweichende
   **Bemessungswerte**. Leere Felder erbt die Variante von der Komponente.
3. Speichern.

Beim Platzieren erscheint unter der Komponentenauswahl das Feld **Variante**; vorgewählt ist die
Variante mit der niedrigsten Artikelnummer. Hat eine Komponente Varianten, wird immer eine davon
gesetzt. In der [Stückliste](#stueckliste) steht jede Variante als eigene Zeile mit ihrer
Artikelnummer. Nachträglich wechseln Sie die Variante über [Austauschen](#austauschen).

## Slot-Anzahl aus einem variablen Text {#slotanzahl-aus-text}

Ein variabler Text kann zugleich die Zahl der Slots bestimmen – etwa „Anzahl Wippen“ an einem
Tastsensor. Eingestellt wird das im Katalog-Studio im Register **Slots** unter **Slot-Anzahl
abhängig von**. Maßgeblich ist die erste Zahl im Text: „3“, „3fach“ und „Wippen: 3“ ergeben
jeweils 3. Bei Gerätetypen mit Slot-Liste ist das die Zahl der Slots (höchstens 32), bei Typen
mit Slot-Raster die Zahl der Reihen (höchstens 8). Neue Slots tragen erst die Namen der
Slot-Vorlagen, danach wird weitergezählt („Taste 3“, „Taste 4“ …).

## Fangpunkt setzen {#fangpunkt-setzen}

Unter den Dockpunkten zeigt eine eigene Vorschau den [Fangpunkt](#fangpunkt) – den Punkt, der
beim Platzieren am Mauszeiger hängt und auf dem Raster einrastet. Ohne eigene Festlegung ist es
der erste Dockpunkt (gestrichelt angezeigt), bei den 8 Standardpunkten die Mitte.

1. In die Fangpunkt-Vorschau klicken. Nahe einem Dockpunkt oder der Mitte rastet der Punkt dort
   ein; die Felder x und y darunter erlauben genaue Werte (0 bis 1).
2. **×** neben der Überschrift nimmt die Festlegung zurück, dann gilt wieder der erste Dockpunkt.

Bereits platzierte eigene Komponenten behalten ihren Fangpunkt – eine Änderung wirkt auf alle,
die danach gesetzt werden.

## Ein Symbol selbst zeichnen {#symbol-zeichnen}

Fehlt ein Schaltplansymbol, zeichnen Sie es im Katalogdialog selbst: Linien, Kreise, Bögen und
Text auf einem Raster, dazu ein Radierer. Das Ergebnis wird als SVG bei der Komponente
gespeichert und verhält sich wie ein gekauftes Symbol – es lässt sich im Plan einfärben und
in der Größe ändern.

- **Bogen:** Werkzeug „Bogen“ wählen, dann nacheinander Mittelpunkt, Anfang (legt den Radius
  fest) und Ende klicken. Der Bogen läuft im Uhrzeigersinn vom Anfang zum Ende.
- **Radierer:** Mit gedrückter Maustaste über die Zeichnung ziehen. Die Spur gehört zu den
  Elementen, die sie trifft – verschieben Sie ein Element, wandert das Loch mit; später
  gezeichnete Elemente bleiben unberührt. Die Pinselgröße wählen Sie in der Leiste.
- **Farbe:** Strich und Text zeichnen Sie in einer von acht Farben (Schwarz, Weiß, Grau, Rot,
  Orange, Gelb, Grün, Blau), geschlossene Formen füllen Sie ebenso in einer dieser Farben. Die
  gewählte Farbe gilt für neue Elemente und für die Auswahl. Im Plan erscheint jedes Symbol in
  seinen eigenen Farben, solange die Komponente die Standardfarbe hat. Wählen Sie an der
  Komponente eine andere Farbe, wird das Symbol wie jedes andere in dieser Farbe eingefärbt.

## Viele Komponenten auf einmal: Excel-Import {#excel-import}

Für größere eigene Kataloge gibt es den Massenimport aus einer Excel-Mappe: Katalog links wählen,
dann **Aus Excel importieren…**. Mitgelieferte Kataloge lassen sich so nicht befüllen. Eine Zeile
je Komponente,
mit Spalten für Bezeichnung, Hersteller, Artikelnummer, Maße, Bemessungswerte (Nennstrom,
Nennspannung, Polzahl, IP-Schutzart), Bilddatei, Symboldatei und Varianten. Die **Musterdateien** mit allen Spalten und Beispielzeilen holen Sie im Importdialog über
**Musterdateien herunterladen** – füllen Sie diese aus, statt die Spalten selbst anzulegen.

Bilder und Symbole geben Sie als Dateinamen an und wählen beim Import den zugehörigen Ordner
mit aus.

Für die englische Oberfläche und englische Pläne gibt es optionale Spalten **Name (en)**,
**Kategorie (en)**, **Hauptgruppe (en)** und **Untergruppe (en)**, im Blatt „Varianten“ dazu
**Ausführung (en)** für die Farbe/Ausführung. Leere Zellen ändern nichts; ohne englischen Text
erscheint der deutsche. Ältere Tabellen ohne diese Spalten lassen sich weiter einlesen.

## Kabeltypen {#kabeltypen}

{{befehl:katalog.kabeltypen}} verwaltet die Kabeltypen (NYM-J 3×1,5, Cat.7, …). Sie gelten über
alle Zeichnungen hinweg, nicht nur im geöffneten Projekt; eine Umbenennung wirkt auf jede
Zeichnung, die den Typ verwendet.

- Links filtern Sie nach **Gruppe**, oben sucht ein Suchfeld.
- Die **mitgelieferten Typen** (Kennzeichen „Standard“) lassen sich nicht bearbeiten oder
  löschen, nur über **Aktiv**/**Inaktiv** aus der Auswahl nehmen. **Duplizieren** legt eine frei
  änderbare Kopie an.
- **Neuer Kabeltyp…** bzw. **Bearbeiten** bei eigenen Typen fragt **Bezeichnung** (so steht sie
  im Plan), **Gruppe**, eine **Bemerkung** (nur im Dialog sichtbar, hilft beim Suchen) und
  optional den **Außendurchmesser** in mm ab.
- Bringt eine geöffnete Zeichnung Kabeltypen mit, die hier fehlen, übernimmt
  **In meine Kabeltypen übernehmen** sie in Ihren Bestand.

Welcher Typ an einer Leitung hängt, stellen Sie beim Zeichnen, im Eigenschaften-Panel oder per
Rechtsklick ein – siehe [Kabeltyp und Zone vorab wählen](#kabeltyp-waehlen).
