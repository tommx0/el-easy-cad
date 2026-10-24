import type {
  BestueckungsEintrag,
  BlattRaeume,
  CatalogComponent,
  KomponentenObjekt,
  RaumAuswahl,
  Schnellvorgabe,
  VerteilerArt,
  VerteilerNetz,
  VerteilerVorschlag,
  Zeichnung,
} from '../../document-model'
import {
  KNX_RESERVE_STANDARD,
  planeVorschlag,
  STANDARD_SCHNELLVORGABE,
  vorauswahlRaeume,
} from '../../document-model'

export interface RaumVorschlagZustand {
  auswahl: RaumAuswahl[]
  vorgabe: Schnellvorgabe
  knx: boolean
  reserve: string
  behalten: ReadonlySet<string>
}

export function raumVorschlagStart(
  raeume: readonly BlattRaeume[],
  gemerkt: readonly RaumAuswahl[] | undefined,
  reserve: number | undefined,
  netz: VerteilerNetz = 'drehstrom',
  art: VerteilerArt = 'HV',
): RaumVorschlagZustand {
  return {
    auswahl: vorauswahlRaeume(raeume, gemerkt),
    vorgabe: { ...STANDARD_SCHNELLVORGABE, drehstrom: netz === 'drehstrom', art },
    knx: true,
    reserve: String(reserve ?? KNX_RESERVE_STANDARD),
    behalten: new Set(),
  }
}

export function reserveZahl(z: RaumVorschlagZustand): number {
  return Math.max(0, Math.min(200, Math.round(Number(z.reserve) || 0)))
}

export function rechneRaumVorschlag(
  z: RaumVorschlagZustand,
  basis: {
    zeichnung: Zeichnung
    katalog: readonly CatalogComponent[]
    bestueckung: readonly BestueckungsEintrag[]
    verteiler?: KomponentenObjekt | null
    kennzeichen?: string
  },
): VerteilerVorschlag {
  const verwaistEntfernen = new Set(
    basis.bestueckung.filter((e) => e.quelle && !z.behalten.has(e.id)).map((e) => e.id),
  )
  return planeVorschlag(
    { ...basis, auswahl: z.auswahl, vorgabe: z.vorgabe },
    { verwaistEntfernen, knxReserve: z.knx ? reserveZahl(z) : null },
  )
}
