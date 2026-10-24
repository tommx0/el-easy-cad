import type { Command } from '../command'
import { CompositeCommand } from '../command'
import type {
  DocumentStore,
  Objekt,
  Point,
  TrunkDurchgang,
  TrunkEnde,
  TrunkKettenGlied,
  TrunkObjekt,
} from '../../document-model'
import {
  ermittleTrunkKette,
  findeLeitungenInTrunks,
  pfadGesamtLaenge,
  verschmeltzeWegpunkte,
  verschmolzenesDurchgangT,
} from '../../document-model'
import {
  buendleProBlatt,
  erzeugeObjektAendernCommand,
  erzeugeObjekteEntfernenCommand,
  type ObjekteAendernFn,
} from './objekt-commands'
import { berechneLeitungenReroutingBeiTrunkAenderung } from '../leitung-editing'
import type { RoutingSettings } from '../../routing'
import { abzweigeNachfuehren } from '../trunk-ablage'
import { t } from '../../sprache'

type TrunkEigenschaftenPatch = Partial<
  Pick<
    TrunkObjekt,
    'name' | 'farbe' | 'strichstaerke' | 'beschreibung' | 'ausfuehrung' | 'abmessung'
  >
>

function trunkPatchAendern(
  trunkIds: ReadonlySet<string>,
  patch: TrunkEigenschaftenPatch,
): ObjekteAendernFn {
  const ohneLeere = Object.entries(patch)
    .filter(([, wert]) => wert === undefined)
    .map(([schluessel]) => schluessel)
  return (objekte) =>
    objekte.map((o) => {
      if (o.type !== 'trunk' || !trunkIds.has(o.id)) return o
      const neu: Record<string, unknown> = { ...o, ...patch }
      for (const schluessel of ohneLeere) delete neu[schluessel]
      return neu as unknown as TrunkObjekt
    })
}

export function erzeugeTrunkEigenschaftenSyncCommand(
  doc: DocumentStore,
  blattId: string,
  trunkId: string,
  patch: TrunkEigenschaftenPatch,
  label: string,
): Command {
  const kette = ermittleTrunkKette(doc.getZeichnung(), blattId, trunkId)
  const trunkIds = new Set(kette.map((g) => g.trunk.id))
  const aendern = trunkPatchAendern(trunkIds, patch)
  const eintraege = kette.map((g) => ({ blattId: g.blattId, aendern }))
  return new CompositeCommand(label, buendleProBlatt(doc, eintraege, label))
}

export function erzeugeTrunkVerbindenCommand(
  doc: DocumentStore,
  blattIdA: string,
  trunkIdA: string,
  endeIndexA: 0 | 1,
  blattIdB: string,
  trunkIdB: string,
  endeIndexB: 0 | 1,
  label: string,
): Command {
  const zeichnung = doc.getZeichnung()
  const keteA = ermittleTrunkKette(zeichnung, blattIdA, trunkIdA)
  const keteB = ermittleTrunkKette(zeichnung, blattIdB, trunkIdB)
  const trunkA = keteA.find((g) => g.trunk.id === trunkIdA)!.trunk

  const eintraege: { blattId: string; aendern: ObjekteAendernFn }[] = []

  const verkettungAendern =
    (trunkIdHier: string, endeIndexHier: 0 | 1, ziel: TrunkEnde['verbundenesEnde']) =>
    (objekte: Objekt[]) =>
      objekte.map((o) => {
        if (o.id !== trunkIdHier || o.type !== 'trunk') return o
        const enden: [TrunkEnde, TrunkEnde] = [...o.enden]
        enden[endeIndexHier] = {
          ...enden[endeIndexHier],
          verbundenesEnde: ziel,
          verbundenerPfad: undefined,
        }
        return { ...o, enden }
      })
  eintraege.push({
    blattId: blattIdA,
    aendern: verkettungAendern(trunkIdA, endeIndexA, {
      blattId: blattIdB,
      trunkId: trunkIdB,
      endeIndex: endeIndexB,
    }),
  })
  eintraege.push({
    blattId: blattIdB,
    aendern: verkettungAendern(trunkIdB, endeIndexB, {
      blattId: blattIdA,
      trunkId: trunkIdA,
      endeIndex: endeIndexA,
    }),
  })

  eintraege.push(...ketenZusammenfuehrenEintraege(keteB, trunkA))

  return new CompositeCommand(label, buendleProBlatt(doc, eintraege, label))
}

export function ketenZusammenfuehrenEintraege(
  keteB: readonly TrunkKettenGlied[],
  vorbild: TrunkObjekt,
): { blattId: string; aendern: ObjekteAendernFn }[] {
  const trunkIdsB = new Set(keteB.map((g) => g.trunk.id))
  const blattIdsB = new Set(keteB.map((g) => g.blattId))

  const syncAendern = trunkPatchAendern(trunkIdsB, {
    name: vorbild.name,
    farbe: vorbild.farbe,
    strichstaerke: vorbild.strichstaerke,
    ausfuehrung: vorbild.ausfuehrung,
    abmessung: vorbild.abmessung,
  })
  return [...blattIdsB].map((blattId) => ({ blattId, aendern: syncAendern }))
}

export function erzeugeTrunkTrennenCommand(
  doc: DocumentStore,
  blattId: string,
  trunkId: string,
  endeIndex: 0 | 1,
  label: string,
): Command | null {
  const blatt = doc.getBlatt(blattId)
  const trunk = blatt?.objekte.find((o): o is TrunkObjekt => o.id === trunkId && o.type === 'trunk')
  const verbindung = trunk?.enden[endeIndex].verbundenesEnde
  if (!verbindung) return null

  const eintraege: { blattId: string; aendern: ObjekteAendernFn }[] = [
    {
      blattId,
      aendern: (objekte) =>
        objekte.map((o) => {
          if (o.id !== trunkId || o.type !== 'trunk') return o
          const enden: [TrunkEnde, TrunkEnde] = [...o.enden]
          enden[endeIndex] = { ...enden[endeIndex], verbundenesEnde: undefined }
          return { ...o, enden }
        }),
    },
    {
      blattId: verbindung.blattId,
      aendern: (objekte) =>
        objekte.map((o) => {
          if (o.id !== verbindung.trunkId || o.type !== 'trunk') return o
          const enden: [TrunkEnde, TrunkEnde] = [...o.enden]
          enden[verbindung.endeIndex] = {
            ...enden[verbindung.endeIndex],
            verbundenesEnde: undefined,
          }
          return { ...o, enden }
        }),
    },
  ]
  return new CompositeCommand(label, buendleProBlatt(doc, eintraege, label))
}

export interface TrunkLoeschenErgebnis {
  command: Command
  geloeschteLeitungenAnzahl: number
}

export function erzeugeTrunkLoeschenCommand(
  doc: DocumentStore,
  blattId: string,
  trunkId: string,
  label: string,
): TrunkLoeschenErgebnis {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  if (!blatt.objekte.some((o) => o.id === trunkId && o.type === 'trunk')) {
    throw new Error(`Trunk ${trunkId} nicht gefunden`)
  }
  return {
    command: erzeugeObjekteEntfernenCommand(doc, blattId, [trunkId], label),
    geloeschteLeitungenAnzahl: zaehleLeitungenInTrunks(doc, [trunkId]),
  }
}

export function zaehleLeitungenInTrunks(doc: DocumentStore, trunkIds: readonly string[]): number {
  return findeLeitungenInTrunks(doc.getZeichnung(), new Set(trunkIds)).length
}

export interface TrunkMergeErgebnis {
  command: Command
  fehlgeschlageneRerouteAnzahl: number
}

export function erzeugeTrunkMergeCommand(
  doc: DocumentStore,
  blattId: string,
  trunkIdA: string,
  endeIndexA: 0 | 1,
  trunkIdB: string,
  endeIndexB: 0 | 1,
  routingSettings: RoutingSettings,
  label: string,
): TrunkMergeErgebnis {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt nicht gefunden: ${blattId}`)
  if (trunkIdA === trunkIdB) {
    throw new Error(t('werkzeuge.commands.trunkMitSichSelbst'))
  }

  const trunkA = blatt.objekte.find((o) => o.type === 'trunk' && o.id === trunkIdA) as
    TrunkObjekt | undefined
  const trunkB = blatt.objekte.find((o) => o.type === 'trunk' && o.id === trunkIdB) as
    TrunkObjekt | undefined
  if (!trunkA || !trunkB) {
    throw new Error(`Trunk nicht auf Blatt ${blattId} gefunden: ${trunkIdA} / ${trunkIdB}`)
  }

  const verschmolzeneWegpunkte = verschmeltzeWegpunkte(trunkA, endeIndexA, trunkB, endeIndexB)
  const laengeA = pfadGesamtLaenge(trunkA.wegpunkte)
  const laengeGesamt = pfadGesamtLaenge(verschmolzeneWegpunkte)

  const betrifftTrunk = (id: string) => id === trunkIdA || id === trunkIdB
  const betrifftMerge = (d: TrunkDurchgang) => betrifftTrunk(d.trunkId)

  const laeufeVon = (durchgaenge: readonly TrunkDurchgang[]): { von: number; bis: number }[] => {
    const laeufe: { von: number; bis: number }[] = []
    let i = 0
    while (i < durchgaenge.length) {
      if (!betrifftMerge(durchgaenge[i])) {
        laeufe.push({ von: i, bis: i })
        i++
        continue
      }
      let bis = i
      while (bis + 1 < durchgaenge.length && betrifftMerge(durchgaenge[bis + 1])) bis++
      const teil = durchgaenge.slice(i, bis + 1)
      const beideBeruehrt =
        teil.some((d) => d.trunkId === trunkIdA) && teil.some((d) => d.trunkId === trunkIdB)
      if (beideBeruehrt) {
        laeufe.push({ von: i, bis })
      } else {
        for (let k = i; k <= bis; k++) laeufe.push({ von: k, bis: k })
      }
      i = bis + 1
    }
    return laeufe
  }

  const strukturAendern = (objekte: Objekt[]): Objekt[] => {
    const ergebnis: Objekt[] = []
    for (const o of objekte) {
      if (o.type === 'trunk' && o.id === trunkIdB) continue // geht in A auf
      if (o.type === 'trunk' && o.id === trunkIdA) {
        ergebnis.push({ ...o, wegpunkte: verschmolzeneWegpunkte })
        continue
      }
      if (o.type === 'trunk') {
        if (!o.enden.some((e) => e.verbundenerPfad && betrifftTrunk(e.verbundenerPfad.trunkId))) {
          ergebnis.push(o)
          continue
        }
        const enden = o.enden.map((e) => {
          const ziel = e.verbundenerPfad
          if (!ziel || !betrifftTrunk(ziel.trunkId)) return e
          return {
            ...e,
            verbundenerPfad: {
              ...ziel,
              trunkId: trunkIdA,
              t: verschmolzenesDurchgangT(
                ziel.t,
                ziel.trunkId === trunkIdA,
                endeIndexA,
                endeIndexB,
                laengeA,
                laengeGesamt,
              ),
            },
          }
        }) as [TrunkEnde, TrunkEnde]
        ergebnis.push({ ...o, enden })
        continue
      }
      if (o.type !== 'leitung' || !o.trunkDurchgaenge.some(betrifftMerge)) {
        ergebnis.push(o)
        continue
      }

      const laeufe = laeufeVon(o.trunkDurchgaenge)
      const neueDurchgaenge: TrunkDurchgang[] = []
      const neueSegmente: Point[][] = []
      for (const { von, bis } of laeufe) {
        neueSegmente.push(o.pfadSegmente[von])
        const erster = o.trunkDurchgaenge[von]
        const letzter = o.trunkDurchgaenge[bis]
        if (!betrifftMerge(erster)) {
          neueDurchgaenge.push(erster)
          continue
        }
        const tVon = (d: TrunkDurchgang, wert: number) =>
          verschmolzenesDurchgangT(
            wert,
            d.trunkId === trunkIdA,
            endeIndexA,
            endeIndexB,
            laengeA,
            laengeGesamt,
          )
        neueDurchgaenge.push({
          ...erster,
          trunkId: trunkIdA,
          eintrittT: tVon(erster, erster.eintrittT),
          austrittT: tVon(letzter, letzter.austrittT),
        })
      }
      neueSegmente.push(o.pfadSegmente[o.trunkDurchgaenge.length])

      ergebnis.push({ ...o, trunkDurchgaenge: neueDurchgaenge, pfadSegmente: neueSegmente })
    }
    return ergebnis
  }

  const objekteNachMerge = strukturAendern(blatt.objekte)
  const leitungenNeueSegmente = berechneLeitungenReroutingBeiTrunkAenderung(
    objekteNachMerge,
    trunkIdA,
    verschmolzeneWegpunkte,
    routingSettings,
    blatt.geschoss,
  )
  const betroffeneAnzahl = objekteNachMerge.filter(
    (o) => o.type === 'leitung' && o.trunkDurchgaenge.some((d) => d.trunkId === trunkIdA),
  ).length

  const aendern: ObjekteAendernFn = (objekte) =>
    strukturAendern(objekte).map((o) => {
      if (o.type !== 'leitung') return o
      const pfadSegmente = leitungenNeueSegmente.get(o.id)
      return pfadSegmente ? { ...o, pfadSegmente } : o
    })

  return {
    command: erzeugeObjektAendernCommand(doc, blattId, label, aendern),
    fehlgeschlageneRerouteAnzahl: betroffeneAnzahl - leitungenNeueSegmente.size,
  }
}

export interface TrunkAndockenErgebnis {
  command: Command
  fehlgeschlageneRerouteAnzahl: number
}

export function erzeugeTrunkAndockenCommand(
  doc: DocumentStore,
  blattId: string,
  trunkId: string,
  endeIndex: 0 | 1,
  zielTrunkId: string,
  zielT: number,
  neueWegpunkte: Point[],
  routingSettings: RoutingSettings,
  label: string,
): TrunkAndockenErgebnis {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt nicht gefunden: ${blattId}`)
  if (trunkId === zielTrunkId) {
    throw new Error(t('werkzeuge.commands.trunkAnSichSelbst'))
  }
  const zeichnung = doc.getZeichnung()

  const zielKette = ermittleTrunkKette(zeichnung, blattId, zielTrunkId)
  const eigeneKette = ermittleTrunkKette(zeichnung, blattId, trunkId)
  const zielTrunk = zielKette.find((g) => g.trunk.id === zielTrunkId)?.trunk
  if (!zielTrunk) throw new Error(`Ziel-Trunk nicht gefunden: ${zielTrunkId}`)
  if (eigeneKette.some((g) => g.trunk.id === zielTrunkId)) {
    throw new Error(t('werkzeuge.commands.trunksSelbeGruppe'))
  }

  const eigeneTrunkIds = new Set(eigeneKette.map((g) => g.trunk.id))
  const eigeneBlattIds = new Set(eigeneKette.map((g) => g.blattId))

  const objekteMitNeuemPfad = abzweigeNachfuehren(
    blatt.objekte.map((o) =>
      o.id === trunkId && o.type === 'trunk' ? { ...o, wegpunkte: neueWegpunkte } : o,
    ),
    trunkId,
    neueWegpunkte,
  )
  const leitungenNeueSegmente = berechneLeitungenReroutingBeiTrunkAenderung(
    objekteMitNeuemPfad,
    trunkId,
    neueWegpunkte,
    routingSettings,
    blatt.geschoss,
  )
  const betroffeneAnzahl = blatt.objekte.filter(
    (o) => o.type === 'leitung' && o.trunkDurchgaenge.some((d) => d.trunkId === trunkId),
  ).length

  const eintraege: { blattId: string; aendern: ObjekteAendernFn }[] = []

  eintraege.push({
    blattId,
    aendern: (objekte) =>
      abzweigeNachfuehren(objekte, trunkId, neueWegpunkte).map((o) => {
        if (o.type === 'trunk' && o.id === trunkId) {
          const enden: [TrunkEnde, TrunkEnde] = [...o.enden]
          enden[endeIndex] = {
            ...enden[endeIndex],
            dockRef: undefined,
            verbundenesEnde: undefined,
            verbundenerPfad: { blattId, trunkId: zielTrunkId, t: zielT },
          }
          return { ...o, wegpunkte: neueWegpunkte, enden }
        }
        if (o.type === 'leitung') {
          const pfadSegmente = leitungenNeueSegmente.get(o.id)
          if (pfadSegmente) return { ...o, pfadSegmente }
        }
        return o
      }),
  })

  const syncAendern = trunkPatchAendern(eigeneTrunkIds, {
    name: zielTrunk.name,
    farbe: zielTrunk.farbe,
    strichstaerke: zielTrunk.strichstaerke,
    ausfuehrung: zielTrunk.ausfuehrung,
    abmessung: zielTrunk.abmessung,
  })
  for (const id of eigeneBlattIds) {
    eintraege.push({ blattId: id, aendern: syncAendern })
  }

  return {
    command: new CompositeCommand(label, buendleProBlatt(doc, eintraege, label)),
    fehlgeschlageneRerouteAnzahl: betroffeneAnzahl - leitungenNeueSegmente.size,
  }
}
