export interface RoutingSettings {
  kostenProLaenge: number
  kosten90: number
  kosten45: number
  sicherheitsabstandMeter: number
  maxSuchbereichErweiterungen: number
  wandfuehrung: boolean
  wandabstandMeter: number
  wandBevorzugung: number
  wandQuerungsKosten: number
  parallelAbstandMeter: number
}

export interface RoutingAufruf extends RoutingSettings {
  nurInBauteilen?: boolean
  leitungHoeheMeter?: number
}

export const WAND_BEVORZUGUNG_MAX = 0.8

export const STANDARD_ROUTING_SETTINGS: RoutingSettings = {
  kostenProLaenge: 1,
  kosten90: 0.3,
  kosten45: 0.15,
  sicherheitsabstandMeter: 0.05,
  maxSuchbereichErweiterungen: 6,
  wandfuehrung: false,
  wandabstandMeter: 0.1,
  wandBevorzugung: 0.5,
  wandQuerungsKosten: 2,
  parallelAbstandMeter: 0.03,
}
