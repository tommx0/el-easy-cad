import type {
  Ansteuerung,
  DockpunkteKonfiguration,
  DocumentStore,
  Fangpunkt,
  KatalogTextElement,
  KomponentenObjekt,
  KomponentenTyp,
  ModulTraegerKonfiguration,
  Objekt,
  SlotMatrix,
  SlotVorlage,
} from '../document-model'
import {
  benoetigtePortAnzahl,
  getDockpoints,
  grundGroesseWelt,
  kombinierbarkeitNachziehen,
  portAnzahl,
  portAnzahlKonfiguration,
  typHatAnsteuerung,
  slotsBeimPlatzieren,
  uebernimmVariablenWerte,
} from '../document-model'
import type { RoutingSettings } from '../routing'
import type { Command } from './command'
import { erzeugeObjektAendernCommand } from './commands'
import {
  berechneGruppenRerouteMitZustand,
  berechneTrunkRerouteMitZustand,
} from './gruppenverschiebung'
import { berechneSchaltverbindungReroute } from './schaltverbindung-routing'

export interface TauschZiel {
  catalogComponentId: string
  variantId: string | null
  dockpunkte?: DockpunkteKonfiguration
  fangpunkt?: Fangpunkt
  textElemente?: KatalogTextElement[]
  breitenFaktor?: number
  hoehenFaktor?: number
  kombinierbar?: boolean
  modulTraeger?: ModulTraegerKonfiguration
  modulSystem?: string
  typ?: KomponentenTyp
  slotVorlagen?: SlotVorlage[]
  slotMatrixVorlage?: SlotMatrix
  slotAnzahlAus?: string
  ansteuerung?: Ansteuerung
}

export type TauschAblehnungsGrund = 'anschluesse' | 'ports' | 'modul'

export interface KomponentenTauschErgebnis {
  command: Command | null
  getauscht: string[]
  abgelehnt: { objektId: string; grund: TauschAblehnungsGrund }[]
  fehlgeschlageneLeitungenAnzahl: number
}

export function erzeugeKomponentenTauschenCommand(
  doc: DocumentStore,
  blattId: string,
  objektIds: readonly string[],
  neu: TauschZiel,
  settings: RoutingSettings,
  label: string,
): KomponentenTauschErgebnis {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const objekte = blatt.objekte
  const zeichnung = doc.getZeichnung()

  const patches = new Map<string, Partial<KomponentenObjekt>>()
  const umnummerierung = new Map<string, (index: number) => number>()
  const abgelehnt: KomponentenTauschErgebnis['abgelehnt'] = []

  for (const id of objektIds) {
    const alt = objekte.find((o): o is KomponentenObjekt => o.type === 'komponente' && o.id === id)
    if (!alt) continue
    if (
      alt.modulTraeger ||
      neu.modulTraeger ||
      (alt.traegerId && alt.modulSystem !== neu.modulSystem)
    ) {
      abgelehnt.push({ objektId: id, grund: 'modul' })
      continue
    }

    const patch = tauschPatch(alt, neu)
    const kandidat: KomponentenObjekt = { ...alt, ...patch }

    const altPorts = alt.dockpunkte?.modus === 'ports' ? portAnzahl(alt) : null
    const neuPorts = neu.dockpunkte ? portAnzahlKonfiguration(neu.dockpunkte) : 0
    const neuIndex = (index: number) =>
      altPorts !== null && neu.dockpunkte?.modus === 'ports' && index >= altPorts
        ? neuPorts + (index - altPorts)
        : index
    const neueDockpunktAnzahl = getDockpoints(kandidat).length
    const belegt = belegteDockpunkte(objekte, id)
    const passt = [...belegt].every((index) => {
      if (altPorts !== null && index < altPorts && neu.dockpunkte?.modus === 'ports') {
        return index < neuPorts
      }
      return neuIndex(index) < neueDockpunktAnzahl
    })
    if (!passt) {
      abgelehnt.push({ objektId: id, grund: 'anschluesse' })
      continue
    }
    if (altPorts !== null && benoetigtePortAnzahl(zeichnung, alt) > neuPorts) {
      abgelehnt.push({ objektId: id, grund: 'ports' })
      continue
    }
    patches.set(id, patch)
    if ([...belegt].some((index) => neuIndex(index) !== index)) umnummerierung.set(id, neuIndex)
  }

  const getauscht = [...patches.keys()]
  if (getauscht.length === 0) {
    return { command: null, getauscht, abgelehnt, fehlgeschlageneLeitungenAnzahl: 0 }
  }

  const umnummeriert = objekte.map((o) => nummeriereAnschluesseUm(o, umnummerierung))
  const neuePfade = berechneGruppenRerouteMitZustand(
    umnummeriert,
    patches,
    settings,
    blatt.geschoss,
  )
  const neueTrunkWege = berechneTrunkRerouteMitZustand(umnummeriert, patches)
  const neueSchaltwege = berechneSchaltverbindungReroute(umnummeriert, patches, settings)
  const fehlgeschlageneLeitungenAnzahl = umnummeriert.filter(
    (o) =>
      o.type === 'leitung' &&
      ((o.start.art === 'dock' && patches.has(o.start.objektId)) ||
        (o.ziel.art === 'dock' && patches.has(o.ziel.objektId))) &&
      !neuePfade.has(o.id),
  ).length

  const command = erzeugeObjektAendernCommand(doc, blattId, label, (aktuelle) =>
    aktuelle.map((original) => {
      const o = nummeriereAnschluesseUm(original, umnummerierung)
      if (o.type === 'komponente') {
        const patch = patches.get(o.id)
        return patch ? { ...o, ...patch } : o
      }
      if (o.type === 'leitung') {
        const pfadSegmente = neuePfade.get(o.id)
        return pfadSegmente ? { ...o, pfadSegmente } : o
      }
      if (o.type === 'trunk') {
        const wegpunkte = neueTrunkWege.get(o.id)
        return wegpunkte ? { ...o, wegpunkte } : o
      }
      if (o.type === 'schaltverbindung') {
        const wegpunkte = neueSchaltwege.get(o.id)
        return wegpunkte ? { ...o, wegpunkte } : o
      }
      return o
    }),
  )
  return { command, getauscht, abgelehnt, fehlgeschlageneLeitungenAnzahl }
}

function tauschPatch(alt: KomponentenObjekt, neu: TauschZiel): Partial<KomponentenObjekt> {
  const kombi = kombinierbarkeitNachziehen(alt, neu.kombinierbar)
  const grund = grundGroesseWelt(kombi.basis)
  const hoehenFaktor = neu.hoehenFaktor && neu.hoehenFaktor !== 1 ? neu.hoehenFaktor : undefined
  const patch: Partial<KomponentenObjekt> = {
    ...kombi.patch,
    catalogComponentId: neu.catalogComponentId,
    variantId: neu.variantId,
    dockpunkte: neu.dockpunkte,
    fangpunkt: neu.fangpunkt,
    textElemente: uebernimmVariablenWerte(alt.textElemente, neu.textElemente),
    breiteWelt: neu.breitenFaktor ? grund * neu.breitenFaktor : undefined,
    groesseWelt: grund * (hoehenFaktor ?? 1),
    hoehenFaktor,
    modulSystem: neu.modulSystem,
    slotAnzahlAus: neu.slotAnzahlAus,
  }
  if (!alt.typ && !alt.gruppeId && neu.typ) {
    patch.typ = neu.typ
    Object.assign(patch, slotsBeimPlatzieren({ ...neu, textElemente: patch.textElemente }))
    if (typHatAnsteuerung(neu.typ)) patch.ansteuerung = neu.ansteuerung
  }
  return patch
}

function belegteDockpunkte(objekte: readonly Objekt[], objektId: string): Set<number> {
  const belegt = new Set<number>()
  for (const o of objekte) {
    if (o.type === 'leitung') {
      for (const ende of [o.start, o.ziel]) {
        if (ende.art === 'dock' && ende.objektId === objektId) belegt.add(ende.dockpunktIndex)
      }
    } else if (o.type === 'schaltverbindung') {
      for (const ende of [o.start, o.ziel]) {
        if (ende.art === 'dock' && ende.objektId === objektId) {
          for (const index of ende.dockpunktIndizes) belegt.add(index)
        }
      }
    } else if (o.type === 'trunk') {
      for (const ende of o.enden) {
        if (ende.dockRef?.objektId === objektId) belegt.add(ende.dockRef.dockpunktIndex)
      }
    }
  }
  return belegt
}

function nummeriereAnschluesseUm(
  o: Objekt,
  umnummerierung: ReadonlyMap<string, (index: number) => number>,
): Objekt {
  if (umnummerierung.size === 0) return o
  if (o.type === 'leitung') {
    const ende = <T extends (typeof o)['start']>(e: T): T => {
      const f = e.art === 'dock' ? umnummerierung.get(e.objektId) : undefined
      return f && e.art === 'dock' ? { ...e, dockpunktIndex: f(e.dockpunktIndex) } : e
    }
    return { ...o, start: ende(o.start), ziel: ende(o.ziel) }
  }
  if (o.type === 'schaltverbindung') {
    const ende = <T extends (typeof o)['start']>(e: T): T => {
      const f = e.art === 'dock' ? umnummerierung.get(e.objektId) : undefined
      return f && e.art === 'dock' ? { ...e, dockpunktIndizes: e.dockpunktIndizes.map(f) } : e
    }
    return { ...o, start: ende(o.start), ziel: ende(o.ziel) }
  }
  if (o.type === 'trunk') {
    const enden = o.enden.map((e) => {
      const f = e.dockRef ? umnummerierung.get(e.dockRef.objektId) : undefined
      return f && e.dockRef
        ? { ...e, dockRef: { ...e.dockRef, dockpunktIndex: f(e.dockRef.dockpunktIndex) } }
        : e
    }) as typeof o.enden
    return { ...o, enden }
  }
  return o
}
