import type {
  Blatt,
  KomponentenObjekt,
  Point,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
} from '../../document-model'
import {
  dockpunktBezeichnung,
  GERADE_AUSRICHTEN_PAPIER_METER,
  geradeAufSchaltverbindung,
  getDockpoints,
  istSchaltplan,
  naechsterPunktAufPolylinie,
  nullpunktVon,
  SCHALTPLAN_MASSSTAB_NENNER,
} from '../../document-model'
import { t } from '../../sprache'
import type { Command } from '../command'
import { erzeugeObjektAendernCommand } from '../commands'
import { aderToleranz, baueAdern, dockTrefferAn, objekteZuAdern } from '../schaltverbindung-bauen'
import { schaltplanHindernisse, verlegeSchaltverbindung } from '../schaltverbindung-routing'
import { erzeugeVerdrahtungCommand } from '../verdrahtung'
import type { KiErgebnis, KiKontext } from './kontext'
import { findeObjekt, KiFehler, waehleBlatt } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel } from './schreiben'

type KiPunkt = { x: number; y: number }

export interface SchaltEnde {
  kontakt?: { objektId: string; anschluss: string | number }
  potential?: string
  knoten?: string
  verbindung?: { objektId: string; punkt?: KiPunkt }
  punkt?: KiPunkt
}

export interface KiSchaltverbindung {
  von: SchaltEnde
  nach: SchaltEnde
  polzahl?: number
  adern?: number
  seiteUmgekehrt?: boolean
  bezeichnung?: string
  wegpunkte?: KiPunkt[]
}

type Ende =
  | { art: 'fest'; anschluss: SchaltverbindungAnschluss; punkt: Point }
  | { art: 'abzweig'; linie: SchaltverbindungObjekt; wunsch: Point | null }

function fehlerBei(index: number, text: string): KiFehler {
  return new KiFehler(t('kiMeldungen.schaltverbindungZiehen.verbindung', { nr: index + 1, text }))
}

function aufBlatt(blatt: Blatt, id: string, i: number) {
  const objekt = blatt.objekte.find((o) => o.id === id)
  if (!objekt)
    throw fehlerBei(
      i,
      t('kiMeldungen.schaltverbindungZiehen.keinObjektAufBlatt', { id, blatt: blatt.name }),
    )
  return objekt
}

function kontaktIndex(k: KomponentenObjekt, anschluss: string | number, i: number): number {
  const anzahl = getDockpoints(k).length
  if (typeof anschluss === 'number') {
    if (anschluss < anzahl) return anschluss
    throw fehlerBei(
      i,
      t('kiMeldungen.schaltverbindungZiehen.nurAnschluesse', {
        n: anzahl,
        index: String(anschluss),
      }),
    )
  }
  const gesucht = anschluss.trim().toLowerCase()
  const namen = Array.from({ length: anzahl }, (_, j) => dockpunktBezeichnung(k.dockpunkte, j))
  const index = namen.findIndex((n) => n?.toLowerCase() === gesucht)
  if (index >= 0) return index
  const vorhanden = namen.filter((n): n is string => !!n)
  throw fehlerBei(
    i,
    vorhanden.length > 0
      ? t('kiMeldungen.schaltverbindungZiehen.keinAnschluss', {
          anschluss,
          liste: vorhanden.join(', '),
        })
      : t('kiMeldungen.schaltverbindungZiehen.unbezeichnet', { max: String(anzahl - 1) }),
  )
}

function loeseEnde(e: SchaltEnde, blatt: Blatt, i: number, polzahl: number, bezug: Point): Ende {
  const arten = [e.kontakt, e.potential, e.knoten, e.verbindung, e.punkt].filter(
    (x) => x !== undefined,
  )
  if (arten.length !== 1) {
    throw fehlerBei(i, t('kiMeldungen.schaltverbindungZiehen.eineArt'))
  }
  const imModell = (p: KiPunkt): Point => ({ x: p.x + bezug.x, y: p.y + bezug.y })
  if (e.kontakt) {
    const k = aufBlatt(blatt, e.kontakt.objektId, i)
    if (k.type !== 'komponente')
      throw fehlerBei(i, t('kiMeldungen.schaltverbindungZiehen.keinBauteil', { id: k.id }))
    const treffer = dockTrefferAn(k, kontaktIndex(k, e.kontakt.anschluss, i), polzahl)
    return { art: 'fest', anschluss: treffer.anschluss, punkt: treffer.punkte[0] }
  }
  if (e.potential) {
    const p = aufBlatt(blatt, e.potential, i)
    if (p.type !== 'potential')
      throw fehlerBei(i, t('kiMeldungen.schaltverbindungZiehen.keinPotential', { id: p.id }))
    return { art: 'fest', anschluss: { art: 'potential', objektId: p.id }, punkt: p.position }
  }
  if (e.knoten) {
    const k = aufBlatt(blatt, e.knoten, i)
    if (k.type !== 'knotenpunkt')
      throw fehlerBei(i, t('kiMeldungen.schaltverbindungZiehen.keinKnotenpunkt', { id: k.id }))
    return { art: 'fest', anschluss: { art: 'knoten', objektId: k.id }, punkt: k.position }
  }
  if (e.verbindung) {
    const linie = aufBlatt(blatt, e.verbindung.objektId, i)
    if (linie.type !== 'schaltverbindung' || linie.wegpunkte.length < 2) {
      throw fehlerBei(
        i,
        t('kiMeldungen.schaltverbindungZiehen.keineSchaltverbindung', { id: linie.id }),
      )
    }
    return {
      art: 'abzweig',
      linie,
      wunsch: e.verbindung.punkt ? imModell(e.verbindung.punkt) : null,
    }
  }
  return { art: 'fest', anschluss: { art: 'frei' }, punkt: imModell(e.punkt!) }
}

function abzweigPunkt(
  ende: Extract<Ende, { art: 'abzweig' }>,
  anker: Point,
  versatz: number,
): { anschluss: SchaltverbindungAnschluss; punkt: Point } {
  const klick = naechsterPunktAufPolylinie(ende.wunsch ?? anker, ende.linie.wegpunkte).punkt
  return {
    anschluss: { art: 'schaltverbindung', objektId: ende.linie.id },
    punkt: geradeAufSchaltverbindung(anker, klick, ende.linie.wegpunkte, versatz),
  }
}

function blattDerVerbindungen(kontext: KiKontext, eingabe: ZiehenEingabe): Blatt {
  if (eingabe.blattId) return waehleBlatt(kontext, eingabe.blattId)
  const zeichnung = kontext.doc.getZeichnung()
  for (const v of eingabe.verbindungen) {
    for (const e of [v.von, v.nach]) {
      const id = e.kontakt?.objektId ?? e.potential ?? e.knoten ?? e.verbindung?.objektId
      const fund = id ? findeObjekt(zeichnung, id) : null
      if (fund) return fund.blatt
    }
  }
  return kontext.doc.getAktivesBlatt()
}

interface ZiehenEingabe {
  blattId?: string
  verbindungen: KiSchaltverbindung[]
}

export function schaltverbindungZiehen(eingabe: ZiehenEingabe, kontext: KiKontext): KiErgebnis {
  const zeichnung = kontext.doc.getZeichnung()
  if (!istSchaltplan(zeichnung))
    throw new KiFehler(t('kiMeldungen.schaltverbindungZiehen.nurSchaltplan'))
  const blatt = blattDerVerbindungen(kontext, eingabe)
  const grund = kontext.nurAnsicht(blatt)
  if (grund) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
  }
  const bezug = nullpunktVon(blatt)
  const versatz =
    GERADE_AUSRICHTEN_PAPIER_METER *
    (blatt.zeichenflaeche?.massstabNenner ?? SCHALTPLAN_MASSSTAB_NENNER)
  const objekte = blatt.objekte
  const hindernisse = schaltplanHindernisse(objekte)
  const settings = kontext.routingSettings()

  const neu: SchaltverbindungObjekt[] = []
  const gemeinsam = new Set<string>()
  const ergebnis = eingabe.verbindungen.map((v, i) => {
    if (v.adern !== undefined && v.polzahl !== undefined && v.polzahl > 1) {
      throw fehlerBei(i, t('kiMeldungen.schaltverbindungZiehen.polzahlOderAdern'))
    }
    const mehrlinig = v.adern !== undefined
    const polzahl = (mehrlinig ? 1 : (v.polzahl ?? 1)) as 1 | 2 | 3 | 4 | 5
    if (mehrlinig && v.bezeichnung) {
      throw fehlerBei(i, t('kiMeldungen.schaltverbindungZiehen.mehrlinigBezeichnung'))
    }
    const stuetz = (v.wegpunkte ?? []).map((p) => ({ x: p.x + bezug.x, y: p.y + bezug.y }))
    const roheVon = loeseEnde(v.von, blatt, i, polzahl, bezug)
    const roheNach = loeseEnde(v.nach, blatt, i, polzahl, bezug)
    if (roheVon.art === 'abzweig' && roheNach.art === 'abzweig' && stuetz.length === 0) {
      if (!roheVon.wunsch && !roheNach.wunsch) {
        throw fehlerBei(i, t('kiMeldungen.schaltverbindungZiehen.zweiAbzweige'))
      }
    }
    const ankerFuer = (anderes: Ende, nachbar: Point | undefined): Point =>
      nachbar ??
      (anderes.art === 'fest'
        ? anderes.punkt
        : naechsterPunktAufPolylinie(anderes.wunsch!, anderes.linie.wegpunkte).punkt)
    const von =
      roheVon.art === 'fest'
        ? roheVon
        : abzweigPunkt(roheVon, ankerFuer(roheNach, stuetz[0]), versatz)
    const nach =
      roheNach.art === 'fest'
        ? roheNach
        : abzweigPunkt(roheNach, stuetz[stuetz.length - 1] ?? von.punkt, versatz)

    const anfang = [von.punkt, ...stuetz]
    const letzter = anfang[anfang.length - 1]
    const endstueck = verlegeSchaltverbindung(
      letzter,
      nach.punkt,
      stuetz.length === 0 ? von.anschluss : { art: 'frei' },
      nach.anschluss,
      objekte,
      hindernisse,
      settings,
    )
    if (!endstueck) throw fehlerBei(i, t('kiMeldungen.schaltverbindungZiehen.keinWeg'))
    const verlauf = [...anfang.slice(0, -1), ...endstueck]
    const autoRouting = stuetz.length === 0
    const adern = baueAdern(objekte, verlauf, von.anschluss, nach.anschluss, {
      aderAnzahl: v.adern ?? 1,
      polzahl,
      seiteUmgekehrt: v.seiteUmgekehrt ?? false,
      toleranz: aderToleranz(Number.POSITIVE_INFINITY),
    })
    if (v.bezeichnung) adern[0].bezeichnung = v.bezeichnung.trim()
    const objekteDerVerbindung = objekteZuAdern(
      blatt.aktiveEbeneId,
      verlauf,
      adern,
      polzahl,
      autoRouting,
    )
    neu.push(...objekteDerVerbindung)
    if (!mehrlinig && autoRouting) gemeinsam.add(objekteDerVerbindung[0].id)
    return {
      ids: objekteDerVerbindung.map((o) => o.id),
      bezeichnungen: objekteDerVerbindung.map((o) => o.bezeichnung ?? null),
      ...(mehrlinig
        ? {
            angedockt: objekteDerVerbindung.map(
              (o) =>
                `${o.start.art === 'frei' ? 'frei' : 'an'}/${o.ziel.art === 'frei' ? 'frei' : 'an'}`,
            ),
          }
        : {}),
    }
  })

  const aderZahl = neu.length
  const werte = { n: eingabe.verbindungen.length, adern: aderZahl, blaetter: blattText([blatt]) }
  const text =
    aderZahl > eingabe.verbindungen.length
      ? t('kiMeldungen.schaltverbindungZiehen.gezogenMitAdern', werte)
      : t('kiMeldungen.schaltverbindungZiehen.gezogen', werte)
  const label = kiLabel(text)
  let fehlgeschlagen = 0
  const schritte: (() => Command | null)[] = [
    () => erzeugeObjektAendernCommand(kontext.doc, blatt.id, label, (b) => [...b, ...neu]),
  ]
  if (gemeinsam.size >= 2) {
    schritte.push(() => {
      const r = erzeugeVerdrahtungCommand(kontext.doc, blatt.id, gemeinsam, settings, label)
      fehlgeschlagen = r.fehlgeschlagen
      return r.command
    })
  }
  fuehreAenderungAus(kontext, text, schritte)
  kontext.meldeAenderung(label)

  return {
    daten: {
      verbindungen: ergebnis,
      ...(fehlgeschlagen > 0
        ? {
            hinweis: t('kiMeldungen.schaltverbindungZiehen.gemeinsamNichtFrei', {
              n: fehlgeschlagen,
            }),
          }
        : {}),
      rueckgaengig: label,
    },
  }
}
