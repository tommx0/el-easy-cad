import type { FensterObjekt, TuerObjekt, WandObjekt } from '../../document-model'
import {
  ermittleOeffnungsGeometrie,
  erzeugeId,
  neueObjektBasis,
  pfadGesamtLaenge,
} from '../../document-model'
import { t } from '../../sprache'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { findeObjekt, KiFehler, runde } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'

export function oeffnungSetzen(
  eingabe: {
    art: 'tuer' | 'fenster'
    wandId: string
    abstandM: number
    breiteM?: number
    hoeheM?: number
    bruestungM?: number
    gespiegelt?: boolean
    schwenkInnen?: boolean
  },
  kontext: KiKontext,
): KiErgebnis {
  const fund = findeObjekt(kontext.doc.getZeichnung(), eingabe.wandId)
  if (fund?.objekt.type !== 'wand') {
    throw new KiFehler(t('kiMeldungen.gemeinsam.keineWand', { id: eingabe.wandId }))
  }
  const { blatt } = fund
  const wand: WandObjekt = fund.objekt
  const grund = kontext.nurAnsicht(blatt)
  if (grund) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
  }
  const laenge = pfadGesamtLaenge(wand.punkte)
  const vorgaben = kontext.vorgaben().bauteilVorgaben
  const breite =
    eingabe.breiteM ?? (eingabe.art === 'tuer' ? vorgaben.tuerBreite : vorgaben.fensterBreite)
  if (eingabe.abstandM - breite / 2 < -1e-9 || eingabe.abstandM + breite / 2 > laenge + 1e-9) {
    throw new KiFehler(t('kiMeldungen.oeffnungSetzen.passtNicht', { laenge: runde(laenge, 2) }))
  }
  const anteil = laenge > 0 ? eingabe.abstandM / laenge : 0
  const geometrie = ermittleOeffnungsGeometrie(wand, { t: anteil })
  if (!geometrie) throw new KiFehler(t('kiMeldungen.gemeinsam.wandOhneLaenge'))
  const basis = {
    ...neueObjektBasis(blatt.aktiveEbeneId),
    id: erzeugeId('objekt'),
    wandId: wand.id,
    t: anteil,
    breite,
  }
  const objekt: TuerObjekt | FensterObjekt =
    eingabe.art === 'tuer'
      ? {
          ...basis,
          type: 'tuer',
          hoehe: eingabe.hoeheM ?? vorgaben.tuerHoehe,
          gespiegelt: eingabe.gespiegelt ?? false,
          schwenkInnen: eingabe.schwenkInnen ?? false,
          ...geometrie,
        }
      : {
          ...basis,
          type: 'fenster',
          hoehe: eingabe.hoeheM ?? vorgaben.fensterHoehe,
          bruestungshoehe: eingabe.bruestungM ?? vorgaben.fensterBruestung,
          ...geometrie,
        }
  const text = t(
    eingabe.art === 'tuer'
      ? 'kiMeldungen.oeffnungSetzen.tuerEingesetzt'
      : 'kiMeldungen.oeffnungSetzen.fensterEingesetzt',
    { breite: runde(breite * 100, 0), blatt: blatt.name },
  )
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () => erzeugeObjektHinzufuegenCommand(kontext.doc, blatt.id, objekt, label),
  ])
  kontext.meldeAenderung(label)
  return { daten: { id: objekt.id, rueckgaengig: label } }
}
