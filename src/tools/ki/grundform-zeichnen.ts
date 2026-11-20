import {
  grundformZuObjekt,
  loeseEbenenAuf,
  nullpunktVon,
  type Grundform,
} from '../../document-model'
import { t } from '../../sprache'
import { erzeugeEbenenAendernCommand, erzeugeObjektAendernCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, waehleBlatt } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'

export function grundformZeichnen(
  eingabe: { blattId?: string; objekte: Grundform[] },
  kontext: KiKontext,
): KiErgebnis {
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const grund = kontext.nurAnsicht(blatt)
  if (grund) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
  }
  if (eingabe.objekte.length === 0) throw new KiFehler(t('kiMeldungen.grundformZeichnen.leer'))

  const namen = new Set(eingabe.objekte.map((g) => g.ebene).filter((n): n is string => !!n))
  const { ebenen, neu, idFuer } = loeseEbenenAuf(namen, blatt.ebenen)
  const ohneEbene = eingabe.objekte.some((g) => !g.ebene)
  const aktive = blatt.ebenen.find((e) => e.id === blatt.aktiveEbeneId)
  const gesperrt = [
    ...(ohneEbene && aktive?.gesperrt ? [aktive.name] : []),
    ...[...namen].filter((n) => ebenen.find((e) => e.id === idFuer(n))?.gesperrt),
  ]
  if (gesperrt.length > 0) {
    throw new KiFehler(t('kiMeldungen.grundformZeichnen.ebeneGesperrt', { ebene: gesperrt[0] }))
  }

  const bezug = nullpunktVon(blatt)
  const objekte = eingabe.objekte.map((g) =>
    grundformZuObjekt(g, g.ebene ? idFuer(g.ebene) : blatt.aktiveEbeneId, bezug),
  )
  const text = t('kiMeldungen.grundformZeichnen.gezeichnet', {
    n: objekte.length,
    blatt: blatt.name,
  })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () => (neu.length > 0 ? erzeugeEbenenAendernCommand(kontext.doc, label, ebenen) : null),
    () => erzeugeObjektAendernCommand(kontext.doc, blatt.id, label, (alt) => [...alt, ...objekte]),
  ])
  kontext.meldeAenderung(label)
  return {
    daten: {
      ids: objekte.map((o) => o.id),
      neueEbenen: neu.map((e) => e.name),
      rueckgaengig: label,
    },
  }
}
