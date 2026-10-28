import type {
  Blatt,
  BlattGeschoss,
  BemassungsreiheObjekt,
  BodenplattenObjekt,
  KabelschachtObjekt,
  FensterObjekt,
  Point,
  RaumObjekt,
  RaumartId,
  TreppenObjekt,
  TuerObjekt,
  WanddurchbruchObjekt,
  WandObjekt,
  Zeichnung,
} from '../../document-model'
import {
  berechneZeichenflaecheFuerPlan,
  DocumentStore,
  ebeneFuerNeuesObjekt,
  erzeugeId,
  erzeugeBlatt,
  erzeugeZeichnung,
  ermittleOeffnungsGeometrie,
  ermittleRaumGeometrie,
  neueObjektBasis,
  raumartName,
  standardLFormMasse,
  STANDARD_BODENPLATTE_LINIENTYP,
  STANDARD_RAUM_SCHRIFTGROESSE,
  STANDARD_STAFFELABSTAND,
  STANDARD_WAND_FUELL_FARBE,
  uebernimmEbenen,
  zeichnungsEbenen,
  zerlegeWandInSegmente,
} from '../../document-model'
import type { Sprache, Texte } from '../../sprache'
import { erzeugeUebersetzer, QUELLSPRACHE } from '../../sprache'
import type { Command } from '../command'
import { CommandStack } from '../command'
import {
  erzeugeObjektAendernCommand,
  erzeugeObjektHinzufuegenCommand,
} from '../commands/objekt-commands'

const BREITE = 12
const TIEFE = 9
const MITTE_Y = 4.6

const AUSSEN = 0.365
const AUSSEN_KELLER = 0.3
const TRAGEND = 0.24
const LEICHT = 0.115
const KELLER_INNEN = 0.175

type Himmelsrichtung = 'N' | 'O' | 'S' | 'W'

const RICHTUNG: Record<Himmelsrichtung, Point> = {
  N: { x: 0, y: 1 },
  O: { x: 1, y: 0 },
  S: { x: 0, y: -1 },
  W: { x: -1, y: 0 },
}

type Oeffnung =
  | {
      art: 'tuer'
      bei: [number, number]
      breite: number
      hoehe?: number
      schwenk: Himmelsrichtung
      anschlag: Himmelsrichtung
    }
  | {
      art: 'fenster'
      bei: [number, number]
      breite: number
      hoehe?: number
      bruestung?: number
    }
  | { art: 'durchbruch'; bei: [number, number]; breite: number }

type MusterGeschoss = 'kg' | 'eg' | 'og'
type MusterRaum = keyof Texte['plan']['muster']['raum']

interface Geschoss {
  ebene: MusterGeschoss
  geschoss: Omit<BlattGeschoss, 'name'>
  aussen: number
  innen: { punkte: [number, number][]; staerke: number }[]
  oeffnungen: Oeffnung[]
  raeume: { bei: [number, number]; raumart: RaumartId; name?: MusterRaum }[]
  treppe?: { ursprung: [number, number]; laenge: number; stufen: number }
  bodenplatte?: { staerke: number }
}

const TREPPEN_BREITE = 1.1

const SCHACHT = { ursprung: { x: 9.5, y: 4.73 }, breite: 0.6, hoehe: 0.4 }

const nordInnen = (aussen: number) => TIEFE - aussen

const achse = (aussen: number) => ({
  w: aussen / 2,
  o: BREITE - aussen / 2,
  s: aussen / 2,
  n: TIEFE - aussen / 2,
})

const KG = achse(AUSSEN_KELLER)
const EG = achse(AUSSEN)

const kellerfenster = (bei: [number, number], breite = 0.8): Oeffnung => ({
  art: 'fenster',
  bei,
  breite,
  hoehe: 0.6,
  bruestung: 1.5,
})

const KELLERGESCHOSS: Geschoss = {
  ebene: 'kg',
  geschoss: {
    kote: -2.55,
    raumhoehe: 2.3,
    deckenstaerke: 0.25,
    installationszone: 'unten',
  },
  aussen: AUSSEN_KELLER,
  innen: [
    {
      punkte: [
        [KG.w, MITTE_Y],
        [KG.o, MITTE_Y],
      ],
      staerke: TRAGEND,
    },
    {
      punkte: [
        [3.3, MITTE_Y],
        [3.3, KG.n],
      ],
      staerke: KELLER_INNEN,
    },
    {
      punkte: [
        [9.4, MITTE_Y],
        [9.4, KG.n],
      ],
      staerke: KELLER_INNEN,
    },
    {
      punkte: [
        [5.5, KG.s],
        [5.5, MITTE_Y],
      ],
      staerke: KELLER_INNEN,
    },
    {
      punkte: [
        [8.4, KG.s],
        [8.4, MITTE_Y],
      ],
      staerke: KELLER_INNEN,
    },
  ],
  oeffnungen: [
    { art: 'tuer', bei: [3.3, 6.0], breite: 0.885, schwenk: 'W', anschlag: 'S' },
    { art: 'tuer', bei: [9.4, 6.0], breite: 0.885, schwenk: 'O', anschlag: 'S' },
    { art: 'tuer', bei: [4.4, MITTE_Y], breite: 0.885, schwenk: 'S', anschlag: 'W' },
    { art: 'tuer', bei: [6.9, MITTE_Y], breite: 0.885, schwenk: 'S', anschlag: 'O' },
    { art: 'tuer', bei: [8.9, MITTE_Y], breite: 0.76, schwenk: 'S', anschlag: 'W' },
    kellerfenster([1.6, KG.s], 1.01),
    kellerfenster([4.0, KG.s], 1.01),
    kellerfenster([6.95, KG.s]),
    kellerfenster([10.1, KG.s]),
    kellerfenster([KG.w, 6.7]),
    kellerfenster([KG.o, 6.7]),
  ],
  raeume: [
    { bei: [1.7, 6.7], raumart: 'keller' },
    { bei: [6.4, 6.4], raumart: 'flur' },
    { bei: [10.6, 6.7], raumart: 'sonstige', name: 'technik' },
    { bei: [2.8, 2.4], raumart: 'hobby' },
    { bei: [6.95, 2.4], raumart: 'hauswirtschaft', name: 'waschen' },
    { bei: [10.1, 2.4], raumart: 'abstell', name: 'vorrat' },
  ],
  treppe: { ursprung: [5.75, nordInnen(AUSSEN_KELLER) - TREPPEN_BREITE], laenge: 3.5, stufen: 14 },
  bodenplatte: { staerke: 0.3 },
}

const ERDGESCHOSS: Geschoss = {
  ebene: 'eg',
  geschoss: {
    kote: 0,
    raumhoehe: 2.5,
    deckenstaerke: 0.25,
    installationszone: 'unten',
  },
  aussen: AUSSEN,
  innen: [
    {
      punkte: [
        [EG.w, MITTE_Y],
        [EG.o, MITTE_Y],
      ],
      staerke: TRAGEND,
    },
    {
      punkte: [
        [3.3, MITTE_Y],
        [3.3, EG.n],
      ],
      staerke: LEICHT,
    },
    {
      punkte: [
        [9.4, MITTE_Y],
        [9.4, EG.n],
      ],
      staerke: LEICHT,
    },
    {
      punkte: [
        [9.4, 6.1],
        [EG.o, 6.1],
      ],
      staerke: LEICHT,
    },
    {
      punkte: [
        [8.0, EG.s],
        [8.0, MITTE_Y],
      ],
      staerke: LEICHT,
    },
  ],
  oeffnungen: [
    { art: 'tuer', bei: [4.4, EG.n], breite: 1.1, hoehe: 2.135, schwenk: 'S', anschlag: 'W' },
    { art: 'fenster', bei: [1.8, EG.n], breite: 1.01 },
    { art: 'fenster', bei: [7.4, EG.n], breite: 1.26, hoehe: 0.76, bruestung: 1.4 },
    { art: 'fenster', bei: [10.55, EG.n], breite: 0.76, hoehe: 0.76, bruestung: 1.4 },
    { art: 'fenster', bei: [2.2, EG.s], breite: 2.01, hoehe: 2.16, bruestung: 0 },
    { art: 'fenster', bei: [5.8, EG.s], breite: 2.01, hoehe: 2.16, bruestung: 0 },
    { art: 'fenster', bei: [9.85, EG.s], breite: 1.26, hoehe: 1.11, bruestung: 1.05 },
    { art: 'fenster', bei: [EG.w, 2.4], breite: 1.51 },
    { art: 'fenster', bei: [EG.w, 6.7], breite: 1.26 },
    { art: 'fenster', bei: [EG.o, 2.4], breite: 1.26, hoehe: 1.11, bruestung: 1.05 },
    { art: 'tuer', bei: [3.3, 6.0], breite: 0.885, schwenk: 'W', anschlag: 'S' },
    { art: 'tuer', bei: [3.95, MITTE_Y], breite: 1.01, schwenk: 'S', anschlag: 'W' },
    { art: 'tuer', bei: [8.75, MITTE_Y], breite: 0.885, schwenk: 'S', anschlag: 'O' },
    { art: 'tuer', bei: [9.4, 6.8], breite: 0.76, schwenk: 'O', anschlag: 'S' },
    { art: 'tuer', bei: [10.55, MITTE_Y], breite: 0.76, schwenk: 'N', anschlag: 'O' },
    { art: 'durchbruch', bei: [8.0, 2.4], breite: 1.6 },
  ],
  raeume: [
    { bei: [1.8, 6.7], raumart: 'arbeiten' },
    { bei: [6.4, 6.4], raumart: 'flur', name: 'diele' },
    { bei: [10.55, 5.4], raumart: 'abstell', name: 'speisekammer' },
    { bei: [10.55, 7.4], raumart: 'wc' },
    { bei: [4.1, 2.4], raumart: 'wohnen', name: 'wohnenEssen' },
    { bei: [9.85, 2.4], raumart: 'kueche' },
  ],
  treppe: { ursprung: [5.5, nordInnen(AUSSEN) - TREPPEN_BREITE], laenge: 3.75, stufen: 15 },
}

const OBERGESCHOSS: Geschoss = {
  ebene: 'og',
  geschoss: {
    kote: 2.75,
    raumhoehe: 2.5,
    deckenstaerke: 0.25,
    installationszone: 'unten',
  },
  aussen: AUSSEN,
  innen: [
    {
      punkte: [
        [EG.w, MITTE_Y],
        [EG.o, MITTE_Y],
      ],
      staerke: TRAGEND,
    },
    {
      punkte: [
        [4.0, MITTE_Y],
        [4.0, EG.n],
      ],
      staerke: LEICHT,
    },
    {
      punkte: [
        [9.4, MITTE_Y],
        [9.4, EG.n],
      ],
      staerke: LEICHT,
    },
    {
      punkte: [
        [5.2, EG.s],
        [5.2, MITTE_Y],
      ],
      staerke: LEICHT,
    },
    {
      punkte: [
        [8.2, EG.s],
        [8.2, MITTE_Y],
      ],
      staerke: LEICHT,
    },
    {
      punkte: [
        [4.0, 6.85],
        [5.4, 6.85],
        [5.4, EG.n],
      ],
      staerke: LEICHT,
    },
  ],
  oeffnungen: [
    { art: 'fenster', bei: [2.2, EG.s], breite: 1.51 },
    { art: 'fenster', bei: [6.7, EG.s], breite: 1.26 },
    { art: 'fenster', bei: [9.85, EG.s], breite: 1.26 },
    { art: 'fenster', bei: [EG.w, 2.4], breite: 1.01 },
    { art: 'fenster', bei: [EG.w, 6.7], breite: 1.26 },
    { art: 'fenster', bei: [1.8, EG.n], breite: 1.01 },
    { art: 'fenster', bei: [7.4, EG.n], breite: 1.26, hoehe: 1.26, bruestung: 1.0 },
    { art: 'fenster', bei: [10.55, EG.n], breite: 0.885, hoehe: 0.91, bruestung: 1.25 },
    { art: 'fenster', bei: [EG.o, 2.4], breite: 1.26 },
    { art: 'fenster', bei: [EG.o, 6.7], breite: 0.885, hoehe: 0.91, bruestung: 1.25 },
    { art: 'tuer', bei: [4.0, 5.6], breite: 0.885, schwenk: 'W', anschlag: 'S' },
    { art: 'tuer', bei: [4.7, 6.85], breite: 0.76, schwenk: 'N', anschlag: 'W' },
    { art: 'tuer', bei: [9.4, 5.8], breite: 0.885, schwenk: 'O', anschlag: 'S' },
    { art: 'tuer', bei: [4.6, MITTE_Y], breite: 0.885, schwenk: 'S', anschlag: 'O' },
    { art: 'tuer', bei: [6.4, MITTE_Y], breite: 0.885, schwenk: 'S', anschlag: 'W' },
    { art: 'tuer', bei: [8.8, MITTE_Y], breite: 0.885, schwenk: 'S', anschlag: 'W' },
  ],
  raeume: [
    { bei: [2.0, 6.7], raumart: 'schlafen', name: 'gast' },
    { bei: [7.0, 6.0], raumart: 'flur' },
    { bei: [4.7, 7.8], raumart: 'abstell' },
    { bei: [10.55, 6.7], raumart: 'bad' },
    { bei: [2.7, 2.4], raumart: 'schlafen', name: 'eltern' },
    { bei: [6.7, 2.4], raumart: 'kind', name: 'kind1' },
    { bei: [9.95, 2.4], raumart: 'kind', name: 'kind2' },
  ],
}

export const EINFAMILIENHAUS_GESCHOSSE: readonly Geschoss[] = [
  KELLERGESCHOSS,
  ERDGESCHOSS,
  OBERGESCHOSS,
]

const LABEL = 'Beispielprojekt'

const BLATTRAND = 2.2

export function erzeugeEinfamilienhaus(plansprache: Sprache = QUELLSPRACHE): Zeichnung {
  const tp = erzeugeUebersetzer(plansprache)
  const zeichnung = erzeugeZeichnung(
    tp('plan.muster.zeichnung'),
    'bauplan',
    plansprache === QUELLSPRACHE ? undefined : plansprache,
  )
  const zeichenflaeche = berechneZeichenflaecheFuerPlan(
    { min: { x: -BLATTRAND, y: -BLATTRAND }, max: { x: BREITE + 1, y: TIEFE + 1 } },
    { papierformat: 'A3' },
  )
  const blaetter: Blatt[] = []
  for (const g of EINFAMILIENHAUS_GESCHOSSE) {
    const neu = erzeugeBlatt(tp(`plan.muster.blatt.${g.ebene}`), 'bauplan', tp)
    const blatt = blaetter.length > 0 ? uebernimmEbenen(neu, zeichnungsEbenen(blaetter)) : neu
    blaetter.push({
      ...blatt,
      geschoss: { name: tp(`plan.muster.geschoss.${g.ebene}`), ...g.geschoss },
      zeichenflaeche: { ...zeichenflaeche },
    })
  }
  zeichnung.blaetter = blaetter
  zeichnung.aktivesBlattId = blaetter[1].id

  const schachtVerbund = erzeugeId('verbund')
  const doc = new DocumentStore(zeichnung)
  const commands = new CommandStack()
  const ausfuehren = (command: Command) => {
    if (!commands.execute(command)) throw new Error('Aenderung abgewiesen')
  }

  EINFAMILIENHAUS_GESCHOSSE.forEach((g, i) => {
    const blattId = blaetter[i].id
    const blatt = () => doc.getBlatt(blattId)!
    const ebene = (typ: Parameters<typeof ebeneFuerNeuesObjekt>[0]) =>
      ebeneFuerNeuesObjekt(typ, blatt().ebenen, blatt().aktiveEbeneId)

    const wandzug = (punkte: Point[], staerke: number) => {
      const wand: WandObjekt = {
        ...neueObjektBasis(ebene('wand')),
        type: 'wand',
        punkte,
        staerke,
        fuellung: { art: 'farbe', farbe: STANDARD_WAND_FUELL_FARBE, deckkraft: 1 },
      }
      const segmente = zerlegeWandInSegmente(wand)
      ausfuehren(erzeugeObjektAendernCommand(doc, blattId, LABEL, (o) => [...o, ...segmente]))
    }
    const a = achse(g.aussen)
    wandzug(
      [
        { x: a.w, y: a.s },
        { x: a.o, y: a.s },
        { x: a.o, y: a.n },
        { x: a.w, y: a.n },
        { x: a.w, y: a.s },
      ],
      g.aussen,
    )
    for (const w of g.innen)
      wandzug(
        w.punkte.map(([x, y]) => ({ x, y })),
        w.staerke,
      )

    for (const o of g.oeffnungen) {
      ausfuehren(erzeugeObjektHinzufuegenCommand(doc, blattId, oeffnung(blatt(), o), LABEL))
    }

    for (const r of g.raeume) {
      const punkt = { x: r.bei[0], y: r.bei[1] }
      const geometrie = ermittleRaumGeometrie(blatt().objekte, punkt)
      if (!geometrie) throw new Error(`${g.ebene}: Raum bei ${r.bei.join('/')} nicht umschlossen`)
      const raum: RaumObjekt = {
        ...neueObjektBasis(ebene('raum')),
        type: 'raum',
        punktImRaum: punkt,
        name: r.name ? tp(`plan.muster.raum.${r.name}`) : raumartName(r.raumart, tp),
        raumart: r.raumart,
        schriftgroesse: STANDARD_RAUM_SCHRIFTGROESSE,
        gueltig: true,
        fuellung: null,
        ...geometrie,
      }
      ausfuehren(erzeugeObjektHinzufuegenCommand(doc, blattId, raum, LABEL))
    }

    if (g.treppe) {
      const { ursprung, laenge, stufen } = g.treppe
      const treppe: TreppenObjekt = {
        ...neueObjektBasis(ebene('treppe')),
        type: 'treppe',
        form: 'gerade',
        ursprung: { x: ursprung[0], y: ursprung[1] },
        breite: laenge,
        hoehe: TREPPEN_BREITE,
        drehung: 0,
        stufenanzahl: stufen,
        laufrichtungGespiegelt: false,
        beschriftungSichtbar: true,
        lFormSpiegelHorizontal: false,
        lFormSpiegelVertikal: false,
        ...standardLFormMasse(laenge, TREPPEN_BREITE),
      }
      ausfuehren(erzeugeObjektHinzufuegenCommand(doc, blattId, treppe, LABEL))
    }

    const schacht: KabelschachtObjekt = {
      ...neueObjektBasis(ebene('kabelschacht')),
      type: 'kabelschacht',
      verbundId: schachtVerbund,
      name: tp('plan.muster.schacht'),
      ursprung: { ...SCHACHT.ursprung },
      breite: SCHACHT.breite,
      hoehe: SCHACHT.hoehe,
      drehung: 0,
      geschosshoehe: g.geschoss.raumhoehe! + g.geschoss.deckenstaerke!,
    }
    ausfuehren(erzeugeObjektHinzufuegenCommand(doc, blattId, schacht, LABEL))

    if (g.bodenplatte) {
      const platte: BodenplattenObjekt = {
        ...neueObjektBasis(ebene('bodenplatte'), { linientyp: STANDARD_BODENPLATTE_LINIENTYP }),
        type: 'bodenplatte',
        punkte: [
          { x: 0, y: 0 },
          { x: BREITE, y: 0 },
          { x: BREITE, y: TIEFE },
          { x: 0, y: TIEFE },
        ],
        staerke: g.bodenplatte.staerke,
        oberkante: 0,
        fuellung: null,
      }
      ausfuehren(erzeugeObjektHinzufuegenCommand(doc, blattId, platte, LABEL))
    }

    for (const kette of aussenbemassung(g, ebene('bemassungsreihe'))) {
      ausfuehren(erzeugeObjektHinzufuegenCommand(doc, blattId, kette, LABEL))
    }
  })

  return doc.getZeichnung()
}

function wandBei(blatt: Blatt, p: Point): { wand: WandObjekt; abstand: number; laenge: number } {
  for (const o of blatt.objekte) {
    if (o.type !== 'wand') continue
    const [a, b] = o.punkte
    const laenge = Math.hypot(b.x - a.x, b.y - a.y)
    const abstand = Math.hypot(p.x - a.x, p.y - a.y)
    const quer = Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / laenge
    if (quer < 1e-6 && abstand <= laenge + 1e-6 && Math.hypot(p.x - b.x, p.y - b.y) <= laenge)
      return { wand: o, abstand, laenge }
  }
  throw new Error(`${blatt.name}: keine Wand bei ${p.x}/${p.y}`)
}

function oeffnung(blatt: Blatt, o: Oeffnung): TuerObjekt | FensterObjekt | WanddurchbruchObjekt {
  const { wand, abstand, laenge } = wandBei(blatt, { x: o.bei[0], y: o.bei[1] })
  if (abstand - o.breite / 2 < 0 || abstand + o.breite / 2 > laenge) {
    throw new Error(`${blatt.name}: Oeffnung bei ${o.bei.join('/')} passt nicht in die Wand`)
  }
  const t = abstand / laenge
  const geometrie = ermittleOeffnungsGeometrie(wand, { t })!
  const basis = {
    ...neueObjektBasis(wand.ebeneId),
    wandId: wand.id,
    t,
    breite: o.breite,
    ...geometrie,
  }
  if (o.art === 'durchbruch') return { ...basis, type: 'wanddurchbruch' }
  if (o.art === 'fenster') {
    return {
      ...basis,
      type: 'fenster',
      ...(o.hoehe !== undefined && { hoehe: o.hoehe }),
      ...(o.bruestung !== undefined && { bruestungshoehe: o.bruestung }),
    }
  }
  const richtung = { x: Math.cos(geometrie.richtung), y: Math.sin(geometrie.richtung) }
  const links = { x: -richtung.y, y: richtung.x }
  const schwenk = RICHTUNG[o.schwenk]
  const anschlag = RICHTUNG[o.anschlag]
  return {
    ...basis,
    type: 'tuer',
    gespiegelt: anschlag.x * richtung.x + anschlag.y * richtung.y > 0,
    schwenkInnen: schwenk.x * links.x + schwenk.y * links.y < 0,
    ...(o.hoehe !== undefined && { hoehe: o.hoehe }),
  }
}

function aussenbemassung(g: Geschoss, ebeneId: string): BemassungsreiheObjekt[] {
  const a = achse(g.aussen)
  const kanten = (auf: (o: Oeffnung) => number | null): number[] => {
    const werte: number[] = []
    for (const o of g.oeffnungen) {
      const mitte = auf(o)
      if (mitte !== null) werte.push(mitte - o.breite / 2, mitte + o.breite / 2)
    }
    return werte
  }
  const sued = [0, ...kanten((o) => (o.bei[1] === a.s ? o.bei[0] : null)), BREITE]
  const west = [0, ...kanten((o) => (o.bei[0] === a.w ? o.bei[1] : null)), TIEFE]
  const reihe = (punkte: Point[], winkel: number): BemassungsreiheObjekt => ({
    ...neueObjektBasis(ebeneId),
    type: 'bemassungsreihe',
    art: 'kette',
    punkte,
    winkel,
    versatz: winkel === 0 ? -1.2 : 1.2,
    gesamtmass: true,
    staffelabstand: STANDARD_STAFFELABSTAND * 2,
  })
  return [
    reihe(
      sued.map((x) => ({ x, y: 0 })),
      0,
    ),
    reihe(
      west.map((y) => ({ x: 0, y })),
      Math.PI / 2,
    ),
  ]
}
