import type { Blatt } from './blatt'
import type { Zeichnung } from './zeichnung'
import type { LeitungsObjekt, Objekt, TrunkObjekt } from './objekte'
import { istBuendelEnde } from './objekte'
import type { Point } from './geometry'
import { istKabelschacht, trunkAnschluesseJeStrang } from './kabelschacht'
import { planUebersetzer } from './plansprache'

export interface TrunkKettenGlied {
  blattId: string
  trunk: TrunkObjekt
}

export function punktAufPfad(pfad: Point[], t: number): Point {
  if (pfad.length === 0) return { x: 0, y: 0 }
  if (pfad.length === 1) return pfad[0]
  const tGeklemmt = Math.max(0, Math.min(1, t))
  const laengen: number[] = []
  let gesamt = 0
  for (let i = 0; i < pfad.length - 1; i++) {
    const l = Math.hypot(pfad[i + 1].x - pfad[i].x, pfad[i + 1].y - pfad[i].y)
    laengen.push(l)
    gesamt += l
  }
  if (gesamt === 0) return pfad[0]
  let rest = tGeklemmt * gesamt
  for (let i = 0; i < laengen.length; i++) {
    if (rest <= laengen[i] || i === laengen.length - 1) {
      const lokalesT = laengen[i] === 0 ? 0 : rest / laengen[i]
      return {
        x: pfad[i].x + (pfad[i + 1].x - pfad[i].x) * lokalesT,
        y: pfad[i].y + (pfad[i + 1].y - pfad[i].y) * lokalesT,
      }
    }
    rest -= laengen[i]
  }
  return pfad[pfad.length - 1]
}

export function naechsterPunktAufPfad(
  pfad: Point[],
  punkt: Point,
): { punkt: Point; t: number; distanz: number } | null {
  if (pfad.length < 2) return null
  const laengen: number[] = []
  let gesamt = 0
  for (let i = 0; i < pfad.length - 1; i++) {
    laengen.push(Math.hypot(pfad[i + 1].x - pfad[i].x, pfad[i + 1].y - pfad[i].y))
    gesamt += laengen[i]
  }
  if (gesamt === 0) {
    return { punkt: pfad[0], t: 0, distanz: Math.hypot(punkt.x - pfad[0].x, punkt.y - pfad[0].y) }
  }

  let bester: { punkt: Point; t: number; distanz: number } | null = null
  let laengeBisSegment = 0
  for (let i = 0; i < pfad.length - 1; i++) {
    const a = pfad[i]
    const b = pfad[i + 1]
    const segLaenge = laengen[i]
    let lokalesT = 0
    if (segLaenge > 0) {
      lokalesT =
        ((punkt.x - a.x) * (b.x - a.x) + (punkt.y - a.y) * (b.y - a.y)) / (segLaenge * segLaenge)
      lokalesT = Math.max(0, Math.min(1, lokalesT))
    }
    const projektion = { x: a.x + (b.x - a.x) * lokalesT, y: a.y + (b.y - a.y) * lokalesT }
    const distanz = Math.hypot(punkt.x - projektion.x, punkt.y - projektion.y)
    const t = (laengeBisSegment + segLaenge * lokalesT) / gesamt
    if (!bester || distanz < bester.distanz) bester = { punkt: projektion, t, distanz }
    laengeBisSegment += segLaenge
  }
  return bester
}

function findeTrunk(blatt: Blatt | undefined, trunkId: string): TrunkObjekt | null {
  const objekt = blatt?.objekte.find((o) => o.id === trunkId && o.type === 'trunk')
  return objekt && objekt.type === 'trunk' ? objekt : null
}

export interface TrunkKante {
  ziel: TrunkKettenGlied
  tHier: number
  tDort: number
}

export function trunkNachbarschaft(zeichnung: Zeichnung): Map<string, TrunkKante[]> {
  const alle = new Map<string, TrunkKettenGlied>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'trunk') alle.set(objekt.id, { blattId: blatt.id, trunk: objekt })
    }
  }

  const kanten = new Map<string, TrunkKante[]>()
  const ergaenze = (vonTrunkId: string, kante: TrunkKante) => {
    const liste = kanten.get(vonTrunkId)
    if (liste) liste.push(kante)
    else kanten.set(vonTrunkId, [kante])
  }

  for (const { trunk } of alle.values()) {
    for (const [index, ende] of trunk.enden.entries()) {
      const zielId = ende.verbundenesEnde?.trunkId ?? ende.verbundenerPfad?.trunkId
      const tDort = ende.verbundenesEnde?.endeIndex ?? ende.verbundenerPfad?.t
      if (zielId === undefined || tDort === undefined) continue
      const nachbar = alle.get(zielId)
      if (!nachbar) continue
      ergaenze(trunk.id, { ziel: nachbar, tHier: index, tDort })
    }
  }
  for (const { blattId, trunk } of alle.values()) {
    for (const [index, ende] of trunk.enden.entries()) {
      const ziel = ende.verbundenerPfad
      if (!ziel || !alle.has(ziel.trunkId)) continue
      ergaenze(ziel.trunkId, { ziel: { blattId, trunk }, tHier: ziel.t, tDort: index })
    }
  }
  for (const anschluesse of trunkAnschluesseJeStrang(zeichnung).values()) {
    for (const von of anschluesse) {
      for (const nach of anschluesse) {
        if (von.trunk.id === nach.trunk.id) continue
        ergaenze(von.trunk.id, {
          ziel: { blattId: nach.blattId, trunk: nach.trunk },
          tHier: von.endeIndex,
          tDort: nach.endeIndex,
        })
      }
    }
  }
  return kanten
}

export function ermittleTrunkKette(
  zeichnung: Zeichnung,
  startBlattId: string,
  startTrunkId: string,
  vorberechneteKanten?: Map<string, TrunkKante[]>,
): TrunkKettenGlied[] {
  const startBlatt = zeichnung.blaetter.find((b) => b.id === startBlattId)
  const startTrunk = findeTrunk(startBlatt, startTrunkId)
  if (!startTrunk) return []

  const kanten = vorberechneteKanten ?? trunkNachbarschaft(zeichnung)
  const kette: TrunkKettenGlied[] = [{ blattId: startBlattId, trunk: startTrunk }]
  const besucht = new Set<string>([startTrunkId])

  const besuche = (glied: TrunkKettenGlied) => {
    for (const kante of kanten.get(glied.trunk.id) ?? []) {
      if (besucht.has(kante.ziel.trunk.id)) continue
      besucht.add(kante.ziel.trunk.id)
      kette.push(kante.ziel)
      besuche(kante.ziel)
    }
  }
  besuche(kette[0])

  return kette
}

export interface TrunkWegGlied {
  blattId: string
  trunk: TrunkObjekt
  eintrittT: number | null
  austrittT: number | null
}

export function findeTrunkWeg(
  zeichnung: Zeichnung,
  startBlattId: string,
  startTrunkId: string,
  zielTrunkId: string,
  vorberechneteKanten?: Map<string, TrunkKante[]>,
): TrunkWegGlied[] | null {
  const startBlatt = zeichnung.blaetter.find((b) => b.id === startBlattId)
  const startTrunk = findeTrunk(startBlatt, startTrunkId)
  if (!startTrunk) return null
  if (startTrunkId === zielTrunkId) {
    return [{ blattId: startBlattId, trunk: startTrunk, eintrittT: null, austrittT: null }]
  }

  const kanten = vorberechneteKanten ?? trunkNachbarschaft(zeichnung)
  const vorgaenger = new Map<string, { vonTrunkId: string; kante: TrunkKante }>()
  const besucht = new Set<string>([startTrunkId])
  const warteschlange: string[] = [startTrunkId]
  let gefunden = false
  while (warteschlange.length > 0 && !gefunden) {
    const aktuellerId = warteschlange.shift()!
    for (const kante of kanten.get(aktuellerId) ?? []) {
      const zielId = kante.ziel.trunk.id
      if (besucht.has(zielId)) continue
      besucht.add(zielId)
      vorgaenger.set(zielId, { vonTrunkId: aktuellerId, kante })
      if (zielId === zielTrunkId) {
        gefunden = true
        break
      }
      warteschlange.push(zielId)
    }
  }
  if (!gefunden) return null

  const weg: TrunkWegGlied[] = []
  let aktuellerId = zielTrunkId
  let austrittT: number | null = null
  for (;;) {
    const schritt = vorgaenger.get(aktuellerId)
    if (!schritt) {
      weg.unshift({ blattId: startBlattId, trunk: startTrunk, eintrittT: null, austrittT })
      return weg
    }
    weg.unshift({
      blattId: schritt.kante.ziel.blattId,
      trunk: schritt.kante.ziel.trunk,
      eintrittT: schritt.kante.tDort,
      austrittT,
    })
    austrittT = schritt.kante.tHier
    aktuellerId = schritt.vonTrunkId
  }
}

export interface LeitungImTrunk {
  blattId: string
  leitung: LeitungsObjekt
}

export function findeLeitungenInTrunks(
  zeichnung: Zeichnung,
  trunkIds: ReadonlySet<string>,
): LeitungImTrunk[] {
  if (trunkIds.size === 0) return []

  const trunksAmSwitch = new Map<string, string[]>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'trunk') continue
      for (const ende of objekt.enden) {
        if (!ende.dockRef) continue
        const liste = trunksAmSwitch.get(ende.dockRef.objektId) ?? []
        liste.push(objekt.id)
        trunksAmSwitch.set(ende.dockRef.objektId, liste)
      }
    }
  }

  const treffer: LeitungImTrunk[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'leitung') continue
      if (objekt.trunkDurchgaenge.some((d) => trunkIds.has(d.trunkId))) {
        treffer.push({ blattId: blatt.id, leitung: objekt })
        continue
      }
      if (!istBuendelEnde(objekt.ziel) || objekt.trunkDurchgaenge.length === 0) continue
      const zielTrunkIds = trunksAmSwitch.get(objekt.ziel.objektId) ?? []
      const eintritt = objekt.trunkDurchgaenge[objekt.trunkDurchgaenge.length - 1]
      const wege = zielTrunkIds
        .map((zielTrunkId) => findeTrunkWeg(zeichnung, blatt.id, eintritt.trunkId, zielTrunkId))
        .filter((weg): weg is TrunkWegGlied[] => weg !== null)
      if (wege.length > 0 && wege.every((weg) => weg.some((g) => trunkIds.has(g.trunk.id)))) {
        treffer.push({ blattId: blatt.id, leitung: objekt })
      }
    }
  }
  return treffer
}

export function belegteNummernInZeichnung(zeichnung: Zeichnung): Set<number> {
  const belegte = new Set<number>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'leitung') belegte.add(objekt.nummer)
    }
  }
  return belegte
}

export function naechsteFreieNummer(belegte: ReadonlySet<number>): number {
  let n = 1
  while (belegte.has(n)) n++
  return n
}

export function ermittleTeilstueckNamen(
  zeichnung: Zeichnung,
  kette: readonly TrunkKettenGlied[],
): Map<string, string> {
  const namen = new Map<string, string>()
  if (kette.length === 0) return namen
  if (kette.length === 1) {
    namen.set(kette[0].trunk.id, kette[0].trunk.name)
    return namen
  }
  const inKette = new Set(kette.map((g) => g.trunk.id))
  let position = 0
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type !== 'trunk' || !inKette.has(objekt.id)) continue
      position++
      namen.set(objekt.id, `${objekt.name}.${position}`)
    }
  }
  return namen
}

export function trunkAnzeigeName(zeichnung: Zeichnung, blattId: string, trunkId: string): string {
  const kette = ermittleTrunkKette(zeichnung, blattId, trunkId)
  return ermittleTeilstueckNamen(zeichnung, kette).get(trunkId) ?? ''
}

export function naechsterFreierTrunkName(zeichnung: Zeichnung): string {
  const tp = planUebersetzer(zeichnung)
  const vergeben = new Set<string>()
  for (const blatt of zeichnung.blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'trunk') vergeben.add(objekt.name)
    }
  }
  const name = (n: number) => tp('beschriftung.trunk.vorgabeName', { nr: String(n) })
  let n = 1
  while (vergeben.has(name(n))) n++
  return name(n)
}

export function abgeleitetePfadSegmente(
  leitung: LeitungsObjekt,
  objekteAufBlatt: readonly Objekt[],
): Point[][] {
  if (leitung.trunkDurchgaenge.length === 0) return leitung.pfadSegmente
  const trunks = new Map<string, TrunkObjekt>()
  for (const o of objekteAufBlatt) {
    if (o.type === 'trunk') trunks.set(o.id, o)
  }
  return leitung.pfadSegmente.map((segment, index) => {
    let neuesSegment = segment
    const eintrittsDurchgang = leitung.trunkDurchgaenge[index]
    if (eintrittsDurchgang && neuesSegment.length > 0) {
      const trunk = trunks.get(eintrittsDurchgang.trunkId)
      if (trunk) {
        const punkt = punktAufPfad(trunk.wegpunkte, eintrittsDurchgang.eintrittT)
        neuesSegment = [...neuesSegment.slice(0, -1), punkt]
      }
    }
    const austrittsDurchgang = leitung.trunkDurchgaenge[index - 1]
    if (austrittsDurchgang && neuesSegment.length > 0) {
      const trunk = trunks.get(austrittsDurchgang.trunkId)
      if (trunk) {
        const punkt = punktAufPfad(trunk.wegpunkte, austrittsDurchgang.austrittT)
        neuesSegment = [punkt, ...neuesSegment.slice(1)]
      }
    }
    return neuesSegment
  })
}

export interface TrunkNummernschild {
  leitungId: string
  nummer: number
  punkt: Point
  art: 'eintritt' | 'austritt'
  durchgangIndex: number
  versatz: Point | null
}

export function ermittleNummernschilder(
  trunk: TrunkObjekt,
  objekteAufBlatt: readonly Objekt[],
): TrunkNummernschild[] {
  const schilder: TrunkNummernschild[] = []
  for (const o of objekteAufBlatt) {
    if (o.type !== 'leitung') continue
    o.trunkDurchgaenge.forEach((d, durchgangIndex) => {
      if (d.trunkId !== trunk.id) return
      schilder.push({
        leitungId: o.id,
        nummer: o.nummer,
        punkt: punktAufPfad(trunk.wegpunkte, d.eintrittT),
        art: 'eintritt',
        durchgangIndex,
        versatz: d.eintrittVersatz ?? null,
      })
      schilder.push({
        leitungId: o.id,
        nummer: o.nummer,
        punkt: punktAufPfad(trunk.wegpunkte, d.austrittT),
        art: 'austritt',
        durchgangIndex,
        versatz: d.austrittVersatz ?? null,
      })
    })
  }
  return schilder
}

export function verschmeltzeWegpunkte(
  trunkA: TrunkObjekt,
  endeIndexA: 0 | 1,
  trunkB: TrunkObjekt,
  endeIndexB: 0 | 1,
): Point[] {
  const { wegpunkte: pA } = trunkA
  const { wegpunkte: pB } = trunkB

  if (pA.length === 0 && pB.length === 0) return []
  if (pA.length === 0) return [...pB]
  if (pB.length === 0) return [...pA]

  let pfadVorne: Point[]
  let pfadHinten: Point[]

  if (endeIndexA === 1 && endeIndexB === 0) {
    pfadVorne = pA
    pfadHinten = pB.slice(1)
  } else if (endeIndexA === 1 && endeIndexB === 1) {
    pfadVorne = pA
    pfadHinten = [...pB].reverse().slice(1)
  } else if (endeIndexA === 0 && endeIndexB === 0) {
    pfadVorne = [...pA].reverse()
    pfadHinten = pB.slice(1)
  } else {
    pfadVorne = [...pA].reverse()
    pfadHinten = [...pB].reverse().slice(1)
  }

  return [...pfadVorne, ...pfadHinten]
}

export function verschmolzenesDurchgangT(
  t: number,
  aufTrunkA: boolean,
  endeIndexA: 0 | 1,
  endeIndexB: 0 | 1,
  laengeA: number,
  laengeGesamt: number,
): number {
  if (laengeGesamt <= 0) return t
  if (aufTrunkA) {
    const tEff = endeIndexA === 0 ? 1 - t : t
    return (tEff * laengeA) / laengeGesamt
  }
  const laengeB = laengeGesamt - laengeA
  const tEff = endeIndexB === 1 ? 1 - t : t
  return (laengeA + tEff * laengeB) / laengeGesamt
}

export interface SchachtAnKette {
  blattId: string
  blattName: string
  schachtId: string
  schachtName: string
  verbundId: string
  trunkId: string
  endeIndex: 0 | 1
}

export function ermittleSchaechteAnKette(
  zeichnung: Zeichnung,
  blattId: string,
  trunkId: string,
): SchachtAnKette[] {
  const ergebnis: SchachtAnKette[] = []
  const gesehen = new Set<string>()
  for (const glied of ermittleTrunkKette(zeichnung, blattId, trunkId)) {
    const blatt = zeichnung.blaetter.find((b) => b.id === glied.blattId)
    if (!blatt) continue
    glied.trunk.enden.forEach((ende, index) => {
      const ref = ende.schachtRef
      if (!ref || gesehen.has(ref.objektId)) return
      const schacht = blatt.objekte.find((o) => istKabelschacht(o) && o.id === ref.objektId)
      if (!schacht || !istKabelschacht(schacht)) return
      gesehen.add(schacht.id)
      ergebnis.push({
        blattId: glied.blattId,
        blattName: blatt.name,
        schachtId: schacht.id,
        schachtName: schacht.name,
        verbundId: schacht.verbundId,
        trunkId: glied.trunk.id,
        endeIndex: index === 0 ? 0 : 1,
      })
    })
  }
  return ergebnis
}
