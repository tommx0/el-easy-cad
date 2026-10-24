import type { DatabaseSync } from 'node:sqlite'
import { erzeugeId } from '../../src/document-model'
import { synchronisiereReferenzen, sammleAssetIdsAusText } from '../db/assets'
import { inTransaktion } from '../db/datenbank'
import { eineZeile, jetzt, zuSqlBoolean } from '../db/hilfen'
import { loescheEndgueltig } from '../db/projekte'
import { entpackeProjekt, uebernimmAssets, type EntpacktesPaket } from './paket'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

export type Konfliktbehandlung = 'ersetzen' | 'kopie'

export class ImportKonflikt extends Error {
  readonly projektId: string
  readonly bezeichnung: string

  readonly text: ServerText

  constructor(projektId: string, bezeichnung: string) {
    const text = serverText('server.austausch.projektVorhanden', { bezeichnung })
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'ImportKonflikt'
    this.projektId = projektId
    this.bezeichnung = bezeichnung
  }
}

export interface ImportErgebnis {
  projektId: string
  bezeichnung: string
  dokumente: number
  staende: number
  assetsNeu: number
  ersetzt: boolean
}

export function importiereProjektPaket(
  db: DatabaseSync,
  assetOrdner: string,
  bytes: Uint8Array,
  konflikt?: Konfliktbehandlung,
): ImportErgebnis {
  const paket = entpackeProjekt(bytes)
  const vorhanden = eineZeile<{ id: string; bezeichnung: string }>(
    db.prepare('SELECT id, bezeichnung FROM projekte WHERE id = ?'),
    paket.inhalt.projekt.id,
  )

  if (vorhanden && !konflikt) {
    throw new ImportKonflikt(vorhanden.id, vorhanden.bezeichnung)
  }
  const alsKopie = Boolean(vorhanden) && konflikt === 'kopie'

  const assetsNeu = uebernimmAssets(db, assetOrdner, paket)

  return inTransaktion(db, () => {
    const ersetzt = Boolean(vorhanden) && konflikt === 'ersetzen'
    if (ersetzt) loescheEndgueltig(db, paket.inhalt.projekt.id)
    return schreibePaket(db, paket, { alsKopie, ersetzt, assetsNeu })
  })
}

interface SchreibOptionen {
  alsKopie: boolean
  ersetzt: boolean
  assetsNeu: number
}

function schreibePaket(
  db: DatabaseSync,
  paket: EntpacktesPaket,
  { alsKopie, ersetzt, assetsNeu }: SchreibOptionen,
): ImportErgebnis {
  const quelle = paket.inhalt.projekt
  const projektId = alsKopie ? erzeugeId('projekt') : quelle.id
  const bezeichnung = alsKopie ? `${quelle.bezeichnung} (Kopie)` : quelle.bezeichnung
  const zeitpunkt = jetzt()

  db.prepare(
    `INSERT INTO projekte (id, kunde, bezeichnung, projektnummer, notiz, status, archiviert,
                           erstellt_am, geaendert_am)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    projektId,
    quelle.kunde,
    bezeichnung,
    quelle.projektnummer,
    quelle.notiz,
    quelle.status,
    zuSqlBoolean(quelle.archiviert),
    quelle.erstelltAm,
    alsKopie ? zeitpunkt : quelle.zuletztGeaendertAm,
  )

  const dokumentIdKarte = new Map(
    paket.inhalt.dokumente.map((d) => [d.meta.id, alsKopie ? erzeugeId('dokument') : d.meta.id]),
  )

  let staende = 0
  for (const dokument of paket.inhalt.dokumente) {
    const dokumentId = dokumentIdKarte.get(dokument.meta.id) as string
    const quelleDokumentId = dokument.meta.quelleDokumentId
      ? (dokumentIdKarte.get(dokument.meta.quelleDokumentId) ?? null)
      : null
    db.prepare(
      `INSERT INTO dokumente (id, projekt_id, typ, name, reihenfolge, quelle_dokument_id, erstellt_am, geaendert_am)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      dokumentId,
      projektId,
      dokument.meta.typ,
      dokument.meta.name,
      dokument.meta.reihenfolge,
      quelleDokumentId,
      dokument.meta.erstelltAm,
      dokument.meta.zuletztGeaendertAm,
    )

    if (dokument.inhalt) {
      db.prepare(
        `INSERT INTO dokument_inhalte (dokument_id, format_version, version, inhalt, asset_id)
         VALUES (?, ?, 1, ?, ?)`,
      ).run(
        dokumentId,
        dokument.inhalt.formatVersion,
        dokument.inhalt.inhalt,
        dokument.inhalt.assetId,
      )
      const referenziert = sammleAssetIdsAusText(dokument.inhalt.inhalt)
      if (dokument.inhalt.assetId) referenziert.push(dokument.inhalt.assetId)
      synchronisiereReferenzen(db, 'dokument', dokumentId, referenziert)
    }

    for (const stand of dokument.staende) {
      const standId = alsKopie ? erzeugeId('stand') : stand.id
      db.prepare(
        `INSERT INTO dokument_staende (id, dokument_id, name, bemerkung, format_version, inhalt, erstellt_am)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        standId,
        dokumentId,
        stand.name,
        stand.bemerkung,
        stand.formatVersion,
        stand.inhalt,
        stand.erstelltAm,
      )
      synchronisiereReferenzen(db, 'stand', standId, sammleAssetIdsAusText(stand.inhalt))
      staende++
    }
  }

  return {
    projektId,
    bezeichnung,
    dokumente: paket.inhalt.dokumente.length,
    staende,
    assetsNeu,
    ersetzt,
  }
}
