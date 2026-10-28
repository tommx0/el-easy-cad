import type { IfcAPI } from 'web-ifc'
import { erzeugeUebersetzer } from '../sprache'
import type { ExportPrisma, ExportTreppe } from './export-bauteile'
import type {
  ExportPset,
  ExportQuader,
  ExportTraeger,
  ExportWert,
  IfcExportModell,
} from './export-modell'

export const IFC_CODE = {
  PROJECT: 103090709,
  SIUNIT: 448429030,
  UNITASSIGNMENT: 180925521,
  GEOMETRICREPRESENTATIONCONTEXT: 3448662350,
  GEOMETRICREPRESENTATIONSUBCONTEXT: 4142052618,
  CARTESIANPOINT: 1123145078,
  DIRECTION: 32440307,
  AXIS2PLACEMENT3D: 2740243338,
  AXIS2PLACEMENT2D: 3125803723,
  LOCALPLACEMENT: 2624227202,
  SITE: 4097777520,
  BUILDING: 4031249490,
  BUILDINGSTOREY: 3124254112,
  RELAGGREGATES: 160246688,
  RELCONTAINEDINSPATIALSTRUCTURE: 3242617779,
  RECTANGLEPROFILEDEF: 3615266464,
  CIRCLEPROFILEDEF: 1383045692,
  EXTRUDEDAREASOLID: 477187591,
  SHAPEREPRESENTATION: 4240577450,
  PRODUCTDEFINITIONSHAPE: 673634403,
  PROPERTYSINGLEVALUE: 3650150729,
  PROPERTYBOUNDEDVALUE: 871118103,
  PROPERTYSET: 1451395588,
  RELDEFINESBYPROPERTIES: 4186316022,
  RELDEFINESBYTYPE: 781010003,
  ELEMENTASSEMBLY: 4123344466,
  POLYLINE: 3724593414,
  SWEPTDISKSOLID: 1260650574,
  CABLESEGMENT: 4217484030,
  CABLECARRIERSEGMENT: 3758799889,
  DISTRIBUTIONCIRCUIT: 562808652,
  RELASSIGNSTOGROUP: 1307041759,
  GROUP: 2706460486,
  DISTRIBUTIONPORT: 3041715199,
  RELNESTS: 3268803585,
  RELCONNECTSPORTS: 3190031847,
  WALL: 2391406946,
  OPENINGELEMENT: 3588315303,
  DOOR: 395920057,
  WINDOW: 3304561284,
  SLAB: 1529196076,
  STAIR: 331165859,
  SPACE: 3856911033,
  RELVOIDSELEMENT: 1401173127,
  RELFILLSELEMENT: 3940055652,
  RELREFERENCEDINSPATIALSTRUCTURE: 1245217292,
  ARBITRARYCLOSEDPROFILEDEF: 3798115385,
  ARBITRARYPROFILEDEFWITHVOIDS: 2705031697,
  ELEMENTQUANTITY: 1883228015,
  QUANTITYAREA: 2044713172,
  QUANTITYLENGTH: 931644368,
} as const

export const IFC_WERTCODE = {
  LABEL: 3258342251,
  IDENTIFIER: 983778844,
  TEXT: 2801250643,
  LENGTHMEASURE: 1243674935,
  POSITIVELENGTHMEASURE: 2815919920,
  REAL: 200335297,
  DIMENSIONCOUNT: 4134073009,
  ELECTRICCURRENTMEASURE: 3790457270,
  ELECTRICVOLTAGEMEASURE: 2506197118,
  POWERMEASURE: 1364037233,
  INTEGER: 1939436016,
  AREAMEASURE: 2650437152,
} as const

export const IFC_KLASSEN_CODE: Record<string, readonly [number, number]> = {
  IfcOutlet: [3694346114, 2837617999],
  IfcSwitchingDevice: [1162798199, 2315554128],
  IfcSensor: [4086658281, 1783015770],
  IfcActuator: [4288193352, 2874132201],
  IfcController: [25142252, 578613899],
  IfcUnitaryControlElement: [630975310, 3179687236],
  IfcElectricTimeControl: [1003880860, 712377611],
  IfcElectricAppliance: [1904799276, 663422040],
  IfcLightFixture: [629592764, 1161773419],
  IfcElectricDistributionBoard: [862014818, 2417008758],
  IfcProtectiveDevice: [738039164, 1842657554],
  IfcJunctionBox: [2176052936, 4288270099],
  IfcCommunicationsAppliance: [3221913625, 400855858],
  IfcAudioVisualAppliance: [277319702, 1532957894],
  IfcAlarm: [3087945054, 3001207471],
  IfcElectricGenerator: [264262732, 1534661035],
  IfcSolarDevice: [3420628829, 1072016465],
  IfcElectricFlowStorageDevice: [3310460725, 3277789161],
  IfcTransformer: [3825984169, 1692211062],
  IfcElectricMotor: [402227799, 1217240411],
  IfcBuildingElementProxy: [1095909175, 1909888760],
  IfcDiscreteAccessory: [1335981549, 2635815018],
}

const GUID_ZEICHEN = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$'

export function ifcGuidAus(text: string): string {
  const teile: number[] = []
  for (let n = 0; n < 4; n++) {
    let h = (0x811c9dc5 ^ (n * 0x9e3779b9)) >>> 0
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }
    h ^= h >>> 16
    h = Math.imul(h, 0x85ebca6b) >>> 0
    h ^= h >>> 13
    h = Math.imul(h, 0xc2b2ae35) >>> 0
    h ^= h >>> 16
    teile.push(h >>> 0)
  }
  let bits = ''
  for (const t of teile) bits += t.toString(2).padStart(32, '0')
  let ergebnis = GUID_ZEICHEN[parseInt(bits.slice(0, 2), 2)]
  for (let i = 2; i < 128; i += 6) ergebnis += GUID_ZEICHEN[parseInt(bits.slice(i, i + 6), 2)]
  return ergebnis
}

type Entitaet = ReturnType<IfcAPI['CreateIfcEntity']>
const AUFZAEHLUNG = 3

class Schreiber {
  private api: IfcAPI
  private modell: number

  constructor(api: IfcAPI, modell: number) {
    this.api = api
    this.modell = modell
  }

  e(code: number, ...attribute: unknown[]): Entitaet {
    return this.api.CreateIfcEntity(this.modell, code, ...attribute)
  }

  w(code: number, wert: unknown): unknown {
    return this.api.CreateIfcType(this.modell, code, wert)
  }

  a(wert: string): unknown {
    return { type: AUFZAEHLUNG, value: wert }
  }

  guid(schluessel: string): unknown {
    return this.api.CreateIfcType(this.modell, IFC_GUID_CODE, ifcGuidAus(schluessel))
  }

  label(text: string | undefined | null): unknown {
    return text ? this.w(IFC_WERTCODE.LABEL, text) : null
  }

  punkt(x: number, y: number, z?: number): Entitaet {
    const l = (v: number) => this.w(IFC_WERTCODE.LENGTHMEASURE, runde(v))
    return this.e(IFC_CODE.CARTESIANPOINT, z === undefined ? [l(x), l(y)] : [l(x), l(y), l(z)])
  }

  richtung(x: number, y: number, z: number): Entitaet {
    const r = (v: number) => this.w(IFC_WERTCODE.REAL, runde(v))
    return this.e(IFC_CODE.DIRECTION, [r(x), r(y), r(z)])
  }

  achse(x: number, y: number, z: number, drehung = 0): Entitaet {
    return this.e(
      IFC_CODE.AXIS2PLACEMENT3D,
      this.punkt(x, y, z),
      this.richtung(0, 0, 1),
      this.richtung(Math.cos(drehung), Math.sin(drehung), 0),
    )
  }

  schreibe(entitaet: Entitaet): Entitaet {
    this.api.WriteLine(this.modell, entitaet)
    return entitaet
  }
}

export const IFC_GUID_CODE = 3064340077

const LEITUNGS_RADIUS = 0.005

function runde(v: number): number {
  return Math.round(v * 1e4) / 1e4 || 0
}

function wertVon(s: Schreiber, wert: ExportWert): unknown {
  switch (wert.art) {
    case 'text':
      return s.w(IFC_WERTCODE.LABEL, wert.wert)
    case 'bezeichner':
      return s.w(IFC_WERTCODE.IDENTIFIER, wert.wert)
    case 'laenge':
      return s.w(IFC_WERTCODE.LENGTHMEASURE, runde(wert.wert))
    case 'positivlaenge':
      return s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, runde(wert.wert))
    case 'bemessung':
      return s.w(
        wert.groesse === 'strom'
          ? IFC_WERTCODE.ELECTRICCURRENTMEASURE
          : IFC_WERTCODE.ELECTRICVOLTAGEMEASURE,
        wert.wert,
      )
    case 'strom':
      return s.w(IFC_WERTCODE.ELECTRICCURRENTMEASURE, wert.wert)
    case 'spannung':
      return s.w(IFC_WERTCODE.ELECTRICVOLTAGEMEASURE, wert.wert)
    case 'leistung':
      return s.w(IFC_WERTCODE.POWERMEASURE, wert.wert)
    case 'ganzzahl':
      return s.w(IFC_WERTCODE.INTEGER, Math.round(wert.wert))
  }
}

function propertySet(s: Schreiber, schluessel: string, p: ExportPset): Entitaet {
  const werte = Object.entries(p.werte).map(([name, wert]) =>
    wert.art === 'bemessung'
      ? // P_BOUNDEDVALUE: Obergrenze und Sollwert = Bemessungswert.
        s.e(
          IFC_CODE.PROPERTYBOUNDEDVALUE,
          s.w(IFC_WERTCODE.IDENTIFIER, name),
          null,
          wertVon(s, wert),
          null,
          null,
          wertVon(s, wert),
        )
      : s.e(
          IFC_CODE.PROPERTYSINGLEVALUE,
          s.w(IFC_WERTCODE.IDENTIFIER, name),
          null,
          wertVon(s, wert),
          null,
        ),
  )
  return s.e(
    IFC_CODE.PROPERTYSET,
    s.guid(`${schluessel}/pset/${p.name}`),
    null,
    s.label(p.name),
    null,
    werte,
  )
}

function quaderForm(s: Schreiber, kontext: Entitaet, q: ExportQuader): Entitaet {
  const profil = s.e(
    IFC_CODE.RECTANGLEPROFILEDEF,
    s.a('AREA'),
    null,
    s.e(IFC_CODE.AXIS2PLACEMENT2D, s.punkt(0, 0), null),
    s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, Math.max(runde(q.breite), 0.001)),
    s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, Math.max(runde(q.tiefe), 0.001)),
  )
  const koerper = s.e(
    IFC_CODE.EXTRUDEDAREASOLID,
    profil,
    s.achse(0, 0, 0),
    s.richtung(0, 0, 1),
    s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, Math.max(runde(q.hoehe), 0.001)),
  )
  const form = s.e(IFC_CODE.SHAPEREPRESENTATION, kontext, s.label('Body'), s.label('SweptSolid'), [
    koerper,
  ])
  return s.e(IFC_CODE.PRODUCTDEFINITIONSHAPE, null, null, [form])
}

function traegerKoerper(s: Schreiber, kontext: Entitaet, t: ExportTraeger): Entitaet[] {
  if ('durchmesser' in t.querschnitt) {
    const linie = s.e(
      IFC_CODE.POLYLINE,
      t.achse.map((p) => s.punkt(p.x, p.y, p.z)),
    )
    const rohr = s.e(
      IFC_CODE.SWEPTDISKSOLID,
      linie,
      s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, runde(t.querschnitt.durchmesser / 2)),
      null,
      null,
      null,
    )
    return [
      s.e(IFC_CODE.SHAPEREPRESENTATION, kontext, s.label('Body'), s.label('AdvancedSweptSolid'), [
        rohr,
      ]),
    ]
  }
  const { breite, hoehe } = t.querschnitt
  const stuecke: Entitaet[] = []
  for (let i = 0; i + 1 < t.achse.length; i++) {
    const a = t.achse[i]
    const b = t.achse[i + 1]
    const laenge = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)
    if (laenge < 1e-4) continue
    const dx = (b.x - a.x) / laenge
    const dy = (b.y - a.y) / laenge
    const dz = (b.z - a.z) / laenge
    const quer =
      Math.hypot(dx, dy) > 1e-9 ? [-dy / Math.hypot(dx, dy), dx / Math.hypot(dx, dy), 0] : [1, 0, 0]
    const lage = s.e(
      IFC_CODE.AXIS2PLACEMENT3D,
      s.punkt(a.x, a.y, a.z),
      s.richtung(dx, dy, dz),
      s.richtung(quer[0], quer[1], quer[2]),
    )
    const profil = s.e(
      IFC_CODE.RECTANGLEPROFILEDEF,
      s.a('AREA'),
      null,
      s.e(IFC_CODE.AXIS2PLACEMENT2D, s.punkt(0, 0), null),
      s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, runde(breite)),
      s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, runde(hoehe)),
    )
    stuecke.push(
      s.e(
        IFC_CODE.EXTRUDEDAREASOLID,
        profil,
        lage,
        s.richtung(0, 0, 1),
        s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, runde(laenge)),
      ),
    )
  }
  return stuecke.length > 0
    ? [s.e(IFC_CODE.SHAPEREPRESENTATION, kontext, s.label('Body'), s.label('SweptSolid'), stuecke)]
    : []
}

function ring(s: Schreiber, punkte: { x: number; y: number }[]): Entitaet {
  const sauber = punkte.filter((p, i) => {
    const vor = punkte[(i + punkte.length - 1) % punkte.length]
    return i === 0 || Math.hypot(p.x - vor.x, p.y - vor.y) > 1e-4
  })
  const letzter = sauber[sauber.length - 1]
  if (Math.hypot(letzter.x - sauber[0].x, letzter.y - sauber[0].y) <= 1e-4) sauber.pop()
  return s.e(
    IFC_CODE.POLYLINE,
    [...sauber, sauber[0]].map((p) => s.punkt(p.x, p.y)),
  )
}

function prismaKoerper(s: Schreiber, p: ExportPrisma): Entitaet {
  const profil = p.loecher?.length
    ? s.e(
        IFC_CODE.ARBITRARYPROFILEDEFWITHVOIDS,
        s.a('AREA'),
        null,
        ring(s, p.grundriss),
        p.loecher.map((l) => ring(s, l)),
      )
    : s.e(IFC_CODE.ARBITRARYCLOSEDPROFILEDEF, s.a('AREA'), null, ring(s, p.grundriss))
  return s.e(
    IFC_CODE.EXTRUDEDAREASOLID,
    profil,
    s.achse(0, 0, p.z),
    s.richtung(0, 0, 1),
    s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, Math.max(runde(p.hoehe), 0.001)),
  )
}

function prismenForm(s: Schreiber, kontext: Entitaet, prismen: ExportPrisma[]): Entitaet {
  const form = s.e(
    IFC_CODE.SHAPEREPRESENTATION,
    kontext,
    s.label('Body'),
    s.label('SweptSolid'),
    prismen.filter((p) => p.grundriss.length >= 3).map((p) => prismaKoerper(s, p)),
  )
  return s.e(IFC_CODE.PRODUCTDEFINITIONSHAPE, null, null, [form])
}

const TREPPEN_TYP: Record<ExportTreppe['form'], string> = {
  gerade: 'STRAIGHT_RUN_STAIR',
  'u-podest': 'HALF_TURN_STAIR',
  'u-kehre': 'HALF_WINDING_STAIR',
  'l-kehre': 'QUARTER_WINDING_STAIR',
}

const TRAEGER_TYP = {
  kanal: 'CABLETRUNKINGSEGMENT',
  trasse: 'CABLETRAYSEGMENT',
  rohr: 'CONDUITSEGMENT',
} as const

export function schreibeIfc(
  api: IfcAPI,
  modell: IfcExportModell,
  optionen: { guidPraefix: string; anwendung: string },
): Uint8Array {
  const m = api.CreateModel({
    schema: 'IFC4',
    name: modell.projektName,
    authors: [optionen.anwendung],
    organizations: [optionen.anwendung],
  })
  const s = new Schreiber(api, m)
  const g = (schluessel: string) => s.guid(`${optionen.guidPraefix}/${schluessel}`)
  const tp = erzeugeUebersetzer(modell.sprache)

  const einheit = (art: string, name: string) => s.e(IFC_CODE.SIUNIT, s.a(art), null, s.a(name))
  const einheiten = s.e(IFC_CODE.UNITASSIGNMENT, [
    einheit('LENGTHUNIT', 'METRE'),
    einheit('AREAUNIT', 'SQUARE_METRE'),
    einheit('VOLUMEUNIT', 'CUBIC_METRE'),
    einheit('PLANEANGLEUNIT', 'RADIAN'),
    einheit('ELECTRICCURRENTUNIT', 'AMPERE'),
    einheit('ELECTRICVOLTAGEUNIT', 'VOLT'),
    einheit('POWERUNIT', 'WATT'),
  ])
  const kontext = s.e(
    IFC_CODE.GEOMETRICREPRESENTATIONCONTEXT,
    null,
    s.label('Model'),
    s.w(IFC_WERTCODE.DIMENSIONCOUNT, 3),
    s.w(IFC_WERTCODE.REAL, 1e-5),
    s.achse(0, 0, 0),
    null,
  )
  const projekt = s.schreibe(
    s.e(
      IFC_CODE.PROJECT,
      g('projekt'),
      null,
      s.label(modell.projektName),
      null,
      null,
      null,
      null,
      [kontext],
      einheiten,
    ),
  )

  const sitePlatz = s.e(IFC_CODE.LOCALPLACEMENT, null, s.achse(0, 0, 0))
  const site = s.schreibe(
    s.e(
      IFC_CODE.SITE,
      g('site'),
      null,
      s.label(tp('ifc.datei.grundstueck')),
      null,
      null,
      sitePlatz,
      null,
      null,
      s.a('ELEMENT'),
      null,
      null,
      null,
      null,
      null,
    ),
  )
  const gebaeudePlatz = s.e(IFC_CODE.LOCALPLACEMENT, sitePlatz, s.achse(0, 0, 0))
  const gebaeude = s.schreibe(
    s.e(
      IFC_CODE.BUILDING,
      g('gebaeude'),
      null,
      s.label(modell.projektName),
      null,
      null,
      gebaeudePlatz,
      null,
      null,
      s.a('ELEMENT'),
      null,
      null,
      null,
    ),
  )
  s.schreibe(s.e(IFC_CODE.RELAGGREGATES, g('rel/projekt'), null, null, null, projekt, [site]))
  s.schreibe(s.e(IFC_CODE.RELAGGREGATES, g('rel/site'), null, null, null, site, [gebaeude]))

  const geschossPlatz = new Map<string, Entitaet>()
  const geschossObjekt = new Map<string, Entitaet>()
  for (const geschoss of modell.geschosse) {
    const platz = s.e(IFC_CODE.LOCALPLACEMENT, gebaeudePlatz, s.achse(0, 0, geschoss.kote))
    const guid = geschoss.ifcGuid
      ? s.w(IFC_GUID_CODE, geschoss.ifcGuid)
      : g(`geschoss/${geschoss.blattId}`)
    const objekt = s.schreibe(
      s.e(
        IFC_CODE.BUILDINGSTOREY,
        guid,
        null,
        s.label(geschoss.name),
        null,
        null,
        platz,
        null,
        null,
        s.a('ELEMENT'),
        s.w(IFC_WERTCODE.LENGTHMEASURE, runde(geschoss.kote)),
      ),
    )
    geschossPlatz.set(geschoss.blattId, platz)
    geschossObjekt.set(geschoss.blattId, objekt)
  }
  if (modell.geschosse.length > 0)
    s.schreibe(
      s.e(IFC_CODE.RELAGGREGATES, g('rel/gebaeude'), null, null, null, gebaeude, [
        ...geschossObjekt.values(),
      ]),
    )

  const typObjekte = new Map<string, Entitaet>()
  for (const typ of modell.typen) {
    const code = IFC_KLASSEN_CODE[typ.klasse] ?? IFC_KLASSEN_CODE.IfcBuildingElementProxy
    const psets = typ.psets.map((p) =>
      propertySet(s, `${optionen.guidPraefix}/typ/${typ.schluessel}`, p),
    )
    typObjekte.set(
      typ.schluessel,
      s.schreibe(
        s.e(
          code[1],
          g(`typ/${typ.schluessel}`),
          null,
          s.label(typ.name),
          null,
          null,
          psets.length > 0 ? psets : null,
          null,
          null,
          s.label(typ.typName),
          s.a(typ.typ),
        ),
      ),
    )
  }

  const inGeschoss = new Map<string, Entitaet[]>()
  const merke = (blattId: string, e: Entitaet) =>
    inGeschoss.set(blattId, [...(inGeschoss.get(blattId) ?? []), e])
  const eigenschaften = (schluessel: string, objekt: Entitaet, psets: ExportPset[]) => {
    for (const p of psets)
      s.schreibe(
        s.e(
          IFC_CODE.RELDEFINESBYPROPERTIES,
          g(`${schluessel}/rel/${p.name}`),
          null,
          null,
          null,
          [objekt],
          propertySet(s, `${optionen.guidPraefix}/${schluessel}`, p),
        ),
      )
  }

  const baugruppen = new Map<string, { objekt: Entitaet; platz: Entitaet; teile: Entitaet[] }>()
  for (const b of modell.baugruppen) {
    const basis = geschossPlatz.get(b.blattId)
    if (!basis) continue
    const platz = s.e(
      IFC_CODE.LOCALPLACEMENT,
      basis,
      s.achse(b.quader.mitte.x, b.quader.mitte.y, b.quader.z, b.quader.drehung),
    )
    const objekt = s.schreibe(
      s.e(
        IFC_CODE.ELEMENTASSEMBLY,
        g(`objekt/${b.id}`),
        null,
        s.label(b.name),
        null,
        null,
        platz,
        null,
        null,
        null,
        s.a('ACCESSORY_ASSEMBLY'),
      ),
    )
    eigenschaften(`objekt/${b.id}`, objekt, b.psets)
    baugruppen.set(b.id, { objekt, platz, teile: [] })
    merke(b.blattId, objekt)
  }

  const nachTyp = new Map<string, Entitaet[]>()
  const geraetObjekt = new Map<string, Entitaet>()
  for (const ger of modell.geraete) {
    const basis = geschossPlatz.get(ger.blattId)
    if (!basis) continue
    const code = IFC_KLASSEN_CODE[ger.klasse] ?? IFC_KLASSEN_CODE.IfcBuildingElementProxy
    const q = ger.quader
    const platz = s.e(IFC_CODE.LOCALPLACEMENT, basis, s.achse(q.mitte.x, q.mitte.y, q.z, q.drehung))
    const objekt = s.schreibe(
      s.e(
        code[0],
        g(`objekt/${ger.id}`),
        null,
        s.label(ger.name),
        null,
        s.label(ger.typName),
        platz,
        quaderForm(s, kontext, q),
        ger.kennzeichen ? s.w(IFC_WERTCODE.IDENTIFIER, ger.kennzeichen) : null,
        s.a(ger.typ),
      ),
    )
    eigenschaften(`objekt/${ger.id}`, objekt, ger.psets)
    geraetObjekt.set(ger.id, objekt)
    nachTyp.set(ger.typSchluessel, [...(nachTyp.get(ger.typSchluessel) ?? []), objekt])
    const baugruppe = ger.baugruppe ? baugruppen.get(ger.baugruppe) : undefined
    if (baugruppe) baugruppe.teile.push(objekt)
    else merke(ger.blattId, objekt)
  }

  const leitungObjekt = new Map<string, Entitaet>()
  const portsJeObjekt = new Map<string, { objekt: Entitaet; ports: Entitaet[] }>()
  const portAn = (schluessel: string, objekt: Entitaet, name: string): Entitaet => {
    const port = s.e(
      IFC_CODE.DISTRIBUTIONPORT,
      g(`port/${schluessel}`),
      null,
      s.label(name),
      null,
      null,
      null,
      null,
      s.a('SOURCEANDSINK'),
      s.a('CABLE'),
      null,
    )
    const eintrag = portsJeObjekt.get(schluessel.split('#')[0]) ?? { objekt, ports: [] }
    eintrag.ports.push(port)
    portsJeObjekt.set(schluessel.split('#')[0], eintrag)
    return port
  }
  for (const l of modell.leitungen) {
    const basis = geschossPlatz.get(l.blattId)
    if (!basis || l.achse.length < 2) continue
    const linie = s.e(
      IFC_CODE.POLYLINE,
      l.achse.map((p) => s.punkt(p.x, p.y, p.z)),
    )
    const achse = s.e(IFC_CODE.SHAPEREPRESENTATION, kontext, s.label('Axis'), s.label('Curve3D'), [
      linie,
    ])
    const rohr = s.e(
      IFC_CODE.SWEPTDISKSOLID,
      linie,
      s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, LEITUNGS_RADIUS),
      null,
      null,
      null,
    )
    const koerper = s.e(
      IFC_CODE.SHAPEREPRESENTATION,
      kontext,
      s.label('Body'),
      s.label('AdvancedSweptSolid'),
      [rohr],
    )
    const platz = s.e(IFC_CODE.LOCALPLACEMENT, basis, s.achse(0, 0, 0))
    const objekt = s.schreibe(
      s.e(
        IFC_CODE.CABLESEGMENT,
        g(`objekt/${l.id}`),
        null,
        s.label(l.name),
        null,
        null,
        platz,
        s.e(IFC_CODE.PRODUCTDEFINITIONSHAPE, null, null, [achse, koerper]),
        s.w(IFC_WERTCODE.IDENTIFIER, String(l.nummer)),
        s.a('CABLESEGMENT'),
      ),
    )
    eigenschaften(`objekt/${l.id}`, objekt, l.psets)
    leitungObjekt.set(l.id, objekt)
    merke(l.blattId, objekt)
    for (const a of l.anschluesse) {
      const geraet = geraetObjekt.get(a.geraetId)
      if (!geraet) continue
      const leitungsPort = portAn(
        `${l.id}#${a.ende}`,
        objekt,
        tp(a.ende === 'start' ? 'ifc.datei.portAnfang' : 'ifc.datei.portEnde', { name: l.name }),
      )
      const geraetePort = portAn(`${a.geraetId}#${l.id}`, geraet, l.name)
      s.schreibe(
        s.e(
          IFC_CODE.RELCONNECTSPORTS,
          g(`rel/port/${l.id}/${a.ende}`),
          null,
          null,
          null,
          leitungsPort,
          geraetePort,
          null,
        ),
      )
    }
  }
  for (const [schluessel, { objekt, ports }] of portsJeObjekt)
    s.schreibe(
      s.e(IFC_CODE.RELNESTS, g(`rel/ports/${schluessel}`), null, null, null, objekt, ports),
    )

  for (const k of modell.stromkreise) {
    const mitglieder = [
      ...k.leitungIds.map((id) => leitungObjekt.get(id)),
      ...k.geraetIds.map((id) => geraetObjekt.get(id)),
    ].filter((e): e is Entitaet => e !== undefined)
    if (mitglieder.length === 0) continue
    const kreis = s.schreibe(
      s.e(
        IFC_CODE.DISTRIBUTIONCIRCUIT,
        g(`stromkreis/${k.schluessel ?? k.nummer}`),
        null,
        s.label(k.name),
        null,
        null,
        null,
        s.a('NOTDEFINED'),
      ),
    )
    s.schreibe(
      s.e(
        IFC_CODE.RELASSIGNSTOGROUP,
        g(`rel/stromkreis/${k.schluessel ?? k.nummer}`),
        null,
        null,
        null,
        mitglieder,
        null,
        kreis,
      ),
    )
  }

  const traegerObjekt = new Map<string, Entitaet>()
  for (const t of modell.traeger) {
    const basis = geschossPlatz.get(t.blattId)
    if (!basis) continue
    const linie = s.e(
      IFC_CODE.POLYLINE,
      t.achse.map((p) => s.punkt(p.x, p.y, p.z)),
    )
    const achse = s.e(IFC_CODE.SHAPEREPRESENTATION, kontext, s.label('Axis'), s.label('Curve3D'), [
      linie,
    ])
    const form = s.e(IFC_CODE.PRODUCTDEFINITIONSHAPE, null, null, [
      achse,
      ...traegerKoerper(s, kontext, t),
    ])
    const platz = s.e(IFC_CODE.LOCALPLACEMENT, basis, s.achse(0, 0, 0))
    const objekt = s.schreibe(
      s.e(
        IFC_CODE.CABLECARRIERSEGMENT,
        g(`traeger/${t.id}`),
        null,
        s.label(t.name),
        null,
        null,
        platz,
        form,
        null,
        s.a(TRAEGER_TYP[t.art]),
      ),
    )
    eigenschaften(`traeger/${t.id}`, objekt, t.psets)
    traegerObjekt.set(t.id, objekt)
    merke(t.blattId, objekt)
  }
  for (const sch of modell.schaechte) {
    const basis = geschossPlatz.get(sch.blattId)
    if (!basis) continue
    const q = sch.quader
    const platz = s.e(IFC_CODE.LOCALPLACEMENT, basis, s.achse(q.mitte.x, q.mitte.y, q.z, q.drehung))
    const objekt = s.schreibe(
      s.e(
        IFC_CODE.CABLECARRIERSEGMENT,
        g(`objekt/${sch.id}`),
        null,
        s.label(sch.name),
        null,
        s.label(tp('ifc.datei.kabelschacht')),
        platz,
        quaderForm(s, kontext, q),
        null,
        s.a('USERDEFINED'),
      ),
    )
    merke(sch.blattId, objekt)
  }

  const { bauteile } = modell
  const kennung = (b: { id: string; ifcGuid?: string }, art = 'objekt') =>
    b.ifcGuid ? s.w(IFC_GUID_CODE, b.ifcGuid) : g(`${art}/${b.id}`)
  const laenge = (v: number) => s.w(IFC_WERTCODE.POSITIVELENGTHMEASURE, Math.max(runde(v), 0.001))
  for (const w of bauteile.waende) {
    const basis = geschossPlatz.get(w.blattId)
    if (!basis) continue
    const platz = s.e(IFC_CODE.LOCALPLACEMENT, basis, s.achse(0, 0, 0))
    const wand = s.schreibe(
      s.e(
        IFC_CODE.WALL,
        kennung(w),
        null,
        s.label(w.name),
        null,
        null,
        platz,
        prismenForm(s, kontext, w.koerper),
        null,
        s.a('NOTDEFINED'),
      ),
    )
    merke(w.blattId, wand)
    for (const o of w.oeffnungen) {
      const aussparung = s.schreibe(
        s.e(
          IFC_CODE.OPENINGELEMENT,
          o.art === 'wanddurchbruch' ? kennung(o) : g(`oeffnung/${o.id}`),
          null,
          s.label(o.name),
          null,
          null,
          s.e(IFC_CODE.LOCALPLACEMENT, platz, s.achse(0, 0, 0)),
          prismenForm(s, kontext, [o.aussparung]),
          null,
          s.a('OPENING'),
        ),
      )
      s.schreibe(
        s.e(
          IFC_CODE.RELVOIDSELEMENT,
          g(`rel/oeffnung/${o.id}`),
          null,
          null,
          null,
          wand,
          aussparung,
        ),
      )
      if (!o.fuellung || o.art === 'wanddurchbruch') continue
      const fuellPlatz = s.e(IFC_CODE.LOCALPLACEMENT, basis, s.achse(0, 0, 0))
      const form = prismenForm(s, kontext, [o.fuellung])
      const fuellung = s.schreibe(
        o.art === 'tuer'
          ? s.e(
              IFC_CODE.DOOR,
              kennung(o),
              null,
              s.label(o.name),
              null,
              null,
              fuellPlatz,
              form,
              null,
              laenge(o.hoehe),
              laenge(o.breite),
              s.a('DOOR'),
              s.a('NOTDEFINED'),
              null,
            )
          : s.e(
              IFC_CODE.WINDOW,
              kennung(o),
              null,
              s.label(o.name),
              null,
              null,
              fuellPlatz,
              form,
              null,
              laenge(o.hoehe),
              laenge(o.breite),
              s.a('WINDOW'),
              s.a('NOTDEFINED'),
              null,
            ),
      )
      s.schreibe(
        s.e(
          IFC_CODE.RELFILLSELEMENT,
          g(`rel/fuellung/${o.id}`),
          null,
          null,
          null,
          aussparung,
          fuellung,
        ),
      )
      merke(w.blattId, fuellung)
    }
  }
  for (const p of bauteile.platten) {
    const basis = geschossPlatz.get(p.blattId)
    if (!basis) continue
    merke(
      p.blattId,
      s.schreibe(
        s.e(
          IFC_CODE.SLAB,
          kennung(p),
          null,
          s.label(p.name),
          null,
          null,
          s.e(IFC_CODE.LOCALPLACEMENT, basis, s.achse(0, 0, 0)),
          prismenForm(s, kontext, [p.koerper]),
          null,
          s.a('FLOOR'),
        ),
      ),
    )
  }
  for (const t of bauteile.treppen) {
    const basis = geschossPlatz.get(t.blattId)
    if (!basis) continue
    merke(
      t.blattId,
      s.schreibe(
        s.e(
          IFC_CODE.STAIR,
          kennung(t),
          null,
          s.label(t.name),
          null,
          null,
          s.e(IFC_CODE.LOCALPLACEMENT, basis, s.achse(0, 0, 0)),
          prismenForm(s, kontext, t.koerper),
          null,
          s.a(TREPPEN_TYP[t.form]),
        ),
      ),
    )
  }
  const raeumeJeGeschoss = new Map<string, Entitaet[]>()
  for (const r of bauteile.raeume) {
    const basis = geschossPlatz.get(r.blattId)
    if (!basis) continue
    const raum = s.schreibe(
      s.e(
        IFC_CODE.SPACE,
        kennung(r),
        null,
        s.label(r.name),
        null,
        r.raumart ? s.label(r.raumart) : null,
        s.e(IFC_CODE.LOCALPLACEMENT, basis, s.achse(0, 0, 0)),
        prismenForm(s, kontext, [r.koerper]),
        s.label(r.name),
        s.a('ELEMENT'),
        s.a('INTERNAL'),
        null,
      ),
    )
    raeumeJeGeschoss.set(r.blattId, [...(raeumeJeGeschoss.get(r.blattId) ?? []), raum])
    if (r.raumart)
      eigenschaften(`raum/${r.id}`, raum, [
        { name: 'Pset_SpaceCommon', werte: { Category: { art: 'text', wert: r.raumart } } },
      ])
    const mengen = s.e(
      IFC_CODE.ELEMENTQUANTITY,
      g(`${r.id}/mengen`),
      null,
      s.label('Qto_SpaceBaseQuantities'),
      null,
      null,
      [
        s.e(
          IFC_CODE.QUANTITYAREA,
          s.label('NetFloorArea'),
          null,
          null,
          s.w(IFC_WERTCODE.AREAMEASURE, runde(r.flaeche)),
          null,
        ),
        s.e(
          IFC_CODE.QUANTITYLENGTH,
          s.label('Height'),
          null,
          null,
          s.w(IFC_WERTCODE.LENGTHMEASURE, runde(r.hoehe)),
          null,
        ),
      ],
    )
    s.schreibe(
      s.e(
        IFC_CODE.RELDEFINESBYPROPERTIES,
        g(`rel/mengen/${r.id}`),
        null,
        null,
        null,
        [raum],
        mengen,
      ),
    )
    const geraeteImRaum = r.geraetIds
      .map((id) => geraetObjekt.get(id))
      .filter((e): e is Entitaet => e !== undefined)
    if (geraeteImRaum.length > 0)
      s.schreibe(
        s.e(
          IFC_CODE.RELREFERENCEDINSPATIALSTRUCTURE,
          g(`rel/raum/${r.id}`),
          null,
          null,
          null,
          geraeteImRaum,
          raum,
        ),
      )
  }
  for (const [blattId, raeume] of raeumeJeGeschoss) {
    const geschoss = geschossObjekt.get(blattId)
    if (geschoss)
      s.schreibe(
        s.e(IFC_CODE.RELAGGREGATES, g(`rel/raeume/${blattId}`), null, null, null, geschoss, raeume),
      )
  }

  for (const gruppe of modell.trunkGruppen) {
    const mitglieder = [
      ...gruppe.leitungIds.map((id) => leitungObjekt.get(id)),
      ...gruppe.traegerIds.map((id) => traegerObjekt.get(id)),
    ].filter((e): e is Entitaet => e !== undefined)
    if (mitglieder.length === 0) continue
    const objekt = s.schreibe(
      s.e(
        IFC_CODE.GROUP,
        g(`trunk/${gruppe.id}`),
        null,
        s.label(gruppe.name),
        null,
        s.label(tp('ifc.datei.trunk')),
      ),
    )
    s.schreibe(
      s.e(
        IFC_CODE.RELASSIGNSTOGROUP,
        g(`rel/trunk/${gruppe.id}`),
        null,
        null,
        null,
        mitglieder,
        null,
        objekt,
      ),
    )
  }

  for (const [id, b] of baugruppen)
    if (b.teile.length > 0)
      s.schreibe(
        s.e(IFC_CODE.RELAGGREGATES, g(`rel/baugruppe/${id}`), null, null, null, b.objekt, b.teile),
      )
  for (const [schluessel, objekte] of nachTyp) {
    const typ = typObjekte.get(schluessel)
    if (typ)
      s.schreibe(
        s.e(IFC_CODE.RELDEFINESBYTYPE, g(`rel/typ/${schluessel}`), null, null, null, objekte, typ),
      )
  }
  for (const [blattId, objekte] of inGeschoss) {
    const geschoss = geschossObjekt.get(blattId)
    if (geschoss)
      s.schreibe(
        s.e(
          IFC_CODE.RELCONTAINEDINSPATIALSTRUCTURE,
          g(`rel/enthalten/${blattId}`),
          null,
          null,
          null,
          objekte,
          geschoss,
        ),
      )
  }

  const daten = api.SaveModel(m)
  api.CloseModel(m)
  return daten
}
