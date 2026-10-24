import type { Command } from '../command'
import type { DocumentStore, KnxAktorDaten } from '../../document-model'
import { wendeKnxAktorAn } from '../../document-model'
import { erzeugeObjektAendernCommand } from './objekt-commands'
import { t } from '../../sprache'

export function erzeugeKnxAktorAendernCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  daten: KnxAktorDaten,
): Command {
  return erzeugeObjektAendernCommand(
    doc,
    blattId,
    t('werkzeuge.commands.knxAktorAendern'),
    (objekte) => wendeKnxAktorAn(objekte, objektId, daten),
  )
}
