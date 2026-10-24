import type { Zeichnungsart } from '../document-model'

export const WERKZEUGLEISTE_STANDARD = [
  'auswahl',
  'schaltverbindung',
  'komponente',
  'potential',
  'knx-aktor',
  'leitung',
  'trunk',
  'wirkverbindung',
  'kabelschacht',
  'wand',
  'wandrechteck',
  'tuer',
  'wanddurchbruch',
  'fenster',
  'raum',
  'treppe',
  'linie',
  'rechteck',
  'kreis',
  'polylinie',
  'bogen',
  'ellipse',
  'polygon',
  'punkt',
  'text',
  'bemassung',
  'schraffur',
  'trimmen',
  'wandteilen',
  'stueckliste',
  'leitungsliste',
  'trunkliste',
  'raumliste',
  'betriebsmittelliste',
  'stromkreisverzeichnis',
  'aktorkanalliste',
  'potentialliste',
  'bodenplatte',
  'bodenplatterechteck',
  'steuerungslogik',
  'leitungsbaum',
  'switchplan',
  'patchpanelplan',
  'plankopf',
]

const BEIDE: readonly Zeichnungsart[] = ['bauplan', 'schaltplan']
const NUR_BAUPLAN: readonly Zeichnungsart[] = ['bauplan']
const NUR_SCHALTPLAN: readonly Zeichnungsart[] = ['schaltplan']

export const WERKZEUG_ZEICHNUNGSARTEN: Readonly<Record<string, readonly Zeichnungsart[]>> = {
  auswahl: BEIDE,
  komponente: BEIDE,
  leitung: NUR_BAUPLAN,
  schaltverbindung: NUR_SCHALTPLAN,
  potential: NUR_SCHALTPLAN,
  'knx-aktor': NUR_SCHALTPLAN,
  trunk: NUR_BAUPLAN,
  wirkverbindung: NUR_BAUPLAN,
  kabelschacht: NUR_BAUPLAN,
  linie: BEIDE,
  rechteck: BEIDE,
  wand: NUR_BAUPLAN,
  wandrechteck: NUR_BAUPLAN,
  tuer: NUR_BAUPLAN,
  fenster: NUR_BAUPLAN,
  wanddurchbruch: NUR_BAUPLAN,
  raum: NUR_BAUPLAN,
  treppe: NUR_BAUPLAN,
  bodenplatte: NUR_BAUPLAN,
  bodenplatterechteck: NUR_BAUPLAN,
  kreis: BEIDE,
  polylinie: BEIDE,
  bogen: BEIDE,
  ellipse: BEIDE,
  polygon: BEIDE,
  punkt: BEIDE,
  text: BEIDE,
  bemassung: BEIDE,
  schraffur: BEIDE,
  trimmen: BEIDE,
  wandteilen: NUR_BAUPLAN,
  stueckliste: NUR_BAUPLAN,
  leitungsliste: NUR_BAUPLAN,
  trunkliste: NUR_BAUPLAN,
  raumliste: NUR_BAUPLAN,
  betriebsmittelliste: NUR_SCHALTPLAN,
  stromkreisverzeichnis: BEIDE,
  aktorkanalliste: BEIDE,
  potentialliste: NUR_SCHALTPLAN,
  steuerungslogik: NUR_BAUPLAN,
  leitungsbaum: NUR_BAUPLAN,
  switchplan: NUR_BAUPLAN,
  patchpanelplan: NUR_BAUPLAN,
  plankopf: BEIDE,
}

export function werkzeugPasstZuZeichnungsart(werkzeugId: string, art: Zeichnungsart): boolean {
  return (WERKZEUG_ZEICHNUNGSARTEN[werkzeugId] ?? BEIDE).includes(art)
}

export function ermittleWerkzeugleiste(
  eigeneReihenfolge: readonly string[],
  ausgeblendet: readonly string[],
  zeichnungsart?: Zeichnungsart,
): string[] {
  const bekannt = new Set(WERKZEUGLEISTE_STANDARD)
  const eigene = eigeneReihenfolge.filter((id) => bekannt.has(id))
  const fehlend = WERKZEUGLEISTE_STANDARD.filter((id) => !eigene.includes(id))
  const vollstaendig = eigene.length > 0 ? [...eigene, ...fehlend] : [...WERKZEUGLEISTE_STANDARD]
  const versteckt = new Set(ausgeblendet)
  return vollstaendig.filter(
    (id) =>
      !versteckt.has(id) &&
      (zeichnungsart === undefined || werkzeugPasstZuZeichnungsart(id, zeichnungsart)),
  )
}
