import type { Command } from '../command'
import { CompositeCommand } from '../command'
import type {
  DockpunkteKonfiguration,
  Fangpunkt,
  DocumentStore,
  KatalogTextElement,
  KomponentenObjekt,
  LeitungsObjekt,
  Objekt,
  SlotZiel,
  TrunkEnde,
  TrunkObjekt,
} from '../../document-model'
import {
  grundGroesseWelt,
  aktualisiereRaeume,
  planUebersetzer,
  austrittTRichtungSwitch,
  belegteNummernInZeichnung,
  benoetigtePortAnzahl,
  bereinigeSlots,
  findeLeitungenInTrunks,
  fuehreSchaltverbindungenNach,
  knotenAusAbzweigen,
  raeumeKnotenAuf,
  istBuendelEnde,
  leitungenEbeneId,
  naechsteFreieNummer,
  neueObjektBasis,
  ordneWandstellen,
  portAnzahl,
  portAnzahlKonfiguration,
  uebernimmVariablenWerte,
  verbindeDurchGeloeschte,
} from '../../document-model'
import { erzeugeZeichnungAendernCommand } from './blatt-commands'
import { t } from '../../sprache'

const INTERNE_VERBINDUNG_FARBE = '#E86A17'

export class SetObjekteCommand implements Command {
  readonly label: string
  private doc: DocumentStore
  private blattId: string
  private vorher: Objekt[]
  private nachher: Objekt[]

  constructor(
    doc: DocumentStore,
    blattId: string,
    vorher: Objekt[],
    nachher: Objekt[],
    label: string,
  ) {
    this.doc = doc
    this.blattId = blattId
    this.vorher = vorher
    this.nachher = nachher
    this.label = label
  }

  do() {
    this.doc.updateBlatt(this.blattId, { objekte: this.nachher })
  }

  undo() {
    this.doc.updateBlatt(this.blattId, { objekte: this.vorher })
  }
}

export function erzeugeObjektAendernCommand(
  doc: DocumentStore,
  blattId: string,
  label: string,
  aendern: (objekte: Objekt[]) => Objekt[],
  nachNachfuehren?: (vorher: readonly Objekt[], nachher: Objekt[]) => Objekt[],
): Command {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const vorher = blatt.objekte
  const nachgefuehrt = knotenAusAbzweigen(
    fuehreSchaltverbindungenNach(
      aktualisiereRaeume(
        ordneWandstellen(aendern(vorher), doc.getZeichnung()),
        planUebersetzer(doc.getZeichnung()),
      ),
    ),
  )
  const nachher = nachNachfuehren ? nachNachfuehren(vorher, nachgefuehrt) : nachgefuehrt
  return new SetObjekteCommand(doc, blattId, vorher, nachher, label)
}

export type ObjekteAendernFn = (objekte: Objekt[]) => Objekt[]

export function buendleProBlatt(
  doc: DocumentStore,
  eintraege: { blattId: string; aendern: ObjekteAendernFn }[],
  label: string,
): Command[] {
  const proBlatt = new Map<string, ObjekteAendernFn[]>()
  for (const { blattId, aendern } of eintraege) {
    const liste = proBlatt.get(blattId) ?? []
    liste.push(aendern)
    proBlatt.set(blattId, liste)
  }
  return [...proBlatt.entries()].map(([blattId, aendernListe]) =>
    erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
      aendernListe.reduce((zwischenstand, fn) => fn(zwischenstand), objekte),
    ),
  )
}

export function erzeugeObjektHinzufuegenCommand(
  doc: DocumentStore,
  blattId: string,
  objekt: Objekt,
  label: string,
): Command {
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) => [...objekte, objekt])
}

export function erzeugeObjektEntfernenCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  label: string,
): Command {
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    objekte.filter((o) => o.id !== objektId),
  )
}

function entfernenAufBlattAendernFn(
  idSet: ReadonlySet<string>,
  leitungenImTrunk: ReadonlySet<string>,
  istSlotZielGeloescht: (ziel: SlotZiel) => boolean,
): ObjekteAendernFn {
  return (objekte) =>
    objekte
      .filter((o) => {
        if (idSet.has(o.id)) return false
        if (o.type === 'leitung') {
          const startEntfernt = o.start.art === 'dock' && idSet.has(o.start.objektId)
          const zielEntfernt = o.ziel.art === 'dock' && idSet.has(o.ziel.objektId)
          if (startEntfernt || zielEntfernt || leitungenImTrunk.has(o.id)) return false
        }
        if (
          (o.type === 'tuer' || o.type === 'fenster' || o.type === 'wanddurchbruch') &&
          idSet.has(o.wandId)
        )
          return false
        return true
      })
      .map((o) => {
        if (o.type === 'komponente') {
          let neu = o
          if (neu.traegerId !== undefined && idSet.has(neu.traegerId)) {
            neu = { ...neu, traegerId: undefined, slotIndex: undefined }
          }
          if (neu.slots) {
            const slots = bereinigeSlots(neu.slots, istSlotZielGeloescht)
            if (slots !== neu.slots) neu = { ...neu, slots }
          }
          return neu
        }
        if (o.type === 'leitung') {
          const startAmSchacht = o.start.art === 'schacht' && idSet.has(o.start.objektId)
          const zielAmSchacht = o.ziel.art === 'schacht' && idSet.has(o.ziel.objektId)
          if (!startAmSchacht && !zielAmSchacht) return o
          return {
            ...o,
            start: startAmSchacht ? { art: 'frei' } : o.start,
            ziel: zielAmSchacht ? { art: 'frei' } : o.ziel,
          }
        }
        if (o.type !== 'trunk') return o
        const loese = (e: TrunkEnde): TrunkEnde => {
          let neu = e
          if (neu.dockRef && idSet.has(neu.dockRef.objektId)) neu = { ...neu, dockRef: undefined }
          if (neu.schachtRef && idSet.has(neu.schachtRef.objektId)) {
            neu = { ...neu, schachtRef: undefined }
          }
          return neu
        }
        const enden: [TrunkEnde, TrunkEnde] = [loese(o.enden[0]), loese(o.enden[1])]
        return enden[0] === o.enden[0] && enden[1] === o.enden[1] ? o : { ...o, enden }
      })
}

function verweistAufEntfernten(trunk: TrunkObjekt, idSet: ReadonlySet<string>): boolean {
  return trunk.enden.some(
    (e) =>
      (e.verbundenesEnde !== undefined && idSet.has(e.verbundenesEnde.trunkId)) ||
      (e.verbundenerPfad !== undefined && idSet.has(e.verbundenerPfad.trunkId)),
  )
}

function trunkVerweiseLoesenAendernFn(idSet: ReadonlySet<string>): ObjekteAendernFn {
  return (objekte) =>
    objekte.map((o) => {
      if (o.type !== 'trunk') return o
      const loese = (e: TrunkEnde): TrunkEnde => {
        let neu = e
        if (e.verbundenesEnde !== undefined && idSet.has(e.verbundenesEnde.trunkId)) {
          neu = { ...neu, verbundenesEnde: undefined }
        }
        if (e.verbundenerPfad !== undefined && idSet.has(e.verbundenerPfad.trunkId)) {
          neu = { ...neu, verbundenerPfad: undefined }
        }
        return neu
      }
      const enden: [TrunkEnde, TrunkEnde] = [loese(o.enden[0]), loese(o.enden[1])]
      return enden[0] === o.enden[0] && enden[1] === o.enden[1] ? o : { ...o, enden }
    })
}

export function erzeugeObjektAktualisierenCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  patch: Partial<Objekt>,
  label: string,
): Command {
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    objekte.map((o) => (o.id === objektId ? ({ ...o, ...patch } as Objekt) : o)),
  )
}

export function erzeugeKabeltypAendernCommand(
  doc: DocumentStore,
  leitungIds: readonly string[],
  patch: { kabeltypId?: string; typ?: string },
  label: string,
): Command {
  const idSet = new Set(leitungIds)
  const betroffen = (objekte: Objekt[]) =>
    objekte.some((o) => o.type === 'leitung' && idSet.has(o.id))
  const eintraege = doc
    .getZeichnung()
    .blaetter.filter((blatt) => betroffen(blatt.objekte))
    .map((blatt) => ({
      blattId: blatt.id,
      aendern: (objekte: Objekt[]) =>
        objekte.map((o) => (o.type === 'leitung' && idSet.has(o.id) ? { ...o, ...patch } : o)),
    }))
  const commands = buendleProBlatt(doc, eintraege, label)
  return commands.length === 1 ? commands[0] : new CompositeCommand(label, commands)
}

export function erzeugeModulFelderNachtragenCommand(
  doc: DocumentStore,
  patches: ReadonlyMap<string, Partial<Pick<KomponentenObjekt, 'modulSystem' | 'modulTraeger'>>>,
  label: string,
): Command {
  const eintraege = doc
    .getZeichnung()
    .blaetter.filter((blatt) => blatt.objekte.some((o) => patches.has(o.id)))
    .map((blatt) => ({
      blattId: blatt.id,
      aendern: (objekte: Objekt[]) =>
        objekte.map((o) => {
          const patch = patches.get(o.id)
          return patch ? ({ ...o, ...patch } as Objekt) : o
        }),
    }))
  const commands = buendleProBlatt(doc, eintraege, label)
  return commands.length === 1 ? commands[0] : new CompositeCommand(label, commands)
}

export type ReorderRichtung = 'nach-vorne' | 'nach-hinten' | 'ganz-vorne' | 'ganz-hinten'

export function erzeugeReorderCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  richtung: ReorderRichtung,
): Command {
  return erzeugeObjektAendernCommand(
    doc,
    blattId,
    t('werkzeuge.commands.reihenfolge'),
    (objekte) => {
      const index = objekte.findIndex((o) => o.id === objektId)
      if (index === -1) return objekte
      const neu = [...objekte]
      const [objekt] = neu.splice(index, 1)
      switch (richtung) {
        case 'nach-vorne':
          neu.splice(Math.min(index + 1, neu.length), 0, objekt)
          break
        case 'nach-hinten':
          neu.splice(Math.max(index - 1, 0), 0, objekt)
          break
        case 'ganz-vorne':
          neu.push(objekt)
          break
        case 'ganz-hinten':
          neu.unshift(objekt)
          break
      }
      return neu
    },
  )
}

export function erzeugeSwitchPortZuweisenCommand(
  doc: DocumentStore,
  blattId: string,
  leitungId: string,
  ziel: { blattId: string; objektId: string; portIndex: number } | null,
  label: string,
): Command {
  const zeichnung = doc.getZeichnung()
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    objekte.map((o) => {
      if (o.id !== leitungId || o.type !== 'leitung') return o
      if (!ziel) {
        return o.ziel.art === 'switchport' ? { ...o, ziel: { art: 'frei' as const } } : o
      }
      const letzterIndex = o.trunkDurchgaenge.length - 1
      if (letzterIndex < 0) return o
      const letzter = o.trunkDurchgaenge[letzterIndex]
      const durchgaenge = [...o.trunkDurchgaenge]
      durchgaenge[letzterIndex] = {
        ...letzter,
        austrittT: austrittTRichtungSwitch(zeichnung, blattId, letzter.trunkId, ziel.objektId),
      }
      const segmente = [...o.pfadSegmente]
      segmente[segmente.length - 1] = []
      const neu: LeitungsObjekt = {
        ...o,
        pfadSegmente: segmente,
        trunkDurchgaenge: durchgaenge,
        ziel: { art: 'switchport', ...ziel },
      }
      const anschluesse = o.verteilerAnschluesse?.filter((a) => a.ende !== 'ziel')
      if (anschluesse?.length) neu.verteilerAnschluesse = anschluesse
      else delete neu.verteilerAnschluesse
      return neu
    }),
  )
}

export function erzeugeKomponenteAustauschenCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  neu: {
    catalogComponentId: string
    variantId: string | null
    dockpunkte?: DockpunkteKonfiguration
    fangpunkt?: Fangpunkt
    textElemente?: KatalogTextElement[]
    breitenFaktor?: number
    hoehenFaktor?: number
  },
  label: string,
): Command | null {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const alt = blatt.objekte.find((o) => o.id === objektId)
  if (!alt || alt.type !== 'komponente') return null
  const altPortAnzahl = portAnzahl(alt)
  const altTrunkPunkteAnzahl =
    alt.dockpunkte?.modus === 'ports' ? (alt.dockpunkte.trunkPunkte?.length ?? 0) : 0
  const neuPortAnzahl = neu.dockpunkte ? portAnzahlKonfiguration(neu.dockpunkte) : 0
  const neuTrunkPunkteAnzahl =
    neu.dockpunkte?.modus === 'ports' ? (neu.dockpunkte.trunkPunkte?.length ?? 0) : 0
  const benoetigtePorts = benoetigtePortAnzahl(doc.getZeichnung(), alt)
  if (neuPortAnzahl < benoetigtePorts || neuTrunkPunkteAnzahl < altTrunkPunkteAnzahl) return null
  const grund = grundGroesseWelt(alt)
  const hoehenFaktor = neu.hoehenFaktor && neu.hoehenFaktor !== 1 ? neu.hoehenFaktor : undefined
  const breiteWelt = neu.breitenFaktor ? grund * neu.breitenFaktor : undefined
  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    objekte.map((o) => {
      if (o.id === objektId && o.type === 'komponente') {
        return {
          ...o,
          catalogComponentId: neu.catalogComponentId,
          variantId: neu.variantId,
          dockpunkte: neu.dockpunkte,
          fangpunkt: neu.fangpunkt,
          textElemente: uebernimmVariablenWerte(o.textElemente, neu.textElemente),
          breiteWelt,
          groesseWelt: grund * (hoehenFaktor ?? 1),
          hoehenFaktor,
        }
      }
      if (o.type !== 'trunk') return o
      if (!o.enden.some((ende) => ende.dockRef?.objektId === objektId)) return o
      const verschieben = (ende: TrunkEnde): TrunkEnde =>
        ende.dockRef?.objektId === objektId
          ? {
              ...ende,
              dockRef: {
                ...ende.dockRef,
                dockpunktIndex: neuPortAnzahl + (ende.dockRef.dockpunktIndex - altPortAnzahl),
              },
            }
          : ende
      return {
        ...o,
        enden: [verschieben(o.enden[0]), verschieben(o.enden[1])],
      }
    }),
  )
}

export function erzeugeInterneVerbindungCommand(
  doc: DocumentStore,
  von: { blattId: string; objektId: string; portIndex: number },
  nach: { blattId: string; objektId: string; portIndex: number },
): Command {
  const zeichnung = doc.getZeichnung()
  const blatt = doc.getBlatt(von.blattId)
  if (!blatt) throw new Error(`Blatt ${von.blattId} nicht gefunden`)
  const ebeneId = leitungenEbeneId(blatt.ebenen) ?? blatt.aktiveEbeneId
  const objekt: LeitungsObjekt = {
    ...neueObjektBasis(ebeneId, { farbe: INTERNE_VERBINDUNG_FARBE }),
    type: 'leitung',
    pfadSegmente: [[]],
    start: { art: 'switchport', ...von },
    ziel: { art: 'switchport', ...nach },
    trunkDurchgaenge: [],
    nummer: naechsteFreieNummer(belegteNummernInZeichnung(zeichnung)),
    kabeltypId: zeichnung.standardKabeltypId,
  }
  return erzeugeObjektHinzufuegenCommand(
    doc,
    von.blattId,
    objekt,
    t('werkzeuge.commands.interneVerbindung'),
  )
}

export function erzeugeObjekteEntfernenCommand(
  doc: DocumentStore,
  blattId: string,
  objektIds: string[],
  label: string,
): Command {
  const idSet = new Set(objektIds)
  const zeichnung = doc.getZeichnung()

  const istSlotZielGeloescht = (ziel: SlotZiel): boolean =>
    ziel.art === 'instanz' && ziel.blattId === blattId && idSet.has(ziel.objektId)

  const entfernteTrunkIds = new Set(
    (doc.getBlatt(blattId)?.objekte ?? [])
      .filter((o): o is TrunkObjekt => o.type === 'trunk' && idSet.has(o.id))
      .map((o) => o.id),
  )
  const leitungenProBlatt = new Map<string, Set<string>>()
  for (const treffer of findeLeitungenInTrunks(zeichnung, entfernteTrunkIds)) {
    const menge = leitungenProBlatt.get(treffer.blattId) ?? new Set<string>()
    menge.add(treffer.leitung.id)
    leitungenProBlatt.set(treffer.blattId, menge)
  }

  const betroffeneKnoten = new Set<string>()
  for (const o of doc.getBlatt(blattId)?.objekte ?? [])
    if (o.type === 'schaltverbindung' && idSet.has(o.id))
      for (const a of [o.start, o.ziel]) if (a.art === 'knoten') betroffeneKnoten.add(a.objektId)
  const ohneBauteile = entfernenAufBlattAendernFn(
    idSet,
    leitungenProBlatt.get(blattId) ?? new Set(),
    istSlotZielGeloescht,
  )
  const entfernen: ObjekteAendernFn = (objekte) =>
    ohneBauteile(verbindeDurchGeloeschte(objekte, idSet))
  const eintraege: { blattId: string; aendern: ObjekteAendernFn }[] = [
    {
      blattId,
      aendern:
        betroffeneKnoten.size > 0
          ? (objekte) => raeumeKnotenAuf(entfernen(objekte), betroffeneKnoten)
          : entfernen,
    },
  ]
  for (const blatt of zeichnung.blaetter) {
    if (blatt.id !== blattId) {
      const zuEntfernen = new Set(leitungenProBlatt.get(blatt.id) ?? [])
      for (const o of blatt.objekte) {
        if (
          o.type === 'leitung' &&
          ((istBuendelEnde(o.ziel) && idSet.has(o.ziel.objektId)) ||
            (istBuendelEnde(o.start) && idSet.has(o.start.objektId)))
        ) {
          zuEntfernen.add(o.id)
        }
      }
      if (zuEntfernen.size > 0) {
        eintraege.push({
          blattId: blatt.id,
          aendern: (objekte) => objekte.filter((o) => !zuEntfernen.has(o.id)),
        })
      }
      const hatSlotVerweise = blatt.objekte.some(
        (o) => o.type === 'komponente' && o.slots?.some((s) => s.ziele.some(istSlotZielGeloescht)),
      )
      if (hatSlotVerweise) {
        eintraege.push({
          blattId: blatt.id,
          aendern: (objekte) =>
            objekte.map((o) =>
              o.type === 'komponente' && o.slots
                ? { ...o, slots: bereinigeSlots(o.slots, istSlotZielGeloescht) }
                : o,
            ),
        })
      }
    }
    const hatVerweise = blatt.objekte.some(
      (o): o is TrunkObjekt =>
        o.type === 'trunk' && !idSet.has(o.id) && verweistAufEntfernten(o, idSet),
    )
    if (hatVerweise) {
      eintraege.push({ blattId: blatt.id, aendern: trunkVerweiseLoesenAendernFn(idSet) })
    }
  }
  const commands: Command[] = buendleProBlatt(doc, eintraege, label)

  const geraeteGruppenBereinigt = zeichnung.geraeteGruppen.map((g) => {
    const slots = bereinigeSlots(g.slots, istSlotZielGeloescht)
    return slots === g.slots ? g : { ...g, slots }
  })
  if (geraeteGruppenBereinigt.some((g, i) => g !== zeichnung.geraeteGruppen[i])) {
    commands.push(
      erzeugeZeichnungAendernCommand(doc, label, { geraeteGruppen: geraeteGruppenBereinigt }),
    )
  }

  return commands.length === 1 ? commands[0] : new CompositeCommand(label, commands)
}
