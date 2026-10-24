import type { BoundingBox, Point } from '../document-model'
import { boundingBoxCenter, boundingBoxSize } from '../document-model'

export const BASIS_PIXEL_PRO_METER = 100

export class ViewTransform {
  scale = BASIS_PIXEL_PRO_METER
  offset: Point = { x: 0, y: 0 }

  worldToScreen(p: Point): Point {
    return { x: p.x * this.scale + this.offset.x, y: -p.y * this.scale + this.offset.y }
  }

  screenToWorld(p: Point): Point {
    return { x: (p.x - this.offset.x) / this.scale, y: -(p.y - this.offset.y) / this.scale }
  }

  laengeToScreen(l: number): number {
    return l * this.scale
  }

  laengeToWorld(l: number): number {
    return l / this.scale
  }

  zoomFaktor(): number {
    return this.scale / BASIS_PIXEL_PRO_METER
  }

  pan(dxScreen: number, dyScreen: number) {
    this.offset = { x: this.offset.x + dxScreen, y: this.offset.y + dyScreen }
  }

  zoomAt(cursorScreen: Point, faktor: number) {
    const weltVorZoom = this.screenToWorld(cursorScreen)
    this.scale = clampScale(this.scale * faktor)
    const bildschirmNachZoom = this.worldToScreen(weltVorZoom)
    this.offset = {
      x: this.offset.x + (cursorScreen.x - bildschirmNachZoom.x),
      y: this.offset.y + (cursorScreen.y - bildschirmNachZoom.y),
    }
  }

  setZoom100(cursorScreen: Point, canvasGroesse: { breite: number; hoehe: number }) {
    const zentrum = cursorScreen ?? { x: canvasGroesse.breite / 2, y: canvasGroesse.hoehe / 2 }
    const weltVorZoom = this.screenToWorld(zentrum)
    this.scale = BASIS_PIXEL_PRO_METER
    const bildschirmNachZoom = this.worldToScreen(weltVorZoom)
    this.offset = {
      x: this.offset.x + (zentrum.x - bildschirmNachZoom.x),
      y: this.offset.y + (zentrum.y - bildschirmNachZoom.y),
    }
  }

  centerOn(punkt: Point, canvasGroesse: { breite: number; hoehe: number }) {
    this.offset = {
      x: canvasGroesse.breite / 2 - punkt.x * this.scale,
      y: canvasGroesse.hoehe / 2 + punkt.y * this.scale,
    }
  }

  fitBoundingBox(bb: BoundingBox, canvasGroesse: { breite: number; hoehe: number }, randPx = 40) {
    const { breite, hoehe } = boundingBoxSize(bb)
    const zentrum = boundingBoxCenter(bb)
    if (breite <= 0 && hoehe <= 0) {
      this.scale = BASIS_PIXEL_PRO_METER
    } else {
      const verfuegbarBreite = Math.max(1, canvasGroesse.breite - randPx * 2)
      const verfuegbarHoehe = Math.max(1, canvasGroesse.hoehe - randPx * 2)
      const skalaX = breite > 0 ? verfuegbarBreite / breite : Infinity
      const skalaY = hoehe > 0 ? verfuegbarHoehe / hoehe : Infinity
      this.scale = clampScale(Math.min(skalaX, skalaY, BASIS_PIXEL_PRO_METER * 50))
    }
    this.offset = {
      x: canvasGroesse.breite / 2 - zentrum.x * this.scale,
      y: canvasGroesse.hoehe / 2 + zentrum.y * this.scale,
    }
  }
}

function clampScale(scale: number): number {
  const MIN = BASIS_PIXEL_PRO_METER * 0.005
  const MAX = BASIS_PIXEL_PRO_METER * 200
  return Math.min(MAX, Math.max(MIN, scale))
}
