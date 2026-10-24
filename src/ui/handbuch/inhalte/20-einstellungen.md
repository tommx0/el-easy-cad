# Einstellungen

{{befehl:extras.einstellungen}} öffnet die Programmeinstellungen. Sie gelten für das Gerät, nicht
für die einzelne Zeichnung – bis auf den Abschnitt „Leitungen (diese Zeichnung)“.

## Die Abschnitte im Einzelnen {#einstellungen-abschnitte}

Die Einstellungen sind auf Reiter verteilt:

| Reiter | Abschnitt | Was Sie dort einstellen |
|---|---|---|
| Allgemein | Sprache | Sprache der Oberfläche: wie das Betriebssystem, Deutsch oder English – wirkt sofort; die Sprache eines Plans ist davon getrennt, siehe [Plansprache](#plansprache) |
| | Tastenfunktionen | Ob die [Leiste mit den Tastenfunktionen](#kontextleiste) erscheint |
| | Verteiler | Ob der [Stromkreis](#stromkreis-zuordnung) im Eigenschaften-Panel steht |
| | Raster | Rasterweite und Rasterfang |
| | Verschieben mit Pfeiltasten | Schrittweite klein und groß |
| | Installationshöhe | Die Vorgabehöhen hinter den Knöpfen am Eigenschaften-Panel |
| | Kombinationen an der Wand | Wie groß Symbole in einer [Kombination an der Wand](#wandfang) erscheinen (Vorgabe 75 %) – gilt sofort für die offene Zeichnung |
| | Gruppen und Wirkverbindungen | Ob nach dem Verlegen einer Leitung [Gruppe und Wirkverbindung](#wirkverbindungen) angeboten werden |
| | Einstellungen übertragen | [Sichern und Einspielen](#einstellungen-sichern) als Datei |
| Routing (A*) | Routing (Leitungen) | Kosten je Meter und je Abbiegung, **Leitungen erst nach dem Loslassen neu verlegen**, **Abstand paralleler Leitungen**, Sicherheitsabstand und Suchbereich |
| | A*-Feineinstellungen | Feinheiten der Wegsuche |
| | Wandführung | Leitungen an Wänden entlang, Abstand und Querungsaufschlag |
| Objektfang | Objektfang | Welche Fangarten aktiv sind |
| Leitungen & Kabeltyp | Leitungen (diese Zeichnung) | Standard-Kabeltyp für neue Leitungen |
| Blatt | Zeichnungsart | Ob die Zeichnung ein Bauplan oder ein Schaltplan ist (nur Anzeige, fest ab Anlage) |
| | Zeichenfläche | Vorgaben für neue Blätter |
| | Beschriftung & Symbolgröße | Vorgabegrößen für Schrift und Symbole |
| Firma & Plankopf | Firmenlogo | Das Logo für den [Plankopf](#plankopf) |
| Tastenkürzel | | Siehe [Eigene Kürzel vergeben](#kuerzel-vergeben) |
| Werkzeugleiste, Symbolleiste | | Inhalt und Reihenfolge, siehe [Oberfläche anpassen](#symbolleiste-anpassen) |
| KI-Assistent | | Die Schnittstelle für Claude und andere KI-Assistenten, siehe [Mit einem KI-Assistenten arbeiten](#ki-assistent) |
| Lizenz | | Status der Lizenz, Verweis auf [Meine Lizenz](#lizenz) |

## Einstellungen sichern und mitnehmen {#einstellungen-sichern}

Damit Sie auf einem neuen Rechner nicht alles neu einstellen müssen:

1. {{befehl:extras.einstellungen-sichern}} schreibt eine Datei
   `el-easy-cad-Einstellungen-JJJJ-MM-TT.json`.
2. {{befehl:extras.einstellungen-einspielen}} liest sie wieder ein. Vorher wählen Sie aus, was
   übernommen werden soll:

| Bereich | Inhalt |
|---|---|
| Oberfläche | Werkzeug- und Symbolleiste, Seitenleiste, Eigenschaften-Panel, Tastenkürzel |
| Zeichnen | Objektfangarten, Raster, Pfeiltastenschritte, Bemaßungsvariante, Installationshöhen, Symbolgröße an der Wand |
| Autorouting | Alle Routing- und Wandführungswerte, dazu die Einstellungen von „Automatisch anordnen“ |
| Firmenlogo, Kabeltypen und Installationszonen | Das Plankopf-Logo, Ihre eigenen Kabeltypen und Ihre eigenen Installationszonen |

Ein angekreuzter Bereich **ersetzt** die dortigen Einstellungen; nicht angekreuzte bleiben
unberührt. Eigene Kabeltypen werden ergänzt. Vor dem Einspielen prüft das Programm die Datei
vollständig – eine beschädigte Datei ändert nichts.

Das Zugangstoken des [KI-Assistenten](#ki-assistent) gehört nicht zu den gesicherten
Einstellungen – auf einem neuen Rechner schalten Sie die Schnittstelle neu ein.

## Mit einem KI-Assistenten arbeiten {#ki-assistent}

Ein KI-Assistent wie **Claude** kann die offene Zeichnung lesen und Fragen dazu beantworten:
„Welche Leitungen haben ein freies Ende?“, „Wie viele Steckdosen stehen im Obergeschoss?“, „Zeig
mir den Verteilerbaum von +UV1“ oder „Sind Klemmennummern doppelt vergeben?“. Er spricht
el.easy.CAD über das Model Context Protocol (MCP) an – nur auf diesem Rechner. Das Sprachmodell
bringen Sie über Ihr eigenes Claude-Konto mit; el.easy.CAD selbst sendet nichts ins Internet.

Er bekommt die Beschreibung seiner Werkzeuge und die Meldungen von el.easy.CAD in der Sprache der
Oberfläche (Deutsch oder English); was er in die Zeichnung schreibt, etwa den Namen eines neuen
Raums, entsteht in der Plansprache. Die Namen der Werkzeuge bleiben in jeder Sprache deutsch, damit
eine einmal eingerichtete Verbindung weiter funktioniert. Nach einem Sprachwechsel sieht der
Assistent die neuen Beschreibungen, sobald er sich neu verbindet.

Der Assistent **liest** Blätter mit allen Objekten, einzelne Objekte samt Katalogeintrag, Räume,
den Katalog, alle Listen (Stückliste, Leitungsliste mit Längen, Stromkreisverzeichnis und
weitere), den Verteilerbaum, eine Prüfung auf Auffälligkeiten und Bildschirmfotos der Blätter.

Er kann die Zeichnung auch **ändern**: Eigenschaften an vielen Objekten auf einmal setzen
(Beschriftung, Höhe, Montageort, AP/UP, Stromkreis, KNX, variable Texte, Kennzeichen, bei
Leitungen Kabeltyp und Beschreibung, bei Trunks und Räumen den Namen), Objekte löschen,
verschieben und drehen, Komponenten gegen einen anderen Eintrag desselben Katalogs austauschen und
Blätter anlegen.

Im Bauplan **zeichnet** er auch: Komponenten aus dem Katalog setzen – an einen Punkt, in die
Raummitte oder an eine Wand mit Abstand und Höhe, wo sie sich wie beim Wandfang in Reihe und
Kombination einordnen –, Leitungen per Autorouting verlegen (zwischen Komponenten, zu einem freien
Punkt, einem Kabelschacht-Strang, durch Trunks bis zu einem freien Switch-Port oder Verteiler,
auf Wunsch mit Anschluss auf F/X/K), danach auf Wunsch Wirkverbindung oder Gerätegruppe anlegen,
Leitungen neu verlegen, Trunks anlegen und verbinden, Wände, Räume, Türen und Fenster.
Kennzeichen, Klemmen- und Leitungsnummern vergibt el.easy.CAD dabei genauso wie von Hand.

Im **Schaltplan** setzt er Bauteile in ein Feld des Netzes („C3“) oder an einen Punkt – der
Fangpunkt rastet dabei immer auf das Raster, damit die Kontakte fluchten –, setzt Potentiale und
zieht Schaltverbindungen von Kontakt zu Kontakt über die Anschlussnamen („A1“ → „13“): einlinig,
auch mehrpolig, oder mehrlinig mit parallelen Adern wie mit dem Werkzeug, mit Abzweig auf eine
andere Verbindung (daraus wird ein Knotenpunkt). Mehrere einlinige Verbindungen eines Auftrags
verlegt er gemeinsam, ohne dass sie sich decken. Auf Wunsch ordnet er Bauteile automatisch an –
mit Ihren Einstellungen aus „Automatisch anordnen“.

Am **Verteiler** im Bauplan schlägt er die Bestückung aus den Räumen vor, bearbeitet den
Verteilerbaum wie der Verteiler-Dialog (Betriebsmittel und Stromkreise anlegen, umhängen,
umbenennen, Phase, Typ und Beschriftung ändern, entfernen), ordnet KNX-Aktoren zu, nummeriert eine
Klemmenleiste neu und erzeugt den Verteilerplan. Der Plan entsteht als neues Dokument im Projekt;
el.easy.CAD fragt Sie, ob Sie ihn gleich öffnen möchten – der Assistent wechselt das Dokument nie
selbst, und einen vorhandenen Plan überschreibt er nicht. Ist schon ein Verteilerplan verknüpft,
gelten dieselben Grenzen wie im Dialog.

Seine Prüfung auf Auffälligkeiten findet im Schaltplan auch Verbindungen mit freiem Ende,
Stellen, an denen zwei verschiedene Potentiale zusammenhängen, doppelte Gerätekennzeichen und
Bauteile außerhalb des Netzes.

Dabei gilt:

- Jede Änderung ist **ein Rückgängig-Schritt**, der mit „KI:“ beginnt – {{kuerzel:bearbeiten.rueckgaengig}}
  nimmt sie zurück wie jede andere. Nur ein neu erzeugter Verteilerplan ist ein eigenes Dokument
  und bleibt. Bittet man den Assistenten selbst um „Rückgängig“, nimmt er
  nur seine eigenen Schritte zurück und hält bei Ihrem ersten eigenen Schritt an.
- Solange Sie mit einem Zeichenwerkzeug arbeiten (alles außer der Auswahl), lehnt el.easy.CAD
  seine Änderungen ab – Ihre Arbeit wird nie unterbrochen. Lesen geht weiter.
- Jede Änderung erscheint kurz als Meldung und im **KI-Protokoll** im Reiter KI-Assistent, mit
  Uhrzeit. Die Ansicht springt dabei nicht; das Protokoll ist nach einem Neuladen leer.
- Objekte auf gesperrten Ebenen und Blätter, die nur zur Ansicht freigegeben sind, ändert er
  nicht.

**Einschalten:**

1. {{befehl:extras.einstellungen}} öffnen, Reiter **KI-Assistent**.
2. Den Hinweis zur Datenweitergabe lesen und **Zustimmen und einschalten** wählen. Was der
   Assistent liest – auch Raumnamen und Bildschirmfotos – geht an den Anbieter des
   Sprachmodells, bei Claude an Anthropic.
3. Den fertigen Eintrag in Ihren KI-Assistenten übernehmen:
   - **Claude Code:** den angezeigten Befehl `claude mcp add …` einmal im Terminal ausführen.
   - **Claude Desktop:** den angezeigten Block in die Datei `claude_desktop_config.json`
     übernehmen (Einstellungen › Entwickler › „Konfiguration bearbeiten“) und Claude Desktop
     neu starten.

Danach eine Zeichnung öffnen und den Assistenten fragen. In der Statuszeile steht **KI bereit**,
solange die Schnittstelle eingeschaltet ist, und **KI verbunden**, wenn ein Assistent in den
letzten Minuten angefragt hat; ein Klick darauf öffnet den Reiter. Der Assistent arbeitet immer
mit dem Fenster, in dem Sie zuletzt gearbeitet haben.

**Kontrolle behalten:** Ab Werk ist die Schnittstelle aus. Eingeschaltet nimmt sie nur Anfragen
mit dem **Zugangstoken** an, das im Befehl steht – andere Programme auf dem Rechner kommen ohne
ihn nicht heran. **Neues Token erzeugen** sperrt alle bisher eingerichteten Assistenten aus. Der
Haken **KI darf nur lesen** verbietet ihm jede Änderung. Blätter, die ohne das Modul BIM nur zur Ansicht freigegeben sind, gibt el.easy.CAD
auch dem Assistenten nicht als Bild heraus.

Die Antworten des Assistenten sind wie jede Programmausgabe zu prüfen, bevor Sie sich darauf
verlassen.
