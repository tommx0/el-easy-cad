import type { CatalogComponent, Katalog, KatalogBild, Variant } from '../../document-model'
import { neueCatalogComponent, neueVariante } from '../../document-model'
import type { CatalogStore } from '../catalog-store'
import type { GrafikAufloesung, GrafikFeld, ImportDateien } from './dateien'
import { loeseGrafikAuf } from './dateien'
import type { KatalogExcelInhalt, KomponentenZeile, VariantenZeile } from './lesen'
import { artikelnummerSchluessel, gleicheArtikelnummer } from './lesen'
import { t } from '../../sprache'
import type { ImportVorschau, ImportVorschauZeile } from './vorschau'

interface GeplanteGrafik {
  feld: GrafikFeld
  varianteId?: string
  datei: Blob
}

interface GeplanteKomponente {
  komponente: CatalogComponent
  grafiken: GeplanteGrafik[]
}

export interface KatalogImportPlan extends ImportVorschau {
  komponenten: GeplanteKomponente[]
}

function mitWerten(basis: CatalogComponent, z: KomponentenZeile): CatalogComponent {
  const ergebnis: CatalogComponent = { ...basis, name: z.name }
  if (z.hersteller) ergebnis.hersteller = z.hersteller
  if (z.artikelnummer) ergebnis.artikelnummer = z.artikelnummer
  if (z.kategorie) ergebnis.kategorie = z.kategorie
  if (z.hauptgruppe) ergebnis.hauptgruppe = z.hauptgruppe
  if (z.untergruppe) ergebnis.untergruppe = z.untergruppe
  if (z.typ) ergebnis.typ = z.typ
  if (z.wattzahl !== null) ergebnis.wattzahl = z.wattzahl
  if (z.poeLeistungWatt !== null) ergebnis.poeLeistungWatt = z.poeLeistungWatt
  if (Object.keys(z.bemessung).length > 0)
    ergebnis.bemessung = { ...basis.bemessung, ...z.bemessung }
  ergebnis.technischeDaten = { ...basis.technischeDaten, ...z.technischeDaten }
  ergebnis.varianten = [...basis.varianten]
  if (z.englisch) {
    const en = { ...basis.uebersetzungen?.en, ...z.englisch }
    ergebnis.uebersetzungen = { ...basis.uebersetzungen, en }
  }
  return ergebnis
}

function mitAusfuehrungEnglisch(
  komponente: CatalogComponent,
  varianteId: string,
  farbe: string,
): CatalogComponent {
  const en = komponente.uebersetzungen?.en
  const varianten = { ...en?.varianten, [varianteId]: { ...en?.varianten?.[varianteId], farbe } }
  return {
    ...komponente,
    uebersetzungen: { ...komponente.uebersetzungen, en: { ...en, varianten } },
  }
}

function variantenMitWerten(basis: Variant, z: VariantenZeile): Variant {
  const ergebnis: Variant = { ...basis }
  if (z.farbe) ergebnis.farbe = z.farbe
  if (z.name) ergebnis.name = z.name
  if (z.artikelnummer) ergebnis.artikelnummer = z.artikelnummer
  if (Object.keys(z.bemessung).length > 0)
    ergebnis.bemessung = { ...basis.bemessung, ...z.bemessung }
  if (Object.keys(z.technischeDaten).length > 0) {
    ergebnis.technischeDaten = { ...basis.technischeDaten, ...z.technischeDaten }
  }
  return ergebnis
}

function fehlendeDateien(bild: GrafikAufloesung, symbol: GrafikAufloesung): string[] {
  const fehler: string[] = []
  if (bild.status.art === 'fehlt') {
    fehler.push(t('persistenz.katalogExcel.bilddateiFehlt', { name: bild.status.name }))
  }
  if (symbol.status.art === 'fehlt') {
    fehler.push(t('persistenz.katalogExcel.symboldateiFehlt', { name: symbol.status.name }))
  }
  return fehler
}

export function planeKatalogImport(
  inhalt: KatalogExcelInhalt,
  katalog: Katalog,
  bestehende: readonly CatalogComponent[],
  dateien: ImportDateien,
): KatalogImportPlan {
  const plan: KatalogImportPlan = { zeilen: [], dateiFehler: [...inhalt.fehler], komponenten: [] }
  if (inhalt.fehler.length > 0 && inhalt.komponenten.length === 0) return plan

  const imKatalog = bestehende.filter((c) => c.katalogId === katalog.id)
  const geplantJeNummer = new Map<string, GeplanteKomponente>()
  const fehlerhafteNummern = new Map<string, number>()

  for (const z of inhalt.komponenten) {
    const fehler = [...z.fehler]
    const vorhanden = z.artikelnummer
      ? imKatalog.find((c) => gleicheArtikelnummer(c.artikelnummer, z.artikelnummer))
      : undefined
    const bild = loeseGrafikAuf(dateien, 'komponenten', z.zeile, 'bild', z.bild, !!vorhanden?.bild)
    const symbol = loeseGrafikAuf(
      dateien,
      'komponenten',
      z.zeile,
      'symbol',
      z.symbol,
      !!vorhanden?.symbol,
    )
    fehler.push(...fehlendeDateien(bild, symbol))
    const hatGrafik = bild.datei || symbol.datei || vorhanden?.bild || vorhanden?.symbol
    if (fehler.length === 0 && !hatGrafik) {
      fehler.push(t('persistenz.katalogExcel.ohneGrafik'))
    }
    plan.zeilen.push({
      blatt: 'komponenten',
      zeile: z.zeile,
      bezeichnung: z.name,
      artikelnummer: z.artikelnummer,
      status: fehler.length > 0 ? 'fehler' : vorhanden ? 'aktualisiert' : 'neu',
      bild: bild.status,
      symbol: symbol.status,
      fehler,
      hinweise: [],
    })
    if (fehler.length > 0) {
      if (z.artikelnummer) fehlerhafteNummern.set(artikelnummerSchluessel(z.artikelnummer), z.zeile)
      continue
    }

    const basis =
      vorhanden ??
      neueCatalogComponent({
        name: z.name,
        katalogId: katalog.id,
        hersteller: katalog.hersteller,
      })
    const geplant: GeplanteKomponente = { komponente: mitWerten(basis, z), grafiken: [] }
    if (bild.datei) geplant.grafiken.push({ feld: 'bild', datei: bild.datei })
    if (symbol.datei) geplant.grafiken.push({ feld: 'symbol', datei: symbol.datei })
    plan.komponenten.push(geplant)
    if (z.artikelnummer) geplantJeNummer.set(artikelnummerSchluessel(z.artikelnummer), geplant)
  }

  for (const v of inhalt.varianten) {
    const fehler = [...v.fehler]
    const schluessel = v.komponente ? artikelnummerSchluessel(v.komponente) : ''
    let ziel = schluessel ? geplantJeNummer.get(schluessel) : undefined
    if (!ziel && schluessel && fehlerhafteNummern.has(schluessel)) {
      fehler.push(
        t('persistenz.katalogExcel.grundkomponenteFehlerhaft', {
          zeile: String(fehlerhafteNummern.get(schluessel)),
        }),
      )
    } else if (!ziel && schluessel) {
      const vorhanden = imKatalog.find((c) => gleicheArtikelnummer(c.artikelnummer, v.komponente))
      if (vorhanden) {
        ziel = { komponente: { ...vorhanden, varianten: [...vorhanden.varianten] }, grafiken: [] }
        plan.komponenten.push(ziel)
        geplantJeNummer.set(schluessel, ziel)
      } else {
        fehler.push(
          t('persistenz.katalogExcel.keineGrundkomponente', { artikelnummer: v.komponente }),
        )
      }
    }
    const vorhandeneVariante =
      ziel && v.artikelnummer
        ? ziel.komponente.varianten.find((x) =>
            gleicheArtikelnummer(x.artikelnummer, v.artikelnummer),
          )
        : undefined
    const bild = loeseGrafikAuf(
      dateien,
      'varianten',
      v.zeile,
      'bild',
      v.bild,
      !!vorhandeneVariante?.bild,
    )
    const symbol = loeseGrafikAuf(
      dateien,
      'varianten',
      v.zeile,
      'symbol',
      v.symbol,
      !!vorhandeneVariante?.symbol,
    )
    fehler.push(...fehlendeDateien(bild, symbol))
    const vorschauZeile: ImportVorschauZeile = {
      blatt: 'varianten',
      zeile: v.zeile,
      bezeichnung: [v.farbe, v.name].filter(Boolean).join(' – '),
      artikelnummer: v.artikelnummer,
      komponente: v.komponente,
      status: fehler.length > 0 ? 'fehler' : vorhandeneVariante ? 'aktualisiert' : 'neu',
      bild: bild.status,
      symbol: symbol.status,
      fehler,
      hinweise: [],
    }
    plan.zeilen.push(vorschauZeile)
    if (fehler.length > 0 || !ziel) continue

    const variante = variantenMitWerten(vorhandeneVariante ?? neueVariante(), v)
    const index = ziel.komponente.varianten.findIndex((x) => x.id === variante.id)
    if (index >= 0) ziel.komponente.varianten[index] = variante
    else ziel.komponente.varianten.push(variante)
    if (v.farbeEnglisch) {
      ziel.komponente = mitAusfuehrungEnglisch(ziel.komponente, variante.id, v.farbeEnglisch)
    }
    if (bild.datei) ziel.grafiken.push({ feld: 'bild', varianteId: variante.id, datei: bild.datei })
    if (symbol.datei) {
      ziel.grafiken.push({ feld: 'symbol', varianteId: variante.id, datei: symbol.datei })
    }
  }
  return plan
}

export interface KatalogImportErgebnisExcel {
  komponenten: number
  varianten: number
  grafiken: number
}

export async function fuehreKatalogImportAus(
  plan: KatalogImportPlan,
  store: CatalogStore,
): Promise<KatalogImportErgebnisExcel> {
  const assetJeDatei = new Map<Blob, string>()
  const assetFuer = async (datei: Blob) => {
    let assetId = assetJeDatei.get(datei)
    if (!assetId) {
      assetId = await store.putImageBlob(datei)
      assetJeDatei.set(datei, assetId)
    }
    return assetId
  }
  for (const { komponente, grafiken } of plan.komponenten) {
    const ergebnis: CatalogComponent = { ...komponente, varianten: [...komponente.varianten] }
    for (const grafik of grafiken) {
      const bild: KatalogBild = { typ: 'asset', assetId: await assetFuer(grafik.datei) }
      if (grafik.varianteId) {
        ergebnis.varianten = ergebnis.varianten.map((v) =>
          v.id === grafik.varianteId ? { ...v, [grafik.feld]: bild } : v,
        )
      } else {
        ergebnis[grafik.feld] = bild
      }
    }
    await store.upsertComponent(ergebnis)
  }
  const importiert = plan.zeilen.filter((z) => z.status !== 'fehler')
  return {
    komponenten: importiert.filter((z) => z.blatt === 'komponenten').length,
    varianten: importiert.filter((z) => z.blatt === 'varianten').length,
    grafiken: assetJeDatei.size,
  }
}
