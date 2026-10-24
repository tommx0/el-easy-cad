import type { RaumAuswahl } from '../../document-model'
import {
  artVon,
  KNX_RESERVE_STANDARD,
  netzDerVorgabe,
  netzVon,
  planeVorschlag,
  raeumeZurAuswahl,
  STANDARD_SCHNELLVORGABE,
  verteilerKennzeichenText,
  vorauswahlRaeume,
} from '../../document-model'
import { t } from '../../sprache'
import { erzeugeBestueckungCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'
import { verteilerImBauplan } from './verteiler-hilfen'

export function bestueckungVorschlagen(
  eingabe: {
    verteilerId: string
    raeume?: RaumAuswahl[]
    knx?: boolean
    knxReserveProzent?: number
    verwaisteBehalten?: boolean
  },
  kontext: KiKontext,
): KiErgebnis {
  const { blatt, verteiler, kennzeichen, plan } = verteilerImBauplan(kontext, eingabe.verteilerId)
  const zeichnung = kontext.doc.getZeichnung()
  const katalog = kontext.katalogKomponenten()
  const liste = raeumeZurAuswahl(zeichnung, katalog, verteiler.id)
  const auswahl = eingabe.raeume ?? vorauswahlRaeume(liste, verteiler.verteiler.raeume)
  for (const a of auswahl) {
    const b = liste.find((x) => x.blattId === a.blattId)
    if (!b) throw new KiFehler(t('kiMeldungen.gemeinsam.blattUnbekannt', { blattId: a.blattId }))
    if (a.raumId && !b.raeume.some((r) => r.raumId === a.raumId)) {
      throw new KiFehler(
        t('kiMeldungen.gemeinsam.keinRaumAufBlatt', { id: a.raumId, blatt: b.blattName }),
      )
    }
  }
  if (auswahl.length === 0) throw new KiFehler(t('kiMeldungen.bestueckungVorschlagen.keineRaeume'))
  const vorgabe = {
    ...STANDARD_SCHNELLVORGABE,
    drehstrom: netzVon(verteiler.verteiler) === 'drehstrom',
    art: artVon(verteiler.verteiler),
  }
  const reserve = Math.max(
    0,
    Math.min(
      200,
      Math.round(
        eingabe.knxReserveProzent ??
          kontext.vorgaben().verteilerplan.knxReserveProzent ??
          KNX_RESERVE_STANDARD,
      ),
    ),
  )
  const bestueckung = verteiler.verteiler.bestueckung
  const verwaistEntfernen = eingabe.verwaisteBehalten
    ? new Set<string>()
    : new Set(bestueckung.filter((e) => e.quelle).map((e) => e.id))
  const vorschlag = planeVorschlag(
    { zeichnung, katalog, bestueckung, verteiler, auswahl, vorgabe },
    { verwaistEntfernen, knxReserve: eingabe.knx === false ? null : reserve },
  )
  if (vorschlag.zeilen.length + vorschlag.verwaist.length === 0) {
    throw new KiFehler(t('kiMeldungen.bestueckungVorschlagen.keinStromkreis'))
  }
  const text = t('kiMeldungen.bestueckungVorschlagen.vorgeschlagen', {
    verteiler: verteilerKennzeichenText(kennzeichen),
  })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () =>
      erzeugeBestueckungCommand(
        kontext.doc,
        blatt.id,
        verteiler.id,
        label,
        vorschlag.liste,
        new Map(),
        vorschlag.entfernt,
        { raeume: auswahl, netz: netzDerVorgabe(vorgabe), art: vorgabe.art },
      ),
  ])
  kontext.meldeAenderung(label)
  return {
    daten: {
      stromkreise: vorschlag.zeilen.map((z) => ({
        blatt: z.blattName,
        beschriftung: z.beschriftung,
        polzahl: z.polzahl,
        bauteile: z.bauteile,
        ...(z.knx ? { knx: true } : {}),
        ...(z.vorhanden ? { schonVorhanden: true } : {}),
      })),
      ...(vorschlag.verwaist.length > 0
        ? {
            [eingabe.verwaisteBehalten ? 'verwaistBehalten' : 'verwaistEntfernt']:
              vorschlag.verwaist.map((v) => v.text),
          }
        : {}),
      ...(vorschlag.knx
        ? {
            knxAktoren: vorschlag.knx.neueGeraete.map((g) => g.kennzeichen),
            knxKanaele: vorschlag.knx.zuweisungen.length,
          }
        : {}),
      ...(vorschlag.hinweise.length > 0 || plan
        ? {
            hinweise: [
              ...vorschlag.hinweise,
              ...(plan
                ? [t('kiMeldungen.bestueckungVorschlagen.planNeuErzeugen', { name: plan.name })]
                : []),
            ],
          }
        : {}),
      ...(vorschlag.fehlend.length > 0 ? { fehlendImKatalog: vorschlag.fehlend } : {}),
      rueckgaengig: label,
    },
  }
}
