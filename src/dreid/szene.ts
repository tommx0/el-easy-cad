import type {
  CatalogComponent,
  KatalogBild,
  KomponentenDarstellung,
  Installationszone,
  KomponentenObjekt,
  LizenzModul,
  Point,
  TrunkObjekt,
  Zeichnung,
  ZonenDefinition,
} from '../document-model'
import {
  aufgeloesteVariante,
  hatStandardFarbe,
  ermittleTypUndSlots,
  STANDARD_FARBE,
  typDefinition,
  waehleKomponentenGrafik,
  regelwerkText,
  zonenDefinition,
  zonenText,
} from '../document-model'
import {
  baueExportModell,
  exportBlaetter,
  exportZone,
  exportZonenKennung,
  modellPunkt,
  PSET_KOMPONENTE,
  PSET_LEITUNG,
  type ExportGeschoss,
  type ExportPset,
  type ExportQuader,
  type Punkt3,
} from '../ifc/export-modell'
import { oberflaechensprache, t } from '../sprache'
import { baueGebaeude, infoMeter, type SzenenPrisma, type SzenenText } from './gebaeude'

export type Farbschema = 'plan' | 'zone' | 'geraetetyp'

export const FARBSCHEMA_NAMEN: Readonly<Record<Farbschema, string>> = {
  get plan() {
    return t('dreid.szene.farbschema.plan')
  },
  get zone() {
    return t('dreid.szene.farbschema.zone')
  },
  get geraetetyp() {
    return t('dreid.szene.farbschema.geraetetyp')
  },
}

export interface SzenenInfo {
  titel: string
  zeilen: string[]
}

export interface SzenenGeschoss {
  blattId: string
  name: string
  kote: number
}

export interface SzenenQuader {
  id: string
  blattId: string
  art: 'geraet' | 'traeger' | 'schacht'
  mitte: Point
  breite: number
  tiefe: number
  drehung: number
  z: number
  hoehe: number
  farbe: string
  deckkraft: number
  info: SzenenInfo
  grafik?: { bild: KatalogBild; art: KomponentenDarstellung; einfaerben: string | null }
}

export interface SzenenLinie {
  id: string
  blattId: string
  art: 'leitung' | 'buendel'
  punkte: Punkt3[]
  farbe: string
  breite: number
  info: SzenenInfo
}

export interface Szene {
  geschosse: SzenenGeschoss[]
  quader: SzenenQuader[]
  linien: SzenenLinie[]
  prismen: SzenenPrisma[]
  texte: SzenenText[]
  legende: { farbe: string; text: string }[]
}

export interface SzenenKontext {
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  module?: readonly LizenzModul[]
  farbschema: Farbschema
  huelleBlaetter?: ReadonlySet<string>
  leitungsverlegungAus?: boolean
}

const NEUTRAL = '#b0b4ba'
const GERAET_STANDARD = '#5f6b7a'
const TRAEGER_FARBE = '#9aa0a6'
const SCHACHT_FARBE = '#c8ccd0'
const SCHACHT_DECKKRAFT = 0.35
const LEITUNG_EINHEITLICH = '#7a7f87'
const LEITUNG_BREITE_PX = 2.5
const BUENDEL_BREITE_PX = 6

export const ZONEN_FARBE_SENKRECHT = '#8a8f98'
export const ZONEN_FARBE_UNBEKANNT = '#5f6368'

export function zonenFarbe(
  zone: Installationszone | null,
  zonen: readonly ZonenDefinition[],
): { farbe: string; text: string } {
  if (zone === null)
    return { farbe: ZONEN_FARBE_SENKRECHT, text: t('dreid.szene.senkrechteStuecke') }
  const definition = zonenDefinition(zone, zonen)
  if (!definition) return { farbe: ZONEN_FARBE_UNBEKANNT, text: t('dreid.szene.andereZone') }
  const index = Math.max(0, zonen.indexOf(definition))
  return {
    farbe: definition.farbe ?? TYP_PALETTE[index % TYP_PALETTE.length],
    text: zonenText(definition, oberflaechensprache()),
  }
}

const TYP_PALETTE = [
  '#3a7bd5',
  '#e07b39',
  '#3c9d5d',
  '#c94c8b',
  '#8e6fd1',
  '#d1b33c',
  '#2fa3a8',
  '#b5563a',
  '#6b8e23',
  '#5c6bc0',
]

export function baueSzene(kontext: SzenenKontext): Szene {
  const { zeichnung, katalog, module, farbschema } = kontext
  const modell = baueExportModell({
    zeichnung,
    katalog,
    module,
    sprache: oberflaechensprache(),
    leitungsverlegungAus: kontext.leitungsverlegungAus,
  })
  const geschossVon = new Map(modell.geschosse.map((g) => [g.blattId, g]))
  const blattVon = new Map(zeichnung.blaetter.map((b) => [b.id, b]))
  const quader: SzenenQuader[] = []
  const linien: SzenenLinie[] = []
  const legende = new Map<string, string>()

  const typFarben = new Map<string, string>()
  const typFarbe = (typ: string) => {
    let farbe = typFarben.get(typ)
    if (!farbe) {
      farbe = TYP_PALETTE[typFarben.size % TYP_PALETTE.length]
      typFarben.set(typ, farbe)
    }
    return farbe
  }

  for (const g of modell.geraete) {
    const geschoss = geschossVon.get(g.blattId)
    const blatt = blattVon.get(g.blattId)
    if (!geschoss || !blatt) continue
    const k = blatt.objekte.find(
      (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === g.id,
    )
    let farbe = !k ? NEUTRAL : k.farbe === STANDARD_FARBE ? GERAET_STANDARD : k.farbe
    if (farbschema === 'zone') farbe = NEUTRAL
    if (farbschema === 'geraetetyp') {
      const typ = k ? ermittleTypUndSlots(k, zeichnung)?.typ : undefined
      farbe = typ ? typFarbe(typ) : NEUTRAL
      const definition = typ ? typDefinition(typ) : undefined
      legende.set(
        farbe,
        definition
          ? regelwerkText(definition, oberflaechensprache())
          : (typ ?? t('dreid.szene.ohneGeraetetyp')),
      )
    }
    const montage = g.quader.z + g.quader.hoehe / 2
    const verlegeart = psetWerte(g.psets, PSET_KOMPONENTE).InstallationMethod
    const eintrag = k ? katalog.find((c) => c.id === k.catalogComponentId) : undefined
    const aufgeloest = k && eintrag ? aufgeloesteVariante(eintrag, k.variantId) : null
    const auswahl =
      k && aufgeloest
        ? waehleKomponentenGrafik(aufgeloest, k.darstellung ?? blatt.komponentenDarstellung)
        : null
    const eigeneFarben = farbschema !== 'geraetetyp' && hatStandardFarbe(k?.farbe ?? '')
    quader.push({
      ...absolut(g.quader, geschoss),
      id: g.id,
      blattId: g.blattId,
      art: 'geraet',
      farbe,
      deckkraft: 1,
      ...(auswahl && k
        ? {
            grafik: {
              bild: auswahl.grafik,
              art: auswahl.art,
              einfaerben: eigeneFarben ? null : farbschema === 'geraetetyp' ? farbe : k.farbe,
            },
          }
        : {}),
      info: {
        titel: g.name,
        zeilen: [
          ...(g.kennzeichen ? [t('dreid.szene.kennzeichen', { kennzeichen: g.kennzeichen })] : []),
          t('dreid.info.geschoss', { name: geschoss.name }),
          t('dreid.szene.montagehoehe', { hoehe: infoMeter(montage) }),
          ...(verlegeart?.art === 'text'
            ? [t('dreid.szene.verlegeart', { art: verlegeart.wert })]
            : []),
        ],
      },
    })
  }

  for (const l of modell.leitungen) {
    const geschoss = geschossVon.get(l.blattId)
    const blatt = blattVon.get(l.blattId)
    if (!geschoss || !blatt || l.achse.length < 2) continue
    const objekt = blatt.objekte.find((o) => o.id === l.id)
    const werte = psetWerte(l.psets, PSET_LEITUNG)
    const info: SzenenInfo = {
      titel: l.name,
      zeilen: [
        ...(werte.CableType?.art === 'text' ? [werte.CableType.wert] : []),
        ...(werte.InstalledLength?.art === 'laenge'
          ? [t('dreid.szene.verlegelaenge', { laenge: infoMeter(werte.InstalledLength.wert) })]
          : []),
        t('dreid.info.geschoss', { name: geschoss.name }),
      ],
    }
    const absolutePunkte = l.achse.map((p) => ({ ...p, z: p.z + geschoss.kote }))
    if (farbschema === 'zone') {
      for (const stueck of nachZonen(l.achse, l.zonen)) {
        const { farbe, text } = zonenFarbe(stueck.zone, geschoss.zonen)
        legende.set(farbe, text)
        linien.push({
          id: l.id,
          blattId: l.blattId,
          art: 'leitung',
          punkte: stueck.punkte.map((p) => ({ ...p, z: p.z + geschoss.kote })),
          farbe,
          breite: LEITUNG_BREITE_PX,
          info,
        })
      }
      continue
    }
    linien.push({
      id: l.id,
      blattId: l.blattId,
      art: 'leitung',
      punkte: absolutePunkte,
      farbe: farbschema === 'geraetetyp' ? LEITUNG_EINHEITLICH : (objekt?.farbe ?? NEUTRAL),
      breite: LEITUNG_BREITE_PX,
      info,
    })
  }

  for (const tr of modell.traeger) {
    const geschoss = geschossVon.get(tr.blattId)
    if (!geschoss) continue
    const trunk = blattVon.get(tr.blattId)?.objekte.find((o) => o.id === tr.id) as
      TrunkObjekt | undefined
    const farbe = farbschema === 'zone' ? zonenFarbeVon(trunk, geschoss, legende) : TRAEGER_FARBE
    const [breite, hoehe] =
      'durchmesser' in tr.querschnitt
        ? [tr.querschnitt.durchmesser, tr.querschnitt.durchmesser]
        : [tr.querschnitt.breite, tr.querschnitt.hoehe]
    const info: SzenenInfo = {
      titel: tr.name,
      zeilen: [
        t('dreid.szene.querschnitt', {
          breite: String(Math.round(breite * 100)),
          hoehe: String(Math.round(hoehe * 100)),
        }),
        t('dreid.info.geschoss', { name: geschoss.name }),
      ],
    }
    for (let i = 1; i < tr.achse.length; i++) {
      const a = tr.achse[i - 1]
      const b = tr.achse[i]
      const laenge = Math.hypot(b.x - a.x, b.y - a.y)
      if (laenge < 1e-6) continue
      quader.push({
        id: tr.id,
        blattId: tr.blattId,
        art: 'traeger',
        mitte: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        breite: laenge,
        tiefe: breite,
        drehung: Math.atan2(b.y - a.y, b.x - a.x),
        z: geschoss.kote + a.z - hoehe / 2,
        hoehe,
        farbe,
        deckkraft: 1,
        info,
      })
    }
  }

  for (const blatt of exportBlaetter(zeichnung, module)) {
    const geschoss = geschossVon.get(blatt.id)
    if (!geschoss) continue
    for (const o of blatt.objekte) {
      if (o.type !== 'trunk' || (o.ausfuehrung && o.ausfuehrung !== 'buendel')) continue
      if (o.wegpunkte.length < 2) continue
      const z = geschoss.kote + exportZone(geschoss, o.installationszone)
      const farbe = farbschema === 'zone' ? zonenFarbeVon(o, geschoss, legende) : o.farbe
      linien.push({
        id: o.id,
        blattId: blatt.id,
        art: 'buendel',
        punkte: o.wegpunkte.map((p) => ({ ...modellPunkt(blatt, p), z })),
        farbe: farbschema === 'geraetetyp' ? LEITUNG_EINHEITLICH : farbe,
        breite: BUENDEL_BREITE_PX,
        info: {
          titel: o.name,
          zeilen: [t('dreid.szene.buendel'), t('dreid.info.geschoss', { name: geschoss.name })],
        },
      })
    }
  }

  for (const s of modell.schaechte) {
    const geschoss = geschossVon.get(s.blattId)
    if (!geschoss) continue
    quader.push({
      ...absolut(s.quader, geschoss),
      id: s.id,
      blattId: s.blattId,
      art: 'schacht',
      farbe: SCHACHT_FARBE,
      deckkraft: SCHACHT_DECKKRAFT,
      info: {
        titel: s.name,
        zeilen: [
          t('dreid.szene.kabelschacht'),
          t('dreid.info.geschoss', { name: geschoss.name }),
          t('dreid.info.hoehe', { hoehe: infoMeter(s.quader.hoehe) }),
        ],
      },
    })
  }

  const gebaeude = baueGebaeude(
    exportBlaetter(zeichnung, module),
    modell.geschosse,
    kontext.huelleBlaetter,
  )

  return {
    geschosse: modell.geschosse.map((g) => ({ blattId: g.blattId, name: g.name, kote: g.kote })),
    prismen: gebaeude.prismen,
    texte: gebaeude.texte,
    quader,
    linien,
    legende: [...legende].map(([farbe, text]) => ({ farbe, text })),
  }
}

function absolut(q: ExportQuader, geschoss: ExportGeschoss) {
  return { ...q, z: q.z + geschoss.kote }
}

function psetWerte(psets: readonly ExportPset[], name: string) {
  return psets.find((p) => p.name === name)?.werte ?? {}
}

function zonenFarbeVon(
  trunk: TrunkObjekt | undefined,
  geschoss: ExportGeschoss,
  legende: Map<string, string>,
): string {
  const { farbe, text } = zonenFarbe(
    exportZonenKennung(geschoss, trunk?.installationszone),
    geschoss.zonen,
  )
  legende.set(farbe, text)
  return farbe
}

export function nachZonen(
  achse: readonly Punkt3[],
  zonen: readonly (Installationszone | null)[],
): { zone: Installationszone | null; punkte: Punkt3[] }[] {
  const stuecke: { zone: Installationszone | null; punkte: Punkt3[] }[] = []
  for (let i = 1; i < achse.length; i++) {
    const zone = zonen[i - 1] ?? null
    const letztes = stuecke[stuecke.length - 1]
    if (letztes && letztes.zone === zone) letztes.punkte.push(achse[i])
    else stuecke.push({ zone, punkte: [achse[i - 1], achse[i]] })
  }
  return stuecke
}

export function istSzeneLeer(szene: Szene): boolean {
  return szene.quader.length === 0 && szene.linien.length === 0 && szene.prismen.length === 0
}
