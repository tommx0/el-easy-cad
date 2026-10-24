import {
  KNX_RESERVE_STANDARD,
  planeKnxZuordnung,
  verteilerKennzeichenText,
  wendeKnxZuordnungAn,
} from '../../document-model'
import { t } from '../../sprache'
import { erzeugeBestueckungCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'
import { verteilerImBauplan } from './verteiler-hilfen'

export function knxAktorenZuordnen(
  eingabe: { verteilerId: string; reserveProzent?: number; freigeben?: boolean },
  kontext: KiKontext,
): KiErgebnis {
  const { blatt, verteiler, kennzeichen, plan } = verteilerImBauplan(kontext, eingabe.verteilerId)
  const reserve = Math.max(
    0,
    Math.min(
      200,
      Math.round(
        eingabe.reserveProzent ??
          kontext.vorgaben().verteilerplan.knxReserveProzent ??
          KNX_RESERVE_STANDARD,
      ),
    ),
  )
  const ergebnis = planeKnxZuordnung(
    {
      zeichnung: kontext.doc.getZeichnung(),
      verteiler,
      katalog: kontext.katalogKomponenten(),
      plan,
    },
    { reserveProzent: reserve },
  )
  const frei = new Set(
    eingabe.freigeben === false ? [] : ergebnis.freigeben.map((f) => f.eintragId),
  )
  const aenderungen =
    ergebnis.zuweisungen.length +
    frei.size +
    ergebnis.neueGeraete.length +
    ergebnis.umbenennen.length
  if (aenderungen === 0) {
    throw new KiFehler(
      ergebnis.zeilen.length === 0
        ? t('kiMeldungen.knxAktorenZuordnen.keineKlemme')
        : t('kiMeldungen.knxAktorenZuordnen.alleZugeordnet'),
    )
  }
  const neu = wendeKnxZuordnungAn(verteiler.verteiler.bestueckung, ergebnis, frei)
  const text = t('kiMeldungen.knxAktorenZuordnen.zugeordnet', {
    verteiler: verteilerKennzeichenText(kennzeichen),
  })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () => erzeugeBestueckungCommand(kontext.doc, blatt.id, verteiler.id, label, neu),
  ])
  kontext.meldeAenderung(label)
  return {
    daten: {
      zuweisungen: ergebnis.zuweisungen.length,
      neueAktoren: ergebnis.neueGeraete.map((g) => g.kennzeichen),
      freigegeben: frei.size,
      ...(ergebnis.hinweise.length > 0 ? { hinweise: ergebnis.hinweise } : {}),
      rueckgaengig: label,
    },
  }
}
