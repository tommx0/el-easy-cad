import { erzeugeUebersetzer, QUELLSPRACHE, SPRACHEN } from '../sprache'
import type { Uebersetzer } from '../sprache'
import type { IfcBauteilGruppe } from './ifc-bauteilgruppen'
import { erzeugeId } from './id'
import type { Objekt, ObjektTyp } from './objekte'

export interface Ebene {
  id: string
  name: string
  sichtbar: boolean
  gesperrt: boolean
  farbe: string
  istHintergrundLayer?: boolean
  istLeitungenLayer?: boolean
  istRaeumeLayer?: boolean
  istGrundrissLayer?: boolean
  ifcGruppe?: IfcBauteilGruppe
}

export const STANDARD_EBENE_FARBE = '#1a1a1a'

export const EBENEN_STAND = 2

export type StandardEbene =
  'hintergrund' | 'bauelemente' | 'raeume' | 'komponenten' | 'leitungen' | 'bemassung'

const QUELLE = erzeugeUebersetzer(QUELLSPRACHE)

export function standardEbenenName(art: StandardEbene, tp: Uebersetzer = QUELLE): string {
  return tp(`plan.vorgabe.ebene.${art}`)
}

export function traegtStandardNamen(ebene: Pick<Ebene, 'name'>, art: StandardEbene): boolean {
  const name = ebene.name.trim().toLowerCase()
  return SPRACHEN.some(
    (sprache) => standardEbenenName(art, erzeugeUebersetzer(sprache)).toLowerCase() === name,
  )
}

export const EBENE_NAME_HINTERGRUND = standardEbenenName('hintergrund')
export const EBENE_NAME_BAUELEMENTE = standardEbenenName('bauelemente')
export const EBENE_NAME_KOMPONENTEN = standardEbenenName('komponenten')
export const EBENE_NAME_LEITUNGEN = standardEbenenName('leitungen')
export const EBENE_NAME_RAEUME = standardEbenenName('raeume')
export const EBENE_NAME_BEMASSUNG = standardEbenenName('bemassung')

export function erzeugeEbene(name: string, farbe = STANDARD_EBENE_FARBE): Ebene {
  return { id: erzeugeId('ebene'), name, sichtbar: true, gesperrt: false, farbe }
}

export function erzeugeStandardEbenen(
  tp: Uebersetzer = QUELLE,
): [Ebene, Ebene, Ebene, Ebene, Ebene, Ebene] {
  const name = (art: StandardEbene) => standardEbenenName(art, tp)
  return [
    { ...erzeugeEbene(name('hintergrund')), istHintergrundLayer: true },
    erzeugeEbene(name('bauelemente')),
    { ...erzeugeEbene(name('raeume')), istRaeumeLayer: true },
    erzeugeEbene(name('komponenten')),
    { ...erzeugeEbene(name('leitungen')), istLeitungenLayer: true },
    erzeugeEbene(name('bemassung')),
  ]
}

const BAUELEMENTE_TYPEN: readonly ObjektTyp[] = [
  'wand',
  'tuer',
  'fenster',
  'wanddurchbruch',
  'treppe',
  'bodenplatte',
]
export const LEITUNGEN_TYPEN: readonly ObjektTyp[] = ['leitung', 'trunk', 'kabelschacht']
export const RAEUME_TYPEN: readonly ObjektTyp[] = ['raum']
const BEMASSUNG_TYPEN: readonly ObjektTyp[] = ['bemassung', 'bemassungsreihe']

export function standardEbeneFuerTyp(typ: ObjektTyp): string {
  return standardEbenenName(standardEbenenArtFuerTyp(typ))
}

export function standardEbenenArtFuerTyp(typ: ObjektTyp): StandardEbene {
  if (BAUELEMENTE_TYPEN.includes(typ)) return 'bauelemente'
  if (LEITUNGEN_TYPEN.includes(typ)) return 'leitungen'
  if (RAEUME_TYPEN.includes(typ)) return 'raeume'
  if (BEMASSUNG_TYPEN.includes(typ)) return 'bemassung'
  return 'komponenten'
}

export function ersatzEbeneFuer(ebenen: readonly Ebene[], geloeschteId: string): Ebene | null {
  const kandidaten = ebenen.filter((e) => e.id !== geloeschteId && !e.istHintergrundLayer)
  return kandidaten.find((e) => traegtStandardNamen(e, 'komponenten')) ?? kandidaten[0] ?? null
}

export function ebeneSichtbar(ebeneId: string, ebenen: readonly Ebene[]): boolean {
  return ebenen.find((e) => e.id === ebeneId)?.sichtbar ?? true
}

export function ebeneGesperrt(ebeneId: string, ebenen: readonly Ebene[]): boolean {
  return ebenen.find((e) => e.id === ebeneId)?.gesperrt ?? false
}

export function istHintergrundGesperrt(ebenen: readonly Ebene[]): boolean {
  return ebenen.find((e) => e.istHintergrundLayer)?.gesperrt ?? false
}

export function leitungenEbeneId(ebenen: readonly Ebene[]): string | null {
  return ebenen.find((e) => e.istLeitungenLayer)?.id ?? null
}

export function raeumeEbeneId(ebenen: readonly Ebene[]): string | null {
  return ebenen.find((e) => e.istRaeumeLayer)?.id ?? null
}

export function ebeneFuerNeuesObjekt(
  typ: ObjektTyp,
  ebenen: readonly Ebene[],
  aktiveEbeneId: string,
): string {
  if (LEITUNGEN_TYPEN.includes(typ)) return leitungenEbeneId(ebenen) ?? aktiveEbeneId
  if (RAEUME_TYPEN.includes(typ)) return raeumeEbeneId(ebenen) ?? aktiveEbeneId
  return aktiveEbeneId
}

export function sichtbareObjekte<T extends Objekt>(
  objekte: readonly T[],
  ebenen: readonly Ebene[],
): T[] {
  const ausgeblendet = new Set(ebenen.filter((e) => !e.sichtbar).map((e) => e.id))
  if (ausgeblendet.size === 0) return [...objekte]
  return objekte.filter((o) => !ausgeblendet.has(o.ebeneId))
}

export function istBearbeitbar(objekt: Pick<Objekt, 'ebeneId'>, ebenen: readonly Ebene[]): boolean {
  return !ebeneGesperrt(objekt.ebeneId, ebenen)
}
