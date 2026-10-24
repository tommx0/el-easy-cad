import type {
  AbgangsText,
  Blattverweis,
  CatalogComponent,
  SenkrechterAbgangsRaum,
  Zeichnung,
} from '../document-model'
import {
  ermittleAbgangsTexte,
  ermittleBlattverweise,
  ermittleKnxBeschriftungen,
  ermittleUnterbrechungsVerweise,
  senkrechteAbgangsRaeume,
  ermittlePoeSummeWatt,
  ermittlePortBelegung,
  ermittleKnxKanalVerweise,
  ermittleQuerverweisTexte,
  ermittleStromkreisZuordnungen,
  istModulTraeger,
  stromkreisKurztext,
  istPortKomponente,
  sammlePortZuweisungen,
  traegerIstVollBelegt,
} from '../document-model'

export interface SwitchAnzeigeDaten {
  poeSummen: ReadonlyMap<string, number>
  traegerMitModulen: ReadonlySet<string>
  traegerVollBelegt: ReadonlySet<string>
  querverweisTexte: ReadonlyMap<string, string>
  stromkreisTexte: ReadonlyMap<string, string>
  blattverweise: ReadonlyMap<string, Blattverweis>
  knxKanalVerweise: ReadonlyMap<string, readonly (string | undefined)[]>
}

let letzterProject: Zeichnung | null = null
let letzterKatalog: readonly CatalogComponent[] | null = null
let letztePlaene: readonly Zeichnung[] | null = null
let letzteDaten: SwitchAnzeigeDaten | null = null

const KEINE_PLAENE: readonly Zeichnung[] = []

export function holeSwitchAnzeigeDaten(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  verteilerplaene: readonly Zeichnung[] = KEINE_PLAENE,
): SwitchAnzeigeDaten {
  if (
    letzteDaten &&
    letzterProject === zeichnung &&
    letzterKatalog === katalog &&
    letztePlaene === verteilerplaene
  )
    return letzteDaten

  const zuweisungen = sammlePortZuweisungen(zeichnung)
  const poeSummen = new Map<string, number>()
  const traegerMitModulen = new Set<string>()
  const traegerVollBelegt = new Set<string>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente') continue
      if (objekt.traegerId !== undefined) traegerMitModulen.add(objekt.traegerId)
      if (istModulTraeger(objekt) && traegerIstVollBelegt(blatt.objekte, objekt)) {
        traegerVollBelegt.add(objekt.id)
      }
      if (!istPortKomponente(objekt)) continue
      const summe = ermittlePoeSummeWatt(
        ermittlePortBelegung(objekt, zuweisungen.get(objekt.id), katalog),
      )
      if (summe > 0) poeSummen.set(objekt.id, summe)
    }
  }

  const querverweisTexte = ermittleQuerverweisTexte(zeichnung)
  const stromkreisTexte = new Map<string, string>()
  for (const [id, liste] of ermittleStromkreisZuordnungen(zeichnung, katalog, verteilerplaene)
    .komponenten)
    stromkreisTexte.set(id, liste.map(stromkreisKurztext).join(', '))

  const blattverweise = new Map(ermittleBlattverweise(zeichnung))
  for (const [id, text] of ermittleUnterbrechungsVerweise(zeichnung))
    blattverweise.set(id, { ...blattverweise.get(id), unterbrechung: text })

  letzterProject = zeichnung
  letzterKatalog = katalog
  letztePlaene = verteilerplaene
  letzteDaten = {
    poeSummen,
    traegerMitModulen,
    traegerVollBelegt,
    querverweisTexte,
    stromkreisTexte,
    blattverweise,
    knxKanalVerweise: ermittleKnxKanalVerweise(zeichnung),
  }
  return letzteDaten
}

let abgangPlan: Zeichnung | null = null
let abgangBauplaene: readonly Zeichnung[] | null = null
let abgangKatalog: readonly CatalogComponent[] | null = null
let abgangDaten: ReadonlyMap<string, readonly AbgangsText[]> = new Map()

export function holeAbgangsTexte(
  plan: Zeichnung,
  bauplaene: readonly Zeichnung[],
  katalog: readonly CatalogComponent[],
): ReadonlyMap<string, readonly AbgangsText[]> {
  if (abgangPlan === plan && abgangBauplaene === bauplaene && abgangKatalog === katalog)
    return abgangDaten
  abgangPlan = plan
  abgangBauplaene = bauplaene
  abgangKatalog = katalog
  abgangDaten = ermittleAbgangsTexte(plan, bauplaene, katalog)
  return abgangDaten
}

let raumPlan: Zeichnung | null = null
let raumDaten: ReadonlyMap<string, SenkrechterAbgangsRaum> = new Map()

export function holeAbgangsRaeume(plan: Zeichnung): ReadonlyMap<string, SenkrechterAbgangsRaum> {
  if (raumPlan === plan) return raumDaten
  raumPlan = plan
  raumDaten = senkrechteAbgangsRaeume(plan)
  return raumDaten
}

let knxPlan: Zeichnung | null = null
let knxBauplaene: readonly Zeichnung[] | null = null
let knxDaten: ReadonlyMap<string, readonly (string | undefined)[]> = new Map()

export function holeKnxBeschriftungen(
  plan: Zeichnung,
  bauplaene: readonly Zeichnung[],
): ReadonlyMap<string, readonly (string | undefined)[]> {
  if (knxPlan === plan && knxBauplaene === bauplaene) return knxDaten
  knxPlan = plan
  knxBauplaene = bauplaene
  knxDaten = ermittleKnxBeschriftungen(plan, bauplaene)
  return knxDaten
}
