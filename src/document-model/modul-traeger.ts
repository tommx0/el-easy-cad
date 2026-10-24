import type { CatalogComponent } from './catalog'
import type { Point } from './geometry'
import { distance, rotatePoint } from './geometry'
import type { KomponentenObjekt, Objekt } from './objekte'
import { istBuendelEnde } from './objekte'

export interface SlotTreffer {
  traegerId: string
  slotIndex: number
  punkt: Point
  drehung: number
  slotGroesse: number
}

export function istModulTraeger(
  objekt: Objekt,
): objekt is KomponentenObjekt & { modulTraeger: NonNullable<KomponentenObjekt['modulTraeger']> } {
  return objekt.type === 'komponente' && objekt.modulTraeger !== undefined
}

export function istModul(objekt: Objekt): objekt is KomponentenObjekt & { modulSystem: string } {
  return objekt.type === 'komponente' && objekt.modulSystem !== undefined
}

export function istAufgesetztesModul(
  objekt: Objekt,
): objekt is KomponentenObjekt & { traegerId: string; slotIndex: number } {
  return (
    objekt.type === 'komponente' && objekt.traegerId !== undefined && objekt.slotIndex !== undefined
  )
}

export function passtModulZuTraeger(modul: KomponentenObjekt, traeger: KomponentenObjekt): boolean {
  return (
    modul.modulSystem !== undefined &&
    traeger.modulTraeger !== undefined &&
    modul.modulSystem === traeger.modulTraeger.modulSystem
  )
}

export function slotGroesseWelt(
  traeger: KomponentenObjekt & { modulTraeger: NonNullable<KomponentenObjekt['modulTraeger']> },
): number {
  return traeger.groesseWelt / traeger.modulTraeger.zeilen
}

export function ermittleSlotMittelpunkte(
  traeger: KomponentenObjekt & { modulTraeger: NonNullable<KomponentenObjekt['modulTraeger']> },
): Point[] {
  const { spalten, zeilen } = traeger.modulTraeger
  const slot = slotGroesseWelt(traeger)
  const halbX = (traeger.breiteWelt ?? traeger.groesseWelt) / 2
  const halbY = traeger.groesseWelt / 2
  const punkte: Point[] = []
  for (let zeile = 0; zeile < zeilen; zeile++) {
    for (let spalte = 0; spalte < spalten; spalte++) {
      punkte.push({
        x: traeger.position.x - halbX + (spalte + 0.5) * slot,
        y: traeger.position.y + halbY - (zeile + 0.5) * slot,
      })
    }
  }
  if (traeger.drehung === 0) return punkte
  return punkte.map((p) => rotatePoint(p, traeger.position, traeger.drehung))
}

export function moduleVonTraeger(
  objekte: readonly Objekt[],
  traegerId: string,
): (KomponentenObjekt & { traegerId: string; slotIndex: number })[] {
  return objekte.filter(
    (o): o is KomponentenObjekt & { traegerId: string; slotIndex: number } =>
      istAufgesetztesModul(o) && o.traegerId === traegerId,
  )
}

export function belegteSlots(objekte: readonly Objekt[], traegerId: string): Set<number> {
  return new Set(moduleVonTraeger(objekte, traegerId).map((m) => m.slotIndex))
}

export function traegerIstVollBelegt(
  objekte: readonly Objekt[],
  traeger: KomponentenObjekt & { modulTraeger: NonNullable<KomponentenObjekt['modulTraeger']> },
): boolean {
  const kapazitaet = traeger.modulTraeger.spalten * traeger.modulTraeger.zeilen
  return belegteSlots(objekte, traeger.id).size >= kapazitaet
}

export function ermittleFehlendeModulFelder(
  objekte: readonly Objekt[],
  katalog: readonly CatalogComponent[],
): Map<string, Partial<Pick<KomponentenObjekt, 'modulSystem' | 'modulTraeger'>>> {
  const patches = new Map<
    string,
    Partial<Pick<KomponentenObjekt, 'modulSystem' | 'modulTraeger'>>
  >()
  for (const objekt of objekte) {
    if (objekt.type !== 'komponente') continue
    if (objekt.modulSystem !== undefined || objekt.modulTraeger !== undefined) continue
    const katalogEintrag = katalog.find((k) => k.id === objekt.catalogComponentId)
    if (!katalogEintrag) continue
    const patch: Partial<Pick<KomponentenObjekt, 'modulSystem' | 'modulTraeger'>> = {}
    if (katalogEintrag.modulSystem !== undefined) patch.modulSystem = katalogEintrag.modulSystem
    if (katalogEintrag.modulTraeger !== undefined) patch.modulTraeger = katalogEintrag.modulTraeger
    if (Object.keys(patch).length > 0) patches.set(objekt.id, patch)
  }
  return patches
}

export function findeNaechstenFreienSlot(
  objekte: readonly Objekt[],
  punkt: Point,
  toleranz: number,
  modul: KomponentenObjekt,
): SlotTreffer | null {
  let bester: SlotTreffer | null = null
  let besteDistanz = Number.POSITIVE_INFINITY
  for (const objekt of objekte) {
    if (!istModulTraeger(objekt) || objekt.id === modul.id) continue
    if (!passtModulZuTraeger(modul, objekt)) continue
    const belegt = new Set(
      moduleVonTraeger(objekte, objekt.id)
        .filter((m) => m.id !== modul.id)
        .map((m) => m.slotIndex),
    )
    const mittelpunkte = ermittleSlotMittelpunkte(objekt)
    const slot = slotGroesseWelt(objekt)
    const fangRadius = Math.max(toleranz, slot / 2)
    for (let index = 0; index < mittelpunkte.length; index++) {
      if (belegt.has(index)) continue
      const abstand = distance(punkt, mittelpunkte[index])
      if (abstand <= fangRadius && abstand < besteDistanz) {
        besteDistanz = abstand
        bester = {
          traegerId: objekt.id,
          slotIndex: index,
          punkt: mittelpunkte[index],
          drehung: objekt.drehung,
          slotGroesse: slot,
        }
      }
    }
  }
  return bester
}

export function ermittleModulZustaendeFuerTraeger(
  traegerNeu: KomponentenObjekt,
  module: readonly (KomponentenObjekt & { slotIndex: number })[],
): Map<
  string,
  Pick<KomponentenObjekt, 'position' | 'drehung' | 'groesseWelt' | 'breiteWelt' | 'hoehenFaktor'>
> {
  const ergebnis = new Map<
    string,
    Pick<KomponentenObjekt, 'position' | 'drehung' | 'groesseWelt' | 'breiteWelt' | 'hoehenFaktor'>
  >()
  if (!istModulTraeger(traegerNeu)) return ergebnis
  const mittelpunkte = ermittleSlotMittelpunkte(traegerNeu)
  const slot = slotGroesseWelt(traegerNeu)
  for (const modul of module) {
    const punkt = mittelpunkte[modul.slotIndex]
    if (!punkt) continue
    ergebnis.set(modul.id, {
      position: punkt,
      drehung: traegerNeu.drehung,
      groesseWelt: slot,
      breiteWelt: undefined,
      hoehenFaktor: undefined,
    })
  }
  return ergebnis
}

export function expandiereTraegerMitModulen(
  objekte: readonly Objekt[],
  neueZustaende: Map<string, Partial<KomponentenObjekt>>,
  geschuetzteIds?: ReadonlySet<string>,
): void {
  for (const [id, zustand] of Array.from(neueZustaende)) {
    const objekt = objekte.find((o) => o.id === id)
    if (!objekt || !istModulTraeger(objekt)) continue
    const traegerNeu = { ...objekt, ...zustand }
    const module = moduleVonTraeger(objekte, id).filter((m) => !geschuetzteIds?.has(m.id))
    for (const [modulId, modulZustand] of ermittleModulZustaendeFuerTraeger(traegerNeu, module)) {
      neueZustaende.set(modulId, { ...neueZustaende.get(modulId), ...modulZustand })
    }
  }
}

export function hatVerbundeneLeitungenOderTrunks(
  objekte: readonly Objekt[],
  objektId: string,
): boolean {
  return objekte.some((o) => {
    if (o.type === 'leitung') {
      return (
        ((o.start.art === 'dock' || istBuendelEnde(o.start)) && o.start.objektId === objektId) ||
        ((o.ziel.art === 'dock' || istBuendelEnde(o.ziel)) && o.ziel.objektId === objektId)
      )
    }
    if (o.type === 'trunk') {
      return o.enden.some((ende) => ende.dockRef?.objektId === objektId)
    }
    return false
  })
}
