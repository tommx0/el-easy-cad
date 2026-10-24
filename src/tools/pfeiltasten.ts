import { ROUTING_ZELLGROESSE_METER } from '../routing'

export interface PfeiltastenSchritte {
  kleinMeter: number
  grossMeter: number
}

export const STANDARD_PFEILTASTEN_SCHRITTE: Readonly<PfeiltastenSchritte> = {
  kleinMeter: ROUTING_ZELLGROESSE_METER,
  grossMeter: 1,
}
