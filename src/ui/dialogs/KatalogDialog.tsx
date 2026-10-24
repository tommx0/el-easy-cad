import { useCallback, useMemo, useRef, useState } from 'react'
import type {
  CatalogComponent,
  Katalog,
  KatalogBild,
  KomponentenTyp,
  Montageort,
  SlotMatrix,
  SlotVorlage,
  Variant,
} from '../../document-model'
import {
  KATALOG_EIGENE_ID,
  symbolSvgIstFarbig,
  typHatAnsteuerung,
  typHatSlotMatrix,
  typHatSlots,
  waehlbareAnsteuerungen,
  waehlbareTypen,
  waehleKomponentenGrafik,
  ermittleSlotVorlagenPosition,
  erzeugeSlotVorlage,
  neueCatalogComponent,
  neuerKatalog,
  neueVariante,
  normalisiereSlotMatrix,
  IFC_TYP_EIGENER,
  katalogText,
  komponentenText,
  sichtbareKataloge,
  sichtbareKomponenten,
  uebersetzteKomponente,
} from '../../document-model'
import type { ImportDateien, KatalogExcelInhalt, KatalogImportPlan } from '../../persistence'
import {
  erzeugeMusterZip,
  fuehreKatalogImportAus,
  MUSTER_ZIP_NAME,
  planeKatalogImport,
  speichereDatei,
  starteServerDownload,
} from '../../persistence'
import { KatalogExcelImportDialog } from '../katalog-excel/KatalogExcelImportDialog'
import { importiereKatalogMitRueckfrage } from '../katalog-import'
import { bibliothekHerunterladen, waehleUndOeffneBibliothek } from '../bibliothek-import'
import { useAktivesBlatt, useAppContext } from '../use-app-context'
import { useKatalogStore, zaehleJeKatalog } from '../store/katalog-store'
import { useUiStore } from '../store/ui-store'
import { useKatalogBildUrl } from '../use-katalog-bild-url'
import { useSymbolSvg } from '../use-symbol-svg'
import { SymbolZeichnerDialog } from '../symbol-zeichner/SymbolZeichnerDialog'
import type { SymbolVorlage } from '../symbol-zeichner/vorlage-einbetten'
import {
  bemessungAusEntwurf,
  bemessungEntwurf,
  BREITENFAKTOR_MAX,
  BREITENFAKTOR_MIN,
  breitenFaktorAusEingabe,
  hoehenFaktorAusEingabe,
  LEERE_BEMESSUNG,
  leererEntwurf,
  serializeTechDaten,
  type Entwurf,
  type VariantEntwurf,
} from './katalog-entwurf'
import { passtZurKatalogSuche } from './katalog-suche'
import { kategorieOptionenFuerKatalog } from './picker-kategorien'
import { MAX_SLOT_MATRIX_ZEILEN } from './SlotMatrixDialog'
import { IfcZuordnungFelder } from './IfcZuordnungFelder'
import { BemessungFelder } from './BemessungFelder'
import { SymbolUndAnschluesse } from '../katalog-grafik/SymbolUndAnschluesse'
import { useSprache, useT } from '../sprache-anbindung'
import { ansteuerungAnzeige, typAnzeige } from '../regelwerk-anzeige'
import type { Texte } from '../../sprache'

function entwurfAus(c: CatalogComponent): Entwurf {
  return {
    id: c.id,
    katalogId: c.katalogId,
    name: c.name,
    herkunft: c.herkunft,
    bildAssetId: c.bild?.assetId ?? null,
    symbolAssetId: c.symbol?.assetId ?? null,
    hersteller: c.hersteller ?? '',
    artikelnummer: c.artikelnummer ?? '',
    wattzahl: c.wattzahl !== undefined ? String(c.wattzahl) : '',
    poeLeistungWatt: c.poeLeistungWatt !== undefined ? String(c.poeLeistungWatt) : '',
    bemessung: bemessungEntwurf(c.bemessung),
    kategorie: c.kategorie ?? '',
    typ: c.typ ?? '',
    ansteuerung: c.ansteuerung ?? '',
    stromkreisVorgabe: c.stromkreisVorgabe ?? '',
    stromkreisPolzahl: c.stromkreisPolzahl ?? 1,
    ifcKlasse: c.ifcKlasse ?? '',
    ifcTyp: c.ifcKlasse ? (c.ifcTyp ?? '') : '',
    ifcTypName: c.ifcKlasse && c.ifcTyp === IFC_TYP_EIGENER ? (c.ifcTypName ?? '') : '',
    slotVorlagen: c.slotVorlagen ?? [],
    slotMatrixSpalten: c.slotMatrixVorlage
      ? (String(c.slotMatrixVorlage.spalten) as '1' | '2')
      : '',
    slotMatrixZeilen: c.slotMatrixVorlage ? String(c.slotMatrixVorlage.zeilen) : '1',
    slotMatrixZeilenSpalten: (c.slotMatrixVorlage?.zeilenSpalten ?? []).map(
      (s) => String(s) as '1' | '2',
    ),
    hauptgruppe: c.hauptgruppe ?? '',
    untergruppe: c.untergruppe ?? '',
    technischeDatenText: serializeTechDaten(c.technischeDaten),
    varianten: c.varianten.map((v) => ({
      id: v.id,
      name: v.name ?? '',
      farbe: v.farbe ?? '',
      artikelnummer: v.artikelnummer ?? '',
      bemessung: bemessungEntwurf(v.bemessung),
      bildAssetId: v.bild?.assetId ?? null,
      symbolAssetId: v.symbol?.assetId ?? null,
    })),
    breitenFaktor: c.breitenFaktor !== undefined ? String(c.breitenFaktor) : '',
    hoehenFaktor: c.hoehenFaktor !== undefined ? String(c.hoehenFaktor) : '',
    kombinierbar: c.kombinierbar !== false,
    montageort: c.montageort ?? 'wand',
    dockpunkte: c.dockpunkte,
    fangpunkt: c.fangpunkt,
    textElemente: c.textElemente ?? [],
    kennzeichenBuchstabe: c.kennzeichenBuchstabe ?? '',
    betriebsmittelRolle: c.betriebsmittelRolle ?? '',
    bauart: c.bauart ?? '',
  }
}

function slotVorlagenZumSpeichern(entwurf: Entwurf): SlotVorlage[] | undefined {
  if (entwurf.typ && !typHatSlots(entwurf.typ)) return undefined
  const bereinigt = entwurf.slotVorlagen
    .map((v) => ({ id: v.id, bezeichnung: v.bezeichnung.trim() }))
    .filter((v) => v.bezeichnung)
  return bereinigt.length > 0 ? bereinigt : undefined
}

function slotMatrixVorlageZumSpeichern(entwurf: Entwurf): SlotMatrix | undefined {
  if (!typHatSlotMatrix(entwurf.typ) || !entwurf.slotMatrixSpalten) return undefined
  const zeilen = Math.max(
    1,
    Math.min(MAX_SLOT_MATRIX_ZEILEN, Number(entwurf.slotMatrixZeilen) || 1),
  )
  const spalten = Number(entwurf.slotMatrixSpalten) as 1 | 2
  const zeilenSpalten = entwurf.slotMatrixZeilenSpalten
    .slice(0, zeilen)
    .map((w) => (w ? (Number(w) as 1 | 2) : spalten))
  return normalisiereSlotMatrix({ spalten, zeilen, zeilenSpalten })
}

function parseTechDaten(text: string): Record<string, string> {
  const ergebnis: Record<string, string> = {}
  for (const zeile of text.split('\n')) {
    const idx = zeile.indexOf(':')
    if (idx === -1) continue
    const schluessel = zeile.slice(0, idx).trim()
    const wert = zeile.slice(idx + 1).trim()
    if (schluessel) ergebnis[schluessel] = wert
  }
  return ergebnis
}

export function KatalogDialog() {
  const offen = useUiStore((s) => s.katalogDialogOffen)
  const alleKomponenten = useKatalogStore((s) => s.komponenten)
  const alleKataloge = useKatalogStore((s) => s.kataloge)
  const kataloge = useMemo(() => sichtbareKataloge(alleKataloge), [alleKataloge])
  const komponenten = useMemo(
    () => sichtbareKomponenten(alleKomponenten, alleKataloge).filter((k) => !k.knxAktor),
    [alleKomponenten, alleKataloge],
  )
  const { catalogStore } = useAppContext()
  const t = useT()
  const sprache = useSprache()
  const [suchtext, setSuchtext] = useState('')
  const [kategorieFilter, setKategorieFilter] = useState('')
  const [katalogFilter, setKatalogFilter] = useState('')
  const [ansicht, setAnsicht] = useState<'liste' | 'formular'>('liste')
  const [entwurf, setEntwurf] = useState<Entwurf>(leererEntwurf(KATALOG_EIGENE_ID))
  const [speichertGerade, setSpeichertGerade] = useState(false)
  const farbigeSymbole = useRef(new Set<string>())
  const [bildUploads, setBildUploads] = useState(0)
  const bildLaedt = bildUploads > 0
  const [zeichner, setZeichner] = useState<ZeichnerAufruf | null>(null)
  const hauptSymbol = useSymbolSvg(entwurf.symbolAssetId, catalogStore)

  const anzahlJeKatalog = useMemo(() => zaehleJeKatalog(komponenten), [komponenten])
  const gewaehlterKatalog = kataloge.find((k) => k.id === katalogFilter) ?? null
  const [excelImportOffen, setExcelImportOffen] = useState(false)
  const planeExcelImport = useCallback(
    (inhalt: KatalogExcelInhalt, dateien: ImportDateien): KatalogImportPlan =>
      planeKatalogImport(inhalt, gewaehlterKatalog!, alleKomponenten, dateien),
    [gewaehlterKatalog, alleKomponenten],
  )
  const zielKatalogId =
    gewaehlterKatalog?.herkunft === 'benutzer' ? gewaehlterKatalog.id : KATALOG_EIGENE_ID

  const kategorien = useMemo(
    () =>
      Array.from(
        new Set(komponenten.map((k) => k.kategorie).filter((k): k is string => !!k)),
      ).sort(),
    [komponenten],
  )

  const filterKategorien = useMemo(
    () => kategorieOptionenFuerKatalog(komponenten, katalogFilter, new Set(), sprache),
    [komponenten, katalogFilter, sprache],
  )
  const wirksameKategorie = filterKategorien.some((k) => k.wert === kategorieFilter)
    ? kategorieFilter
    : ''

  const hauptgruppen = useMemo(
    () =>
      Array.from(
        new Set(komponenten.map((k) => k.hauptgruppe).filter((k): k is string => !!k)),
      ).sort(),
    [komponenten],
  )

  const untergruppen = useMemo(
    () =>
      Array.from(
        new Set(komponenten.map((k) => k.untergruppe).filter((k): k is string => !!k)),
      ).sort(),
    [komponenten],
  )

  const gefiltert = useMemo(() => {
    return komponenten.filter((k) => {
      if (katalogFilter && k.katalogId !== katalogFilter) return false
      if (wirksameKategorie && k.kategorie !== wirksameKategorie) return false
      return passtZurKatalogSuche(k, suchtext)
    })
  }, [komponenten, suchtext, wirksameKategorie, katalogFilter])

  if (!offen) return null

  async function symbolZeichnen(
    ziel: GrafikZiel,
    eigenes: { svg: string | null; gezeichnet: boolean },
  ) {
    const variante =
      ziel.art === 'variante' ? entwurf.varianten.find((v) => v.id === ziel.id) : null
    const kandidaten: { name: string; assetId: string | null; vorausgewaehlt?: boolean }[] =
      variante
        ? [
            {
              name: t('katalogdialoge.katalogDialog.vorlageSymbolVariante'),
              assetId: variante.symbolAssetId,
              vorausgewaehlt: !eigenes.gezeichnet,
            },
            {
              name: t('katalogdialoge.katalogDialog.vorlageSymbolHaupt'),
              assetId: entwurf.symbolAssetId,
            },
            {
              name: t('katalogdialoge.katalogDialog.vorlageBildVariante'),
              assetId: variante.bildAssetId,
            },
            {
              name: t('katalogdialoge.katalogDialog.grafik.produktbild.titel'),
              assetId: entwurf.bildAssetId,
            },
          ]
        : [
            {
              name: t('katalogdialoge.katalogDialog.vorlageBisherigesSymbol'),
              assetId: entwurf.symbolAssetId,
              vorausgewaehlt: !eigenes.gezeichnet,
            },
            {
              name: t('katalogdialoge.katalogDialog.grafik.produktbild.titel'),
              assetId: entwurf.bildAssetId,
            },
          ]
    const vorlagen: SymbolVorlage[] = []
    const gesehen = new Set<string>()
    try {
      for (const k of kandidaten) {
        const istEigenesGezeichnet =
          eigenes.gezeichnet &&
          k.assetId === (variante ? variante.symbolAssetId : entwurf.symbolAssetId)
        if (!k.assetId || gesehen.has(k.assetId) || istEigenesGezeichnet) continue
        gesehen.add(k.assetId)
        const blob = await catalogStore.getImageBlob(k.assetId)
        if (!blob) continue
        vorlagen.push({
          name: k.name,
          url: URL.createObjectURL(blob),
          vorausgewaehlt: k.vorausgewaehlt,
        })
      }
    } catch (fehler) {
      meldeFehler(fehler)
    }
    const anfangsSvg =
      variante && !variante.symbolAssetId && hauptSymbol.gezeichnet
        ? hauptSymbol.svg
        : eigenes.gezeichnet
          ? eigenes.svg
          : null
    setZeichner({ ziel, anfangsSvg, vorlagen })
  }

  function zeichnerSchliessen() {
    for (const v of zeichner?.vorlagen ?? []) URL.revokeObjectURL(v.url)
    setZeichner(null)
  }

  function zeichnungUebernehmen(svg: string) {
    const ziel = zeichner?.ziel
    zeichnerSchliessen()
    if (!ziel) return
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    if (ziel.art === 'haupt') void bildHochladen(blob, 'symbolAssetId')
    else void varianteBildHochladen(ziel.id, blob, 'symbolAssetId')
  }

  function schliessen() {
    useUiStore.getState().setKatalogDialogOffen(false)
    setAnsicht('liste')
  }

  async function neuLaden() {
    await useKatalogStore.getState().laden(catalogStore)
  }

  function meldeFehler(fehler: unknown) {
    useUiStore
      .getState()
      .zeigeToast(
        fehler instanceof Error ? fehler.message : t('katalogdialoge.gemeinsam.unbekannterFehler'),
      )
  }

  async function duplizieren(id: string) {
    try {
      await catalogStore.duplicate(id, zielKatalogId)
      await neuLaden()
      useUiStore.getState().zeigeToast(t('katalogdialoge.katalogDialog.dupliziert'))
    } catch (fehler) {
      meldeFehler(fehler)
    }
  }

  async function loeschen(id: string) {
    try {
      await catalogStore.deleteComponent(id)
      await neuLaden()
      useUiStore.getState().zeigeToast(t('katalogdialoge.katalogDialog.geloescht'))
    } catch (fehler) {
      meldeFehler(fehler)
    }
  }

  function bearbeiten(k: CatalogComponent) {
    setEntwurf(entwurfAus(k.herkunft === 'standard' ? uebersetzteKomponente(k, sprache) : k))
    setAnsicht('formular')
  }

  async function alsEigeneBearbeiten() {
    if (!entwurf.id) return
    try {
      const kopie = await catalogStore.duplicate(entwurf.id, zielKatalogId)
      await neuLaden()
      setEntwurf(entwurfAus(kopie))
      useUiStore.getState().zeigeToast(t('katalogdialoge.katalogDialog.alsEigeneAngelegt'))
    } catch (fehler) {
      meldeFehler(fehler)
    }
  }

  function neuAnlegen() {
    setEntwurf(leererEntwurf(zielKatalogId))
    setAnsicht('formular')
  }

  async function verschieben(id: string, katalogId: string) {
    try {
      await catalogStore.verschiebeKomponente(id, katalogId)
      await neuLaden()
      useUiStore.getState().zeigeToast(t('katalogdialoge.katalogDialog.verschoben'))
    } catch (fehler) {
      meldeFehler(fehler)
    }
  }

  function katalogAnlegen() {
    useUiStore.getState().oeffneEingabeDialog(
      {
        titel: t('katalogdialoge.katalogDialog.neuerKatalog'),
        label: t('katalogdialoge.katalogDialog.name'),
      },
      (wert) => {
        const name = wert?.trim()
        if (!name) return
        const katalog = neuerKatalog({ name })
        void catalogStore
          .upsertKatalog(katalog)
          .then(neuLaden)
          .then(() => setKatalogFilter(katalog.id))
          .catch(meldeFehler)
      },
    )
  }

  function katalogUmbenennen(katalog: Katalog) {
    useUiStore.getState().oeffneEingabeDialog(
      {
        titel: t('katalogdialoge.katalogDialog.katalogUmbenennen'),
        label: t('katalogdialoge.katalogDialog.name'),
        anfangswert: katalog.name,
      },
      (wert) => {
        const name = wert?.trim()
        if (!name || name === katalog.name) return
        void catalogStore
          .upsertKatalog({ ...katalog, name })
          .then(neuLaden)
          .catch(meldeFehler)
      },
    )
  }

  async function katalogAktivSchalten(katalog: Katalog) {
    try {
      await catalogStore.upsertKatalog({ ...katalog, aktiv: !katalog.aktiv })
      await neuLaden()
    } catch (fehler) {
      meldeFehler(fehler)
    }
  }

  function katalogLoeschen(katalog: Katalog) {
    const anzahl = anzahlJeKatalog.get(katalog.id) ?? 0
    useUiStore.getState().oeffneBestaetigung({
      titel: t('katalogdialoge.katalogDialog.katalogLoeschenTitel'),
      nachricht:
        anzahl === 0
          ? t('katalogdialoge.katalogDialog.katalogLoeschenLeer', {
              name: katalogText(katalog, 'name', sprache),
            })
          : t('katalogdialoge.katalogDialog.katalogLoeschenMitKomponenten', {
              name: katalogText(katalog, 'name', sprache),
              n: anzahl,
            }),
      callback: (bestaetigt) => {
        if (!bestaetigt) return
        void catalogStore
          .deleteKatalog(katalog.id)
          .then(neuLaden)
          .then(() => {
            setKatalogFilter('')
            useUiStore.getState().zeigeToast(t('katalogdialoge.katalogDialog.katalogGeloescht'))
          })
          .catch(meldeFehler)
      },
    })
  }

  function katalogExportieren(katalog: Katalog) {
    void starteServerDownload(`/export/katalog/${katalog.id}`).catch(meldeFehler)
  }

  async function excelImportieren(plan: KatalogImportPlan): Promise<string> {
    const ergebnis = await fuehreKatalogImportAus(plan, catalogStore)
    await neuLaden()
    return t('katalogdialoge.katalogDialog.excelErgebnis', {
      komponenten: ergebnis.komponenten,
      varianten: ergebnis.varianten,
      grafiken: ergebnis.grafiken,
    })
  }

  async function excelMusterHerunterladen() {
    await speichereDatei(await erzeugeMusterZip(), MUSTER_ZIP_NAME, {
      beschreibung: t('katalogdialoge.katalogDialog.zipArchiv'),
      erweiterungen: ['zip'],
    })
  }

  async function katalogImportieren() {
    await importiereKatalogMitRueckfrage(catalogStore, (ergebnis) =>
      setKatalogFilter(ergebnis.katalogId),
    )
  }

  async function merkeSymbolFarbe(datei: Blob, assetId: string) {
    if (datei.type !== 'image/svg+xml') return
    if (symbolSvgIstFarbig(await datei.text())) farbigeSymbole.current.add(assetId)
  }

  function symbolFarbigFuer(
    assetId: string | null,
    bisher: { symbol?: KatalogBild; symbolFarbig?: boolean } | undefined,
  ): true | undefined {
    if (!assetId) return undefined
    if (farbigeSymbole.current.has(assetId)) return true
    return bisher?.symbol?.assetId === assetId && bisher.symbolFarbig ? true : undefined
  }

  async function bildHochladen(datei: Blob, feld: GrafikFeld) {
    setBildUploads((n) => n + 1)
    try {
      const assetId = await catalogStore.putImageBlob(datei)
      if (feld === 'symbolAssetId') await merkeSymbolFarbe(datei, assetId)
      setEntwurf((e) => ({ ...e, [feld]: assetId }))
    } catch (fehler) {
      meldeFehler(fehler)
    } finally {
      setBildUploads((n) => n - 1)
    }
  }

  async function varianteBildHochladen(id: string, datei: Blob, feld: GrafikFeld) {
    setBildUploads((n) => n + 1)
    try {
      const assetId = await catalogStore.putImageBlob(datei)
      if (feld === 'symbolAssetId') await merkeSymbolFarbe(datei, assetId)
      varianteAendern(id, { [feld]: assetId })
    } catch (fehler) {
      meldeFehler(fehler)
    } finally {
      setBildUploads((n) => n - 1)
    }
  }

  async function speichern() {
    if (!entwurf.name.trim()) {
      useUiStore.getState().zeigeToast(t('katalogdialoge.katalogDialog.namePflicht'))
      return
    }
    if (!entwurf.bildAssetId && !entwurf.symbolAssetId) {
      useUiStore.getState().zeigeToast(t('katalogdialoge.katalogDialog.grafikPflicht'))
      return
    }
    const bemessung = bemessungAusEntwurf(entwurf.bemessung)
    const variantenBemessung = entwurf.varianten.map((v) => bemessungAusEntwurf(v.bemessung))
    const bemessungsFehler =
      bemessung.fehler ??
      variantenBemessung
        .map(
          (b, i) =>
            b.fehler &&
            t('katalogdialoge.katalogDialog.varianteFehler', { nummer: i + 1, fehler: b.fehler }),
        )
        .find(Boolean)
    if (bemessungsFehler) {
      useUiStore.getState().zeigeToast(bemessungsFehler)
      return
    }
    const original = entwurf.id ? alleKomponenten.find((k) => k.id === entwurf.id) : undefined
    const varianten: Variant[] = entwurf.varianten.map((v, i) => ({
      id: v.id,
      name: v.name.trim() || undefined,
      farbe: v.farbe.trim() || undefined,
      artikelnummer: v.artikelnummer.trim() || undefined,
      bild: alsKatalogBild(v.bildAssetId),
      symbol: alsKatalogBild(v.symbolAssetId),
      symbolFarbig: symbolFarbigFuer(
        v.symbolAssetId,
        original?.varianten.find((ov) => ov.id === v.id),
      ),
      bemessung: variantenBemessung[i].bemessung,
    }))
    const basisFelder = {
      katalogId: entwurf.katalogId,
      name: entwurf.name.trim(),
      bild: alsKatalogBild(entwurf.bildAssetId),
      symbol: alsKatalogBild(entwurf.symbolAssetId),
      symbolFarbig: symbolFarbigFuer(entwurf.symbolAssetId, original),
      hersteller: entwurf.hersteller.trim() || undefined,
      artikelnummer: entwurf.artikelnummer.trim() || undefined,
      wattzahl: entwurf.wattzahl.trim() ? Number(entwurf.wattzahl) : undefined,
      poeLeistungWatt: entwurf.poeLeistungWatt.trim() ? Number(entwurf.poeLeistungWatt) : undefined,
      bemessung: bemessung.bemessung,
      kategorie: entwurf.kategorie.trim() || undefined,
      typ: entwurf.typ || undefined,
      ansteuerung:
        entwurf.typ && typHatAnsteuerung(entwurf.typ) && entwurf.ansteuerung
          ? entwurf.ansteuerung
          : undefined,
      stromkreisVorgabe: entwurf.stromkreisVorgabe || undefined,
      stromkreisPolzahl:
        entwurf.stromkreisVorgabe === 'eigen' && entwurf.stromkreisPolzahl === 3
          ? (3 as const)
          : undefined,
      ifcKlasse: entwurf.ifcKlasse || undefined,
      ifcTyp: (entwurf.ifcKlasse && entwurf.ifcTyp) || undefined,
      ifcTypName:
        (entwurf.ifcKlasse && entwurf.ifcTyp === IFC_TYP_EIGENER && entwurf.ifcTypName.trim()) ||
        undefined,
      slotVorlagen: slotVorlagenZumSpeichern(entwurf),
      slotMatrixVorlage: slotMatrixVorlageZumSpeichern(entwurf),
      hauptgruppe: entwurf.hauptgruppe.trim() || undefined,
      untergruppe: entwurf.untergruppe.trim() || undefined,
      technischeDaten: parseTechDaten(entwurf.technischeDatenText),
      varianten,
      breitenFaktor: breitenFaktorAusEingabe(entwurf.breitenFaktor),
      hoehenFaktor: hoehenFaktorAusEingabe(entwurf.hoehenFaktor),
      kombinierbar: entwurf.kombinierbar ? undefined : false,
      montageort: entwurf.montageort === 'wand' ? undefined : entwurf.montageort,
      dockpunkte: entwurf.dockpunkte,
      fangpunkt: entwurf.fangpunkt,
      textElemente: entwurf.textElemente.length > 0 ? entwurf.textElemente : undefined,
      kennzeichenBuchstabe: entwurf.kennzeichenBuchstabe.trim() || undefined,
      betriebsmittelRolle: entwurf.betriebsmittelRolle || undefined,
      bauart: entwurf.bauart || undefined,
    }
    const komponente: CatalogComponent = entwurf.id
      ? { ...original, ...basisFelder, id: entwurf.id, herkunft: entwurf.herkunft }
      : neueCatalogComponent(basisFelder)
    setSpeichertGerade(true)
    try {
      await catalogStore.upsertComponent(komponente)
      await neuLaden()
      setAnsicht('liste')
      useUiStore.getState().zeigeToast(t('katalogdialoge.katalogDialog.gespeichert'))
    } catch (fehler) {
      meldeFehler(fehler)
    } finally {
      setSpeichertGerade(false)
    }
  }

  function varianteHinzufuegen() {
    setEntwurf((e) => ({
      ...e,
      varianten: [
        ...e.varianten,
        {
          id: neueVariante().id,
          name: '',
          farbe: '',
          artikelnummer: '',
          bemessung: LEERE_BEMESSUNG,
          bildAssetId: null,
          symbolAssetId: null,
        },
      ],
    }))
  }

  function varianteAendern(id: string, patch: Partial<VariantEntwurf>) {
    setEntwurf((e) => ({
      ...e,
      varianten: e.varianten.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }))
  }

  function varianteEntfernen(id: string) {
    setEntwurf((e) => ({ ...e, varianten: e.varianten.filter((v) => v.id !== id) }))
  }

  function typAendern(typ: KomponentenTyp | '') {
    setEntwurf((e) => ({
      ...e,
      typ,
      slotVorlagen: typ && !typHatSlots(typ) ? [] : e.slotVorlagen,
      slotMatrixSpalten: typHatSlotMatrix(typ) ? e.slotMatrixSpalten : '',
      slotMatrixZeilenSpalten: typHatSlotMatrix(typ) ? e.slotMatrixZeilenSpalten : [],
    }))
  }

  function kennzeichenBuchstabeAendern(wert: string) {
    setEntwurf((e) => ({
      ...e,
      kennzeichenBuchstabe: wert,
      betriebsmittelRolle: wert.trim().toUpperCase() === 'K' ? e.betriebsmittelRolle : '',
    }))
  }

  function slotVorlageHinzufuegen() {
    setEntwurf((e) => ({ ...e, slotVorlagen: [...e.slotVorlagen, erzeugeSlotVorlage()] }))
  }

  function slotVorlageAendern(id: string, bezeichnung: string) {
    setEntwurf((e) => ({
      ...e,
      slotVorlagen: e.slotVorlagen.map((v) => (v.id === id ? { ...v, bezeichnung } : v)),
    }))
  }

  function slotVorlageEntfernen(id: string) {
    setEntwurf((e) => ({ ...e, slotVorlagen: e.slotVorlagen.filter((v) => v.id !== id) }))
  }

  function slotVorlageVerschieben(index: number, richtung: -1 | 1) {
    setEntwurf((e) => {
      const ziel = index + richtung
      if (ziel < 0 || ziel >= e.slotVorlagen.length) return e
      const slotVorlagen = [...e.slotVorlagen]
      const [verschoben] = slotVorlagen.splice(index, 1)
      slotVorlagen.splice(ziel, 0, verschoben)
      return { ...e, slotVorlagen }
    })
  }

  function zeilenSpalteAendern(zeile0: number, wert: '' | '1' | '2') {
    setEntwurf((s) => {
      const arr = [...s.slotMatrixZeilenSpalten]
      while (arr.length <= zeile0) arr.push('')
      arr[zeile0] = wert
      return { ...s, slotMatrixZeilenSpalten: arr }
    })
  }

  const slotMatrixFuerVorlagenAnzeige = slotMatrixVorlageZumSpeichern(entwurf)
  const slotMatrixZeilenAnzahl = Math.max(
    1,
    Math.min(MAX_SLOT_MATRIX_ZEILEN, Number(entwurf.slotMatrixZeilen) || 1),
  )

  const nurAnsicht = entwurf.herkunft === 'standard'
  const abgeleitetVon = entwurf.id
    ? alleKomponenten.find((k) => k.id === entwurf.id)?.abgeleitetVon
    : undefined
  const abgeleitetVonKomponente = abgeleitetVon
    ? alleKomponenten.find((k) => k.id === abgeleitetVon.id)
    : undefined
  const abgeleitetVonName = abgeleitetVon
    ? abgeleitetVonKomponente
      ? komponentenText(abgeleitetVonKomponente, 'name', sprache)
      : abgeleitetVon.id
    : undefined
  const keineAenderung = () => {}

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-katalog" onMouseDown={(e) => e.stopPropagation()}>
        {ansicht === 'liste' ? (
          <>
            <h2>{t('katalogdialoge.katalogDialog.titel')}</h2>
            <div className="katalog-zweispaltig">
              <aside className="katalog-register">
                <div className="katalog-register-kopf">
                  <span>{t('katalogdialoge.katalogDialog.kataloge')}</span>
                  <button
                    type="button"
                    onClick={katalogAnlegen}
                    title={t('katalogdialoge.katalogDialog.katalogAnlegenTitel')}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={`katalog-register-eintrag${katalogFilter === '' ? ' ausgewaehlt' : ''}`}
                  onClick={() => setKatalogFilter('')}
                >
                  <span className="katalog-register-name">
                    {t('katalogdialoge.gemeinsam.alleKataloge')}
                  </span>
                  <span className="katalog-register-anzahl">{komponenten.length}</span>
                </button>
                {kataloge.map((katalog) => (
                  <button
                    key={katalog.id}
                    type="button"
                    className={
                      `katalog-register-eintrag` +
                      (katalogFilter === katalog.id ? ' ausgewaehlt' : '') +
                      (katalog.aktiv ? '' : ' inaktiv')
                    }
                    onClick={() => setKatalogFilter(katalog.id)}
                    title={katalogText(katalog, 'beschreibung', sprache) || undefined}
                  >
                    <span className="katalog-register-name">
                      {katalogText(katalog, 'name', sprache)}
                    </span>
                    <span className="katalog-register-anzahl">
                      {anzahlJeKatalog.get(katalog.id) ?? 0}
                    </span>
                  </button>
                ))}
                <div className="katalog-register-aktionen">
                  {gewaehlterKatalog ? (
                    <>
                      <label className="katalog-register-aktiv">
                        <input
                          type="checkbox"
                          checked={gewaehlterKatalog.aktiv}
                          onChange={() => void katalogAktivSchalten(gewaehlterKatalog)}
                        />
                        {t('katalogdialoge.katalogDialog.aktivSichtbar')}
                      </label>
                      <button
                        type="button"
                        disabled={gewaehlterKatalog.herkunft === 'standard'}
                        title={
                          gewaehlterKatalog.herkunft === 'standard'
                            ? t('katalogdialoge.katalogDialog.mitgeliefertSchreibgeschuetzt')
                            : undefined
                        }
                        onClick={() => katalogUmbenennen(gewaehlterKatalog)}
                      >
                        {t('katalogdialoge.katalogDialog.umbenennen')}
                      </button>
                      <button type="button" onClick={() => katalogExportieren(gewaehlterKatalog)}>
                        {t('katalogdialoge.katalogDialog.exportieren')}
                      </button>
                      <button
                        type="button"
                        disabled={gewaehlterKatalog.herkunft === 'standard'}
                        title={
                          gewaehlterKatalog.herkunft === 'standard'
                            ? t('katalogdialoge.katalogDialog.excelNichtMitgeliefert')
                            : t('katalogdialoge.katalogDialog.excelTitel')
                        }
                        onClick={() => setExcelImportOffen(true)}
                      >
                        {t('katalogdialoge.katalogDialog.ausExcel')}
                      </button>
                      <button
                        type="button"
                        disabled={gewaehlterKatalog.herkunft === 'standard'}
                        title={
                          gewaehlterKatalog.herkunft === 'standard'
                            ? t('katalogdialoge.katalogDialog.nurDeaktivieren')
                            : undefined
                        }
                        onClick={() => katalogLoeschen(gewaehlterKatalog)}
                      >
                        {t('katalogdialoge.gemeinsam.loeschen')}
                      </button>
                    </>
                  ) : (
                    <p className="dialog-hinweis">
                      {t('katalogdialoge.katalogDialog.katalogWaehlen')}
                    </p>
                  )}
                  <button type="button" onClick={() => void katalogImportieren()}>
                    {t('katalogdialoge.katalogDialog.katalogImportieren')}
                  </button>
                  <button type="button" onClick={bibliothekHerunterladen}>
                    {t('katalogdialoge.katalogDialog.bibliothekExportieren')}
                  </button>
                  <button type="button" onClick={() => void waehleUndOeffneBibliothek()}>
                    {t('katalogdialoge.katalogDialog.bibliothekImportieren')}
                  </button>
                  {excelImportOffen && gewaehlterKatalog && (
                    <KatalogExcelImportDialog
                      zielName={katalogText(gewaehlterKatalog, 'name', sprache)}
                      plane={planeExcelImport}
                      importieren={excelImportieren}
                      musterHerunterladen={excelMusterHerunterladen}
                      onFertig={(meldung) => {
                        setExcelImportOffen(false)
                        useUiStore.getState().zeigeToast(meldung)
                      }}
                      onSchliessen={() => setExcelImportOffen(false)}
                    />
                  )}
                </div>
              </aside>
              <div className="katalog-inhalt">
                <div className="katalog-filterzeile">
                  <input
                    className="katalog-suche"
                    placeholder={t('katalogdialoge.gemeinsam.suche')}
                    value={suchtext}
                    onChange={(e) => setSuchtext(e.target.value)}
                  />
                  <select
                    value={wirksameKategorie}
                    onChange={(e) => setKategorieFilter(e.target.value)}
                  >
                    <option value="">{t('katalogdialoge.gemeinsam.alleKategorien')}</option>
                    {filterKategorien.map((k) => (
                      <option key={k.wert} value={k.wert}>
                        {k.text}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="primaer" onClick={neuAnlegen}>
                    {t('katalogdialoge.katalogDialog.neueKomponenteKnopf')}
                  </button>
                </div>
                <div className="katalog-grid">
                  {gefiltert.length === 0 && (
                    <p className="dialog-hinweis">
                      {t('katalogdialoge.gemeinsam.keineKomponenten')}
                    </p>
                  )}
                  {gefiltert.map((k) => (
                    <KatalogListenEintrag
                      key={k.id}
                      komponente={k}
                      kataloge={kataloge}
                      onBearbeiten={() => bearbeiten(k)}
                      onDuplizieren={() => void duplizieren(k.id)}
                      onLoeschen={() => void loeschen(k.id)}
                      onVerschieben={(katalogId) => void verschieben(k.id, katalogId)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="dialog-aktionen">
              <button type="button" className="primaer" onClick={schliessen}>
                {t('katalogdialoge.gemeinsam.schliessen')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>
              {nurAnsicht
                ? t('katalogdialoge.katalogDialog.komponenteAnsehen')
                : entwurf.id
                  ? t('katalogdialoge.katalogDialog.komponenteBearbeiten')
                  : t('katalogdialoge.katalogDialog.neueKomponente')}
              {nurAnsicht && (
                <span className="katalog-badge katalog-badge-standard">
                  {t('katalogdialoge.gemeinsam.standard')}
                </span>
              )}
            </h2>
            {nurAnsicht && (
              <p className="dialog-hinweis">
                {t('katalogdialoge.katalogDialog.nurAnsichtHinweis')}
              </p>
            )}
            {abgeleitetVonName && (
              <p className="dialog-hinweis">
                {t('katalogdialoge.katalogDialog.abgeleitetVon', { name: abgeleitetVonName })}
              </p>
            )}
            <fieldset className="katalog-formular" disabled={nurAnsicht}>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.namePflichtLabel')}
                <input
                  value={entwurf.name}
                  onChange={(e) => setEntwurf((s) => ({ ...s, name: e.target.value }))}
                />
              </label>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.hersteller')}
                <input
                  value={entwurf.hersteller}
                  onChange={(e) => setEntwurf((s) => ({ ...s, hersteller: e.target.value }))}
                />
              </label>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.artikelnummer')}
                <input
                  value={entwurf.artikelnummer}
                  onChange={(e) => setEntwurf((s) => ({ ...s, artikelnummer: e.target.value }))}
                />
              </label>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.stromverbrauch')}
                <input
                  type="number"
                  min={0}
                  value={entwurf.wattzahl}
                  onChange={(e) => setEntwurf((s) => ({ ...s, wattzahl: e.target.value }))}
                />
              </label>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.poeLeistung')}
                <input
                  type="number"
                  min={0}
                  value={entwurf.poeLeistungWatt}
                  onChange={(e) => setEntwurf((s) => ({ ...s, poeLeistungWatt: e.target.value }))}
                />
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.poeHinweis')}
                </span>
              </label>
              <div className="dialog-feld">
                {t('katalogdialoge.katalogDialog.bemessungswerte')}
                <BemessungFelder
                  wert={entwurf.bemessung}
                  onAendern={(bemessung) => setEntwurf((s) => ({ ...s, bemessung }))}
                />
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.bemessungHinweis')}
                </span>
              </div>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.kategorie')}
                <input
                  list="katalog-kategorien"
                  value={entwurf.kategorie}
                  onChange={(e) => setEntwurf((s) => ({ ...s, kategorie: e.target.value }))}
                />
                <datalist id="katalog-kategorien">
                  {kategorien.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
              </label>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.typ')}
                <select
                  value={entwurf.typ}
                  onChange={(e) => typAendern(e.target.value as KomponentenTyp | '')}
                >
                  <option value="">{t('katalogdialoge.katalogDialog.keinTyp')}</option>
                  {waehlbareTypen(entwurf.typ || undefined).map((typ) => (
                    <option key={typ.kennung} value={typ.kennung}>
                      {typAnzeige(typ.kennung, sprache)}
                    </option>
                  ))}
                </select>
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.typHinweis')}
                </span>
              </label>

              {entwurf.typ && typHatAnsteuerung(entwurf.typ) && (
                <label className="dialog-feld">
                  {t('katalogdialoge.katalogDialog.ansteuerung')}
                  <select
                    value={entwurf.ansteuerung}
                    onChange={(e) => setEntwurf((s) => ({ ...s, ansteuerung: e.target.value }))}
                  >
                    <option value="">{t('katalogdialoge.katalogDialog.keineVorbelegung')}</option>
                    {waehlbareAnsteuerungen(entwurf.ansteuerung || undefined).map((a) => (
                      <option key={a.kennung} value={a.kennung}>
                        {ansteuerungAnzeige(a.kennung, sprache)}
                      </option>
                    ))}
                  </select>
                  <span className="dialog-hinweis">
                    {t('katalogdialoge.katalogDialog.ansteuerungHinweis')}
                  </span>
                </label>
              )}

              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.stromkreis')}
                <select
                  value={entwurf.stromkreisVorgabe}
                  onChange={(e) =>
                    setEntwurf((s) => ({
                      ...s,
                      stromkreisVorgabe: e.target.value as typeof s.stromkreisVorgabe,
                    }))
                  }
                >
                  <option value="">{t('katalogdialoge.katalogDialog.stromkreisNachTyp')}</option>
                  <option value="kein">{t('katalogdialoge.katalogDialog.stromkreisKein')}</option>
                  <option value="raum">{t('katalogdialoge.katalogDialog.stromkreisRaum')}</option>
                  <option value="eigen">{t('katalogdialoge.katalogDialog.stromkreisEigen')}</option>
                </select>
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.stromkreisHinweis')}
                </span>
              </label>
              {entwurf.stromkreisVorgabe === 'eigen' && (
                <label className="dialog-feld">
                  {t('katalogdialoge.katalogDialog.polzahl')}
                  <select
                    value={entwurf.stromkreisPolzahl}
                    onChange={(e) =>
                      setEntwurf((s) => ({
                        ...s,
                        stromkreisPolzahl: e.target.value === '3' ? 3 : 1,
                      }))
                    }
                  >
                    <option value={1}>1~</option>
                    <option value={3}>3~</option>
                  </select>
                </label>
              )}

              <IfcZuordnungFelder
                typ={entwurf.typ}
                ifcKlasse={entwurf.ifcKlasse}
                ifcTyp={entwurf.ifcTyp}
                ifcTypName={entwurf.ifcTypName}
                onAendern={(ifcKlasse, ifcTyp, ifcTypName) =>
                  setEntwurf((s) => ({ ...s, ifcKlasse, ifcTyp, ifcTypName }))
                }
              />

              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.bauart')}
                <select
                  value={entwurf.bauart}
                  onChange={(e) =>
                    setEntwurf((s) => ({ ...s, bauart: e.target.value as Entwurf['bauart'] }))
                  }
                >
                  <option value="">{t('katalogdialoge.katalogDialog.bauartStandard')}</option>
                  <option value="patchpanel">
                    {t('katalogdialoge.katalogDialog.bauartPatchpanel')}
                  </option>
                  <option value="verteiler">
                    {t('katalogdialoge.katalogDialog.bauartVerteiler')}
                  </option>
                </select>
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.bauartHinweis')}
                </span>
              </label>

              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.kennzeichen')}
                <input
                  list="katalog-kennzeichen-buchstaben"
                  maxLength={4}
                  value={entwurf.kennzeichenBuchstabe}
                  onChange={(e) => kennzeichenBuchstabeAendern(e.target.value)}
                />
                <datalist id="katalog-kennzeichen-buchstaben">
                  <option value="F" />
                  <option value="K" />
                  <option value="X" />
                  <option value="P" />
                </datalist>
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.kennzeichenHinweis')}
                </span>
              </label>

              {entwurf.kennzeichenBuchstabe.trim().toUpperCase() === 'K' && (
                <label className="dialog-feld">
                  {t('katalogdialoge.katalogDialog.rolle')}
                  <select
                    value={entwurf.betriebsmittelRolle}
                    onChange={(e) =>
                      setEntwurf((s) => ({
                        ...s,
                        betriebsmittelRolle: e.target.value as '' | 'spule' | 'kontaktblock',
                      }))
                    }
                  >
                    <option value="">{t('katalogdialoge.katalogDialog.keineAngabe')}</option>
                    <option value="spule">{t('katalogdialoge.katalogDialog.spule')}</option>
                    <option value="kontaktblock">
                      {t('katalogdialoge.katalogDialog.kontaktblock')}
                    </option>
                  </select>
                  <span className="dialog-hinweis">
                    {t('katalogdialoge.katalogDialog.rolleHinweis')}
                  </span>
                </label>
              )}

              {typHatSlotMatrix(entwurf.typ) && (
                <div className="dialog-feld">
                  <span>{t('katalogdialoge.katalogDialog.slotMatrix')}</span>
                  <div className="katalog-slotmatrix-zeile">
                    <select
                      value={entwurf.slotMatrixSpalten}
                      onChange={(e) =>
                        setEntwurf((s) => ({
                          ...s,
                          slotMatrixSpalten: e.target.value as '' | '1' | '2',
                        }))
                      }
                    >
                      <option value="">{t('katalogdialoge.katalogDialog.keineVorbelegung')}</option>
                      <option value="1">
                        {t('katalogdialoge.katalogDialog.spalten', { n: 1 })}
                      </option>
                      <option value="2">
                        {t('katalogdialoge.katalogDialog.spalten', { n: 2 })}
                      </option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={MAX_SLOT_MATRIX_ZEILEN}
                      disabled={!entwurf.slotMatrixSpalten}
                      value={entwurf.slotMatrixZeilen}
                      onChange={(e) =>
                        setEntwurf((s) => ({ ...s, slotMatrixZeilen: e.target.value }))
                      }
                    />
                    <span>{t('katalogdialoge.katalogDialog.zeilen')}</span>
                  </div>
                  {entwurf.slotMatrixSpalten && slotMatrixZeilenAnzahl > 1 && (
                    <div className="katalog-slotmatrix-zeilenbreiten">
                      {Array.from({ length: slotMatrixZeilenAnzahl }, (_, zeile0) => (
                        <label key={zeile0} className="katalog-slotmatrix-zeilenbreite">
                          {t('katalogdialoge.katalogDialog.reihe', { nummer: zeile0 + 1 })}
                          <select
                            value={entwurf.slotMatrixZeilenSpalten[zeile0] || ''}
                            onChange={(e) =>
                              zeilenSpalteAendern(zeile0, e.target.value as '' | '1' | '2')
                            }
                          >
                            <option value="">
                              {t('katalogdialoge.katalogDialog.standardSpalten', {
                                n: Number(entwurf.slotMatrixSpalten),
                              })}
                            </option>
                            <option value="1">
                              {t('katalogdialoge.katalogDialog.spalten', { n: 1 })}
                            </option>
                            <option value="2">
                              {t('katalogdialoge.katalogDialog.spalten', { n: 2 })}
                            </option>
                          </select>
                        </label>
                      ))}
                    </div>
                  )}
                  <span className="dialog-hinweis">
                    {t('katalogdialoge.katalogDialog.slotMatrixHinweis')}
                  </span>
                </div>
              )}

              {(!entwurf.typ || typHatSlots(entwurf.typ)) && (
                <div className="dialog-feld">
                  <span>{t('katalogdialoge.katalogDialog.slotVorlagen')}</span>
                  {entwurf.slotVorlagen.map((v, index) => {
                    const position = ermittleSlotVorlagenPosition(
                      index,
                      slotMatrixFuerVorlagenAnzeige,
                    )
                    return (
                      <div className="katalog-slotvorlagen-zeile" key={v.id}>
                        <span
                          className="katalog-slotvorlagen-position"
                          title={
                            position.ausserhalbDerMatrix
                              ? t('katalogdialoge.katalogDialog.slotAusserhalb')
                              : undefined
                          }
                        >
                          {position.zeile !== undefined
                            ? t('katalogdialoge.katalogDialog.slotMitPosition', {
                                nummer: position.slotNummer,
                                zeile: position.zeile,
                                spalte: position.spalte ?? '',
                              })
                            : t('katalogdialoge.katalogDialog.slotNummer', {
                                nummer: position.slotNummer,
                              })}
                          {position.ausserhalbDerMatrix && ' ⚠'}
                        </span>
                        <input
                          placeholder={t('katalogdialoge.katalogDialog.slotBezeichnungPlatzhalter')}
                          value={v.bezeichnung}
                          onChange={(e) => slotVorlageAendern(v.id, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => slotVorlageVerschieben(index, -1)}
                          disabled={index === 0}
                          title={t('katalogdialoge.katalogDialog.nachOben')}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => slotVorlageVerschieben(index, 1)}
                          disabled={index === entwurf.slotVorlagen.length - 1}
                          title={t('katalogdialoge.katalogDialog.nachUnten')}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => slotVorlageEntfernen(v.id)}
                          title={t('katalogdialoge.katalogDialog.slotVorlageEntfernen')}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                  <button type="button" onClick={slotVorlageHinzufuegen}>
                    {t('katalogdialoge.katalogDialog.slotVorlageHinzufuegen')}
                  </button>
                  <span className="dialog-hinweis">
                    {t('katalogdialoge.katalogDialog.slotVorlagenHinweis')}
                  </span>
                </div>
              )}

              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.hauptgruppe')}
                <input
                  list="katalog-hauptgruppen"
                  value={entwurf.hauptgruppe}
                  onChange={(e) => setEntwurf((s) => ({ ...s, hauptgruppe: e.target.value }))}
                />
                <datalist id="katalog-hauptgruppen">
                  {hauptgruppen.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.hauptgruppeHinweis')}
                </span>
              </label>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.untergruppe')}
                <input
                  list="katalog-untergruppen"
                  value={entwurf.untergruppe}
                  onChange={(e) => setEntwurf((s) => ({ ...s, untergruppe: e.target.value }))}
                />
                <datalist id="katalog-untergruppen">
                  {untergruppen.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.untergruppeHinweis')}
                </span>
              </label>

              <h3>{t('katalogdialoge.katalogDialog.bildUndSymbol')}</h3>
              <p className="dialog-hinweis">
                {t('katalogdialoge.katalogDialog.bildUndSymbolHinweis')}
              </p>
              <BildAuswahl
                art="produktbild"
                assetId={entwurf.bildAssetId}
                onHochladen={(datei) => bildHochladen(datei, 'bildAssetId')}
                onEntfernen={() => setEntwurf((s) => ({ ...s, bildAssetId: null }))}
                catalogStore={catalogStore}
              />
              <BildAuswahl
                art="schaltplansymbol"
                assetId={entwurf.symbolAssetId}
                onHochladen={(datei) => bildHochladen(datei, 'symbolAssetId')}
                onEntfernen={() => setEntwurf((s) => ({ ...s, symbolAssetId: null }))}
                catalogStore={catalogStore}
                zeichnen={{
                  gezeichnet: hauptSymbol.gezeichnet,
                  onZeichnen: () => void symbolZeichnen({ art: 'haupt' }, hauptSymbol),
                }}
              />

              <h3>{t('katalogdialoge.katalogDialog.symbolUndAnschluesse')}</h3>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.breitenfaktor')}
                <input
                  type="number"
                  min={BREITENFAKTOR_MIN}
                  max={BREITENFAKTOR_MAX}
                  step={0.1}
                  placeholder={t('katalogdialoge.katalogDialog.breitenfaktorPlatzhalter')}
                  value={entwurf.breitenFaktor}
                  onChange={(e) => setEntwurf((s) => ({ ...s, breitenFaktor: e.target.value }))}
                />
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.breitenfaktorHinweis')}
                </span>
              </label>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.hoehenfaktor')}
                <input
                  type="number"
                  min={BREITENFAKTOR_MIN}
                  max={BREITENFAKTOR_MAX}
                  step={0.1}
                  placeholder={t('katalogdialoge.katalogDialog.hoehenfaktorPlatzhalter')}
                  value={entwurf.hoehenFaktor}
                  onChange={(e) => setEntwurf((s) => ({ ...s, hoehenFaktor: e.target.value }))}
                />
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.hoehenfaktorHinweis')}
                </span>
              </label>
              <label className="dialog-feld-checkbox">
                <input
                  type="checkbox"
                  checked={entwurf.kombinierbar}
                  onChange={(e) => setEntwurf((s) => ({ ...s, kombinierbar: e.target.checked }))}
                />
                {t('katalogdialoge.katalogDialog.kombinierbar')}
              </label>
              <span className="dialog-hinweis">
                {t('katalogdialoge.katalogDialog.kombinierbarHinweis')}
              </span>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.montageort')}
                <select
                  value={entwurf.montageort}
                  onChange={(e) =>
                    setEntwurf((s) => ({ ...s, montageort: e.target.value as Montageort }))
                  }
                >
                  <option value="decke">{t('katalogdialoge.katalogDialog.montageDecke')}</option>
                  <option value="wand">{t('katalogdialoge.katalogDialog.montageWand')}</option>
                  <option value="boden">{t('katalogdialoge.katalogDialog.montageBoden')}</option>
                </select>
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.montageortHinweis')}
                </span>
              </label>
              <SymbolUndAnschluesse
                vorschauAssetId={entwurf.symbolAssetId ?? entwurf.bildAssetId}
                catalogStore={catalogStore}
                breitenFaktor={breitenFaktorAusEingabe(entwurf.breitenFaktor)}
                hoehenFaktor={hoehenFaktorAusEingabe(entwurf.hoehenFaktor)}
                dockpunkte={entwurf.dockpunkte}
                fangpunkt={entwurf.fangpunkt}
                textElemente={entwurf.textElemente}
                onDockpunkte={
                  nurAnsicht
                    ? keineAenderung
                    : (dockpunkte) => setEntwurf((s) => ({ ...s, dockpunkte }))
                }
                onFangpunkt={
                  nurAnsicht
                    ? keineAenderung
                    : (fangpunkt) => setEntwurf((s) => ({ ...s, fangpunkt }))
                }
                onTextElemente={
                  nurAnsicht
                    ? keineAenderung
                    : (textElemente) => setEntwurf((s) => ({ ...s, textElemente }))
                }
              />

              <h3>{t('katalogdialoge.katalogDialog.technischeDaten')}</h3>
              <label className="dialog-feld">
                {t('katalogdialoge.katalogDialog.technischeDatenFormat')}
                <textarea
                  rows={4}
                  value={entwurf.technischeDatenText}
                  onChange={(e) =>
                    setEntwurf((s) => ({ ...s, technischeDatenText: e.target.value }))
                  }
                />
              </label>

              <h3>{t('katalogdialoge.katalogDialog.varianten')}</h3>
              {entwurf.varianten.map((v) => (
                <div className="katalog-varianten-zeile" key={v.id}>
                  <input
                    placeholder={t('katalogdialoge.katalogDialog.varianteBezeichnung')}
                    value={v.name}
                    onChange={(e) => varianteAendern(v.id, { name: e.target.value })}
                  />
                  <input
                    placeholder={t('katalogdialoge.katalogDialog.varianteFarbe')}
                    value={v.farbe}
                    onChange={(e) => varianteAendern(v.id, { farbe: e.target.value })}
                  />
                  <input
                    placeholder={t('katalogdialoge.katalogDialog.varianteArtikelnummer')}
                    value={v.artikelnummer}
                    onChange={(e) => varianteAendern(v.id, { artikelnummer: e.target.value })}
                  />
                  <VarianteGrafikFeld
                    art="bild"
                    assetId={v.bildAssetId}
                    onHochladen={(datei) => void varianteBildHochladen(v.id, datei, 'bildAssetId')}
                    onEntfernen={() => varianteAendern(v.id, { bildAssetId: null })}
                    catalogStore={catalogStore}
                  />
                  <VarianteGrafikFeld
                    art="symbol"
                    assetId={v.symbolAssetId}
                    onHochladen={(datei) =>
                      void varianteBildHochladen(v.id, datei, 'symbolAssetId')
                    }
                    onEntfernen={() => varianteAendern(v.id, { symbolAssetId: null })}
                    catalogStore={catalogStore}
                    onZeichnen={(eigenes) =>
                      void symbolZeichnen({ art: 'variante', id: v.id }, eigenes)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => varianteEntfernen(v.id)}
                    title={t('katalogdialoge.katalogDialog.varianteEntfernen')}
                  >
                    ✕
                  </button>
                  <BemessungFelder
                    wert={v.bemessung}
                    geerbt={entwurf.bemessung}
                    onAendern={(bemessung) => varianteAendern(v.id, { bemessung })}
                  />
                </div>
              ))}
              <button type="button" onClick={varianteHinzufuegen}>
                {t('katalogdialoge.katalogDialog.varianteHinzufuegen')}
              </button>
            </fieldset>

            {zeichner && (
              <SymbolZeichnerDialog
                titel={
                  zeichner.ziel.art === 'haupt'
                    ? t('katalogdialoge.katalogDialog.zeichnerTitelHaupt')
                    : t('katalogdialoge.katalogDialog.zeichnerTitelVariante')
                }
                anfangsSvg={zeichner.anfangsSvg}
                breitenFaktor={breitenFaktorAusEingabe(entwurf.breitenFaktor)}
                hoehenFaktor={hoehenFaktorAusEingabe(entwurf.hoehenFaktor)}
                vorlagen={zeichner.vorlagen}
                onUebernehmen={zeichnungUebernehmen}
                onAbbrechen={zeichnerSchliessen}
              />
            )}

            <div className="dialog-aktionen">
              {bildLaedt && (
                <span className="dialog-hinweis">
                  {t('katalogdialoge.katalogDialog.bildLaedt')}
                </span>
              )}
              <button type="button" onClick={() => setAnsicht('liste')}>
                {nurAnsicht
                  ? t('katalogdialoge.katalogDialog.zurueck')
                  : t('katalogdialoge.gemeinsam.abbrechen')}
              </button>
              {nurAnsicht ? (
                <button
                  type="button"
                  className="primaer"
                  onClick={() => void alsEigeneBearbeiten()}
                >
                  {t('katalogdialoge.katalogDialog.alsEigeneBearbeiten')}
                </button>
              ) : (
                <button
                  type="button"
                  className="primaer"
                  disabled={speichertGerade || bildLaedt}
                  onClick={() => void speichern()}
                >
                  {t('katalogdialoge.gemeinsam.speichern')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

type GrafikFeld = 'bildAssetId' | 'symbolAssetId'

type GrafikZiel = { art: 'haupt' } | { art: 'variante'; id: string }

interface ZeichnerAufruf {
  ziel: GrafikZiel
  anfangsSvg: string | null
  vorlagen: SymbolVorlage[]
}

function alsKatalogBild(assetId: string | null): KatalogBild | undefined {
  return assetId ? { typ: 'asset', assetId } : undefined
}

function BildAuswahl({
  art,
  assetId,
  onHochladen,
  onEntfernen,
  catalogStore,
  zeichnen,
}: {
  art: 'produktbild' | 'schaltplansymbol'
  assetId: string | null
  onHochladen: (datei: File) => Promise<void>
  onEntfernen: () => void
  catalogStore: ReturnType<typeof useAppContext>['catalogStore']
  zeichnen?: { gezeichnet: boolean; onZeichnen: () => void }
}) {
  const vorschauBild = useMemo(() => alsKatalogBild(assetId), [assetId])
  const vorschauUrl = useKatalogBildUrl(vorschauBild, catalogStore)
  const eingabeRef = useRef<HTMLInputElement | null>(null)
  const t = useT()
  const titel = t(`katalogdialoge.katalogDialog.grafik.${art}.titel`)

  return (
    <div className="katalog-bildauswahl">
      {vorschauUrl ? (
        <img src={vorschauUrl} alt={titel} className="katalog-bild-vorschau" />
      ) : (
        <span className="katalog-bild-vorschau-leer" />
      )}
      <div className="katalog-bildauswahl-optionen">
        <span className="katalog-bildauswahl-titel">{titel}</span>
        <input
          ref={eingabeRef}
          type="file"
          accept="image/*"
          aria-label={t(`katalogdialoge.katalogDialog.grafik.${art}.hochladenAria`)}
          style={{ display: 'none' }}
          onChange={(e) => {
            const datei = e.target.files?.[0]
            e.target.value = ''
            if (datei) void onHochladen(datei)
          }}
        />
        <div className="katalog-bildauswahl-knoepfe">
          {zeichnen && (
            <button type="button" onClick={zeichnen.onZeichnen}>
              {zeichnen.gezeichnet
                ? t('katalogdialoge.katalogDialog.symbolBearbeiten')
                : t('katalogdialoge.katalogDialog.symbolZeichnen')}
            </button>
          )}
          <button
            type="button"
            title={t(`katalogdialoge.katalogDialog.grafik.${art}.hochladenTitel`)}
            onClick={() => eingabeRef.current?.click()}
          >
            {t('katalogdialoge.katalogDialog.hochladen')}
          </button>
          {assetId && (
            <button type="button" onClick={onEntfernen}>
              {t(`katalogdialoge.katalogDialog.grafik.${art}.entfernen`)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type VarianteGrafikTexte = Texte['katalogdialoge']['katalogDialog']['varianteGrafik']['bild']

function VarianteGrafikFeld({
  art,
  assetId,
  onHochladen,
  onEntfernen,
  catalogStore,
  onZeichnen,
}: {
  art: 'bild' | 'symbol'
  assetId: string | null
  onHochladen: (datei: File) => void
  onEntfernen: () => void
  catalogStore: ReturnType<typeof useAppContext>['catalogStore']
  onZeichnen?: (eigenes: { svg: string | null; gezeichnet: boolean }) => void
}) {
  const t = useT()
  const text = (schluessel: keyof VarianteGrafikTexte) =>
    t(`katalogdialoge.katalogDialog.varianteGrafik.${art}.${schluessel}`)
  const eigenes = useSymbolSvg(onZeichnen ? assetId : null, catalogStore)
  const vorschauBild = useMemo(() => alsKatalogBild(assetId), [assetId])
  const vorschauUrl = useKatalogBildUrl(vorschauBild, catalogStore)
  return (
    <div className="katalog-varianten-bild">
      {vorschauUrl ? (
        <img src={vorschauUrl} alt={text('alt')} className="katalog-varianten-vorschau" />
      ) : (
        <span className="katalog-varianten-vorschau" title={text('geerbt')} />
      )}
      <label title={text('eigenes')}>
        {assetId ? text('ersetzen') : text('hochladen')}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const datei = e.target.files?.[0]
            e.target.value = ''
            if (datei) onHochladen(datei)
          }}
        />
      </label>
      {onZeichnen && (
        <button
          type="button"
          onClick={() => onZeichnen(eigenes)}
          title={
            eigenes.gezeichnet
              ? t('katalogdialoge.katalogDialog.gezeichnetesBearbeiten')
              : t('katalogdialoge.katalogDialog.eigenesZeichnen')
          }
        >
          {eigenes.gezeichnet
            ? t('katalogdialoge.katalogDialog.bearbeitenKlein')
            : t('katalogdialoge.katalogDialog.zeichnenKlein')}
        </button>
      )}
      {assetId && (
        <button type="button" onClick={onEntfernen} title={text('entfernen')}>
          {t('katalogdialoge.katalogDialog.geerbt')}
        </button>
      )}
    </div>
  )
}

function KatalogListenEintrag({
  komponente,
  kataloge,
  onBearbeiten,
  onDuplizieren,
  onLoeschen,
  onVerschieben,
}: {
  komponente: CatalogComponent
  kataloge: readonly Katalog[]
  onBearbeiten: () => void
  onDuplizieren: () => void
  onLoeschen: () => void
  onVerschieben: (katalogId: string) => void
}) {
  const { catalogStore } = useAppContext()
  const t = useT()
  const sprache = useSprache()
  const darstellung = useAktivesBlatt().komponentenDarstellung
  const bildUrl = useKatalogBildUrl(
    waehleKomponentenGrafik(komponente, darstellung)?.grafik,
    catalogStore,
  )

  return (
    <div className="katalog-listen-eintrag">
      <div
        className="katalog-listen-eintrag-inhalt"
        onClick={onBearbeiten}
        role="button"
        tabIndex={0}
      >
        <span className="katalog-karte-bild">
          {bildUrl ? <img src={bildUrl} alt="" /> : <span className="katalog-karte-platzhalter" />}
        </span>
        <span className="katalog-karte-name">
          {komponentenText(komponente, 'name', sprache)}
          {komponente.herkunft === 'standard' && (
            <span className="katalog-badge katalog-badge-standard">
              {t('katalogdialoge.gemeinsam.standard')}
            </span>
          )}
        </span>
        <span className="katalog-karte-info">
          {[
            komponente.hersteller,
            komponente.artikelnummer,
            [
              komponentenText(komponente, 'hauptgruppe', sprache),
              komponentenText(komponente, 'untergruppe', sprache),
            ]
              .filter(Boolean)
              .join(' / '),
            komponentenText(komponente, 'kategorie', sprache),
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      <div className="katalog-listen-eintrag-aktionen">
        {komponente.herkunft === 'benutzer' && kataloge.length > 1 && (
          <select
            value={komponente.katalogId}
            title={t('katalogdialoge.katalogDialog.verschiebenTitel')}
            onChange={(e) => onVerschieben(e.target.value)}
          >
            {kataloge.map((katalog) => (
              <option key={katalog.id} value={katalog.id}>
                {katalogText(katalog, 'name', sprache)}
              </option>
            ))}
          </select>
        )}
        <button type="button" onClick={onDuplizieren}>
          {t('katalogdialoge.gemeinsam.duplizieren')}
        </button>
        {komponente.herkunft === 'benutzer' && (
          <button type="button" onClick={onLoeschen}>
            {t('katalogdialoge.gemeinsam.loeschen')}
          </button>
        )}
      </div>
    </div>
  )
}
