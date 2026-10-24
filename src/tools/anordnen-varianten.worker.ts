import type { AnordnenKontext, AnordnenVorschlag } from './anordnen-varianten'
import { anzahlKandidatenHoechstens, berechneVorschlaege } from './anordnen-varianten'

export interface AnordnenAuftrag {
  kennung: number
  kontext: AnordnenKontext
}

export type AnordnenAntwort =
  | { kennung: number; art: 'vorschlag'; vorschlag: AnordnenVorschlag; gesamt: number }
  | { kennung: number; art: 'fertig' }
  | { kennung: number; art: 'fehler'; meldung: string }

self.onmessage = (nachricht: MessageEvent<AnordnenAuftrag>) => {
  const { kennung, kontext } = nachricht.data
  try {
    const gesamt = anzahlKandidatenHoechstens(kontext)
    for (const vorschlag of berechneVorschlaege(kontext)) {
      const antwort: AnordnenAntwort = { kennung, art: 'vorschlag', vorschlag, gesamt }
      self.postMessage(antwort)
    }
    self.postMessage({ kennung, art: 'fertig' } satisfies AnordnenAntwort)
  } catch (fehler) {
    self.postMessage({
      kennung,
      art: 'fehler',
      meldung: fehler instanceof Error ? fehler.message : 'Anordnen fehlgeschlagen.',
    } satisfies AnordnenAntwort)
  }
}
