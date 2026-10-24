import type { DatabaseSync } from 'node:sqlite'
import {
  erzeugeId,
  type GeloeschtesProjekt,
  type Projekt,
  type ProjektEingabe,
  type ProjektFilter,
  type ProjektUebersicht,
} from '../../src/document-model'
import { entferneReferenzen, entferneVerwaisteAssets } from './assets'
import { inTransaktion } from './datenbank'
import { alleZeilen, ausSqlBoolean, eineZeile, jetzt, zuSqlBoolean } from './hilfen'

interface ProjektZeile {
  id: string
  kunde: string
  bezeichnung: string
  projektnummer: string | null
  notiz: string | null
  status: string
  archiviert: number
  geloescht_am: string | null
  erstellt_am: string
  geaendert_am: string
}

const SPALTEN = `id, kunde, bezeichnung, projektnummer, notiz, status, archiviert,
                 geloescht_am, erstellt_am, geaendert_am`

function zuProjekt(zeile: ProjektZeile): Projekt {
  return {
    id: zeile.id,
    kunde: zeile.kunde,
    bezeichnung: zeile.bezeichnung,
    projektnummer: zeile.projektnummer,
    notiz: zeile.notiz,
    status: zeile.status as Projekt['status'],
    archiviert: ausSqlBoolean(zeile.archiviert),
    erstelltAm: zeile.erstellt_am,
    zuletztGeaendertAm: zeile.geaendert_am,
  }
}

export function listeProjekte(db: DatabaseSync, filter: ProjektFilter): ProjektUebersicht[] {
  const bedingungen = ['p.geloescht_am IS NULL']
  const werte: (string | number)[] = []

  if (filter.status) {
    bedingungen.push('p.status = ?')
    werte.push(filter.status)
  }
  if (filter.archiviert !== 'alle') {
    bedingungen.push('p.archiviert = ?')
    werte.push(zuSqlBoolean(filter.archiviert))
  }
  if (filter.suche) {
    bedingungen.push('(p.kunde LIKE ? OR p.bezeichnung LIKE ? OR p.projektnummer LIKE ?)')
    const muster = `%${filter.suche}%`
    werte.push(muster, muster, muster)
  }

  const zeilen = alleZeilen<ProjektZeile & { anzahl_dokumente: number }>(
    db.prepare(
      `SELECT ${SPALTEN},
              (SELECT COUNT(*) FROM dokumente d WHERE d.projekt_id = p.id) AS anzahl_dokumente
         FROM projekte p
        WHERE ${bedingungen.join(' AND ')}
        ORDER BY p.kunde COLLATE NOCASE, p.bezeichnung COLLATE NOCASE`,
    ),
    ...werte,
  )

  return zeilen.map((zeile) => ({ ...zuProjekt(zeile), anzahlDokumente: zeile.anzahl_dokumente }))
}

export function holeProjekt(db: DatabaseSync, id: string): Projekt | undefined {
  const zeile = eineZeile<ProjektZeile>(
    db.prepare(`SELECT ${SPALTEN} FROM projekte WHERE id = ? AND geloescht_am IS NULL`),
    id,
  )
  return zeile ? zuProjekt(zeile) : undefined
}

export function legeProjektAn(db: DatabaseSync, eingabe: ProjektEingabe): Projekt {
  const id = erzeugeId('projekt')
  const zeitpunkt = jetzt()
  db.prepare(
    `INSERT INTO projekte (id, kunde, bezeichnung, projektnummer, notiz, status, archiviert,
                           erstellt_am, geaendert_am)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    eingabe.kunde,
    eingabe.bezeichnung,
    eingabe.projektnummer,
    eingabe.notiz,
    eingabe.status,
    zuSqlBoolean(eingabe.archiviert),
    zeitpunkt,
    zeitpunkt,
  )
  return holeProjekt(db, id) as Projekt
}

export function aendereProjekt(
  db: DatabaseSync,
  id: string,
  eingabe: ProjektEingabe,
): Projekt | undefined {
  const ergebnis = db
    .prepare(
      `UPDATE projekte
          SET kunde = ?, bezeichnung = ?, projektnummer = ?, notiz = ?, status = ?,
              archiviert = ?, geaendert_am = ?
        WHERE id = ? AND geloescht_am IS NULL`,
    )
    .run(
      eingabe.kunde,
      eingabe.bezeichnung,
      eingabe.projektnummer,
      eingabe.notiz,
      eingabe.status,
      zuSqlBoolean(eingabe.archiviert),
      jetzt(),
      id,
    )
  if (ergebnis.changes === 0) return undefined
  return holeProjekt(db, id)
}

export function verschiebeInPapierkorb(db: DatabaseSync, id: string): boolean {
  const ergebnis = db
    .prepare('UPDATE projekte SET geloescht_am = ? WHERE id = ? AND geloescht_am IS NULL')
    .run(jetzt(), id)
  return ergebnis.changes > 0
}

export function listePapierkorb(db: DatabaseSync): GeloeschtesProjekt[] {
  const zeilen = alleZeilen<ProjektZeile>(
    db.prepare(
      `SELECT ${SPALTEN} FROM projekte
        WHERE geloescht_am IS NOT NULL
        ORDER BY geloescht_am DESC`,
    ),
  )
  return zeilen.map((zeile) => ({
    ...zuProjekt(zeile),
    geloeschtAm: zeile.geloescht_am as string,
  }))
}

export function stelleWiederHer(db: DatabaseSync, id: string): Projekt | undefined {
  const ergebnis = db
    .prepare('UPDATE projekte SET geloescht_am = NULL WHERE id = ? AND geloescht_am IS NOT NULL')
    .run(id)
  if (ergebnis.changes === 0) return undefined
  return holeProjekt(db, id)
}

export interface LoeschErgebnis {
  dokumente: number
  assets: string[]
}

export function loescheEndgueltig(db: DatabaseSync, id: string): LoeschErgebnis | undefined {
  const vorhanden = db.prepare('SELECT 1 FROM projekte WHERE id = ?').get(id)
  if (!vorhanden) return undefined

  return inTransaktion(db, () => {
    const dokumentIds = alleZeilen<{ id: string }>(
      db.prepare('SELECT id FROM dokumente WHERE projekt_id = ?'),
      id,
    ).map((z) => z.id)
    const standIds = alleZeilen<{ id: string }>(
      db.prepare(
        `SELECT s.id FROM dokument_staende s
           JOIN dokumente d ON d.id = s.dokument_id
          WHERE d.projekt_id = ?`,
      ),
      id,
    ).map((z) => z.id)

    entferneReferenzen(db, 'dokument', dokumentIds)
    entferneReferenzen(db, 'stand', standIds)
    db.prepare('DELETE FROM projekte WHERE id = ?').run(id)

    return { dokumente: dokumentIds.length, assets: entferneVerwaisteAssets(db) }
  })
}

export function kundenNamen(db: DatabaseSync): string[] {
  const zeilen = alleZeilen<{ kunde: string }>(
    db.prepare(
      `SELECT DISTINCT kunde FROM projekte
        WHERE geloescht_am IS NULL AND kunde <> ''
        ORDER BY kunde COLLATE NOCASE`,
    ),
  )
  return zeilen.map((z) => z.kunde)
}
