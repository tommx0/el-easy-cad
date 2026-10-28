export const plan = {
  vorgabe: {
    zeichnung: 'Neue Zeichnung',
    blatt: 'Blatt {nr}',
    trunk: 'Trunk{nr}',
    ebene: {
      hintergrund: 'Hintergrund',
      bauelemente: 'Bauelemente',
      raeume: 'Räume',
      komponenten: 'Komponenten',
      leitungen: 'Leitungen',
      bemassung: 'Bemaßung',
      grundriss: 'Grundriss (übernommen)',
    },
  },
  muster: {
    zeichnung: 'Einfamilienhaus',
    blatt: { kg: 'KG', eg: 'EG', og: 'OG' },
    geschoss: { kg: 'Kellergeschoss', eg: 'Erdgeschoss', og: 'Obergeschoss' },
    raum: {
      technik: 'Technik',
      waschen: 'Waschen / Trocknen',
      vorrat: 'Vorrat',
      diele: 'Diele',
      speisekammer: 'Speisekammer',
      wohnenEssen: 'Wohnen / Essen',
      gast: 'Gast',
      eltern: 'Eltern',
      kind1: 'Kind 1',
      kind2: 'Kind 2',
    },
    schacht: 'Steigschacht',
    trunk: { steig: 'Steigstrang', keller: 'KG' },
    trunkBeschreibung: { steig: 'UV1 – EG/OG', keller: 'UV1 – Keller' },
    leitung: { licht: 'Licht {raum}', steckdosen: 'Steckdosen {raum}' },
    projekt: {
      kunde: 'Muster',
      bauplan: 'Einfamilienhaus – Bauplan',
      elektro: 'Einfamilienhaus – Elektro',
      dokumentBauplan: 'Bauplan',
      dokumentElektro: 'Elektroplanung',
      notizBauplan:
        'Musterprojekt: Einfamilienhaus mit Keller, Erdgeschoss und Obergeschoss, Außenmaß 12,00 × 9,00 m. Wände, Türen, Fenster, Räume, Treppen und Steigschacht sind gezeichnet, die Elektroplanung ist offen.',
      notizElektro:
        'Musterprojekt: dasselbe Einfamilienhaus mit platzierten Komponenten – Unterverteilung UV1 im Keller, je Raum Deckenleuchte und Schalter an der Tür, Steckdosen, Daten- und TV-Dosen. Leitungen und Trunks sind noch nicht verlegt.',
    },
  },
}
