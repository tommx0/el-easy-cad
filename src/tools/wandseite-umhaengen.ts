import type {
  BlattGeschoss,
  DocumentStore,
  KomponentenObjekt,
  LeitungsObjekt,
  Objekt,
  Point,
} from '../document-model'
import { getDockpoints, wandseitigerErsatzDockpunkt } from '../document-model'
import type { RoutingSettings } from '../routing'
import { fuerLeitung, routePath, routingHindernisse } from '../routing'
import type { Command } from './command'
import { erzeugeObjektAendernCommand } from './commands'

const DREHUNG_EPS = 1e-6

function wandseiteNeu(alt: KomponentenObjekt | undefined, neu: KomponentenObjekt): boolean {
  if (!neu.wandstelle) return false
  if (!alt?.wandstelle) return true
  return Math.abs(Math.sin((alt.drehung - neu.drehung) / 2)) > DREHUNG_EPS
}

export function haengeLeitungenAnWandseiteUm(
  vorher: readonly Objekt[],
  nachher: Objekt[],
  settings: RoutingSettings,
  geschoss: BlattGeschoss | undefined,
): Objekt[] {
  const alteKomponenten = new Map<string, KomponentenObjekt>()
  for (const o of vorher) if (o.type === 'komponente') alteKomponenten.set(o.id, o)
  const betroffen = new Map<string, KomponentenObjekt>()
  for (const o of nachher) {
    if (o.type === 'komponente' && wandseiteNeu(alteKomponenten.get(o.id), o)) {
      betroffen.set(o.id, o)
    }
  }
  if (betroffen.size === 0) return nachher

  const ersatz = (ende: LeitungsObjekt['start']): number | null => {
    if (ende.art !== 'dock') return null
    const k = betroffen.get(ende.objektId)
    return k ? wandseitigerErsatzDockpunkt(k, ende.dockpunktIndex) : null
  }

  let hindernisse: ReturnType<typeof routingHindernisse> | null = null
  let geaendert = false
  const ergebnis = nachher.map((o) => {
    if (o.type !== 'leitung') return o
    const neuerStart = ersatz(o.start)
    const neuesZiel = ersatz(o.ziel)
    if (neuerStart === null && neuesZiel === null) return o
    geaendert = true
    hindernisse ??= routingHindernisse(nachher, settings.sicherheitsabstandMeter)
    const leitung: LeitungsObjekt = {
      ...o,
      start:
        neuerStart !== null && o.start.art === 'dock'
          ? { ...o.start, dockpunktIndex: neuerStart }
          : o.start,
      ziel:
        neuesZiel !== null && o.ziel.art === 'dock'
          ? { ...o.ziel, dockpunktIndex: neuesZiel }
          : o.ziel,
    }
    const startPunkt = neuerStart !== null ? dockpunkt(betroffen, leitung.start) : null
    const zielPunkt = neuesZiel !== null ? dockpunkt(betroffen, leitung.ziel) : null
    return {
      ...leitung,
      pfadSegmente: neuVerlegt(leitung, startPunkt, zielPunkt, hindernisse, settings, geschoss),
    }
  })
  return geaendert ? ergebnis : nachher
}

function dockpunkt(
  komponenten: ReadonlyMap<string, KomponentenObjekt>,
  ende: LeitungsObjekt['start'],
): Point | null {
  if (ende.art !== 'dock') return null
  const k = komponenten.get(ende.objektId)
  return k ? (getDockpoints(k)[ende.dockpunktIndex] ?? null) : null
}

function neuVerlegt(
  leitung: LeitungsObjekt,
  startPunkt: Point | null,
  zielPunkt: Point | null,
  hindernisse: ReturnType<typeof routingHindernisse>,
  settings: RoutingSettings,
  geschoss: BlattGeschoss | undefined,
): Point[][] {
  const segmente = leitung.pfadSegmente.map((s) => [...s])
  const letzter = segmente.length - 1
  const gerade = () => {
    if (startPunkt && segmente[0].length > 0) segmente[0][0] = startPunkt
    if (zielPunkt && segmente[letzter].length > 0) {
      segmente[letzter][segmente[letzter].length - 1] = zielPunkt
    }
    return segmente
  }
  if (leitung.autoRoutingAus) return gerade()

  const aufruf = fuerLeitung(settings, leitung, geschoss)
  const erstes = segmente[0]
  const letztes = segmente[letzter]
  if (letzter === 0) {
    const von = startPunkt ?? erstes[0]
    const bis = zielPunkt ?? erstes[erstes.length - 1]
    const pfad = von && bis ? routePath(von, bis, hindernisse, aufruf) : null
    return pfad ? [pfad] : gerade()
  }
  if (startPunkt && erstes.length > 0) {
    const pfad = routePath(startPunkt, erstes[erstes.length - 1], hindernisse, aufruf)
    if (pfad) segmente[0] = pfad
    else segmente[0][0] = startPunkt
  }
  if (zielPunkt && letztes.length > 0) {
    const pfad = routePath(letztes[0], zielPunkt, hindernisse, aufruf)
    if (pfad) segmente[letzter] = pfad
    else segmente[letzter][segmente[letzter].length - 1] = zielPunkt
  }
  return segmente
}

export function erzeugeWandAenderungCommand(
  doc: DocumentStore,
  blattId: string,
  label: string,
  aendern: (objekte: Objekt[]) => Objekt[],
  settings: RoutingSettings,
): Command {
  const geschoss = doc.getBlatt(blattId)?.geschoss
  return erzeugeObjektAendernCommand(doc, blattId, label, aendern, (vorher, nachher) =>
    haengeLeitungenAnWandseiteUm(vorher, nachher, settings, geschoss),
  )
}
