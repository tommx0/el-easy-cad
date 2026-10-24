import type { CatalogComponent, Katalog } from '../document-model'

export interface CatalogStore {
  getComponents(): Promise<CatalogComponent[]>
  getComponent(id: string): Promise<CatalogComponent | undefined>
  upsertComponent(c: CatalogComponent): Promise<void>
  deleteComponent(id: string): Promise<void>
  duplicate(id: string, zielKatalogId?: string): Promise<CatalogComponent>
  putImageBlob(blob: Blob): Promise<string>
  getImageBlob(assetId: string): Promise<Blob | undefined>
}

export interface KatalogRegisterStore {
  getKataloge(): Promise<Katalog[]>
  upsertKatalog(katalog: Katalog): Promise<void>
  deleteKatalog(id: string): Promise<number>
  verschiebeKomponente(komponentenId: string, katalogId: string): Promise<void>
}

export type KatalogStoreMitRegister = CatalogStore & KatalogRegisterStore
