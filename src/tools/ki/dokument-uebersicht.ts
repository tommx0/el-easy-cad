import type { Blatt, ZeichenflaecheUeberstand } from '../../document-model'
import {
  ausrichtungsStand,
  nullpunktVon,
  zeichenflaecheBoundingBox,
  zeichenflaecheUeberstand,
  zeichnungsartName,
} from '../../document-model'
import type { KiErgebnis, KiKontext } from './kontext'
import { runde, sichtbarFuerKi, zuBlatt } from './kontext'

export function ueberstandGerundet(
  ueberstand: ZeichenflaecheUeberstand | null,
): ZeichenflaecheUeberstand | undefined {
  if (!ueberstand) return undefined
  return Object.fromEntries(
    Object.entries(ueberstand).map(([seite, wert]) => [seite, runde(wert)]),
  ) as ZeichenflaecheUeberstand
}

export function zeichenflaecheFuerKi(blatt: Blatt) {
  if (!blatt.zeichenflaeche) return undefined
  const rahmen = zeichenflaecheBoundingBox(blatt.zeichenflaeche)
  const ueberstandM = ueberstandGerundet(zeichenflaecheUeberstand(blatt))
  return {
    rahmen: { min: zuBlatt(rahmen.min, blatt), max: zuBlatt(rahmen.max, blatt) },
    ...(ueberstandM ? { ueberstandM } : {}),
  }
}

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
          ...(blatt.nullpunktRichtung !== undefined
            ? { nullpunktRichtungGrad: runde((blatt.nullpunktRichtung * 180) / Math.PI, 2) }
            : {}),
          ausrichtung: ausrichtungsStand(blatt),
          ...(blatt.zeichenflaeche ? { zeichenflaeche: zeichenflaecheFuerKi(blatt) } : {}),
          hintergrund: blatt.hintergrund ? blatt.hintergrund.typ : null,
          objekte: anzahl,
        }
      }),
    },
  }
}
