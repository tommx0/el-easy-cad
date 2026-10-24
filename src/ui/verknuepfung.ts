import type { Zeichnung, Zeichnungsart } from '../document-model'
import type { GeleseneZeichnung, ProjektZeichnungenLeser } from '../persistence'

export interface VerknuepfungsStand {
  dokumentId: string | null
  laedt: boolean
  verteilerplaene: readonly GeleseneZeichnung[]
  bauplaene: readonly GeleseneZeichnung[]
}

const LEER: VerknuepfungsStand = {
  dokumentId: null,
  laedt: false,
  verteilerplaene: [],
  bauplaene: [],
}

export interface OffeneZeichnung {
  projektId: string
  dokumentId: string
  zeichnungsart: Zeichnungsart
  verteilerKennzeichen?: string
}

export class Verknuepfung {
  private stand: VerknuepfungsStand = LEER
  private readonly hoerer = new Set<() => void>()
  private lauf = 0
  private readonly leser: ProjektZeichnungenLeser

  constructor(leser: ProjektZeichnungenLeser) {
    this.leser = leser
  }

  getStand = (): VerknuepfungsStand => this.stand

  subscribe = (hoerer: () => void): (() => void) => {
    this.hoerer.add(hoerer)
    return () => this.hoerer.delete(hoerer)
  }

  private setze(stand: VerknuepfungsStand) {
    this.stand = stand
    for (const h of this.hoerer) h()
  }

  async aktualisiere(offen: OffeneZeichnung | null): Promise<void> {
    const lauf = ++this.lauf
    if (!offen) {
      this.setze(LEER)
      return
    }
    const gleich = this.stand.dokumentId === offen.dokumentId
    this.setze({ ...(gleich ? this.stand : LEER), dokumentId: offen.dokumentId, laedt: true })
    try {
      const ohneDokumentId = offen.dokumentId
      const verteilerplaene =
        offen.zeichnungsart === 'bauplan'
          ? (
              await this.leser.liesZeichnungen(offen.projektId, {
                art: 'schaltplan',
                ohneDokumentId,
              })
            ).filter((z) => z.zeichnung.verteilerKennzeichen)
          : []
      const bauplaene =
        offen.zeichnungsart === 'schaltplan'
          ? await this.leser.liesZeichnungen(offen.projektId, { art: 'bauplan', ohneDokumentId })
          : []
      if (lauf !== this.lauf) return
      this.setze({ dokumentId: offen.dokumentId, laedt: false, verteilerplaene, bauplaene })
    } catch {
      if (lauf === this.lauf) this.setze({ ...this.stand, laedt: false })
    }
  }
}

export function verteilerplanZu(
  stand: VerknuepfungsStand,
  kennzeichen: string | undefined,
): { plan: GeleseneZeichnung; weitere: number } | null {
  if (!kennzeichen) return null
  const treffer = stand.verteilerplaene.filter(
    (p) => p.zeichnung.verteilerKennzeichen === kennzeichen,
  )
  return treffer.length > 0 ? { plan: treffer[0], weitere: treffer.length - 1 } : null
}

const zeichnungenJeStand = new WeakMap<VerknuepfungsStand, readonly Zeichnung[]>()

export function bauplanZeichnungen(stand: VerknuepfungsStand): readonly Zeichnung[] {
  let liste = zeichnungenJeStand.get(stand)
  if (!liste) {
    liste = stand.bauplaene.map((b) => b.zeichnung)
    zeichnungenJeStand.set(stand, liste)
  }
  return liste
}

const planZeichnungenJeStand = new WeakMap<VerknuepfungsStand, readonly Zeichnung[]>()

export function verteilerplanZeichnungen(stand: VerknuepfungsStand): readonly Zeichnung[] {
  let liste = planZeichnungenJeStand.get(stand)
  if (!liste) {
    liste = stand.verteilerplaene.map((p) => p.zeichnung)
    planZeichnungenJeStand.set(stand, liste)
  }
  return liste
}

export function tabellenVerknuepfung(stand: VerknuepfungsStand): {
  bauplaene: readonly Zeichnung[]
  verteilerplaene: readonly Zeichnung[]
} {
  return { bauplaene: bauplanZeichnungen(stand), verteilerplaene: verteilerplanZeichnungen(stand) }
}
