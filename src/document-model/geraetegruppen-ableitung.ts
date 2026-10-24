import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'
import type { CatalogComponent } from './catalog'
import { aufgeloesteVariante } from './catalog'
import { spracheDesUebersetzers } from './plansprache'
import type { Point } from './geometry'
import {
  erzeugeSlot,
  gruppiereSlotsNachZeile,
  matrixKapazitaet,
  spaltenFuerZeile,
  typHatAnsteuerung,
  typHatSlots,
  typVerbindungenGrau,
} from './geraetegruppe'
import { aktivesRegelwerk } from './geraete-regelwerk'
import type {
  Ansteuerung,
  KomponentenTyp,
  Slot,
  SlotMatrix,
  SlotVorlage,
  SlotZiel,
} from './geraetegruppe'
import type { KomponentenObjekt } from './objekte'
import type { Zeichnung } from './zeichnung'

export function ableiteSlotMatrix(slotMatrix: SlotMatrix | undefined, slots: Slot[]): SlotMatrix {
  if (slotMatrix && matrixKapazitaet(slotMatrix) === slots.length) return slotMatrix
  return { spalten: 1, zeilen: Math.max(1, slots.length) }
}

export function ermittleTypUndSlots(
  instanz: KomponentenObjekt,
  zeichnung: Zeichnung,
): { typ: KomponentenTyp; slots: Slot[]; slotMatrix: SlotMatrix } | null {
  if (instanz.gruppeId) {
    const gruppe = zeichnung.geraeteGruppen.find((g) => g.id === instanz.gruppeId)
    if (!gruppe) return null
    return {
      typ: gruppe.typ,
      slots: gruppe.slots,
      slotMatrix: ableiteSlotMatrix(gruppe.slotMatrix, gruppe.slots),
    }
  }
  if (instanz.typ) {
    const slots = instanz.slots ?? []
    return { typ: instanz.typ, slots, slotMatrix: ableiteSlotMatrix(instanz.slotMatrix, slots) }
  }
  return null
}

export function passeSlotsAnMatrixAn(
  slots: Slot[],
  matrix: SlotMatrix,
  alteMatrix?: SlotMatrix,
): { slots: Slot[]; entfernteMitZielen: Slot[] } {
  if (!alteMatrix) {
    const kapazitaet = matrixKapazitaet(matrix)
    if (kapazitaet >= slots.length) {
      const neu = [...slots]
      while (neu.length < kapazitaet) neu.push(erzeugeSlot())
      return { slots: neu, entfernteMitZielen: [] }
    }
    const behalten = slots.slice(0, kapazitaet)
    const entfernt = slots.slice(kapazitaet)
    return { slots: behalten, entfernteMitZielen: entfernt.filter((s) => s.ziele.length > 0) }
  }

  const alteZeilen = gruppiereSlotsNachZeile(slots, alteMatrix)
  const neu: Slot[] = []
  const entfernteMitZielen: Slot[] = []
  for (let zeile0 = 0; zeile0 < matrix.zeilen; zeile0++) {
    const alteZeile = alteZeilen[zeile0]?.slots.map((eintrag) => eintrag.slot) ?? []
    const breite = spaltenFuerZeile(matrix, zeile0)
    for (let s = 0; s < breite; s++) neu.push(alteZeile[s] ?? erzeugeSlot())
    for (let s = breite; s < alteZeile.length; s++) {
      if (alteZeile[s].ziele.length > 0) entfernteMitZielen.push(alteZeile[s])
    }
  }
  for (let zeile0 = matrix.zeilen; zeile0 < alteZeilen.length; zeile0++) {
    for (const { slot } of alteZeilen[zeile0].slots) {
      if (slot.ziele.length > 0) entfernteMitZielen.push(slot)
    }
  }
  return { slots: neu, entfernteMitZielen }
}

export function ermittleGemeinsamenTyp(
  instanzen: readonly KomponentenObjekt[],
  zeichnung: Zeichnung,
): KomponentenTyp | null {
  let gemeinsam: KomponentenTyp | null = null
  for (const instanz of instanzen) {
    const typ = ermittleTypUndSlots(instanz, zeichnung)?.typ ?? null
    if (!typ || (gemeinsam !== null && typ !== gemeinsam)) return null
    gemeinsam = typ
  }
  return gemeinsam
}

function findeInstanz(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
): KomponentenObjekt | undefined {
  return zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o): o is KomponentenObjekt => o.type === 'komponente' && o.id === objektId)
}

export function zielSchluessel(ziel: SlotZiel): string {
  return ziel.art === 'instanz'
    ? `instanz:${ziel.blattId}:${ziel.objektId}`
    : `gruppe:${ziel.gruppeId}`
}

function ausgehendeSlots(zeichnung: Zeichnung, ziel: SlotZiel): Slot[] {
  if (ziel.art === 'gruppe') {
    return zeichnung.geraeteGruppen.find((g) => g.id === ziel.gruppeId)?.slots ?? []
  }
  const instanz = findeInstanz(zeichnung, ziel.blattId, ziel.objektId)
  return instanz ? (ermittleTypUndSlots(instanz, zeichnung)?.slots ?? []) : []
}

export function ermittleUrsprung(instanz: KomponentenObjekt, blattId: string): SlotZiel {
  return instanz.gruppeId
    ? { art: 'gruppe', gruppeId: instanz.gruppeId }
    : { art: 'instanz', blattId, objektId: instanz.id }
}

export function erzeugtZyklus(
  zeichnung: Zeichnung,
  ursprung: SlotZiel,
  neuesZiel: SlotZiel,
): boolean {
  const ursprungSchluessel = zielSchluessel(ursprung)
  const besucht = new Set<string>()
  const warteschlange: SlotZiel[] = [neuesZiel]
  let aktuelles: SlotZiel | undefined
  while ((aktuelles = warteschlange.shift())) {
    const schluessel = zielSchluessel(aktuelles)
    if (schluessel === ursprungSchluessel) return true
    if (besucht.has(schluessel)) continue
    besucht.add(schluessel)
    for (const slot of ausgehendeSlots(zeichnung, aktuelles)) warteschlange.push(...slot.ziele)
  }
  return false
}

export interface KomponenteInZeichnung {
  blattId: string
  blattName: string
  objektId: string
  bezeichnung: string
}

export function ermittleAlleKomponenten(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
): KomponenteInZeichnung[] {
  const ergebnis: KomponenteInZeichnung[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente') continue
      ergebnis.push({
        blattId: blatt.id,
        blattName: blatt.name,
        objektId: objekt.id,
        bezeichnung: komponentenBezeichnung(objekt, katalog),
      })
    }
  }
  return ergebnis
}

export function komponentenBezeichnung(
  instanz: KomponentenObjekt,
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer = t,
): string {
  const frei = instanz.beschriftung?.trim()
  if (frei) return frei
  const katalogEintrag = katalog.find((k) => k.id === instanz.catalogComponentId)
  return katalogEintrag
    ? aufgeloesteVariante(katalogEintrag, instanz.variantId, spracheDesUebersetzers(uebersetze))
        .name
    : uebersetze('generatoren.ersatz.komponente')
}

export function zielBezeichnung(
  ziel: SlotZiel,
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer = t,
): string {
  if (ziel.art === 'gruppe') {
    const gruppe = zeichnung.geraeteGruppen.find((g) => g.id === ziel.gruppeId)
    if (!gruppe) return uebersetze('generatoren.ersatz.geraetegruppeGeloescht')
    return gruppe.name?.trim() || uebersetze('generatoren.ersatz.geraetegruppe')
  }
  const instanz = findeInstanz(zeichnung, ziel.blattId, ziel.objektId)
  if (!instanz) return uebersetze('generatoren.ersatz.komponenteGeloescht')
  return komponentenBezeichnung(instanz, katalog, uebersetze)
}

export function ermittleZielTyp(ziel: SlotZiel, zeichnung: Zeichnung): KomponentenTyp | null {
  if (ziel.art === 'gruppe') {
    return zeichnung.geraeteGruppen.find((g) => g.id === ziel.gruppeId)?.typ ?? null
  }
  const instanz = findeInstanz(zeichnung, ziel.blattId, ziel.objektId)
  return instanz ? (ermittleTypUndSlots(instanz, zeichnung)?.typ ?? null) : null
}

export function ermittleAnsteuerung(
  instanz: KomponentenObjekt,
  zeichnung: Zeichnung,
): Ansteuerung | null {
  if (instanz.gruppeId) {
    const gruppe = zeichnung.geraeteGruppen.find((g) => g.id === instanz.gruppeId)
    return gruppe && typHatAnsteuerung(gruppe.typ) ? (gruppe.ansteuerung ?? null) : null
  }
  return instanz.typ && typHatAnsteuerung(instanz.typ) ? (instanz.ansteuerung ?? null) : null
}

export function ermittleZielAnsteuerung(ziel: SlotZiel, zeichnung: Zeichnung): Ansteuerung | null {
  if (ziel.art === 'gruppe') {
    const gruppe = zeichnung.geraeteGruppen.find((g) => g.id === ziel.gruppeId)
    return gruppe && typHatAnsteuerung(gruppe.typ) ? (gruppe.ansteuerung ?? null) : null
  }
  const instanz = findeInstanz(zeichnung, ziel.blattId, ziel.objektId)
  return instanz ? ermittleAnsteuerung(instanz, zeichnung) : null
}

export function istUeblicheTypKombination(quelle: KomponentenTyp, ziel: KomponentenTyp): boolean {
  return typHatSlots(quelle) && (aktivesRegelwerk().ueblicheZiele[quelle]?.includes(ziel) ?? false)
}

export function bereinigeSlots(slots: Slot[], istGeloescht: (ziel: SlotZiel) => boolean): Slot[] {
  let veraendert = false
  const bereinigt = slots.map((slot) => {
    const ziele = slot.ziele.filter((z) => !istGeloescht(z))
    if (ziele.length === slot.ziele.length) return slot
    veraendert = true
    return { ...slot, ziele }
  })
  return veraendert ? bereinigt : slots
}

export type SlotVerbindung =
  | {
      von: Point
      nach: Point
      richtung: 'ausgehend'
      slotIndex: number
      zwischenBediengeraeten?: true
    }
  | { von: Point; nach: Point; richtung: 'eingehend'; zwischenBediengeraeten?: true }

function ermittlePositionenVonZiel(ziel: SlotZiel, blattId: string, zeichnung: Zeichnung): Point[] {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []
  if (ziel.art === 'instanz') {
    if (ziel.blattId !== blattId) return []
    const instanz = blatt.objekte.find(
      (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === ziel.objektId,
    )
    return instanz ? [instanz.position] : []
  }
  return blatt.objekte
    .filter((o): o is KomponentenObjekt => o.type === 'komponente' && o.gruppeId === ziel.gruppeId)
    .map((o) => o.position)
}

function ermittleObjektIdsVonZiel(ziel: SlotZiel, blattId: string, zeichnung: Zeichnung): string[] {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []
  if (ziel.art === 'instanz') {
    if (ziel.blattId !== blattId) return []
    const vorhanden = blatt.objekte.some((o) => o.type === 'komponente' && o.id === ziel.objektId)
    return vorhanden ? [ziel.objektId] : []
  }
  return blatt.objekte
    .filter((o): o is KomponentenObjekt => o.type === 'komponente' && o.gruppeId === ziel.gruppeId)
    .map((o) => o.id)
}

export function ermittleSlotZielObjektIds(
  instanz: KomponentenObjekt,
  slotId: string,
  blattId: string,
  zeichnung: Zeichnung,
): string[] {
  const aufgeloest = ermittleTypUndSlots(instanz, zeichnung)
  const slot = aufgeloest?.slots.find((s) => s.id === slotId)
  if (!slot) return []
  const ids = new Set<string>()
  for (const ziel of slot.ziele) {
    for (const id of ermittleObjektIdsVonZiel(ziel, blattId, zeichnung)) ids.add(id)
  }
  return [...ids]
}

export function ermittleSlotVerbindungen(
  instanz: KomponentenObjekt,
  blattId: string,
  zeichnung: Zeichnung,
): SlotVerbindung[] {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []
  const verbindungen: SlotVerbindung[] = []

  const aufgeloest = ermittleTypUndSlots(instanz, zeichnung)
  const selbstGrau = !!aufgeloest && typVerbindungenGrau(aufgeloest.typ)
  if (aufgeloest) {
    aufgeloest.slots.forEach((slot, slotIndex) => {
      for (const ziel of slot.ziele) {
        const zielTyp = selbstGrau ? ermittleZielTyp(ziel, zeichnung) : null
        const bediengeraete = !!zielTyp && typVerbindungenGrau(zielTyp)
        for (const position of ermittlePositionenVonZiel(ziel, blattId, zeichnung)) {
          verbindungen.push({
            von: instanz.position,
            nach: position,
            richtung: 'ausgehend',
            slotIndex,
            ...(bediengeraete && { zwischenBediengeraeten: true as const }),
          })
        }
      }
    })
  }

  const ursprungSchluessel = zielSchluessel(ermittleUrsprung(instanz, blattId))
  for (const objekt of blatt.objekte) {
    if (objekt.type !== 'komponente' || objekt.id === instanz.id) continue
    const quelle = ermittleTypUndSlots(objekt, zeichnung)
    if (!quelle) continue
    const trifftZu = quelle.slots.some((s) =>
      s.ziele.some((z) => zielSchluessel(z) === ursprungSchluessel),
    )
    if (trifftZu)
      verbindungen.push({
        von: objekt.position,
        nach: instanz.position,
        richtung: 'eingehend',
        ...(selbstGrau &&
          typVerbindungenGrau(quelle.typ) && { zwischenBediengeraeten: true as const }),
      })
  }

  return verbindungen
}

export type EtagenWirkverbindung = {
  blattId: string
  blattName: string
  objektId: string
  bezeichnung: string
} & ({ richtung: 'ausgehend'; slotIndex: number } | { richtung: 'eingehend' })

export function etagenVerweiseFuerZiele(
  ziele: readonly SlotZiel[],
  slotIndex: number,
  blattId: string,
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer = t,
): EtagenWirkverbindung[] {
  const ergebnis: EtagenWirkverbindung[] = []
  for (const ziel of ziele) {
    if (ziel.art === 'instanz') {
      if (ziel.blattId === blattId) continue
      const blatt = zeichnung.blaetter.find((b) => b.id === ziel.blattId)
      const instanz = findeInstanz(zeichnung, ziel.blattId, ziel.objektId)
      if (!blatt || !instanz) continue
      ergebnis.push({
        richtung: 'ausgehend',
        slotIndex,
        blattId: blatt.id,
        blattName: blatt.name,
        objektId: instanz.id,
        bezeichnung: komponentenBezeichnung(instanz, katalog, uebersetze),
      })
      continue
    }
    const gruppe = zeichnung.geraeteGruppen.find((g) => g.id === ziel.gruppeId)
    for (const blatt of zeichnung.blaetter) {
      if (blatt.id === blattId) continue
      const erstesMitglied = blatt.objekte.find(
        (o): o is KomponentenObjekt => o.type === 'komponente' && o.gruppeId === ziel.gruppeId,
      )
      if (!erstesMitglied) continue
      ergebnis.push({
        richtung: 'ausgehend',
        slotIndex,
        blattId: blatt.id,
        blattName: blatt.name,
        objektId: erstesMitglied.id,
        bezeichnung: gruppe?.name?.trim() || uebersetze('generatoren.ersatz.geraetegruppe'),
      })
    }
  }
  return ergebnis
}

export function ermittleEtagenWirkverbindungen(
  instanz: KomponentenObjekt,
  blattId: string,
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  uebersetze: Uebersetzer = t,
): EtagenWirkverbindung[] {
  const blattIndex = new Map(zeichnung.blaetter.map((b, i) => [b.id, i] as const))
  const ausgehend: EtagenWirkverbindung[] = []
  const aufgeloest = ermittleTypUndSlots(instanz, zeichnung)
  aufgeloest?.slots.forEach((slot, slotIndex) => {
    ausgehend.push(
      ...etagenVerweiseFuerZiele(slot.ziele, slotIndex, blattId, zeichnung, katalog, uebersetze),
    )
  })
  ausgehend.sort((a, b) => (blattIndex.get(a.blattId) ?? 0) - (blattIndex.get(b.blattId) ?? 0))

  const eingehend: EtagenWirkverbindung[] = []
  const ursprungSchluessel = zielSchluessel(ermittleUrsprung(instanz, blattId))
  for (const blatt of zeichnung.blaetter) {
    if (blatt.id === blattId) continue
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente') continue
      const quelle = ermittleTypUndSlots(objekt, zeichnung)
      const trifftZu = quelle?.slots.some((s) =>
        s.ziele.some((z) => zielSchluessel(z) === ursprungSchluessel),
      )
      if (!trifftZu) continue
      eingehend.push({
        richtung: 'eingehend',
        blattId: blatt.id,
        blattName: blatt.name,
        objektId: objekt.id,
        bezeichnung: komponentenBezeichnung(objekt, katalog, uebersetze),
      })
    }
  }

  const gesehen = new Set<string>()
  return [...ausgehend, ...eingehend].filter((v) => {
    const schluessel = `${v.richtung}|${v.richtung === 'ausgehend' ? v.slotIndex : ''}|${v.blattId}|${v.objektId}`
    if (gesehen.has(schluessel)) return false
    gesehen.add(schluessel)
    return true
  })
}

export interface GruppenVerbindung {
  von: Point
  nach: Point
}

export function ermittleGruppenVerbindungen(
  instanz: KomponentenObjekt,
  blattId: string,
  zeichnung: Zeichnung,
): GruppenVerbindung[] {
  if (!instanz.gruppeId) return []
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []
  return blatt.objekte
    .filter(
      (o): o is KomponentenObjekt =>
        o.type === 'komponente' && o.id !== instanz.id && o.gruppeId === instanz.gruppeId,
    )
    .map((o) => ({ von: instanz.position, nach: o.position }))
}

export interface GeschwisterVerbindung {
  von: Point
  nach: Point
}

export function ermittleGeschwisterVerbindungen(
  instanz: KomponentenObjekt,
  blattId: string,
  zeichnung: Zeichnung,
): GeschwisterVerbindung[] {
  const aufgeloest = ermittleTypUndSlots(instanz, zeichnung)
  if (!aufgeloest) return []
  const eigeneZiele = new Set(
    aufgeloest.slots.flatMap((s) => s.ziele.map((z) => zielSchluessel(z))),
  )
  if (eigeneZiele.size === 0) return []

  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []

  const ursprungSchluessel = zielSchluessel(ermittleUrsprung(instanz, blattId))
  const verbindungen: GeschwisterVerbindung[] = []
  for (const objekt of blatt.objekte) {
    if (objekt.type !== 'komponente' || objekt.id === instanz.id) continue
    if (zielSchluessel(ermittleUrsprung(objekt, blattId)) === ursprungSchluessel) continue
    const quelle = ermittleTypUndSlots(objekt, zeichnung)
    if (!quelle) continue
    const teiltZiel = quelle.slots.some((s) =>
      s.ziele.some((z) => eigeneZiele.has(zielSchluessel(z))),
    )
    if (teiltZiel) verbindungen.push({ von: instanz.position, nach: objekt.position })
  }
  return verbindungen
}

export interface SlotGrafikMarkierung {
  blattId: string
  objektId: string
  position: Point
  typ: KomponentenTyp
  slots: Slot[]
  slotMatrix: SlotMatrix
  richtung: 'ausgehend' | 'eingehend' | 'aktiv'
  hervorgehobeneSlotIds: readonly string[]
}

export function ermittleSlotGrafikMarkierungen(
  instanzen: readonly KomponentenObjekt[],
  blattId: string,
  zeichnung: Zeichnung,
): SlotGrafikMarkierung[] {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []

  const ausgewaehlteIds = new Set(instanzen.map((i) => i.id))
  const slotIdsProObjekt = new Map<string, Set<string>>()
  const fuegeHinzu = (objektId: string, slotIdEintrag: string) => {
    let set = slotIdsProObjekt.get(objektId)
    if (!set) {
      set = new Set()
      slotIdsProObjekt.set(objektId, set)
    }
    set.add(slotIdEintrag)
  }

  for (const instanz of instanzen) {
    const aufgeloest = ermittleTypUndSlots(instanz, zeichnung)
    if (!aufgeloest) continue
    const eigeneZiele = new Set<string>()
    for (const slot of aufgeloest.slots) {
      if (slot.ziele.length === 0) continue
      fuegeHinzu(instanz.id, slot.id)
      for (const ziel of slot.ziele) eigeneZiele.add(zielSchluessel(ziel))
    }

    const ursprungSchluessel = zielSchluessel(ermittleUrsprung(instanz, blattId))
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente' || objekt.id === instanz.id) continue
      const quelle = ermittleTypUndSlots(objekt, zeichnung)
      if (!quelle) continue
      const objektUrsprungSchluessel = zielSchluessel(ermittleUrsprung(objekt, blattId))
      for (const slot of quelle.slots) {
        const zeigtAufInstanz = slot.ziele.some((z) => zielSchluessel(z) === ursprungSchluessel)
        const istGeschwister =
          objektUrsprungSchluessel !== ursprungSchluessel &&
          eigeneZiele.size > 0 &&
          slot.ziele.some((z) => eigeneZiele.has(zielSchluessel(z)))
        if (zeigtAufInstanz || istGeschwister) fuegeHinzu(objekt.id, slot.id)
      }
    }
  }

  const ergebnis: SlotGrafikMarkierung[] = []
  for (const [objektId, slotIds] of slotIdsProObjekt) {
    const objekt = blatt.objekte.find(
      (o): o is KomponentenObjekt => o.type === 'komponente' && o.id === objektId,
    )
    if (!objekt) continue
    const aufgeloest = ermittleTypUndSlots(objekt, zeichnung)
    if (!aufgeloest) continue
    ergebnis.push({
      blattId,
      objektId,
      position: objekt.position,
      typ: aufgeloest.typ,
      slots: aufgeloest.slots,
      slotMatrix: aufgeloest.slotMatrix,
      richtung: ausgewaehlteIds.has(objektId) ? 'ausgehend' : 'eingehend',
      hervorgehobeneSlotIds: [...slotIds],
    })
  }
  return ergebnis
}

export interface EingehenderSlotVerweis {
  quelleBezeichnung: string
  slotBezeichnung?: string
}

export function ermittleEingehendeSlotVerweise(
  instanz: KomponentenObjekt,
  blattId: string,
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
): EingehenderSlotVerweis[] {
  const ursprungSchluessel = zielSchluessel(ermittleUrsprung(instanz, blattId))
  const gesehen = new Set<string>()
  const ergebnis: EingehenderSlotVerweis[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'komponente') continue
      const quelleUrsprung = ermittleUrsprung(objekt, blatt.id)
      const quelleSchluessel = zielSchluessel(quelleUrsprung)
      if (quelleSchluessel === ursprungSchluessel) continue
      const quelle = ermittleTypUndSlots(objekt, zeichnung)
      if (!quelle) continue
      for (const slot of quelle.slots) {
        if (!slot.ziele.some((z) => zielSchluessel(z) === ursprungSchluessel)) continue
        const dedupSchluessel = `${quelleSchluessel}:${slot.id}`
        if (gesehen.has(dedupSchluessel)) continue
        gesehen.add(dedupSchluessel)
        ergebnis.push({
          quelleBezeichnung: zielBezeichnung(quelleUrsprung, zeichnung, katalog),
          slotBezeichnung: slot.bezeichnung,
        })
      }
    }
  }
  return ergebnis
}

export function slotsAusVorlagen(
  slotVorlagen: SlotVorlage[] | undefined,
  slotMatrixVorlage: SlotMatrix | undefined,
): Slot[] | undefined {
  if (!slotVorlagen && !slotMatrixVorlage) return undefined
  const slots = slotVorlagen?.map((vorlage) => erzeugeSlot(vorlage.bezeichnung)) ?? []
  return slotMatrixVorlage ? passeSlotsAnMatrixAn(slots, slotMatrixVorlage).slots : slots
}
