import { create } from 'zustand'
import type { ZusatzmodulEintrag } from '../../document-model'
import type { ZusatzmodulPanel } from '../zusatzmodule/schnittstelle'

interface ZusatzmodulState {
  eintraege: ZusatzmodulEintrag[]
  texte: Record<string, Record<string, string>>
  laufend: ZusatzmodulLauf | null
  setzeBestand: (
    eintraege: ZusatzmodulEintrag[],
    texte: Record<string, Record<string, string>>,
  ) => void
  setzeLaufend: (laufend: ZusatzmodulLauf | null) => void
  panels: ZusatzmodulPanelEintrag[]
  setzePanel: (panel: ZusatzmodulPanelEintrag) => void
  aenderePanel: (schluessel: string, patch: Partial<ZusatzmodulPanelEintrag>) => void
  entfernePanel: (schluessel: string) => void
}

export interface ZusatzmodulLauf {
  kennung: string
  titel: string
  fortschritt: { anteil: number | null; text: string | null } | null
}

export interface ZusatzmodulPanelEintrag {
  schluessel: string
  kennung: string
  titel: string
  ort: 'rechts' | 'schwebend'
  sichtbar: boolean
  erzeuge: ZusatzmodulPanel['erzeuge']
}

export const useZusatzmodulStore = create<ZusatzmodulState>((set) => ({
  eintraege: [],
  texte: {},
  laufend: null,
  setzeBestand: (eintraege, texte) => set({ eintraege, texte }),
  setzeLaufend: (laufend) => set({ laufend }),
  panels: [],
  setzePanel: (panel) =>
    set((s) => {
      const index = s.panels.findIndex((p) => p.schluessel === panel.schluessel)
      if (index < 0) return { panels: [...s.panels, panel] }
      const panels = [...s.panels]
      panels[index] = panel
      return { panels }
    }),
  aenderePanel: (schluessel, patch) =>
    set((s) => ({
      panels: s.panels.map((p) => (p.schluessel === schluessel ? { ...p, ...patch } : p)),
    })),
  entfernePanel: (schluessel) =>
    set((s) => ({ panels: s.panels.filter((p) => p.schluessel !== schluessel) })),
}))

export function zusatzmodulText(
  texte: Record<string, string> | undefined,
  schluessel: string,
  werte?: Record<string, string | number>,
): string {
  const roh = texte?.[schluessel] ?? schluessel
  if (!werte) return roh
  return roh.replace(/\{(\w+)\}/g, (ganz, name: string) =>
    name in werte ? String(werte[name]) : ganz,
  )
}
