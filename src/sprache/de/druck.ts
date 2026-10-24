export const druck = {
  hinweis: {
    planTitel: 'Übersichtsplan – nicht maßstabsgetreu',
    planText:
      'Dieser Plan dient ausschließlich der Übersicht. Er ist nicht maßstabsgetreu und darf nicht ' +
      'zum Konstruieren, zur Maßentnahme oder für statische Berechnungen verwendet werden.',
    schaltplanTitel: 'Planungshilfe, keine Fachplanung',
    pruefpflicht:
      'Sämtliche Inhalte – insbesondere automatisch erzeugte Leitungswege, Leitungslängen, Listen ' +
      'sowie Switch- und PoE-Angaben – sind unverbindliche Arbeitsgrundlagen. Sie ersetzen weder ' +
      'eine Fachplanung noch die Prüfung durch eine fachkundige Person und sind vor jeder ' +
      'Verwendung (z. B. Bestellung, Angebot, Ausführung, Weitergabe an Dritte) ' +
      'eigenverantwortlich auf Richtigkeit und Vollständigkeit zu prüfen. Die Verantwortung für ' +
      'die Planung und die Einhaltung der anerkannten Regeln der Technik, insbesondere DIN VDE, ' +
      'verbleibt beim Verwender. Herstellerangaben ohne Gewähr – maßgeblich sind die aktuellen ' +
      'Datenblätter.',
    lizenziertFuer: 'Lizenziert für {name}.',
  },
  rechtliches: {
    blattName: 'Rechtliches',
    uebersichtTitel: 'Übersichtsplan – nicht maßstabsgetreu',
    uebersichtText:
      'Die mit el.easy.CAD erstellten Pläne und Listen dienen ausschließlich der Übersicht. Sie ' +
      'sind nicht maßstabsgetreu und dürfen nicht zum Konstruieren, zur Maßentnahme oder für ' +
      'statische Berechnungen verwendet werden.',
    planungshilfeTitel: 'Planungshilfe, keine Fachplanung',
    planungshilfeText:
      'Automatisch erzeugte Ergebnisse – insbesondere Stücklisten, Leitungslisten und ' +
      'Leitungslängen, Switch- und Patchfeldbelegungen, PoE-Leistungsbilanzen, Raumlisten, ' +
      'Steuerungslogik sowie Leitungswege aus dem automatischen Routing – sind unverbindliche ' +
      'Arbeitsgrundlagen. Sie ersetzen weder eine Fachplanung noch die Prüfung durch eine ' +
      'fachkundige Person.',
    pruefungTitel: 'Eigenverantwortliche Prüfung',
    pruefungText:
      'Alle Angaben sind vor ihrer Verwendung – etwa für Bestellungen, Angebote, die Ausführung ' +
      'oder die Weitergabe an Dritte – eigenverantwortlich auf sachliche und fachliche ' +
      'Richtigkeit und Vollständigkeit zu prüfen. Die Verantwortung für die Planung und für die ' +
      'Einhaltung der anerkannten Regeln der Technik, insbesondere DIN VDE, verbleibt beim ' +
      'Verwender. Schäden, die auf einer unterlassenen oder unzureichenden Prüfung beruhen, ' +
      'gehen zu seinen Lasten.',
    herstellerTitel: 'Herstellerangaben',
    herstellerText:
      'Technische Daten, Maße, Leistungswerte, Artikelnummern und Abbildungen aus dem ' +
      'Produktkatalog stammen von Herstellern und werden ohne Gewähr für Richtigkeit, ' +
      'Vollständigkeit und Aktualität übernommen. Maßgeblich sind allein die aktuellen ' +
      'Datenblätter des jeweiligen Herstellers. Für selbst angelegte oder geänderte ' +
      'Katalogeinträge ist der Verwender verantwortlich.',
  },
  excelFusszeile: {
    links:
      'Übersicht, nicht maßstabsgetreu – alle Angaben ohne Gewähr und eigenverantwortlich zu ' +
      'prüfen, siehe Blatt „{blatt}“',
    linksMitLizenz:
      'Übersicht, nicht maßstabsgetreu – alle Angaben ohne Gewähr und eigenverantwortlich zu ' +
      'prüfen, siehe Blatt „{blatt}“, lizenziert für {name}',
    seite: 'Seite &P von &N',
  },
  wasserzeichen: 'Demoversion – keine kommerzielle Nutzung erlaubt',
  zeichenflaeche: {
    hoch: '{format} Hochformat · 1:{nenner}',
    quer: '{format} Querformat · 1:{nenner}',
  },
  plankopf: {
    felder: {
      rechtlicherEigentuemer: 'Rechtlicher Eigentümer',
      benennung: 'Benennung',
      ergaenzung: 'Ergänzung',
      dokumentart: 'Dokumentart',
      erstelltVon: 'Erstellt von',
      geprueftVon: 'Geprüft von',
      datum: 'Datum',
      massstab: 'Maßstab',
      zeichnungsnummer: 'Zeichnungsnummer',
      blatt: 'Blatt',
      aenderung: 'Änderung',
    },
    blattVonAnzahl: '{nummer} von {anzahl}',
  },
  zeichnungsart: {
    bauplan: 'Bauplan',
    schaltplan: 'Schaltplan',
  },
  bildschirmfoto: {
    nurAnsicht: 'Blatt „{name}“ ist ohne das Modul BIM nur zur Ansicht freigegeben.',
  },
}
