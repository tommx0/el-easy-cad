import type { DokumentMeta, Zeichnung, Zeichnungsart } from '../document-model'
import { deserialisiereZeichnung } from '../document-model'
import type { DokumentStorePersistenz } from './projekt-store'

export interface GeleseneZeichnung {
  dokument: DokumentMeta
  zeichnung: Zeichnung
}

export interface ZeichnungsFilter {
  art?: Zeichnungsart
  verteilerKennzeichen?: string
  ohneDokumentId?: string
}

export class ProjektZeichnungenLeser {
  private readonly puffer = new Map<string, { stand: string; zeichnung: Zeichnung }>()
  private readonly dokumente: Pick<DokumentStorePersistenz, 'liste' | 'hole'>

  constructor(dokumente: Pick<DokumentStorePersistenz, 'liste' | 'hole'>) {
    this.dokumente = dokumente
  }

  async liesZeichnungen(
    projektId: string,
    filter: ZeichnungsFilter = {},
  ): Promise<GeleseneZeichnung[]> {
    const liste = await this.dokumente.liste(projektId)
    const passend = liste.filter(
      (d) =>
        d.typ === 'zeichnung' &&
        d.id !== filter.ohneDokumentId &&
        (filter.art === undefined || (d.zeichnungsart ?? 'bauplan') === filter.art) &&
        (filter.verteilerKennzeichen === undefined ||
          d.verteilerKennzeichen === filter.verteilerKennzeichen),
    )
    const ergebnis: GeleseneZeichnung[] = []
    for (const dokument of passend) {
      const zeichnung = await this.lies(dokument)
      if (zeichnung) ergebnis.push({ dokument, zeichnung })
    }
    return ergebnis
  }

  async verteilerKennzeichen(projektId: string, ohneDokumentId?: string): Promise<string[]> {
    const liste = await this.dokumente.liste(projektId)
    return liste
      .filter((d) => d.id !== ohneDokumentId && d.verteilerKennzeichen)
      .map((d) => d.verteilerKennzeichen!)
  }

  private async lies(dokument: DokumentMeta): Promise<Zeichnung | null> {
    const gepuffert = this.puffer.get(dokument.id)
    if (gepuffert && gepuffert.stand === dokument.zuletztGeaendertAm) return gepuffert.zeichnung
    const voll = await this.dokumente.hole(dokument.id)
    if (!voll?.inhalt.inhalt) return null
    try {
      const zeichnung = deserialisiereZeichnung(voll.inhalt.inhalt)
      this.puffer.set(dokument.id, { stand: dokument.zuletztGeaendertAm, zeichnung })
      return zeichnung
    } catch {
      return null
    }
  }
}
