import { unzipSync, zipSync } from 'fflate'
import type { DatabaseSync } from 'node:sqlite'
import type { DokumentMeta, GeloeschtesProjekt, Projekt, StandMeta } from '../../src/document-model'
import { errateMimeTyp, liesAssetDatei, schreibeAssetDatei } from '../assets/speicher'
import { holeAsset, legeAssetAn, sammleAssetIdsAusText, type AssetMeta } from '../db/assets'
import { alleZeilen, eineZeile } from '../db/hilfen'
import { alsText, deutsch, serverText, type ServerText } from '../sprache'

export const PAKET_VERSION = 1

export interface PaketDokument {
  meta: DokumentMeta
  inhalt: { formatVersion: number; inhalt: string | null; assetId: string | null } | null
  staende: (StandMeta & { inhalt: string })[]
}

export interface PaketInhalt {
  paketVersion: number
  erzeugtAm: string
  anwendung: string
  projekt: Projekt
  dokumente: PaketDokument[]
  assets: AssetMeta[]
}

const PROJEKT_DATEI = 'projekt.json'
const ASSET_ORDNER = 'assets/'

export const AUSTAUSCH_GROESSE_MAX = 500 * 1024 * 1024

export function projektPaketGroesse(db: DatabaseSync, projektId: string): number {
  let summe = 0
  for (const id of sammleAssetIds(sammleDokumente(db, projektId))) {
    summe += holeAsset(db, id)?.groesse ?? 0
  }
  return summe
}

export function packeProjekt(
  db: DatabaseSync,
  assetOrdner: string,
  projekt: Projekt | GeloeschtesProjekt,
): Uint8Array {
  const dokumente = sammleDokumente(db, projekt.id)
  const assetIds = sammleAssetIds(dokumente)
  const groesse = assetIds.reduce((summe, id) => summe + (holeAsset(db, id)?.groesse ?? 0), 0)
  if (groesse > AUSTAUSCH_GROESSE_MAX) {
    throw new PaketFehler(zuGrossText(groesse))
  }
  const assets: AssetMeta[] = []
  const dateien: Record<string, Uint8Array> = {}

  for (const id of assetIds) {
    const meta = holeAsset(db, id)
    const daten = liesAssetDatei(assetOrdner, id)
    if (meta) assets.push(meta)
    if (daten) dateien[`${ASSET_ORDNER}${id}`] = new Uint8Array(daten)
  }

  const inhalt: PaketInhalt = {
    paketVersion: PAKET_VERSION,
    erzeugtAm: new Date().toISOString(),
    anwendung: 'el.esy.CAD',
    projekt: { ...projekt },
    dokumente,
    assets,
  }
  dateien[PROJEKT_DATEI] = new TextEncoder().encode(JSON.stringify(inhalt, null, 2))

  return zipSync(dateien, { level: 0, mtime: new Date() })
}

export function zuGrossText(groesse: number): ServerText {
  const mb = (bytes: number) => Math.round(bytes / (1024 * 1024))
  return serverText('server.austausch.projektZuGross', {
    groesse: mb(groesse),
    hoechstens: mb(AUSTAUSCH_GROESSE_MAX),
  })
}

export class PaketFehler extends Error {
  readonly text: string | ServerText

  constructor(nachricht: string | ServerText) {
    super(alsText(nachricht, deutsch))
    this.name = 'PaketFehler'
    this.text = nachricht
  }
}

export interface EntpacktesPaket {
  inhalt: PaketInhalt
  assetDaten: Map<string, Uint8Array>
}

export function entpackeProjekt(bytes: Uint8Array): EntpacktesPaket {
  let dateien: Record<string, Uint8Array>
  try {
    dateien = unzipSync(bytes)
  } catch {
    throw new PaketFehler(serverText('server.austausch.keinProjektpaket'))
  }

  const projektDatei = dateien[PROJEKT_DATEI]
  if (!projektDatei) {
    throw new PaketFehler(serverText('server.austausch.dateiFehlt', { datei: PROJEKT_DATEI }))
  }

  let inhalt: PaketInhalt
  try {
    inhalt = JSON.parse(new TextDecoder().decode(projektDatei)) as PaketInhalt
  } catch {
    throw new PaketFehler(serverText('server.austausch.keinJson', { datei: PROJEKT_DATEI }))
  }
  if (!inhalt.projekt?.id || !Array.isArray(inhalt.dokumente)) {
    throw new PaketFehler(serverText('server.austausch.falscheForm', { datei: PROJEKT_DATEI }))
  }
  if (inhalt.paketVersion > PAKET_VERSION) {
    throw new PaketFehler(
      serverText('server.austausch.neuereVersion', { version: String(inhalt.paketVersion) }),
    )
  }

  const assetDaten = new Map<string, Uint8Array>()
  for (const [name, daten] of Object.entries(dateien)) {
    if (!name.startsWith(ASSET_ORDNER)) continue
    assetDaten.set(name.slice(ASSET_ORDNER.length), daten)
  }
  return { inhalt, assetDaten }
}

export function uebernimmAssets(
  db: DatabaseSync,
  assetOrdner: string,
  paket: { inhalt: { assets?: AssetMeta[] }; assetDaten: Map<string, Uint8Array> },
): number {
  const bekannteMeta = new Map((paket.inhalt.assets ?? []).map((meta) => [meta.id, meta]))
  let uebernommen = 0
  for (const [id, daten] of paket.assetDaten) {
    const puffer = Buffer.from(daten)
    const meta: AssetMeta = bekannteMeta.get(id) ?? {
      id,
      mime: errateMimeTyp(puffer),
      groesse: puffer.length,
      dateiname: null,
      erstelltAm: new Date().toISOString(),
    }
    const neu = schreibeAssetDatei(assetOrdner, id, puffer)
    legeAssetAn(db, meta)
    if (neu) uebernommen++
  }
  return uebernommen
}

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

function sammleDokumente(db: DatabaseSync, projektId: string): PaketDokument[] {
  const zeilen = alleZeilen<DokumentZeile>(
    db.prepare(
      `SELECT id, projekt_id, typ, name, reihenfolge, quelle_dokument_id, erstellt_am, geaendert_am
         FROM dokumente WHERE projekt_id = ? ORDER BY reihenfolge`,
    ),
    projektId,
  )

  return zeilen.map((zeile) => {
    const inhalt = eineZeile<{
      format_version: number
      inhalt: string | null
      asset_id: string | null
    }>(
      db.prepare(
        'SELECT format_version, inhalt, asset_id FROM dokument_inhalte WHERE dokument_id = ?',
      ),
      zeile.id,
    )

    const staende = alleZeilen<{
      id: string
      dokument_id: string
      name: string
      bemerkung: string | null
      format_version: number
      inhalt: string
      erstellt_am: string
    }>(
      db.prepare(
        `SELECT id, dokument_id, name, bemerkung, format_version, inhalt, erstellt_am
           FROM dokument_staende WHERE dokument_id = ? ORDER BY erstellt_am`,
      ),
      zeile.id,
    )

    return {
      meta: {
        id: zeile.id,
        projektId: zeile.projekt_id,
        typ: zeile.typ as DokumentMeta['typ'],
        name: zeile.name,
        reihenfolge: zeile.reihenfolge,
        quelleDokumentId: zeile.quelle_dokument_id,
        erstelltAm: zeile.erstellt_am,
        zuletztGeaendertAm: zeile.geaendert_am,
      },
      inhalt: inhalt
        ? {
            formatVersion: inhalt.format_version,
            inhalt: inhalt.inhalt,
            assetId: inhalt.asset_id,
          }
        : null,
      staende: staende.map((s) => ({
        id: s.id,
        dokumentId: s.dokument_id,
        name: s.name,
        bemerkung: s.bemerkung,
        formatVersion: s.format_version,
        groesse: Buffer.byteLength(s.inhalt),
        erstelltAm: s.erstellt_am,
        inhalt: s.inhalt,
      })),
    }
  })
}

function sammleAssetIds(dokumente: PaketDokument[]): string[] {
  const gefunden = new Set<string>()
  for (const dokument of dokumente) {
    if (dokument.inhalt?.assetId) gefunden.add(dokument.inhalt.assetId)
    for (const id of sammleAssetIdsAusText(dokument.inhalt?.inhalt ?? null)) gefunden.add(id)
    for (const stand of dokument.staende) {
      for (const id of sammleAssetIdsAusText(stand.inhalt)) gefunden.add(id)
    }
  }
  return [...gefunden]
}
