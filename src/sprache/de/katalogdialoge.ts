export const katalogdialoge = {
  gemeinsam: {
    abbrechen: 'Abbrechen',
    schliessen: 'Schließen',
    uebernehmen: 'Übernehmen',
    loeschen: 'Löschen',
    duplizieren: 'Duplizieren',
    bearbeiten: 'Bearbeiten',
    speichern: 'Speichern',
    standard: 'Standard',
    eigen: 'Eigen',
    aktiv: 'Aktiv',
    inaktiv: 'Inaktiv',
    wiederAnbieten: 'Wieder anbieten',
    alleKataloge: 'Alle Kataloge',
    alleKategorien: 'Alle Kategorien',
    suche: 'Suche nach Hersteller/Artikelnummer/Name ...',
    keineKomponenten: 'Keine Komponenten gefunden.',
    unbekannterFehler: 'Unbekannter Fehler.',
    speichernFehlgeschlagen: 'Speichern fehlgeschlagen.',
    loeschenFehlgeschlagen: 'Löschen fehlgeschlagen.',
    importFehlgeschlagen: 'Import fehlgeschlagen.',
    exportFehlgeschlagen: 'Export fehlgeschlagen.',
  },

  katalogDialog: {
    titel: 'Produktkatalog',
    vorlageSymbolVariante: 'Symbol der Variante',
    vorlageSymbolHaupt: 'Schaltplansymbol der Hauptkomponente',
    vorlageBildVariante: 'Bild der Variante',
    vorlageBisherigesSymbol: 'Bisheriges Symbol',
    dupliziert: 'Komponente dupliziert.',
    geloescht: 'Komponente gelöscht.',
    alsEigeneAngelegt: 'Als eigene Komponente angelegt – jetzt bearbeitbar.',
    verschoben: 'Verschoben.',
    neuerKatalog: 'Neuer Katalog',
    name: 'Name',
    katalogUmbenennen: 'Katalog umbenennen',
    katalogLoeschenTitel: 'Katalog löschen?',
    katalogLoeschenLeer: '„{name}" wird gelöscht.',
    katalogLoeschenMitKomponenten: {
      one:
        '„{name}" wird mit {n} Komponente gelöscht. ' +
        'Bereits platzierte Komponenten verlieren damit ihren Katalogeintrag.',
      other:
        '„{name}" wird mit {n} Komponenten gelöscht. ' +
        'Bereits platzierte Komponenten verlieren damit ihren Katalogeintrag.',
    },
    katalogGeloescht: 'Katalog gelöscht.',
    excelErgebnis:
      'Excel-Import: {komponenten} Komponente(n), {varianten} Variante(n), ' +
      '{grafiken} Grafik(en) übernommen.',
    zipArchiv: 'ZIP-Archiv',
    namePflicht: 'Name ist ein Pflichtfeld.',
    grafikPflicht: 'Bild oder Schaltplansymbol ist Pflicht - bitte mindestens eines hochladen.',
    varianteFehler: 'Variante {nummer}: {fehler}',
    gespeichert: 'Gespeichert.',
    kataloge: 'Kataloge',
    katalogAnlegenTitel: 'Neuen Katalog anlegen',
    aktivSichtbar: 'aktiv (im Platzieren-Dialog sichtbar)',
    mitgeliefertSchreibgeschuetzt: 'Mitgelieferte Kataloge sind schreibgeschützt.',
    umbenennen: 'Umbenennen…',
    exportieren: 'Exportieren…',
    excelNichtMitgeliefert:
      'Mitgelieferte Kataloge lassen sich nicht per Excel befüllen – dafür einen eigenen Katalog ' +
      'anlegen.',
    excelTitel: 'Viele Komponenten samt Bildern und Symbolen aus einer Excel-Tabelle übernehmen.',
    ausExcel: 'Aus Excel importieren…',
    nurDeaktivieren: 'Mitgelieferte Kataloge lassen sich nur deaktivieren.',
    katalogWaehlen: 'Einen Katalog wählen, um ihn zu verwalten.',
    katalogImportieren: 'Katalog importieren…',
    bibliothekExportieren: 'Bibliothek exportieren…',
    bibliothekImportieren: 'Bibliothek importieren…',
    neueKomponenteKnopf: '+ Neue Komponente',
    komponenteAnsehen: 'Komponente ansehen',
    komponenteBearbeiten: 'Komponente bearbeiten',
    neueKomponente: 'Neue Komponente',
    nurAnsichtHinweis:
      'Mitgelieferte Komponenten sind schreibgeschützt – Änderungen kommen mit Katalog- und ' +
      'Programmupdates. Für eigene Anpassungen „Als eigene Komponente bearbeiten…“ wählen.',
    abgeleitetVon: 'Abgeleitet von „{name}“.',
    namePflichtLabel: 'Name *',
    hersteller: 'Hersteller',
    artikelnummer: 'Artikelnummer',
    stromverbrauch: 'Stromverbrauch max. (Watt)',
    poeLeistung: 'PoE-Leistungsaufnahme (Watt)',
    poeHinweis:
      'Nur für Geräte, die über PoE gespeist werden - Grundlage der PoE-Summe am Switch. ' +
      'Leer lassen, wenn das Gerät eine eigene Stromversorgung hat.',
    bemessungswerte: 'Bemessungswerte',
    bemessungHinweis:
      'Für den IFC-Export (Typenschild). Varianten können einzelne Werte abweichend angeben; ' +
      'leere Felder bleiben weg.',
    kategorie: 'Kategorie',
    typ: 'Typ',
    keinTyp: 'Kein Typ',
    typHinweis:
      'Vorauswahl für neu platzierte Instanzen dieser Komponente – bleibt im Eigenschaften-Panel ' +
      'der Zeichnung weiterhin änderbar.',
    ansteuerung: 'Ansteuerung',
    keineVorbelegung: 'Keine Vorbelegung',
    ansteuerungHinweis:
      'Vorauswahl der Ansteuerung (z. B. Dimmen bei einem Dimmaktor) für neu platzierte Instanzen.',
    stromkreis: 'Stromkreis',
    stromkreisNachTyp: 'Nach Gerätetyp',
    stromkreisKein: 'kein',
    stromkreisRaum: 'Raumstromkreis',
    stromkreisEigen: 'eigener Stromkreis',
    stromkreisHinweis:
      'Vorgabe für „Bestückung aus Räumen vorschlagen“ – nach Gerätetyp heißt Raumstromkreis bei ' +
      'Verbraucher und Anschlussdose, sonst kein.',
    polzahl: 'Polzahl',
    bauart: 'Bauart',
    bauartStandard: 'Standard (bei Ports: Switch)',
    bauartPatchpanel: 'Patchpanel',
    bauartVerteiler: 'Verteiler',
    bauartHinweis:
      'Ein Verteiler bekommt beim Platzieren ein Ortskennzeichen (+UV1) und eine Bestückung; ' +
      'Leitungen werden darin auf Sicherungen, Klemmen und Relais angeschlossen.',
    kennzeichen: 'Betriebsmittelkennzeichen (Buchstabe)',
    kennzeichenHinweis:
      'Schlägt beim Platzieren automatisch „Buchstabe + nächste freie Zahl" als ' +
      'Betriebsmittelkennzeichen vor (z. B. „F1") – frei überschreibbar. Üblich: F für ' +
      'Leitungsschutzschalter/RCD/Sicherung, K für Relais-/Schütz-Spule und -Kontaktblock, X für ' +
      'Klemmen, P für Zähler. Leer lassen für keinen Vorschlag.',
    rolle: 'Rolle (nur bei Kennzeichen „K")',
    keineAngabe: 'Keine Angabe',
    spule: 'Spule',
    kontaktblock: 'Kontaktblock',
    rolleHinweis:
      'Unterscheidet Relais-/Schütz-Spule von ihrem Kontaktblock – Grundlage der ' +
      'Verwaisungsprüfung in der Betriebsmittelliste (genau eine Spule je Kennzeichen erwartet).',
    slotMatrix: 'Slot-Matrix',
    spalten: { one: '{n} Spalte', other: '{n} Spalten' },
    zeilen: 'Zeilen',
    reihe: 'Reihe {nummer}',
    standardSpalten: { one: 'Standard ({n} Spalte)', other: 'Standard ({n} Spalten)' },
    slotMatrixHinweis:
      'Rasterform, in der neu platzierte Instanzen ihre Slots zeigen (grafische Slot-Matrix statt ' +
      'Liste) - bleibt an der platzierten Komponente danach frei änderbar. Einzelne Reihen können ' +
      'abweichend von der Standard-Spaltenzahl 1 oder 2 Spalten breit sein.',
    slotVorlagen: 'Slot-Vorlagen',
    slotAusserhalb: 'Passt nicht mehr in die gewählte Slot-Matrix - wird beim Platzieren ignoriert',
    slotNummer: 'Slot {nummer}',
    slotMitPosition: 'Slot {nummer} (Zeile {zeile}, Spalte {spalte})',
    slotBezeichnungPlatzhalter: 'Slot-Bezeichnung, z. B. Treppenhausbeleuchtung',
    nachOben: 'Nach oben verschieben',
    nachUnten: 'Nach unten verschieben',
    slotVorlageEntfernen: 'Slot-Vorlage entfernen',
    slotVorlageHinzufuegen: '+ Slot-Vorlage hinzufügen',
    slotVorlagenHinweis:
      'Jede neu platzierte Instanz dieser Komponente startet mit genau diesen Slots – danach im ' +
      'Eigenschaften-Panel der Zeichnung frei änderbar/löschbar.',
    hauptgruppe: 'Hauptgruppe',
    hauptgruppeHinweis: 'Produktfamilie, z. B. „Türkommunikation".',
    untergruppe: 'Untergruppe',
    untergruppeHinweis:
      'Rolle im Anlagenaufbau, z. B. „Türstation", „Wohnungsstation" oder „Systemgerät".',
    bildUndSymbol: 'Bild und Schaltplansymbol *',
    bildUndSymbolHinweis:
      'Mindestens eines von beiden. Welches im Plan erscheint, wird je Blatt (Beschriftung & ' +
      'Symbolgröße) oder je Komponente festgelegt; fehlt es, springt das andere ein.',
    symbolUndAnschluesse: 'Symbol und Anschlüsse',
    breitenfaktor: 'Breitenfaktor',
    breitenfaktorPlatzhalter: '1 (quadratisch)',
    breitenfaktorHinweis:
      'Wie viel breiter als hoch das Symbol ist, z. B. 2 für einen Switch mit vielen Ports. ' +
      'Leer = quadratisch. Gilt auch für die Fläche beim Symbolzeichnen.',
    hoehenfaktor: 'Höhenfaktor',
    hoehenfaktorPlatzhalter: '1 (Grundhöhe)',
    hoehenfaktorHinweis:
      'Wie viel höher als die Grundgröße das Symbol ist, z. B. 2 für einen hohen Klemmenblock. ' +
      'Texte und Anschlussbezeichnungen bleiben gleich groß. Leer = Grundhöhe. Wirkt nicht bei ' +
      'Modulträgern.',
    kombinierbar: 'Darf Teil einer Kombination sein',
    kombinierbarHinweis:
      'An der Wand mit anderen zu einer Kombination zusammengefasst. Ohne Haken fängt die ' +
      'Komponente allein an der Wand, in normaler Größe.',
    montageort: 'Montageort',
    montageDecke: 'Decke',
    montageWand: 'Wand',
    montageBoden: 'Boden',
    montageortHinweis:
      'Vorgabe beim Platzieren, je Komponente in der Zeichnung änderbar. An der Decke sitzt sie ' +
      'unter der Decke, auf dem Boden auf dem Fußboden.',
    technischeDaten: 'Technische Daten',
    technischeDatenFormat: 'Ein Eintrag pro Zeile, Format "Schlüssel: Wert"',
    varianten: 'Varianten',
    varianteBezeichnung: 'Bezeichnung (leer = geerbt)',
    varianteFarbe: 'Farbe/Ausführung',
    varianteArtikelnummer: 'Artikelnummer (leer = geerbt)',
    varianteEntfernen: 'Variante entfernen',
    varianteHinzufuegen: '+ Variante hinzufügen',
    zeichnerTitelHaupt: 'Schaltplansymbol zeichnen',
    zeichnerTitelVariante: 'Symbol der Variante zeichnen',
    bildLaedt: 'Bild wird hochgeladen…',
    zurueck: 'Zurück',
    alsEigeneBearbeiten: 'Als eigene Komponente bearbeiten…',
    grafik: {
      produktbild: {
        titel: 'Produktbild',
        hochladenAria: 'Produktbild hochladen',
        hochladenTitel: 'Produktbild aus einer Bilddatei übernehmen',
        entfernen: 'Produktbild entfernen',
      },
      schaltplansymbol: {
        titel: 'Schaltplansymbol',
        hochladenAria: 'Schaltplansymbol hochladen',
        hochladenTitel: 'Schaltplansymbol aus einer Bilddatei übernehmen',
        entfernen: 'Schaltplansymbol entfernen',
      },
    },
    symbolBearbeiten: 'Symbol bearbeiten…',
    symbolZeichnen: 'Symbol zeichnen…',
    hochladen: 'Hochladen…',
    varianteGrafik: {
      bild: {
        alt: 'Bild der Variante',
        geerbt: 'Bild geerbt',
        eigenes: 'Eigenes Bild (leer = geerbt)',
        ersetzen: 'Bild ersetzen…',
        hochladen: 'Bild hochladen…',
        entfernen: 'Eigenes Bild entfernen (dann wieder geerbt)',
      },
      symbol: {
        alt: 'Symbol der Variante',
        geerbt: 'Symbol geerbt',
        eigenes: 'Eigenes Symbol (leer = geerbt)',
        ersetzen: 'Symbol ersetzen…',
        hochladen: 'Symbol hochladen…',
        entfernen: 'Eigenes Symbol entfernen (dann wieder geerbt)',
      },
    },
    gezeichnetesBearbeiten: 'Gezeichnetes Symbol bearbeiten',
    eigenesZeichnen: 'Eigenes Symbol zeichnen',
    bearbeitenKlein: 'bearbeiten…',
    zeichnenKlein: 'zeichnen…',
    geerbt: 'geerbt',
    verschiebenTitel: 'In einen anderen Katalog verschieben',
  },

  katalogEntwurf: {
    nennstrom: 'Nennstrom',
    nennspannung: 'Nennspannung',
    polzahl: 'Polzahl',
    keineZahl: '{feld}: „{wert}“ ist keine Zahl über 0.',
    keineGanzeZahl: '{feld}: „{wert}“ ist keine ganze Zahl über 0.',
    keineSchutzart: 'IP-Schutzart: „{wert}“ ist keine Schutzart wie IP44.',
  },

  picker: {
    titel: 'Komponente aus dem Katalog wählen',
    variante: 'Variante',
    platzieren: 'Platzieren',
    kachelgroesse: 'Kachelgröße',
  },

  kabeltypen: {
    titel: 'Kabeltypen verwalten',
    hinweis:
      'Gilt für alle Zeichnungen. Eine Umbenennung wirkt auf jede Zeichnung, die diesen Kabeltyp ' +
      'verwendet – auch auf bereits gedruckte.',
    inBenutzung: '"{name}" wird in dieser Zeichnung verwendet - stattdessen inaktiv schalten.',
    uebernommen: '{n} Kabeltyp(en) übernommen.',
    nichtImBestand: '{n} Kabeltyp(en) dieser Zeichnung sind hier nicht im Bestand.',
    inMeineUebernehmen: 'In meine Kabeltypen übernehmen',
    alle: 'Alle ({n})',
    suchen: 'Suchen…',
    ausAuswahl: 'Aus der Auswahl nehmen',
    mitgeliefertDuplizieren: 'Mitgelieferte Typen bitte duplizieren - die Kopie ist frei änderbar.',
    nurDeaktivieren: 'Mitgelieferte Typen lassen sich nur deaktivieren.',
    keinGefunden: 'Kein Kabeltyp gefunden.',
    eigeneGruppe: 'Eigene Kabeltypen',
    neu: 'Neuer Kabeltyp…',
    bezeichnung: 'Bezeichnung (so steht sie im Plan)',
    gruppe: 'Gruppe',
    bemerkung: 'Bemerkung (nur hier sichtbar, hilft beim Suchen)',
    aussendurchmesser: 'Außendurchmesser (mm, optional)',
    standardAendern: 'Standard-Kabeltyp ändern',
  },

  installationszonen: {
    titel: 'Installationszonen verwalten',
    hinweis:
      'Gilt für alle Zeichnungen. Ändern Sie eine eigene Zone, rechnet jede Zeichnung, die sie ' +
      'verwendet, beim nächsten Öffnen mit den neuen Werten – Verlegelängen ändern sich mit.',
    inBenutzung: '„{name}“ wird in dieser Zeichnung verwendet – stattdessen ausblenden.',
    uebernommen: '{n} Installationszone(n) übernommen.',
    uebernehmenFehlgeschlagen: 'Übernehmen fehlgeschlagen.',
    nichtImBestand: '{n} Installationszone(n) dieser Zeichnung sind hier nicht im Bestand.',
    inMeineUebernehmen: 'In meine Zonen übernehmen',
    ausAuswahl: 'Aus den Auswahllisten nehmen',
    ausgeblendet: 'Ausgeblendet',
    standardDuplizieren: 'Standardzonen bitte duplizieren – die Kopie ist frei änderbar.',
    nurAusblenden: 'Standardzonen lassen sich nur ausblenden.',
    neu: 'Neue Zone…',
    bezeichnung: 'Bezeichnung (so steht sie in den Auswahllisten)',
    kuerzel: 'Kürzel (auf dem Plan an Teilstücken, bis 3 Zeichen)',
    bauteil: 'Bauteil',
    bauteilDecke: 'Decke',
    bauteilWand: 'Wand',
    bauteilBoden: 'Boden',
    verlegung: 'Verlegung',
    verlegungAuf: 'auf dem Bauteil (Aufputz, AP)',
    verlegungIn: 'im Bauteil (Unterputz, UP)',
    tiefe: 'Tiefe (cm, Mitte der Leitung hinter der Bauteiloberfläche)',
    tiefeRohdecke: 'Mitte der Rohdecke',
    hoeheGemessen: 'Höhe gemessen',
    ueberFussboden: 'über dem Fußboden',
    unterDecke: 'unter der Decke',
    abstand: 'Abstand (cm, bis zur Mitte der Zone)',
    farbe3d: 'Farbe in der 3D-Ansicht',
    beschreibung: '{bauteil}, {art}',
    beschreibungMitHoehe: '{bauteil}, {art}, {hoehe}',
    artAuf: 'auf (AP)',
    artIn: 'in (UP)',
    artInRohdecke: 'in (UP), Mitte der Rohdecke',
    artInTiefe: 'in (UP), {tiefe} tief',
    hoeheUnterDecke: '{abstand} unter der Decke',
    hoeheUeberBoden: '{abstand} über dem Fußboden',
    zentimeter: '{wert} cm',
    keineAngabe: 'keine Angabe',
    unbekannt: 'unbekannte Zone „{zone}“',
  },

  paketZahlen: {
    katalogNeu: 'neuer Katalog',
    neu: '{n} neu',
    aktualisiert: '{n} aktualisiert',
    unveraendert: '{n} unverändert',
    ausgemustert: '{n} ausgemustert',
    uebersprungen: '{n} übersprungen (Kennung bereits vergeben)',
    zurueckgezogen: 'Katalog zurückgezogen, {n} Komponente(n) ausgemustert',
  },

  katalogImport: {
    eingespielt: '„{name}" eingespielt: {zahlen}.',
    importiert: '„{name}" importiert: {komponenten} Komponente(n), {bilder} neue(s) Bild(er).',
    aktuell: '„{name}" ist bereits auf dem neuesten Stand.',
    zurueckziehenTitel: 'Katalog zurückziehen',
    zurueckziehenText:
      'Der Hersteller zieht den mitgelieferten Katalog „{name}" zurück. Er verschwindet aus ' +
      'Katalogverwaltung und Auswahl; bereits platzierte Komponenten bleiben in den Zeichnungen ' +
      'unverändert.',
    zurueckziehen: 'Zurückziehen',
    hinzufuegenTitel: 'Katalog hinzufügen',
    aktualisierenTitel: 'Katalog aktualisieren',
    mitgeliefertText:
      '„{name}" ist ein mitgelieferter Katalog: {zahlen}. Eigene Komponenten bleiben ' +
      'unverändert; bereits platzierte Komponenten übernehmen den neuen Stand beim nächsten ' +
      'Öffnen ihrer Zeichnung.',
    einspielen: 'Einspielen',
    vorhandenTitel: 'Katalog bereits vorhanden',
    alsKopieFrage: '{meldung} Als Kopie anlegen?',
    alsKopie: 'Als Kopie anlegen',
    ersetzenFrage: '{meldung} Soll er ersetzt werden? Abbrechen legt stattdessen eine Kopie an.',
    ersetzen: 'Ersetzen',
  },

  bibliothekImport: {
    titel: 'Bibliothek importieren',
    hinweis:
      'Exportiert am {datum} aus {anwendung}. Wählen Sie je Katalog, was geschehen soll. ' +
      'Platzierte Komponenten in Zeichnungen bleiben unverändert.',
    wirdGeprueft: 'Wird geprüft…',
    spalteKatalog: 'Katalog',
    spalteKomponenten: 'Komponenten',
    spalteStand: 'Stand',
    spalteAktion: 'Aktion',
    auslassen: 'Auslassen',
    alsKopie: 'Als Kopie anlegen',
    zurueckziehen: 'Zurückziehen',
    aktualisieren: 'Aktualisieren',
    importieren: 'Importieren',
    ersetzen: 'Vorhandenen ersetzen',
    hinweisEigene: 'Ihre eigenen Komponenten – nur als zusätzlicher Katalog übernehmbar.',
    hinweisZurueckgezogen:
      'Vom Hersteller zurückgezogen – platzierte Komponenten bleiben in den Zeichnungen.',
    hinweisMitgeliefert: 'Mitgeliefert: {zahlen}',
    katalogNeu: 'neu',
    hinweisAktuell: 'Mitgeliefert, bereits auf dem neuesten Stand.',
    hinweisNeu: 'Neu auf dieser Installation.',
    hinweisKennungStandard: 'Kennung gehört hier zum mitgelieferten Katalog „{name}“.',
    hinweisVorhanden: 'Schon vorhanden als „{name}“.',
    nichtLesbar: 'Nicht lesbar.',
    fehlgeschlagen: 'fehlgeschlagen',
    regelwerkFehler: 'Gerätetypen & Regeln: {fehler}',
    eingespielt: 'Eingespielt: {namen}.',
    keineEingespielt: 'Keine Kataloge eingespielt.',
    regelwerkVersion: 'Gerätetypen & Regeln: Version {version}.',
    fehlerListe: 'Fehler: {liste}',
    regelwerkUebernehmen: 'Gerätetypen & Regeln übernehmen (Version {neu}, hier {hier})',
    regelwerkAktuell: 'Gerätetypen & Regeln: hier schon Version {hier} – nichts zu übernehmen',
    wirdEingespielt: 'Wird eingespielt…',
    einspielen: 'Einspielen',
    nichtOeffnen: 'Die Bibliothek ließ sich nicht öffnen.',
    wirdZusammengestellt: 'Bibliothek wird zusammengestellt…',
  },

  excelImport: {
    titel: 'Aus Excel importieren',
    titelMitZiel: 'Aus Excel importieren – „{ziel}“',
    hinweis:
      'Eine Zeile je Komponente, Bild und Symbol als Dateiname oder per Strg+K (Mac: ⌘K) in ' +
      'Excel verlinkt. Komponenten mit gleicher Artikelnummer werden aktualisiert, leere Zellen ' +
      'ändern nichts. Die Musterdateien zeigen den Aufbau.',
    grafikBleibt: 'bleibt',
    grafikGewaehlt: '{name} (gewählt)',
    grafikFehlt: '{name} fehlt',
    statusNeu: 'neu',
    statusAktualisiert: 'aktualisiert',
    statusFehler: 'Fehler',
    bildWaehlen: 'Bilddatei auswählen',
    symbolWaehlen: 'Symboldatei auswählen',
    waehlen: 'wählen…',
    auswahlZuruecknehmen: 'Auswahl zurücknehmen',
    komponenten: 'Komponenten',
    varianten: 'Varianten',
    spalteZeile: 'Zeile',
    spalteStatus: 'Status',
    spalteKomponente: 'Komponente',
    spalteName: 'Name',
    spalteFarbeName: 'Farbe / Name',
    spalteArtikelnummer: 'Artikelnummer',
    spalteBild: 'Bild',
    spalteSymbol: 'Symbol',
    spalteHinweise: 'Hinweise',
    excelWaehlen: 'Excel-Datei wählen…',
    nochKeineDatei: 'noch keine Datei',
    ordnerWaehlen: 'Bilderordner wählen…',
    dateienWaehlen: 'Bilddateien wählen…',
    grafikenBereit: '{n} Grafik(en) bereit',
    optional: 'optional',
    leeren: 'leeren',
    vorschauLeer: 'Nach der Auswahl der Excel-Datei erscheint hier die Vorschau.',
    keineZeilen: 'Die Tabelle enthält keine Zeilen.',
    downloadFehlgeschlagen: 'Download fehlgeschlagen.',
    musterHerunterladen: 'Musterdateien herunterladen',
    zusammenfassung: '{neu} neu, {aktualisiert} aktualisiert',
    zusammenfassungMitFehlern:
      '{neu} neu, {aktualisiert} aktualisiert, {fehler} fehlerhaft (werden übersprungen)',
    importiere: 'Importiere…',
    zeilenImportieren: '{n} Zeile(n) importieren',
  },

  dockpunkte: {
    titel: 'Dockpunkte',
    standardHinweis:
      'Ohne eigene Festlegung gelten automatisch 8 Standardpunkte (4 Ecken + 4 Kantenmitten).',
    freiPlatzieren: '+ Frei platzieren (Maus)',
    portgruppen: '+ Portgruppen',
    titelFrei: 'Dockpunkte (frei platziert)',
    titelPorts: 'Dockpunkte (Portgruppen)',
    zurueckStandard: 'Zurück zu den 8 Standardpunkten',
    typPlatzhalter: 'Typ (z. B. RJ45)',
    porttyp: 'Porttyp',
    anzahl: 'Anzahl',
    anzahlPorts: 'Anzahl Ports',
    reihen: 'Reihen',
    portgruppeEntfernen: 'Portgruppe entfernen',
    portgruppe: '+ Portgruppe',
    trunkPunkte: 'Trunk-Sonderpunkte (nur für Trunks, keine Einzelleitung)',
    lageOberkante: 'Lage auf der Oberkante (0 bis 1)',
    trunkPunktEntfernen: 'Trunk-Punkt entfernen',
    trunkPunkt: '+ Trunk-Punkt',
    klickEntfernen: 'Klicken zum Entfernen',
    vorschauHinweis:
      'Klick auf freie Fläche setzt einen Dockpunkt, Klick auf einen Punkt entfernt ihn.',
    bezeichnung: 'Bezeichnung',
    bezeichnungAria: 'Bezeichnung Dockpunkt {nummer}',
    bezeichnungTitel: 'Anschlussbezeichnung, z. B. 13, A1, L1, PE',
    nurTrunk: 'nur Trunk',
    dockpunktEntfernen: 'Dockpunkt entfernen',
    portVorschau: 'Vorschau der aus den Portgruppen berechneten Dockpunkte.',
  },

  fangpunkt: {
    titelEigen: 'Fangpunkt (eigene Festlegung)',
    titelStandard: 'Fangpunkt (Standard)',
    zurueck: 'Zurück zum Standard (erster Dockpunkt)',
    hinweis:
      'Dieser Punkt hängt beim Platzieren am Mauszeiger und rastet auf dem Raster ein. Ohne ' +
      'eigene Festlegung ist es der erste Dockpunkt (bei 8 Standardpunkten die Mitte). Klick auf ' +
      'das Symbol setzt ihn; nahe einem Dockpunkt oder der Mitte rastet er dort ein.',
    xAria: 'Fangpunkt x (0 bis 1)',
    yAria: 'Fangpunkt y (0 bis 1)',
  },

  textElemente: {
    titel: 'Texte (Klemmenbezeichnung, variable Texte)',
    hinweis:
      'Klick auf freie Fläche legt einen Text an, Klick auf einen bestehenden wählt ihn aus, ' +
      'Ziehen verschiebt ihn. Variable Texte werden erst in der Zeichnung je Komponente rechts im ' +
      'Eigenschaftenpanel ausgefüllt.',
    links: 'links',
    mittig: 'mittig',
    rechts: 'rechts',
    oben: 'oben',
    unten: 'unten',
    drehungWaagerecht: '0° – immer waagerecht',
    drehungMit: '{grad}° – dreht mit',
    neuerText: 'Text',
    neuesFeld: 'Feld {nummer}',
    art: 'Art',
    fest: 'Fester Text',
    variabel: 'Variabler Text',
    feldname: 'Feldname',
    feldnamePlatzhalter: 'z. B. Nennstrom',
    feldnameDoppelt:
      'Diesen Feldnamen trägt schon ein anderer Text – beide erhalten dann immer denselben Wert.',
    vorgabewert: 'Vorgabewert (leer = erst in der Zeichnung eintragen)',
    text: 'Text',
    schriftgroesse: 'Schriftgröße (% der Symbolhöhe)',
    waagerecht: 'Ausrichtung waagerecht',
    senkrecht: 'Ausrichtung senkrecht',
    drehung: 'Drehung',
    fixiertHinweis:
      'Der Text sitzt fest am Symbol und dreht sich mit der Komponente wie ein gezeichneter Text ' +
      '– auch auf den Kopf.',
    gedrehtHinweis:
      'Ein gedrehter Text dreht sich mit der Komponente, steht aber nie auf dem Kopf – er liest ' +
      'sich immer von unten oder von rechts.',
    fixieren: 'Am Symbol fixieren (dreht wie gezeichneter Text)',
    inStueckliste: 'In der Stückliste aufführen',
    fertig: 'Fertig',
  },

  symbolUndAnschluesse: {
    ohneGrafik:
      'Erst Symbol zeichnen oder ein Bild hochladen – dann lassen sich hier Dockpunkte, ' +
      'Fangpunkt und Textelemente auf dem Symbol setzen.',
  },

  symbolZeichner: {
    titel: 'Symbol zeichnen',
    werkzeuge: {
      auswahl: 'Auswahl',
      linie: 'Linie',
      polylinie: 'Polylinie',
      rechteck: 'Rechteck',
      kreis: 'Kreis',
      bogen: 'Bogen',
      text: 'Text',
      freihand: 'Freihand',
      radierer: 'Radierer',
    },
    duenn: 'dünn',
    mittel: 'mittel',
    dick: 'dick',
    klein: 'klein',
    gross: 'groß',
    strichstaerke: 'Strichstärke',
    fuellung: 'Füllung',
    textgroesse: 'Textgröße',
    vorlageUebernehmen: 'Vorlage übernehmen',
    vorlageFehler: 'Die Vorlage konnte nicht übernommen werden.',
    bildgroesse: 'Bildgröße',
    bildgroesseProzent: 'Bildgröße (%)',
    zeichenwerkzeuge: 'Zeichenwerkzeuge',
    rueckgaengig: '↶ Rückgängig',
    rueckgaengigTitel: 'Rückgängig (Strg/⌘+Z)',
    wiederholen: '↷ Wiederholen',
    wiederholenTitel: 'Wiederholen (Strg/⌘+Umschalt+Z)',
    text: 'Text',
    vorschau: 'Vorschau',
    strich: 'Strich',
    radiererGroesse: 'Radierer-Größe',
    auswahlLoeschen: 'Auswahl löschen',
    rasterUndFang: 'Raster und Fang',
    vorlage: 'Vorlage',
    blassEinblenden: 'blass einblenden',
    alsTeilTitel:
      'Bettet die Vorlage fest ins Symbol ein - danach lässt sie sich ergänzen und radieren.',
    alsTeil: 'Als Teil übernehmen',
    einpassen: 'Ansicht einpassen',
    navigationHinweis:
      'Mausrad zoomt, mittlere Maustaste oder Leertaste + Ziehen verschiebt die Ansicht.',
    allesLoeschen: 'Alles löschen',
    verwerfenFrage: 'Änderungen wirklich verwerfen?',
    leerTitel: 'Eine leere Zeichnung lässt sich nicht übernehmen.',
  },

  symbolWerkzeuge: {
    radiererStatus:
      'Über die Zeichnung ziehen, um Teile wegzuradieren. Die Spur gehört zu den getroffenen ' +
      'Elementen.',
    radieren: 'Radieren',
    auswahlStatus:
      'Element anklicken oder Rahmen aufziehen (Umschalt ergänzt). Ziehen verschiebt, Entf ' +
      'löscht, Doppelklick auf Text bearbeitet ihn.',
    textAendern: 'Text ändern',
    verschieben: 'Verschieben',
    linieStart: 'Startpunkt der Linie klicken.',
    linieEnde: 'Endpunkt klicken (Umschalt: 15°-Schritte).',
    rechteckStart: 'Erste Ecke des Rechtecks klicken.',
    rechteckEnde: 'Gegenüberliegende Ecke klicken.',
    kreisStart: 'Mittelpunkt des Kreises klicken.',
    kreisEnde: 'Punkt auf dem Kreis klicken (legt den Radius fest).',
    polylinieStart: 'Ersten Punkt der Polylinie klicken.',
    polylinieWeiter:
      'Weitere Punkte klicken. Doppelklick oder Enter beendet, Klick auf den Startpunkt ' +
      'schließt, Rücktaste entfernt den letzten Punkt.',
    bogenMitte: 'Mittelpunkt des Bogens klicken.',
    bogenStart: 'Startpunkt des Bogens klicken (legt den Radius fest).',
    bogenEnde: 'Endpunkt klicken - der Bogen läuft im Uhrzeigersinn.',
    textStatus: 'Stelle für den Text klicken (Mitte des Textes).',
    textEingeben: 'Text eingeben - Enter übernimmt, Umschalt+Enter beginnt eine neue Zeile.',
    freihandStatus: 'Mit gedrückter Maustaste oder dem Finger zeichnen.',
  },

  slots: {
    weitereSlots: {
      one: 'Ein weiterer Slot zeigt danach ebenfalls auf die Gruppe statt auf eine einzelne Komponente.',
      other:
        '{n} weitere Slots zeigen danach ebenfalls auf die Gruppe statt auf eine einzelne ' +
        'Komponente.',
    },
    slotsEntfallen: 'Eigene Slots von {namen} entfallen in der Gruppe.',
    slotsAendern: 'Slots ändern',
    tretenBei: {
      one: '{namen} tritt der Gruppe „{gruppe}“ bei.',
      other: '{namen} treten der Gruppe „{gruppe}“ bei.',
    },
    gruppeBildenTitel: 'Gerätegruppe bilden',
    gruppeBildenText:
      '{slot} von {quelle} wirkt dann auf {ziele}. Sie kommen in eine gemeinsame Gerätegruppe, ' +
      'der Slot zeigt danach auf die Gruppe. „Abbrechen“ verwirft die neue Wirkverbindung.',
    gruppeAusWirkverbindung: 'Gerätegruppe aus Wirkverbindung bilden',
  },
}
