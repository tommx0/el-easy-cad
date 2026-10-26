import { t, type Schluessel } from '../sprache'

export function werkzeugName(id: string): string {
  const zusatz = ZUSATZMODUL_WERKZEUGNAMEN.get(id)
  if (zusatz) return zusatz
  const schluessel = `werkzeugnamen.${id}` as Schluessel
  const name = t(schluessel)
  return name === schluessel ? id : name
}

const ZUSATZMODUL_WERKZEUGNAMEN = new Map<string, string>()

export function setzeZusatzmodulWerkzeugName(id: string, name: string | null): void {
  if (name === null) ZUSATZMODUL_WERKZEUGNAMEN.delete(id)
  else ZUSATZMODUL_WERKZEUGNAMEN.set(id, name)
}
