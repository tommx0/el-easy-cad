import type { TreppenForm } from '../document-model'
import {
  FENSTER_BRUESTUNG_METER,
  FENSTER_HOEHE_METER,
  STANDARD_FENSTER_BREITE,
  STANDARD_TUER_BREITE,
  TUER_HOEHE_METER,
} from '../document-model'

export interface BauteilVorgaben {
  tuerBreite: number
  tuerHoehe: number
  fensterBreite: number
  fensterHoehe: number
  fensterBruestung: number
  treppenForm: TreppenForm
  treppenMasse: Record<TreppenForm, TreppenMasse>
}

export interface TreppenMasse {
  laenge: number
  breite: number
}

export const STANDARD_BAUTEIL_VORGABEN: BauteilVorgaben = {
  tuerBreite: STANDARD_TUER_BREITE,
  tuerHoehe: TUER_HOEHE_METER,
  fensterBreite: STANDARD_FENSTER_BREITE,
  fensterHoehe: FENSTER_HOEHE_METER,
  fensterBruestung: FENSTER_BRUESTUNG_METER,
  treppenForm: 'gerade',
  treppenMasse: {
    gerade: { laenge: 3.0, breite: 1.0 },
    'u-podest': { laenge: 2.7, breite: 2.2 },
    'u-kehre': { laenge: 2.4, breite: 2.2 },
    'l-kehre': { laenge: 2.6, breite: 2.2 },
  },
}

export const TREPPEN_MASS_MIN = 0.3
