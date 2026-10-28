export const hinweise = {
  dialog: {
    verstanden: 'Verstanden',
    nichtMehrZeigen: 'Diesen Hinweis nicht mehr zeigen',
    handbuch: 'Ausführlich im Handbuch',
    wiederEinschalten:
      'Wieder einschalten: {{befehl:hilfe.hinweise}} oder Einstellungen › Allgemein.',
  },
  auswahl: {
    titel: 'Hilfe-Hinweise',
    erklaerung:
      'Bei verzweigten Funktionen zeigt ein kleiner Dialog die Schritte in der Reihenfolge, in ' +
      'der man sie braucht. Hier legen Sie fest, welche Hinweise erscheinen.',
    hauptschalter: 'Hilfe-Hinweise anzeigen',
    hauptschalterHinweis:
      'Aus: kein Hinweis erscheint mehr. Die Auswahl darunter bleibt erhalten und gilt wieder, ' +
      'sobald Sie den Haken setzen.',
    alleEin: 'Alle einschalten',
    schliessen: 'Schließen',
  },
  themen: {
    blatt: {
      name: 'Neues Blatt oder neue Zeichnung',
      titel: 'Neues Blatt: so wird es zur Planungsgrundlage',
      text: [
        'Ein neuer Bauplan ist noch leer. Diese Schritte führen vom leeren Blatt zu einem Plan, ' +
          'auf dem Sie Komponenten setzen können – nicht jeder ist bei jedem Plan nötig.',
        '',
        '1. **Format und Maßstab wählen.** Im Dialog **Zeichenfläche einrichten** legen Sie ' +
          'Papierformat und Maßstab fest, in dem Sie später drucken. Nachträglich ändern Sie das ' +
          'mit {{befehl:blatt.zeichenflaeche-einrichten}}.',
        '2. **Hintergrund einlesen.** {{befehl:datei.import-hintergrund}} lädt den Grundriss als ' +
          'PDF, DXF oder Bild.',
        '3. **Seite und Ausschnitt wählen (bei einer PDF).** Eine mehrseitige PDF fragt nach der ' +
          'Seite; füllt der Plan nur einen Teil des Blatts, ziehen Sie den Ausschnitt auf, der ' +
          'übernommen werden soll.',
        '4. **Störendes ausblenden.** {{befehl:werkzeug.hintergrund-ausblenden}} blendet ' +
          'Bereiche per Rechteck aus – Legenden, Schriftfeld, Nachbargeschosse. Es wird nichts ' +
          'gelöscht; {{befehl:blatt.hintergrund-ausblendungen}} holt Bereiche zurück.',
        '5. **Kalibrieren, wenn nötig.** Steht am Plan „Nicht kalibriert“, wählen Sie ' +
          '{{befehl:werkzeug.kalibrieren}}, klicken die beiden Enden einer bekannten Strecke an ' +
          '(etwa eine Maßkette) und tragen die wahre Länge ein. Erst dann stimmen Längen, ' +
          'Leitungslängen und Maßstab.',
        '6. **Bauteile umwandeln – oder Wände zeichnen.** Aus einem IFC-Modell übernimmt ' +
          '{{befehl:blatt.ifc-bauteile}} Wände, Türen und Fenster; bei einem Vektorplan macht ' +
          '{{befehl:blatt.hintergrund-umwandeln}} aus den Linien Zeichnungselemente. Geht beides ' +
          'nicht, zeichnen Sie selbst: {{befehl:werkzeug.wand}}, {{befehl:werkzeug.tuer}}, ' +
          '{{befehl:werkzeug.fenster}} und {{befehl:werkzeug.raum}}.',
        '7. **Nullpunkt setzen.** {{befehl:werkzeug.nullpunkt}} legt den Bezugspunkt für ' +
          'Koordinaten, Raster und Fang fest. Klicken Sie eine Gebäudeecke an, mit dem zweiten ' +
          'Klick entlang einer Außenwand. Setzen Sie bei mehreren Etagen auf jedem Blatt ' +
          'dieselbe Ecke: Nur so lassen sich die Blätter mit {{befehl:blatt.ausrichten}} ' +
          'übereinanderlegen.',
      ].join('\n'),
    },
    verteiler: {
      name: 'Verteiler gesetzt',
      titel: 'Verteiler: Inhalt anlegen und mit einem Plan verbinden',
      text: [
        'Ein Verteiler bekommt beim Platzieren ein Ortskennzeichen wie **+UV1**. Was in ihm ' +
          'steckt – Sicherungen, RCDs, Klemmen –, legen Sie danach im Verteiler-Dialog fest.',
        '',
        '1. **Dialog öffnen.** Doppelklick auf den Verteiler, oder im Eigenschaften-Panel ' +
          '**Bestückung und Belegung …**.',
        '2. **Mit einem vorhandenen Plan verbinden.** Haben Sie den Verteilerplan schon als ' +
          'Schaltplan gezeichnet: **Vorhandenen Schaltplan zuordnen …**. Ab dann bestimmt der ' +
          'Plan, welche Betriebsmittel der Verteiler hat.',
        '3. **Neu aus dem Bauplan erzeugen.** Ohne eigenen Plan schlägt **Bestückung aus ' +
          'Räumen vorschlagen …** Leitungsschutzschalter und Klemmen aus den Räumen und dem ' +
          'Stromkreis der platzierten Komponenten vor. **Verteilerplan erzeugen …** (auch ' +
          '{{befehl:datei.verteilerplan-assistent}}) legt daraus den Schaltplan an.',
        '4. **Baum anlegen.** Die Bestückung ist ein Baum des Stromwegs: Einspeisung, ' +
          'Vorsicherung, RCD, Leitungsschutzschalter, Klemme. Mit **+** in einer Zeile hängen ' +
          'Sie etwas dahinter; ziehen ordnet um.',
        '5. **Ändern und löschen.** Zeilen lassen sich im Baum verschieben und entfernen, jede ' +
          'Änderung ist ein Rückgängig-Schritt. Bei verknüpftem Plan ändern Sie die ' +
          'Betriebsmittel im Plan; die Verknüpfung selbst lösen Sie jederzeit wieder.',
        '6. **Leitungen anschließen.** Endet später eine Leitung am Verteiler, fragt ein ' +
          'Dialog, auf welcher Klemme sie landet.',
      ].join('\n'),
    },
    trunk: {
      name: 'Trunk legen',
      titel: 'Trunk: ein Weg für viele Leitungen',
      text: [
        'Ein Trunk bündelt Leitungen auf einem gemeinsamen Weg – Kabeltrasse, Kanal, Steigzone.',
        '',
        '1. **Verlauf klicken.** Punkt für Punkt wie eine Polylinie. **Umschalt** rastet auf ' +
          '45° ein, **Rücktaste** nimmt den letzten Punkt zurück.',
        '2. **Am Gerät beginnen.** Switch, Patchpanel und Verteiler haben eigene Trunk-Punkte ' +
          '(oben, unten, seitlich). Ein Klick darauf bindet das Trunk-Ende an das Gerät; ' +
          'sonst bleibt es frei.',
        '3. **Abschließen.** **Enter** oder Doppelklick beendet den Trunk, **Esc** verwirft ihn.',
        '4. **Ausführung und Zone vorab.** Die Leiste über der Zeichenfläche stellt ein, ' +
          'welche Ausführung und Installationszone neue Trunks bekommen.',
        '5. **Weiterführen.** Trunks lassen sich zu einer Kette verbinden, auch über mehrere ' +
          'Blätter. Zwischen Etagen führt der Kabelschacht.',
        '6. **Leitungen einlegen.** Danach zeichnen Sie mit {{befehl:werkzeug.leitung}} die ' +
          'Leitungen durch den Trunk.',
      ].join('\n'),
    },
    leitung: {
      name: 'Leitungen verlegen',
      titel: 'Leitungen verlegen',
      text: [
        'Eine Leitung verbindet zwei Dockpunkte. el.esy.CAD sucht den Weg selbst; Sie ' +
          'können ihn aber auch führen.',
        '',
        '1. **Von Dockpunkt zu Dockpunkt.** Erst auf den Dockpunkt der ersten Komponente ' +
          'klicken, dann auf den der zweiten. **D** gedrückt zeigt alle Dockpunkte.',
        '2. **Weg selbst führen.** Klicken Sie vor dem Ziel freie Punkte: Die Leitung läuft ' +
          'genau dort entlang, nur das letzte Stück sucht el.esy.CAD selbst.',
        '3. **An Wänden.** Hängt eine Komponente an der Wand, kommt die Leitung aus der Wand. ' +
          'In den Einstellungen unter **Routing** führt die **Wandführung** Leitungen bevorzugt ' +
          'an Wänden entlang.',
        '4. **Zone, AP/UP und Kabeltyp vorab.** Die Leiste oben rechts über der Zeichnung ' +
          'stellt ein, was neue Leitungen bekommen. Die Zonen pflegen Sie unter ' +
          '{{befehl:katalog.installationszonen}}.',
        '5. **Durch einen Trunk.** Erst auf den Trunk klicken (Eintritt), dann auf den ' +
          'Austritt. Im Trunk öffnet die **Leertaste** den Dialog mit dem Ziel – Switch, ' +
          'Patchpanel, Kabelschacht oder Verteiler.',
        '6. **Nachbearbeiten.** Eine gewählte Leitung zeigt Griffe an Enden und Knicken; ein ' +
          'Rechtsklick bietet unter anderem den Kabeltyp an.',
      ].join('\n'),
    },
    komponente: {
      name: 'Komponenten platzieren',
      titel: 'Komponenten platzieren',
      text: [
        '1. **Produkt wählen.** Die Komponentenauswahl öffnet sich von selbst. Das Suchfeld ' +
          'filtert nach Bezeichnung und Artikelnummer; hat das Produkt Varianten, wählen Sie ' +
          'sie darunter.',
        '2. **Platzieren.** In den Plan klicken. Die **Leertaste** dreht vor dem Klick um 90°. ' +
          'Das Werkzeug bleibt aktiv – jeder weitere Klick setzt ein weiteres Exemplar, ' +
          '**Esc** beendet.',
        '3. **An der Wand.** In einem Bauplan fangen Komponenten an Wänden; bei einem ' +
          'Vektorplan auch an den Linien des Hintergrunds. Höchstens fünf bilden dort eine ' +
          'Kombination nebeneinander.',
        '4. **Installationshöhe.** In der Kontextleiste unten stellen Sie mit **−** und **+** ' +
          'die Höhe der nächsten Komponenten ein. Jede Höhe bildet an der Wand eine eigene ' +
          'Reihe.',
        '5. **Montageort und AP/UP.** Im Eigenschaften-Panel legen Sie fest, ob eine ' +
          'Komponente an Decke, Wand oder Boden sitzt und auf (AP) oder unter Putz (UP).',
        '6. **Bezeichnen.** Mit dem Auswahlwerkzeug anklicken und im Eigenschaften-Panel unter ' +
          '**Beschriftung** einen Text eintragen. Mehrere gewählte Komponenten ändern Sie ' +
          'gemeinsam.',
      ].join('\n'),
    },
    verbraucher: {
      name: 'Verbraucher platzieren',
      titel: 'Verbraucher: platzieren, benennen, ansteuern',
      text: [
        'Ein Verbraucher – etwa eine Leuchte – wird von Befehlsgeräten geschaltet. Damit das ' +
          'später gelingt, lohnt es sich, ihn gleich richtig anzulegen.',
        '',
        '1. **Platzieren.** In den Plan klicken. An einer Wand fängt er an der Wand, in einem ' +
          'Raum setzen Sie ihn frei.',
        '2. **Drehen.** Vor dem Klick dreht die **Leertaste** um 90°; später dreht der Griff ' +
          'an der gewählten Komponente beliebig.',
        '3. **Benennen.** Im Eigenschaften-Panel unter **Beschriftung** („Spüle“, „Deckenlicht ' +
          'Flur“). Der Name erscheint im Plan und in den Listen.',
        '4. **Ansteuerungsart wählen.** Im Panel unter **Ansteuerung**: Schalten, Dimmen, DALI ' +
          'und so weiter. Sie bestimmt, welche Befehlsgeräte und Aktorkanäle passen.',
        '5. **Gruppen bilden.** Leuchten, die immer gemeinsam schalten, wählen Sie mit ' +
          'Strg + Klick (am Mac Cmd + Klick) und bilden per Rechtsklick eine **Gerätegruppe aus ' +
          'Auswahl**. Der Dialog fragt Name, Ansteuerung und den Haken **KNX**.',
        '6. **Verbinden.** Welcher Schalter ihn schaltet, legen Sie am Befehlsgerät fest – ' +
          'über die Leitung oder mit {{befehl:werkzeug.wirkverbindung}}.',
      ].join('\n'),
    },
    befehlsgeraet: {
      name: 'Befehlsgeräte platzieren',
      titel: 'Befehlsgerät: Slots einstellen und verbinden',
      text: [
        'Ein Befehlsgerät – Schalter, Taster, KNX-Tastsensor – schaltet über seine **Slots** ' +
          '(Wippen, Tasten, Kanäle) Verbraucher oder Gruppen.',
        '',
        '1. **Platzieren.** In den Plan klicken, vorher mit der **Leertaste** drehen.',
        '2. **Slots einstellen.** Im Eigenschaften-Panel stehen die Slots als Matrix wie die ' +
          'Wippen im Rahmen. Hier stellen Sie Anzahl und Namen ein; bei manchen Geräten ergibt ' +
          'sie sich aus einem Textfeld, etwa der Wippenzahl.',
        '3. **Konventionell verbinden.** Zeichnen Sie die Leitung vom Schalter zum Verbraucher: ' +
          'el.esy.CAD fragt, welcher Slot wirkt, und schlägt einen Namen aus Raum und ' +
          'Ansteuerung vor („Licht Flur“).',
        '4. **Ohne Leitung verbinden.** {{befehl:werkzeug.wirkverbindung}}: das Befehlsgerät ' +
          'anklicken, bei mehreren Slots den Slot wählen, dann alle Ziele anklicken und mit ' +
          '**Enter** abschließen.',
        '5. **Gruppe.** Bekommt ein Slot mehr als ein Ziel, fasst el.esy.CAD sie zu einer ' +
          '**Gerätegruppe** zusammen und fragt Name, Ansteuerung und den Haken **KNX**.',
        '6. **Kontrollieren.** Das gewählte Befehlsgerät zeigt gestrichelte Linien zu seinen ' +
          'Zielen. Alles auf einen Blick: {{befehl:werkzeug.steuerungslogik}}.',
      ].join('\n'),
    },
    dreid: {
      name: '3D-Ansicht',
      titel: '3D-Ansicht der Planung',
      text: [
        'Die 3D-Ansicht zeigt die Planung räumlich – zur Kontrolle, ob Montagehöhen, ' +
          'Installationszonen und Steigstrecken stimmen.',
        '',
        '1. **Bedienen.** Ziehen dreht, das Mausrad zoomt, **Einpassen** zeigt wieder alles.',
        '2. **Etagen.** Die Blätter liegen nach ihrer Kote übereinander. Links blenden Sie ' +
          'Geschosse aus und stellen ein, wie durchsichtig Wände und Decken sind. Die Höhen ' +
          'pflegen Sie unter {{befehl:blatt.etagen}}.',
        '3. **Deckungsgleich.** Damit die Geschosse genau übereinanderstehen, setzen Sie auf ' +
          'jedem Blatt denselben Nullpunkt und richten sie mit {{befehl:blatt.ausrichten}} ' +
          'aus.',
        '4. **Gebäude.** Wände, Türen, Fenster, Treppen und Räume erscheinen, soweit Sie sie ' +
          'gezeichnet haben. Ohne sie sehen Sie nur die Geräte und Leitungen.',
        '5. **Leitungen.** Sie laufen mit allen senkrechten Stücken. Schalten Sie am Blatt ' +
          '**Nur in Wand, Decke oder Boden** ein, damit sie nicht frei durch die Räume laufen.',
      ].join('\n'),
    },
  },
}
