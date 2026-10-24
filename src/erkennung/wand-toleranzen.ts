import type { Planherkunft } from './plansegment'
import type { AufbereitungsOptionen } from './segmente'

export interface WandToleranzen {
  winkelToleranz: number
  abstandToleranz: number
  lueckenToleranz: number
  keilToleranz: number
  eckFaktor: number
}

export const STANDARD_EMPFINDLICHKEIT = 0.6

export function wandToleranzen(empfindlichkeit: number, herkunft: Planherkunft): WandToleranzen {
  const e = Math.max(0, Math.min(1, empfindlichkeit))
  const grundrauschen = herkunft === 'raster' ? 2.5 : herkunft === 'pdf-vektor' ? 1.3 : 1

  return {
    winkelToleranz: ((0.8 + e * 4.2) * Math.PI) / 180,
    abstandToleranz: (0.008 + e * 0.014) * grundrauschen,
    lueckenToleranz: 0.04 + e * 0.26,
    keilToleranz: (0.01 + e * 0.03) * grundrauschen,
    eckFaktor: 1.0 + e * 1.0,
  }
}

export function aufbereitungAus(
  toleranzen: WandToleranzen,
  mindestSegmentLaenge: number,
): AufbereitungsOptionen {
  return {
    mindestSegmentLaenge,
    winkelToleranz: toleranzen.winkelToleranz,
    abstandToleranz: toleranzen.abstandToleranz,
    lueckenToleranz: toleranzen.lueckenToleranz,
  }
}
