import type { Installationszone, TrunkAbmessung, TrunkAusfuehrung } from '../document-model'

export interface VerlegeVorgaben {
  leitungZone?: Installationszone
  trunkZone?: Installationszone
  trunkAusfuehrung?: TrunkAusfuehrung
  trunkAbmessung?: TrunkAbmessung
}

export const STANDARD_VERLEGE_VORGABEN: VerlegeVorgaben = {}
