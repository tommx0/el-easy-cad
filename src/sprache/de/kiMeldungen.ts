export const kiMeldungen = {
  gemeinsam: {
    blattNurAnsicht: 'Blatt „{blatt}“: {grund}',
    blattUnbekannt: 'Unbekanntes Blatt "{blattId}".',
    ebeneGesperrt: 'Ebene gesperrt',
    ausgemustert: '„{name}“ ist ausgemustert.',
    keinKatalogeintrag: 'Kein Katalogeintrag "{id}".',
    keineWand: 'Keine Wand mit der Id "{id}".',
    wandOhneLaenge: 'Die Wand hat keine Länge.',
    schaltplanOhneWaende: 'Ein Schaltplan hat keine Wände.',
    keineKomponenteAuf: 'Keine Komponente "{id}" auf „{blatt}“.',
    keinKabelschachtAuf: 'Kein Kabelschacht "{id}" auf „{blatt}“.',
    keinTrunkAuf: 'Kein Trunk "{id}" auf „{blatt}“.',
    keinRaumAufBlatt: 'Kein Raum "{id}" auf Blatt „{blatt}“.',
    nichtNeuVerlegt: {
      one: '{n} Leitung ließ sich nicht ohne Überschneidung neu verlegen.',
      other: '{n} Leitungen ließen sich nicht ohne Überschneidung neu verlegen.',
    },
  },
  ausfuehren: {
    werkzeugUnbekannt: 'Diese Fassung von el.esy.CAD kennt das Werkzeug {werkzeug} nicht.',
    eingabeUngueltig: 'Ungültige Eingabe für {werkzeug}.',
    internerFehler: 'Interner Fehler in el.esy.CAD: {fehler}',
  },
  kontext: {
    blattUnbekannt: 'Unbekanntes Blatt "{blattId}". Vorhandene Blätter: {liste}.',
  },
  schreiben: {
    labelVorspann: 'KI: ',
    unbekannteIds: {
      one: 'Unbekannte Objekt-Id: {liste}',
      other: 'Unbekannte Objekt-Ids: {liste}',
    },
    alleGesperrt: 'Alle genannten Objekte liegen auf gesperrten Ebenen.',
    abgewiesen: 'el.esy.CAD hat die Änderung abgewiesen (Blattsperre).',
    nichtsZuAendern: 'Es gab nichts zu ändern.',
  },
  rueckgaengig: {
    nichtsMehr: 'Es gibt nichts mehr zurückzunehmen.',
    vomAnwender: 'Der nächste Schritt stammt vom Anwender („{label}“) und bleibt stehen.',
    nichtsZurueckgenommen: 'Nichts zurückgenommen.',
    meldung: 'Rückgängig: {schritte}',
  },
  objektLesen: {
    keinObjekt: 'Kein Objekt mit der Id "{id}".',
    hinweis: 'Koordinaten im Objekt sind Modellkoordinaten; ab Nullpunkt = Modell − Nullpunkt.',
  },
  objektKurzform: {
    unbekannterKatalog: 'unbekannt ({id})',
  },
  verteilerbaumLesen: {
    verteilerFehlt: 'Kein Verteiler +{kennzeichen} gefunden.',
    keinVerteiler: 'Diese Zeichnung hat keinen Verteiler.',
  },
  bildschirmfoto: {
    blatt: 'Blatt „{name}“ ({id}).',
    ausschnitt: 'Blatt „{name}“ ({id}), Ausschnitt x {xMin}…{xMax} m, y {yMin}…{yMax} m.',
  },
  verteilerHilfen: {
    imBauplan:
      'Die Bestückung bearbeitet man im Bauplan, in dem der Verteiler sitzt – bitte den Bauplan öffnen.',
    keinVerteiler: 'Kein Verteiler mit der Id "{id}" (verteilerbaum_lesen ohne Angabe).',
  },
  eigenschaftenSetzen: {
    felder: {
      beschriftung: 'Beschriftung',
      installationshoeheM: 'Höhe',
      montageort: 'Montageort',
      verlegung: 'AP/UP',
      stromkreis: 'Stromkreis',
      stromkreisPolzahl: 'Polzahl',
      knx: 'KNX',
      variableTexte: 'variable Texte',
      kennzeichen: 'Kennzeichen',
      kabeltyp: 'Kabeltyp',
      beschreibung: 'Beschreibung',
      name: 'Name',
      raumart: 'Raumart',
    },
    kennzeichenBelegt: {
      one: '{kennzeichen} trägt schon ein anderes Betriebsmittel ({blaetter}).',
      other: '{kennzeichen} trägt schon {n} andere Betriebsmittel ({blaetter}).',
    },
    slotsNichtAngepasst:
      'Slots nicht angepasst ({feld}): dabei fielen belegte Slots weg – bitte im Eigenschaften-Panel entscheiden.',
    kennzeichenNurEine: 'kennzeichen gilt nur für genau eine Komponente je Aufruf.',
    keinPassendesFeld: 'kein passendes Feld für {typ}',
    keinFeldPasst: 'Keines der Felder ({felder}) passt zu den genannten Objekten.',
    variablerTextFehlt: 'Keine der Komponenten hat den variablen Text „{feld}“.',
    geaendert: {
      one: '{felder} an {n} Objekt geändert{blaetter}',
      other: '{felder} an {n} Objekten geändert{blaetter}',
    },
  },
  objekteLoeschen: {
    geloescht: {
      one: '{n} Objekt gelöscht{blaetter}',
      other: '{n} Objekte gelöscht{blaetter}',
    },
    mitgeloescht: {
      one: '{text}, {n} weiteres mitgelöscht',
      other: '{text}, {n} weitere mitgelöscht',
    },
  },
  objekteVerschieben: {
    versatzOderZiel: 'Entweder dx/dy (Versatz) oder nach (Zielpunkt) angeben.',
    nachNurEine: 'nach gilt nur für genau eine Komponente; sonst dx/dy angeben.',
    versatzNull: 'Der Versatz ist 0.',
    verschoben: {
      one: '{n} Objekt um {dx} / {dy} m verschoben{blaetter}',
      other: '{n} Objekte um {dx} / {dy} m verschoben{blaetter}',
    },
  },
  objekteDrehen: {
    nurKomponenten: 'Drehen geht nur mit Komponenten.',
    winkelNull: 'Der Winkel ist 0°.',
    gedreht: {
      one: '{n} Komponente um {winkel}° gedreht{blaetter}',
      other: '{n} Komponenten um {winkel}° gedreht{blaetter}',
    },
  },
  komponenteAustauschen: {
    gruende: {
      anschluesse: 'angeschlossene Leitungen fänden am neuen Eintrag keinen Anschluss',
      ports: 'der neue Eintrag hat weniger Ports als belegt sind',
      modul: 'Modulträger und Module eines anderen Systems lassen sich nicht austauschen',
    },
    keinKatalogeintrag: 'Kein Katalogeintrag mit der Id "{id}".',
    keineVariante: '„{name}“ hat keine Variante "{variante}" (vorhanden: {liste}).',
    keineVarianten: '„{name}“ hat keine Variante "{variante}" (vorhanden: keine).',
    keineKomponente: 'keine Komponente',
    knxAktor: 'KNX-Aktor – Kanäle im Eigenschaften-Panel ändern',
    andererKatalog: 'anderer Katalog',
    nichtsGetauscht: 'Keine Komponente getauscht: {gruende}.',
    nichtsPassend: 'Keine Komponente getauscht: nichts passend.',
    getauscht: {
      one: '{n} Komponente gegen „{name}“ getauscht{blaetter}',
      other: '{n} Komponenten gegen „{name}“ getauscht{blaetter}',
    },
  },
  blattAnlegen: {
    nameLeer: 'Der Name des Blatts ist leer.',
    angelegt: 'Blatt „{name}“ angelegt',
    zeichenflaecheVonHand: 'Die Zeichenfläche richtet der Anwender ein, wie beim Anlegen von Hand.',
  },
  komponenteSetzen: {
    platzierung: 'Platzierung {nr}: {text}',
    wandZuKurz: 'Die Wand ist nur {laenge} m lang (Abstand {abstand} m).',
    raumNichtAnWand: 'Raum „{raum}“ grenzt an dieser Stelle nicht an die Wand.',
    raumOderSeite: 'An der Wand raumId oder seite angeben.',
    netzfeldNurSchaltplan: 'Netzfelder gibt es nur im Schaltplan.',
    keineZeichenflaeche: 'Blatt „{blatt}“ hat keine Zeichenfläche.',
    keinNetzfeld: '„{name}“ ist kein Feld des Netzes A–H/1–6.',
    eineLage: 'Genau eine Lage angeben: punkt, netzfeld, raumMitte oder wand.',
    knxAktorVonHand: 'KNX-Aktoren fügt der Anwender mit „KNX-Aktor einfügen“ ein.',
    keineVariante: '„{name}“ hat keine Variante "{variante}".',
    keinRaum: 'Kein Raum mit der Id "{id}".',
    keineFreieFlaeche:
      'An dieser Stelle der Wand ist keine freie Fläche (Tür, Fenster oder Durchbruch?).',
    gesetzt: {
      one: '{n} Komponente gesetzt ({namen}){blaetter}',
      other: '{n} Komponenten gesetzt ({namen}){blaetter}',
    },
  },
  leitungVerlegen: {
    leitung: 'Leitung {nr}: {text}',
    eineArt:
      'Ein Ende braucht genau eine Art: komponente, punkt, schacht, switchport oder verteiler.',
    keinDockpunkt: 'Die Komponente hat keinen Dockpunkt {nr}.',
    nurFuerTrunks: 'Dockpunkt {nr} ist nur für Trunks.',
    keinDockpunktFuerLeitungen: 'Die Komponente hat keinen Dockpunkt für Leitungen.',
    anschluesseNurVerteiler: 'anschluesse gibt es nur an einem Verteiler.',
    vonNur: '"von" kann nur komponente, punkt oder schacht sein.',
    endeNur: 'Dieses Ende kann nur komponente, punkt oder schacht sein.',
    geraetNichtAnKette: 'Das Gerät hängt nicht an dieser Trunk-Kette.',
    keinPort: 'Das Gerät hat keinen Port {nr}.',
    portBelegt: 'Port {port} ist schon belegt.',
    keinPortFrei: 'Am Gerät ist kein Port mehr frei.',
    verteilerNichtAnKette: 'Der Verteiler hängt nicht an dieser Trunk-Kette.',
    keinWeg: 'Kein kollisionsfreier Weg gefunden.',
    nurUeberTrunks: 'switchport und verteiler als Ende gehen nur über trunks.',
    einUndAustritt: 'Ein- und Austritt im Trunk fallen zusammen.',
    nichtVerbunden: 'Die beiden Trunks sind nicht miteinander verbunden.',
    verknuepfung: {
      wirkverbindung: 'Wirkverbindung',
      abgleich: 'Abgleich zweier Schalter',
      gruppe: 'Gerätegruppe',
    },
    moeglich: '{art} (verknuepfen: true)',
    ende: {
      dock: 'Komponente {id} · Dockpunkt {nr}',
      frei: 'freies Ende',
      schacht: 'Kabelschacht {id} · Strang {nr}',
      switchport: 'Gerät {id} · Port-Index {nr}',
      verteiler: 'Verteiler {id}',
    },
    verlegt: {
      one: '{n} Leitung verlegt{blaetter}',
      other: '{n} Leitungen verlegt{blaetter}',
    },
  },
  trunkAnlegen: {
    eineArt: 'Ein Trunk-Ende braucht genau eine Art: komponente, trunk oder schacht.',
    keinTrunkDockpunkt: 'Die Komponente hat keinen Trunk-Dockpunkt.',
    endeVerloren: 'Das Trunk-Ende ist nach dem Verbinden nicht mehr auffindbar.',
    trunkWeg: 'Kein Trunk "{id}" mehr auf „{blatt}“.',
    angelegt: 'Trunk „{name}“ angelegt ({blatt})',
    verschmolzen: 'In „{name}“ verschmolzen.',
  },
  wandZeichnen: {
    punkteOderRechteck: 'Entweder punkte oder rechteck angeben.',
    rechteckZuKlein: 'Das Rechteck ist für diese Wandstärke zu klein.',
    gezeichnet: 'Wand gezeichnet, {staerke} cm ({blatt})',
  },
  raumAnlegen: {
    nichtUmschlossen:
      'Hier lässt sich kein Raum anlegen – die Fläche ist nicht ganz von Wänden umschlossen.',
    schonVorhanden: 'Hier gibt es schon den Raum „{name}“ ({id}).',
    angelegt: 'Raum „{name}“ angelegt, {flaeche} m² ({blatt})',
  },
  oeffnungSetzen: {
    passtNicht: 'Die Öffnung passt nicht in die Wand (Länge {laenge} m).',
    tuerEingesetzt: 'Tür {breite} cm eingesetzt ({blatt})',
    fensterEingesetzt: 'Fenster {breite} cm eingesetzt ({blatt})',
  },
  leitungenNeuVerlegen: {
    keine: 'Keine automatisch verlegte Leitung zum Neuverlegen gefunden.',
    neuVerlegt: {
      one: '{n} Leitung neu verlegt ({blatt})',
      other: '{n} Leitungen neu verlegt ({blatt})',
    },
    ohneWeg: {
      one: '{n} Leitung ohne kollisionsfreien Weg.',
      other: '{n} Leitungen ohne kollisionsfreien Weg.',
    },
  },
  potentialSetzen: {
    nurSchaltplan: 'Potentiale gibt es nur im Schaltplan.',
    nameFehlt: 'Potential {nr}: Der Name fehlt.',
    eineLage: 'Potential {nr}: Genau eine Lage angeben: punkt oder netzfeld.',
    gesetzt: {
      one: '{n} Potential gesetzt ({namen}){blaetter}',
      other: '{n} Potentiale gesetzt ({namen}){blaetter}',
    },
  },
  schaltverbindungZiehen: {
    verbindung: 'Verbindung {nr}: {text}',
    keinObjektAufBlatt: 'Kein Objekt "{id}" auf Blatt „{blatt}“.',
    nurAnschluesse: {
      one: 'Das Bauteil hat nur {n} Anschluss (Index {index}).',
      other: 'Das Bauteil hat nur {n} Anschlüsse (Index {index}).',
    },
    keinAnschluss: 'Kein Anschluss „{anschluss}“ – vorhanden: {liste}.',
    unbezeichnet: 'Die Anschlüsse dieses Bauteils sind nicht bezeichnet – Index 0–{max} angeben.',
    eineArt: 'Je Ende genau eine Art: kontakt, potential, knoten, verbindung oder punkt.',
    keinBauteil: '"{id}" ist kein Bauteil.',
    keinPotential: '"{id}" ist kein Potential.',
    keinKnotenpunkt: '"{id}" ist kein Knotenpunkt.',
    keineSchaltverbindung: '"{id}" ist keine Schaltverbindung.',
    nurSchaltplan: 'Schaltverbindungen gibt es nur im Schaltplan.',
    polzahlOderAdern: 'polzahl (einlinig) und adern (mehrlinig) schließen sich aus.',
    mehrlinigBezeichnung: 'Mehrlinig bekommen die Adern ihre Bezeichnungen selbst (L1/N/PE …).',
    zweiAbzweige: 'Zwei Abzweige ohne Stelle – an einem Ende punkt angeben.',
    keinWeg: 'Kein freier Weg zwischen den Enden gefunden.',
    gezogen: {
      one: '{n} Schaltverbindung gezogen{blaetter}',
      other: '{n} Schaltverbindungen gezogen{blaetter}',
    },
    gezogenMitAdern: {
      one: '{n} Schaltverbindung gezogen ({adern} Adern){blaetter}',
      other: '{n} Schaltverbindungen gezogen ({adern} Adern){blaetter}',
    },
    gemeinsamNichtFrei: {
      one: '{n} Verbindung ließ sich beim gemeinsamen Verlegen nicht frei legen und behält ihren ersten Weg.',
      other:
        '{n} Verbindungen ließen sich beim gemeinsamen Verlegen nicht frei legen und behalten ihren ersten Weg.',
    },
  },
  automatischAnordnen: {
    einBlatt: 'Anordnen geht nur mit Objekten eines Blatts.',
    zuWenig: 'Zum Anordnen mindestens zwei Komponenten oder eine Verbindung angeben.',
    angeordnet: {
      one: '{n} Komponente angeordnet{blaetter}',
      other: '{n} Komponenten angeordnet{blaetter}',
    },
    neuVerlegt: {
      one: '{n} Verbindung neu verlegt{blaetter}',
      other: '{n} Verbindungen neu verlegt{blaetter}',
    },
    nichtFrei: {
      one: '{n} Verbindung ließ sich nicht frei verlegen.',
      other: '{n} Verbindungen ließen sich nicht frei verlegen.',
    },
    ueberdeckungen: {
      one: '{n} Überdeckung mit anderen Objekten.',
      other: '{n} Überdeckungen mit anderen Objekten.',
    },
    passtNicht: 'Die Anordnung passt nicht ganz auf die Zeichenfläche.',
    einbauortVerlassen: 'Die Komponenten haben ihren Einbauort im Grundriss verlassen.',
  },
  bestueckungVorschlagen: {
    keineRaeume: 'Keine Räume mit Stromkreis zur Auswahl.',
    keinStromkreis:
      'In den gewählten Räumen hat kein Bauteil einen Stromkreis (Eigenschaft „Stromkreis“).',
    vorgeschlagen: 'Bestückung von {verteiler} aus Räumen vorgeschlagen',
    planNeuErzeugen:
      'Der verknüpfte Verteilerplan „{name}“ zeigt die neue Bestückung erst, wenn der Anwender ihn im Verteiler-Dialog neu erzeugt.',
  },
  bestueckungAendern: {
    schritt: 'Schritt {nr}: {text}',
    eineArt:
      'Genau eine Art angeben: betriebsmittel, stromkreise, umhaengen, umbenennen, entfernen oder aendern.',
    keinKnoten: 'Kein Knoten „{name}“ im Baum. Vorhanden: {liste}',
    neueAusDemPlan: 'Mit verknüpftem Verteilerplan kommen neue Betriebsmittel aus dem Plan.',
    mehrphasig:
      '„{name}“ ist mehrphasig, der Verteiler hat Wechselstrom – dort passen nur 1- und 2-polige Geräte.',
    knxAktoren: 'KNX-Aktoren legt knx_aktoren_zuordnen an, mit ihren Kanälen.',
    keinBetriebsmittel: '„{name}“ ist kein Betriebsmittel.',
    keinLeitungsschutzschalter: '„{name}“ ist kein Leitungsschutzschalter.',
    keineKlemme: '„{name}“ ist keine Klemme.',
    ohneZiel: 'Ohne Ziel nur "kind" (an die Einspeisung).',
    hinterSichSelbst: 'Ein Knoten kann nicht hinter sich selbst hängen.',
    nichtEinhaengbar: '{knoten} lässt sich dort nicht einhängen.',
    kanalUmbenennen: '{knoten} ist ein Kanal – umbenennen lässt sich nur das Gerät.',
    imPlanAendern: '{knoten} steht im Verteilerplan und wird dort geändert.',
    keineLeistenklemme: '{knoten} ist keine Klemme der Leiste.',
    kennzeichenVergeben: '„{kennzeichen}“ ist leer oder in diesem Verteiler schon vergeben.',
    imPlanEntfernen: '{knoten} steht im Verteilerplan und wird dort entfernt.',
    keinePhase: '{knoten} hat keine wählbare Phase.',
    keinTyp: '{knoten} hat keinen änderbaren Typ.',
    nichtsAngegeben: 'Nichts zu ändern angegeben.',
    erledigt: {
      betriebsmittel: '{n}× {name}',
      stromkreise: {
        one: '{n} Stromkreis',
        other: '{n} Stromkreise',
      },
      umgehaengt: '{knoten} umgehängt',
      entfernt: '{knoten} entfernt',
      entferntMitAllem: '{knoten} entfernt (mit allem dahinter)',
      geaendert: '{knoten} geändert',
    },
    label: 'Bestückung von {verteiler} geändert ({liste})',
  },
  knxAktorenZuordnen: {
    keineKlemme:
      'Keine Klemme dieses Verteilers versorgt ein Ziel eines KNX-Geräts (Wirkverbindungen fehlen?).',
    alleZugeordnet: 'Alle KNX-Ziele haben schon ihren Kanal.',
    zugeordnet: 'KNX-Aktoren in {verteiler} zugeordnet',
  },
  klemmenleisteNummerieren: {
    keineLeiste: 'Keine Leiste angegeben.',
    schaltplanOhneVerteiler: 'Im Schaltplan gilt die Leiste für alle Blätter – ohne verteilerId.',
    lueckenlos: '-{leiste} ist schon lückenlos nummeriert.',
    nummeriert: 'Klemmenleiste -{leiste} neu nummeriert',
    bauplanMitVerteiler: 'Im Bauplan liegt die Leiste im Verteiler – verteilerId angeben.',
    lueckenlosIn: '-{leiste} in {verteiler} ist schon lückenlos nummeriert.',
    nummeriertIn: 'Klemmenleiste -{leiste} in {verteiler} neu nummeriert',
  },
  verteilerplanErzeugen: {
    keinKennzeichen: 'Der Verteiler hat kein Ortskennzeichen.',
    schonVorhanden:
      'Für {verteiler} gibt es schon den Verteilerplan „{name}“ – er wird nicht überschrieben.',
    ohneProjekt: 'Ohne Projekt lässt sich kein Verteilerplan anlegen.',
    klemmenUeberfuehrt: 'Klemmen von {verteiler} in die Leiste -{leiste} überführt',
    rueckgaengigMoeglich: '{schritt} (rückgängig zu machen).',
    knxOffen: {
      one: '{n} KNX-Ziel ohne Aktorkanal – vorher knx_aktoren_zuordnen hätte es im Plan gezeigt.',
      other:
        '{n} KNX-Ziele ohne Aktorkanal – vorher knx_aktoren_zuordnen hätte sie im Plan gezeigt.',
    },
    angelegt: 'Verteilerplan „{name}“ angelegt',
    neuesDokument:
      'Der Plan ist ein neues Dokument im Projekt; der Anwender entscheidet, ob er ihn öffnet.',
  },
  pruefen: {
    leitungZweiFreieEnden: 'Leitung {nummer} hat zwei freie Enden.',
    leitungFreiesEnde: 'Leitung {nummer} hat ein freies Ende ({ende}).',
    ohneKatalog: 'Komponente ohne Katalogeintrag ({id}).',
    komponente: 'Komponente',
    knappOhneRaum:
      '{name} liegt {cm} cm außerhalb von Raum „{raum}“ und gehört deshalb zu keinem Raum ' +
      '(Raumstromkreis, Name aus dem Raum, Listen).',
    raumUngueltig: 'Raum „{name}“ ist nicht mehr von Wänden umschlossen.',
    klemmeDoppelt: 'Klemmennummer {klemme} ist {n}-mal vergeben.',
    verlegeartAnfang: 'Leitung {nummer} liegt am Anfang {leitung}, die Komponente {komponente}.',
    verlegeartEnde: 'Leitung {nummer} liegt am Ende {leitung}, die Komponente {komponente}.',
    unterPutz: 'unter Putz',
    aufPutz: 'auf Putz',
    verbindungZweiFreieEnden: 'Schaltverbindung hat zwei freie Enden.',
    verbindungFreiesEnde: 'Schaltverbindung hat ein freies Ende ({ende}).',
    benannteZweiFreieEnden: 'Schaltverbindung „{name}“ hat zwei freie Enden.',
    benanntesFreiesEnde: 'Schaltverbindung „{name}“ hat ein freies Ende ({ende}).',
    potentialeVerbunden: 'Hier hängen verschiedene Potentiale zusammen: {namen}.',
    ausserhalbNetz: 'Bauteil liegt außerhalb des Netzes und hat keinen Ort.',
    ausserhalbNetzMitKennzeichen: '-{kennzeichen} liegt außerhalb des Netzes und hat keinen Ort.',
    kennzeichenDoppelt: 'Kennzeichen -{kennzeichen} tragen {n} Betriebsmittel.',
  },
}
