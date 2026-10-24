import type { Punkt3 } from '../ifc/export-modell'

export const AUGENHOEHE_METER = 1.6
export const GEHTEMPO_METER_PRO_SEKUNDE = 1.5
export const SCHNELL_FAKTOR = 4
export const RAD_SCHRITT_METER = 0.5
export const GRAD_PRO_PIXEL = 0.25
export const NEIGUNG_GRENZE_GRAD = 85
export const DREHPUNKT_ABSTAND_METER = 5

const RAD = Math.PI / 180

export interface BegehenBlick {
  gier: number
  neigung: number
}

export interface BegehenEingabe {
  vor: number
  seitlich: number
  hoch: number
}

export const KEINE_BEWEGUNG: BegehenEingabe = { vor: 0, seitlich: 0, hoch: 0 }

export type BegehenRichtung = 'vor' | 'zurueck' | 'links' | 'rechts' | 'hoch' | 'runter'

export function eingabeAusRichtungen(richtungen: Iterable<BegehenRichtung>): BegehenEingabe {
  const r = new Set(richtungen)
  const achse = (plus: BegehenRichtung, minus: BegehenRichtung) =>
    (r.has(plus) ? 1 : 0) - (r.has(minus) ? 1 : 0)
  return {
    vor: achse('vor', 'zurueck'),
    seitlich: achse('rechts', 'links'),
    hoch: achse('hoch', 'runter'),
  }
}

export function istBewegung(e: BegehenEingabe): boolean {
  return e.vor !== 0 || e.seitlich !== 0 || e.hoch !== 0
}

function begrenzeNeigung(neigung: number): number {
  const grenze = NEIGUNG_GRENZE_GRAD * RAD
  return Math.max(-grenze, Math.min(grenze, neigung))
}

export function blickRichtung(b: BegehenBlick): Punkt3 {
  const waagerecht = Math.cos(b.neigung)
  return {
    x: waagerecht * Math.cos(b.gier),
    y: waagerecht * Math.sin(b.gier),
    z: Math.sin(b.neigung),
  }
}

export function blickAusRichtung(r: Punkt3, gierRueckfall = Math.PI / 2): BegehenBlick {
  const waagerecht = Math.hypot(r.x, r.y)
  return {
    gier: waagerecht < 1e-9 ? gierRueckfall : Math.atan2(r.y, r.x),
    neigung: begrenzeNeigung(Math.atan2(r.z, waagerecht)),
  }
}

export function dreheBlick(b: BegehenBlick, dxPixel: number, dyPixel: number): BegehenBlick {
  return {
    gier: b.gier - dxPixel * GRAD_PRO_PIXEL * RAD,
    neigung: begrenzeNeigung(b.neigung - dyPixel * GRAD_PRO_PIXEL * RAD),
  }
}

export function schritt(
  position: Punkt3,
  blick: BegehenBlick,
  eingabe: BegehenEingabe,
  sekunden: number,
  schnell: boolean,
): Punkt3 {
  const weg = GEHTEMPO_METER_PRO_SEKUNDE * (schnell ? SCHNELL_FAKTOR : 1) * sekunden
  const cos = Math.cos(blick.gier)
  const sin = Math.sin(blick.gier)
  let dx = eingabe.vor * cos + eingabe.seitlich * sin
  let dy = eingabe.vor * sin - eingabe.seitlich * cos
  const laenge = Math.hypot(dx, dy)
  if (laenge > 1) {
    dx /= laenge
    dy /= laenge
  }
  return {
    x: position.x + dx * weg,
    y: position.y + dy * weg,
    z: position.z + Math.sign(eingabe.hoch) * weg,
  }
}

export function radSchritt(
  position: Punkt3,
  blick: BegehenBlick,
  raster: number,
  schnell: boolean,
): Punkt3 {
  const weg = RAD_SCHRITT_METER * (schnell ? SCHNELL_FAKTOR : 1) * raster
  return {
    x: position.x + Math.cos(blick.gier) * weg,
    y: position.y + Math.sin(blick.gier) * weg,
    z: position.z,
  }
}

export function einstiegsStandpunkt(drehpunkt: Punkt3, koten: readonly number[]): Punkt3 {
  const darunter = koten.filter((k) => k <= drehpunkt.z + 0.01)
  const boden =
    darunter.length > 0 ? Math.max(...darunter) : koten.length > 0 ? Math.min(...koten) : 0
  return { x: drehpunkt.x, y: drehpunkt.y, z: boden + AUGENHOEHE_METER }
}
