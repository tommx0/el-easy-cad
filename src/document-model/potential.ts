import { ermittleOrt } from './koordinatennetz'
import type { Zeichnung } from './zeichnung'

export type PotentialVorkommenArt = 'potential' | 'schaltverbindung'

export interface PotentialVorkommen {
  blattId: string
  blattName: string
  ort: string | null
  objektId: string
  art: PotentialVorkommenArt
}

export interface PotentialGruppe {
  name: string
  vorkommen: PotentialVorkommen[]
  verwaist: boolean
}

export function ermittlePotentialGruppen(zeichnung: Zeichnung): PotentialGruppe[] {
  const nachName = new Map<string, PotentialVorkommen[]>()
  const hinzufuegen = (name: string, vorkommen: PotentialVorkommen) => {
    const liste = nachName.get(name) ?? []
    liste.push(vorkommen)
    nachName.set(name, liste)
  }
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'potential') {
        hinzufuegen(objekt.name, {
          blattId: blatt.id,
          blattName: blatt.name,
          ort: ermittleOrt(zeichnung.zeichnungsart, blatt, objekt),
          objektId: objekt.id,
          art: 'potential',
        })
      } else if (objekt.type === 'schaltverbindung' && objekt.bezeichnung && objekt.polzahl === 1) {
        hinzufuegen(objekt.bezeichnung, {
          blattId: blatt.id,
          blattName: blatt.name,
          ort: null,
          objektId: objekt.id,
          art: 'schaltverbindung',
        })
      }
    }
  }
  return [...nachName.entries()]
    .map(([name, vorkommen]) => ({ name, vorkommen, verwaist: vorkommen.length === 1 }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
}
