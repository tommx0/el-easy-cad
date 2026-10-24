import type { DatabaseSync } from 'node:sqlite'
import { erzeugeId, type Stand, type StandEingabe, type StandMeta } from '../../src/document-model'
import {
  entferneReferenzen,
  entferneVerwaisteAssets,
  sammleAssetIdsAusText,
  synchronisiereReferenzen,
} from './assets'
import { inTransaktion } from './datenbank'
import { alleZeilen, eineZeile, jetzt } from './hilfen'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

interface StandZeile {
  id: string
  dokument_id: string
  name: string
  bemerkung: string | null
  format_version: number
  groesse: number
  erstellt_am: string
}

const SPALTEN = `id, dokument_id, name, bemerkung, format_version,
                 LENGTH(CAST(inhalt AS BLOB)) AS groesse, erstellt_am`

function zuMeta(zeile: StandZeile): StandMeta {
  return {
    id: zeile.id,
    dokumentId: zeile.dokument_id,
    name: zeile.name,
    bemerkung: zeile.bemerkung,
    formatVersion: zeile.format_version,
    groesse: zeile.groesse,
    erstelltAm: zeile.erstellt_am,
  }
}

export function listeStaende(db: DatabaseSync, dokumentId: string): StandMeta[] {
  return alleZeilen<StandZeile>(
    db.prepare(
      `SELECT ${SPALTEN} FROM dokument_staende WHERE dokument_id = ? ORDER BY erstellt_am DESC`,
    ),
    dokumentId,
  ).map(zuMeta)
}

export function holeStand(db: DatabaseSync, id: string): Stand | undefined {
  const zeile = eineZeile<StandZeile & { inhalt: string }>(
    db.prepare(`SELECT ${SPALTEN}, inhalt FROM dokument_staende WHERE id = ?`),
    id,
  )
  return zeile ? { ...zuMeta(zeile), inhalt: zeile.inhalt } : undefined
}

export class NichtsZuSichern extends Error {
  readonly text: ServerText

  constructor() {
    const text = serverText('server.dokumente.nichtsZuSichern')
    super(alsText(text, deutsch))
    this.text = text
    this.name = 'NichtsZuSichern'
  }
}

export function sichereStand(
  db: DatabaseSync,
  dokumentId: string,
  eingabe: StandEingabe,
): StandMeta {
  return inTransaktion(db, () => {
    const inhalt = eineZeile<{ format_version: number; inhalt: string | null }>(
      db.prepare('SELECT format_version, inhalt FROM dokument_inhalte WHERE dokument_id = ?'),
      dokumentId,
    )
    if (!inhalt?.inhalt) throw new NichtsZuSichern()

    const id = erzeugeId('stand')
    db.prepare(
      `INSERT INTO dokument_staende (id, dokument_id, name, bemerkung, format_version, inhalt, erstellt_am)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      dokumentId,
      eingabe.name,
      eingabe.bemerkung,
      inhalt.format_version,
      inhalt.inhalt,
      jetzt(),
    )
    synchronisiereReferenzen(db, 'stand', id, sammleAssetIdsAusText(inhalt.inhalt))

    return holeStandMeta(db, id) as StandMeta
  })
}

export function holeStandMeta(db: DatabaseSync, id: string): StandMeta | undefined {
  const zeile = eineZeile<StandZeile>(
    db.prepare(`SELECT ${SPALTEN} FROM dokument_staende WHERE id = ?`),
    id,
  )
  return zeile ? zuMeta(zeile) : undefined
}

export function loescheStand(db: DatabaseSync, id: string): { assets: string[] } | undefined {
  if (!holeStandMeta(db, id)) return undefined
  return inTransaktion(db, () => {
    entferneReferenzen(db, 'stand', [id])
    db.prepare('DELETE FROM dokument_staende WHERE id = ?').run(id)
    return { assets: entferneVerwaisteAssets(db) }
  })
}

export function groesseDerStaende(db: DatabaseSync, dokumentId: string): number {
  const zeile = eineZeile<{ summe: number | null }>(
    db.prepare(
      'SELECT SUM(LENGTH(CAST(inhalt AS BLOB))) AS summe FROM dokument_staende WHERE dokument_id = ?',
    ),
    dokumentId,
  )
  return zeile?.summe ?? 0
}
