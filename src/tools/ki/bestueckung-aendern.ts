import type {
  BestueckungsEintrag,
  CatalogComponent,
  EinhaengeZiel,
  Phase,
  VerteilerBetriebsmittel,
  VerteilerKnoten,
} from '../../document-model'
import {
  baueVerteilerBaum,
  bestueckungAendern,
  bestueckungEinhaengen,
  bestueckungEntfernen,
  bestueckungUmbenennen,
  brauchtPhase,
  istFehlerstromSchutzName,
  knxAktorArtVonKatalogId,
  leistenKlemmeUmnummeriert,
  nachfahren,
  netzVon,
  neueBestueckungsEintraege,
  neueStromkreise,
  passtZumNetz,
  verteilerKennzeichenText,
} from '../../document-model'
import { t } from '../../sprache'
import { erzeugeBestueckungCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'
import { verteilerImBauplan } from './verteiler-hilfen'

interface Schritt {
  betriebsmittel?: { katalogId: string; anzahl?: number; hinter?: string }
  stromkreise?: {
    anzahl: number
    schutzKatalogId?: string
    klemmeKatalogId?: string | null
    hinter?: string
  }
  umhaengen?: { knoten: string; art: 'kind' | 'davor' | 'dahinter'; ziel: string | null }
  umbenennen?: { knoten: string; neu: string }
  entfernen?: { knoten: string; mitAllemDahinter?: boolean }
  aendern?: {
    knoten: string
    phase?: Phase | null
    typ?: string
    beschriftung?: string
  }
}

const STANDARD_SCHUTZ_ID = 'leitungsschutzschalter-1-polig'
const STANDARD_KLEMME_ID = 'abgangsklemme-1p-n-pe'

function istLeiste(geraet: VerteilerBetriebsmittel): boolean {
  return geraet.buchstabe === 'X' && !geraet.eintragId && !geraet.imPlan
}

export function bestueckungAendernKi(
  eingabe: { verteilerId: string; schritte: Schritt[] },
  kontext: KiKontext,
): KiErgebnis {
  const { blatt, verteiler, kennzeichen, plan } = verteilerImBauplan(kontext, eingabe.verteilerId)
  const katalog = kontext.katalogKomponenten()
  const vorgaben = kontext.vorgaben()
  const mitPlan = plan !== null
  const netz = netzVon(verteiler.verteiler)
  const klemmenOptionen = { leiste: vorgaben.klemmenLeiste, katalog }
  const baumVon = (liste: BestueckungsEintrag[]) =>
    baueVerteilerBaum(
      { ...verteiler, verteiler: { ...verteiler.verteiler, bestueckung: liste } },
      katalog,
      plan,
    )
  const vorher = new Set(baumVon(verteiler.verteiler.bestueckung).knoten.map((k) => k.schluessel))

  let liste: BestueckungsEintrag[] = [...verteiler.verteiler.bestueckung]
  const umbenannt = new Map<string, string>()
  const entfernt = new Set<string>()
  const erledigt: string[] = []

  const merkeUmbenennung = (alt: string, neu: string) => {
    for (const [ursprung, ziel] of umbenannt) {
      if (ziel === alt) {
        umbenannt.set(ursprung, neu)
        return
      }
    }
    umbenannt.set(alt, neu)
  }

  eingabe.schritte.forEach((s, i) => {
    const fehler = (text: string) =>
      new KiFehler(t('kiMeldungen.bestueckungAendern.schritt', { nr: i + 1, text }))
    const arten = [
      s.betriebsmittel,
      s.stromkreise,
      s.umhaengen,
      s.umbenennen,
      s.entfernen,
      s.aendern,
    ]
    if (arten.filter((x) => x !== undefined).length !== 1) {
      throw fehler(t('kiMeldungen.bestueckungAendern.eineArt'))
    }
    const baum = baumVon(liste)
    const knoten = (name: string): VerteilerKnoten => {
      const schluessel = name.trim().replace(/^-/, '')
      const k = baum.knoten.find((x) => x.schluessel === schluessel)
      if (k) return k
      const namen = baum.knoten.map((x) => x.schluessel)
      throw fehler(
        t('kiMeldungen.bestueckungAendern.keinKnoten', {
          name,
          liste: namen.slice(0, 40).join(', ') + (namen.length > 40 ? ' …' : ''),
        }),
      )
    }
    const aenderbar = (k: VerteilerKnoten) =>
      k.geraet.inBestueckung && !(mitPlan && k.geraet.imPlan)
    const nichtImPlan = () => fehler(t('kiMeldungen.bestueckungAendern.neueAusDemPlan'))
    const katalogEintrag = (id: string): CatalogComponent => {
      const k = katalog.find((c) => c.id === id)
      if (!k) throw fehler(t('kiMeldungen.gemeinsam.keinKatalogeintrag', { id }))
      if (!passtZumNetz(k, netz))
        throw fehler(t('kiMeldungen.bestueckungAendern.mehrphasig', { name: k.name }))
      return k
    }

    if (s.betriebsmittel) {
      if (mitPlan) throw nichtImPlan()
      const k = katalogEintrag(s.betriebsmittel.katalogId)
      if (knxAktorArtVonKatalogId(k.id)) {
        throw fehler(t('kiMeldungen.bestueckungAendern.knxAktoren'))
      }
      if (!k.kennzeichenBuchstabe?.trim()) {
        throw fehler(t('kiMeldungen.bestueckungAendern.keinBetriebsmittel', { name: k.name }))
      }
      const eltern = s.betriebsmittel.hinter
        ? knoten(s.betriebsmittel.hinter).eintrag.id
        : undefined
      const neu = neueBestueckungsEintraege(
        liste,
        k,
        s.betriebsmittel.anzahl ?? 1,
        eltern,
        klemmenOptionen,
      )
      liste = [...liste, ...neu]
      erledigt.push(
        t('kiMeldungen.bestueckungAendern.erledigt.betriebsmittel', {
          n: neu.length,
          name: k.name,
        }),
      )
      return
    }
    if (s.stromkreise) {
      if (mitPlan) throw nichtImPlan()
      const schutz = katalogEintrag(
        s.stromkreise.schutzKatalogId ??
          vorgaben.verteilerplan.stromkreisSchutzId ??
          STANDARD_SCHUTZ_ID,
      )
      if (schutz.kennzeichenBuchstabe?.trim() !== 'F' || istFehlerstromSchutzName(schutz.name)) {
        throw fehler(
          t('kiMeldungen.bestueckungAendern.keinLeitungsschutzschalter', { name: schutz.name }),
        )
      }
      const klemmeId =
        s.stromkreise.klemmeKatalogId === undefined
          ? vorgaben.verteilerplan.stromkreisKlemmeId === undefined
            ? STANDARD_KLEMME_ID
            : vorgaben.verteilerplan.stromkreisKlemmeId
          : s.stromkreise.klemmeKatalogId
      const klemme = klemmeId === null ? null : katalogEintrag(klemmeId)
      if (klemme && klemme.kennzeichenBuchstabe?.trim() !== 'X') {
        throw fehler(t('kiMeldungen.bestueckungAendern.keineKlemme', { name: klemme.name }))
      }
      const eltern = s.stromkreise.hinter ? knoten(s.stromkreise.hinter).eintrag.id : undefined
      liste = [
        ...liste,
        ...neueStromkreise(liste, schutz, klemme, s.stromkreise.anzahl, eltern, klemmenOptionen),
      ]
      erledigt.push(
        t('kiMeldungen.bestueckungAendern.erledigt.stromkreise', { n: s.stromkreise.anzahl }),
      )
      return
    }
    if (s.umhaengen) {
      const k = knoten(s.umhaengen.knoten)
      const { art } = s.umhaengen
      if (s.umhaengen.ziel === null && art !== 'kind') {
        throw fehler(t('kiMeldungen.bestueckungAendern.ohneZiel'))
      }
      const zielId = s.umhaengen.ziel === null ? null : knoten(s.umhaengen.ziel).eintrag.id
      if (zielId && (zielId === k.eintrag.id || nachfahren(liste, k.eintrag.id).has(zielId))) {
        throw fehler(t('kiMeldungen.bestueckungAendern.hinterSichSelbst'))
      }
      const ziel = (art === 'kind' ? { art, zielId } : { art, zielId: zielId! }) as EinhaengeZiel
      const neu = bestueckungEinhaengen(liste, k.eintrag.id, ziel)
      if (!neu)
        throw fehler(t('kiMeldungen.bestueckungAendern.nichtEinhaengbar', { knoten: k.schluessel }))
      liste = neu
      erledigt.push(
        t('kiMeldungen.bestueckungAendern.erledigt.umgehaengt', { knoten: k.schluessel }),
      )
      return
    }
    if (s.umbenennen) {
      const k = knoten(s.umbenennen.knoten)
      if (!aenderbar(k) || (k.kanal && !istLeiste(k.geraet))) {
        throw fehler(
          t(
            k.kanal
              ? 'kiMeldungen.bestueckungAendern.kanalUmbenennen'
              : 'kiMeldungen.bestueckungAendern.imPlanAendern',
            { knoten: k.schluessel },
          ),
        )
      }
      if (k.kanal) {
        const r = leistenKlemmeUmnummeriert(liste, k.eintrag.id, s.umbenennen.neu, katalog)
        if (!r)
          throw fehler(
            t('kiMeldungen.bestueckungAendern.keineLeistenklemme', { knoten: k.schluessel }),
          )
        if ('fehler' in r) throw fehler(r.fehler)
        liste = r.liste
        merkeUmbenennung(r.alt, r.neu)
        erledigt.push(`${r.alt} → ${r.neu}`)
        return
      }
      const neuesKennzeichen = s.umbenennen.neu.trim().replace(/^-/, '')
      if (neuesKennzeichen === k.kennzeichen) return
      const neu = bestueckungUmbenennen(liste, k.eintrag.id, neuesKennzeichen)
      if (!neu) {
        throw fehler(
          t('kiMeldungen.bestueckungAendern.kennzeichenVergeben', {
            kennzeichen: neuesKennzeichen,
          }),
        )
      }
      liste = neu
      merkeUmbenennung(k.kennzeichen, neuesKennzeichen)
      erledigt.push(`${k.kennzeichen} → ${neuesKennzeichen}`)
      return
    }
    if (s.entfernen) {
      const k = knoten(s.entfernen.knoten)
      if (k.kanal === undefined && !aenderbar(k)) {
        throw fehler(t('kiMeldungen.bestueckungAendern.imPlanEntfernen', { knoten: k.schluessel }))
      }
      const r = bestueckungEntfernen(liste, new Set([k.eintrag.id]), s.entfernen.mitAllemDahinter)
      liste = r.liste
      for (const g of r.entfernteGeraete) entfernt.add(g)
      erledigt.push(
        t(
          s.entfernen.mitAllemDahinter
            ? 'kiMeldungen.bestueckungAendern.erledigt.entferntMitAllem'
            : 'kiMeldungen.bestueckungAendern.erledigt.entfernt',
          {
            knoten: k.schluessel,
          },
        ),
      )
      return
    }
    const a = s.aendern!
    const k = knoten(a.knoten)
    const patch: Parameters<typeof bestueckungAendern>[2] = {}
    if (a.phase !== undefined) {
      if (k.kanal || !brauchtPhase(k.kennzeichen, k.geraet.anschluesse)) {
        throw fehler(t('kiMeldungen.bestueckungAendern.keinePhase', { knoten: k.schluessel }))
      }
      patch.phase = a.phase ?? undefined
    }
    if (a.typ !== undefined) {
      const eintrag = katalog.find((c) => c.id === k.geraet.catalogComponentId)
      const mitTyp = !k.kanal && (eintrag?.textElemente?.some((e) => e.variable === 'Typ') ?? false)
      if (!aenderbar(k) || !mitTyp)
        throw fehler(t('kiMeldungen.bestueckungAendern.keinTyp', { knoten: k.schluessel }))
      patch.variablen = { ...(k.eintrag.variablen ?? {}), Typ: a.typ.trim() }
    }
    if (a.beschriftung !== undefined) patch.bezeichnung = a.beschriftung.trim()
    if (Object.keys(patch).length === 0)
      throw fehler(t('kiMeldungen.bestueckungAendern.nichtsAngegeben'))
    liste = bestueckungAendern(liste, k.eintrag.id, patch)
    erledigt.push(t('kiMeldungen.bestueckungAendern.erledigt.geaendert', { knoten: k.schluessel }))
  })

  const text = t('kiMeldungen.bestueckungAendern.label', {
    verteiler: verteilerKennzeichenText(kennzeichen),
    liste: erledigt.slice(0, 4).join(', ') + (erledigt.length > 4 ? ' …' : ''),
  })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () =>
      erzeugeBestueckungCommand(
        kontext.doc,
        blatt.id,
        verteiler.id,
        label,
        liste,
        umbenannt,
        entfernt,
      ),
  ])
  kontext.meldeAenderung(label)
  const nachher = baumVon(liste).knoten.map((k) => k.schluessel)
  return {
    daten: {
      erledigt,
      neueKnoten: nachher.filter((s) => !vorher.has(s)),
      ...(entfernt.size > 0 ? { entfernt: [...entfernt] } : {}),
      rueckgaengig: label,
    },
  }
}
