import type { FastifyInstance } from 'fastify'
import {
  importiereProjektPaket,
  ImportKonflikt,
  type Konfliktbehandlung,
} from '../austausch/import'
import {
  importiereKatalogPaket,
  KatalogImportKonflikt,
  packeKatalog,
  vorschauKatalogPaket,
  type KatalogKonfliktbehandlung,
} from '../austausch/katalog-paket'
import { bibliothekDateiname, packeBibliothek } from '../austausch/bibliothek-paket'
import {
  AUSTAUSCH_GROESSE_MAX,
  packeProjekt,
  PaketFehler,
  projektPaketGroesse,
  zuGrossText,
} from '../austausch/paket'
import { leseKatalog } from '../db/kataloge'
import { erstelleSicherung, sicherungsDateiname } from '../austausch/sicherung'
import { holeProjekt } from '../db/projekte'
import { ermittleBetriebsmodusStatus } from '../demo/betriebsmodus'
import { ApiFehler } from '../fehler'
import { alsText, serverText, uebersetzerFuer } from '../sprache'
import type { DokumentRoutenDemoOptionen } from './dokumente'
import type { ServerKontext } from '../server'
import { ASSET_GROESSE_MAX } from './assets'

function saeubereFuerDateiname(text: string): string {
  return text
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function paketDateiname(kunde: string, bezeichnung: string): string {
  const teile = [saeubereFuerDateiname(kunde), saeubereFuerDateiname(bezeichnung)].filter(
    (t) => t.length > 0,
  )
  return `${teile.join('_') || 'projekt'}.eecproj`
}

export function katalogDateiname(name: string): string {
  const sauber = saeubereFuerDateiname(name)
  return `${sauber || 'katalog'}.eeckat`
}

export function dateinameKopfzeile(name: string): string {
  const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}

export function registriereAustauschRouten(
  app: FastifyInstance,
  kontext: ServerKontext,
  demoOptionen: DokumentRoutenDemoOptionen,
): void {
  const ausTestversion = () =>
    demoOptionen.demoDurchsetzungAktiv &&
    ermittleBetriebsmodusStatus(kontext, demoOptionen.oeffentlicherSchluessel, true)
      .betriebsmodus === 'demo'

  app.get('/api/export/projekt/:id', (anfrage, ausgabe) => {
    const id = (anfrage.params as { id: string }).id
    const projekt = holeProjekt(kontext.db, id)
    if (!projekt) throw ApiFehler.nichtGefunden(serverText('server.projekte.nichtGefunden'))

    let paket: Uint8Array
    try {
      paket = packeProjekt(kontext.db, kontext.konfiguration.assetOrdner, projekt)
    } catch (fehler) {
      if (fehler instanceof PaketFehler) throw ApiFehler.ungueltig(fehler.text)
      throw fehler
    }
    const name = paketDateiname(projekt.kunde, projekt.bezeichnung)
    void ausgabe
      .header('content-type', 'application/zip')
      .header('content-disposition', dateinameKopfzeile(name))
    return Buffer.from(paket)
  })

  app.get('/api/export/projekt/:id/pruefung', (anfrage) => {
    const id = (anfrage.params as { id: string }).id
    if (!holeProjekt(kontext.db, id))
      throw ApiFehler.nichtGefunden(serverText('server.projekte.nichtGefunden'))
    const groesse = projektPaketGroesse(kontext.db, id)
    const erlaubt = groesse <= AUSTAUSCH_GROESSE_MAX
    return {
      groesse,
      groesseMax: AUSTAUSCH_GROESSE_MAX,
      erlaubt,
      meldung: erlaubt ? null : alsText(zuGrossText(groesse), uebersetzerFuer(anfrage)),
    }
  })

  app.get('/api/export/katalog/:id', (anfrage, ausgabe) => {
    const id = (anfrage.params as { id: string }).id
    const katalog = leseKatalog(kontext.db, id)
    if (!katalog) throw ApiFehler.nichtGefunden(serverText('server.kataloge.nichtGefunden'))

    const paket = packeKatalog(
      kontext.db,
      kontext.konfiguration.assetOrdner,
      katalog,
      ausTestversion(),
    )
    void ausgabe
      .header('content-type', 'application/zip')
      .header('content-disposition', dateinameKopfzeile(katalogDateiname(katalog.name)))
    return Buffer.from(paket)
  })

  app.get('/api/export/bibliothek', (_anfrage, ausgabe) => {
    const paket = packeBibliothek(kontext.db, kontext.konfiguration.assetOrdner, ausTestversion())
    void ausgabe
      .header('content-type', 'application/zip')
      .header('content-disposition', dateinameKopfzeile(bibliothekDateiname()))
    return Buffer.from(paket)
  })

  app.post('/api/import/katalog/vorschau', { bodyLimit: ASSET_GROESSE_MAX }, (anfrage) => {
    const daten = anfrage.body
    if (!Buffer.isBuffer(daten) || daten.length === 0) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.paketdateiFehlt'))
    }
    try {
      return vorschauKatalogPaket(kontext.db, new Uint8Array(daten))
    } catch (fehler) {
      if (fehler instanceof PaketFehler) throw ApiFehler.ungueltig(fehler.text)
      throw fehler
    }
  })

  app.post('/api/import/katalog', { bodyLimit: ASSET_GROESSE_MAX }, (anfrage, ausgabe) => {
    const daten = anfrage.body
    if (!Buffer.isBuffer(daten) || daten.length === 0) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.paketdateiFehlt'))
    }
    const roh = (anfrage.query as { konflikt?: string } | undefined)?.konflikt
    if (roh !== undefined && roh !== 'ersetzen' && roh !== 'kopie') {
      throw ApiFehler.ungueltig(serverText('server.anfrage.konfliktUngueltig'))
    }

    try {
      const ergebnis = importiereKatalogPaket(
        kontext.db,
        kontext.konfiguration.assetOrdner,
        new Uint8Array(daten),
        roh as KatalogKonfliktbehandlung | undefined,
      )
      void ausgabe.status(201)
      return ergebnis
    } catch (fehler) {
      if (fehler instanceof KatalogImportKonflikt) {
        throw fehler.nurKopie ? ApiFehler.nurKopie(fehler.text) : ApiFehler.konflikt(fehler.text)
      }
      if (fehler instanceof PaketFehler) throw ApiFehler.ungueltig(fehler.text)
      throw fehler
    }
  })

  app.get('/api/sicherung', async (_anfrage, ausgabe) => {
    const daten = await erstelleSicherung(kontext.db, kontext.konfiguration)
    void ausgabe
      .header('content-type', 'application/zip')
      .header('content-disposition', dateinameKopfzeile(sicherungsDateiname()))
    return Buffer.from(daten)
  })

  app.post('/api/import/projekt', { bodyLimit: AUSTAUSCH_GROESSE_MAX }, (anfrage, ausgabe) => {
    const daten = anfrage.body
    if (!Buffer.isBuffer(daten) || daten.length === 0) {
      throw ApiFehler.ungueltig(serverText('server.anfrage.paketdateiFehlt'))
    }
    const roh = (anfrage.query as { konflikt?: string } | undefined)?.konflikt
    if (roh !== undefined && roh !== 'ersetzen' && roh !== 'kopie') {
      throw ApiFehler.ungueltig(serverText('server.anfrage.konfliktUngueltig'))
    }

    try {
      const ergebnis = importiereProjektPaket(
        kontext.db,
        kontext.konfiguration.assetOrdner,
        new Uint8Array(daten),
        roh as Konfliktbehandlung | undefined,
      )
      void ausgabe.status(201)
      return ergebnis
    } catch (fehler) {
      if (fehler instanceof ImportKonflikt) throw ApiFehler.konflikt(fehler.text)
      if (fehler instanceof PaketFehler) throw ApiFehler.ungueltig(fehler.text)
      throw fehler
    }
  })
}
