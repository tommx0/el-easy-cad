import { t } from '../sprache'
import type { Uebersetzer } from '../sprache'
import type { DxfEntity, HintergrundIfc } from './hintergrund'

export type IfcBauteilGruppe =
  'waende' | 'tueren' | 'fenster' | 'tragwerk' | 'treppen' | 'decken' | 'sonstiges'

export interface IfcBauteilGruppeInfo {
  id: IfcBauteilGruppe
  readonly name: string
  klassen: readonly string[]
}

function gruppe(id: IfcBauteilGruppe, klassen: readonly string[]): IfcBauteilGruppeInfo {
  return {
    id,
    get name() {
      return t(`modell.ifcBauteilgruppen.namen.${id}`)
    },
    klassen,
  }
}

export const IFC_BAUTEILGRUPPEN: readonly IfcBauteilGruppeInfo[] = [
  gruppe('waende', [
    'IFCWALL',
    'IFCWALLSTANDARDCASE',
    'IFCWALLELEMENTEDCASE',
    'IFCCURTAINWALL',
    'IFCPLATE',
    'IFCPLATESTANDARDCASE',
  ]),
  gruppe('tueren', ['IFCDOOR', 'IFCDOORSTANDARDCASE']),
  gruppe('fenster', ['IFCWINDOW', 'IFCWINDOWSTANDARDCASE']),
  gruppe('tragwerk', [
    'IFCCOLUMN',
    'IFCCOLUMNSTANDARDCASE',
    'IFCBEAM',
    'IFCBEAMSTANDARDCASE',
    'IFCMEMBER',
    'IFCMEMBERSTANDARDCASE',
    'IFCFOOTING',
    'IFCPILE',
  ]),
  gruppe('treppen', ['IFCSTAIR', 'IFCSTAIRFLIGHT', 'IFCRAMP', 'IFCRAMPFLIGHT', 'IFCRAILING']),
  gruppe('decken', [
    'IFCSLAB',
    'IFCSLABSTANDARDCASE',
    'IFCSLABELEMENTEDCASE',
    'IFCROOF',
    'IFCCOVERING',
  ]),
  gruppe('sonstiges', []),
]

const GRUPPE_JE_KLASSE = new Map<string, IfcBauteilGruppe>(
  IFC_BAUTEILGRUPPEN.flatMap((g) => g.klassen.map((k) => [k, g.id] as const)),
)

export function ifcGruppeVonKlasse(klasse: string): IfcBauteilGruppe {
  return GRUPPE_JE_KLASSE.get(klasse.toUpperCase()) ?? 'sonstiges'
}

export function ifcGruppeInfo(gruppe: IfcBauteilGruppe): IfcBauteilGruppeInfo {
  return (
    IFC_BAUTEILGRUPPEN.find((g) => g.id === gruppe) ??
    IFC_BAUTEILGRUPPEN[IFC_BAUTEILGRUPPEN.length - 1]
  )
}

export function ifcGruppenEbenenName(
  gruppe: IfcBauteilGruppe,
  uebersetze: Uebersetzer = t,
): string {
  return uebersetze('modell.ifcBauteilgruppen.ebene', {
    name: uebersetze(`modell.ifcBauteilgruppen.namen.${ifcGruppeInfo(gruppe).id}`),
  })
}

export function ifcGruppeVonEntity(
  h: Pick<HintergrundIfc, 'bauteile'>,
  e: DxfEntity,
): IfcBauteilGruppe | null {
  if (e.bauteil === undefined) return null
  const bauteil = h.bauteile?.[e.bauteil]
  return bauteil ? ifcGruppeVonKlasse(bauteil.klasse) : null
}

export function sichtbareIfcEntities(
  h: Pick<HintergrundIfc, 'entities' | 'bauteile' | 'ausgeblendeteGruppen'>,
): DxfEntity[] {
  const aus = h.ausgeblendeteGruppen
  if (!aus || aus.length === 0) return h.entities
  const ausgeblendet = new Set(aus)
  return h.entities.filter((e) => {
    const gruppe = ifcGruppeVonEntity(h, e)
    return gruppe === null || !ausgeblendet.has(gruppe)
  })
}

export function zaehleIfcGruppen(
  bauteile: readonly { klasse: string }[],
): Map<IfcBauteilGruppe, number> {
  const anzahl = new Map<IfcBauteilGruppe, number>()
  for (const b of bauteile) {
    const g = ifcGruppeVonKlasse(b.klasse)
    anzahl.set(g, (anzahl.get(g) ?? 0) + 1)
  }
  return anzahl
}
