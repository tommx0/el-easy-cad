import { erzeugeRadiererWerkzeug, erzeugeSymbolAuswahlWerkzeug } from './auswahl-radierer-werkzeuge'
import type { SymbolWerkzeug, SymbolWerkzeugId } from './werkzeug'
import {
  erzeugeBogenWerkzeug,
  erzeugeFreihandWerkzeug,
  erzeugeKreisWerkzeug,
  erzeugeLinienWerkzeug,
  erzeugePolylinienWerkzeug,
  erzeugeRechteckWerkzeug,
  erzeugeTextWerkzeug,
} from './zeichen-werkzeuge'

export * from './werkzeug'
export * from './zeichner-zustand'
export { oberstesSymbolElement } from './auswahl-radierer-werkzeuge'

export function erzeugeSymbolWerkzeuge(): Record<SymbolWerkzeugId, SymbolWerkzeug> {
  return {
    auswahl: erzeugeSymbolAuswahlWerkzeug(),
    linie: erzeugeLinienWerkzeug(),
    polylinie: erzeugePolylinienWerkzeug(),
    rechteck: erzeugeRechteckWerkzeug(),
    kreis: erzeugeKreisWerkzeug(),
    bogen: erzeugeBogenWerkzeug(),
    text: erzeugeTextWerkzeug(),
    freihand: erzeugeFreihandWerkzeug(),
    radierer: erzeugeRadiererWerkzeug(),
  }
}
