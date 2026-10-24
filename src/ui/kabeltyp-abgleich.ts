import {
  abgeglicheneKabeltypen,
  unbekannteKabeltypen,
  type DocumentStore,
  type Kabeltyp,
} from '../document-model'
import { erzeugeZeichnungAendernCommand, type CommandStack } from '../tools'
import { useKabeltypStore } from './store/kabeltyp-store'
import { t } from '../sprache'

export function gleicheKabeltypenAb(doc: DocumentStore): void {
  const global = useKabeltypStore.getState().typen
  const zeichnung = doc.getZeichnung()
  const abgeglichen = abgeglicheneKabeltypen(zeichnung, global)
  if (abgeglichen === zeichnung.kabeltypen) return
  doc.updateZeichnung({ kabeltypen: abgeglichen })
}

export function setzeStandardKabeltyp(
  doc: DocumentStore,
  commands: CommandStack,
  wahl: { kabeltypId?: string },
): void {
  commands.execute(
    erzeugeZeichnungAendernCommand(doc, t('katalogdialoge.kabeltypen.standardAendern'), {
      standardKabeltypId: wahl.kabeltypId,
    }),
  )
  gleicheKabeltypenAb(doc)
}

export function nichtImBestand(doc: DocumentStore): Kabeltyp[] {
  return unbekannteKabeltypen(doc.getZeichnung(), useKabeltypStore.getState().typen)
}
