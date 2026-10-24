import type { DxfEntity, Point } from '../document-model'
import type { Planbogen, Planlinien, Plansegment, RohZuWelt } from './plansegment'

export function dxfAlsPlanlinien(entities: readonly DxfEntity[], rohZuWelt: RohZuWelt): Planlinien {
  const segmente: Plansegment[] = []
  const boegen: Planbogen[] = []

  for (const entity of entities) {
    switch (entity.type) {
      case 'linie':
        segmente.push({ a: rohZuWelt(entity.start), b: rohZuWelt(entity.ende) })
        break
      case 'polylinie': {
        const punkte = entity.punkte.map(rohZuWelt)
        for (let i = 0; i < punkte.length - 1; i++) {
          segmente.push({ a: punkte[i], b: punkte[i + 1] })
        }
        if (entity.geschlossen && punkte.length > 2) {
          segmente.push({ a: punkte[punkte.length - 1], b: punkte[0] })
        }
        break
      }
      case 'bogen': {
        const drehung = winkelVersatz(entity.mittelpunkt, entity.radius, rohZuWelt)
        boegen.push({
          mittelpunkt: rohZuWelt(entity.mittelpunkt),
          radius: skalierterRadius(entity.mittelpunkt, entity.radius, rohZuWelt),
          startWinkel: entity.startWinkel + drehung,
          endWinkel: entity.endWinkel + drehung,
        })
        break
      }
      case 'kreis':
        break
    }
  }

  return { herkunft: 'dxf', segmente, boegen }
}

function winkelVersatz(mittelpunkt: Point, radius: number, rohZuWelt: RohZuWelt): number {
  const a = rohZuWelt(mittelpunkt)
  const b = rohZuWelt({ x: mittelpunkt.x + Math.max(radius, 1), y: mittelpunkt.y })
  return Math.atan2(b.y - a.y, b.x - a.x)
}

function skalierterRadius(mittelpunkt: Point, radius: number, rohZuWelt: RohZuWelt): number {
  const a = rohZuWelt(mittelpunkt)
  const b = rohZuWelt({ x: mittelpunkt.x + radius, y: mittelpunkt.y })
  return Math.hypot(b.x - a.x, b.y - a.y)
}
