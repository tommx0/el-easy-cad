import type { BauteilVorlagen, Blatt, HintergrundIfc } from '../document-model'
import { ohneVorhandeneBauteile } from '../document-model'
import type { IfcBauteilfunde, IfcBauteilHinweise } from '../ifc'
import { bauteileAufsBlatt } from '../ifc'
import { t } from '../sprache'

export interface IfcBauteileErgebnis {
  vorlagen: BauteilVorlagen
  hinweise: IfcBauteilHinweise
  vorhanden: number
}

export type IfcBauteileJeBlatt =
  { blattId: string; ergebnis: IfcBauteileErgebnis } | { blattId: string; fehler: string }

export function bereiteIfcBauteileAuf(
  funde: IfcBauteilfunde,
  blatt: Pick<Blatt, 'ursprung' | 'massstab' | 'objekte'> & { hintergrund: HintergrundIfc },
): IfcBauteileErgebnis {
  const aufBlatt = bauteileAufsBlatt(funde, blatt.hintergrund.lage, blatt)
  const vorhandeneGuids = new Set(
    blatt.objekte.flatMap((o) => (o.ifcGuid !== undefined ? [o.ifcGuid] : [])),
  )
  const { vorlagen, weggelassen } = ohneVorhandeneBauteile(aufBlatt, vorhandeneGuids)
  return { vorlagen, hinweise: funde.hinweise, vorhanden: weggelassen }
}

export type IfcBauteilArt = 'waende' | 'tueren' | 'fenster' | 'durchbrueche' | 'treppen' | 'raeume'

export const IFC_BAUTEIL_ARTEN: { art: IfcBauteilArt; readonly name: string }[] = (
  ['waende', 'tueren', 'fenster', 'durchbrueche', 'treppen', 'raeume'] as const
).map((art) => ({
  art,
  get name() {
    return t(`aktionen.ifcBauteile.arten.${art}`)
  },
}))

export const IN_DER_WAND: ReadonlySet<IfcBauteilArt> = new Set([
  'tueren',
  'fenster',
  'durchbrueche',
])

const OEFFNUNGSART: Record<'tuer' | 'fenster' | 'wanddurchbruch', IfcBauteilArt> = {
  tuer: 'tueren',
  fenster: 'fenster',
  wanddurchbruch: 'durchbrueche',
}

export function zaehleIfcBauteile(vorlagen: BauteilVorlagen): Record<IfcBauteilArt, number> {
  const anzahl: Record<IfcBauteilArt, number> = {
    waende: vorlagen.waende.length,
    tueren: 0,
    fenster: 0,
    durchbrueche: 0,
    treppen: vorlagen.treppen.length,
    raeume: vorlagen.raeume?.length ?? 0,
  }
  for (const o of vorlagen.oeffnungen) anzahl[OEFFNUNGSART[o.art]]++
  return anzahl
}

export function waehleIfcBauteile(
  vorlagen: BauteilVorlagen,
  gewaehlt: ReadonlySet<IfcBauteilArt>,
): BauteilVorlagen {
  const waende = gewaehlt.has('waende')
  return {
    waende: waende ? vorlagen.waende : [],
    oeffnungen: waende ? vorlagen.oeffnungen.filter((o) => gewaehlt.has(OEFFNUNGSART[o.art])) : [],
    treppen: gewaehlt.has('treppen') ? vorlagen.treppen : [],
    raeume: gewaehlt.has('raeume') ? (vorlagen.raeume ?? []) : [],
  }
}

export function ifcBauteilHinweisTexte(ergebnis: IfcBauteileErgebnis): string[] {
  const h = ergebnis.hinweise
  const texte: string[] = []
  if (ergebnis.vorhanden > 0)
    texte.push(t('aktionen.ifcBauteile.vorhandenBlatt', { n: ergebnis.vorhanden }))
  if (h.waendeGekruemmt > 0)
    texte.push(t('aktionen.ifcBauteile.waendeGekruemmt', { n: h.waendeGekruemmt }))
  if (h.waendeNichtAbleitbar > 0)
    texte.push(t('aktionen.ifcBauteile.waendeNichtAbleitbar', { n: h.waendeNichtAbleitbar }))
  if (h.oeffnungenOhneWand > 0)
    texte.push(t('aktionen.ifcBauteile.oeffnungenOhneWand', { n: h.oeffnungenOhneWand }))
  if (h.tuerenVereinfacht > 0)
    texte.push(t('aktionen.ifcBauteile.tuerenVereinfacht', { n: h.tuerenVereinfacht }))
  if (h.raeumeOhneUmriss > 0)
    texte.push(t('aktionen.ifcBauteile.raeumeOhneUmriss', { n: h.raeumeOhneUmriss }))
  if (h.raeumeZusammenfassung > 0)
    texte.push(t('aktionen.ifcBauteile.raeumeZusammenfassung', { n: h.raeumeZusammenfassung }))
  return texte
}
