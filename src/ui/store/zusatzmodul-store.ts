import { create } from 'zustand'
import type { ZusatzmodulEintrag } from '../../document-model'

interface ZusatzmodulState {
  eintraege: ZusatzmodulEintrag[]
  texte: Record<string, Record<string, string>>
  laufend: { kennung: string; befehlId: string } | null
  setzeBestand: (
    eintraege: ZusatzmodulEintrag[],
    texte: Record<string, Record<string, string>>,
  ) => void
  setzeLaufend: (laufend: { kennung: string; befehlId: string } | null) => void
}

export const useZusatzmodulStore = create<ZusatzmodulState>((set) => ({
  eintraege: [],
  texte: {},
  laufend: null,
  setzeBestand: (eintraege, texte) => set({ eintraege, texte }),
  setzeLaufend: (laufend) => set({ laufend }),
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
