import type {
  Blatt,
  BodenplattenObjekt,
  KomponentenObjekt,
  Point,
  RaumObjekt,
  TreppenForm,
  TreppenObjekt,
  WandObjekt,
  WandOeffnung,
} from '../document-model'
import {
  aussparungenInPlatte,
  ermittleWandAnschluesse,
  ermittleWandTeilstuecke,
  oeffnungenAufWand,
  oeffnungOffen,
  pfadGesamtLaenge,
  pointInPolygon,
  raumartName,
  teilPfad,
  treppenFormText,
  treppenTrittplatten,
  versetztePolylinie,
} from '../document-model'
import { t } from '../sprache'
import type { Texte, Uebersetzer } from '../sprache'
import { ermittleTreppenoeffnungen, geschossHoeheNachOben, modellPunkt } from './export-lage'
import type { ExportGeschoss } from './export-modell'

export interface ExportPrisma {
  grundriss: Point[]
  z: number
  hoehe: number
  loecher?: Point[][]
}

interface ExportBauteilBasis {
  id: string
  blattId: string
  name: string
  ifcGuid?: string
}

export interface ExportOeffnung extends ExportBauteilBasis {
  art: 'tuer' | 'fenster' | 'wanddurchbruch'
  breite: number
  hoehe: number
  aussparung: ExportPrisma
  fuellung?: ExportPrisma
}

export interface ExportWand extends ExportBauteilBasis {
  staerke: number
  hoehe: number
  koerper: ExportPrisma[]
  oeffnungen: ExportOeffnung[]
}

export interface ExportPlatte extends ExportBauteilBasis {
  staerke: number
  koerper: ExportPrisma
}

export interface ExportTreppe extends ExportBauteilBasis {
  form: TreppenForm
  steigungen: number
  steigung: number
  koerper: ExportPrisma[]
}

export interface ExportRaum extends ExportBauteilBasis {
  flaeche: number
  hoehe: number
  koerper: ExportPrisma
  raumart?: string
  geraetIds: string[]
}

export interface ExportBauteile {
  waende: ExportWand[]
  platten: ExportPlatte[]
  treppen: ExportTreppe[]
  raeume: ExportRaum[]
}

const AUSSPARUNG_UEBERSTAND = 0.01
const FUELLUNG_STAERKE = 0.05

export function baueExportBauteile(
  blaetter: readonly Blatt[],
  geschosse: readonly ExportGeschoss[],
  bericht: string[],
  tp: Uebersetzer,
): ExportBauteile {
  const ergebnis: ExportBauteile = { waende: [], platten: [], treppen: [], raeume: [] }
  const geschossVon = new Map(geschosse.map((g) => [g.blattId, g]))
  const vergeben = new Set<string>()
  let doppelt = 0
  const guid = (o: { ifcGuid?: string }): { ifcGuid?: string } => {
    if (!o.ifcGuid) return {}
    if (vergeben.has(o.ifcGuid)) {
      doppelt++
      return {}
    }
    vergeben.add(o.ifcGuid)
    return { ifcGuid: o.ifcGuid }
  }

  const { vonUnten } = ermittleTreppenoeffnungen(blaetter, geschosse)
  for (const blatt of blaetter) {
    const geschoss = geschossVon.get(blatt.id)
    if (!geschoss) continue
    const m = (p: Point) => modellPunkt(blatt, p)
    const wandHoehe = geschoss.raumhoehe + geschoss.deckenstaerke
    const oeffnungen = vonUnten.get(blatt.id) ?? []
    for (const o of blatt.objekte) {
      if (o.type === 'wand' && o.punkte.length >= 2)
        ergebnis.waende.push(exportWand(o, blatt, wandHoehe, m, guid, tp))
      else if (o.type === 'bodenplatte' && o.punkte.length >= 3) {
        const platte = exportPlatte(o, blatt, m, guid, oeffnungen, tp)
        if (platte) ergebnis.platten.push(platte)
      } else if (o.type === 'treppe') {
        const treppe = exportTreppe(
          o,
          blatt,
          geschossHoeheNachOben(geschoss, geschosse),
          m,
          guid,
          tp,
        )
        if (treppe) ergebnis.treppen.push(treppe)
      } else if (o.type === 'raum' && o.gueltig && o.umriss.length >= 3)
        ergebnis.raeume.push(exportRaum(o, blatt, geschoss.raumhoehe, m, guid, tp))
    }
  }

  const oeffnungen = ergebnis.waende.flatMap((w) => w.oeffnungen)
  const anzahl = (n: number, art: keyof Texte['ifc']['bericht']['anzahl']) =>
    n ? [t(`ifc.bericht.anzahl.${art}`, { n })] : []
  const teile = [
    ...anzahl(ergebnis.waende.length, 'waende'),
    ...anzahl(oeffnungen.filter((o) => o.art === 'tuer').length, 'tueren'),
    ...anzahl(oeffnungen.filter((o) => o.art === 'fenster').length, 'fenster'),
    ...anzahl(oeffnungen.filter((o) => o.art === 'wanddurchbruch').length, 'durchbrueche'),
    ...anzahl(ergebnis.treppen.length, 'treppen'),
    ...anzahl(ergebnis.platten.length, 'platten'),
    ...anzahl(ergebnis.raeume.length, 'raeume'),
  ]
  if (teile.length) bericht.push(t('ifc.bericht.bauteile', { liste: teile.join(', ') }))
  if (doppelt) bericht.push(t('ifc.bericht.doppelteKennung', { n: doppelt }))
  return ergebnis
}

export function ordneGeraeteRaeumenZu(
  raeume: ExportRaum[],
  blaetter: readonly Blatt[],
  geraetIds: ReadonlySet<string>,
): void {
  const blattVon = new Map(blaetter.map((b) => [b.id, b]))
  for (const raum of raeume) {
    const blatt = blattVon.get(raum.blattId)
    const objekt = blatt?.objekte.find((o) => o.id === raum.id)
    if (!blatt || objekt?.type !== 'raum') continue
    raum.geraetIds = blatt.objekte
      .filter(
        (o): o is KomponentenObjekt =>
          o.type === 'komponente' &&
          geraetIds.has(o.id) &&
          pointInPolygon(o.position, objekt.umriss),
      )
      .map((o) => o.id)
  }
}

type Guid = (o: { ifcGuid?: string }) => { ifcGuid?: string }

function geschlossen(punkte: Point[]): boolean {
  const a = punkte[0]
  const b = punkte[punkte.length - 1]
  return punkte.length > 2 && Math.hypot(a.x - b.x, a.y - b.y) < 1e-6
}

function flaecheMitVorzeichen(punkte: Point[]): number {
  let summe = 0
  for (let i = 0; i < punkte.length; i++) {
    const a = punkte[i]
    const b = punkte[(i + 1) % punkte.length]
    summe += a.x * b.y - b.x * a.y
  }
  return summe / 2
}

function umriss(achse: Point[], halbe: number): Point[] {
  return [...versetztePolylinie(achse, halbe), ...versetztePolylinie(achse, -halbe).reverse()]
}

function exportWand(
  wand: WandObjekt,
  blatt: Blatt,
  hoehe: number,
  m: (p: Point) => Point,
  guid: Guid,
  tp: Uebersetzer,
): ExportWand {
  let koerper: ExportPrisma[]
  if (geschlossen(wand.punkte)) {
    const [teil] = ermittleWandTeilstuecke(wand, [])
    const [gross, klein] = [teil.aussen, teil.innen].sort(
      (a, b) => Math.abs(flaecheMitVorzeichen(b)) - Math.abs(flaecheMitVorzeichen(a)),
    )
    koerper = [{ grundriss: gross.map(m), z: 0, hoehe, loecher: [klein.map(m)] }]
  } else {
    koerper = ermittleWandTeilstuecke(wand, [], ermittleWandAnschluesse(wand, blatt.objekte)).map(
      (t) => ({ grundriss: [...t.aussen, ...[...t.innen].reverse()].map(m), z: 0, hoehe }),
    )
  }
  const gesamt = pfadGesamtLaenge(wand.punkte)
  const oeffnungen =
    gesamt > 0
      ? oeffnungenAufWand(blatt.objekte, wand.id).flatMap((o) => {
          const e = exportOeffnung(o, wand, blatt, gesamt, hoehe, m, guid, tp)
          return e ? [e] : []
        })
      : []
  return {
    id: wand.id,
    blattId: blatt.id,
    name: tp('ifc.datei.wand'),
    ...guid(wand),
    staerke: wand.staerke,
    hoehe,
    koerper,
    oeffnungen,
  }
}

function exportOeffnung(
  o: WandOeffnung,
  wand: WandObjekt,
  blatt: Blatt,
  gesamt: number,
  wandHoehe: number,
  m: (p: Point) => Point,
  guid: Guid,
  tp: Uebersetzer,
): ExportOeffnung | null {
  const halbT = o.breite / 2 / gesamt
  const achse = teilPfad(wand.punkte, Math.max(0, o.t - halbT), Math.min(1, o.t + halbT))
  if (achse.length < 2) return null
  const [unten, oben] = oeffnungOffen(o)
  const hoehe = Math.min(oben, wandHoehe) - unten
  if (hoehe <= 1e-3) return null
  const lage = { z: unten, hoehe }
  return {
    id: o.id,
    blattId: blatt.id,
    name: tp(`ifc.datei.${o.type}`),
    ...guid(o),
    art: o.type,
    breite: o.breite,
    hoehe,
    aussparung: {
      grundriss: umriss(achse, wand.staerke / 2 + AUSSPARUNG_UEBERSTAND).map(m),
      ...lage,
    },
    ...(o.type === 'wanddurchbruch'
      ? {}
      : {
          fuellung: {
            grundriss: umriss(achse, Math.min(FUELLUNG_STAERKE, wand.staerke) / 2).map(m),
            ...lage,
          },
        }),
  }
}

function exportPlatte(
  platte: BodenplattenObjekt,
  blatt: Blatt,
  m: (p: Point) => Point,
  guid: Guid,
  oeffnungen: Point[][],
  tp: Uebersetzer,
): ExportPlatte | null {
  const grundriss = platte.punkte.map(m)
  const loecher = oeffnungen.length ? aussparungenInPlatte(grundriss, oeffnungen) : []
  if (loecher === null) return null
  return {
    id: platte.id,
    blattId: blatt.id,
    name: tp('ifc.datei.bodenplatte'),
    ...guid(platte),
    staerke: platte.staerke,
    koerper: {
      grundriss,
      z: platte.oberkante - platte.staerke,
      hoehe: platte.staerke,
      ...(loecher.length ? { loecher } : {}),
    },
  }
}

function exportTreppe(
  treppe: TreppenObjekt,
  blatt: Blatt,
  geschossHoehe: number,
  m: (p: Point) => Point,
  guid: Guid,
  tp: Uebersetzer,
): ExportTreppe | null {
  const { platten, steigungen, steigung } = treppenTrittplatten(treppe, geschossHoehe)
  if (platten.length === 0) return null
  return {
    id: treppe.id,
    blattId: blatt.id,
    name: tp('ifc.datei.treppe', { form: treppenFormText(treppe.form, tp) }),
    ...guid(treppe),
    form: treppe.form,
    steigungen,
    steigung,
    koerper: platten.map((p) => ({ grundriss: p.polygon.map(m), z: p.z, hoehe: p.hoehe })),
  }
}

function exportRaum(
  raum: RaumObjekt,
  blatt: Blatt,
  raumhoehe: number,
  m: (p: Point) => Point,
  guid: Guid,
  tp: Uebersetzer,
): ExportRaum {
  return {
    id: raum.id,
    blattId: blatt.id,
    name: raum.name.trim() || tp('ifc.datei.raum'),
    ...guid(raum),
    ...(raum.raumart && { raumart: raumartName(raum.raumart, tp) }),
    flaeche: raum.flaeche,
    hoehe: raumhoehe,
    koerper: { grundriss: raum.umriss.map(m), z: 0, hoehe: raumhoehe },
    geraetIds: [],
  }
}
