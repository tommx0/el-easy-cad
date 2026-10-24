import type { Blatt } from './blatt'
import type { Point } from './geometry'
import { hintergrundDrehungVon } from './hintergrund-lage'
import type { Objekt } from './objekte'

export type AusrichtungsStand = 'bereit' | 'ohne-nullpunkt' | 'ohne-richtung' | 'ausgerichtet'

export function ausrichtungsStand(
  blatt: Pick<Blatt, 'nullpunkt' | 'nullpunktRichtung'>,
): AusrichtungsStand {
  if (!blatt.nullpunkt) return 'ohne-nullpunkt'
  if (blatt.nullpunktRichtung === undefined) return 'ohne-richtung'
  const { x, y } = blatt.nullpunkt
  return Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9 && Math.abs(blatt.nullpunktRichtung) < 1e-12
    ? 'ausgerichtet'
    : 'bereit'
}

function normiere(winkel: number): number {
  let w = winkel % (2 * Math.PI)
  if (w <= -Math.PI) w += 2 * Math.PI
  if (w > Math.PI) w -= 2 * Math.PI
  return Math.abs(w) < 1e-12 ? 0 : w
}

export function richteBlattAus(blatt: Blatt): Blatt {
  if (ausrichtungsStand(blatt) !== 'bereit') return blatt
  const nullpunkt = blatt.nullpunkt!
  const winkel = -blatt.nullpunktRichtung!
  const cos = Math.cos(winkel)
  const sin = Math.sin(winkel)
  const bewege = (p: Point): Point => {
    const dx = p.x - nullpunkt.x
    const dy = p.y - nullpunkt.y
    return { x: dx * cos - dy * sin, y: dx * sin + dy * cos }
  }
  const verschiebe = (p: Point): Point => ({ x: p.x - nullpunkt.x, y: p.y - nullpunkt.y })
  const drehung = normiere(hintergrundDrehungVon(blatt) + winkel)
  const { hintergrundDrehung: _alt, ...ohneDrehung } = blatt
  return {
    ...ohneDrehung,
    ...(drehung !== 0 ? { hintergrundDrehung: drehung } : {}),
    ursprung: bewege(blatt.ursprung),
    nullpunkt: { x: 0, y: 0 },
    nullpunktRichtung: 0,
    zeichenflaeche: blatt.zeichenflaeche
      ? { ...blatt.zeichenflaeche, ursprung: verschiebe(blatt.zeichenflaeche.ursprung) }
      : null,
    objekte: blatt.objekte.map((o) => bewegeObjekt(o, bewege, verschiebe, winkel)),
  }
}

function bewegeRechteck<
  T extends { ursprung: Point; breite: number; hoehe: number; drehung: number },
>(o: T, bewege: (p: Point) => Point, winkel: number): T {
  const mitte = bewege({ x: o.ursprung.x + o.breite / 2, y: o.ursprung.y + o.hoehe / 2 })
  return {
    ...o,
    ursprung: { x: mitte.x - o.breite / 2, y: mitte.y - o.hoehe / 2 },
    drehung: o.drehung + winkel,
  }
}

function bewegeObjekt(
  o: Objekt,
  bewege: (p: Point) => Point,
  verschiebe: (p: Point) => Point,
  winkel: number,
): Objekt {
  switch (o.type) {
    case 'linie':
    case 'bemassung':
      return { ...o, start: bewege(o.start), ende: bewege(o.ende) }
    case 'polylinie':
    case 'wand':
    case 'bodenplatte':
      return { ...o, punkte: o.punkte.map(bewege) }
    case 'bemassungsreihe':
      return { ...o, punkte: o.punkte.map(bewege), winkel: o.winkel + winkel }
    case 'schraffur':
      return { ...o, kontur: o.kontur.map(bewege) }
    case 'kreis':
      return { ...o, mittelpunkt: bewege(o.mittelpunkt) }
    case 'bogen':
      return {
        ...o,
        mittelpunkt: bewege(o.mittelpunkt),
        startWinkel: o.startWinkel + winkel,
        endWinkel: o.endWinkel + winkel,
      }
    case 'ellipse':
    case 'polygon':
      return { ...o, mittelpunkt: bewege(o.mittelpunkt), drehung: o.drehung + winkel }
    case 'rechteck':
    case 'kabelschacht':
    case 'treppe':
      return bewegeRechteck(o, bewege, winkel)
    case 'komponente':
    case 'potential':
      return { ...o, position: bewege(o.position), drehung: o.drehung + winkel }
    case 'punkt':
    case 'knotenpunkt':
    case 'text':
      return { ...o, position: bewege(o.position) }
    case 'tuer':
    case 'fenster':
    case 'wanddurchbruch':
      return { ...o, position: bewege(o.position), richtung: o.richtung + winkel }
    case 'raum':
      return {
        ...o,
        punktImRaum: bewege(o.punktImRaum),
        mittelpunkt: bewege(o.mittelpunkt),
        umriss: o.umriss.map(bewege),
      }
    case 'leitung':
      return {
        ...o,
        pfadSegmente: o.pfadSegmente.map((s) => s.map(bewege)),
        ...(o.teilstueckZonen
          ? {
              teilstueckZonen: o.teilstueckZonen.map((e) => ({
                ...e,
                von: bewege(e.von),
                bis: bewege(e.bis),
              })),
            }
          : {}),
      }
    case 'trunk':
    case 'schaltverbindung':
      return { ...o, wegpunkte: o.wegpunkte.map(bewege) }
    case 'stueckliste':
    case 'leitungsliste':
    case 'switchplan':
    case 'trunkliste':
    case 'raumliste':
    case 'betriebsmittelliste':
    case 'stromkreisverzeichnis':
    case 'aktorkanalliste':
    case 'potentialliste':
    case 'steuerungslogik':
    case 'leitungsbaum':
    case 'plankopf':
      return { ...o, position: verschiebe(o.position) }
  }
}
