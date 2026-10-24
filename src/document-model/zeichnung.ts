import type { Blatt } from './blatt'
import { erzeugeBlatt } from './blatt'
import { EBENEN_STAND } from './ebenen'
import type { Geraetegruppe } from './geraetegruppe'
import { erzeugeId } from './id'
import type { ZonenDefinition } from './installationszonen'
import type { Kabeltyp } from './kabeltyp'
import type { BestueckungsEintrag, RaumAuswahl } from './objekte'
import type { VerteilerAngaben } from './verteiler-assistent'
import type { Zeichnungsart } from './zeichnungsart'
import { STANDARD_ZEICHNUNGSART } from './zeichnungsart'
import type { Sprache } from '../sprache'
import { planUebersetzer } from './plansprache'

export const STANDARD_ANSCHLUSSRESERVE_METER = 0.5

export interface Zeichnung {
  id: string
  name: string
  zeichnungsart: Zeichnungsart
  verteilerKennzeichen?: string
  verteilerAssistent?: {
    angaben: VerteilerAngaben
    bestueckung: BestueckungsEintrag[]
    raeume?: { dokumentId: string; auswahl: RaumAuswahl[] }
    netz?: 'drehstrom' | 'wechselstrom'
  }
  blaetter: Blatt[]
  aktivesBlattId: string
  erstelltAm: string
  zuletztGeaendertAm: string
  anschlussreserveMeter: number
  kabeltypen: Kabeltyp[]
  standardKabeltypId?: string
  installationszonen?: ZonenDefinition[]
  geraeteGruppen: Geraetegruppe[]
  herkunftTestversion?: boolean
  plansprache?: string
  ebenenStand?: number
}

export interface ZeichnungsUebersicht {
  id: string
  name: string
  zuletztGeaendertAm: string
}

export function erzeugeZeichnung(
  name?: string,
  zeichnungsart: Zeichnungsart = STANDARD_ZEICHNUNGSART,
  plansprache?: Sprache,
): Zeichnung {
  const tp = planUebersetzer({ plansprache })
  const erstesBlatt = erzeugeBlatt(tp('plan.vorgabe.blatt', { nr: '1' }), zeichnungsart, tp)
  const jetzt = new Date().toISOString()
  return {
    id: erzeugeId('projekt'),
    name: name ?? tp('plan.vorgabe.zeichnung'),
    zeichnungsart,
    ...(plansprache ? { plansprache } : {}),
    blaetter: [erstesBlatt],
    aktivesBlattId: erstesBlatt.id,
    erstelltAm: jetzt,
    zuletztGeaendertAm: jetzt,
    anschlussreserveMeter: STANDARD_ANSCHLUSSRESERVE_METER,
    kabeltypen: [],
    geraeteGruppen: [],
    ebenenStand: EBENEN_STAND,
  }
}

export function zeichnungZuUebersicht(zeichnung: Zeichnung): ZeichnungsUebersicht {
  return {
    id: zeichnung.id,
    name: zeichnung.name,
    zuletztGeaendertAm: zeichnung.zuletztGeaendertAm,
  }
}
