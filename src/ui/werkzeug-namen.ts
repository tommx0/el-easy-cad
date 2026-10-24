import { t, type Schluessel } from '../sprache'

export function werkzeugName(id: string): string {
  const schluessel = `werkzeugnamen.${id}` as Schluessel
  const name = t(schluessel)
  return name === schluessel ? id : name
}
