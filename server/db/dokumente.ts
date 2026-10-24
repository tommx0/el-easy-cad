import type { DatabaseSync } from 'node:sqlite'
import {
  erzeugeId,
  type Dokument,
  type DokumentAenderung,
  type DokumentEingabe,
  type DokumentInhalt,
  type DokumentInhaltEingabe,
  type DokumentMeta,
} from '../../src/document-model'
import {
  entferneReferenzen,
  entferneVerwaisteAssets,
  holeAsset,
  sammleAssetIdsAusText,
  synchronisiereReferenzen,
} from './assets'
import { inTransaktion } from './datenbank'
import { alleZeilen, eineZeile, jetzt } from './hilfen'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

interface DokumentZeile {
  id: string
  projekt_id: string
  typ: string
  name: string
  reihenfolge: number
  quelle_dokument_id: string | null
  erstellt_am: string
  geaendert_am: string
}

interface InhaltZeile {
  format_version: number
  version: number
  inhalt: string | null
  asset_id: string | null
}

const SPALTEN =
  'id, projekt_id, typ, name, reihenfolge, quelle_dokument_id, erstellt_am, geaendert_am'
const SPALTEN_MIT_PRAEFIX = SPALTEN.split(', ')
  .map((spalte) => `d.${spalte}`)
  .join(', ')

export const OHNE_INHALT: DokumentInhalt = {
  formatVersion: 0,
  version: 0,
  inhalt: null,
  assetId: null,
}

function zuMeta(zeile: DokumentZeile): DokumentMeta {
  return {
    id: zeile.id,
    projektId: zeile.projekt_id,
    typ: zeile.typ as DokumentMeta['typ'],
    name: zeile.name,
    reihenfolge: zeile.reihenfolge,
    quelleDokumentId: zeile.quelle_dokument_id,
    erstelltAm: zeile.erstellt_am,
    zuletztGeaendertAm: zeile.geaendert_am,
  }
}

function zuInhalt(zeile: InhaltZeile | undefined): DokumentInhalt {
  if (!zeile) return OHNE_INHALT
  return {
    formatVersion: zeile.format_version,
    version: zeile.version,
    inhalt: zeile.inhalt,
    assetId: zeile.asset_id,
  }
}

export function listeDokumente(db: DatabaseSync, projektId: string): DokumentMeta[] {
  return alleZeilen<
    DokumentZeile & { zeichnungsart: string | null; verteiler_kennzeichen: unknown }
  >(
    db.prepare(
      `SELECT ${SPALTEN_MIT_PRAEFIX},
         CASE WHEN d.typ = 'zeichnung' AND json_valid(i.inhalt)
           THEN json_extract(i.inhalt, '$.zeichnungsart') END AS zeichnungsart,
         CASE WHEN d.typ = 'zeichnung' AND json_valid(i.inhalt)
           THEN json_extract(i.inhalt, '$.verteilerKennzeichen') END AS verteiler_kennzeichen
       FROM dokumente d LEFT JOIN dokument_inhalte i ON i.dokument_id = d.id
       WHERE d.projekt_id = ? ORDER BY d.reihenfolge, d.name COLLATE NOCASE`,
    ),
    projektId,
  ).map((zeile) => {
    const meta: DokumentMeta = zuMeta(zeile)
    if (zeile.zeichnungsart === 'schaltplan' || zeile.zeichnungsart === 'bauplan')
      meta.zeichnungsart = zeile.zeichnungsart
    if (typeof zeile.verteiler_kennzeichen === 'string' && zeile.verteiler_kennzeichen)
      meta.verteilerKennzeichen = zeile.verteiler_kennzeichen
    return meta
  })
}

export function holeDokumentMeta(db: DatabaseSync, id: string): DokumentMeta | undefined {
  const zeile = eineZeile<DokumentZeile>(
    db.prepare(`SELECT ${SPALTEN} FROM dokumente WHERE id = ?`),
    id,
  )
  return zeile ? zuMeta(zeile) : undefined
}

export function holeDokument(db: DatabaseSync, id: string): Dokument | undefined {
  const meta = holeDokumentMeta(db, id)
  if (!meta) return undefined
  const inhalt = eineZeile<InhaltZeile>(
    db.prepare(
      'SELECT format_version, version, inhalt, asset_id FROM dokument_inhalte WHERE dokument_id = ?',
    ),
    id,
  )
  return { ...meta, inhalt: zuInhalt(inhalt) }
}

export function legeDokumentAn(
  db: DatabaseSync,
  projektId: string,
  eingabe: DokumentEingabe,
): DokumentMeta {
  const id = erzeugeId('dokument')
  const zeitpunkt = jetzt()
  const reihenfolge =
    eingabe.reihenfolge ??
    eineZeile<{ naechste: number }>(
      db.prepare(
        'SELECT COALESCE(MAX(reihenfolge) + 1, 0) AS naechste FROM dokumente WHERE projekt_id = ?',
      ),
      projektId,
    )?.naechste ??
    0

  db.prepare(
    `INSERT INTO dokumente (id, projekt_id, typ, name, reihenfolge, quelle_dokument_id, erstellt_am, geaendert_am)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    projektId,
    eingabe.typ,
    eingabe.name,
    reihenfolge,
    eingabe.quelleDokumentId ?? null,
    zeitpunkt,
    zeitpunkt,
  )

  return holeDokumentMeta(db, id) as DokumentMeta
}

export function aendereDokument(
  db: DatabaseSync,
  id: string,
  aenderung: DokumentAenderung,
): DokumentMeta | undefined {
  const vorhanden = holeDokumentMeta(db, id)
  if (!vorhanden) return undefined
  db.prepare('UPDATE dokumente SET name = ?, reihenfolge = ?, geaendert_am = ? WHERE id = ?').run(
    aenderung.name ?? vorhanden.name,
    aenderung.reihenfolge ?? vorhanden.reihenfolge,
    jetzt(),
    id,
  )
  return holeDokumentMeta(db, id)
}

export class UnbekanntesAsset extends Error {
  readonly assetId: string

  readonly text: ServerText

  constructor(assetId: string) {
    const text = serverText('server.dokumente.unbekanntesAsset', { assetId })
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'UnbekanntesAsset'
    this.assetId = assetId
  }
}

export class VersionsKonflikt extends Error {
  readonly erwartet: number
  readonly tatsaechlich: number

  readonly text: ServerText

  constructor(erwartet: number, tatsaechlich: number) {
    const text = serverText('server.dokumente.versionsKonflikt', {
      erwartet: String(erwartet),
      vorhanden: String(tatsaechlich),
    })
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'VersionsKonflikt'
    this.erwartet = erwartet
    this.tatsaechlich = tatsaechlich
  }
}

export function speichereInhalt(
  db: DatabaseSync,
  dokumentId: string,
  eingabe: DokumentInhaltEingabe,
): DokumentInhalt {
  if (eingabe.assetId && !holeAsset(db, eingabe.assetId)) {
    throw new UnbekanntesAsset(eingabe.assetId)
  }

  return inTransaktion(db, () => {
    const vorhanden = eineZeile<{ version: number }>(
      db.prepare('SELECT version FROM dokument_inhalte WHERE dokument_id = ?'),
      dokumentId,
    )
    const aktuelleVersion = vorhanden?.version ?? 0
    if (eingabe.version !== aktuelleVersion) {
      throw new VersionsKonflikt(eingabe.version, aktuelleVersion)
    }

    const neueVersion = aktuelleVersion + 1
    if (vorhanden) {
      db.prepare(
        `UPDATE dokument_inhalte
            SET format_version = ?, version = ?, inhalt = ?, asset_id = ?
          WHERE dokument_id = ?`,
      ).run(eingabe.formatVersion, neueVersion, eingabe.inhalt, eingabe.assetId, dokumentId)
    } else {
      db.prepare(
        `INSERT INTO dokument_inhalte (dokument_id, format_version, version, inhalt, asset_id)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(dokumentId, eingabe.formatVersion, neueVersion, eingabe.inhalt, eingabe.assetId)
    }
    db.prepare('UPDATE dokumente SET geaendert_am = ? WHERE id = ?').run(jetzt(), dokumentId)

    const referenziert = sammleAssetIdsAusText(eingabe.inhalt)
    if (eingabe.assetId) referenziert.push(eingabe.assetId)
    synchronisiereReferenzen(db, 'dokument', dokumentId, referenziert)

    return {
      formatVersion: eingabe.formatVersion,
      version: neueVersion,
      inhalt: eingabe.inhalt,
      assetId: eingabe.assetId,
    }
  })
}

export interface DokumentLoeschErgebnis {
  assets: string[]
}

export function loescheDokument(db: DatabaseSync, id: string): DokumentLoeschErgebnis | undefined {
  if (!holeDokumentMeta(db, id)) return undefined
  return inTransaktion(db, () => {
    const standIds = alleZeilen<{ id: string }>(
      db.prepare('SELECT id FROM dokument_staende WHERE dokument_id = ?'),
      id,
    ).map((z) => z.id)
    entferneReferenzen(db, 'stand', standIds)
    entferneReferenzen(db, 'dokument', [id])
    db.prepare('DELETE FROM dokumente WHERE id = ?').run(id)
    return { assets: entferneVerwaisteAssets(db) }
  })
}

export interface ZuletztBearbeitet extends DokumentMeta {
  projektBezeichnung: string
  kunde: string
}

export function zuletztBearbeitet(db: DatabaseSync, grenze = 10): ZuletztBearbeitet[] {
  return alleZeilen<DokumentZeile & { projekt_bezeichnung: string; kunde: string }>(
    db.prepare(
      `SELECT d.id, d.projekt_id, d.typ, d.name, d.reihenfolge, d.quelle_dokument_id,
              d.erstellt_am, d.geaendert_am, p.bezeichnung AS projekt_bezeichnung, p.kunde
         FROM dokumente d
         JOIN projekte p ON p.id = d.projekt_id
        WHERE p.geloescht_am IS NULL
        ORDER BY d.geaendert_am DESC
        LIMIT ?`,
    ),
    grenze,
  ).map((zeile) => ({
    ...zuMeta(zeile),
    projektBezeichnung: zeile.projekt_bezeichnung,
    kunde: zeile.kunde,
  }))
}
