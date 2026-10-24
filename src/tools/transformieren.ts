import type {
  BlattGeschoss,
  DocumentStore,
  KomponentenObjekt,
  Objekt,
  Point,
} from '../document-model'
import {
  dreheObjekt,
  expandiereTraegerMitModulen,
  getFangpunkt,
  istTransformierbar,
  skaliereObjekt,
} from '../document-model'
import type { RoutingSettings } from '../routing'
import type { Command } from './command'
import { verlegeNachAnordnungsRegeln } from './anordnungs-regeln'
import { erzeugeObjektAendernCommand } from './commands'
import {
  berechneGruppenRerouteMitZustand,
  berechneTrunkRerouteMitZustand,
  betroffeneLeitungen,
} from './gruppenverschiebung'
import { schachtIdsAus, wendeSchachtNachfuehrungAn } from './schacht-ablage'
import { berechneSchaltverbindungReroute } from './schaltverbindung-routing'

export type Transformation =
  { art: 'drehen'; winkel: number } | { art: 'skalieren'; faktorX: number; faktorY: number }

export function wendeTransformationAn(
  objekt: Objekt,
  zentrum: Point,
  transformation: Transformation,
): Objekt {
  return transformation.art === 'drehen'
    ? dreheObjekt(objekt, zentrum, transformation.winkel)
    : skaliereObjekt(objekt, zentrum, transformation.faktorX, transformation.faktorY)
}

function berechneTransformationsZustand(
  objekte: Objekt[],
  objektIds: ReadonlySet<string>,
  zentrum: Point,
  transformation: Transformation,
): {
  transformierteObjekte: Map<string, Objekt>
  neueKomponentenZustaende: Map<string, Partial<KomponentenObjekt>>
} {
  const transformierteObjekte = new Map<string, Objekt>()
  const neueKomponentenZustaende = new Map<string, Partial<KomponentenObjekt>>()
  for (const objekt of objekte) {
    if (!objektIds.has(objekt.id) || !istTransformierbar(objekt.type)) continue
    const neu = wendeTransformationAn(objekt, zentrum, transformation)
    transformierteObjekte.set(objekt.id, neu)
    if (neu.type === 'komponente') {
      neueKomponentenZustaende.set(neu.id, {
        position: neu.position,
        drehung: neu.drehung,
        groesseWelt: neu.groesseWelt,
        breiteWelt: neu.breiteWelt,
      })
    }
  }
  expandiereTraegerMitModulen(objekte, neueKomponentenZustaende)
  for (const [id, zustand] of neueKomponentenZustaende) {
    const original = objekte.find((o) => o.id === id)
    if (original?.type === 'komponente') transformierteObjekte.set(id, { ...original, ...zustand })
  }
  return { transformierteObjekte, neueKomponentenZustaende }
}

export function berechneTransformationLeitungenVorschau(
  objekte: Objekt[],
  objektIds: ReadonlySet<string>,
  zentrum: Point,
  transformation: Transformation,
  settings: RoutingSettings,
  geschoss: BlattGeschoss | undefined = undefined,
): Map<string, Point[][]> {
  const { neueKomponentenZustaende } = berechneTransformationsZustand(
    objekte,
    objektIds,
    zentrum,
    transformation,
  )
  return berechneGruppenRerouteMitZustand(objekte, neueKomponentenZustaende, settings, geschoss)
}

export function berechneTransformationSchaltverbindungenVorschau(
  objekte: Objekt[],
  objektIds: ReadonlySet<string>,
  zentrum: Point,
  transformation: Transformation,
  settings: RoutingSettings,
): Map<string, Point[]> {
  const { neueKomponentenZustaende } = berechneTransformationsZustand(
    objekte,
    objektIds,
    zentrum,
    transformation,
  )
  return berechneSchaltverbindungReroute(objekte, neueKomponentenZustaende, settings)
}

export function erzeugeKomponentenDrehenCommand(
  doc: DocumentStore,
  blattId: string,
  komponentenIds: readonly string[],
  winkel: number,
  settings: RoutingSettings,
  label: string,
): { command: Command; fehlgeschlageneLeitungenAnzahl: number } {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const objekte = blatt.objekte
  const idSet = new Set(komponentenIds)

  const transformierteObjekte = new Map<string, Objekt>()
  const neueKomponentenZustaende = new Map<string, Partial<KomponentenObjekt>>()
  for (const objekt of objekte) {
    if (!idSet.has(objekt.id) || objekt.type !== 'komponente') continue
    const neu = dreheObjekt(objekt, getFangpunkt(objekt), winkel) as KomponentenObjekt
    transformierteObjekte.set(objekt.id, neu)
    neueKomponentenZustaende.set(objekt.id, {
      position: neu.position,
      drehung: neu.drehung,
      groesseWelt: neu.groesseWelt,
      breiteWelt: neu.breiteWelt,
    })
  }
  expandiereTraegerMitModulen(objekte, neueKomponentenZustaende)
  for (const [id, zustand] of neueKomponentenZustaende) {
    const original = objekte.find((o) => o.id === id)
    if (original?.type === 'komponente') transformierteObjekte.set(id, { ...original, ...zustand })
  }

  const neuePfadSegmente = berechneGruppenRerouteMitZustand(
    objekte,
    neueKomponentenZustaende,
    settings,
    blatt.geschoss,
  )
  const betroffen = betroffeneLeitungen(objekte, new Set(neueKomponentenZustaende.keys()))
  const fehlgeschlageneLeitungenAnzahl = betroffen.filter((l) => !neuePfadSegmente.has(l.id)).length
  const neueTrunkWegpunkte = berechneTrunkRerouteMitZustand(objekte, neueKomponentenZustaende)
  const neueSchaltverbindungen = berechneSchaltverbindungReroute(
    objekte,
    neueKomponentenZustaende,
    settings,
  )
  const bewegteSchaechte = schachtIdsAus(objekte, idSet)

  const command = erzeugeObjektAendernCommand(doc, blattId, label, (aktuelleObjekte) =>
    verlegeNachAnordnungsRegeln(
      wendeSchachtNachfuehrungAn(
        aktuelleObjekte.map((o) => {
          if (o.type === 'leitung') {
            const pfadSegmente = neuePfadSegmente.get(o.id)
            return pfadSegmente ? { ...o, pfadSegmente } : o
          }
          if (o.type === 'trunk') {
            const wegpunkte = neueTrunkWegpunkte.get(o.id)
            return wegpunkte ? { ...o, wegpunkte } : o
          }
          if (o.type === 'schaltverbindung') {
            const wegpunkte = neueSchaltverbindungen.get(o.id)
            if (wegpunkte) return { ...o, wegpunkte }
          }
          return transformierteObjekte.get(o.id) ?? o
        }),
        bewegteSchaechte,
        settings,
        blatt.geschoss,
      ),
      new Set(neueKomponentenZustaende.keys()),
      settings,
      blatt.geschoss,
    ),
  )

  return { command, fehlgeschlageneLeitungenAnzahl }
}

export function erzeugeTransformationMitRerouteCommand(
  doc: DocumentStore,
  blattId: string,
  objektIds: ReadonlySet<string>,
  zentrum: Point,
  transformation: Transformation,
  settings: RoutingSettings,
  label: string,
): { command: Command; fehlgeschlageneLeitungenAnzahl: number } {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const objekte = blatt.objekte

  const { transformierteObjekte, neueKomponentenZustaende } = berechneTransformationsZustand(
    objekte,
    objektIds,
    zentrum,
    transformation,
  )

  const neuePfadSegmente = berechneGruppenRerouteMitZustand(
    objekte,
    neueKomponentenZustaende,
    settings,
    blatt.geschoss,
  )
  const betroffen = betroffeneLeitungen(objekte, new Set(neueKomponentenZustaende.keys()))
  const fehlgeschlageneLeitungenAnzahl = betroffen.filter((l) => !neuePfadSegmente.has(l.id)).length
  const neueTrunkWegpunkte = berechneTrunkRerouteMitZustand(objekte, neueKomponentenZustaende)
  const neueSchaltverbindungen = berechneSchaltverbindungReroute(
    objekte,
    neueKomponentenZustaende,
    settings,
  )

  const bewegteSchaechte = schachtIdsAus(objekte, objektIds)

  const command = erzeugeObjektAendernCommand(doc, blattId, label, (aktuelleObjekte) =>
    verlegeNachAnordnungsRegeln(
      wendeSchachtNachfuehrungAn(
        aktuelleObjekte.map((o) => {
          if (o.type === 'leitung') {
            const pfadSegmente = neuePfadSegmente.get(o.id)
            return pfadSegmente ? { ...o, pfadSegmente } : o
          }
          if (o.type === 'trunk') {
            const wegpunkte = neueTrunkWegpunkte.get(o.id)
            return wegpunkte ? { ...o, wegpunkte } : o
          }
          if (o.type === 'schaltverbindung') {
            const wegpunkte = neueSchaltverbindungen.get(o.id)
            if (wegpunkte) return { ...o, wegpunkte }
          }
          return transformierteObjekte.get(o.id) ?? o
        }),
        bewegteSchaechte,
        settings,
        blatt.geschoss,
      ),
      new Set(neueKomponentenZustaende.keys()),
      settings,
      blatt.geschoss,
    ),
  )

  return { command, fehlgeschlageneLeitungenAnzahl }
}
