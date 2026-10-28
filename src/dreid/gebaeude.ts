import type {
  Blatt,
  BodenplattenObjekt,
  Point,
  RaumObjekt,
  TreppenObjekt,
  WandObjekt,
} from '../document-model'
import {
  aussparungenInPlatte,
  DURCHBRUCH_HOEHE_METER,
  ermittleWandAnschluesse,
  fensterBruestung,
  fensterHoehe,
  gehrungAmEnde,
  oeffnungenAufWand,
  oeffnungOffen,
  pfadGesamtLaenge,
  treppenFormText,
  treppenTrittplatten,
  tuerHoehe,
  versetztePolylinie,
  type WandOeffnung,
} from '../document-model'
import { formatiereZahl, t } from '../sprache'
import { aussenNormalen } from './aussenwaende'
import { wandAnsicht, type SzenenWandAbschnitt } from './wandansicht'
import {
  ermittleTreppenoeffnungen,
  geschossHoeheNachOben,
  modellPunkt,
  type ExportGeschoss,
  type Punkt3,
} from '../ifc/export-modell'

export interface SzenenPrisma {
  id: string
  blattId: string
  art: 'wand' | 'treppe' | 'boden' | 'decke'
  grundriss: Point[]
  z: number
  hoehe: number
  farbe: string
  deckkraft: number
  loecher?: Point[][]
  info: { titel: string; zeilen: string[] } | null
  wand?: SzenenWandAbschnitt[]
  aussenNormalen?: Point[]
}

export interface SzenenText {
  blattId: string
  position: Punkt3
  text: string
}

export const BODEN_STAERKE_METER = 0.05

const WAND_FARBE = '#cfcac2'
const WAND_DECKKRAFT = 0.45
const TREPPE_FARBE = '#b9b2a6'
const TREPPE_DECKKRAFT = 0.7
const BODEN_FARBE = '#e6e1d8'
const BODEN_DECKKRAFT = 0.35
const DECKE_FARBE = '#ddd8cf'

export const infoMeter = (m: number): string =>
  t('dreid.info.meter', {
    wert: formatiereZahl(m, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  })

export function baueGebaeude(
  blaetter: readonly Blatt[],
  geschosse: readonly ExportGeschoss[],
  huelleBlaetter: ReadonlySet<string> = new Set(),
): { prismen: SzenenPrisma[]; texte: SzenenText[] } {
  const prismen: SzenenPrisma[] = []
  const texte: SzenenText[] = []
  const geschossVon = new Map(geschosse.map((g) => [g.blattId, g]))
  const treppenoeffnungen = ermittleTreppenoeffnungen(blaetter, geschosse)
  const ausgespart = (p: SzenenPrisma, oeffnungen: Point[][] | undefined): SzenenPrisma | null => {
    if (!oeffnungen?.length) return p
    const loecher = aussparungenInPlatte(p.grundriss, oeffnungen)
    if (loecher === null) return null
    return loecher.length ? { ...p, loecher } : p
  }

  for (const blatt of blaetter) {
    const geschoss = geschossVon.get(blatt.id)
    if (!geschoss) continue
    const m = (p: Point) => modellPunkt(blatt, p)
    const wandHoehe = geschoss.raumhoehe + geschoss.deckenstaerke
    const mitHuelle = huelleBlaetter.has(blatt.id)
    const zeigen = (o: { ifcGuid?: string }) => !(mitHuelle && o.ifcGuid)

    const alleWaende = blatt.objekte.filter((o): o is WandObjekt => o.type === 'wand')
    for (const o of blatt.objekte) {
      if (!zeigen(o)) continue
      if (o.type === 'wand') {
        const normalen = modellRichtungen(aussenNormalen(o, alleWaende), o.punkte[0], m)
        const p = wandPrisma(o, blatt, geschoss, wandHoehe, m)
        if (p) prismen.push({ ...p, aussenNormalen: normalen })
      }
      if (o.type === 'treppe')
        prismen.push(
          ...treppenPrismen(o, blatt, geschoss, geschossHoeheNachOben(geschoss, geschosse), m),
        )
    }

    const platten = blatt.objekte.filter(
      (o): o is BodenplattenObjekt => o.type === 'bodenplatte' && o.punkte.length >= 3,
    )
    const vonUnten = treppenoeffnungen.vonUnten.get(blatt.id)
    for (const o of platten) {
      if (!zeigen(o)) continue
      const p = ausgespart(bodenplattenPrisma(o, blatt, geschoss, m), vonUnten)
      if (p) prismen.push(p)
    }

    const raeume = blatt.objekte.filter(
      (o): o is RaumObjekt => o.type === 'raum' && o.gueltig && o.umriss.length >= 3,
    )
    const bodenflaechen: Point[][] = platten.length
      ? []
      : raeume.length
        ? raeume.filter(zeigen).map((r) => r.umriss.map(m))
        : rechteckUmWaende(
            blatt.objekte.filter((o): o is WandObjekt => o.type === 'wand' && zeigen(o)),
          ).map((ecke) => ecke.map(m))
    for (const [i, grundriss] of bodenflaechen.entries()) {
      const p = ausgespart(
        {
          id: `boden-${blatt.id}-${i}`,
          blattId: blatt.id,
          art: 'boden',
          grundriss,
          z: geschoss.kote - BODEN_STAERKE_METER,
          hoehe: BODEN_STAERKE_METER,
          farbe: BODEN_FARBE,
          deckkraft: BODEN_DECKKRAFT,
          info: null,
        },
        vonUnten,
      )
      if (p) prismen.push(p)
    }

    const eigene = treppenoeffnungen.eigene.get(blatt.id)
    for (const r of raeume.filter(zeigen)) {
      const p = ausgespart(
        {
          id: `decke-${r.id}`,
          blattId: blatt.id,
          art: 'decke',
          grundriss: r.umriss.map(m),
          z: geschoss.kote + geschoss.raumhoehe,
          hoehe: r.deckenstaerke ?? geschoss.deckenstaerke,
          farbe: DECKE_FARBE,
          deckkraft: 1,
          info: null,
        },
        eigene,
      )
      if (p) prismen.push(p)
    }

    for (const r of raeume)
      if (r.name.trim())
        texte.push({
          blattId: blatt.id,
          position: { ...m(r.mittelpunkt), z: geschoss.kote + 0.05 },
          text: r.name,
        })
  }
  return { prismen, texte }
}

function modellRichtungen(
  richtungen: readonly Point[],
  bezug: Point | undefined,
  m: (p: Point) => Point,
): Point[] {
  if (!bezug) return []
  const a = m(bezug)
  return richtungen.map((n) => {
    const b = m({ x: bezug.x + n.x, y: bezug.y + n.y })
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }
  })
}

function wandPrisma(
  wand: WandObjekt,
  blatt: Blatt,
  geschoss: ExportGeschoss,
  hoehe: number,
  m: (p: Point) => Point,
): SzenenPrisma | null {
  const punkte = wand.punkte
  const gesamt = pfadGesamtLaenge(punkte)
  if (punkte.length < 2 || gesamt <= 0) return null
  const halbe = wand.staerke / 2
  const aussen = versetztePolylinie(punkte, halbe)
  const innen = versetztePolylinie(punkte, -halbe)
  const anschluesse = ermittleWandAnschluesse(wand, blatt.objekte)
  for (const [anschluss, amStart] of [
    [anschluesse.start, true],
    [anschluesse.ende, false],
  ] as const) {
    const eck = anschluss ? gehrungAmEnde(punkte, halbe, anschluss, amStart) : null
    if (!eck) continue
    const i = amStart ? 0 : punkte.length - 1
    aussen[i] = eck.aussen
    innen[i] = eck.innen
  }
  const geschlossen =
    punkte.length > 2 &&
    Math.hypot(punkte[0].x - punkte.at(-1)!.x, punkte[0].y - punkte.at(-1)!.y) < 1e-9

  const oeffnungen = oeffnungenAufWand(blatt.objekte, wand.id).map((o) => {
    const mitte = o.t * gesamt
    const { info, offen } = oeffnungsMasse(o, geschoss)
    return { von: mitte - o.breite / 2, bis: mitte + o.breite / 2, offen, info }
  })

  const abschnitte: SzenenWandAbschnitt[] = []
  let start = 0
  for (let k = 0; k < punkte.length - 1; k++) {
    const laenge = Math.hypot(punkte[k + 1].x - punkte[k].x, punkte[k + 1].y - punkte[k].y)
    const ende = start + laenge
    const hier = oeffnungen
      .map((o) => ({
        ...o,
        von: Math.max(o.von, start) - start,
        bis: Math.min(o.bis, ende) - start,
      }))
      .filter((o) => o.bis > o.von)
    if (laenge > 1e-9)
      abschnitte.push({
        von: m(punkte[k]),
        bis: m(punkte[k + 1]),
        laenge,
        innenVon: m(innen[k]),
        aussenVon: m(aussen[k]),
        innenBis: m(innen[k + 1]),
        aussenBis: m(aussen[k + 1]),
        ansicht: wandAnsicht(
          laenge,
          hoehe,
          hier.map((o) => ({ von: o.von, bis: o.bis, unten: o.offen[0], oben: o.offen[1] })),
        ),
        fugeAmAnfang: k > 0 || geschlossen,
        fugeAmEnde: k < punkte.length - 2 || geschlossen,
        oeffnungen: hier.map((o) => ({ von: o.von, bis: o.bis, info: o.info })),
      })
    start = ende
  }
  if (abschnitte.length === 0) return null

  return {
    id: wand.id,
    blattId: blatt.id,
    art: 'wand',
    grundriss: [...aussen, ...[...innen].reverse()].map(m),
    z: geschoss.kote,
    hoehe,
    farbe: WAND_FARBE,
    deckkraft: WAND_DECKKRAFT,
    wand: abschnitte,
    info: {
      titel: t('dreid.gebaeude.wand'),
      zeilen: [
        t('dreid.gebaeude.staerke', { cm: String(Math.round(wand.staerke * 100)) }),
        t('dreid.info.hoehe', { hoehe: infoMeter(hoehe) }),
        t('dreid.info.geschoss', { name: geschoss.name }),
      ],
    },
  }
}

function oeffnungsMasse(
  o: WandOeffnung,
  geschoss: ExportGeschoss,
): { offen: [number, number]; info: NonNullable<SzenenPrisma['info']> } {
  const breite = t('dreid.gebaeude.breite', { breite: infoMeter(o.breite) })
  const wo = t('dreid.info.geschoss', { name: geschoss.name })
  const offen = oeffnungOffen(o)
  if (o.type === 'fenster')
    return {
      offen,
      info: {
        titel: t('dreid.gebaeude.fenster'),
        zeilen: [
          breite,
          t('dreid.gebaeude.bruestungUndHoehe', {
            bruestung: infoMeter(fensterBruestung(o)),
            hoehe: infoMeter(fensterHoehe(o)),
          }),
          wo,
        ],
      },
    }
  if (o.type === 'tuer')
    return {
      offen,
      info: {
        titel: t('dreid.gebaeude.tuer'),
        zeilen: [breite, t('dreid.info.hoehe', { hoehe: infoMeter(tuerHoehe(o)) }), wo],
      },
    }
  return {
    offen,
    info: {
      titel: t('dreid.gebaeude.wanddurchbruch'),
      zeilen: [breite, t('dreid.info.hoehe', { hoehe: infoMeter(DURCHBRUCH_HOEHE_METER) }), wo],
    },
  }
}

function treppenPrismen(
  treppe: TreppenObjekt,
  blatt: Blatt,
  geschoss: ExportGeschoss,
  geschossHoehe: number,
  m: (p: Point) => Point,
): SzenenPrisma[] {
  const { platten, steigungen, steigung } = treppenTrittplatten(treppe, geschossHoehe)
  const info = {
    titel: t('dreid.gebaeude.treppe', { form: treppenFormText(treppe.form) }),
    zeilen: [
      t('dreid.gebaeude.steigungen', { n: steigungen, cm: String(Math.round(steigung * 100)) }),
      t('dreid.info.geschoss', { name: geschoss.name }),
    ],
  }
  return platten.map((p) => ({
    id: treppe.id,
    blattId: blatt.id,
    art: 'treppe',
    grundriss: p.polygon.map(m),
    z: geschoss.kote + p.z,
    hoehe: p.hoehe,
    farbe: TREPPE_FARBE,
    deckkraft: TREPPE_DECKKRAFT,
    info,
  }))
}

function bodenplattenPrisma(
  platte: BodenplattenObjekt,
  blatt: Blatt,
  geschoss: ExportGeschoss,
  m: (p: Point) => Point,
): SzenenPrisma {
  return {
    id: platte.id,
    blattId: blatt.id,
    art: 'boden',
    grundriss: platte.punkte.map(m),
    z: geschoss.kote + platte.oberkante - platte.staerke,
    hoehe: platte.staerke,
    farbe: BODEN_FARBE,
    deckkraft: BODEN_DECKKRAFT,
    info: {
      titel: t('dreid.gebaeude.bodenplatte'),
      zeilen: [
        t('dreid.gebaeude.staerke', { cm: String(Math.round(platte.staerke * 100)) }),
        t('dreid.gebaeude.oberkante', {
          wert: `${platte.oberkante >= 0 ? '+' : '−'}${infoMeter(Math.abs(platte.oberkante))}`,
        }),
        t('dreid.info.geschoss', { name: geschoss.name }),
      ],
    },
  }
}

function rechteckUmWaende(waende: readonly WandObjekt[]): Point[][] {
  const punkte = waende.flatMap((w) =>
    w.punkte.flatMap((p) => [
      { x: p.x - w.staerke / 2, y: p.y - w.staerke / 2 },
      { x: p.x + w.staerke / 2, y: p.y + w.staerke / 2 },
    ]),
  )
  if (punkte.length === 0) return []
  const xs = punkte.map((p) => p.x)
  const ys = punkte.map((p) => p.y)
  const [x1, x2, y1, y2] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  return [
    [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 },
    ],
  ]
}
