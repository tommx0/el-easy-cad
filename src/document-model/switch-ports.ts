import type { CatalogComponent, DockpunkteKonfiguration } from './catalog'
import { aufgeloesteVariante } from './catalog'
import type { Sprache } from '../sprache'
import { planspracheVon } from './plansprache'
import type { Point } from './geometry'
import type { KomponentenObjekt, LeitungsZiel, Objekt, TrunkObjekt } from './objekte'
import { istBuendelEnde } from './objekte'
import { moduleVonTraeger } from './modul-traeger'
import { baueVerteilerBaum, verteilerSchildTextAusBaum } from './verteiler-baum'
import type { Zeichnung } from './zeichnung'
import { ermittleTeilstueckNamen, ermittleTrunkKette, punktAufPfad } from './trunk-kette'
import { schachtVerbundIndex, trunkAnschluesseJeStrang } from './kabelschacht'

export function istPortKomponente(instanz: KomponentenObjekt): boolean {
  return instanz.dockpunkte?.modus === 'ports'
}

export function portAnzahlKonfiguration(konfiguration: DockpunkteKonfiguration): number {
  if (konfiguration.modus !== 'ports') return 0
  return konfiguration.gruppen.reduce((summe, gruppe) => summe + gruppe.anzahl, 0)
}

export function portAnzahl(instanz: KomponentenObjekt): number {
  if (!instanz.dockpunkte) return 0
  return portAnzahlKonfiguration(instanz.dockpunkte)
}

export function istSwitchOderPatchpanelKonfiguration(
  konfiguration: DockpunkteKonfiguration | undefined,
): boolean {
  return konfiguration?.modus === 'ports' && (konfiguration.trunkPunkte?.length ?? 0) > 0
}

export function istSwitchOderPatchpanelKomponente(instanz: KomponentenObjekt): boolean {
  return istSwitchOderPatchpanelKonfiguration(instanz.dockpunkte)
}

export function istSwitchOderPatchpanelKatalogEintrag(eintrag: CatalogComponent): boolean {
  return istSwitchOderPatchpanelKonfiguration(eintrag.dockpunkte)
}

export function portBezeichnung(portIndex: number): string {
  return `P${portIndex + 1}`
}

export interface SwitchAmTrunk {
  blattId: string
  blattName: string
  switchInstanz: KomponentenObjekt
  trunkId: string
  trunkName: string
  endeIndex: 0 | 1
}

export function ermittleSwitchesAnKette(
  zeichnung: Zeichnung,
  blattId: string,
  trunkId: string,
): SwitchAmTrunk[] {
  const ergebnis: SwitchAmTrunk[] = []
  const gesehen = new Set<string>()
  const kette = ermittleTrunkKette(zeichnung, blattId, trunkId)
  const teilstueckNamen = ermittleTeilstueckNamen(zeichnung, kette)
  for (const glied of kette) {
    const blatt = zeichnung.blaetter.find((b) => b.id === glied.blattId)
    if (!blatt) continue
    glied.trunk.enden.forEach((ende, index) => {
      if (!ende.dockRef || gesehen.has(ende.dockRef.objektId)) return
      const komponente = blatt.objekte.find(
        (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === ende.dockRef!.objektId,
      )
      if (!komponente || !istPortKomponente(komponente)) return
      gesehen.add(komponente.id)
      ergebnis.push({
        blattId: glied.blattId,
        blattName: blatt.name,
        switchInstanz: komponente,
        trunkId: glied.trunk.id,
        trunkName: teilstueckNamen.get(glied.trunk.id) ?? glied.trunk.name,
        endeIndex: index as 0 | 1,
      })
    })
  }
  return ergebnis
}

export function ermittleTrunksAmGeraet(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
): { blattId: string; trunkId: string }[] {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []
  const ergebnis: { blattId: string; trunkId: string }[] = []
  for (const objekt of blatt.objekte) {
    if (objekt.type !== 'trunk') continue
    if (objekt.enden.some((e) => e.dockRef?.objektId === objektId)) {
      ergebnis.push({ blattId, trunkId: objekt.id })
    }
  }
  return ergebnis
}

export function ermittleErreichbareGeraete(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
): SwitchAmTrunk[] {
  const gesehen = new Set<string>([objektId])
  const ergebnis: SwitchAmTrunk[] = []
  for (const { trunkId } of ermittleTrunksAmGeraet(zeichnung, blattId, objektId)) {
    for (const eintrag of ermittleSwitchesAnKette(zeichnung, blattId, trunkId)) {
      if (gesehen.has(eintrag.switchInstanz.id)) continue
      gesehen.add(eintrag.switchInstanz.id)
      ergebnis.push(eintrag)
    }
  }
  return ergebnis
}

export interface SwitchInZeichnung {
  blattId: string
  blattName: string
  objektId: string
  bezeichnung: string
}

export function ermittleAlleSwitches(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  nurBauart?: 'switch' | 'patchpanel',
  sprache: Sprache = planspracheVon(zeichnung),
): SwitchInZeichnung[] {
  const ergebnis: SwitchInZeichnung[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente' || !istPortKomponente(objekt)) continue
      if (nurBauart !== undefined) {
        const bauart = katalog.find((k) => k.id === objekt.catalogComponentId)?.bauart
        if ((bauart === 'patchpanel') !== (nurBauart === 'patchpanel')) continue
      }
      ergebnis.push({
        blattId: blatt.id,
        blattName: blatt.name,
        objektId: objekt.id,
        bezeichnung:
          switchBezeichnung(
            zeichnung,
            { blattId: blatt.id, objektId: objekt.id },
            katalog,
            sprache,
          ) ?? 'Switch',
      })
    }
  }
  return ergebnis
}

export function austrittTRichtungSwitch(
  zeichnung: Zeichnung,
  blattId: string,
  trunkId: string,
  switchObjektId: string,
): number {
  return austrittTRichtungZiel(zeichnung, blattId, trunkId, (t) => {
    const index = t.enden.findIndex((e) => e.dockRef?.objektId === switchObjektId)
    return index === 0 || index === 1 ? (index as 0 | 1) : null
  })
}

export function austrittTRichtungSchacht(
  zeichnung: Zeichnung,
  blattId: string,
  trunkId: string,
  schachtId: string,
): number {
  return austrittTRichtungZiel(zeichnung, blattId, trunkId, (t) => {
    const index = t.enden.findIndex((e) => e.schachtRef?.objektId === schachtId)
    return index === 0 || index === 1 ? (index as 0 | 1) : null
  })
}

function austrittTRichtungZiel(
  zeichnung: Zeichnung,
  blattId: string,
  trunkId: string,
  docktAn: (trunk: TrunkObjekt) => 0 | 1 | null,
): number {
  const alleTrunks = new Map<string, { blattId: string; trunk: TrunkObjekt }>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'trunk') alleTrunks.set(objekt.id, { blattId: blatt.id, trunk: objekt })
    }
  }
  const start = alleTrunks.get(trunkId)
  if (!start || start.blattId !== blattId) return 1

  const amStart = docktAn(start.trunk)
  if (amStart !== null) return amStart

  const verbundIndex = schachtVerbundIndex(zeichnung)
  const anschluesseJeStrang = trunkAnschluesseJeStrang(zeichnung)

  const ausgaenge = (t: TrunkObjekt): { trunkId: string; t: number }[] => {
    const liste: { trunkId: string; t: number }[] = []
    t.enden.forEach((ende, index) => {
      if (ende.verbundenesEnde) liste.push({ trunkId: ende.verbundenesEnde.trunkId, t: index })
      if (ende.verbundenerPfad) liste.push({ trunkId: ende.verbundenerPfad.trunkId, t: index })
    })
    for (const { trunk: fremd } of alleTrunks.values()) {
      if (fremd.id === t.id) continue
      for (const ende of fremd.enden) {
        if (ende.verbundenerPfad?.trunkId === t.id) {
          liste.push({ trunkId: fremd.id, t: ende.verbundenerPfad.t })
        }
      }
    }
    t.enden.forEach((ende, index) => {
      if (!ende.schachtRef) return
      const schluessel = `${verbundIndex.get(ende.schachtRef.objektId)}#${ende.schachtRef.strang}`
      for (const nachbar of anschluesseJeStrang.get(schluessel) ?? []) {
        if (nachbar.trunk.id !== t.id) liste.push({ trunkId: nachbar.trunk.id, t: index })
      }
    })
    return liste
  }

  for (const ausgang of ausgaenge(start.trunk)) {
    const besucht = new Set<string>([start.trunk.id])
    const warteschlange = [ausgang.trunkId]
    while (warteschlange.length > 0) {
      const aktuellerId = warteschlange.shift()!
      if (besucht.has(aktuellerId)) continue
      besucht.add(aktuellerId)
      const eintrag = alleTrunks.get(aktuellerId)
      if (!eintrag) continue
      if (docktAn(eintrag.trunk) !== null) return ausgang.t
      for (const naechster of ausgaenge(eintrag.trunk)) warteschlange.push(naechster.trunkId)
    }
  }
  return 1
}

export interface PortZuweisung {
  switchObjektId: string
  portIndex: number
  leitungId: string
  leitungBlattId: string
  leitungsNummer: number
  gegenstelle: KomponentenObjekt | null
  gegenstelleModule: KomponentenObjekt[]
  gegenueber: { blattId: string; objektId: string; portIndex: number } | null
  gegenueberBeschriftung: string | null
}

function moduleDerGegenstelle(
  objekte: readonly Objekt[],
  gegenstelle: KomponentenObjekt | null,
): KomponentenObjekt[] {
  if (!gegenstelle || gegenstelle.modulTraeger === undefined) return []
  return moduleVonTraeger(objekte, gegenstelle.id)
}

function findeKomponente(objekte: readonly Objekt[], objektId: string): KomponentenObjekt | null {
  const treffer = objekte.find((o) => o.id === objektId)
  return treffer && treffer.type === 'komponente' ? treffer : null
}

export function sammlePortZuweisungen(zeichnung: Zeichnung): Map<string, PortZuweisung[]> {
  const ergebnis = new Map<string, PortZuweisung[]>()
  const eintragen = (zuweisung: PortZuweisung) => {
    const liste = ergebnis.get(zuweisung.switchObjektId)
    if (liste) liste.push(zuweisung)
    else ergebnis.set(zuweisung.switchObjektId, [zuweisung])
  }

  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'leitung') continue

      const zuweisungsEnden: { eigenes: LeitungsZiel; anderes: LeitungsZiel }[] = [
        { eigenes: objekt.start, anderes: objekt.ziel },
        { eigenes: objekt.ziel, anderes: objekt.start },
      ]
      let hatSwitchportEnde = false
      for (const { eigenes, anderes } of zuweisungsEnden) {
        if (eigenes.art !== 'switchport') continue
        hatSwitchportEnde = true
        const gegenstelle =
          anderes.art === 'dock' ? findeKomponente(blatt.objekte, anderes.objektId) : null
        const gegenueberKomponente =
          anderes.art === 'switchport'
            ? findeKomponente(
                zeichnung.blaetter.find((b) => b.id === anderes.blattId)?.objekte ?? [],
                anderes.objektId,
              )
            : null
        eintragen({
          switchObjektId: eigenes.objektId,
          portIndex: eigenes.portIndex,
          leitungId: objekt.id,
          leitungBlattId: blatt.id,
          leitungsNummer: objekt.nummer,
          gegenstelle,
          gegenstelleModule: moduleDerGegenstelle(blatt.objekte, gegenstelle),
          gegenueber:
            anderes.art === 'switchport'
              ? {
                  blattId: anderes.blattId,
                  objektId: anderes.objektId,
                  portIndex: anderes.portIndex,
                }
              : null,
          gegenueberBeschriftung: gegenueberKomponente?.beschriftung?.trim() || null,
        })
      }
      if (hatSwitchportEnde) continue

      const enden = [
        { eigenes: objekt.start, anderes: objekt.ziel },
        { eigenes: objekt.ziel, anderes: objekt.start },
      ]
      for (const { eigenes, anderes } of enden) {
        if (eigenes.art !== 'dock') continue
        const switchKomponente = findeKomponente(blatt.objekte, eigenes.objektId)
        if (!switchKomponente || !istPortKomponente(switchKomponente)) continue
        if (eigenes.dockpunktIndex >= portAnzahl(switchKomponente)) continue
        const gegenstelle =
          anderes.art === 'dock' ? findeKomponente(blatt.objekte, anderes.objektId) : null
        eintragen({
          switchObjektId: switchKomponente.id,
          portIndex: eigenes.dockpunktIndex,
          leitungId: objekt.id,
          leitungBlattId: blatt.id,
          leitungsNummer: objekt.nummer,
          gegenstelle,
          gegenstelleModule: moduleDerGegenstelle(blatt.objekte, gegenstelle),
          gegenueber: null,
          gegenueberBeschriftung: null,
        })
      }
    }
  }
  return ergebnis
}

export interface PortBelegung {
  portIndex: number
  bezeichnung: string
  beschriftung: string | null
  beschriftungVonGegenstelle: boolean
  belegtDurch: PortZuweisung | null
  gegenstelleKatalog: CatalogComponent | null
  gegenueber: { blattId: string; objektId: string; portIndex: number } | null
  poeWatt: number
  poeGepflegt: boolean
}

export function ermittlePortBelegung(
  switchInstanz: KomponentenObjekt,
  zuweisungen: readonly PortZuweisung[] | undefined,
  katalog: readonly CatalogComponent[],
): PortBelegung[] {
  const anzahl = portAnzahl(switchInstanz)
  const proPort = new Map<number, PortZuweisung>()
  for (const zuweisung of zuweisungen ?? []) {
    if (zuweisung.portIndex < 0 || zuweisung.portIndex >= anzahl) continue
    if (!proPort.has(zuweisung.portIndex)) proPort.set(zuweisung.portIndex, zuweisung)
  }

  const belegung: PortBelegung[] = []
  for (let portIndex = 0; portIndex < anzahl; portIndex++) {
    const zuweisung = proPort.get(portIndex) ?? null
    const katalogEintrag = zuweisung?.gegenstelle
      ? (katalog.find((k) => k.id === zuweisung.gegenstelle!.catalogComponentId) ?? null)
      : null
    const modulPoeWerte = (zuweisung?.gegenstelleModule ?? []).map((modul) => {
      const eintrag = katalog.find((k) => k.id === modul.catalogComponentId)
      return eintrag?.poeLeistungWatt ?? eintrag?.wattzahl
    })
    const gegenstelleBeschriftung =
      zuweisung?.gegenstelle?.beschriftung?.trim() || zuweisung?.gegenueberBeschriftung || null
    belegung.push({
      portIndex,
      bezeichnung: portBezeichnung(portIndex),
      beschriftung:
        gegenstelleBeschriftung ??
        (switchInstanz.portBeschriftungen?.[String(portIndex)]?.trim() || null),
      beschriftungVonGegenstelle: gegenstelleBeschriftung !== null,
      belegtDurch: zuweisung,
      gegenstelleKatalog: katalogEintrag,
      gegenueber: zuweisung?.gegenueber ?? null,
      poeWatt: rundeWatt(
        (katalogEintrag?.poeLeistungWatt ?? 0) +
          modulPoeWerte.reduce((summe: number, w) => summe + (w ?? 0), 0),
      ),
      poeGepflegt:
        katalogEintrag?.poeLeistungWatt !== undefined || modulPoeWerte.some((w) => w !== undefined),
    })
  }
  return belegung
}

export function benoetigtePortAnzahl(zeichnung: Zeichnung, instanz: KomponentenObjekt): number {
  const zuweisungen = sammlePortZuweisungen(zeichnung).get(instanz.id) ?? []
  if (zuweisungen.length === 0) return 0
  return Math.max(...zuweisungen.map((zuweisung) => zuweisung.portIndex)) + 1
}

function rundeWatt(watt: number): number {
  return Math.round(watt * 100) / 100
}

export function ermittlePoeSummeWatt(belegung: readonly PortBelegung[]): number {
  return rundeWatt(belegung.reduce((summe, port) => summe + port.poeWatt, 0))
}

export function ermittlePoeSummenJeSwitch(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
): Map<string, number> {
  const zuweisungen = sammlePortZuweisungen(zeichnung)
  const summen = new Map<string, number>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente' || !istPortKomponente(objekt)) continue
      const belegung = ermittlePortBelegung(objekt, zuweisungen.get(objekt.id), katalog)
      const summe = ermittlePoeSummeWatt(belegung)
      if (summe > 0) summen.set(objekt.id, summe)
    }
  }
  return summen
}

export function switchBezeichnung(
  zeichnung: Zeichnung,
  ziel: { blattId: string; objektId: string },
  katalog: readonly CatalogComponent[],
  sprache: Sprache = planspracheVon(zeichnung),
): string | null {
  const blatt = zeichnung.blaetter.find((b) => b.id === ziel.blattId)
  const instanz = blatt?.objekte.find(
    (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === ziel.objektId,
  )
  if (!instanz) return null
  const frei = instanz.beschriftung?.trim()
  if (frei) return frei
  const katalogEintrag = katalog.find((k) => k.id === instanz.catalogComponentId)
  return katalogEintrag
    ? aufgeloesteVariante(katalogEintrag, instanz.variantId, sprache).name
    : null
}

export interface PortSchild {
  punkt: Point
  t: number
  ankerPunkt: Point | null
  leitungId: string
  text: string
}

export function ermittlePortSchilder(
  zeichnung: Zeichnung,
  blattId: string,
  trunk: TrunkObjekt,
  katalog: readonly CatalogComponent[],
): PortSchild[] {
  if (trunk.wegpunkte.length === 0) return []
  const objekteAufBlatt = zeichnung.blaetter.find((b) => b.id === blattId)?.objekte ?? []
  const schilder: PortSchild[] = []
  for (const objekt of objekteAufBlatt) {
    if (objekt.type !== 'leitung' || !istBuendelEnde(objekt.ziel)) continue
    const letzter = objekt.trunkDurchgaenge[objekt.trunkDurchgaenge.length - 1]
    if (!letzter || letzter.trunkId !== trunk.id) continue
    const ziel = objekt.ziel
    let wohin: string
    if (ziel.art === 'verteiler') {
      const verteiler = zeichnung.blaetter
        .find((b) => b.id === ziel.blattId)
        ?.objekte.find((o) => o.id === ziel.objektId)
      const istUv = verteiler?.type === 'komponente' && verteiler.verteiler !== undefined
      wohin = verteilerSchildTextAusBaum(
        (istUv && verteiler.verteiler?.kennzeichen) || '?',
        istUv ? baueVerteilerBaum(verteiler, katalog) : null,
        (objekt.verteilerAnschluesse ?? []).filter((a) => a.ende === 'ziel'),
        zeichnung.blaetter.find((b) => b.id === blattId)?.stromkreisSchildSichtbar ?? true,
      )
    } else {
      const name = switchBezeichnung(zeichnung, ziel, katalog)
      const port = portBezeichnung(ziel.portIndex)
      wohin = name ? `${name}/${port}` : port
    }
    const punkt = punktAufPfad(trunk.wegpunkte, letzter.eintrittT)
    const abschnitt = objekt.pfadSegmente[objekt.trunkDurchgaenge.length - 1] ?? []
    const vorletzter = abschnitt.length >= 2 ? abschnitt[abschnitt.length - 2] : null
    schilder.push({
      punkt,
      t: letzter.eintrittT,
      ankerPunkt:
        vorletzter && (vorletzter.x !== punkt.x || vorletzter.y !== punkt.y) ? vorletzter : null,
      leitungId: objekt.id,
      text: `${objekt.nummer} → ${wohin}`,
    })
  }
  return schilder
}
