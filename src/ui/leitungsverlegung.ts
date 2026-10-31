import type { Zeichnung, Zeichnungsart } from '../document-model'
import { useSettingsStore } from './store/settings-store'
import { useProject } from './use-app-context'
import { werkzeugPasstZuZeichnungsart } from './werkzeugleiste-reihenfolge'

export const LEITUNGS_WERKZEUGE: ReadonlySet<string> = new Set([
  'leitung',
  'trunk',
  'kabelschacht',
  'leitungsliste',
  'trunkliste',
  'leitungsbaum',
  'switchplan',
  'patchpanelplan',
])

export const BETA_WERKZEUGE: ReadonlySet<string> = new Set(['leitung', 'trunk', 'kabelschacht'])

export const LEITUNGS_BEFEHLE: readonly string[] = [
  ...[...LEITUNGS_WERKZEUGE].map((id) => `werkzeug.${id}`),
  'bearbeiten.leitungen-neu-verlegen',
  'katalog.kabeltypen',
  'katalog.installationszonen',
  'blatt.anzeige-leitungsnummer',
  'blatt.anzeige-leitungstyp',
  'blatt.anzeige-leitungsbeschreibung',
  'blatt.anzeige-trunkname',
  'blatt.anzeige-trunkbeschreibung',
  'blatt.anzeige-leitungen',
  'blatt.anzeige-trunks',
]

export function leitungsverlegungAus(art: Zeichnungsart, eingeschaltet: boolean): boolean {
  return art === 'bauplan' && !eingeschaltet
}

export function leitungsverlegungAusFuer(zeichnung: Pick<Zeichnung, 'zeichnungsart'>): boolean {
  return leitungsverlegungAus(
    zeichnung.zeichnungsart,
    useSettingsStore.getState().leitungsverlegung,
  )
}

export function useLeitungsverlegungAus(): boolean {
  const art = useProject().zeichnungsart
  const eingeschaltet = useSettingsStore((s) => s.leitungsverlegung)
  return leitungsverlegungAus(art, eingeschaltet)
}

export function werkzeugAngeboten(
  werkzeugId: string,
  art: Zeichnungsart,
  leitungsverlegungEingeschaltet: boolean,
): boolean {
  if (!werkzeugPasstZuZeichnungsart(werkzeugId, art)) return false
  return !(
    leitungsverlegungAus(art, leitungsverlegungEingeschaltet) && LEITUNGS_WERKZEUGE.has(werkzeugId)
  )
}
