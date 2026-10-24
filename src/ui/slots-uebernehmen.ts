import type { AutoGruppe, DocumentStore, Slot, SlotQuelle } from '../document-model'
import { ermittleAutoGruppe, wendeAutoGruppeAn } from '../document-model'
import type { CommandStack } from '../tools'
import { erzeugeGruppenErgebnisCommand, erzeugeSlotsAendernCommand } from '../tools'
import { useKatalogStore } from './store/katalog-store'
import { useUiStore } from './store/ui-store'
import { t } from '../sprache'

export function autoGruppenHinweise(fall: AutoGruppe): string[] {
  const hinweise: string[] = []
  if (fall.umgelenkt > 0)
    hinweise.push(t('katalogdialoge.slots.weitereSlots', { n: fall.umgelenkt }))
  if (fall.slotsVerloren.length > 0)
    hinweise.push(
      t('katalogdialoge.slots.slotsEntfallen', { namen: fall.slotsVerloren.join(', ') }),
    )
  return hinweise
}

export function uebernehmeSlots(
  doc: DocumentStore,
  commands: CommandStack,
  quelle: SlotQuelle,
  slots: Slot[],
): void {
  const zeichnung = doc.getZeichnung()
  const fall = ermittleAutoGruppe(zeichnung, useKatalogStore.getState().komponenten, quelle, slots)
  if (!fall) {
    commands.execute(erzeugeSlotsAendernCommand(doc, quelle.blattId, quelle.objektId, slots))
    return
  }
  if (fall.art === 'beitreten') {
    commands.execute(
      erzeugeGruppenErgebnisCommand(
        doc,
        wendeAutoGruppeAn(zeichnung, quelle, slots, fall),
        t('katalogdialoge.slots.slotsAendern'),
      ),
    )
    const namen = fall.mitgliederNamen.join(', ')
    useUiStore.getState().zeigeToast(
      t('katalogdialoge.slots.tretenBei', {
        namen,
        gruppe: fall.gruppe?.name ?? '',
        n: fall.mitglieder.length,
      }),
    )
    return
  }
  useUiStore.getState().oeffneGruppeBildenDialog({
    titel: t('katalogdialoge.slots.gruppeBildenTitel'),
    text: t('katalogdialoge.slots.gruppeBildenText', {
      slot: fall.slotName,
      quelle: fall.quelleName,
      ziele: fall.mitgliederNamen.join(', '),
    }),
    hinweise: autoGruppenHinweise(fall),
    vorgabe: fall.vorgabe,
    callback: (angaben) => {
      if (!angaben) return
      commands.execute(
        erzeugeGruppenErgebnisCommand(
          doc,
          wendeAutoGruppeAn(doc.getZeichnung(), quelle, slots, fall, angaben),
          t('katalogdialoge.slots.gruppeAusWirkverbindung'),
        ),
      )
    },
  })
}
