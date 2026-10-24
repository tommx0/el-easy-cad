import {
  erzeugeBlatt,
  planUebersetzer,
  uebernimmEbenen,
  zeichnungsEbenen,
} from '../../document-model'
import { t } from '../../sprache'
import { SetBlaetterCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'

export function blattAnlegen(
  eingabe: { name: string; nachBlattId?: string },
  kontext: KiKontext,
): KiErgebnis {
  const zeichnung = kontext.doc.getZeichnung()
  const name = eingabe.name.trim()
  if (!name) throw new KiFehler(t('kiMeldungen.blattAnlegen.nameLeer'))
  let index = zeichnung.blaetter.length
  if (eingabe.nachBlattId !== undefined) {
    const vorher = zeichnung.blaetter.findIndex((b) => b.id === eingabe.nachBlattId)
    if (vorher < 0) {
      throw new KiFehler(
        t('kiMeldungen.gemeinsam.blattUnbekannt', { blattId: eingabe.nachBlattId }),
      )
    }
    index = vorher + 1
  }
  const neu = erzeugeBlatt(name, zeichnung.zeichnungsart, planUebersetzer(zeichnung))
  const text = t('kiMeldungen.blattAnlegen.angelegt', { name })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () => {
      const z = kontext.doc.getZeichnung()
      const blatt = uebernimmEbenen(neu, zeichnungsEbenen(z.blaetter))
      const blaetter = [...z.blaetter]
      blaetter.splice(Math.min(index, blaetter.length), 0, blatt)
      return new SetBlaetterCommand(
        kontext.doc,
        { blaetter: z.blaetter, aktivesBlattId: z.aktivesBlattId },
        { blaetter, aktivesBlattId: z.aktivesBlattId },
        label,
      )
    },
  ])
  kontext.meldeAenderung(label)
  return {
    daten: {
      blattId: neu.id,
      name,
      position: index + 1,
      hinweis: neu.zeichenflaeche ? undefined : t('kiMeldungen.blattAnlegen.zeichenflaecheVonHand'),
      rueckgaengig: label,
    },
  }
}
