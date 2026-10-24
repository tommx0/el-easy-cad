import type { IfcAPI } from 'web-ifc'
import type { Point } from '../document-model'
import { IFC_TYP, NICHT_SCHNEIDEN, streameNetze, type IfcGeschoss } from './ifc-modell'

export interface HuellenNetz {
  positionen: Float32Array
  indizes: Uint32Array
}

export interface HuellenWand {
  netz: HuellenNetz
  achse: { von: Point; bis: Point; staerke: number } | null
}

export interface IfcHuelle {
  waende: HuellenWand[]
  decken: HuellenNetz
  uebriges: HuellenNetz
}

const WAND_KLASSEN = new Set<number>([
  IFC_TYP.WALL,
  IFC_TYP.WALLSTANDARDCASE,
  IFC_TYP.WALLELEMENTEDCASE,
  IFC_TYP.CURTAINWALL,
])
const DECKEN_KLASSEN = new Set<number>([
  IFC_TYP.SLAB,
  IFC_TYP.SLABSTANDARDCASE,
  IFC_TYP.SLABELEMENTEDCASE,
  IFC_TYP.ROOF,
  IFC_TYP.COVERING,
])

export function huellenGruppe(klasse: number): 'wand' | 'decke' | 'uebriges' {
  if (WAND_KLASSEN.has(klasse)) return 'wand'
  if (DECKEN_KLASSEN.has(klasse)) return 'decke'
  return 'uebriges'
}

export function wandAchse(positionen: ArrayLike<number>): HuellenWand['achse'] {
  const n = Math.floor(positionen.length / 3)
  if (n < 2) return null
  let mx = 0
  let my = 0
  for (let i = 0; i < n; i++) {
    mx += positionen[3 * i]
    my += positionen[3 * i + 1]
  }
  mx /= n
  my /= n
  let cxx = 0
  let cyy = 0
  let cxy = 0
  for (let i = 0; i < n; i++) {
    const dx = positionen[3 * i] - mx
    const dy = positionen[3 * i + 1] - my
    cxx += dx * dx
    cyy += dy * dy
    cxy += dx * dy
  }
  const winkel = 0.5 * Math.atan2(2 * cxy, cxx - cyy)
  const u = { x: Math.cos(winkel), y: Math.sin(winkel) }
  const v = { x: -u.y, y: u.x }
  let [a, b, c, d] = [Infinity, -Infinity, Infinity, -Infinity]
  for (let i = 0; i < n; i++) {
    const dx = positionen[3 * i] - mx
    const dy = positionen[3 * i + 1] - my
    const laengs = dx * u.x + dy * u.y
    const quer = dx * v.x + dy * v.y
    a = Math.min(a, laengs)
    b = Math.max(b, laengs)
    c = Math.min(c, quer)
    d = Math.max(d, quer)
  }
  if (b - a < 1e-3) return null
  const mitteQuer = (c + d) / 2
  const punkt = (t: number): Point => ({
    x: mx + u.x * t + v.x * mitteQuer,
    y: my + u.y * t + v.y * mitteQuer,
  })
  return { von: punkt(a), bis: punkt(b), staerke: d - c }
}

export interface HuellenSammler {
  positionen: number[]
  indizes: number[]
}

export function haengeNetzAn(
  sammler: HuellenSammler,
  eckpunkte: ArrayLike<number>,
  indizes: ArrayLike<number>,
  matrix: ArrayLike<number>,
  ursprung: Point,
  hoehenVersatz: number,
): void {
  const basis = sammler.positionen.length / 3
  const m = matrix
  for (let k = 0; k + 2 < eckpunkte.length; k += 6) {
    const x = eckpunkte[k]
    const y = eckpunkte[k + 1]
    const z = eckpunkte[k + 2]
    const wx = m[0] * x + m[4] * y + m[8] * z + m[12]
    const wy = m[1] * x + m[5] * y + m[9] * z + m[13]
    const wz = m[2] * x + m[6] * y + m[10] * z + m[14]
    sammler.positionen.push(wx - ursprung.x, -wz - ursprung.y, wy + hoehenVersatz)
  }
  for (let i = 0; i < indizes.length; i++) sammler.indizes.push(basis + indizes[i])
}

const alsNetz = (sammler: HuellenSammler): HuellenNetz => ({
  positionen: new Float32Array(sammler.positionen),
  indizes: new Uint32Array(sammler.indizes),
})

export function sammleHuelle(
  api: IfcAPI,
  modell: number,
  geschoss: IfcGeschoss,
  ursprung: Point,
  kote: number,
): IfcHuelle {
  const decken: HuellenSammler = { positionen: [], indizes: [] }
  const uebriges: HuellenSammler = { positionen: [], indizes: [] }
  const waende = new Map<number, HuellenSammler>()
  const klassen = new Map<number, number>()
  const ids = geschoss.schnittElemente.filter((id) => {
    const klasse = api.GetLineType(modell, id) as number
    klassen.set(id, klasse)
    return !NICHT_SCHNEIDEN.has(klasse)
  })
  const hoehenVersatz = kote - geschoss.basisHoehe
  if (ids.length > 0)
    streameNetze(api, modell, ids, (netz) => {
      const gruppe = huellenGruppe(klassen.get(netz.expressID) ?? 0)
      let sammler = gruppe === 'decke' ? decken : uebriges
      if (gruppe === 'wand') {
        sammler = waende.get(netz.expressID) ?? { positionen: [], indizes: [] }
        waende.set(netz.expressID, sammler)
      }
      haengeElementAn(api, modell, netz, sammler, ursprung, hoehenVersatz)
    })
  return {
    waende: [...waende.values()]
      .filter((w) => w.indizes.length > 0)
      .map((w) => ({ netz: alsNetz(w), achse: wandAchse(w.positionen) })),
    decken: alsNetz(decken),
    uebriges: alsNetz(uebriges),
  }
}

function haengeElementAn(
  api: IfcAPI,
  modell: number,
  netz: Parameters<Parameters<typeof streameNetze>[3]>[0],
  sammler: HuellenSammler,
  ursprung: Point,
  hoehenVersatz: number,
) {
  for (let i = 0; i < netz.geometries.size(); i++) {
    const platziert = netz.geometries.get(i)
    const geometrie = api.GetGeometry(modell, platziert.geometryExpressID)
    try {
      haengeNetzAn(
        sammler,
        api.GetVertexArray(geometrie.GetVertexData(), geometrie.GetVertexDataSize()),
        api.GetIndexArray(geometrie.GetIndexData(), geometrie.GetIndexDataSize()),
        platziert.flatTransformation,
        ursprung,
        hoehenVersatz,
      )
    } finally {
      geometrie.delete()
    }
  }
}
