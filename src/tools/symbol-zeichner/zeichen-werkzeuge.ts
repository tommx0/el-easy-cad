import type { Point } from '../../document-model/geometry'
import { distance } from '../../document-model/geometry'
import type { SymbolElement } from '../../document-model/symbol-zeichnung'
import { vereinfachePunkte } from '../../document-model/symbol-zeichnung'
import type {
  SymbolHilfsgrafik,
  SymbolWerkzeug,
  SymbolWerkzeugId,
  SymbolWerkzeugKontext,
  SymbolZeigerEreignis,
} from './werkzeug'
import { farbenAus, mitElement, neueSymbolElementId, winkelFang } from './werkzeug'
import { t } from '../../sprache'
import type { Schluessel } from '../../sprache'

export const FREIHAND_TOLERANZ = 0.3
const FREIHAND_MINDESTABSTAND = 0.25

interface ZweiPunktDefinition {
  id: SymbolWerkzeugId
  label: Schluessel
  statusStart: Schluessel
  statusEnde: Schluessel
  winkelFang: boolean
  erzeuge(a: Point, b: Point, k: SymbolWerkzeugKontext): SymbolElement | null
  hilfe?(a: Point, b: Point): SymbolHilfsgrafik[]
}

function zweiPunktWerkzeug(d: ZweiPunktDefinition): SymbolWerkzeug {
  let start: Point | null = null
  let startRoh: Point | null = null
  let aktuell: Point | null = null
  let startDurchDiesenDruck = false

  function reset() {
    start = null
    startRoh = null
    aktuell = null
    startDurchDiesenDruck = false
  }

  function zweiterPunkt(e: SymbolZeigerEreignis): Point {
    return d.winkelFang && e.umschalt && start ? winkelFang(start, e.punkt) : e.punkt
  }

  function abschliessen(b: Point, k: SymbolWerkzeugKontext) {
    const element = start ? d.erzeuge(start, b, k) : null
    if (element) k.zustand.fuegeHinzu(t(d.label), element)
    reset()
    k.setStatus(t(d.statusStart))
  }

  return {
    id: d.id,
    fangen: true,
    aktiviere(k) {
      reset()
      k.setStatus(t(d.statusStart))
    },
    runter(e, k) {
      if (!start) {
        start = e.punkt
        startRoh = e.roh
        aktuell = e.punkt
        startDurchDiesenDruck = true
        k.setStatus(t(d.statusEnde))
        return
      }
      abschliessen(zweiterPunkt(e), k)
    },
    bewegt(e) {
      if (start) aktuell = zweiterPunkt(e)
    },
    hoch(e, k) {
      if (!start || !startDurchDiesenDruck || !startRoh) return
      startDurchDiesenDruck = false
      if (distance(e.roh, startRoh) > k.toleranz()) abschliessen(zweiterPunkt(e), k)
    },
    taste() {
      return false
    },
    abbrechen(k) {
      const lief = start !== null
      reset()
      k.setStatus(t(d.statusStart))
      return lief
    },
    vorschau(zeichnung, k) {
      return mitElement(zeichnung, start && aktuell ? d.erzeuge(start, aktuell, k) : null)
    },
    hilfsgrafik() {
      return start && aktuell && d.hilfe ? d.hilfe(start, aktuell) : []
    },
  }
}

export function erzeugeLinienWerkzeug(): SymbolWerkzeug {
  return zweiPunktWerkzeug({
    id: 'linie',
    label: 'katalogdialoge.symbolZeichner.werkzeuge.linie',
    statusStart: 'katalogdialoge.symbolWerkzeuge.linieStart',
    statusEnde: 'katalogdialoge.symbolWerkzeuge.linieEnde',
    winkelFang: true,
    erzeuge(a, b, k) {
      if (distance(a, b) < 1e-6) return null
      return {
        art: 'linie',
        id: neueSymbolElementId(),
        a,
        b,
        strich: k.einstellungen().strich,
        ...farbenAus(k.einstellungen()),
        radierungen: [],
      }
    },
  })
}

export function erzeugeRechteckWerkzeug(): SymbolWerkzeug {
  return zweiPunktWerkzeug({
    id: 'rechteck',
    label: 'katalogdialoge.symbolZeichner.werkzeuge.rechteck',
    statusStart: 'katalogdialoge.symbolWerkzeuge.rechteckStart',
    statusEnde: 'katalogdialoge.symbolWerkzeuge.rechteckEnde',
    winkelFang: false,
    erzeuge(a, b, k) {
      const breite = Math.abs(b.x - a.x)
      const hoehe = Math.abs(b.y - a.y)
      if (breite < 1e-6 && hoehe < 1e-6) return null
      const { strich, gefuellt } = k.einstellungen()
      return {
        art: 'rechteck',
        id: neueSymbolElementId(),
        ecke: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
        breite,
        hoehe,
        gefuellt,
        strich,
        ...farbenAus(k.einstellungen(), gefuellt),
        radierungen: [],
      }
    },
  })
}

export function erzeugeKreisWerkzeug(): SymbolWerkzeug {
  return zweiPunktWerkzeug({
    id: 'kreis',
    label: 'katalogdialoge.symbolZeichner.werkzeuge.kreis',
    statusStart: 'katalogdialoge.symbolWerkzeuge.kreisStart',
    statusEnde: 'katalogdialoge.symbolWerkzeuge.kreisEnde',
    winkelFang: false,
    erzeuge(a, b, k) {
      const radius = distance(a, b)
      if (radius < 1e-6) return null
      const { strich, gefuellt } = k.einstellungen()
      return {
        art: 'kreis',
        id: neueSymbolElementId(),
        mitte: a,
        radius,
        gefuellt,
        strich,
        ...farbenAus(k.einstellungen(), gefuellt),
        radierungen: [],
      }
    },
    hilfe: (a, b) => [{ art: 'linienzug', punkte: [a, b] }],
  })
}

const POLYLINIE_START: Schluessel = 'katalogdialoge.symbolWerkzeuge.polylinieStart'
const POLYLINIE_WEITER: Schluessel = 'katalogdialoge.symbolWerkzeuge.polylinieWeiter'

export function erzeugePolylinienWerkzeug(): SymbolWerkzeug {
  let punkte: Point[] = []
  let aktuell: Point | null = null

  function reset() {
    punkte = []
    aktuell = null
  }

  function naechsterPunkt(e: SymbolZeigerEreignis): Point {
    const letzter = punkte[punkte.length - 1]
    return e.umschalt && letzter ? winkelFang(letzter, e.punkt) : e.punkt
  }

  function abschliessen(k: SymbolWerkzeugKontext, geschlossen: boolean) {
    if (punkte.length >= 2) {
      const { strich, gefuellt } = k.einstellungen()
      k.zustand.fuegeHinzu(t('katalogdialoge.symbolZeichner.werkzeuge.polylinie'), {
        art: 'polylinie',
        id: neueSymbolElementId(),
        punkte,
        geschlossen,
        gefuellt: geschlossen && gefuellt,
        strich,
        ...farbenAus(k.einstellungen(), geschlossen && gefuellt),
        radierungen: [],
      })
    }
    reset()
    k.setStatus(t(POLYLINIE_START))
  }

  return {
    id: 'polylinie',
    fangen: true,
    aktiviere(k) {
      reset()
      k.setStatus(t(POLYLINIE_START))
    },
    runter(e, k) {
      if (punkte.length >= 3 && distance(e.roh, punkte[0]) <= k.toleranz()) {
        abschliessen(k, true)
        return
      }
      if (e.doppelklick && punkte.length >= 2) {
        abschliessen(k, false)
        return
      }
      punkte = [...punkte, naechsterPunkt(e)]
      aktuell = punkte[punkte.length - 1]
      k.setStatus(t(POLYLINIE_WEITER))
    },
    bewegt(e) {
      if (punkte.length > 0) aktuell = naechsterPunkt(e)
    },
    hoch() {},
    taste(taste, k) {
      if (punkte.length === 0) return false
      if (taste === 'Enter') {
        abschliessen(k, false)
        return true
      }
      if (taste === 'Backspace') {
        punkte = punkte.slice(0, -1)
        if (punkte.length === 0) k.setStatus(t(POLYLINIE_START))
        return true
      }
      return false
    },
    abbrechen(k) {
      const lief = punkte.length > 0
      reset()
      k.setStatus(t(POLYLINIE_START))
      return lief
    },
    vorschau(zeichnung, k) {
      if (punkte.length === 0) return zeichnung
      return mitElement(zeichnung, {
        art: 'polylinie',
        id: 'vorschau',
        punkte: aktuell ? [...punkte, aktuell] : punkte,
        geschlossen: false,
        gefuellt: false,
        strich: k.einstellungen().strich,
        ...farbenAus(k.einstellungen()),
        radierungen: [],
      })
    },
    hilfsgrafik() {
      return punkte.length >= 3 ? [{ art: 'markierung', punkt: punkte[0] }] : []
    },
  }
}

const BOGEN_MITTE: Schluessel = 'katalogdialoge.symbolWerkzeuge.bogenMitte'
const BOGEN_START: Schluessel = 'katalogdialoge.symbolWerkzeuge.bogenStart'
const BOGEN_ENDE: Schluessel = 'katalogdialoge.symbolWerkzeuge.bogenEnde'

export function erzeugeBogenWerkzeug(): SymbolWerkzeug {
  let mitte: Point | null = null
  let radius = 0
  let startWinkel = 0
  let aktuell: Point | null = null

  function reset() {
    mitte = null
    radius = 0
    startWinkel = 0
    aktuell = null
  }

  function ausgerichtet(e: SymbolZeigerEreignis): Point {
    return e.umschalt && mitte ? winkelFang(mitte, e.punkt) : e.punkt
  }

  function winkelZu(p: Point): number {
    return mitte ? Math.atan2(p.y - mitte.y, p.x - mitte.x) : 0
  }

  return {
    id: 'bogen',
    fangen: true,
    aktiviere(k) {
      reset()
      k.setStatus(t(BOGEN_MITTE))
    },
    runter(e, k) {
      const p = ausgerichtet(e)
      if (!mitte) {
        mitte = p
        aktuell = p
        k.setStatus(t(BOGEN_START))
        return
      }
      if (radius === 0) {
        const r = distance(mitte, p)
        if (r < 1e-6) return
        radius = r
        startWinkel = winkelZu(p)
        k.setStatus(t(BOGEN_ENDE))
        return
      }
      const endWinkel = winkelZu(p)
      if (Math.abs(endWinkel - startWinkel) < 1e-6) return
      k.zustand.fuegeHinzu(t('katalogdialoge.symbolZeichner.werkzeuge.bogen'), {
        art: 'bogen',
        id: neueSymbolElementId(),
        mitte,
        radius,
        startWinkel,
        endWinkel,
        strich: k.einstellungen().strich,
        ...farbenAus(k.einstellungen()),
        radierungen: [],
      })
      reset()
      k.setStatus(t(BOGEN_MITTE))
    },
    bewegt(e) {
      if (mitte) aktuell = ausgerichtet(e)
    },
    hoch() {},
    taste() {
      return false
    },
    abbrechen(k) {
      const lief = mitte !== null
      reset()
      k.setStatus(t(BOGEN_MITTE))
      return lief
    },
    vorschau(zeichnung, k) {
      if (!mitte || radius === 0 || !aktuell) return zeichnung
      return mitElement(zeichnung, {
        art: 'bogen',
        id: 'vorschau',
        mitte,
        radius,
        startWinkel,
        endWinkel: winkelZu(aktuell),
        strich: k.einstellungen().strich,
        ...farbenAus(k.einstellungen()),
        radierungen: [],
      })
    },
    hilfsgrafik() {
      if (!mitte || !aktuell) return []
      const hilfen: SymbolHilfsgrafik[] = [{ art: 'linienzug', punkte: [mitte, aktuell] }]
      if (radius === 0) hilfen.push({ art: 'kreis', mitte, radius: distance(mitte, aktuell) })
      return hilfen
    },
  }
}

const TEXT_STATUS: Schluessel = 'katalogdialoge.symbolWerkzeuge.textStatus'

export function erzeugeTextWerkzeug(): SymbolWerkzeug {
  let eingabeOffen = false

  return {
    id: 'text',
    fangen: true,
    aktiviere(k) {
      k.setStatus(t(TEXT_STATUS))
    },
    runter(e, k) {
      if (eingabeOffen) return
      eingabeOffen = true
      const position = e.punkt
      k.setStatus(t('katalogdialoge.symbolWerkzeuge.textEingeben'))
      k.frageText(position, '', (text) => {
        eingabeOffen = false
        k.setStatus(t(TEXT_STATUS))
        if (!text || !text.trim()) return
        k.zustand.fuegeHinzu(t('katalogdialoge.symbolZeichner.werkzeuge.text'), {
          art: 'text',
          id: neueSymbolElementId(),
          position,
          text: text.replace(/\s+$/, ''),
          groesse: k.einstellungen().textGroesse,
          ...farbenAus(k.einstellungen()),
          radierungen: [],
        })
      })
    },
    bewegt() {},
    hoch() {},
    taste() {
      return false
    },
    abbrechen() {
      return false
    },
    vorschau: (zeichnung) => zeichnung,
    hilfsgrafik: () => [],
  }
}

const FREIHAND_STATUS: Schluessel = 'katalogdialoge.symbolWerkzeuge.freihandStatus'

export function erzeugeFreihandWerkzeug(): SymbolWerkzeug {
  let punkte: Point[] | null = null

  return {
    id: 'freihand',
    fangen: false,
    aktiviere(k) {
      punkte = null
      k.setStatus(t(FREIHAND_STATUS))
    },
    runter(e) {
      punkte = [e.roh]
    },
    bewegt(e) {
      if (!punkte || !e.gedrueckt) return
      if (distance(punkte[punkte.length - 1], e.roh) >= FREIHAND_MINDESTABSTAND) {
        punkte.push(e.roh)
      }
    },
    hoch(_e, k) {
      if (!punkte) return
      const aufgezeichnet = punkte
      punkte = null
      k.zustand.fuegeHinzu(t('katalogdialoge.symbolZeichner.werkzeuge.freihand'), {
        art: 'freihand',
        id: neueSymbolElementId(),
        punkte: vereinfachePunkte(aufgezeichnet, FREIHAND_TOLERANZ),
        strich: k.einstellungen().strich,
        ...farbenAus(k.einstellungen()),
        radierungen: [],
      })
    },
    taste() {
      return false
    },
    abbrechen() {
      const lief = punkte !== null
      punkte = null
      return lief
    },
    vorschau(zeichnung, k) {
      if (!punkte) return zeichnung
      return mitElement(zeichnung, {
        art: 'freihand',
        id: 'vorschau',
        punkte,
        strich: k.einstellungen().strich,
        ...farbenAus(k.einstellungen()),
        radierungen: [],
      })
    },
    hilfsgrafik: () => [],
  }
}
