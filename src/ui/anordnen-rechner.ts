import type { AnordnenKontext, AnordnenVorschlag } from '../tools'
import { t } from '../sprache'
import { anzahlKandidatenHoechstens, berechneVorschlaege } from '../tools'
import type { AnordnenAntwort, AnordnenAuftrag } from '../tools/anordnen-varianten.worker'

export interface AnordnenRueckmeldung {
  vorschlag: (vorschlag: AnordnenVorschlag, gesamt: number) => void
  fertig: () => void
  fehler: (meldung: string) => void
}

let naechsteKennung = 1

export function starteAnordnenRechnung(
  kontext: AnordnenKontext,
  rueckmeldung: AnordnenRueckmeldung,
): () => void {
  const kennung = naechsteKennung++
  if (typeof Worker === 'undefined') return rechneOhneWorker(kontext, rueckmeldung)

  const worker = new Worker(new URL('../tools/anordnen-varianten.worker.ts', import.meta.url), {
    type: 'module',
  })
  let beendet = false
  const beende = () => {
    beendet = true
    worker.terminate()
  }
  worker.onmessage = (nachricht: MessageEvent<AnordnenAntwort>) => {
    const antwort = nachricht.data
    if (beendet || antwort.kennung !== kennung) return
    if (antwort.art === 'vorschlag') rueckmeldung.vorschlag(antwort.vorschlag, antwort.gesamt)
    else if (antwort.art === 'fertig') {
      beende()
      rueckmeldung.fertig()
    } else {
      beende()
      rueckmeldung.fehler(antwort.meldung)
    }
  }
  worker.onerror = (ereignis) => {
    if (beendet) return
    beende()
    rueckmeldung.fehler(ereignis.message || t('aktionen.anordnen.rechnerFehler'))
  }
  worker.postMessage({ kennung, kontext } satisfies AnordnenAuftrag)
  return beende
}

function rechneOhneWorker(kontext: AnordnenKontext, rueckmeldung: AnordnenRueckmeldung) {
  const gesamt = anzahlKandidatenHoechstens(kontext)
  const vorschlaege = berechneVorschlaege(kontext)
  let abgebrochen = false
  const schritt = () => {
    if (abgebrochen) return
    try {
      const naechster = vorschlaege.next()
      if (naechster.done) {
        rueckmeldung.fertig()
        return
      }
      rueckmeldung.vorschlag(naechster.value, gesamt)
      setTimeout(schritt, 0)
    } catch (fehler) {
      rueckmeldung.fehler(
        fehler instanceof Error ? fehler.message : t('aktionen.anordnen.rechnerFehler'),
      )
    }
  }
  setTimeout(schritt, 0)
  return () => {
    abgebrochen = true
  }
}
