import type { BoundingBox, Objekt, Point } from '../document-model'
import { ermittleWandAchsenStuecke, oeffnungenAufWand } from '../document-model'

export interface WandStrecke {
  a: Point
  b: Point
  halbeStaerke: number
  unterkanteMeter?: number
}

export function waendeAlsRoutingStrecken(objekte: readonly Objekt[]): WandStrecke[] {
  const ergebnis: WandStrecke[] = []
  for (const o of objekte) {
    if (o.type !== 'wand') continue
    const halbeStaerke = o.staerke / 2
    for (const achse of ermittleWandAchsenStuecke(o, oeffnungenAufWand(objekte, o.id))) {
      for (let i = 0; i < achse.length - 1; i++) {
        ergebnis.push({ a: achse[i], b: achse[i + 1], halbeStaerke })
      }
    }
  }
  return ergebnis
}

export function wandStreckeBox(w: WandStrecke, rand: number): BoundingBox {
  const r = w.halbeStaerke + rand
  return {
    min: { x: Math.min(w.a.x, w.b.x) - r, y: Math.min(w.a.y, w.b.y) - r },
    max: { x: Math.max(w.a.x, w.b.x) + r, y: Math.max(w.a.y, w.b.y) + r },
  }
}
