import type { CatalogComponent } from './catalog'
import type {
  BestueckungsEintrag,
  KomponentenObjekt,
  LeitungsVerteilerAnschluss,
  Phase,
} from './objekte'
import {
  kanalGeraeteKennzeichen,
  knotenSchluessel,
  stehtImBaum,
  wirksameEltern,
} from './bestueckung'
import {
  ermittleVerteilerBetriebsmittel,
  type VerteilerBetriebsmittel,
  zuweisungsText,
} from './verteiler-belegung'
import type { Zeichnung } from './zeichnung'

export type KnotenRolle = 'rcd' | 'schutz' | 'kontakt' | 'klemme' | 'sonstige'

export interface VerteilerKnoten {
  schluessel: string
  kennzeichen: string
  kanal?: string
  eintrag: BestueckungsEintrag
  geraet: VerteilerBetriebsmittel
  rolle: KnotenRolle
  eltern: VerteilerKnoten | null
  kinder: VerteilerKnoten[]
  tiefe: number
}

export interface KanalGeraet {
  geraet: VerteilerBetriebsmittel
  eintrag: BestueckungsEintrag | null
  kanaele: VerteilerKnoten[]
}

export interface VerteilerBaum {
  wurzeln: VerteilerKnoten[]
  knoten: VerteilerKnoten[]
  kanalGeraete: KanalGeraet[]
  nichtEingeordnet: VerteilerBetriebsmittel[]
  nichtEingeordneteKlemmen: {
    kennzeichen: string
    kanal: string
    geraet: VerteilerBetriebsmittel
  }[]
  betriebsmittel: VerteilerBetriebsmittel[]
}

export function rolleVon(geraet: VerteilerBetriebsmittel): KnotenRolle {
  switch (geraet.buchstabe) {
    case 'F':
      if (geraet.istAbleiter) return 'sonstige'
      return geraet.istFehlerstromSchutz ? 'rcd' : 'schutz'
    case 'K':
      return 'kontakt'
    case 'X':
      return 'klemme'
    default:
      return 'sonstige'
  }
}

export function baueVerteilerBaum(
  verteiler: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
  plan?: Pick<Zeichnung, 'blaetter'> | null,
): VerteilerBaum {
  const bestueckung = verteiler.verteiler?.bestueckung ?? []
  const betriebsmittel = ermittleVerteilerBetriebsmittel(verteiler, katalog, plan)
  const geraetVon = new Map(betriebsmittel.map((b) => [b.kennzeichen, b]))
  const kanalGeraete = kanalGeraeteKennzeichen(bestueckung)
  const eltern = wirksameEltern(bestueckung)

  const knotenVon = new Map<string, VerteilerKnoten>()
  const gesehen = new Set<string>()
  for (const e of bestueckung) {
    if (!stehtImBaum(e, kanalGeraete)) continue
    const geraet = geraetVon.get(e.kennzeichen)
    const schluessel = knotenSchluessel(e)
    if (!geraet || gesehen.has(schluessel)) continue
    gesehen.add(schluessel)
    knotenVon.set(e.id, {
      schluessel,
      kennzeichen: e.kennzeichen,
      ...(e.kanal ? { kanal: e.kanal } : {}),
      eintrag: e,
      geraet,
      rolle: rolleVon(geraet),
      eltern: null,
      kinder: [],
      tiefe: 0,
    })
  }
  const wurzeln: VerteilerKnoten[] = []
  for (const k of knotenVon.values()) {
    const elternId = eltern.get(k.eintrag.id) ?? null
    const e = elternId ? knotenVon.get(elternId) : undefined
    if (e) {
      k.eltern = e
      e.kinder.push(k)
    } else {
      wurzeln.push(k)
    }
  }
  const knoten: VerteilerKnoten[] = []
  const besuche = (k: VerteilerKnoten, tiefe: number) => {
    k.tiefe = tiefe
    knoten.push(k)
    for (const kind of k.kinder) besuche(kind, tiefe + 1)
  }
  for (const w of wurzeln) besuche(w, 0)

  const kanalListe: KanalGeraet[] = []
  for (const kennzeichen of kanalGeraete) {
    const geraet = geraetVon.get(kennzeichen)
    if (!geraet) continue
    kanalListe.push({
      geraet,
      eintrag: bestueckung.find((e) => e.kennzeichen === kennzeichen && !e.kanal) ?? null,
      kanaele: knoten.filter((k) => k.kennzeichen === kennzeichen && k.kanal !== undefined),
    })
  }
  const eingetragen = new Set(bestueckung.map((e) => e.kennzeichen))
  const mitGeraeteEintrag = new Set(bestueckung.filter((e) => !e.kanal).map((e) => e.kennzeichen))
  const istPlanLeiste = (b: VerteilerBetriebsmittel) =>
    b.imPlan &&
    b.buchstabe === 'X' &&
    !mitGeraeteEintrag.has(b.kennzeichen) &&
    b.anschluesse.length > 0 &&
    b.anschluesse.every((a) => /^\d+$/.test(a))
  const kanaeleImBaum = new Set(bestueckung.filter((e) => e.kanal).map(knotenSchluessel))
  return {
    wurzeln,
    knoten,
    kanalGeraete: kanalListe,
    nichtEingeordnet: betriebsmittel.filter(
      (b) => b.imPlan && !eingetragen.has(b.kennzeichen) && !istPlanLeiste(b),
    ),
    nichtEingeordneteKlemmen: betriebsmittel
      .filter(istPlanLeiste)
      .flatMap((b) =>
        b.anschluesse
          .filter(
            (kanal) => !kanaeleImBaum.has(knotenSchluessel({ kennzeichen: b.kennzeichen, kanal })),
          )
          .map((kanal) => ({ kennzeichen: b.kennzeichen, kanal, geraet: b })),
      ),
    betriebsmittel,
  }
}

export function knotenZurZuweisung(
  baum: Pick<VerteilerBaum, 'knoten'>,
  kennzeichen: string,
  anschluss?: string,
): VerteilerKnoten | null {
  if (anschluss) {
    const kanal = baum.knoten.find((k) => k.kennzeichen === kennzeichen && k.kanal === anschluss)
    if (kanal) return kanal
  }
  return baum.knoten.find((k) => k.kennzeichen === kennzeichen && k.kanal === undefined) ?? null
}

export interface Stromweg {
  knoten: VerteilerKnoten
  vorfahren: VerteilerKnoten[]
  stromkreis: VerteilerKnoten | null
  rcd: VerteilerKnoten | null
  vorsicherungen: VerteilerKnoten[]
  kontakte: VerteilerKnoten[]
  klemme: VerteilerKnoten | null
  phase: Phase | null
}

export function ermittleStromweg(knoten: VerteilerKnoten): Stromweg {
  const vorfahren: VerteilerKnoten[] = []
  for (let k = knoten.eltern; k; k = k.eltern) vorfahren.push(k)
  const weg = [knoten, ...vorfahren]
  const stromkreis = weg.find((k) => k.rolle === 'schutz') ?? null
  const stromkreisIndex = stromkreis ? weg.indexOf(stromkreis) : weg.length
  return {
    knoten,
    vorfahren,
    stromkreis,
    rcd: weg.find((k) => k.rolle === 'rcd') ?? null,
    vorsicherungen: weg.slice(stromkreisIndex + 1).filter((k) => k.rolle === 'schutz'),
    kontakte: weg.slice(0, stromkreisIndex).filter((k) => k.rolle === 'kontakt'),
    klemme: weg.slice(0, stromkreisIndex + 1).find((k) => k.rolle === 'klemme') ?? null,
    phase: weg.find((k) => k.eintrag.phase)?.eintrag.phase ?? null,
  }
}

export function stromwegText(weg: Stromweg): string {
  const kette = [
    weg.knoten.schluessel,
    ...weg.kontakte.filter((k) => k !== weg.knoten).map((k) => k.schluessel),
    ...(weg.stromkreis && weg.stromkreis !== weg.knoten ? [weg.stromkreis.schluessel] : []),
  ]
  const zusatz = [
    weg.rcd ? `RCD ${weg.rcd.kennzeichen}` : null,
    ...weg.vorsicherungen.map((k) => k.kennzeichen),
    weg.phase,
  ].filter((t): t is string => !!t)
  return [kette.join(' → '), ...zusatz].join(' · ')
}

export function stromkreiseImBaum(baum: Pick<VerteilerBaum, 'knoten'>): VerteilerKnoten[] {
  const ergebnis = new Set<VerteilerKnoten>()
  const hatSchutzDarunter = (k: VerteilerKnoten): boolean =>
    k.kinder.some((c) => c.rolle === 'schutz' || hatSchutzDarunter(c))
  for (const k of baum.knoten) {
    if (k.rolle === 'schutz' && !hatSchutzDarunter(k)) ergebnis.add(k)
    if (k.rolle !== 'schutz' && k.rolle !== 'rcd' && !hatSchutzDarunter(k)) {
      const s = ermittleStromweg(k).stromkreis
      if (s) ergebnis.add(s)
    }
  }
  return baum.knoten.filter((k) => ergebnis.has(k))
}

export function istParallelerAbleiter(k: VerteilerKnoten): boolean {
  return k.geraet.istAbleiter === true && k.kinder.length === 0
}

export function istKopf(k: VerteilerKnoten, stromkreise: ReadonlySet<VerteilerKnoten>): boolean {
  return k.kinder.some((c) => stromkreise.has(c) || istKopf(c, stromkreise))
}

export function typText(geraet: Pick<VerteilerBetriebsmittel, 'variablen'>): string {
  return geraet.variablen.Typ ?? Object.values(geraet.variablen)[0] ?? ''
}

export function verteilerSchildTextAusBaum(
  verteilerKennzeichen: string,
  baum: Pick<VerteilerBaum, 'knoten'> | null,
  anschluesse: readonly Pick<LeitungsVerteilerAnschluss, 'kennzeichen' | 'anschluss'>[],
  mitStromkreis: boolean,
): string {
  if (anschluesse.length === 0) return verteilerKennzeichen
  const eintraege = anschluesse.map((a) => {
    const knoten = baum ? knotenZurZuweisung(baum, a.kennzeichen, a.anschluss) : null
    return {
      text: knoten?.schluessel ?? zuweisungsText({ kennzeichen: a.kennzeichen }),
      stromkreis: knoten ? (ermittleStromweg(knoten).stromkreis?.kennzeichen ?? null) : null,
    }
  })
  const stromkreise = new Set(eintraege.map((e) => e.stromkreis).filter((s): s is string => !!s))
  const knoten = [...new Set(eintraege.map((e) => e.text))]
  const ohneStromkreis = knoten.filter((t) => !stromkreise.has(t))
  const gezeigt = ohneStromkreis.length > 0 ? ohneStromkreis : knoten
  const klammer = [...stromkreise].filter((s) => !gezeigt.includes(s))
  const basis = `${verteilerKennzeichen}-${gezeigt.join(', ')}`
  return mitStromkreis && klammer.length > 0 ? `${basis} (${klammer.join(', ')})` : basis
}
