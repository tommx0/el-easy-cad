import type { Command } from './command'
import { CompositeCommand } from './command'
import type {
  DocumentStore,
  TrunkAbmessung,
  TrunkAusfuehrung,
  TrunkObjekt,
} from '../document-model'
import { ermittleTrunkKette } from '../document-model'
import { erzeugeTrunkEigenschaftenSyncCommand } from './commands/trunk-commands'
import type { BestaettigungsZustand } from './tool'
import { formatiereZahl, t } from '../sprache'

export interface AusfuehrungsWahl {
  ausfuehrung?: TrunkAusfuehrung
  abmessung?: TrunkAbmessung
}

export function ausfuehrungVon(trunk: TrunkObjekt): AusfuehrungsWahl {
  return { ausfuehrung: trunk.ausfuehrung, abmessung: trunk.abmessung }
}

function festgelegt(w: AusfuehrungsWahl): boolean {
  return w.ausfuehrung !== undefined && w.ausfuehrung !== 'buendel'
}

export function gleicheAusfuehrung(a: AusfuehrungsWahl, b: AusfuehrungsWahl): boolean {
  if (!festgelegt(a) && !festgelegt(b)) return true
  return (
    a.ausfuehrung === b.ausfuehrung && JSON.stringify(a.abmessung) === JSON.stringify(b.abmessung)
  )
}

const cm = (meter: number) =>
  formatiereZahl(Math.round(meter * 1000) / 10, { maximumFractionDigits: 1, useGrouping: false })

export function beschreibeAusfuehrung(w: AusfuehrungsWahl): string {
  const name = t(
    w.ausfuehrung === 'kanal'
      ? 'werkzeuge.trunkAusfuehrung.kanal'
      : w.ausfuehrung === 'trasse'
        ? 'werkzeuge.trunkAusfuehrung.trasse'
        : w.ausfuehrung === 'rohr'
          ? 'werkzeuge.trunkAusfuehrung.rohr'
          : 'werkzeuge.trunkAusfuehrung.buendel',
  )
  if (!w.abmessung) return name
  return 'durchmesser' in w.abmessung
    ? `${name} Ø ${cm(w.abmessung.durchmesser)} cm`
    : `${name} ${cm(w.abmessung.breite)} × ${cm(w.abmessung.hoehe)} cm`
}

export function klaereAusfuehrung(
  oeffneBestaetigung: (optionen: BestaettigungsZustand) => void,
  bestehend: { name: string; trunk: TrunkObjekt },
  anderer: { name: string; trunk: TrunkObjekt },
  antwort: (wahl: AusfuehrungsWahl | null) => void,
): void {
  const a = ausfuehrungVon(bestehend.trunk)
  const b = ausfuehrungVon(anderer.trunk)
  if (gleicheAusfuehrung(a, b) || !festgelegt(b)) {
    antwort(a)
    return
  }
  if (!festgelegt(a)) {
    antwort(b)
    return
  }
  oeffneBestaetigung({
    titel: t('werkzeuge.trunkAusfuehrung.titel'),
    nachricht: t('werkzeuge.trunkAusfuehrung.frage', {
      nameA: bestehend.name,
      ausfuehrungA: beschreibeAusfuehrung(a),
      nameB: anderer.name,
      ausfuehrungB: beschreibeAusfuehrung(b),
    }),
    bestaetigenText: beschreibeAusfuehrung(a),
    destruktiv: false,
    alternative: { text: beschreibeAusfuehrung(b), callback: () => antwort(b) },
    callback: (bestaetigt) => antwort(bestaetigt ? a : null),
  })
}

export function gleicheKetteAn(
  doc: DocumentStore,
  blattId: string,
  trunkId: string,
  wahl: AusfuehrungsWahl,
  ausgefuehrt: Command,
): Command {
  const kette = ermittleTrunkKette(doc.getZeichnung(), blattId, trunkId)
  if (kette.every((g) => gleicheAusfuehrung(ausfuehrungVon(g.trunk), wahl))) return ausgefuehrt
  const angleichen = erzeugeTrunkEigenschaftenSyncCommand(
    doc,
    blattId,
    trunkId,
    { ausfuehrung: wahl.ausfuehrung, abmessung: wahl.abmessung },
    ausgefuehrt.label,
  )
  angleichen.do()
  return new CompositeCommand(ausgefuehrt.label, [ausgefuehrt, angleichen])
}
