import type { Blatt } from './blatt'
import type { Ebene } from './ebenen'
import {
  EBENE_NAME_BAUELEMENTE,
  EBENE_NAME_BEMASSUNG,
  EBENE_NAME_LEITUNGEN,
  EBENE_NAME_RAEUME,
  EBENEN_STAND,
  erzeugeEbene,
  erzeugeStandardEbenen,
  ersatzEbeneFuer,
  LEITUNGEN_TYPEN,
  RAEUME_TYPEN,
} from './ebenen'
import type { Zeichnung } from './zeichnung'

function passtZu(a: Ebene, b: Ebene): boolean {
  if (a.id === b.id) return true
  if (a.istHintergrundLayer || b.istHintergrundLayer) {
    return !!a.istHintergrundLayer && !!b.istHintergrundLayer
  }
  if (a.istLeitungenLayer || b.istLeitungenLayer) {
    return !!a.istLeitungenLayer && !!b.istLeitungenLayer
  }
  if (a.istRaeumeLayer || b.istRaeumeLayer) {
    return !!a.istRaeumeLayer && !!b.istRaeumeLayer
  }
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase()
}

function findeTreffer(ebenen: readonly Ebene[], gesucht: Ebene): Ebene | undefined {
  return ebenen.find((e) => e.id === gesucht.id) ?? ebenen.find((e) => passtZu(e, gesucht))
}

export function uebernimmEbenen(blatt: Blatt, ebenen: readonly Ebene[]): Blatt {
  const ziel = ebenen.length > 0 ? ebenen : erzeugeStandardEbenen()
  const zuordnung = new Map<string, string>()
  for (const alt of blatt.ebenen) {
    const treffer = findeTreffer(ziel, alt)
    if (treffer && treffer.id !== alt.id) zuordnung.set(alt.id, treffer.id)
  }

  let objekteGeaendert = false
  const objekte = blatt.objekte.map((objekt) => {
    const neu = zuordnung.get(objekt.ebeneId)
    if (!neu) return objekt
    objekteGeaendert = true
    return { ...objekt, ebeneId: neu }
  })

  const vorhanden = new Set(ziel.map((e) => e.id))
  const ersatzId = (ersatzEbeneFuer(ziel, '') ?? ziel[0]).id
  const aktiveEbeneId =
    zuordnung.get(blatt.aktiveEbeneId) ??
    (vorhanden.has(blatt.aktiveEbeneId) ? blatt.aktiveEbeneId : ersatzId)

  const ebenenGleich =
    blatt.ebenen.length === ziel.length && blatt.ebenen.every((e, i) => e === ziel[i])
  if (ebenenGleich && !objekteGeaendert && aktiveEbeneId === blatt.aktiveEbeneId) return blatt
  return { ...blatt, ebenen: [...ziel], objekte, aktiveEbeneId }
}

export function synchronisiereEbenen(blaetter: readonly Blatt[]): Blatt[] {
  if (blaetter.length === 0) return []
  const gemeinsam: Ebene[] = [...blaetter[0].ebenen]
  for (const blatt of blaetter.slice(1)) {
    for (const ebene of blatt.ebenen) {
      if (!findeTreffer(gemeinsam, ebene)) gemeinsam.push(ebene)
    }
  }
  return blaetter.map((blatt) => uebernimmEbenen(blatt, gemeinsam))
}

export function zeichnungsEbenen(blaetter: readonly Blatt[]): Ebene[] {
  return blaetter[0]?.ebenen ?? []
}

function gleicherName(ebene: Ebene, name: string): boolean {
  return ebene.name.trim().toLowerCase() === name.toLowerCase()
}

function sichereStandardlayer(
  ebenen: Ebene[],
  flag: 'istLeitungenLayer' | 'istRaeumeLayer',
  name: string,
  position: { nach?: string; vor?: string },
): string {
  const markiert = ebenen.find((e) => e[flag])
  if (markiert) return markiert.id
  const index = ebenen.findIndex((e) => !e.istHintergrundLayer && gleicherName(e, name))
  if (index >= 0) {
    ebenen[index] = { ...ebenen[index], [flag]: true }
    return ebenen[index].id
  }
  const neu: Ebene = { ...erzeugeEbene(name), [flag]: true }
  const nach = position.nach ? ebenen.findIndex((e) => gleicherName(e, position.nach!)) : -1
  const vor = position.vor ? ebenen.findIndex((e) => gleicherName(e, position.vor!)) : -1
  if (nach >= 0) ebenen.splice(nach + 1, 0, neu)
  else if (vor >= 0) ebenen.splice(vor, 0, neu)
  else ebenen.push(neu)
  return neu.id
}

export function migriereLeitungenUndRaeume(zeichnung: Zeichnung): Zeichnung {
  if ((zeichnung.ebenenStand ?? 0) >= EBENEN_STAND) return zeichnung
  const ebenen = [...zeichnungsEbenen(zeichnung.blaetter)]
  const leitungenId = sichereStandardlayer(ebenen, 'istLeitungenLayer', EBENE_NAME_LEITUNGEN, {
    vor: EBENE_NAME_BEMASSUNG,
  })
  const raeumeId = sichereStandardlayer(ebenen, 'istRaeumeLayer', EBENE_NAME_RAEUME, {
    nach: EBENE_NAME_BAUELEMENTE,
  })
  const blaetter = zeichnung.blaetter.map((blatt) => {
    const objekte = blatt.objekte.map((objekt) => {
      const ziel = LEITUNGEN_TYPEN.includes(objekt.type)
        ? leitungenId
        : RAEUME_TYPEN.includes(objekt.type)
          ? raeumeId
          : objekt.ebeneId
      return ziel === objekt.ebeneId ? objekt : { ...objekt, ebeneId: ziel }
    })
    return { ...blatt, ebenen: [...ebenen], objekte }
  })
  return { ...zeichnung, blaetter, ebenenStand: EBENEN_STAND }
}
