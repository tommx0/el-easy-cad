import { bogenAlsKubisch, type P } from './geometrie'
import type { PfadSegment } from './modell'

const ZAHL = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y

class PfadLeser {
  private i = 0
  private readonly d: string
  constructor(d: string) {
    this.d = d
  }

  private leerzeichen() {
    while (this.i < this.d.length && /[\s,]/.test(this.d[this.i])) this.i++
  }

  ende(): boolean {
    this.leerzeichen()
    return this.i >= this.d.length
  }

  befehl(): string | null {
    this.leerzeichen()
    const c = this.d[this.i]
    if (c && /[MmLlHhVvCcSsQqTtAaZz]/.test(c)) {
      this.i++
      return c
    }
    return null
  }

  zahl(): number {
    this.leerzeichen()
    ZAHL.lastIndex = this.i
    const t = ZAHL.exec(this.d)
    if (!t) throw new Error(`Unlesbare Pfaddaten bei "${this.d.slice(this.i, this.i + 12)}".`)
    this.i = ZAHL.lastIndex
    return parseFloat(t[0])
  }

  flag(): number {
    this.leerzeichen()
    const c = this.d[this.i]
    if (c !== '0' && c !== '1') throw new Error('Pfaddaten: Bogen-Flag erwartet.')
    this.i++
    return c === '1' ? 1 : 0
  }
}

export function svgBogen(
  von: P,
  rxEin: number,
  ryEin: number,
  drehungGrad: number,
  grossBogen: boolean,
  imUhrzeigersinn: boolean,
  nach: P,
): { c1: P; c2: P; p: P }[] {
  if (von.x === nach.x && von.y === nach.y) return []
  let rx = Math.abs(rxEin)
  let ry = Math.abs(ryEin)
  if (rx === 0 || ry === 0) return [{ c1: von, c2: nach, p: nach }]
  const phi = (drehungGrad * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (von.x - nach.x) / 2
  const dy = (von.y - nach.y) / 2
  const x1 = cos * dx + sin * dy
  const y1 = -sin * dx + cos * dy
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }
  const zaehler = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1
  const nenner = rx * rx * y1 * y1 + ry * ry * x1 * x1
  let faktor = Math.sqrt(Math.max(0, zaehler / nenner))
  if (grossBogen === imUhrzeigersinn) faktor = -faktor
  const cx1 = (faktor * rx * y1) / ry
  const cy1 = (-faktor * ry * x1) / rx
  const mitte = {
    x: cos * cx1 - sin * cy1 + (von.x + nach.x) / 2,
    y: sin * cx1 + cos * cy1 + (von.y + nach.y) / 2,
  }
  const winkel = (ux: number, uy: number, vx: number, vy: number) => {
    const w = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    return (w * 180) / Math.PI
  }
  const start = winkel(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry)
  let spanne = winkel((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry)
  if (!imUhrzeigersinn && spanne > 0) spanne -= 360
  if (imUhrzeigersinn && spanne < 0) spanne += 360
  const stuecke = bogenAlsKubisch(mitte, rx, ry, drehungGrad, start, spanne)
  if (stuecke.length > 0) stuecke[stuecke.length - 1] = { ...stuecke[stuecke.length - 1], p: nach }
  return stuecke
}

export function lesePfad(d: string): PfadSegment[] {
  const leser = new PfadLeser(d)
  const segmente: PfadSegment[] = []
  let befehl = ''
  let aktuell: P = { x: 0, y: 0 }
  let start: P = { x: 0, y: 0 }
  let letzteSteuerung: P | null = null
  let letzteArt: 'C' | 'Q' | null = null

  const zahl = () => leser.zahl()
  const punkt = (relativ: boolean): P => {
    const x = zahl()
    const y = zahl()
    return relativ ? { x: aktuell.x + x, y: aktuell.y + y } : { x, y }
  }

  while (!leser.ende()) {
    const neu = leser.befehl()
    if (neu) befehl = neu
    else if (!befehl) throw new Error('Pfaddaten beginnen ohne Befehl.')
    else if (befehl === 'Z' || befehl === 'z') throw new Error('Pfaddaten: Zahl nach Z.')
    const relativ = befehl === befehl.toLowerCase()
    const art = befehl.toUpperCase()
    let neueArt: 'C' | 'Q' | null = null
    let neueSteuerung: P | null = null
    switch (art) {
      case 'M': {
        const p = punkt(relativ)
        segmente.push({ typ: 'M', p })
        aktuell = p
        start = p
        befehl = relativ ? 'l' : 'L'
        break
      }
      case 'L': {
        const p = punkt(relativ)
        segmente.push({ typ: 'L', p })
        aktuell = p
        break
      }
      case 'H': {
        const x = zahl()
        const p = { x: relativ ? aktuell.x + x : x, y: aktuell.y }
        segmente.push({ typ: 'L', p })
        aktuell = p
        break
      }
      case 'V': {
        const y = zahl()
        const p = { x: aktuell.x, y: relativ ? aktuell.y + y : y }
        segmente.push({ typ: 'L', p })
        aktuell = p
        break
      }
      case 'C': {
        const c1 = punkt(relativ)
        const c2 = punkt(relativ)
        const p = punkt(relativ)
        segmente.push({ typ: 'C', c1, c2, p })
        aktuell = p
        neueArt = 'C'
        neueSteuerung = c2
        break
      }
      case 'S': {
        const c1: P =
          letzteArt === 'C' && letzteSteuerung
            ? { x: 2 * aktuell.x - letzteSteuerung.x, y: 2 * aktuell.y - letzteSteuerung.y }
            : aktuell
        const c2 = punkt(relativ)
        const p = punkt(relativ)
        segmente.push({ typ: 'C', c1, c2, p })
        aktuell = p
        neueArt = 'C'
        neueSteuerung = c2
        break
      }
      case 'Q': {
        const c = punkt(relativ)
        const p = punkt(relativ)
        segmente.push({ typ: 'Q', c, p })
        aktuell = p
        neueArt = 'Q'
        neueSteuerung = c
        break
      }
      case 'T': {
        const c: P =
          letzteArt === 'Q' && letzteSteuerung
            ? { x: 2 * aktuell.x - letzteSteuerung.x, y: 2 * aktuell.y - letzteSteuerung.y }
            : aktuell
        const p = punkt(relativ)
        segmente.push({ typ: 'Q', c, p })
        aktuell = p
        neueArt = 'Q'
        neueSteuerung = c
        break
      }
      case 'A': {
        const rx = zahl()
        const ry = zahl()
        const dreh = zahl()
        const gross = leser.flag()
        const uhr = leser.flag()
        const x = zahl()
        const y = zahl()
        const p = relativ ? { x: aktuell.x + x, y: aktuell.y + y } : { x, y }
        for (const k of svgBogen(aktuell, rx, ry, dreh, gross !== 0, uhr !== 0, p)) {
          segmente.push({ typ: 'C', ...k })
        }
        aktuell = p
        break
      }
      case 'Z':
        segmente.push({ typ: 'Z' })
        aktuell = start
        break
      default:
        throw new Error(`Unbekannter Pfadbefehl "${befehl}".`)
    }
    letzteArt = neueArt
    letzteSteuerung = neueSteuerung
  }
  return segmente
}
