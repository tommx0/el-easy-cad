import type { Command } from '../command'
import { CompositeCommand } from '../command'
import type { DocumentStore } from '../../document-model'
import { klemmenleisteNeuNummeriert } from '../../document-model'
import { buendleProBlatt } from './objekt-commands'
import { t } from '../../sprache'

export function erzeugeKlemmenleisteNummerierenCommand(
  doc: DocumentStore,
  leiste: string,
): Command | null {
  const neu = klemmenleisteNeuNummeriert(doc.getZeichnung(), leiste)
  if (neu.length === 0) return null
  const label = t('werkzeuge.commands.klemmenleisteNummerieren')
  const ersatz = new Map(neu.map((k) => [k.objekt.id, k.objekt]))
  const blaetter = [...new Set(neu.map((k) => k.blattId))]
  return new CompositeCommand(
    label,
    buendleProBlatt(
      doc,
      blaetter.map((blattId) => ({
        blattId,
        aendern: (objekte) => objekte.map((o) => ersatz.get(o.id) ?? o),
      })),
      label,
    ),
  )
}
