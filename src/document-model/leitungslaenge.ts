import type { Blatt } from './blatt'
import type { CatalogComponent } from './catalog'
import { dockpunktBezeichnung } from './dockpunkt-bezeichnung'
import { pfadGesamtLaenge, teilPfadLaenge } from './geometry'
import { istKalibriert } from './hintergrund'
import { istKlemme, klemmenAnschlussText } from './klemmen'
import {
  endSenkrechteMeter,
  stueckZonenHoeheMeter,
  zonenUnterschiedMeter,
  type ZonenStelle,
} from './hoehenfuehrung'
import {
  beschreibeKomponente,
  ermittleDurchgehendeLeitung,
  gemeinsamerTrunkStrang,
  steigstreckeMeter,
} from './kabelschacht'
import type { KabelschachtObjekt, KomponentenObjekt, LeitungsObjekt, TrunkObjekt } from './objekte'
import { istBuendelEnde } from './objekte'
import type { TrunkWegGlied } from './trunk-kette'
import { abgeleitetePfadSegmente, findeTrunkWeg } from './trunk-kette'
import { versetztePfadSegmente } from './wandversatz'
import { raumquerungsUmgebung } from './raumquerung'
import { raumquerungFuer, stueckeMitZone } from './teilstueck-zonen'
import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'
import type { Zeichnung } from './zeichnung'

export type LaengenStatus = 'gueltig' | 'unkalibriert'

export interface LeitungsLaengenAnteile {
  frei: number
  trunk: number
  steig: number
  buendel: number
  hoehe: number
}

export type LeitungsAbschnitt =
  | {
      art: 'frei'
      blattId: string
      leitungId: string
      segmentIndex: number
      meter: number
    }
  | {
      art: 'trunk'
      blattId: string
      leitungId: string
      trunkId: string
      meter: number
    }
  | {
      art: 'buendel'
      blattId: string
      leitungId: string
      trunkId: string
      meter: number
    }
  | {
      art: 'steig'
      blattId: string
      leitungId: string
      verbundId: string | null
      meter: number
    }
  | {
      art: 'hoehe'
      blattId: string
      leitungId: string
      stelle: 'ende' | 'schacht' | 'trunk' | 'teilstueck'
      meter: number
    }

export interface LeitungsLaenge {
  nummer: number
  glieder: { blattId: string; leitung: LeitungsObjekt }[]
  beruehrteBlattIds: string[]
  status: LaengenStatus
  unkalibrierteBlaetter: { blattId: string; name: string }[]
  planLaengeMeter: number
  verlegeLaengeMeter: number
  anteile: LeitungsLaengenAnteile
}

export function anschlussreserveMeter(zeichnung: Zeichnung): number {
  return zeichnung.anschlussreserveMeter
}

export function istLaengentauglich(blatt: Blatt): boolean {
  return blatt.hintergrund === null || istKalibriert(blatt.hintergrund)
}

function findeBlatt(zeichnung: Zeichnung, blattId: string): Blatt | undefined {
  return zeichnung.blaetter.find((b) => b.id === blattId)
}

function findeTrunkAufBlatt(
  zeichnung: Zeichnung,
  blattId: string,
  trunkId: string,
): TrunkObjekt | null {
  const blatt = findeBlatt(zeichnung, blattId)
  const objekt = blatt?.objekte.find((o) => o.id === trunkId)
  return objekt && objekt.type === 'trunk' ? objekt : null
}

function findeSchachtAufBlatt(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
): KabelschachtObjekt | null {
  const blatt = findeBlatt(zeichnung, blattId)
  const objekt = blatt?.objekte.find((o) => o.id === objektId)
  return objekt && objekt.type === 'kabelschacht' ? objekt : null
}

function steigstreckeZwischen(
  zeichnung: Zeichnung,
  a: { blattId: string; trunk: TrunkObjekt },
  b: { blattId: string; trunk: TrunkObjekt },
): { meter: number; verbundId: string | null } {
  if (a.blattId === b.blattId) return { meter: 0, verbundId: null }
  const strang = gemeinsamerTrunkStrang(zeichnung, a, b)
  if (!strang) return { meter: 0, verbundId: null }
  return {
    meter: steigstreckeMeter(zeichnung, strang.schachtA.verbundId, a.blattId, b.blattId),
    verbundId: strang.schachtA.verbundId,
  }
}

function trunksAmSwitch(
  zeichnung: Zeichnung,
): Map<string, { blattId: string; trunk: TrunkObjekt }[]> {
  const treffer = new Map<string, { blattId: string; trunk: TrunkObjekt }[]>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'trunk') continue
      for (const ende of objekt.enden) {
        if (!ende.dockRef) continue
        const liste = treffer.get(ende.dockRef.objektId) ?? []
        liste.push({ blattId: blatt.id, trunk: objekt })
        treffer.set(ende.dockRef.objektId, liste)
      }
    }
  }
  return treffer
}

function tAmDockendenEnde(trunk: TrunkObjekt, komponentenId: string): number {
  const index = trunk.enden.findIndex((e) => e.dockRef?.objektId === komponentenId)
  return index < 0 ? 1 : index
}

interface BuendelWeg {
  abschnitte: LeitungsAbschnitt[]
  laenge: number
  endZone: number | null
}

function trunkZone(zeichnung: Zeichnung, glied: { blattId: string; trunk: TrunkObjekt }) {
  return stueckZonenHoeheMeter(glied.trunk, findeBlatt(zeichnung, glied.blattId), zeichnung)
}

function zonenWechsel(
  von: number | null,
  nach: number | null,
  blattId: string,
  leitungId: string,
  stelle: 'trunk' | 'teilstueck' = 'trunk',
): LeitungsAbschnitt[] {
  if (von === null || nach === null || Math.abs(von - nach) < 1e-9) return []
  return [{ art: 'hoehe', blattId, leitungId, stelle, meter: Math.abs(von - nach) }]
}

function buendelWegZumPort(
  zeichnung: Zeichnung,
  blattId: string,
  leitungId: string,
  startTrunkId: string,
  tAustritt: number,
  switchObjektId: string,
  amSwitch: Map<string, { blattId: string; trunk: TrunkObjekt }[]>,
): BuendelWeg {
  const leer: BuendelWeg = { abschnitte: [], laenge: 0, endZone: null }
  let bester: BuendelWeg | null = null

  for (const ziel of amSwitch.get(switchObjektId) ?? []) {
    const weg = findeTrunkWeg(zeichnung, blattId, startTrunkId, ziel.trunk.id)
    if (!weg) continue
    const ergebnis = messeWeg(
      zeichnung,
      weg,
      tAustritt,
      tAmDockendenEnde(ziel.trunk, switchObjektId),
      leitungId,
    )
    if (!bester || ergebnis.laenge < bester.laenge) bester = ergebnis
  }
  return bester ?? leer
}

function messeWeg(
  zeichnung: Zeichnung,
  weg: TrunkWegGlied[],
  tStart: number,
  tEnde: number,
  leitungId: string,
): BuendelWeg {
  const abschnitte: LeitungsAbschnitt[] = []
  let laenge = 0
  for (const [index, glied] of weg.entries()) {
    if (index > 0) {
      const steig = steigstreckeZwischen(zeichnung, weg[index - 1], glied)
      if (steig.meter > 0) {
        abschnitte.push({
          art: 'steig',
          blattId: weg[index - 1].blattId,
          leitungId,
          verbundId: steig.verbundId,
          meter: steig.meter,
        })
      }
      const vorher = { blattId: weg[index - 1].blattId, zone: trunkZone(zeichnung, weg[index - 1]) }
      const hier = { blattId: glied.blattId, zone: trunkZone(zeichnung, glied) }
      if (steig.verbundId !== null) {
        const zonen = zonenUnterschiedMeter(zeichnung, vorher, hier)
        if (zonen !== 0) {
          abschnitte.push({
            art: 'hoehe',
            blattId: weg[index - 1].blattId,
            leitungId,
            stelle: 'schacht',
            meter: zonen,
          })
        }
      } else if (vorher.blattId === hier.blattId) {
        abschnitte.push(...zonenWechsel(vorher.zone, hier.zone, glied.blattId, leitungId))
      }
    }
    const von = index === 0 ? tStart : (glied.eintrittT ?? 0)
    const bis = index === weg.length - 1 ? tEnde : (glied.austrittT ?? 1)
    const meter = teilPfadLaenge(glied.trunk.wegpunkte, von, bis)
    laenge += meter
    abschnitte.push({
      art: 'buendel',
      blattId: glied.blattId,
      leitungId,
      trunkId: glied.trunk.id,
      meter,
    })
  }
  const letztes = weg[weg.length - 1]
  return { abschnitte, laenge, endZone: letztes ? trunkZone(zeichnung, letztes) : null }
}

export function ermittleLeitungsLaenge(
  zeichnung: Zeichnung,
  blattId: string,
  leitungId: string,
): LeitungsLaenge {
  const kabel = ermittleDurchgehendeLeitung(zeichnung, blattId, leitungId)
  if (!kabel) return laengeAusGliedern(zeichnung, [], 0)
  return laengeAusGliedern(zeichnung, kabel.glieder, kabel.steigstreckeMeter)
}

function abschnitteAusGliedern(
  zeichnung: Zeichnung,
  glieder: { blattId: string; leitung: LeitungsObjekt }[],
  steigstreckeZwischenGliedern: number,
): LeitungsAbschnitt[] {
  if (glieder.length === 0) return []
  const amSwitch = trunksAmSwitch(zeichnung)
  const abschnitte: LeitungsAbschnitt[] = []

  if (steigstreckeZwischenGliedern > 0) {
    const ende = glieder[0].leitung.ziel
    abschnitte.push({
      art: 'steig',
      blattId: glieder[0].blattId,
      leitungId: glieder[0].leitung.id,
      verbundId:
        ende.art === 'schacht'
          ? (findeSchachtAufBlatt(zeichnung, glieder[0].blattId, ende.objektId)?.verbundId ?? null)
          : null,
      meter: steigstreckeZwischenGliedern,
    })
  }
  const folgen = glieder.map(({ blattId, leitung }) => zonenFolge(zeichnung, blattId, leitung))
  for (let i = 1; i < glieder.length; i++) {
    const vorher: ZonenStelle = {
      blattId: glieder[i - 1].blattId,
      zone: randZone(folgen[i - 1], schachtSeite(glieder[i - 1].leitung, 'ziel')),
    }
    const nachher: ZonenStelle = {
      blattId: glieder[i].blattId,
      zone: randZone(folgen[i], schachtSeite(glieder[i].leitung, 'start')),
    }
    const zonen = zonenUnterschiedMeter(zeichnung, vorher, nachher)
    if (zonen !== 0) {
      abschnitte.push({
        art: 'hoehe',
        blattId: glieder[i - 1].blattId,
        leitungId: glieder[i - 1].leitung.id,
        stelle: 'schacht',
        meter: zonen,
      })
    }
  }

  const portZonen = new Map<'start' | 'ziel', number | null>()

  for (const [gliedIndex, { blattId, leitung }] of glieder.entries()) {
    const { zonen: folge, arten } = folgen[gliedIndex]
    for (let i = 1; i < folge.length; i++)
      abschnitte.push(
        ...zonenWechsel(
          folge[i - 1],
          folge[i],
          blattId,
          leitung.id,
          arten[i - 1] === 'frei' && arten[i] === 'frei' ? 'teilstueck' : 'trunk',
        ),
      )

    const blatt = findeBlatt(zeichnung, blattId)
    const versetzt = blatt
      ? versetztePfadSegmente(leitung, blatt, zeichnung.installationszonen)
      : null
    leitung.pfadSegmente.forEach((segment, segmentIndex) => {
      const meter = pfadGesamtLaenge(versetzt?.[segmentIndex] ?? segment)
      if (meter > 0) {
        abschnitte.push({ art: 'frei', blattId, leitungId: leitung.id, segmentIndex, meter })
      }
    })

    for (const durchgang of leitung.trunkDurchgaenge) {
      const trunk = findeTrunkAufBlatt(zeichnung, blattId, durchgang.trunkId)
      if (!trunk) continue
      abschnitte.push({
        art: 'trunk',
        blattId,
        leitungId: leitung.id,
        trunkId: trunk.id,
        meter: teilPfadLaenge(trunk.wegpunkte, durchgang.eintrittT, durchgang.austrittT),
      })
    }

    const durchgaenge = leitung.trunkDurchgaenge
    if (durchgaenge.length > 0) {
      const enden = [
        {
          seite: 'start' as const,
          ziel: leitung.start,
          durchgang: durchgaenge[0],
          t: durchgaenge[0].eintrittT,
        },
        {
          seite: 'ziel' as const,
          ziel: leitung.ziel,
          durchgang: durchgaenge[durchgaenge.length - 1],
          t: durchgaenge[durchgaenge.length - 1].austrittT,
        },
      ]
      for (const ende of enden) {
        if (!istBuendelEnde(ende.ziel)) continue
        const weg = buendelWegZumPort(
          zeichnung,
          blattId,
          leitung.id,
          ende.durchgang.trunkId,
          ende.t,
          ende.ziel.objektId,
          amSwitch,
        )
        abschnitte.push(...weg.abschnitte)
        if (weg.abschnitte.length > 0) portZonen.set(ende.seite, weg.endZone)
      }
    }
  }
  abschnitte.push(...senkrechteAnDenEnden(zeichnung, glieder, folgen, portZonen, abschnitte))
  return abschnitte
}

interface ZonenFolge {
  zonen: (number | null)[]
  arten: ('frei' | 'trunk')[]
  eigene: number | null
}

function zonenFolge(zeichnung: Zeichnung, blattId: string, leitung: LeitungsObjekt): ZonenFolge {
  const blatt = findeBlatt(zeichnung, blattId)
  const eigene = stueckZonenHoeheMeter(leitung, blatt, zeichnung)
  const zonen: (number | null)[] = []
  const arten: ('frei' | 'trunk')[] = []
  const gezeigt = blatt ? abgeleitetePfadSegmente(leitung, blatt.objekte) : leitung.pfadSegmente
  const raumquerung = raumquerungFuer(
    leitung,
    raumquerungsUmgebung(blatt, zeichnung.installationszonen),
  )
  leitung.pfadSegmente.forEach((segment, i) => {
    if (pfadGesamtLaenge(segment) > 0) {
      const stuecke = stueckeMitZone(gezeigt[i] ?? segment, leitung, raumquerung)
      if (stuecke.length === 0) stuecke.push({ von: segment[0], bis: segment[0], zone: undefined })
      for (const stueck of stuecke) {
        zonen.push(
          stueck.zone
            ? stueckZonenHoeheMeter({ installationszone: stueck.zone }, blatt, zeichnung)
            : eigene,
        )
        arten.push('frei')
      }
    }
    const durchgang = leitung.trunkDurchgaenge[i]
    const trunk = durchgang && findeTrunkAufBlatt(zeichnung, blattId, durchgang.trunkId)
    if (trunk) {
      zonen.push(stueckZonenHoeheMeter(trunk, blatt, zeichnung))
      arten.push('trunk')
    }
  })
  return { zonen, arten, eigene }
}

function randZone(folge: ZonenFolge, seite: 'start' | 'ziel'): number | null {
  if (folge.zonen.length === 0) return folge.eigene
  return seite === 'start' ? folge.zonen[0] : folge.zonen[folge.zonen.length - 1]
}

function schachtSeite(leitung: LeitungsObjekt, erwartet: 'start' | 'ziel'): 'start' | 'ziel' {
  const andere = erwartet === 'start' ? 'ziel' : 'start'
  return leitung[erwartet].art !== 'schacht' && leitung[andere].art === 'schacht'
    ? andere
    : erwartet
}

function senkrechteAnDenEnden(
  zeichnung: Zeichnung,
  glieder: { blattId: string; leitung: LeitungsObjekt }[],
  folgen: ZonenFolge[],
  portZonen: Map<'start' | 'ziel', number | null>,
  bisher: LeitungsAbschnitt[],
): LeitungsAbschnitt[] {
  if (!bisher.some((a) => a.art !== 'hoehe' && a.meter > 0)) return []
  const erstes = glieder[0]
  const letztes = glieder[glieder.length - 1]
  const ergebnis: LeitungsAbschnitt[] = []
  for (const { ende, glied, seite, folge } of [
    { ende: erstes.leitung.start, glied: erstes, seite: 'start' as const, folge: folgen[0] },
    {
      ende: letztes.leitung.ziel,
      glied: letztes,
      seite: 'ziel' as const,
      folge: folgen[folgen.length - 1],
    },
  ]) {
    if (ende.art !== 'dock' && !istBuendelEnde(ende)) continue
    const blatt = findeBlatt(zeichnung, istBuendelEnde(ende) ? ende.blattId : glied.blattId)
    const komponente = blatt?.objekte.find(
      (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === ende.objektId,
    )
    if (!blatt || !komponente) continue
    const zone = istBuendelEnde(ende)
      ? portZonen.has(seite)
        ? portZonen.get(seite)!
        : stueckZonenHoeheMeter(undefined, blatt, zeichnung)
      : randZone(folge, seite)
    const meter = endSenkrechteMeter(zone, komponente, zeichnung, blatt)
    if (meter === null || meter === 0) continue
    ergebnis.push({
      art: 'hoehe',
      blattId: blatt.id,
      leitungId: glied.leitung.id,
      stelle: 'ende',
      meter,
    })
  }
  return ergebnis
}

export function ermittleAbschnittsLaengen(
  zeichnung: Zeichnung,
  blattId: string,
  leitungId: string,
): LeitungsAbschnitt[] {
  const kabel = ermittleDurchgehendeLeitung(zeichnung, blattId, leitungId)
  if (!kabel) return []
  return abschnitteAusGliedern(zeichnung, kabel.glieder, kabel.steigstreckeMeter)
}

function laengeAusGliedern(
  zeichnung: Zeichnung,
  glieder: { blattId: string; leitung: LeitungsObjekt }[],
  steigstreckeZwischenGliedern: number,
): LeitungsLaenge {
  const anteile: LeitungsLaengenAnteile = { frei: 0, trunk: 0, steig: 0, buendel: 0, hoehe: 0 }
  if (glieder.length === 0) {
    return {
      nummer: 0,
      glieder,
      beruehrteBlattIds: [],
      status: 'gueltig',
      unkalibrierteBlaetter: [],
      planLaengeMeter: 0,
      verlegeLaengeMeter: 0,
      anteile,
    }
  }

  const abschnitte = abschnitteAusGliedern(zeichnung, glieder, steigstreckeZwischenGliedern)
  const beruehrteBlattIds: string[] = []
  const merkeBlatt = (id: string) => {
    if (!beruehrteBlattIds.includes(id)) beruehrteBlattIds.push(id)
  }
  for (const glied of glieder) {
    merkeBlatt(glied.blattId)
    if (istBuendelEnde(glied.leitung.start)) merkeBlatt(glied.leitung.start.blattId)
    if (istBuendelEnde(glied.leitung.ziel)) merkeBlatt(glied.leitung.ziel.blattId)
  }
  for (const abschnitt of abschnitte) {
    anteile[abschnitt.art] += abschnitt.meter
    merkeBlatt(abschnitt.blattId)
  }

  const unkalibrierteBlaetter = beruehrteBlattIds
    .map((id) => findeBlatt(zeichnung, id))
    .filter((blatt): blatt is Blatt => blatt !== undefined && !istLaengentauglich(blatt))
    .map((blatt) => ({ blattId: blatt.id, name: blatt.name }))

  const nummer = glieder[0].leitung.nummer
  if (unkalibrierteBlaetter.length > 0) {
    return {
      nummer,
      glieder,
      beruehrteBlattIds,
      status: 'unkalibriert',
      unkalibrierteBlaetter,
      planLaengeMeter: 0,
      verlegeLaengeMeter: 0,
      anteile: { frei: 0, trunk: 0, steig: 0, buendel: 0, hoehe: 0 },
    }
  }

  const planLaengeMeter = anteile.frei + anteile.trunk + anteile.steig + anteile.buendel
  const reserve = planLaengeMeter > 0 ? 2 * anschlussreserveMeter(zeichnung) : 0
  return {
    nummer,
    glieder,
    beruehrteBlattIds,
    status: 'gueltig',
    unkalibrierteBlaetter: [],
    planLaengeMeter,
    verlegeLaengeMeter: planLaengeMeter + anteile.hoehe + reserve,
    anteile,
  }
}

export function ermittleAlleLeitungsLaengen(zeichnung: Zeichnung): LeitungsLaenge[] {
  const erledigt = new Set<string>()
  const ergebnis: LeitungsLaenge[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'leitung' || erledigt.has(objekt.id)) continue
      const kabel = ermittleDurchgehendeLeitung(zeichnung, blatt.id, objekt.id)
      if (!kabel) continue
      for (const glied of kabel.glieder) erledigt.add(glied.leitung.id)
      ergebnis.push(laengeAusGliedern(zeichnung, kabel.glieder, kabel.steigstreckeMeter))
    }
  }
  return ergebnis.sort((a, b) => a.nummer - b.nummer)
}

export function beschreibeLeitungsEnde(
  zeichnung: Zeichnung,
  blattId: string,
  ende: LeitungsObjekt['start'],
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer = t,
): string {
  switch (ende.art) {
    case 'dock': {
      const basis = beschreibeKomponente(zeichnung, blattId, ende.objektId, katalog, uebersetze)
      const anschluss = anschlussKennung(
        zeichnung,
        blattId,
        ende.objektId,
        ende.dockpunktIndex,
        uebersetze,
      )
      return anschluss ? `${anschluss} · ${basis}` : basis
    }
    case 'verteiler':
      return beschreibeKomponente(zeichnung, ende.blattId, ende.objektId, katalog, uebersetze)
    case 'switchport':
      return uebersetze('beschriftung.leitungsende.port', {
        komponente: beschreibeKomponente(
          zeichnung,
          ende.blattId,
          ende.objektId,
          katalog,
          uebersetze,
        ),
        nr: String(ende.portIndex + 1),
      })
    case 'schacht':
      return uebersetze('beschriftung.kabelschacht.kabelschacht')
    default:
      return uebersetze('beschriftung.kabelschacht.offenesEnde')
  }
}

export function anschlussKennung(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
  dockpunktIndex: number,
  uebersetze: Uebersetzer = t,
): string | null {
  const instanz = zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o): o is KomponentenObjekt => o.type === 'komponente' && o.id === objektId)
  const bezeichnung = dockpunktBezeichnung(instanz?.dockpunkte, dockpunktIndex)
  if (!bezeichnung) return null
  if (instanz && istKlemme(instanz)) return klemmenAnschlussText(instanz, bezeichnung, uebersetze)
  const kennzeichen = instanz?.geraeteKennzeichen?.trim()
  return kennzeichen
    ? `${kennzeichen}:${bezeichnung}`
    : uebersetze('beschriftung.leitungsende.anschluss', { anschluss: bezeichnung })
}

export function kabelEnden(
  laenge: LeitungsLaenge,
): { start: LeitungsObjekt['start']; ziel: LeitungsObjekt['ziel'] } | null {
  if (laenge.glieder.length === 0) return null
  return {
    start: laenge.glieder[0].leitung.start,
    ziel: laenge.glieder[laenge.glieder.length - 1].leitung.ziel,
  }
}
