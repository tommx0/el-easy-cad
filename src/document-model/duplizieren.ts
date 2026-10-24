import type { Point } from './geometry'
import type { Objekt, WandObjekt } from './objekte'
import { dupliziereObjekt } from './objekte'
import type { Geraetegruppe } from './geraetegruppe'
import { erzeugeGeraetegruppe } from './geraetegruppe'
import type { Zeichnung } from './zeichnung'
import { belegteNummernInZeichnung, naechsteFreieNummer } from './trunk-kette'
import { ermittleOeffnungsGeometrie } from './wand'
import { naechstesVerteilerKennzeichen } from './verteiler'

export function dupliziereObjekte(
  objekte: readonly Objekt[],
  versatz: Point,
  zeichnung: Zeichnung,
): { kopien: Objekt[]; neueGruppen: Geraetegruppe[] } {
  const idUmbiegung = new Map<string, string>()
  let kopien = objekte.map((objekt) => {
    const kopie = dupliziereObjekt(objekt, versatz)
    idUmbiegung.set(objekt.id, kopie.id)
    return kopie
  })

  const belegteNummern = new Set(belegteNummernInZeichnung(zeichnung))
  kopien = kopien.map((kopie) => {
    if (kopie.type !== 'leitung') return kopie
    const nummer = naechsteFreieNummer(belegteNummern)
    belegteNummern.add(nummer)
    return { ...kopie, nummer }
  })

  const belegteVerteiler: string[] = []
  kopien = kopien.map((kopie) => {
    if (kopie.type !== 'komponente' || !kopie.verteiler) return kopie
    const kennzeichen = naechstesVerteilerKennzeichen(zeichnung, belegteVerteiler)
    belegteVerteiler.push(kennzeichen)
    return { ...kopie, verteiler: { ...kopie.verteiler, kennzeichen } }
  })

  const kopierteWaende = new Map(
    kopien.filter((k): k is WandObjekt => k.type === 'wand').map((w) => [w.id, w] as const),
  )
  kopien = kopien.map((kopie) => {
    if (kopie.type !== 'tuer' && kopie.type !== 'fenster' && kopie.type !== 'wanddurchbruch')
      return kopie
    const neueWandId = idUmbiegung.get(kopie.wandId)
    if (!neueWandId) return kopie
    const wand = kopierteWaende.get(neueWandId)
    const geometrie = wand ? ermittleOeffnungsGeometrie(wand, kopie) : null
    return { ...kopie, wandId: neueWandId, ...(geometrie ?? {}) }
  })

  const neueGruppeIdJeAlterGruppe = new Map<string, string>()
  const neueGruppen: Geraetegruppe[] = []
  kopien = kopien.map((kopie) => {
    if (kopie.type !== 'komponente' || !kopie.gruppeId) return kopie
    const alteGruppeId = kopie.gruppeId
    let neueGruppeId = neueGruppeIdJeAlterGruppe.get(alteGruppeId)
    if (!neueGruppeId) {
      const original = zeichnung.geraeteGruppen.find((g) => g.id === alteGruppeId)
      if (original) {
        const neueGruppe: Geraetegruppe = {
          ...erzeugeGeraetegruppe(original.typ, original.name),
          slots: original.slots,
          slotMatrix: original.slotMatrix,
          ansteuerung: original.ansteuerung,
        }
        neueGruppen.push(neueGruppe)
        neueGruppeId = neueGruppe.id
        neueGruppeIdJeAlterGruppe.set(alteGruppeId, neueGruppeId)
      }
    }
    return { ...kopie, gruppeId: neueGruppeId }
  })

  return { kopien, neueGruppen }
}
