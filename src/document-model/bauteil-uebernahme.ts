import type { Point } from './geometry'
import { pointInPolygon } from './geometry'
import type {
  FensterObjekt,
  Objekt,
  RaumObjekt,
  TreppenObjekt,
  TuerObjekt,
  WandObjekt,
  WanddurchbruchObjekt,
} from './objekte'
import { STANDARD_RAUM_SCHRIFTGROESSE, STANDARD_WAND_FUELL_FARBE, neueObjektBasis } from './objekte'
import { ermittleRaumGeometrie, ermittleRaumHindernisse } from './raum'
import { ermittleTreppenStufenanzahlVorschlag, standardLFormMasse } from './treppe'
import { ermittleOeffnungsGeometrie } from './wand'
import { zerlegeWaendeInSegmente } from './wand-anschluss'
import { ifcStaende } from './ifc-abgleich'

export interface WandVorlage {
  punkte: Point[]
  staerke: number
  ifcGuid?: string
}

export interface OeffnungsVorlage {
  art: 'tuer' | 'fenster' | 'wanddurchbruch'
  wandIndex: number
  t: number
  breite: number
  gespiegelt: boolean
  schwenkInnen: boolean
  ifcGuid?: string
}

export interface TreppenVorlage {
  mitte: Point
  breite: number
  hoehe: number
  drehung: number
  stufenanzahl?: number
  laufrichtungGespiegelt?: boolean
  ifcGuid?: string
}

export interface RaumVorlage {
  punktImRaum: Point
  name: string
  ifcGuid?: string
}

export interface BauteilVorlagen {
  waende: readonly WandVorlage[]
  oeffnungen: readonly OeffnungsVorlage[]
  treppen: readonly TreppenVorlage[]
  raeume?: readonly RaumVorlage[]
}

export interface BauteilObjekte {
  objekte: Objekt[]
  raeumeOffen: number
  raeumeDoppelt: number
}

function mitGuid<T extends object>(objekt: T, ifcGuid: string | undefined, ifcStand: string): T {
  return ifcGuid ? { ...objekt, ifcGuid, ifcStand } : objekt
}

export function erzeugeBauteilObjekte(
  vorlagen: BauteilVorlagen,
  ebeneId: string,
  bestand: readonly Objekt[] = [],
): BauteilObjekte {
  const staende = ifcStaende(vorlagen)
  const waende: WandObjekt[] = vorlagen.waende.map((v, i) =>
    mitGuid(
      {
        ...neueObjektBasis(ebeneId),
        type: 'wand' as const,
        punkte: v.punkte,
        staerke: v.staerke,
        fuellung: { art: 'farbe' as const, farbe: STANDARD_WAND_FUELL_FARBE, deckkraft: 1 },
      },
      v.ifcGuid,
      staende.waende[i],
    ),
  )

  const oeffnungen: Objekt[] = []
  vorlagen.oeffnungen.forEach((o, i) => {
    const wand = waende[o.wandIndex]
    if (!wand) return
    const geometrie = ermittleOeffnungsGeometrie(wand, { t: o.t })
    if (!geometrie) return
    const basis = {
      ...neueObjektBasis(ebeneId),
      wandId: wand.id,
      t: o.t,
      breite: o.breite,
      position: geometrie.position,
      richtung: geometrie.richtung,
    }
    const objekt =
      o.art === 'tuer'
        ? ({
            ...basis,
            type: 'tuer',
            gespiegelt: o.gespiegelt,
            schwenkInnen: o.schwenkInnen,
          } satisfies TuerObjekt)
        : o.art === 'fenster'
          ? ({ ...basis, type: 'fenster' } satisfies FensterObjekt)
          : ({ ...basis, type: 'wanddurchbruch' } satisfies WanddurchbruchObjekt)
    oeffnungen.push(mitGuid(objekt, o.ifcGuid, staende.oeffnungen[i]))
  })

  const treppen: TreppenObjekt[] = vorlagen.treppen.map((t, i) =>
    mitGuid(
      {
        ...neueObjektBasis(ebeneId),
        type: 'treppe' as const,
        form: 'gerade' as const,
        ursprung: { x: t.mitte.x - t.breite / 2, y: t.mitte.y - t.hoehe / 2 },
        breite: t.breite,
        hoehe: t.hoehe,
        drehung: t.drehung,
        stufenanzahl:
          t.stufenanzahl ?? ermittleTreppenStufenanzahlVorschlag('gerade', t.breite, t.hoehe),
        laufrichtungGespiegelt: t.laufrichtungGespiegelt ?? false,
        beschriftungSichtbar: true,
        lFormSpiegelHorizontal: false,
        lFormSpiegelVertikal: false,
        ...standardLFormMasse(t.breite, t.hoehe),
      },
      t.ifcGuid,
      staende.treppen[i],
    ),
  )

  const bauteile = zerlegeWaendeInSegmente([...waende, ...oeffnungen])

  const raeume: RaumObjekt[] = []
  let raeumeOffen = 0
  let raeumeDoppelt = 0
  const umgebung = [...bestand, ...bauteile]
  const hindernisse = (vorlagen.raeume ?? []).length > 0 ? ermittleRaumHindernisse(umgebung) : null
  const vorhandeneUmrisse = bestand
    .filter((o): o is RaumObjekt => o.type === 'raum')
    .map((r) => r.umriss)
  for (const [i, r] of (vorlagen.raeume ?? []).entries()) {
    if (vorhandeneUmrisse.some((umriss) => pointInPolygon(r.punktImRaum, umriss))) {
      raeumeDoppelt++
      continue
    }
    const geometrie = ermittleRaumGeometrie(umgebung, r.punktImRaum, hindernisse ?? undefined)
    if (!geometrie) {
      raeumeOffen++
      continue
    }
    vorhandeneUmrisse.push(geometrie.umriss)
    raeume.push(
      mitGuid(
        {
          ...neueObjektBasis(ebeneId),
          type: 'raum' as const,
          punktImRaum: r.punktImRaum,
          name: r.name,
          schriftgroesse: STANDARD_RAUM_SCHRIFTGROESSE,
          gueltig: true,
          fuellung: null,
          ...geometrie,
        },
        r.ifcGuid,
        staende.raeume[i],
      ),
    )
  }

  return { objekte: [...bauteile, ...treppen, ...raeume], raeumeOffen, raeumeDoppelt }
}

export function ohneVorhandeneBauteile(
  vorlagen: BauteilVorlagen,
  vorhandeneGuids: ReadonlySet<string>,
): { vorlagen: BauteilVorlagen; weggelassen: number } {
  const neu = (guid: string | undefined) => !guid || !vorhandeneGuids.has(guid)
  let weggelassen = 0
  const neuerIndex = new Map<number, number>()
  const waende: WandVorlage[] = []
  vorlagen.waende.forEach((w, i) => {
    if (!neu(w.ifcGuid)) {
      weggelassen++
      return
    }
    neuerIndex.set(i, waende.length)
    waende.push(w)
  })
  const oeffnungen: OeffnungsVorlage[] = []
  for (const o of vorlagen.oeffnungen) {
    const index = neuerIndex.get(o.wandIndex)
    if (index === undefined || !neu(o.ifcGuid)) {
      weggelassen++
      continue
    }
    oeffnungen.push({ ...o, wandIndex: index })
  }
  const treppen = vorlagen.treppen.filter((t) => neu(t.ifcGuid))
  const raeume = (vorlagen.raeume ?? []).filter((r) => neu(r.ifcGuid))
  weggelassen += vorlagen.treppen.length - treppen.length
  weggelassen += (vorlagen.raeume ?? []).length - raeume.length
  return { vorlagen: { waende, oeffnungen, treppen, raeume }, weggelassen }
}
