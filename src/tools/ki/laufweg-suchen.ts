import { nullpunktVon, sucheLaufweg } from '../../document-model'
import { t } from '../../sprache'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler, runde, waehleBlatt } from './kontext'

export function laufwegSuchen(
  eingabe: {
    blattId?: string
    start: { x: number; y: number }
    ziel: { x: number; y: number }
    freiraumM?: number
  },
  kontext: KiKontext,
): KiErgebnis {
  const blatt = waehleBlatt(kontext, eingabe.blattId)
  const bezug = nullpunktVon(blatt)
  const imModell = (p: { x: number; y: number }) => ({
    x: p.x + bezug.x,
    y: p.y + bezug.y,
  })
  const weg = sucheLaufweg(blatt.objekte, imModell(eingabe.start), imModell(eingabe.ziel), {
    ...(eingabe.freiraumM !== undefined ? { freiraum: eingabe.freiraumM } : {}),
  })
  if (!weg) throw new KiFehler(t('kiMeldungen.laufwegSuchen.keinWeg', { blatt: blatt.name }))
  return {
    daten: {
      blattId: blatt.id,
      punkte: weg.punkte.map((p) => ({
        x: runde(p.x - bezug.x),
        y: runde(p.y - bezug.y),
      })),
      laengeM: runde(weg.laenge, 2),
    },
  }
}
