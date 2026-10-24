import type { Command } from '../command'
import { CompositeCommand } from '../command'
import type {
  DocumentStore,
  KabelschachtObjekt,
  Objekt,
  TrunkEnde,
  TrunkObjekt,
  Zeichnung,
} from '../../document-model'
import {
  ermittleSchachtStraenge,
  ermittleTrunkKette,
  findeSchacht,
  istKabelschacht,
  mitStrangName,
  strangName,
  strangNamenImVerbund,
  strangTitel,
} from '../../document-model'
import {
  buendleProBlatt,
  erzeugeObjektAendernCommand,
  type ObjekteAendernFn,
} from './objekt-commands'
import { ketenZusammenfuehrenEintraege } from './trunk-commands'
import { schachtAnschluesseNachfuehren } from '../schacht-ablage'
import { berechneLeitungenReroutingBeiTrunkAenderung } from '../leitung-editing'
import type { RoutingSettings } from '../../routing'

function endenNachfuehren(objekte: Objekt[]): Objekt[] {
  return schachtAnschluesseNachfuehren(objekte)
}

export function trunkAmStrang(
  zeichnung: Zeichnung,
  blattId: string,
  schachtId: string,
  strang: number,
  trunkId: string,
): { blattId: string; trunk: TrunkObjekt } | null {
  const schacht = findeSchacht(zeichnung, blattId, schachtId)
  if (!schacht) return null
  const vorhandener = ermittleSchachtStraenge(zeichnung, schacht.verbundId)
    .find((s) => s.nummer === strang)
    ?.anschluesse.find((a) => a.art === 'trunk' && a.objektId !== trunkId)
  if (!vorhandener) return null
  const trunk = zeichnung.blaetter
    .find((b) => b.id === vorhandener.blattId)
    ?.objekte.find((o): o is TrunkObjekt => o.type === 'trunk' && o.id === vorhandener.objektId)
  return trunk ? { blattId: vorhandener.blattId, trunk } : null
}

export function erzeugeSchachtTrunkAnschlussCommand(
  doc: DocumentStore,
  blattId: string,
  trunkId: string,
  endeIndex: 0 | 1,
  schachtId: string,
  strang: number,
  label: string,
  settings?: RoutingSettings,
): Command {
  const zeichnung = doc.getZeichnung()
  const schacht = findeSchacht(zeichnung, blattId, schachtId)
  if (!schacht) throw new Error('Kabelschacht nicht gefunden')

  const vorhandener = ermittleSchachtStraenge(zeichnung, schacht.verbundId)
    .find((s) => s.nummer === strang)
    ?.anschluesse.find((a) => a.art === 'trunk' && a.objektId !== trunkId)

  const eintraege: { blattId: string; aendern: ObjekteAendernFn }[] = [
    { blattId, aendern: anschlussAendern(trunkId, endeIndex, schachtId, strang) },
  ]

  if (vorhandener) {
    const keteA = ermittleTrunkKette(zeichnung, vorhandener.blattId, vorhandener.objektId)
    const keteB = ermittleTrunkKette(zeichnung, blattId, trunkId)
    const vorbild = keteA.find((g) => g.trunk.id === vorhandener.objektId)?.trunk
    if (vorbild) eintraege.push(...ketenZusammenfuehrenEintraege(keteB, vorbild))
  }
  eintraege.push({
    blattId,
    aendern: (objekte) => {
      const nachgefuehrt = endenNachfuehren(objekte)
      if (!settings) return nachgefuehrt
      const trunk = nachgefuehrt.find((o) => o.id === trunkId)
      if (!trunk || trunk.type !== 'trunk') return nachgefuehrt
      const neueSegmente = berechneLeitungenReroutingBeiTrunkAenderung(
        nachgefuehrt,
        trunkId,
        trunk.wegpunkte,
        settings,
        zeichnung.blaetter.find((b) => b.id === blattId)?.geschoss,
      )
      if (neueSegmente.size === 0) return nachgefuehrt
      return nachgefuehrt.map((o) => {
        if (o.type !== 'leitung') return o
        const pfadSegmente = neueSegmente.get(o.id)
        return pfadSegmente ? { ...o, pfadSegmente } : o
      })
    },
  })

  return new CompositeCommand(label, buendleProBlatt(doc, eintraege, label))
}

function anschlussAendern(
  trunkId: string,
  endeIndex: 0 | 1,
  schachtId: string,
  strang: number,
): ObjekteAendernFn {
  return (objekte) =>
    objekte.map((o) => {
      if (o.id !== trunkId || o.type !== 'trunk') return o
      const enden: [TrunkEnde, TrunkEnde] = [...o.enden]
      enden[endeIndex] = { schachtRef: { objektId: schachtId, strang } }
      return { ...o, enden }
    })
}

export function erzeugeSchachtLeitungAnschlussCommand(
  doc: DocumentStore,
  blattId: string,
  leitungId: string,
  seite: 0 | 1,
  schachtId: string,
  strang: number,
  label: string,
): Command {
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    endenNachfuehren(
      objekte.map((o) => {
        if (o.id !== leitungId || o.type !== 'leitung') return o
        const ref = { art: 'schacht' as const, objektId: schachtId, strang }
        return seite === 0 ? { ...o, start: ref } : { ...o, ziel: ref }
      }),
    ),
  )
}

export function erzeugeSchachtLoesenCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  seite: 0 | 1,
  label: string,
): Command {
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    objekte.map((o) => {
      if (o.id !== objektId) return o
      if (o.type === 'trunk') {
        const enden: [TrunkEnde, TrunkEnde] = [...o.enden]
        enden[seite] = { ...enden[seite], schachtRef: undefined }
        return { ...o, enden }
      }
      if (o.type === 'leitung') {
        if (seite === 0) {
          return o.start.art === 'schacht' ? { ...o, start: { art: 'frei' as const } } : o
        }
        return o.ziel.art === 'schacht' ? { ...o, ziel: { art: 'frei' as const } } : o
      }
      return o
    }),
  )
}

function anschluesseAmSchacht(
  doc: DocumentStore,
  schachtId: string,
): { blattId: string; objektId: string; seite: 0 | 1 }[] {
  const treffer: { blattId: string; objektId: string; seite: 0 | 1 }[] = []
  for (const blatt of doc.getZeichnung().blaetter) {
    for (const objekt of blatt.objekte) {
      if (objekt.type === 'trunk') {
        objekt.enden.forEach((ende, index) => {
          if (ende.schachtRef?.objektId === schachtId) {
            treffer.push({ blattId: blatt.id, objektId: objekt.id, seite: index === 0 ? 0 : 1 })
          }
        })
      } else if (objekt.type === 'leitung') {
        if (objekt.start.art === 'schacht' && objekt.start.objektId === schachtId) {
          treffer.push({ blattId: blatt.id, objektId: objekt.id, seite: 0 })
        }
        if (objekt.ziel.art === 'schacht' && objekt.ziel.objektId === schachtId) {
          treffer.push({ blattId: blatt.id, objektId: objekt.id, seite: 1 })
        }
      }
    }
  }
  return treffer
}

export function zaehleAnschluesseAmSchacht(doc: DocumentStore, schachtId: string): number {
  return anschluesseAmSchacht(doc, schachtId).length
}

export function erzeugeSchachtVerbundWechselCommand(
  doc: DocumentStore,
  blattId: string,
  schachtId: string,
  ziel: { verbundId: string; name: string; geschosshoehe: number },
  label: string,
): Command {
  const anschluesse = anschluesseAmSchacht(doc, schachtId)
  const namen = strangNamenImVerbund(doc.getZeichnung(), ziel.verbundId)
  const strangNamen = Object.keys(namen).length > 0 ? { ...namen } : undefined
  const eintraege: { blattId: string; aendern: ObjekteAendernFn }[] = anschluesse.map((a) => ({
    blattId: a.blattId,
    aendern: (objekte) => loeseAmObjekt(objekte, a.objektId, a.seite),
  }))
  eintraege.push({
    blattId,
    aendern: (objekte) =>
      objekte.map((o) =>
        o.id === schachtId && istKabelschacht(o)
          ? {
              ...o,
              verbundId: ziel.verbundId,
              name: ziel.name,
              geschosshoehe: ziel.geschosshoehe,
              strangNamen,
            }
          : o,
      ),
  })
  return new CompositeCommand(label, buendleProBlatt(doc, eintraege, label))
}

function loeseAmObjekt(objekte: Objekt[], objektId: string, seite: 0 | 1): Objekt[] {
  return objekte.map((o) => {
    if (o.id !== objektId) return o
    if (o.type === 'trunk') {
      const enden: [TrunkEnde, TrunkEnde] = [...o.enden]
      enden[seite] = { ...enden[seite], schachtRef: undefined }
      return { ...o, enden }
    }
    if (o.type === 'leitung') {
      if (seite === 0 && o.start.art === 'schacht') return { ...o, start: { art: 'frei' as const } }
      if (seite === 1 && o.ziel.art === 'schacht') return { ...o, ziel: { art: 'frei' as const } }
    }
    return o
  })
}

export function erzeugeSchachtVerbundUmbenennenCommand(
  doc: DocumentStore,
  verbundId: string,
  name: string,
  label: string,
): Command {
  const eintraege: { blattId: string; aendern: ObjekteAendernFn }[] = []
  const aendern: ObjekteAendernFn = (objekte) =>
    objekte.map((o) => (istKabelschacht(o) && o.verbundId === verbundId ? { ...o, name } : o))
  for (const blatt of doc.getZeichnung().blaetter) {
    if (blatt.objekte.some((o) => istKabelschacht(o) && o.verbundId === verbundId)) {
      eintraege.push({ blattId: blatt.id, aendern })
    }
  }
  return new CompositeCommand(label, buendleProBlatt(doc, eintraege, label))
}

export function erzeugeStrangUmbenennenCommand(
  doc: DocumentStore,
  verbundId: string,
  nummer: number,
  name: string,
  label: string,
): Command | null {
  const zeichnung = doc.getZeichnung()
  const namen = mitStrangName(strangNamenImVerbund(zeichnung, verbundId), nummer, name)
  const gleich = (s: KabelschachtObjekt) =>
    JSON.stringify(s.strangNamen ?? {}) === JSON.stringify(namen ?? {})
  const eintraege: { blattId: string; aendern: ObjekteAendernFn }[] = []
  const aendern: ObjekteAendernFn = (objekte) =>
    objekte.map((o) =>
      istKabelschacht(o) && o.verbundId === verbundId ? { ...o, strangNamen: namen } : o,
    )
  for (const blatt of zeichnung.blaetter) {
    const schaechte = blatt.objekte.filter(
      (o): o is KabelschachtObjekt => istKabelschacht(o) && o.verbundId === verbundId,
    )
    if (schaechte.some((s) => !gleich(s))) eintraege.push({ blattId: blatt.id, aendern })
  }
  if (eintraege.length === 0) return null
  return new CompositeCommand(label, buendleProBlatt(doc, eintraege, label))
}

export interface StrangBenennung {
  blattId: string
  schachtId: string
  strang: number
  name?: string
}

export function mitStrangBenennung(
  doc: DocumentStore,
  anschluss: Command,
  benennungen: readonly StrangBenennung[],
): Command {
  anschluss.do()
  const folge: Command[] = [anschluss]
  for (const b of benennungen) {
    if (b.name === undefined) continue
    const schacht = findeSchacht(doc.getZeichnung(), b.blattId, b.schachtId)
    if (!schacht) continue
    const umbenennen = erzeugeStrangUmbenennenCommand(doc, schacht.verbundId, b.strang, b.name, '')
    if (!umbenennen) continue
    umbenennen.do()
    folge.push(umbenennen)
  }
  return folge.length === 1 ? anschluss : new CompositeCommand(anschluss.label, folge)
}

export function strangTitelAmSchacht(doc: DocumentStore, b: StrangBenennung): string {
  if (b.name !== undefined) return strangTitel(b.strang, b.name.trim() || undefined)
  const zeichnung = doc.getZeichnung()
  const schacht = findeSchacht(zeichnung, b.blattId, b.schachtId)
  return strangTitel(
    b.strang,
    schacht ? strangName(zeichnung, schacht.verbundId, b.strang) : undefined,
  )
}

export function erzeugeSchachtAendernCommand(
  doc: DocumentStore,
  blattId: string,
  schachtId: string,
  patch: Partial<Pick<KabelschachtObjekt, 'geschosshoehe' | 'breite' | 'hoehe' | 'drehung'>>,
  label: string,
): Command {
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    endenNachfuehren(
      objekte.map((o) => (o.id === schachtId && istKabelschacht(o) ? { ...o, ...patch } : o)),
    ),
  )
}

export function trunksAmSchacht(objekte: readonly Objekt[], schachtId: string): TrunkObjekt[] {
  return objekte.filter(
    (o): o is TrunkObjekt =>
      o.type === 'trunk' && o.enden.some((e) => e.schachtRef?.objektId === schachtId),
  )
}
