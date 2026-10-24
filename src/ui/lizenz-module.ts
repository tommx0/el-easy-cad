import type { LizenzModul, ProduktlizenzStatus } from '../persistence'
import { t } from '../sprache'
import { useUiStore } from './store/ui-store'

export function hatModul(status: ProduktlizenzStatus | null, modul: LizenzModul): boolean {
  return status?.module?.includes(modul) ?? false
}

export function useHatModul(modul: LizenzModul): boolean {
  return useUiStore((s) => hatModul(s.produktlizenzStatus, modul))
}

const KEINE: readonly LizenzModul[] = []

function moduleAus(status: ProduktlizenzStatus | null): readonly LizenzModul[] {
  return status?.module ?? KEINE
}

export function freigeschalteteModule(): readonly LizenzModul[] {
  return moduleAus(useUiStore.getState().produktlizenzStatus)
}

export function useFreigeschalteteModule(): readonly LizenzModul[] {
  return useUiStore((s) => moduleAus(s.produktlizenzStatus))
}

export const MODUL_NAME: Readonly<Record<LizenzModul, string>> = {
  get bim() {
    return t('aktionen.lizenzModule.bim')
  },
}
