import {
  artVon,
  einzelklemmen,
  einzelklemmenInLeiste,
  erzeugeVerteilerplan,
  planeKnxZuordnung,
  planspracheVon,
  verteilerKennzeichenText,
  verteilerplanNameVorschlag,
} from '../../document-model'
import { t } from '../../sprache'
import { erzeugeBestueckungCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'
import { verteilerImBauplan } from './verteiler-hilfen'

export async function verteilerplanErzeugen(
  eingabe: { verteilerId: string; name?: string },
  kontext: KiKontext,
): Promise<KiErgebnis> {
  const { blatt, verteiler, kennzeichen, plan } = verteilerImBauplan(kontext, eingabe.verteilerId)
  const text = verteilerKennzeichenText(kennzeichen)
  if (!kennzeichen) throw new KiFehler(t('kiMeldungen.verteilerplanErzeugen.keinKennzeichen'))
  if (plan)
    throw new KiFehler(
      t('kiMeldungen.verteilerplanErzeugen.schonVorhanden', { verteiler: text, name: plan.name }),
    )
  if (!kontext.dokument()) throw new KiFehler(t('kiMeldungen.verteilerplanErzeugen.ohneProjekt'))
  const katalog = kontext.katalogKomponenten()
  const vorgaben = kontext.vorgaben()
  const hinweise: string[] = []

  if (einzelklemmen(verteiler.verteiler.bestueckung).length > 0) {
    const umstellung = einzelklemmenInLeiste(
      verteiler.verteiler.bestueckung,
      katalog,
      vorgaben.klemmenLeiste,
    )
    if (umstellung.umbenannt.size > 0) {
      const schritt = t('kiMeldungen.verteilerplanErzeugen.klemmenUeberfuehrt', {
        verteiler: text,
        leiste: vorgaben.klemmenLeiste,
      })
      const label = kiLabel(schritt)
      fuehreAenderungAus(kontext, schritt, [
        () =>
          erzeugeBestueckungCommand(
            kontext.doc,
            blatt.id,
            verteiler.id,
            label,
            umstellung.liste,
            umstellung.umbenannt,
          ),
      ])
      kontext.meldeAenderung(label)
      hinweise.push(t('kiMeldungen.verteilerplanErzeugen.rueckgaengigMoeglich', { schritt }))
    }
  }

  const aktuell = verteilerImBauplan(kontext, eingabe.verteilerId).verteiler
  const knxOffen = planeKnxZuordnung({
    zeichnung: kontext.doc.getZeichnung(),
    verteiler: aktuell,
    katalog,
  }).zuweisungen.length
  if (knxOffen > 0) {
    hinweise.push(t('kiMeldungen.verteilerplanErzeugen.knxOffen', { n: knxOffen }))
  }
  const name =
    eingabe.name?.trim() ||
    verteilerplanNameVorschlag({ art: artVon(aktuell.verteiler) }, kennzeichen)
  const ergebnis = erzeugeVerteilerplan(aktuell, katalog, {
    name,
    maxSicherungenJeBlatt: vorgaben.verteilerplan.maxSicherungenJeBlatt,
    maxKlemmenJeBlatt: vorgaben.verteilerplan.maxKlemmenJeBlatt,
    aufteilung: vorgaben.verteilerplan.aufteilung,
    plansprache: planspracheVon(kontext.doc.getZeichnung()),
  })
  const angelegt = await kontext.legeVerteilerplanAn(ergebnis.zeichnung)
  kontext.meldeAenderung(
    kiLabel(t('kiMeldungen.verteilerplanErzeugen.angelegt', { name: angelegt.name })),
  )
  return {
    daten: {
      dokument: angelegt.name,
      blaetter: ergebnis.zeichnung.blaetter.map((b) => b.name),
      stromkreise: ergebnis.stromkreise,
      rcd: ergebnis.rcd,
      ...(ergebnis.aktoren.length > 0
        ? {
            knxAktoren: ergebnis.aktoren.map((a) => `${a.kennzeichen} ${a.belegt}/${a.baugroesse}`),
          }
        : {}),
      hinweise: [
        ...hinweise,
        ...ergebnis.hinweise,
        t('kiMeldungen.verteilerplanErzeugen.neuesDokument'),
      ],
      pruefhinweis: t('generatoren.pruefhinweis'),
    },
  }
}
