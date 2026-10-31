export const ki = {
  werkzeuge: {
    schema: {
      bereich: 'Rechteck in Metern, bezogen auf den Nullpunkt des Blatts (y zeigt nach oben).',
      blattId: 'Id des Blatts aus dokument_uebersicht. Ohne Angabe: das aktive Blatt.',
      objektIds: 'Ids aus blatt_lesen; Objekte dürfen auf verschiedenen Blättern liegen.',
      punkt: 'Punkt in Metern ab Nullpunkt des Blatts.',
      genauEineArt: 'Genau eine Art angeben.',
      dockpunkt: 'Index aus objekt_lesen; ohne Angabe der passendste.',
      kennzeichen: 'Betriebsmittel, z. B. "F3"; eine Klemme als "X1:4" (Leiste:Nummer).',
      anschluss: 'Anschluss am Betriebsmittel, z. B. "2".',
      anschluesse: 'Nur an einem Verteiler: worauf die Leitung dort landet.',
      kontaktAnschluss:
        'Anschlussbezeichnung wie "A1" oder "13" (objekt_lesen) oder Dockpunkt-Index.',
      potential: 'Objekt-Id eines Potentials.',
      knoten: 'Objekt-Id eines Knotenpunkts.',
      verbindungPunkt:
        'Ungefähre Stelle auf der Verbindung; ohne Angabe die nächste zum anderen Ende.',
      verbindung: 'Abzweig auf einer anderen Schaltverbindung (wird zum Knotenpunkt).',
      freiesEnde: 'Freies Ende.',
      verteilerId: 'Objekt-Id des Verteilers im offenen Bauplan (verteilerbaum_lesen ohne Angabe).',
      trunkKomponente: 'Objekt-Id einer Komponente mit Trunk-Dockpunkt.',
      trunkTrunk: 'Id eines Trunks auf demselben Blatt.',
      aendernHinweis:
        'Ein Aufruf ist ein Rückgängig-Schritt. Abgelehnt, solange der Anwender mit einem ' +
        'Zeichenwerkzeug arbeitet oder "KI darf nur lesen" eingeschaltet ist.',
    },
    dokumentUebersicht: {
      titel: 'Dokument im Überblick',
      beschreibung:
        'Das in el.esy.CAD offene Dokument: Projekt, Zeichnungsart (Bauplan oder Schaltplan), ' +
        'Blätter mit Id, Etage, Maßstab, Nullpunkt und Anzahl der Objekte je Typ, dazu das aktive ' +
        'Blatt. Zuerst aufrufen - die Blatt-Ids braucht jedes andere Werkzeug.',
    },
    blattLesen: {
      titel: 'Blatt lesen',
      beschreibung:
        'Die Objekte eines Blatts in Kurzform: Id, Typ, Lage (Meter ab Nullpunkt) und die ' +
        'wichtigsten Angaben (Bezeichnung, Katalogname, Raum, Leitungsnummer, Anschlüsse). ' +
        'Filterbar nach Objekttyp (z. B. "komponente", "leitung", "trunk", "raum", "wand") und ' +
        'nach einem Bereich. Alle Eigenschaften eines Objekts liefert objekt_lesen.',
      typen: 'Nur diese Objekttypen, z. B. ["komponente", "leitung"].',
      maxAnzahl: 'Höchstens so viele Objekte (Vorgabe 300).',
    },
    objektLesen: {
      titel: 'Objekt lesen',
      beschreibung:
        'Alle Eigenschaften eines Objekts als JSON, wie es in der Zeichnung gespeichert ist ' +
        '(Koordinaten darin in Modellkoordinaten, der Nullpunkt des Blatts steht dabei). Bei ' +
        'Komponenten zusätzlich der Katalogeintrag und die Dockpunkte mit Lage.',
      objektId: 'Id aus blatt_lesen.',
    },
    raeumeLesen: {
      titel: 'Räume lesen',
      beschreibung:
        'Die Räume eines Blatts (oder aller Blätter) mit Name, Fläche in m², Umriss, Etage und ' +
        'den Komponenten darin als Anzahl je Katalogeintrag. Die Ids der Komponenten nur mit ' +
        'mitIds - für objekt_lesen oder eine gezielte Frage zu einzelnen Komponenten.',
      alleBlaetter: 'Räume aller Blätter statt nur eines.',
      mitIds: 'Je Katalogeintrag auch die Ids der Komponenten (Vorgabe: nein).',
    },
    katalogSuchen: {
      titel: 'Katalog durchsuchen',
      beschreibung:
        'Sucht im Produktkatalog nach Name, Hersteller, Artikelnummer oder Kategorie. Liefert je ' +
        'Treffer Id, Katalog, Gerätetyp, Montageort, Varianten und die Zahl der Dockpunkte. ' +
        'Ausgemusterte Komponenten fehlen.',
      text: 'Suchtext; mehrere Wörter müssen alle vorkommen.',
      geraetetyp: 'Nur dieser Gerätetyp (Feld "typ").',
      katalogId: 'Nur dieser Katalog.',
      maxAnzahl: 'Vorgabe 30.',
    },
    listeLesen: {
      titel: 'Liste lesen',
      beschreibung:
        'Eine der Listen von el.esy.CAD als Tabelle (Spalten, Zeilen, Summe) - dieselben Daten ' +
        'wie die Plan-Einlage und der Excel-Export. Die Leitungsliste enthält die ' +
        'Leitungslängen. Stromkreisverzeichnis und Aktorkanalliste gelten je Verteiler.',
      umfang: 'Ganze Zeichnung (Vorgabe) oder nur ein Blatt.',
      verteiler: 'Ortskennzeichen des Verteilers ohne "+", z. B. "UV1".',
    },
    verteilerbaumLesen: {
      titel: 'Verteilerbaum lesen',
      beschreibung:
        'Die Bestückung eines Verteilers als Baum des Stromwegs (Vorsicherung → RCD → LS → ' +
        'Kanal → Klemme): je Knoten Kennzeichen, Typ, Bezeichnung, Phase und Tiefe. Ohne Angabe ' +
        'die Verteiler der Zeichnung zur Auswahl.',
      verteiler: 'Ortskennzeichen ohne "+", z. B. "UV1". Ohne Angabe: Liste der Verteiler.',
    },
    pruefen: {
      titel: 'Zeichnung prüfen',
      beschreibung:
        'Sucht Auffälligkeiten: Leitungen mit freiem Ende, Komponenten ohne Katalogeintrag, ' +
        'ungültige Räume, doppelt vergebene Klemmennummern, Leitungen, deren Verlegeart ' +
        '(AP/UP) nicht zur angeschlossenen Komponente passt, und Komponenten bis 30 cm neben ' +
        'einem Raum, die deshalb zu keinem Raum gehören (meist in der Wand gelandet). Im ' +
        'Schaltplan zusätzlich: Schaltverbindungen mit freiem Ende, Netze mit zwei verschiedenen ' +
        'Potentialen, doppelte Gerätekennzeichen und Bauteile außerhalb des Netzes A–H/1–6.',
      blattId: 'Nur dieses Blatt. Ohne Angabe: alle Blätter.',
    },
    bildschirmfoto: {
      titel: 'Bildschirmfoto',
      beschreibung:
        'Ein Bild (PNG) eines Blatts mit derselben Darstellung wie im Druck - ohne Bereich der ' +
        'ganze Inhalt des Blatts, mit Bereich nur dieser Ausschnitt. Zur Kontrolle von Lage und ' +
        'Anordnung.',
      maxKantePx: 'Längere Bildkante in Pixeln (Vorgabe 1568).',
    },
    eigenschaftenSetzen: {
      titel: 'Eigenschaften setzen',
      beschreibung:
        'Setzt Eigenschaften an einem oder vielen Objekten auf einmal, über dieselben Wege wie ' +
        'das Eigenschaften-Panel. Jedes Feld gilt nur für die Objekttypen, zu denen es passt ' +
        '(Komponente: beschriftung, installationshoeheM, montageort, verlegung, stromkreis, ' +
        'stromkreisPolzahl, knx, variableTexte, kennzeichen; Leitung: kabeltyp, beschreibung; ' +
        'Trunk: name, beschreibung; Raum: name, raumart).',
      beschriftung: 'Leer löscht die Beschriftung.',
      installationshoeheM: 'Installationshöhe in Metern; null = Vorgabe.',
      verlegung: 'Aufputz/Unterputz - gilt für die ganze Kombination an der Wand.',
      stromkreis: 'vorgabe, kein, raum (Raumstromkreis), eigen oder die Nummer im Raum.',
      stromkreisPolzahl: 'Polzahl eines eigenen Stromkreises; null = Vorgabe.',
      variableTexte: 'Feldname -> Wert der variablen Texte, z. B. {"Wippen": "2"}.',
      kennzeichen: 'Betriebsmittelkennzeichen, nur für genau eine Komponente.',
      kabeltyp: 'Name eines Kabeltyps, z. B. "NYM-J 3x1,5"; unbekannt = freier Text.',
      raumart:
        'Raumart (kueche, bad, wc, kind, schlafen, arbeiten, wohnen, essen, hauswirtschaft, hobby, ' +
        'flur, freisitz, abstell, keller, sonstige). Ohne name übernimmt der Raum den Namen der ' +
        'Raumart, solange er noch einen Vorgabenamen trägt.',
      mindestensEinFeld: 'Mindestens ein Feld angeben.',
    },
    objekteLoeschen: {
      titel: 'Objekte löschen',
      beschreibung:
        'Löscht Objekte wie die Entf-Taste: angedockte Leitungen und Verweise werden mit ' +
        'aufgeräumt; die Antwort nennt alles Mitgelöschte.',
    },
    objekteVerschieben: {
      titel: 'Objekte verschieben',
      beschreibung:
        'Verschiebt Objekte um einen Versatz in Metern oder genau eine Komponente an einen Punkt ' +
        '(Meter ab Nullpunkt). Angeschlossene Leitungen und Trunks werden neu verlegt.',
      dx: 'Versatz nach rechts in Metern.',
      dy: 'Versatz nach oben in Metern.',
      nach: 'Zielpunkt für genau eine Komponente, Meter ab Nullpunkt.',
    },
    objekteDrehen: {
      titel: 'Komponenten drehen',
      beschreibung:
        'Dreht Komponenten je um ihren Fangpunkt; positiv = gegen den Uhrzeigersinn. ' +
        'Angeschlossene Leitungen werden neu verlegt.',
    },
    komponenteAustauschen: {
      titel: 'Komponente austauschen',
      beschreibung:
        'Tauscht Komponenten gegen einen anderen Eintrag desselben Katalogs oder nur die ' +
        'Variante (gleiche katalogId, andere varianteId). Position, Beschriftung, Kennzeichen und ' +
        'Anschlüsse bleiben; was am neuen Eintrag keinen Anschluss fände, wird nicht getauscht.',
      katalogId: 'Id des Katalogeintrags aus katalog_suchen.',
      varianteId: 'Ohne Angabe: Variante mit kleinster Art.-Nr.',
    },
    blattAnlegen: {
      titel: 'Blatt anlegen',
      beschreibung:
        'Legt ein leeres Blatt an - hinter dem genannten oder am Ende. Die Ansicht des Anwenders ' +
        'wechselt nicht; die Zeichenfläche richtet er selbst ein.',
      nachBlattId: 'Das neue Blatt kommt dahinter.',
    },
    komponenteSetzen: {
      titel: 'Komponenten setzen',
      beschreibung:
        'Setzt neue Komponenten aus dem Katalog (bis 200 je Aufruf). Lage je Komponente genau ' +
        'eine von: punkt (Meter ab Nullpunkt; dorthin kommt der Fangpunkt des Symbols, meist der ' +
        'erste Anschluss, wie beim Klicken), raumMitte (Raum-Id; Symbolmitte in die Raummitte, ' +
        'für Deckenbauteile) oder wand (Wand-Id aus blatt_lesen, Abstand ab dem ersten Wandpunkt ' +
        'in m, dazu raumId oder seite - die App ordnet wie der Wandfang in Reihe nach Höhe und ' +
        'Kombination ein). Im Schaltplan zusätzlich netzfeld ("C3": Symbolmitte in die Feldmitte); ' +
        'dort rastet der Fangpunkt immer auf das 0,24-m-Raster, damit Kontakte fluchten. ' +
        'Kennzeichen und Klemmennummern vergibt die App.',
      katalogId: 'Id aus katalog_suchen.',
      varianteId: 'Ohne Angabe: kleinste Art.-Nr.',
      blattId: 'Nur für punkt und netzfeld; sonst aus Raum bzw. Wand.',
      netzfeld: 'Nur Schaltplan: Feld des Netzes A–H/1–6, z. B. "C3".',
      raumMitte: 'Raum-Id aus raeume_lesen.',
      abstandM:
        'Ab dem ersten Punkt der Wand, in m. Eine Kombination entsteht nur, wenn sich das Symbol ' +
        'mit einem vorhandenen überdeckt (gleicher Abstand); bündig daneben bleibt es eine eigene Stelle.',
      raumId: 'Raum, auf dessen Seite die Komponente sitzt.',
      seite: 'Ohne raumId: links/rechts der Wandrichtung (erster -> zweiter Punkt).',
      hoeheM: 'Installationshöhe; ohne Angabe die Standardhöhe des Gerätetyps.',
      drehungGrad: 'Nur für punkt, raumMitte und netzfeld.',
    },
    leitungVerlegen: {
      titel: 'Leitungen verlegen',
      beschreibung:
        'Verlegt neue Leitungen (bis 100 je Aufruf) per Autorouting. Enden (von/nach), je genau ' +
        'eine Art: komponente (Objekt-Id, optional Dockpunkt-Index; an einem Verteiler optional ' +
        'anschluesse auf F/X/K), punkt (freies Ende), schacht (Kabelschacht-Id, optional Strang; ' +
        'ohne Strang ein neuer), switchport (Switch/Patchfeld an einer Trunk-Kette, optional ' +
        'Port; ohne Port der erste freie) oder verteiler (Verteiler an einer Trunk-Kette). ' +
        'switchport, verteiler und ein Schacht an der Kette verlangen trunks und sind nur als ' +
        '"nach" erlaubt - die Leitung endet dann im Bündel. trunks: Eintritt in den ersten Trunk ' +
        'nahe "von", Austritt aus dem letzten nahe "nach". verknuepfen: legt danach Wirkverbindung, ' +
        'Abgleich oder Gerätegruppe an wie der Dialog es vorschlägt.',
      blattId: 'Ohne Angabe: Blatt der Enden bzw. aktives.',
      austrittTrunkId: 'Letzter Trunk der Kette; ohne Angabe derselbe wie der Eintritt.',
      verknuepfen: 'Wirkverbindung/Abgleich/Gruppe zwischen den Enden anlegen.',
    },
    leitungenNeuVerlegen: {
      titel: 'Leitungen neu verlegen',
      beschreibung:
        'Verlegt Leitungen eines Blatts neu - alle automatisch verlegten oder nur die genannten.',
      leitungIds: 'Ohne Angabe: alle des Blatts.',
    },
    trunkAnlegen: {
      titel: 'Trunk anlegen',
      beschreibung:
        'Legt einen Trunk (Kabelbündel) aus Wegpunkten an (Meter ab Nullpunkt). Jedes Ende ' +
        'optional verbunden: komponente (Trunk-Dockpunkt der Komponente, das Ende springt dorthin), ' +
        'trunk (an dessen Ende verschmolzen bzw. an dessen Pfad angedockt) oder schacht ' +
        '(Kabelschacht-Strang; ohne Strang ein neuer).',
    },
    wandZeichnen: {
      titel: 'Wand zeichnen',
      beschreibung:
        'Zeichnet einen Wandzug (punkte, Wandachse, Meter ab Nullpunkt; geschlossen verbindet den ' +
        'letzten mit dem ersten Punkt) oder eine Rechteckwand (rechteck: zwei Ecken des ' +
        'Außenmaßes). Stärke ohne Angabe wie gerade eingestellt.',
    },
    raumAnlegen: {
      titel: 'Raum anlegen',
      beschreibung:
        'Legt einen Raum an der Stelle an, die von Wänden umschlossen ist (wie ein Klick mit dem ' +
        'Raum-Werkzeug).',
      punkt: 'Ein Punkt im Raum, Meter ab Nullpunkt.',
      raumart:
        'Raumart (kueche, bad, wc, kind, schlafen, arbeiten, wohnen, essen, hauswirtschaft, hobby, ' +
        'flur, freisitz, abstell, keller, sonstige). Ohne name wird der Raum danach benannt.',
    },
    oeffnungSetzen: {
      titel: 'Tür oder Fenster setzen',
      beschreibung:
        'Setzt eine Tür oder ein Fenster in eine Wand: Wand-Id, Abstand der Öffnungsmitte ab dem ' +
        'ersten Wandpunkt in m. Maße ohne Angabe wie die Bauteilvorgaben.',
      bruestungM: 'Nur Fenster.',
      gespiegelt: 'Nur Tür: Anschlag auf der anderen Seite.',
      schwenkInnen: 'Nur Tür: öffnet zur anderen Wandseite.',
    },
    potentialSetzen: {
      titel: 'Potential setzen',
      beschreibung:
        'Setzt Potentiale im Schaltplan (L1, N, PE oder frei; gleich benannte gelten projektweit ' +
        'als verbunden) - je genau eine Lage: punkt oder netzfeld. Der Punkt rastet auf das Raster.',
      netzfeld: 'z. B. "A1"',
    },
    schaltverbindungZiehen: {
      titel: 'Schaltverbindungen ziehen',
      beschreibung:
        'Zieht Schaltverbindungen im Schaltplan (bis 100 je Aufruf). Enden (von/nach) je genau ' +
        'eine Art: kontakt (Bauteil und Anschluss), potential, knoten, verbindung (Abzweig) oder ' +
        'punkt (frei). Einlinig: eine Ader, mit polzahl als mehrpolige Sammeldarstellung. ' +
        'Mehrlinig: adern 2–5 laufen im Polabstand parallel wie beim Zeichnen von Hand; weitere ' +
        'Adern docken an, wo ihr Ende auf einem Kontakt liegt, an einem Abzweig bilden sie die ' +
        'Treppe. Ohne wegpunkte verlegt die App waagrecht/senkrecht um die Symbole; alle einlinigen ' +
        'Verbindungen eines Aufrufs gemeinsam, ohne sich zu decken.',
      polzahl: 'Einlinig mehrpolig; bindet am Kontakt die benachbarten mit ein.',
      adern: 'Mehrlinig.',
      seiteUmgekehrt: 'Mehrlinig: weitere Adern auf der anderen Seite.',
      bezeichnung: 'Nur einlinig; z. B. "L1".',
      wegpunkte: 'Eigene Stützpunkte; das Stück zum Ziel verlegt die App.',
    },
    automatischAnordnen: {
      titel: 'Automatisch anordnen',
      beschreibung:
        'Ordnet Komponenten eines Blatts automatisch in Stufen von oben nach unten an und verlegt ' +
        'ihre Verbindungen gemeinsam neu (beste Variante, gemerkte Einstellungen des Anwenders). ' +
        'Im Bauplan verlassen die Komponenten dabei ihren Einbauort.',
    },
    bestueckungVorschlagen: {
      titel: 'Bestückung aus Räumen vorschlagen',
      beschreibung:
        'Schlägt die Bestückung eines Verteilers aus der Eigenschaft "Stromkreis" der Komponenten ' +
        'in den gewählten Räumen vor (je Blatt ein RCD, je Stromkreis LS mit Klemme, KNX-Ziele mit ' +
        'eigener Klemme) und übernimmt sie. Geht nicht, wenn schon ein Verteilerplan verknüpft ist. ' +
        'Ein Vorschlag: den Prüfhinweis der Antwort (pruefhinweis) an den Anwender weitergeben.',
      raumId: 'Ohne Angabe: "ohne Raum" dieses Blatts.',
      raeume: 'Ohne Angabe: die zuletzt gewählten bzw. alle noch nicht versorgten.',
      knx: 'KNX-Aktoren gleich zuordnen; Vorgabe ja.',
      verwaisteBehalten: 'Knoten, deren Raum nicht mehr gewählt ist, stehen lassen; Vorgabe nein.',
    },
    bestueckungAendern: {
      titel: 'Bestückung ändern',
      beschreibung:
        'Bearbeitet den Verteilerbaum wie der Verteiler-Dialog, Schritte der Reihe nach (bis 50). ' +
        'Knoten heißen wie in verteilerbaum_lesen ("F3", "X1:4", "K1:A3"). Je Schritt genau eine ' +
        'Art: betriebsmittel (Katalogeintrag hinter einen Knoten), stromkreise (Anzahl LS mit ' +
        'Klemme), umhaengen, umbenennen (Gerät bzw. Klemmennummer), entfernen, aendern (Phase, ' +
        'Typ, Beschriftung). Mit verknüpftem Verteilerplan nur, was dort nicht steht.',
      hinter: 'Knoten; ohne Angabe an der Einspeisung.',
      schutzKatalogId: 'Ohne Angabe: der zuletzt gewählte LS.',
      klemmeKatalogId: 'null = ohne Klemme; ohne Angabe die zuletzt gewählte.',
      ziel: 'Knoten; null nur mit "kind" = Einspeisung.',
      neu: 'Kennzeichen ("F12") bzw. an einer Klemme "X2", "X1:7".',
      typ: 'Variabler Text "Typ", z. B. "B16".',
    },
    knxAktorenZuordnen: {
      titel: 'KNX-Aktoren zuordnen',
      beschreibung:
        'Ordnet jeder Klemme, deren Verbraucher ein KNX-Gerät über eine Wirkverbindung schaltet, ' +
        'einen Aktorkanal zu (vorgeschlagene Kanalart, Reserve), legt fehlende Aktoren an und gibt ' +
        'Kanäle ohne KNX-Ziel frei - wie der Dialog mit allen Vorschlägen. Ein Vorschlag: den ' +
        'Prüfhinweis der Antwort (pruefhinweis) an den Anwender weitergeben.',
      reserveProzent: 'Ohne Angabe: die gemerkte.',
      freigeben: 'Kanäle ohne KNX-Ziel freigeben; Vorgabe ja.',
    },
    klemmenleisteNummerieren: {
      titel: 'Klemmenleiste nummerieren',
      beschreibung:
        'Nummeriert eine Klemmenleiste lückenlos ab 1 neu - im Schaltplan die gesetzten Klemmen ' +
        'auf allen Blättern, im Bauplan in der Bestückung des Verteilers (verteilerId nötig, ' +
        'Leitungszuweisungen ziehen mit).',
      leiste: 'z. B. "X1"; ohne Angabe die zuletzt gewählte.',
      verteilerId: 'Nur im Bauplan.',
    },
    verteilerplanErzeugen: {
      titel: 'Verteilerplan erzeugen',
      beschreibung:
        'Erzeugt aus dem Verteilerbaum eines Verteilers im offenen Bauplan einen Verteilerplan ' +
        '(Schaltplan) als neues Dokument im Projekt, verknüpft über das Ortskennzeichen. Das ' +
        'offene Dokument bleibt; der Anwender wird gefragt, ob er den Plan öffnen will. Ein ' +
        'vorhandener Plan desselben Verteilers wird nicht überschrieben. Nicht rückgängig zu machen. ' +
        'Ein Vorschlag: den Prüfhinweis der Antwort (pruefhinweis) an den Anwender weitergeben.',
      name: 'Ohne Angabe der übliche Vorschlag.',
    },
    rueckgaengig: {
      titel: 'Rückgängig',
      beschreibung:
        'Nimmt die letzten Änderungen der KI zurück und hält am ersten Schritt an, den der ' +
        'Anwender selbst gemacht hat - dessen Arbeit bleibt immer stehen.',
      anzahl: 'Vorgabe 1.',
    },
  },
  protokoll: {
    anleitung:
      'el.esy.CAD ist ein CAD-Werkzeug für Elektro- und Netzwerkplanung. Die Werkzeuge arbeiten ' +
      'auf dem Dokument, das gerade in el.esy.CAD offen ist. Zuerst dokument_uebersicht aufrufen. ' +
      'Längen in Metern, Koordinaten in Metern ab dem Nullpunkt des Blatts, y zeigt nach oben. ' +
      'Objekte werden über ihre Id aus blatt_lesen angesprochen. Ändernde Werkzeuge sind je Aufruf ' +
      'ein Rückgängig-Schritt; rueckgaengig nimmt nur eigene Schritte zurück. Vor dem Ändern prüfen, ' +
      'was betroffen ist, und dem Anwender das Ergebnis nennen. Ein Bauplan ist ein Grundriss mit ' +
      'Komponenten, Leitungen und Trunks; ein Schaltplan (Verteilerplan) zeigt Betriebsmittel mit ' +
      'Schaltverbindungen im Netz A–H/1–6. Die Bestückung eines Verteilers lebt im Bauplan; der ' +
      'Verteilerplan entsteht daraus mit verteilerplan_erzeugen. Nach dem Zeichnen pruefen aufrufen.',
    ohneName: 'tools/call braucht einen Namen.',
    unbekanntesWerkzeug: 'Unbekanntes Werkzeug: {name}',
    nurLesen:
      'In el.esy.CAD ist „KI darf nur lesen“ eingeschaltet – dieses Werkzeug ändert die Zeichnung.',
    ungueltigeEingabe: 'Ungültige Eingabe für {werkzeug} – {gruende}',
    eingabe: 'Eingabe',
    keinJsonRpc: 'Keine JSON-RPC-2.0-Nachricht.',
    unbekannteMethode: 'Unbekannte Methode: {methode}',
    unerwartet: 'Unerwarteter Fehler',
  },
  bruecke: {
    keineApp:
      'el.esy.CAD ist nicht geöffnet oder die KI-Schnittstelle ist dort noch nicht verbunden. ' +
      'Bitte el.esy.CAD starten und ein Dokument öffnen.',
    getrennt: 'Die Verbindung zu el.esy.CAD wurde während des Aufrufs getrennt.',
    zeitlimit: 'el.esy.CAD hat nicht innerhalb von {sekunden} s geantwortet.',
    kiAssistent: 'KI-Assistent',
  },
  routen: {
    fremderUrsprung: 'Zugriff von dieser Seite ist nicht erlaubt.',
    ausgeschaltet:
      'Die KI-Schnittstelle ist in el.esy.CAD ausgeschaltet (Einstellungen › KI-Assistent).',
    tokenFalsch:
      'Zugangstoken fehlt oder ist falsch. Den aktuellen Befehl zeigt el.esy.CAD unter ' +
      'Einstellungen › KI-Assistent.',
    keinJson: 'Kein gültiges JSON.',
  },
  stdio: {
    keinJson: 'Kein gültiges JSON.',
    laeuftNicht: 'el.esy.CAD läuft nicht – bitte die App starten.',
    antwortStatus: 'el.esy.CAD hat mit {status} geantwortet.',
    tokenFehlt: '{variable} ist nicht gesetzt - el.esy.CAD wird jeden Aufruf ablehnen.',
  },
}
