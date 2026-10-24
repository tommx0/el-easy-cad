import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'
import type { CatalogComponent } from './catalog'
import { aufgeloesteVariante } from './catalog'
import { bestueckungEntfernen, neueBestueckungsEintraege } from './bestueckung'
import {
  ermittleKnxZiele,
  KLEMME_3P_N_PE,
  knxKanalartVon,
  planeKnxZuordnung,
  wendeKnxZuordnungAn,
  type KnxZuordnungPlan,
} from './knx-zuordnung'
import { nameAusRaum } from './gruppe-bilden'
import { planUebersetzer, spracheDesUebersetzers } from './plansprache'
import type {
  BestueckungsEintrag,
  KomponentenObjekt,
  RaumAuswahl,
  RaumObjekt,
  StromkreisQuelle,
} from './objekte'
import {
  knxQuellenZiel,
  quellenSchluessel,
  raumDerKomponente,
  raumstromkreisRaum,
  stromkreisQuelleVon,
  wirksamePolzahl,
  wirksamerStromkreis,
} from './stromkreis-eigenschaft'
import { alleVerteiler } from './verteiler'
import {
  assistentVerteiler,
  EINSPEISE_KLEMMENLEISTE,
  SCHNELLVORGABE_KATALOG_ID,
  startBestueckung,
  type Schnellvorgabe,
} from './verteiler-assistent'
import {
  baueVerteilerBaum,
  ermittleStromweg,
  istParallelerAbleiter,
  type VerteilerKnoten,
} from './verteiler-baum'
import { geraeteZusammenfassung, kennbuchstabeVon } from './verteiler-belegung'
import type { Zeichnung } from './zeichnung'

export function raumAuswahlSchluessel(a: RaumAuswahl): string {
  return `${a.blattId}#${a.raumId ?? ''}`
}

export interface RaumEintrag {
  blattId: string
  raumId?: string
  name: string
  anzahl: number
  gemeinsamMit?: string
  versorgtVon?: string
}

export interface BlattRaeume {
  blattId: string
  blattName: string
  raeume: RaumEintrag[]
}

function raumName(raum: RaumObjekt, uebersetze: Uebersetzer = t): string {
  return raum.name.trim() || uebersetze('generatoren.ersatz.raum')
}

function istVerbraucherKandidat(o: KomponentenObjekt): boolean {
  return !o.verteiler && !o.knxAktor
}

export function raeumeZurAuswahl(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  verteilerId: string | null,
): BlattRaeume[] {
  const versorger = new Map<string, string>()
  for (const { verteiler: v } of alleVerteiler(zeichnung)) {
    if (v.id === verteilerId) continue
    const text = `+${v.verteiler?.kennzeichen ?? ''}`
    for (const a of v.verteiler?.raeume ?? []) versorger.set(raumAuswahlSchluessel(a), text)
    for (const e of v.verteiler?.bestueckung ?? [])
      if (e.quelle?.art === 'raum')
        versorger.set(
          raumAuswahlSchluessel({ blattId: e.quelle.blattId, raumId: e.quelle.raumId }),
          text,
        )
  }
  return zeichnung.blaetter.flatMap((blatt) => {
    const raeume = blatt.objekte.filter((o): o is RaumObjekt => o.type === 'raum')
    const anzahl = new Map<string, number>()
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente' || !istVerbraucherKandidat(o)) continue
      if (wirksamerStromkreis(o, zeichnung, katalog) === 'kein') continue
      const k = raumDerKomponente(blatt.objekte, o)?.id ?? ''
      anzahl.set(k, (anzahl.get(k) ?? 0) + 1)
    }
    const eintraege: RaumEintrag[] = raeume
      .map((r) => {
        const ziel = raumstromkreisRaum(blatt.objekte, r)
        const e: RaumEintrag = {
          blattId: blatt.id,
          raumId: r.id,
          name: raumName(r),
          anzahl: anzahl.get(r.id) ?? 0,
        }
        if (ziel.id !== r.id) e.gemeinsamMit = raumName(ziel)
        const von = versorger.get(raumAuswahlSchluessel(e))
        if (von) e.versorgtVon = von
        return e
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }))
    const ohne = anzahl.get('') ?? 0
    if (ohne > 0) {
      const e: RaumEintrag = {
        blattId: blatt.id,
        name: t('generatoren.vorschlag.ohneRaum'),
        anzahl: ohne,
      }
      const von = versorger.get(raumAuswahlSchluessel(e))
      if (von) e.versorgtVon = von
      eintraege.push(e)
    }
    return eintraege.length > 0
      ? [{ blattId: blatt.id, blattName: blatt.name, raeume: eintraege }]
      : []
  })
}

export function vorauswahlRaeume(
  liste: readonly BlattRaeume[],
  gemerkt: readonly RaumAuswahl[] | undefined,
): RaumAuswahl[] {
  if (gemerkt) return [...gemerkt]
  return liste.flatMap((b) =>
    b.raeume
      .filter((r) => r.anzahl > 0 && !r.versorgtVon)
      .map((r) => (r.raumId ? { blattId: r.blattId, raumId: r.raumId } : { blattId: r.blattId })),
  )
}

export interface VorschlagBauteil {
  blattId: string
  objekt: KomponentenObjekt
}

export interface VorschlagKnx {
  quelle: Extract<StromkreisQuelle, { art: 'knx' }>
  beschriftung: string
  bauteile: VorschlagBauteil[]
}

export interface VorschlagStromkreis {
  quelle: Extract<StromkreisQuelle, { art: 'raum' | 'eigen' }>
  blattId: string
  blattName: string
  beschriftung: string
  polzahl: 1 | 3
  bauteile: VorschlagBauteil[]
  knx: VorschlagKnx[]
}

export interface GesammelteStromkreise {
  stromkreise: VorschlagStromkreis[]
  hinweise: string[]
}

function komponentenName(
  o: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer = t,
): string {
  const k = katalog.find((x) => x.id === o.catalogComponentId)
  return k
    ? aufgeloesteVariante(k, o.variantId, spracheDesUebersetzers(uebersetze)).name
    : uebersetze('generatoren.ersatz.komponente')
}

function rangImRaum(q: VorschlagStromkreis['quelle']): number {
  if (q.art === 'eigen') return 1000
  return q.nummer ?? 0
}

export function sammleStromkreise(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  auswahl: readonly RaumAuswahl[],
): GesammelteStromkreise {
  const gewaehlt = new Set(auswahl.map(raumAuswahlSchluessel))
  const knxZiele = ermittleKnxZiele(zeichnung, katalog)
  const kreise = new Map<string, VorschlagStromkreis & { raumNamen: string[] }>()
  const knxNach = new Map<string, { kreis: VorschlagStromkreis; knx: VorschlagKnx }>()
  const hinweise: string[] = []
  const reihenfolge: string[] = []
  const tp = planUebersetzer(zeichnung)

  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente' || !istVerbraucherKandidat(o)) continue
      const eigenerRaum = raumDerKomponente(blatt.objekte, o)
      if (!gewaehlt.has(raumAuswahlSchluessel({ blattId: blatt.id, raumId: eigenerRaum?.id })))
        continue
      const quelle = stromkreisQuelleVon(zeichnung, blatt.id, o, katalog)
      if (!quelle) continue
      const schluessel = quellenSchluessel(quelle)
      let kreis = kreise.get(schluessel)
      if (!kreis) {
        kreis = {
          quelle,
          blattId: blatt.id,
          blattName: blatt.name,
          beschriftung: '',
          polzahl: quelle.art === 'eigen' ? wirksamePolzahl(o, katalog) : 1,
          bauteile: [],
          knx: [],
          raumNamen: [],
        }
        kreise.set(schluessel, kreis)
        reihenfolge.push(schluessel)
      }
      const name = eigenerRaum ? raumName(eigenerRaum, tp) : null
      if (name && !kreis.raumNamen.includes(name)) kreis.raumNamen.push(name)
      if (quelle.art === 'eigen') {
        const ort = eigenerRaum ? raumName(eigenerRaum, tp) : blatt.name
        kreis.beschriftung = o.beschriftung?.trim() || `${ort} ${komponentenName(o, katalog, tp)}`
      }

      const istKnx = knxZiele.has(`${blatt.id}#${o.id}`)
      if (!istKnx || knxKanalartVon(o, zeichnung).kanalart === null) {
        kreis.bauteile.push({ blattId: blatt.id, objekt: o })
        continue
      }
      const knxQuelle = { art: 'knx' as const, ziel: knxQuellenZiel(blatt.id, o) }
      const knxSchluessel = quellenSchluessel(knxQuelle)
      const vorhanden = knxNach.get(knxSchluessel)
      if (vorhanden) {
        vorhanden.knx.bauteile.push({ blattId: blatt.id, objekt: o })
        if (vorhanden.kreis !== kreis) {
          const gruppe = zeichnung.geraeteGruppen.find(
            (g) => knxQuelle.ziel.art === 'gruppe' && g.id === knxQuelle.ziel.gruppeId,
          )
          const text = t('generatoren.vorschlag.knxGruppeMehrereKreise', {
            gruppe: gruppe?.name?.trim() || t('generatoren.ersatz.geraetegruppe'),
            kreis: vorhanden.kreis.beschriftung || vorhanden.kreis.blattName,
          })
          if (!hinweise.includes(text)) hinweise.push(text)
        }
        continue
      }
      const gruppenName =
        o.gruppeId && zeichnung.geraeteGruppen.find((g) => g.id === o.gruppeId)?.name?.trim()
      const knx: VorschlagKnx = {
        quelle: knxQuelle,
        beschriftung:
          gruppenName ||
          o.beschriftung?.trim() ||
          nameAusRaum(zeichnung, blatt.id, o) ||
          komponentenName(o, katalog, tp),
        bauteile: [{ blattId: blatt.id, objekt: o }],
      }
      kreis.knx.push(knx)
      knxNach.set(knxSchluessel, { kreis, knx })
    }
  }

  const raumNameVon = (blattId: string, raumId: string | undefined) => {
    const r = zeichnung.blaetter
      .find((b) => b.id === blattId)
      ?.objekte.find((o): o is RaumObjekt => o.type === 'raum' && o.id === raumId)
    return r ? raumName(r, tp) : null
  }
  for (const kreis of kreise.values()) {
    if (kreis.quelle.art !== 'raum') continue
    const ziel = raumNameVon(kreis.blattId, kreis.quelle.raumId)
    const kopf = ziel
      ? [
          ziel,
          ...kreis.raumNamen.filter((n) => n !== ziel).sort((a, b) => a.localeCompare(b, 'de')),
        ].join(', ')
      : tp('generatoren.vorschlag.blattOhneRaum', { blatt: kreis.blattName })
    kreis.beschriftung = kreis.quelle.nummer ? `${kopf} ${kreis.quelle.nummer}` : kopf
  }

  const blattIndex = new Map(zeichnung.blaetter.map((b, i) => [b.id, i]))
  const stromkreise = reihenfolge
    .map((k) => kreise.get(k)!)
    .sort((a, b) => {
      const blatt = blattIndex.get(a.blattId)! - blattIndex.get(b.blattId)!
      if (blatt !== 0) return blatt
      const raumA = a.quelle.art === 'raum' ? a.quelle.raumId : raumVon(zeichnung, a)
      const raumB = b.quelle.art === 'raum' ? b.quelle.raumId : raumVon(zeichnung, b)
      const nameA = raumA ? (raumNameVon(a.blattId, raumA) ?? '') : '￿'
      const nameB = raumB ? (raumNameVon(b.blattId, raumB) ?? '') : '￿'
      const raum = nameA.localeCompare(nameB, 'de', { numeric: true })
      if (raum !== 0) return raum
      return rangImRaum(a.quelle) - rangImRaum(b.quelle)
    })
    .map(({ raumNamen: _r, ...k }) => {
      void _r
      return k
    })
  return { stromkreise, hinweise }
}

function raumVon(zeichnung: Zeichnung, kreis: VorschlagStromkreis): string | undefined {
  if (kreis.quelle.art !== 'eigen') return undefined
  const objektId = kreis.quelle.objektId
  const blatt = zeichnung.blaetter.find((b) => b.id === kreis.blattId)
  const o = blatt?.objekte.find((x) => x.id === objektId)
  return blatt && o?.type === 'komponente' ? raumDerKomponente(blatt.objekte, o)?.id : undefined
}

export interface VorschlagZeile {
  quelle: StromkreisQuelle
  blattName: string
  beschriftung: string
  knx: boolean
  polzahl: 1 | 3
  bauteile: string
  vorhanden: boolean
}

export interface VorschlagVerwaist {
  eintragId: string
  text: string
}

export interface VerteilerVorschlag {
  liste: BestueckungsEintrag[]
  zeilen: VorschlagZeile[]
  verwaist: VorschlagVerwaist[]
  hinweise: string[]
  fehlend: string[]
  knx: KnxZuordnungPlan | null
  entfernt: Set<string>
}

export interface VorschlagEingabe {
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  bestueckung: readonly BestueckungsEintrag[]
  verteiler?: KomponentenObjekt | null
  kennzeichen?: string
  auswahl: readonly RaumAuswahl[]
  vorgabe: Schnellvorgabe
}

export interface VorschlagOptionen {
  verwaistEntfernen?: ReadonlySet<string>
  knxReserve?: number | null
}

function einspeiseEnde(
  liste: readonly BestueckungsEintrag[],
  katalog: readonly CatalogComponent[],
): string | undefined {
  const baum = baueVerteilerBaum(assistentVerteiler('', [...liste]), katalog)
  const gehoertZurKette = (k: VerteilerKnoten) => {
    if (k.eintrag.quelle) return false
    if (k.rolle === 'klemme') return k.kennzeichen === EINSPEISE_KLEMMENLEISTE
    if (k.rolle === 'schutz') return !k.kinder.some((c) => c.rolle === 'klemme')
    return k.rolle === 'sonstige'
  }
  const inReihe = (knoten: readonly VerteilerKnoten[]) =>
    knoten.filter((k) => !istParallelerAbleiter(k))
  const wurzeln = inReihe(baum.wurzeln)
  if (wurzeln.length !== 1 || !gehoertZurKette(wurzeln[0])) return undefined
  let aktuell = wurzeln[0]
  while (inReihe(aktuell.kinder).length === 1 && gehoertZurKette(inReihe(aktuell.kinder)[0]))
    aktuell = inReihe(aktuell.kinder)[0]
  return aktuell.eintrag.id
}

function mitTyp(e: BestueckungsEintrag, typ: string): BestueckungsEintrag {
  const wert = typ.trim()
  return wert ? { ...e, variablen: { ...e.variablen, Typ: wert } } : e
}

function istSchutz(e: BestueckungsEintrag): boolean {
  return kennbuchstabeVon(e.kennzeichen).toUpperCase() === 'F' && !e.kanal
}

function istKlemme(e: BestueckungsEintrag): boolean {
  return kennbuchstabeVon(e.kennzeichen).toUpperCase() === 'X'
}

export function planeVorschlag(
  eingabe: VorschlagEingabe,
  optionen: VorschlagOptionen = {},
): VerteilerVorschlag {
  const { zeichnung, katalog, vorgabe } = eingabe
  const fehlend: string[] = []
  const eintrag = (id: string) => {
    const k = katalog.find((c) => c.id === id)
    if (!k && !fehlend.includes(id)) fehlend.push(id)
    return k
  }
  const netz = vorgabe.drehstrom ? 'drehstrom' : 'wechselstrom'
  const gesammelt = sammleStromkreise(zeichnung, katalog, eingabe.auswahl)
  const hinweise = [...gesammelt.hinweise]

  const gebraucht = new Set<string>()
  for (const k of gesammelt.stromkreise) {
    gebraucht.add(quellenSchluessel({ art: 'blatt', blattId: k.blattId }))
    gebraucht.add(quellenSchluessel(k.quelle))
    for (const x of k.knx) gebraucht.add(quellenSchluessel(x.quelle))
  }
  const verwaist: VorschlagVerwaist[] = eingabe.bestueckung
    .filter((e) => e.quelle && !gebraucht.has(quellenSchluessel(e.quelle)))
    .map((e) => ({
      eintragId: e.id,
      text: `-${e.kanal ? `${e.kennzeichen}:${e.kanal}` : e.kennzeichen}${e.bezeichnung ? ` „${e.bezeichnung}“` : ''}`,
    }))
  const weg = new Set(
    verwaist
      .map((v) => v.eintragId)
      .filter((id) => !optionen.verwaistEntfernen || optionen.verwaistEntfernen.has(id)),
  )
  const entfernung = weg.size > 0 ? bestueckungEntfernen(eingabe.bestueckung, weg, false) : null
  let liste: BestueckungsEintrag[] = entfernung ? entfernung.liste : [...eingabe.bestueckung]
  const entfernt = entfernung?.entfernteGeraete ?? new Set<string>()

  if (liste.length === 0 && gesammelt.stromkreise.length > 0) {
    const kette = startBestueckung({ ...vorgabe, rcd: 0, lsJeRcd: 0 }, katalog)
    fehlend.push(...kette.fehlend.filter((f) => !fehlend.includes(f)))
    liste = kette.liste
  }
  const ende = einspeiseEnde(liste, katalog)

  const nachQuelle = (q: StromkreisQuelle, art: (e: BestueckungsEintrag) => boolean) =>
    liste.find((e) => e.quelle && art(e) && quellenSchluessel(e.quelle) === quellenSchluessel(q))
  const anhaengen = (
    katalogId: string,
    elternId: string | undefined,
    quelle: StromkreisQuelle,
    bezeichnung: string,
    typ = '',
  ): BestueckungsEintrag | undefined => {
    const k = eintrag(katalogId)
    if (!k) return undefined
    const [neu] = neueBestueckungsEintraege(liste, k, 1, elternId, { katalog })
    if (!neu) return undefined
    let fertig: BestueckungsEintrag = mitTyp({ ...neu, quelle }, typ)
    if (bezeichnung) fertig = { ...fertig, bezeichnung }
    if (!vorgabe.drehstrom && fertig.phase) fertig = { ...fertig, phase: 'L1' }
    liste.push(fertig)
    return fertig
  }

  const zeilen: VorschlagZeile[] = []
  const rcdJeBlatt = new Map<string, string | undefined>()
  for (const kreis of gesammelt.stromkreise) {
    if (!rcdJeBlatt.has(kreis.blattId)) {
      const q: StromkreisQuelle = { art: 'blatt', blattId: kreis.blattId }
      const da = nachQuelle(q, () => true)
      rcdJeBlatt.set(
        kreis.blattId,
        da
          ? da.id
          : vorgabe.rcd > 0
            ? (anhaengen(
                SCHNELLVORGABE_KATALOG_ID.rcd[netz],
                ende,
                q,
                kreis.blattName,
                vorgabe.rcdTyp,
              )?.id ?? ende)
            : ende,
      )
    }
    const hinter = rcdJeBlatt.get(kreis.blattId)
    const dreiphasig = kreis.polzahl === 3 && vorgabe.drehstrom
    if (kreis.polzahl === 3 && !vorgabe.drehstrom)
      hinweise.push(
        t('generatoren.vorschlag.dreiphasigImWechselstrom', { kreis: kreis.beschriftung }),
      )
    const lsDa = nachQuelle(kreis.quelle, istSchutz)
    const ls =
      lsDa ??
      anhaengen(
        dreiphasig ? 'leitungsschutzschalter-3-polig' : SCHNELLVORGABE_KATALOG_ID.ls,
        hinter,
        kreis.quelle,
        kreis.beschriftung,
        vorgabe.lsTyp,
      )
    const klemmeId = dreiphasig ? KLEMME_3P_N_PE : SCHNELLVORGABE_KATALOG_ID.klemme
    let vorhanden = !!lsDa
    if (kreis.bauteile.length > 0) {
      const klemmeDa = nachQuelle(kreis.quelle, istKlemme)
      if (!klemmeDa) {
        vorhanden = false
        anhaengen(klemmeId, ls?.id ?? hinter, kreis.quelle, kreis.beschriftung)
      }
      zeilen.push({
        quelle: kreis.quelle,
        blattName: kreis.blattName,
        beschriftung: kreis.beschriftung,
        knx: false,
        polzahl: kreis.polzahl,
        bauteile: geraeteZusammenfassung(
          kreis.bauteile.map((b) => komponentenName(b.objekt, katalog)),
        ),
        vorhanden,
      })
    }
    for (const knx of kreis.knx) {
      const da = nachQuelle(knx.quelle, istKlemme)
      if (!da) anhaengen(klemmeId, ls?.id ?? hinter, knx.quelle, knx.beschriftung)
      zeilen.push({
        quelle: knx.quelle,
        blattName: kreis.blattName,
        beschriftung: knx.beschriftung,
        knx: true,
        polzahl: kreis.polzahl,
        bauteile: geraeteZusammenfassung(
          knx.bauteile.map((b) => komponentenName(b.objekt, katalog)),
        ),
        vorhanden: !!da,
      })
    }
  }

  let knx: KnxZuordnungPlan | null = null
  if (optionen.knxReserve !== undefined && optionen.knxReserve !== null) {
    const { zeichnung: mit, verteiler } = mitVorschlag(eingabe, liste)
    knx = planeKnxZuordnung(
      { zeichnung: mit, verteiler, katalog },
      { reserveProzent: optionen.knxReserve },
    )
    liste = wendeKnxZuordnungAn(liste, knx)
  }
  return { liste, zeilen, verwaist, hinweise, fehlend, knx, entfernt }
}

export function mitVorschlag(
  eingabe: Pick<VorschlagEingabe, 'zeichnung' | 'verteiler' | 'kennzeichen'>,
  liste: BestueckungsEintrag[],
): { zeichnung: Zeichnung; verteiler: KomponentenObjekt } {
  const { zeichnung } = eingabe
  const alt = eingabe.verteiler
  if (alt?.verteiler) {
    const verteiler: KomponentenObjekt = {
      ...alt,
      verteiler: { ...alt.verteiler, bestueckung: liste },
    }
    return {
      verteiler,
      zeichnung: {
        ...zeichnung,
        blaetter: zeichnung.blaetter.map((b) =>
          b.objekte.some((o) => o.id === alt.id)
            ? { ...b, objekte: b.objekte.map((o) => (o.id === alt.id ? verteiler : o)) }
            : b,
        ),
      },
    }
  }
  const verteiler = assistentVerteiler(eingabe.kennzeichen ?? '', liste)
  return {
    verteiler,
    zeichnung: {
      ...zeichnung,
      blaetter: zeichnung.blaetter.map((b, i) =>
        i === 0 ? { ...b, objekte: [...b.objekte, verteiler] } : b,
      ),
    },
  }
}

export function vorschlagErgebnisse(
  liste: readonly BestueckungsEintrag[],
  katalog: readonly CatalogComponent[],
): Map<string, string> {
  const baum = baueVerteilerBaum(assistentVerteiler('', [...liste]), katalog)
  const ergebnis = new Map<string, string>()
  for (const knoten of baum.knoten) {
    const q = knoten.eintrag.quelle
    if (!q || q.art === 'blatt') continue
    const k = quellenSchluessel(q)
    if (knoten.rolle !== 'klemme' && ergebnis.has(k)) continue
    const weg = ermittleStromweg(knoten)
    const kanal = [knoten, ...weg.kontakte].find((x) => x.rolle === 'kontakt' && x.kanal)
    const teile = [weg.stromkreis?.kennzeichen, kanal?.schluessel, weg.klemme?.schluessel].filter(
      (t): t is string => !!t,
    )
    ergebnis.set(k, teile.length > 0 ? teile.join(' / ') : knoten.schluessel)
  }
  return ergebnis
}
