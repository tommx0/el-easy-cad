import type { CatalogStore, KatalogStoreMitRegister } from './catalog-store'
import type {
  Bemessungswerte,
  CatalogComponent,
  Katalog,
  KatalogBild,
  Variant,
} from '../document-model'
import { KATALOG_EIGENE_ID, planeStandardAbgleich, SEED_VERSION_STANDARD } from '../document-model'
import { STANDARD_KATALOG_ROHDATEN } from './seed-data/standard-kataloge.generated'
import type {
  DockpunkteKonfiguration,
  Fangpunkt,
  KatalogTextElement,
  KomponentenTyp,
  Montageort,
  SlotMatrix,
  SlotVorlage,
} from '../document-model'

interface StandardVariante {
  id: string
  farbe_ausfuehrung?: string
  artikelnummer?: string
  bild_daten?: string
  bild_mime?: string
  symbol_svg?: string
  symbolFarbig?: boolean
  quelle?: string
  bemessung?: Bemessungswerte
}

interface StandardKomponente {
  id: string
  name: string
  kategorie?: string
  hersteller?: string
  artikelnummer?: string
  hauptgruppe?: string
  untergruppe?: string
  herkunft: 'standard'
  bild_daten?: string
  bild_mime?: string
  bild_svg?: string
  symbol_svg?: string
  symbolFarbig?: boolean
  stromverbrauch_watt_typisch?: number
  stromverbrauch_watt_max?: number
  poe_leistung_watt?: number
  technische_daten?: Record<string, unknown>
  uebersetzungen?: CatalogComponent['uebersetzungen']
  quelle?: string
  seed_version?: number
  modul_traeger?: { modul_system: string; spalten: number; zeilen: number }
  modul_system?: string
  dockpunkte?: DockpunkteKonfiguration
  fangpunkt?: Fangpunkt
  textElemente?: KatalogTextElement[]
  breitenFaktor?: number
  hoehenFaktor?: number
  kombinierbar?: boolean
  montageort?: Montageort
  bauart?: 'patchpanel' | 'verteiler'
  typ?: KomponentenTyp
  slotVorlagen?: SlotVorlage[]
  slotMatrixVorlage?: SlotMatrix
  slotAnzahlAus?: string
  ansteuerung?: string
  stromkreisVorgabe?: 'kein' | 'raum' | 'eigen'
  stromkreisPolzahl?: 1 | 3
  bemessung?: Bemessungswerte
  ifcKlasse?: string
  ifcTyp?: string
  ifcTypName?: string
  kennzeichenBuchstabe?: string
  betriebsmittelRolle?: 'spule' | 'kontaktblock'
  varianten?: StandardVariante[]
}

interface KatalogRoh {
  id: string
  name: string
  beschreibung?: string
  hersteller?: string
  sortierung?: number
  seed_version?: number
  uebersetzungen?: Katalog['uebersetzungen']
  ausgemustert?: boolean
}

interface StandardKatalogDaten {
  katalog: KatalogRoh
  komponenten: StandardKomponente[]
}

function flacheTechnischeDaten(daten: Record<string, unknown> | undefined): Record<string, string> {
  const ergebnis: Record<string, string> = {}
  if (!daten) return ergebnis
  for (const [schluessel, wert] of Object.entries(daten)) {
    if (wert && typeof wert === 'object' && !Array.isArray(wert)) {
      const teile = Object.entries(wert as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`)
      ergebnis[schluessel] = teile.join(', ')
    } else {
      ergebnis[schluessel] = String(wert)
    }
  }
  return ergebnis
}

function bytesAusBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binaer = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(binaer.length))
  for (let i = 0; i < binaer.length; i++) bytes[i] = binaer.charCodeAt(i)
  return bytes
}

async function bildAusEingebettetenDaten(
  store: CatalogStore,
  base64: string | undefined,
  mime: string | undefined,
): Promise<KatalogBild | undefined> {
  if (!base64) return undefined
  const assetId = await store.putImageBlob(
    new Blob([bytesAusBase64(base64)], { type: mime ?? 'application/octet-stream' }),
  )
  return { typ: 'asset', assetId }
}

async function bildAusSvg(store: CatalogStore, svg: string): Promise<KatalogBild> {
  const assetId = await store.putImageBlob(new Blob([svg], { type: 'image/svg+xml' }))
  return { typ: 'asset', assetId }
}

async function zuCatalogComponent(
  store: CatalogStore,
  roh: StandardKomponente,
  katalogId: string,
): Promise<CatalogComponent> {
  const technischeDaten = flacheTechnischeDaten(roh.technische_daten)
  if (roh.stromverbrauch_watt_typisch !== undefined) {
    technischeDaten['Stromverbrauch (typisch)'] = `${roh.stromverbrauch_watt_typisch} W`
  }
  if (roh.quelle) technischeDaten['Quelle'] = roh.quelle

  const varianten: Variant[] = await Promise.all(
    (roh.varianten ?? []).map(async (v) => ({
      id: v.id,
      farbe: v.farbe_ausfuehrung,
      artikelnummer: v.artikelnummer,
      bild: await bildAusEingebettetenDaten(store, v.bild_daten, v.bild_mime),
      symbol: v.symbol_svg !== undefined ? await bildAusSvg(store, v.symbol_svg) : undefined,
      symbolFarbig: v.symbolFarbig,
      technischeDaten: v.quelle ? { Quelle: v.quelle } : undefined,
      bemessung: v.bemessung,
    })),
  )

  const bild =
    (await bildAusEingebettetenDaten(store, roh.bild_daten, roh.bild_mime)) ??
    (roh.bild_svg !== undefined ? await bildAusSvg(store, roh.bild_svg) : undefined)
  const symbol = roh.symbol_svg !== undefined ? await bildAusSvg(store, roh.symbol_svg) : undefined
  if (!bild && !symbol) {
    throw new Error(
      `Seed-Komponente ${roh.id} hat weder Bild (bild_daten/bild_svg) noch symbol_svg.`,
    )
  }

  return {
    id: roh.id,
    katalogId,
    name: roh.name,
    ...(roh.uebersetzungen ? { uebersetzungen: roh.uebersetzungen } : {}),
    bild,
    symbol,
    symbolFarbig: roh.symbolFarbig,
    hersteller: roh.hersteller,
    artikelnummer: roh.artikelnummer,
    wattzahl: roh.stromverbrauch_watt_max ?? roh.stromverbrauch_watt_typisch,
    poeLeistungWatt: roh.poe_leistung_watt,
    kategorie: roh.kategorie,
    hauptgruppe: roh.hauptgruppe,
    untergruppe: roh.untergruppe,
    technischeDaten,
    herkunft: 'standard',
    varianten,
    dockpunkte: roh.dockpunkte,
    fangpunkt: roh.fangpunkt,
    textElemente: roh.textElemente,
    breitenFaktor: roh.breitenFaktor,
    hoehenFaktor: roh.hoehenFaktor,
    kombinierbar: roh.kombinierbar,
    montageort: roh.montageort,
    bauart: roh.bauart,
    typ: roh.typ,
    slotVorlagen: roh.slotVorlagen,
    slotMatrixVorlage: roh.slotMatrixVorlage,
    slotAnzahlAus: roh.slotAnzahlAus,
    ansteuerung: roh.ansteuerung,
    stromkreisVorgabe: roh.stromkreisVorgabe,
    stromkreisPolzahl: roh.stromkreisPolzahl,
    bemessung: roh.bemessung,
    ifcKlasse: roh.ifcKlasse,
    ifcTyp: roh.ifcTyp,
    ifcTypName: roh.ifcTypName,
    kennzeichenBuchstabe: roh.kennzeichenBuchstabe,
    betriebsmittelRolle: roh.betriebsmittelRolle,
    seedVersion: roh.seed_version ?? SEED_VERSION_STANDARD,
    modulTraeger: roh.modul_traeger
      ? {
          modulSystem: roh.modul_traeger.modul_system,
          spalten: roh.modul_traeger.spalten,
          zeilen: roh.modul_traeger.zeilen,
        }
      : undefined,
    modulSystem: roh.modul_system,
  }
}

export async function seedKatalogRegister(
  store: KatalogStoreMitRegister,
  rohdaten: readonly unknown[] = STANDARD_KATALOG_ROHDATEN,
): Promise<void> {
  const alleDaten = rohdaten as unknown as StandardKatalogDaten[]

  const vorhandeneKataloge = new Map((await store.getKataloge()).map((k) => [k.id, k]))
  const vorhandene = await store.getComponents()
  const nachId = new Map(vorhandene.map((k) => [k.id, k]))
  for (const daten of alleDaten) {
    const katalog = zuKatalog(daten.katalog)
    const plan = planeStandardAbgleich(
      vorhandeneKataloge.get(katalog.id),
      vorhandene,
      katalog,
      daten.komponenten.map((roh) => ({ id: roh.id, seedVersion: roh.seed_version })),
    )
    await schreibeKatalogFallsNoetig(store, vorhandeneKataloge.get(katalog.id), katalog)
    const zuSchreiben = new Set([...plan.anlegen, ...plan.ersetzen])
    const behalten = new Set(plan.behalten)
    for (const roh of daten.komponenten) {
      if (zuSchreiben.has(roh.id)) {
        await store.upsertComponent(await zuCatalogComponent(store, roh, katalog.id))
      } else if (behalten.has(roh.id)) {
        await ordneKatalogZu(store, nachId.get(roh.id)!, katalog.id)
      }
    }
    for (const id of plan.ausmustern) {
      await store.upsertComponent({ ...nachId.get(id)!, ausgemustert: true })
    }
  }
  await schreibeKatalogFallsNoetig(
    store,
    vorhandeneKataloge.get(KATALOG_EIGENE_ID),
    EIGENE_KOMPONENTEN_KATALOG,
  )
}

const EIGENE_KOMPONENTEN_KATALOG: Katalog = {
  id: KATALOG_EIGENE_ID,
  name: 'Eigene Komponenten',
  beschreibung: 'Selbst angelegte Komponenten und Duplikate.',
  herkunft: 'standard',
  aktiv: true,
  sortierung: 100,
  seedVersion: SEED_VERSION_STANDARD,
}

function zuKatalog(roh: KatalogRoh): Katalog {
  return {
    id: roh.id,
    name: roh.name,
    beschreibung: roh.beschreibung,
    ...(roh.uebersetzungen ? { uebersetzungen: roh.uebersetzungen } : {}),
    hersteller: roh.hersteller,
    herkunft: 'standard',
    aktiv: true,
    sortierung: roh.sortierung,
    seedVersion: roh.seed_version ?? SEED_VERSION_STANDARD,
    ...(roh.ausgemustert ? { ausgemustert: true } : {}),
  }
}

async function schreibeKatalogFallsNoetig(
  store: KatalogStoreMitRegister,
  vorhanden: Katalog | undefined,
  neu: Katalog,
): Promise<void> {
  if (!vorhanden) {
    if (!neu.ausgemustert) await store.upsertKatalog(neu)
    return
  }
  if (vorhanden.herkunft !== 'standard') return
  const alteVersion = vorhanden.seedVersion ?? SEED_VERSION_STANDARD
  const neueVersion = neu.seedVersion ?? SEED_VERSION_STANDARD
  if (neueVersion <= alteVersion) return
  await store.upsertKatalog({ ...neu, aktiv: vorhanden.aktiv })
}

async function ordneKatalogZu(
  store: CatalogStore,
  vorhanden: CatalogComponent,
  katalogId: string,
): Promise<void> {
  if (vorhanden.katalogId !== katalogId) await store.upsertComponent({ ...vorhanden, katalogId })
}

export async function erzeugeStandardKomponenten(store: CatalogStore): Promise<CatalogComponent[]> {
  const alleDaten = STANDARD_KATALOG_ROHDATEN as unknown as StandardKatalogDaten[]
  const ergebnis: CatalogComponent[] = []
  for (const daten of alleDaten) {
    for (const roh of daten.komponenten) {
      ergebnis.push(await zuCatalogComponent(store, roh, daten.katalog.id))
    }
  }
  return ergebnis
}
