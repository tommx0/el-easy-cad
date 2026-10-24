import type { CatalogComponent, Katalog } from '../document-model'
import { holeJson, sendeJson, optional } from './api-client'
import { holeAssetBlob, ladeAssetHoch } from './asset-client'
import type { KatalogStoreMitRegister } from './catalog-store'

export class HttpCatalogStore implements KatalogStoreMitRegister {
  getComponents(): Promise<CatalogComponent[]> {
    return holeJson<CatalogComponent[]>('/katalog')
  }

  getComponent(id: string): Promise<CatalogComponent | undefined> {
    return optional(() => holeJson<CatalogComponent>(`/katalog/${id}`))
  }

  async upsertComponent(c: CatalogComponent): Promise<void> {
    await sendeJson('PUT', `/katalog/${c.id}`, c)
  }

  async deleteComponent(id: string): Promise<void> {
    await sendeJson('DELETE', `/katalog/${id}`)
  }

  duplicate(id: string, zielKatalogId?: string): Promise<CatalogComponent> {
    return sendeJson<CatalogComponent>('POST', `/katalog/${id}/duplikat`, { zielKatalogId })
  }

  getKataloge(nurAktive = false): Promise<Katalog[]> {
    return holeJson<Katalog[]>(`/kataloge${nurAktive ? '?nurAktive=1' : ''}`)
  }

  async upsertKatalog(katalog: Katalog): Promise<void> {
    await sendeJson('PUT', `/kataloge/${katalog.id}`, katalog)
  }

  async deleteKatalog(id: string): Promise<number> {
    const antwort = await sendeJson<{ geloescht: boolean; komponenten: number }>(
      'DELETE',
      `/kataloge/${id}`,
    )
    return antwort.komponenten
  }

  async verschiebeKomponente(komponentenId: string, katalogId: string): Promise<void> {
    await sendeJson('POST', `/katalog/${komponentenId}/verschieben`, { katalogId })
  }

  putImageBlob(blob: Blob): Promise<string> {
    return ladeAssetHoch(blob)
  }

  getImageBlob(assetId: string): Promise<Blob | undefined> {
    return optional(() => holeAssetBlob(assetId))
  }

  async holeUmstellungsHinweis(): Promise<string[]> {
    return (await sendeJson<{ gesichert: string[] }>('POST', '/katalog/umstellungshinweis', {}))
      .gesichert
  }

  gruppen(): Promise<{ hauptgruppen: string[]; untergruppen: string[] }> {
    return holeJson('/katalog/gruppen')
  }

  suche(filter: {
    suche?: string
    hauptgruppe?: string
    untergruppe?: string
    katalogId?: string
    nurAktiveKataloge?: boolean
  }): Promise<CatalogComponent[]> {
    const abfrage = new URLSearchParams()
    if (filter.suche) abfrage.set('suche', filter.suche)
    if (filter.hauptgruppe) abfrage.set('hauptgruppe', filter.hauptgruppe)
    if (filter.untergruppe) abfrage.set('untergruppe', filter.untergruppe)
    if (filter.katalogId) abfrage.set('katalogId', filter.katalogId)
    if (filter.nurAktiveKataloge) abfrage.set('nurAktiveKataloge', '1')
    const text = abfrage.toString()
    return holeJson<CatalogComponent[]>(`/katalog${text ? `?${text}` : ''}`)
  }
}
