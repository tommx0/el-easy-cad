import type { Blatt, KomponentenObjekt, Zeichnung } from '../../document-model'
import { istSchaltplan, istVerteiler } from '../../document-model'
import { t } from '../../sprache'
import type { KiKontext } from './kontext'
import { findeObjekt, KiFehler } from './kontext'

export type VerteilerObjekt = KomponentenObjekt & {
  verteiler: NonNullable<KomponentenObjekt['verteiler']>
}

export function verteilerImBauplan(
  kontext: KiKontext,
  verteilerId: string,
): { blatt: Blatt; verteiler: VerteilerObjekt; kennzeichen: string; plan: Zeichnung | null } {
  const zeichnung = kontext.doc.getZeichnung()
  if (istSchaltplan(zeichnung)) {
    throw new KiFehler(t('kiMeldungen.verteilerHilfen.imBauplan'))
  }
  const fund = findeObjekt(zeichnung, verteilerId)
  if (!fund || !istVerteiler(fund.objekt)) {
    throw new KiFehler(t('kiMeldungen.verteilerHilfen.keinVerteiler', { id: verteilerId }))
  }
  const grund = kontext.nurAnsicht(fund.blatt)
  if (grund) {
    throw new KiFehler(
      t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: fund.blatt.name, grund }),
    )
  }
  const kennzeichen = fund.objekt.verteiler.kennzeichen
  const plan =
    kontext
      .verknuepfteZeichnungen()
      .verteilerplaene.find((p) => !!kennzeichen && p.verteilerKennzeichen === kennzeichen) ?? null
  return { blatt: fund.blatt, verteiler: fund.objekt, kennzeichen, plan }
}
