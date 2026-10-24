export const verteilerdialoge = {
  allgemein: {
    abbrechen: 'Abbrechen',
    schliessen: 'Schließen',
    uebernehmen: 'Übernehmen',
    keineAngabe: 'Keine Angabe',
    bitteWaehlen: 'Bitte wählen ...',
    slotNummer: 'Slot {nummer}',
  },
  gruppeBilden: {
    bilden: 'Gruppe bilden',
    name: 'Name der Gruppe',
    nameBeispiel: 'z. B. Licht Flur',
    ansteuerung: 'Ansteuerung',
    knxGanzeGruppe: 'KNX (ganze Gruppe)',
  },
  kabeltyp: {
    titel: 'Kabeltyp ändern',
    feld: 'Kabeltyp',
    kabelNummer: 'Kabel Nr. {nummer}',
    fuerAlleKnopf: 'Für alle übernehmen…',
    fuerAlleTitel: 'Kabeltyp für alle Leitungen übernehmen',
    fuerAlleNachricht:
      'Ändert den Kabeltyp aller Leitungen dieser Zeichnung – über alle Blätter hinweg. ' +
      'Das kann sehr viele Leitungen betreffen (rückgängig machbar mit Strg+Z).',
    fuerAlleBestaetigen: 'Für alle übernehmen',
  },
  slotWahl: {
    titel: 'Slot wählen',
  },
  trunkVerbinden: {
    titel: 'Mit anderem Trunk verbinden',
    zielBlatt: 'Zielseite',
    zielTrunk: 'Ziel-Trunk',
    keineTrunks: 'Keine verfügbaren Trunks auf dieser Seite (außer dem Ausgangstrunk).',
    zielEnde: 'Ziel-Ende',
    ende: '{name} Ende {ende}',
    endeBelegt: '{name} Ende {ende} (bereits verbunden)',
    verbinden: 'Verbinden',
  },
  schachtVerbund: {
    steigschacht: 'Steigschacht',
    neu: 'Neuer Steigschacht',
    name: 'Name',
    geschosshoehe: 'Geschosshöhe nach oben (m)',
    geschosshoeheHinweis:
      'Abstand bis zum nächsten Schacht dieses Verbunds auf einem höheren Blatt – geht in die ' +
      'Länge durchgehender Leitungen ein. Am obersten Schacht ohne Bedeutung.',
  },
  schachtAnschluss: {
    titel: 'Anschluss im Kabelschacht „{name}“',
    trunkAn: 'Trunk anschließen an',
    leitungAn: 'Leitung anschließen an',
    neuerStrang: 'Neuer Strang S{nummer}',
    strangName: 'Name des Strangs S{nummer} (optional)',
    strangNameBeispiel: 'z. B. Steigleitung Whg. 3',
    oderTrunk: 'oder direkt in einen hier hängenden Trunk einlaufen',
    inTrunk: 'In „{name}“ einlaufen',
    trunkOhneZiel: 'hängt an nichts – noch kein Switch, Patchpanel oder weiterer Kabelschacht',
    nochLeer:
      'In diesem Verbund steigt noch nichts dieser Art – der Anschluss legt den ersten ' +
      'Strang an.',
    anschliessen: 'Anschließen',
    zielSwitches: { one: '{n} Switch/Patchpanel', other: '{n} Switch/Patchpanel' },
    zielSchaechte: { one: '{n} weiteren Kabelschacht', other: '{n} weitere Kabelschächte' },
    erreicht: 'erreicht {ziele}',
    hinweisGleichesBlatt:
      'Auf diesem Blatt hängt bereits ein Ende an diesem Strang – auf einer Etage sind ' +
      'Verschmelzen oder Abzweig meist das Richtige.',
    belegt: 'belegt – eine Leitung verbindet genau zwei Etagen',
    schonAngeschlossen: 'dieses Objekt hängt hier schon',
  },
  inhalt: {
    titel: 'Inhalt',
    titelTrunk: 'Inhalt von „{name}“',
    titelSchacht: 'Inhalt von Kabelschacht „{name}“',
    objektFehlt: 'Das Objekt gibt es nicht mehr.',
    trunkUmbenennen: 'Trunk umbenennen',
    trunkLeer: 'In dieser Trunk-Kette liegt noch keine Leitung.',
    schachtLeer: 'Durch diesen Durchbruch läuft noch keine Leitung.',
    nummer: 'Nr.',
    beschreibung: 'Beschreibung',
    vonNach: 'von → nach',
    kabeltyp: 'Kabeltyp',
    laenge: 'Länge',
    teilstuecke: 'Teilstücke',
    strang: 'Strang',
    zeigen: 'Zeigen',
    beschreibungVon: 'Beschreibung von Leitung {nummer}',
    beschreibungAendern: 'Leitungsbeschreibung ändern',
    name: 'Name',
    strangImSchacht: 'Strang S{nummer} ({schacht})',
    strangNummer: 'Strang S{nummer}',
    teilstueckeListe: 'Teilstücke: {liste}',
    blattListe: 'Blatt: {liste}',
    blassHinweis: 'blasse Leitungen laufen nicht durch das angeklickte Teilstück.',
    durchbruch: 'Durchbruch auf „{ort}“. Der Schachtname wird im Eigenschaften-Panel geändert.',
    durchbruchWeiter:
      'Durchbruch auf „{ort}“ – weiter {weiter}. Der Schachtname wird im ' +
      'Eigenschaften-Panel geändert.',
    querschnitt: 'Querschnitt',
  },
  schaltplanZuordnen: {
    titel: 'Schaltplan zuordnen',
    lesefehler: 'Die Schaltpläne des Projekts ließen sich nicht lesen.',
    zugeordnetTitel: 'Verteilerplan zugeordnet',
    zugeordnetNachricht: '„{name}“ ist jetzt Verteilerplan für {kennzeichen}. Gleich öffnen?',
    oeffnen: 'Öffnen',
    fehlgeschlagen: 'Zuordnen fehlgeschlagen.',
    keinKennzeichen: 'Der Verteiler hat kein Kennzeichen.',
    erklaerung:
      'Der gewählte Schaltplan wird Verteilerplan für {kennzeichen}. Danach bestimmt er, welche ' +
      'Betriebsmittel der Verteiler hat; die Bestückung hier bleibt erhalten, was im Plan fehlt, ' +
      'erscheint grau. Lösen lässt sich die Zuordnung im Schaltplan unter „Verteilerplan für“.',
    liestPlaene: 'Schaltpläne des Projekts werden gelesen …',
    keinePlaene:
      'Im Projekt gibt es keinen weiteren Schaltplan – „Verteilerplan erzeugen …“ legt einen an.',
    schaltplan: 'Schaltplan',
    verteilerplanFuer: 'Verteilerplan für {kennzeichen}',
    umhaengenWarnung:
      '„{name}“ gehört bisher zu {kennzeichen}; dieser Verteiler hat danach keinen ' +
      'Verteilerplan mehr.',
    laeuft: 'Wird zugeordnet …',
    umhaengen: 'Umhängen',
    zuordnen: 'Zuordnen',
  },
  knxAktor: {
    titel: 'KNX-Aktor einfügen',
    artSchaltJalousie: 'Schalt-/Jalousieaktor',
    artDimm: 'Dimmaktor',
    baugroesse: 'Baugröße',
    fach: '{n}fach',
    kennzeichen: 'Kennzeichen',
    versorgung: 'Versorgung L/N anzeigen',
    kanal: 'Kanal',
    funktion: 'Funktion',
    beschriftung: 'Beschriftung',
    ab: 'Ab ({funktion})',
    auf: 'Auf',
    funktionVon: 'Funktion {name}',
    beschriftungVon: 'Beschriftung {name}',
    einfuegen: 'Einfügen',
  },
  knxZuordnen: {
    titel: 'KNX-Aktoren zuordnen',
    titelMit: 'KNX-Aktoren zuordnen – {kennzeichen}',
    verteilerFehlt: 'Der Verteiler ist nicht mehr vorhanden.',
    erklaerung:
      'Klemmen, deren Verbraucher ein KNX-Gerät über eine Wirkverbindung schaltet. Jede Klemme ' +
      'bekommt einen Kanal, ein Jalousiepaar beginnt immer auf einem ungeraden Kanal. ' +
      'Vorhandene Kanäle behalten ihre Nummer.',
    reserve: 'Reserve in %',
    keineKlemmen:
      'Keine Klemme dieses Verteilers versorgt ein Ziel eines KNX-Geräts. Wirkverbindungen legt ' +
      'man im Bauplan mit dem Werkzeug „Wirkverbindung“ an.',
    klemme: 'Klemme',
    kanalname: 'Kanalname',
    ziele: 'Ziele',
    kanal: 'Kanal',
    ergebnis: 'Ergebnis',
    geraete: 'Geräte: {liste}',
    geraet: '-{kennzeichen} {titel} – {belegt} belegt, {frei} frei',
    geraetNeu: '-{kennzeichen} {titel} (neu) – {belegt} belegt, {frei} frei',
    freigeben: 'Kanäle freigeben (kein KNX-Ziel mehr)',
    zuordnen: 'Zuordnen',
    kanalnameFuer: 'Kanalname für {name}',
    ohneNamen: 'ohne Namen',
    vorhanden: 'vorhanden',
    kanalFuer: 'Kanal für {name}',
    keinKanal: 'kein Kanal',
  },
  verknuepfen: {
    titel: 'Gruppe und Wirkverbindung',
    nichtsAnzulegen: 'Zwischen den beiden Enden dieser Leitung gibt es nichts anzulegen.',
    slotFrei: '{name} (frei)',
    slotMitZielen: { one: '{name} · {n} Ziel', other: '{name} · {n} Ziele' },
    geraetegruppe: 'Gerätegruppe',
    autoGruppe:
      '{slot} von {quelle} wirkt dann auf {mitglieder} – sie kommen in eine gemeinsame ' +
      'Gerätegruppe, der Slot zeigt auf die Gruppe.',
    neuerSlot: 'Neuer Slot',
    wirkTitel: 'Wirkverbindung anlegen',
    wirkFrage:
      'Leitung {nummer} verbindet {quelle} mit {ziel}. Welcher Slot soll auf {ziel} wirken?',
    perLeitung: 'per Leitung verbunden',
    ziel: 'Ziel',
    zielGruppe: 'Gruppe „{name}“',
    zielNur: 'nur {name}',
    slotBezeichnung: 'Slot-Bezeichnung (für Slots ohne Bezeichnung)',
    anlegen: 'Anlegen',
    abgleichTitel: 'Wirkverbindung übernehmen',
    abgleichText:
      'Leitung {nummer} verbindet {von} mit {nach} – etwa eine Wechselschaltung. Ein Slot von ' +
      '{nach} kann dieselben Ziele bekommen.',
    slotVon: 'Slot von {name}',
    wirktAuf: 'Wirkt auf: {ziele}',
    uebernimmtAuf: 'übernimmt auf Slot von {name}',
    beitretenTitel: 'Gerätegruppe beitreten',
    bildenTitel: 'Gerätegruppe bilden',
    beitretenText: 'Leitung {nummer}: {name} tritt der Gruppe „{gruppe}“ bei.',
    bildenText:
      'Leitung {nummer} verbindet {a} mit {b}. Beide kommen in eine gemeinsame Gerätegruppe.',
    umgelenkt: {
      one:
        'Ein Slot zeigt danach auf die Gruppe statt auf eine einzelne Komponente – so wird ' +
        'die andere mitgeschaltet.',
      other:
        '{n} Slots zeigen danach auf die Gruppe statt auf eine einzelne Komponente – so ' +
        'wird die andere mitgeschaltet.',
    },
    beitreten: 'Beitreten',
  },
  slotMatrix: {
    titel: 'Slot-Matrix bearbeiten',
    entfernenTitel: 'Slots entfernen?',
    entfernenNachricht: {
      one:
        'Die Matrix-Form wird verkleinert - {n} Slot mit bereits zugewiesenen Zielen geht ' +
        'dabei verloren.',
      other:
        'Die Matrix-Form wird verkleinert - {n} Slots mit bereits zugewiesenen Zielen gehen ' +
        'dabei verloren.',
    },
    verkleinern: 'Verkleinern',
    kreislauf: 'Nicht möglich: Das würde einen Kreislauf zwischen Slots erzeugen.',
    spaltenStandard: 'Spalten (Standard)',
    einBreit: '1 (breiter Taster)',
    zweiSchmal: '2 (schmale Taster nebeneinander)',
    zeilen: 'Zeilen (Fächer)',
    spaltenInReihe: 'Spalten in Reihe {reihe}',
    spalten: { one: '{n} Spalte', other: '{n} Spalten' },
    bezeichnung: 'Bezeichnung',
    bezeichnungOptional: 'Bezeichnung (optional)',
    fertig: 'Fertig',
  },
  raeume: {
    titel: 'Bestückung aus Räumen vorschlagen',
    titelMit: 'Bestückung aus Räumen vorschlagen – {kennzeichen}',
    keineRaeume:
      'Der Bauplan hat keine Räume und keine Komponenten mit Stromkreis. Räume zeichnet man mit ' +
      'dem Werkzeug „Raum“, den Stromkreis stellt man im Eigenschaften-Panel der Komponente ein.',
    blattAlle: '{name} (alle)',
    versorgtVon: 'wird von {name} versorgt',
    netz: 'Netz',
    drehstrom: 'Drehstrom 3~ 400 V',
    wechselstrom: 'Wechselstrom 1~ 230 V',
    einspeiseklemme: 'Einspeiseklemme -X0',
    sls: 'SLS-Schalter',
    blitzschutz: 'Blitzschutz (parallel)',
    zaehler: 'Zähler',
    sicherungNachZaehler: 'Sicherung nach dem Zähler',
    rcdJeBlatt: 'Ein RCD je Blatt',
    rcdTyp: 'Typ RCD (leer = Katalog)',
    rcdTypBeispiel: 'z. B. 40A/0,03A Typ A',
    lsTyp: 'Typ LS (leer = Katalog)',
    lsTypBeispiel: 'z. B. B16',
    knxGleich: 'KNX-Aktoren gleich zuordnen',
    keineKomponenten: 'In den gewählten Räumen steht keine Komponente mit Stromkreis.',
    blatt: 'Blatt',
    stromkreis: 'Stromkreis',
    bauteile: 'Bauteile',
    knxAktoren: 'KNX-Aktoren: {liste}',
    verwaist: 'Nicht mehr gebraucht (Quelle fehlt oder Raum abgewählt)',
    entfernen: '{text} entfernen',
    fehlend: 'Nicht im Katalog, deshalb weggelassen: {liste}',
    neuErzeugenTitel: 'Verteilerplan neu erzeugen?',
    neuErzeugenNachricht:
      '„{name}“ aus der neuen Bestückung neu erzeugen? Der Inhalt des Plans wird ersetzt – ' +
      'eigene Änderungen darin gehen verloren, und Rückgängig im Bauplan erreicht den Plan ' +
      'nicht. Ohne Neu-Erzeugen zeigt der Verteiler-Dialog, was dem Plan fehlt.',
    neuErzeugen: 'Neu erzeugen',
    neuErzeugt: '„{name}“ neu erzeugt.',
    neuErzeugenFehler: 'Neu erzeugen fehlgeschlagen.',
    verknuepft:
      'Verknüpft mit „{name}“ – nach dem Übernehmen lässt sich der Plan aus der neuen ' +
      'Bestückung neu erzeugen.',
    erklaerung:
      'Je gewähltem Raum ein LS mit Klemme für den Raumstromkreis, für jede Nummer und jeden ' +
      'eigenen Stromkreis; je Blatt ein RCD. KNX-geschaltete Gruppen und Verbraucher bekommen ' +
      'einen Kanal mit eigener Klemme. Was schon da ist, bleibt.',
    art: 'Art',
  },
  switchPort: {
    titelIntern: 'Intern verbinden – Zielport wählen',
    titelBelegung: 'Portbelegung',
    titelZiel: 'Ziel der Leitung wählen',
    titelPort: 'Port-Stromkreis wählen',
    internErklaerung:
      'Verbindet {port} von {geraet} direkt mit einem Port eines anderen, über Trunks ' +
      'erreichbaren Geräts – ohne Kabel auf dem Plan.',
    diesemGeraet: 'diesem Gerät',
    nichtsAmTrunk:
      'An diesem Trunk hängt weder ein Switch noch ein Kabelschacht. Ein Switch gilt als ' +
      'angeschlossen, sobald ein Trunk-Ende an einem seiner "T"-Punkte andockt.',
    keinGeraet: 'Kein weiteres Gerät über einen Trunk erreichbar.',
    rubrikSwitch: 'Switch',
    rubrikPatchpanel: 'Patchpanel',
    rubrikVerteiler: 'Verteiler',
    rubrikSchacht: 'Kabelschacht',
    etage: 'Etage',
    geraetetyp: 'Gerätetyp',
    filter: 'Filter',
    alle: 'Alle',
    alleAnzeigen: 'Alle anzeigen ({n})',
    zurueck: 'Zurück',
    verbinden: 'Verbinden',
    trennenUndo: 'Interne Verbindung trennen',
    beschriftungUndo: 'Portbeschriftung ändern',
    leitung: 'Leitung',
    strangBelegt: 'belegt – ein Strang verbindet zwei Etagen',
    listeEinblenden: 'Portliste einblenden',
    listeAusblenden: 'Portliste ausblenden',
    kennzahlen: '{belegt} von {gesamt} Ports belegt · PoE {watt} W',
    frontansicht: 'Frontansicht {name}',
    port: 'Port',
    ltg: 'Ltg.',
    geraet: 'Gerät',
    aktion: 'Aktion',
    intern: '{geraet}/{port} (intern)',
    unbekannt: 'unbekannt',
    frei: 'frei',
    nichtGepflegt: 'n. g.',
    verbindenKnopf: 'Verbinden…',
    trennen: 'Trennen',
    tooltipFrei: '{port} (frei)',
    tooltipFreiMit: '{port} (frei) - {beschriftung}',
    tooltipLeitung: 'Ltg. {nummer}',
    poeNichtGepflegt: 'PoE-Leistung nicht gepflegt',
    beschriftungGesperrt: 'Beschriftung der angeschlossenen Komponente – dort ändern',
  },
  verteiler: {
    titel: 'Verteiler',
    titelAnschliessen: '{was} im Verteiler {kennzeichen} anschließen',
    titelMit: 'Verteiler {kennzeichen}',
    ohneAnschluss: 'Ohne Anschluss übernehmen',
    zuweisen: 'Zuweisen',
    komponente: 'Komponente',
    nurBestueckung: {
      one:
        '{n} Betriebsmittel der Bestückung fehlt im Verteilerplan (grau) – dort ergänzen oder ' +
        'hier entfernen.',
      other:
        '{n} Betriebsmittel der Bestückung fehlen im Verteilerplan (grau) – dort ergänzen oder ' +
        'hier entfernen.',
    },
    ohneGegenstueck: 'Zugewiesen, aber nicht vorhanden: {liste} – bitte neu zuweisen.',
    planBaum: '„{name}“ bringt einen Baum aus dem Verteilerplan-Assistenten mit ({n} Knoten).',
    planBaumUndo: 'Baum aus dem Verteilerplan übernehmen',
    planBaumUebernehmen: 'Baum übernehmen',
    knxOffen: {
      one: '{n} Klemme wird von KNX-Geräten geschaltet, hat aber noch keinen Aktorkanal.',
      other: '{n} Klemmen werden von KNX-Geräten geschaltet, haben aber noch keinen Aktorkanal.',
    },
    knxHinweis: 'KNX-Aktoren: Kanäle für die Ziele der KNX-Geräte vorschlagen und anlegen.',
    knxZuordnenKnopf: 'KNX-Aktoren zuordnen …',
    raeumeMitPlan:
      'LS und Klemmen aus Räumen – der verknüpfte Plan lässt sich danach neu erzeugen.',
    raeumeOhnePlan: 'Ohne Leitungen: LS und Klemmen aus Räumen und der Eigenschaft „Stromkreis“.',
    raeumeKnopf: 'Bestückung aus Räumen vorschlagen …',
    knotenBelegt: '{belegt} von {anzahl} Knoten belegt',
    netzartUndo: 'Netzart ändern',
    drehstrom: 'Drehstrom (L1, L2, L3, N, PE)',
    wechselstrom: 'Wechselstrom (L, N, PE)',
    artUndo: 'Verteilerart ändern',
    plan: 'Verteilerplan: {name} – seine Betriebsmittel gelten.',
    weiterePlaene: {
      one: '({n} weiterer Plan trägt dasselbe Kennzeichen, es gilt der erste.)',
      other: '({n} weitere Pläne tragen dasselbe Kennzeichen, es gilt der erste.)',
    },
    plaeneLesen: 'Verteilerpläne des Projekts werden gelesen …',
    keinPlan: 'Kein Verteilerplan verknüpft – es gilt die Bestückung hier.',
    planErzeugenKnopf: 'Verteilerplan erzeugen …',
    schaltplanZuordnenKnopf: 'Vorhandenen Schaltplan zuordnen …',
    katalogeintragFehlt: 'Katalogeintrag fehlt',
    kanalName: 'Kanal {kanal} · {name}',
    kanalFunktion: 'Kanal {kanal} {funktion} · {name}',
    nochLeerAuswahl:
      'Noch keine Betriebsmittel – in der Übersicht (Doppelklick auf den Verteiler) bestücken.',
    suchen: 'Suchen nach Beschriftung oder Kennzeichen, z. B. „Küche“ oder „X5“',
    auswahlHinweis:
      'Knoten anklicken – meist die Klemme. Sicherung, RCD und Phase ergeben sich aus dem Baum. ' +
      'Mehrere Knoten sind möglich, auf einem Knoten dürfen mehrere Leitungen liegen.',
    nochNichtEingeordnet: '{name} · noch nicht eingeordnet',
    nichtsGefunden: 'Nichts gefunden.',
    gewaehlt: 'Gewählt',
    ader: 'Ader (optional)',
    aderBeispiel: 'z. B. 1, L, bl',
    entfernen: 'Entfernen',
    klemmeUndo: 'Klemme ändern',
    schonNummeriert: '-{leiste} ist schon lückenlos nummeriert.',
    nummerierenUndo: 'Klemmenleiste neu nummerieren',
    leisteIstGeraet: '-{leiste} ist noch ein eigenes Gerät – erst umbenennen.',
    ueberfuehrenUndo: 'Klemmen in die Leiste überführen',
    kennzeichenVergeben: '„{kennzeichen}“ ist leer oder in diesem Verteiler schon vergeben.',
    kennzeichenUndo: 'Kennzeichen ändern',
    entfernenUndo: 'Betriebsmittel entfernen',
    entfernenLeitungen: {
      one: 'Auf {name} liegt {n} Leitung; sie wird gelöst.',
      other: 'Auf {name} liegen {n} Leitungen; sie werden gelöst.',
    },
    entfernenTitel: '{name} entfernen?',
    entfernenKinder:
      'Hinter {name} hängen weitere Knoten. Nur diesen Knoten entfernen (die Knoten dahinter ' +
      'rücken an seinen Platz) oder mit allem dahinter?',
    nurDiesen: 'Nur diesen Knoten',
    mitAllem: 'Mit allem dahinter',
    knxHinzufuegenUndo: 'KNX-Aktor hinzufügen',
    hinzufuegenTitel: 'Betriebsmittel hinzufügen',
    anzahl: 'Anzahl „{name}“',
    waehlenTitel: 'Betriebsmittel wählen',
    weiter: 'Weiter',
    kanaeleBearbeiten: 'Kanäle von -{kennzeichen} bearbeiten',
    kanalFieleWeg: '{liste} ist eingeordnet und fiele weg – erst aus dem Baum entfernen.',
    knxAendernUndo: 'KNX-Aktor ändern',
    umhaengenUndo: 'Knoten umhängen',
    einordnenUndo: 'Betriebsmittel einordnen',
    betriebsmittelDahinter: 'Betriebsmittel dahinter …',
    stromkreiseDahinter: 'Stromkreise dahinter …',
    kanalDahinter: 'Kanal dahinter …',
    stromkreiseUndo: 'Stromkreise hinzufügen',
    alteKlemmen: {
      one: '{n} Klemme hat noch ein eigenes Kennzeichen ({liste}) statt einer Nummer in der Leiste.',
      other:
        '{n} Klemmen haben noch ein eigenes Kennzeichen ({liste}) statt einer Nummer in der ' +
        'Leiste.',
    },
    inLeisteKnopf: 'In Klemmenleiste -{leiste} überführen',
    spalteKennzeichen: 'Kennz.',
    spalteTyp: 'Typ',
    spaltePhase: 'Phase',
    spalteLeitungen: 'Leitungen',
    spalteGeraete: 'Geräte',
    einspeisung: 'Einspeisung',
    dahinterAnlegen: 'Dahinter anlegen',
    hinterEinspeisung: 'Hinter der Einspeisung anlegen',
    nochLeer:
      'Noch leer – mit „+“ an der Einspeisung Betriebsmittel oder gleich Stromkreise anlegen.',
    klemmenUndo: 'Klemmen hinzufügen',
    kanalGeraetUndo: 'Gerät mit Kanälen hinzufügen',
    kanalGeraetWaehlen: 'Gerät mit Kanälen wählen',
    hinzufuegen: 'Hinzufügen',
    nichtEingeordnetTitel: 'Noch nicht eingeordnet',
    nichtEingeordnetHinweis:
      'Stehen im Verteilerplan, haben hier aber noch keinen Platz – auf einen Knoten ziehen.',
    nichtImPlan: 'nicht im Verteilerplan',
    griffTitel: 'Ziehen zum Umhängen – Klick: vorgeschaltet wählen',
    aufklappen: 'Aufklappen',
    zuklappen: 'Zuklappen',
    typUndo: 'Typ ändern',
    phaseUndo: 'Phase ändern',
    beschriftungBeispiel: 'z. B. Küche Steckdosen',
    beschriftungUndo: 'Beschriftung ändern',
    hinterKnoten: 'Hinter {knoten} anlegen',
    knotenEntfernen: '{name} entfernen',
    vorgeschaltet: 'Vorgeschaltet:',
    falschesNetzTitel: 'Passt nicht zum Netz',
    falschesNetz:
      '„{name}“ ist mehrphasig. Der Verteiler hat Wechselstrom – dort passen nur 1- und ' +
      '2-polige Geräte. Die Netzart steht oben im Verteiler-Dialog.',
    ok: 'OK',
    anzahlFeld: 'Anzahl',
    schutzgeraet: 'Schutzgerät',
    klemmeDahinter: 'Klemme dahinter',
    ohneKlemme: 'ohne Klemme',
    kanalEinordnenUndo: 'Kanal einordnen',
    klemmeEinordnenUndo: 'Klemme einordnen',
    keinKanalGeraet: 'Noch kein Gerät mit Kanälen.',
    neuesGeraet: 'Neues Gerät …',
    einordnen: 'Einordnen',
    kanalGeraeteTitel: 'Geräte mit Kanälen',
    kanalGeraeteLeer:
      'Schaltaktoren und Klemmenblöcke, deren Kanäle einzeln im Baum stehen – über „+“ › ' +
      '„Kanal dahinter …“ oder hier anlegen.',
    klemmenleiste: 'Klemmenleiste',
    kanalEingeordnet: '{name} eingeordnet',
    kanalFrei: '{name} frei',
    kanaeleBearbeitenKnopf: 'Kanäle bearbeiten …',
    neuNummerierenTitel: 'Lückenlos ab 1 in der Reihenfolge des Baums',
    neuNummerieren: 'Neu nummerieren',
    kanalGeraetNeu: '+ Gerät mit Kanälen …',
  },
  assistent: {
    titel: 'Verteilerplan-Assistent',
    schritt: 'Schritt {nummer}/{gesamt}',
    angelegtTitel: 'Verteilerplan angelegt',
    angelegtNachricht: '„{name}“ steht jetzt im Projekt. Gleich öffnen?',
    anlegenFehler: 'Anlegen fehlgeschlagen.',
    keinProjekt: 'Erst ein Projekt öffnen oder in der Übersicht wählen.',
    raeumeHinweis:
      'Räume aus „{name}“: je Raumstromkreis, Nummer und eigenem Stromkreis ein LS mit Klemme, ' +
      'je Blatt ein RCD, KNX-Ziele mit Kanal. Danach im Baum verfeinern. Der Bauplan wird nur ' +
      'gelesen.',
    bauplaeneLesen: 'Baupläne werden gelesen …',
    baumFuer:
      'Der Baum für {kennzeichen} – bearbeiten wie im Verteiler-Dialog: „+“ hängt ' +
      'Betriebsmittel, Stromkreise oder Kanäle dahinter, der Griff zieht einen Knoten an einen ' +
      'anderen Platz.',
    baumNeu:
      'Der Baum des neuen Verteilers – bearbeiten wie im Verteiler-Dialog: „+“ hängt ' +
      'Betriebsmittel, Stromkreise oder Kanäle dahinter, der Griff zieht einen Knoten an einen ' +
      'anderen Platz.',
    maxSicherungen: 'Höchstens Sicherungen je Blatt',
    maxKlemmen: 'Höchstens Klemmen je Blatt',
    aufteilung: 'Aufteilung',
    aufteilungGanz: 'Neues Blatt, wenn ein RCD nicht mehr ganz passt',
    aufteilungFortlaufend: 'Platzsparend fortlaufend – der RCD geht auf dem nächsten Blatt weiter',
    ueberfuehren: {
      one:
        '{n} Klemme mit eigenem Kennzeichen ({liste}) in die Klemmenleiste -{leiste} überführen ' +
        '– die Nummer bleibt, z. B. {alt} → {neu}',
      other:
        '{n} Klemmen mit eigenem Kennzeichen ({liste}) in die Klemmenleiste -{leiste} überführen ' +
        '– die Nummer bleibt, z. B. {alt} → {neu}',
    },
    zusammenfassung: '{blaetter} Blätter · {stromkreise} Stromkreise · {rcd} RCD',
    zurueck: '‹ Zurück',
    laeuft: 'Wird angelegt …',
    erzeugen: 'Erzeugen',
    weiter: 'Weiter ›',
    quelleBauplan: 'Verteiler aus einem Bauplan übernehmen',
    keinVerteiler: 'Kein Bauplan des Projekts hat einen Verteiler.',
    verteilerEintrag: '{kennzeichen} · {plan} · {n} Knoten',
    verteilerOffen: '{kennzeichen} · {plan} (offen) · {n} Knoten',
    quelleRaeume: 'Aus Räumen eines Bauplans',
    keinBauplan: 'Das Projekt hat keinen Bauplan.',
    quelleRaeumeHinweis:
      'Ohne Leitungen: LS und Klemmen aus den Räumen und der Eigenschaft „Stromkreis“ der ' +
      'Komponenten, KNX-Kanäle aus dem Haken „KNX“ und den Wirkverbindungen.',
    quelleNeu: 'Neu zusammenstellen',
    quelleNeuHinweis:
      'Startbaum aus einer Schnellvorgabe, danach im selben Editor wie im Verteiler-Dialog ' +
      'verfeinern. Der Baum bleibt im Plan gemerkt.',
    blitzschutz: 'Blitzschutzableiter (parallel zwischen Klemme und SLS)',
    lsJeRcd: 'LS je RCD',
    klemmeJeLs: 'Je LS eine Abgangsklemme 1P+N+PE',
    vorgabeGeaendert:
      'Eine geänderte Vorgabe baut den Baum beim Weiter neu auf – Änderungen daran gehen dann ' +
      'verloren.',
    etageBeispiel: 'z. B. OG1',
    wohnung: 'Wohnung',
    wohnungBeispiel: 'z. B. WE 2',
    verwendung: 'Verwendung',
    verwendungBeispiel: 'z. B. Garage/Wallbox',
    kennzeichenFest:
      'Das Kennzeichen des Verteilers – nur damit bleibt der Plan mit ihm verknüpft.',
    vorschlag: 'Vorschlag übernehmen',
    aktoren: '{anzahl} ({titel}) · {kanaele} belegt · {frei} frei',
    aktorenAnzahl: { one: '{n} KNX-Aktor', other: '{n} KNX-Aktoren' },
    kanaeleBelegt: { one: '{n} Kanal', other: '{n} Kanäle' },
  },
}
