import { holeJson, sendeJson } from './api-client'

export interface FehlerprotokollInhalt {
  text: string
  groesseBytes: number
}

export function leseFehlerprotokoll(): Promise<FehlerprotokollInhalt> {
  return holeJson<FehlerprotokollInhalt>('/fehlerprotokoll')
}

export interface FehlerprotokollEintragEingabe {
  nachricht: string
  stack?: string
  kontext?: string
}

export function meldeFehlerAnProtokoll(eintrag: FehlerprotokollEintragEingabe): Promise<void> {
  return sendeJson<void>('POST', '/fehlerprotokoll', eintrag)
}
