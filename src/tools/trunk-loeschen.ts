import type { DocumentStore } from '../document-model'
import { istKabelschacht } from '../document-model'
import type { BestaettigungsZustand } from './tool'
import { zaehleAnschluesseAmSchacht, zaehleLeitungenInTrunks } from './commands'
import { t } from '../sprache'

export function frageLoeschung(
  oeffneBestaetigung: (zustand: BestaettigungsZustand) => void,
  doc: DocumentStore,
  blattId: string,
  objektIds: readonly string[],
  antwort: (bestaetigt: boolean) => void,
): void {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) {
    antwort(true)
    return
  }
  const idSet = new Set(objektIds)
  const trunkIds = blatt.objekte
    .filter((o) => o.type === 'trunk' && idSet.has(o.id))
    .map((o) => o.id)
  const anzahlLeitungen = zaehleLeitungenInTrunks(doc, trunkIds)

  const schaechte = blatt.objekte.filter((o) => istKabelschacht(o) && idSet.has(o.id))
  const anzahlAnschluesse = schaechte.reduce(
    (summe, s) => summe + zaehleAnschluesseAmSchacht(doc, s.id),
    0,
  )

  if (anzahlLeitungen === 0 && anzahlAnschluesse === 0) {
    antwort(true)
    return
  }

  const saetze: string[] = []
  if (anzahlLeitungen > 0) {
    saetze.push(
      t('werkzeuge.trunkLoeschen.leitungen', {
        trunks:
          trunkIds.length === 1
            ? t('werkzeuge.trunkLoeschen.einTrunk')
            : t('werkzeuge.trunkLoeschen.mehrereTrunks', { n: trunkIds.length }),
        leitungen: t('werkzeuge.trunkLoeschen.anzahlLeitungen', { n: anzahlLeitungen }),
      }),
    )
  }
  if (anzahlAnschluesse > 0) {
    saetze.push(
      t('werkzeuge.trunkLoeschen.anschluesse', {
        schaechte:
          schaechte.length === 1
            ? t('werkzeuge.trunkLoeschen.einSchacht')
            : t('werkzeuge.trunkLoeschen.mehrereSchaechte', { n: schaechte.length }),
        anschluesse: t('werkzeuge.trunkLoeschen.anzahlAnschluesse', { n: anzahlAnschluesse }),
      }),
    )
  }

  const nurSchaechte = anzahlLeitungen === 0
  oeffneBestaetigung({
    titel: nurSchaechte
      ? t('werkzeuge.trunkLoeschen.schachtTitel', { n: schaechte.length })
      : t('werkzeuge.trunkLoeschen.trunkTitel', { n: trunkIds.length }),
    nachricht: saetze.join(' '),
    callback: antwort,
  })
}
