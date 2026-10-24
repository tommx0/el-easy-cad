import type { Command } from '../command'
import { CompositeCommand } from '../command'
import type {
  BestueckungsEintrag,
  DocumentStore,
  LeitungsObjekt,
  LeitungsVerteilerAnschluss,
  Objekt,
  VerteilerDaten,
} from '../../document-model'
import { austrittTRichtungSwitch, verteilerAmEnde } from '../../document-model'
import { buendleProBlatt, erzeugeObjektAendernCommand } from './objekt-commands'

export function erzeugeBestueckungCommand(
  doc: DocumentStore,
  verteilerBlattId: string,
  verteilerId: string,
  label: string,
  bestueckung: BestueckungsEintrag[],
  umbenannt: ReadonlyMap<string, string> = new Map(),
  entfernt: ReadonlySet<string> = new Set(),
  zusatz: Partial<Omit<VerteilerDaten, 'bestueckung'>> = {},
): Command {
  const zeichnung = doc.getZeichnung()
  const eintraege: Parameters<typeof buendleProBlatt>[1] = [
    {
      blattId: verteilerBlattId,
      aendern: (objekte) =>
        objekte.map((o) =>
          o.id === verteilerId && o.type === 'komponente' && o.verteiler
            ? { ...o, verteiler: { ...o.verteiler, ...zusatz, bestueckung } }
            : o,
        ),
    },
  ]
  if (umbenannt.size > 0 || entfernt.size > 0) {
    for (const blatt of zeichnung.blaetter) {
      const betroffen = blatt.objekte.some(
        (o) => o.type === 'leitung' && anschluesseAmVerteiler(zeichnung, blatt.id, o, verteilerId),
      )
      if (!betroffen) continue
      eintraege.push({
        blattId: blatt.id,
        aendern: (objekte) =>
          objekte.map((o) => {
            if (
              o.type !== 'leitung' ||
              !anschluesseAmVerteiler(zeichnung, blatt.id, o, verteilerId)
            )
              return o
            const anschluesse = (o.verteilerAnschluesse ?? []).flatMap((a) => {
              if (!amVerteiler(zeichnung, blatt.id, o, a, verteilerId)) return [a]
              const knoten = a.anschluss ? `${a.kennzeichen}:${a.anschluss}` : null
              if (entfernt.has(a.kennzeichen) || (knoten && entfernt.has(knoten))) return []
              const neuerKnoten = knoten ? umbenannt.get(knoten) : undefined
              if (neuerKnoten) {
                const trenner = neuerKnoten.indexOf(':')
                return [
                  {
                    ...a,
                    kennzeichen: neuerKnoten.slice(0, trenner),
                    anschluss: neuerKnoten.slice(trenner + 1),
                  },
                ]
              }
              const neu = umbenannt.get(a.kennzeichen)
              const trenner = neu?.indexOf(':') ?? -1
              if (neu && trenner > 0) {
                const { anschluss: alt, ...ohne } = a
                return [
                  {
                    ...ohne,
                    kennzeichen: neu.slice(0, trenner),
                    anschluss: neu.slice(trenner + 1),
                    ...(alt && !a.ader ? { ader: alt } : {}),
                  },
                ]
              }
              return [neu ? { ...a, kennzeichen: neu } : a]
            })
            return mitAnschluessen(o, anschluesse)
          }),
      })
    }
  }
  return new CompositeCommand(label, buendleProBlatt(doc, eintraege, label))
}

function amVerteiler(
  zeichnung: ReturnType<DocumentStore['getZeichnung']>,
  leitungBlattId: string,
  leitung: LeitungsObjekt,
  anschluss: LeitungsVerteilerAnschluss,
  verteilerId: string,
): boolean {
  return (
    verteilerAmEnde(zeichnung, leitungBlattId, leitung, anschluss.ende)?.verteiler.id ===
    verteilerId
  )
}

function anschluesseAmVerteiler(
  zeichnung: ReturnType<DocumentStore['getZeichnung']>,
  leitungBlattId: string,
  leitung: LeitungsObjekt,
  verteilerId: string,
): boolean {
  return (leitung.verteilerAnschluesse ?? []).some((a) =>
    amVerteiler(zeichnung, leitungBlattId, leitung, a, verteilerId),
  )
}

function mitAnschluessen(
  leitung: LeitungsObjekt,
  anschluesse: LeitungsVerteilerAnschluss[],
): LeitungsObjekt {
  if (anschluesse.length > 0) return { ...leitung, verteilerAnschluesse: anschluesse }
  const { verteilerAnschluesse: _weg, ...rest } = leitung
  return rest
}

export function erzeugeVerteilerZuweisenCommand(
  doc: DocumentStore,
  leitungBlattId: string,
  leitungId: string,
  ende: 'start' | 'ziel',
  anschluesse: Omit<LeitungsVerteilerAnschluss, 'ende'>[],
  label: string,
  ueberTrunk?: { blattId: string; objektId: string },
): Command {
  const zeichnung = doc.getZeichnung()
  return erzeugeObjektAendernCommand(doc, leitungBlattId, label, (objekte) =>
    objekte.map((o): Objekt => {
      if (o.id !== leitungId || o.type !== 'leitung') return o
      let leitung: LeitungsObjekt = o
      if (ueberTrunk && ende === 'ziel' && o.trunkDurchgaenge.length > 0) {
        const letzterIndex = o.trunkDurchgaenge.length - 1
        const letzter = o.trunkDurchgaenge[letzterIndex]
        const durchgaenge = [...o.trunkDurchgaenge]
        durchgaenge[letzterIndex] = {
          ...letzter,
          austrittT: austrittTRichtungSwitch(
            zeichnung,
            leitungBlattId,
            letzter.trunkId,
            ueberTrunk.objektId,
          ),
        }
        const segmente = [...o.pfadSegmente]
        segmente[segmente.length - 1] = []
        leitung = {
          ...o,
          pfadSegmente: segmente,
          trunkDurchgaenge: durchgaenge,
          ziel: { art: 'verteiler', ...ueberTrunk },
        }
      }
      const andere = (leitung.verteilerAnschluesse ?? []).filter((a) => a.ende !== ende)
      return mitAnschluessen(leitung, [...andere, ...anschluesse.map((a) => ({ ...a, ende }))])
    }),
  )
}
