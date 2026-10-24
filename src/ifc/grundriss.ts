import type { BoundingBox, DxfEntity, IfcBauteil, IfcLage, Point } from '../document-model'
import type { Schnittlinie } from './schnitt'
import { berechneLage, ermittleHauptrichtung, huelleVonLinien, wendeLageAn } from './lage'

export interface GrundrissOptionen {
  ausrichten: boolean
  lage?: IfcLage
}

export interface Grundrisse {
  lage: IfcLage
  geschosse: {
    entities: DxfEntity[]
    huelle: BoundingBox | null
    bauteile?: IfcBauteil[]
    raumhoehe?: number
  }[]
}

function runde(p: Point): Point {
  return { x: Math.round(p.x * 1e4) / 1e4, y: Math.round(p.y * 1e4) / 1e4 }
}

function alsEntity(linie: Schnittlinie): DxfEntity {
  const bauteil = linie.bauteil !== undefined ? { bauteil: linie.bauteil } : {}
  if (linie.punkte.length === 2 && !linie.geschlossen) {
    return { type: 'linie', start: linie.punkte[0], ende: linie.punkte[1], ...bauteil }
  }
  return { type: 'polylinie', punkte: linie.punkte, geschlossen: linie.geschlossen, ...bauteil }
}

export function baueGrundrisse(
  linienJeGeschoss: Schnittlinie[][],
  optionen: GrundrissOptionen,
): Grundrisse {
  const alle = linienJeGeschoss.flat()
  const lage =
    optionen.lage ?? berechneLage(alle, optionen.ausrichten ? -ermittleHauptrichtung(alle) : 0)

  const umgerechnet = linienJeGeschoss.map((linien) =>
    linien.map((l) => ({
      geschlossen: l.geschlossen,
      punkte: l.punkte.map((p) => runde(wendeLageAn(p, lage))),
      ...(l.bauteil !== undefined ? { bauteil: l.bauteil } : {}),
    })),
  )
  return {
    lage,
    geschosse: umgerechnet.map((linien) => ({
      entities: linien.map(alsEntity),
      huelle: huelleVonLinien(linien),
    })),
  }
}
