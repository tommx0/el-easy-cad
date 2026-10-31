import {
  dockpunktBezeichnung,
  getDockpoints,
  istLeitungsverlegungsObjekt,
  nullpunktVon,
} from '../../document-model'
import { t } from '../../sprache'
import type { KiErgebnis, KiKontext } from './kontext'
import { findeObjekt, KiFehler, pruefeLeitungsverlegung, runde, zuBlatt } from './kontext'

export function objektLesen(eingabe: { objektId: string }, kontext: KiKontext): KiErgebnis {
  const fund = findeObjekt(kontext.doc.getZeichnung(), eingabe.objektId)
  if (!fund) throw new KiFehler(t('kiMeldungen.objektLesen.keinObjekt', { id: eingabe.objektId }))
  const { blatt, objekt } = fund
  if (istLeitungsverlegungsObjekt(objekt)) pruefeLeitungsverlegung(kontext)
  const nullpunkt = nullpunktVon(blatt)
  const zusatz: Record<string, unknown> = {}
  if (objekt.type === 'komponente') {
    const eintrag = kontext.katalogKomponenten().find((k) => k.id === objekt.catalogComponentId)
    if (eintrag) {
      const { bild: _bild, symbol: _symbol, ...ohneBilder } = eintrag
      zusatz.katalogEintrag = {
        ...ohneBilder,
        varianten: eintrag.varianten.map(({ bild: _b, symbol: _s, ...v }) => v),
      }
    }
    zusatz.dockpunkte = getDockpoints(objekt).map((punkt, index) => ({
      index,
      ...(dockpunktBezeichnung(objekt.dockpunkte, index)
        ? { bezeichnung: dockpunktBezeichnung(objekt.dockpunkte, index) }
        : {}),
      position: zuBlatt(punkt, blatt),
    }))
  }
  return {
    daten: {
      blatt: { id: blatt.id, name: blatt.name },
      hinweis: t('kiMeldungen.objektLesen.hinweis'),
      nullpunktImModell: { x: runde(nullpunkt.x), y: runde(nullpunkt.y) },
      objekt,
      ...zusatz,
    },
  }
}
