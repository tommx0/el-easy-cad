import { z } from 'zod'
import { ifcKlasseSchema, ifcTypSchema } from './ifc-klassen'
import {
  bezeichnungsUebersetzungenSchema,
  regelwerkText,
  type BezeichnungsUebersetzung,
  type Uebersetzungen,
} from './katalog-uebersetzung'
import { erzeugeUebersetzer, oberflaechensprache, type Sprache } from '../sprache'

export type SlotDarstellung = 'keine' | 'liste' | 'matrix'

export interface GeraeteTypDefinition {
  kennung: string
  bezeichnung: string
  uebersetzungen?: Uebersetzungen<BezeichnungsUebersetzung>
  slots: SlotDarstellung
  ansteuerung: boolean
  ausgeblendet?: boolean
  verbindungenGrau?: boolean
  ifcKlasse?: string
  ifcTyp?: string
  ifcTypName?: string
  standardMontagehoehe?: number
}

export interface AnsteuerungsArt {
  kennung: string
  bezeichnung: string
  uebersetzungen?: Uebersetzungen<BezeichnungsUebersetzung>
  ausgeblendet?: boolean
}

export interface GeraeteRegelwerk {
  version: number
  typen: GeraeteTypDefinition[]
  ueblicheZiele: Record<string, string[]>
  ansteuerungen: AnsteuerungsArt[]
}

export const KENNUNG_MUSTER = /^[a-z][a-z0-9-]*$/
export const kennungSchema = z.string().regex(KENNUNG_MUSTER)

function englisch(bezeichnung: string): { uebersetzungen: { en: { bezeichnung: string } } } {
  return { uebersetzungen: { en: { bezeichnung } } }
}

const MIT_SLOT_ZIELEN = ['verbraucher', 'systemgeraet', 'anschlussdose']

function ifc(
  ifcKlasse: string,
  ifcTyp: string,
  standardMontagehoehe: number,
): Pick<GeraeteTypDefinition, 'ifcKlasse' | 'ifcTyp' | 'standardMontagehoehe'> {
  return { ifcKlasse, ifcTyp, standardMontagehoehe }
}

export const STANDARD_REGELWERK: GeraeteRegelwerk = {
  version: 1,
  typen: [
    {
      kennung: 'bediengeraet',
      bezeichnung: 'Bediengerät',
      ...englisch('Control device'),
      slots: 'matrix',
      ansteuerung: false,
      verbindungenGrau: true,
      ...ifc('IfcSwitchingDevice', 'TOGGLESWITCH', 1.05),
    },
    {
      kennung: 'verbraucher',
      bezeichnung: 'Verbraucher',
      ...englisch('Load'),
      slots: 'keine',
      ansteuerung: true,
      ...ifc('IfcElectricAppliance', 'NOTDEFINED', 2.4),
    },
    {
      kennung: 'systemgeraet',
      bezeichnung: 'Systemgerät',
      ...englisch('System device'),
      slots: 'liste',
      ansteuerung: false,
      ...ifc('IfcCommunicationsAppliance', 'NOTDEFINED', 1.5),
    },
    {
      kennung: 'sensor',
      bezeichnung: 'Sensor',
      ...englisch('Sensor'),
      slots: 'liste',
      ansteuerung: false,
      ...ifc('IfcSensor', 'NOTDEFINED', 2.2),
    },
    {
      kennung: 'betriebsmittel',
      bezeichnung: 'Betriebsmittel',
      ...englisch('Equipment'),
      slots: 'keine',
      ansteuerung: false,
      ...ifc('IfcElectricDistributionBoard', 'DISTRIBUTIONBOARD', 1.5),
    },
    {
      kennung: 'anschlussdose',
      bezeichnung: 'Anschlussdose',
      ...englisch('Outlet'),
      slots: 'keine',
      ansteuerung: false,
      ...ifc('IfcOutlet', 'POWEROUTLET', 0.3),
    },
    {
      kennung: 'aktor',
      bezeichnung: 'Aktor',
      ...englisch('Actuator'),
      slots: 'liste',
      ansteuerung: true,
      ...ifc('IfcActuator', 'ELECTRICACTUATOR', 1.5),
    },
    {
      kennung: 'anzeige',
      bezeichnung: 'Anzeige',
      ...englisch('Display'),
      slots: 'liste',
      ansteuerung: false,
      ...ifc('IfcAlarm', 'NOTDEFINED', 1.5),
    },
    {
      kennung: 'erzeuger',
      bezeichnung: 'Erzeuger',
      ...englisch('Generator'),
      slots: 'keine',
      ansteuerung: false,
      ...ifc('IfcElectricGenerator', 'NOTDEFINED', 0),
    },
    {
      kennung: 'sender',
      bezeichnung: 'Sender',
      ...englisch('Transmitter'),
      slots: 'keine',
      ansteuerung: false,
      ...ifc('IfcCommunicationsAppliance', 'NOTDEFINED', 1.5),
    },
    {
      kennung: 'empfaenger',
      bezeichnung: 'Empfänger',
      ...englisch('Receiver'),
      slots: 'keine',
      ansteuerung: false,
      ...ifc('IfcCommunicationsAppliance', 'NOTDEFINED', 1.5),
    },
    {
      kennung: 'uebertrager',
      bezeichnung: 'Übertrager',
      ...englisch('Transmission device'),
      slots: 'keine',
      ansteuerung: false,
      ...ifc('IfcCommunicationsAppliance', 'NOTDEFINED', 1.5),
    },
    {
      kennung: 'pc',
      bezeichnung: 'PC',
      slots: 'keine',
      ansteuerung: false,
      ...ifc('IfcCommunicationsAppliance', 'COMPUTER', 0.75),
    },
    {
      kennung: 'server',
      bezeichnung: 'Server',
      ...englisch('Server'),
      slots: 'keine',
      ansteuerung: false,
      ...ifc('IfcCommunicationsAppliance', 'COMPUTER', 0),
    },
  ],
  ueblicheZiele: {
    bediengeraet: MIT_SLOT_ZIELEN,
    systemgeraet: MIT_SLOT_ZIELEN,
    sensor: MIT_SLOT_ZIELEN,
    aktor: MIT_SLOT_ZIELEN,
    anzeige: MIT_SLOT_ZIELEN,
  },
  ansteuerungen: [
    { kennung: 'schalten', bezeichnung: 'Schalten', ...englisch('Switching') },
    { kennung: 'dimmen', bezeichnung: 'Dimmen', ...englisch('Dimming') },
    { kennung: 'pwm', bezeichnung: 'PWM' },
    { kennung: 'analog', bezeichnung: 'Analog', ...englisch('Analogue') },
    { kennung: 'rollo', bezeichnung: 'Rollo', ...englisch('Roller blind') },
    { kennung: 'jalousie', bezeichnung: 'Jalousie', ...englisch('Venetian blind') },
    { kennung: 'rgb', bezeichnung: 'RGB' },
    { kennung: 'rgbw', bezeichnung: 'RGBW' },
    { kennung: 'rgbww', bezeichnung: 'RGBWW' },
    { kennung: 'dali', bezeichnung: 'Dali', ...englisch('DALI') },
    { kennung: 'zigbee', bezeichnung: 'Zigbee', ...englisch('Zigbee') },
    { kennung: 'sonstiges', bezeichnung: 'Sonstiges', ...englisch('Other') },
  ],
}

export const geraeteRegelwerkSchema = z
  .object({
    version: z.number().int().nonnegative(),
    typen: z.array(
      z.object({
        kennung: kennungSchema,
        bezeichnung: z.string(),
        uebersetzungen: bezeichnungsUebersetzungenSchema,
        slots: z.enum(['keine', 'liste', 'matrix']),
        ansteuerung: z.boolean(),
        ausgeblendet: z.boolean().optional(),
        verbindungenGrau: z.boolean().optional(),
        ifcKlasse: ifcKlasseSchema.optional(),
        ifcTyp: ifcTypSchema.optional(),
        ifcTypName: z.string().optional(),
        standardMontagehoehe: z.number().nonnegative().optional(),
      }),
    ),
    ueblicheZiele: z.record(z.string(), z.array(z.string())),
    ansteuerungen: z.array(
      z.object({
        kennung: kennungSchema,
        bezeichnung: z.string(),
        uebersetzungen: bezeichnungsUebersetzungenSchema,
        ausgeblendet: z.boolean().optional(),
      }),
    ),
  })
  .superRefine((r, ctx) => {
    for (const [feld, liste] of [
      ['typen', r.typen],
      ['ansteuerungen', r.ansteuerungen],
    ] as const) {
      const gesehen = new Set<string>()
      for (const e of liste) {
        if (gesehen.has(e.kennung))
          ctx.addIssue({ code: 'custom', path: [feld], message: `Kennung doppelt: ${e.kennung}` })
        gesehen.add(e.kennung)
      }
    }
  })

export function regelwerkFingerabdruck(r: GeraeteRegelwerk): string {
  return JSON.stringify([r.typen, r.ueblicheZiele, r.ansteuerungen])
}

export function neueresRegelwerk(
  a: GeraeteRegelwerk,
  b: GeraeteRegelwerk | null | undefined,
): GeraeteRegelwerk {
  return b && b.version > a.version ? b : a
}

let aktiv: GeraeteRegelwerk = STANDARD_REGELWERK
let typIndex = new Map<string, GeraeteTypDefinition>()
let ansteuerungIndex = new Map<string, AnsteuerungsArt>()
const beobachter = new Set<() => void>()

function indexAufbauen(): void {
  typIndex = new Map(aktiv.typen.map((t) => [t.kennung, t]))
  ansteuerungIndex = new Map(aktiv.ansteuerungen.map((a) => [a.kennung, a]))
}
indexAufbauen()

export function aktivesRegelwerk(): GeraeteRegelwerk {
  return aktiv
}

export function setzeAktivesRegelwerk(regelwerk: GeraeteRegelwerk): void {
  aktiv = regelwerk
  indexAufbauen()
  for (const b of beobachter) b()
}

export function beobachteRegelwerk(rueckruf: () => void): () => void {
  beobachter.add(rueckruf)
  return () => beobachter.delete(rueckruf)
}

export function typDefinition(kennung: string): GeraeteTypDefinition | undefined {
  return typIndex.get(kennung)
}

export function typBezeichnung(kennung: string, sprache: Sprache = oberflaechensprache()): string {
  const typ = typIndex.get(kennung)
  return typ
    ? regelwerkText(typ, sprache)
    : erzeugeUebersetzer(sprache)('modell.regelwerk.unbekannterTyp', { kennung })
}

export function typSlotDarstellung(kennung: string): SlotDarstellung {
  return typIndex.get(kennung)?.slots ?? 'liste'
}

export function waehlbareTypen(
  zusaetzlich?: string,
  sprache: Sprache = oberflaechensprache(),
): { kennung: string; bezeichnung: string }[] {
  const liste = aktiv.typen
    .filter((t) => !t.ausgeblendet || t.kennung === zusaetzlich)
    .map((t) => ({ kennung: t.kennung, bezeichnung: regelwerkText(t, sprache) }))
  if (zusaetzlich && !typIndex.has(zusaetzlich))
    liste.push({ kennung: zusaetzlich, bezeichnung: typBezeichnung(zusaetzlich, sprache) })
  return liste
}

export function ansteuerungBezeichnung(
  kennung: string,
  sprache: Sprache = oberflaechensprache(),
): string {
  const art = ansteuerungIndex.get(kennung)
  return art
    ? regelwerkText(art, sprache)
    : erzeugeUebersetzer(sprache)('modell.regelwerk.unbekannteAnsteuerung', { kennung })
}

export function waehlbareAnsteuerungen(
  zusaetzlich?: string,
  sprache: Sprache = oberflaechensprache(),
): { kennung: string; bezeichnung: string }[] {
  const liste = aktiv.ansteuerungen
    .filter((a) => !a.ausgeblendet || a.kennung === zusaetzlich)
    .map((a) => ({ kennung: a.kennung, bezeichnung: regelwerkText(a, sprache) }))
  if (zusaetzlich && !ansteuerungIndex.has(zusaetzlich))
    liste.push({ kennung: zusaetzlich, bezeichnung: ansteuerungBezeichnung(zusaetzlich, sprache) })
  return liste
}

export function erzeugeKennung(
  bezeichnung: string,
  vorhandene: Iterable<string>,
  praefix = 'typ',
): string {
  const basis =
    `${praefix}-` +
    (bezeichnung
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'neu')
  const belegt = new Set(vorhandene)
  if (!belegt.has(basis)) return basis
  let n = 2
  while (belegt.has(`${basis}-${n}`)) n++
  return `${basis}-${n}`
}
