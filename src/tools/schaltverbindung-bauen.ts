import type {
  KomponentenObjekt,
  Objekt,
  Point,
  PotentialObjekt,
  SchaltverbindungAnschluss,
  SchaltverbindungObjekt,
} from '../document-model'
import {
  distance,
  dockpunktBezeichnung,
  ermittleAderverlaeufe,
  findeNaechstenDockpunkt,
  getDockpoints,
  gruppiereBenachbarteDockpunkte,
  naechsterPunktAufPolylinie,
  neueObjektBasis,
  ordneSammelleitung,
  SCHALTPLAN_POLABSTAND,
  sammelBezeichnung,
  standardAderBezeichnungen,
  standardAderSeite,
  treppenEndpunkt,
} from '../document-model'

const ADER_TOLERANZ_ANTEIL = 0.4

export function aderToleranz(grundToleranz: number): number {
  return Math.min(grundToleranz, ADER_TOLERANZ_ANTEIL * SCHALTPLAN_POLABSTAND)
}

export interface DockTreffer {
  anschluss: SchaltverbindungAnschluss
  punkte: Point[]
  bezeichnungen?: (string | null)[]
}

export function suchePotentialTreffer(
  objekte: readonly Objekt[],
  weltpunkt: Point,
  toleranz: number,
): DockTreffer | null {
  let bestes: PotentialObjekt | null = null
  let besteDistanz = toleranz
  for (const potential of objekte) {
    if (potential.type !== 'potential') continue
    const d = distance(weltpunkt, potential.position)
    if (d <= besteDistanz) {
      bestes = potential
      besteDistanz = d
    }
  }
  if (!bestes) return null
  return {
    anschluss: { art: 'potential', objektId: bestes.id },
    punkte: [bestes.position],
  }
}

export function dockTrefferAn(
  komponente: KomponentenObjekt,
  index: number,
  polzahl: number,
): DockTreffer {
  const indizes = gruppiereBenachbarteDockpunkte(komponente, index, polzahl)
  const alleDockpunkte = getDockpoints(komponente)
  return {
    anschluss: { art: 'dock', objektId: komponente.id, dockpunktIndizes: indizes },
    punkte: indizes.map((i) => alleDockpunkte[i]),
    bezeichnungen: indizes.map((i) => dockpunktBezeichnung(komponente.dockpunkte, i)),
  }
}

export function sucheDockTrefferIn(
  objekte: readonly Objekt[],
  weltpunkt: Point,
  polzahl: number,
  toleranz: number,
): DockTreffer | null {
  const komponenten = objekte.filter((o): o is KomponentenObjekt => o.type === 'komponente')
  const treffer = findeNaechstenDockpunkt(komponenten, weltpunkt, toleranz)
  if (treffer) {
    const komponente = komponenten.find((k) => k.id === treffer.objektId)
    if (komponente) return dockTrefferAn(komponente, treffer.dockpunktIndex, polzahl)
  }
  return suchePotentialTreffer(objekte, weltpunkt, toleranz)
}

export function belegungsSchluessel(anschluss: SchaltverbindungAnschluss): string | null {
  if (anschluss.art === 'dock') return `${anschluss.objektId}:${anschluss.dockpunktIndizes[0]}`
  if (anschluss.art === 'potential') return `potential:${anschluss.objektId}`
  return null
}

interface AderEnde {
  anschluss: SchaltverbindungAnschluss
  punkt: Point
}

export interface Ader {
  wegpunkte: Point[]
  start: SchaltverbindungAnschluss
  ziel: SchaltverbindungAnschluss
  bezeichnung?: string
}

function bezeichnungAm(
  objekte: readonly Objekt[],
  anschluss: SchaltverbindungAnschluss,
): string | undefined {
  if (anschluss.art !== 'schaltverbindung') return undefined
  const ziel = objekte.find((o) => o.id === anschluss.objektId)
  return ziel?.type === 'schaltverbindung' ? ziel.bezeichnung : undefined
}

function bildeTreppe(objekte: readonly Objekt[], adern: Ader[], ende: 'start' | 'ziel') {
  const erste = adern[0]
  const anschluss = ende === 'start' ? erste.start : erste.ziel
  if (anschluss.art !== 'schaltverbindung') return
  const sammel = objekte.find((o) => o.id === anschluss.objektId)
  if (sammel?.type !== 'schaltverbindung') return
  const n = erste.wegpunkte.length
  const endpunkt = ende === 'ziel' ? erste.wegpunkte[n - 1] : erste.wegpunkte[0]
  const nachbar = ende === 'ziel' ? erste.wegpunkte[n - 2] : erste.wegpunkte[1]
  const naechster = naechsterPunktAufPolylinie(endpunkt, sammel.wegpunkte)
  const reihenfolge = ordneSammelleitung(
    [...objekte],
    { objekt: sammel, punkt: naechster.punkt, segment: naechster.segment },
    { nachbar, endpunkt },
  )
  adern.forEach((ader, k) => {
    const partner = reihenfolge[k]
    if (!partner) return
    if (k > 0) {
      if ((ende === 'start' ? ader.start : ader.ziel).art !== 'frei') return
      const punkt = treppenEndpunkt(ader.wegpunkte, ende, partner.wegpunkte)
      if (!punkt) return
      const index = ende === 'start' ? 0 : ader.wegpunkte.length - 1
      ader.wegpunkte = ader.wegpunkte.map((p, i) => (i === index ? punkt : p))
      const neu: SchaltverbindungAnschluss = { art: 'schaltverbindung', objektId: partner.id }
      if (ende === 'start') ader.start = neu
      else ader.ziel = neu
    }
    ader.bezeichnung ??= partner.bezeichnung
  })
}

function bindeAderEnden(
  objekte: readonly Objekt[],
  endpunkte: Point[],
  ersteAder: SchaltverbindungAnschluss,
  toleranz: number,
): AderEnde[] {
  const belegt = new Set<string>()
  const ersterSchluessel = belegungsSchluessel(ersteAder)
  if (ersterSchluessel) belegt.add(ersterSchluessel)
  return endpunkte.slice(1).map((punkt) => {
    const treffer = sucheDockTrefferIn(objekte, punkt, 1, toleranz)
    const schluessel = treffer ? belegungsSchluessel(treffer.anschluss) : null
    if (!treffer || !schluessel || belegt.has(schluessel))
      return { anschluss: { art: 'frei' }, punkt }
    belegt.add(schluessel)
    return { anschluss: treffer.anschluss, punkt: treffer.punkte[0] }
  })
}

export function aderverlaeufeFuer(verlauf: Point[], anzahl: number, umgekehrt: boolean): Point[][] {
  const seite = standardAderSeite(verlauf) * (umgekehrt ? -1 : 1)
  return ermittleAderverlaeufe(verlauf, anzahl, seite as 1 | -1)
}

export interface AderOptionen {
  aderAnzahl: number
  polzahl: number
  seiteUmgekehrt: boolean
  toleranz: number
}

export function baueAdern(
  objekte: readonly Objekt[],
  verlauf: Point[],
  von: SchaltverbindungAnschluss,
  bis: SchaltverbindungAnschluss,
  optionen: AderOptionen,
): Ader[] {
  if (optionen.aderAnzahl === 1) {
    return [
      {
        wegpunkte: verlauf,
        start: von,
        ziel: bis,
        bezeichnung:
          bezeichnungAm(objekte, bis) ??
          bezeichnungAm(objekte, von) ??
          sammelBezeichnung(optionen.polzahl),
      },
    ]
  }
  const verlaeufe = aderverlaeufeFuer(verlauf, optionen.aderAnzahl, optionen.seiteUmgekehrt)
  const anfaenge = bindeAderEnden(
    objekte,
    verlaeufe.map((v) => v[0]),
    von,
    optionen.toleranz,
  )
  const enden = bindeAderEnden(
    objekte,
    verlaeufe.map((v) => v[v.length - 1]),
    bis,
    optionen.toleranz,
  )
  const adern: Ader[] = [{ wegpunkte: verlaeufe[0], start: von, ziel: bis }]
  verlaeufe.slice(1).forEach((v, i) => {
    const wegpunkte = [...v]
    wegpunkte[0] = anfaenge[i].punkt
    wegpunkte[wegpunkte.length - 1] = enden[i].punkt
    adern.push({ wegpunkte, start: anfaenge[i].anschluss, ziel: enden[i].anschluss })
  })
  bildeTreppe(objekte, adern, 'ziel')
  bildeTreppe(objekte, adern, 'start')
  const vorbelegung = standardAderBezeichnungen(adern.length)
  adern.forEach((ader, k) => (ader.bezeichnung ??= vorbelegung[k]))
  return adern
}

export function baueSchaltverbindungsObjekt(
  ebeneId: string,
  wegpunkte: Point[],
  von: SchaltverbindungAnschluss,
  bis: SchaltverbindungAnschluss,
  polzahl: 1 | 2 | 3 | 4 | 5,
  autoRouting: boolean,
  bezeichnung?: string,
): SchaltverbindungObjekt {
  return {
    ...neueObjektBasis(ebeneId),
    type: 'schaltverbindung',
    wegpunkte,
    start: von,
    ziel: bis,
    polzahl,
    ...(autoRouting ? { autoRouting: true } : {}),
    ...(bezeichnung ? { bezeichnung } : {}),
  }
}

export function objekteZuAdern(
  ebeneId: string,
  verlauf: Point[],
  adern: readonly Ader[],
  polzahl: 1 | 2 | 3 | 4 | 5,
  autoRouting: boolean,
): SchaltverbindungObjekt[] {
  if (adern.length === 1) {
    const ader = adern[0]
    return [
      baueSchaltverbindungsObjekt(
        ebeneId,
        [...verlauf],
        ader.start,
        ader.ziel,
        polzahl,
        autoRouting,
        ader.bezeichnung,
      ),
    ]
  }
  return adern.map((ader, i) =>
    baueSchaltverbindungsObjekt(
      ebeneId,
      i === 0 ? [...verlauf] : ader.wegpunkte,
      ader.start,
      ader.ziel,
      1,
      autoRouting,
      ader.bezeichnung,
    ),
  )
}
