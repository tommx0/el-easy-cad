import { exportiereBibliothek, oeffneBibliothekPaket, waehleBibliothekPaket } from '../persistence'
import { useUiStore } from './store/ui-store'
import { t } from '../sprache'

const melde = (fehler: unknown, ersatz: string) =>
  useUiStore.getState().zeigeToast(fehler instanceof Error ? fehler.message : ersatz)

export async function waehleUndOeffneBibliothek(): Promise<void> {
  const datei = await waehleBibliothekPaket()
  if (!datei) return
  try {
    useUiStore.getState().setBibliothekImportDialog(await oeffneBibliothekPaket(datei))
  } catch (fehler) {
    melde(fehler, t('katalogdialoge.bibliothekImport.nichtOeffnen'))
  }
}

export function bibliothekHerunterladen(): void {
  useUiStore.getState().zeigeToast(t('katalogdialoge.bibliothekImport.wirdZusammengestellt'))
  void exportiereBibliothek().catch((fehler) =>
    melde(fehler, t('katalogdialoge.gemeinsam.exportFehlgeschlagen')),
  )
}
