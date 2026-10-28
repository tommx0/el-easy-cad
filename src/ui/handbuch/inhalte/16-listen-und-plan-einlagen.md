# Listen und Plan-Einlagen

Plan-Einlagen sind Tabellen und Diagramme, die aus der Zeichnung abgeleitet und **auf** dem
Blatt platziert werden. Sie rechnen sich selbst fort: Kommt eine Komponente hinzu, steht sie in
der Stückliste, ohne dass Sie etwas nachtragen.

Alle Einlagen liegen im Menü **Zeichnen › Plan-Einlagen**. Die Bedienung ist überall gleich:
Werkzeug wählen und auf das Blatt klicken – der Klick setzt die linke obere Ecke, die Einlage
wächst mit ihrem Inhalt. Größe, Spaltenbreiten und Schriftgröße stellen Sie danach im
Eigenschaften-Panel ein.

## Stückliste {#stueckliste}

{{video:10-listen}}

{{befehl:werkzeug.stueckliste}} listet alle platzierten Komponenten mit Anzahl, Bezeichnung,
Hersteller und Artikelnummer. Im Eigenschaften-Panel wählen Sie, ob die Liste nur das aktuelle
Blatt oder die ganze Zeichnung auswertet.

Tragen Komponenten [variable Texte](#variable-texte), die für die Stückliste markiert sind,
kommt eine Spalte **Angaben** hinzu („Nennstrom: B16“). Gleiche Komponenten mit
unterschiedlichen Angaben stehen dann in eigenen Zeilen.

Im Bauplan steht hinter dem Namen die [Verlegeart](#verlegeart): „Steckdose einfach (UP)“ und
„Steckdose einfach (AP)“ werden getrennt gezählt.

![Stückliste und Leitungsliste als Einlagen auf dem Blatt](einlagen.png)

## Switchplan {#switchplan}

{{befehl:werkzeug.switchplan}} zeigt je Switch eine Portleiste mit der Belegung: Port, Ziel,
Leitungsnummer, PoE-Bedarf und die Summe je Gerät. Das ist die Patchliste für die Inbetriebnahme.

## Patchpanelplan {#patchpanelplan}

{{befehl:werkzeug.patchpanelplan}} tut dasselbe für Patchpanels – welcher Port auf welche Dose
geht.

## Leitungsliste {#leitungsliste}

{{befehl:werkzeug.leitungsliste}} listet alle Leitungen mit Nummer, Typ (Kabeltyp), Von, Nach,
den Blättern, über die sie laufen, der am Plan gemessenen **Länge** und der **Verlegelänge**
(mit Anschlussreserve, Schachtstrecke und senkrechten Stücken, siehe
[Leitungslängen](#leitungslaengen)). Sind Leitungen im Verteiler angeschlossen, kommt die Spalte
**Stromkreis** dazu („UV1-F4 / X6 · RCD F2“, auch für durchgeschleifte Leitungen); im
Eigenschaften-Panel der Liste lässt sie sich abschalten. Dort steht auch die
**Anschlussreserve je Kabelende**, die für die ganze Zeichnung gilt.

**Kabeltyp aus der Liste ändern:** Ein Doppelklick auf die Typ-Zelle einer Zeile öffnet den
Dialog **Kabeltyp ändern** für dieses Kabel. Die Auswahl wirkt sofort auf das Kabel – auch auf
seine Fortsetzung über einen Kabelschacht. **Für alle übernehmen…** setzt denselben Typ nach einer
Rückfrage für alle Leitungen der Zeichnung, über alle Blätter; ein Rückgängig nimmt das zurück.

## Trunkliste {#trunkliste}

{{befehl:werkzeug.trunkliste}} zeigt je Trunk, welche Leitungen darin liegen und wie viele
Adern damit zusammenkommen – die Grundlage für die Wahl des Kabelkanals.

## Raumliste {#raumliste}

{{befehl:werkzeug.raumliste}} listet die [Räume](#raeume) mit Raumart, Name und Fläche, mit Summe. Die Raumart steht vor dem
Namen; hat ein Raum keine, bleibt die Zelle leer. Auch der Excel-Export hat die Spalte.

## Betriebsmittelliste {#betriebsmittelliste}

Nur im [Schaltplan](#zeichnungsart): {{befehl:werkzeug.betriebsmittelliste}} listet jedes
Bauteil mit Betriebsmittelkennzeichen (z. B. „K1“, „F3“) – Kennzeichen, Bauteiltyp und
[Ort](#koordinatennetz) (z. B. „Blatt 3-F2“) je Vorkommen. Bei Relais/Schützen (Kennzeichen „K“) prüft die Liste zusätzlich, ob zur Spule
mindestens ein Kontaktblock existiert und umgekehrt – fehlt das Gegenstück, egal auf welchem
Blatt, erscheint ein Hinweis „Kein Gegenstück gefunden“. Bei den übrigen Kennzeichen
(Leitungsschutzschalter/RCD/Sicherung/Zähler/Klemmen) ist ein einzelnes Vorkommen normal, dafür
gibt es keine Warnung.

## Stromkreisverzeichnis {#stromkreisverzeichnis}

{{befehl:werkzeug.stromkreisverzeichnis}} setzt die Legende für die Verteilertür ein: je
Stromkreis eine Zeile mit Kennzeichen, Typ, Phase, RCD, Stromkreisbezeichnung, Klemmen,
Leitungen, Kabeltyp und Geräten, in der Reihenfolge des Baums; RCD und Vorsicherungen stehen als
Gruppenzeilen darüber. Zum Stromkreis gehört alles, was über den Stromweg daran hängt – Leitungen
auf seinen Klemmen und Kanälen und durchgeschleifte Geräte. Als Stromkreisbezeichnung dient die
Beschriftung der Sicherung in der [Bestückung](#verteiler-bestueckung), sonst die ihrer Klemmen,
sonst die Räume der Geräte. Welcher Verteiler gemeint ist, wählen Sie im Eigenschaften-Panel; im
[Verteilerplan](#verteilerplan) ist es sein eigener. Der Excel-Export enthält je Verteiler ein
Blatt „Stromkreise +UV1“.

## Aktorkanalliste {#aktorkanalliste}

{{befehl:werkzeug.aktorkanalliste}} setzt je [KNX-Aktor](#knx-aktor) eines Verteilers die Liste
seiner Kanäle ein – als Vorlage für die ETS-Programmierung und als Unterlage für die Abnahme. Je
Aktor eine Gruppenzeile (-K1 Schalt-/Jalousieaktor 8fach), darunter je Kanal – ein Jalousiepaar
als „A3/A4“ – **Funktion**, **Beschriftung**, **Raum** und **Verbraucher**, **Stromkreis** (etwa
„UV1-F3 · RCD F1 · L2“), **Klemme** und **Ausgelöst durch**: das KNX-Gerät mit Wippe bzw. Slot
aus der [Wirkverbindung](#wirkverbindungen). Freie Kanäle stehen mit „frei“ da, die Summe zählt
belegte und freie. Welcher Verteiler gemeint ist, wählen Sie im Eigenschaften-Panel; im
Verteilerplan sind es seine Aktoren, ergänzt um den Bauplan, in einem Schaltplan ohne Verteiler
die Aktoren mit ihren eigenen Angaben. Der Excel-Export enthält ein Blatt „Aktorkanäle +UV1“.

## Potentialliste {#potentialliste}

Nur im [Schaltplan](#zeichnungsart): {{befehl:werkzeug.potentialliste}} listet alle
[Potentiale](#potential) der Zeichnung, je eine Zeile pro Name, mit Anzahl der Vorkommen und den
[Orten](#koordinatennetz), an denen sie erscheinen. Eine benannte Schaltverbindung läuft über
mehrere Felder und steht deshalb nur mit ihrem Blatt da. Ein Potential mit nur einem Vorkommen gilt als verwaist –
die Liste weist mit „Nur ein Vorkommen“ darauf hin, denn ein Potential soll mindestens zweimal
auftauchen, um wirklich etwas zu verbinden.

## Steuerungslogik {#steuerungslogik}

{{befehl:werkzeug.steuerungslogik}} stellt dar, was worauf wirkt: Quelle, Slot, Ziel und Art
der [Wirkverbindung](#wirkverbindungen).

Mit „Unbelegte Slots ausblenden“ im Eigenschaften-Panel verschwinden Slots, die nichts schalten.
Ein Gerät ganz ohne Wirkverbindung bleibt mit der Zeile „keine Wirkverbindung“ in der Liste, damit
es nicht unbemerkt fehlt. Der Excel-Export übernimmt die Einstellung, sobald eine
Steuerungslogik-Tabelle im Projekt sie nutzt.

## Leitungsbaum {#leitungsbaum}

{{befehl:werkzeug.leitungsbaum}} zeichnet die Netzstruktur als Organigramm: vom Verteiler über
die Trunk-Gruppen bis zum Endgerät, mit Längen je Abschnitt. Unter einem Elektroverteiler steht
je Stromkreis eine Zwischenebene („F3 B16“ mit Beschriftung, Phase, RCD und Klemmen), darunter die
Geräte, die an ihm hängen – auch über eine Klemme dahinter. Anders als die Listen ist das eine
Grafik – gut geeignet als Übersichtsblatt für den Auftraggeber.

## Plankopf {#plankopf}

{{befehl:werkzeug.plankopf}} setzt ein Schriftfeld nach DIN EN ISO 7200 auf das Blatt, 180 mm
breit auf dem Papier – es druckt in jedem Maßstab gleich groß. Ab Werk hat es fünf Zeilen mit
den Feldern **Rechtlicher Eigentümer**, **Benennung**, **Ergänzung**, **Dokumentart**,
**Erstellt von**, **Geprüft von**, **Datum**, **Maßstab**, **Zeichnungsnummer**, **Blatt** und
**Änderung**. Vorbelegt sind nur drei: das Datum mit dem Tag des Einsetzens (als fester Text),
der Maßstab und der Blattname – beide laufen automatisch mit.

1. Werkzeug wählen und auf das Blatt klicken – der Klick setzt die linke obere Ecke.
2. Ein Doppelklick auf den Plankopf (oder **Felder beschriften…** im Eigenschaften-Panel) öffnet
   den Dialog **Plankopf beschriften**.

Im Dialog ist alles frei: Je Zeile stellen Sie die **Höhe** in mm ein, je Feld **Beschriftung**,
**Inhalt** und **Anteil** (wie breit das Feld in seiner Zeile ist). Unter **Quelle** zieht ein Feld
seinen Inhalt stattdessen automatisch aus der Zeichnung: Name der Zeichnung, Name des Blatts,
Blatt x von y, Maßstab des Blatts, Blattformat oder heutiges Datum. **Logo › Einfügen** setzt Ihr
Firmenlogo in ein Feld. Felder und Zeilen fügen Sie an oder löschen sie; **DIN-Vorgabe
wiederherstellen** stellt die Werksbelegung wieder her.

Im Eigenschaften-Panel ändern Sie die **Breite auf dem Papier**; **Unten rechts in die
Zeichenfläche** rückt den Plankopf an seinen üblichen Platz. Ohne eingerichtete Zeichenfläche
wird er vorläufig wie bei 1:100 dargestellt.

Das Logo hinterlegen Sie einmalig in den Programmeinstellungen unter **Firma & Plankopf**; es gilt
dann für alle Pläne.
