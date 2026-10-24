import { z } from 'zod'
import { t } from '../sprache'
import type { Texte } from '../sprache'

export interface IfcKlassenDefinition {
  klasse: string
  readonly bezeichnung: string
  typen: readonly string[]
}

type BekannteKlasse = keyof Texte['modell']['ifcKlassen']['namen']

export const IFC_KLASSE_OHNE_ZUORDNUNG = 'IfcBuildingElementProxy'
export const IFC_KLASSE_ZUBEHOER = 'IfcDiscreteAccessory'
export const IFC_TYP_NICHT_FESTGELEGT = 'NOTDEFINED'
export const IFC_TYP_EIGENER = 'USERDEFINED'

const N = IFC_TYP_NICHT_FESTGELEGT

const KLASSEN_OHNE_EIGENEN: readonly { klasse: BekannteKlasse; typen: readonly string[] }[] = [
  {
    klasse: 'IfcOutlet',
    typen: [
      N,
      'POWEROUTLET',
      'DATAOUTLET',
      'COMMUNICATIONSOUTLET',
      'TELEPHONEOUTLET',
      'AUDIOVISUALOUTLET',
    ],
  },
  {
    klasse: 'IfcSwitchingDevice',
    typen: [
      N,
      'TOGGLESWITCH',
      'MOMENTARYSWITCH',
      'DIMMERSWITCH',
      'SELECTORSWITCH',
      'KEYPAD',
      'EMERGENCYSTOP',
      'CONTACTOR',
      'STARTER',
      'SWITCHDISCONNECTOR',
    ],
  },
  {
    klasse: 'IfcSensor',
    typen: [
      N,
      'MOVEMENTSENSOR',
      'LIGHTSENSOR',
      'TEMPERATURESENSOR',
      'HUMIDITYSENSOR',
      'SMOKESENSOR',
      'HEATSENSOR',
      'FIRESENSOR',
      'CONTACTSENSOR',
      'CO2SENSOR',
      'COSENSOR',
      'GASSENSOR',
      'WINDSENSOR',
      'SOUNDSENSOR',
      'MOISTURESENSOR',
      'PRESSURESENSOR',
      'FLOWSENSOR',
      'LEVELSENSOR',
      'FROSTSENSOR',
      'IDENTIFIERSENSOR',
      'CONDUCTANCESENSOR',
      'IONCONCENTRATIONSENSOR',
      'PHSENSOR',
      'RADIATIONSENSOR',
      'RADIOACTIVITYSENSOR',
    ],
  },
  {
    klasse: 'IfcActuator',
    typen: [
      N,
      'ELECTRICACTUATOR',
      'HANDOPERATEDACTUATOR',
      'HYDRAULICACTUATOR',
      'PNEUMATICACTUATOR',
      'THERMOSTATICACTUATOR',
    ],
  },
  {
    klasse: 'IfcController',
    typen: [N, 'PROGRAMMABLE', 'TWOPOSITION', 'MULTIPOSITION', 'PROPORTIONAL', 'FLOATING'],
  },
  {
    klasse: 'IfcUnitaryControlElement',
    typen: [
      N,
      'CONTROLPANEL',
      'INDICATORPANEL',
      'ALARMPANEL',
      'MIMICPANEL',
      'GASDETECTIONPANEL',
      'THERMOSTAT',
      'HUMIDISTAT',
      'WEATHERSTATION',
    ],
  },
  {
    klasse: 'IfcElectricTimeControl',
    typen: [N, 'TIMECLOCK', 'TIMEDELAY', 'RELAY'],
  },
  {
    klasse: 'IfcElectricAppliance',
    typen: [
      N,
      'DISHWASHER',
      'ELECTRICCOOKER',
      'FREESTANDINGELECTRICHEATER',
      'FREESTANDINGFAN',
      'FREESTANDINGWATERHEATER',
      'FREESTANDINGWATERCOOLER',
      'FREEZER',
      'FRIDGE_FREEZER',
      'HANDDRYER',
      'KITCHENMACHINE',
      'MICROWAVE',
      'PHOTOCOPIER',
      'REFRIGERATOR',
      'TUMBLEDRYER',
      'VENDINGMACHINE',
      'WASHINGMACHINE',
    ],
  },
  {
    klasse: 'IfcLightFixture',
    typen: [N, 'POINTSOURCE', 'DIRECTIONSOURCE', 'SECURITYLIGHTING'],
  },
  {
    klasse: 'IfcElectricDistributionBoard',
    typen: [N, 'DISTRIBUTIONBOARD', 'CONSUMERUNIT', 'SWITCHBOARD', 'MOTORCONTROLCENTRE'],
  },
  {
    klasse: 'IfcProtectiveDevice',
    typen: [
      N,
      'CIRCUITBREAKER',
      'RESIDUALCURRENTCIRCUITBREAKER',
      'RESIDUALCURRENTSWITCH',
      'EARTHLEAKAGECIRCUITBREAKER',
      'FUSEDISCONNECTOR',
      'EARTHINGSWITCH',
      'VARISTOR',
    ],
  },
  {
    klasse: 'IfcJunctionBox',
    typen: [N, 'POWER', 'DATA'],
  },
  {
    klasse: 'IfcCommunicationsAppliance',
    typen: [
      N,
      'COMPUTER',
      'NETWORKAPPLIANCE',
      'NETWORKHUB',
      'NETWORKBRIDGE',
      'ROUTER',
      'GATEWAY',
      'MODEM',
      'REPEATER',
      'ANTENNA',
      'PRINTER',
      'SCANNER',
      'FAX',
    ],
  },
  {
    klasse: 'IfcAudioVisualAppliance',
    typen: [
      N,
      'CAMERA',
      'DISPLAY',
      'SPEAKER',
      'MICROPHONE',
      'TELEPHONE',
      'AMPLIFIER',
      'PLAYER',
      'PROJECTOR',
      'RECEIVER',
      'SWITCHER',
      'TUNER',
    ],
  },
  {
    klasse: 'IfcAlarm',
    typen: [N, 'BELL', 'SIREN', 'LIGHT', 'BREAKGLASSBUTTON', 'MANUALPULLBOX', 'WHISTLE'],
  },
  {
    klasse: 'IfcElectricGenerator',
    typen: [N, 'STANDALONE', 'ENGINEGENERATOR', 'CHP'],
  },
  {
    klasse: 'IfcSolarDevice',
    typen: [N, 'SOLARPANEL', 'SOLARCOLLECTOR'],
  },
  {
    klasse: 'IfcElectricFlowStorageDevice',
    typen: [N, 'BATTERY', 'UPS', 'CAPACITORBANK', 'HARMONICFILTER', 'INDUCTORBANK'],
  },
  {
    klasse: 'IfcTransformer',
    typen: [N, 'VOLTAGE', 'CURRENT', 'FREQUENCY', 'INVERTER', 'RECTIFIER'],
  },
  {
    klasse: 'IfcElectricMotor',
    typen: [N, 'INDUCTION', 'SYNCHRONOUS', 'POLYPHASE', 'DC', 'RELUCTANCESYNCHRONOUS'],
  },
  {
    klasse: IFC_KLASSE_ZUBEHOER,
    typen: [N],
  },
  {
    klasse: IFC_KLASSE_OHNE_ZUORDNUNG,
    typen: [N],
  },
]

export const IFC_KLASSEN: readonly IfcKlassenDefinition[] = KLASSEN_OHNE_EIGENEN.map((k) => ({
  klasse: k.klasse,
  typen: [...k.typen, IFC_TYP_EIGENER],
  get bezeichnung() {
    return t(`modell.ifcKlassen.namen.${k.klasse}`)
  },
}))

const klassenIndex = new Map(IFC_KLASSEN.map((k) => [k.klasse, k]))

export function ifcKlassenDefinition(klasse: string): IfcKlassenDefinition | undefined {
  return klassenIndex.get(klasse)
}

export function ifcKlassenBezeichnung(klasse: string): string {
  const k = klassenIndex.get(klasse)
  return k
    ? t('modell.ifcKlassen.mitKlasse', { bezeichnung: k.bezeichnung, klasse: k.klasse })
    : t('modell.ifcKlassen.unbekannt', { klasse })
}

export function istGueltigeIfcZuordnung(klasse: string, typ: string): boolean {
  return klassenIndex.get(klasse)?.typen.includes(typ) ?? false
}

export const ifcKlasseSchema = z.string().regex(/^Ifc[A-Za-z0-9]+$/)
export const ifcTypSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/)

export interface IfcZuordnung {
  klasse: string
  typ: string
  typName?: string
}

export interface IfcAngabe {
  ifcKlasse?: string
  ifcTyp?: string
  ifcTypName?: string
}

export function bestimmeIfcZuordnung(
  eintrag: IfcAngabe | undefined,
  geraeteTyp: IfcAngabe | undefined,
): IfcZuordnung {
  const quelle = eintrag?.ifcKlasse ? eintrag : geraeteTyp?.ifcKlasse ? geraeteTyp : undefined
  const definition = quelle?.ifcKlasse ? klassenIndex.get(quelle.ifcKlasse) : undefined
  if (!definition) return { klasse: IFC_KLASSE_OHNE_ZUORDNUNG, typ: IFC_TYP_NICHT_FESTGELEGT }
  const typ = quelle?.ifcTyp
  if (typ === IFC_TYP_EIGENER) {
    const typName = quelle?.ifcTypName?.trim()
    return typName
      ? { klasse: definition.klasse, typ, typName }
      : { klasse: definition.klasse, typ: IFC_TYP_NICHT_FESTGELEGT }
  }
  return {
    klasse: definition.klasse,
    typ: typ && definition.typen.includes(typ) ? typ : IFC_TYP_NICHT_FESTGELEGT,
  }
}
