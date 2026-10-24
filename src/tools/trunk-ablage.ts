import type { Objekt, Point, TrunkObjekt } from '../document-model'
import { naechsterPunktAufPfad, punktAufPfad } from '../document-model'
import { findeEndeIndex } from './leitung-editing'
import type { ToolContext } from './tool'
import { t } from '../sprache'

export type TrunkAblageZiel =
  | { art: 'ende'; trunkId: string; endeIndex: 0 | 1 }
  | { art: 'pfad'; trunkId: string; t: number; punkt: Point }

export function findeTrunkAblageZiel(
  objekte: Objekt[],
  quelleTrunkId: string | null,
  welt: Point,
  endeToleranz: number,
  pfadToleranz: number,
): TrunkAblageZiel | null {
  const andereTrunks = objekte.filter(
    (o): o is TrunkObjekt => o.type === 'trunk' && o.id !== quelleTrunkId,
  )
  for (const trunk of andereTrunks) {
    const endeIndex = findeEndeIndex(trunk.wegpunkte, welt, endeToleranz)
    if (endeIndex !== null) return { art: 'ende', trunkId: trunk.id, endeIndex }
  }
  let bester: TrunkAblageZiel | null = null
  let besteDistanz = pfadToleranz
  for (const trunk of andereTrunks) {
    const treffer = naechsterPunktAufPfad(trunk.wegpunkte, welt)
    if (!treffer || treffer.distanz > besteDistanz) continue
    besteDistanz = treffer.distanz
    bester = { art: 'pfad', trunkId: trunk.id, t: treffer.t, punkt: treffer.punkt }
  }
  return bester
}

export function abzweigeNachfuehren(
  objekte: Objekt[],
  trunkId: string,
  neueWegpunkte: Point[],
): Objekt[] {
  if (neueWegpunkte.length === 0) return objekte
  return objekte.map((o) => {
    if (o.type !== 'trunk' || o.id === trunkId) return o
    if (!o.enden.some((e) => e.verbundenerPfad?.trunkId === trunkId)) return o
    if (o.wegpunkte.length === 0) return o
    const wegpunkte = [...o.wegpunkte]
    o.enden.forEach((ende, index) => {
      const ziel = ende.verbundenerPfad
      if (ziel?.trunkId !== trunkId) return
      wegpunkte[index === 0 ? 0 : wegpunkte.length - 1] = punktAufPfad(neueWegpunkte, ziel.t)
    })
    return { ...o, wegpunkte }
  })
}

export function frageTrunkVerbindung(
  ctx: ToolContext,
  ziel: TrunkAblageZiel,
  zielName: string,
  endeText: string,
  antwort: (bestaetigt: boolean) => void,
): void {
  ctx.oeffneBestaetigung({
    titel: t(
      ziel.art === 'ende'
        ? 'werkzeuge.trunkAblage.verschmelzenTitel'
        : 'werkzeuge.trunkAblage.abzweigTitel',
    ),
    nachricht: t(
      ziel.art === 'ende'
        ? 'werkzeuge.trunkAblage.verschmelzenFrage'
        : 'werkzeuge.trunkAblage.abzweigFrage',
      { ende: endeText, name: zielName },
    ),
    bestaetigenText: t(
      ziel.art === 'ende' ? 'werkzeuge.trunkAblage.verschmelzen' : 'werkzeuge.trunkAblage.andocken',
    ),
    destruktiv: false,
    callback: antwort,
  })
}
