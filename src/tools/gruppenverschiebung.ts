import type {
  BlattGeschoss,
  DocumentStore,
  KomponentenObjekt,
  LeitungsZiel,
  LeitungsObjekt,
  Objekt,
  Point,
  TrunkObjekt,
} from '../document-model'
import {
  expandiereTraegerMitModulen,
  getDockpoints,
  nachgefuehrteOeffnungen,
  nachgefuehrteWandAnschluesse,
  verschiebeObjekt,
} from '../document-model'
import { fuerLeitung, routePath, routingHindernisse, waendeAlsRoutingStrecken } from '../routing'
import { vergebeBahnen } from './parallele-bahnen'
import { verlegeNachAnordnungsRegeln } from './anordnungs-regeln'
import { schachtIdsAus, wendeSchachtNachfuehrungAn } from './schacht-ablage'
import { berechneSchaltverbindungReroute } from './schaltverbindung-routing'
import type { RoutingSettings } from '../routing'
import type { Command } from './command'
import { erzeugeObjektAendernCommand } from './commands'
import { haengeLeitungenAnWandseiteUm } from './wandseite-umhaengen'

export function betroffeneLeitungen(
  objekte: Objekt[],
  komponentenIds: ReadonlySet<string>,
): LeitungsObjekt[] {
  return objekte.filter((o): o is LeitungsObjekt => {
    if (o.type !== 'leitung') return false
    const startBetroffen = o.start.art === 'dock' && komponentenIds.has(o.start.objektId)
    const zielBetroffen = o.ziel.art === 'dock' && komponentenIds.has(o.ziel.objektId)
    return startBetroffen || zielBetroffen
  })
}

export function berechneGruppenReroute(
  objekte: Objekt[],
  neuePositionen: ReadonlyMap<string, Point>,
  settings: RoutingSettings,
  geschoss: BlattGeschoss | undefined = undefined,
): Map<string, Point[][]> {
  const neueZustaende = new Map<string, Partial<KomponentenObjekt>>()
  for (const [id, position] of neuePositionen) neueZustaende.set(id, { position })
  return berechneGruppenRerouteMitZustand(objekte, neueZustaende, settings, geschoss)
}

export function berechneGruppenRerouteMitZustand(
  objekte: Objekt[],
  neueZustaende: ReadonlyMap<string, Partial<KomponentenObjekt>>,
  settings: RoutingSettings,
  geschoss: BlattGeschoss | undefined = undefined,
): Map<string, Point[][]> {
  const ergebnis = new Map<string, Point[][]>()
  if (neueZustaende.size === 0) return ergebnis

  const virtuelleObjekte = objekte.map((o): Objekt => {
    if (o.type !== 'komponente') return o
    const patch = neueZustaende.get(o.id)
    return patch ? { ...o, ...patch } : o
  })
  const virtuelleKomponenten = new Map<string, KomponentenObjekt>()
  for (const o of virtuelleObjekte) {
    if (o.type === 'komponente') virtuelleKomponenten.set(o.id, o)
  }

  const komponentenIds = new Set(neueZustaende.keys())
  const hindernisse = routingHindernisse(virtuelleObjekte, settings.sicherheitsabstandMeter)
  for (const leitung of betroffeneLeitungen(objekte, komponentenIds)) {
    const erstesSegment = leitung.pfadSegmente[0]
    const letzterIndex = leitung.pfadSegmente.length - 1
    const letztesSegment = leitung.pfadSegmente[letzterIndex]

    const startBewegt = leitung.start.art === 'dock' && komponentenIds.has(leitung.start.objektId)
    const zielBewegt = leitung.ziel.art === 'dock' && komponentenIds.has(leitung.ziel.objektId)
    if (!startBewegt && !zielBewegt) continue

    const neuerStartPunkt = startBewegt
      ? endpunktPosition(leitung.start, virtuelleKomponenten, erstesSegment[0])
      : erstesSegment[0]
    const neuerZielPunkt = zielBewegt
      ? endpunktPosition(
          leitung.ziel,
          virtuelleKomponenten,
          letztesSegment[letztesSegment.length - 1],
        )
      : letztesSegment[letztesSegment.length - 1]

    const neueSegmente = [...leitung.pfadSegmente]

    if (leitung.autoRoutingAus) {
      if (letzterIndex === 0) {
        let segment = erstesSegment
        if (startBewegt) segment = [neuerStartPunkt, ...segment.slice(1)]
        if (zielBewegt) segment = [...segment.slice(0, -1), neuerZielPunkt]
        neueSegmente[0] = segment
      } else {
        if (startBewegt) neueSegmente[0] = [neuerStartPunkt, ...erstesSegment.slice(1)]
        if (zielBewegt) {
          neueSegmente[letzterIndex] = [...letztesSegment.slice(0, -1), neuerZielPunkt]
        }
      }
      ergebnis.set(leitung.id, neueSegmente)
      continue
    }

    let erfolgreich = true
    const aufruf = fuerLeitung(settings, leitung, geschoss)

    if (letzterIndex === 0) {
      const neuerPfad = routePath(neuerStartPunkt, neuerZielPunkt, hindernisse, aufruf)
      if (!neuerPfad) erfolgreich = false
      else neueSegmente[0] = neuerPfad
    } else {
      if (startBewegt) {
        const festesEnde = erstesSegment[erstesSegment.length - 1]
        const neuerPfad = routePath(neuerStartPunkt, festesEnde, hindernisse, aufruf)
        if (!neuerPfad) erfolgreich = false
        else neueSegmente[0] = neuerPfad
      }
      if (erfolgreich && zielBewegt) {
        const festerStart = letztesSegment[0]
        const neuerPfad = routePath(festerStart, neuerZielPunkt, hindernisse, aufruf)
        if (!neuerPfad) erfolgreich = false
        else neueSegmente[letzterIndex] = neuerPfad
      }
    }

    if (erfolgreich) ergebnis.set(leitung.id, neueSegmente)
  }
  return vergebeBahnen(
    virtuelleObjekte,
    ergebnis,
    settings.parallelAbstandMeter,
    waendeAlsRoutingStrecken(virtuelleObjekte),
  )
}

export function wandIdsAus(objekte: readonly Objekt[], ids: Iterable<string>): Set<string> {
  const gesucht = new Set(ids)
  return new Set(objekte.filter((o) => o.type === 'wand' && gesucht.has(o.id)).map((o) => o.id))
}

function endpunktPosition(
  endpunkt: LeitungsZiel,
  virtuelleKomponenten: Map<string, KomponentenObjekt>,
  fallback: Point,
): Point {
  if (endpunkt.art !== 'dock') return fallback
  const komponente = virtuelleKomponenten.get(endpunkt.objektId)
  if (!komponente) return fallback
  return getDockpoints(komponente)[endpunkt.dockpunktIndex]
}

export function betroffeneTrunks(
  objekte: Objekt[],
  komponentenIds: ReadonlySet<string>,
): TrunkObjekt[] {
  return objekte.filter(
    (o): o is TrunkObjekt =>
      o.type === 'trunk' &&
      o.enden.some((e) => e.dockRef && komponentenIds.has(e.dockRef.objektId)),
  )
}

export function berechneTrunkReroute(
  objekte: Objekt[],
  neuePositionen: ReadonlyMap<string, Point>,
): Map<string, Point[]> {
  const neueZustaende = new Map<string, Partial<KomponentenObjekt>>()
  for (const [id, position] of neuePositionen) neueZustaende.set(id, { position })
  return berechneTrunkRerouteMitZustand(objekte, neueZustaende)
}

export function berechneTrunkRerouteMitZustand(
  objekte: Objekt[],
  neueZustaende: ReadonlyMap<string, Partial<KomponentenObjekt>>,
): Map<string, Point[]> {
  const ergebnis = new Map<string, Point[]>()
  if (neueZustaende.size === 0) return ergebnis

  const virtuelleKomponenten = new Map<string, KomponentenObjekt>()
  for (const o of objekte) {
    if (o.type !== 'komponente') continue
    const patch = neueZustaende.get(o.id)
    virtuelleKomponenten.set(o.id, patch ? { ...o, ...patch } : o)
  }

  const komponentenIds = new Set(neueZustaende.keys())
  for (const trunk of betroffeneTrunks(objekte, komponentenIds)) {
    const wegpunkte = [...trunk.wegpunkte]
    let geaendert = false
    trunk.enden.forEach((ende, i) => {
      if (!ende.dockRef || !komponentenIds.has(ende.dockRef.objektId)) return
      const komponente = virtuelleKomponenten.get(ende.dockRef.objektId)
      if (!komponente) return
      const punkt = getDockpoints(komponente)[ende.dockRef.dockpunktIndex]
      if (!punkt) return
      wegpunkte[i === 0 ? 0 : wegpunkte.length - 1] = punkt
      geaendert = true
    })
    if (geaendert) ergebnis.set(trunk.id, wegpunkte)
  }
  return ergebnis
}

export interface VerschiebungMitRerouteErgebnis {
  command: Command
  fehlgeschlageneLeitungenAnzahl: number
}

export function erzeugeVerschiebungMitRerouteCommand(
  doc: DocumentStore,
  blattId: string,
  komponentenNeuePositionen: ReadonlyMap<string, Point>,
  sonstigeVerschiebungen: ReadonlyMap<string, Point>,
  settings: RoutingSettings,
  label: string,
  komponentenPatches?: ReadonlyMap<string, Partial<KomponentenObjekt>>,
  nachbearbeiten?: (objekte: Objekt[]) => Objekt[],
): VerschiebungMitRerouteErgebnis {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const objekte = blatt.objekte

  const neueZustaende = new Map<string, Partial<KomponentenObjekt>>()
  for (const [id, position] of komponentenNeuePositionen) neueZustaende.set(id, { position })
  if (komponentenPatches) {
    for (const [id, patch] of komponentenPatches) {
      neueZustaende.set(id, { ...neueZustaende.get(id), ...patch })
    }
  }
  expandiereTraegerMitModulen(objekte, neueZustaende, new Set(komponentenPatches?.keys() ?? []))

  const neuePfadSegmente = berechneGruppenRerouteMitZustand(
    objekte,
    neueZustaende,
    settings,
    blatt.geschoss,
  )
  const betroffen = betroffeneLeitungen(objekte, new Set(neueZustaende.keys()))
  const fehlgeschlageneLeitungenAnzahl = betroffen.filter((l) => !neuePfadSegmente.has(l.id)).length
  const neueTrunkWegpunkte = berechneTrunkRerouteMitZustand(objekte, neueZustaende)
  const knotenNeu = new Map<string, Point>()
  for (const o of objekte)
    if (o.type === 'knotenpunkt' && sonstigeVerschiebungen.has(o.id)) {
      const d = sonstigeVerschiebungen.get(o.id)!
      knotenNeu.set(o.id, { x: o.position.x + d.x, y: o.position.y + d.y })
    }
  const neueSchaltverbindungen = berechneSchaltverbindungReroute(
    objekte,
    neueZustaende,
    settings,
    new Set(sonstigeVerschiebungen.keys()),
    knotenNeu,
  )

  const ansEnde = new Set<string>()
  if (komponentenPatches) {
    for (const [id, patch] of komponentenPatches) {
      if (patch.traegerId !== undefined) ansEnde.add(id)
    }
  }

  const bewegteSchaechte = schachtIdsAus(objekte, sonstigeVerschiebungen.keys())
  const bewegteWaende = wandIdsAus(objekte, sonstigeVerschiebungen.keys())

  const command = erzeugeObjektAendernCommand(
    doc,
    blattId,
    label,
    (aktuelleObjekte) => {
      const gemappt = aktuelleObjekte.map((o) => {
        if (o.type === 'komponente') {
          const zustand = neueZustaende.get(o.id)
          if (zustand) return { ...o, ...zustand }
        }
        if (o.type === 'leitung') {
          const pfadSegmente = neuePfadSegmente.get(o.id)
          if (pfadSegmente) return { ...o, pfadSegmente }
          return o
        }
        if (o.type === 'trunk') {
          const wegpunkte = neueTrunkWegpunkte.get(o.id)
          if (wegpunkte) return { ...o, wegpunkte }
          const delta = sonstigeVerschiebungen.get(o.id)
          if (delta) return verschiebeObjekt(o, delta)
          return o
        }
        if (o.type === 'schaltverbindung') {
          const wegpunkte = neueSchaltverbindungen.get(o.id)
          if (wegpunkte) return { ...o, wegpunkte }
        }
        const delta = sonstigeVerschiebungen.get(o.id)
        if (delta) return verschiebeObjekt(o, delta)
        return o
      })
      const mitWaenden = nachgefuehrteWandAnschluesse(aktuelleObjekte, gemappt, bewegteWaende)
      const mitSchaechten = wendeSchachtNachfuehrungAn(
        mitWaenden,
        bewegteSchaechte,
        settings,
        blatt.geschoss,
      )
      const ergebnis =
        ansEnde.size === 0
          ? mitSchaechten
          : [
              ...mitSchaechten.filter((o) => !ansEnde.has(o.id)),
              ...mitSchaechten.filter((o) => ansEnde.has(o.id)),
            ]
      const mitOeffnungen = nachgefuehrteOeffnungen(ergebnis)
      const geregelt = verlegeNachAnordnungsRegeln(
        mitOeffnungen,
        new Set([...neueZustaende.keys(), ...sonstigeVerschiebungen.keys()]),
        settings,
        blatt.geschoss,
        new Set(sonstigeVerschiebungen.keys()),
      )
      return nachbearbeiten ? nachbearbeiten(geregelt) : geregelt
    },
    (vorher, nachher) => haengeLeitungenAnWandseiteUm(vorher, nachher, settings, blatt.geschoss),
  )

  return { command, fehlgeschlageneLeitungenAnzahl }
}
