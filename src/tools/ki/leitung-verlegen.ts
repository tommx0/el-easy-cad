import type {
  Blatt,
  KabelschachtObjekt,
  KomponentenObjekt,
  LeitungsEndpunkt,
  LeitungsObjekt,
  LeitungsVerknuepfung,
  LeitungsVerteilerAnschluss,
  LeitungsZiel,
  Point,
  TrunkDurchgang,
  TrunkObjekt,
  VerknuepfungsAuswahl,
  Zeichnung,
} from '../../document-model'
import {
  angeboteneDockpunkte,
  austrittTRichtungSchacht,
  austrittTRichtungSwitch,
  distance,
  erzeugeId,
  ermittleLeitungsVerknuepfung,
  ermittlePortBelegung,
  ermittleSchaechteAnKette,
  ermittleSwitchesAnKette,
  ermittleVerteilerAnKette,
  findeTrunkWeg,
  getBoundingBox,
  getDockpoints,
  istTrunkDockpunkt,
  istVerteiler,
  naechsteFreieStrangNummer,
  naechsterPunktAufPfad,
  nullpunktVon,
  sammlePortZuweisungen,
  schachtAnschlussPunkt,
  schachtMittelpunkt,
  wendeLeitungsVerknuepfungAn,
} from '../../document-model'
import { routePath, routingHindernisse } from '../../routing'
import { t } from '../../sprache'
import type { Command } from '../command'
import { erzeugeLeitungsVerknuepfungCommand, erzeugeObjektHinzufuegenCommand } from '../commands'
import { baueLeitungsObjekt, routingFuerNeueLeitung } from '../leitung-bauen'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, runde, waehleBlatt } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel } from './schreiben'

interface AnschlussEingabe {
  kennzeichen: string
  anschluss?: string
  ader?: string
}

export interface EndeEingabe {
  komponente?: { objektId: string; dockpunkt?: number; anschluesse?: AnschlussEingabe[] }
  punkt?: { x: number; y: number }
  schacht?: { objektId: string; strang?: number }
  switchport?: { objektId: string; port?: number }
  verteiler?: { objektId: string; anschluesse?: AnschlussEingabe[] }
}

export interface LeitungEingabe {
  blattId?: string
  von: EndeEingabe
  nach: EndeEingabe
  trunks?: { eintrittTrunkId: string; austrittTrunkId?: string }
  verknuepfen?: boolean
}

type Ende = 'start' | 'ziel'

function fehlerBei(index: number, text: string): KiFehler {
  return new KiFehler(t('kiMeldungen.leitungVerlegen.leitung', { nr: index + 1, text }))
}

function artVon(e: EndeEingabe): keyof EndeEingabe {
  const arten = (Object.keys(e) as (keyof EndeEingabe)[]).filter((k) => e[k] !== undefined)
  if (arten.length !== 1) {
    throw new KiFehler(t('kiMeldungen.leitungVerlegen.eineArt'))
  }
  return arten[0]
}

function objektAufBlatt<T extends { id: string; type: string }>(
  blatt: Blatt,
  id: string,
  typ: T['type'],
): T | null {
  const o = blatt.objekte.find((x) => x.id === id)
  return o && o.type === typ ? (o as unknown as T) : null
}

function blattDerLeitung(kontext: KiKontext, l: LeitungEingabe): Blatt {
  if (l.blattId) return waehleBlatt(kontext, l.blattId)
  const ids = [l.von, l.nach].flatMap((e) =>
    [e.komponente?.objektId, e.schacht?.objektId].filter((x): x is string => !!x),
  )
  if (l.trunks) ids.push(l.trunks.eintrittTrunkId)
  for (const id of ids) {
    const blatt = kontext.doc
      .getZeichnung()
      .blaetter.find((b) => b.objekte.some((o) => o.id === id))
    if (blatt) return blatt
  }
  return kontext.doc.getAktivesBlatt()
}

function bezugspunkt(blatt: Blatt, e: EndeEingabe): Point | null {
  const bezug = nullpunktVon(blatt)
  if (e.punkt) return { x: e.punkt.x + bezug.x, y: e.punkt.y + bezug.y }
  const id = e.komponente?.objektId ?? e.schacht?.objektId
  const o = id ? blatt.objekte.find((x) => x.id === id) : undefined
  if (!o) return null
  if (o.type === 'komponente') return o.position
  if (o.type === 'kabelschacht') return schachtMittelpunkt(o)
  const r = getBoundingBox(o)
  return { x: (r.min.x + r.max.x) / 2, y: (r.min.y + r.max.y) / 2 }
}

function waehleDockpunkt(
  i: number,
  k: KomponentenObjekt,
  wunsch: number | undefined,
  richtung: Point | null,
): { index: number; punkt: Point } {
  const punkte = getDockpoints(k)
  if (wunsch !== undefined) {
    if (!punkte[wunsch]) {
      throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.keinDockpunkt', { nr: String(wunsch) }))
    }
    if (istTrunkDockpunkt(k, wunsch)) {
      throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.nurFuerTrunks', { nr: String(wunsch) }))
    }
    return { index: wunsch, punkt: punkte[wunsch] }
  }
  const erlaubt = angeboteneDockpunkte(k) ?? punkte.map((_, j) => j)
  const kandidaten = erlaubt.filter((j) => punkte[j] && !istTrunkDockpunkt(k, j))
  if (kandidaten.length === 0) {
    throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.keinDockpunktFuerLeitungen'))
  }
  const ziel = richtung ?? k.position
  const index = kandidaten.reduce((a, b) =>
    distance(punkte[b], ziel) < distance(punkte[a], ziel) ? b : a,
  )
  return { index, punkt: punkte[index] }
}

function anschluesseFuer(
  ende: Ende,
  liste: readonly AnschlussEingabe[] | undefined,
): LeitungsVerteilerAnschluss[] {
  return (liste ?? []).map((a) => {
    const kennzeichen = a.kennzeichen.trim().replace(/^-/, '')
    const getrennt = a.anschluss ? null : /^([^:]+):(.+)$/.exec(kennzeichen)
    const anschluss = getrennt ? getrennt[2] : a.anschluss
    return {
      ende,
      kennzeichen: getrennt ? getrennt[1] : kennzeichen,
      ...(anschluss ? { anschluss } : {}),
      ...(a.ader ? { ader: a.ader } : {}),
    }
  })
}

function festesEnde(
  i: number,
  zeichnung: Zeichnung,
  blatt: Blatt,
  e: EndeEingabe,
  ende: Ende,
  richtung: Point | null,
): { punkt: Point; endpunkt: LeitungsEndpunkt; anschluesse: LeitungsVerteilerAnschluss[] } {
  if (e.komponente) {
    const k = objektAufBlatt<KomponentenObjekt>(blatt, e.komponente.objektId, 'komponente')
    if (!k) {
      throw fehlerBei(
        i,
        t('kiMeldungen.gemeinsam.keineKomponenteAuf', {
          id: e.komponente.objektId,
          blatt: blatt.name,
        }),
      )
    }
    if (e.komponente.anschluesse?.length && !istVerteiler(k)) {
      throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.anschluesseNurVerteiler'))
    }
    const dock = waehleDockpunkt(i, k, e.komponente.dockpunkt, richtung)
    return {
      punkt: dock.punkt,
      endpunkt: { art: 'dock', objektId: k.id, dockpunktIndex: dock.index },
      anschluesse: anschluesseFuer(ende, e.komponente.anschluesse),
    }
  }
  if (e.punkt) {
    const bezug = nullpunktVon(blatt)
    return {
      punkt: { x: e.punkt.x + bezug.x, y: e.punkt.y + bezug.y },
      endpunkt: { art: 'frei' },
      anschluesse: [],
    }
  }
  if (e.schacht) {
    const s = objektAufBlatt<KabelschachtObjekt>(blatt, e.schacht.objektId, 'kabelschacht')
    if (!s) {
      throw fehlerBei(
        i,
        t('kiMeldungen.gemeinsam.keinKabelschachtAuf', {
          id: e.schacht.objektId,
          blatt: blatt.name,
        }),
      )
    }
    const strang = e.schacht.strang ?? naechsteFreieStrangNummer(zeichnung, s.verbundId)
    return {
      punkt: schachtAnschlussPunkt(s, richtung ?? schachtMittelpunkt(s)),
      endpunkt: { art: 'schacht', objektId: s.id, strang },
      anschluesse: [],
    }
  }
  throw fehlerBei(
    i,
    ende === 'start'
      ? t('kiMeldungen.leitungVerlegen.vonNur')
      : t('kiMeldungen.leitungVerlegen.endeNur'),
  )
}

function buendelEnde(
  i: number,
  kontext: KiKontext,
  zeichnung: Zeichnung,
  blatt: Blatt,
  trunk: TrunkObjekt,
  e: EndeEingabe,
): { ziel: LeitungsZiel; austrittT: number; anschluesse: LeitungsVerteilerAnschluss[] } | null {
  if (e.switchport) {
    const info = ermittleSwitchesAnKette(zeichnung, blatt.id, trunk.id).find(
      (s) => s.switchInstanz.id === e.switchport!.objektId,
    )
    if (!info) throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.geraetNichtAnKette'))
    const belegung = ermittlePortBelegung(
      info.switchInstanz,
      sammlePortZuweisungen(zeichnung).get(info.switchInstanz.id),
      kontext.katalogKomponenten(),
    )
    let port = belegung.find((p) => !p.belegtDurch)
    if (e.switchport.port !== undefined) {
      port = belegung.find((p) => p.portIndex === e.switchport!.port)
      if (!port) {
        throw fehlerBei(
          i,
          t('kiMeldungen.leitungVerlegen.keinPort', { nr: String(e.switchport.port) }),
        )
      }
      if (port.belegtDurch) {
        throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.portBelegt', { port: port.bezeichnung }))
      }
    }
    if (!port) throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.keinPortFrei'))
    return {
      ziel: {
        art: 'switchport',
        blattId: info.blattId,
        objektId: info.switchInstanz.id,
        portIndex: port.portIndex,
      },
      austrittT: austrittTRichtungSwitch(zeichnung, blatt.id, trunk.id, info.switchInstanz.id),
      anschluesse: [],
    }
  }
  if (e.verteiler) {
    const info = ermittleVerteilerAnKette(zeichnung, blatt.id, trunk.id).find(
      (v) => v.verteiler.id === e.verteiler!.objektId,
    )
    if (!info) throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.verteilerNichtAnKette'))
    return {
      ziel: { art: 'verteiler', blattId: info.blattId, objektId: info.verteiler.id },
      austrittT: austrittTRichtungSwitch(zeichnung, blatt.id, trunk.id, info.verteiler.id),
      anschluesse: anschluesseFuer('ziel', e.verteiler.anschluesse),
    }
  }
  if (e.schacht) {
    const info = ermittleSchaechteAnKette(zeichnung, blatt.id, trunk.id).find(
      (s) => s.schachtId === e.schacht!.objektId,
    )
    if (!info) return null
    const strang = e.schacht.strang ?? naechsteFreieStrangNummer(zeichnung, info.verbundId)
    return {
      ziel: { art: 'schacht', objektId: info.schachtId, strang },
      austrittT: austrittTRichtungSchacht(zeichnung, blatt.id, trunk.id, info.schachtId),
      anschluesse: [],
    }
  }
  return null
}

function trunkAufBlatt(i: number, blatt: Blatt, id: string): TrunkObjekt {
  const trunk = objektAufBlatt<TrunkObjekt>(blatt, id, 'trunk')
  if (!trunk) {
    throw fehlerBei(i, t('kiMeldungen.gemeinsam.keinTrunkAuf', { id, blatt: blatt.name }))
  }
  return trunk
}

function baueLeitung(
  i: number,
  l: LeitungEingabe,
  id: string,
  kontext: KiKontext,
): { blatt: Blatt; leitung: LeitungsObjekt } {
  const zeichnung = kontext.doc.getZeichnung()
  const blatt = blattDerLeitung(kontext, l)
  const grund = kontext.nurAnsicht(blatt)
  if (grund) {
    throw fehlerBei(i, t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
  }
  if (artVon(l.von) !== 'komponente' && !l.von.punkt && !l.von.schacht) {
    throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.vonNur'))
  }
  artVon(l.nach)
  const settings = kontext.routingSettings()
  const zone = kontext.vorgaben().verlegeVorgaben.leitungZone
  const routing = routingFuerNeueLeitung(settings, zone, blatt, zeichnung)
  const hindernisse = routingHindernisse(blatt.objekte, settings.sicherheitsabstandMeter)
  const route = (a: Point, b: Point): Point[] => {
    const pfad = routePath(a, b, hindernisse, routing)
    if (!pfad) throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.keinWeg'))
    return pfad
  }
  const zielBezug = bezugspunkt(blatt, l.nach)
  const segmente: Point[][] = []
  const durchgaenge: TrunkDurchgang[] = []
  let ziel: LeitungsZiel
  let start: ReturnType<typeof festesEnde>
  let zielAnschluesse: LeitungsVerteilerAnschluss[]

  if (!l.trunks) {
    if (l.nach.switchport || l.nach.verteiler) {
      throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.nurUeberTrunks'))
    }
    start = festesEnde(i, zeichnung, blatt, l.von, 'start', zielBezug)
    const ende = festesEnde(i, zeichnung, blatt, l.nach, 'ziel', start.punkt)
    segmente.push(route(start.punkt, ende.punkt))
    ziel = ende.endpunkt
    zielAnschluesse = ende.anschluesse
  } else {
    const eintrittTrunk = trunkAufBlatt(i, blatt, l.trunks.eintrittTrunkId)
    const vonBezug = bezugspunkt(blatt, l.von) ?? eintrittTrunk.wegpunkte[0]
    const eintritt = naechsterPunktAufPfad(eintrittTrunk.wegpunkte, vonBezug)!
    start = festesEnde(i, zeichnung, blatt, l.von, 'start', eintritt.punkt)
    const eintrittGenau = naechsterPunktAufPfad(eintrittTrunk.wegpunkte, start.punkt)!
    segmente.push(route(start.punkt, eintrittGenau.punkt))
    const buendel = buendelEnde(i, kontext, zeichnung, blatt, eintrittTrunk, l.nach)
    if (buendel) {
      durchgaenge.push({
        trunkId: eintrittTrunk.id,
        eintrittT: eintrittGenau.t,
        austrittT: buendel.austrittT,
      })
      segmente.push([])
      ziel = buendel.ziel
      zielAnschluesse = buendel.anschluesse
    } else {
      const austrittTrunk = trunkAufBlatt(i, blatt, l.trunks.austrittTrunkId ?? eintrittTrunk.id)
      const austritt = naechsterPunktAufPfad(
        austrittTrunk.wegpunkte,
        zielBezug ?? austrittTrunk.wegpunkte[austrittTrunk.wegpunkte.length - 1],
      )!
      if (austrittTrunk.id === eintrittTrunk.id && Math.abs(austritt.t - eintrittGenau.t) < 1e-6) {
        throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.einUndAustritt'))
      }
      const weg = findeTrunkWeg(zeichnung, blatt.id, eintrittTrunk.id, austrittTrunk.id)
      if (!weg) throw fehlerBei(i, t('kiMeldungen.leitungVerlegen.nichtVerbunden'))
      weg.forEach((glied, index) => {
        if (index > 0) segmente.push([])
        durchgaenge.push({
          trunkId: glied.trunk.id,
          eintrittT: glied.eintrittT ?? eintrittGenau.t,
          austrittT: glied.austrittT ?? austritt.t,
        })
      })
      const ende = festesEnde(i, zeichnung, blatt, l.nach, 'ziel', austritt.punkt)
      segmente.push(route(austritt.punkt, ende.punkt))
      ziel = ende.endpunkt
      zielAnschluesse = ende.anschluesse
    }
  }

  const leitung = baueLeitungsObjekt({
    zeichnung,
    blatt,
    ersatzEbeneId: blatt.aktiveEbeneId,
    start: start.endpunkt,
    ziel,
    segmente,
    durchgaenge,
    zone,
    selbstVerlegt: false,
    parallelAbstandMeter: settings.parallelAbstandMeter,
    verteilerAnschluesse: [...start.anschluesse, ...zielAnschluesse],
  })
  return { blatt, leitung: { ...leitung, id } }
}

function auswahlWieDialog(v: LeitungsVerknuepfung): VerknuepfungsAuswahl {
  switch (v.art) {
    case 'wirkverbindung':
      return {
        art: 'wirkverbindung',
        quellen: v.quellen.map((q) => ({ objektId: q.objekt.id, slotId: q.slotVorschlag })),
        zielGruppe: v.gruppe !== null,
        slotBezeichnung: v.nameVorschlag,
      }
    case 'abgleich':
      return { art: 'abgleich', vonSlotId: v.von.slotVorschlag, nachSlotId: v.nach.slotVorschlag }
    case 'gruppe':
      return { art: 'gruppe', name: v.nameVorschlag }
  }
}

function verknuepfungText(art: LeitungsVerknuepfung['art']): string {
  return t(`kiMeldungen.leitungVerlegen.verknuepfung.${art}`)
}

function endeText(z: LeitungsZiel): string {
  switch (z.art) {
    case 'dock':
      return t('kiMeldungen.leitungVerlegen.ende.dock', {
        id: z.objektId,
        nr: String(z.dockpunktIndex),
      })
    case 'frei':
      return t('kiMeldungen.leitungVerlegen.ende.frei')
    case 'schacht':
      return t('kiMeldungen.leitungVerlegen.ende.schacht', { id: z.objektId, nr: String(z.strang) })
    case 'switchport':
      return t('kiMeldungen.leitungVerlegen.ende.switchport', {
        id: z.objektId,
        nr: String(z.portIndex),
      })
    case 'verteiler':
      return t('kiMeldungen.leitungVerlegen.ende.verteiler', { id: z.objektId })
  }
}

export function leitungVerlegen(
  eingabe: { leitungen: LeitungEingabe[] },
  kontext: KiKontext,
): KiErgebnis {
  const doc = kontext.doc
  const ids = eingabe.leitungen.map(() => erzeugeId('objekt'))
  const blaetter = eingabe.leitungen.map((l) => blattDerLeitung(kontext, l))
  const text = t('kiMeldungen.leitungVerlegen.verlegt', {
    n: eingabe.leitungen.length,
    blaetter: blattText(blaetter),
  })
  const label = kiLabel(text)
  const verknuepft = new Map<string, string>()

  const schritte = eingabe.leitungen.flatMap((l, i): (() => Command | null)[] => {
    const leitungSchritt = () => {
      const { blatt, leitung } = baueLeitung(i, l, ids[i], kontext)
      return erzeugeObjektHinzufuegenCommand(doc, blatt.id, leitung, label)
    }
    if (!l.verknuepfen) return [leitungSchritt]
    const verknuepfenSchritt = () => {
      const zeichnung = doc.getZeichnung()
      const blatt = zeichnung.blaetter.find((b) => b.objekte.some((o) => o.id === ids[i]))
      if (!blatt) return null
      const v = ermittleLeitungsVerknuepfung(
        zeichnung,
        kontext.katalogKomponenten(),
        blatt.id,
        ids[i],
      )
      if (!v) return null
      const ergebnis = wendeLeitungsVerknuepfungAn(zeichnung, v, auswahlWieDialog(v))
      if (!ergebnis) return null
      verknuepft.set(ids[i], verknuepfungText(v.art))
      return erzeugeLeitungsVerknuepfungCommand(doc, ergebnis)
    }
    return [leitungSchritt, verknuepfenSchritt]
  })

  fuehreAenderungAus(kontext, text, schritte)
  if (kontext.vorgaben().verlegeVorgaben.leitungZone) kontext.nachZonenZuweisung()
  kontext.meldeAenderung(label)

  const zeichnung = doc.getZeichnung()
  const verlegt = ids.map((id) => {
    const blatt = zeichnung.blaetter.find((b) => b.objekte.some((o) => o.id === id))
    const l = blatt?.objekte.find((o): o is LeitungsObjekt => o.id === id && o.type === 'leitung')
    if (!blatt || !l) return { id }
    const laenge = l.pfadSegmente.reduce(
      (s, seg) => s + seg.slice(1).reduce((summe, p, j) => summe + distance(seg[j], p), 0),
      0,
    )
    const moeglich =
      !verknuepft.has(id) &&
      ermittleLeitungsVerknuepfung(zeichnung, kontext.katalogKomponenten(), blatt.id, id)
    return {
      id,
      nummer: l.nummer,
      von: endeText(l.start),
      nach: endeText(l.ziel),
      laengeAufBlattM: runde(laenge, 2),
      ...(l.trunkDurchgaenge.length > 0 ? { trunks: l.trunkDurchgaenge.length } : {}),
      ...(verknuepft.has(id) ? { angelegt: verknuepft.get(id) } : {}),
      ...(moeglich
        ? {
            moeglich: t('kiMeldungen.leitungVerlegen.moeglich', {
              art: verknuepfungText(moeglich.art),
            }),
          }
        : {}),
    }
  })
  return { daten: { verlegt, rueckgaengig: label } }
}
