import type { CatalogComponent } from './catalog'
import { ermittleDurchgehendeLeitung } from './kabelschacht'
import type {
  KomponentenObjekt,
  LeitungsObjekt,
  LeitungsVerteilerAnschluss,
  Phase,
} from './objekte'
import { alleVerteiler } from './verteiler'
import { knxQuellenZiel, quellenSchluessel, stromkreisQuelleVon } from './stromkreis-eigenschaft'
import {
  baueVerteilerBaum,
  ermittleStromweg,
  knotenZurZuweisung,
  type VerteilerBaum,
  type VerteilerKnoten,
} from './verteiler-baum'
import {
  ermittleVerteilerZuweisungen,
  kennbuchstabeVon,
  zuweisungsText,
} from './verteiler-belegung'
import type { Zeichnung } from './zeichnung'

export interface StromkreisZuordnung {
  verteilerId: string
  verteilerKennzeichen: string
  knoten: string
  stromkreis: string | null
  kanal: string | null
  klemme: string | null
  rcd: string | null
  vorsicherungen: string[]
  phase: Phase | null
}

export interface StromkreisZuordnungen {
  komponenten: ReadonlyMap<string, StromkreisZuordnung[]>
  komponentenUnverdichtet: ReadonlyMap<string, StromkreisZuordnung[]>
  leitungen: ReadonlyMap<string, StromkreisZuordnung[]>
}

export function zuordnungFuer(
  verteiler: KomponentenObjekt,
  baum: Pick<VerteilerBaum, 'knoten'>,
  anschluss: Pick<LeitungsVerteilerAnschluss, 'kennzeichen' | 'anschluss'>,
): StromkreisZuordnung {
  const verteilerKennzeichen = verteiler.verteiler?.kennzeichen ?? ''
  const knoten = knotenZurZuweisung(baum, anschluss.kennzeichen, anschluss.anschluss)
  if (!knoten) {
    const text = zuweisungsText(anschluss)
    const buchstabe = kennbuchstabeVon(anschluss.kennzeichen)
    return {
      verteilerId: verteiler.id,
      verteilerKennzeichen,
      knoten: text,
      stromkreis: buchstabe === 'F' ? anschluss.kennzeichen : null,
      kanal: null,
      klemme: buchstabe === 'X' ? text : null,
      rcd: null,
      vorsicherungen: [],
      phase: null,
    }
  }
  const weg = ermittleStromweg(knoten)
  return {
    verteilerId: verteiler.id,
    verteilerKennzeichen,
    knoten: knoten.schluessel,
    stromkreis: weg.stromkreis?.kennzeichen ?? null,
    kanal:
      [knoten, ...weg.kontakte].find((k) => k.rolle === 'kontakt' && k.kanal)?.schluessel ?? null,
    klemme: weg.klemme?.schluessel ?? null,
    rcd: weg.rcd?.kennzeichen ?? null,
    vorsicherungen: weg.vorsicherungen.map((k) => k.kennzeichen),
    phase: weg.phase,
  }
}

export function stromkreisKurztext(z: StromkreisZuordnung): string {
  const teile = [z.stromkreis, z.kanal ?? null, z.klemme].filter((t): t is string => !!t)
  return `${z.verteilerKennzeichen}-${teile.length > 0 ? teile.join(' / ') : z.knoten}`
}

export function stromkreisLangtext(z: StromkreisZuordnung, mitPhase = true): string {
  return [
    stromkreisKurztext(z),
    z.rcd ? `RCD ${z.rcd}` : null,
    ...z.vorsicherungen,
    mitPhase ? z.phase : null,
  ]
    .filter((t): t is string => !!t)
    .join(' · ')
}

export function verdichteZuordnungen(liste: readonly StromkreisZuordnung[]): StromkreisZuordnung[] {
  const eindeutig = [...new Map(liste.map((z) => [stromkreisKurztext(z), z])).values()]
  return eindeutig.filter(
    (z) =>
      z.klemme !== null ||
      !eindeutig.some(
        (a) =>
          a !== z &&
          a.klemme !== null &&
          a.verteilerId === z.verteilerId &&
          a.stromkreis === z.stromkreis &&
          (z.kanal === null || z.kanal === a.kanal),
      ),
  )
}

function schluessel(blattId: string, objektId: string): string {
  return `${blattId}#${objektId}`
}

const gemerkt = new WeakMap<
  Zeichnung,
  {
    katalog: readonly CatalogComponent[]
    plaene: readonly VerteilerplanQuelle[]
    ergebnis: StromkreisZuordnungen
  }
>()

export type VerteilerplanQuelle = Pick<Zeichnung, 'blaetter' | 'verteilerKennzeichen'>

const KEINE_PLAENE: readonly VerteilerplanQuelle[] = []

export function ermittleStromkreisZuordnungen(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  verteilerplaene: readonly VerteilerplanQuelle[] = KEINE_PLAENE,
): StromkreisZuordnungen {
  const treffer = gemerkt.get(zeichnung)
  if (
    treffer &&
    treffer.katalog === katalog &&
    treffer.plaene.length === verteilerplaene.length &&
    treffer.plaene.every((p, i) => p === verteilerplaene[i])
  )
    return treffer.ergebnis
  const ergebnis = berechneZuordnungen(zeichnung, katalog, verteilerplaene)
  gemerkt.set(zeichnung, { katalog, plaene: verteilerplaene, ergebnis })
  return ergebnis
}

function planVon(
  v: KomponentenObjekt,
  plaene: readonly VerteilerplanQuelle[],
): VerteilerplanQuelle | null {
  const kennzeichen = v.verteiler?.kennzeichen
  return (kennzeichen && plaene.find((p) => p.verteilerKennzeichen === kennzeichen)) || null
}

function knotenGilt(
  knoten: VerteilerKnoten | null,
  plan: VerteilerplanQuelle | null,
): knoten is VerteilerKnoten {
  return knoten !== null && (!plan || knoten.geraet.imPlan)
}

function berechneZuordnungen(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  plaene: readonly VerteilerplanQuelle[],
): StromkreisZuordnungen {
  const komponenten = new Map<string, StromkreisZuordnung[]>()
  const leitungen = new Map<string, StromkreisZuordnung[]>()
  const verteiler = alleVerteiler(zeichnung)
  if (verteiler.length === 0) return { komponenten, leitungen, komponentenUnverdichtet: new Map() }

  const amGeraet = new Map<string, { blattId: string; leitung: LeitungsObjekt }[]>()
  const geraete = new Map<string, KomponentenObjekt>()
  const sperre = new Set<string>()
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type === 'komponente') {
        geraete.set(schluessel(blatt.id, o.id), o)
        if (o.verteiler || o.dockpunkte?.modus === 'ports') sperre.add(schluessel(blatt.id, o.id))
      }
      if (o.type !== 'leitung') continue
      for (const ende of ['start', 'ziel'] as const) {
        const e = o[ende]
        if (e.art !== 'dock') continue
        const k = schluessel(blatt.id, e.objektId)
        amGeraet.set(k, [...(amGeraet.get(k) ?? []), { blattId: blatt.id, leitung: o }])
      }
    }
  }
  const kabelCache = new Map<string, { blattId: string; leitung: LeitungsObjekt }[]>()
  const kabel = (blattId: string, leitung: LeitungsObjekt) => {
    const k = schluessel(blattId, leitung.id)
    const vorhanden = kabelCache.get(k)
    if (vorhanden) return vorhanden
    const glieder = ermittleDurchgehendeLeitung(zeichnung, blattId, leitung.id)?.glieder ?? [
      { blattId, leitung },
    ]
    for (const g of glieder) kabelCache.set(schluessel(g.blattId, g.leitung.id), glieder)
    return glieder
  }
  const merke = (ziel: Map<string, StromkreisZuordnung[]>, id: string, z: StromkreisZuordnung) =>
    ziel.set(id, [...(ziel.get(id) ?? []), z])
  for (const { verteiler: v } of verteiler) {
    const plan = planVon(v, plaene)
    const baum = baumVon(v, katalog, plan)
    for (const zuweisung of ermittleVerteilerZuweisungen(zeichnung, v.id)) {
      const { kennzeichen, anschluss } = zuweisung.anschluss
      if (!knotenGilt(knotenZurZuweisung(baum, kennzeichen, anschluss), plan)) continue
      const z = zuordnungFuer(v, baum, zuweisung.anschluss)
      const besuchteLeitungen = new Set<string>()
      const besuchteGeraete = new Set<string>()
      const warteschlange: { blattId: string; leitung: LeitungsObjekt }[] = [
        { blattId: zuweisung.leitungBlattId, leitung: zuweisung.leitung },
      ]
      while (warteschlange.length > 0) {
        const { blattId, leitung } = warteschlange.shift()!
        for (const glied of kabel(blattId, leitung)) {
          const k = schluessel(glied.blattId, glied.leitung.id)
          if (besuchteLeitungen.has(k)) continue
          besuchteLeitungen.add(k)
          merke(leitungen, glied.leitung.id, z)
          for (const ende of ['start', 'ziel'] as const) {
            const e = glied.leitung[ende]
            if (e.art !== 'dock') continue
            const g = schluessel(glied.blattId, e.objektId)
            if (sperre.has(g) || besuchteGeraete.has(g) || !geraete.has(g)) continue
            besuchteGeraete.add(g)
            merke(komponenten, e.objektId, z)
            warteschlange.push(...(amGeraet.get(g) ?? []))
          }
        }
      }
    }
  }
  zuordnungenUeberQuelle(zeichnung, katalog, verteiler, komponenten, sperre, plaene)
  const komponentenUnverdichtet = new Map(komponenten)
  for (const [id, liste] of komponenten) komponenten.set(id, verdichteZuordnungen(liste))
  for (const [id, liste] of leitungen) leitungen.set(id, verdichteZuordnungen(liste))
  return { komponenten, leitungen, komponentenUnverdichtet }
}

const baeume = new WeakMap<
  KomponentenObjekt,
  { katalog: readonly CatalogComponent[]; plan: VerteilerplanQuelle | null; baum: VerteilerBaum }
>()

function baumVon(
  v: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
  plan: VerteilerplanQuelle | null,
): VerteilerBaum {
  const treffer = baeume.get(v)
  if (treffer && treffer.katalog === katalog && treffer.plan === plan) return treffer.baum
  const baum = baueVerteilerBaum(v, katalog, plan)
  baeume.set(v, { katalog, plan, baum })
  return baum
}

const ROLLEN_VORRANG = ['klemme', 'schutz', 'kontakt', 'rcd', 'sonstige']

function zuordnungenUeberQuelle(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  verteiler: ReturnType<typeof alleVerteiler>,
  komponenten: Map<string, StromkreisZuordnung[]>,
  sperre: ReadonlySet<string>,
  plaene: readonly VerteilerplanQuelle[],
): void {
  const jeQuelle = new Map<
    string,
    { v: KomponentenObjekt; baum: VerteilerBaum; knoten: VerteilerKnoten }
  >()
  for (const { verteiler: v } of verteiler) {
    if (!v.verteiler?.bestueckung.some((e) => e.quelle)) continue
    const plan = planVon(v, plaene)
    const baum = baumVon(v, katalog, plan)
    for (const knoten of baum.knoten) {
      const q = knoten.eintrag.quelle
      if (!q || q.art === 'blatt' || !knotenGilt(knoten, plan)) continue
      const k = quellenSchluessel(q)
      const vorhanden = jeQuelle.get(k)
      if (
        !vorhanden ||
        ROLLEN_VORRANG.indexOf(knoten.rolle) < ROLLEN_VORRANG.indexOf(vorhanden.knoten.rolle)
      )
        jeQuelle.set(k, { v, baum, knoten })
    }
  }
  if (jeQuelle.size === 0) return
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente' || komponenten.has(o.id)) continue
      if (sperre.has(schluessel(blatt.id, o.id))) continue
      const knx = jeQuelle.get(quellenSchluessel({ art: 'knx', ziel: knxQuellenZiel(blatt.id, o) }))
      const kreis = stromkreisQuelleVon(zeichnung, blatt.id, o, katalog)
      const treffer = knx ?? (kreis ? jeQuelle.get(quellenSchluessel(kreis)) : undefined)
      if (!treffer) continue
      komponenten.set(o.id, [
        zuordnungFuer(treffer.v, treffer.baum, {
          kennzeichen: treffer.knoten.kennzeichen,
          anschluss: treffer.knoten.kanal,
        }),
      ])
    }
  }
}
