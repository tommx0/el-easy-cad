import type { DockpunkteKonfiguration } from './catalog'
import { rotatePoint } from './geometry'
import type { Blatt } from './blatt'
import type { KomponentenObjekt, Objekt } from './objekte'
import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'

export const STANDARD_KLEMMENLEISTE = 'X1'

const LEITER_NAMEN: ReadonlySet<string> = new Set(['L', 'L1', 'L2', 'L3', 'N', 'PE'])

export function istKlemmenKennzeichen(kennzeichen: string | undefined): boolean {
  const k = kennzeichen?.trim()
  return !!k && /^[A-Za-z]+/.exec(k)?.[0] === 'X'
}

export function istKlemme(o: Pick<KomponentenObjekt, 'geraeteKennzeichen'>): boolean {
  return istKlemmenKennzeichen(o.geraeteKennzeichen)
}

function polNamen(konfiguration: DockpunkteKonfiguration | undefined): string[] {
  if (konfiguration?.modus !== 'frei') return []
  const namen: string[] = []
  for (const p of konfiguration.punkte) {
    const name = p.trunk ? '' : (p.bezeichnung?.trim() ?? '')
    if (name && !namen.includes(name)) namen.push(name)
  }
  return namen
}

export function istLeitersatz(konfiguration: DockpunkteKonfiguration | undefined): boolean {
  const namen = polNamen(konfiguration)
  return namen.length > 0 && namen.every((n) => LEITER_NAMEN.has(n))
}

export function klemmenZahl(text: string | undefined): number | null {
  const t = text?.trim()
  return t && /^\d+$/.test(t) ? Number(t) : null
}

export function klemmenPolAnzahl(konfiguration: DockpunkteKonfiguration | undefined): number {
  return istLeitersatz(konfiguration) ? 1 : Math.max(1, polNamen(konfiguration).length)
}

export function klemmenNummernVon(
  o: Pick<KomponentenObjekt, 'dockpunkte' | 'klemmenNummer'>,
): number[] {
  if (istLeitersatz(o.dockpunkte)) {
    const n = klemmenZahl(o.klemmenNummer)
    return n === null ? [] : [n]
  }
  return polNamen(o.dockpunkte)
    .map(klemmenZahl)
    .filter((n): n is number => n !== null)
}

export function ersteKlemmenNummer(
  o: Pick<KomponentenObjekt, 'dockpunkte' | 'klemmenNummer'>,
): string | null {
  if (istLeitersatz(o.dockpunkte)) return o.klemmenNummer?.trim() || null
  return polNamen(o.dockpunkte)[0] ?? null
}

export interface KlemmenBelegung {
  blattId: string
  blattName: string
  objektId: string
}

export function belegteKlemmenNummern(
  zeichnung: { blaetter: readonly Pick<Blatt, 'id' | 'name' | 'objekte'>[] },
  leiste: string,
  ohne: ReadonlySet<string> = new Set(),
): Map<number, KlemmenBelegung> {
  const belegt = new Map<number, KlemmenBelegung>()
  const kennzeichen = leiste.trim()
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente' || ohne.has(o.id)) continue
      if (o.geraeteKennzeichen?.trim() !== kennzeichen) continue
      for (const n of klemmenNummernVon(o))
        if (!belegt.has(n))
          belegt.set(n, { blattId: blatt.id, blattName: blatt.name, objektId: o.id })
    }
  }
  return belegt
}

export function klemmenNummerVergeben(
  zeichnung: { blaetter: readonly Pick<Blatt, 'id' | 'name' | 'objekte'>[] },
  objekt: Pick<KomponentenObjekt, 'id' | 'geraeteKennzeichen'>,
  nummern: readonly number[],
): string | null {
  const leiste = objekt.geraeteKennzeichen?.trim()
  if (!leiste) return null
  const belegt = belegteKlemmenNummern(zeichnung, leiste, new Set([objekt.id]))
  const n = nummern.find((x) => belegt.has(x))
  return n === undefined
    ? null
    : t('beschriftung.klemmen.vergeben', {
        nummer: `${leiste}:${n}`,
        blatt: belegt.get(n)!.blattName,
      })
}

export function naechsteKlemmenNummer(belegt: Iterable<number>): number {
  let hoechste = 0
  for (const n of belegt) if (n > hoechste) hoechste = n
  return hoechste + 1
}

export function klemmeNummeriert<
  T extends Pick<KomponentenObjekt, 'dockpunkte' | 'klemmenNummer' | 'geraeteKennzeichen'>,
>(o: T, leiste: string, start: number): T {
  if (istLeitersatz(o.dockpunkte)) {
    return { ...o, geraeteKennzeichen: leiste, klemmenNummer: String(start) }
  }
  const konfiguration = o.dockpunkte
  if (konfiguration?.modus !== 'frei') return { ...o, geraeteKennzeichen: leiste }
  const neu = new Map<string, string>()
  let n = start
  for (const name of polNamen(konfiguration)) {
    if (klemmenZahl(name) === null) continue
    neu.set(name, String(n++))
  }
  return {
    ...o,
    geraeteKennzeichen: leiste,
    dockpunkte: {
      ...konfiguration,
      punkte: konfiguration.punkte.map((p) => {
        const name = p.trunk ? undefined : p.bezeichnung?.trim()
        const ersatz = name ? neu.get(name) : undefined
        return ersatz ? { ...p, bezeichnung: ersatz } : p
      }),
    },
  }
}

export function klemmenNummernAb(
  o: Pick<KomponentenObjekt, 'dockpunkte' | 'klemmenNummer'>,
  start: number,
): number[] {
  if (istLeitersatz(o.dockpunkte)) return [start]
  const anzahl = polNamen(o.dockpunkte).filter((n) => klemmenZahl(n) !== null).length
  return Array.from({ length: anzahl }, (_, i) => start + i)
}

export function klemmenAnschlussText(
  o: Pick<KomponentenObjekt, 'dockpunkte' | 'klemmenNummer' | 'geraeteKennzeichen'>,
  bezeichnung: string,
  uebersetze: Uebersetzer = t,
): string {
  const kennzeichen = o.geraeteKennzeichen?.trim()
  const nummer = istLeitersatz(o.dockpunkte) ? o.klemmenNummer?.trim() : undefined
  const anschluss = nummer ? `${nummer} ${bezeichnung}` : bezeichnung
  return kennzeichen
    ? `${kennzeichen}:${anschluss}`
    : uebersetze('beschriftung.leitungsende.anschluss', { anschluss })
}

export function klemmenKennzeichenZeile(
  o: Pick<KomponentenObjekt, 'dockpunkte' | 'klemmenNummer' | 'geraeteKennzeichen'>,
  inReihe: boolean,
): string | null {
  const kennzeichen = o.geraeteKennzeichen?.trim()
  if (!kennzeichen) return null
  const nummer = istLeitersatz(o.dockpunkte) ? o.klemmenNummer?.trim() : undefined
  if (inReihe) return nummer ?? null
  return nummer ? `-${kennzeichen}:${nummer}` : `-${kennzeichen}`
}

const WINKEL_EPS = 1e-6

function gleicheDrehung(a: number, b: number): boolean {
  const d = (((a - b) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  return d < WINKEL_EPS || 2 * Math.PI - d < WINKEL_EPS
}

export function klemmeFolgtInReihe(o: KomponentenObjekt, objekte: readonly Objekt[]): boolean {
  const kennzeichen = o.geraeteKennzeichen?.trim()
  if (!kennzeichen || !istKlemmenKennzeichen(kennzeichen)) return false
  const breite = o.breiteWelt ?? o.groesseWelt
  const hoehe = o.groesseWelt
  const toleranz = hoehe * 0.1
  for (const n of objekte) {
    if (n.type !== 'komponente' || n.id === o.id) continue
    if (n.geraeteKennzeichen?.trim() !== kennzeichen || !gleicheDrehung(n.drehung, o.drehung))
      continue
    const lokal = rotatePoint(n.position, o.position, -o.drehung)
    const dx = lokal.x - o.position.x
    const dy = lokal.y - o.position.y
    const nBreite = n.breiteWelt ?? n.groesseWelt
    const luecke = -breite / 2 - (dx + nBreite / 2)
    const oberkante = dy + n.groesseWelt / 2 - hoehe / 2
    if (luecke >= -toleranz && luecke <= hoehe / 2 && Math.abs(oberkante) <= toleranz) return true
  }
  return false
}

export interface KlemmeImBlatt {
  blattId: string
  objekt: KomponentenObjekt
}

export function klemmenleisteNeuNummeriert(
  zeichnung: { blaetter: readonly Pick<Blatt, 'id' | 'objekte'>[] },
  leiste: string,
): KlemmeImBlatt[] {
  const kennzeichen = leiste.trim()
  const ergebnis: KlemmeImBlatt[] = []
  let n = 1
  for (const blatt of zeichnung.blaetter) {
    const klemmen = blatt.objekte
      .filter(
        (o): o is KomponentenObjekt =>
          o.type === 'komponente' && o.geraeteKennzeichen?.trim() === kennzeichen,
      )
      .sort((a, b) => {
        const oben = (o: KomponentenObjekt) => Math.round((o.position.y + o.groesseWelt / 2) * 100)
        return oben(b) - oben(a) || a.position.x - b.position.x
      })
    for (const o of klemmen) {
      const nummern = klemmenNummernAb(o, n)
      if (nummern.length === 0) continue
      n += nummern.length
      const neu = klemmeNummeriert(o, kennzeichen, nummern[0])
      const vorher = klemmenNummernVon(o)
      if (vorher.length !== nummern.length || vorher.some((v, i) => v !== nummern[i]))
        ergebnis.push({ blattId: blatt.id, objekt: neu })
    }
  }
  return ergebnis
}
