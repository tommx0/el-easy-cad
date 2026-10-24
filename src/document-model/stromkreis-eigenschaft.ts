import type { CatalogComponent } from './catalog'
import type { SlotZiel } from './geraetegruppe'
import { ermittleTypUndSlots } from './geraetegruppen-ableitung'
import type {
  KomponentenObjekt,
  Objekt,
  RaumObjekt,
  StromkreisPolzahl,
  StromkreisQuelle,
  StromkreisWert,
} from './objekte'
import { findeRaumZuPunkt } from './raum'
import type { Zeichnung } from './zeichnung'
import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'

export const STROMKREIS_NUMMER_MAX = 99

const TYPEN_MIT_RAUMSTROMKREIS = new Set(['verbraucher', 'anschlussdose'])

export function stromkreisVorgabe(
  objekt: KomponentenObjekt,
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
): 'kein' | 'raum' | 'eigen' {
  if (objekt.verteiler || objekt.knxAktor) return 'kein'
  const eintrag = katalog.find((k) => k.id === objekt.catalogComponentId)
  if (eintrag?.stromkreisVorgabe) return eintrag.stromkreisVorgabe
  const typ = ermittleTypUndSlots(objekt, zeichnung)?.typ
  return typ && TYPEN_MIT_RAUMSTROMKREIS.has(typ) ? 'raum' : 'kein'
}

export function wirksamerStromkreis(
  objekt: KomponentenObjekt,
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
): StromkreisWert {
  if (objekt.verteiler || objekt.knxAktor) return 'kein'
  return objekt.stromkreis ?? stromkreisVorgabe(objekt, zeichnung, katalog)
}

export function wirksamePolzahl(
  objekt: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
): StromkreisPolzahl {
  return (
    objekt.stromkreisPolzahl ??
    katalog.find((k) => k.id === objekt.catalogComponentId)?.stromkreisPolzahl ??
    1
  )
}

export function stromkreisWertText(wert: StromkreisWert, uebersetze: Uebersetzer = t): string {
  if (typeof wert === 'number')
    return uebersetze('beschriftung.stromkreis.nummer', { nr: String(wert) })
  return wert === 'raum'
    ? uebersetze('beschriftung.stromkreis.raum')
    : wert === 'eigen'
      ? uebersetze('beschriftung.stromkreis.eigen')
      : uebersetze('beschriftung.stromkreis.kein')
}

export function knxHaken(objekt: KomponentenObjekt, zeichnung: Zeichnung): boolean {
  if (objekt.gruppeId) {
    const gruppe = zeichnung.geraeteGruppen.find((g) => g.id === objekt.gruppeId)
    if (gruppe) return gruppe.knx ?? false
  }
  return objekt.knx ?? false
}

export function raumDerKomponente(
  objekte: readonly Objekt[],
  objekt: KomponentenObjekt,
): RaumObjekt | null {
  return findeRaumZuPunkt(objekte, objekt.position)
}

export function raumstromkreisRaum(objekte: readonly Objekt[], raum: RaumObjekt): RaumObjekt {
  const besucht = new Set<string>([raum.id])
  let aktuell = raum
  while (aktuell.stromkreisMitRaumId) {
    const naechster = objekte.find(
      (o): o is RaumObjekt => o.type === 'raum' && o.id === aktuell.stromkreisMitRaumId,
    )
    if (!naechster || besucht.has(naechster.id)) break
    besucht.add(naechster.id)
    aktuell = naechster
  }
  return aktuell
}

export function stromkreisQuelleVon(
  zeichnung: Zeichnung,
  blattId: string,
  objekt: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
): Extract<StromkreisQuelle, { art: 'raum' | 'eigen' }> | null {
  const wert = wirksamerStromkreis(objekt, zeichnung, katalog)
  if (wert === 'kein') return null
  if (wert === 'eigen') return { art: 'eigen', blattId, objektId: objekt.id }
  const objekte = zeichnung.blaetter.find((b) => b.id === blattId)?.objekte ?? []
  const raum = raumDerKomponente(objekte, objekt)
  if (wert === 'raum') {
    const ziel = raum ? raumstromkreisRaum(objekte, raum) : null
    return ziel ? { art: 'raum', blattId, raumId: ziel.id } : { art: 'raum', blattId }
  }
  return raum
    ? { art: 'raum', blattId, raumId: raum.id, nummer: wert }
    : { art: 'raum', blattId, nummer: wert }
}

export function knxQuellenZiel(blattId: string, objekt: KomponentenObjekt): SlotZiel {
  return objekt.gruppeId
    ? { art: 'gruppe', gruppeId: objekt.gruppeId }
    : { art: 'instanz', blattId, objektId: objekt.id }
}

export function quellenSchluessel(q: StromkreisQuelle): string {
  switch (q.art) {
    case 'blatt':
      return `blatt|${q.blattId}`
    case 'raum':
      return `raum|${q.blattId}|${q.raumId ?? ''}|${q.nummer ?? ''}`
    case 'eigen':
      return `eigen|${q.blattId}|${q.objektId}`
    case 'knx':
      return q.ziel.art === 'gruppe'
        ? `knx|gruppe|${q.ziel.gruppeId}`
        : `knx|instanz|${q.ziel.blattId}|${q.ziel.objektId}`
  }
}
