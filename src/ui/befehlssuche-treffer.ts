import { t, type Uebersetzer } from '../sprache'
import { befehlNachId, gruppenName } from './befehle/katalog'
import { MENUEORT } from './menue-gliederung'
import { sucheTrifft } from './seitenleiste-suche'

export interface SuchKandidat {
  id: string
  name: string
  ort: string
  kuerzel: string | null
}

export const MAX_TREFFER = 12

export function menueOrt(id: string, uebersetze: Uebersetzer = t): string {
  const ort = MENUEORT.get(id)
  if (ort) return `${uebersetze(ort.menue.titel)} › ${uebersetze(ort.spalte.titel)}`
  const befehl = befehlNachId(id)
  return befehl ? gruppenName(befehl.gruppe, uebersetze) : ''
}

export function sucheBefehle(
  suche: string,
  kandidaten: readonly SuchKandidat[],
  max = MAX_TREFFER,
): SuchKandidat[] {
  const erstes = suche.trim().split(/\s+/)[0]?.toLocaleLowerCase() ?? ''
  if (!erstes) return []
  const stufe = (k: SuchKandidat) => {
    const name = k.name.toLocaleLowerCase()
    if (name.startsWith(erstes)) return 0
    if (name.split(/[\s/-]+/).some((wort) => wort.startsWith(erstes))) return 1
    return 2
  }
  return kandidaten
    .filter((k) => sucheTrifft(suche, [k.name, k.ort, k.kuerzel ?? undefined]))
    .map((k, i) => ({ k, i, s: stufe(k) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .slice(0, max)
    .map(({ k }) => k)
}
