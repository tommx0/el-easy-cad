import type { Texte } from '../texte'

export const beschriftung: Texte['beschriftung'] = {
  komponente: {
    hoehe: 'h= {cm} cm',
    decke: 'Ceiling',
    boden: 'Floor',
    aufputz: 'SM',
    unterputz: 'FM',
    poe: 'PoE {watt} W',
  },
  treppe: {
    stufen: { one: '{n} step', other: '{n} steps' },
    formGerade: 'Straight',
    formUPodest: 'With half landing (180°)',
    formUKehre: 'Winder without landing (180°)',
    formLKehre: 'L-shaped stairs (90°)',
  },
  raum: {
    vorgabeName: 'Room',
  },
  raumart: {
    kueche: 'Kitchen',
    bad: 'Bathroom',
    wc: 'WC',
    kind: "Children's room",
    schlafen: 'Bedroom',
    arbeiten: 'Office',
    wohnen: 'Living room',
    essen: 'Dining room',
    hauswirtschaft: 'Utility room',
    hobby: 'Hobby room',
    flur: 'Hall',
    freisitz: 'Terrace',
    abstell: 'Storage room',
    keller: 'Cellar',
    sonstige: 'Other room',
  },
  knxAktor: {
    fortsetzung: '{titel} (continued)',
  },
  kabelschacht: {
    vorgabeName: 'Shaft {nr}',
    kabelschacht: 'Cable riser',
    offenesEnde: 'open end',
    komponente: 'Component',
  },
  leitungsende: {
    port: '{komponente} (Port {nr})',
    anschluss: 'Terminal {anschluss}',
  },
  querverweis: {
    blatt: 'Sheet {name}',
  },
  klemmen: {
    vergeben: '{nummer} is already in use ({blatt}).',
  },
  stromkreis: {
    nummer: 'Number {nr}',
    raum: 'Room circuit',
    eigen: 'own circuit',
    kein: 'none',
  },
  leiterfarben: {
    schwarz: 'black',
    braun: 'brown',
    grau: 'grey',
    blau: 'blue',
    gruenGelb: 'green-yellow',
  },
  trunk: {
    vorgabeName: 'Trunk{nr}',
  },
  verteiler: {
    mitAder: '{basis} (core {ader})',
  },
}
