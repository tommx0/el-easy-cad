# Trunks und Kabelschacht

Ein **Trunk** ist ein Kabelbündel: ein gezeichneter Weg, in dem mehrere Leitungen gemeinsam
verlaufen. Statt zwanzig Einzelleitungen quer durch den Plan zu ziehen, führen Sie einen Trunk
vom Verteiler zum Flur und lassen die Leitungen darin laufen. Ein **Kabelschacht** ist
dasselbe in der Senkrechten: die Verbindung zwischen den Geschossen.

## Einen Trunk anlegen {#trunk-anlegen}

{{video:06-trunk}}

1. {{befehl:werkzeug.trunk}} wählen.
2. Den Verlauf klicken wie eine Polylinie – Punkt für Punkt. **Umschalt** rastet den nächsten
   Punkt auf 45°-Schritte ein, **Rücktaste**, **Entf** oder ein Rechtsklick nimmt den letzten
   Punkt zurück.
3. **Enter** oder ein Doppelklick schließt den Trunk ab, **Esc** verwirft ihn.

![Ein Trunk mit eingelegten Leitungen und Nummernschildern](trunk.png)

Ein neuer Trunk bekommt den nächsten freien Namen der Zeichnung („Trunk1“, „Trunk2“ …). Seine
beiden Enden tragen ein Schild „Trunk1 A“ und „Trunk1 B“. Gehören mehrere Trunks zu einer
[Kette](#trunks-verbinden), teilen sie sich den Namen; die Teilstücke heißen dann automatisch
„Trunk1.1“, „Trunk1.2“ … – benennen lassen sie sich nicht einzeln, ein neuer Name im
Eigenschaften-Panel gilt für die ganze Kette.

Die Enden sind frei, docken also nicht an gewöhnliche Dockpunkte von Komponenten an. Ausnahme
sind eigens dafür vorgesehene **Trunk-Punkte**, etwa oben an einem Switch, Patchpanel oder
Verteiler (im Katalog „nur Trunk“ bzw. Trunk-Sonderpunkte): Klicken Sie beim Zeichnen darauf,
rastet das Trunk-Ende dort ein und bleibt daran gebunden. Über einen so angedockten Trunk weisen
Sie Leitungen später einem [Port](#switch-ports) zu. Endpunkte und Stützpunkte lassen sich
später mit dem Auswahlwerkzeug verschieben; Wegpunkte fügen Sie per Rechtsklick ein und
entfernen sie dort wieder.

**Vorab festlegen:** Solange das Trunk-Werkzeug aktiv ist, zeigt eine Leiste oben rechts über der
Zeichnung, was neue Trunks bekommen: die [Ausführung](#trunk-ausfuehrung) samt Abmessung und die
[Installationszone](#trunk-zone), mit dem Knopf **AP / UP** für dieselbe Zone mit der anderen
Verlegeart. Die Wahl gilt für alle folgenden Trunks, bis Sie sie zurückstellen oder eine andere
Zeichnung öffnen. Endet ein neuer Trunk auf einer Kette mit anderer Ausführung, fragt
el.easy.CAD beim Verbinden, welche gelten soll.

## Leitungen in den Trunk legen {#leitung-in-trunk}

{{video:07-leitung-in-trunk}}

Beim Zeichnen einer Leitung klicken Sie auf den Trunk-Pfad:

1. Dockpunkt der Quelle klicken.
2. Auf den Trunk klicken – das ist der **Eintrittspunkt**, ab hier folgt die Leitung dem Bündel.
3. Erneut auf den Trunk klicken – das ist der **Austrittspunkt**.
4. Auf den Ziel-Dockpunkt klicken.

Die [Leitungsnummer](#leitungsnummern) erscheint als kleines Schild an Ein- und Austritt.
Ziehen Sie ein Schild mit dem Auswahlwerkzeug, wandert nur die Beschriftung; ein Doppelklick
setzt sie zurück. Mit gedrückter **Umschalt**-Taste verschieben Sie dagegen den Ein- bzw.
Austrittspunkt selbst entlang des Trunks – die Nummer bleibt dabei erhalten.

{{video:08-ueber-trunk-weiter}}

Eine Leitung darf nacheinander durch mehrere Trunks laufen, in jedem aber nur einmal ein- und
austreten.

## Trunks verbinden {#trunks-verbinden}

Trunks lassen sich zu **Ketten** verbinden. Eine Kette teilt sich Name, Farbe, Strichstärke und
[Ausführung](#trunk-ausfuehrung); eine Leitung kann darin von einem Teilstück ins nächste laufen.

**Auf demselben Blatt** – mit der Maus:

- Ziehen Sie ein Trunk-Ende mit dem Auswahlwerkzeug auf das **Ende** eines anderen Trunks (oder
  beenden Sie einen neuen Trunk dort), fragt el.easy.CAD nach und **verschmilzt** beide zu einem
  Trunk.
- Landet das Ende **mitten auf** einem anderen Trunk, entsteht nach Rückfrage ein **Abzweig**.
- „Abbrechen“ lässt das Ende einfach an der abgelegten Stelle liegen, ohne Verbindung.

**Über Blattgrenzen hinweg** – etwa vom Erdgeschoss in den ersten Stock – geht es nur über das
Kontextmenü: Rechtsklick auf ein freies Trunk-Ende › **Mit anderem Trunk verbinden …**. Im Dialog
wählen Sie **Zielseite**, **Ziel-Trunk** und dessen Ende (A oder B). Wählen Sie dort dasselbe
Blatt, werden die beiden Trunks wie oben verschmolzen. Haben die beiden Ketten verschiedene
Ausführungen, fragt el.easy.CAD, welche gelten soll.

Ein blattübergreifend verbundenes Ende trägt statt des einfachen Schilds einen blauen Verweis,
etwa „Trunk1.1 B → OG / Trunk1.2“. Ein Klick darauf springt auf das andere Blatt zum
Gegenstück. Rechtsklick auf ein verbundenes Ende › **Verbindung trennen** löst die Verkettung
wieder; ein Ende am Kabelschacht lösen Sie dort mit **Vom Kabelschacht lösen**.

## Ausführung: Bündel, Kanal, Trasse, Rohr {#trunk-ausfuehrung}

Ein Trunk ist zunächst ein loses **Bündel**. Im Eigenschaften-Panel legen Sie unter
**Ausführung** fest, ob die Leitungen stattdessen in einem **Kabelkanal**, auf einer
**Kabeltrasse** oder in einem **Leerrohr** liegen, und geben die Abmessung in Zentimetern an –
Breite und Höhe bei Kanal und Trasse, den Durchmesser beim Rohr. Die Angabe gilt für die ganze
[Kette](#trunks-verbinden). Kommen beim Verbinden zwei Ketten mit verschiedener Ausführung
zusammen, fragt el.easy.CAD, welche gelten soll; hat nur eine Seite eine Ausführung, gilt diese.
Am Plan, an den Leitungslängen und der Stückliste ändert sie nichts; sie wird für den IFC-Export
gebraucht.

## Installationszone eines Trunks {#trunk-zone}

Auch ein Trunk läuft ohne eigene Angabe in der Installationszone seines Blattes
([Geschossangaben](#geschossangaben)). Unter **Installationszone** im Eigenschaften-Panel oder in
der [Kontextleiste](#kontextleiste) legen Sie eine eigene fest – etwa einen Kabelkanal unter der
Decke oder ein Leerrohr im Boden, während die Steckdosenleitungen unten laufen. Die Zone gilt für alle Leitungen im Trunk, nicht deren [eigene](#leitung-zone): Sie liegen
im Träger. Wo eine Leitung in den Trunk hinein- oder aus ihm herausgeht, zählt der
Höhenunterschied als senkrechtes Stück in der Verlegelänge mit; im IFC-Export liegt der Träger auf
dieser Höhe. Anders als die Ausführung gilt die Zone nur für dieses Teilstück, nicht für die ganze
Kette – eine Kette über den Kabelschacht verbindet verschiedene Etagen.

## Kabelschacht {#kabelschacht}

Der Kabelschacht verbindet Blätter senkrecht – Steigzone, Kernbohrung, Kabelkanal zwischen
Geschossen.

1. {{befehl:werkzeug.kabelschacht}} wählen.
2. Erste und gegenüberliegende Ecke des Durchbruchs klicken.
3. Im Dialog einen **bestehenden Verbund** wählen oder einen neuen anlegen („Schacht Nord“).

Liegen beide Klicks praktisch aufeinander, entsteht ein Schacht in Standardgröße um diesen Punkt.
Derselbe Verbund wird auf jedem Geschoss an der entsprechenden Stelle platziert – damit weiß das
Programm, dass es sich um denselben Schacht handelt. Welche Etage über welcher liegt, ergibt
sich aus den Koten der Blätter, sonst aus ihrer Reihenfolge (weiter rechts liegt weiter oben) –
siehe [Etagen](#etagen).

### Leitungen und Trunks anschließen {#schacht-anschliessen}

Legen Sie ein Leitungs- oder Trunk-Ende auf dem Schacht ab, fragt der Anschlussdialog:

- **Vorhandenen Strang wählen** – die Liste zeigt je Strang Nummer, Inhalt und die Etagen, auf
  denen er schon angeschlossen ist („S2 – Trunk 2 (EG, 1. OG)“).
- **Neuen Strang anlegen** – für die Verbindung, an die auf einer anderen Etage später
  angedockt wird.

{{video:12-kabelschacht-leitung}}

**Auf der anderen Etage fortsetzen:** Rechtsklick auf eine Leitung, die am Schacht endet ›
**Auf „OG“ fortsetzen (S2 …)** wechselt auf das Blatt, zeigt dort den Durchbruch und startet das
Leitungswerkzeug gleich an diesem Strang – Sie klicken nur noch das Ziel an. Für jede Etage, auf
der der Verbund vorkommt und der Strang noch frei ist, gibt es einen eigenen Eintrag.

**Lösen:** Ein Leitungsende lässt sich nicht vom Schacht wegziehen. Rechtsklick auf die Leitung ›
**Anfang vom Kabelschacht lösen** bzw. **Ende vom Kabelschacht lösen** macht es wieder frei, bei
einem Trunk der Eintrag **Vom Kabelschacht lösen** am Trunk-Ende.

{{video:13-kabelschacht-trunk}}

Im Eigenschaften-Panel des Schachts stehen außer Name, Maßen und Drehung:

- **Verbund wechseln …** ordnet den Durchbruch einem anderen Verbund zu. Hängen schon Anschlüsse
  daran, fragt das Programm vorher: Strangnummern gelten nur innerhalb eines Verbunds, die
  Anschlüsse werden deshalb gelöst; die Enden bleiben liegen.
- **Stränge an diesem Durchbruch** mit ihrem Inhalt (siehe unten).
- **Führt weiter** nennt die Blätter darüber (↑) und darunter (↓), auf denen der Verbund
  vorkommt; ein Klick springt dorthin.

### Stränge benennen {#strang-benennen}

Ein Strang kann einen Namen tragen, etwa „Steigleitung Whg. 3“ oder „Daten 1. OG“. Sie vergeben
ihn gleich beim Anschließen: Im Anschlussdialog steht unter der Strangliste das Feld **Name des
Strangs**. Bei einem neuen Strang ist es leer, bei einem vorhandenen zeigt es dessen Namen und
ändert ihn auf Wunsch mit. Dasselbe Feld gibt es im Zieldialog, wenn eine Leitung im Bündel bis
in den Schacht läuft. Der Name ist freiwillig.

Nachträglich ändern Sie den Namen im Eigenschaften-Panel – am Kabelschacht in der Liste
„Stränge an diesem Durchbruch“ oder an der Leitung bzw. am Trunk, die am Strang hängen
(„Strang S2 (Schacht Nord)“). Übernommen wird beim Verlassen des Felds oder mit Enter. Ein Name
gilt für den ganzen Steigschacht, also auf allen Etagen.

Am Durchbruch steht der Name neben der Nummer („S2 Steigleitung Whg. 3“), auch im Ausdruck. In
Dialogen, im Panel und im Leitungsbaum folgt dahinter, was am Strang hängt. Solange kein Strang
eines Durchbruchs einen Namen hat, bleibt es dort bei der kurzen Zeile „S1 S2 S3“.

Ein Strang verbindet genau zwei Anschlüsse. Die Strecke im Schacht geht in die
[Leitungslänge](#leitungslaengen) ein. Die Geschosshöhe steht im Eigenschaften-Panel des
Schachts; haben beide Etagen eine [Kote](#geschossangaben), gilt deren Abstand – das Feld zeigt
ihn dann nur an („aus Geschossangaben“).

> Eine Leitung bleibt bis in den Schacht hinein im Bündel und wird auf der anderen Etage
> fortgesetzt. Sie zeichnen also nicht zwei getrennte Leitungen, sondern eine durchgehende.

## Inhalt von Trunk und Kabelschacht anzeigen {#inhalt-anzeigen}

Was in einem Trunk liegt oder durch einen Kabelschacht läuft, zeigt ein Rechtsklick auf den Trunk
bzw. den Schacht mit **Inhalt anzeigen …**. Ist der Trunk oder Schacht ausgewählt, steht der
Eintrag auch in der Kontextleiste unter „Aktionen“.

Oben im Dialog steht ein **Querschnitt**: Jede Leitung ist ein Kreis in ihrer Farbe mit der
Kabelnummer, ein Trunk ein Rahmen um seine Leitungen – rund bei einem Rohr, eckig bei Kanal und
Trasse. Im Kabelschacht steht je Strang eine Gruppe mit Nummer und Name. Läuft eine Leitung im
Bündel bis in den Schacht, liegt ihr Kreis im Rahmen des Trunks, ihre eigene Strangnummer steht
klein daneben. Der Querschnitt ist eine Übersicht, kein maßstäblicher Plan: Alle Kreise sind
gleich groß.

Darunter folgt die **Liste** mit Nummer, Beschreibung, den beiden Enden, Kabeltyp und Länge, beim
Trunk dazu die Teilstücke, beim Schacht der Strang. Ein Klick auf einen Kreis markiert die Zeile
und umgekehrt. **Zeigen** springt zur Leitung im Plan und wählt sie aus.

- Beim **Trunk** zeigt der Dialog die ganze Kette, auch auf anderen Etagen. Leitungen, die nicht
  durch das angeklickte Teilstück laufen, sind blasser.
- Beim **Kabelschacht** zeigt er, was durch diesen Durchbruch geht.

Im Dialog ändern Sie den Namen des Trunks, die Namen der Stränge sowie Beschreibung und Kabeltyp
jeder Leitung. Jede Änderung wirkt sofort im Plan und lässt sich einzeln rückgängig machen;
Textfelder übernehmen beim Verlassen oder mit Enter.
