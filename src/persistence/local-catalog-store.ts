import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CatalogComponent } from '../document-model'
import { catalogComponentSchema, dupliziereCatalogComponent } from '../document-model'
import type { CatalogStore } from './catalog-store'
import { t } from '../sprache'

interface ElEasyCadKatalogDb extends DBSchema {
  components: { key: string; value: CatalogComponent }
  images: { key: string; value: Blob }
}

let dbPromise: Promise<IDBPDatabase<ElEasyCadKatalogDb>> | null = null

function getDb(): Promise<IDBPDatabase<ElEasyCadKatalogDb>> {
  if (!dbPromise) {
    dbPromise = openDB<ElEasyCadKatalogDb>('eleasycad-katalog', 1, {
      upgrade(db) {
        db.createObjectStore('components', { keyPath: 'id' })
        db.createObjectStore('images')
      },
    })
  }
  return dbPromise
}

function geparst(roh: unknown): CatalogComponent | null {
  const ergebnis = catalogComponentSchema.safeParse(roh)
  return ergebnis.success ? (ergebnis.data as CatalogComponent) : null
}

export class LocalCatalogStore implements CatalogStore {
  async getComponents(): Promise<CatalogComponent[]> {
    const db = await getDb()
    const alle = await db.getAll('components')
    return alle.map(geparst).filter((c): c is CatalogComponent => c !== null)
  }

  async getComponent(id: string): Promise<CatalogComponent | undefined> {
    const db = await getDb()
    const roh = await db.get('components', id)
    if (!roh) return undefined
    return geparst(roh) ?? undefined
  }

  async upsertComponent(c: CatalogComponent): Promise<void> {
    const db = await getDb()
    await db.put('components', c)
  }

  async deleteComponent(id: string): Promise<void> {
    const db = await getDb()
    const bestehend = await db.get('components', id)
    if (bestehend?.herkunft === 'standard') {
      throw new Error(t('server.katalog.loeschschutz', { name: bestehend.name }))
    }
    await db.delete('components', id)
  }

  async duplicate(id: string): Promise<CatalogComponent> {
    const original = await this.getComponent(id)
    if (!original) throw new Error(`Katalogkomponente ${id} nicht gefunden.`)
    const kopie = dupliziereCatalogComponent(original)
    await this.upsertComponent(kopie)
    return kopie
  }

  async putImageBlob(blob: Blob): Promise<string> {
    const db = await getDb()
    const assetId = crypto.randomUUID()
    await db.put('images', blob, assetId)
    return assetId
  }

  async getImageBlob(assetId: string): Promise<Blob | undefined> {
    const db = await getDb()
    return db.get('images', assetId)
  }
}
