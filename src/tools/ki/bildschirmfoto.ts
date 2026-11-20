import { zeichenflaecheBoundingBox } from '../../document-model'
import { t } from '../../sprache'
import type { KiBereich, KiErgebnis, KiKontext } from './kontext'
import { bereichImModell, KiFehler, waehleBlatt } from './kontext'

export const BILDSCHIRMFOTO_STANDARD_KANTE_PX = 1568

export async function bildschirmfoto(
  eingabe: {
    blattId?: string
    bereich?: KiBereich
    maxKantePx?: number
    ausschnitt?: 'zeichenflaeche'
  },
  kontext: KiKontext,
): Promise<KiErgebnis> {
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  if (eingabe.bereich && eingabe.ausschnitt) {
    throw new KiFehler(t('kiMeldungen.bildschirmfoto.bereichUndAusschnitt'))
  }
  const zeichenflaeche = eingabe.ausschnitt === 'zeichenflaeche' ? blatt.zeichenflaeche : null
  if (eingabe.ausschnitt === 'zeichenflaeche' && !zeichenflaeche) {
    throw new KiFehler(
      t('kiMeldungen.bildschirmfoto.ohneZeichenflaeche', { name: blatt.name, id: blatt.id }),
    )
  }
  const bereich = zeichenflaeche
    ? zeichenflaecheBoundingBox(zeichenflaeche)
    : eingabe.bereich
      ? bereichImModell(eingabe.bereich, blatt)
      : null
  const daten = await kontext.bildschirmfoto(
    blatt,
    bereich,
    eingabe.maxKantePx ?? BILDSCHIRMFOTO_STANDARD_KANTE_PX,
  )
  const b = eingabe.bereich
  const text = zeichenflaeche
    ? t('kiMeldungen.bildschirmfoto.zeichenflaeche', {
        name: blatt.name,
        id: blatt.id,
        papier: `${zeichenflaeche.papierformat} ${zeichenflaeche.ausrichtung}`,
        nenner: zeichenflaeche.massstabNenner,
      })
    : b
      ? t('kiMeldungen.bildschirmfoto.ausschnitt', {
          name: blatt.name,
          id: blatt.id,
          xMin: b.xMin,
          xMax: b.xMax,
          yMin: b.yMin,
          yMax: b.yMax,
        })
      : t('kiMeldungen.bildschirmfoto.blatt', { name: blatt.name, id: blatt.id })
  return {
    inhalt: [
      { art: 'bild', daten, mime: 'image/png' },
      { art: 'text', text },
    ],
  }
}
