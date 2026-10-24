import type { Command } from '../command'
import { CompositeCommand } from '../command'
import type {
  BlattGeschoss,
  DocumentStore,
  LeitungsObjekt,
  Objekt,
  Point,
  Raumquerung,
  ZonenDefinition,
} from '../../document-model'
import {
  abgeleitetePfadSegmente,
  aendereGeschoss,
  ebeneGesperrt,
  giltNurInBauteilen,
} from '../../document-model'
import { fuerLeitung, routePath, routingHindernisse, waendeAlsRoutingStrecken } from '../../routing'
import { vergebeBahnen } from '../parallele-bahnen'
import type { RoutingSettings } from '../../routing'
import { erzeugeBlattAendernCommand } from './blatt-commands'
import { erzeugeObjektAendernCommand } from './objekt-commands'
import { t } from '../../sprache'

export function verlegeLeitungenNeu(
  objekte: readonly Objekt[],
  ids: ReadonlySet<string>,
  settings: RoutingSettings,
  geschoss: BlattGeschoss | undefined,
  leitungsAngabe: (l: LeitungsObjekt) => Pick<LeitungsObjekt, 'nurInBauteilen'> = (l) => l,
  zonen: readonly ZonenDefinition[] = [],
): { neueSegmente: Map<string, Point[][]>; fehlgeschlagen: number } {
  const neueSegmente = new Map<string, Point[][]>()
  let fehlgeschlagen = 0
  const hindernisse = routingHindernisse([...objekte], settings.sicherheitsabstandMeter)
  for (const leitung of objekte) {
    if (leitung.type !== 'leitung' || !ids.has(leitung.id) || leitung.autoRoutingAus) continue
    const aufruf = fuerLeitung(
      settings,
      { installationszone: leitung.installationszone, ...leitungsAngabe(leitung) },
      geschoss,
      zonen,
    )
    const gezeigt = abgeleitetePfadSegmente(leitung, [...objekte])
    const segmente = leitung.pfadSegmente.map((s) => [...s])
    let erfolgreich = true
    gezeigt.forEach((segment, i) => {
      if (!erfolgreich || segment.length < 2) return
      const von = segment[0]
      const bis = segment[segment.length - 1]
      if (Math.hypot(bis.x - von.x, bis.y - von.y) < 1e-6) return
      const pfad = routePath(von, bis, hindernisse, aufruf)
      if (pfad) segmente[i] = pfad
      else erfolgreich = false
    })
    if (erfolgreich) neueSegmente.set(leitung.id, segmente)
    else fehlgeschlagen++
  }
  const bahnen = vergebeBahnen(
    objekte,
    neueSegmente,
    settings.parallelAbstandMeter,
    waendeAlsRoutingStrecken(objekte),
  )
  return { neueSegmente: bahnen, fehlgeschlagen }
}

function mitNeuenSegmenten(objekte: Objekt[], neueSegmente: Map<string, Point[][]>): Objekt[] {
  return objekte.map((o) => {
    const pfadSegmente = o.type === 'leitung' ? neueSegmente.get(o.id) : undefined
    return pfadSegmente ? { ...o, pfadSegmente } : o
  })
}

export function erzeugeBlattNurInBauteilenCommand(
  doc: DocumentStore,
  blattId: string,
  an: boolean,
  settings: RoutingSettings,
): { command: Command; fehlgeschlagen: number; neuVerlegt: number } {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const geschoss = aendereGeschoss(blatt.geschoss, { nurInBauteilen: an || undefined })
  const label = t(
    an ? 'werkzeuge.commands.nurInBauteilenAn' : 'werkzeuge.commands.nurInBauteilenAus',
  )
  const blattCommand = erzeugeBlattAendernCommand(doc, blattId, label, { geschoss })
  const vorher = blatt.geschoss
  const ids = new Set(
    blatt.objekte
      .filter(
        (o): o is LeitungsObjekt =>
          o.type === 'leitung' && giltNurInBauteilen(o, vorher) !== giltNurInBauteilen(o, geschoss),
      )
      .map((o) => o.id),
  )
  const { neueSegmente, fehlgeschlagen } = verlegeLeitungenNeu(
    blatt.objekte,
    ids,
    settings,
    geschoss,
  )
  if (neueSegmente.size === 0) return { command: blattCommand, fehlgeschlagen, neuVerlegt: 0 }
  const objektCommand = erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    mitNeuenSegmenten(objekte, neueSegmente),
  )
  return {
    command: new CompositeCommand(label, [blattCommand, objektCommand]),
    fehlgeschlagen,
    neuVerlegt: neueSegmente.size,
  }
}

export function erzeugeRaumquerungCommand(
  doc: DocumentStore,
  blattId: string,
  raumquerung: Raumquerung,
): Command {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  return erzeugeBlattAendernCommand(doc, blattId, t('werkzeuge.commands.raumquerung'), {
    geschoss: aendereGeschoss(blatt.geschoss, {
      raumquerung: raumquerung === 'decke' ? undefined : raumquerung,
    }),
  })
}

export function erzeugeLeitungNurInBauteilenCommand(
  doc: DocumentStore,
  blattId: string,
  leitungIds: readonly string[],
  wert: boolean | undefined,
  settings: RoutingSettings,
): { command: Command; fehlgeschlagen: number; neuVerlegt: number } | null {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const leitungen = blatt.objekte.filter(
    (o): o is LeitungsObjekt => o.type === 'leitung' && leitungIds.includes(o.id),
  )
  if (leitungen.length === 0) return null
  const angabe: Pick<LeitungsObjekt, 'nurInBauteilen'> =
    wert === undefined ? {} : { nurInBauteilen: wert }
  const nachher = () => angabe
  const ids = new Set(
    leitungen
      .filter(
        (l) =>
          giltNurInBauteilen(l, blatt.geschoss) !==
          giltNurInBauteilen({ installationszone: l.installationszone, ...angabe }, blatt.geschoss),
      )
      .map((l) => l.id),
  )
  const { neueSegmente, fehlgeschlagen } = verlegeLeitungenNeu(
    blatt.objekte,
    ids,
    settings,
    blatt.geschoss,
    nachher,
  )
  const gewaehlt = new Set(leitungen.map((l) => l.id))
  const label =
    leitungen.length > 1
      ? t('werkzeuge.commands.nurInBauteilenLeitungen', { n: leitungen.length })
      : t('werkzeuge.commands.nurInBauteilenLeitung')
  const command = erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    mitNeuenSegmenten(objekte, neueSegmente).map((o) => {
      if (o.type !== 'leitung' || !gewaehlt.has(o.id)) return o
      const { nurInBauteilen: _alt, ...rest } = o
      return wert === undefined ? rest : { ...rest, nurInBauteilen: wert }
    }),
  )
  return { command, fehlgeschlagen, neuVerlegt: neueSegmente.size }
}

export function erzeugeLeitungenNeuVerlegenCommand(
  doc: DocumentStore,
  blattId: string,
  ids: readonly string[] | null,
  settings: RoutingSettings,
): { command: Command; fehlgeschlagen: number; neuVerlegt: number } | null {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const ziel = new Set(
    blatt.objekte
      .filter(
        (o): o is LeitungsObjekt =>
          o.type === 'leitung' &&
          !o.autoRoutingAus &&
          (ids === null || ids.includes(o.id)) &&
          !ebeneGesperrt(o.ebeneId, blatt.ebenen),
      )
      .map((o) => o.id),
  )
  if (ziel.size === 0) return null
  const { neueSegmente, fehlgeschlagen } = verlegeLeitungenNeu(
    blatt.objekte,
    ziel,
    settings,
    blatt.geschoss,
    (l) => l,
    doc.getZeichnung().installationszonen,
  )
  const label = t('werkzeuge.commands.neuVerlegen')
  return {
    command: erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
      mitNeuenSegmenten(objekte, neueSegmente),
    ),
    fehlgeschlagen,
    neuVerlegt: neueSegmente.size,
  }
}
