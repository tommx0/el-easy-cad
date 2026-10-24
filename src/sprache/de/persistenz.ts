export const persistenz = {
  dateiAuswahl: {
    zeichnung: 'el.easy.CAD-Zeichnung',
  },
  apiClient: {
    nichtErreichbar: 'Der el.easy.CAD-Server ist nicht erreichbar.',
    serverAntwort: 'Der Server hat mit {status} geantwortet.',
  },
  projektAustausch: {
    downloadFehlgeschlagen: 'Download fehlgeschlagen ({status}).',
    exportDateiname: 'Export',
    archiv: 'Archiv',
  },
  bibliothek: {
    nichtLesbar: 'Die Datei ist keine lesbare el.easy.CAD-Bibliothek.',
    dateiFehlt: 'In der Datei fehlt „{datei}“.',
    katalogFehlt: 'In der Datei fehlt der Katalog „{name}“.',
  },
  einstellungen: {
    ungueltigeDatei: 'Keine gültige el.easy.CAD-Einstellungsdatei.',
    bereichOberflaeche: 'Oberfläche',
    bereichZeichnen: 'Zeichnen',
    bereichAutorouting: 'Autorouting',
    bereichFirmenlogoUndKabeltypen: 'Firmenlogo, Kabeltypen und Installationszonen',
    hinweisOberflaeche:
      'Werkzeug-Seitenleiste und Symbolleiste (Reihenfolge, Sichtbarkeit), Seitenleiste, Eigenschaften-Panel, Erscheinungsbild, Tastenkürzel',
    hinweisZeichnen:
      'Objektfang-Arten, Rasterabstand, Pfeiltasten-Schrittweiten, Bemaßungsart, Vorgabehöhen, Symbolgröße an der Wand',
    hinweisAutorouting:
      'Kosten, Sicherheitsabstand, Suchbereich, Wandführung, automatisch anordnen',
    hinweisFirmenlogoUndKabeltypen:
      'Firmenlogo für den Plankopf, die eigenen Kabeltypen und die eigenen Installationszonen',
  },
  zeichnungsDatei: {
    speichernAbgebrochen: 'Speichern abgebrochen.',
    nichtAutomatischLadbar:
      'Datei kann nicht automatisch geladen werden - bitte über "Öffnen" erneut auswählen.',
    keineLeseberechtigung: 'Keine Leseberechtigung für die Datei erteilt.',
    keineSchreibberechtigung: 'Keine Schreibberechtigung für die Datei erteilt.',
    dateinameErforderlich: 'Dateiname erforderlich.',
    dateinameVorgabe: 'Zeichnung',
  },
  katalogExcel: {
    keineZahl: '„{spalte}“: „{wert}“ ist keine gültige Zahl.',
    nichtNull: '„{spalte}“ darf nicht 0 sein.',
    keineGanzeZahl: '„{spalte}“: „{wert}“ ist keine ganze Zahl über 0.',
    keineSchutzart: '„{spalte}“: „{wert}“ ist keine Schutzart wie IP44.',
    typUnbekannt: '„{spalte}“: „{wert}“ ist unbekannt (erlaubt: {erlaubt}).',
    blattFehlt: 'Die Datei enthält kein Tabellenblatt „{blatt}“.',
    spalteFehlt: 'Im Blatt „{blatt}“ fehlt die Spalte „{spalte}“ in Zeile 1.',
    spalteLeer: '„{spalte}“ ist leer.',
    artikelnummerMehrfach: 'Artikelnummer kommt mehrfach vor (Zeilen {zeilen}).',
    variantenSpalteFehlt:
      'Im Blatt „{blatt}“ fehlt die Spalte „{spalte}“ – Varianten werden übersprungen.',
    varianteOhneAngaben: 'Variante braucht mindestens Farbe, Name oder Artikelnummer.',
    keineArbeitsmappe: 'Die Datei ist keine lesbare Excel-Arbeitsmappe (.xlsx).',
    bilddateiFehlt: 'Bilddatei „{name}“ nicht gefunden.',
    symboldateiFehlt: 'Symboldatei „{name}“ nicht gefunden.',
    ohneGrafik: 'Weder Bild noch Symbol – mindestens eins ist Pflicht.',
    grundkomponenteFehlerhaft: 'Grundkomponente (Zeile {zeile}) ist fehlerhaft.',
    keineGrundkomponente:
      'Keine Komponente mit Artikelnummer „{artikelnummer}“ in Datei oder Katalog.',
  },
}
