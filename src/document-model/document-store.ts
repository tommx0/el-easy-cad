import type { Blatt } from './blatt'
import type { Zeichnung } from './zeichnung'

type Listener = () => void

export class DocumentStore {
  private zeichnung: Zeichnung
  private listeners = new Set<Listener>()

  constructor(zeichnung: Zeichnung) {
    this.zeichnung = zeichnung
  }

  getZeichnung(): Zeichnung {
    return this.zeichnung
  }

  getSnapshot = (): Zeichnung => this.zeichnung

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private setzeZeichnung(zeichnung: Zeichnung) {
    this.zeichnung = { ...zeichnung, zuletztGeaendertAm: new Date().toISOString() }
    for (const listener of this.listeners) listener()
  }

  ersetzeZeichnung(zeichnung: Zeichnung) {
    this.zeichnung = zeichnung
    for (const listener of this.listeners) listener()
  }

  getBlatt(blattId: string): Blatt | undefined {
    return this.zeichnung.blaetter.find((b) => b.id === blattId)
  }

  getAktivesBlatt(): Blatt {
    const blatt = this.getBlatt(this.zeichnung.aktivesBlattId)
    if (!blatt) {
      throw new Error('Kein aktives Blatt vorhanden - inkonsistenter Zustand der Zeichnung.')
    }
    return blatt
  }

  setAktivesBlatt(blattId: string) {
    if (!this.getBlatt(blattId)) return
    this.setzeZeichnung({ ...this.zeichnung, aktivesBlattId: blattId })
  }

  private mitBlatt(blattId: string, aendern: (blatt: Blatt) => Blatt) {
    const blaetter = this.zeichnung.blaetter.map((b) => (b.id === blattId ? aendern(b) : b))
    this.setzeZeichnung({ ...this.zeichnung, blaetter })
  }

  updateBlatt(blattId: string, patch: Partial<Blatt>) {
    this.mitBlatt(blattId, (b) => ({ ...b, ...patch }))
  }

  updateZeichnung(patch: Partial<Omit<Zeichnung, 'blaetter' | 'aktivesBlattId'>>) {
    this.setzeZeichnung({ ...this.zeichnung, ...patch })
  }

  setBlaetter(blaetter: Blatt[], aktivesBlattId: string) {
    this.setzeZeichnung({ ...this.zeichnung, blaetter, aktivesBlattId })
  }
}
