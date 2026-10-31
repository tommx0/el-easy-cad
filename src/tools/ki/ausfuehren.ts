import type { KiAntwort, KiAufruf } from '../../document-model'
import { KI_WERKZEUG_NACH_NAME } from '../../document-model'
import { t } from '../../sprache'
import { leitungsverlegungAus } from './kontext'
import { automatischAnordnen } from './automatisch-anordnen'
import { bestueckungAendernKi } from './bestueckung-aendern'
import { bestueckungVorschlagen } from './bestueckung-vorschlagen'
import { bildschirmfoto } from './bildschirmfoto'
import { blattAnlegen } from './blatt-anlegen'
import { blattLesen } from './blatt-lesen'
import { dokumentUebersicht } from './dokument-uebersicht'
import { eigenschaftenSetzen } from './eigenschaften-setzen'
import { katalogSuchen } from './katalog-suchen'
import { klemmenleisteNummerieren } from './klemmenleiste-nummerieren'
import { knxAktorenZuordnen } from './knx-aktoren-zuordnen'
import { komponenteAustauschen } from './komponente-austauschen'
import { komponenteSetzen } from './komponente-setzen'
import { leitungenNeuVerlegen } from './leitungen-neu-verlegen'
import { leitungVerlegen } from './leitung-verlegen'
import { oeffnungSetzen } from './oeffnung-setzen'
import { raumAnlegen } from './raum-anlegen'
import { trunkAnlegen } from './trunk-anlegen'
import { wandZeichnen } from './wand-zeichnen'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { listeLesen } from './liste-lesen'
import { objekteDrehen } from './objekte-drehen'
import { objekteLoeschen } from './objekte-loeschen'
import { objekteVerschieben } from './objekte-verschieben'
import { objektLesen } from './objekt-lesen'
import { potentialSetzen } from './potential-setzen'
import { pruefen } from './pruefen'
import { raeumeLesen } from './raeume-lesen'
import { rueckgaengig } from './rueckgaengig'
import { schaltverbindungZiehen } from './schaltverbindung-ziehen'
import { verteilerbaumLesen } from './verteilerbaum-lesen'
import { verteilerplanErzeugen } from './verteilerplan-erzeugen'

type Ausfuehrung = (eingabe: never, kontext: KiKontext) => KiErgebnis | Promise<KiErgebnis>

const AUSFUEHRUNGEN: Record<string, Ausfuehrung> = {
  dokument_uebersicht: dokumentUebersicht,
  blatt_lesen: blattLesen,
  objekt_lesen: objektLesen,
  raeume_lesen: raeumeLesen,
  katalog_suchen: katalogSuchen,
  liste_lesen: listeLesen,
  verteilerbaum_lesen: verteilerbaumLesen,
  pruefen,
  bildschirmfoto,
  eigenschaften_setzen: eigenschaftenSetzen,
  objekte_loeschen: objekteLoeschen,
  objekte_verschieben: objekteVerschieben,
  objekte_drehen: objekteDrehen,
  komponente_austauschen: komponenteAustauschen,
  blatt_anlegen: blattAnlegen,
  komponente_setzen: komponenteSetzen,
  leitung_verlegen: leitungVerlegen,
  leitungen_neu_verlegen: leitungenNeuVerlegen,
  trunk_anlegen: trunkAnlegen,
  wand_zeichnen: wandZeichnen,
  raum_anlegen: raumAnlegen,
  oeffnung_setzen: oeffnungSetzen,
  potential_setzen: potentialSetzen,
  schaltverbindung_ziehen: schaltverbindungZiehen,
  automatisch_anordnen: automatischAnordnen,
  bestueckung_vorschlagen: bestueckungVorschlagen,
  bestueckung_aendern: bestueckungAendernKi,
  knx_aktoren_zuordnen: knxAktorenZuordnen,
  klemmenleiste_nummerieren: klemmenleisteNummerieren,
  verteilerplan_erzeugen: verteilerplanErzeugen,
  rueckgaengig,
}

export const KI_LEITUNGS_WERKZEUGE: ReadonlySet<string> = new Set([
  'leitung_verlegen',
  'leitungen_neu_verlegen',
  'trunk_anlegen',
])

export const KI_AUSGEFUEHRTE_WERKZEUGE: readonly string[] = Object.keys(AUSFUEHRUNGEN)

export async function fuehreKiWerkzeugAus(
  aufruf: KiAufruf,
  kontext: KiKontext,
): Promise<KiAntwort> {
  const definition = KI_WERKZEUG_NACH_NAME.get(aufruf.werkzeug)
  const ausfuehrung = AUSFUEHRUNGEN[aufruf.werkzeug]
  if (!definition || !ausfuehrung) {
    return {
      ok: false,
      fehler: t('kiMeldungen.ausfuehren.werkzeugUnbekannt', { werkzeug: aufruf.werkzeug }),
    }
  }
  const geprueft = definition.eingabe.safeParse(aufruf.eingabe ?? {})
  if (!geprueft.success) {
    return {
      ok: false,
      fehler: t('kiMeldungen.ausfuehren.eingabeUngueltig', { werkzeug: aufruf.werkzeug }),
    }
  }
  const sperrgrund = kontext.sperrgrund()
  if (sperrgrund) return { ok: false, fehler: sperrgrund }
  if (KI_LEITUNGS_WERKZEUGE.has(aufruf.werkzeug) && leitungsverlegungAus(kontext)) {
    return { ok: false, fehler: t('kiMeldungen.ausfuehren.leitungsverlegungAus') }
  }
  const schreibsperre = definition.schreibt ? kontext.schreibsperre() : null
  if (schreibsperre) return { ok: false, fehler: schreibsperre }
  try {
    const ergebnis = await ausfuehrung(geprueft.data as never, kontext)
    if ('inhalt' in ergebnis) return { ok: true, inhalt: ergebnis.inhalt }
    return { ok: true, inhalt: [{ art: 'text', text: JSON.stringify(ergebnis.daten) }] }
  } catch (fehler) {
    if (fehler instanceof KiFehler) return { ok: false, fehler: fehler.message }
    return {
      ok: false,
      fehler: t('kiMeldungen.ausfuehren.internerFehler', {
        fehler: fehler instanceof Error ? fehler.message : String(fehler),
      }),
    }
  }
}
