import type { BoundingBox, Point } from '../../document-model/geometry'
import { boundingBoxEnthaelt, boundingBoxFromPoints, distance } from '../../document-model/geometry'
import type {
  SymbolElement,
  SymbolRadierung,
  SymbolZeichnung,
} from '../../document-model/symbol-zeichnung'
import {
  SYMBOL_PINSEL_BREITE,
  abstandZuSymbolElement,
  pinselAbdruecke,
  pinselTrifftSymbolElement,
  symbolElementRahmen,
  vereinfachePunkte,
  verschiebeSymbolElement,
} from '../../document-model/symbol-zeichnung'
import type { SymbolHilfsgrafik, SymbolWerkzeug, SymbolWerkzeugKontext } from './werkzeug'
import { t } from '../../sprache'

const RADIERER_TOLERANZ = 0.1
const RADIERER_MINDESTABSTAND = 0.25

function mitRadierung(
  zeichnung: SymbolZeichnung,
  getroffen: ReadonlySet<string>,
  radierung: SymbolRadierung,
): SymbolZeichnung {
  if (getroffen.size === 0) return zeichnung
  return {
    ...zeichnung,
    elemente: zeichnung.elemente.map((e) =>
      getroffen.has(e.id) ? { ...e, radierungen: [...e.radierungen, radierung] } : e,
    ),
  }
}

export function erzeugeRadiererWerkzeug(): SymbolWerkzeug {
  let spur: Point[] | null = null
  let breite = SYMBOL_PINSEL_BREITE.mittel
  let getroffen = new Set<string>()
  let zeiger: Point | null = null

  function pruefe(k: SymbolWerkzeugKontext, abdruecke: Point[]) {
    for (const element of k.zustand.zeichnung.elemente) {
      if (getroffen.has(element.id)) continue
      if (abdruecke.some((p) => pinselTrifftSymbolElement(element, p, breite))) {
        getroffen.add(element.id)
      }
    }
  }

  return {
    id: 'radierer',
    fangen: false,
    aktiviere(k) {
      spur = null
      getroffen = new Set()
      k.setStatus(t('katalogdialoge.symbolWerkzeuge.radiererStatus'))
    },
    runter(e, k) {
      breite = SYMBOL_PINSEL_BREITE[k.einstellungen().pinsel]
      spur = [e.roh]
      zeiger = e.roh
      getroffen = new Set()
      pruefe(k, [e.roh])
    },
    bewegt(e, k) {
      zeiger = e.roh
      if (!spur || !e.gedrueckt) return
      const letzter = spur[spur.length - 1]
      if (distance(letzter, e.roh) < RADIERER_MINDESTABSTAND) return
      spur.push(e.roh)
      pruefe(k, pinselAbdruecke(letzter, e.roh, breite))
    },
    hoch(_e, k) {
      if (!spur) return
      const radierung = { punkte: vereinfachePunkte(spur, RADIERER_TOLERANZ), breite }
      const ziele = getroffen
      spur = null
      getroffen = new Set()
      k.zustand.aendere(t('katalogdialoge.symbolWerkzeuge.radieren'), (z) =>
        mitRadierung(z, ziele, radierung),
      )
    },
    taste() {
      return false
    },
    abbrechen() {
      const lief = spur !== null
      spur = null
      getroffen = new Set()
      return lief
    },
    vorschau(zeichnung) {
      return spur ? mitRadierung(zeichnung, getroffen, { punkte: spur, breite }) : zeichnung
    },
    hilfsgrafik(k) {
      if (!zeiger) return []
      const radius = (spur ? breite : SYMBOL_PINSEL_BREITE[k.einstellungen().pinsel]) / 2
      return [{ art: 'pinsel', mitte: zeiger, radius }]
    },
  }
}

export function oberstesSymbolElement(
  elemente: SymbolElement[],
  p: Point,
  toleranz: number,
): SymbolElement | null {
  for (let i = elemente.length - 1; i >= 0; i--) {
    if (abstandZuSymbolElement(elemente[i], p) <= toleranz) return elemente[i]
  }
  return null
}

type AuswahlModus =
  | { art: 'verschieben'; start: Point; dx: number; dy: number }
  | { art: 'rahmen'; start: Point; ende: Point; umschalt: boolean }
  | null

export function erzeugeSymbolAuswahlWerkzeug(): SymbolWerkzeug {
  let modus: AuswahlModus = null

  function verschobeneVorschau(zeichnung: SymbolZeichnung, auswahl: readonly string[]) {
    if (modus?.art !== 'verschieben' || (modus.dx === 0 && modus.dy === 0)) return zeichnung
    const { dx, dy } = modus
    const ids = new Set(auswahl)
    return {
      ...zeichnung,
      elemente: zeichnung.elemente.map((el) =>
        ids.has(el.id) ? verschiebeSymbolElement(el, dx, dy) : el,
      ),
    }
  }

  function rahmenBox(start: Point, ende: Point): BoundingBox {
    return boundingBoxFromPoints([start, ende])
  }

  function textVon(element: SymbolElement): { position: Point; text: string } | null {
    if (element.art === 'text') return element
    if (element.art === 'vektor' && element.form.art === 'text') return element.form
    return null
  }

  function mitText(element: SymbolElement, text: string): SymbolElement {
    if (element.art === 'text') return { ...element, text }
    if (element.art === 'vektor' && element.form.art === 'text')
      return { ...element, form: { ...element.form, text } }
    return element
  }

  function textBearbeiten(element: SymbolElement, k: SymbolWerkzeugKontext) {
    const vorher = textVon(element)
    if (!vorher) return
    k.frageText(vorher.position, vorher.text, (text) => {
      if (text === null) return
      k.zustand.aendere(t('katalogdialoge.symbolWerkzeuge.textAendern'), (z) => {
        const bereinigt = text.replace(/\s+$/, '')
        const elemente = bereinigt.trim()
          ? z.elemente.map((e) => (e.id === element.id ? mitText(e, bereinigt) : e))
          : z.elemente.filter((e) => e.id !== element.id)
        return { ...z, elemente }
      })
    })
  }

  return {
    id: 'auswahl',
    fangen: true,
    aktiviere(k) {
      modus = null
      k.setStatus(t('katalogdialoge.symbolWerkzeuge.auswahlStatus'))
    },
    runter(e, k) {
      const { zustand } = k
      const treffer = oberstesSymbolElement(zustand.zeichnung.elemente, e.roh, k.toleranz())
      if (!treffer) {
        if (!e.umschalt) zustand.setzeAuswahl([])
        modus = { art: 'rahmen', start: e.roh, ende: e.roh, umschalt: e.umschalt }
        return
      }
      if (e.doppelklick && textVon(treffer)) {
        modus = null
        textBearbeiten(treffer, k)
        return
      }
      if (e.umschalt) {
        const ausgewaehlt = zustand.auswahl.includes(treffer.id)
        zustand.setzeAuswahl(
          ausgewaehlt
            ? zustand.auswahl.filter((id) => id !== treffer.id)
            : [...zustand.auswahl, treffer.id],
        )
        modus = null
        return
      }
      if (!zustand.auswahl.includes(treffer.id)) zustand.setzeAuswahl([treffer.id])
      modus = { art: 'verschieben', start: e.punkt, dx: 0, dy: 0 }
    },
    bewegt(e) {
      if (!modus || !e.gedrueckt) return
      if (modus.art === 'verschieben') {
        modus = { ...modus, dx: e.punkt.x - modus.start.x, dy: e.punkt.y - modus.start.y }
      } else {
        modus = { ...modus, ende: e.roh }
      }
    },
    hoch(_e, k) {
      const beendet = modus
      modus = null
      if (!beendet) return
      if (beendet.art === 'verschieben') {
        const { dx, dy } = beendet
        if (dx !== 0 || dy !== 0) {
          k.zustand.aendereAuswahl(t('katalogdialoge.symbolWerkzeuge.verschieben'), (el) =>
            verschiebeSymbolElement(el, dx, dy),
          )
        }
        return
      }
      if (distance(beendet.start, beendet.ende) <= k.toleranz()) return
      const box = rahmenBox(beendet.start, beendet.ende)
      const drin = k.zustand.zeichnung.elemente
        .filter((el) => boundingBoxEnthaelt(box, symbolElementRahmen(el)))
        .map((el) => el.id)
      k.zustand.setzeAuswahl(
        beendet.umschalt ? [...new Set([...k.zustand.auswahl, ...drin])] : drin,
      )
    },
    taste(taste, k) {
      if ((taste === 'Delete' || taste === 'Backspace') && k.zustand.auswahl.length > 0) {
        k.zustand.loescheAuswahl()
        return true
      }
      return false
    },
    abbrechen(k) {
      if (modus) {
        modus = null
        return true
      }
      if (k.zustand.auswahl.length > 0) {
        k.zustand.setzeAuswahl([])
        return true
      }
      return false
    },
    vorschau(zeichnung, k) {
      return verschobeneVorschau(zeichnung, k.zustand.auswahl)
    },
    hilfsgrafik(k) {
      const ids = new Set(k.zustand.auswahl)
      const hilfen: SymbolHilfsgrafik[] = verschobeneVorschau(
        k.zustand.zeichnung,
        k.zustand.auswahl,
      )
        .elemente.filter((el) => ids.has(el.id))
        .map((el) => ({ art: 'rahmen', box: symbolElementRahmen(el), auswahl: true }))
      if (modus?.art === 'rahmen')
        hilfen.push({ art: 'rahmen', box: rahmenBox(modus.start, modus.ende) })
      return hilfen
    },
  }
}
