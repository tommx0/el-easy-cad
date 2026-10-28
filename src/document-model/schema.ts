import { z } from 'zod'
import { t } from '../sprache'
import { kabeltypSchema } from './kabeltyp-schema'
import { zonenDefinitionSchema } from './installationszonen-schema'
import { STANDARD_STAFFELABSTAND } from './bemassungsreihe'
import { kennungSchema } from './geraete-regelwerk'
import { RAUMART_IDS } from './raumart'
import { BEKANNTE_HINTERGRUND_TYPEN } from './hintergrund'
import { symbolFarbeSchema } from './symbol-palette'

const punktSchema = z.object({ x: z.number(), y: z.number() })

const installationszoneSchema = z.string().min(1)

const anordnungsRegelnSchema = z.object({
  gruppe: z.string(),
  bahnabstand: z.number().finite().positive(),
  kreuzFaktor: z.number().finite().positive(),
  rechtwinklig: z.boolean(),
  kamm: z.boolean(),
  richtung: z.enum(['oben-unten', 'links-rechts']),
})

const ebeneSchema = z.object({
  id: z.string(),
  name: z.string(),
  sichtbar: z.boolean(),
  gesperrt: z.boolean(),
  farbe: z.string(),
  istHintergrundLayer: z.boolean().optional(),
  istLeitungenLayer: z.boolean().optional(),
  istRaeumeLayer: z.boolean().optional(),
  istGrundrissLayer: z.boolean().optional(),
  ifcGruppe: z
    .enum(['waende', 'tueren', 'fenster', 'tragwerk', 'treppen', 'decken', 'sonstiges'])
    .optional(),
})

const objektBasisSchema = {
  id: z.string(),
  ebeneId: z.string(),
  farbe: z.string(),
  strichstaerke: z.number(),
  linientyp: z.enum(['standard', 'gestrichelt', 'gepunktet', 'strichpunkt']).default('standard'),
  ausHintergrund: z.enum(['dxf', 'ifc', 'pdf']).optional(),
  ausBauteil: z.string().optional(),
  ifcGuid: z.string().optional(),
  ifcStand: z.string().optional(),
  modulDaten: z.record(z.string(), z.unknown()).optional(),
}

const fuellungSchema = z
  .union([
    z.object({
      art: z.enum(['farbe', 'schraffur']),
      farbe: z.string(),
      muster: z.enum(['diagonal', 'kreuz', 'horizontal', 'vertikal']).optional(),
      abstand: z.number().positive().optional(),
      deckkraft: z.number().min(0).max(1).default(1),
    }),
    z.string().transform((farbe) => ({ art: 'farbe' as const, farbe, deckkraft: 1 })),
    z.null(),
  ])
  .nullable()
  .default(null)

const linienObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('linie'),
  start: punktSchema,
  ende: punktSchema,
})

const polylinienObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('polylinie'),
  punkte: z.array(punktSchema),
  geschlossen: z.boolean(),
  fuellung: fuellungSchema,
})

const rechteckObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('rechteck'),
  ursprung: punktSchema,
  breite: z.number(),
  hoehe: z.number(),
  drehung: z.number(),
  fuellung: fuellungSchema,
})

const kreisObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('kreis'),
  mittelpunkt: punktSchema,
  radius: z.number(),
  fuellung: fuellungSchema,
})

const bogenObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('bogen'),
  mittelpunkt: punktSchema,
  radius: z.number(),
  startWinkel: z.number(),
  endWinkel: z.number(),
})

const ellipseObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('ellipse'),
  mittelpunkt: punktSchema,
  radiusX: z.number(),
  radiusY: z.number(),
  drehung: z.number(),
  fuellung: fuellungSchema,
})

const polygonObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('polygon'),
  mittelpunkt: punktSchema,
  radius: z.number(),
  seitenAnzahl: z.number().int().min(3),
  drehung: z.number(),
  fuellung: fuellungSchema,
})

const punktObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('punkt'),
  position: punktSchema,
})

const textObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('text'),
  position: punktSchema,
  inhalt: z.string(),
  hoehe: z.number(),
  drehung: z.number(),
})

const bemassungObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('bemassung'),
  start: punktSchema,
  ende: punktSchema,
  versatz: z.number(),
  textOverride: z.string().nullable(),
})

const bemassungsreiheObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('bemassungsreihe'),
  art: z.enum(['kette', 'parallel']),
  punkte: z.array(punktSchema).min(2),
  winkel: z.number(),
  versatz: z.number(),
  gesamtmass: z.boolean().default(false),
  staffelabstand: z.number().positive().default(STANDARD_STAFFELABSTAND),
})

const schraffurObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('schraffur'),
  kontur: z.array(punktSchema),
  muster: z.enum(['diagonal', 'kreuz', 'horizontal', 'vertikal']),
  abstand: z.number(),
})

const portGruppeSchema = z.object({
  typ: z.string(),
  anzahl: z.number().int().positive(),
  reihen: z.number().int().positive().optional(),
})

const ausrichtungH = z.enum(['links', 'mittig', 'rechts'])
const ausrichtungV = z.enum(['oben', 'mittig', 'unten'])

const dockpunktBeschriftungSchema = z.object({
  xAnteil: z.number().optional(),
  yAnteil: z.number().optional(),
  groesseAnteil: z.number(),
  ausrichtungHorizontal: ausrichtungH,
  ausrichtungVertikal: ausrichtungV,
  bildschirmVersatz: z.object({ x: z.number(), y: z.number() }).optional(),
  beiDrehung: z
    .object({
      bezugXAnteil: z.number(),
      bezugYAnteil: z.number(),
      versatzX: z.number(),
      versatzY: z.number(),
      ausrichtungHorizontal: ausrichtungH,
      ausrichtungVertikal: ausrichtungV,
    })
    .optional(),
  ausblenden: z.boolean().optional(),
  farbe: symbolFarbeSchema.optional(),
})

const freierDockpunktSchema = z.object({
  xAnteil: z.number(),
  yAnteil: z.number(),
  trunk: z.boolean().optional(),
  bezeichnung: z.string().optional(),
  beschriftung: dockpunktBeschriftungSchema.optional(),
})

const dockpunkteKonfigurationSchema = z.discriminatedUnion('modus', [
  z.object({
    modus: z.literal('ports'),
    gruppen: z.array(portGruppeSchema).min(1),
    trunkPunkte: z.array(z.object({ xAnteil: z.number() })).optional(),
  }),
  z.object({
    modus: z.literal('frei'),
    punkte: z.array(freierDockpunktSchema).min(1),
  }),
])

const katalogTextElementSchema = z.object({
  xAnteil: z.number(),
  yAnteil: z.number(),
  text: z.string(),
  groesseAnteil: z.number(),
  ausrichtungHorizontal: z.enum(['links', 'mittig', 'rechts']),
  ausrichtungVertikal: z.enum(['oben', 'mittig', 'unten']),
  beiDrehung: z
    .object({
      bezugXAnteil: z.number(),
      bezugYAnteil: z.number(),
      versatzX: z.number(),
      versatzY: z.number(),
      ausrichtungHorizontal: z.enum(['links', 'mittig', 'rechts']),
      ausrichtungVertikal: z.enum(['oben', 'mittig', 'unten']),
    })
    .optional(),
  bildschirmVersatz: z.object({ x: z.number(), y: z.number() }).optional(),
  variable: z.string().optional(),
  inStueckliste: z.boolean().optional(),
  drehung: z.union([z.literal(90), z.literal(180), z.literal(270)]).optional(),
  fixiert: z.boolean().optional(),
  farbe: symbolFarbeSchema.optional(),
})

const fangpunktSchema = z.object({
  xAnteil: z.number(),
  yAnteil: z.number(),
})

const komponentenTypSchema = kennungSchema

const ansteuerungSchema = kennungSchema

const slotZielSchema = z.discriminatedUnion('art', [
  z.object({ art: z.literal('instanz'), blattId: z.string(), objektId: z.string() }),
  z.object({ art: z.literal('gruppe'), gruppeId: z.string() }),
])

const slotSchema = z.object({
  id: z.string(),
  bezeichnung: z.string().optional(),
  ziele: z.array(slotZielSchema).default([]),
})

const slotMatrixSchema = z.object({
  spalten: z.union([z.literal(1), z.literal(2)]),
  zeilen: z.number().int().positive(),
  zeilenSpalten: z.array(z.union([z.literal(1), z.literal(2)])).optional(),
})

const geraetegruppeSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  typ: komponentenTypSchema,
  slots: z.array(slotSchema).default([]),
  slotMatrix: slotMatrixSchema.optional(),
  ansteuerung: ansteuerungSchema.optional(),
  knx: z.boolean().optional(),
})

const stromkreisWertSchema = z.union([
  z.enum(['kein', 'raum', 'eigen']),
  z.number().int().min(1).max(99),
])

const raumAuswahlSchema = z.object({ blattId: z.string(), raumId: z.string().optional() })

const stromkreisQuelleSchema = z.discriminatedUnion('art', [
  z.object({ art: z.literal('blatt'), blattId: z.string() }),
  z.object({
    art: z.literal('raum'),
    blattId: z.string(),
    raumId: z.string().optional(),
    nummer: z.number().int().min(1).max(99).optional(),
  }),
  z.object({ art: z.literal('eigen'), blattId: z.string(), objektId: z.string() }),
  z.object({ art: z.literal('knx'), ziel: slotZielSchema }),
])

const knxAktorSchema = z.object({
  art: z.enum(['schalt-jalousie', 'dimm']),
  baugroesse: z.number().int().positive(),
  kanaele: z.array(
    z.object({
      funktion: z.enum([
        'schalten',
        'treppenlicht',
        'zeitschalten',
        'heizen',
        'jalousie',
        'rollladen',
        'dimmen',
        'frei',
      ]),
      beschriftung: z.string().optional(),
    }),
  ),
  versorgungSichtbar: z.boolean().optional(),
})

const bestueckungsEintragSchema = z.object({
  id: z.string(),
  catalogComponentId: z.string(),
  kennzeichen: z.string(),
  kanal: z.string().optional(),
  mitKanaelen: z.boolean().optional(),
  variablen: z.record(z.string(), z.string()).optional(),
  phase: z.enum(['L1', 'L2', 'L3']).optional(),
  elternId: z.string().optional(),
  vorgeschaltet: z.string().optional(),
  bezeichnung: z.string().optional(),
  knxAktor: knxAktorSchema.optional(),
  quelle: stromkreisQuelleSchema.optional(),
})

const komponentenObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('komponente'),
  position: punktSchema,
  drehung: z.number(),
  groesseWelt: z.number(),
  catalogComponentId: z.string(),
  variantId: z.string().nullable(),
  beschriftung: z.string().optional(),
  dockpunkte: dockpunkteKonfigurationSchema.optional(),
  fangpunkt: fangpunktSchema.optional(),
  textElemente: z.array(katalogTextElementSchema).optional(),
  breiteWelt: z.number().optional(),
  hoehenFaktor: z.number().positive().optional(),
  modulTraeger: z
    .object({
      modulSystem: z.string(),
      spalten: z.number().int().positive(),
      zeilen: z.number().int().positive(),
    })
    .optional(),
  modulSystem: z.string().optional(),
  kombinierbar: z.boolean().optional(),
  traegerId: z.string().optional(),
  slotIndex: z.number().int().min(0).optional(),
  portBeschriftungen: z.record(z.string(), z.string()).optional(),
  beschriftungSichtbar: z.boolean().optional(),
  bezeichnungSichtbar: z.boolean().optional(),
  textGroessenFaktor: z.number().min(-5).max(5).optional(),
  symbolGroessenFaktor: z.number().min(-5).max(5).optional(),
  beschriftungsposition: z.enum(['rechts', 'links', 'oben', 'unten']).optional(),
  beschriftungVersatz: punktSchema.nullable().optional(),
  installationshoehe: z.number().optional(),
  installationshoeheSichtbar: z.boolean().optional(),
  montageort: z.enum(['decke', 'wand', 'boden']).optional(),
  verlegung: z.literal('in').optional(),
  wandstelle: z
    .object({
      id: z.string(),
      wandId: z.string().nullable(),
      t: z.number().nullable(),
      seite: z.union([z.literal(1), z.literal(-1)]),
      punkt: punktSchema,
      richtung: z.number(),
    })
    .optional(),
  kombination: z
    .object({
      nr: z.number().int(),
      platz: z.number().int(),
      hoeheCm: z.number(),
      reihenStart: z.number(),
      reihenEnde: z.boolean().optional(),
      drehungSchritte: z.number().int().min(0).max(3).optional(),
      drehungEinzeln: z.number().int().min(0).max(3).optional(),
    })
    .optional(),
  kombinationsFaktor: z.number().positive().optional(),
  darstellung: z.enum(['bild', 'symbol']).optional(),
  gruppeId: z.string().optional(),
  typ: komponentenTypSchema.optional(),
  slots: z.array(slotSchema).optional(),
  slotMatrix: slotMatrixSchema.optional(),
  slotAnzahlAus: z.string().optional(),
  ansteuerung: ansteuerungSchema.optional(),
  knx: z.boolean().optional(),
  stromkreis: stromkreisWertSchema.optional(),
  stromkreisPolzahl: z.union([z.literal(1), z.literal(3)]).optional(),
  geraeteKennzeichen: z.string().optional(),
  klemmenNummer: z.string().optional(),
  betriebsmittelRolle: z.enum(['spule', 'kontaktblock']).optional(),
  kennzeichenSichtbar: z.boolean().optional(),
  stromkreisSichtbar: z.boolean().optional(),
  abgangstext: z
    .object({
      versatz: punktSchema.optional(),
      hoehe: z.number().positive().optional(),
      breite: z.number().positive().optional(),
      text: z.string().optional(),
      ausrichtung: z.enum(['senkrecht', 'links']).optional(),
    })
    .optional(),
  verteiler: z
    .object({
      kennzeichen: z.string(),
      bestueckung: z.array(bestueckungsEintragSchema).default([]),
      raeume: z.array(raumAuswahlSchema).optional(),
      netz: z.enum(['drehstrom', 'wechselstrom']).optional(),
      art: z.enum(['HV', 'UV']).optional(),
    })
    .optional(),
  knxAktor: knxAktorSchema.optional(),
})

const leitungsDockRefSchema = z.object({
  art: z.literal('dock'),
  objektId: z.string(),
  dockpunktIndex: z.number().int().min(0).max(255),
})

const leitungsFreiesEndeSchema = z.object({
  art: z.literal('frei'),
})

const leitungsSchachtRefSchema = z.object({
  art: z.literal('schacht'),
  objektId: z.string(),
  strang: z.number().int().positive(),
})

const leitungsSwitchPortSchema = z.object({
  art: z.literal('switchport'),
  blattId: z.string(),
  objektId: z.string(),
  portIndex: z.number().int().min(0).max(255),
})

const leitungsVerteilerEndeSchema = z.object({
  art: z.literal('verteiler'),
  blattId: z.string(),
  objektId: z.string(),
})

const leitungsZielSchema = z.discriminatedUnion('art', [
  leitungsDockRefSchema,
  leitungsFreiesEndeSchema,
  leitungsSchachtRefSchema,
  leitungsSwitchPortSchema,
  leitungsVerteilerEndeSchema,
])

const trunkDurchgangSchema = z.object({
  trunkId: z.string(),
  eintrittT: z.number(),
  austrittT: z.number(),
  eintrittVersatz: punktSchema.nullable().optional(),
  austrittVersatz: punktSchema.nullable().optional(),
})

const leitungsObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('leitung'),
  pfadSegmente: z.array(z.array(punktSchema)),
  start: leitungsZielSchema,
  ziel: leitungsZielSchema,
  trunkDurchgaenge: z.array(trunkDurchgangSchema).default([]),
  nummer: z.number(),
  bezeichnungSichtbar: z.boolean().optional(),
  nummerVersatz: punktSchema.nullable().optional(),
  beschreibung: z.string().optional(),
  beschreibungSichtbar: z.boolean().optional(),
  typ: z.string().optional(),
  typSichtbar: z.boolean().optional(),
  kabeltypId: z.string().optional(),
  autoRoutingAus: z.boolean().optional(),
  anordnung: anordnungsRegelnSchema.optional(),
  installationszone: installationszoneSchema.optional(),
  teilstueckZonen: z
    .array(z.object({ von: punktSchema, bis: punktSchema, zone: installationszoneSchema }))
    .optional(),
  nurInBauteilen: z.boolean().optional(),
  verteilerAnschluesse: z
    .array(
      z.object({
        ende: z.enum(['start', 'ziel']),
        kennzeichen: z.string(),
        anschluss: z.string().optional(),
        ader: z.string().optional(),
      }),
    )
    .optional(),
})

const schaltverbindungDockRefSchema = z.object({
  art: z.literal('dock'),
  objektId: z.string(),
  dockpunktIndizes: z.array(z.number().int().min(0).max(255)).min(1),
})

const schaltverbindungFreiesEndeSchema = z.object({
  art: z.literal('frei'),
})

const schaltverbindungPotentialRefSchema = z.object({
  art: z.literal('potential'),
  objektId: z.string(),
})

const schaltverbindungAbzweigRefSchema = z.object({
  art: z.literal('schaltverbindung'),
  objektId: z.string(),
})

const schaltverbindungKnotenRefSchema = z.object({
  art: z.literal('knoten'),
  objektId: z.string(),
})

const schaltverbindungAnschlussSchema = z.discriminatedUnion('art', [
  schaltverbindungDockRefSchema,
  schaltverbindungFreiesEndeSchema,
  schaltverbindungPotentialRefSchema,
  schaltverbindungAbzweigRefSchema,
  schaltverbindungKnotenRefSchema,
])

const knotenpunktObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('knotenpunkt'),
  position: punktSchema,
})

const schaltverbindungObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('schaltverbindung'),
  wegpunkte: z.array(punktSchema).min(2),
  start: schaltverbindungAnschlussSchema,
  ziel: schaltverbindungAnschlussSchema,
  polzahl: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  bezeichnung: z.string().optional(),
  beschreibung: z.string().optional(),
  autoRouting: z.boolean().optional(),
  anordnung: anordnungsRegelnSchema.optional(),
  bezeichnungSichtbar: z.boolean().optional(),
  bezeichnungNurAmAnfang: z.boolean().optional(),
  blattverweis: z.boolean().optional(),
  unterbrechung: z.enum(['quelle', 'ziel']).optional(),
  zweiteFarbe: z.string().optional(),
})

const trunkEndeSchema = z.object({
  verbundenesEnde: z
    .object({
      blattId: z.string(),
      trunkId: z.string(),
      endeIndex: z.union([z.literal(0), z.literal(1)]),
    })
    .optional(),
  verbundenerPfad: z
    .object({
      blattId: z.string(),
      trunkId: z.string(),
      t: z.number().min(0).max(1),
    })
    .optional(),
  dockRef: z
    .object({
      objektId: z.string(),
      dockpunktIndex: z.number().int().min(0).max(255),
    })
    .optional(),
  schachtRef: z
    .object({
      objektId: z.string(),
      strang: z.number().int().positive(),
    })
    .optional(),
  beschriftungVersatz: punktSchema.nullable().optional(),
})

const trunkObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('trunk'),
  name: z.string(),
  wegpunkte: z.array(punktSchema),
  enden: z.tuple([trunkEndeSchema, trunkEndeSchema]),
  bezeichnungSichtbar: z.boolean().optional(),
  beschreibung: z.string().optional(),
  beschreibungSichtbar: z.boolean().optional(),
  ausfuehrung: z.enum(['buendel', 'kanal', 'trasse', 'rohr']).optional(),
  abmessung: z
    .union([
      z.object({ breite: z.number().positive(), hoehe: z.number().positive() }),
      z.object({ durchmesser: z.number().positive() }),
    ])
    .optional(),
  installationszone: installationszoneSchema.optional(),
})

const kabelschachtObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('kabelschacht'),
  verbundId: z.string(),
  name: z.string(),
  ursprung: punktSchema,
  breite: z.number(),
  hoehe: z.number(),
  drehung: z.number(),
  geschosshoehe: z.number().nonnegative().default(3),
  strangNamen: z.record(z.string(), z.string()).optional(),
})

const stuecklistenObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('stueckliste'),
  position: punktSchema,
  umfang: z.enum(['blatt', 'projekt']),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
})

const leitungslistenObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('leitungsliste'),
  position: punktSchema,
  umfang: z.enum(['blatt', 'projekt']),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
  stromkreisSpalte: z.boolean().optional(),
})

const switchplanObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('switchplan'),
  position: punktSchema,
  switchBlattId: z.string().nullable(),
  switchObjektId: z.string().nullable(),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
  planArt: z.enum(['switch', 'patchpanel']).optional(),
})

const trunklistenObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('trunkliste'),
  position: punktSchema,
  umfang: z.enum(['blatt', 'projekt']),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
})

const steuerungslogikObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('steuerungslogik'),
  position: punktSchema,
  umfang: z.enum(['blatt', 'projekt']),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
  unbelegteSlotsAusblenden: z.boolean().default(false),
})

const raumlistenObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('raumliste'),
  position: punktSchema,
  umfang: z.enum(['blatt', 'projekt']),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
})

const betriebsmittellistenObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('betriebsmittelliste'),
  position: punktSchema,
  umfang: z.enum(['blatt', 'projekt']),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
})

const stromkreisverzeichnisObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('stromkreisverzeichnis'),
  position: punktSchema,
  verteiler: z.string().nullable(),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
})

const aktorkanallisteObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('aktorkanalliste'),
  position: punktSchema,
  verteiler: z.string().nullable(),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
})

const potentialObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('potential'),
  position: punktSchema,
  drehung: z.number(),
  name: z.string().min(1),
  beschreibung: z.string().optional(),
})

const potentiallistenObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('potentialliste'),
  position: punktSchema,
  umfang: z.enum(['blatt', 'projekt']),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
})

const leitungsbaumObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('leitungsbaum'),
  position: punktSchema,
  gliederung: z.enum(['trunk', 'verteiler']),
  umfang: z.enum(['blatt', 'projekt']),
  titel: z.string().nullable(),
  textHoehe: z.number().positive(),
  zielBreite: z.number().positive().nullable(),
  einpassen: z.boolean(),
  trunksAnzeigen: z.boolean().default(true),
})

const plankopfZelleSchema = z.object({
  beschriftung: z.string(),
  wert: z.string(),
  quelle: z
    .enum([
      'zeichnungName',
      'blattName',
      'blattNummerVonAnzahl',
      'massstab',
      'blattformat',
      'datumHeute',
    ])
    .nullable(),
  spanne: z.number().positive(),
  logo: z.object({ assetId: z.string(), dateiname: z.string() }).nullable().default(null),
})

const plankopfObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('plankopf'),
  position: punktSchema,
  breiteMm: z.number().positive(),
  zeilen: z.array(
    z.object({
      hoeheMm: z.number().positive(),
      zellen: z.array(plankopfZelleSchema),
    }),
  ),
})

const wandObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('wand'),
  punkte: z.array(punktSchema),
  staerke: z.number().positive(),
  fuellung: fuellungSchema,
})

const wandOeffnungBasisSchema = {
  wandId: z.string(),
  t: z.number().min(0).max(1),
  breite: z.number().positive(),
  position: punktSchema,
  richtung: z.number(),
}

const tuerObjektSchema = z.object({
  ...objektBasisSchema,
  ...wandOeffnungBasisSchema,
  type: z.literal('tuer'),
  gespiegelt: z.boolean(),
  schwenkInnen: z.boolean(),
  hoehe: z.number().positive().optional(),
})

const fensterObjektSchema = z.object({
  ...objektBasisSchema,
  ...wandOeffnungBasisSchema,
  type: z.literal('fenster'),
  hoehe: z.number().positive().optional(),
  bruestungshoehe: z.number().nonnegative().optional(),
})

const wanddurchbruchObjektSchema = z.object({
  ...objektBasisSchema,
  ...wandOeffnungBasisSchema,
  type: z.literal('wanddurchbruch'),
})

const raumObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('raum'),
  punktImRaum: punktSchema,
  name: z.string(),
  schriftgroesse: z.number().positive(),
  umriss: z.array(punktSchema),
  flaeche: z.number().nonnegative(),
  mittelpunkt: punktSchema,
  gueltig: z.boolean(),
  nameSichtbar: z.boolean().optional(),
  flaecheSichtbar: z.boolean().optional(),
  fuellung: fuellungSchema,
  beschriftungVersatz: punktSchema.nullable().optional(),
  deckenstaerke: z.number().positive().optional(),
  stromkreisMitRaumId: z.string().optional(),
  raumart: z.enum(RAUMART_IDS).optional(),
})

const treppeObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('treppe'),
  form: z.enum(['gerade', 'u-podest', 'u-kehre', 'l-kehre']),
  ursprung: punktSchema,
  breite: z.number().positive(),
  hoehe: z.number().positive(),
  drehung: z.number(),
  stufenanzahl: z.number().positive(),
  laufrichtungGespiegelt: z.boolean(),
  beschriftungSichtbar: z.boolean(),
  lFormSpiegelHorizontal: z.boolean().optional().default(false),
  lFormSpiegelVertikal: z.boolean().optional().default(false),
  lFormLaufALaenge: z.number().positive().optional().default(1),
  lFormLaufABreite: z.number().positive().optional().default(1),
  lFormLaufBLaenge: z.number().positive().optional().default(1),
  lFormLaufBBreite: z.number().positive().optional().default(1),
})

const bodenplattenObjektSchema = z.object({
  ...objektBasisSchema,
  type: z.literal('bodenplatte'),
  punkte: z.array(punktSchema),
  staerke: z.number().positive(),
  oberkante: z.number(),
  fuellung: fuellungSchema,
})

const objektSchema = z.discriminatedUnion('type', [
  linienObjektSchema,
  polylinienObjektSchema,
  rechteckObjektSchema,
  kreisObjektSchema,
  bogenObjektSchema,
  ellipseObjektSchema,
  polygonObjektSchema,
  punktObjektSchema,
  textObjektSchema,
  bemassungObjektSchema,
  bemassungsreiheObjektSchema,
  schraffurObjektSchema,
  komponentenObjektSchema,
  leitungsObjektSchema,
  schaltverbindungObjektSchema,
  trunkObjektSchema,
  kabelschachtObjektSchema,
  stuecklistenObjektSchema,
  leitungslistenObjektSchema,
  switchplanObjektSchema,
  trunklistenObjektSchema,
  leitungsbaumObjektSchema,
  plankopfObjektSchema,
  wandObjektSchema,
  tuerObjektSchema,
  fensterObjektSchema,
  wanddurchbruchObjektSchema,
  raumObjektSchema,
  raumlistenObjektSchema,
  betriebsmittellistenObjektSchema,
  stromkreisverzeichnisObjektSchema,
  aktorkanallisteObjektSchema,
  potentialObjektSchema,
  knotenpunktObjektSchema,
  potentiallistenObjektSchema,
  steuerungslogikObjektSchema,
  treppeObjektSchema,
  bodenplattenObjektSchema,
])

const kalibrierungSchema = z.object({
  punktA: punktSchema,
  punktB: punktSchema,
  realLaengeMeter: z.number(),
  meterProEinheit: z.number(),
  kalibriertAm: z.string(),
  normmassstab: z.number().positive().optional(),
})

const entityBauteil = { bauteil: z.number().int().nonnegative().optional() }

const dxfEntitySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('linie'), start: punktSchema, ende: punktSchema, ...entityBauteil }),
  z.object({
    type: z.literal('polylinie'),
    punkte: z.array(punktSchema),
    geschlossen: z.boolean(),
    ...entityBauteil,
  }),
  z.object({
    type: z.literal('kreis'),
    mittelpunkt: punktSchema,
    radius: z.number(),
    ...entityBauteil,
  }),
  z.object({
    type: z.literal('bogen'),
    mittelpunkt: punktSchema,
    radius: z.number(),
    startWinkel: z.number(),
    endWinkel: z.number(),
    ...entityBauteil,
  }),
])

const ifcBauteilGruppeSchema = z.enum([
  'waende',
  'tueren',
  'fenster',
  'tragwerk',
  'treppen',
  'decken',
  'sonstiges',
])

const ausblendungSchema = z.object({
  id: z.string(),
  eckeA: punktSchema,
  eckeB: punktSchema,
})

const bekannterHintergrundSchema = z.discriminatedUnion('typ', [
  z.object({
    typ: z.literal('pdf'),
    dateiname: z.string(),
    seite: z.number().int(),
    seitenAnzahl: z.number().int(),
    assetId: z.string().nullable().default(null),
    datenUrl: z.string().nullable().default(null),
    ausschnittOffset: punktSchema.default({ x: 0, y: 0 }),
    breiteRoh: z.number(),
    hoeheRoh: z.number(),
    inhaltRoh: z.object({ min: punktSchema, max: punktSchema }).optional(),
    kalibrierung: kalibrierungSchema.nullable(),
    ausblendungen: z.array(ausblendungSchema).default([]),
    umgewandelt: z.boolean().optional(),
  }),
  z.object({
    typ: z.literal('dxf'),
    dateiname: z.string(),
    assetId: z.string().nullable().default(null),
    datenUrl: z.string().nullable().default(null),
    entities: z.array(dxfEntitySchema),
    breiteRoh: z.number(),
    hoeheRoh: z.number(),
    kalibrierung: kalibrierungSchema.nullable(),
    ausblendungen: z.array(ausblendungSchema).default([]),
  }),
  z.object({
    typ: z.literal('ifc'),
    dateiname: z.string(),
    assetId: z.string().nullable().default(null),
    datenUrl: z.string().nullable().default(null),
    schnitthoehe: z.number(),
    freieHoehe: z.number().optional(),
    lage: z.object({ versatz: punktSchema, drehung: z.number() }),
    entities: z.array(dxfEntitySchema),
    breiteRoh: z.number(),
    hoeheRoh: z.number(),
    ausblendungen: z.array(ausblendungSchema).default([]),
    umgewandelt: z.boolean().optional(),
    bauteile: z
      .array(z.object({ guid: z.string(), klasse: z.string(), name: z.string().optional() }))
      .optional(),
    ausgeblendeteGruppen: z.array(ifcBauteilGruppeSchema).optional(),
  }),
])

const unbekannterHintergrundSchema = z
  .custom<{ typ: string } & Record<string, unknown>>(
    (wert) =>
      typeof wert === 'object' &&
      wert !== null &&
      !Array.isArray(wert) &&
      typeof (wert as { typ?: unknown }).typ === 'string' &&
      !BEKANNTE_HINTERGRUND_TYPEN.includes((wert as { typ: string }).typ),
    { error: () => t('modell.schema.unbekannterHintergrund') },
  )
  .transform((roh) => ({ typ: 'unbekannt' as const, roh }))

const hintergrundSchema = z.union([bekannterHintergrundSchema, unbekannterHintergrundSchema])

const zeichenflaecheSchema = z.object({
  papierformat: z.enum(['A4', 'A3', 'A2', 'A1', 'A0']),
  ausrichtung: z.enum(['hoch', 'quer']),
  massstabNenner: z.number(),
  ursprung: punktSchema,
})

const blattSchema = z.object({
  id: z.string(),
  name: z.string(),
  einheit: z.enum(['mm', 'cm', 'm', 'km']),
  ursprung: punktSchema,
  nullpunkt: punktSchema.nullable().default(null),
  nullpunktRichtung: z.number().optional(),
  massstab: z.number().nullable(),
  hintergrundDrehung: z.number().optional(),
  hintergrund: hintergrundSchema.nullable(),
  hintergrundSichtbar: z.boolean().default(true),
  objekte: z.array(objektSchema),
  ebenen: z.array(ebeneSchema),
  aktiveEbeneId: z.string(),
  hintergrundDeckkraft: z.number().min(0).max(1).default(1),
  symbolSkalierung: z.number().default(1),
  beschriftungSichtbar: z.boolean().default(true),
  bezeichnungSichtbar: z.boolean().default(true),
  leitungBezeichnungSichtbar: z.boolean().default(true),
  leitungBeschreibungSichtbar: z.boolean().default(true),
  leitungTypSichtbar: z.boolean().default(true),
  trunkBezeichnungSichtbar: z.boolean().default(true),
  trunkBeschreibungSichtbar: z.boolean().default(true),
  raumNameSichtbar: z.boolean().default(true),
  raumFlaecheSichtbar: z.boolean().default(true),
  installationshoeheSichtbar: z.boolean().default(true),
  wirkverbindungSichtbar: z.boolean().default(true),
  leitungenSichtbar: z.boolean().default(true),
  trunksSichtbar: z.boolean().default(true),
  schaltverbindungBezeichnungSichtbar: z.boolean().default(true),
  kennzeichenSichtbar: z.boolean().default(true),
  abgaengeSichtbar: z.boolean().default(true),
  stromkreisSichtbar: z.boolean().default(true),
  stromkreisSchildSichtbar: z.boolean().default(true),
  komponentenDarstellung: z.enum(['bild', 'symbol']).default('symbol'),
  textGroessenFaktor: z.number().min(-5).max(5).default(0),
  symbolGroessenFaktor: z.number().min(-5).max(5).default(0),
  zeichenflaeche: zeichenflaecheSchema.nullable().default(null),
  geschoss: z
    .object({
      name: z.string().optional(),
      kote: z.number().optional(),
      raumhoehe: z.number().positive().optional(),
      installationszone: installationszoneSchema.optional(),
      deckenstaerke: z.number().positive().optional(),
      nurInBauteilen: z.boolean().optional(),
      raumquerung: installationszoneSchema.optional(),
      ifcGuid: z.string().optional(),
    })
    .optional(),
})

export const zeichnungSchema = z.object({
  id: z.string(),
  name: z.string(),
  zeichnungsart: z.enum(['bauplan', 'schaltplan']).default('bauplan'),
  verteilerKennzeichen: z.string().optional(),
  verteilerAssistent: z
    .object({
      angaben: z.object({
        art: z.enum(['HV', 'UV']),
        etage: z.string().optional(),
        wohnung: z.string().optional(),
        verwendung: z.string().optional(),
      }),
      bestueckung: z.array(bestueckungsEintragSchema),
      raeume: z.object({ dokumentId: z.string(), auswahl: z.array(raumAuswahlSchema) }).optional(),
      netz: z.enum(['drehstrom', 'wechselstrom']).optional(),
    })
    .optional(),
  blaetter: z.array(blattSchema).min(1),
  aktivesBlattId: z.string(),
  erstelltAm: z.string(),
  zuletztGeaendertAm: z.string(),
  anschlussreserveMeter: z.number().min(0).default(0.5),
  kabeltypen: z.array(kabeltypSchema).default([]),
  standardKabeltypId: z.string().optional(),
  installationszonen: z.array(zonenDefinitionSchema).optional(),
  geraeteGruppen: z.array(geraetegruppeSchema).default([]),
  herkunftTestversion: z.boolean().optional(),
  plansprache: z.string().optional(),
  ebenenStand: z.number().int().optional(),
  formatVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

export type ZeichnungJson = z.infer<typeof zeichnungSchema>

export class ZeichnungsValidierungsFehler extends Error {
  issues: string[]

  constructor(message: string, issues: string[]) {
    super(message)
    this.name = 'ZeichnungsValidierungsFehler'
    this.issues = issues
  }
}

export function parseZeichnungJson(daten: unknown): ZeichnungJson {
  const ergebnis = zeichnungSchema.safeParse(daten)
  if (!ergebnis.success) {
    const issues = ergebnis.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new ZeichnungsValidierungsFehler(t('modell.schema.ungueltigeZeichnung'), issues)
  }
  return ergebnis.data
}
