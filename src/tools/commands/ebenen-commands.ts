import type { Command } from '../command'
import type { DocumentStore, Ebene } from '../../document-model'
import { ersatzEbeneFuer, uebernimmEbenen, zeichnungsEbenen } from '../../document-model'
import { SetBlaetterCommand } from './blatt-commands'
import { t } from '../../sprache'

export function erzeugeEbenenAendernCommand(
  doc: DocumentStore,
  label: string,
  ebenen: readonly Ebene[],
): Command {
  const zeichnung = doc.getZeichnung()
  return new SetBlaetterCommand(
    doc,
    { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId },
    {
      blaetter: zeichnung.blaetter.map((blatt) => uebernimmEbenen(blatt, ebenen)),
      aktivesBlattId: zeichnung.aktivesBlattId,
    },
    label,
  )
}

export function erzeugeEbeneLoeschenCommand(doc: DocumentStore, ebeneId: string): Command | null {
  const zeichnung = doc.getZeichnung()
  const ebenen = zeichnungsEbenen(zeichnung.blaetter)
  const ersatz = ersatzEbeneFuer(ebenen, ebeneId)
  if (!ersatz) return null
  const neueEbenen = ebenen.filter((e) => e.id !== ebeneId)
  const blaetter = zeichnung.blaetter.map((blatt) =>
    uebernimmEbenen(
      {
        ...blatt,
        objekte: blatt.objekte.map((o) =>
          o.ebeneId === ebeneId ? { ...o, ebeneId: ersatz.id } : o,
        ),
        aktiveEbeneId: blatt.aktiveEbeneId === ebeneId ? ersatz.id : blatt.aktiveEbeneId,
      },
      neueEbenen,
    ),
  )
  return new SetBlaetterCommand(
    doc,
    { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId },
    { blaetter, aktivesBlattId: zeichnung.aktivesBlattId },
    t('werkzeuge.commands.ebeneLoeschen'),
  )
}

export function objekteAufEbene(doc: DocumentStore, ebeneId: string): number {
  return doc
    .getZeichnung()
    .blaetter.reduce((summe, b) => summe + b.objekte.filter((o) => o.ebeneId === ebeneId).length, 0)
}
