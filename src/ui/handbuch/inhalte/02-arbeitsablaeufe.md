# Arbeitsabläufe

Die übrigen Kapitel beschreiben jede Funktion für sich. Dieses Kapitel zeigt, wie sie in der
Praxis zusammenspielen: elf typische Aufgaben, jede von Anfang bis Ende an einem durchgehenden
Beispiel. Wo es um eine Einzelheit geht, führt ein Verweis in das zuständige Kapitel.

Das Beispiel ist eine kleine Wohnung mit Flur, Bad, Küche, Wohnen/Essen und Schlafen, 11 × 8 m,
als Grundriss im Maßstab 1:50. Geplant wird nur die Elektroinstallation: Schalter, Steckdosen,
Leuchten, ein Unterverteiler und für die Gebäudesteuerung ein KNX-Tastsensor.

| Ablauf | Wofür |
|---|---|
| [Plan einlesen, Komponenten setzen und benennen](#ablauf-bauplan-einfach) | Schnell eine Installationsplanung auf einen vorhandenen Plan legen |
| [Schaltplan von Hand zeichnen](#ablauf-schaltplan) | Einen Stromlaufplan selbst zeichnen |
| [Plan nachzeichnen und bestücken](#ablauf-nachzeichnen) | Aus einem Plan (auch einem Scan) echte Wände, Türen, Fenster und Räume machen |
| [Vektor-PDF: fangen und umwandeln](#ablauf-vektor-pdf) | Einen CAD-Plan als PDF genau übernehmen |
| [Verteiler mit einem eigenen Schaltplan verbinden](#ablauf-verteiler-schaltplan) | Einen selbst gezeichneten Verteilerplan an den Verteiler im Bauplan hängen |
| [Verteiler und Verteilerplan aus den Räumen](#ablauf-aus-raeumen) | Verteiler und Plan automatisch aus der Planung erzeugen – ohne eine Leitung |
| [Verteilerplan aus dem Baum des Verteilers](#ablauf-baum) | Den Verteiler selbst zusammenstellen und den Plan daraus erzeugen |
| [Leitungen und Trunks verlegen, Plan erzeugen](#ablauf-leitungen) | Leitungen von Hand führen, auf Klemmen legen und daraus den Plan erzeugen |
| [Befehlsgeräte und Verbraucher verbinden](#ablauf-wirkverbindungen) | Festlegen, welcher Schalter oder KNX-Taster welche Leuchte schaltet |
| [Etagen ausrichten und in 3D ansehen](#ablauf-etagen-3d) | Mehrere Geschosse deckungsgleich übereinanderlegen |
| [Erzeugten Verteilerplan nacharbeiten](#ablauf-nacharbeiten) | Einen erzeugten Plan von Hand ergänzen und aktuell halten |

## Plan einlesen, Komponenten setzen und benennen {#ablauf-bauplan-einfach}

Der kürzeste Weg zu einer Installationsplanung: Der Grundriss bleibt, wie er ist, und die
Komponenten kommen direkt darauf. Wände, Räume und Leitungen sind dafür nicht nötig.

**1. Projekt und Zeichnung anlegen.** In der Projektübersicht ({{befehl:datei.projekte}}) einen
Kunden und ein Projekt anlegen, darin **Neue Zeichnung …** mit der Art **Bauplan** – siehe
[Bauplan oder Schaltplan](#zeichnungsart).

**2. Plan einlesen.** {{befehl:datei.import-hintergrund}} und die Datei wählen. Bei einer PDF
wählen Sie Seite und, wenn nötig, einen Ausschnitt ([Plan einlesen](#plan-einlesen)). Danach
öffnet sich **Zeichenfläche einrichten**: Stellen Sie das Format und den Maßstab ein, in dem Sie
später drucken wollen – für die Beispielwohnung A3 quer im Maßstab 1:50.

**3. Auf Maß bringen.** Mit {{befehl:werkzeug.kalibrieren}} die beiden Enden einer bekannten
Strecke anklicken – hier die Maßkette „11,00“ unter dem Grundriss – und die wahre Länge in
Zentimetern eintragen (1100). Der Hinweis „Nicht kalibriert“ verschwindet, und die Statuszeile
meldet „Plan im Maßstab 1:50 erkannt“ – die Zeichenfläche bleibt bei A3 quer 1:50
([Normmaßstab](#kalibrieren)).

![Kalibrieren: die gemessene Strecke bekommt ihre wahre Länge](ablauf-bauplan-kalibrieren.png)

**4. Komponenten setzen.** {{befehl:werkzeug.komponente}} öffnet die Komponentenauswahl. Im
Katalog **Elektroinstallation** stehen Schalter, Steckdosen, Leuchten und Verteiler; das
Suchfeld findet „Steckdose“ oder „Wechsel“ sofort. Produkt wählen, **Platzieren**, in den Plan
klicken – das Werkzeug bleibt aktiv, jeder weitere Klick setzt ein weiteres Exemplar. Die
Leertaste dreht vor dem Klick um 90°. In der Kontextleiste unten wählen Sie mit **−**/**+** die
Installationshöhe der nächsten Komponenten (siehe [Kombinationen je Höhe](#wandfang)).

Bei einem Vektorplan (PDF aus einem CAD-Programm, DXF) springen die Komponenten an die Linien
der Wände, wie an gezeichnete Wände. Auf einem gescannten Plan setzen Sie sie frei an die
Wandkante.

**5. Benennen.** Komponente mit dem Auswahlwerkzeug anklicken und im Eigenschaften-Panel unter
**Beschriftung** einen Text eintragen, etwa „Spüle“ oder „Herd“. Sind mehrere Komponenten
ausgewählt (Strg + Klick, am Mac Cmd + Klick, oder Rahmen aufziehen), zeigt das Panel ihre gemeinsamen Felder – so
setzen Sie Höhe, Montageort oder AP/UP für alle auf einmal ([Mehrere Komponenten auf einmal
ändern](#installationshoehe)). Trägt ein Symbol eigene Textfelder, füllen Sie sie unter
**Texte** aus ([Texte auf dem Symbol](#texte-ausfuellen)).

![Die Beschriftung im Eigenschaften-Panel](ablauf-bauplan-beschriftung.png)

**6. Was am Symbol steht.** Unter **Blatt › Beschriftungen anzeigen** schalten Sie einzeln um,
ob Produktname ({{befehl:blatt.anzeige-bezeichnung}}), Ihre Beschriftung und die
Installationshöhe ({{befehl:blatt.anzeige-installationshoehe}}) im Plan stehen. Im Bild unten
sind Produktname und Höhe ausgeblendet – übrig bleiben die Symbole mit Ihren Beschriftungen
und am Verteiler sein Kennzeichen „+UV1“. Eine Beschriftung, die ein Nachbarsymbol verdeckt,
ziehen Sie mit der Maus an eine freie Stelle.

![Flur und Küche: Komponenten auf dem eingelesenen Plan, beschriftet](ablauf-bauplan-komponenten.png)

**7. Auswerten und drucken.** {{befehl:werkzeug.stueckliste}} setzt die Stückliste auf das Blatt
([Stückliste](#stueckliste)); {{befehl:datei.drucken}} bzw. {{befehl:datei.export-plan}} geben
die Zeichenfläche aus ([Drucken](#drucken)).

## Schaltplan von Hand zeichnen {#ablauf-schaltplan}

Ein Stromlaufplan entsteht in einer eigenen Zeichnung der Art **Schaltplan**. Das Beispiel zeigt
einen kleinen Unterverteiler: ein vierpoliger Fehlerstromschutzschalter, drei Stromkreise mit je
einer Abgangsklemme.

![Ein von Hand gezeichneter Verteilerplan](ablauf-schaltplan-blatt.png)

**1. Zeichnung anlegen.** In der Projektübersicht **Neue Zeichnung …** mit der Art
**Schaltplan**. Jedes Blatt ist dann DIN A4 quer im Maßstab 1:40 mit dem
[Koordinatennetz](#koordinatennetz) A–H/1–6 und einem festen Raster von 24 cm. Die Seitenleiste
bietet statt Wänden und Leitungen die Werkzeuge für Schaltverbindungen und Potentiale.

**2. Symbole setzen.** {{befehl:werkzeug.komponente}} und den Katalog **Stromlaufplan-Symbole**
wählen ([Überblick](#stromlaufplan-symbole)). Jedes Symbol hängt an seinem ersten Kontakt und
rastet auf das Raster ([Fangpunkt](#fangpunkt)): Setzen Sie Symbole untereinander, stehen ihre
Kontakte genau im Lot, und die Verbindungen laufen ohne Knick. Die Kennzeichen vergibt das
Programm selbst – -F1, -F2 … für Schutzgeräte, X1:1, X1:2 … für Klemmen
([Kennzeichen](#kennzeichen), [Klemmenleiste](#klemmen)).

**3. Einspeisung.** Mit {{befehl:werkzeug.potential}} setzen Sie die Potentiale L1, L2, L3, N
und PE an den Rand. Gleichnamige Potentiale gelten in der ganzen Zeichnung als verbunden
([Potentiale](#potential)).

**4. Verbinden.** {{befehl:werkzeug.schaltverbindung}}: auf einen Kontakt klicken, dann auf den
nächsten – die Verbindung verlegt sich waagrecht und senkrecht um die Symbole herum. Für mehrere
Leiter auf einmal stellen Sie vorher mit den Zifferntasten **2–5** die Zahl der Adern ein; die
weiteren Adern laufen im Kontaktabstand mit und docken selbst an
([Schaltverbindung](#schaltverbindung)). Eine Sammelleitung bekommt im Eigenschaften-Panel ihre
**Bezeichnung** (L1, N, PE).

**5. Abzweigen.** Klicken Sie beim Zeichnen auf eine bestehende Verbindung, entsteht dort ein
Knotenpunkt, und die neue Verbindung übernimmt deren Bezeichnung – so hängen die
Leitungsschutzschalter an L1, L2 und L3 und die Klemmen an N und PE
([Abzweig](#schaltverbindung)).

![Ausschnitt: RCD, Sammelleitungen mit Knotenpunkten, Leitungsschutzschalter und Abgangsklemmen](ablauf-schaltplan-detail.png)

**6. Prüfen.** Die [Betriebsmittelliste](#betriebsmittelliste) ({{befehl:werkzeug.betriebsmittelliste}})
listet alle Kennzeichen mit Ort und warnt vor doppelten; die [Potentialliste](#potentialliste)
({{befehl:werkzeug.potentialliste}}) zeigt Potentiale mit nur einem Vorkommen. Geht der Plan auf
einem weiteren Blatt weiter, verbinden **Blattverweis** und **Unterbrechungsstelle** die Enden
über die Blätter hinweg.

Soll dieser Plan zu einem Verteiler im Bauplan gehören, geht es weiter mit
[Verteiler mit einem eigenen Schaltplan verbinden](#ablauf-verteiler-schaltplan).

## Plan nachzeichnen und bestücken {#ablauf-nachzeichnen}

Wer Wände, Türen, Fenster und Räume als echte Bauteile zeichnet, bekommt mehr als ein Bild:
Räume mit Fläche und Namen, Komponenten, die an der Wand einrasten, Leitungen, die an der Wand
entlang laufen, die Bestückung des Verteilers aus den Räumen, die 3D-Ansicht und den IFC-Export.
Das geht mit jedem Plan, auch mit einem Scan.

**1. Plan einlesen und kalibrieren** wie in [Ablauf 1](#ablauf-bauplan-einfach).

**2. Nullpunkt setzen.** {{befehl:werkzeug.nullpunkt}}: erst die linke untere Außenecke
anklicken, dann einen Punkt entlang der unteren Außenwand. Koordinaten in der Statuszeile zählen
danach ab dieser Ecke – und weitere Etagen lassen sich später an derselben Ecke ausrichten
([Nullpunkt](#nullpunkt)).

**3. Wände zeichnen.** Die Außenwände entstehen am schnellsten mit
{{befehl:werkzeug.wandrechteck}}: Wandstärke oben rechts einstellen (hier 0,30 m), zwei
gegenüberliegende Außenecken anklicken – die Wände liegen innerhalb des aufgezogenen Rechtecks.
Innenwände zeichnen Sie mit {{befehl:werkzeug.wand}} (Stärke vorher auf 0,115 m): Ein Klick auf
eine vorhandene Wand schließt dort an, der Stoß wird sauber verschnitten
([Wände zeichnen](#waende-zeichnen)). Die Wand liegt mit ihrer **Achse** auf den geklickten
Punkten.

![Nachzeichnen: Außenwände und die ersten Innenwände stehen, die nächste Wand ist in Arbeit](ablauf-nachzeichnen-waende.png)

**4. Türen und Fenster.** {{befehl:werkzeug.tuer}} und {{befehl:werkzeug.fenster}}: Breite (und
beim Fenster die Brüstung) in der Leiste oben rechts einstellen und auf die Wand klicken. Die
Öffnung richtet sich nach der Wand; Anschlag und Öffnungsrichtung ändern Sie im
Eigenschaften-Panel ([Türen und Fenster](#tueren-und-fenster)).

**5. Räume.** {{befehl:werkzeug.raum}} und in jede Fläche klicken. Name und Fläche stehen im
Plan; den Namen tragen Sie im Eigenschaften-Panel ein ([Räume](#raeume)).

**6. Kontrollieren.** {{befehl:ansicht.hintergrund}} blendet den Plan aus – jetzt sehen Sie, ob
alles nachgezeichnet ist. Ist der Plan nur zu kräftig, nimmt ihm der Regler **Hintergrund** oben
rechts die Deckkraft ([Sichtbarkeit und Deckkraft](#hintergrund-sichtbarkeit)).

![Nachgezeichnet: Wände, Türen, Fenster und Räume ohne Hintergrund](ablauf-nachzeichnen-raeume.png)

**7. Geschossangaben.** Ist nichts ausgewählt, stehen im Eigenschaften-Panel unter **Geschoss**
Kote, lichte Raumhöhe, Deckenstärke und Installationszone – die Grundlage für Leitungslängen und
3D ([Geschossangaben](#geschossangaben)).

**8. Bestücken.** Mit {{befehl:werkzeug.komponente}} an die Wand fahren: Die Komponente springt
an die Wand, mit der Oberseite zur Wand. Weitere Komponenten in derselben Höhe setzen sich daneben
zu einer **Kombination** (gepunkteter Rahmen, bis zu fünf); eine andere Höhe bildet davor eine
eigene Reihe. Die Höhe der nächsten Komponenten wählen Sie vor dem Klick mit **−**/**+** in der
Kontextleiste. Deckenleuchten setzen Sie frei in den Raum; sie bringen den Montageort **Decke**
aus dem Katalog mit ([Kombinationen je Höhe](#wandfang), [Montageort](#installationshoehe)).

![Schlafen und Bad: Schalter, Steckdosen und Leuchten an den Wänden, Kombination am Bett](ablauf-nachzeichnen-komponenten.png)

## Vektor-PDF: fangen und umwandeln {#ablauf-vektor-pdf}

Eine PDF, die ein CAD-Programm erzeugt hat, enthält echte Linien statt eines Bildes. Darauf
greift der Objektfang: Wandecken, Kanten und Schnittpunkte werden zu Fangpunkten, und Sie zeichnen
millimetergenau nach, ohne zu messen.

> Wände, Türen und Räume erkennt el.esy.CAD in einem PDF nicht von selbst – sie entstehen durch
> Nachzeichnen mit Fang. Fertige Bauteile übernimmt das Programm aus einem IFC-Modell
> ([Bauteile aus IFC übernehmen](#ifc-bauteile)).

**1. Einlesen und kalibrieren** wie in [Ablauf 1](#ablauf-bauplan-einfach). Auch ein
maßstäblich gezeichneter CAD-Plan kommt ohne Maßstab herein und braucht die Kalibrierung – am
besten an einer langen Strecke wie der Außenwand.

**2. Fang einschalten.** {{befehl:ansicht.objektfang}} muss an sein; {{befehl:ansicht.hintergrundfang}}
ist ab Werk an. Beide Schalter stehen auch oben im Eigenschaften-Panel. Ein grünes Quadrat am
Zeiger zeigt, dass ein Punkt des Plans gefangen ist ([Fang auf den Hintergrund](#hintergrundfang)).

![Wand als Rechteck: der zweite Klick fängt die Außenecke des Plans](ablauf-vektor-fang.png)

**3. Nachzeichnen mit Fang.** Mit {{befehl:werkzeug.wandrechteck}} die beiden Außenecken des
Plans anklicken – das Rechteck hat damit genau das Außenmaß. Weil eine Wand mit ihrer Achse auf
den Klickpunkten liegt, fangen Sie bei einer Innenwand die Mitte zwischen ihren beiden Kanten:
Schalten Sie im Aufklappmenü **Fang** die Fangart **Mittelpunkt** zu und klicken Sie auf die
kurze Stirnkante eines Wandendes, etwa neben einer Türöffnung – ihre Mitte liegt genau auf der
Achse ([Objektfang](#objektfang)). Türen, Fenster und Räume setzen Sie wie in
[Ablauf 3](#ablauf-nachzeichnen).

**4. Plan umwandeln (bei Bedarf).** Sollen Linien des Plans selbst bearbeitet werden – eine Wand
verschieben, eine Legende löschen –, macht {{befehl:blatt.hintergrund-umwandeln}} aus dem Plan
Zeichnungselemente. Ein Dialog neben dem Plan nennt vorher die Zahl der Linien und zeigt sie
farbig. Sie landen auf der Ebene
**„Grundriss (übernommen)“**, die Sie in {{befehl:blatt.ebenen}} sperren oder ausblenden; der
PDF-Hintergrund bleibt am Blatt, wird aber ausgeblendet. Schrift und Füllungen kommen nicht mit
([Plan umwandeln](#hintergrund-umwandeln)).

![Hintergrund umwandeln: 188 Linien werden Zeichnungselemente](ablauf-vektor-umwandeln.png)

**5. Bestücken.** Komponenten fangen an den Linien des Plans wie an gezeichneten Wänden – auch
ohne nachgezeichnete Wände. Für Räume, die Bestückung aus Räumen und die 3D-Ansicht braucht es
dagegen echte Wände.

## Verteiler mit einem eigenen Schaltplan verbinden {#ablauf-verteiler-schaltplan}

Sie haben den Stromlaufplan des Verteilers selbst gezeichnet ([Ablauf 2](#ablauf-schaltplan))
und wollen ihn mit dem Verteiler im Bauplan verbinden – damit später jede Leitung auf ihrer
Klemme landet und der Plan unter jeder Klemme zeigt, welche Leitung wohin geht.

**1. Verteiler setzen.** Im Bauplan aus dem Katalog **Elektroinstallation** den
„Elektroverteiler / Schaltschrank“ an die Wand setzen. Er bekommt das Ortskennzeichen **+UV1**
([Verteiler](#verteiler)).

**2. Plan zuordnen.** Doppelklick auf den Verteiler öffnet den Verteiler-Dialog. **Vorhandenen
Schaltplan zuordnen …** listet die Schaltpläne des Projekts; wählen Sie den eigenen Plan und
**Zuordnen**. Das Kennzeichen +UV1 steht danach im Schaltplan unter **Verteilerplan für** –
dort lässt sich die Zuordnung auch eintragen oder lösen ([Verteilerplan verknüpfen](#verteilerplan)).

![Den eigenen Schaltplan dem Verteiler zuordnen](ablauf-verteiler-zuordnen.png)

**3. Betriebsmittel einordnen.** Ab jetzt bestimmt der Plan, welche Betriebsmittel der Verteiler
hat. Was im Plan steht, im Baum des Verteilers aber noch keinen Platz hat, steht unter **Noch
nicht eingeordnet**.

![Der Verteiler-Dialog nach dem Zuordnen: die Betriebsmittel des Plans warten auf ihren Platz](ablauf-verteiler-einordnen.png)

Ziehen Sie jedes Betriebsmittel auf seinen Platz im Stromweg: den RCD auf die **Einspeisung**,
die Leitungsschutzschalter auf den RCD und jede Klemme („-X1:1“, „-X1:2“ …) hinter ihren
Leitungsschutzschalter. Wo Sie eine Zeile ablegen, entscheidet die Höhe: oben davor, unten danach,
in der Mitte dahinter
([Verteiler bestücken](#verteiler-bestueckung)).

![Eingeordnet: RCD, Leitungsschutzschalter und Klemmen im Baum](ablauf-verteiler-eingeordnet.png)

**4. Für die Verkabelung vorbereiten.** Tragen Sie in der Spalte **Phase** die Außenleiter ein
und unter **Beschriftung** an jeder Klemme, was sie versorgt („Küche Steckdosen“). Die
Beschriftung erscheint im Plan als erste Zeile an der Klemme, und beim Anschließen einer Leitung
finden Sie die Klemme über die Suche nach diesem Wort.

**5. Später: Leitungen anschließen.** Endet eine Leitung am Verteiler, fragt der Dialog
**Leitung … im Verteiler +UV1 anschließen**, auf welchem Knoten sie landet – siehe
[Ablauf 8](#ablauf-leitungen). Unter der Klemme im Plan steht danach von selbst die
Zielbezeichnung, etwa „W9 · Steckdose einfach“ – oder statt des Katalognamens die Beschriftung
der Komponente. Zugewiesen wird immer im Bauplan; der Plan liest nur.

## Verteiler und Verteilerplan aus den Räumen {#ablauf-aus-raeumen}

Liegt eine bestückte Planung mit Räumen vor ([Ablauf 3](#ablauf-nachzeichnen)), erzeugt
el.esy.CAD den Verteiler und daraus den Verteilerplan – ganz ohne gezeichnete Leitung. Grundlage
ist die Eigenschaft **Stromkreis** jeder Komponente.

**1. Stromkreise prüfen.** Wählen Sie eine Komponente aus: Im Eigenschaften-Panel steht unter
**Stromkreis**, wozu sie gehört ([Bestückung aus Räumen](#verteiler-aus-raeumen)):

- **Vorgabe** – bei Steckdosen und Leuchten der Raumstromkreis, bei Schaltern und Tastern kein
  Stromkreis. Die Herdanschlussdose bringt aus dem Katalog **eigener Stromkreis, 3~** mit.
- **Nummer 1 … 99** – ein weiterer Stromkreis im Raum, etwa „Küche 1“ für die Arbeitsplatte.
- Kleine Räume teilen sich einen Stromkreis über **Raumstromkreis gemeinsam mit** in den
  Eigenschaften des Raums.
- Den Haken **KNX** neben der Ansteuerung setzen Sie bei Verbrauchern, die über KNX geschaltet
  werden – sie bekommen einen Aktorkanal.

![Die Herdanschlussdose: eigener Stromkreis, dreipolig](ablauf-raeume-stromkreis.png)

**2. Vorschlagen lassen.** Verteiler setzen (wie in [Ablauf 5](#ablauf-verteiler-schaltplan)),
Doppelklick, **Bestückung aus Räumen vorschlagen …**. Der Dialog zeigt die Räume mit Haken, die
Art (Haupt- oder Unterverteilung), das Netz, einen RCD je Blatt und die Typen. Die Tabelle
darunter nennt für jeden Stromkreis die Bauteile und das Ergebnis, etwa „F4 / X1:3“.

![Bestückung aus Räumen vorschlagen: je Raum ein Stromkreis, der Herd mit eigenem](ablauf-raeume-vorschlag.png)

**3. Übernehmen.** Der Verteiler-Dialog zeigt den entstandenen Baum: Einspeiseklemme, RCD,
je Stromkreis ein Leitungsschutzschalter mit Klemme, die Beschriftungen aus den Raumnamen.
Alles darin bleibt bearbeitbar ([Verteiler bestücken](#verteiler-bestueckung)).

![Der vorgeschlagene Baum im Verteiler-Dialog](ablauf-raeume-baum.png)

**4. Zuordnung an den Bauteilen.** Jede Komponente kennt jetzt ihren Stromkreis, obwohl keine
Leitung zum Verteiler führt: Am Symbol steht „UV1-F4 / X1:3“, im Eigenschaften-Panel die ganze
Kette ([Stromkreis an den Bauteilen](#stromkreis-zuordnung)). Die Anzeige schalten Sie mit
{{befehl:blatt.anzeige-stromkreis}} aus.

![Küche: am Symbol steht der Stromkreis aus dem Verteiler](ablauf-raeume-zuordnung.png)

**5. Plan erzeugen.** Im Verteiler-Dialog **Verteilerplan erzeugen …**. Der Assistent schlägt
im letzten Schritt Kennzeichen und Namen vor, fragt, wie viele Sicherungen und Klemmen höchstens
auf ein Blatt kommen und wie ein RCD aufgeteilt wird, der nicht mehr aufs Blatt passt, und zeigt
alle Blätter als Vorschau ([Verteilerplan erzeugen](#verteilerplan-erzeugen)).

![Der letzte Schritt des Verteilerplan-Assistenten mit Vorschau](ablauf-raeume-assistent.png)

**6. Ergebnis.** **Erzeugen** legt den Plan als neue Zeichnung im Projekt an und verknüpft ihn
über +UV1 mit dem Verteiler. Blatt 1 enthält die Einspeisung, die folgenden Blätter die
Stromkreise mit Sammelschienen in Aderfarben, Leitungsschutzschaltern und Klemmen; unter jeder
Klemme steht die Zielbezeichnung.

![Blatt 2 des erzeugten Verteilerplans](ablauf-raeume-plan.png)

Ändert sich die Planung, schlagen Sie die Bestückung erneut vor: Vorhandenes bleibt, Neues kommt
dazu, nicht mehr Gebrauchtes steht zum Entfernen bereit. Danach fragt el.esy.CAD, ob der
verknüpfte Plan neu erzeugt werden soll – siehe [Ablauf 11](#ablauf-nacharbeiten).

## Verteilerplan aus dem Baum des Verteilers {#ablauf-baum}

Statt aus Räumen stellen Sie den Verteiler hier selbst zusammen – als Baum, der den Stromweg
zeigt: Einspeisung → RCD → Leitungsschutzschalter → Klemme. Daraus erzeugt der Assistent den Plan.

**1. Baum anlegen.** Doppelklick auf den Verteiler. Das **+** an einer Zeile hängt etwas dahinter:

- **Betriebsmittel dahinter …** – ein Symbol aus dem Katalog und die Anzahl, etwa zwei RCD an der
  Einspeisung,
- **Stromkreise dahinter …** – Anzahl, Schutzgerät und Klemme: vier Leitungsschutzschalter mit je
  einer Abgangsklemme hinter dem ersten RCD, Phasen reihum,
- **Kanal dahinter …** – ein Kanal eines Schaltaktors.

![Das Menü am „+“ einer Zeile](ablauf-baum-menue.png)

**2. Bearbeiten.** In jeder Zeile ändern Sie Kennzeichen, Typ (B16, C16 …), Phase und
**Beschriftung** – an der Klemme etwa „Küche Spüle“. Mit dem Griff ⠿ ziehen Sie eine Zeile an
eine andere Stelle, **✕** entfernt sie. **Neu nummerieren** zählt eine Klemmenleiste lückenlos
durch ([Verteiler bestücken](#verteiler-bestueckung)).

![Der fertige Baum: zwei RCD mit sieben beschrifteten Stromkreisen](ablauf-baum-fertig.png)

**3. Plan erzeugen.** **Verteilerplan erzeugen …** öffnet den Assistenten; im letzten Schritt
prüfen Sie Kennzeichen, Name, Aufteilung und Vorschau und klicken **Erzeugen**.

![Assistent mit Vorschau der Blätter](ablauf-baum-assistent.png)

Blatt 1 zeigt die Einspeisung mit dem Bus L1, L2, L3, N und PE, die übrigen Blätter die
Stromkreise je RCD. Die Beschriftungen aus dem Baum stehen an den Symbolen.

![Blatt 1: die Einspeisung](ablauf-baum-einspeisung.png)

![Blatt 2: die Stromkreise des ersten RCD](ablauf-baum-plan.png)

**Ganz ohne Bauplan:** In der Projektübersicht startet **Verteilerplan-Assistent…**
({{befehl:datei.verteilerplan-assistent}}) mit der Frage nach dem Inhalt. **Neu
zusammenstellen** führt zum Startbaum: Haupt- oder Unterverteilung, Netz, Einspeiseklemme, Zahl
der RCD und der Leitungsschutzschalter je RCD. Danach folgt derselbe Baum wie oben.

![Assistent: der Startbaum beim Neu-Zusammenstellen](ablauf-baum-startbaum.png)

## Leitungen und Trunks verlegen, Plan erzeugen {#ablauf-leitungen}

In einem bestückten Bauplan legen Sie die Leitungen selbst – mit eigenem Weg, gebündelt in Trunks
– und weisen jede einer Klemme im Verteiler zu. Daraus entsteht ein Verteilerplan, der zu jeder
Klemme die tatsächlichen Leitungen nennt.

**1. Verteiler bestücken.** Den Baum legen Sie wie in [Ablauf 7](#ablauf-baum) an, mit einer
Beschriftung je Klemme („Küche Steckdosen“, „Flur“ …).

**2. Trunk vom Verteiler.** {{befehl:werkzeug.trunk}}: am Verteiler beginnen – Trunks docken oben,
unten und seitlich in der Mitte an –, Wegpunkte klicken, **Enter**. Im Beispiel läuft der Trunk
durch den Flur und an der Küchenwand entlang ([Einen Trunk anlegen](#trunk-anlegen)).

**3. Leitungen zeichnen.** {{befehl:werkzeug.leitung}} auf den Dockpunkt der ersten Steckdose,
dann auf den Trunk (Eintritt), dann – im Trunk – auf den Austritt am Verteiler. Läuft die Leitung
durch einen Trunk, an dem ein Verteiler hängt, öffnet die **Leertaste** den Dialog „Ziel der
Leitung“ mit der Rubrik **Verteiler** ([Leitungen in den Trunk legen](#leitung-in-trunk)).
Endet eine Leitung direkt an einem Dockpunkt des Verteilers, fragt der Dialog sofort.

![Wohin die Leitung im Verteiler führt: Suche „flur“, die Klemme X1:4](ablauf-leitungen-ziel.png)

Das Suchfeld lässt nur passende Knoten stehen; wählen Sie die Klemme. Darunter steht die
abgeleitete Kette, etwa „X1:4 → F5 · RCD F1 · L1“ ([Leitungen im Verteiler
anschließen](#verteiler-anschliessen)). Weitere Steckdosen schleifen Sie von Steckdose zu
Steckdose durch – sie gehören damit zum selben Stromkreis.

**4. Kontrollieren.** Am Leitungsschild steht das Ziel, etwa „9 → UV1-X1:4 (F5)“, am Symbol der
Stromkreis ({{befehl:blatt.anzeige-stromkreis-schild}}, {{befehl:blatt.anzeige-stromkreis}}).
Die [Leitungsliste](#leitungsliste) hat eine Spalte **Stromkreis**, das
[Stromkreisverzeichnis](#stromkreisverzeichnis) fasst alles je Verteiler zusammen.

![Flur und Küche: Trunk, Leitungen mit Zielschildern, Verteiler +UV1](ablauf-leitungen-plan.png)

**5. Plan erzeugen.** Im Verteiler-Dialog **Verteilerplan erzeugen …** wie in
[Ablauf 6](#ablauf-aus-raeumen). Unter jeder Klemme stehen jetzt die Leitungen aus dem Bauplan,
senkrecht geschrieben: Leitungsnummer, Kabeltyp (sofern gesetzt) und Ziel.

![Der erzeugte Plan: unter den Klemmen die Leitungen aus dem Bauplan](ablauf-leitungen-verteilerplan.png)

Die Zielbezeichnungen folgen dem Bauplan auch nach dem Erzeugen: Eine neue Leitung auf X1:2
erscheint im Plan, ohne dass Sie ihn neu erzeugen.

## Befehlsgeräte und Verbraucher verbinden {#ablauf-wirkverbindungen}

Welcher Schalter welche Leuchte schaltet, ist keine Leitung, sondern eine **Wirkverbindung**:
von einem Slot des Befehlsgeräts (Taste, Wippe, Kanal) zu einem Verbraucher oder einer
Gerätegruppe. Konventionelle Schalter verbinden Sie über die Leitung, KNX-Taster ohne
([Wirkverbindungen](#wirkverbindungen)).

**Konventionell – über die Leitung.** Zeichnen Sie wie gewohnt die Leitung vom Wechselschalter im
Flur zur Leuchte. Weil beide einen Gerätetyp haben, fragt el.esy.CAD danach, was daraus folgen
soll: welcher Slot des Schalters auf die Leuchte wirkt und wie er heißt – vorgeschlagen aus Raum
und Ansteuerung, „Licht Flur“. Hängen weitere Schalter per Leitung daran (Wechsel- oder
Kreuzschaltung), stehen sie mit eigener Slotwahl darunter ([Gleich beim Verlegen der
Leitung](#wirkverbindungen)).

![Nach der Leitung vom Schalter zur Leuchte: Wirkverbindung anlegen](ablauf-wirk-leitung.png)

**KNX – mit dem Werkzeug.** {{befehl:werkzeug.wirkverbindung}}, den Tastsensor anklicken. Hat er
mehrere Slots, wählen Sie den Slot.

![Slot wählen beim Tastsensor KNX 4fach](ablauf-wirk-slot.png)

Klicken Sie dann alle Leuchten an, die diese Taste schalten soll, und schließen Sie mit **Enter**
ab. Bekommt ein Slot mehr als ein Ziel, fasst el.esy.CAD die Ziele zu einer **Gerätegruppe**
zusammen und fragt Name, Ansteuerung und den Haken **KNX** ab ([Gerätegruppen](#geraetegruppen)).

![Gerätegruppe bilden: beide Leuchten im Wohnzimmer, KNX-geschaltet](ablauf-wirk-gruppe.png)

**Kontrollieren.** Wählen Sie den Tastsensor aus: Gestrichelte Linien führen zu seinen Zielen,
neben dem Symbol zeigt eine kleine Grafik seine Slots. Ein Klick auf einen Slot markiert seine
Verbraucher gelb. Alle Zuordnungen sehen Sie tabellarisch in der [Slot-Matrix](#slot-matrix), auf
dem Plan in der [Steuerungslogik](#steuerungslogik) ({{befehl:werkzeug.steuerungslogik}}). Ziele
auf einer anderen Etage erreichen Sie, indem Sie während des Werkzeugs das Blatt wechseln
([Über Etagen hinweg](#wirkverbindungen)).

![Der ausgewählte Tastsensor mit seinen Wirkverbindungen](ablauf-wirk-knx.png)

**KNX-Aktoren zuordnen.** Ist der Verteiler bestückt ([Ablauf 6](#ablauf-aus-raeumen) oder
[Ablauf 7](#ablauf-baum)), öffnet **KNX-Aktoren zuordnen …** im Verteiler-Dialog die Liste aller
Klemmen, deren Verbraucher KNX-geschaltet sind. Je Klemme schlägt der Dialog Kanalart und
Kanalnamen vor und legt mit der eingestellten Reserve möglichst wenige Aktoren an
([KNX-Aktoren zuordnen](#knx-zuordnen)). Im erzeugten Verteilerplan steht jeder Kanal als
Kontakt zwischen Leitungsschutzschalter und Klemme; die Aktoren selbst auf eigenen Aktorblättern.
Die [Aktorkanalliste](#aktorkanalliste) ({{befehl:werkzeug.aktorkanalliste}}) fasst alles zusammen.

![KNX-Aktoren zuordnen: die Leuchtengruppe bekommt Kanal A1 eines neuen Schaltaktors](ablauf-wirk-aktoren.png)

## Etagen ausrichten und in 3D ansehen {#ablauf-etagen-3d}

Jede Etage ist ein eigenes Blatt mit eigenem Plan. Damit die Geschosse in der 3D-Ansicht, im
IFC-Export und am Kabelschacht übereinanderpassen, richten Sie sie an einem gemeinsamen Punkt aus.

**1. Ein Blatt je Etage.** Doppelklick auf das Register benennt es um („EG“). **+ Blatt ›
Leeres Blatt** legt das nächste an („OG“); weiter rechts heißt weiter oben
([Blätter](#blaetter)). Ist das EG schon gezeichnet, kopiert **Etage darüber einfügen …** seine
Wände, Räume und Treppen gleich mit ([Etagen einfügen](#etagen)).

**2. Je Blatt den Plan einlesen und kalibrieren.** Bei einer mehrseitigen PDF wählen Sie im
Dialog die Seite des Geschosses.

![Die zweite Seite der PDF für das Obergeschoss](ablauf-etagen-pdf-seite.png)

**3. Je Blatt den Nullpunkt setzen.** {{befehl:werkzeug.nullpunkt}} auf **dieselbe Gebäudeecke**
und mit dem zweiten Klick entlang **derselben Außenwand** – auf jedem Blatt, auch wenn der Plan
dort anders auf dem Papier liegt oder schief eingescannt ist.

**4. Ausrichten.** {{befehl:blatt.ausrichten}} zeigt alle Blätter mit Nullpunkt und Richtung.
**Ausrichten** dreht und verschiebt jedes gewählte Blatt so, dass der Nullpunkt bei 0,0 liegt
und die Kante waagerecht – danach liegen die Geschosse deckungsgleich
([Blätter übereinanderlegen](#nullpunkt)).

![Blätter am Nullpunkt ausrichten](ablauf-etagen-ausrichten.png)

**5. Zeichnen.** Wände, Türen, Fenster und Räume je Etage wie in [Ablauf 3](#ablauf-nachzeichnen)
oder [Ablauf 4](#ablauf-vektor-pdf), dann die Komponenten.

**6. Höhen festlegen.** {{befehl:blatt.etagen}} zeigt alle Etagen von oben nach unten mit Kote,
lichter Höhe, Decke und dem Abstand zur Etage darunter. Ändern Sie eine Höhe, rücken die übrigen
Etagen auf Wunsch mit ([Etagen einfügen](#etagen)).

![Die Etagenübersicht: OG auf 2,85 m über dem EG](ablauf-etagen-uebersicht.png)

**7. 3D-Ansicht.** {{befehl:ansicht.dreid}} zeigt beide Geschosse übereinander, mit den Geräten
auf ihrer Montagehöhe. Ziehen dreht, das Mausrad zoomt, **Einpassen** zeigt wieder alles; links
blenden Sie Geschosse aus und stellen ein, wie durchsichtig Wände und Decken sind
([3D-Ansicht](#dreid-ansicht), Zusatzmodul BIM). Leitungen zwischen den Etagen führen Sie über
einen [Kabelschacht](#kabelschacht).

![3D-Ansicht: Erdgeschoss und Obergeschoss übereinander](ablauf-etagen-3d.png)

## Erzeugten Verteilerplan nacharbeiten {#ablauf-nacharbeiten}

Ein erzeugter Verteilerplan ist danach eine gewöhnliche Schaltplan-Zeichnung: Sie ergänzen,
verschieben und löschen darin wie in einem selbst gezeichneten Plan. Einiges bleibt dabei mit dem
Bauplan verbunden, anderes nicht.

| Bleibt verbunden (folgt dem Bauplan) | Steht fest im Plan |
|---|---|
| Zielbezeichnungen: die Leitungen aus dem Bauplan unter den Klemmen | Symbole, Verbindungen und Blätter |
| Beschriftungen der Bestückung als erste Zeile am Symbol | Was Sie selbst ergänzen oder umstellen |
| Kanalbeschriftungen der KNX-Aktoren | |
| Welche Betriebsmittel der Verteiler hat – der Plan bestimmt sie | |

**1. Bauteile einsetzen und herausnehmen.** Setzen Sie ein Bauteil aus dem Katalog direkt auf
eine Verbindung – etwa einen Schützkontakt zwischen Leitungsschutzschalter und Klemme –, trennt
el.esy.CAD die Verbindung am oberen Kontakt und führt sie ab dem unteren weiter. Die Vorschau
zeigt die betroffene Verbindung schon vorher blau. Löschen Sie ein solches Bauteil wieder, wird
die Verbindung durchgehend ([Bauteile in Verbindungen setzen](#schaltverbindung)).

![Ein Schützkontakt wird in die Leitung zu -X1:1 eingeschleift – die Vorschau zeigt sie blau](ablauf-nacharbeiten-einschleifen.png)

**2. Verbindungen bearbeiten.** Segmente, Knotenpunkte und Griffe wie in jedem Schaltplan
([Segmente und Knotenpunkte](#schaltverbindung)). Für einen aufgeräumten Teil hilft
{{befehl:bearbeiten.automatisch-anordnen}} ([Automatisch anordnen](#automatisch-anordnen)).

**3. Zielbezeichnung anpassen.** Ziehen verschiebt sie. Im Eigenschaften-Panel des Symbols wählen
Sie die Lage (waagrecht, senkrecht, links neben dem Symbol), die Schrifthöhe und bei Bedarf einen
eigenen Text; **Wieder automatisch** hebt das auf ([Verteilerplan verknüpfen](#verteilerplan)).

![Die Zielbezeichnung einer Klemme im Eigenschaften-Panel](ablauf-nacharbeiten-zielbezeichnung.png)

**4. Klemmen nummerieren.** Kennzeichen und Klemmennummer ändern Sie im Eigenschaften-Panel;
**Rechtsklick auf eine Klemme › Klemmenleiste -X1 neu nummerieren** zählt die ganze Leiste neu
durch ([Klemmenleiste](#klemmen)).

**5. Wenn sich die Bestückung ändert.** Kommt im Bauplan ein Stromkreis dazu, haben Sie zwei Wege:

- **Von Hand nacharbeiten:** Leitungsschutzschalter und Klemme mit denselben Kennzeichen wie in
  der Bestückung in den Plan setzen. Der Verteiler-Dialog zeigt grau, was dem Plan noch fehlt;
  die [Betriebsmittelliste](#betriebsmittelliste) meldet Kennzeichen, die im Bauplan zugewiesen
  sind, im Plan aber fehlen.
- **Neu erzeugen:** Nach **Bestückung aus Räumen vorschlagen …** fragt el.esy.CAD, ob der
  verknüpfte Plan neu erzeugt werden soll. Dabei wird sein Inhalt ersetzt – eigene Änderungen im
  Plan gehen verloren, und Rückgängig im Bauplan erreicht den Plan nicht. Wer viel nachgearbeitet
  hat, arbeitet deshalb lieber von Hand weiter.
