import { t } from '../../sprache'
import { erzeugeLeitungenNeuVerlegenCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, waehleBlatt } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'

export function leitungenNeuVerlegen(
  eingabe: { blattId?: string; leitungIds?: string[] },
  kontext: KiKontext,
): KiErgebnis {
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const grund = kontext.nurAnsicht(blatt)
  if (grund) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
  }
  const probe = erzeugeLeitungenNeuVerlegenCommand(
    kontext.doc,
    blatt.id,
    eingabe.leitungIds ?? null,
    kontext.routingSettings(),
  )
  if (!probe || probe.neuVerlegt === 0) {
    throw new KiFehler(t('kiMeldungen.leitungenNeuVerlegen.keine'))
  }
  const text = t('kiMeldungen.leitungenNeuVerlegen.neuVerlegt', {
    n: probe.neuVerlegt,
    blatt: blatt.name,
  })
  const label = kiLabel(text)
  let fehlgeschlagen = 0
  fuehreAenderungAus(kontext, text, [
    () => {
      const ergebnis = erzeugeLeitungenNeuVerlegenCommand(
        kontext.doc,
        blatt.id,
        eingabe.leitungIds ?? null,
        kontext.routingSettings(),
      )
      fehlgeschlagen = ergebnis?.fehlgeschlagen ?? 0
      return ergebnis?.command ?? null
    },
  ])
  kontext.meldeAenderung(label)
  return {
    daten: {
      neuVerlegt: probe.neuVerlegt,
      ...(fehlgeschlagen > 0
        ? {
            hinweis: t('kiMeldungen.leitungenNeuVerlegen.ohneWeg', { n: fehlgeschlagen }),
          }
        : {}),
      rueckgaengig: label,
    },
  }
}
