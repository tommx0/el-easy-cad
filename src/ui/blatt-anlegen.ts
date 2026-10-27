import type { DocumentStore } from '../document-model'
import { erzeugeBlatt, planUebersetzer } from '../document-model'
import type { CommandStack } from '../tools'
import { erzeugeBlattHinzufuegenCommand } from '../tools'
import { zeigeHilfeHinweis } from './hilfe-hinweise'
import { useUiStore } from './store/ui-store'

export function legeNeuesBlattAn(doc: DocumentStore, commands: CommandStack) {
  const zeichnung = doc.getZeichnung()
  const ui = useUiStore.getState()
  const tp = planUebersetzer(zeichnung)
  const blatt = erzeugeBlatt(
    tp('plan.vorgabe.blatt', { nr: String(zeichnung.blaetter.length + 1) }),
    zeichnung.zeichnungsart,
    tp,
  )
  commands.execute(erzeugeBlattHinzufuegenCommand(doc, blatt))
  if (!blatt.zeichenflaeche) {
    ui.setZeichenflaecheEinrichtenOffen(true)
    zeigeHilfeHinweis('blatt')
  }
}

export function fuehreZurZeichenflaecheDesNeuenPlans(doc: DocumentStore) {
  const blatt = doc.getBlatt(doc.getZeichnung().aktivesBlattId)
  if (!blatt || blatt.zeichenflaeche) return
  useUiStore.getState().setZeichenflaecheEinrichtenOffen(true)
  zeigeHilfeHinweis('blatt')
}
