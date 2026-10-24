import type { Point } from '../../document-model'
import { istSchaltplan, nullpunktVon } from '../../document-model'
import { t } from '../../sprache'
import { erzeugeWandzugCommand } from '../tools/wand-tool'
import { rechteckWandAchse } from '../tools/wand-rechteck-tool'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, runde, waehleBlatt } from './kontext'
import { fuehreAenderungAus, kiLabel } from './schreiben'

export function wandZeichnen(
  eingabe: {
    blattId?: string
    punkte?: { x: number; y: number }[]
    geschlossen?: boolean
    rechteck?: { von: { x: number; y: number }; bis: { x: number; y: number } }
    staerkeM?: number
  },
  kontext: KiKontext,
): KiErgebnis {
  if ((eingabe.punkte === undefined) === (eingabe.rechteck === undefined)) {
    throw new KiFehler(t('kiMeldungen.wandZeichnen.punkteOderRechteck'))
  }
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const grund = kontext.nurAnsicht(blatt)
  if (grund) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: blatt.name, grund }))
  }
  if (istSchaltplan(kontext.doc.getZeichnung())) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.schaltplanOhneWaende'))
  }
  const staerke = eingabe.staerkeM ?? kontext.vorgaben().wandStaerke
  const bezug = nullpunktVon(blatt)
  const imModell = (p: { x: number; y: number }): Point => ({ x: p.x + bezug.x, y: p.y + bezug.y })
  let punkte: Point[]
  if (eingabe.rechteck) {
    const achse = rechteckWandAchse(
      imModell(eingabe.rechteck.von),
      imModell(eingabe.rechteck.bis),
      staerke,
    )
    if (!achse) throw new KiFehler(t('kiMeldungen.wandZeichnen.rechteckZuKlein'))
    punkte = achse
  } else {
    punkte = eingabe.punkte!.map(imModell)
    if (eingabe.geschlossen && punkte.length >= 3) punkte = [...punkte, punkte[0]]
  }
  const vorher = new Set(blatt.objekte.map((o) => o.id))
  const text = t('kiMeldungen.wandZeichnen.gezeichnet', {
    staerke: runde(staerke * 100, 1),
    blatt: blatt.name,
  })
  const label = kiLabel(text)
  fuehreAenderungAus(kontext, text, [
    () => erzeugeWandzugCommand(kontext.doc, blatt.id, blatt.aktiveEbeneId, punkte, staerke, label),
  ])
  kontext.meldeAenderung(label)
  const neu = kontext.doc
    .getBlatt(blatt.id)!
    .objekte.filter((o) => o.type === 'wand' && !vorher.has(o.id))
  return { daten: { wandIds: neu.map((o) => o.id), rueckgaengig: label } }
}
