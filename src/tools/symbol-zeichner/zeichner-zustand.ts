import type { SymbolElement, SymbolZeichnung } from '../../document-model/symbol-zeichnung'
import { CommandStack } from '../command'
import type { Command } from '../command'
import { t } from '../../sprache'

type Zuhoerer = () => void

export class SymbolZeichnerZustand {
  readonly stack = new CommandStack()
  private _zeichnung: SymbolZeichnung
  private _auswahl: string[] = []
  private zuhoerer = new Set<Zuhoerer>()
  private readonly anfang: SymbolZeichnung

  constructor(zeichnung: SymbolZeichnung) {
    this._zeichnung = zeichnung
    this.anfang = zeichnung
    this.stack.subscribe(() => this.melde())
  }

  get zeichnung(): SymbolZeichnung {
    return this._zeichnung
  }

  get auswahl(): readonly string[] {
    return this._auswahl
  }

  get geaendert(): boolean {
    return this._zeichnung !== this.anfang
  }

  ausgewaehlteElemente(): SymbolElement[] {
    const ids = new Set(this._auswahl)
    return this._zeichnung.elemente.filter((e) => ids.has(e.id))
  }

  setzeAuswahl(ids: readonly string[]) {
    this._auswahl = [...ids]
    this.melde()
  }

  aendere(label: string, aenderung: (zeichnung: SymbolZeichnung) => SymbolZeichnung) {
    const vorher = this._zeichnung
    const nachher = aenderung(vorher)
    if (nachher === vorher) return
    const command: Command = {
      label,
      do: () => this.setzeZeichnung(nachher),
      undo: () => this.setzeZeichnung(vorher),
    }
    this.stack.execute(command)
  }

  fuegeHinzu(label: string, element: SymbolElement) {
    this.aendere(label, (z) => ({ ...z, elemente: [...z.elemente, element] }))
  }

  aendereAuswahl(label: string, abbildung: (element: SymbolElement) => SymbolElement) {
    const ids = new Set(this._auswahl)
    if (ids.size === 0) return
    this.aendere(label, (z) => {
      let geaendert = false
      const elemente = z.elemente.map((e) => {
        if (!ids.has(e.id)) return e
        const neu = abbildung(e)
        if (neu !== e) geaendert = true
        return neu
      })
      return geaendert ? { ...z, elemente } : z
    })
  }

  loescheAuswahl() {
    const ids = new Set(this._auswahl)
    if (ids.size === 0) return
    this.aendere(t('katalogdialoge.gemeinsam.loeschen'), (z) => ({
      ...z,
      elemente: z.elemente.filter((e) => !ids.has(e.id)),
    }))
    this.setzeAuswahl([])
  }

  subscribe = (zuhoerer: Zuhoerer): (() => void) => {
    this.zuhoerer.add(zuhoerer)
    return () => {
      this.zuhoerer.delete(zuhoerer)
    }
  }

  private setzeZeichnung(zeichnung: SymbolZeichnung) {
    this._zeichnung = zeichnung
    const vorhanden = new Set(zeichnung.elemente.map((e) => e.id))
    this._auswahl = this._auswahl.filter((id) => vorhanden.has(id))
  }

  private melde() {
    for (const z of this.zuhoerer) z()
  }
}
