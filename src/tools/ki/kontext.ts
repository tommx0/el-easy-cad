import type {
  Blatt,
  BoundingBox,
  CatalogComponent,
  DocumentStore,
  Kabeltyp,
  Katalog,
  KiInhalt,
  Objekt,
  Point,
  VerteilerplanAufteilung,
  Zeichnung,
} from '../../document-model'
import { nullpunktVon } from '../../document-model'
import type { RoutingSettings } from '../../routing'
import { t } from '../../sprache'
import type { AnordnenEinstellungen } from '../anordnen-einstellungen'
import type { BauteilVorgaben } from '../bauteil-vorgaben'
import type { CommandStack } from '../command'
import type { VerlegeVorgaben } from '../verlege-vorgaben'

export interface KiKontext {
  doc: DocumentStore
  katalogKomponenten(): readonly CatalogComponent[]
  kataloge(): readonly Katalog[]
  verknuepfteZeichnungen(): {
    bauplaene: readonly Zeichnung[]
    verteilerplaene: readonly Zeichnung[]
  }
  dokument(): { projekt: string; kunde: string; dokument: string } | null
  sperrgrund(): string | null
  bildschirmfoto(blatt: Blatt, bereich: BoundingBox | null, maxKantePx: number): Promise<string>

  commands: CommandStack
  routingSettings(): RoutingSettings
  kabeltypen(): readonly Kabeltyp[]
  schreibsperre(): string | null
  nurAnsicht(blatt: Blatt): string | null
  nachKabeltypAenderung(): void
  meldeAenderung(text: string): void

  vorgaben(): {
    wandStaerke: number
    bauteilVorgaben: BauteilVorgaben
    verlegeVorgaben: VerlegeVorgaben
    klemmenLeiste: string
    bekannteVerteilerKennzeichen: readonly string[]
    anordnenEinstellungen: AnordnenEinstellungen
    verteilerplan: KiVerteilerplanVorgaben
  }
  nachZonenZuweisung(): void

  legeVerteilerplanAn(zeichnung: Zeichnung): Promise<{ name: string }>
}

export interface KiVerteilerplanVorgaben {
  maxSicherungenJeBlatt: number
  maxKlemmenJeBlatt: number
  aufteilung: VerteilerplanAufteilung
  stromkreisSchutzId?: string
  stromkreisKlemmeId?: string | null
  knxReserveProzent?: number
}

export class KiFehler extends Error {
  constructor(nachricht: string) {
    super(nachricht)
    this.name = 'KiFehler'
  }
}

export type KiErgebnis = { inhalt: KiInhalt[] } | { daten: unknown }

export interface KiBereich {
  xMin: number
  yMin: number
  xMax: number
  yMax: number
}

export function runde(wert: number, stellen = 3): number {
  const faktor = 10 ** stellen
  return Math.round(wert * faktor) / faktor
}

export function zuBlatt(punkt: Point, blatt: Pick<Blatt, 'nullpunkt'>): { x: number; y: number } {
  const bezug = nullpunktVon(blatt)
  return { x: runde(punkt.x - bezug.x), y: runde(punkt.y - bezug.y) }
}

export function bereichImModell(bereich: KiBereich, blatt: Pick<Blatt, 'nullpunkt'>): BoundingBox {
  const bezug = nullpunktVon(blatt)
  return {
    min: {
      x: Math.min(bereich.xMin, bereich.xMax) + bezug.x,
      y: Math.min(bereich.yMin, bereich.yMax) + bezug.y,
    },
    max: {
      x: Math.max(bereich.xMin, bereich.xMax) + bezug.x,
      y: Math.max(bereich.yMin, bereich.yMax) + bezug.y,
    },
  }
}

export function waehleBlatt(kontext: KiKontext, blattId: string | undefined): Blatt {
  const zeichnung = kontext.doc.getZeichnung()
  if (!blattId) return kontext.doc.getAktivesBlatt()
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) {
    throw new KiFehler(
      t('kiMeldungen.kontext.blattUnbekannt', {
        blattId,
        liste: zeichnung.blaetter.map((b) => `${b.id} (${b.name})`).join(', '),
      }),
    )
  }
  return blatt
}

export function findeObjekt(
  zeichnung: Zeichnung,
  objektId: string,
): { blatt: Blatt; objekt: Objekt } | null {
  for (const blatt of zeichnung.blaetter) {
    const objekt = blatt.objekte.find((o) => o.id === objektId)
    if (objekt) return { blatt, objekt }
  }
  return null
}
