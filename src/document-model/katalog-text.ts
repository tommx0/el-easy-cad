import type { KatalogTextElement } from './catalog'

export interface TextElementPosition {
  x: number
  y: number
}

export function ermittleTextElementPosition(
  element: Pick<KatalogTextElement, 'xAnteil' | 'yAnteil'>,
  halbXPx: number,
  halbYPx: number,
): TextElementPosition {
  return {
    x: -halbXPx + element.xAnteil * 2 * halbXPx,
    y: halbYPx - element.yAnteil * 2 * halbYPx,
  }
}

export interface TextElementAnker extends TextElementPosition {
  ausrichtungHorizontal: KatalogTextElement['ausrichtungHorizontal']
  ausrichtungVertikal: KatalogTextElement['ausrichtungVertikal']
  zeichenDrehung: number
}

const GEGENUEBER_H = { links: 'rechts', mittig: 'mittig', rechts: 'links' } as const
const GEGENUEBER_V = { oben: 'unten', mittig: 'mittig', unten: 'oben' } as const

export function ermittleZeichenDrehung(
  element: Pick<KatalogTextElement, 'drehung' | 'fixiert' | 'variable'>,
  drehung: number,
): { winkel: number; gewendet: boolean } {
  const vollkreis = 2 * Math.PI
  if (istFixierterText(element)) {
    const gesamt = ((element.drehung ?? 0) * Math.PI) / 180 + drehung
    const normiert = ((gesamt % vollkreis) + vollkreis) % vollkreis
    const winkel = normiert > Math.PI + UNGEDREHT_TOLERANZ ? normiert - vollkreis : normiert
    return { winkel: Math.abs(winkel) < UNGEDREHT_TOLERANZ ? 0 : winkel, gewendet: false }
  }
  if (element.drehung === undefined) return { winkel: 0, gewendet: false }
  const gesamt = (element.drehung * Math.PI) / 180 + drehung
  const normiert = ((gesamt % vollkreis) + vollkreis) % vollkreis
  const gewendet =
    normiert > Math.PI / 2 + UNGEDREHT_TOLERANZ &&
    normiert <= (3 * Math.PI) / 2 + UNGEDREHT_TOLERANZ
  const winkel = gewendet
    ? normiert - Math.PI
    : normiert > Math.PI
      ? normiert - vollkreis
      : normiert
  return { winkel: Math.abs(winkel) < UNGEDREHT_TOLERANZ ? 0 : winkel, gewendet }
}

export function istFixierterText(
  element: Pick<KatalogTextElement, 'fixiert' | 'variable'>,
): boolean {
  return element.fixiert === true && element.variable !== undefined
}

const UNGEDREHT_TOLERANZ = 1e-6

export function ermittleTextElementAnker(
  element: KatalogTextElement,
  drehung: number,
  halbXPx: number,
  halbYPx: number,
  bezugHoehePx: number = 2 * halbYPx,
): TextElementAnker {
  const vollkreis = 2 * Math.PI
  const normiert = ((drehung % vollkreis) + vollkreis) % vollkreis
  const gedreht = normiert > UNGEDREHT_TOLERANZ && vollkreis - normiert > UNGEDREHT_TOLERANZ
  const fixiert = istFixierterText(element)
  const variante = gedreht && !fixiert ? element.beiDrehung : undefined
  const lokal = ermittleTextElementPosition(
    variante ? { xAnteil: variante.bezugXAnteil, yAnteil: variante.bezugYAnteil } : element,
    halbXPx,
    halbYPx,
  )
  const cos = Math.cos(drehung)
  const sin = Math.sin(drehung)
  const x = lokal.x * cos + lokal.y * sin
  const y = -lokal.x * sin + lokal.y * cos
  const hoehe = bezugHoehePx
  const { winkel, gewendet } = ermittleZeichenDrehung(element, drehung)
  const ausrichtung = (
    h: KatalogTextElement['ausrichtungHorizontal'],
    v: KatalogTextElement['ausrichtungVertikal'],
  ) => ({
    ausrichtungHorizontal: gewendet ? GEGENUEBER_H[h] : h,
    ausrichtungVertikal: gewendet ? GEGENUEBER_V[v] : v,
    zeichenDrehung: winkel,
  })
  if (!variante) {
    const versatz = fixiert ? undefined : element.bildschirmVersatz
    return {
      x: x + (versatz?.x ?? 0) * hoehe,
      y: y + (versatz?.y ?? 0) * hoehe,
      ...ausrichtung(element.ausrichtungHorizontal, element.ausrichtungVertikal),
    }
  }
  return {
    x: x + variante.versatzX * hoehe,
    y: y + variante.versatzY * hoehe,
    ...ausrichtung(variante.ausrichtungHorizontal, variante.ausrichtungVertikal),
  }
}
