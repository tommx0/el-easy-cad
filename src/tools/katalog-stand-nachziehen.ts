import type {
  CatalogComponent,
  DockpunkteKonfiguration,
  DocumentStore,
  KatalogTextElement,
  KomponentenObjekt,
  LizenzModul,
  Objekt,
  Point,
} from '../document-model'
import {
  dockpunktBezeichnung,
  getDockpoints,
  grundGroesseWelt,
  kombinierbarkeitNachziehen,
  istNurAnsicht,
  istTrunkDockpunkt,
  istVariablerText,
  naechstesVerteilerKennzeichen,
  portAnzahl,
  rotatePoint,
  slotsBeimPlatzieren,
  typHatAnsteuerung,
  uebernimmVariablenWerte,
} from '../document-model'
import type { RoutingSettings } from '../routing'
import { CompositeCommand, ohneBlattsperre, type Command } from './command'
import { buendleProBlatt } from './commands'
import {
  berechneGruppenRerouteMitZustand,
  berechneTrunkRerouteMitZustand,
} from './gruppenverschiebung'
import { berechneSchaltverbindungReroute } from './schaltverbindung-routing'
import { t } from '../sprache'

export interface AbgedocktesEnde {
  blattId: string
  objektId: string
  art: 'leitung' | 'trunk' | 'schaltverbindung'
  komponentenId: string
}

export interface KatalogStandErgebnis {
  command: Command | null
  aktualisiert: number
  abgedockt: AbgedocktesEnde[]
  kennzeichenKonflikte: { blattId: string; objektId: string; wert: string }[]
  fehlgeschlageneLeitungenAnzahl: number
}

export function erzeugeKatalogStandCommand(
  doc: DocumentStore,
  katalog: ReadonlyMap<string, CatalogComponent>,
  settings: RoutingSettings,
  module: readonly LizenzModul[] = [],
): KatalogStandErgebnis {
  const eintraege: Parameters<typeof buendleProBlatt>[1] = []
  const abgedockt: AbgedocktesEnde[] = []
  const kennzeichenKonflikte: KatalogStandErgebnis['kennzeichenKonflikte'] = []
  let aktualisiert = 0
  let fehlgeschlageneLeitungenAnzahl = 0
  const kennzeichen = new KennzeichenBestand(doc.getZeichnung())

  for (const blatt of doc.getZeichnung().blaetter) {
    if (istNurAnsicht(blatt, module)) continue
    const patches = new Map<string, Partial<KomponentenObjekt>>()
    const zuordnungen = new Map<string, (index: number) => number | null>()
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente' || o.modulTraeger || o.knxAktor) continue
      const eintrag = katalog.get(o.catalogComponentId)
      if (!eintrag || eintrag.herkunft !== 'standard') continue
      const vorlaeufig = katalogPatch(o, eintrag)
      const zuordnung = ordneDockpunkteZu(o, { ...o, ...vorlaeufig })
      const zusatz = kennzeichenPatch(o, eintrag, kennzeichen, (wert) =>
        kennzeichenKonflikte.push({ blattId: blatt.id, objektId: o.id, wert }),
      )
      const patch = {
        ...vorlaeufig,
        dockpunkte: mitAlterBezeichnung(o, vorlaeufig, zuordnung),
        ...zusatz,
      }
      if (Object.keys(zusatz).length === 0 && gleicheGeometrie(o, { ...o, ...patch })) continue
      patches.set(o.id, patch)
      zuordnungen.set(o.id, zuordnung)
    }
    if (patches.size === 0) continue
    aktualisiert += patches.size

    const umnummeriert = blatt.objekte.map((o) =>
      nummeriereUm(o, zuordnungen, (ende) => abgedockt.push({ blattId: blatt.id, ...ende })),
    )
    const neuePfade = berechneGruppenRerouteMitZustand(
      umnummeriert,
      patches,
      settings,
      blatt.geschoss,
    )
    const neueTrunkWege = berechneTrunkRerouteMitZustand(umnummeriert, patches)
    const neueSchaltwege = berechneSchaltverbindungReroute(umnummeriert, patches, settings)
    fehlgeschlageneLeitungenAnzahl += umnummeriert.filter(
      (o) =>
        o.type === 'leitung' &&
        ((o.start.art === 'dock' && patches.has(o.start.objektId)) ||
          (o.ziel.art === 'dock' && patches.has(o.ziel.objektId))) &&
        !neuePfade.has(o.id),
    ).length

    eintraege.push({
      blattId: blatt.id,
      aendern: (aktuelle) =>
        aktuelle.map((original) => {
          const o = nummeriereUm(original, zuordnungen, () => {})
          if (o.type === 'komponente') {
            const patch = patches.get(o.id)
            return patch ? { ...o, ...patch } : o
          }
          if (o.type === 'leitung') {
            const pfadSegmente = neuePfade.get(o.id)
            return pfadSegmente ? { ...o, pfadSegmente } : o
          }
          if (o.type === 'trunk') {
            const wegpunkte = neueTrunkWege.get(o.id)
            return wegpunkte ? { ...o, wegpunkte } : o
          }
          if (o.type === 'schaltverbindung') {
            const wegpunkte = neueSchaltwege.get(o.id)
            return wegpunkte ? { ...o, wegpunkte } : o
          }
          return o
        }),
    })
  }

  if (eintraege.length === 0) {
    return {
      command: null,
      aktualisiert: 0,
      abgedockt: [],
      kennzeichenKonflikte: [],
      fehlgeschlageneLeitungenAnzahl: 0,
    }
  }
  const label = t('werkzeuge.katalogStand.uebernehmen')
  const command = ohneBlattsperre(
    new CompositeCommand(label, buendleProBlatt(doc, eintraege, label)),
  )
  return { command, aktualisiert, abgedockt, kennzeichenKonflikte, fehlgeschlageneLeitungenAnzahl }
}

const KENNZEICHEN_PLATZHALTER = /^[A-Za-z]*x{2,}$/

class KennzeichenBestand {
  private readonly betriebsmittel = new Set<string>()
  private readonly verteiler: string[] = []
  constructor(zeichnung: ReturnType<DocumentStore['getZeichnung']>) {
    for (const blatt of zeichnung.blaetter) {
      for (const o of blatt.objekte) {
        if (o.type !== 'komponente') continue
        if (o.geraeteKennzeichen) this.betriebsmittel.add(o.geraeteKennzeichen)
        if (o.verteiler) this.verteiler.push(o.verteiler.kennzeichen)
      }
    }
  }
  istFrei(wert: string): boolean {
    return !this.betriebsmittel.has(wert)
  }
  wechsle(alt: string | undefined, neu: string) {
    if (alt) this.betriebsmittel.delete(alt)
    this.betriebsmittel.add(neu)
  }
  naechsterVerteiler(): string {
    const kennzeichen = naechstesVerteilerKennzeichen({ blaetter: [] }, this.verteiler)
    this.verteiler.push(kennzeichen)
    return kennzeichen
  }
}

function kennzeichenPatch(
  alt: KomponentenObjekt,
  eintrag: CatalogComponent,
  bestand: KennzeichenBestand,
  konflikt: (wert: string) => void,
): Partial<KomponentenObjekt> {
  const patch: Partial<KomponentenObjekt> = {}
  const bezeichnung = alt.textElemente?.find((t) => t.variable === 'Bezeichnung')?.text.trim()
  const entfallen = !eintrag.textElemente?.some((t) => t.variable === 'Bezeichnung')
  if (
    bezeichnung &&
    entfallen &&
    !KENNZEICHEN_PLATZHALTER.test(bezeichnung) &&
    bezeichnung !== alt.geraeteKennzeichen
  ) {
    if (bestand.istFrei(bezeichnung)) {
      patch.geraeteKennzeichen = bezeichnung
      bestand.wechsle(alt.geraeteKennzeichen, bezeichnung)
    } else {
      konflikt(bezeichnung)
    }
  }
  if (eintrag.bauart === 'verteiler' && !alt.verteiler) {
    patch.verteiler = { kennzeichen: bestand.naechsterVerteiler(), bestueckung: [] }
  }
  if (eintrag.typ && !alt.typ && !alt.gruppeId) {
    patch.typ = eintrag.typ
    const { slots, slotMatrix } = slotsBeimPlatzieren(eintrag)
    if (slots) patch.slots = slots
    if (slotMatrix) patch.slotMatrix = slotMatrix
    if (typHatAnsteuerung(eintrag.typ) && eintrag.ansteuerung)
      patch.ansteuerung = eintrag.ansteuerung
  }
  return patch
}

function katalogPatch(
  alt: KomponentenObjekt,
  eintrag: CatalogComponent,
): Partial<KomponentenObjekt> {
  const patch: Partial<KomponentenObjekt> = {
    dockpunkte: eintrag.dockpunkte,
    fangpunkt: eintrag.fangpunkt,
    textElemente: mitAltenTexten(alt.textElemente, eintrag.textElemente),
    modulSystem: eintrag.modulSystem,
  }
  if (alt.traegerId) return patch
  const kombi = kombinierbarkeitNachziehen(alt, eintrag.kombinierbar)
  Object.assign(patch, kombi.patch)
  const grund = grundGroesseWelt(kombi.basis)
  const hoehenFaktor =
    eintrag.hoehenFaktor && eintrag.hoehenFaktor !== 1 ? eintrag.hoehenFaktor : undefined
  return {
    ...patch,
    breiteWelt: eintrag.breitenFaktor ? grund * eintrag.breitenFaktor : undefined,
    groesseWelt: grund * (hoehenFaktor ?? 1),
    hoehenFaktor,
  }
}

function mitAltenTexten(
  alt: readonly KatalogTextElement[] | undefined,
  neu: readonly KatalogTextElement[] | undefined,
): KatalogTextElement[] | undefined {
  const mitVariablen = uebernimmVariablenWerte(alt, neu)
  if (!mitVariablen || !alt) return mitVariablen
  return mitVariablen.map((e, i) =>
    !istVariablerText(e) && alt[i] && !istVariablerText(alt[i]) ? { ...e, text: alt[i].text } : e,
  )
}

function mitAlterBezeichnung(
  alt: KomponentenObjekt,
  patch: Partial<KomponentenObjekt>,
  zuordnung: (index: number) => number | null,
): DockpunkteKonfiguration | undefined {
  const neu = patch.dockpunkte
  if (neu?.modus !== 'frei' || alt.dockpunkte?.modus !== 'frei') return neu
  const punkte = neu.punkte.map((p) => ({ ...p }))
  alt.dockpunkte.punkte.forEach((p, i) => {
    const j = zuordnung(i)
    if (j !== null && p.bezeichnung !== undefined && punkte[j])
      punkte[j].bezeichnung = p.bezeichnung
  })
  return { ...neu, punkte }
}

export function ordneDockpunkteZu(
  alt: KomponentenObjekt,
  neu: KomponentenObjekt,
): (index: number) => number | null {
  if (alt.dockpunkte?.modus === 'ports' && neu.dockpunkte?.modus === 'ports') {
    const altPorts = portAnzahl(alt)
    const neuPorts = portAnzahl(neu)
    const neuGesamt = getDockpoints(neu).length
    return (index) => {
      if (index < altPorts) return index < neuPorts ? index : null
      const j = neuPorts + (index - altPorts)
      return j < neuGesamt ? j : null
    }
  }

  const altPunkte = getDockpoints(alt).map((p) => aufDemSymbol(p, alt))
  const neuPunkte = getDockpoints(neu).map((p) => aufDemSymbol(p, neu))
  const gleichAuf = 1e-6
  const nahGenug = 0.25
  const zuordnung = new Map<number, number>()
  const vergeben = new Set<number>()
  const gleicheArt = (i: number, j: number) =>
    istTrunkDockpunkt(alt, i) === istTrunkDockpunkt(neu, j)
  const setze = (i: number, j: number) => {
    zuordnung.set(i, j)
    vergeben.add(j)
  }

  const gleicherAufbau =
    altPunkte.length === neuPunkte.length &&
    altPunkte.every((p, i) => gleicheArt(i, i) && abstand(p, neuPunkte[i]) <= nahGenug)
  if (gleicherAufbau) return (index) => (index < neuPunkte.length ? index : null)

  altPunkte.forEach((p, i) => {
    if (i < neuPunkte.length && gleicheArt(i, i) && abstand(p, neuPunkte[i]) <= gleichAuf)
      setze(i, i)
  })
  altPunkte.forEach((_, i) => {
    if (zuordnung.has(i)) return
    const bezeichnung = dockpunktBezeichnung(alt.dockpunkte, i)
    if (!bezeichnung) return
    const j = neuPunkte.findIndex(
      (_, k) =>
        !vergeben.has(k) &&
        gleicheArt(i, k) &&
        dockpunktBezeichnung(neu.dockpunkte, k) === bezeichnung,
    )
    if (j >= 0) setze(i, j)
  })
  const paare: { i: number; j: number; d: number }[] = []
  altPunkte.forEach((p, i) => {
    if (zuordnung.has(i)) return
    neuPunkte.forEach((q, j) => {
      const d = abstand(p, q)
      if (!vergeben.has(j) && gleicheArt(i, j) && d <= nahGenug) paare.push({ i, j, d })
    })
  })
  paare.sort((a, b) => a.d - b.d)
  for (const { i, j } of paare) {
    if (!zuordnung.has(i) && !vergeben.has(j)) setze(i, j)
  }
  return (index) => zuordnung.get(index) ?? null
}

function aufDemSymbol(p: Point, instanz: KomponentenObjekt): Point {
  const lokal = rotatePoint(p, instanz.position, -instanz.drehung)
  const breite = instanz.breiteWelt ?? instanz.groesseWelt
  return {
    x: (lokal.x - instanz.position.x) / breite + 0.5,
    y: (lokal.y - instanz.position.y) / instanz.groesseWelt + 0.5,
  }
}

function abstand(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function gleicheGeometrie(a: KomponentenObjekt, b: KomponentenObjekt): boolean {
  const form = (o: KomponentenObjekt) =>
    JSON.stringify(
      {
        dockpunkte: ohneBezeichnungen(o.dockpunkte),
        fangpunkt: o.fangpunkt,
        textLagen: o.textElemente?.map(({ text: _text, ...lage }) => lage),
        breiteWelt: o.breiteWelt,
        groesseWelt: o.groesseWelt,
        hoehenFaktor: o.hoehenFaktor,
        modulSystem: o.modulSystem,
        kombinierbar: o.kombinierbar,
      },
      (_schluessel, wert: unknown) =>
        typeof wert === 'number' ? Math.round(wert * 1e9) / 1e9 : wert,
    )
  return form(a) === form(b)
}

function ohneBezeichnungen(
  d: DockpunkteKonfiguration | undefined,
): DockpunkteKonfiguration | undefined {
  if (d?.modus !== 'frei') return d
  return { ...d, punkte: d.punkte.map(({ bezeichnung: _b, ...rest }) => rest) }
}

function nummeriereUm(
  o: Objekt,
  zuordnungen: ReadonlyMap<string, (index: number) => number | null>,
  melde: (ende: Omit<AbgedocktesEnde, 'blattId'>) => void,
): Objekt {
  if (o.type === 'leitung') {
    let geaendert = false
    const ende = <T extends (typeof o)['start']>(e: T): T => {
      if (e.art !== 'dock') return e
      const f = zuordnungen.get(e.objektId)
      if (!f) return e
      const j = f(e.dockpunktIndex)
      if (j === e.dockpunktIndex) return e
      geaendert = true
      if (j === null) {
        melde({ objektId: o.id, art: 'leitung', komponentenId: e.objektId })
        return { art: 'frei' } as T
      }
      return { ...e, dockpunktIndex: j }
    }
    const start = ende(o.start)
    const ziel = ende(o.ziel)
    return geaendert ? { ...o, start, ziel } : o
  }
  if (o.type === 'schaltverbindung') {
    let geaendert = false
    const ende = <T extends (typeof o)['start']>(e: T): T => {
      if (e.art !== 'dock') return e
      const f = zuordnungen.get(e.objektId)
      if (!f) return e
      const neu = e.dockpunktIndizes.map(f)
      if (neu.every((j, k) => j === e.dockpunktIndizes[k])) return e
      geaendert = true
      if (neu.some((j) => j === null)) {
        melde({ objektId: o.id, art: 'schaltverbindung', komponentenId: e.objektId })
        return { art: 'frei' } as T
      }
      return { ...e, dockpunktIndizes: neu as number[] }
    }
    const start = ende(o.start)
    const ziel = ende(o.ziel)
    return geaendert ? { ...o, start, ziel } : o
  }
  if (o.type === 'trunk') {
    let geaendert = false
    const enden = o.enden.map((e) => {
      const f = e.dockRef ? zuordnungen.get(e.dockRef.objektId) : undefined
      if (!f || !e.dockRef) return e
      const j = f(e.dockRef.dockpunktIndex)
      if (j === e.dockRef.dockpunktIndex) return e
      geaendert = true
      if (j === null) {
        melde({ objektId: o.id, art: 'trunk', komponentenId: e.dockRef.objektId })
        const { dockRef: _dockRef, ...rest } = e
        return rest
      }
      return { ...e, dockRef: { ...e.dockRef, dockpunktIndex: j } }
    }) as typeof o.enden
    return geaendert ? { ...o, enden } : o
  }
  return o
}
