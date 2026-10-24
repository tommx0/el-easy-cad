import { t } from '../../sprache'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { kiLabel, ohneKiVorspann } from './schreiben'

const MAX_SCHRITTE = 20

export function rueckgaengig(eingabe: { anzahl?: number }, kontext: KiKontext): KiErgebnis {
  const anzahl = Math.min(MAX_SCHRITTE, eingabe.anzahl ?? 1)
  const zurueckgenommen: string[] = []
  const texte: string[] = []
  let angehalten: string | null = null
  for (let i = 0; i < anzahl; i++) {
    const label = kontext.commands.peekUndoLabel()
    if (!label) {
      angehalten = t('kiMeldungen.rueckgaengig.nichtsMehr')
      break
    }
    const text = ohneKiVorspann(label)
    if (text === null) {
      angehalten = t('kiMeldungen.rueckgaengig.vomAnwender', { label })
      break
    }
    kontext.commands.undo()
    zurueckgenommen.push(label)
    texte.push(text)
  }
  if (zurueckgenommen.length === 0) {
    throw new KiFehler(angehalten ?? t('kiMeldungen.rueckgaengig.nichtsZurueckgenommen'))
  }
  kontext.meldeAenderung(
    kiLabel(t('kiMeldungen.rueckgaengig.meldung', { schritte: texte.join('; ') })),
  )
  return { daten: { zurueckgenommen, ...(angehalten ? { angehalten } : {}) } }
}
