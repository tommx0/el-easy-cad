import type { Blatt } from '../document-model'
import { istNurAnsicht } from '../document-model'
import { useUiStore } from './store/ui-store'
import { freigeschalteteModule } from './lizenz-module'
import { t } from '../sprache'

export function nurAnsichtMeldung(): string {
  return t('aktionen.nurAnsicht')
}

export function meldeNurAnsicht(blatt: Blatt | undefined): boolean {
  if (!blatt || !istNurAnsicht(blatt, freigeschalteteModule())) return false
  useUiStore.getState().zeigeToast(nurAnsichtMeldung())
  return true
}
