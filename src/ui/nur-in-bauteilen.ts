import type { DocumentStore } from '../document-model'
import { t } from '../sprache'
import type { CommandStack } from '../tools/command'
import {
  erzeugeLeitungenNeuVerlegenCommand,
  erzeugeLeitungNurInBauteilenCommand,
} from '../tools/commands'
import { useSettingsStore } from './store/settings-store'
import { useUiStore } from './store/ui-store'

export const NUR_IN_BAUTEILEN_WERTE = [
  { wert: undefined, schluessel: 'wie-blatt' },
  { wert: true, schluessel: 'an' },
  { wert: false, schluessel: 'aus' },
] as const

export function nurInBauteilenText(wert: boolean | undefined, blattAn: boolean): string {
  if (wert === undefined) {
    return t(blattAn ? 'aktionen.nurInBauteilen.wieBlattAn' : 'aktionen.nurInBauteilen.wieBlattAus')
  }
  return t(wert ? 'aktionen.nurInBauteilen.an' : 'aktionen.nurInBauteilen.aus')
}

export function meldeNeuVerlegung(fehlgeschlagen: number): void {
  if (fehlgeschlagen === 0) return
  useUiStore
    .getState()
    .zeigeToast(t('aktionen.nurInBauteilen.fehlgeschlagen', { n: fehlgeschlagen }))
}

export function setzeNurInBauteilen(
  doc: DocumentStore,
  commands: CommandStack,
  blattId: string,
  leitungIds: readonly string[],
  wert: boolean | undefined,
): void {
  const ergebnis = erzeugeLeitungNurInBauteilenCommand(
    doc,
    blattId,
    leitungIds,
    wert,
    useSettingsStore.getState().routing,
  )
  if (!ergebnis) return
  commands.execute(ergebnis.command)
  meldeNeuVerlegung(ergebnis.fehlgeschlagen)
}

export function verlegeLeitungenNeuBefehl(
  doc: DocumentStore,
  commands: CommandStack,
  blattId: string,
  auswahlIds: readonly string[],
): void {
  const blatt = doc.getBlatt(blattId)
  const gewaehlt = auswahlIds.filter((id) =>
    blatt?.objekte.some((o) => o.id === id && o.type === 'leitung'),
  )
  const ergebnis = erzeugeLeitungenNeuVerlegenCommand(
    doc,
    blattId,
    gewaehlt.length > 0 ? gewaehlt : null,
    useSettingsStore.getState().routing,
  )
  if (!ergebnis) {
    useUiStore.getState().zeigeToast(t('aktionen.nurInBauteilen.keineLeitung'))
    return
  }
  if (ergebnis.neuVerlegt > 0) commands.execute(ergebnis.command)
  if (ergebnis.fehlgeschlagen > 0) meldeNeuVerlegung(ergebnis.fehlgeschlagen)
  else
    useUiStore
      .getState()
      .zeigeToast(t('aktionen.nurInBauteilen.neuVerlegt', { n: ergebnis.neuVerlegt }))
}
