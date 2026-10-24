import type {
  Blatt,
  Installationszone,
  LeitungsEndpunkt,
  LeitungsObjekt,
  LeitungsVerteilerAnschluss,
  LeitungsZiel,
  Point,
  TrunkDurchgang,
  Zeichnung,
} from '../document-model'
import {
  belegteNummernInZeichnung,
  findePartnerLeitungAmStrang,
  leitungenEbeneId,
  naechsteFreieNummer,
  neueObjektBasis,
} from '../document-model'
import type { RoutingSettings } from '../routing'
import { fuerLeitung, waendeAlsRoutingStrecken } from '../routing'
import { belegteStrecken, inFreieBahnen } from './parallele-bahnen'

export const LEITUNG_STANDARD_FARBE = '#E86A17'

export function neueLeitungsNummer(
  zeichnung: Zeichnung,
  enden: readonly (LeitungsZiel | null)[],
): number {
  for (const endpunkt of enden) {
    if (endpunkt?.art !== 'schacht') continue
    const partner = findePartnerLeitungAmStrang(zeichnung, endpunkt.objektId, endpunkt.strang)
    if (partner) return partner.nummer
  }
  return naechsteFreieNummer(belegteNummernInZeichnung(zeichnung))
}

export function routingFuerNeueLeitung(
  settings: RoutingSettings,
  zone: Installationszone | undefined,
  blatt: Pick<Blatt, 'geschoss'> | undefined,
  zeichnung: Pick<Zeichnung, 'installationszonen'>,
): RoutingSettings {
  return fuerLeitung(
    settings,
    zone ? { installationszone: zone } : undefined,
    blatt?.geschoss,
    zeichnung.installationszonen,
  )
}

export interface NeueLeitung {
  zeichnung: Zeichnung
  blatt: Blatt | undefined
  ersatzEbeneId: string
  start: LeitungsEndpunkt
  ziel: LeitungsZiel
  segmente: Point[][]
  durchgaenge: TrunkDurchgang[]
  zone: Installationszone | undefined
  selbstVerlegt: boolean
  parallelAbstandMeter: number
  verteilerAnschluesse?: LeitungsVerteilerAnschluss[]
}

export function baueLeitungsObjekt(n: NeueLeitung): LeitungsObjekt {
  const ebeneId = (n.blatt && leitungenEbeneId(n.blatt.ebenen)) ?? n.ersatzEbeneId
  const pfadSegmente =
    n.blatt && !n.selbstVerlegt
      ? inFreieBahnen(
          n.segmente,
          belegteStrecken(n.blatt.objekte, new Set()),
          n.parallelAbstandMeter,
          waendeAlsRoutingStrecken(n.blatt.objekte),
        )
      : n.segmente
  return {
    ...neueObjektBasis(ebeneId, { farbe: LEITUNG_STANDARD_FARBE }),
    type: 'leitung',
    pfadSegmente,
    start: n.start,
    ziel: n.ziel,
    trunkDurchgaenge: n.durchgaenge,
    nummer: neueLeitungsNummer(n.zeichnung, [n.start, n.ziel]),
    kabeltypId: n.zeichnung.standardKabeltypId,
    ...(n.zone ? { installationszone: n.zone } : {}),
    ...(n.selbstVerlegt ? { autoRoutingAus: true } : {}),
    ...(n.verteilerAnschluesse && n.verteilerAnschluesse.length > 0
      ? { verteilerAnschluesse: n.verteilerAnschluesse }
      : {}),
  }
}
