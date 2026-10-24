import {
  alleVerteiler,
  baueVerteilerBaum,
  istSchaltplan,
  typText,
  verteilerQuellen,
} from '../../document-model'
import { t } from '../../sprache'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'

export function verteilerbaumLesen(
  eingabe: { verteiler?: string },
  kontext: KiKontext,
): KiErgebnis {
  const zeichnung = kontext.doc.getZeichnung()
  const { bauplaene, verteilerplaene } = kontext.verknuepfteZeichnungen()
  const gewuenscht = eingabe.verteiler?.trim().replace(/^\+/, '') || null

  if (!gewuenscht && !istSchaltplan(zeichnung)) {
    return {
      daten: {
        verteiler: alleVerteiler(zeichnung).map((v) => ({
          kennzeichen: v.verteiler.verteiler?.kennzeichen ?? '',
          blattId: v.blattId,
          blatt: v.blattName,
          objektId: v.verteiler.id,
          verteilerplan: verteilerplaene.some(
            (p) => p.verteilerKennzeichen === v.verteiler.verteiler?.kennzeichen,
          ),
        })),
      },
    }
  }

  const quellen = verteilerQuellen(zeichnung, gewuenscht, bauplaene, verteilerplaene)
  if (!quellen.verteiler) {
    throw new KiFehler(
      quellen.kennzeichen
        ? t('kiMeldungen.verteilerbaumLesen.verteilerFehlt', { kennzeichen: quellen.kennzeichen })
        : t('kiMeldungen.verteilerbaumLesen.keinVerteiler'),
    )
  }
  const baum = baueVerteilerBaum(quellen.verteiler, kontext.katalogKomponenten(), quellen.plan)
  return {
    daten: {
      verteiler: quellen.kennzeichen,
      objektId: quellen.verteiler.id,
      mitVerteilerplan: quellen.plan !== null,
      knoten: baum.knoten.map((k) => ({
        schluessel: k.schluessel,
        tiefe: k.tiefe,
        rolle: k.rolle,
        ...(k.eltern ? { eltern: k.eltern.schluessel } : {}),
        ...(typText(k.geraet) ? { typ: typText(k.geraet) } : {}),
        ...(k.eintrag.bezeichnung || k.geraet.bezeichnung
          ? { bezeichnung: k.eintrag.bezeichnung || k.geraet.bezeichnung }
          : {}),
        ...((k.eintrag.phase ?? k.geraet.phase)
          ? { phase: k.eintrag.phase ?? k.geraet.phase }
          : {}),
      })),
      ...(baum.nichtEingeordnet.length > 0
        ? { nichtEingeordnet: baum.nichtEingeordnet.map((b) => b.kennzeichen) }
        : {}),
    },
  }
}
