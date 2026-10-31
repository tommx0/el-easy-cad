import { istSchaltplan } from '../../document-model'
import { t } from '../../sprache'
import { erzeugeAutomatischAnordnenCommand, zaehleAutomatischAnordnen } from '../anordnen-varianten'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, leitungsverlegungAus } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel, ordneObjekteNachBlatt } from './schreiben'

export function automatischAnordnen(
  eingabe: { objektIds: string[] },
  kontext: KiKontext,
): KiErgebnis {
  const { jeBlatt, gesperrt } = ordneObjekteNachBlatt(kontext, eingabe.objektIds)
  if (jeBlatt.size > 1) throw new KiFehler(t('kiMeldungen.automatischAnordnen.einBlatt'))
  const [{ blatt, objekte }] = [...jeBlatt.values()]
  const ids = new Set(objekte.map((o) => o.id))
  const umfang = zaehleAutomatischAnordnen(blatt.objekte, ids, blatt.ebenen)
  if (umfang.komponenten < 2 && umfang.verbindungen === 0) {
    throw new KiFehler(t('kiMeldungen.automatischAnordnen.zuWenig'))
  }
  const settings = kontext.routingSettings()
  const vorgabe = kontext.vorgaben().anordnenEinstellungen
  const einstellungen = leitungsverlegungAus(kontext)
    ? { ...vorgabe, trunksBilden: false }
    : vorgabe
  const text =
    umfang.komponenten >= 2
      ? t('kiMeldungen.automatischAnordnen.angeordnet', {
          n: umfang.komponenten,
          blaetter: blattText([blatt]),
        })
      : t('kiMeldungen.automatischAnordnen.neuVerlegt', {
          n: umfang.verbindungen,
          blaetter: blattText([blatt]),
        })
  let kennzahlen = { fehlgeschlagen: 0, ueberlappungen: 0, passtNicht: false }
  fuehreAenderungAus(kontext, text, [
    () => {
      const r = erzeugeAutomatischAnordnenCommand(
        kontext.doc,
        blatt.id,
        ids,
        settings,
        einstellungen,
      )
      kennzahlen = r
      return r.command
    },
  ])
  const label = kiLabel(text)
  kontext.meldeAenderung(label)
  const hinweise: string[] = []
  if (kennzahlen.fehlgeschlagen > 0) {
    hinweise.push(t('kiMeldungen.automatischAnordnen.nichtFrei', { n: kennzahlen.fehlgeschlagen }))
  }
  if (kennzahlen.ueberlappungen > 0) {
    hinweise.push(
      t('kiMeldungen.automatischAnordnen.ueberdeckungen', { n: kennzahlen.ueberlappungen }),
    )
  }
  if (kennzahlen.passtNicht) hinweise.push(t('kiMeldungen.automatischAnordnen.passtNicht'))
  if (!istSchaltplan(kontext.doc.getZeichnung()) && umfang.komponenten >= 2) {
    hinweise.push(t('kiMeldungen.automatischAnordnen.einbauortVerlassen'))
  }
  return {
    daten: {
      komponenten: umfang.komponenten,
      verbindungen: umfang.verbindungen,
      ...(gesperrt.length > 0 ? { uebersprungen: gesperrt } : {}),
      ...(hinweise.length > 0 ? { hinweise } : {}),
      rueckgaengig: label,
    },
  }
}
