import { t } from '../../sprache'
import type { KiBereich, KiErgebnis, KiKontext } from './kontext'
import { bereichImModell, waehleBlatt } from './kontext'

export const BILDSCHIRMFOTO_STANDARD_KANTE_PX = 1568

export async function bildschirmfoto(
  eingabe: { blattId?: string; bereich?: KiBereich; maxKantePx?: number },
  kontext: KiKontext,
): Promise<KiErgebnis> {
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const bereich = eingabe.bereich ? bereichImModell(eingabe.bereich, blatt) : null
  const daten = await kontext.bildschirmfoto(
    blatt,
    bereich,
    eingabe.maxKantePx ?? BILDSCHIRMFOTO_STANDARD_KANTE_PX,
  )
  const b = eingabe.bereich
  const text = b
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
