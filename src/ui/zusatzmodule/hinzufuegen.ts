import { pruefeZusatzmodulPaket, waehleZusatzmodulPaket } from '../../persistence'
import { useUiStore } from '../store/ui-store'

export async function waehleZusatzmodulZumHinzufuegen(): Promise<void> {
  const datei = await waehleZusatzmodulPaket()
  if (datei) await bieteZusatzmodulAn(datei)
}

export async function bieteZusatzmodulAn(datei: File): Promise<void> {
  const ui = useUiStore.getState()
  try {
    ui.setModulHinzufuegen({ datei, vorschau: await pruefeZusatzmodulPaket(datei) })
  } catch (fehler) {
    ui.zeigeToast(fehler instanceof Error ? fehler.message : String(fehler))
  }
}
