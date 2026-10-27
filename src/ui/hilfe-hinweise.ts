import { useSettingsStore } from './store/settings-store'
import { useUiStore } from './store/ui-store'

export const HILFE_HINWEISE = [
  { kennung: 'blatt', anker: 'ablauf-bauplan-einfach' },
  { kennung: 'verteiler', anker: 'verteiler' },
  { kennung: 'trunk', anker: 'trunk-anlegen' },
  { kennung: 'leitung', anker: 'leitung-zeichnen' },
  { kennung: 'komponente', anker: 'komponente-platzieren' },
  { kennung: 'verbraucher', anker: 'geraetegruppen' },
  { kennung: 'befehlsgeraet', anker: 'wirkverbindungen' },
  { kennung: 'dreid', anker: 'dreid-ansicht' },
] as const

export type HilfeHinweisKennung = (typeof HILFE_HINWEISE)[number]['kennung']

export const ALLE_HILFE_HINWEIS_KENNUNGEN: readonly HilfeHinweisKennung[] = HILFE_HINWEISE.map(
  (h) => h.kennung,
)

export function istHilfeHinweis(kennung: string): kennung is HilfeHinweisKennung {
  return (ALLE_HILFE_HINWEIS_KENNUNGEN as readonly string[]).includes(kennung)
}

export function hilfeHinweisAnker(kennung: string): string | null {
  return HILFE_HINWEISE.find((h) => h.kennung === kennung)?.anker ?? null
}

export interface HinweisSchalter {
  hilfeHinweiseZeigen: boolean
  ausgeblendeteHilfeHinweise: readonly string[]
}

export function istHilfeHinweisAktiv(schalter: HinweisSchalter, kennung: string): boolean {
  return schalter.hilfeHinweiseZeigen && !schalter.ausgeblendeteHilfeHinweise.includes(kennung)
}

export function hinweisFuerKatalogAuswahl(auswahl: {
  typ?: string
  bauart?: string
}): HilfeHinweisKennung | null {
  if (auswahl.bauart === 'verteiler') return 'verteiler'
  if (auswahl.typ === 'verbraucher') return 'verbraucher'
  if (auswahl.typ === 'bediengeraet') return 'befehlsgeraet'
  return null
}

export function hinweisFuerWerkzeug(werkzeugId: string): HilfeHinweisKennung | null {
  if (werkzeugId === 'trunk' || werkzeugId === 'leitung' || werkzeugId === 'komponente') {
    return werkzeugId
  }
  return null
}

export function zeigeHilfeHinweis(kennung: HilfeHinweisKennung): void {
  const s = useSettingsStore.getState()
  if (!istHilfeHinweisAktiv(s, kennung)) return
  useUiStore.getState().reiheHilfeHinweisEin(kennung)
}
