import { oberflaechensprache, t } from '../sprache'
import type { Sprache, Uebersetzer } from '../sprache'
import { naechstesBestueckungsKennzeichen } from './bestueckung'
import { knotenAusAbzweigen } from './schaltverbindung-segmente'
import type { Blatt } from './blatt'
import { erzeugeBlatt } from './blatt'
import { komponentenText } from './katalog-uebersetzung'
import type { CatalogComponent, KatalogTextElement } from './catalog'
import { getDockpoints, getFangpunkt } from './dockpoints'
import { istLeitersatz } from './klemmen'
import {
  type KnxAktorDaten,
  knxAktorInstanzFelder,
  knxAktorKatalogId,
  knxAktorTitel,
  knxKanalIndexAusName,
  knxKanalName,
  knxPaarBeginn,
} from './knx-aktor'
import { standardEbenenArtFuerTyp, traegtStandardNamen } from './ebenen'
import type { Point } from './geometry'
import type {
  KomponentenObjekt,
  Objekt,
  ObjektTyp,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
  TextObjekt,
} from './objekte'
import { neueObjektBasis } from './objekte'
import { BASIS_SYMBOL_GROESSE_METER } from './symbol'
import {
  baueVerteilerBaum,
  istKopf,
  istParallelerAbleiter,
  stromkreiseImBaum,
  type KanalGeraet,
  type VerteilerKnoten,
} from './verteiler-baum'
import { kennbuchstabeVon } from './verteiler-belegung'
import { netzVon, passtZumNetz, type VerteilerNetz } from './verteiler-netz'
import { artVon, type VerteilerArt } from './verteiler-art'
import { N_LEITER_FARBE, PE_LEITER_FARBE, PE_LEITER_ZWEITE_FARBE } from './leiterfarben'
import { planUebersetzer } from './plansprache'
import { zeichenflaecheBoundingBox } from './zeichenflaeche'
import type { Zeichnung } from './zeichnung'
import { erzeugeZeichnung } from './zeichnung'

export interface VerteilerplanOptionen {
  name: string
  maxSicherungenJeBlatt: number
  maxKlemmenJeBlatt: number
  aufteilung?: VerteilerplanAufteilung
  plansprache?: Sprache
}

export type VerteilerplanAufteilung = 'ganz' | 'fortlaufend'

export const VERTEILERPLAN_STANDARD: Omit<VerteilerplanOptionen, 'name'> & {
  aufteilung: VerteilerplanAufteilung
} = {
  maxSicherungenJeBlatt: 8,
  maxKlemmenJeBlatt: 16,
  aufteilung: 'ganz',
}

export interface VerteilerplanErgebnis {
  zeichnung: Zeichnung
  stromkreise: number
  rcd: number
  hinweise: string[]
  aktoren: { kennzeichen: string; titel: string; baugroesse: number; belegt: number }[]
}

export const KONTAKT_KATALOG_ID = 'kontaktblock-1s'
export const TRIAC_KATALOG_ID = 'triac-dimmkanal'
export const KONTAKT_PAAR_KATALOG_ID = 'kontaktblock-2s'
export const KLEMMSTELLE_KATALOG_ID = 'klemmenblock-1-polig'

const RASTER = 0.24
const LEITER_ABSTAND = RASTER / 2
const RAND = 0.36
const SPALTEN_RAND = 0.24
const KOPF_REIHE = 5
const KLEMMEN_TIEFER = 5
const UNTEN_FREI = 4 * RASTER
const LINKS_FREI = 2 * RASTER
const SCHIENEN = ['L1', 'L2', 'L3', 'N', 'PE'] as const
type Schiene = (typeof SCHIENEN)[number]

function schienenIm(netz: VerteilerNetz): readonly Schiene[] {
  return netz === 'wechselstrom' ? ['L1', 'N', 'PE'] : SCHIENEN
}

function schienenName(netz: VerteilerNetz, s: Schiene): string {
  return netz === 'wechselstrom' && s === 'L1' ? 'L' : s
}

function schieneIm(netz: VerteilerNetz, name: string, phase: string | undefined | null): Schiene {
  if (netz === 'wechselstrom' && name !== 'N' && name !== 'PE') return 'L1'
  return schieneFuer(name, phase)
}
const EPS = 1e-6

function reihen(oben: number, kopfEbenen: number, mitSpulen: boolean, tiefer = KLEMMEN_TIEFER) {
  const schiene = (i: number) => oben - RASTER - i * LEITER_ABSTAND
  const kopfOben = (ebene: number) => oben - (4 + ebene * KOPF_REIHE) * RASTER
  const fOben = oben - (9 + (Math.max(1, kopfEbenen) - 1) * KOPF_REIHE) * RASTER
  const kOben = fOben - 3 * RASTER
  const sOben = kOben - 3 * RASTER
  const xOben = (mitSpulen ? sOben - 5 * RASTER : kOben - 4 * RASTER) - tiefer * RASTER
  const pe = xOben + RASTER / 2
  const n = xOben + RASTER
  const leiter = (i: number) => xOben + (1.5 + i / 2) * RASTER
  const umKontakt = kOben + RASTER
  return { schiene, kopfOben, fOben, kOben, sOben, xOben, pe, n, leiter, umKontakt }
}

interface Zweig {
  kontakt: VerteilerKnoten | null
  klemmen: VerteilerKnoten[]
  spulen: VerteilerKnoten[]
}

interface Spalte {
  art: 'spalte'
  f: VerteilerKnoten | null
  zweige: Zweig[]
}

interface Gruppe {
  art: 'gruppe'
  kopf: VerteilerKnoten
  teile: Teil[]
  fortsetzung?: boolean
  fortgesetzt?: boolean
}

type Teil = Spalte | Gruppe

interface Platz {
  breite: number
  sicherungen: number
  klemmen: number
}

type KatalogVon = (k: VerteilerKnoten) => CatalogComponent | undefined

export function erzeugeVerteilerplan(
  verteiler: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
  optionen: VerteilerplanOptionen,
): VerteilerplanErgebnis {
  const ergebnis = erzeugeVerteilerplanMitAbzweigen(verteiler, katalog, optionen)
  ergebnis.zeichnung.blaetter = ergebnis.zeichnung.blaetter.map((b) => ({
    ...b,
    objekte: knotenAusAbzweigen(b.objekte),
  }))
  return ergebnis
}

export function erzeugeVerteilerplanMitAbzweigen(
  verteiler: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
  optionen: VerteilerplanOptionen,
): VerteilerplanErgebnis {
  const hinweise: string[] = []
  const kennzeichen = verteiler.verteiler?.kennzeichen ?? ''
  const baum = baueVerteilerBaum(verteiler, katalog)
  const netz = netzVon(verteiler.verteiler)
  for (const b of baum.betriebsmittel) {
    const eintrag = katalog.find((c) => c.id === b.catalogComponentId)
    if (eintrag && !passtZumNetz(eintrag, netz))
      hinweise.push(
        t('generatoren.verteilerplan.passtNichtZumNetz', {
          kennzeichen: b.kennzeichen,
          name: komponentenText(eintrag, 'name', oberflaechensprache()),
        }),
      )
  }
  const fehlend = new Set<string>()
  const katalogVon: KatalogVon = (k) => {
    const eintrag = katalog.find((c) => c.id === k.geraet.catalogComponentId)
    if (!eintrag && !fehlend.has(k.kennzeichen)) {
      fehlend.add(k.kennzeichen)
      hinweise.push(
        t('generatoren.verteilerplan.katalogeintragFehlt', { kennzeichen: k.kennzeichen }),
      )
    }
    return eintrag
  }
  const stromkreise = new Set(stromkreiseImBaum(baum))

  const istSpule = (k: VerteilerKnoten) =>
    k.rolle === 'kontakt' && !k.kanal && katalogVon(k)?.betriebsmittelRolle === 'spule'
  const sammle = (k: VerteilerKnoten, zweig: Zweig, zweige: Zweig[]) => {
    let ziel = zweig
    if (istSpule(k)) {
      ziel.spulen.push(k)
    } else if (k.rolle === 'kontakt') {
      ziel = { kontakt: k, klemmen: [], spulen: [] }
      zweige.push(ziel)
    } else if (k.rolle === 'klemme') {
      ziel.klemmen.push(k)
    }
    for (const kind of k.kinder) sammle(kind, ziel, zweige)
  }
  const spalteAus = (f: VerteilerKnoten | null, knoten: readonly VerteilerKnoten[]): Spalte => {
    const direkt: Zweig = { kontakt: null, klemmen: [], spulen: [] }
    const zweige: Zweig[] = [direkt]
    for (const k of knoten) sammle(k, direkt, zweige)
    return {
      art: 'spalte',
      f,
      zweige: zweige.filter((z) => z.kontakt || z.klemmen.length > 0 || z.spulen.length > 0),
    }
  }
  const teilFuer = (k: VerteilerKnoten): Teil | null => {
    if (istKopf(k, stromkreise)) {
      const teile = k.kinder.map(teilFuer).filter((t): t is Teil => t !== null)
      const lose = k.kinder.filter((c) => !stromkreise.has(c) && !istKopf(c, stromkreise))
      const spalte = spalteAus(null, lose)
      if (spalte.zweige.length > 0) teile.push(spalte)
      return { art: 'gruppe', kopf: k, teile }
    }
    if (stromkreise.has(k)) return spalteAus(k, k.kinder)
    return null
  }

  const kette: VerteilerKnoten[] = []
  const parallel: { nach: number; knoten: VerteilerKnoten }[] = []
  let ebene = baum.wurzeln
  for (;;) {
    const inReihe = ebene.filter((k) => !istParallelerAbleiter(k))
    if (kette.length > 0 || (inReihe.length === 1 && istKopf(inReihe[0], stromkreise))) {
      for (const k of ebene)
        if (istParallelerAbleiter(k)) parallel.push({ nach: kette.length, knoten: k })
      ebene = inReihe
    }
    if (ebene.length !== 1 || !istKopf(ebene[0], stromkreise)) break
    kette.push(ebene[0])
    ebene = ebene[0].kinder
  }
  const teile: Teil[] = []
  const ohneSchutz: Spalte[] = []
  for (const k of ebene) {
    const teil = teilFuer(k)
    if (teil) teile.push(teil)
    else {
      const spalte = spalteAus(null, [k])
      if (spalte.zweige.length > 0) ohneSchutz.push(spalte)
    }
  }
  const klemmenOhneSchutz = ohneSchutz.reduce((n, sp) => n + klemmenAnzahl(sp), 0)
  if (klemmenOhneSchutz > 0)
    hinweise.push(t('generatoren.verteilerplan.klemmenOhneSchutz', { n: klemmenOhneSchutz }))
  teile.push(...ohneSchutz)

  const kontaktKatalog = katalog.find((k) => k.id === KONTAKT_KATALOG_ID)
  const triacKatalog = katalog.find((k) => k.id === TRIAC_KATALOG_ID)
  const kontaktPaarKatalog = katalog.find((k) => k.id === KONTAKT_PAAR_KATALOG_ID)
  const klemmstelleKatalog = katalog.find((k) => k.id === KLEMMSTELLE_KATALOG_ID)
  const leitersatzVon: KatalogVon = (k) => {
    if (!k.kanal) return undefined
    const eintrag = katalog.find((c) => c.id === k.eintrag.catalogComponentId)
    return eintrag && istLeitersatz(eintrag.dockpunkte) ? eintrag : undefined
  }
  const symbole: Symbole = {
    katalogVon,
    kontaktKatalog,
    kontaktPaarKatalog,
    triacKatalog,
    klemmstelleKatalog,
    leitersatzVon,
  }
  if (!kontaktKatalog && teile.some((t) => brauchtKontaktSymbol(t, symbole)))
    hinweise.push(t('generatoren.verteilerplan.kontaktblock1sFehlt'))
  if (kontaktKatalog && !kontaktPaarKatalog && teile.some((t) => hatJalousiePaar(t)))
    hinweise.push(t('generatoren.verteilerplan.kontaktblock2sFehlt'))
  if (!triacKatalog && teile.some((t) => hatDimmKanal(t)))
    hinweise.push(t('generatoren.verteilerplan.triacFehlt'))

  const zeichnung = erzeugeZeichnung(optionen.name, 'schaltplan', optionen.plansprache)
  const tp = planUebersetzer(zeichnung)
  const blattFuerPlan = () =>
    erzeugeBlatt(tp('plan.vorgabe.blatt', { nr: String(blaetter.length + 1) }), 'schaltplan', tp)
  zeichnung.verteilerKennzeichen = kennzeichen
  const box = zeichenflaecheBoundingBox(zeichnung.blaetter[0].zeichenflaeche!)
  const leer: Platz = {
    breite: box.max.x - box.min.x - 2 * RAND - LINKS_FREI,
    sicherungen: optionen.maxSicherungenJeBlatt,
    klemmen: optionen.maxKlemmenJeBlatt,
  }
  const blattTeile: Teil[][] = [[]]
  let frei = leer
  const fortlaufend = optionen.aufteilung === 'fortlaufend'
  const stelle = (teil: Teil) => {
    blattTeile[blattTeile.length - 1].push(teil)
    frei = abzug(frei, teil, symbole)
  }
  for (const teil of teile) {
    let rest: Teil | null = teil
    while (rest) {
      if (passt(rest, frei, symbole)) {
        stelle(rest)
        rest = null
      } else if (blattTeile[blattTeile.length - 1].length > 0) {
        const geteilt: ReturnType<typeof teileGruppe> =
          fortlaufend && rest.art === 'gruppe' ? teileGruppe(rest, frei, leer, symbole, true) : null
        if (geteilt && passt(geteilt.vorne, frei, symbole)) {
          stelle(geteilt.vorne)
          rest = geteilt.hinten
        }
        blattTeile.push([])
        frei = leer
      } else {
        const geteilt: ReturnType<typeof teileGruppe> =
          rest.art === 'gruppe' ? teileGruppe(rest, leer, leer, symbole, fortlaufend) : null
        if (geteilt) {
          stelle(geteilt.vorne)
          rest = geteilt.hinten
        } else {
          if (teilBreite(rest, symbole) > leer.breite + EPS)
            hinweise.push(t('generatoren.verteilerplan.breiterAlsBlatt', { name: teilName(rest) }))
          stelle(rest)
          rest = null
        }
      }
    }
  }

  const blaetter: Blatt[] = []
  const neuesBlatt = () => (blaetter.length === 0 ? zeichnung.blaetter[0] : blattFuerPlan())
  {
    const blatt = neuesBlatt()
    const vergeben = new Set(baum.betriebsmittel.map((b) => b.kennzeichen))
    const glieder =
      kette.length > 0
        ? einspeiseGlieder(blatt, kette, parallel, symbole, katalog, vergeben, hinweise, netz)
        : standardEinspeisung(katalog, vergeben, hinweise, netz, artVon(verteiler.verteiler))
    if (glieder.length > 0) {
      zeichneEinspeisung(blatt, glieder, box, hinweise, netz)
      blaetter.push(blatt)
    }
  }
  const stromkreisBlaetter: { blatt: Blatt; fortlauf: Map<string, Fortlauf> }[] = []
  blattTeile.forEach((liste) => {
    if (liste.length === 0 && blaetter.length > 0) return
    const blatt = neuesBlatt()
    let fortlauf = new Map<string, Fortlauf>()
    let unten = Infinity
    for (let tiefer = KLEMMEN_TIEFER; tiefer >= 0; tiefer--) {
      blatt.objekte = []
      fortlauf = zeichneBlatt(
        blatt,
        liste,
        box.max.y,
        box.min.x + RAND,
        box.max.x - RAND,
        symbole,
        tiefer,
        netz,
      )
      unten = Math.min(
        ...blatt.objekte.flatMap((o) => (o.type === 'komponente' ? [kasten(o).min.y] : [])),
      )
      if (unten >= box.min.y + UNTEN_FREI - EPS) break
    }
    stromkreisBlaetter.push({ blatt, fortlauf })
    blaetter.push(blatt)
    if (unten < box.min.y - EPS)
      hinweise.push(t('generatoren.verteilerplan.unterRand', { blatt: blatt.name }))
  })
  const spaeterBenutzt = new Set<string>()
  for (const { blatt, fortlauf } of [...stromkreisBlaetter].reverse()) {
    const benutzt = [...fortlauf].filter(([id]) => hatAbzweige(blatt, id)).map(([, f]) => f.name)
    ohneToteEnden(blatt, (s) => {
      const f = fortlauf.get(s.id)
      if (!f) return 'gruppe'
      if (spaeterBenutzt.has(f.name)) return f.vonLinks ? 'durch' : 'ausgang'
      return f.vonLinks ? 'schiene' : 'gruppe'
    })
    benutzt.forEach((name) => spaeterBenutzt.add(name))
  }
  blaetter.forEach(leiterFarben)

  const amPlatz = new Set<string>([
    ...kette.map((k) => k.kennzeichen),
    ...parallel.map((p) => p.knoten.kennzeichen),
  ])
  const merkeAmPlatz = (t: Teil) => {
    if (t.art === 'gruppe') {
      amPlatz.add(t.kopf.kennzeichen)
      t.teile.forEach(merkeAmPlatz)
      return
    }
    for (const z of t.zweige) {
      for (const s of z.spulen) amPlatz.add(s.kennzeichen)
      if (z.kontakt && eigenesKontaktSymbol(z.kontakt, symbole)) amPlatz.add(z.kontakt.kennzeichen)
    }
  }
  teile.forEach(merkeAmPlatz)

  const knxGeraete = baum.kanalGeraete.filter((g) => g.geraet.knxAktor)
  const aktoren = zeichneAktoren(
    () => {
      const blatt = blattFuerPlan()
      blaetter.push(blatt)
      return blatt
    },
    knxGeraete,
    box,
  )
  const geraete = baum.betriebsmittel.filter(
    (b) =>
      b.inBestueckung &&
      !b.knxAktor &&
      b.buchstabe !== 'F' &&
      b.buchstabe !== 'X' &&
      !amPlatz.has(b.kennzeichen) &&
      katalog.some((c) => c.id === b.catalogComponentId),
  )
  stelleGeraeteAuf(
    () => {
      const blatt = blattFuerPlan()
      blaetter.push(blatt)
      return blatt
    },
    geraete.map((b) => ({
      katalog: katalog.find((c) => c.id === b.catalogComponentId)!,
      kennzeichen: b.kennzeichen,
      variablen: b.variablen,
    })),
    box,
  )
  for (const blatt of blaetter) blatt.objekte.push(pruefhinweisText(blatt, box, tp))
  zeichnung.blaetter = blaetter
  zeichnung.aktivesBlattId = blaetter[0].id
  return {
    zeichnung,
    stromkreise: stromkreise.size,
    rcd: baum.knoten.filter((k) => k.rolle === 'rcd').length,
    hinweise,
    aktoren,
  }
}

const PRUEFHINWEIS_HOEHE = 0.1

function pruefhinweisText(
  blatt: Blatt,
  box: { min: Point; max: Point },
  tp: Uebersetzer,
): TextObjekt {
  return {
    ...neueObjektBasis(ebeneFuer(blatt, 'text')),
    type: 'text',
    position: {
      x: box.min.x + RAND + LINKS_FREI,
      y: box.max.y - (RASTER + PRUEFHINWEIS_HOEHE) / 2,
    },
    inhalt: tp('generatoren.pruefhinweis'),
    hoehe: PRUEFHINWEIS_HOEHE,
    drehung: 0,
  }
}

interface Symbole {
  katalogVon: KatalogVon
  kontaktKatalog: CatalogComponent | undefined
  triacKatalog: CatalogComponent | undefined
  kontaktPaarKatalog: CatalogComponent | undefined
  klemmstelleKatalog: CatalogComponent | undefined
  leitersatzVon: KatalogVon
}

function teilName(teil: Teil): string {
  if (teil.art === 'gruppe') return teil.kopf.kennzeichen
  return (
    teil.f?.kennzeichen ??
    teil.zweige[0]?.klemmen[0]?.schluessel ??
    t('generatoren.verteilerplan.eineSpalte')
  )
}

function eigenesKontaktSymbol(k: VerteilerKnoten, symbole: Symbole): boolean {
  return !k.kanal && symbole.katalogVon(k)?.betriebsmittelRolle === 'kontaktblock'
}

function brauchtKontaktSymbol(teil: Teil, symbole: Symbole): boolean {
  return teil.art === 'gruppe'
    ? teil.teile.some((t) => brauchtKontaktSymbol(t, symbole))
    : teil.zweige.some((z) => z.kontakt !== null && !eigenesKontaktSymbol(z.kontakt, symbole))
}

function hatJalousiePaar(teil: Teil): boolean {
  return teil.art === 'gruppe'
    ? teil.teile.some(hatJalousiePaar)
    : teil.zweige.some((z) => z.kontakt !== null && knxKanaele(z.kontakt).length === 2)
}

function istKnxKanal(k: VerteilerKnoten): boolean {
  return k.kanal !== undefined && k.geraet.knxAktor !== undefined
}

function knxKanaele(k: VerteilerKnoten): string[] {
  if (!istKnxKanal(k)) return []
  const i = knxKanalIndexAusName(k.kanal ?? '')
  if (i === null) return [k.kanal!]
  return knxPaarBeginn(k.geraet.knxAktor!, i) === i
    ? [knxKanalName(i), knxKanalName(i + 1)]
    : [knxKanalName(i)]
}

function hatDimmKanal(teil: Teil): boolean {
  return teil.art === 'gruppe'
    ? teil.teile.some(hatDimmKanal)
    : teil.zweige.some((z) => z.kontakt !== null && istDimmKanal(z.kontakt))
}

function istDimmKanal(k: VerteilerKnoten): boolean {
  return istKnxKanal(k) && k.geraet.knxAktor?.art === 'dimm'
}

function kontaktKatalogVon(k: VerteilerKnoten, symbole: Symbole): CatalogComponent | undefined {
  if (eigenesKontaktSymbol(k, symbole)) return symbole.katalogVon(k)
  if (istDimmKanal(k)) return symbole.triacKatalog ?? symbole.kontaktKatalog
  return knxKanaele(k).length === 2
    ? (symbole.kontaktPaarKatalog ?? symbole.kontaktKatalog)
    : symbole.kontaktKatalog
}

function sicherungenAnzahl(teil: Teil): number {
  if (teil.art === 'spalte') return teil.f ? 1 : 0
  const kopf = !teil.fortsetzung && (teil.kopf.rolle === 'rcd' || teil.kopf.rolle === 'schutz')
  return (kopf ? 1 : 0) + teil.teile.reduce((n, t) => n + sicherungenAnzahl(t), 0)
}

function passt(teil: Teil, platz: Platz, symbole: Symbole): boolean {
  return (
    teilBreite(teil, symbole) <= platz.breite + EPS &&
    sicherungenAnzahl(teil) <= platz.sicherungen &&
    klemmenAnzahl(teil) <= platz.klemmen
  )
}

function abzug(platz: Platz, teil: Teil, symbole: Symbole): Platz {
  return {
    breite: platz.breite - teilBreite(teil, symbole),
    sicherungen: platz.sicherungen - sicherungenAnzahl(teil),
    klemmen: platz.klemmen - klemmenAnzahl(teil),
  }
}

function teileGruppe(
  gruppe: Gruppe,
  platz: Platz,
  leer: Platz,
  symbole: Symbole,
  fortlaufend = false,
): { vorne: Gruppe; hinten: Gruppe } | null {
  let frei = {
    ...platz,
    sicherungen: platz.sicherungen - sicherungenAnzahl({ ...gruppe, teile: [] }),
  }
  const vorne: Teil[] = []
  let i = 0
  for (; i < gruppe.teile.length; i++) {
    const t = gruppe.teile[i]
    if (!passt(t, frei, symbole)) break
    vorne.push(t)
    frei = abzug(frei, t, symbole)
  }
  if (i === gruppe.teile.length) return null
  const t = gruppe.teile[i]
  let unter =
    t.art === 'gruppe' && (fortlaufend || vorne.length === 0 || !passt(t, leer, symbole))
      ? teileGruppe(t, frei, leer, symbole, fortlaufend)
      : null
  if (unter && fortlaufend && vorne.length > 0 && !passt(unter.vorne, frei, symbole)) unter = null
  if (unter) vorne.push(unter.vorne)
  else if (vorne.length === 0) vorne.push(t)
  const hinten = gruppe.teile.slice(unter || vorne.includes(t) ? i + 1 : i)
  if (unter) hinten.unshift(unter.hinten)
  if (hinten.length === 0) return null
  return {
    vorne: { ...gruppe, teile: vorne, fortgesetzt: true },
    hinten: { ...gruppe, teile: hinten, fortsetzung: true },
  }
}

function klemmenAnzahl(teil: Teil): number {
  if (teil.art === 'spalte') return teil.zweige.reduce((n, z) => n + z.klemmen.length, 0)
  return teil.teile.reduce((n, t) => n + klemmenAnzahl(t), 0)
}

function kopfTiefe(teil: Teil): number {
  return teil.art === 'gruppe' ? 1 + Math.max(0, ...teil.teile.map(kopfTiefe)) : 0
}

function hatSpulen(teil: Teil): boolean {
  return teil.art === 'gruppe'
    ? teil.teile.some(hatSpulen)
    : teil.zweige.some((z) => z.spulen.length > 0)
}

function masse(k: CatalogComponent): { breite: number; hoehe: number } {
  const hoehe = BASIS_SYMBOL_GROESSE_METER * (k.hoehenFaktor ?? 1)
  const breite = BASIS_SYMBOL_GROESSE_METER * (k.breitenFaktor ?? 1)
  return { breite, hoehe }
}

function zweigBreite(zweig: Zweig, symbole: Symbole): number {
  const verbraucher = [
    ...zweig.klemmen.map((x) => klemmenKatalog(x, symbole)),
    ...zweig.spulen.map((s) => symbole.katalogVon(s)),
  ].reduce(
    (summe, k, i) =>
      summe + (k ? masse(k).breite : BASIS_SYMBOL_GROESSE_METER) + (i > 0 ? RASTER : 0),
    0,
  )
  const kontaktKatalog = zweig.kontakt ? kontaktKatalogVon(zweig.kontakt, symbole) : undefined
  const kontakt = kontaktKatalog ? masse(kontaktKatalog).breite : 0
  return Math.max(verbraucher, kontakt, BASIS_SYMBOL_GROESSE_METER)
}

function spaltenBreite(spalte: Spalte, symbole: Symbole): number {
  const zweige = spalte.zweige.reduce(
    (summe, z, i) => summe + zweigBreite(z, symbole) + (i > 0 ? RASTER : 0),
    0,
  )
  const fKatalog = spalte.f ? symbole.katalogVon(spalte.f) : undefined
  const f = fKatalog ? masse(fKatalog).breite : 0
  return 2 * SPALTEN_RAND + Math.max(zweige, f, BASIS_SYMBOL_GROESSE_METER)
}

function teilBreite(teil: Teil, symbole: Symbole): number {
  if (teil.art === 'spalte') return spaltenBreite(teil, symbole)
  const teile = teil.teile.reduce((s, t) => s + teilBreite(t, symbole), 0)
  const kopfKatalog = teil.fortsetzung ? undefined : symbole.katalogVon(teil.kopf)
  const kopf = kopfKatalog ? masse(kopfKatalog).breite + 2 * SPALTEN_RAND : 0
  return Math.max(teile, kopf)
}

function klemmenKatalog(x: VerteilerKnoten, symbole: Symbole): CatalogComponent | undefined {
  return x.kanal ? (symbole.leitersatzVon(x) ?? symbole.klemmstelleKatalog) : symbole.katalogVon(x)
}

function ebeneFuer(blatt: Blatt, typ: ObjektTyp): string {
  const art = standardEbenenArtFuerTyp(typ)
  return (blatt.ebenen.find((e) => traegtStandardNamen(e, art)) ?? blatt.ebenen[0]).id
}

function mitVariablen(
  texte: readonly KatalogTextElement[] | undefined,
  werte: Record<string, string> | undefined,
): KatalogTextElement[] | undefined {
  if (!texte) return undefined
  return texte.map((t) =>
    t.variable && werte?.[t.variable] !== undefined ? { ...t, text: werte[t.variable] } : t,
  )
}

function instanz(
  blatt: Blatt,
  k: CatalogComponent,
  kennzeichen: string,
  werte?: Record<string, string>,
): KomponentenObjekt {
  const hoehenFaktor = k.hoehenFaktor && k.hoehenFaktor !== 1 ? k.hoehenFaktor : undefined
  return {
    ...neueObjektBasis(ebeneFuer(blatt, 'komponente')),
    type: 'komponente',
    position: { x: 0, y: 0 },
    drehung: 0,
    groesseWelt: BASIS_SYMBOL_GROESSE_METER * (hoehenFaktor ?? 1),
    breiteWelt: k.breitenFaktor ? BASIS_SYMBOL_GROESSE_METER * k.breitenFaktor : undefined,
    hoehenFaktor,
    catalogComponentId: k.id,
    variantId: null,
    dockpunkte: k.dockpunkte,
    fangpunkt: k.fangpunkt,
    textElemente: mitVariablen(k.textElemente, werte),
    ...(k.kombinierbar === false ? { kombinierbar: false } : {}),
    typ: k.typ,
    geraeteKennzeichen: kennzeichen,
    betriebsmittelRolle: k.betriebsmittelRolle,
  }
}

const TEXT_ABSTAND = 0.06

function textVorDenPolen(o: KomponentenObjekt): KomponentenObjekt {
  const p = pole(o)
  if (!o.textElemente?.length || o.dockpunkte?.modus !== 'frei' || p.length === 0) return o
  const punkte = o.dockpunkte.punkte
  const ersterPol = Math.min(...p.map((q) => punkte[q.eingang].xAnteil))
  const breite = o.breiteWelt ?? o.groesseWelt
  return {
    ...o,
    textElemente: o.textElemente.map((t) =>
      t.xAnteil < ersterPol
        ? {
            ...t,
            xAnteil: ersterPol - TEXT_ABSTAND / breite,
            yAnteil: 1 + TEXT_ABSTAND / o.groesseWelt,
            ausrichtungHorizontal: 'rechts',
            ausrichtungVertikal: 'unten',
          }
        : t,
    ),
  }
}

function anDock(o: KomponentenObjekt, index: number, ziel: Point): KomponentenObjekt {
  const d = getDockpoints(o)[index] ?? o.position
  return { ...o, position: { x: o.position.x + ziel.x - d.x, y: o.position.y + ziel.y - d.y } }
}

function linksOben(o: KomponentenObjekt, ziel: Point): KomponentenObjekt {
  const halbX = (o.breiteWelt ?? o.groesseWelt) / 2
  return { ...o, position: { x: ziel.x + halbX, y: ziel.y - o.groesseWelt / 2 } }
}

function pole(o: KomponentenObjekt): { eingang: number; ausgang: number; name: string }[] {
  if (o.dockpunkte?.modus !== 'frei') return []
  const punkte = o.dockpunkte.punkte.map((p, i) => ({ ...p, i }))
  const unten = punkte.filter((p) => !p.trunk && p.yAnteil < 0.5)
  const oben = punkte.filter((p) => !p.trunk && p.yAnteil >= 0.5)
  const gepaart = unten
    .map((a) => {
      const e = oben.reduce<(typeof oben)[number] | null>(
        (best, p) =>
          !best || Math.abs(p.xAnteil - a.xAnteil) < Math.abs(best.xAnteil - a.xAnteil) ? p : best,
        null,
      )
      return e && Math.abs(e.xAnteil - a.xAnteil) < 0.05
        ? { eingang: e.i, ausgang: a.i, name: a.bezeichnung?.trim() ?? '', x: a.xAnteil }
        : null
    })
    .filter((p): p is { eingang: number; ausgang: number; name: string; x: number } => p !== null)
  const namen = gepaart.every((p) => !p.name) ? POLNAMEN[gepaart.length] : undefined
  return [...gepaart]
    .sort((a, b) => a.x - b.x)
    .map((p, i) => ({ eingang: p.eingang, ausgang: p.ausgang, name: namen?.[i] ?? p.name }))
    .sort((a, b) => a.ausgang - b.ausgang)
}

const POLNAMEN: Record<number, readonly string[]> = {
  1: ['L'],
  2: ['L', 'N'],
  3: ['L1', 'L2', 'L3'],
  4: ['L1', 'L2', 'L3', 'N'],
}

function klemmenPole(o: KomponentenObjekt): number {
  return o.dockpunkte?.modus === 'frei' ? o.dockpunkte.punkte.filter((p) => !p.trunk).length : 0
}

function anschlussIndex(o: KomponentenObjekt, name: string): number {
  return o.dockpunkte?.modus === 'frei'
    ? o.dockpunkte.punkte.findIndex((p) => p.bezeichnung?.trim() === name)
    : -1
}

function verbindung(
  blatt: Blatt,
  wegpunkte: Point[],
  start: SchaltverbindungAnschluss,
  ziel: SchaltverbindungAnschluss,
  bezeichnung?: string,
): SchaltverbindungObjekt {
  return {
    ...neueObjektBasis(ebeneFuer(blatt, 'schaltverbindung')),
    type: 'schaltverbindung',
    wegpunkte: ohneDoppelte(wegpunkte),
    start,
    ziel,
    polzahl: 1,
    ...(start.art === 'dock' || ziel.art === 'dock' ? { autoRouting: true } : {}),
    ...(bezeichnung ? { bezeichnung } : {}),
  }
}

function ohneDoppelte(punkte: Point[]): Point[] {
  const ohne = punkte.filter(
    (p, i) => i === 0 || Math.abs(p.x - punkte[i - 1].x) + Math.abs(p.y - punkte[i - 1].y) > 1e-9,
  )
  return ohne.filter((p, i) => {
    if (i === 0 || i === ohne.length - 1) return true
    const a = ohne[i - 1]
    const b = ohne[i + 1]
    return (
      !(Math.abs(a.x - p.x) < 1e-9 && Math.abs(b.x - p.x) < 1e-9) &&
      !(Math.abs(a.y - p.y) < 1e-9 && Math.abs(b.y - p.y) < 1e-9)
    )
  })
}

function kasten(o: KomponentenObjekt): { min: Point; max: Point } {
  const b = (o.breiteWelt ?? o.groesseWelt) / 2
  const h = o.groesseWelt / 2
  return {
    min: { x: o.position.x - b, y: o.position.y - h },
    max: { x: o.position.x + b, y: o.position.y + h },
  }
}

function strecken(punkte: readonly Point[]): [Point, Point][] {
  return punkte.slice(1).map((p, i) => [punkte[i], p])
}

function gleich(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS
}

function aufStrecke(p: Point, [a, b]: [Point, Point]): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const laenge2 = dx * dx + dy * dy
  const t = laenge2 > 0 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / laenge2 : 0
  if (t < -EPS || t > 1 + EPS) return false
  return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y) < EPS
}

function ueberdecken([a, b]: [Point, Point], [c, d]: [Point, Point]): boolean {
  const ueberlapp = (p: number, q: number, r: number, s: number) =>
    Math.min(Math.max(p, q), Math.max(r, s)) - Math.max(Math.min(p, q), Math.min(r, s)) > EPS
  const senkrecht = (p: Point, q: Point) => Math.abs(p.x - q.x) < EPS
  const waagrecht = (p: Point, q: Point) => Math.abs(p.y - q.y) < EPS
  if (senkrecht(a, b) && senkrecht(c, d) && Math.abs(a.x - c.x) < EPS)
    return ueberlapp(a.y, b.y, c.y, d.y)
  if (waagrecht(a, b) && waagrecht(c, d) && Math.abs(a.y - c.y) < EPS)
    return ueberlapp(a.x, b.x, c.x, d.x)
  return false
}

function istFrei(
  objekte: readonly Objekt[],
  weg: readonly Point[],
  ausser: ReadonlySet<string>,
): boolean {
  const eigene = strecken(weg)
  const enden = [weg[0], weg[weg.length - 1]]
  const innen = weg.slice(1, -1)
  for (const o of objekte) {
    if (ausser.has(o.id)) continue
    if (o.type === 'komponente') {
      const k = kasten(o)
      const durch = eigene.some(
        ([a, b]) =>
          Math.min(a.x, b.x) < k.max.x - EPS &&
          Math.max(a.x, b.x) > k.min.x + EPS &&
          Math.min(a.y, b.y) < k.max.y - EPS &&
          Math.max(a.y, b.y) > k.min.y + EPS,
      )
      if (durch) return false
    } else if (o.type === 'schaltverbindung') {
      const andere = strecken(o.wegpunkte)
      if (eigene.some((s) => andere.some((t) => ueberdecken(s, t)))) return false
      const beruehrt = o.wegpunkte.some(
        (p) => !enden.some((e) => gleich(e, p)) && eigene.some((s) => aufStrecke(p, s)),
      )
      if (beruehrt || innen.some((p) => andere.some((t) => aufStrecke(p, t)))) return false
    }
  }
  return true
}

const dock = (o: KomponentenObjekt, i: number): SchaltverbindungAnschluss => ({
  art: 'dock',
  objektId: o.id,
  dockpunktIndizes: [i],
})
const abzweig = (s: SchaltverbindungObjekt): SchaltverbindungAnschluss => ({
  art: 'schaltverbindung',
  objektId: s.id,
})

function schieneFuer(name: string, phase: string | undefined | null): Schiene {
  return name === 'N'
    ? 'N'
    : name === 'L1' || name === 'L2' || name === 'L3'
      ? name
      : ((phase ?? 'L1') as Schiene)
}

type Zuleitung = (name: string, phase: string | undefined) => SchaltverbindungObjekt

interface Fortlauf {
  name: string
  vonLinks: boolean
}

interface BlattRand {
  links: number
  rechts: number
  fortlauf: Map<string, Fortlauf>
}

function zeichneBlatt(
  blatt: Blatt,
  teile: readonly Teil[],
  oben: number,
  links: number,
  rechts: number,
  symbole: Symbole,
  tiefer: number,
  netz: VerteilerNetz,
): Map<string, Fortlauf> {
  const r = reihen(oben, Math.max(0, ...teile.map(kopfTiefe)), teile.some(hatSpulen), tiefer)
  const objekte = blatt.objekte
  const rand: BlattRand = { links, rechts, fortlauf: new Map() }
  const schiene = (leiter: Schiene, y: number) => {
    const name = schienenName(netz, leiter)
    const s: SchaltverbindungObjekt = {
      ...verbindung(
        blatt,
        [
          { x: links + SPALTEN_RAND / 2, y },
          { x: rechts - SPALTEN_RAND / 2, y },
        ],
        { art: 'frei' },
        { art: 'frei' },
        name,
      ),
      bezeichnungNurAmAnfang: true,
      blattverweis: true,
    }
    objekte.push(s)
    rand.fortlauf.set(s.id, { name, vonLinks: true })
    return s
  }
  const schienen = new Map<Schiene, SchaltverbindungObjekt>()
  schienenIm(netz).forEach((name, i) => {
    if (name !== 'PE') schienen.set(name, schiene(name, r.schiene(i)))
  })
  const pe = schiene('PE', r.pe)
  const ausSchienen: Zuleitung = (name, phase) => schienen.get(schieneIm(netz, name, phase))!
  const nUnten: NUnten[] = []
  let x = links + LINKS_FREI
  for (const teil of teile) {
    zeichneTeil(blatt, teil, x, 0, r, symbole, ausSchienen, 'N', pe, nUnten, rand)
    x += teilBreite(teil, symbole)
  }
  verlegeNUnten(blatt, nUnten, r)
  return rand.fortlauf
}

function hatAbzweige(blatt: Blatt, id: string): boolean {
  return blatt.objekte.some(
    (v) =>
      v.type === 'schaltverbindung' &&
      ((v.start.art === 'schaltverbindung' && v.start.objektId === id) ||
        (v.ziel.art === 'schaltverbindung' && v.ziel.objektId === id)),
  )
}

type Ende = 'schiene' | 'gruppe' | 'ausgang' | 'durch'

function ohneToteEnden(blatt: Blatt, ende: (s: SchaltverbindungObjekt) => Ende): void {
  const linien = blatt.objekte.filter(
    (o): o is SchaltverbindungObjekt => o.type === 'schaltverbindung',
  )
  const haengtAn = (a: SchaltverbindungAnschluss, id: string) =>
    a.art === 'schaltverbindung' && a.objektId === id
  const neu = new Map<string, SchaltverbindungObjekt>()
  const weg = new Set<string>()
  for (const s of linien) {
    if (s.start.art !== 'frei' || s.ziel.art !== 'frei') continue
    const art = ende(s)
    if (art === 'durch') continue
    const anliegend = linien.filter((v) => haengtAn(v.start, s.id) || haengtAn(v.ziel, s.id))
    const xs = anliegend.flatMap((v) => [
      ...(haengtAn(v.start, s.id) ? [v.wegpunkte[0].x] : []),
      ...(haengtAn(v.ziel, s.id) ? [v.wegpunkte[v.wegpunkte.length - 1].x] : []),
    ])
    if (xs.length === 0) {
      if (art !== 'ausgang') weg.add(s.id)
      continue
    }
    const [a, b] = s.wegpunkte
    const links = art === 'schiene' ? a.x : Math.min(...xs)
    const rechts = art === 'ausgang' ? b.x : Math.max(...xs)
    if (rechts - links > EPS) {
      neu.set(s.id, {
        ...s,
        wegpunkte: [
          { x: links, y: a.y },
          { x: rechts, y: a.y },
        ],
      })
      continue
    }
    const einzig = anliegend.length === 1 ? anliegend[0] : undefined
    if (
      einzig &&
      !linien.some((v) => haengtAn(v.start, einzig.id) || haengtAn(v.ziel, einzig.id))
    ) {
      weg.add(s.id)
      weg.add(einzig.id)
    }
  }
  blatt.objekte = blatt.objekte.flatMap((o) => (weg.has(o.id) ? [] : [neu.get(o.id) ?? o]))
}

function vonOben(
  blatt: Blatt,
  quelle: SchaltverbindungObjekt,
  o: KomponentenObjekt,
  eingang: number,
): void {
  const ziel = getDockpoints(o)[eingang]
  const y = quelle.wegpunkte[0].y
  blatt.objekte.push(verbindung(blatt, [{ x: ziel.x, y }, ziel], abzweig(quelle), dock(o, eingang)))
}

function zeichneTeil(
  blatt: Blatt,
  teil: Teil,
  x: number,
  ebene: number,
  r: ReturnType<typeof reihen>,
  symbole: Symbole,
  zuleitung: Zuleitung,
  nName: string,
  pe: SchaltverbindungObjekt,
  nUnten: NUnten[],
  rand: BlattRand,
): void {
  if (teil.art === 'spalte') {
    zeichneSpalte(blatt, teil, x, r, symbole, zuleitung, nName, pe, nUnten)
    return
  }
  const kopf = teil.kopf
  const objekte = blatt.objekte
  const unterSchienen = new Map<string, SchaltverbindungObjekt>()
  const kopfKatalog = symbole.katalogVon(kopf)
  const gruppenBreite = teilBreite(teil, symbole)
  const unterN = kopf.rolle === 'rcd' ? `N-${kopf.kennzeichen}` : nName
  const geteilt = teil.fortsetzung === true || teil.fortgesetzt === true
  if (kopfKatalog) {
    const o = linksOben(
      textVorDenPolen(instanz(blatt, kopfKatalog, kopf.kennzeichen, kopf.geraet.variablen)),
      { x: x + SPALTEN_RAND, y: r.kopfOben(ebene) },
    )
    const kopfPole = pole(o)
    if (!teil.fortsetzung) {
      objekte.push(o)
      for (const p of kopfPole) vonOben(blatt, zuleitung(p.name, kopf.eintrag.phase), o, p.eingang)
    }
    kopfPole.forEach((p, i) => {
      const aus = getDockpoints(o)[p.ausgang]
      const y = aus.y - RASTER - i * LEITER_ABSTAND
      const name =
        p.name === 'N' && kopf.rolle === 'rcd'
          ? unterN
          : geteilt
            ? `${p.name}-${kopf.kennzeichen}`
            : undefined
      const sammel: SchaltverbindungObjekt = {
        ...verbindung(
          blatt,
          [
            { x: teil.fortsetzung ? rand.links + SPALTEN_RAND / 2 : x + SPALTEN_RAND / 2, y },
            {
              x: teil.fortgesetzt
                ? rand.rechts - SPALTEN_RAND / 2
                : x + gruppenBreite - SPALTEN_RAND / 2,
              y,
            },
          ],
          { art: 'frei' },
          { art: 'frei' },
          name,
        ),
        ...(geteilt ? { bezeichnungNurAmAnfang: true, blattverweis: true } : {}),
      }
      objekte.push(sammel)
      if (geteilt && name) rand.fortlauf.set(sammel.id, { name, vonLinks: !!teil.fortsetzung })
      if (!teil.fortsetzung)
        objekte.push(verbindung(blatt, [aus, { x: aus.x, y }], dock(o, p.ausgang), abzweig(sammel)))
      unterSchienen.set(p.name, sammel)
    })
  }
  const darunter: Zuleitung = (name, phase) =>
    unterSchienen.get(name) ??
    unterSchienen.get(phase ?? '') ??
    (name !== 'N' ? unterSchienen.get('L') : undefined) ??
    zuleitung(name, phase)
  let tx = x
  for (const t of teil.teile) {
    zeichneTeil(blatt, t, tx, ebene + 1, r, symbole, darunter, unterN, pe, nUnten, rand)
    tx += teilBreite(t, symbole)
  }
}

interface Ausgang {
  punkt: Point
  quelle: SchaltverbindungAnschluss
  name: string
}

interface NZiel {
  anschluss: SchaltverbindungAnschluss
  punkt: Point
  seitlich?: number
  stummel: Point[]
}

function zeichneSpalte(
  blatt: Blatt,
  spalte: Spalte,
  x0: number,
  r: ReturnType<typeof reihen>,
  symbole: Symbole,
  zuleitung: Zuleitung,
  nName: string,
  pe: SchaltverbindungObjekt,
  nUnten: NUnten[],
): void {
  const objekte = blatt.objekte
  const achse = x0 + SPALTEN_RAND + RASTER / 2
  let ausgaenge: Ausgang[] = []
  const nZiele = new Map<Ausgang | null, NZiel[]>()
  const amN = (quelle: Ausgang | undefined, ziel: NZiel) =>
    nZiele.set(quelle ?? null, [...(nZiele.get(quelle ?? null) ?? []), ziel])

  const fKatalog = spalte.f ? symbole.katalogVon(spalte.f) : undefined
  if (spalte.f && fKatalog) {
    const f0 = instanz(blatt, fKatalog, spalte.f.kennzeichen, spalte.f.geraet.variablen)
    const fPole = pole(f0)
    const f =
      fPole.length > 0
        ? anDock(f0, fPole[0].eingang, { x: achse, y: r.fOben })
        : linksOben(f0, { x: x0 + SPALTEN_RAND, y: r.fOben })
    objekte.push({ ...f, abgangstext: { ausrichtung: 'links' } })
    for (const p of fPole) vonOben(blatt, zuleitung(p.name, spalte.f.eintrag.phase), f, p.eingang)
    ausgaenge = fPole.map((p) => ({
      punkt: getDockpoints(f)[p.ausgang],
      quelle: dock(f, p.ausgang),
      name: p.name,
    }))
  }

  let zx = x0 + SPALTEN_RAND
  for (const zweig of spalte.zweige) {
    const zweigAchse = zx + RASTER / 2
    let zweigAusgaenge = ausgaenge
    const kk = zweig.kontakt
    const eigenes = kk ? eigenesKontaktSymbol(kk, symbole) : false
    const kontaktKatalog = kk ? kontaktKatalogVon(kk, symbole) : undefined
    if (kk && kontaktKatalog) {
      const roh = instanz(
        blatt,
        kontaktKatalog,
        kk.kennzeichen,
        eigenes ? kk.geraet.variablen : undefined,
      )
      const knx = knxKanaele(kk)
      const kontakt0 = eigenes ? roh : mitKanaelen(roh, knx.length > 0 ? knx : [kk.kanal])
      const kpole = pole(kontakt0)
      if (kpole.length > 0) {
        const kontakt = anDock(kontakt0, kpole[0].eingang, { x: zweigAchse, y: r.kOben })
        objekte.push({
          ...kontakt,
          betriebsmittelRolle: 'kontaktblock',
          abgangstext: { ausrichtung: 'links' },
        })
        const punkte = getDockpoints(kontakt)
        const aussen = ausgaenge.filter((a) => a.name !== 'N')
        const n = ausgaenge.find((a) => a.name === 'N')
        const leiter =
          knx.length > 0
            ? kpole.map(() => aussen[0])
            : n && kpole.length > aussen.length
              ? [...aussen, n]
              : aussen
        const geschaltet: Ausgang[] = []
        let ersteZuleitung: { linie: SchaltverbindungObjekt; y: number } | null = null
        kpole.forEach((p, i) => {
          const a = leiter[i]
          if (!a) return
          const eingang = punkte[p.eingang]
          if (ersteZuleitung) {
            const { linie, y } = ersteZuleitung
            objekte.push(
              verbindung(
                blatt,
                [{ x: punkte[kpole[0].eingang].x, y }, { x: eingang.x, y }, eingang],
                abzweig(linie),
                dock(kontakt, p.eingang),
              ),
            )
          } else {
            const y = eingang.y + RASTER / 2
            const linie = verbindung(
              blatt,
              haken(a.punkt, eingang, y),
              a.quelle,
              dock(kontakt, p.eingang),
            )
            objekte.push(linie)
            if (knx.length > 1) ersteZuleitung = { linie, y }
          }
          geschaltet.push({
            punkt: punkte[p.ausgang],
            quelle: dock(kontakt, p.ausgang),
            name: knx.length > 1 ? `L${i + 1}` : a.name,
          })
        })
        zweigAusgaenge = [
          ...geschaltet,
          ...ausgaenge.filter((a) => a.name === 'N' && !leiter.includes(a)),
        ]
      }
    }
    let kx = zx
    let einpolige = 0
    zweig.klemmen.forEach((x, i) => {
      const k = klemmenKatalog(x, symbole)
      if (!k) return
      const roh = instanz(blatt, k, x.kennzeichen, x.kanal ? undefined : x.geraet.variablen)
      const klemme0 = !x.kanal
        ? roh
        : symbole.leitersatzVon(x)
          ? { ...roh, klemmenNummer: x.kanal }
          : mitKlemmstelle(roh, x.kanal)
      const gesetzt =
        i === 0 && klemme0.dockpunkte?.modus === 'frei' && klemme0.dockpunkte.punkte.length > 0
          ? anDock(klemme0, 0, { x: zweigAchse, y: r.xOben })
          : linksOben(klemme0, { x: kx, y: r.xOben })
      const klemme: KomponentenObjekt = { ...gesetzt, abgangstext: { ausrichtung: 'senkrecht' } }
      objekte.push(klemme)
      kx += masse(k).breite + RASTER
      const punkte = getDockpoints(klemme)
      const leiterAusgaenge = zweigAusgaenge.filter((a) => a.name !== 'N')
      const ohneLeiterNamen = leiterAusgaenge.every(
        (a) => anschlussIndex(klemme, a.name) < 0 && anschlussIndex(klemme, 'L1') < 0,
      )
      if (ohneLeiterNamen && klemmenPole(klemme) === 1 && leiterAusgaenge.length > 0) {
        const leiterNr = einpolige++ % leiterAusgaenge.length
        const a = leiterAusgaenge[leiterNr]
        objekte.push(
          verbindung(
            blatt,
            haken(a.punkt, punkte[0], r.leiter(leiterNr)),
            a.quelle,
            dock(klemme, 0),
          ),
        )
      } else
        leiterAusgaenge.forEach((a, leiterNr) => {
          let index = anschlussIndex(klemme, a.name)
          if (index < 0 && a.name === 'L') index = anschlussIndex(klemme, 'L1')
          if (index < 0 && a === zweigAusgaenge[0]) index = 0
          if (index < 0) return
          objekte.push(
            verbindung(
              blatt,
              haken(a.punkt, punkte[index], r.leiter(leiterNr)),
              a.quelle,
              dock(klemme, index),
            ),
          )
        })
      const nIndex = anschlussIndex(klemme, 'N')
      if (nIndex >= 0) {
        const z = punkte[nIndex]
        amN(
          zweigAusgaenge.find((a) => a.name === 'N'),
          {
            anschluss: dock(klemme, nIndex),
            punkt: z,
            stummel: [{ x: z.x, y: z.y + RASTER }, z],
          },
        )
      }
      const peIndex = anschlussIndex(klemme, 'PE')
      if (peIndex >= 0) {
        const z = punkte[peIndex]
        objekte.push(
          verbindung(blatt, [{ x: z.x, y: r.pe }, z], abzweig(pe), dock(klemme, peIndex)),
        )
      }
    })
    for (const spule of zweig.spulen) {
      const k = symbole.katalogVon(spule)
      if (!k) continue
      const roh = instanz(blatt, k, spule.kennzeichen, spule.geraet.variablen)
      const sp = pole(roh)[0]
      if (!sp) continue
      const achse = kx === zx ? zweigAchse : kx + RASTER / 2
      const o = anDock(roh, sp.eingang, { x: achse, y: r.sOben })
      objekte.push({ ...o, betriebsmittelRolle: 'spule' })
      kx += masse(k).breite + RASTER
      const punkte = getDockpoints(o)
      const l = zweigAusgaenge.find((a) => a.name !== 'N')
      if (l)
        objekte.push(
          verbindung(blatt, haken(l.punkt, punkte[sp.eingang]), l.quelle, dock(o, sp.eingang)),
        )
      const a2 = punkte[sp.ausgang]
      amN(
        zweigAusgaenge.find((a) => a.name === 'N'),
        {
          anschluss: dock(o, sp.ausgang),
          punkt: a2,
          seitlich: kasten(o).max.x + RASTER / 2,
          stummel: [{ x: a2.x + RASTER, y: a2.y }, a2],
        },
      )
    }
    zx += zweigBreite(zweig, symbole) + RASTER
  }

  const breite = spaltenBreite(spalte, symbole)
  const rand = x0 + breite - SPALTEN_RAND / 2
  let eigenerN = false
  for (const [quelle, ziele] of nZiele) {
    if (quelle) {
      verlegeEigenenN(blatt, quelle, ziele, r, rand)
      eigenerN = true
    } else
      nUnten.push({
        linie: zuleitung('N', undefined),
        nName,
        ziele,
        links: x0,
        rechts: x0 + breite,
      })
  }
  if (eigenerN && !nZiele.has(null))
    nUnten.push({ linie: null, nName, ziele: [], links: x0, rechts: x0 + breite })
}

type NReihen = Pick<ReturnType<typeof reihen>, 'n' | 'umKontakt'>

interface NUnten {
  linie: SchaltverbindungObjekt | null
  nName: string
  ziele: NZiel[]
  links: number
  rechts: number
}

function verlegeNUnten(blatt: Blatt, liste: readonly NUnten[], r: NReihen): void {
  const laeufe: NUnten[][] = []
  for (const e of liste) {
    const letzter = laeufe[laeufe.length - 1]
    if (e.linie && letzter?.[0].linie?.id === e.linie.id) letzter.push(e)
    else laeufe.push([e])
  }
  laeufe.forEach((lauf, i) => {
    const linie = lauf[0].linie
    const grenzen = {
      links: laeufe[i - 1]?.at(-1)?.rechts ?? -Infinity,
      rechts: laeufe[i + 1]?.[0].links ?? Infinity,
    }
    if (linie) verlegeNLauf(blatt, linie, lauf, grenzen, r)
  })
}

function verlegeNLauf(
  blatt: Blatt,
  linie: SchaltverbindungObjekt,
  lauf: readonly NUnten[],
  grenzen: { links: number; rechts: number },
  r: NReihen,
): void {
  const objekte = blatt.objekte
  const nName = lauf[0].nName
  const ziele = lauf.flatMap((e) => e.ziele)
  const oben = linie.wegpunkte[0].y
  const links = lauf[0].links
  const rechts = lauf[lauf.length - 1].rechts
  const xVon = (z: NZiel) => z.seitlich ?? z.punkt.x
  const stummel = (z: NZiel) =>
    objekte.push(verbindung(blatt, z.stummel, { art: 'frei' }, z.anschluss, nName))

  const vonOben = objekte.flatMap((o) =>
    o.type === 'schaltverbindung' &&
    o.ziel.art === 'schaltverbindung' &&
    o.ziel.objektId === linie.id &&
    o.wegpunkte[0].y > oben + EPS
      ? [o.wegpunkte[o.wegpunkte.length - 1].x]
      : [],
  )
  const ausgaenge = vonOben.filter((x) => x > grenzen.links + EPS && x < grenzen.rechts - EPS)
  const grenzenDerSpalten = [
    links + SPALTEN_RAND / 2,
    ...lauf.slice(1).map((e) => e.links),
    rechts - SPALTEN_RAND / 2,
    rechts,
  ]
  if (ausgaenge.length > 0)
    grenzenDerSpalten.sort((a, b) => Math.abs(a - ausgaenge[0]) - Math.abs(b - ausgaenge[0]))
  const kandidaten = [
    ...ausgaenge,
    ...grenzenDerSpalten,
    ...ziele.filter((z) => z.seitlich === undefined).map(xVon),
  ]
  const ab = kandidaten.find(
    (x) =>
      (!linie.blattverweis || x > linie.wegpunkte[0].x + EPS) &&
      istFrei(
        objekte,
        [
          { x, y: oben },
          { x, y: r.n },
        ],
        new Set([linie.id]),
      ),
  )
  const xs = [...ziele.map(xVon), ...(ab !== undefined ? [ab] : [])]
  const von = Math.min(...xs)
  const bis = Math.max(...xs)
  if (bis - von < EPS) {
    for (const z of ziele)
      if (ab !== undefined && z.seitlich === undefined)
        objekte.push(verbindung(blatt, [{ x: ab, y: oben }, z.punkt], abzweig(linie), z.anschluss))
      else stummel(z)
    return
  }
  const leitung: SchaltverbindungObjekt = {
    ...verbindung(
      blatt,
      [
        { x: von, y: r.n },
        { x: bis, y: r.n },
      ],
      { art: 'frei' },
      { art: 'frei' },
      ab === undefined ? nName : undefined,
    ),
    ...(ab === undefined ? { bezeichnungNurAmAnfang: true } : {}),
  }
  objekte.push(leitung)
  if (ab !== undefined)
    objekte.push(
      verbindung(
        blatt,
        [
          { x: ab, y: oben },
          { x: ab, y: r.n },
        ],
        abzweig(linie),
        abzweig(leitung),
      ),
    )
  for (const z of ziele) {
    if (z.seitlich === undefined) {
      objekte.push(
        verbindung(blatt, [{ x: z.punkt.x, y: r.n }, z.punkt], abzweig(leitung), z.anschluss),
      )
      continue
    }
    const weg = [{ x: z.seitlich, y: r.n }, { x: z.seitlich, y: z.punkt.y }, z.punkt]
    const spule = z.anschluss.art === 'dock' ? z.anschluss.objektId : ''
    if (istFrei(objekte, weg, new Set([leitung.id, spule])))
      objekte.push(verbindung(blatt, weg, abzweig(leitung), z.anschluss))
    else stummel(z)
  }
}

function verlegeEigenenN(
  blatt: Blatt,
  quelle: Ausgang,
  ziele: readonly NZiel[],
  r: NReihen,
  rand: number,
): void {
  const objekte = blatt.objekte
  const klemmen = ziele.filter((z) => z.seitlich === undefined)
  let stamm: SchaltverbindungObjekt | undefined
  if (klemmen.length > 0) {
    const ausser = new Set(quelle.quelle.art === 'dock' ? [quelle.quelle.objektId] : [])
    const gerade = [quelle.punkt, { x: quelle.punkt.x, y: r.n }]
    const herum = [
      quelle.punkt,
      { x: quelle.punkt.x, y: r.umKontakt },
      { x: rand, y: r.umKontakt },
      { x: rand, y: r.n },
    ]
    const versperrt = !istFrei(objekte, gerade, ausser) && quelle.punkt.y > r.umKontakt
    stamm = verlegeN(
      blatt,
      { anschluss: quelle.quelle, weg: versperrt ? herum : gerade },
      klemmen,
      r.n,
    )
  }
  const y = quelle.punkt.y > r.umKontakt ? r.umKontakt : quelle.punkt.y - RASTER / 2
  let vorige: { x: number; linie: SchaltverbindungObjekt } | undefined
  const spulen = ziele
    .filter((z) => z.seitlich !== undefined)
    .sort((a, b) => a.seitlich! - b.seitlich!)
  for (const z of spulen) {
    const rest = [{ x: z.seitlich!, y }, { x: z.seitlich!, y: z.punkt.y }, z.punkt]
    const ab = vorige ? { x: vorige.x, y } : { x: quelle.punkt.x, y }
    const amStamm = stamm && strecken(stamm.wegpunkte).some((t) => aufStrecke(ab, t))
    const linie = vorige
      ? verbindung(blatt, [ab, ...rest], abzweig(vorige.linie), z.anschluss)
      : amStamm && stamm
        ? verbindung(blatt, [ab, ...rest], abzweig(stamm), z.anschluss)
        : verbindung(blatt, [quelle.punkt, ab, ...rest], quelle.quelle, z.anschluss)
    objekte.push(linie)
    vorige = { x: z.seitlich!, linie }
  }
}

function verlegeN(
  blatt: Blatt,
  quelle: { anschluss: SchaltverbindungAnschluss; weg: Point[] },
  ziele: readonly NZiel[],
  y: number,
): SchaltverbindungObjekt {
  const objekte = blatt.objekte
  const bei = (z: NZiel) => z.punkt.x
  const sortiert = [...ziele].sort((a, b) => bei(a) - bei(b))
  const hinauf = (z: NZiel) => [z.punkt, { x: z.punkt.x, y }]
  const herab = (z: NZiel) => [{ x: z.punkt.x, y }, z.punkt]
  if (sortiert.length === 1) {
    const z = sortiert[0]
    const linie = verbindung(blatt, [...quelle.weg, ...herab(z)], quelle.anschluss, z.anschluss)
    objekte.push(linie)
    return linie
  }
  const links = sortiert[0]
  const rechts = sortiert[sortiert.length - 1]
  const leitung = verbindung(
    blatt,
    [...hinauf(links), ...herab(rechts)],
    links.anschluss,
    rechts.anschluss,
  )
  objekte.push(leitung)
  for (const z of sortiert.slice(1, -1))
    objekte.push(verbindung(blatt, herab(z), abzweig(leitung), z.anschluss))
  const x = Math.min(Math.max(quelle.weg[quelle.weg.length - 1].x, bei(links)), bei(rechts))
  const zuleitung = verbindung(blatt, [...quelle.weg, { x, y }], quelle.anschluss, abzweig(leitung))
  objekte.push(zuleitung)
  return zuleitung
}

function leiterFarben(blatt: Blatt): void {
  const n = leiterNetz(blatt, 'N')
  const pe = leiterNetz(blatt, 'PE')
  blatt.objekte = blatt.objekte.map((o) =>
    o.type !== 'schaltverbindung'
      ? o
      : n.has(o.id)
        ? { ...o, farbe: N_LEITER_FARBE }
        : pe.has(o.id)
          ? { ...o, farbe: PE_LEITER_FARBE, zweiteFarbe: PE_LEITER_ZWEITE_FARBE }
          : o,
  )
}

function leiterNetz(blatt: Blatt, leiter: 'N' | 'PE'): Set<string> {
  const linien = blatt.objekte.filter(
    (o): o is SchaltverbindungObjekt => o.type === 'schaltverbindung',
  )
  const anschluesse = new Map<string, Set<number>>()
  for (const o of blatt.objekte) {
    if (o.type !== 'komponente' || o.dockpunkte?.modus !== 'frei') continue
    const treffer = new Set<number>()
    const punkte = o.dockpunkte.punkte
    punkte.forEach((p, i) => {
      if (p.bezeichnung?.trim() === leiter) treffer.add(i)
    })
    const passt = (i: number) => {
      const name = punkte[i]?.bezeichnung?.trim()
      return !name || name === leiter
    }
    for (const p of pole(o))
      if (p.name === leiter && passt(p.eingang) && passt(p.ausgang)) {
        treffer.add(p.eingang)
        treffer.add(p.ausgang)
      }
    for (const p of fluss(o).raus) if (p.name === leiter && passt(p.index)) treffer.add(p.index)
    if (treffer.size > 0) anschluesse.set(o.id, treffer)
  }
  const amLeiter = (a: SchaltverbindungAnschluss) =>
    a.art === 'dock' && a.dockpunktIndizes.some((i) => anschluesse.get(a.objektId)?.has(i))
  const netz = new Set(
    linien
      .filter(
        (s) =>
          s.bezeichnung === leiter ||
          (leiter === 'N' && s.bezeichnung?.startsWith('N-')) ||
          amLeiter(s.start) ||
          amLeiter(s.ziel),
      )
      .map((s) => s.id),
  )
  const imNetz = (a: SchaltverbindungAnschluss) =>
    a.art === 'schaltverbindung' && netz.has(a.objektId)
  for (let neu = true; neu;) {
    neu = false
    for (const s of linien) {
      if (netz.has(s.id)) continue
      const verbunden =
        imNetz(s.start) ||
        imNetz(s.ziel) ||
        linien.some(
          (v) =>
            netz.has(v.id) &&
            [v.start, v.ziel].some((a) => a.art === 'schaltverbindung' && a.objektId === s.id),
        )
      if (verbunden) {
        netz.add(s.id)
        neu = true
      }
    }
  }
  return netz
}

interface Glied {
  katalog: CatalogComponent
  kennzeichen: string
  variablen?: Record<string, string>
  phase: string | undefined
  parallel?: Glied[]
}

function fluss(o: KomponentenObjekt): {
  rein: { index: number; name: string }[]
  raus: { index: number; name: string }[]
} {
  const p = pole(o)
  if (p.length > 0)
    return {
      rein: p.map((q) => ({ index: q.ausgang, name: q.name })),
      raus: p.map((q) => ({ index: q.eingang, name: q.name })),
    }
  if (o.dockpunkte?.modus !== 'frei') return { rein: [], raus: [] }
  const punkte = o.dockpunkte.punkte
    .map((q, index) => ({ ...q, index }))
    .filter((q) => !q.trunk && q.yAnteil >= 0.5)
  const namen = istLeitersatz(o.dockpunkte) ? undefined : KLEMMEN_POLNAMEN[punkte.length]
  return {
    rein: [],
    raus: [...punkte]
      .sort((a, b) => a.xAnteil - b.xAnteil)
      .map((q, i) => ({ index: q.index, name: namen?.[i] ?? q.bezeichnung?.trim() ?? '' })),
  }
}

const KLEMMEN_POLNAMEN: Record<number, readonly string[]> = {
  1: ['L'],
  2: ['L', 'N'],
  3: ['L', 'N', 'PE'],
  4: ['L1', 'L2', 'L3', 'N'],
  5: ['L1', 'L2', 'L3', 'N', 'PE'],
}

export const EINSPEISEKLEMME_KATALOG_ID = {
  drehstrom: 'abgangsklemme-3p-n-pe',
  wechselstrom: 'abgangsklemme-1p-n-pe',
} as const

function einspeiseGlieder(
  blatt: Blatt,
  kette: readonly VerteilerKnoten[],
  parallel: readonly { nach: number; knoten: VerteilerKnoten }[],
  symbole: Symbole,
  katalog: readonly CatalogComponent[],
  vergeben: ReadonlySet<string>,
  hinweise: string[],
  netz: VerteilerNetz,
): Glied[] {
  const gliedVon = (k: VerteilerKnoten): Glied | undefined => {
    const eintrag = k.rolle === 'klemme' ? klemmenKatalog(k, symbole) : symbole.katalogVon(k)
    return eintrag
      ? {
          katalog: eintrag,
          kennzeichen: k.kennzeichen,
          variablen: k.geraet.variablen,
          phase: k.eintrag.phase ?? undefined,
        }
      : undefined
  }
  const proKnoten = kette.map(gliedVon)
  const glieder = proKnoten.filter((g): g is Glied => g !== undefined)
  const wurzelAbleiter: Glied[] = []
  for (const p of parallel) {
    const g = gliedVon(p.knoten)
    if (!g) continue
    const an = proKnoten.slice(0, p.nach).findLast((x) => x !== undefined)
    if (an) an.parallel = [...(an.parallel ?? []), g]
    else wurzelAbleiter.push(g)
  }
  const anErstes = () => {
    if (wurzelAbleiter.length > 0 && glieder.length > 0)
      glieder[0].parallel = [...wurzelAbleiter, ...(glieder[0].parallel ?? [])]
    return glieder
  }
  if (kette[0]?.rolle === 'klemme' || glieder.length === 0) return anErstes()
  const erster = pole(instanz(blatt, glieder[0].katalog, ''))
  const drehstrom =
    netz === 'drehstrom' &&
    (erster.length >= 3 || erster.some((q) => q.name === 'L2' || q.name === 'L3'))
  const id = EINSPEISEKLEMME_KATALOG_ID[drehstrom ? 'drehstrom' : 'wechselstrom']
  const klemme = katalog.find((c) => c.id === id)
  if (!klemme) {
    hinweise.push(t('generatoren.verteilerplan.einspeiseklemmeFehlt'))
    return anErstes()
  }
  let n = 0
  while (vergeben.has(`X${n}`)) n++
  const kennzeichen = `X${n}`
  hinweise.push(t('generatoren.verteilerplan.einspeiseklemmeErgaenzt', { kennzeichen }))
  return [
    {
      katalog: klemme,
      kennzeichen,
      phase: glieder[0].phase,
      ...(wurzelAbleiter.length > 0 ? { parallel: wurzelAbleiter } : {}),
    },
    ...glieder,
  ]
}

export const STANDARD_EINSPEISUNG_KATALOG_IDS: Record<
  VerteilerNetz,
  readonly { id: string; parallel?: true }[]
> = {
  drehstrom: [
    { id: EINSPEISEKLEMME_KATALOG_ID.drehstrom },
    { id: 'sls-schalter-4-polig' },
    { id: 'blitzschutzableiter-4-polig', parallel: true },
    { id: 'zaehler-3-polig' },
    { id: 'schmelzsicherung-3-polig' },
  ],
  wechselstrom: [
    { id: EINSPEISEKLEMME_KATALOG_ID.wechselstrom },
    { id: 'sls-schalter-2-polig' },
    { id: 'blitzschutzableiter-2-polig', parallel: true },
    { id: 'zaehler-2-polig' },
    { id: 'schmelzsicherung-2-polig' },
  ],
}

function standardEinspeisung(
  katalog: readonly CatalogComponent[],
  vergeben: ReadonlySet<string>,
  hinweise: string[],
  netz: VerteilerNetz,
  art: VerteilerArt,
): Glied[] {
  const belegt = [...vergeben]
  const glieder: Glied[] = []
  const fehlend: string[] = []
  let klemme: Glied | undefined
  const reihenfolge: Glied[] = []
  const kette = STANDARD_EINSPEISUNG_KATALOG_IDS[netz]
  for (const glied of art === 'UV' ? kette.slice(0, 1) : kette) {
    const id = glied.id
    const eintrag = katalog.find((c) => c.id === id)
    if (!eintrag) {
      if (!fehlend.includes(id)) fehlend.push(id)
      continue
    }
    const buchstabe = eintrag.kennzeichenBuchstabe?.trim() || 'X'
    let kennzeichen: string
    if (buchstabe === 'X') {
      let n = 0
      while (belegt.includes(`X${n}`)) n++
      kennzeichen = `X${n}`
    } else kennzeichen = naechstesBestueckungsKennzeichen(belegt, buchstabe)
    belegt.push(kennzeichen)
    const neu: Glied = { katalog: eintrag, kennzeichen, phase: undefined }
    reihenfolge.push(neu)
    if (!glied.parallel) {
      if (id === EINSPEISEKLEMME_KATALOG_ID[netz]) klemme = neu
      glieder.push(neu)
    } else if (klemme) klemme.parallel = [neu]
    else reihenfolge.pop()
  }
  if (fehlend.length > 0)
    hinweise.push(t('generatoren.verteilerplan.einspeisungFehlt', { liste: fehlend.join(', ') }))
  if (glieder.length > 0)
    hinweise.push(
      t('generatoren.verteilerplan.einspeisungErgaenzt', {
        liste: reihenfolge.map((g) => `-${g.kennzeichen}`).join(', '),
      }),
    )
  return glieder
}

function zeichneEinspeisung(
  blatt: Blatt,
  glieder: readonly Glied[],
  box: { min: Point; max: Point },
  hinweise: string[],
  netz: VerteilerNetz,
): void {
  const objekte = blatt.objekte
  const links = box.min.x + RAND
  const x = links + 4 * RASTER
  let y = box.min.y + RASTER
  const quellen: Quellen = new Map()
  const geraete: KomponentenObjekt[] = []
  const linieVon = new Map<string, SchaltverbindungObjekt>()
  const stiche: Stiche[] = []
  const daneben = () => Math.max(...geraete.map((g) => kasten(g).max.x)) + RASTER
  let achse: number | undefined
  for (const glied of glieder) {
    const roh = textVorDenPolen(instanz(blatt, glied.katalog, glied.kennzeichen, glied.variablen))
    const unten = linksOben(roh, { x, y: y + roh.groesseWelt })
    const { rein, raus } = fluss(unten)
    const eigene = rein.length > 0 ? rein : raus
    const versatz =
      achse === undefined || eigene.length === 0 ? 0 : achse - linkerAnschluss(unten, eigene)
    const o = { ...unten, position: { x: unten.position.x + versatz, y: unten.position.y } }
    objekte.push(o)
    if (raus.length > 0) achse = linkerAnschluss(o, raus)
    for (const ein of rein) {
      const name = quelleFuer(quellen, ein.name, glied.phase)
      const q = name === undefined ? undefined : quellen.get(name)
      if (!q || name === undefined) continue
      quellen.delete(name)
      const von = getDockpoints(q.o)[q.ausgang]
      const bis = getDockpoints(o)[ein.index]
      let weg = haken(von, bis, bis.y - RASTER / 2)
      if (q.o !== geraete[geraete.length - 1]) {
        const hoehe = bis.y - RASTER
        weg = haken(von, bis, hoehe)
        if (!istFrei(objekte, weg, new Set([q.o.id, o.id]))) {
          const absatz = von.y + RASTER / 2
          const rechts = Math.max(daneben(), kasten(o).max.x + RASTER)
          weg = [
            von,
            { x: von.x, y: absatz },
            { x: rechts, y: absatz },
            { x: rechts, y: hoehe },
            { x: bis.x, y: hoehe },
            bis,
          ]
        }
      }
      const v = verbindung(blatt, weg, dock(q.o, q.ausgang), dock(o, ein.index))
      objekte.push(v)
      linieVon.set(`${q.o.id}:${q.ausgang}`, v)
    }
    for (const a of raus)
      if (a.name) quellen.set(a.name, { o, ausgang: a.index, phase: glied.phase })
    geraete.push(o)
    y = kasten(o).max.y + 3 * RASTER
    let ueber = -Infinity
    for (const a of glied.parallel ?? []) {
      const unten = kasten(o).max.y + 1.5 * RASTER
      const stich = setzeAbleiter(blatt, a, x, unten, ueber, achse, quellen)
      if (!stich) continue
      stiche.push(stich)
      ueber = Math.max(...stich.leiter.map((l) => l.hoehe))
      y = Math.max(y, ueber + RASTER)
    }
  }
  const r = reihen(box.max.y, 1, false)
  const rechts = box.max.x - RAND - SPALTEN_RAND / 2
  const sammel = new Map<Schiene, SchaltverbindungObjekt>()
  const leiter = schienenIm(netz)
  leiter.forEach((name, i) => {
    const s: SchaltverbindungObjekt = {
      ...verbindung(
        blatt,
        [
          { x: links, y: r.schiene(i) },
          { x: rechts, y: r.schiene(i) },
        ],
        { art: 'frei' },
        { art: 'frei' },
        schienenName(netz, name),
      ),
      blattverweis: true,
    }
    sammel.set(name, s)
    objekte.push(s)
  })
  if (y - 3 * RASTER > r.schiene(leiter.length - 1) - RASTER + EPS)
    hinweise.push(t('generatoren.verteilerplan.einspeisekette', { blatt: blatt.name }))
  for (const [name, q] of quellen) {
    const ziel = sammel.get(name === 'PE' ? 'PE' : schieneIm(netz, name, q.phase))
    if (!ziel) continue
    const aus = getDockpoints(q.o)[q.ausgang]
    const oben = ziel.wegpunkte[0].y
    let weg = [aus, { x: aus.x, y: oben }]
    if (!istFrei(objekte, weg, new Set([q.o.id, ziel.id]))) {
      const absatz = aus.y + RASTER / 2
      weg = [aus, { x: aus.x, y: absatz }, { x: daneben(), y: absatz }, { x: daneben(), y: oben }]
    }
    const v = verbindung(blatt, weg, dock(q.o, q.ausgang), abzweig(ziel))
    objekte.push(v)
    linieVon.set(`${q.o.id}:${q.ausgang}`, v)
  }
  for (const stich of stiche) zeichneStiche(blatt, stich, linieVon, hinweise)
  ohneToteEnden(blatt, () => 'ausgang')
}

interface Stiche {
  o: KomponentenObjekt
  leiter: {
    index: number
    quelle: { o: KomponentenObjekt; ausgang: number } | undefined
    hoehe: number
  }[]
  pe: { index: number; quelle: { o: KomponentenObjekt; ausgang: number } | undefined } | undefined
}

function setzeAbleiter(
  blatt: Blatt,
  glied: Glied,
  x: number,
  y: number,
  ueber: number,
  achse: number | undefined,
  quellen: Quellen,
): Stiche | undefined {
  const roh = textVorDenPolen(instanz(blatt, glied.katalog, glied.kennzeichen, glied.variablen))
  const unten = linksOben(roh, { x, y: y + roh.groesseWelt })
  if (unten.dockpunkte?.modus !== 'frei') return undefined
  const punkte = unten.dockpunkte.punkte.map((q, index) => ({ ...q, index }))
  const oben = punkte
    .filter((q) => !q.trunk && q.yAnteil >= 0.5)
    .sort((a, b) => a.xAnteil - b.xAnteil)
  if (oben.length === 0) return undefined
  const rand = Math.max(
    ...blatt.objekte.flatMap((o) => (o.type === 'komponente' ? [kasten(o).max.x] : [])),
  )
  const ersterPol = getDockpoints(unten)[oben[0].index].x
  const bezug = achse ?? ersterPol
  const ziel =
    bezug +
    Math.ceil((rand + RASTER + ersterPol - kasten(unten).min.x - bezug) / RASTER - EPS) * RASTER
  const o = {
    ...unten,
    position: { x: unten.position.x + ziel - ersterPol, y: unten.position.y },
  }
  blatt.objekte.push(o)
  const lage = getDockpoints(o)
  const oberkante = Math.max(ueber, ...oben.map((q) => lage[q.index].y))
  const quelle = (name: string) => {
    const schluessel = quelleFuer(quellen, name, glied.phase)
    const q = schluessel === undefined ? undefined : quellen.get(schluessel)
    return q ? { o: q.o, ausgang: q.ausgang } : undefined
  }
  const pe = punkte.find((q) => !q.trunk && q.yAnteil < 0.5)
  return {
    o,
    leiter: oben.map((q, i) => ({
      index: q.index,
      quelle: quelle(q.bezeichnung?.trim() ?? ''),
      hoehe: oberkante + ((i + 1) * RASTER) / 2,
    })),
    pe: pe ? { index: pe.index, quelle: quelle('PE') } : undefined,
  }
}

function zeichneStiche(
  blatt: Blatt,
  stich: Stiche,
  linieVon: ReadonlyMap<string, SchaltverbindungObjekt>,
  hinweise: string[],
): void {
  const lage = getDockpoints(stich.o)
  const ziele = [
    ...stich.leiter,
    ...(stich.pe ? [{ ...stich.pe, hoehe: lage[stich.pe.index].y - RASTER / 2 }] : []),
  ]
  const fehlt: string[] = []
  for (const z of ziele) {
    const von = lage[z.index]
    const linie = z.quelle ? linieVon.get(`${z.quelle.o.id}:${z.quelle.ausgang}`) : undefined
    const auf = linie ? senkrechtAuf(linie.wegpunkte, z.hoehe) : undefined
    if (!linie || auf === undefined) {
      fehlt.push(anschlussName(stich.o, z.index))
      continue
    }
    blatt.objekte.push(
      verbindung(
        blatt,
        [von, { x: von.x, y: z.hoehe }, { x: auf, y: z.hoehe }],
        dock(stich.o, z.index),
        abzweig(linie),
      ),
    )
  }
  if (fehlt.length > 0)
    hinweise.push(
      t('generatoren.verteilerplan.nichtAngeschlossen', {
        kennzeichen: stich.o.geraeteKennzeichen ?? '',
        liste: fehlt.join(', '),
      }),
    )
}

function senkrechtAuf(wegpunkte: readonly Point[], y: number): number | undefined {
  for (let i = 1; i < wegpunkte.length; i++) {
    const a = wegpunkte[i - 1]
    const b = wegpunkte[i]
    if (Math.abs(a.x - b.x) < EPS && Math.min(a.y, b.y) < y - EPS && Math.max(a.y, b.y) > y + EPS)
      return a.x
  }
  return undefined
}

function anschlussName(o: KomponentenObjekt, index: number): string {
  const p = o.dockpunkte?.modus === 'frei' ? o.dockpunkte.punkte[index] : undefined
  return p?.bezeichnung?.trim() || `${index + 1}`
}

function linkerAnschluss(o: KomponentenObjekt, liste: readonly { index: number }[]): number {
  const punkte = getDockpoints(o)
  return Math.min(...liste.map((q) => punkte[q.index].x))
}

type Quellen = Map<string, { o: KomponentenObjekt; ausgang: number; phase: string | undefined }>

function quelleFuer(quellen: Quellen, name: string, phase: string | undefined): string | undefined {
  if (!name) return undefined
  if (quellen.has(name)) return name
  if (name === 'L') return quellen.has(phase ?? 'L1') ? (phase ?? 'L1') : undefined
  const l = quellen.get('L')
  return l && (l.phase ?? 'L1') === name ? 'L' : undefined
}

function haken(von: Point, bis: Point, y = bis.y + RASTER / 2): Point[] {
  if (Math.abs(von.x - bis.x) < 1e-9) return [von, bis]
  return [von, { x: von.x, y }, { x: bis.x, y }, bis]
}

function mitKanaelen(
  o: KomponentenObjekt,
  kanaele: readonly (string | undefined)[],
): KomponentenObjekt {
  if (o.dockpunkte?.modus !== 'frei') return o
  const benannt = pole(o).slice(0, kanaele.length)
  if (benannt.length === 0) return o
  return {
    ...o,
    dockpunkte: {
      ...o.dockpunkte,
      punkte: o.dockpunkte.punkte.map((punkt, i) => {
        const j = benannt.findIndex((p) => p.ausgang === i)
        if (j >= 0) return { ...punkt, bezeichnung: kanaele[j] ?? punkt.bezeichnung }
        return benannt.some((p) => p.eingang === i) ? { ...punkt, bezeichnung: undefined } : punkt
      }),
    },
  }
}

function mitKlemmstelle(o: KomponentenObjekt, kanal: string): KomponentenObjekt {
  if (o.dockpunkte?.modus !== 'frei' || o.dockpunkte.punkte.length === 0) return o
  return {
    ...o,
    dockpunkte: {
      ...o.dockpunkte,
      punkte: o.dockpunkte.punkte.map((punkt, i) =>
        i === 0 ? { ...punkt, bezeichnung: kanal } : punkt,
      ),
    },
  }
}

const GERAETE_ABSTAND = 1.2

function stelleGeraeteAuf(
  neuesBlatt: () => Blatt,
  geraete: readonly {
    katalog: CatalogComponent
    kennzeichen: string
    variablen: Record<string, string>
  }[],
  box: { min: Point; max: Point },
): void {
  if (geraete.length === 0) return
  let blatt = neuesBlatt()
  const oben = box.max.y - GERAETE_ABSTAND
  const links = box.min.x + RAND + LINKS_FREI
  let x = links
  let y = oben
  let zeilenHoehe = 0
  for (const e of geraete) {
    const { breite, hoehe } = masse(e.katalog)
    if (x + breite > box.max.x - RAND && x > links) {
      x = links
      y -= zeilenHoehe + GERAETE_ABSTAND
      zeilenHoehe = 0
    }
    if (y - hoehe - GERAETE_ABSTAND / 2 < box.min.y && y < oben) {
      blatt = neuesBlatt()
      x = links
      y = oben
      zeilenHoehe = 0
    }
    const o = linksOben(instanz(blatt, e.katalog, e.kennzeichen, e.variablen), { x, y })
    blatt.objekte.push(
      kennbuchstabeVon(e.kennzeichen) === 'K' && !o.betriebsmittelRolle
        ? { ...o, betriebsmittelRolle: 'spule' }
        : o,
    )
    x += breite + 2 * RASTER
    zeilenHoehe = Math.max(zeilenHoehe, hoehe)
  }
}

const AKTOR_UNTEN = 1

const aufRaster = (v: number) => Math.round(v / RASTER) * RASTER

function zeichneAktoren(
  neuesBlatt: () => Blatt,
  geraete: readonly KanalGeraet[],
  box: { min: Point; max: Point },
): VerteilerplanErgebnis['aktoren'] {
  const ergebnis: VerteilerplanErgebnis['aktoren'] = []
  let blatt: Blatt | null = null
  let y = 0
  const oben = box.max.y - RAND - RASTER
  for (const g of geraete) {
    const daten = g.geraet.knxAktor!
    const felder = knxAktorInstanzFelder(daten)
    if (!blatt || y - felder.groesseWelt - AKTOR_UNTEN < box.min.y + RAND) {
      blatt = neuesBlatt()
      y = oben
    }
    const roh: KomponentenObjekt = {
      ...neueObjektBasis(ebeneFuer(blatt, 'komponente')),
      type: 'komponente',
      position: { x: 0, y: 0 },
      drehung: 0,
      catalogComponentId: knxAktorKatalogId(daten.art),
      variantId: null,
      kombinierbar: false,
      ...felder,
      geraeteKennzeichen: g.geraet.kennzeichen,
      betriebsmittelRolle: 'spule',
    }
    const gesetzt = linksOben(roh, { x: box.min.x + RAND + 2 * RASTER, y })
    const fang = getFangpunkt(gesetzt)
    const o: KomponentenObjekt = {
      ...gesetzt,
      position: {
        x: gesetzt.position.x + aufRaster(fang.x) - fang.x,
        y: gesetzt.position.y + aufRaster(fang.y) - fang.y,
      },
    }
    blatt.objekte.push(o)
    ergebnis.push({
      kennzeichen: g.geraet.kennzeichen,
      titel: knxAktorTitel(daten),
      baugroesse: daten.baugroesse,
      belegt: belegteKanaele(g, daten),
    })
    y = kasten(o).min.y - AKTOR_UNTEN
  }
  return ergebnis
}

function belegteKanaele(g: KanalGeraet, daten: KnxAktorDaten): number {
  const belegt = new Set<number>()
  for (const k of g.kanaele) {
    const i = knxKanalIndexAusName(k.kanal ?? '')
    if (i === null || i >= daten.baugroesse) continue
    belegt.add(i)
    if (knxPaarBeginn(daten, i) === i) belegt.add(i + 1)
  }
  return belegt.size
}
