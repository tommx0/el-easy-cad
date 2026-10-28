# Hintergrundplan

Fast jede Planung beginnt mit einem vorhandenen Grundriss. Der Hintergrundplan liegt unter der
Zeichnung, wird nie mit verändert und dient als maßhaltige Vorlage.

## Plan einlesen {#plan-einlesen}

{{video:01-hintergrundplan}}

{{befehl:datei.import-hintergrund}} liest PDF, DXF sowie Bilddateien (PNG, JPG) ein.

1. Datei auswählen.
2. Bei einer **PDF** erscheint der Seiten- und Ausschnittdialog: links die Seitenvorschauen,
   rechts die gewählte Seite. Ziehen Sie darin ein Rechteck auf, wenn nur ein Teil des Plans
   gebraucht wird – das spart Speicher und hält die Zeichnung übersichtlich.
3. Bei **DXF** werden die Linien direkt übernommen; Farben und Linienstärken der Vorlage
   bleiben erhalten.

![Seite und Ausschnitt einer PDF wählen](pdf-import.png)

Der Plan gehört zum Blatt, nicht zur ganzen Zeichnung: jedes Geschoss bekommt seinen eigenen.

:::nur-desktop
## IFC-Modell als Grundriss {#ifc-import}

Mit dem Zusatzmodul **BIM** liest {{befehl:datei.import-hintergrund}} auch das IFC-Modell des
Architekten (Dateiendung `.ifc`, bis 80 MB). Statt einer Zeichnung schneidet das Programm jedes
Geschoss waagerecht und legt den Schnitt als Grundriss unter.

1. IFC-Datei auswählen. Nach kurzer Zeit erscheint die Liste der Geschosse mit Höhe und Zahl der
   Bauteile. Hilfsebenen mit wenigen Bauteilen sind nicht vorausgewählt, leere ausgeblendet.
2. Ein Klick auf ein Geschoss zeigt rechts eine Vorschau; das Häkchen davor entscheidet, ob es
   übernommen wird.
3. Unter **Bauteile** stehen die Bauteilgruppen des Modells mit ihrer Anzahl – Wände, Türen,
   Fenster, Tragwerk (Stützen, Träger), Treppen und Geländer, Decken und Dach, Sonstiges. Was
   den Grundriss nur unruhig macht, etwa die Holzträger eines Dachstuhls, wählen Sie ab; die
   Vorschau zeigt es sofort.
4. Die **Schnitthöhe** liegt üblicherweise bei 1,00 m über dem Fußboden – darunter Liegendes
   (Treppenstufen, Möbel) erscheint nicht. **Gebäude gerade ausrichten** dreht einen schräg im
   Modell liegenden Grundriss so, dass die Wände waagerecht verlaufen.
5. **Übernehmen**: Jedes gewählte Geschoss wird ein eigenes Blatt mit dem Namen aus dem Modell,
   hinter den vorhandenen Blättern. Ein einzelnes Geschoss kommt auf das aktuelle Blatt, wenn
   darauf noch nichts gezeichnet ist.

![Geschosse eines IFC-Modells wählen, rechts die Vorschau](ifc-import.png)

Packt ein Modell alles in ein einziges Geschoss, legen Sie unter **Eigene Schnitte** selbst
Schnitte an – je Schnitt ein Name und eine Höhe über Projektnull, je Schnitt ein Blatt.

![Eingelesenes Erdgeschoss mit Türaufschlägen und automatisch eingerichteter Zeichenfläche](ifc-grundriss.png)

Der Grundriss ist sofort maßstäblich: Kalibrieren entfällt und ist auf diesen Blättern gesperrt.
Alle Blätter aus derselben IFC-Datei liegen deckungsgleich übereinander, auch später
hinzugenommene Geschosse. Türaufschläge ergänzt das Programm aus den Angaben im Modell.

Abgewählte Bauteilgruppen sind nur ausgeblendet, nicht verloren: {{befehl:blatt.ifc-bauteilgruppen}}
blendet sie für das aktuelle Blatt wieder ein oder weitere aus, ohne die Datei neu einzulesen.
Ausgeblendetes wird weder gezeichnet noch gedruckt, gefangen oder umgewandelt. Eine neue Fassung
des Modells behält die Auswahl jedes Blattes bei.

**Das Modell kommt erst später:** Ist auf dem aktuellen Blatt schon geplant – etwa auf einem
PDF-Plan –, wählen Sie im Dialog genau dieses eine Geschoss. Danach richten Sie es aus: zwei
markante Punkte im bisherigen Plan anklicken (zum Beispiel zwei Gebäudeecken), dann dieselben zwei
Punkte im orange gezeigten IFC-Grundriss. Das Programm dreht und verschiebt den Grundriss passend
darunter, ohne ihn zu skalieren, und nennt die Abweichung der beiden Abstände – eine große
Abweichung deutet auf eine ungenaue Kalibrierung des alten Plans hin. Ihre Planung bleibt, wo sie
ist; der bisherige Hintergrund wird ersetzt.

**Neue Fassung des Modells:** Schickt der Architekt eine überarbeitete IFC-Datei, liest
{{befehl:blatt.ifc-nachladen}} sie ein. Ein Dialog ordnet die Geschosse der neuen Datei Ihren
IFC-Blättern zu – über die Kennung im Modell, sonst über den Namen; nicht gefundene wählen Sie
von Hand oder lassen sie aus. Jedes Blatt wird mit seiner bisherigen Schnitthöhe und Lage neu
geschnitten, Ihre Planung bleibt unverändert. Ein Rückgängig-Schritt nimmt alles zurück.
Haben Sie ein Geschoss [in Zeichnungselemente umgewandelt](#hintergrund-umwandeln), ersetzt die
neue Fassung auch diese Linien – vorher fragt das Programm nach, denn Änderungen an ihnen gehen
dabei verloren. Kopien solcher Linien und alles, was Sie selbst gezeichnet haben, bleiben.

Ohne das Zusatzmodul lässt sich ein Blatt mit IFC-Grundriss nur ansehen – es wird weder
bearbeitet noch gedruckt. Welche Zusatzmodule Ihre Lizenz enthält, zeigt
{{befehl:hilfe.meine-lizenz}}.
:::

:::nur-desktop
## Bauteile aus IFC übernehmen {#ifc-bauteile}

Der IFC-Grundriss ist zunächst ein Hintergrund aus Linien. {{befehl:blatt.ifc-bauteile}} macht aus
dem Modell echte Wände, Türen, Fenster, Wanddurchbrüche, Treppen und Räume – dieselben Objekte, die
Sie sonst selbst zeichnen, mit denselben Werkzeugen zu bearbeiten (Zusatzmodul BIM).

1. Das Blatt mit dem IFC-Geschoss öffnen und den Befehl wählen. Das Programm liest die beim Import
   gespeicherte IFC-Datei und zeigt die Bauteile farbig auf dem Plan: Wände grün, Türen orange,
   Fenster blau, Durchbrüche grau, Treppen violett, Räume mit Punkt und Namen. Der Dialog lässt
   die Zeichenfläche frei – verschieben und zoomen Sie, um die Vorschau zu prüfen.
2. Im Dialog stehen die Bauteilarten mit ihrer Anzahl. Was Sie nicht brauchen, wählen Sie ab;
   ohne Wände entfallen auch Türen, Fenster und Durchbrüche.
3. Darunter steht, was nicht oder nur vereinfacht übernommen wird – etwa gekrümmte Wände,
   Schiebetüren oder Flächen wie „BGF“, die andere Räume zusammenfassen.
4. **Übernehmen** legt alles auf der aktiven Ebene an. Ein Rückgängig nimmt den ganzen Schritt
   zurück.

Stammen weitere Blätter aus derselben IFC-Datei – etwa alle Geschosse eines Imports –, fragt das
Programm vorab: **Nur dieses Blatt** oder **Alle Blätter**. Bei „alle“ geht der Dialog die
Blätter der Reihe nach durch – siehe [Blatt für Blatt](#blatt-fuer-blatt). Jedes Blatt bekommt
seine Bauteile auf seiner eigenen aktiven Ebene. Ein Blatt, dessen Geschoss im Modell nicht zu
finden ist, wird übersprungen und genannt.

Was dabei entsteht:

- **Wände** mit Achse und Stärke aus dem Modell, an den Ecken auf Gehrung verbunden. Fehlt im
  Modell die Achse, leitet das Programm sie aus dem Schnitt ab; gekrümmte und unregelmäßige Wände
  bleiben Linien im Hintergrund.
- **Türen und Fenster** sitzen in ihrer Wand, mit der Breite und – bei Türen – Anschlag und
  Aufschlagrichtung aus dem Modell. Schiebe-, Pendel- und zweiflügelige Türen werden als
  einflügelige Tür übernommen; prüfen Sie dort den Anschlag.
- **Treppen** kommen als gerade Treppe je Lauf, mit der Stufenzahl aus dem Modell und dem Pfeil
  vom unteren zum oberen Ende. Eine andere Form stellen Sie in den Eigenschaften um.
- **Räume** bekommen Nummer und Namen aus dem Modell; ihre Fläche ergibt sich wie beim
  [Raum-Werkzeug](#raeume) aus den Wänden. Ein Raum, der nicht von Wänden
  umschlossen ist, entsteht nicht – die Meldung nach dem Übernehmen nennt die Anzahl.

Zum Blatt gehört, was in seiner Höhe liegt: Wände und Räume, die die Schnitthöhe trifft, Türen,
Fenster und Durchbrüche um die Schnitthöhe herum, Treppen, die auf diesem Geschoss beginnen. Ein
zweiter Aufruf legt nichts doppelt an – was schon übernommen ist, erkennt das Programm an der
Kennung aus dem Modell. Die Linien des Hintergrunds bleiben darunter liegen; mit
{{befehl:blatt.ifc-bauteilgruppen}} blenden Sie etwa Wände, Türen und Fenster dort aus.

Übernommene Bauteile sind gewöhnliche Zeichnungsobjekte. Eine
[neue Fassung des Modells](#ifc-import) passt sie nicht von selbst an – Ihre Änderungen daran
bleiben. Stattdessen öffnet sich nach dem Nachladen eine Liste: je Blatt die übernommenen Bauteile,
die **im Modell geändert**, **neu im Modell** oder **nicht mehr im Modell** sind. **Zeigen** springt
zum Bauteil und wählt es aus; anpassen, löschen oder mit {{befehl:blatt.ifc-bauteile}} nachholen
entscheiden Sie selbst. Was Sie nur von Hand verändert haben, steht nicht in der Liste – sie
vergleicht das Modell mit dem Stand beim Übernehmen. Neue Bauteile nennt sie nur für Arten, die Sie
auf dem Blatt schon übernommen haben.
:::

## Kalibrieren – den Plan auf Maß bringen {#kalibrieren}

Ohne Kalibrierung weiß das Programm nicht, wie viele Zentimeter ein Bildpunkt ist. Längen,
Maßstab und Leitungslängen bleiben dann leer.

1. {{befehl:werkzeug.kalibrieren}} wählen.
2. Anfangs- und Endpunkt einer Strecke abklicken, deren wahre Länge Sie kennen – ein
   eingetragenes Maß im Plan, eine Türbreite, eine Wandlänge.
3. Das wahre Maß in Zentimetern eingeben und bestätigen.

Der Hinweis „nicht kalibriert“ über der Zeichnung verschwindet, und die Statuszeile nennt die
Größe, die der Plan damit hat – passt sie nicht zum Gebäude, haben Sie sich vermutlich um eine
Zehnerstelle vertippt. Die Zeichenfläche zieht mit, damit der Plan im Druckbereich bleibt.

**Normmaßstab einer PDF:** Eine PDF kennt ihr Papiermaß. Ist der Plan in einem üblichen Maßstab
gezeichnet (1:1 bis 1:1000, auch 1:25 und 1:250), erkennt el.esy.CAD das beim Kalibrieren –
auch wenn Ihr Klick ein, zwei Millimeter danebenliegt. Die Kalibrierung gilt dann genau in
diesem Maßstab, und die Statuszeile meldet etwa „Plan im Maßstab 1:50 erkannt“. Die
Zeichenfläche behält den Maßstab, solange der Planinhalt darin auf das gewählte Papier passt.
Ein umlaufender Blattrahmen und weißer Seitenrand zählen dabei nicht mit; sie können beim Druck
abgeschnitten werden. So druckt eine A3-PDF in 1:50 auch auf A3 wieder in 1:50. Passt der Plan
nicht, etwa eine A1-PDF auf A3, wählt die Zeichenfläche den nächsten passenden Maßstab und sagt,
welchen. Einen „auf Seite eingepasst“ gedruckten Plan mit krummem Maßstab lässt das Programm,
wie Sie ihn abgeklickt haben.

Sie können jederzeit erneut kalibrieren. Dabei wird **nur der Hintergrund** neu skaliert; Ihre
eigenen Objekte behalten Größe und Lage auf dem Blatt und passen danach nicht mehr zum Plan,
wenn sich der Maßstab deutlich ändert. Kalibrieren Sie deshalb, bevor Sie zeichnen. Ein
IFC-Hintergrund ist von Haus aus maßstäblich und lässt sich nicht kalibrieren.

## Sichtbarkeit und Deckkraft {#hintergrund-sichtbarkeit}

- {{befehl:ansicht.hintergrund}} blendet den Plan ganz aus und wieder ein (auch im Aufklappmenü
  **Sichtbarkeit** der Symbolleiste).
- Der Regler für die **Deckkraft** (Eigenschaften, wenn nichts ausgewählt ist) nimmt dem Plan
  Kontrast, damit Ihre eigene Zeichnung deutlicher hervortritt.
- {{befehl:blatt.hintergrund-loeschen}} entfernt den Plan vom Blatt.

## Störendes ausblenden {#hintergrund-ausblenden}

Alte Beschriftungen, Legenden oder Stempel im Plan lassen sich abdecken, ohne die Datei zu
verändern:

1. {{befehl:werkzeug.hintergrund-ausblenden}} wählen.
2. Die erste Ecke des störenden Bereichs anklicken, dann die gegenüberliegende Ecke.

Die Abdeckung wirkt auch beim Drucken und im PDF-Export. Klicken Sie mit dem Werkzeug auf eine
vorhandene Abdeckung, wird sie wieder entfernt. Über {{befehl:blatt.hintergrund-ausblendungen}}
sehen Sie alle Abdeckungen eines Blattes und können einzelne wieder aufheben.

## Plan in Zeichnungselemente umwandeln {#hintergrund-umwandeln}

Auf die Linien eines DXF- oder PDF-Vektorplans können Sie mit dem
[Objektfang](#hintergrundfang) direkt fangen. Wollen Sie den Grundriss darüber hinaus bearbeiten –
Linien löschen, verschieben, ergänzen –, macht {{befehl:blatt.hintergrund-umwandeln}} aus dem Plan
echte Zeichnungselemente: Linien, Polylinien, Kreise und Bögen in derselben grauen Darstellung.
Vorher zeigt ein Dialog neben dem Plan, wie viele Linien es werden; auf dem Plan erscheinen sie
farbig. **Umwandeln** legt sie an.

Haben weitere Blätter einen Plan, der sich umwandeln lässt, fragt das Programm vorab: **Nur dieses
Blatt** oder **Alle Blätter**. Bei „alle“ geht der Dialog die Blätter der Reihe nach durch – siehe
[Blatt für Blatt](#blatt-fuer-blatt). Ein gescannter PDF-Plan ohne Linien wird übersprungen.

- Die Elemente landen auf einer eigenen Ebene **„Grundriss (übernommen)“**, die beim ersten
  Umwandeln angelegt wird. Über sie blenden Sie den Grundriss aus und ein oder sperren ihn.
- Ein **DXF-Plan** wird dabei vom Blatt genommen, sonst läge jede Linie doppelt.
- Ein **PDF-Plan** bleibt am Blatt, wird aber ausgeblendet. Es kommen nur die Linien mit, keine
  Schrift und keine Füllungen – wer sie braucht, blendet den Plan wieder ein. Gescannte Pläne
  enthalten keine Linien und lassen sich nicht umwandeln.
- Was Sie ausgeblendet haben, wird nicht übernommen.
- Der Plan muss kalibriert sein – danach gäbe es keinen Hintergrund mehr, an dem sich
  nachkalibrieren ließe.

:::nur-desktop
Auch ein **IFC-Geschoss** lässt sich umwandeln (Zusatzmodul BIM). Es bleibt für Nachladen und
Export am Blatt, wird aber ausgeblendet; eine neue Fassung des Modells ersetzt die umgewandelten
Linien nach Rückfrage.

Beim IFC-Geschoss kommt jede Bauteilgruppe auf eine eigene Ebene – **„Wände (IFC)“**,
**„Türen (IFC)“**, **„Fenster (IFC)“** und so fort –, nur Linien ohne Bauteilbezug landen auf
„Grundriss (übernommen)“. Jede Linie weiß, aus welchem Bauteil sie stammt: Die Eigenschaften
nennen Bauteilname und Klasse, und **Ganzes Bauteil auswählen** im Rechtsklick-Menü oder in der
Kontextleiste wählt alle Linien dieses Bauteils aus. So entfernen Sie eine im Modell doppelt
stehende Wand mit einem Klick und Entf.
:::

Ein Rückgängig-Schritt nimmt das Umwandeln vollständig zurück.

## Blatt für Blatt {#blatt-fuer-blatt}

Gilt für {{befehl:blatt.ifc-bauteile}} und {{befehl:blatt.hintergrund-umwandeln}}, wenn Sie
„Alle Blätter“ gewählt haben:

- Der Dialog schaltet auf das erste Blatt und zeigt dessen Vorschau („Blatt 1 von 3“).
- **Weiter** nimmt das Blatt mit und geht zum nächsten, **Überspringen** lässt es aus, **Zurück**
  geht ein Blatt zurück. Ein übersprungenes Blatt nehmen Sie mit **Weiter** wieder auf.
- Bei den IFC-Bauteilen hat jedes Blatt seine eigenen Häkchen; ein neues Blatt beginnt mit denen
  des vorigen.
- Auf dem letzten Blatt legt **Übernehmen** bzw. **Umwandeln** alles an – ein Rückgängig nimmt es
  auf allen Blättern zurück. Danach sind Sie wieder auf dem Blatt, auf dem Sie begonnen haben.
- Klicken Sie während des Durchgangs selbst einen Blattreiter an, springt der Dialog zu diesem
  Blatt; ein Blatt, das nicht dazugehört, schließt ihn. Blätter, die Sie so übersprungen haben,
  ohne sie anzusehen, werden nicht übernommen.

## Blätter aus einer neueren Version {#hintergrund-neuere-version}

Öffnen Sie eine Zeichnung, die mit einer neueren Version von el.esy.CAD bearbeitet wurde, kann
ein Blatt einen Hintergrund enthalten, den diese Version noch nicht kennt. Die Zeichnung lädt
trotzdem; über dem betroffenen Blatt steht ein Hinweis, und der Plan selbst bleibt unsichtbar.

Ein solches Blatt lässt sich nur **ansehen**: Sie können die Ansicht verschieben und zoomen, aber
nichts zeichnen, auswählen, umbenennen oder löschen, und es wird weder gedruckt noch als PDF
ausgegeben. Die übrigen Blätter bearbeiten Sie wie gewohnt; Stücklisten, Leitungslisten und
Leitungslängen enthalten auch die Inhalte des gesperrten Blattes. Beim Speichern bleibt der
Hintergrund unverändert erhalten – in der neueren Version ist er wieder sichtbar.
