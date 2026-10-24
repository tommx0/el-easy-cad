import type { Blatt } from './blatt'
import type { Point } from './geometry'
import { ermittleNetzfeld } from './koordinatennetz'
import type { SchaltverbindungObjekt } from './objekte'
import type { Zeichnung } from './zeichnung'

export interface Blattverweis {
  anfang?: string
  ende?: string
  unterbrechung?: string
}

function istVerweisLeitung(o: Blatt['objekte'][number]): o is SchaltverbindungObjekt {
  return o.type === 'schaltverbindung' && o.blattverweis === true && !!o.bezeichnung
}

export function verweisEnden(s: SchaltverbindungObjekt): { links: Point; rechts: Point } {
  const a = s.wegpunkte[0]
  const b = s.wegpunkte[s.wegpunkte.length - 1]
  return a.x <= b.x ? { links: a, rechts: b } : { links: b, rechts: a }
}

export function formatiereBlattverweis(blattNummer: number, blatt: Blatt, p: Point): string {
  const feld = blatt.zeichenflaeche ? ermittleNetzfeld(blatt.zeichenflaeche, p) : null
  return feld ? `/${blattNummer}.${feld.spalte}` : `/${blattNummer}`
}

export function ermittleBlattverweise(zeichnung: Zeichnung): Map<string, Blattverweis> {
  const ergebnis = new Map<string, Blattverweis>()
  const jeBlatt = zeichnung.blaetter.map((blatt) => {
    const leitungen = new Map<string, SchaltverbindungObjekt[]>()
    for (const o of blatt.objekte) {
      if (!istVerweisLeitung(o)) continue
      leitungen.set(o.bezeichnung!, [...(leitungen.get(o.bezeichnung!) ?? []), o])
    }
    return leitungen
  })
  const linkesteVon = (liste: readonly SchaltverbindungObjekt[]) =>
    Math.min(...liste.map((s) => verweisEnden(s).links.x))
  const rechtesteVon = (liste: readonly SchaltverbindungObjekt[]) =>
    Math.max(...liste.map((s) => verweisEnden(s).rechts.x))
  jeBlatt.forEach((leitungen, i) => {
    for (const [name, liste] of leitungen) {
      let anfang: string | undefined
      for (let j = i - 1; j >= 0 && anfang === undefined; j--) {
        const davor = jeBlatt[j].get(name)
        if (!davor) continue
        const s = davor.find((d) => verweisEnden(d).rechts.x === rechtesteVon(davor))!
        anfang = formatiereBlattverweis(j + 1, zeichnung.blaetter[j], verweisEnden(s).rechts)
      }
      let ende: string | undefined
      for (let j = i + 1; j < jeBlatt.length && ende === undefined; j++) {
        const danach = jeBlatt[j].get(name)
        if (!danach) continue
        const s = danach.find((d) => verweisEnden(d).links.x === linkesteVon(danach))!
        ende = formatiereBlattverweis(j + 1, zeichnung.blaetter[j], verweisEnden(s).links)
      }
      if (anfang === undefined && ende === undefined) continue
      const links = liste.find((s) => verweisEnden(s).links.x === linkesteVon(liste))!
      const rechts = liste.find((s) => verweisEnden(s).rechts.x === rechtesteVon(liste))!
      if (anfang !== undefined) ergebnis.set(links.id, { ...ergebnis.get(links.id), anfang })
      if (ende !== undefined) ergebnis.set(rechts.id, { ...ergebnis.get(rechts.id), ende })
    }
  })
  return ergebnis
}

export function unterbrechungsEnde(
  s: Pick<SchaltverbindungObjekt, 'wegpunkte' | 'start' | 'ziel'>,
): { punkt: Point; richtung: Point } | null {
  const w = s.wegpunkte
  if (w.length < 2) return null
  const richtung = (aussen: Point, innen: Point): Point => {
    const dx = aussen.x - innen.x
    const dy = aussen.y - innen.y
    const l = Math.hypot(dx, dy) || 1
    return { x: dx / l, y: dy / l }
  }
  if (s.ziel.art === 'frei')
    return { punkt: w[w.length - 1], richtung: richtung(w[w.length - 1], w[w.length - 2]) }
  if (s.start.art === 'frei') return { punkt: w[0], richtung: richtung(w[0], w[1]) }
  return null
}

function istUnterbrechung(o: Blatt['objekte'][number]): o is SchaltverbindungObjekt {
  return o.type === 'schaltverbindung' && o.unterbrechung !== undefined && !!o.bezeichnung?.trim()
}

export function ermittleUnterbrechungsVerweise(zeichnung: Zeichnung): Map<string, string> {
  const alle = zeichnung.blaetter.flatMap((blatt, i) =>
    blatt.objekte.filter(istUnterbrechung).map((s) => ({ s, blatt, nummer: i + 1 })),
  )
  const ergebnis = new Map<string, string>()
  for (const eigen of alle) {
    const gesucht = eigen.s.unterbrechung === 'quelle' ? 'ziel' : 'quelle'
    const gegen = alle.filter(
      (a) =>
        a.blatt !== eigen.blatt &&
        a.s.unterbrechung === gesucht &&
        a.s.bezeichnung!.trim() === eigen.s.bezeichnung!.trim(),
    )
    const texte = [
      ...new Set(
        gegen.flatMap((a) => {
          const ende = unterbrechungsEnde(a.s)
          return ende ? [formatiereBlattverweis(a.nummer, a.blatt, ende.punkt)] : []
        }),
      ),
    ]
    if (texte.length > 0) ergebnis.set(eigen.s.id, texte.join(', '))
  }
  return ergebnis
}
