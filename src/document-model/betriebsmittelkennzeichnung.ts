import { istKlemme } from './klemmen'
import { ermittleOrt } from './koordinatennetz'
import { knxAktorArtVonKatalogId } from './knx-aktor'
import type { KomponentenObjekt } from './objekte'
import type { Zeichnung } from './zeichnung'
import { planUebersetzer } from './plansprache'
import type { Uebersetzer } from '../sprache'

export function belegteKennzeichenZahlen(zeichnung: Zeichnung, buchstabe: string): Set<number> {
  const belegte = new Set<number>()
  const muster = new RegExp(`^${buchstabe}(\\d+)$`)
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente' || !objekt.geraeteKennzeichen) continue
      const treffer = muster.exec(objekt.geraeteKennzeichen)
      if (treffer) belegte.add(Number(treffer[1]))
    }
  }
  return belegte
}

export function naechstesFreiesKennzeichen(zeichnung: Zeichnung, buchstabe: string): string {
  const belegte = belegteKennzeichenZahlen(zeichnung, buchstabe)
  let n = 1
  while (belegte.has(n)) n++
  return `${buchstabe}${n}`
}

export interface BetriebsmittelVorkommen {
  blattId: string
  blattName: string
  ort: string | null
  objektId: string
  rolle?: 'spule' | 'kontaktblock'
  catalogComponentId: string
  variantId: string | null
}

export interface BetriebsmittelGruppe {
  kennzeichen: string
  buchstabe: string
  vorkommen: BetriebsmittelVorkommen[]
  verwaist: boolean
}

export function ermittleBetriebsmittelGruppen(zeichnung: Zeichnung): BetriebsmittelGruppe[] {
  const nachKennzeichen = new Map<string, BetriebsmittelVorkommen[]>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente' || !objekt.geraeteKennzeichen) continue
      const liste = nachKennzeichen.get(objekt.geraeteKennzeichen) ?? []
      liste.push({
        blattId: blatt.id,
        blattName: blatt.name,
        ort: ermittleOrt(zeichnung.zeichnungsart, blatt, objekt),
        objektId: objekt.id,
        rolle: objekt.betriebsmittelRolle,
        catalogComponentId: objekt.catalogComponentId,
        variantId: objekt.variantId,
      })
      nachKennzeichen.set(objekt.geraeteKennzeichen, liste)
    }
  }
  const gruppen: BetriebsmittelGruppe[] = []
  for (const [kennzeichen, vorkommen] of nachKennzeichen) {
    const buchstabe = /^[A-Za-z]+/.exec(kennzeichen)?.[0] ?? kennzeichen
    const anzahlSpulen = vorkommen.filter((v) => v.rolle === 'spule').length
    const anzahlKontaktbloecke = vorkommen.filter((v) => v.rolle === 'kontaktblock').length
    const verwaist = buchstabe === 'K' && (anzahlSpulen !== 1 || anzahlKontaktbloecke === 0)
    gruppen.push({ kennzeichen, buchstabe, vorkommen, verwaist })
  }
  return gruppen.sort((a, b) => a.kennzeichen.localeCompare(b.kennzeichen, 'de'))
}

function verweisZiel(vorkommen: BetriebsmittelVorkommen, tp: Uebersetzer): string {
  return vorkommen.ort ?? tp('beschriftung.querverweis.blatt', { name: vorkommen.blattName })
}

export function ermittleQuerverweisTexte(zeichnung: Zeichnung): Map<string, string> {
  const tp = planUebersetzer(zeichnung)
  const ziel = (vorkommen: BetriebsmittelVorkommen) => verweisZiel(vorkommen, tp)
  const texte = new Map<string, string>()
  for (const gruppe of ermittleBetriebsmittelGruppen(zeichnung)) {
    if (gruppe.buchstabe !== 'K') continue
    const spulen = gruppe.vorkommen.filter((v) => v.rolle === 'spule')
    const kontaktbloecke = gruppe.vorkommen.filter((v) => v.rolle === 'kontaktblock')
    if (spulen.length !== 1 || kontaktbloecke.length === 0) continue
    const spule = spulen[0]
    const orte = [...new Set(kontaktbloecke.map(ziel))]
    if (knxAktorArtVonKatalogId(spule.catalogComponentId) === null)
      texte.set(spule.objektId, `${gruppe.kennzeichen}: ${orte.join(', ')}`)
    for (const kontaktblock of kontaktbloecke) {
      texte.set(kontaktblock.objektId, `${gruppe.kennzeichen}: ${ziel(spule)}`)
    }
  }
  return texte
}

export function kennzeichenTraeger(
  zeichnung: Zeichnung,
  kennzeichen: string,
): { blattName: string; objekt: KomponentenObjekt }[] {
  const ergebnis: { blattName: string; objekt: KomponentenObjekt }[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'komponente' && objekt.geraeteKennzeichen === kennzeichen)
        ergebnis.push({ blattName: blatt.name, objekt })
    }
  }
  return ergebnis
}

export function teiltKennzeichenOhneRueckfrage(
  objekt: Pick<KomponentenObjekt, 'betriebsmittelRolle'>,
  andere: readonly Pick<KomponentenObjekt, 'betriebsmittelRolle' | 'geraeteKennzeichen'>[],
): boolean {
  if (andere.length > 0 && andere.every((o) => istKlemme(o))) return true
  if (!objekt.betriebsmittelRolle) return false
  if (andere.some((o) => !o.betriebsmittelRolle)) return false
  const spulen = [objekt, ...andere].filter((o) => o.betriebsmittelRolle === 'spule').length
  return spulen <= 1
}
