import type { PotentialObjekt } from '../../document-model'
import { istSchaltplan, neueObjektBasis, nullpunktVon } from '../../document-model'
import { t } from '../../sprache'
import { erzeugeObjektAendernCommand } from '../commands'
import { aufSchaltplanRaster, netzfeldMitteAuf } from './komponente-setzen'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, waehleBlatt, zuBlatt } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel } from './schreiben'

export function potentialSetzen(
  eingabe: {
    blattId?: string
    potentiale: {
      name: string
      punkt?: { x: number; y: number }
      netzfeld?: string
      drehungGrad?: number
    }[]
  },
  kontext: KiKontext,
): KiErgebnis {
  const zeichnung = kontext.doc.getZeichnung()
  if (!istSchaltplan(zeichnung)) throw new KiFehler(t('kiMeldungen.potentialSetzen.nurSchaltplan'))
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const grund = kontext.nurAnsicht(blatt)
  if (grund) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
  }
  const bezug = nullpunktVon(blatt)
  const neu: PotentialObjekt[] = eingabe.potentiale.map((p, i) => {
    const name = p.name.trim()
    if (!name) throw new KiFehler(t('kiMeldungen.potentialSetzen.nameFehlt', { nr: i + 1 }))
    if ((p.punkt === undefined) === (p.netzfeld === undefined)) {
      throw new KiFehler(t('kiMeldungen.potentialSetzen.eineLage', { nr: i + 1 }))
    }
    const roh = p.punkt
      ? { x: p.punkt.x + bezug.x, y: p.punkt.y + bezug.y }
      : netzfeldMitteAuf(blatt, p.netzfeld!, zeichnung)
    return {
      ...neueObjektBasis(blatt.aktiveEbeneId),
      type: 'potential',
      position: aufSchaltplanRaster(roh, blatt, zeichnung),
      drehung: ((p.drehungGrad ?? 0) * Math.PI) / 180,
      name,
    }
  })
  const namen = [...new Set(neu.map((p) => p.name))]
  const text = t('kiMeldungen.potentialSetzen.gesetzt', {
    n: neu.length,
    namen: namen.join(', '),
    blaetter: blattText([blatt]),
  })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () => erzeugeObjektAendernCommand(kontext.doc, blatt.id, label, (b) => [...b, ...neu]),
  ])
  kontext.meldeAenderung(label)
  return {
    daten: {
      gesetzt: neu.map((p) => ({ id: p.id, name: p.name, position: zuBlatt(p.position, blatt) })),
      rueckgaengig: label,
    },
  }
}
