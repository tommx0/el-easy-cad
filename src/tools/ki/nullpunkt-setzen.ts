import { ausrichtungsStand, nullpunktVon } from '../../document-model'
import { t } from '../../sprache'
import { erzeugeBlattAendernCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, runde, waehleBlatt } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'

function normiere(winkel: number): number {
  let w = winkel % (2 * Math.PI)
  if (w <= -Math.PI) w += 2 * Math.PI
  if (w > Math.PI) w -= 2 * Math.PI
  return w
}

export function nullpunktSetzen(
  eingabe: { blattId?: string; punkt: { x: number; y: number }; richtungGrad?: number },
  kontext: KiKontext,
): KiErgebnis {
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const sperre = kontext.nurAnsicht(blatt)
  if (sperre) {
    throw new KiFehler(
      t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund: sperre }),
    )
  }
  const bezug = nullpunktVon(blatt)
  const nullpunkt = { x: bezug.x + eingabe.punkt.x, y: bezug.y + eingabe.punkt.y }
  const nullpunktRichtung =
    eingabe.richtungGrad === undefined
      ? undefined
      : normiere((eingabe.richtungGrad * Math.PI) / 180)

  const text = t('kiMeldungen.nullpunktSetzen.gesetzt', { blatt: blatt.name })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () =>
      erzeugeBlattAendernCommand(kontext.doc, blatt.id, label, { nullpunkt, nullpunktRichtung }),
  ])
  kontext.meldeAenderung(label)

  const nachher = kontext.doc.getBlatt(blatt.id) ?? blatt
  return {
    daten: {
      blattId: blatt.id,
      nullpunktImModell: { x: runde(nullpunkt.x), y: runde(nullpunkt.y) },
      ...(nullpunktRichtung !== undefined
        ? { nullpunktRichtungGrad: runde((nullpunktRichtung * 180) / Math.PI, 2) }
        : {}),
      ausrichtung: ausrichtungsStand(nachher),
      hinweis: t('kiMeldungen.nullpunktSetzen.hinweis'),
      rueckgaengig: label,
    },
  }
}
