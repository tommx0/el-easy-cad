import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ElEasyCadFileHandle } from './file-system-access'

export interface ZuletztGeoeffnetEintrag {
  id: string
  name: string
  zuletztGeoeffnet: string
  handle?: ElEasyCadFileHandle
}

interface ElEasyCadDb extends DBSchema {
  'zuletzt-geoeffnet': {
    key: string
    value: ZuletztGeoeffnetEintrag
  }
}

let dbPromise: Promise<IDBPDatabase<ElEasyCadDb>> | null = null

function getDb(): Promise<IDBPDatabase<ElEasyCadDb>> {
  if (!dbPromise) {
    dbPromise = openDB<ElEasyCadDb>('eleasycad-dateien', 1, {
      upgrade(db) {
        db.createObjectStore('zuletzt-geoeffnet', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

const MAX_GESPEICHERTE_EINTRAEGE = 20

export async function merkeDatei(eintrag: ZuletztGeoeffnetEintrag): Promise<void> {
  const db = await getDb()
  await db.put('zuletzt-geoeffnet', eintrag)

  const alle = await db.getAll('zuletzt-geoeffnet')
  if (alle.length <= MAX_GESPEICHERTE_EINTRAEGE) return
  const ueberzaehlige = alle
    .sort((a, b) => b.zuletztGeoeffnet.localeCompare(a.zuletztGeoeffnet))
    .slice(MAX_GESPEICHERTE_EINTRAEGE)
  await Promise.all(ueberzaehlige.map((e) => db.delete('zuletzt-geoeffnet', e.id)))
}

export async function holeZuletztGeoeffnet(limit = 10): Promise<ZuletztGeoeffnetEintrag[]> {
  const db = await getDb()
  const alle = await db.getAll('zuletzt-geoeffnet')
  return alle.sort((a, b) => b.zuletztGeoeffnet.localeCompare(a.zuletztGeoeffnet)).slice(0, limit)
}

export async function holeDateiEintrag(id: string): Promise<ZuletztGeoeffnetEintrag | undefined> {
  const db = await getDb()
  return db.get('zuletzt-geoeffnet', id)
}
