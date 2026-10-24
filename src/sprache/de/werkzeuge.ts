export const werkzeuge = {
  tasten: {
    leertaste: 'Leertaste',
    entf: 'Entf',
    strg: 'Strg',
    gerade: 'Gerade',
    fertig: 'Fertig',
    punktZurueck: 'Punkt zurück',
    drehen90: 'Drehen 90°',
    oderEnter: ' oder Enter',
    oderEntf: ' oder Entf',
    slashEnter: '/Enter',
    strgGerade: ', mit gedrückter Strg-Taste gerade',
  },
  aktorkanalliste: {
    status: 'Klicken, um die obere linke Ecke der Aktorkanalliste zu setzen.',
    einsetzen: 'Aktorkanalliste einsetzen',
  },
  betriebsmittelliste: {
    status: 'Klicken, um die obere linke Ecke der Betriebsmittelliste zu setzen.',
    einsetzen: 'Betriebsmittelliste einsetzen',
  },
  leitungsbaum: {
    status: 'Klicken, um die obere linke Ecke des Leitungsbaums zu setzen.',
    einsetzen: 'Leitungsbaum einsetzen',
  },
  leitungsliste: {
    status: 'Klicken, um die obere linke Ecke der Leitungsliste zu setzen.',
    einsetzen: 'Leitungsliste einsetzen',
  },
  plankopf: {
    status: 'Klicken, um die obere linke Ecke des Plankopfs zu setzen.',
    einsetzen: 'Plankopf einsetzen',
  },
  potentialliste: {
    status: 'Klicken, um die obere linke Ecke der Potentialliste zu setzen.',
    einsetzen: 'Potentialliste einsetzen',
  },
  raumliste: {
    status: 'Klicken, um die obere linke Ecke der Raumliste zu setzen.',
    einsetzen: 'Raumliste einsetzen',
  },
  steuerungslogik: {
    status: 'Klicken, um die obere linke Ecke der Steuerungslogik-Tabelle zu setzen.',
    einsetzen: 'Steuerungslogik einsetzen',
  },
  stromkreisverzeichnis: {
    status: 'Klicken, um die obere linke Ecke des Stromkreisverzeichnisses zu setzen.',
    einsetzen: 'Stromkreisverzeichnis einsetzen',
  },
  stueckliste: {
    status: 'Klicken, um die obere linke Ecke der Stückliste zu setzen.',
    einsetzen: 'Stückliste einsetzen',
  },
  trunkliste: {
    status: 'Klicken, um die obere linke Ecke der Trunkliste zu setzen.',
    einsetzen: 'Trunkliste einsetzen',
  },
  bogen: {
    mittelpunkt: 'Mittelpunkt des Bogens klicken.',
    startpunkt: 'Startpunkt des Bogens klicken (legt Radius fest).',
    endpunkt: 'Endpunkt des Bogens klicken.',
    zeichnen: 'Bogen zeichnen',
  },
  kreis: {
    mittelpunkt: 'Mittelpunkt klicken.',
    radius: 'Radius durch Klick festlegen.',
    zeichnen: 'Kreis zeichnen',
  },
  ellipse: {
    mittelpunkt: 'Mittelpunkt der Ellipse klicken.',
    zweiterPunkt: 'Zweiten Punkt klicken (Breite/Höhe).',
    zeichnen: 'Ellipse zeichnen',
  },
  linie: {
    startpunkt: 'Startpunkt klicken.',
    endpunkt: 'Endpunkt klicken (Shift = Winkel fangen, Esc = Abbrechen).',
    zeichnen: 'Linie zeichnen',
  },
  punkt: {
    status: 'Klicken, um einen Punkt zu setzen.',
    zeichnen: 'Punkt zeichnen',
  },
  rechteck: {
    ersteEcke: 'Erste Ecke klicken.',
    gegenecke: 'Gegenüberliegende Ecke klicken.',
    zeichnen: 'Rechteck zeichnen',
  },
  bemassung: {
    startpunkt: 'Startpunkt der zu bemaßenden Strecke klicken.',
    endpunkt: 'Endpunkt der Strecke klicken (Shift = Winkel fangen).',
    versatz: 'Versatz der Maßlinie durch Klick festlegen.',
    einfuegen: 'Bemaßung einfügen',
  },
  text: {
    status: 'Klicken, um die Textposition festzulegen.',
    einfuegen: 'Text einfügen',
    inhalt: 'Textinhalt:',
  },
  polylinie: {
    status: 'Punkte anklicken, Doppelklick{taste} zum Abschließen, Esc zum Abbrechen.',
    zeichnen: 'Polylinie zeichnen',
  },
  polygon: {
    mittelpunkt: 'Mittelpunkt klicken ({n} Seiten{taste}).',
    mittelpunktTaste: ', +/- ändert die Anzahl',
    eckpunkt: 'Eckpunkt klicken (legt Radius/Drehung fest).',
    zeichnen: 'Polygon zeichnen',
    seiten: 'Seiten',
    weniger: 'Weniger Seiten',
    mehr: 'Mehr Seiten',
    anzahl: '{n} Seiten.',
  },
  schraffur: {
    einfuegen: 'Schraffur einfügen',
    status:
      'Konturpunkte klicken (Muster: {muster}{tasteM}). Doppelklick{tasteEnter} schliesst ab.',
    statusTasteM: ', Taste M wechselt',
    wechseln: 'Muster wechseln ({muster})',
    muster: 'Muster: {muster}',
    musterName: {
      diagonal: 'diagonal',
      kreuz: 'kreuz',
      horizontal: 'horizontal',
      vertikal: 'vertikal',
    },
  },
  bodenplatte: {
    zeichnen: 'Bodenplatte zeichnen',
    zuWenigPunkte: 'Eine Bodenplatte braucht mindestens drei Eckpunkte.',
    status:
      'Eckpunkte anklicken; Klick auf den ersten Punkt, Doppelklick{taste} schließt die Platte, Esc bricht ab.',
    schliessen: 'Schließen',
    ersteEcke: 'Erste Ecke der Bodenplatte klicken.',
    gegenecke: 'Gegenüberliegende Ecke klicken, Esc zum Abbrechen.',
  },
  hintergrund: {
    keiner:
      'Kein Hintergrund geladen - erst über Blatt › Hintergrundplan einlesen… einen Plan laden.',
    gesperrt: 'Die Ebene „Hintergrund“ ist gesperrt - erst im Ebenen-Dialog entsperren.',
  },
  kalibrieren: {
    ifc: 'Ein IFC-Hintergrund ist bereits maßstäblich - Kalibrieren ist hier gesperrt.',
    ersterPunkt: 'Ersten Punkt einer bekannten Strecke im Hintergrund klicken.',
    zweiterPunkt: 'Zweiten Punkt der bekannten Strecke klicken.',
    titel: 'Hintergrund kalibrieren',
    laenge: 'Reale Länge der markierten Strecke (cm):',
    rohwert:
      'Bildschirm-Distanz vor Kalibrierung: {distanz} m (Rohwert, wird durch die Eingabe ersetzt)',
    erkannt: 'Plan im Maßstab 1:{norm} erkannt. ',
    erkanntDruck: 'Plan im Maßstab 1:{norm} erkannt, die Zeichenfläche druckt in 1:{norm}. ',
    erkanntPasstNicht:
      'Plan im Maßstab 1:{norm} erkannt, er passt so nicht auf {papier} - die Zeichenfläche druckt in 1:{nenner}. ',
    gesetzt:
      'Maßstab gesetzt: {massstab}Der Plan ist damit {breite} × {hoehe} m groß. Passt das nicht, noch einmal kalibrieren - die reale Länge wird in Zentimetern eingegeben.',
  },
  erkennungProbe: {
    bezeichnung: 'Erkennung: Probe aufziehen',
    gegenecke: 'Gegenüberliegende Ecke der Probe klicken.',
    wand: 'Rechteck über eine typische Wand aufziehen - daraus werden Wandstärke und Farbe gemessen.',
    tuer: 'Rechteck über eine typische Tür aufziehen - daraus werden Öffnungsbreite und Farbe gemessen.',
    fenster:
      'Rechteck über ein typisches Fenster aufziehen - daraus werden Öffnungsbreite und Farbe gemessen.',
  },
  fenster: {
    wandZeigen: 'Auf eine Wand zeigen, um ein Fenster einzusetzen (Esc beendet).',
    klicken: 'Klicken, um das Fenster einzusetzen (Esc beendet).',
    weitere: {
      one: '{n} Fenster eingesetzt – Klicken, um das Fenster einzusetzen (Esc beendet).',
      other: '{n} Fenster eingesetzt – Klicken, um das Fenster einzusetzen (Esc beendet).',
    },
    einsetzen: 'Fenster einsetzen',
  },
  tuer: {
    taste: 'Leertaste wechselt Anschlag/Öffnungsseite, ',
    wandZeigen: 'Auf eine Wand zeigen, um eine Tür einzusetzen ({taste}Esc beendet).',
    klicken: 'Klicken, um die Tür einzusetzen ({taste}Esc beendet).',
    weitere: {
      one: '{n} Tür eingesetzt – Klicken, um die Tür einzusetzen ({taste}Esc beendet).',
      other: '{n} Türen eingesetzt – Klicken, um die Tür einzusetzen ({taste}Esc beendet).',
    },
    einsetzen: 'Tür einsetzen',
    anschlag: 'Anschlag wechseln',
    oeffnungsseite: 'Öffnungsseite wechseln',
  },
  wanddurchbruch: {
    wandZeigen: 'Auf eine Wand zeigen, um einen Wanddurchbruch einzusetzen (Esc beendet).',
    klicken: 'Klicken, um den Wanddurchbruch einzusetzen (Esc beendet).',
    weitere: {
      one: '{n} Wanddurchbruch eingesetzt – Klicken, um den Wanddurchbruch einzusetzen (Esc beendet).',
      other:
        '{n} Wanddurchbrüche eingesetzt – Klicken, um den Wanddurchbruch einzusetzen (Esc beendet).',
    },
    einsetzen: 'Wanddurchbruch einsetzen',
  },
  ausblenden: {
    ersteEcke:
      'Erste Ecke der auszublendenden Fläche klicken - oder eine vorhandene Ausblendung anklicken, um sie zu entfernen.',
    entfernen: 'Ausblendung entfernen',
    entfernt: 'Ausblendung entfernt.',
    ausblenden: 'Bereich des Hintergrunds ausblenden',
  },
  ifcAusrichten: {
    schritt1:
      'Ausrichten 1/4: einen markanten Punkt im bisherigen Plan klicken (z. B. eine Gebäudeecke).',
    schritt2:
      'Ausrichten 2/4: einen zweiten Punkt im bisherigen Plan klicken - möglichst weit entfernt.',
    schritt3: 'Ausrichten 3/4: denselben ersten Punkt im IFC-Grundriss (orange) klicken.',
    schritt4: 'Ausrichten 4/4: denselben zweiten Punkt im IFC-Grundriss (orange) klicken.',
    keinGeschoss: 'Kein IFC-Geschoss zum Ausrichten.',
    warnung:
      ' Die Abweichung ist ungewöhnlich groß - stimmen die Punkte, und war der bisherige Plan richtig kalibriert? Ihre Planung wird nicht mitskaliert.',
    titel: 'IFC-Geschoss übernehmen',
    frage:
      'Abstand im bisherigen Plan {plan} m, im IFC-Modell {ifc} m (Abweichung {prozent} %). Der bisherige Hintergrund wird ersetzt.{warnung}',
    uebernehmen: 'Übernehmen',
    zusammen: 'Die beiden Punkte eines Paares fallen zusammen - bitte noch einmal.',
  },
  ifcBauteileVorschau: {
    status: 'Vorschau der IFC-Bauteile - im Dialog übernehmen oder schließen.',
  },
  kabelschacht: {
    ersteEcke:
      'Ecke des Durchbruchs klicken – zweiter Klick an dieselbe Stelle nimmt die Standardgröße.',
    einfuegen: 'Kabelschacht einfügen',
  },
  nullpunkt: {
    status:
      'Klicken, um den Nullpunkt des Blatts zu setzen (Bezug für Koordinaten, Raster und Fang).',
    setzen: 'Nullpunkt setzen',
    richtung:
      'Punkt entlang einer Gebäudekante klicken – das ist die Richtung, die beim Ausrichten der Blätter waagerecht wird{taste}.',
    richtungTaste: ' (Enter: ohne Richtung)',
    ohneRichtung: 'Ohne Richtung',
  },
  raum: {
    status:
      'In eine von Wänden umschlossene Fläche klicken, um einen Raum anzulegen (Esc beendet).',
    nichtUmschlossen:
      'Hier lässt sich kein Raum anlegen – die Fläche ist nicht vollständig von Wänden umschlossen.',
    vorhanden: 'In dieser Fläche gibt es bereits einen Raum – ausgewählt.',
    anlegen: 'Raum anlegen',
  },
  treppe: {
    status: 'Klicken, um die Treppe zu setzen{taste}.',
    statusTaste: ' (Leertaste dreht, Taste F wechselt die Form)',
    zeichnen: 'Treppe zeichnen',
    formWechseln: 'Form wechseln ({form})',
    form: {
      gerade: 'Gerade',
      'u-podest': 'Mit Mittelpodest (180°)',
      'u-kehre': 'Kehre ohne Podest (180°)',
      'l-kehre': 'L-Treppe (90°)',
    },
  },
  potential: {
    status: 'Klicken, um ein Potential zu setzen.',
    titel: 'Potential benennen',
    name: 'Name (z. B. L1, N, PE oder frei):',
    hinweis:
      'Zwei Potentiale mit gleichem Namen gelten projektweit als verbunden. „PE“ bekommt automatisch das Schutzerde-Symbol.',
    setzen: 'Potential setzen',
  },
  zeichenflaeche: {
    keine:
      'Keine Zeichenfläche eingerichtet - erst über Blatt › Zeichenfläche einrichten… anlegen.',
    schaltplan: 'Im Schaltplan liegt die Zeichenfläche fest.',
    ziehen: 'Zeichenfläche mit gedrückter Maustaste an die gewünschte Position ziehen.',
    verschieben: 'Zeichenfläche verschieben',
  },
  zoomFenster: {
    status: 'Bereich aufziehen, der eingezoomt werden soll.',
  },
  trimmen: {
    kante:
      'Schneidkante anklicken (Linie, Polylinie, Rechteck, Polygon, Kreis, Bogen, Ellipse oder Wand).',
    keineKante: 'Dieser Objekttyp kann nicht als Schneidkante verwendet werden.',
    ziel: 'Ziel (Linie oder Wand) anklicken (angeklickte Seite wird getrimmt/verlängert). Esc wählt neue Schneidkante.',
    keinZiel: 'Keine Linie oder Wand an dieser Stelle gefunden.',
    keinSchnitt: 'Kein Schnittpunkt mit der Schneidkante gefunden.',
    wand: 'Wand trimmen/verlängern',
    linie: 'Linie trimmen/verlängern',
  },
  wand: {
    staerke: 'Wandstärke {cm} cm{taste}',
    staerkeTaste: ' (+/- ändert)',
    start: 'Startpunkt klicken. {staerke}.',
    weiter:
      'Weitere Punkte klicken, auf den Anfang oder ein Wandende klicken zum Schließen/Anschließen, Doppelklick{taste} zum Abschließen, Esc zum Abbrechen. {staerke}.',
    zeichnen: 'Wand zeichnen',
    staerkeGruppe: 'Wandstärke',
    duenner: 'Dünner',
    dicker: 'Dicker',
  },
  wandRechteck: {
    ersteEcke: 'Erste Außenecke klicken. {staerke}.',
    gegenecke: 'Gegenüberliegende Außenecke klicken, Esc zum Abbrechen. {staerke}.',
    zuKlein: 'Zu klein – das Rechteck muss größer als die doppelte Wandstärke sein.',
    zeichnen: 'Wandrechteck zeichnen',
  },
  wandTeilen: {
    ersterPunkt: 'Ersten Punkt auf einer Wand anklicken.',
    keineWand: 'Keine Wand an dieser Stelle gefunden.',
    zweiterPunkt: 'Zweiten Punkt auf derselben Wand anklicken (Esc bricht ab).',
    ungueltig:
      'Kein gültiger Teilungsabschnitt (zu kurz oder geschlossene Wand). Ersten Punkt auf einer Wand anklicken.',
    teilen: 'Wand teilen',
  },
  teilstueckZone: {
    taste: ', Enter beendet',
    anklicken: 'Teilstücke einer Leitung anklicken{taste}.',
    gewaehlt: {
      one: '{n} Teilstück gewählt – Zone in der Kontextleiste oder per Rechtsklick{taste}.',
      other: '{n} Teilstücke gewählt – Zone in der Kontextleiste oder per Rechtsklick{taste}.',
    },
  },
  switchplan: {
    status:
      'Klicken, um die obere linke Ecke des Switchplans zu setzen - den Switch danach im Eigenschaften-Panel wählen.',
    einsetzen: 'Switchplan einsetzen',
    keinGeraet:
      'Noch kein Switch in der Zeichnung platziert - der Switchplan bleibt leer, bis einer gewählt werden kann.',
    eingesetzt: 'Switchplan eingesetzt - jetzt rechts im Eigenschaften-Panel den Switch wählen.',
  },
  patchpanelplan: {
    status:
      'Klicken, um die obere linke Ecke des Patchpanelplans zu setzen - das Patchpanel danach im Eigenschaften-Panel wählen.',
    einsetzen: 'Patchpanelplan einsetzen',
    keinGeraet:
      'Noch kein Patchpanel in der Zeichnung platziert - der Patchpanelplan bleibt leer, bis eines gewählt werden kann.',
    eingesetzt:
      'Patchpanelplan eingesetzt - jetzt rechts im Eigenschaften-Panel das Patchpanel wählen.',
  },
  bemassungsreihe: {
    ersterPunkt: 'Ersten Messpunkt klicken.',
    zweiterPunkt: 'Zweiten Messpunkt klicken - legt die Messrichtung fest (Shift = Winkel fangen).',
    weitere:
      'Weitere Messpunkte klicken, Doppelklick{tasteEnter} schließt ab. Rechtsklick{tasteEntf} nimmt den letzten Punkt zurück.',
    abstand: 'Abstand der Maßlinie durch Klick festlegen.',
    ketteEinfuegen: 'Kettenbemaßung einfügen',
    parallelEinfuegen: 'Parallelbemaßung einfügen',
  },
  auswahlHinweis: {
    grund:
      'Klicken wählt · Strg+Klick erweitert · Rechteck aufziehen: Mehrfachauswahl · Ziehen verschiebt · Doppelklick bearbeitet{taste}',
    grundTaste: ' · Leertaste dreht · Entf löscht',
    leitung:
      'Leitung: Segment ziehen verlegt neu · Doppelklick fügt Wegpunkt ein · Wegpunkt anklicken + Entf entfernt ihn · Nummer ziehen verschiebt sie, Doppelklick setzt zurück',
    trunk:
      'Trunk: Segment ziehen verlegt neu · Ende ziehen verlängert, auf ein Trunk-Ende verschmilzt, auf einen Pfad zweigt ab · Doppelklick fügt Wegpunkt ein · Schild ziehen verschiebt es, mit Umschalt den Ein-/Austrittspunkt',
    wand: 'Wand: Eckpunkt ziehen · Doppelklick auf Kante fügt Punkt ein · Punkt anklicken + Entf entfernt ihn · Teilstück herausschneiden: Werkzeug „Wand teilen“',
    polylinie:
      'Polylinie: Eckpunkt ziehen · Doppelklick auf Kante fügt Punkt ein · Punkt anklicken + Entf entfernt ihn',
    bodenplatte:
      'Bodenplatte: Eckpunkt ziehen · Doppelklick auf Kante fügt Punkt ein · Punkt anklicken + Entf entfernt ihn · Stärke und Höhe im Eigenschaften-Panel',
  },
  komponente: {
    decke: 'Decke',
    boden: 'Boden',
    standard: 'Standard',
    tasteDreht: 'Leertaste dreht, ',
    knxPlatzieren: 'In die Zeichnung klicken, um den KNX-Aktor zu platzieren ({taste}Esc beendet).',
    knxPlatziert: {
      one: '{n} KNX-Aktor platziert – weiter klicken oder Esc zum Beenden.',
      other: '{n} KNX-Aktoren platziert – weiter klicken oder Esc zum Beenden.',
    },
    platzieren:
      'In die Zeichnung klicken, um die Komponente zu platzieren ({taste}Werkzeugtaste für eine andere Komponente, Esc beendet).',
    platziert: {
      one: '{n} Komponente platziert – weiter klicken, {taste}Werkzeugtaste für eine andere Komponente oder Esc zum Beenden.',
      other:
        '{n} Komponenten platziert – weiter klicken, {taste}Werkzeugtaste für eine andere Komponente oder Esc zum Beenden.',
    },
    knxZusammenstellen: 'KNX-Aktor zusammenstellen ...',
    katalogWaehlen: 'Komponente aus dem Katalog wählen ...',
    hoehe: 'Höhe',
    niedriger: 'Niedrigere Installationshöhe',
    hoeher: 'Höhere Installationshöhe',
    installationshoehe: 'Installationshöhe: {hoehe}',
    anWand: 'Komponente an die Wand setzen',
    platzierenLabel: 'Komponente platzieren',
    eingeschleift: {
      one: 'Komponente in {n} Verbindung eingeschleift – weiter klicken oder Esc zum Beenden.',
      other: 'Komponente in {n} Verbindungen eingeschleift – weiter klicken oder Esc zum Beenden.',
    },
  },
  leitung: {
    leerPort: 'Port-Stromkreis zuweisen',
    leerVerteiler: 'Im Verteiler anschließen',
    leerSchacht: 'In den Kabelschacht',
    leerZiel: 'Ziel im Bündel wählen',
    woVerbunden: 'Austrittspunkt anklicken - auch auf einem verbundenen Trunk',
    woPfad: 'Austrittspunkt auf dessen Pfad anklicken',
    imTrunk: 'Im Trunk "{name}": {wo}{taste} (Esc = Abbrechen).',
    imTrunkTaste: ' - oder Leertaste {was}',
    wasPort: 'für die Zuweisung des Port-Stromkreises',
    wasVerteiler: 'zum Anschließen im Verteiler',
    wasSchacht: 'um im Bündel in den Kabelschacht weiterzugehen',
    wasZiel: 'für das Ziel im Bündel (Switch, Patchpanel, Verteiler oder Kabelschacht)',
    zeichnen:
      'Weitere Punkte anklicken (gerade Teilstücke). Ein Ziel-Dockpunkt, ein Trunk-Pfad oder ein Kabelschacht schließt ab - dorthin verlegt el.easy.CAD ab dem letzten gesetzten Punkt automatisch{tasteStrg}. Doppelklick{tasteEnter} beendet mit freiem Ende, Rechtsklick{tasteEntf} nimmt den letzten Punkt zurück, Esc bricht ab.',
    nochKeinPunkt:
      'Noch kein Punkt gesetzt - erst einen weiteren Punkt anklicken, dann beendet Doppelklick oder Enter die Leitung mit freiem Ende.',
    zeichnenLabel: 'Leitung zeichnen',
    fuer: 'Leitung {nummer}',
    fortsetzung: 'Fortsetzung an Strang {titel}. {status}',
    start: 'Start-Dockpunkt oder freien Punkt anklicken.',
    startAmStrang: 'Start an Strang {titel}. {status}',
    austrittKette:
      'Austrittspunkt muss auf dem Pfad von "{name}" oder einem damit verbundenen Trunk liegen (Esc = Abbrechen).',
    austrittPfad: 'Austrittspunkt muss auf dem Pfad von "{name}" liegen (Esc = Abbrechen).',
    austrittGleich: 'Austrittspunkt darf nicht mit dem Eintrittspunkt zusammenfallen.',
    nichtVerbunden: '"{austritt}" ist nicht mit "{eintritt}" verbunden.',
    keinPfadTrunk: 'Kein kollisionsfreier Pfad zum Trunk gefunden - anderen Punkt wählen.',
    keinPfad: 'Kein kollisionsfreier Pfad gefunden - anderen Zielpunkt wählen.',
    ketteOhneZiel: 'An der Kette von "{name}" hängt weder ein Switch noch ein Kabelschacht.',
    keinPfadZumTrunk: 'Kein kollisionsfreier Pfad zum Trunk gefunden.',
    freiesEnde: 'Freies Ende',
    alleDockpunkte: 'Alle Dockpunkte',
    ketteOhneZielLeertaste:
      'An der Kette von "{name}" hängt weder ein Switch noch ein Verteiler oder Kabelschacht - Austrittspunkt anklicken.',
  },
  schaltverbindung: {
    mehrlinigModus: { one: 'mehrlinig, {n} Ader', other: 'mehrlinig, {n} Adern' },
    einlinigModus: 'einlinig, Polzahl {n}',
    tastenMehrlinig: ' (Zifferntasten 1-5, M einlinig, Tab Seite)',
    tastenEinlinig: ' (Zifferntasten 1-5, M mehrlinig)',
    start: 'Start-Dockpunkt, Schaltverbindung oder freien Punkt anklicken. {hinweis}.',
    weiter:
      'Klick auf freien Punkt setzt einen Stützpunkt, Klick auf einen Dockpunkt oder eine Schaltverbindung schließt ab - dorthin wird ab dem letzten Punkt automatisch verlegt{tasteStrg}. Doppelklick{tasteEnter} beendet frei. {hinweis}.',
    zeichnen: 'Schaltverbindung zeichnen',
    zeichnenAdern: {
      one: 'Schaltverbindung zeichnen ({n} Ader)',
      other: 'Schaltverbindung zeichnen ({n} Adern)',
    },
    keinWeg: 'Kein freier Weg zum Ziel gefunden - anderen Zielpunkt wählen.',
    adern: 'Adern',
    pole: 'Pole',
    mehrlinig: 'Mehrlinig',
    seiteWechseln: 'Seite wechseln',
    fertigFrei: 'Fertig (freies Ende)',
  },
  trunk: {
    nurEinEnde: 'Nur ein Ende konnte verbunden werden - der Trunk ist schon verschmolzen.',
    andererTrunk: 'dem anderen Trunk',
    verschmelzen: 'Trunks verschmelzen',
    verschmolzenMit: 'Mit "{name}" verschmolzen.',
    verschmolzen: 'Trunks verschmolzen.',
    andocken: 'Trunk andocken',
    angedocktAn: 'Als Abzweig an "{name}" angedockt.',
    angedockt: 'Trunk angedockt.',
    verbindenNicht: 'Verbinden nicht möglich.',
    anfangspunkt: 'Der Anfangspunkt',
    endpunkt: 'Der Endpunkt',
    gezogenesEnde: 'Das gezogene Ende',
    nichtVerbunden: 'Nicht verbunden.',
    zeichnenVerbinden: 'Trunk zeichnen und verbinden',
    anSchacht: 'Trunk an Kabelschacht anschließen',
    anStrang: 'An Strang {titel} angeschlossen.',
    anschlussNicht: 'Anschluss nicht möglich.',
    anfang: 'Anfangspunkt des Trunks anklicken (oder einen "T"-Dockpunkt an einem Switch).',
    weiter:
      'Weitere Punkte anklicken, Doppelklick{tasteEnter} zum Abschließen (mind. Anfang + Ende), Rechtsklick{tasteEntf} entfernt den letzten Punkt, Esc bricht ab. Anfang oder Ende auf einem anderen Trunk abgelegt verbindet beide nach Rückfrage: an dessen Ende verschmelzen sie, mitten auf dem Pfad entsteht ein Abzweig. Auf einem Kabelschacht abgelegt fragt el.easy.CAD nach dem Strang, über den es in die nächste Etage geht.',
    zeichnen: 'Trunk zeichnen',
  },
  trunkAblage: {
    verschmelzenTitel: 'Trunks verschmelzen?',
    abzweigTitel: 'Abzweig anlegen?',
    verschmelzenFrage:
      '{ende} liegt auf dem Ende von „{name}“. Beide Trunks zu einem einzigen Trunk verschmelzen? Die Leitungsnummern werden dabei neu vergeben; ein Auftrennen ist danach nicht vorgesehen.',
    abzweigFrage:
      '{ende} liegt auf dem Pfad von „{name}“. Dort als Abzweig andocken? Beide Trunks bleiben eigenständig und teilen sich nur die Leitungsnummern.',
    verschmelzen: 'Verschmelzen',
    andocken: 'Andocken',
  },
  auswahl: {
    durchlaufendNichtGeroutet: {
      one: '{n} durchlaufende Leitung konnte nicht kollisionsfrei neu geroutet werden - bitte manuell nachbearbeiten.',
      other:
        '{n} durchlaufende Leitungen konnten nicht kollisionsfrei neu geroutet werden - bitte manuell nachbearbeiten.',
    },
    angeschlossenNichtGeroutet: {
      one: '{n} angeschlossene Leitung konnte nicht kollisionsfrei neu geroutet werden - bitte manuell nachbearbeiten.',
      other:
        '{n} angeschlossene Leitungen konnten nicht kollisionsfrei neu geroutet werden - bitte manuell nachbearbeiten.',
    },
    autoAusFrage: 'Automatische Verlegung ausschalten?',
    autoAusText:
      'Leitung Nr. {nummer} wurde gerade manuell verlegt. Ohne automatische Verlegung lassen sich ihre Segmente künftig frei ziehen (keine 90°/45°-Regel, keine Hindernisvermeidung mehr) und werden nicht mehr automatisch neu geroutet, wenn eine angeschlossene Komponente verschoben wird.',
    ausschalten: 'Ausschalten',
    autoAus: 'Automatische Verlegung ausschalten',
    nummerVerschieben: 'Leitungsnummer verschieben',
    eintrittsschild: 'Eintrittsschild verschieben',
    austrittsschild: 'Austrittsschild verschieben',
    trunkBezeichnung: 'Trunk-Bezeichnung verschieben',
    raumbeschriftung: 'Raumbeschriftung verschieben',
    zielbezeichnung: 'Zielbezeichnung verschieben',
    komponentenbeschriftung: 'Komponentenbeschriftung verschieben',
    trunkEndeNicht: 'Trunk-Ende kann hier nicht abgelegt werden - kein kollisionsfreier Pfad.',
    trunkEndeVerschieben: 'Trunk-Ende verschieben',
    modulMitLeitungen:
      'Modul hat angeschlossene Leitungen/Trunks und rastet deshalb nicht auf einem Gehäuse ein – zum Aufsetzen zuerst trennen.',
    knickEinfuegen: 'Knick einfügen',
    wegpunktNicht: 'Wegpunkt kann hier nicht eingefügt werden - kein kollisionsfreier Pfad.',
    wegpunktHinzufuegen: 'Wegpunkt hinzufügen',
    punktHinzufuegen: 'Punkt hinzufügen',
    beschriftungTitel: 'Beschriftung bearbeiten',
    beschriftungLabel: 'Beschriftung (frei, z. B. Raum/Position):',
    beschriftungAendern: 'Beschriftung ändern',
    moduleMitGehaeuse:
      'Aufgesetzte Module werden mit ihrem Gehäuse gedreht/skaliert – zum eigenen Transformieren erst abziehen.',
    loslassenSchacht: 'Loslassen fragt, über welchen Strang des Kabelschachts es weitergeht.',
    loslassenVerschmelzen: 'Loslassen fragt, ob die beiden Trunks zu einem verschmolzen werden.',
    loslassenAbzweig: 'Loslassen fragt, ob der Trunk hier als Abzweig andockt.',
    nullpunktVerschieben: 'Nullpunkt verschieben',
    objekteDrehen: 'Objekt(e) drehen',
    objekteSkalieren: 'Objekt(e) skalieren',
    eintrittspunkt: 'Eintrittspunkt verschieben',
    austrittspunkt: 'Austrittspunkt verschieben',
    punktNicht: 'Punkt kann hier nicht abgelegt werden - kein kollisionsfreier Pfad.',
    trunkSegment: 'Trunk-Segment verschieben',
    leitungssegment: 'Leitungssegment verschieben',
    segmentNicht: 'Segment kann hier nicht abgelegt werden - kein kollisionsfreier Pfad.',
    verbindungsende: 'Verbindungsende ziehen',
    verbindungAendern: 'Verbindung ändern',
    autoAusVerbindung:
      'Automatisches Verlegen für diese Verbindung ausgeschaltet – im Eigenschaften-Panel wieder einschaltbar.',
    wandpunkt: 'Wandpunkt verschieben',
    plattenpunkt: 'Plattenpunkt verschieben',
    polylinienpunkt: 'Polylinienpunkt verschieben',
    positionAufWand: 'Position auf der Wand ändern',
    messpunkt: 'Messpunkt verschieben',
    masslinie: 'Maßlinie verschieben',
    nichtAngeschlossen: 'Nicht angeschlossen.',
    objekteVerschieben: 'Objekte verschieben',
    objektVerschieben: 'Objekt verschieben',
    modulAufsetzen: 'Modul aufsetzen',
    modulAbziehen: 'Modul abziehen',
    knickEntfernen: 'Knick entfernen',
    wegpunktEntfernen: 'Wegpunkt entfernen',
    wegpunktNichtEntfernt: 'Wegpunkt kann nicht entfernt werden - kein kollisionsfreier Pfad.',
    wandecke: 'Wandecke entfernen',
    eckpunktNicht:
      'Eckpunkt kann nicht entfernt werden - nur wo genau zwei Wandsegmente zusammentreffen.',
    punktEntfernen: 'Punkt entfernen',
    zuWenigePunkte: 'Punkt kann nicht entfernt werden - zu wenige Punkte blieben übrig.',
    gesperrt: 'Objekt ist auf einer gesperrten Ebene und kann nicht gelöscht werden.',
    objekteLoeschen: { one: '{n} Objekt löschen', other: '{n} Objekte löschen' },
    objektLoeschen: 'Objekt löschen',
    komponentenDrehen: 'Komponenten drehen',
    komponenteDrehen: 'Komponente drehen',
    kombinationDrehen: 'Kombination drehen',
    komponentenVerschieben: 'Komponenten verschieben',
    komponenteVerschieben: 'Komponente verschieben',
    loeschen: 'Löschen',
  },
  wirkverbindung: {
    quelle: 'Bediengerät, Systemgerät oder Sensor als Quelle anklicken (Esc = Abbrechen).',
    sammeln: {
      one: '{n} Ziel markiert - weiteres Ziel anklicken (erneuter Klick entfernt es wieder, Ziele auf anderen Etagen: Blatt wechseln), Rechtsklick{taste} = Abschließen (Esc = Abbrechen).',
      other:
        '{n} Ziele markiert - weiteres Ziel anklicken (erneuter Klick entfernt es wieder, Ziele auf anderen Etagen: Blatt wechseln), Rechtsklick{taste} = Abschließen (Esc = Abbrechen).',
    },
    typOhneSlots: 'Diese Komponente kann keine Quelle sein (Typ „{typ}“ hat keine eigenen Slots).',
    ohneTyp: 'Diese Komponente kann keine Quelle sein (ohne Gerätetyp gibt es keine Slots).',
    keineSlots: 'Diese Komponente hat noch keine Slots (im Eigenschaften-Panel anlegen).',
    slotWaehlen: 'Slot wählen...',
    kreislauf: 'Nicht möglich: Das würde einen Kreislauf zwischen Slots erzeugen.',
    unueblich: 'Ziel hinzugefügt (unübliche Kombination: {quelle} → {ziel}). {status}',
    quellHinweis: 'Quelle: {blatt} · {komponente}',
  },
  commands: {
    blattAnlegen: 'Blatt "{name}" anlegen',
    blattLoeschen: 'Blatt "{name}" löschen',
    blattVerschieben: 'Blatt "{name}" verschieben',
    umwandeln: 'Hintergrund in Zeichnungselemente umwandeln',
    umwandelnBlaetter: {
      one: 'Hintergrund in Zeichnungselemente umwandeln ({n} Blatt)',
      other: 'Hintergrund in Zeichnungselemente umwandeln ({n} Blätter)',
    },
    umgewandeltErsetzen: 'Umgewandelte Linien ersetzen',
    symbolgroesse: 'Symbolgröße an der Wand ändern',
    ebeneLoeschen: 'Ebene löschen',
    typAendern: 'Typ ändern',
    slotsAendern: 'Slots ändern',
    slotMatrixAendern: 'Slot-Matrix ändern',
    ansteuerungAendern: 'Ansteuerung ändern',
    knxAendern: 'KNX ändern',
    gruppeErstellen: 'Gerätegruppe erstellen',
    gruppeBeitreten: 'Gerätegruppe beitreten',
    gruppeVerlassen: 'Gerätegruppe verlassen',
    gruppeLoeschen: 'Gerätegruppe löschen',
    gruppeAusAuswahl: 'Gerätegruppe aus Auswahl bilden',
    gruppeUndWirkverbindung: 'Gruppe und Wirkverbindung anlegen',
    klemmenleisteNummerieren: 'Klemmenleiste neu nummerieren',
    knxAktorAendern: 'KNX-Aktor ändern',
    nurInBauteilenAn: 'Leitungen nur in Wand, Decke oder Boden',
    nurInBauteilenAus: 'Leitungen wieder frei verlegen',
    raumquerung: 'Raumquerung ändern',
    nurInBauteilenLeitungen: 'Nur in Wand, Decke oder Boden ändern ({n} Leitungen)',
    nurInBauteilenLeitung: 'Nur in Wand, Decke oder Boden ändern',
    neuVerlegen: 'Leitungen neu verlegen',
    reihenfolge: 'Reihenfolge ändern',
    interneVerbindung: 'Interne Verbindung erzeugen',
    trunkMitSichSelbst: 'Ein Trunk kann nicht mit sich selbst verschmolzen werden.',
    trunkAnSichSelbst: 'Ein Trunk kann nicht an sich selbst andocken.',
    trunksSelbeGruppe: 'Die beiden Trunks gehören bereits zur selben Gruppe.',
  },
  katalogStand: {
    uebernehmen: 'Katalogstand übernehmen',
  },
  wandfang: {
    loesen: 'Komponente von der Wand lösen',
  },
  verdrahtung: {
    verlegen: 'Verbindungen verlegen',
  },
  trunkAusfuehrung: {
    kanal: 'Kabelkanal',
    trasse: 'Kabeltrasse',
    rohr: 'Leerrohr',
    buendel: 'Bündel',
    titel: 'Unterschiedliche Ausführung',
    frage:
      '„{nameA}“ ist {ausfuehrungA}, „{nameB}“ {ausfuehrungB}. Die Ausführung gilt für die ganze Kette – welche soll nach dem Verbinden gelten?',
  },
  trunkLoeschen: {
    einTrunk: 'diesen Trunk',
    mehrereTrunks: 'diese {n} Trunks',
    anzahlLeitungen: { one: 'läuft {n} Leitung', other: 'laufen {n} Leitungen' },
    leitungen:
      'Durch {trunks} {leitungen}. Sie werden mitgelöscht – samt ihrer Zuweisung an Switch- bzw. Patchpanel-Ports und ihrer Verbindung zu den Komponenten. Verkettete Trunks und Abzweige bleiben erhalten.',
    einSchacht: 'diesem Kabelschacht',
    mehrereSchaechte: 'diesen {n} Kabelschächten',
    anzahlAnschluesse: { one: 'hängt {n} Anschluss', other: 'hängen {n} Anschlüsse' },
    anschluesse:
      'An {schaechte} {anschluesse}. Die betroffenen Enden verlieren ihre Verbindung in die anderen Etagen; die Durchbrüche des Verbunds auf anderen Blättern bleiben stehen.',
    schachtTitel: { one: 'Kabelschacht löschen?', other: 'Kabelschächte löschen?' },
    trunkTitel: { one: 'Trunk löschen?', other: 'Trunks löschen?' },
  },
  anordnen: {
    oben: 'Oben',
    unten: 'Unten',
    links: 'Links',
    rechts: 'Rechts',
    horizontal: 'Horizontal zentrieren',
    vertikal: 'Vertikal zentrieren',
    automatisch: 'Automatisch anordnen',
    neuVerlegen: 'Verbindungen neu verlegen',
  },
}
