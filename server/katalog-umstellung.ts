import type { DatabaseSync } from 'node:sqlite'
import {
  dupliziereCatalogComponent,
  KATALOG_EIGENE_ID,
  normierteKomponente,
  SEED_VERSION_STANDARD,
  type CatalogComponent,
} from '../src/document-model'
import { erzeugeStandardKomponenten } from '../src/persistence/catalog-seed'
import { inTransaktion } from './db/datenbank'
import { leseAlle, schreibe, SqliteCatalogStore } from './db/katalog'
import { alleZeilen, eineZeile, jetzt } from './db/hilfen'

const MERKER = 'merker.katalog-standardschutz'

interface MerkerWert {
  erledigtAm: string
  gesichert: string[]
  gemeldet: boolean
}

function leseMerker(db: DatabaseSync): MerkerWert | undefined {
  const zeile = eineZeile<{ wert: string }>(
    db.prepare('SELECT wert FROM einstellungen WHERE schluessel = ?'),
    MERKER,
  )
  if (!zeile) return undefined
  try {
    return JSON.parse(zeile.wert) as MerkerWert
  } catch {
    return { erledigtAm: '', gesichert: [], gemeldet: true }
  }
}

function schreibeMerker(db: DatabaseSync, wert: MerkerWert): void {
  db.prepare(
    `INSERT INTO einstellungen (schluessel, wert) VALUES (?, ?)
       ON CONFLICT (schluessel) DO UPDATE SET wert = excluded.wert`,
  ).run(MERKER, JSON.stringify(wert))
}

interface Umzug {
  id: string
  varianten: Map<string, string>
}

export interface UmstellungsErgebnis {
  gelaufen: boolean
  gesichert: string[]
  dokumente: number
}

export async function stelleAufStandardschutzUm(
  db: DatabaseSync,
  assetOrdner: string,
): Promise<UmstellungsErgebnis> {
  if (leseMerker(db)) return { gelaufen: false, gesichert: [], dokumente: 0 }

  const vorhanden = new Map(leseAlle(db).map((k) => [k.id, k]))
  const geaendert: { gespeichert: CatalogComponent; mitgeliefert: CatalogComponent }[] = []
  if ([...vorhanden.values()].some((k) => k.herkunft === 'standard')) {
    const store = new SqliteCatalogStore(db, assetOrdner)
    for (const mitgeliefert of await erzeugeStandardKomponenten(store)) {
      const gespeichert = vorhanden.get(mitgeliefert.id)
      if (!gespeichert || gespeichert.herkunft !== 'standard') continue
      const version = (k: CatalogComponent) => k.seedVersion ?? SEED_VERSION_STANDARD
      if (version(gespeichert) !== version(mitgeliefert)) continue
      const vergleich = { ...gespeichert, katalogId: mitgeliefert.katalogId }
      if (normierteKomponente(vergleich) !== normierteKomponente(mitgeliefert)) {
        geaendert.push({ gespeichert, mitgeliefert })
      }
    }
  }

  return inTransaktion(db, () => {
    const umzuege = new Map<string, Umzug>()
    for (const { gespeichert, mitgeliefert } of geaendert) {
      const kopie = dupliziereCatalogComponent(gespeichert, gespeichert.name, KATALOG_EIGENE_ID)
      schreibe(db, kopie)
      schreibe(db, mitgeliefert)
      umzuege.set(gespeichert.id, {
        id: kopie.id,
        varianten: new Map(gespeichert.varianten.map((v, i) => [v.id, kopie.varianten[i].id])),
      })
    }
    const dokumente = umzuege.size > 0 ? haengeInstanzenUm(db, umzuege) : 0
    const gesichert = geaendert.map((g) => g.gespeichert.name)
    schreibeMerker(db, { erledigtAm: jetzt(), gesichert, gemeldet: gesichert.length === 0 })
    return { gelaufen: true, gesichert, dokumente }
  })
}

export function holeUmstellungsHinweis(db: DatabaseSync): string[] {
  const merker = leseMerker(db)
  if (!merker || merker.gemeldet) return []
  schreibeMerker(db, { ...merker, gemeldet: true })
  return merker.gesichert
}

function haengeInstanzenUm(db: DatabaseSync, umzuege: ReadonlyMap<string, Umzug>): number {
  let anzahl = 0
  const inhalte = alleZeilen<{ dokument_id: string; inhalt: string }>(
    db.prepare(
      `SELECT i.dokument_id, i.inhalt FROM dokument_inhalte i
         JOIN dokumente d ON d.id = i.dokument_id
        WHERE d.typ = 'zeichnung' AND i.inhalt IS NOT NULL`,
    ),
  )
  for (const zeile of inhalte) {
    const neu = umgehaengt(zeile.inhalt, umzuege)
    if (neu === null) continue
    db.prepare(
      'UPDATE dokument_inhalte SET inhalt = ?, version = version + 1 WHERE dokument_id = ?',
    ).run(neu, zeile.dokument_id)
    anzahl++
  }
  const staende = alleZeilen<{ id: string; inhalt: string }>(
    db.prepare(
      `SELECT s.id, s.inhalt FROM dokument_staende s
         JOIN dokumente d ON d.id = s.dokument_id
        WHERE d.typ = 'zeichnung'`,
    ),
  )
  for (const zeile of staende) {
    const neu = umgehaengt(zeile.inhalt, umzuege)
    if (neu === null) continue
    db.prepare('UPDATE dokument_staende SET inhalt = ? WHERE id = ?').run(neu, zeile.id)
    anzahl++
  }
  return anzahl
}

function umgehaengt(inhalt: string, umzuege: ReadonlyMap<string, Umzug>): string | null {
  let daten: unknown
  try {
    daten = JSON.parse(inhalt)
  } catch {
    return null
  }
  let geaendert = false
  const besuche = (wert: unknown): void => {
    if (Array.isArray(wert)) {
      wert.forEach(besuche)
      return
    }
    if (!wert || typeof wert !== 'object') return
    const objekt = wert as Record<string, unknown>
    if (objekt.type === 'komponente' && typeof objekt.catalogComponentId === 'string') {
      const umzug = umzuege.get(objekt.catalogComponentId)
      if (umzug) {
        objekt.catalogComponentId = umzug.id
        if (typeof objekt.variantId === 'string') {
          objekt.variantId = umzug.varianten.get(objekt.variantId) ?? objekt.variantId
        }
        geaendert = true
      }
    }
    Object.values(objekt).forEach(besuche)
  }
  besuche(daten)
  return geaendert ? JSON.stringify(daten) : null
}
