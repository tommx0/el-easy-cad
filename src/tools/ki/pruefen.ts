import type {
  Blatt,
  CatalogComponent,
  KomponentenObjekt,
  RaumObjekt,
  SchaltverbindungAnschluss,
  Zeichnung,
} from '../../document-model'
import {
  distanceToPolyline,
  ermittleNetzfeld,
  findeRaumZuPunkt,
  getFangpunkt,
  istSchaltplan,
  istKlemme,
  klemmenNummernVon,
  teiltKennzeichenOhneRueckfrage,
  verlegungsAbweichungen,
} from '../../document-model'
import { t } from '../../sprache'
import type { KiErgebnis, KiKontext } from './kontext'
import { waehleBlatt } from './kontext'

export interface Befund {
  art: string
  meldung: string
  blattId: string
  objektIds: string[]
}

function offeneLeitungsenden(blatt: Blatt): Befund[] {
  return blatt.objekte.flatMap((o) => {
    if (o.type !== 'leitung') return []
    const frei = (['start', 'ziel'] as const).filter((ende) => o[ende].art === 'frei')
    if (frei.length === 0) return []
    return [
      {
        art: 'leitung-freies-ende',
        meldung:
          frei.length === 2
            ? t('kiMeldungen.pruefen.leitungZweiFreieEnden', { nummer: String(o.nummer) })
            : t('kiMeldungen.pruefen.leitungFreiesEnde', {
                nummer: String(o.nummer),
                ende: frei[0],
              }),
        blattId: blatt.id,
        objektIds: [o.id],
      },
    ]
  })
}

function fehlendeKatalogeintraege(blatt: Blatt, bekannt: ReadonlySet<string>): Befund[] {
  return blatt.objekte.flatMap((o) =>
    o.type === 'komponente' && !o.knxAktor && !bekannt.has(o.catalogComponentId)
      ? [
          {
            art: 'komponente-ohne-katalog',
            meldung: t('kiMeldungen.pruefen.ohneKatalog', { id: o.catalogComponentId }),
            blattId: blatt.id,
            objektIds: [o.id],
          },
        ]
      : [],
  )
}

export const KNAPP_OHNE_RAUM_M = 0.3

function knappOhneRaum(blatt: Blatt, katalog: ReadonlyMap<string, CatalogComponent>): Befund[] {
  const raeume = blatt.objekte.filter(
    (o): o is RaumObjekt => o.type === 'raum' && o.umriss.length >= 3,
  )
  if (raeume.length === 0) return []
  return blatt.objekte.flatMap((o) => {
    if (o.type !== 'komponente' || findeRaumZuPunkt(blatt.objekte, o.position)) return []
    let naechster: { raum: RaumObjekt; abstand: number } | null = null
    for (const raum of raeume) {
      const abstand = distanceToPolyline(o.position, raum.umriss, true)
      if (!naechster || abstand < naechster.abstand) naechster = { raum, abstand }
    }
    if (!naechster || naechster.abstand > KNAPP_OHNE_RAUM_M) return []
    const name = katalog.get(o.catalogComponentId)?.name ?? t('kiMeldungen.pruefen.komponente')
    const cm = Math.max(1, Math.round(naechster.abstand * 100))
    return [
      {
        art: 'komponente-knapp-ohne-raum',
        meldung: t('kiMeldungen.pruefen.knappOhneRaum', { name, cm, raum: naechster.raum.name }),
        blattId: blatt.id,
        objektIds: [o.id, naechster.raum.id],
      },
    ]
  })
}

function ungueltigeRaeume(blatt: Blatt): Befund[] {
  return blatt.objekte.flatMap((o) =>
    o.type === 'raum' && !o.gueltig
      ? [
          {
            art: 'raum-ungueltig',
            meldung: t('kiMeldungen.pruefen.raumUngueltig', { name: o.name }),
            blattId: blatt.id,
            objektIds: [o.id],
          },
        ]
      : [],
  )
}

function doppelteKlemmen(zeichnung: Zeichnung, blaetter: readonly Blatt[]): Befund[] {
  const vergeben = new Map<string, { blattId: string; objektId: string }[]>()
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente' || !istKlemme(o)) continue
      const leiste = o.geraeteKennzeichen?.trim()
      if (!leiste) continue
      for (const n of klemmenNummernVon(o)) {
        const schluessel = `${leiste}:${n}`
        const liste = vergeben.get(schluessel) ?? []
        liste.push({ blattId: blatt.id, objektId: o.id })
        vergeben.set(schluessel, liste)
      }
    }
  }
  const imUmfang = new Set(blaetter.map((b) => b.id))
  const befunde: Befund[] = []
  for (const [schluessel, stellen] of vergeben) {
    const objekte = [...new Set(stellen.map((s) => s.objektId))]
    if (objekte.length < 2 || !stellen.some((s) => imUmfang.has(s.blattId))) continue
    befunde.push({
      art: 'klemme-doppelt',
      meldung: t('kiMeldungen.pruefen.klemmeDoppelt', { klemme: schluessel, n: objekte.length }),
      blattId: stellen[0].blattId,
      objektIds: objekte,
    })
  }
  return befunde
}

function verlegeartAbweichungen(blatt: Blatt, zeichnung: Zeichnung): Befund[] {
  if (istSchaltplan(zeichnung)) return []
  return verlegungsAbweichungen(blatt, zeichnung).map((a) => ({
    art: 'verlegeart-abweichend',
    meldung: t(
      a.ende === 'start'
        ? 'kiMeldungen.pruefen.verlegeartAnfang'
        : 'kiMeldungen.pruefen.verlegeartEnde',
      {
        nummer: String(a.leitungNummer),
        leitung: t(
          a.leitung === 'in' ? 'kiMeldungen.pruefen.unterPutz' : 'kiMeldungen.pruefen.aufPutz',
        ),
        komponente: t(
          a.komponente === 'in' ? 'kiMeldungen.pruefen.unterPutz' : 'kiMeldungen.pruefen.aufPutz',
        ),
      },
    ),
    blattId: blatt.id,
    objektIds: [a.leitungId, a.komponenteId],
  }))
}

function offeneVerbindungsenden(blatt: Blatt): Befund[] {
  return blatt.objekte.flatMap((o) => {
    if (o.type !== 'schaltverbindung') return []
    const frei = (['start', 'ziel'] as const).filter((ende) => o[ende].art === 'frei')
    if (frei.length === 0) return []
    const name = o.bezeichnung
    const werte = { ende: frei[0], ...(name ? { name } : {}) }
    const meldung =
      frei.length === 2
        ? t(
            name
              ? 'kiMeldungen.pruefen.benannteZweiFreieEnden'
              : 'kiMeldungen.pruefen.verbindungZweiFreieEnden',
            werte,
          )
        : t(
            name
              ? 'kiMeldungen.pruefen.benanntesFreiesEnde'
              : 'kiMeldungen.pruefen.verbindungFreiesEnde',
            werte,
          )
    return [
      {
        art: 'schaltverbindung-freies-ende',
        meldung,
        blattId: blatt.id,
        objektIds: [o.id],
      },
    ]
  })
}

function verbundenePotentiale(blatt: Blatt): Befund[] {
  const eltern = new Map<string, string>()
  const wurzel = (x: string): string => {
    let w = x
    for (let e = eltern.get(w); e !== undefined && e !== w; e = eltern.get(w)) w = e
    eltern.set(x, w)
    return w
  }
  const verbinde = (a: string, b: string) => {
    for (const x of [a, b]) if (!eltern.has(x)) eltern.set(x, x)
    eltern.set(wurzel(a), wurzel(b))
  }
  const punktSchluessel = (a: SchaltverbindungAnschluss): string | null => {
    if (a.art === 'knoten') return `k:${a.objektId}`
    if (a.art === 'potential') return `p:${a.objektId}`
    if (a.art === 'dock' && a.dockpunktIndizes.length === 1) {
      return `d:${a.objektId}:${a.dockpunktIndizes[0]}`
    }
    return null
  }
  const namen = new Map<string, string>()
  for (const o of blatt.objekte) {
    if (o.type === 'potential') namen.set(`p:${o.id}`, o.name.trim())
    if (o.type !== 'schaltverbindung' || o.polzahl !== 1) continue
    if (!eltern.has(o.id)) eltern.set(o.id, o.id)
    if (o.bezeichnung?.trim()) namen.set(o.id, o.bezeichnung.trim())
    for (const ende of [o.start, o.ziel]) {
      const schluessel = punktSchluessel(ende)
      if (schluessel) verbinde(o.id, schluessel)
    }
  }
  const jeNetz = new Map<string, { namen: Set<string>; ids: Set<string> }>()
  for (const [schluessel, name] of namen) {
    if (!eltern.has(schluessel)) continue
    const netz = jeNetz.get(wurzel(schluessel)) ?? { namen: new Set(), ids: new Set() }
    netz.namen.add(name)
    netz.ids.add(schluessel.startsWith('p:') ? schluessel.slice(2) : schluessel)
    jeNetz.set(wurzel(schluessel), netz)
  }
  return [...jeNetz.values()]
    .filter((n) => n.namen.size >= 2)
    .map((n) => ({
      art: 'potentiale-verbunden',
      meldung: t('kiMeldungen.pruefen.potentialeVerbunden', { namen: [...n.namen].join(', ') }),
      blattId: blatt.id,
      objektIds: [...n.ids],
    }))
}

function ausserhalbDesNetzes(blatt: Blatt): Befund[] {
  const flaeche = blatt.zeichenflaeche
  if (!flaeche) return []
  return blatt.objekte.flatMap((o) =>
    o.type === 'komponente' && !ermittleNetzfeld(flaeche, getFangpunkt(o))
      ? [
          {
            art: 'ausserhalb-netz',
            meldung: o.geraeteKennzeichen
              ? t('kiMeldungen.pruefen.ausserhalbNetzMitKennzeichen', {
                  kennzeichen: o.geraeteKennzeichen,
                })
              : t('kiMeldungen.pruefen.ausserhalbNetz'),
            blattId: blatt.id,
            objektIds: [o.id],
          },
        ]
      : [],
  )
}

function doppelteKennzeichen(zeichnung: Zeichnung, blaetter: readonly Blatt[]): Befund[] {
  const traeger = new Map<string, { blattId: string; objekt: KomponentenObjekt }[]>()
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      const k = o.type === 'komponente' ? o.geraeteKennzeichen?.trim() : undefined
      if (o.type !== 'komponente' || !k || istKlemme(o)) continue
      traeger.set(k, [...(traeger.get(k) ?? []), { blattId: blatt.id, objekt: o }])
    }
  }
  const imUmfang = new Set(blaetter.map((b) => b.id))
  const befunde: Befund[] = []
  for (const [kennzeichen, liste] of traeger) {
    if (liste.length < 2 || !liste.some((e) => imUmfang.has(e.blattId))) continue
    const erlaubt = liste.every((e) =>
      teiltKennzeichenOhneRueckfrage(
        e.objekt,
        liste.filter((x) => x !== e).map((x) => x.objekt),
      ),
    )
    if (erlaubt) continue
    befunde.push({
      art: 'kennzeichen-doppelt',
      meldung: t('kiMeldungen.pruefen.kennzeichenDoppelt', { kennzeichen, n: liste.length }),
      blattId: liste[0].blattId,
      objektIds: liste.map((e) => e.objekt.id),
    })
  }
  return befunde
}

export function pruefen(eingabe: { blattId?: string }, kontext: KiKontext): KiErgebnis {
  const zeichnung = kontext.doc.getZeichnung()
  const blaetter = eingabe.blattId ? [waehleBlatt(kontext, eingabe.blattId)] : zeichnung.blaetter
  const katalog = new Map(kontext.katalogKomponenten().map((k) => [k.id, k]))
  const bekannt = new Set(katalog.keys())
  const befunde = [
    ...blaetter.flatMap((b) => [
      ...offeneLeitungsenden(b),
      ...fehlendeKatalogeintraege(b, bekannt),
      ...ungueltigeRaeume(b),
      ...knappOhneRaum(b, katalog),
      ...verlegeartAbweichungen(b, zeichnung),
      ...(istSchaltplan(zeichnung)
        ? [...offeneVerbindungsenden(b), ...verbundenePotentiale(b), ...ausserhalbDesNetzes(b)]
        : []),
    ]),
    ...doppelteKlemmen(zeichnung, blaetter),
    ...(istSchaltplan(zeichnung) ? doppelteKennzeichen(zeichnung, blaetter) : []),
  ]
  return { daten: { anzahl: befunde.length, befunde } }
}
