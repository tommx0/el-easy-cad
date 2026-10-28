# Netzwerk, Verteiler und Steuerung

## Switches, Router, Patchpanel {#netzwerkkomponenten}

Netzwerkgeräte stehen als eigene Komponenten im Katalog. Jeder Port ist ein eigener Dockpunkt,
sodass eine Leitung nicht „an den Switch“, sondern an Port 12 geht. Im Katalog sind die Ports als
Portgruppen hinterlegt (Porttyp, Anzahl, Reihen, siehe
[Dockpunkte](#dockpunkte-grafisch)); die **Bauart** entscheidet, ob ein Gerät mit Ports als Switch
oder als Patchpanel gilt. Die Leistung, die ein Gerät über PoE bezieht, steht beim Endgerät
(**PoE-Leistungsaufnahme**), nicht beim Switch. Die Beschriftung der einzelnen Ports tragen Sie je
platziertem Switch im Port-Dialog ein.

## Ports zuweisen {#switch-ports}

Beim Zeichnen einer Leitung, die durch einen Trunk mit angeschlossenem Switch läuft, zeigt die
Statuszeile: *„Im Trunk … – Austrittspunkt anklicken“*, und in der
[Leiste mit den Tastenfunktionen](#kontextleiste) erscheint **Port-Stromkreis zuweisen**.
„Angeschlossen“ heißt: Ein Ende des Trunks oder seiner Kette ist an den Trunk-Punkt des Switches
bzw. Patchpanels angedockt – zeichnen Sie den Trunk dafür bis auf diesen Punkt, siehe
[Einen Trunk anlegen](#trunk-anlegen).

1. **Leertaste** drücken oder **Port-Stromkreis zuweisen** anklicken – der Port-Dialog öffnet sich.
2. Er zeigt je angeschlossenem Switch eine **Frontansicht** mit allen Ports; belegte Ports sind
   nicht wählbar.
3. Freien Port anklicken und **Zuweisen** – die Leitung wird damit abgeschlossen.

![Der Switch-Port-Dialog mit Frontansicht und PoE-Summe](switch-ports.png)

Nachträglich geht dasselbe über das Kontextmenü der Leitung („Port-Stromkreis zuweisen…“). Ein
**Doppelklick auf einen Switch** öffnet den Dialog als Übersicht: Belegung, PoE-Summe und die
frei beschriftbaren Ports. Im Eigenschaften-Panel der Leitung steht die Zuweisung im Klartext
(„Port-Stromkreis: Switch 1 · P12 · Blatt 2“) und lässt sich dort lösen.

## PoE-Bilanz {#poe}

Jedes angeschlossene Gerät bringt seine PoE-Leistungsaufnahme aus dem Katalog mit. Der
Port-Dialog zeigt sie je Port in der Spalte **W** („n. g.“, wenn der Katalog keinen Wert kennt)
und darüber die Summe des Switches, etwa „12 von 24 Ports belegt · PoE 62 W“. Dieselbe Summe
steht als eigene Zeile am Switch-Symbol im Plan.

Ein Budget des Switches kennt el.easy.CAD nicht: Es gibt **keinen Vergleich und keine Warnung**
bei Überlast. Prüfen Sie die Summe selbst gegen das Datenblatt des Switches.

## Verteiler: Sicherungen, Klemmen, Relais {#verteiler}

Ein Verteiler – im Katalog „Elektroverteiler / Schaltschrank“ oder jede Komponente mit der
Bauart **Verteiler** – bekommt beim Platzieren ein Ortskennzeichen wie **+UV1**. Es steht am
Symbol und lässt sich im Eigenschaften-Panel ändern. Trunks docken in der Mitte oben, unten
und an beiden Seiten an, Leitungen an den Randpunkten.

## Verteiler bestücken {#verteiler-bestueckung}

Ein **Doppelklick auf den Verteiler** (oder „Bestückung und Belegung …“ im Eigenschaften-Panel)
öffnet den Verteiler-Dialog. Die Bestückung ist ein **Baum, der den Stromweg zeigt**: ganz oben
die Einspeisung, darunter etwa eine Schmelzsicherung, dahinter ein RCD, dahinter die
Leitungsschutzschalter, dahinter ein Aktorkanal und am Ende die Klemme.

- **Netz** oben im Dialog: **Drehstrom** (L1, L2, L3, N, PE) oder **Wechselstrom** (L, N, PE). Bei
  Wechselstrom bietet der Baum nur 1- und 2-polige Geräte an – ein mehrphasiges (etwa ein
  4-poliger RCD oder ein 3-poliger Zähler) wird abgelehnt –, und der erzeugte Plan hat oben nur
  den Bus L, N und PE, die Stromkreisblätter nur die Schienen L und N. Steht im Baum doch ein
  mehrphasiges Gerät, nennt es die Zusammenfassung. Assistent und „Bestückung aus Räumen“ setzen
  die Netzart aus ihrer Wahl Drehstrom/Wechselstrom.
- **Art** daneben: **Hauptverteilung** oder **Unterverteilung**. Nur eine Hauptverteilung bekommt im
  erzeugten Plan SLS-Schalter, Blitzschutz und Zähler; eine Unterverteilung hat unten nur die
  Einspeiseklemme mit ihrer Verbindung zum Bus. Ist nichts gewählt, gilt das Kennzeichen: Beginnt
  es mit „UV“, ist es eine Unterverteilung, sonst eine Hauptverteilung.

- **+** in einer Zeile hängt etwas dahinter: **Betriebsmittel dahinter …** (Schaltplansymbol aus
  dem Katalog und Anzahl), **Stromkreise dahinter …** (Anzahl, Schutzgerät und Klemme – es
  entstehen zum Beispiel sechs LS mit je einer Klemme, Phasen reihum L1, L2, L3) oder
  **Kanal dahinter …**. Das **+** an der Einspeisung legt ganz oben an.
- Die Kennzeichen zählen je Verteiler weiter (F1, F2 …). Klemmen kommen in die Leiste **X1**
  (oder die zuletzt gewählte) und zählen dort weiter: X1:1, X1:2 … – ein mehrpoliger Block je Pol,
  eine Abgangsklemme mit L/N/PE mit einer Nummer (siehe [Klemmenleiste](#klemmen)).
- **Umhängen:** den Griff ⠿ einer Zeile auf eine andere ziehen – oben abgelegt davor, unten
  danach, in der Mitte dahinter. Ein Klick auf den Griff zeigt stattdessen die Auswahl
  „Vorgeschaltet“. Was dahinter hängt, kommt mit.
- In der Zeile ändern Sie Kennzeichen, Typ (z. B. „B16“), Phase und die **Beschriftung** – an der
  Klemme etwa „Küche Steckdosen“. Ein umbenanntes Kennzeichen nimmt die zugewiesenen Leitungen
  mit. An einer Klemme steht der ganze Name „X1:3“: „X2“ verschiebt sie in die Leiste X2 (nächste
  Nummer dort), „X1:7“ oder „7“ setzt die Nummer. Eine schon vergebene Nummer wird abgelehnt.
- **✕** entfernt einen Knoten. Hängt etwas dahinter, fragt el.easy.CAD, ob nur dieser Knoten
  gehen soll (der Rest rückt nach oben) oder alles dahinter.

**Geräte mit Kanälen:** Bei einem Schaltaktor oder einem Klemmenblock kann jeder Kanal (K1:A3)
bzw. jede Klemmstelle (X1:3) an eigener Stelle im Baum stehen – K1:A1 hinter F3, K1:A2 hinter
F4. Das Gerät selbst steht unter **Geräte mit Kanälen** und zeigt dort, welche Kanäle schon
eingeordnet sind. Angelegt wird es dort mit **+ Gerät mit Kanälen …** oder direkt über
„Kanal dahinter … › Neues Gerät …“. Auch jede **Klemmenleiste** steht hier mit ihren Nummern, so
sehen Sie Lücken auf einen Blick. **Neu nummerieren** zählt sie lückenlos ab 1 in der Reihenfolge
des Baums; die zugewiesenen Leitungen ziehen mit.

Ist ein [Verteilerplan](#verteilerplan) verknüpft, bestimmt der Plan, welche Betriebsmittel es
gibt; Einordnung, Phase und Beschriftung pflegen Sie weiter hier. Betriebsmittel, die nur im Plan
stehen, erscheinen unter **Noch nicht eingeordnet** und werden auf einen Knoten gezogen – die
Klemmen einer Leiste einzeln („-X1:3“), damit jede hinter ihr eigenes Schutzorgan kommt.
Betriebsmittel nur aus der Bestückung erscheinen grau.

Ein [KNX-Aktor](#knx-aktor) aus dem Katalog „Stromlaufplan-Symbole“ fragt beim Anlegen nach Art,
Größe und Kanalfunktionen. Unter „Geräte mit Kanälen“ ändern Sie sie mit **Kanäle bearbeiten …**.
Ein Jalousiepaar ist ein Knoten (K1:A3/A4); den Partner A4 bietet „Kanal dahinter …“ nicht
einzeln an.

## KNX-Aktoren zuordnen {#knx-zuordnen}

Wird eine Leuchte über einen KNX-Taster geschaltet, braucht ihre Klemme im Verteiler einen
Aktorkanal. **KNX-Aktoren zuordnen …** über dem Baum im Verteiler-Dialog erledigt das für alle
Klemmen auf einmal:

- **Welche Klemmen:** jede, deren Verbraucher – auch durchgeschleifte – KNX-geschaltet sind:
  mit dem Haken **KNX** neben der Ansteuerung im Eigenschaften-Panel (bei einer Gerätegruppe für
  alle Mitglieder) oder als Ziel einer [Wirkverbindung](#wirkverbindungen) eines KNX-Geräts
  (Tastsensor, Bewegungs- oder Präsenzmelder KNX, auch über eine Gerätegruppe). Im zweiten Fall
  steht der Haken gesetzt und grau, darunter der Auslöser. Drei Leuchten an einer Klemme sind ein
  Kanal. Auch Klemmen aus [Räumen](#verteiler-aus-raeumen) ohne Leitung zählen.
- **Kanalart aus der Ansteuerung:** Schalten (auch ohne Ansteuerung und an Steckdosen), Dimmen,
  Rollo bzw. Jalousie als Kanalpaar mit ungeradem ersten Kanal. DALI, RGB und Ähnliches gehen nicht
  über diese Aktoren – die Zeile sagt es. Im Dialog lässt sich die Kanalart je Klemme ändern oder
  „kein Kanal“ wählen.
- **Bemessung:** Was auf freie Kanäle vorhandener Aktoren passt, kommt dorthin. Für den Rest legt
  el.easy.CAD möglichst wenige Aktoren an – die größte Baugröße, für den Rest die kleinste
  passende – mit der eingestellten **Reserve** (Vorgabe 20 %, gemerkt). Eine Lücke vor einem
  Jalousiepaar füllt der nächste Schaltkanal.
- **Kanalname:** Vorgeschlagen wird der Name der Gerätegruppe, sonst die Beschriftung der Klemme,
  die Beschriftung des geschalteten Bauteils oder ein Name aus dem Raum. In der Spalte **Kanalname** ändern Sie ihn je Klemme – auch für einen
  schon vergebenen Kanal, der dann umbenannt wird. Leer gelassen bleibt der Kanal ohne Namen.
- **Ergebnis im Baum:** Der Kanal steht zwischen LS und Klemme (F3 → K1:A1 → X1:5) und trägt den
  Kanalnamen als Beschriftung. Hinter einem
  Jalousiepaar wird eine Abgangsklemme 1P+N+PE gegen 3P+N+PE getauscht: L1 fährt auf, L2 ab.
- **Erneut zuordnen:** Vergebene Kanäle behalten ihre Nummer. Neue Klemmen füllen freie Kanäle und
  die Reserve; Kanäle, deren Klemme kein KNX-Ziel mehr versorgt, bietet der Dialog zum Freigeben an.
- **Hinweise** stehen in der Zeile, etwa wenn eine Klemme kein Schutzorgan hat (dann bekommt sie
  keinen Kanal – erst einen LS davorsetzen) oder auch Verbraucher ohne KNX-Ziel versorgt.

**Zuordnen** ist ein Rückgängig-Schritt. Am Bauteil steht der Kanal danach mit, etwa
„UV1-F3 / K1:A1 / X1:5“. Mit verknüpftem Verteilerplan legt der Dialog keine Aktoren an, er belegt
nur freie Kanäle vorhandener. Auch der [Verteilerplan-Assistent](#verteilerplan-erzeugen) bietet
die Zuordnung an, bevor er einen Plan aus dem Verteiler des offenen Bauplans erzeugt.

## Bestückung aus Räumen {#verteiler-aus-raeumen}

Auch ohne eine einzige Leitung lässt sich ein Verteiler bestücken – aus den Räumen des Bauplans
und der Eigenschaft **Stromkreis** der Komponenten. Dazu im Verteiler-Dialog **Bestückung aus
Räumen vorschlagen …** wählen. Das geht auch, wenn schon ein Verteilerplan verknüpft ist – etwa
nachdem Sie die Leitungen gelöscht haben, um aus Räumen zu planen. Nach **Übernehmen** fragt
el.easy.CAD dann, ob der verknüpfte Plan aus der neuen Bestückung **neu erzeugt** werden soll. Dabei
wird sein Inhalt ersetzt: Eigene Änderungen im Plan gehen verloren, und Rückgängig im Bauplan
erreicht den Plan nicht. Lehnen Sie ab, bleibt der Plan, wie er ist, und der Verteiler-Dialog zeigt
grau, was ihm fehlt.

**Stromkreis einer Komponente** (Eigenschaften-Panel, auch für mehrere auf einmal):

| Wert | Bedeutung |
|---|---|
| Vorgabe | aus dem Katalog, sonst Raumstromkreis bei Verbraucher und Anschlussdose, sonst kein |
| kein | gehört zu keinem Stromkreis – etwa Netzwerkdose, Taster, KNX-Sensor |
| Raumstromkreis | ein gemeinsamer Stromkreis für alle so eingestellten Komponenten des Raums |
| Nummer 1 … 99 | ein weiterer Stromkreis im Raum; gleiche Nummer im selben Raum = derselbe Stromkreis |
| eigener Stromkreis | ein LS nur für dieses Gerät, mit **Polzahl** 1~ oder 3~ (Durchlauferhitzer, Herd) |

Der Raumstromkreis ist nicht „Nummer 1“: Küche, Küche 1 und Küche 2 sind drei Stromkreise.
Kleine Räume teilen sich einen Stromkreis über **Raumstromkreis gemeinsam mit** im
Eigenschaften-Panel des [Raums](#raeume) – WC und Abstellraum „gemeinsam mit Flur“ ergeben eine
Klemme „Flur, Abstellraum, WC“. Durchlauferhitzer, Wärmepumpe, Saunaofen und Herdanschlussdose
stehen im mitgelieferten Katalog auf „eigener Stromkreis, 3~“. Ein eigener Stromkreis heißt nach
Raum und Gerät („Küche Durchlauferhitzer“); hat das Bauteil eine Beschriftung, heißt er wie sie.
Ebenso nimmt ein KNX-Kanal ohne Gerätegruppe die Beschriftung des Bauteils vor dem Raumnamen.

**Der Dialog** zeigt die Räume des Bauplans je Blatt mit Haken (dazu „ohne Raum“ für Komponenten
außerhalb jedes Raums); die Auswahl merkt sich der Verteiler. Ein Raum, den schon ein anderer
Verteiler versorgt, ist gesperrt. Darunter Art, Netz, Einspeiseklemme und – nur bei einer
Hauptverteilung – SLS-Schalter, Blitzschutz (parallel), Zähler und Sicherung nach dem Zähler (alles
nur bei leerer Bestückung), **Ein RCD je Blatt** samt Typ, der Typ der LS und **KNX-Aktoren gleich
zuordnen** mit Reserve. Die Tabelle zeigt jeden Stromkreis mit seinen Bauteilen und dem Ergebnis,
etwa „F4 / X1:2“.

- Je Blatt ein **RCD**, beschriftet mit dem Blattnamen; dahinter je Stromkreis ein **LS** mit
  einer **Klemme** 1P+N+PE (3~: LS 3-polig, Klemme 3P+N+PE). Die Phasen gehen reihum.
- **KNX:** Eine KNX-geschaltete Gerätegruppe oder Leuchte ohne Gruppe bekommt hinter dem LS ihres
  Raums eine eigene Klemme mit Aktorkanal davor – wie bei [KNX-Aktoren zuordnen](#knx-zuordnen).
  Konventionell geschaltete Leuchten hängen einfach an der Klemme des Raums.
- **Erneut vorschlagen:** Was schon da ist, bleibt mit Kennzeichen, Beschriftung und Platz im
  Baum; nur Neues kommt dazu. Knoten, deren Raum oder Komponente fehlt oder abgewählt ist, stehen
  unter „Nicht mehr gebraucht“ zum Entfernen bereit. Von Hand angelegte Knoten bleiben immer.

**Übernehmen** ist ein Rückgängig-Schritt. Danach kennen die Bauteile ihren
[Stromkreis](#stromkreis-zuordnung), obwohl keine Leitung zum Verteiler führt.

## Leitungen im Verteiler anschließen {#verteiler-anschliessen}

- Docken Sie eine Leitung an einem Verteiler an, fragt der Verteiler-Dialog gleich, worauf sie
  landet. „Ohne Anschluss übernehmen“ lässt sie nur angedockt.
- Läuft sie durch einen Trunk, an dem ein Verteiler hängt, öffnet die **Leertaste** den Dialog
  „Ziel der Leitung“ mit der Rubrik **Verteiler** – wie beim [Switch-Port](#switch-ports).
- Der Dialog zeigt den Baum mit einem **Suchfeld**: „küche“ oder „X5“ lässt nur die passenden
  Knoten samt ihrem Weg stehen. Klemmen stehen fett mit ihrer Beschriftung.
- Wählen Sie **einen Knoten** – meist die Klemme. Sicherung, RCD, Vorsicherung, Aktorkanal und
  Phase ergeben sich aus dem Baum; unter der Auswahl steht die Kette, etwa
  „X6 → F4 · RCD F2 · L2“. Mehrere Knoten sind möglich (ein Rollladen auf zwei Kanäle), je
  Auswahl lässt sich eine Ader angeben. Auf einem Knoten dürfen beliebig viele Leitungen liegen.
- Nachträglich: Rechtsklick auf die Leitung → „Im Verteiler anschließen …“ oder im
  Eigenschaften-Panel **Ändern …** bzw. **Lösen**.

## Stromkreis an den Bauteilen {#stromkreis-zuordnung}

Wer eine Leitung auf X6 legt, hat damit auch Stromkreis, RCD und Phase zugewiesen. Die Bauteile
am anderen Ende bekommen diese Zuordnung automatisch – auch durchgeschleifte: Geht W12 vom
Verteiler zur ersten Steckdose und W13 von dort zur zweiten, gehören beide zu F4. Die Weitergabe
hört am nächsten Verteiler (oder Switch) auf; ein Bauteil an zwei Stromkreisen nennt beide.

| Wo | Was | Abschalten |
|---|---|---|
| Am Symbol | Zeile „UV1-F4 / X6“, mit Aktorkanal „UV1-F4 / K1:A1 / X6“ | {{befehl:blatt.anzeige-stromkreis}}, je Komponente im Eigenschaften-Panel |
| Am Leitungsschild | „12 → UV1-X6 (F4)“ | {{befehl:blatt.anzeige-stromkreis-schild}} |
| Eigenschaften-Panel | „Stromkreis: UV1-F4 / X6 · RCD F2 · L2“ | Einstellungen › Verteiler |
| [Leitungsliste](#leitungsliste), Excel | Spalte „Stromkreis“ | je Leitungsliste im Eigenschaften-Panel |

Auch der IFC-Export fasst je Stromkreis alle zugeordneten Geräte zusammen.

**Ohne Leitung:** Wurde die Bestückung [aus Räumen](#verteiler-aus-raeumen) vorgeschlagen, kennt
jede Klemme ihren Raum und Stromkreis bzw. ihre KNX-Gruppe. Bauteile ohne Leitung zum Verteiler
bekommen ihre Zuordnung daher von dort; eine Leitung geht immer vor. Weitergegeben wird diese
Zuordnung nicht.

**Nur, solange es den Knoten gibt:** Die Anzeige folgt jeder Änderung. Löschen Sie Knoten oder
den ganzen Baum im Verteiler-Dialog, verschwindet die Zeile an den Bauteilen. Liegt eine Leitung
noch auf einem Kennzeichen, das es nicht mehr gibt, ordnet sie nichts mehr zu; der Verteiler-Dialog
nennt sie unter „Zugewiesen, aber nicht vorhanden“. Ist ein Verteilerplan verknüpft, zählt nur,
was der Plan noch hat: Löschen Sie dort eine Sicherung, eine Klemme oder alle Symbole, fällt auch
die Zuordnung der Bauteile dahinter weg.

## Verteilerplan verknüpfen {#verteilerplan}

Ein Verteilerplan ist eine Schaltplan-Zeichnung für genau einen Verteiler. Verknüpft ist, was
dasselbe Kennzeichen trägt:

- im Bauplan im Verteiler-Dialog **Vorhandenen Schaltplan zuordnen …** wählen und den Schaltplan
  aus der Liste nehmen – das Kennzeichen wird in den Schaltplan eingetragen; Rückgängig im Bauplan
  erreicht das nicht, gelöst wird die Zuordnung im Schaltplan. Ein Schaltplan, der schon einem
  anderen Verteiler gehört, steht mit „(Verteilerplan für +UV2)“ in der Liste; wählen Sie ihn,
  heißt der Knopf **Umhängen**, und der andere Verteiler hat danach keinen Plan mehr,
- im Schaltplan in den Blatt-Eigenschaften **Verteilerplan für** (z. B. „+UV1“) eintragen,
- beim Anlegen unter „Neue Zeichnung“ die Art **Verteilerplan für +UV1** wählen – angeboten für
  die Verteiler des gerade offenen Bauplans –, oder
- am Verteiler das Kennzeichen eines vorhandenen Verteilerplans eintragen.

Im Verteilerplan steht dann unter jedem Symbol – meist der Klemme, dem letzten Bauteil der
Spalte – die **Zielbezeichnung**: die Leitungen aus dem Bauplan mit ihrem Ziel („W12 NYM-J 3x1,5 ·
Küche“). Als Ziel steht die Beschriftung der Komponente, ohne Beschriftung ihr Name aus dem
Katalog. Die Zielbezeichnung steht waagrecht und auf Spaltenbreite umgebrochen oder senkrecht (siehe unten). Liegen Leitungen auf verschiedenen
Klemmstellen, steht die Klemmstelle davor („1: W4 …“). Liegt eine Leitung auf einem Kontakt oder
einer Sicherung, hinter der nur noch eine Klemme hängt, steht sie an dieser Klemme.
{{befehl:blatt.anzeige-abgaenge}} blendet die Texte aus.

Die Zielbezeichnung lässt sich anpassen: Ziehen verschiebt sie (eine gestrichelte Linie führt dann
zum Symbol), im Eigenschaften-Panel des Symbols stellen Sie Schrifthöhe und Breite ein oder
schreiben einen eigenen Text. Ohne eigenen Text folgt sie jeder Änderung im Bauplan;
**Wieder automatisch**, **Lage zurücksetzen** und **Größe zurücksetzen** heben die Anpassungen auf.

**Lage:** Unter **Zielbezeichnung** im Eigenschaften-Panel wählen Sie zwischen *waagrecht unter
dem Symbol*, *senkrecht* und *links neben dem Symbol, unter dem Kennzeichen*, auch für mehrere
ausgewählte Symbole auf einmal. Links steht der Text rechtsbündig am Symbol, gleich unter
Kennzeichen und Querverweis („-K1“, „K1: Blatt 2-A2“) – so setzt ein neu erzeugter Verteilerplan
die Beschriftung an Kontakten und Leitungsschutzschaltern, unter denen sie sonst auf der Leitung
zur Klemme läge. Umgebrochen wird dort auf 0,72 m, die Breite lässt sich ändern.

**Senkrecht:**
Senkrecht ist der ganze Text um 90° nach links gedreht und von unten nach oben zu lesen. Alle
senkrechten Zielbezeichnungen eines Blattes beginnen auf derselben Höhe knapp über dem unteren
Rand des Koordinatennetzes und reichen höchstens bis kurz unter ihr Symbol – steht ein anderes
Symbol dazwischen, bis unter dieses. Ist ein Text länger, bricht er um, die nächste Zeile steht
rechts daneben. So überschneiden sich Text und Klemme nicht, und der Text hat viel mehr Platz.
Ein neu erzeugter Verteilerplan beschriftet seine Klemmen gleich senkrecht. Ist unter dem Symbol
zu wenig Platz, steht der Text waagrecht.
Rechtsklick auf ein Symbol → **Abgänge im Bauplan zeigen** öffnet den Bauplan mit diesen
Leitungen ausgewählt. Die [Betriebsmittelliste](#betriebsmittelliste) meldet Kennzeichen, die im
Bauplan zugewiesen sind, im Plan aber fehlen.

Zugewiesen wird immer im Bauplan, wo die Leitung liegt; der Verteilerplan liest nur.

## Verteilerplan erzeugen {#verteilerplan-erzeugen}

Den Plan erzeugt der **Verteilerplan-Assistent**. Er öffnet sich an drei Stellen:

- im Verteiler-Dialog des Bauplans ohne verknüpften Plan mit **Verteilerplan erzeugen …** –
  der Inhalt kommt dann aus diesem Verteiler,
- in der Projektübersicht mit **Verteilerplan-Assistent …** neben „Neue Zeichnung …“,
- über {{befehl:datei.verteilerplan-assistent}} im offenen Projekt.

Aus der Projektübersicht und dem Menü fragt der erste Schritt, woher der Inhalt kommt: aus einem
**Verteiler eines Bauplans** des Projekts, **Aus Räumen eines Bauplans** oder **Neu
zusammenstellen** – ganz ohne Bauplan. Aus Räumen folgt der Dialog aus
[Bestückung aus Räumen](#verteiler-aus-raeumen) als zweiter Schritt, danach der Baum. Der
Bauplan wird dabei nur gelesen; die Zuordnung an seinen Bauteilen entsteht erst, wenn ein
Verteiler dort den Baum übernimmt. Neu zusammengestellt geht es so weiter:

1. **Startbaum:** Hauptverteilung oder Unterverteilung (dieselbe Wahl wie **Art** im letzten
   Schritt), Drehstrom oder Wechselstrom, Einspeiseklemme; nur bei einer Hauptverteilung
   SLS-Schalter, Blitzschutzableiter (parallel zwischen Klemme und SLS), Zähler und Sicherung nach
   dem Zähler (alle ab Werk angehakt). Eine Unterverteilung beginnt mit der Klemme, die RCDs hängen
   gleich dahinter. Dazu Anzahl RCD und LS je RCD
   samt Typ (leer = Vorgabe des Katalogs), je LS eine Abgangsklemme. Ändern Sie die Vorgabe
   später noch einmal, baut „Weiter“ den Baum neu auf.
2. **Baum:** derselbe Editor wie im Verteiler-Dialog – Beschriftungen, Typen, Phasen, weitere
   Stromkreise, Kontakte und Kanäle, Knoten verschieben.

Im letzten Schritt schlägt der Assistent aus **Art** (Hauptverteilung +HV, Unterverteilung +UV),
**Etage**, **Wohnung** und **Verwendung** das Kennzeichen und den Namen vor, etwa „+UV.OG1.WE2“
und „Unterverteilung OG1 WE 2 – Garage/Wallbox (+UV.OG1.WE2)“. Ist das Kennzeichen im Projekt
schon vergeben, zählt die Art weiter (+UV2.OG1.WE2). Beides lässt sich ändern;
**Vorschlag übernehmen** setzt es wieder auf den Vorschlag. Kommt der Inhalt aus einem Bauplan,
bleibt das Kennzeichen des Verteilers – nur so bleibt der Plan mit ihm verknüpft. Darunter
stehen höchstens Sicherungen und höchstens Klemmen je Blatt, die **Aufteilung** (beides gemerkt)
und eine Vorschau aller Blätter; **Erzeugen** legt den Plan als neues Dokument im Projekt an.

Die **Aufteilung** bestimmt, was mit einem RCD geschieht, der nicht mehr ganz auf das angefangene
Blatt passt:

- **Neues Blatt, wenn ein RCD nicht mehr ganz passt** (Vorgabe): Er kommt samt seinen
  Stromkreisen auf das nächste Blatt. Zwei kleine RCDs teilen sich weiter ein Blatt.
- **Platzsparend fortlaufend:** Er beginnt im freien Rest des Blatts mit so vielen Stromkreisen,
  wie dort passen, und geht auf dem nächsten Blatt weiter. Seine Leiter laufen am rechten Rand
  hinaus und kommen links mit Blattverweis wieder herein. Passt neben ihm nicht einmal ein
  Stromkreis, beginnt er auf dem nächsten Blatt.

Ein neu zusammengestellter oder aus Räumen vorgeschlagener Baum bleibt im Plan gemerkt, samt
Bauplan und Raumauswahl. {{befehl:datei.verteilerplan-assistent}}
in diesem Plan öffnet ihn wieder und erzeugt daraus einen weiteren Plan – der alte bleibt, wie er
ist. Setzen Sie im Bauplan einen leeren Verteiler mit demselben Kennzeichen, bietet sein Dialog
**Baum übernehmen** an.

- Oben laufen die Schienen L1, L2, L3 und N, die Schiene PE liegt direkt über den Klemmen. Über
  ihre Namen sind sie mit den Schienen der anderen Blätter verbunden. Die Klemmen sitzen weit
  unten, so bleibt über ihnen Platz für weitere Bauteile.
- Die Schienen kommen links mit ihrem Namen herein, der vor der Leitung auf ihrer Höhe steht.
  Braucht ein späteres Blatt eine Schiene noch, läuft sie bis zum rechten Rand durch – auch über
  ein Blatt, auf dem nichts an ihr hängt. An beiden Enden zeigt ein Pfeil mit Blattnummer und
  Spalte, wo sie weitergeht, etwa „/1.H ◄ L1“ links und „► /3.A“ rechts; ebenso am Bus der
  Einspeisung und an der Schiene PE.
- Die Leiter tragen ihre Aderfarben: Alles, was am N hängt, ist blau – Schiene N, der N hinter
  einem RCD, die N-Leitung über der Schiene PE und die Stiche zu den Klemmen und Spulen. Der PE
  ist grün-gelb, die Außenleiter bleiben schwarz.
- Die Leiter eines Systems – Schienen, Sammelleitungen hinter einem RCD, Ausgang der Einspeisung –
  liegen überall ein halbes Raster auseinander. Tote Enden gibt es nicht: Jeder Leiter endet an
  seinem letzten Abzweig, außer die Schiene läuft auf das nächste Blatt weiter. Am ersten und
  letzten Abzweig ist die Leitung eine Ecke ohne Verbindungspunkt.
- Der Aufbau folgt dem Baum der Bestückung: je Stromkreis eine Spalte mit der Sicherung, je
  Kontakt ein Zweig mit seinen Klemmen darunter, Klemmen direkt an der Sicherung daneben – auch
  Klemmen, auf denen noch keine Leitung liegt. Die Klemmennummern kommen unverändert aus der
  Bestückung: eine Klemme der Leiste (X1:3) wird als einpolige Klemme gezeichnet, eine
  Abgangsklemme mit L/N/PE mit ihrem eigenen Symbol und ihrer Nummer. Einpolige Klemmen hinter
  einem dreipoligen Schutzgerät liegen der Reihe nach an L1, L2 und L3.
- Ein Kontaktblock aus dem Katalog erscheint mit seinem eigenen Symbol und allen Polen – ein
  dreipoliger Hauptkontakt also dreipolig; ein Aktorkanal als einfacher Schließer mit dem Kanal
  als Anschluss. Eine Relaisspule hinter einem Kontakt steht unter ihm in einer eigenen Reihe über
  der Schiene PE: A1 am Kontakt, A2 auf N. Unter der Schiene PE stehen nur Klemmen.
- RCD und Vorsicherungen stehen über ihrer Gruppe, verschachtelt in eigenen Reihen. Ihre Ausgänge
  werden Sammelleitungen vom ersten bis zum letzten Abzweig; zwischen Symbol und erster
  Sammelleitung bleibt Platz für die Beschriftung. Ein Pol, an dem nichts hängt (alle Stromkreise
  auf L1), bleibt offen. Der Typ („63/0,03A Typ A“) steht über dem Symbol, links vor dem ersten
  Pol.
- N und PE der Klemmen sind angeschlossen: Über der Schiene PE liegt eine N-Leitung, an der jede
  Klemme mit einem kurzen Stich hängt. Eine einzige Leitung verbindet sie mit dem N darüber –
  hinter einem RCD mit seinem N („N-F1“), möglichst gerade unter dessen N-Ausgang, sonst mit der
  Schiene N. Hat das Schutzgerät selbst einen N (FI/LS, LS 1+N, vierpolig), kommt er direkt von
  dessen N-Ausgang. Ein vierpoliger Hauptkontakt schaltet den N mit, Spulen hängen mit A2 an der
  N-Leitung darunter. Der PE jeder Klemme hängt an der Schiene PE. Nur wo keine Leitung an den
  Symbolen vorbei führt, trägt die N-Leitung ihren Namen bzw. steht ein kurzer, benannter
  Stummel – der Name verbindet sie.
- Klemmen aus einer Bestückung von vor Version 0.10.26 haben noch je ein eigenes Kennzeichen (X1,
  X2, X3 …). Der Dialog bietet dann an, sie in die Klemmenleiste zu überführen – die Nummer bleibt
  (X7 wird X1:7), die Zuweisungen der Leitungen ziehen mit. Dasselbe geht in der Bestückung über
  den Knopf **In Klemmenleiste -X1 überführen**.
- Der Plan bleibt auf der Zeichenfläche. Passt eine Gruppe – ein RCD mit seinen Stromkreisen –
  nicht mehr auf das Blatt, kommt sie ganz auf das nächste. Ist sie allein breiter als ein Blatt
  oder hat sie mehr Sicherungen bzw. Klemmen als je Blatt eingestellt, wird sie geteilt: Der RCD
  steht mit so vielen Stromkreisen, wie passen, auf dem ersten Blatt, der Rest auf den folgenden.
  Seine Sammelleitungen tragen dann Namen nach Pol und Gerät („L1-F1“, „N-F1“), laufen bis zum
  rechten Rand („► /3.A“) und kommen auf dem nächsten Blatt links wieder herein („/2.H ◄ L1-F1“).
  Ein RCD unter einer Vorsicherung, der auf ein leeres Blatt passt, wandert ganz auf das nächste.
- Die erste Spalte steht etwas vom linken Rand ab, damit Kennzeichen, Querverweis und
  Beschriftung links neben Sicherung und Kontakt auf dem Blatt bleiben. Unter den Klemmen bleibt
  Platz für ihre senkrechte Zielbezeichnung; wird es unten zu eng (viele Kopfebenen und Spulen),
  rücken die Klemmen höher. Reicht auch das nicht (sehr hohe Klemmen), sagt es die
  Zusammenfassung; verschieben Sie dann von Hand.
- Die Einspeisung steht immer auf einem eigenen ersten Blatt. Hängt im Baum alles hinter einem
  Hauptschalter oder einer Vorsicherung, ist das diese Kette. Hat der Baum keine (etwa weil die
  RCDs direkt an der Einspeisung hängen), legt der Plan die Standardkette an: bei einer
  Hauptverteilung 5-polige Klemme -X0, 4-poliger SLS-Schalter mit einem 4-poligen
  Blitzschutzableiter parallel davor, 3-poliger Zähler, 3-polige Schmelzsicherung; bei einer
  Unterverteilung nur die 5-polige Klemme, jeder Pol direkt auf den Bus. Sie bekommt die nächsten freien Kennzeichen (etwa -F15, -F16,
  -P1, -F17), steht nur im Plan und nicht in der Bestückung – wer sie nicht braucht, ändert oder
  löscht das Blatt. Die Einspeisung kommt von unten: unten die Einspeiseklemme, darüber die Geräte
  in der Reihenfolge des Baums (etwa SLS, Zähler, Schmelzsicherung), oben der Bus L1, L2,
  L3, N und PE. Er liegt auf der Höhe der Schienen der übrigen Blätter und ist über die Namen mit
  ihnen verbunden. Legen Sie die Klemme im Baum ganz oben an der Einspeisung an, wird sie
  verwendet; sonst ergänzt der Plan eine -X0 und sagt es in der Zusammenfassung. Ein Ableiter
  (Überspannungs- oder Blitzschutzableiter) ohne Knoten darunter, der im Baum neben einem Glied
  der Kette hängt, steht **parallel**: rechts neben der Kette, jeder Pol mit einem Abzweig auf die
  Leitung vom Glied davor zum nächsten, sein PE auf den PE. Der N läuft an
  einem Gerät ohne N-Pol (etwa einer 3-poligen Sicherung) vorbei weiter, der PE der Klemme neben
  den Geräten hinauf auf den Bus.
- Die Beschriftungen der Bestückung erscheinen im Plan als erste Zeile an ihrem Symbol, mit
  {{befehl:blatt.anzeige-abgaenge}} ein- und ausblendbar.
- Relais und Aktoren stehen auf einem eigenen Blatt, in der Spalte ein Kontakt mit Querverweis.
  Ist das Blatt voll, geht es auf einem weiteren weiter.
- [KNX-Aktoren](#knx-aktor) stehen als ganze Blöcke auf eigenen **Aktorblättern** hinter den
  Stromkreisen, untereinander, so viele wie passen. In der Spalte steht jeder Kanal wie bei einem
  Relais als Schließer „-K1“ mit dem Anschluss „A1“ zwischen LS und Klemme, durchgehend
  verdrahtet – ohne Verbinder. Ein Kanal eines **Dimmaktors** steht als **Triac** da, so wie ein
  Dimmer tatsächlich schaltet. Ein Jalousiepaar ist ein Kontaktblock mit zwei Schließern (A3, A4),
  die L1 (Auf) und L2 (Ab) seiner Klemme 3P+N+PE speisen. Unter jedem Kanal des Aktors steht der
  Querverweis auf seinen Kontakt („/1.B“), am Kontakt der Rückverweis auf den Aktor. Auf dem
  Aktorblatt ist nichts verdrahtet, auch nicht KNX+, KNX-, L und N. Die Beschriftungen der Kanäle
  kommen live aus dem Bauplan; die Abgänge stehen am Kontakt und an der Klemme, nicht unter dem
  Aktor. Die Zusammenfassung nennt die Aktoren samt belegter und freier Kanäle.

Erzeugt wird einmal: Danach ist der Plan eine gewöhnliche Zeichnung, Änderungen an der Bestückung
arbeiten Sie dort von Hand nach.

## Wirkverbindungen {#wirkverbindungen}

{{video:09-wirkverbindung}}

Nicht jede Beziehung ist ein Kabel: Ein Taster wirkt auf eine Leuchte, ein Bewegungsmelder auf
eine Gruppe. {{befehl:werkzeug.wirkverbindung}} zeichnet diese logische Verbindung – Quelle
anklicken, Ziel anklicken. Sie erscheint gestrichelt im Plan und geht in die
[Steuerungslogik](#steuerungslogik) ein, nicht in die Leitungsliste.

Ob eine Komponente Quelle sein kann, hängt von ihrem **Gerätetyp** im Eigenschaften-Panel ab:

| Gerätetyp | Eigene Slots (Quelle) | Übliches Ziel | Ansteuerung |
|---|---|---|---|
| Bediengerät | ja, als Matrix | – | – |
| Systemgerät | ja | ja | – |
| Sensor | ja | – | – |
| Aktor | ja | – | ja |
| Anzeige | ja | – | – |
| Verbraucher | – | ja | ja |
| Anschlussdose | – | ja | – |
| Betriebsmittel, Erzeuger, Sender, Empfänger, Übertrager, PC, Server | – | – | – |

Die Tabelle zeigt die mitgelieferte Einstellung. Welche Gerätetypen es gibt und was sie können,
kann ein Bibliotheksupdate erweitern. Hat ein Typ danach keine eigenen Slots mehr, bleiben die
schon angelegten Slots einer Komponente erhalten und weiter sichtbar – nur neue lassen sich dann
nicht mehr hinzufügen.

**Ein Slot, mehrere Ziele, eine Gruppe:** Bekommt ein Slot ein zweites Ziel – mit dem Werkzeug,
im Eigenschaften-Panel, in der Slot-Matrix oder im Dialog nach einer Leitung –, fasst el.easy.CAD
die Ziele zu einer [Gerätegruppe](#geraetegruppen) zusammen, auch wenn sie verschiedene Typen
haben. Ein Dialog fragt Name (vorbelegt aus Raum und Ansteuerung, etwa „Licht Flur“), Ansteuerung
und KNX ab; danach zeigt der Slot nur noch auf die Gruppe, ebenso jeder andere Slot, der auf eines
der Mitglieder zeigte. „Abbrechen“ verwirft die neue Wirkverbindung. Zeigt der Slot schon auf eine
Gruppe, tritt das neue Ziel ihr ohne Rückfrage bei. Nur zwei verschiedene Gruppen an einem Slot
bleiben nebeneinander stehen.

Zeigt ein Slot auf einen Typ, der kein übliches Ziel ist, markiert das Programm die Verbindung
als „Unübliche Kombination“ – erlaubt bleibt sie trotzdem. Wechseln Sie eine Komponente auf einen
Typ ohne eigene Slots, fragt das Programm nach, bevor vorhandene Slots verloren gehen.

Die gestrichelten Linien zeigt das Programm, sobald Sie eine beteiligte Komponente auswählen.
Linien zwischen zwei Bediengeräten – etwa zu einem zweiten Taster, der dieselbe Leuchte schaltet –
sind immer grau, die Linien zu den geschalteten Verbrauchern farbig.
In dicht belegten Plänen stören sie dabei manchmal mehr, als sie zeigen: Mit
{{befehl:blatt.anzeige-wirkverbindungen}} blenden Sie sie für das ganze Blatt aus – die kleinen
Slot-Grafiken an den Komponenten bleiben sichtbar. Der Schalter steht im Menü **Blatt** und
lässt sich wie die Beschriftungs-Schalter in die Symbolleiste legen.

### Gleich beim Verlegen der Leitung {#wirkverbindung-aus-leitung}

Verbindet eine Leitung zwei Geräte mit Gerätetyp, fragt el.easy.CAD gleich danach, was daraus
folgen soll – geschaut wird nur auf die beiden Enden dieser einen Leitung. Läuft sie durch einen
Kabelschacht oder endet sie im Trunk, zählt das Gerät am anderen Ende (auf der anderen Etage bzw.
am Switch-Port):

- **Schalter → Leuchte** (Quelle mit Slots → übliches Ziel): Sie wählen den Slot, vorgewählt ist
  der erste freie; bei einer Slot-Liste geht auch „Neuer Slot“. Hängen weitere Schalter per
  Leitung an diesem Schalter (Wechsel- oder Kreuzschaltung), stehen sie mit eigener Slotwahl
  darunter und sind vorab angehakt. Steht die Leuchte in einer Gerätegruppe, wählen Sie, ob die
  Gruppe oder nur diese Leuchte das Ziel ist. Ein Slot ohne Bezeichnung bekommt die aus dem Feld
  „Slot-Bezeichnung“, vorbelegt aus Raum und Ansteuerung, etwa „Licht Flur“ (Schalten, Dimmen,
  DALI, RGB) oder „Rollo Flur“ (Rollo, Jalousie). Hat der gewählte Slot schon ein Ziel, zeigt der Dialog
  zusätzlich Name, Ansteuerung und KNX der Gerätegruppe, die dabei entsteht.
- **Melder → Melder** (zwei Geräte mit Slot-Liste, etwa Sensoren): Hat einer schon einen Slot mit
  Zielen, kann ein Slot des anderen dieselben Ziele bekommen. Zwischen zwei Befehlsgeräten
  (Schalter, Taster) kommt kein Dialog – deren Slots stellen Sie am Gerät selbst ein.
- **Leuchte → Leuchte** (gleicher Typ ohne eigene Slots, mit Ansteuerung – ab Werk die
  Verbraucher): Beide kommen in eine Gerätegruppe
  (Name vorbelegt aus dem Raum, Ansteuerung und KNX aus den Leuchten, im Dialog änderbar), oder die
  eine tritt der Gruppe der anderen bei. Zeigte ein Slot
  auf eine der beiden, zeigt er danach auf die Gruppe – so wird die andere mitgeschaltet. Stehen
  beide schon in verschiedenen Gruppen, legt el.easy.CAD nichts an und sagt das in einer Meldung.
  Anschlussdosen (Steckdosen, Antennen-, EDV-, Herddosen) und andere Typen ohne Ansteuerung bilden
  beim Verkabeln keine Gruppe.

Beispiel: Wechselschalter → Wechselschalter, dann zur ersten Leuchte, dann zur zweiten – am Ende
schalten beide Wechselschalter die Gruppe beider Leuchten. Gibt es nichts anzulegen, kommt kein
Dialog. „Anlegen“ ist ein eigener Rückgängig-Schritt, die Leitung bleibt. Abschalten lässt sich die
Frage in den Einstellungen unter „Gruppen und Wirkverbindungen“; per **Rechtsklick an der Leitung
› Gruppe/Wirkverbindung anlegen …** geht es jederzeit.

### Über Etagen hinweg {#wirkverbindungen-etagen}

Ein Taster im Erdgeschoss darf auch eine Leuchte im Obergeschoss schalten – jede Etage ist ein
eigenes Blatt. Klicken Sie mit {{befehl:werkzeug.wirkverbindung}} die Quelle an, wechseln Sie dann
über die Blatt-Reiter auf die andere Etage und klicken Sie dort die Ziele an. Das Werkzeug merkt
sich die Quelle über den Wechsel hinweg; am Mauszeiger steht, von welcher Komponente die
Verbindung ausgeht. Mit Rechtsklick oder Enter schließen Sie ab und bleiben auf dem aktuellen Blatt.

Weil keine Linie auf ein anderes Blatt reicht, steht bei einer ausgewählten Komponente stattdessen
ein **Verweis** unter dem Symbol: „→ OG: Leuchte Flur" für eine Verbindung, die von hier ausgeht,
„← EG: Taster T1" für eine, die hier ankommt. Ein Klick auf den Verweis springt auf die andere
Etage und wählt das Gegenüber aus. Die Verweise folgen demselben Schalter wie die Linien und
erscheinen nicht im Ausdruck.

Bei einer ausgewählten Komponente zeigt eine kleine Grafik neben dem Symbol ihre Slots. Zeigen Sie
mit der Maus darauf, wird sie vergrößert, und unter der Grafik steht der Name des Slots unter dem
Zeiger. Ein **Klick auf einen Slot** markiert die von ihm angesteuerten Verbraucher auf dem Blatt
gelb – so sehen Sie auf einen Blick, was an dieser Taste hängt. Ein Klick auf denselben Slot nimmt
die Markierung zurück, ein Klick auf einen anderen wechselt sie; es ist immer nur ein Slot
markiert. Die Markierung ist nur auf dem Bildschirm zu sehen, nicht im Ausdruck.

## Slot-Matrix und Ansteuerung {#slot-matrix}

Die Slots eines Geräts – die Tasten eines Tasters, die Kanäle eines Aktors – und ihre Ziele
bearbeiten Sie im Eigenschaften-Panel unter **Typ, Slots und Gerätegruppe**. Die Zuordnung
erscheint in der [Steuerungslogik-Einlage](#steuerungslogik) und im Excel-Export – der Elektriker
sieht damit ohne Rückfrage, was worauf wirkt.

- **Slot-Liste** (Systemgerät, Sensor, Aktor, Anzeige): je Slot eine **Bezeichnung** und seine
  Ziele. Unter **Ziel suchen …** / **Ziel wählen …** fügen Sie eine Komponente oder eine
  Gerätegruppe der ganzen Zeichnung hinzu, **×** entfernt ein Ziel. **+ Slot hinzufügen** legt
  einen weiteren Slot an.
- **Slot-Matrix** (Bediengerät): Das Panel zeigt ein kleines Raster der Wippen. Ein Klick darauf
  öffnet den Dialog **Slot-Matrix bearbeiten**: oben **Spalten (Standard)** und **Zeilen
  (Fächer)**, daneben je Reihe 1 oder 2 Spalten. Ein Klick auf eine Zelle zeigt darunter
  Bezeichnung und Ziele dieses Slots. Belegte Zellen sind hervorgehoben.
- **Ansteuerung** (Aktor, Verbraucher): wie das Ziel angesteuert wird, etwa Schalten, Dimmen,
  Dali oder Jalousie; daneben der Haken **KNX** (auch bei Anschlussdosen). In einer Gerätegruppe
  gilt beides für die ganze Gruppe.
- **Wird angesteuert von** steht oben, sobald ein Slot einer anderen Komponente auf diese zeigt:
  Quelle und Slot, nur zum Ansehen. Geändert wird an der Quelle.

Hat eine Quelle mehr als einen Slot, fragt das Werkzeug {{befehl:werkzeug.wirkverbindung}} nach
dem Klick auf die Quelle im Dialog **Slot wählen**, welcher Slot die neue Verbindung bekommt – bei
einem Bediengerät als Raster, sonst als Liste; die Zahl an einem Slot nennt seine vorhandenen
Ziele. Bei genau einem Slot entfällt die Frage.
