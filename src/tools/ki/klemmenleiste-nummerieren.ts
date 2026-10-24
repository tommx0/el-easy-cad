import {
  istSchaltplan,
  klemmenleisteNeuNummeriert,
  leisteNeuNummeriert,
  verteilerKennzeichenText,
} from '../../document-model'
import { t } from '../../sprache'
import { erzeugeBestueckungCommand, erzeugeKlemmenleisteNummerierenCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'
import { verteilerImBauplan } from './verteiler-hilfen'

export function klemmenleisteNummerieren(
  eingabe: { leiste?: string; verteilerId?: string },
  kontext: KiKontext,
): KiErgebnis {
  const leiste = (eingabe.leiste ?? kontext.vorgaben().klemmenLeiste).trim().replace(/^-/, '')
  if (!leiste) throw new KiFehler(t('kiMeldungen.klemmenleisteNummerieren.keineLeiste'))
  const doc = kontext.doc
  if (istSchaltplan(doc.getZeichnung())) {
    if (eingabe.verteilerId) {
      throw new KiFehler(t('kiMeldungen.klemmenleisteNummerieren.schaltplanOhneVerteiler'))
    }
    for (const blatt of doc.getZeichnung().blaetter) {
      const grund = kontext.nurAnsicht(blatt)
      if (grund) {
        throw new KiFehler(t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
      }
    }
    const anzahl = klemmenleisteNeuNummeriert(doc.getZeichnung(), leiste).length
    if (anzahl === 0)
      throw new KiFehler(t('kiMeldungen.klemmenleisteNummerieren.lueckenlos', { leiste }))
    const text = t('kiMeldungen.klemmenleisteNummerieren.nummeriert', { leiste })
    fuehreAenderungAus(kontext, text, [() => erzeugeKlemmenleisteNummerierenCommand(doc, leiste)])
    const label = kiLabel(text)
    kontext.meldeAenderung(label)
    return { daten: { leiste, klemmenGeaendert: anzahl, rueckgaengig: label } }
  }
  if (!eingabe.verteilerId) {
    throw new KiFehler(t('kiMeldungen.klemmenleisteNummerieren.bauplanMitVerteiler'))
  }
  const { blatt, verteiler, kennzeichen } = verteilerImBauplan(kontext, eingabe.verteilerId)
  const r = leisteNeuNummeriert(verteiler.verteiler.bestueckung, leiste)
  if (r.umbenannt.size === 0) {
    throw new KiFehler(
      t('kiMeldungen.klemmenleisteNummerieren.lueckenlosIn', {
        leiste,
        verteiler: verteilerKennzeichenText(kennzeichen),
      }),
    )
  }
  const text = t('kiMeldungen.klemmenleisteNummerieren.nummeriertIn', {
    leiste,
    verteiler: verteilerKennzeichenText(kennzeichen),
  })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () => erzeugeBestueckungCommand(doc, blatt.id, verteiler.id, label, r.liste, r.umbenannt),
  ])
  kontext.meldeAenderung(label)
  return {
    daten: {
      leiste,
      umbenannt: Object.fromEntries(r.umbenannt),
      rueckgaengig: label,
    },
  }
}
