import type { StandardEbene, Zeichnung } from '../../document-model'
import { RAUMART_IDS, raumartName, standardEbenenName } from '../../document-model'
import type { Sprache, Uebersetzer } from '../../sprache'
import { erzeugeUebersetzer, QUELLSPRACHE } from '../../sprache'

export function uebersetzeMuster(zeichnung: Zeichnung, nach: Sprache): Zeichnung {
  const de = erzeugeUebersetzer(QUELLSPRACHE)
  const ziel = erzeugeUebersetzer(nach)
  const namen = namensTabelle(de, ziel)
  const name = (text: string) => namen.get(text) ?? text
  const leitungen = (['licht', 'steckdosen'] as const).map((art) => ({
    vorne: de(`plan.muster.leitung.${art}`, { raum: '' }),
    ziel: (raum: string) => ziel(`plan.muster.leitung.${art}`, { raum }),
  }))
  const beschreibung = (text: string) => {
    for (const l of leitungen) {
      if (text.startsWith(l.vorne)) return l.ziel(name(text.slice(l.vorne.length)))
    }
    return name(text)
  }

  return {
    ...zeichnung,
    name: name(zeichnung.name),
    ...(nach === QUELLSPRACHE ? {} : { plansprache: nach }),
    blaetter: zeichnung.blaetter.map((blatt) => ({
      ...blatt,
      name: name(blatt.name),
      ...(blatt.geschoss && {
        geschoss: {
          ...blatt.geschoss,
          ...(blatt.geschoss.name && { name: name(blatt.geschoss.name) }),
        },
      }),
      ebenen: blatt.ebenen.map((e) => ({ ...e, name: name(e.name) })),
      objekte: blatt.objekte.map((o) => {
        switch (o.type) {
          case 'raum':
          case 'kabelschacht':
            return { ...o, name: name(o.name) }
          case 'trunk':
            return {
              ...o,
              name: name(o.name),
              ...(o.beschreibung && { beschreibung: name(o.beschreibung) }),
            }
          case 'leitung':
            return o.beschreibung ? { ...o, beschreibung: beschreibung(o.beschreibung) } : o
          default:
            return o
        }
      }),
    })),
  }
}

const STANDARD_EBENEN: readonly StandardEbene[] = [
  'hintergrund',
  'bauelemente',
  'raeume',
  'komponenten',
  'leitungen',
  'bemassung',
]

function namensTabelle(de: Uebersetzer, ziel: Uebersetzer): Map<string, string> {
  const paare: [string, string][] = []
  const muster = (pfad: Parameters<Uebersetzer>[0]) => paare.push([de(pfad), ziel(pfad)])
  muster('plan.muster.zeichnung')
  muster('plan.muster.schacht')
  for (const ebene of ['kg', 'eg', 'og'] as const) {
    muster(`plan.muster.blatt.${ebene}`)
    muster(`plan.muster.geschoss.${ebene}`)
  }
  for (const raum of [
    'technik',
    'waschen',
    'vorrat',
    'diele',
    'speisekammer',
    'wohnenEssen',
    'gast',
    'eltern',
    'kind1',
    'kind2',
  ] as const) {
    muster(`plan.muster.raum.${raum}`)
  }
  for (const trunk of ['steig', 'keller'] as const) {
    muster(`plan.muster.trunk.${trunk}`)
    muster(`plan.muster.trunkBeschreibung.${trunk}`)
  }
  for (const art of RAUMART_IDS) paare.push([raumartName(art, de), raumartName(art, ziel)])
  for (const art of STANDARD_EBENEN) {
    paare.push([standardEbenenName(art, de), standardEbenenName(art, ziel)])
  }
  return new Map(paare)
}
