export const generatoren = {
  ersatz: {
    komponente: 'Komponente',
    komponenteGeloescht: 'Komponente (gelöscht)',
    geraetegruppe: 'Gerätegruppe',
    geraetegruppeGeloescht: 'Gerätegruppe (gelöscht)',
    raum: 'Raum',
    slot: 'Slot {nr}',
  },
  pruefhinweis:
    'Vorschlag zur Struktur, keine normgerechte Auslegung. Schutzorgane, Bemessung und ' +
    'RCD-Aufteilung prüft die Elektrofachkraft.',
  verteilerplan: {
    passtNichtZumNetz: '-{kennzeichen} ({name}) passt nicht zum Wechselstromnetz.',
    katalogeintragFehlt: '{kennzeichen}: Katalogeintrag fehlt, nicht übernommen.',
    klemmenOhneSchutz: {
      one: '{n} Klemme ohne Schutzorgan – Spalte am Ende.',
      other: '{n} Klemmen ohne Schutzorgan – Spalten am Ende.',
    },
    kontaktblock1sFehlt: 'Kontaktsymbol „Kontaktblock 1S“ fehlt im Katalog – Kanäle nur am Gerät.',
    kontaktblock2sFehlt:
      'Kontaktsymbol „Kontaktblock 2S“ fehlt im Katalog – Jalousiepaare nur mit Auf.',
    triacFehlt: 'Symbol „Triac (Dimmkanal)“ fehlt im Katalog – Dimmkanäle als Kontakt.',
    breiterAlsBlatt: '{name} ist breiter als ein Blatt.',
    eineSpalte: 'Eine Spalte',
    unterRand: '{blatt}: reicht über den unteren Rand der Zeichenfläche.',
    einspeiseklemmeFehlt:
      'Einspeiseklemme (Abgangsklemme) fehlt im Katalog – Einspeisung ohne Klemme.',
    einspeiseklemmeErgaenzt:
      'Einspeiseklemme {kennzeichen} ergänzt – sie steht nicht in der Bestückung.',
    einspeisungFehlt: 'Einspeisung: nicht im Katalog, deshalb weggelassen – {liste}.',
    einspeisungErgaenzt: 'Einspeisung {liste} ergänzt – sie steht nicht in der Bestückung.',
    einspeisekette: '{blatt}: Einspeisekette reicht bis an den Bus.',
    nichtAngeschlossen:
      '-{kennzeichen}: {liste} nicht angeschlossen – keine Leitung auf dieser Höhe.',
  },
  assistent: {
    art: {
      HV: 'Hauptverteilung',
      UV: 'Unterverteilung',
    },
    verteilung: 'Verteilung',
    verwendung: {
      allgemein: 'Allgemein',
      kueche: 'Küche',
      garage: 'Garage/Wallbox',
      photovoltaik: 'Photovoltaik',
      heizung: 'Heizung/Wärmepumpe',
      werkstatt: 'Werkstatt',
      aussenanlage: 'Außenanlage',
      aufzug: 'Aufzug',
    },
  },
  vorschlag: {
    ohneRaum: 'ohne Raum',
    blattOhneRaum: '{blatt} ohne Raum',
    knxGruppeMehrereKreise:
      'KNX-Gruppe „{gruppe}“ liegt in mehreren Stromkreisen – Kanal hinter „{kreis}“',
    dreiphasigImWechselstrom: '{kreis}: 3~ im Wechselstromnetz – als 1~ angelegt',
  },
  knxAktor: {
    titelDimm: 'Dimmaktor {n}fach',
    titelSchaltJalousie: 'Schalt-/Jalousieaktor {n}fach',
    titelSchalt: 'Schaltaktor {n}fach',
    stueckliste: 'KNX {titel}',
    funktion: {
      schalten: 'Schalten',
      treppenlicht: 'Treppenlicht',
      zeitschalten: 'Zeitschalten',
      heizen: 'Heizen',
      jalousie: 'Jalousie',
      rollladen: 'Rollladen',
      dimmen: 'Dimmen',
      frei: 'frei',
    },
    auf: 'Auf',
    ab: 'Ab',
  },
  knxZuordnung: {
    verschiedeneAnsteuerungen: 'verschiedene Ansteuerungen ({liste}) – {vorschlag} angenommen',
    nichtUeberAktor: '{name}: {ansteuerung} – nicht über Schalt- oder Dimmaktor',
    verbraucherOhneKnx: 'versorgt auch Verbraucher ohne KNX-Ziel ({liste})',
    keinSchutzorgan: 'kein Schutzorgan – erst einen LS davorsetzen',
    klemmeGetauscht: '1P+N+PE wird gegen 3P+N+PE getauscht (L1 Auf, L2 Ab)',
    keineZweiAussenleiter: 'Klemme hat keine zwei Außenleiter',
    kanalFehlt: {
      one: 'Für {n} Klemme fehlt ein freier Kanal – Aktoren im Verteilerplan ergänzen.',
      other: 'Für {n} Klemmen fehlt ein freier Kanal – Aktoren im Verteilerplan ergänzen.',
    },
  },
  gruppe: {
    licht: 'Licht {raum}',
    rollo: 'Rollo {raum}',
  },
  leitungsVerknuepfung: {
    verschiedeneGruppen:
      '{a} und {b} stehen schon in verschiedenen Gruppen („{gruppeA}“, „{gruppeB}“) – keine Gruppe angelegt.',
  },
  bestueckung: {
    keineKlemme: '„{eingabe}“ ist keine Klemme – z. B. „X2“ oder „X1:7“.',
    keineKlemmenleiste: '{leiste} ist keine Klemmenleiste (X…).',
    nummerAbEins: 'Klemmennummern beginnen bei 1.',
    vergeben: '{klemme} ist schon vergeben.',
  },
  etage: {
    eg: 'EG',
    og: '{nr}. OG',
    ug: 'UG',
    ugNummer: '{nr}. UG',
    darueber: '{name} darüber',
    darunter: '{name} darunter',
    neu: '{name} (neu)',
    neuNummer: '{name} (neu {nr})',
  },
  installationszonen: {
    neu: 'Neue Zone',
    kopie: '{name} (Kopie)',
  },
}
