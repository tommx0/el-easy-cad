import type {
  Blatt,
  BoundingBox,
  CatalogComponent,
  Installationszone,
  KabelschachtObjekt,
  KomponentenObjekt,
  LeitungsObjekt,
  LizenzModul,
  Point,
  TrunkObjekt,
  Zeichnung,
  ZonenDefinition,
} from '../document-model'
import {
  abgeleitetePfadSegmente,
  brauchtRaumhoehe,
  zonenDefinition,
  aufgeloesteVariante,
  ermittleTrunkKette,
  rechteckEcken,
  ermittleAlleLeitungsLaengen,
  kabelEnden,
  kabeltypText,
  teilPfad,
  bestimmeIfcZuordnung,
  boundingBoxUeberlappt,
  ermittleTypUndSlots,
  getBoundingBox,
  IFC_KLASSE_OHNE_ZUORDNUNG,
  IFC_KLASSE_ZUBEHOER,
  istNurAnsicht,
  istVariablerText,
  GERAETE_TIEFE_METER,
  montagehoeheMeter,
  typDefinition,
  wirksameGeschosshoehe,
  zonenHoeheMeter,
  deckenstaerkeAusKoten,
  raumquerungFuer,
  raumquerungsUmgebung,
  stueckeMitZone,
  versetzeAnWand,
  raumrichtungVon,
  stehtAllein,
  wandpunktVon,
  deckenstaerkeMeter,
  verlegungVon,
  ermittleStromkreisZuordnungen,
  verteilerKennzeichenText,
  planspracheVon,
  zonenText,
  type StromkreisZuordnung,
} from '../document-model'
import { erzeugeUebersetzer, formatiereZahl, oberflaechensprache, t } from '../sprache'
import type { Sprache, Uebersetzer } from '../sprache'

import {
  EXPORT_RUECKFALL_GESCHOSSHOEHE,
  EXPORT_RUECKFALL_RAUMHOEHE,
  modellDrehung,
  modellPunkt,
} from './export-lage'
import { baueExportBauteile, ordneGeraeteRaeumenZu, type ExportBauteile } from './export-bauteile'

export {
  EXPORT_RUECKFALL_GESCHOSSHOEHE,
  EXPORT_RUECKFALL_RAUMHOEHE,
  ermittleTreppenoeffnungen,
  geschossHoeheNachOben,
  modellDrehung,
  modellPunkt,
} from './export-lage'

export const EXPORT_RUECKFALL_ZONE: Installationszone = 'oben'
export { GERAETE_TIEFE_METER }

export type ExportWert =
  | { art: 'text'; wert: string }
  | { art: 'bezeichner'; wert: string }
  | { art: 'laenge'; wert: number }
  | { art: 'positivlaenge'; wert: number }
  | { art: 'strom'; wert: number }
  | { art: 'spannung'; wert: number }
  | { art: 'leistung'; wert: number }
  | { art: 'ganzzahl'; wert: number }
  | { art: 'bemessung'; groesse: 'strom' | 'spannung'; wert: number }

export interface ExportPset {
  name: string
  werte: Record<string, ExportWert>
}

export interface ExportQuader {
  mitte: Point
  breite: number
  tiefe: number
  drehung: number
  z: number
  hoehe: number
}

export interface ExportTyp {
  schluessel: string
  klasse: string
  typ: string
  typName?: string
  name: string
  psets: ExportPset[]
}

export interface ExportGeraet {
  id: string
  blattId: string
  klasse: string
  typ: string
  typName?: string
  name: string
  kennzeichen?: string
  quader: ExportQuader
  typSchluessel: string
  psets: ExportPset[]
  baugruppe?: string
}

export interface ExportBaugruppe {
  id: string
  blattId: string
  name: string
  quader: ExportQuader
  psets: ExportPset[]
}

export interface ExportGeschoss {
  blattId: string
  name: string
  kote: number
  ifcGuid?: string
  raumhoehe: number
  deckenstaerke: number
  zone: Installationszone
  zonenHoehe: number
  zonen: readonly ZonenDefinition[]
}

export interface Punkt3 {
  x: number
  y: number
  z: number
}

export interface ExportLeitung {
  id: string
  blattId: string
  nummer: number
  name: string
  achse: Punkt3[]
  zonen: (Installationszone | null)[]
  psets: ExportPset[]
  anschluesse: { geraetId: string; ende: 'start' | 'ziel' }[]
}

export interface ExportStromkreis {
  nummer: number
  name: string
  schluessel?: string
  leitungIds: string[]
  geraetIds: string[]
}

export interface ExportTraeger {
  id: string
  blattId: string
  name: string
  art: 'kanal' | 'trasse' | 'rohr'
  achse: Punkt3[]
  querschnitt: { breite: number; hoehe: number } | { durchmesser: number }
  psets: ExportPset[]
}

export interface ExportTrunkGruppe {
  id: string
  name: string
  leitungIds: string[]
  traegerIds: string[]
}

export interface ExportSchacht {
  id: string
  blattId: string
  name: string
  quader: ExportQuader
}

export interface IfcExportModell {
  projektName: string
  geschosse: ExportGeschoss[]
  typen: ExportTyp[]
  geraete: ExportGeraet[]
  baugruppen: ExportBaugruppe[]
  leitungen: ExportLeitung[]
  stromkreise: ExportStromkreis[]
  trunkGruppen: ExportTrunkGruppe[]
  traeger: ExportTraeger[]
  schaechte: ExportSchacht[]
  bauteile: ExportBauteile
  bericht: string[]
  sprache: Sprache
}

export interface ExportKontext {
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  module?: readonly LizenzModul[]
  sprache?: string
}

export function exportBlaetter(zeichnung: Zeichnung, module?: readonly LizenzModul[]): Blatt[] {
  return module ? zeichnung.blaetter.filter((b) => !istNurAnsicht(b, module)) : zeichnung.blaetter
}

export function exportGeschosse(
  zeichnung: Zeichnung,
  bericht: string[],
  blaetter: readonly Blatt[] = zeichnung.blaetter,
): ExportGeschoss[] {
  const ergebnis: (Omit<ExportGeschoss, 'deckenstaerke' | 'zonenHoehe'> & {
    eigeneDecke?: number
  })[] = []
  let vorige: { kote: number; blatt: Blatt } | null = null
  for (const blatt of blaetter) {
    const g = blatt.geschoss
    let kote = g?.kote
    if (kote === undefined) {
      kote = vorige ? vorige.kote + geschossAbstand(zeichnung, vorige.blatt) : 0
      if (vorige)
        bericht.push(t('ifc.bericht.keineKote', { blatt: blatt.name, kote: berichtMeter(kote) }))
    }
    const raumhoehe = g?.raumhoehe ?? EXPORT_RUECKFALL_RAUMHOEHE
    const eigene = zeichnung.installationszonen ?? []
    const zone = zonenDefinition(g?.installationszone, eigene)
      ? g!.installationszone!
      : EXPORT_RUECKFALL_ZONE
    if (
      zone !== g?.installationszone ||
      (brauchtRaumhoehe(zonenDefinition(zone, eigene)) && g?.raumhoehe === undefined)
    )
      bericht.push(
        t('ifc.bericht.unvollstaendigesGeschoss', {
          blatt: blatt.name,
          zone: zonenText(zonenDefinition(zone, eigene)!, oberflaechensprache()),
          raumhoehe: berichtMeter(raumhoehe),
        }),
      )
    ergebnis.push({
      blattId: blatt.id,
      name: g?.name ?? blatt.name,
      kote,
      ...(g?.ifcGuid ? { ifcGuid: g.ifcGuid } : {}),
      raumhoehe,
      zone,
      zonen: eigene,
      ...(g?.deckenstaerke !== undefined ? { eigeneDecke: g.deckenstaerke } : {}),
    })
    vorige = { kote, blatt }
  }
  return ergebnis.map(({ eigeneDecke, ...g }) => {
    let darueber: number | undefined
    for (const x of ergebnis)
      if (x.kote > g.kote && (darueber === undefined || x.kote < darueber)) darueber = x.kote
    const deckenstaerke = eigeneDecke ?? deckenstaerkeAusKoten(g.kote, g.raumhoehe, darueber)
    return {
      ...g,
      deckenstaerke,
      zonenHoehe:
        zonenHoeheMeter(
          { installationszone: g.zone, raumhoehe: g.raumhoehe },
          g.zone,
          deckenstaerke,
          zeichnung.installationszonen,
        ) ?? g.raumhoehe,
    }
  })
}

function geschossAbstand(zeichnung: Zeichnung, blatt: Blatt): number {
  for (const o of blatt.objekte) {
    if (o.type !== 'kabelschacht') continue
    return wirksameGeschosshoehe(zeichnung, o.verbundId, blatt.id)?.meter ?? o.geschosshoehe
  }
  return EXPORT_RUECKFALL_GESCHOSSHOEHE
}

function zonenWerte(
  geschoss: ExportGeschoss,
  eigene: Installationszone | undefined,
  tp: Uebersetzer,
  sprache: Sprache,
): Record<string, ExportWert> {
  const zone = zonenDefinition(exportZonenKennung(geschoss, eigene), geschoss.zonen)
  if (!zone) return {}
  return {
    InstallationZone: text(zonenText(zone, sprache)),
    InstallationMethod: text(
      tp(zone.verlegung === 'auf' ? 'ifc.datei.verlegeart.auf' : 'ifc.datei.verlegeart.in'),
    ),
  }
}

function berichtMeter(m: number): string {
  return t('ifc.bericht.meter', {
    wert: formatiereZahl(m, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  })
}

const text = (wert: string): ExportWert => ({ art: 'text', wert })

export const PSET_KOMPONENTE = 'EEasyCAD_Component'
export const PSET_LEITUNG = 'EEasyCAD_Cable'

function pset(name: string, werte: Record<string, ExportWert | undefined>): ExportPset[] {
  const gefiltert: Record<string, ExportWert> = {}
  for (const [k, w] of Object.entries(werte))
    if (w !== undefined && !(typeof w.wert === 'string' && w.wert.trim() === '')) gefiltert[k] = w
  return Object.keys(gefiltert).length > 0 ? [{ name, werte: gefiltert }] : []
}

function quaderVon(
  blatt: Blatt,
  k: KomponentenObjekt,
  z: number,
  hoehe: number,
  mitte: Point = mitteImRaum(k),
): ExportQuader {
  return {
    mitte: modellPunkt(blatt, mitte),
    breite: k.breiteWelt ?? k.groesseWelt,
    tiefe: k.groesseWelt,
    drehung: modellDrehung(blatt, k.drehung),
    z,
    hoehe,
  }
}

function quaderUnterPutz(
  blatt: Blatt,
  k: KomponentenObjekt,
  zeichnung: Zeichnung,
  z: number,
  mitte: Point = mitteImRaum(k),
): ExportQuader {
  if (k.montageort === 'decke') {
    const hoehe = Math.min(GERAETE_TIEFE_METER, deckenstaerkeMeter(zeichnung, blatt) / 2)
    return quaderVon(blatt, k, z + GERAETE_TIEFE_METER, hoehe, mitte)
  }
  if (k.montageort === 'boden') {
    return quaderVon(blatt, k, z - GERAETE_TIEFE_METER, GERAETE_TIEFE_METER, mitte)
  }
  const wand = wandpunktVon(k)
  const raum = raumrichtungVon(k)
  if (!wand || !raum) return quaderVon(blatt, k, z, GERAETE_TIEFE_METER, mitte)
  const wandObjekt = blatt.objekte.find((o) => o.type === 'wand' && o.id === k.wandstelle?.wandId)
  const quer = Math.min(
    k.groesseWelt,
    wandObjekt?.type === 'wand' ? wandObjekt.staerke / 2 : GERAETE_TIEFE_METER,
  )
  const vor = (mitte.x - wand.x) * raum.x + (mitte.y - wand.y) * raum.y
  const inDerWand = {
    x: mitte.x - raum.x * (vor + quer / 2),
    y: mitte.y - raum.y * (vor + quer / 2),
  }
  const schritte = (k.kombination?.drehungSchritte ?? 0) + (k.kombination?.drehungEinzeln ?? 0)
  return {
    ...quaderVon(blatt, k, z, GERAETE_TIEFE_METER, inDerWand),
    ...(schritte % 2 === 1 ? { breite: quer } : { tiefe: quer }),
  }
}

function mitteImRaum(k: KomponentenObjekt): Point {
  const wand = wandpunktVon(k)
  const raum = raumrichtungVon(k)
  if (!wand || !raum) return k.position
  const halb = k.groesseWelt / 2
  return { x: wand.x + raum.x * halb, y: wand.y + raum.y * halb }
}

export const KOMBINATION_STAPEL_LUFT_METER = 0.01

interface StapelLage {
  index: number
  mitte: Point
}

function kombinationsSaeulen(komponenten: readonly KomponentenObjekt[]): Map<string, StapelLage> {
  const gruppen = new Map<string, KomponentenObjekt[]>()
  for (const k of komponenten) {
    if (!k.wandstelle || !k.kombination || stehtAllein(k)) continue
    if (k.montageort === 'decke' || k.montageort === 'boden') continue
    const schluessel = `${k.wandstelle.id}|${k.kombination.hoeheCm}|${k.kombination.nr}`
    const liste = gruppen.get(schluessel)
    if (liste) liste.push(k)
    else gruppen.set(schluessel, [k])
  }
  const lagen = new Map<string, StapelLage>()
  for (const glieder of gruppen.values()) {
    if (glieder.length < 2) continue
    glieder.sort((a, b) => a.kombination!.platz - b.kombination!.platz)
    const punkte = glieder.map(mitteImRaum)
    const mitte = {
      x: punkte.reduce((summe, p) => summe + p.x, 0) / punkte.length,
      y: punkte.reduce((summe, p) => summe + p.y, 0) / punkte.length,
    }
    glieder.forEach((k, index) => lagen.set(k.id, { index, mitte }))
  }
  return lagen
}

export function baueExportModell(kontext: ExportKontext): IfcExportModell {
  const { zeichnung, katalog } = kontext
  const sprache = planspracheVon({ plansprache: kontext.sprache ?? zeichnung.plansprache })
  const tp = erzeugeUebersetzer(sprache)
  const bericht: string[] = []
  const blaetter = exportBlaetter(zeichnung, kontext.module)
  for (const b of zeichnung.blaetter)
    if (!blaetter.includes(b)) bericht.push(t('ifc.bericht.nurAnsicht', { blatt: b.name }))
  const geschosse = exportGeschosse(zeichnung, bericht, blaetter)
  const eintraege = new Map(katalog.map((c) => [c.id, c]))
  const typen = new Map<string, ExportTyp>()
  const geraete: ExportGeraet[] = []
  const baugruppen: ExportBaugruppe[] = []
  const zubehoer = new Map<string, string[]>()

  for (const blatt of blaetter) {
    const komponenten = blatt.objekte.filter((o): o is KomponentenObjekt => o.type === 'komponente')
    const traegerIds = new Set(komponenten.filter((k) => k.modulTraeger).map((k) => k.id))
    const zubehoerTeile: KomponentenObjekt[] = []
    const saeulen = kombinationsSaeulen(komponenten)

    for (const k of komponenten) {
      const eintrag = eintraege.get(k.catalogComponentId)
      const variante = eintrag ? aufgeloesteVariante(eintrag, k.variantId, sprache) : null
      const name = variante?.name ?? tp('ifc.datei.komponente')
      const mh = montagehoeheMeter(k, zeichnung, blatt)
      const saeule = saeulen.get(k.id)
      const versatz = (saeule?.index ?? 0) * (GERAETE_TIEFE_METER + KOMBINATION_STAPEL_LUFT_METER)
      const unterkante = mh - versatz - GERAETE_TIEFE_METER / 2
      const quader =
        verlegungVon(k) === 'in'
          ? quaderUnterPutz(blatt, k, zeichnung, unterkante, saeule?.mitte)
          : quaderVon(blatt, k, unterkante, GERAETE_TIEFE_METER, saeule?.mitte)
      const herstellerPset = pset(PSET_KOMPONENTE, {
        Manufacturer: eintrag?.hersteller ? text(eintrag.hersteller) : undefined,
        ArticleNumber: variante?.artikelnummer ? text(variante.artikelnummer) : undefined,
        ProductName: text(name),
      })

      if (k.modulTraeger) {
        baugruppen.push({ id: k.id, blattId: blatt.id, name, quader, psets: herstellerPset })
        continue
      }
      const typ = ermittleTypUndSlots(k, zeichnung)?.typ
      const zuordnung = bestimmeIfcZuordnung(eintrag, typ ? typDefinition(typ) : undefined)
      if (zuordnung.klasse === IFC_KLASSE_ZUBEHOER) {
        zubehoerTeile.push(k)
        continue
      }

      const typSchluessel = `${k.catalogComponentId}#${k.variantId ?? ''}`
      if (!typen.has(typSchluessel)) {
        const b = variante?.bemessung ?? {}
        typen.set(typSchluessel, {
          schluessel: typSchluessel,
          klasse: zuordnung.klasse,
          typ: zuordnung.typ,
          ...(zuordnung.typName ? { typName: zuordnung.typName } : {}),
          name,
          psets: [
            ...pset('Pset_ManufacturerTypeInformation', {
              Manufacturer: eintrag?.hersteller ? text(eintrag.hersteller) : undefined,
              ArticleNumber: variante?.artikelnummer
                ? { art: 'bezeichner', wert: variante.artikelnummer }
                : undefined,
              ModelLabel: text(name),
            }),
            ...(zuordnung.klasse === IFC_KLASSE_OHNE_ZUORDNUNG
              ? []
              : pset('Pset_ElectricalDeviceCommon', {
                  RatedCurrent:
                    b.nennstrom !== undefined
                      ? { art: 'bemessung', groesse: 'strom', wert: b.nennstrom }
                      : undefined,
                  RatedVoltage:
                    b.nennspannung !== undefined
                      ? { art: 'bemessung', groesse: 'spannung', wert: b.nennspannung }
                      : undefined,
                  NumberOfPoles:
                    b.polzahl !== undefined ? { art: 'ganzzahl', wert: b.polzahl } : undefined,
                  IP_Code: b.ipSchutzart ? text(b.ipSchutzart) : undefined,
                })),
          ],
        })
      }

      const slots = ermittleTypUndSlots(k, zeichnung)?.slots ?? []
      const variableTexte: Record<string, ExportWert | undefined> = {}
      for (const t of k.textElemente ?? [])
        if (istVariablerText(t) && t.variable) variableTexte[t.variable] = text(t.text)
      geraete.push({
        id: k.id,
        blattId: blatt.id,
        klasse: zuordnung.klasse,
        typ: zuordnung.typ,
        ...(zuordnung.typName ? { typName: zuordnung.typName } : {}),
        name,
        ...(k.geraeteKennzeichen ? { kennzeichen: k.geraeteKennzeichen } : {}),
        quader,
        typSchluessel,
        psets: [
          ...pset(PSET_KOMPONENTE, {
            Manufacturer: eintrag?.hersteller ? text(eintrag.hersteller) : undefined,
            ArticleNumber: variante?.artikelnummer ? text(variante.artikelnummer) : undefined,
            ProductName: text(name),
            MountingHeight: { art: 'laenge', wert: mh },
            MountingLocation:
              k.montageort === 'decke' || k.montageort === 'boden'
                ? text(tp(`ifc.datei.montageort.${k.montageort}`))
                : undefined,
            InstallationMethod: text(tp(`ifc.datei.verlegeartKuerzel.${verlegungVon(k)}`)),
            PoEPower:
              eintrag?.poeLeistungWatt !== undefined
                ? { art: 'leistung', wert: eintrag.poeLeistungWatt }
                : undefined,
            ...variableTexte,
          }),
          ...(zuordnung.klasse === 'IfcSwitchingDevice' && slots.length > 0
            ? pset('Pset_SwitchingDeviceTypeCommon', {
                NumberOfGangs: { art: 'ganzzahl', wert: slots.length },
              })
            : []),
        ],
        ...(k.traegerId && traegerIds.has(k.traegerId) ? { baugruppe: k.traegerId } : {}),
      })
    }

    const ziele = komponenten.filter(
      (k) => !zubehoerTeile.includes(k) && (k.modulTraeger || geraete.some((g) => g.id === k.id)),
    )
    for (const teil of zubehoerTeile) {
      const box = getBoundingBox(teil)
      const ziel = naechstesZiel(box, teil.position, ziele)
      const eintrag = eintraege.get(teil.catalogComponentId)
      const v = eintrag ? aufgeloesteVariante(eintrag, teil.variantId, sprache) : null
      const beschreibung = [v?.name ?? tp('ifc.datei.zubehoer'), v?.artikelnummer]
        .filter(Boolean)
        .join(' · ')
      if (!ziel) {
        bericht.push(
          t('ifc.bericht.zubehoerOhneGeraet', { blatt: blatt.name, zubehoer: beschreibung }),
        )
        continue
      }
      zubehoer.set(ziel.id, [...(zubehoer.get(ziel.id) ?? []), beschreibung])
    }
  }

  const { leitungen, stromkreise } = baueLeitungen(
    zeichnung,
    blaetter,
    geschosse,
    geraete,
    katalog,
    tp,
    sprache,
  )
  const { trunkGruppen, traeger } = baueTrunks(zeichnung, blaetter, geschosse, bericht, tp)
  const schaechte = baueSchaechte(zeichnung, blaetter, tp)
  const bauteile = baueExportBauteile(blaetter, geschosse, bericht, tp)
  ordneGeraeteRaeumenZu(bauteile.raeume, blaetter, new Set(geraete.map((g) => g.id)))

  for (const [id, liste] of zubehoer) {
    const ziel: { psets: ExportPset[] } | undefined =
      geraete.find((g) => g.id === id) ?? baugruppen.find((b) => b.id === id)
    if (!ziel) continue
    const eigene = ziel.psets.find((p) => p.name === PSET_KOMPONENTE)
    const wert = text(liste.join('; '))
    if (eigene) eigene.werte['Accessories'] = wert
    else ziel.psets.push({ name: PSET_KOMPONENTE, werte: { Accessories: wert } })
  }

  return {
    projektName: zeichnung.name,
    geschosse,
    typen: [...typen.values()],
    geraete,
    baugruppen,
    leitungen,
    stromkreise,
    trunkGruppen,
    traeger,
    schaechte,
    bauteile,
    bericht,
    sprache,
  }
}

export const VORGABE_QUERSCHNITT = {
  kanal: { breite: 0.06, hoehe: 0.04 },
  trasse: { breite: 0.2, hoehe: 0.06 },
  rohr: { durchmesser: 0.025 },
} as const

function baueTrunks(
  zeichnung: Zeichnung,
  blaetter: readonly Blatt[],
  geschosse: readonly ExportGeschoss[],
  bericht: string[],
  tp: Uebersetzer,
): { trunkGruppen: ExportTrunkGruppe[]; traeger: ExportTraeger[] } {
  const geschossVon = new Map(geschosse.map((g) => [g.blattId, g]))
  const exportiert = new Set(blaetter.map((b) => b.id))
  const gesehen = new Set<string>()
  const trunkGruppen: ExportTrunkGruppe[] = []
  const traeger: ExportTraeger[] = []
  const ohneMass = new Map<string, { trunk: string; art: 'kanal' | 'trasse' | 'rohr' }>()

  for (const blatt of blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'trunk' || gesehen.has(o.id)) continue
      const kette = ermittleTrunkKette(zeichnung, blatt.id, o.id).filter((g) =>
        exportiert.has(g.blattId),
      )
      for (const g of kette) gesehen.add(g.trunk.id)
      const trunkIds = new Set(kette.map((g) => g.trunk.id))
      const leitungIds: string[] = []
      for (const b of blaetter)
        for (const l of b.objekte)
          if (l.type === 'leitung' && l.trunkDurchgaenge.some((d) => trunkIds.has(d.trunkId)))
            leitungIds.push(l.id)

      const traegerIds: string[] = []
      for (const g of kette) {
        const art = g.trunk.ausfuehrung
        if (!art || art === 'buendel') continue
        const b = blaetter.find((x) => x.id === g.blattId)!
        const geschoss = geschossVon.get(g.blattId)
        const zone = geschoss ? exportZone(geschoss, g.trunk.installationszone) : 0
        const passend =
          g.trunk.abmessung &&
          (art === 'rohr' ? 'durchmesser' in g.trunk.abmessung : 'breite' in g.trunk.abmessung)
        const querschnitt = passend ? g.trunk.abmessung! : VORGABE_QUERSCHNITT[art]
        if (!passend) ohneMass.set(`${g.trunk.name}|${art}`, { trunk: g.trunk.name, art })
        const masse =
          'durchmesser' in querschnitt
            ? { NominalWidth: querschnitt.durchmesser, NominalHeight: querschnitt.durchmesser }
            : { NominalWidth: querschnitt.breite, NominalHeight: querschnitt.hoehe }
        traeger.push({
          id: g.trunk.id,
          blattId: g.blattId,
          name: tp('ifc.datei.traeger', {
            trunk: g.trunk.name,
            ausfuehrung: tp(`ifc.datei.ausfuehrung.${art}`),
          }),
          art,
          achse: g.trunk.wegpunkte.map((p) => ({ ...modellPunkt(b, p), z: zone })),
          querschnitt,
          psets: pset(TRAEGER_PSET[art], {
            NominalWidth: { art: 'positivlaenge', wert: masse.NominalWidth },
            NominalHeight: { art: 'positivlaenge', wert: masse.NominalHeight },
          }),
        })
        traegerIds.push(g.trunk.id)
      }
      trunkGruppen.push({ id: o.id, name: o.name, leitungIds, traegerIds })
    }
  }
  for (const { trunk, art } of ohneMass.values())
    bericht.push(
      t('ifc.bericht.ohneAbmessung', { trunk, ausfuehrung: t(`ifc.datei.ausfuehrung.${art}`) }),
    )
  return { trunkGruppen, traeger }
}

const TRAEGER_PSET = {
  kanal: 'Pset_CableCarrierSegmentTypeCableTrunkingSegment',
  trasse: 'Pset_CableCarrierSegmentTypeCableTraySegment',
  rohr: 'Pset_CableCarrierSegmentTypeConduitSegment',
} as const

function baueSchaechte(
  zeichnung: Zeichnung,
  blaetter: readonly Blatt[],
  tp: Uebersetzer,
): ExportSchacht[] {
  const ergebnis: ExportSchacht[] = []
  for (const blatt of blaetter)
    for (const o of blatt.objekte) {
      if (o.type !== 'kabelschacht') continue
      const schacht: KabelschachtObjekt = o
      const ecken = rechteckEcken(schacht)
      const mitte = {
        x: ecken.reduce((a, p) => a + p.x, 0) / ecken.length,
        y: ecken.reduce((a, p) => a + p.y, 0) / ecken.length,
      }
      const hoehe =
        wirksameGeschosshoehe(zeichnung, schacht.verbundId, blatt.id)?.meter ??
        schacht.geschosshoehe
      ergebnis.push({
        id: schacht.id,
        blattId: blatt.id,
        name: schacht.name || tp('ifc.datei.kabelschacht'),
        quader: {
          mitte: modellPunkt(blatt, mitte),
          breite: schacht.breite,
          tiefe: schacht.hoehe,
          drehung: modellDrehung(blatt, schacht.drehung),
          z: 0,
          hoehe: Math.max(hoehe, 0.01),
        },
      })
    }
  return ergebnis
}

export function exportZone(
  geschoss: ExportGeschoss,
  eigene: Installationszone | undefined,
): number {
  if (!eigene) return geschoss.zonenHoehe
  return (
    zonenHoeheMeter(
      { installationszone: eigene, raumhoehe: geschoss.raumhoehe },
      eigene,
      geschoss.deckenstaerke,
      geschoss.zonen,
    ) ?? geschoss.zonenHoehe
  )
}

export function exportZonenKennung(
  geschoss: ExportGeschoss,
  eigene: Installationszone | undefined,
): Installationszone {
  return eigene && zonenDefinition(eigene, geschoss.zonen) ? eigene : geschoss.zone
}

function stuecke2d(
  leitung: LeitungsObjekt,
  blatt: Blatt,
  zonen: readonly ZonenDefinition[],
): { punkte: readonly Point[]; zone: Installationszone | undefined }[] {
  const segmente = abgeleitetePfadSegmente(leitung, blatt.objekte)
  const raumquerung = raumquerungFuer(leitung, raumquerungsUmgebung(blatt, zonen))
  const anWand = (teile: ReturnType<typeof stueckeMitZone>) =>
    raumquerung
      ? versetzeAnWand(teile, raumquerung.waende, (zone) =>
          zonenDefinition(
            zone ?? leitung.installationszone ?? blatt.geschoss?.installationszone,
            zonen,
          ),
        )
      : teile
  const stuecke: { punkte: Point[]; zone: Installationszone | undefined; frei?: boolean }[] = []
  segmente.forEach((segment, i) => {
    if (segment.some((p) => Math.hypot(p.x - segment[0].x, p.y - segment[0].y) > 1e-6))
      for (const teil of anWand(stueckeMitZone(segment, leitung, raumquerung))) {
        const zone = teil.zone ?? leitung.installationszone
        const letztes = stuecke[stuecke.length - 1]
        if (letztes?.frei && letztes.zone === zone) letztes.punkte.push(teil.bis)
        else stuecke.push({ punkte: [teil.von, teil.bis], zone, frei: true })
      }
    const durchgang = leitung.trunkDurchgaenge[i]
    if (!durchgang) return
    const trunk = blatt.objekte.find(
      (o): o is TrunkObjekt => o.type === 'trunk' && o.id === durchgang.trunkId,
    )
    if (trunk)
      stuecke.push({
        punkte: [...teilPfad(trunk.wegpunkte, durchgang.eintrittT, durchgang.austrittT)],
        zone: trunk.installationszone,
      })
  })
  return stuecke
}

function achseAusStuecken(
  stuecke: readonly { punkte: readonly Point[]; z: number; zone: Installationszone }[],
): { achse: Punkt3[]; zonen: (Installationszone | null)[] } {
  const achse: Punkt3[] = []
  const zonen: (Installationszone | null)[] = []
  for (const { punkte, z, zone } of stuecke)
    for (const p of punkte) {
      const letzter = achse[achse.length - 1]
      if (letzter && Math.abs(letzter.z - z) > 1e-9) {
        achse.push({ x: letzter.x, y: letzter.y, z })
        zonen.push(null)
      }
      const zuletzt = achse[achse.length - 1]
      if (!zuletzt || Math.hypot(p.x - zuletzt.x, p.y - zuletzt.y) > 1e-6) {
        if (zuletzt) zonen.push(zone)
        achse.push({ ...p, z })
      }
    }
  return { achse, zonen }
}

function komponenteAuf(blatt: Blatt | undefined, id: string): KomponentenObjekt | undefined {
  return blatt?.objekte.find((o): o is KomponentenObjekt => o.type === 'komponente' && o.id === id)
}

function baueLeitungen(
  zeichnung: Zeichnung,
  blaetter: readonly Blatt[],
  geschosse: readonly ExportGeschoss[],
  geraete: ExportGeraet[],
  katalog: readonly CatalogComponent[],
  tp: Uebersetzer,
  sprache: Sprache,
): { leitungen: ExportLeitung[]; stromkreise: ExportStromkreis[] } {
  const zuordnungen = ermittleStromkreisZuordnungen(zeichnung, katalog)
  const geschossVon = new Map(geschosse.map((g) => [g.blattId, g]))
  const blattVon = new Map(blaetter.map((b) => [b.id, b]))
  const geraetVon = new Map(geraete.map((g) => [g.id, g]))
  const leitungen: ExportLeitung[] = []
  const stromkreise: ExportStromkreis[] = []
  const kreisJeSchutzorgan = new Map<string, ExportStromkreis>()
  const stromkreiseJeGeraet = new Map<string, string[]>()
  const switchportJeGeraet = new Map<string, string[]>()

  for (const kabel of ermittleAlleLeitungsLaengen(zeichnung)) {
    const glieder = kabel.glieder.filter((g) => blattVon.has(g.blattId))
    if (glieder.length === 0) continue
    const kabeltyp = kabeltypText(kabel.glieder[0].leitung, zeichnung.kabeltypen)
    const name = tp('ifc.datei.leitung', { nummer: String(kabel.nummer) })
    const leitungIds: string[] = []

    const stueckeJeGlied = glieder.map((glied) => {
      const blatt = blattVon.get(glied.blattId)!
      const geschoss = geschossVon.get(glied.blattId)!
      return stuecke2d(glied.leitung, blatt, geschoss.zonen).map((st) => ({
        punkte: st.punkte.map((p) => modellPunkt(blatt, p)),
        z: exportZone(geschoss, st.zone),
        zone: exportZonenKennung(geschoss, st.zone),
      }))
    })

    glieder.forEach((glied, i) => {
      const blatt = blattVon.get(glied.blattId)!
      const geschoss = geschossVon.get(glied.blattId)!
      const { achse, zonen } = achseAusStuecken(stueckeJeGlied[i])
      if (!achse.some((p) => Math.hypot(p.x - achse[0].x, p.y - achse[0].y) > 1e-6)) return
      const anschluesse: ExportLeitung['anschluesse'] = []

      for (const ende of ['start', 'ziel'] as const) {
        const ziel = glied.leitung[ende]
        const randpunkt = ende === 'start' ? achse[0] : achse[achse.length - 1]
        const vorne = (p: Punkt3) => {
          if (ende === 'start') {
            achse.unshift(p)
            zonen.unshift(null)
          } else {
            achse.push(p)
            zonen.push(null)
          }
        }
        if (ziel.art === 'dock') {
          const k = komponenteAuf(blatt, ziel.objektId)
          const quader = geraetVon.get(ziel.objektId)?.quader
          if (k)
            vorne({
              x: randpunkt.x,
              y: randpunkt.y,
              z: quader ? quader.z + quader.hoehe / 2 : montagehoeheMeter(k, zeichnung, blatt),
            })
          if (geraetVon.has(ziel.objektId)) anschluesse.push({ geraetId: ziel.objektId, ende })
        } else if (ziel.art === 'switchport') {
          if (geraetVon.has(ziel.objektId)) anschluesse.push({ geraetId: ziel.objektId, ende })
        } else if (ziel.art === 'schacht') {
          const nachbarIndex = ende === 'ziel' ? i + 1 : i - 1
          const nachbar = glieder[nachbarIndex]
          const oben = nachbar && geschossVon.get(nachbar.blattId)
          if (oben && oben.kote > geschoss.kote) {
            const dort = stueckeJeGlied[nachbarIndex]
            const amSchacht = ende === 'ziel' ? dort[0] : dort[dort.length - 1]
            vorne({
              x: randpunkt.x,
              y: randpunkt.y,
              z: oben.kote - geschoss.kote + (amSchacht?.z ?? oben.zonenHoehe),
            })
          }
        }
      }

      leitungen.push({
        id: glied.leitung.id,
        blattId: glied.blattId,
        nummer: kabel.nummer,
        name,
        achse,
        zonen,
        psets: pset(PSET_LEITUNG, {
          CableNumber: { art: 'ganzzahl', wert: kabel.nummer },
          CableType: kabeltyp ? text(kabeltyp) : undefined,
          ...zonenWerte(geschoss, glied.leitung.installationszone, tp, sprache),
          InstalledLength:
            kabel.status === 'gueltig'
              ? { art: 'laenge', wert: kabel.verlegeLaengeMeter }
              : undefined,
          PlanLength:
            kabel.status === 'gueltig' ? { art: 'laenge', wert: kabel.planLaengeMeter } : undefined,
        }),
        anschluesse,
      })
      leitungIds.push(glied.leitung.id)
    })

    const enden = kabelEnden(kabel)
    const schutzorgan =
      kabel.glieder
        .flatMap((g) => zuordnungen.leitungen.get(g.leitung.id) ?? [])
        .map(schutzorganVon)
        .find((x) => x !== null) ?? null
    const endGeraete = enden
      ? [enden.start, enden.ziel].flatMap((e) =>
          (e.art === 'dock' || e.art === 'switchport') &&
          geraetVon.has(e.objektId) &&
          !(schutzorgan && e.objektId === schutzorgan.verteilerId)
            ? [e.objektId]
            : [],
        )
      : []
    for (const id of endGeraete)
      stromkreiseJeGeraet.set(id, [
        ...(stromkreiseJeGeraet.get(id) ?? []),
        schutzorgan?.name ?? String(kabel.nummer),
      ])
    if (enden)
      for (const [port, gegen] of [
        [enden.start, enden.ziel],
        [enden.ziel, enden.start],
      ] as const)
        if (port.art === 'switchport' && gegen.art === 'dock' && geraetVon.has(gegen.objektId)) {
          const switchName = geraetVon.get(port.objektId)?.name ?? 'Switch'
          switchportJeGeraet.set(gegen.objektId, [
            ...(switchportJeGeraet.get(gegen.objektId) ?? []),
            tp('ifc.datei.switchPort', { name: switchName, port: String(port.portIndex + 1) }),
          ])
        }
    if (schutzorgan && (leitungIds.length > 0 || endGeraete.length > 0)) {
      const kreis = kreisJeSchutzorgan.get(schutzorgan.schluessel)
      if (kreis) {
        kreis.nummer = Math.min(kreis.nummer, kabel.nummer)
        kreis.leitungIds.push(...leitungIds)
        kreis.geraetIds = [...new Set([...kreis.geraetIds, ...endGeraete])]
      } else {
        const neu: ExportStromkreis = {
          nummer: kabel.nummer,
          name: schutzorgan.name,
          schluessel: schutzorgan.schluessel,
          leitungIds: [...leitungIds],
          geraetIds: [...new Set(endGeraete)],
        }
        kreisJeSchutzorgan.set(schutzorgan.schluessel, neu)
        stromkreise.push(neu)
      }
    } else if (leitungIds.length > 0 || endGeraete.length > 0)
      stromkreise.push({
        nummer: kabel.nummer,
        name,
        leitungIds,
        geraetIds: [...new Set(endGeraete)],
      })
  }

  for (const g of geraete) {
    for (const z of zuordnungen.komponenten.get(g.id) ?? []) {
      const organ = schutzorganVon(z)
      if (!organ) continue
      const kreis = kreisJeSchutzorgan.get(organ.schluessel)
      if (kreis && !kreis.geraetIds.includes(g.id)) kreis.geraetIds.push(g.id)
      const namen = stromkreiseJeGeraet.get(g.id) ?? []
      if (!namen.includes(organ.name)) stromkreiseJeGeraet.set(g.id, [...namen, organ.name])
    }
  }

  for (const g of geraete) {
    const eigene = g.psets.find((p) => p.name === PSET_KOMPONENTE)
    if (!eigene) continue
    const kreise = stromkreiseJeGeraet.get(g.id)
    if (kreise) eigene.werte['Circuit'] = text([...new Set(kreise)].join(', '))
    const ports = switchportJeGeraet.get(g.id)
    if (ports) eigene.werte['SwitchPort'] = text(ports.join(', '))
  }
  return { leitungen, stromkreise }
}

function naechstesZiel(
  box: BoundingBox,
  mitte: Point,
  kandidaten: KomponentenObjekt[],
): KomponentenObjekt | null {
  let bestes: KomponentenObjekt | null = null
  let besterAbstand = Infinity
  for (const k of kandidaten) {
    if (!boundingBoxUeberlappt(box, getBoundingBox(k))) continue
    const abstand = Math.hypot(k.position.x - mitte.x, k.position.y - mitte.y)
    if (abstand < besterAbstand) {
      bestes = k
      besterAbstand = abstand
    }
  }
  return bestes
}

function schutzorganVon(
  z: StromkreisZuordnung,
): { schluessel: string; name: string; verteilerId: string } | null {
  if (!z.stromkreis) return null
  return {
    schluessel: `${z.verteilerKennzeichen}-${z.stromkreis}`,
    name: `${verteilerKennzeichenText(z.verteilerKennzeichen)}-${z.stromkreis}`,
    verteilerId: z.verteilerId,
  }
}
