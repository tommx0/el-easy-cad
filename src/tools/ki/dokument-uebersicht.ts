import { nullpunktVon, zeichnungsartName } from '../../document-model'
import type { KiErgebnis, KiKontext } from './kontext'
import { runde, sichtbarFuerKi } from './kontext'

export function dokumentUebersicht(_eingabe: unknown, kontext: KiKontext): KiErgebnis {
  const zeichnung = kontext.doc.getZeichnung()
  const dokument = kontext.dokument()
  return {
    daten: {
      ...(dokument ? { projekt: dokument.projekt, kunde: dokument.kunde } : {}),
      dokument: dokument?.dokument ?? zeichnung.name,
      zeichnungsart: zeichnungsartName(zeichnung.zeichnungsart),
      ...(zeichnung.verteilerKennzeichen
        ? { verteilerplanFuer: zeichnung.verteilerKennzeichen }
        : {}),
      aktivesBlattId: zeichnung.aktivesBlattId,
      blaetter: zeichnung.blaetter.map((blatt) => {
        const anzahl: Record<string, number> = {}
        for (const o of sichtbarFuerKi(kontext, blatt.objekte))
          anzahl[o.type] = (anzahl[o.type] ?? 0) + 1
        const nullpunkt = nullpunktVon(blatt)
        return {
          id: blatt.id,
          name: blatt.name,
          ...(blatt.geschoss?.name ? { etage: blatt.geschoss.name } : {}),
          ...(blatt.geschoss?.kote !== undefined ? { koteM: blatt.geschoss.kote } : {}),
          ...(blatt.geschoss?.raumhoehe !== undefined
            ? { raumhoeheM: blatt.geschoss.raumhoehe }
            : {}),
          ...(blatt.zeichenflaeche
            ? {
                massstab: `1:${blatt.zeichenflaeche.massstabNenner}`,
                papier: `${blatt.zeichenflaeche.papierformat} ${blatt.zeichenflaeche.ausrichtung}`,
              }
            : {}),
          nullpunktImModell: { x: runde(nullpunkt.x), y: runde(nullpunkt.y) },
          hintergrund: blatt.hintergrund ? blatt.hintergrund.typ : null,
          objekte: anzahl,
        }
      }),
    },
  }
}
