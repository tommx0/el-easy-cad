import type { AppSettings } from '../persistence'

export type BemassungVariante = AppSettings['bemassungVariante']

export const BEMASSUNG_VARIANTEN: readonly BemassungVariante[] = [
  'bemassung',
  'kettenbemassung',
  'parallelbemassung',
]

export function istBemassungVariante(id: string): id is BemassungVariante {
  return (BEMASSUNG_VARIANTEN as readonly string[]).includes(id)
}
