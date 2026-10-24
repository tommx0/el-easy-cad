import type { KeyObject } from 'node:crypto'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  dokumentAenderungSchema,
  dokumentEingabeSchema,
  dokumentInhaltEingabeSchema,
  standEingabeSchema,
} from '../../src/document-model'
import { ergaenzeHerkunftTestversion, ermittleBetriebsmodusStatus } from '../demo/betriebsmodus'
import { kommerziellErlaubt } from '../produktlizenz/unterstuetzer'
import {
  aendereDokument,
  holeDokument,
  holeDokumentMeta,
  legeDokumentAn,
  listeDokumente,
  loescheDokument,
  speichereInhalt,
  UnbekanntesAsset,
  VersionsKonflikt,
  zuletztBearbeitet,
} from '../db/dokumente'
import { holeProjekt } from '../db/projekte'
import {
  groesseDerStaende,
  holeStand,
  listeStaende,
  loescheStand,
  NichtsZuSichern,
  sichereStand,
} from '../db/staende'
import { loescheAssetDateien } from '../assets/speicher'
import { ApiFehler } from '../fehler'
import { serverText } from '../sprache'
import type { ServerKontext } from '../server'

function idAus(anfrage: FastifyRequest): string {
  return (anfrage.params as { id: string }).id
}

export interface DokumentRoutenDemoOptionen {
  demoDurchsetzungAktiv: boolean
  oeffentlicherSchluessel: KeyObject
}

export function registriereDokumentRouten(
  app: FastifyInstance,
  kontext: ServerKontext,
  demoOptionen: DokumentRoutenDemoOptionen,
): void {
  app.get('/api/projekte/:id/dokumente', (anfrage) => {
    const projektId = idAus(anfrage)
    if (!holeProjekt(kontext.db, projektId)) {
      throw ApiFehler.nichtGefunden(serverText('server.projekte.nichtGefunden'))
    }
    return listeDokumente(kontext.db, projektId)
  })

  app.post('/api/projekte/:id/dokumente', (anfrage, ausgabe) => {
    const projektId = idAus(anfrage)
    if (!holeProjekt(kontext.db, projektId)) {
      throw ApiFehler.nichtGefunden(serverText('server.projekte.nichtGefunden'))
    }
    const eingabe = dokumentEingabeSchema.parse(anfrage.body ?? {})
    void ausgabe.status(201)
    return legeDokumentAn(kontext.db, projektId, eingabe)
  })

  app.get('/api/dokumente/:id', (anfrage) => {
    const dokument = holeDokument(kontext.db, idAus(anfrage))
    if (!dokument) throw ApiFehler.nichtGefunden(serverText('server.dokumente.nichtGefunden'))
    return dokument
  })

  app.put('/api/dokumente/:id', (anfrage) => {
    const aenderung = dokumentAenderungSchema.parse(anfrage.body ?? {})
    const dokument = aendereDokument(kontext.db, idAus(anfrage), aenderung)
    if (!dokument) throw ApiFehler.nichtGefunden(serverText('server.dokumente.nichtGefunden'))
    return dokument
  })

  app.delete('/api/dokumente/:id', (anfrage) => {
    const ergebnis = loescheDokument(kontext.db, idAus(anfrage))
    if (!ergebnis) throw ApiFehler.nichtGefunden(serverText('server.dokumente.nichtGefunden'))
    const freigegeben = loescheAssetDateien(kontext.konfiguration.assetOrdner, ergebnis.assets)
    return { ...ergebnis, freigegeben }
  })

  app.put('/api/dokumente/:id/inhalt', (anfrage) => {
    const id = idAus(anfrage)
    const meta = holeDokumentMeta(kontext.db, id)
    if (!meta) {
      throw ApiFehler.nichtGefunden(serverText('server.dokumente.nichtGefunden'))
    }
    let eingabe = dokumentInhaltEingabeSchema.parse(anfrage.body ?? {})
    if (demoOptionen.demoDurchsetzungAktiv && meta.typ === 'zeichnung') {
      const ermittlung = ermittleBetriebsmodusStatus(
        kontext,
        demoOptionen.oeffentlicherSchluessel,
        true,
      )
      if (!kommerziellErlaubt(ermittlung)) {
        eingabe = { ...eingabe, inhalt: ergaenzeHerkunftTestversion(eingabe.inhalt) }
      }
    }
    try {
      return speichereInhalt(kontext.db, id, eingabe)
    } catch (fehler) {
      if (fehler instanceof VersionsKonflikt) throw ApiFehler.konflikt(fehler.text)
      if (fehler instanceof UnbekanntesAsset) throw ApiFehler.ungueltig(fehler.text)
      throw fehler
    }
  })

  app.get('/api/dokumente/:id/staende', (anfrage) => {
    const id = idAus(anfrage)
    if (!holeDokumentMeta(kontext.db, id)) {
      throw ApiFehler.nichtGefunden(serverText('server.dokumente.nichtGefunden'))
    }
    return {
      staende: listeStaende(kontext.db, id),
      groesseGesamt: groesseDerStaende(kontext.db, id),
    }
  })

  app.post('/api/dokumente/:id/staende', (anfrage, ausgabe) => {
    const id = idAus(anfrage)
    if (!holeDokumentMeta(kontext.db, id)) {
      throw ApiFehler.nichtGefunden(serverText('server.dokumente.nichtGefunden'))
    }
    const eingabe = standEingabeSchema.parse(anfrage.body ?? {})
    try {
      void ausgabe.status(201)
      return sichereStand(kontext.db, id, eingabe)
    } catch (fehler) {
      if (fehler instanceof NichtsZuSichern) throw ApiFehler.ungueltig(fehler.text)
      throw fehler
    }
  })

  app.get('/api/staende/:id', (anfrage) => {
    const stand = holeStand(kontext.db, idAus(anfrage))
    if (!stand) throw ApiFehler.nichtGefunden(serverText('server.dokumente.standNichtGefunden'))
    return stand
  })

  app.delete('/api/staende/:id', (anfrage) => {
    const ergebnis = loescheStand(kontext.db, idAus(anfrage))
    if (!ergebnis) throw ApiFehler.nichtGefunden(serverText('server.dokumente.standNichtGefunden'))
    const freigegeben = loescheAssetDateien(kontext.konfiguration.assetOrdner, ergebnis.assets)
    return { ...ergebnis, freigegeben }
  })

  app.get('/api/zuletzt-bearbeitet', (anfrage) => {
    const roh = (anfrage.query as { grenze?: string } | undefined)?.grenze
    const grenze = roh ? Number(roh) : 10
    if (!Number.isInteger(grenze) || grenze < 1 || grenze > 100) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.grenzeUngueltig'))
    }
    return zuletztBearbeitet(kontext.db, grenze)
  })
}
