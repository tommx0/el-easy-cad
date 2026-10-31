import type { Blatt, Objekt } from '../../document-model'
import { istBearbeitbar, istLeitungsverlegungsObjekt } from '../../document-model'
import { erzeugeUebersetzer, SPRACHEN, t } from '../../sprache'
import type { Command } from '../command'
import { KiFolgeCommand } from './folge-command'
import type { KiKontext } from './kontext'
import { findeObjekt, KiFehler, pruefeLeitungsverlegung } from './kontext'

export function kiLabel(text: string): string {
  return `${t('kiMeldungen.schreiben.labelVorspann')}${text}`
}

export function ohneKiVorspann(label: string): string | null {
  for (const sprache of SPRACHEN) {
    const vorspann = erzeugeUebersetzer(sprache)('kiMeldungen.schreiben.labelVorspann')
    if (label.startsWith(vorspann)) return label.slice(vorspann.length)
  }
  return null
}

export interface ObjekteJeBlatt {
  jeBlatt: Map<string, { blatt: Blatt; objekte: Objekt[] }>
  gesperrt: string[]
}

export function ordneObjekteNachBlatt(kontext: KiKontext, ids: readonly string[]): ObjekteJeBlatt {
  const zeichnung = kontext.doc.getZeichnung()
  const jeBlatt = new Map<string, { blatt: Blatt; objekte: Objekt[] }>()
  const unbekannt: string[] = []
  const gesperrt: string[] = []
  for (const id of new Set(ids)) {
    const fund = findeObjekt(zeichnung, id)
    if (!fund) {
      unbekannt.push(id)
      continue
    }
    if (istLeitungsverlegungsObjekt(fund.objekt)) pruefeLeitungsverlegung(kontext)
    const grund = kontext.nurAnsicht(fund.blatt)
    if (grund) {
      throw new KiFehler(
        t('kiMeldungen.gemeinsam.blattNurAnsicht', { blatt: fund.blatt.name, grund }),
      )
    }
    if (!istBearbeitbar(fund.objekt, fund.blatt.ebenen)) {
      gesperrt.push(id)
      continue
    }
    const eintrag = jeBlatt.get(fund.blatt.id) ?? { blatt: fund.blatt, objekte: [] }
    eintrag.objekte.push(fund.objekt)
    jeBlatt.set(fund.blatt.id, eintrag)
  }
  if (unbekannt.length > 0) {
    const liste = unbekannt.slice(0, 5).join(', ') + (unbekannt.length > 5 ? ' …' : '')
    throw new KiFehler(t('kiMeldungen.schreiben.unbekannteIds', { n: unbekannt.length, liste }))
  }
  if (jeBlatt.size === 0) {
    throw new KiFehler(t('kiMeldungen.schreiben.alleGesperrt'))
  }
  return { jeBlatt, gesperrt }
}

export function blattText(blaetter: Iterable<Blatt>): string {
  const namen = [...new Set([...blaetter].map((b) => b.name))]
  return namen.length > 0 ? ` (${namen.join(', ')})` : ''
}

export function fuehreAenderungAus(
  kontext: KiKontext,
  text: string,
  schritte: readonly (() => Command | null)[],
): KiFolgeCommand {
  const command = new KiFolgeCommand(kiLabel(text), schritte)
  if (!kontext.commands.execute(command)) {
    throw new KiFehler(t('kiMeldungen.schreiben.abgewiesen'))
  }
  if (command.leer) {
    kontext.commands.undo()
    throw new KiFehler(t('kiMeldungen.schreiben.nichtsZuAendern'))
  }
  return command
}
