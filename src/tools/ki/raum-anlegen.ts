import type { RaumObjekt } from '../../document-model'
import {
  ebeneFuerNeuesObjekt,
  ermittleRaumGeometrie,
  erzeugeId,
  neueObjektBasis,
  nullpunktVon,
  planUebersetzer,
  pointInPolygon,
  standardRaumName,
  STANDARD_RAUM_SCHRIFTGROESSE,
} from '../../document-model'
import { t } from '../../sprache'
import { erzeugeObjektHinzufuegenCommand } from '../commands'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, runde, waehleBlatt } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'

export function raumAnlegen(
  eingabe: { blattId?: string; punkt: { x: number; y: number }; name?: string },
  kontext: KiKontext,
): KiErgebnis {
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const grund = kontext.nurAnsicht(blatt)
  if (grund) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
  }
  const bezug = nullpunktVon(blatt)
  const punkt = { x: eingabe.punkt.x + bezug.x, y: eingabe.punkt.y + bezug.y }
  const geometrie = ermittleRaumGeometrie(blatt.objekte, punkt)
  if (!geometrie) {
    throw new KiFehler(t('kiMeldungen.raumAnlegen.nichtUmschlossen'))
  }
  const bestehend = blatt.objekte.find(
    (o): o is RaumObjekt => o.type === 'raum' && pointInPolygon(o.mittelpunkt, geometrie.umriss),
  )
  if (bestehend) {
    throw new KiFehler(
      t('kiMeldungen.raumAnlegen.schonVorhanden', { name: bestehend.name, id: bestehend.id }),
    )
  }
  const name = eingabe.name?.trim() || standardRaumName(planUebersetzer(kontext.doc.getZeichnung()))
  const raum: RaumObjekt = {
    ...neueObjektBasis(ebeneFuerNeuesObjekt('raum', blatt.ebenen, blatt.aktiveEbeneId)),
    id: erzeugeId('objekt'),
    type: 'raum',
    punktImRaum: punkt,
    name,
    schriftgroesse: STANDARD_RAUM_SCHRIFTGROESSE,
    gueltig: true,
    fuellung: null,
    ...geometrie,
  }
  const text = t('kiMeldungen.raumAnlegen.angelegt', {
    name,
    flaeche: runde(geometrie.flaeche, 2),
    blatt: blatt.name,
  })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () => erzeugeObjektHinzufuegenCommand(kontext.doc, blatt.id, raum, label),
  ])
  kontext.meldeAenderung(label)
  return {
    daten: { raumId: raum.id, name, flaecheM2: runde(geometrie.flaeche, 2), rueckgaengig: label },
  }
}
