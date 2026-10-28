export const verwaltungsdialoge = {
  kuerzel: {
    strg: 'Strg',
    umschalt: 'Umschalt',
    alt: 'Alt',
    tasten: {
      leertaste: 'Leertaste',
      pfeilHoch: 'Pfeil hoch',
      pfeilRunter: 'Pfeil runter',
      pfeilLinks: 'Pfeil links',
      pfeilRechts: 'Pfeil rechts',
      pos1: 'Pos1',
      ende: 'Ende',
      bildAuf: 'Bild auf',
      bildAb: 'Bild ab',
      einfg: 'Einfg',
      esc: 'Esc',
      entf: 'Entf',
      ruecktaste: 'Rücktaste',
    },
    gesperrt: {
      escape: 'Esc bricht die laufende Aktion ab.',
      enter: 'Enter schließt Polylinie, Trunk und Schraffur ab.',
      entf: 'Entf löscht die Auswahl.',
      ruecktaste: 'Die Rücktaste löscht die Auswahl.',
      tab: 'Tab wechselt den Fokus.',
      plusMinus: '+ und - ändern Eckenzahl, Wandstärke und Installationshöhe.',
    },
  },
  notizAnsicht: {
    notiz: 'Notiz',
    platzhalter: 'Absprachen, offene Punkte, Zugangsdaten vor Ort …',
  },
  pdfAnsicht: {
    pdfAnlage: 'PDF-Anlage',
    keineDatei: 'Zu dieser Anlage ist keine Datei hinterlegt.',
  },
  serverHinweis: {
    titel: 'el.easy.CAD ist nicht verbunden',
    appText:
      'el.easy.CAD startet dazu im Hintergrund einen eigenen Begleitserver. Er antwortet ' +
      'gerade nicht – entweder ist er noch nicht fertig gestartet, oder er wurde beendet.',
    appHilft: 'Das hilft in der Regel:',
    appWarten: 'Einen Moment warten und dann „Erneut versuchen“ klicken.',
    appNeuStarten:
      'el.easy.CAD vollständig beenden (nicht nur das Fenster schließen) und neu starten – ' +
      'dabei startet auch der Begleitserver neu.',
    appFirewallVor: 'Prüfen, ob ein Virenschutz- oder Firewall-Programm die Verbindung zu',
    appFirewallNach: 'blockiert, und el.easy.CAD dort als Ausnahme zulassen.',
    datenVor: 'Deine Daten liegen unter',
    datenNach: 'und sind von diesem Hinweis nicht betroffen.',
    webText:
      'Zeichnungen, Projekte und der Produktkatalog liegen im Begleitserver. Er läuft gerade ' +
      'nicht – oder er ist noch nicht fertig gestartet.',
    webStarten: 'So startest du ihn im Projektverzeichnis:',
    webEntwickelnVor: 'Zum Entwickeln stattdessen',
    webEntwickelnNach: '; das startet Oberfläche und Server zusammen.',
    pruefe: 'Prüfe…',
    erneutVersuchen: 'Erneut versuchen',
  },
  allgemein: {
    schliessen: 'Schließen',
    abbrechen: 'Abbrechen',
  },
  neueZeichnung: {
    titel: 'Neue Zeichnung',
    name: 'Name',
    plansprache: 'Plansprache',
    art: 'Art',
    bauplan: 'Bauplan',
    schaltplan: 'Schaltplan',
    verteilerplanFuer: 'Verteilerplan für +{kennzeichen}',
    hinweis:
      'Die Art lässt sich später nicht mehr ändern. Ein Schaltplan hat auf jedem Blatt die feste ' +
      'Zeichenfläche A4 quer 1:40 mit Koordinatennetz.',
  },
  demoHinweis: {
    titel: 'Testversion',
    text:
      'el.easy.CAD läuft als Testversion – mit dem vollen Funktionsumfang, damit Sie vor dem ' +
      'Kauf alles ausprobieren können. Dafür tragen die Zeichenfläche und jeder Ausdruck, jedes ' +
      'PDF und jede Excel-Arbeitsmappe den Hinweis „Demoversion – keine kommerzielle Nutzung ' +
      'erlaubt“. Eine kommerzielle Nutzung ist nicht erlaubt.',
    resttage: { one: 'Noch {n} Tag verbleibt.', other: 'Noch {n} Tage verbleiben.' },
    laeuftHeuteAb: 'Die Testversion läuft heute ab.',
    lizenzEinspielen: 'Lizenz einspielen…',
    verstanden: 'Verstanden',
  },
  ueber: {
    titel: 'Über el.easy.CAD Community',
    beschreibung:
      'el.easy.CAD – einfaches, funktional tiefes 2D-CAD für die Elektro-/Gebäudetechnikplanung.',
    version: 'Version {version}',
    lizenzen: 'Lizenzen',
  },
  datenschutz: {
    titel: 'Datenschutzerklärung',
    bestaetigenHinweis:
      'Bevor Sie el.easy.CAD nutzen können, müssen Sie die folgende Datenschutzerklärung zur ' +
      'Kenntnis nehmen und bestätigen.',
    programmBeenden: 'Programm beenden',
    akzeptiert: 'Gelesen und akzeptiert',
  },
  eula: {
    titel: 'Endnutzer-Lizenzvereinbarung und Beta-Testvertrag',
    hinweis:
      'Bevor Sie el.easy.CAD nutzen können, müssen Sie die folgende Vereinbarung zur Kenntnis ' +
      'nehmen und bestätigen.',
    bestaetigen: 'Ich bestätige diese Bedingungen und Vereinbarungen',
  },
  produktlizenzSperre: {
    keinJson: 'Diese Datei ist kein gültiges JSON.',
    nichtEingespielt: 'Lizenz konnte nicht eingespielt werden.',
    titelTestAbgelaufen: 'Testversion abgelaufen',
    titelAbgelaufen: 'Lizenz abgelaufen',
    titelUngueltig: 'Lizenzdatei ungültig',
    titelOhne: 'el.easy.CAD braucht eine Lizenz',
    zuletztFuer: 'Zuletzt hinterlegt für',
    gueltigBis: ', gültig bis {datum}.',
    testAbgelaufen: 'Die 30-tägige Testversion ist abgelaufen.',
    gesperrt:
      'Zeichnungen, Projekte und der Produktkatalog sind gesperrt, bis eine gültige Lizenzdatei ' +
      'eingespielt ist.',
    wirdGeprueft: 'Wird geprüft…',
    dateiAuswaehlen: 'Lizenzdatei auswählen…',
  },
  zusatzmodulEinstellungen: {
    einleitung:
      'Zum Entwickeln eines Moduls lädt el.easy.CAD es direkt aus einem Ordner dieses Rechners – ohne Paket und ohne Installieren.',
    entwicklermodus: 'Entwicklermodus',
    ordner: 'Ordner mit manifest.json und modul.js',
    gefunden:
      'Gefunden: {name} {version}. Vor jedem Befehl lädt el.easy.CAD es neu, wenn sich eine Datei geändert hat.',
    keinOrdner: 'Noch kein Ordner angegeben.',
    neuLaden: 'Jetzt neu laden',
    hinweis:
      'Ein Modul aus dem Ordner hat wie jedes andere vollen Zugriff. Hat es dieselbe Kennung wie ein installiertes, ersetzt es dieses, solange der Entwicklermodus an ist.',
  },
  zusatzmodule: {
    kiFreigabe: 'für KI-Assistent (Claude darf die Befehle aufrufen)',
    keinEintrag: 'kein Eintrag gewählt',
    waehlen: 'Wählen…',
    entwicklung: 'Entwicklung',
    entwicklungHinweis:
      'aus dem Entwicklungsordner – abschalten im Reiter „Module“ der Einstellungen',
    einstellungenLoeschen: 'Einstellungen des Moduls ebenfalls löschen',
    titel: 'Module',
    hinzufuegen: 'Modul hinzufügen…',
    leer: 'Es sind keine Module installiert.',
    aktiv: 'aktiv',
    aktivHinweis: 'Aktive Module erscheinen im Menü „Module“.',
    entfernenHinweis: 'Wählen Sie das Modul, das entfernt werden soll.',
    installiertAm: 'installiert am {datum}',
    ungetestet: 'nicht mit el.easy.CAD {app} getestet',
    abgeschaltet: 'Beim Laden abgeschaltet: {fehler}',
    fehlerprotokoll: 'Fehlerprotokoll',
    entfernen: 'Entfernen',
    entfernenTitel: 'Modul entfernen',
    entfernenFrage: 'Modul „{name}“ entfernen? Zeichnungen bleiben unverändert.',
    hinzufuegenTitel: 'Modul hinzufügen',
    hersteller: 'Hersteller (Angabe des Moduls): {hersteller}',
    befehle: 'Befehle: {liste}',
    warnungZugriff:
      'Module haben vollen Zugriff auf el.easy.CAD und Ihre Projekte. Installieren Sie nur Module von Herstellern, denen Sie vertrauen.',
    ersetztAeltere: 'Ersetzt die installierte Version {version}.',
    gleicheVersion: 'Diese Version ist bereits installiert und wird neu eingespielt.',
    ersetztNeuere: 'Achtung: Älter als die installierte Version {version}.',
    nichtGetestet: 'Getestet bis el.easy.CAD {bis}, installiert ist {app}.',
    installieren: 'Installieren',
    aelterInstallieren: 'Trotzdem installieren',
  },
  fehlerprotokoll: {
    titel: 'Fehlerprotokoll',
    nichtGeladen: 'Das Fehlerprotokoll konnte nicht geladen werden.',
    textdatei: 'Textdatei',
    hinweis:
      'Fortlaufende, rein lokale Datei mit Debuginformationen und Fehlermeldungen (maximal ' +
      '5\u00a0MB) – hilft dabei, spätere Fehler nachzuvollziehen. Verlässt diesen Rechner nur, ' +
      'wenn Sie sie mit „Als TXT herunterladen“ speichern und selbst weitergeben.',
    wirdGeladen: 'Wird geladen…',
    keineEintraege: 'Noch keine Einträge.',
    leer: '(leer)',
    aktualisieren: 'Aktualisieren',
    herunterladen: 'Als TXT herunterladen',
  },
  tastenkuerzelDialog: {
    titel: 'Tastenkürzel-Übersicht',
    mausUndSondertasten: 'Maus und Sondertasten',
    kuerzelAendern: 'Kürzel ändern…',
    tasteEsc: 'Esc',
    tasteEscEsc: 'Esc Esc',
    tasteEnter: 'Enter',
    tastePlusMinus: '+ / -',
    tasteD: 'D (halten)',
    tasteMausrad: 'Mausrad',
    tasteRechtsZiehen: 'Rechte Maustaste + Ziehen',
    tasteRechtsklick: 'Rechtsklick (ohne Ziehen)',
    esc: 'Laufende Aktion abbrechen / Auswahl aufheben',
    escEsc: 'Zusätzlich zurück zum Auswahl-Werkzeug',
    enter: 'Polylinie, Trunk und Schraffur abschließen',
    plusMinus: 'Eckenzahl beim Polygon, Wandstärke, Installationshöhe beim Platzieren',
    dHalten: 'Alle Dockpunkte an Komponenten vorübergehend anzeigen',
    mausrad: 'Zoom zum Mauszeiger',
    pannen: 'Pannen',
    kontextmenue: 'Kontextmenü',
  },
  werkzeugleiste: {
    titel: 'Werkzeugleiste',
    hinweis:
      'Reihenfolge per Ziehen ändern, mit dem Kästchen ein Werkzeug aus der Werkzeugleiste ' +
      'ausblenden. Ausgeblendete Werkzeuge bleiben über Menü und Tastenkürzel erreichbar.',
    zuruecksetzenTitel: 'Werkzeugleiste zurücksetzen',
    zuruecksetzenFrage: 'Reihenfolge und Sichtbarkeit auf die Werkseinstellung zurücksetzen?',
    zuruecksetzen: 'Zurücksetzen',
    aufStandard: 'Auf Standard zurücksetzen',
  },
  einstellungenAustausch: {
    titelEinspielen: 'Einstellungen einspielen',
    titelSichern: 'Einstellungen sichern',
    hinweisEinspielen:
      'Aus „{datei}“ (el.easy.CAD {version}). Die angekreuzten Bereiche ersetzen deine aktuellen ' +
      'Einstellungen; eigene Kabeltypen werden ergänzt.',
    hinweisSichern:
      'Die angekreuzten Bereiche kommen in eine Datei, die du in einer anderen ' +
      'el.easy.CAD-Installation oder in der Cloud wieder einspielen kannst.',
    nichtInDatei: 'Nicht in dieser Datei',
    uebernehmen: 'Übernehmen',
    sichern: 'Sichern…',
    gesichert: 'Einstellungen gesichert.',
    einspielenFehlgeschlagen: 'Einspielen fehlgeschlagen.',
    sichernFehlgeschlagen: 'Sichern fehlgeschlagen.',
    dateiBeschreibung: 'el.easy.CAD-Einstellungen',
    dateinameTeil: 'Einstellungen',
    nichtGelesen: 'Datei konnte nicht gelesen werden.',
    firmenlogo: 'Firmenlogo',
    kabeltypen: { one: '{n} Kabeltyp', other: '{n} Kabeltypen' },
    installationszonen: { one: '{n} Installationszone', other: '{n} Installationszonen' },
    uebernommen: '{liste} übernommen.',
    bereiche: {
      oberflaeche: 'Oberfläche',
      zeichnen: 'Zeichnen',
      autorouting: 'Autorouting',
      firmenlogoUndKabeltypen: 'Firmenlogo, Kabeltypen und Installationszonen',
    },
    bereichHinweise: {
      oberflaeche:
        'Werkzeug-Seitenleiste und Symbolleiste (Reihenfolge, Sichtbarkeit), Seitenleiste, ' +
        'Eigenschaften-Panel, Erscheinungsbild, Tastenkürzel',
      zeichnen:
        'Objektfang-Arten, Rasterabstand, Pfeiltasten-Schrittweiten, Bemaßungsart, ' +
        'Vorgabehöhen, Symbolgröße an der Wand',
      autorouting: 'Kosten, Sicherheitsabstand, Suchbereich, Wandführung, automatisch anordnen',
      firmenlogoUndKabeltypen:
        'Firmenlogo für den Plankopf, die eigenen Kabeltypen und die eigenen Installationszonen',
    },
  },
  meineLizenz: {
    titel: 'Meine Lizenz',
    austauschen: 'Lizenz austauschen',
    status: 'Status',
    statusFehlt: 'Keine Lizenz hinterlegt.',
    statusUngueltig: 'Die Lizenz ist nicht gültig.',
    statusAbgelaufen: 'Die Lizenz ist abgelaufen.',
    statusGueltig: 'Lizenz gültig.',
    restAbgelaufen: ' (abgelaufen)',
    restHeute: ' (läuft heute ab)',
    restTage: { one: ' (noch {n} Tag)', other: ' (noch {n} Tage)' },
    testversionTage: { one: 'Testversion, noch {n} Tag.', other: 'Testversion, noch {n} Tage.' },
    lizenziertFuer: 'Lizenziert für',
    gueltigAb: 'Gültig ab',
    gueltigBis: 'Gültig bis',
    zusatzmodule: 'Zusatzmodule',
    hinweisAustausch:
      'Die neue Lizenzdatei erhalten Sie vom Anbieter. Sie ersetzt die bisherige erst, wenn sie ' +
      'gültig ist.',
    wirdGeprueft: 'Wird geprüft…',
    neueDatei: 'Neue Lizenzdatei einspielen…',
    neueAktiv: 'Die neue Lizenz ist aktiv.',
  },
  lizenzen: {
    titel: 'Lizenzen und Nutzungsbedingungen',
    abhaengigkeiten: 'Abhängigkeiten (Open Source)',
    komponenten:
      'Diese Software nutzt folgende Open-Source-Komponenten (alle kommerziell nutzbar):',
    bestimmungen: 'Lizenzbestimmungen',
    bestimmungenText:
      'Alle Abhängigkeiten erlauben kommerzielle Nutzung. Sie stehen unter permissiven Lizenzen ' +
      '(MIT/Apache 2.0); web-ifc und einige Rust-Bausteine der Desktop-App stehen unter der ' +
      'MPL 2.0 und werden unverändert eingesetzt.',
    nodeZweck: 'Laufzeit des Begleitservers (Desktop-App)',
    tauriZweck: 'Hülle der Desktop-App samt Rust-Bibliotheken',
    vollstaendig:
      'Die Copyright-Vermerke und vollständigen Lizenztexte aller Fremdsoftware, die die ' +
      'Anwendung enthält (Oberfläche, Begleitserver, Node.js und Rust-Bausteine der Desktop-App), ' +
      'liegen ihr bei.',
    texteAnzeigen: 'Vollständige Lizenztexte anzeigen',
    texteFehler: 'Die Lizenztexte konnten nicht geladen werden.',
  },
  kiAssistent: {
    titel: 'KI-Assistent',
    geradeEben: 'gerade eben',
    vorMinuten: 'vor {n} Min.',
    vorStunden: 'vor {n} Std.',
    kopiert: 'In die Zwischenablage kopiert.',
    selbstKopieren: 'Bitte markierten Text mit ⌘C bzw. Strg+C kopieren.',
    kopieren: 'Kopieren',
    protokoll: 'KI-Protokoll',
    protokollLeer: 'In dieser Sitzung hat der Assistent noch nichts geändert.',
    aendernFehlgeschlagen: 'Ändern fehlgeschlagen.',
    keineSchnittstelle: 'Der Begleitserver dieser Fassung bietet keine KI-Schnittstelle an.',
    einleitung:
      'Ein KI-Assistent wie Claude kann das offene Dokument lesen – Blätter, Komponenten, Räume, ' +
      'Listen, Verteilerbaum, Prüfung und Bildschirmfotos – und es ändern: Eigenschaften setzen, ' +
      'löschen, verschieben, drehen, austauschen, Blätter anlegen. Er spricht el.easy.CAD über ' +
      'das Model Context Protocol (MCP) an, nur auf diesem Rechner. Das Sprachmodell bringen Sie ' +
      'über Ihr eigenes Claude-Konto mit.',
    datenweitergabe: 'Datenweitergabe:',
    datenweitergabeText:
      'Was der KI-Assistent liest – Objektlisten, Raumnamen, Listen und Bildschirmfotos der ' +
      'Blätter – geht an den Anbieter des Sprachmodells (bei Claude an Anthropic). Schalten Sie ' +
      'die Schnittstelle nur ein, wenn das für die Projekte, die Sie öffnen, in Ordnung ist.',
    zustimmen: 'Zustimmen und einschalten',
    eingeschaltet: 'KI-Schnittstelle eingeschaltet',
    nurLesen: 'KI darf nur lesen',
    nurLesenHinweis:
      'Jede Änderung des Assistenten ist ein eigener Rückgängig-Schritt („KI: …“). Solange Sie ' +
      'mit einem Zeichenwerkzeug arbeiten, lehnt el.easy.CAD seine Änderungen ab. Mit diesem ' +
      'Haken bleibt es beim Lesen.',
    verbunden: 'Dieses Fenster ist verbunden.',
    verbindet: 'Verbindung wird aufgebaut …',
    zuletztAngefragt: 'Zuletzt angefragt von {name} {seit}.',
    nochNichtAngefragt: 'Noch kein KI-Assistent hat angefragt.',
    imTerminal: 'Einmal im Terminal ausführen:',
    desktopVor:
      'In Claude Desktop unter Einstellungen › Entwickler › „Konfiguration bearbeiten“ in die Datei',
    desktopMitte: 'übernehmen (bestehende Einträge unter',
    desktopNach: 'behalten) und Claude Desktop neu starten.',
    zugangstoken: 'Zugangstoken',
    tokenHinweis:
      'Das Token steht in beiden Einträgen oben. Ein neues Token sperrt alle bisher ' +
      'eingerichteten Assistenten aus – danach die Einträge neu übernehmen.',
    neuesToken: 'Neues Token erzeugen',
  },
  tastenkuerzel: {
    titel: 'Tastenkürzel',
    suchen: 'Suchen',
    suchePlatzhalter: 'Befehl oder Taste…',
    nichtVergebbar: '{kuerzel} lässt sich nicht vergeben: {grund}',
    zuruecksetzenTitel: 'Tastenkürzel zurücksetzen',
    zuruecksetzenFrage: 'Alle eigenen Zuweisungen verwerfen und zur Werkseinstellung zurückkehren?',
    fest: 'Fest verdrahtet, nicht änderbar',
    wieTitel:
      'Dasselbe Kürzel wie „{befehl}“ – es öffnet das Werkzeug, das zur Zeichnung passt. ' +
      'Einstellbar dort.',
    wie: '{kuerzel} (wie {befehl})',
    tasteDruecken: 'Taste drücken …',
    entfernen: 'Kürzel entfernen',
    entfernenVon: 'Kürzel von {befehl} entfernen',
    standardVon: 'Kürzel von {befehl} auf Standard zurücksetzen',
    konflikt: '{kuerzel} ist mit „{befehl}“ belegt – zuweisen?',
    zuweisen: 'Zuweisen',
    hinweis:
      'Die Zuweisungen liegen in der Projektdatenbank und bleiben bei einem Programm-Update ' +
      'erhalten. Esc, Enter, Entf, + und − gehören den Zeichenwerkzeugen und sind deshalb nicht ' +
      'vergebbar.',
    alleZuruecksetzen: 'Alle auf Standard zurücksetzen',
  },
  symbolleiste: {
    titel: 'Symbolleiste',
    anzeigen: 'Symbolleiste unter dem Menü anzeigen',
    hinweis:
      'Mit dem Kästchen einen Befehl in die Symbolleiste aufnehmen oder aus ihr entfernen, ' +
      'Reihenfolge per Ziehen ändern. Wo das Menü wechselt, setzt die Leiste einen Trennstrich. ' +
      'Über „Gruppe“ lassen sich Befehle zu einem benannten Aufklappmenü bündeln. ' +
      'Zeichenwerkzeuge stehen in der Werkzeugleiste links.',
    zuruecksetzenTitel: 'Symbolleiste zurücksetzen',
    zuruecksetzenFrage:
      'Reihenfolge, Auswahl und eigene Gruppen der Symbolleiste auf die Werkseinstellung ' +
      'zurücksetzen?',
    neueGruppe: '+ Neue Gruppe…',
    neueGruppeTitel: 'Neue Gruppe',
    name: 'Name',
    umbenennen: 'Gruppe umbenennen',
    loeschen: 'Gruppe löschen',
    loeschenFrage:
      'Gruppe „{name}“ löschen? Ihre Befehle bleiben in der Symbolleiste, aber nicht mehr ' +
      'gruppiert.',
    loeschenKnopf: 'Löschen',
    gruppeZuweisen: 'Einer Gruppe zuweisen',
    keineGruppe: '– keine Gruppe –',
    zuklappen: 'Zuklappen',
    aufklappen: 'Aufklappen',
    befehle: { one: '{n} Befehl', other: '{n} Befehle' },
    gruppeLeer: 'Noch keine Befehle – bei einem Befehl weiter unten „{name}“ als Gruppe wählen.',
  },
  einstellungenDialog: {
    titel: 'Programmeinstellungen',
    entfernen: 'Entfernen',
    reiter: {
      allgemein: 'Allgemein',
      routing: 'Routing (A*)',
      objektfang: 'Objektfang',
      leitungen: 'Leitungen & Kabeltyp',
      blatt: 'Blatt',
      firma: 'Firma & Plankopf',
      tastenkuerzel: 'Tastenkürzel',
      werkzeugleiste: 'Werkzeugleiste',
      symbolleiste: 'Symbolleiste',
      ki: 'KI-Assistent',
      module: 'Module',
      lizenz: 'Lizenz',
    },
    lizenz: {
      titel: 'Lizenz',
      demo: 'Testversion (Demo).',
      lizenziertFuer: 'Lizenziert für {name}.',
      keine: 'Keine gültige Lizenz hinterlegt.',
      hinweis:
        'Alle Angaben zur Lizenz und den Austausch gegen eine neue finden Sie unter ' +
        '„Hilfe › Meine Lizenz…“.',
      oeffnen: 'Meine Lizenz öffnen…',
    },
    allgemein: {
      ersteSchritte: 'Erste Schritte',
      einfuehrungZeigen: 'Die Einführung mit den Videos beim Programmstart zeigen',
      einfuehrungHinweis:
        'Dieselbe Einstellung wie die Checkbox im Dialog selbst. Über „Hilfe › Erste Schritte…“ ' +
        'ist die Einführung jederzeit erreichbar, auch wenn sie beim Start nicht mehr erscheint.',
      tastenfunktionen: 'Tastenfunktionen',
      kontextleiste: 'Tastenfunktionen beim Zeichnen als Leiste einblenden',
      kontextleisteHinweis:
        'Die Leiste zeigt, was Leertaste, Enter, Ziffern und andere Tasten im Werkzeug gerade ' +
        'bewirken, und löst sie per Klick aus. Dieselbe Einstellung wie „Ansicht › ' +
        'Tastenfunktionen“. Auf dem Tablet erscheint die Leiste immer.',
      verteiler: 'Verteiler',
      stromkreisImPanel: 'Stromkreis im Eigenschaften-Panel zeigen',
      stromkreisHinweis:
        'Bei Komponenten und Leitungen, die über eine Klemme oder Sicherung im Verteiler ' +
        'angeschlossen sind: „Stromkreis: UV1-F4 / X6 · RCD F2 · L2“. Am Symbol und am ' +
        'Leitungsschild schalten Sie die Anzeige je Blatt unter „Blatt › Beschriftungen anzeigen“.',
      raster: 'Raster',
      rasterBasis: 'Basis-Rasterabstand (m)',
      rasterHinweis:
        'Das Raster passt sich automatisch an die Zoomstufe an; dieser Wert steuert die Feinheit ' +
        'als Ausgangspunkt.',
      rasterSchaltplan:
        'Diese Zeichnung ist ein Schaltplan: Ihr Raster ist fest auf {cm} cm eingestellt – den ' +
        'Abstand der Kontakte von Leitungsschutzschaltern, Sicherungen und Schützkontakten. Der ' +
        'Wert oben gilt nur für Baupläne.',
      nichtDruckbereich: 'Außerhalb der Zeichenfläche',
      nichtDruckbereichFarbe: 'Farbe',
      nichtDruckbereichDeckkraft: 'Deckkraft (%)',
      nichtDruckbereichStandard: 'Standard',
      nichtDruckbereichHinweis:
        'Alles außerhalb des Druckbereichs wird mit dieser Farbe überdeckt, der Druckbereich ' +
        'bleibt weiß. Der Hintergrundplan erscheint dort gedämpft, Ihre Objekte bleiben voll ' +
        'sichtbar. 0 % schaltet die Fläche ab. Auf Druck und Export wirkt das nicht.',
      pfeiltasten: 'Verschieben mit Pfeiltasten',
      pfeiltaste: 'Pfeiltaste (cm)',
      umschaltPfeiltaste: 'Umschalt + Pfeiltaste (cm)',
      pfeiltastenHinweis:
        'Um so viel bewegen die Pfeiltasten ausgewählte Komponenten – gemessen in echten ' +
        'Zentimetern, unabhängig von Zoom und Maßstab. Vorgabe: 5 cm und 100 cm.',
      installationshoehe: 'Installationshöhe',
      vorgabehoehe: 'Vorgabehöhe {nr} (cm)',
      vorgabehoeheEntfernen: 'Vorgabehöhe {cm} cm entfernen',
      hoeheHinzufuegen: 'Höhe hinzufügen',
      vorgabehoehenHinweis:
        'Diese Höhen stehen im Eigenschaften-Panel einer Komponente als Knöpfe neben dem Feld ' +
        '„Installationshöhe“. Vorgabe: 30 cm und 110 cm.',
      kombinationen: 'Kombinationen an der Wand',
      symbolgroesse: 'Symbolgröße (%)',
      kombinationenHinweis:
        'So groß werden Komponenten gezeichnet, die an einer Wand in einer Kombination sitzen, ' +
        'gemessen an ihrer normalen Größe. Eine Änderung gilt sofort für alle Kombinationen der ' +
        'offenen Zeichnung und für jede weitere, sobald sie geöffnet wird. Vorgabe: {prozent} %.',
      gruppen: 'Gruppen und Wirkverbindungen',
      verknuepfung: 'Nach dem Verlegen einer Leitung Gruppe und Wirkverbindung anbieten',
      verknuepfungHinweis:
        'Verbindet eine Leitung zwei Geräte, zwischen denen eine Wirkverbindung, ein Abgleich ' +
        'zweier Schalter oder eine Gerätegruppe sinnvoll ist, fragt el.easy.CAD gleich danach. ' +
        'Per Rechtsklick an der Leitung geht es auch später.',
      uebertragen: 'Einstellungen übertragen',
      sichern: 'Einstellungen sichern…',
      einspielen: 'Einstellungen einspielen…',
      uebertragenHinweis:
        'Überträgt Werkzeug- und Symbolleiste, Tastenkürzel, Zeichen- und ' +
        'Autorouting-Einstellungen, Firmenlogo und eigene Kabeltypen per Datei in eine andere ' +
        'Installation oder in die Cloud.',
    },
    routing: {
      titel: 'Routing (Leitungen)',
      kostenProMeter: 'Kosten pro Meter Streckenlänge',
      kosten90: 'Kosten pro 90-Grad-Abbiegung',
      kostenHinweis:
        'Steuert, ob der Autorouter eher kurze Strecken oder wenige Abbiegungen bevorzugt. Wirkt ' +
        'nur auf künftige Routing-Vorgänge, nicht rückwirkend auf bereits gezeichnete Leitungen.',
      erstNachLoslassen: 'Leitungen erst nach dem Loslassen neu verlegen',
      erstNachLoslassenHinweis:
        'Beim Verschieben, Drehen und Skalieren von Komponenten werden angeschlossene Leitungen ' +
        'sonst laufend neu berechnet. Eingeschaltet bleiben sie während des Ziehens liegen, ein ' +
        'gestrichelter Strich zeigt den neuen Anschluss; verlegt wird einmal beim Loslassen. ' +
        'Hilft, wenn das Ziehen auf großen Plänen hakt.',
      parallelAbstand: 'Abstand paralleler Leitungen (cm)',
      parallelAbstandHinweis:
        'Laufen mehrere Leitungen dieselbe Strecke, liegen sie so weit nebeneinander – an der ' +
        'Wand von ihr weg in den Raum. 0 legt sie wie früher übereinander. Leitungen biegen immer ' +
        'rechtwinklig ab.',
      feineinstellungen: 'A*-Feineinstellungen',
      sicherheitsabstand: 'Sicherheitsabstand um Komponenten (cm)',
      sicherheitsabstandHinweis:
        'Wie viel Platz eine Leitung um platzierte Komponenten herum lässt. Kleinere Werte ' +
        'erlauben engere Verlegung, größere verhindern zuverlässiger ein Anliegen an der ' +
        'Bauteilkante.',
      sucherweiterungen: 'Maximale Sucherweiterungen',
      sucherweiterungenHinweis:
        'Wie oft der Autorouter seinen Suchbereich vergrößert, bevor er aufgibt und keinen Pfad ' +
        'findet. Höhere Werte lösen mehr Fälle, kosten aber mehr Rechenzeit bei jedem Fehlversuch.',
      wandfuehrung: 'Wandführung',
      wandfuehrungAn: 'Leitungen bevorzugt an Wänden entlang führen',
      wandfuehrungHinweis:
        'Gibt es auf dem Blatt Wände, legt der Autorouter Leitungen lieber in festem Abstand an ' +
        'ihnen entlang. Wände dürfen weiterhin überquert werden, das kostet aber einen Aufschlag; ' +
        'Tür-, Fenster- und Durchbruchöffnungen sind frei.',
      wandabstand: 'Abstand zur Wand (cm)',
      bevorzugung: 'Bevorzugung (%)',
      aufschlag: 'Aufschlag je Wanddurchquerung',
      bevorzugungHinweis:
        'Die Bevorzugung gibt an, um wie viel Prozent ein Meter an der Wand günstiger ist als ' +
        'anderswo. Der Aufschlag wird in denselben Einheiten gerechnet wie die Kosten oben ' +
        '(1 ≈ ein Meter Umweg). Sehr hohe Bevorzugung bei niedrigem Aufschlag kann eine Leitung ' +
        'außen an einer Außenwand entlangführen.',
    },
    objektfang: {
      titel: 'Objektfang',
      hinweis:
        'Welche Fangarten der Objektfang anbietet, wenn er eingeschaltet ist (Werkzeugleiste ' +
        'bzw. Ansicht-Menü). „Nächster Punkt“ ist standardmäßig aus – er liefert auf jeder Kante ' +
        'einen Treffer und ist als bewusst zuschaltbarer Rückfall gedacht.',
    },
    leitungen: {
      titel: 'Leitungen (diese Zeichnung)',
      standardKabeltyp: 'Standard-Kabeltyp für neue Leitungen',
      keinStandard: 'Kein Standard',
      standardKabeltypHinweis:
        'Wird jeder neu gezeichneten Leitung zugewiesen. Bereits gezeichnete Leitungen bleiben ' +
        'unverändert – wie bei den Routingkosten. Beim Zeichnen selbst steht dasselbe Feld auch ' +
        'direkt über der Zeichenfläche.',
      anschlussreserve: 'Anschlussreserve je Kabelende (cm)',
      anschlussreserveAendern: 'Anschlussreserve ändern',
      anschlussreserveHinweis:
        'Geht zweimal – einmal je Kabelende – in die Verlegelänge der Leitungsliste ein. Anders ' +
        'als die Werte darüber wird sie in der Zeichnung gespeichert, sieht also bei jedem gleich ' +
        'aus, der sie öffnet oder ausdruckt.',
    },
    blatt: {
      zeichnungsart: 'Zeichnungsart',
      istBauplan:
        'Diese Zeichnung ist ein Bauplan. Die Art wird beim Anlegen der Zeichnung festgelegt und ' +
        'steuert, welche Werkzeuge die Seitenleiste anbietet.',
      istSchaltplan:
        'Diese Zeichnung ist ein Schaltplan. Die Art wird beim Anlegen der Zeichnung festgelegt ' +
        'und steuert, welche Werkzeuge die Seitenleiste anbietet. Jedes Blatt hat die feste ' +
        'Zeichenfläche A4 quer im Maßstab 1:40.',
      zeichenflaeche: 'Zeichenfläche',
      zeichenflaecheAngaben: 'Blatt „{name}“ · {format} {lage} · 1:{nenner}',
      ohneZeichenflaeche: 'Blatt „{name}“ · noch keine Zeichenfläche eingerichtet',
      hoch: 'hoch',
      quer: 'quer',
      einrichten: 'Zeichenfläche einrichten…',
      verwalten: 'Blätter verwalten…',
      beschriftung: 'Beschriftung & Symbolgröße',
    },
    firma: {
      titel: 'Firmenlogo',
      hinweis:
        'Gilt geräteweit für alle Projekte. Im Plankopf-Dialog lässt sich das jeweils aktuelle ' +
        'Logo in eine Zelle einfügen – als Kopie, ein späterer Logo-Wechsel ändert bereits ' +
        'eingefügte Plankopfe also nicht rückwirkend.',
      nichtHochgeladen: 'Logo konnte nicht hochgeladen werden.',
      wirdHochgeladen: 'Wird hochgeladen…',
      anderesLogo: 'Anderes Logo hochladen…',
      hochladen: 'Firmenlogo hochladen…',
    },
  },
  handbuch: {
    titel: 'Bedienungsanleitung',
    druckTitel: 'el.easy.CAD – Bedienungsanleitung',
    version: 'Version {version}',
    suchen: 'Suchen (z. B. Trunk, PoE, Nullpunkt)…',
    themen: 'Themen',
    drucken: 'Drucken / als PDF',
    nichtsGefunden: 'Nichts gefunden.',
  },
  einfuehrung: {
    ersteSchritte: 'Erste Schritte',
    titel: 'Erste Schritte mit el.easy.CAD',
    keineVideos:
      'Für diese Fassung sind noch keine Videos aufgenommen. Alles Beschriebene steht in der ' +
      'Bedienungsanleitung.',
    handgriffe: 'Einzelne Handgriffe',
    alleVideos: '← Alle Videos',
    ausfuehrlich: 'Ausführlich in der Bedienungsanleitung',
    nichtMehrZeigen: 'Beim Start nicht mehr zeigen',
    weiter: 'Weiter',
  },
  projekteFormat: {
    heute: 'heute',
    gestern: 'gestern',
    vorTagen: { one: 'vor {n} Tag', other: 'vor {n} Tagen' },
    dokumente: { one: '{n} Dokument', other: '{n} Dokumente' },
  },
  dokumentSitzung: {
    dokumentFehlt: 'Das Dokument ist nicht mehr vorhanden.',
    schaltplanFehlt: 'Der Schaltplan ist nicht mehr vorhanden.',
    verteilerplanFehlt: 'Der Verteilerplan ist nicht mehr vorhanden.',
    keinSchaltplan: '„{name}“ ist kein Schaltplan.',
    konflikt:
      'Das Dokument wurde an anderer Stelle geändert. Das automatische Speichern ist ' +
      'angehalten; „Datei › Speichern“ setzt deine Fassung durch.',
    serverNichtErreichbar: 'Nicht gespeichert – der Server ist nicht erreichbar.',
    speichernFehlgeschlagen: 'Speichern fehlgeschlagen.',
  },
  projekte: {
    titel: 'Projekte',
    papierkorb: 'Papierkorb',
    papierkorbHinweis: 'Wiederherstellbar, bis sie endgültig gelöscht werden.',
    sichtbar: { one: '{n} sichtbar', other: '{n} sichtbar' },
    sichtbarGefiltert: { one: '{n} sichtbar (gefiltert)', other: '{n} sichtbar (gefiltert)' },
    startHinweis: 'Dokument auswählen oder neues Projekt anlegen.',
    lizenziertFuer: 'Lizenziert für {name}',
    suchePlatzhalter: 'Kunde, Bezeichnung, Nummer',
    einstellungen: 'Programmeinstellungen',
    einstellungenTitel: 'Programmeinstellungen (Lizenz einspielen, nach Updates suchen)…',
    papierkorbOeffnen: 'Papierkorb…',
    zurueck: 'Zurück zu den Projekten',
    status: {
      angebot: 'Angebot',
      inArbeit: 'In Arbeit',
      abgeschlossen: 'Abgeschlossen',
    },
    dokumentTyp: {
      zeichnung: 'Zeichnung',
      pdf: 'PDF-Anlage',
      notiz: 'Notiz',
      excel: 'Excel-Anlage',
    },
    statusfilter: 'Statusfilter',
    alle: 'Alle',
    archivierteZeigen: 'Archivierte zeigen',
    keinTreffer: 'Kein Projekt passt zum Filter.',
    nochKeinProjekt: 'Noch kein Projekt angelegt.',
    ohneKunde: 'Ohne Kunde',
    archiviertKlein: 'archiviert',
    archiviert: 'Archiviert',
    neuesProjekt: 'Neues Projekt',
    neuesProjektKnopf: 'Neues Projekt…',
    bezeichnung: 'Bezeichnung',
    importieren: 'Importieren…',
    muster: 'Musterprojekt',
    musterArt: {
      bauplan: 'Einfamilienhaus – nur Bauplan',
      elektro: 'Einfamilienhaus – mit Komponenten',
    },
    musterAngelegt: 'Musterprojekt „{name}“ angelegt.',
    musterFehlgeschlagen: 'Das Musterprojekt konnte nicht angelegt werden.',
    projektWaehlen: 'Links ein Projekt auswählen – dann stehen hier Stammdaten und Dokumente.',
    geaendert: 'geändert {zeitpunkt}',
    kunde: 'Kunde',
    projektnummer: 'Projektnummer',
    statusFeld: 'Status',
    notiz: 'Notiz',
    notizPlatzhalter: 'Kurze Bemerkung zum Projekt',
    dokumente: 'Dokumente',
    listeAktualisieren: 'Dokumentliste aktualisieren',
    keineDokumente: 'Noch keine Dokumente – unten eines anlegen.',
    herunterladen: 'Herunterladen',
    oeffnen: 'Öffnen',
    zeichnungSchaltplan: 'Zeichnung · Schaltplan',
    zuletztGeaendert: 'Zuletzt geändert',
    externOeffnen: 'Extern öffnen',
    inExcelOeffnen: 'In Excel öffnen (nur ansehen – Änderungen kommen nicht ins Projekt)',
    imPdfProgrammOeffnen: 'Im PDF-Programm öffnen',
    umbenennen: 'Umbenennen',
    umbenennenKnopf: 'Umbenennen…',
    dokumentUmbenennen: 'Dokument umbenennen',
    name: 'Name',
    loeschen: 'Löschen',
    zeichnungNummer: 'Zeichnung {nr}',
    neueZeichnung: 'Neue Zeichnung…',
    verteilerplanAssistent: 'Verteilerplan-Assistent…',
    neueNotizTitel: 'Neue Notiz',
    notizName: 'Notiz',
    neueNotiz: 'Neue Notiz…',
    pdfAnhaengen: 'PDF anhängen…',
    projektUmbenennen: 'Projekt umbenennen',
    ausArchiv: 'Aus dem Archiv holen',
    archivieren: 'Archivieren',
    zuGross: 'Projekt zu groß.',
    exportFehlgeschlagen: 'Export fehlgeschlagen.',
    exportieren: 'Exportieren…',
    inPapierkorb: 'In den Papierkorb',
    papierkorbLeer: 'Der Papierkorb ist leer.',
    geloeschtAm: 'gelöscht am {datum}',
    wiederherstellen: 'Wiederherstellen',
    wiederhergestellt: '„{name}“ wiederhergestellt.',
    wiederherstellungFehlgeschlagen: 'Wiederherstellung fehlgeschlagen.',
    endgueltigLoeschen: 'Endgültig löschen',
    endgueltigFrage: '„{name}“ wird mit allen Dokumenten und Ständen unwiderruflich gelöscht.',
    endgueltigGeloescht: 'Gelöscht: {anzahl}, {groesse} freigegeben.',
    listeNichtGeladen: 'Die Liste konnte nicht geladen werden.',
    projektNichtAngelegt: 'Projekt konnte nicht angelegt werden.',
    aenderungFehlgeschlagen: 'Änderung fehlgeschlagen.',
    imPapierkorb: '„{name}“ liegt im Papierkorb.',
    loeschenFehlgeschlagen: 'Löschen fehlgeschlagen.',
    zeichnungNichtAngelegt: 'Zeichnung konnte nicht angelegt werden.',
    notizNichtAngelegt: 'Notiz konnte nicht angelegt werden.',
    pdfNichtAngelegt: 'PDF-Anlage konnte nicht angelegt werden.',
    excelOhneInhalt: 'Die Excel-Anlage hat keinen Inhalt.',
    excelArbeitsmappe: 'Excel-Arbeitsmappe',
    excelNichtHeruntergeladen: 'Excel-Anlage konnte nicht heruntergeladen werden.',
    anlageOhneInhalt: 'Die Anlage hat keinen Inhalt.',
    stattOeffnenHeruntergeladen:
      '„{name}“ wurde heruntergeladen – im Browser lässt sich kein Programm starten.',
    anlageNichtGeoeffnet: 'Anlage konnte nicht geöffnet werden.',
    umbenennenFehlgeschlagen: 'Umbenennen fehlgeschlagen.',
    bereitsVorhanden: 'Projekt bereits vorhanden',
    ersetzenFrage: '{meldung} Soll es ersetzt werden? Abbrechen legt stattdessen eine Kopie an.',
    ersetzen: 'Ersetzen',
    importFehlgeschlagen: 'Import fehlgeschlagen.',
    importiert: '„{name}“ importiert: {anzahl}, {staende}.',
    staende: { one: '{n} Stand', other: '{n} Stände' },
  },
}
