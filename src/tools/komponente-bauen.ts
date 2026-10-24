import type {
  Ansteuerung,
  Blatt,
  CatalogComponent,
  DockpunkteKonfiguration,
  Fangpunkt,
  KatalogTextElement,
  KomponentenObjekt,
  KomponentenTyp,
  ModulTraegerKonfiguration,
  Montageort,
  Point,
  SlotMatrix,
  SlotVorlage,
  Zeichnung,
} from '../document-model'
import {
  BASIS_SYMBOL_GROESSE_METER,
  belegteKlemmenNummern,
  istKlemmenKennzeichen,
  istSchaltplan,
  klemmeNummeriert,
  naechsteKlemmenNummer,
  naechstesFreiesKennzeichen,
  naechstesVerteilerKennzeichen,
  neueObjektBasis,
  positionFuerFangpunkt,
  slotsBeimPlatzieren,
  STANDARD_KLEMMENLEISTE,
  typHatAnsteuerung,
} from '../document-model'

export interface KomponentenAuswahl {
  catalogComponentId: string
  variantId: string | null
  dockpunkte?: DockpunkteKonfiguration
  fangpunkt?: Fangpunkt
  textElemente?: KatalogTextElement[]
  breitenFaktor?: number
  hoehenFaktor?: number
  kombinierbar?: boolean
  montageort?: Montageort
  modulTraeger?: ModulTraegerKonfiguration
  modulSystem?: string
  typ?: KomponentenTyp
  slotVorlagen?: SlotVorlage[]
  slotMatrixVorlage?: SlotMatrix
  slotAnzahlAus?: string
  ansteuerung?: Ansteuerung
  kennzeichenBuchstabe?: string
  betriebsmittelRolle?: 'spule' | 'kontaktblock'
  bauart?: 'patchpanel' | 'verteiler'
}

export function auswahlAusKatalog(
  k: CatalogComponent,
  variantId: string | null,
): KomponentenAuswahl {
  return {
    catalogComponentId: k.id,
    variantId,
    dockpunkte: k.dockpunkte,
    fangpunkt: k.fangpunkt,
    textElemente: k.textElemente,
    breitenFaktor: k.breitenFaktor,
    hoehenFaktor: k.hoehenFaktor,
    kombinierbar: k.kombinierbar,
    montageort: k.montageort,
    modulTraeger: k.modulTraeger,
    modulSystem: k.modulSystem,
    typ: k.typ,
    slotVorlagen: k.slotVorlagen,
    slotMatrixVorlage: k.slotMatrixVorlage,
    slotAnzahlAus: k.slotAnzahlAus,
    ansteuerung: k.ansteuerung,
    kennzeichenBuchstabe: k.kennzeichenBuchstabe,
    betriebsmittelRolle: k.betriebsmittelRolle,
    bauart: k.bauart,
  }
}

export interface InstanzUmgebung {
  zeichnung: Zeichnung
  blatt: Pick<Blatt, 'symbolSkalierung'> | undefined
  ebeneId: string
  drehung: number
  hoeheCm: number | null
  klemmenLeiste?: string
  bekannteVerteilerKennzeichen?: readonly string[]
}

function montageortBeimPlatzieren(
  auswahl: KomponentenAuswahl,
  mitHoehe: boolean,
  hoeheCm: number | null,
): Partial<KomponentenObjekt> {
  const ort = auswahl.montageort
  if (!mitHoehe || hoeheCm !== null || (ort !== 'decke' && ort !== 'boden')) return {}
  return { montageort: ort }
}

export function erzeugeKomponentenInstanz(
  auswahl: KomponentenAuswahl,
  umgebung: InstanzUmgebung,
  fangZiel: Point,
): KomponentenObjekt {
  const { zeichnung, hoeheCm } = umgebung
  const basisGroesse = BASIS_SYMBOL_GROESSE_METER * (umgebung.blatt?.symbolSkalierung ?? 1)
  const hoehenFaktor =
    !auswahl.modulTraeger && auswahl.hoehenFaktor && auswahl.hoehenFaktor !== 1
      ? auswahl.hoehenFaktor
      : undefined
  const groesseWelt = auswahl.modulTraeger
    ? basisGroesse * auswahl.modulTraeger.zeilen
    : basisGroesse * (hoehenFaktor ?? 1)
  const breiteWelt = auswahl.modulTraeger
    ? basisGroesse * auswahl.modulTraeger.spalten
    : auswahl.breitenFaktor
      ? basisGroesse * auswahl.breitenFaktor
      : undefined
  const mitHoehe = !istSchaltplan(zeichnung)
  const instanz: KomponentenObjekt = {
    ...neueObjektBasis(umgebung.ebeneId),
    type: 'komponente',
    position: fangZiel,
    drehung: umgebung.drehung,
    groesseWelt,
    catalogComponentId: auswahl.catalogComponentId,
    variantId: auswahl.variantId,
    dockpunkte: auswahl.dockpunkte,
    fangpunkt: auswahl.fangpunkt,
    textElemente: auswahl.textElemente,
    breiteWelt,
    hoehenFaktor,
    modulTraeger: auswahl.modulTraeger,
    modulSystem: auswahl.modulSystem,
    ...(auswahl.kombinierbar === false ? { kombinierbar: false } : {}),
    typ: auswahl.typ,
    ...slotsBeimPlatzieren(auswahl),
    slotAnzahlAus: auswahl.slotAnzahlAus,
    ansteuerung: auswahl.typ && typHatAnsteuerung(auswahl.typ) ? auswahl.ansteuerung : undefined,
    geraeteKennzeichen:
      auswahl.kennzeichenBuchstabe && !istKlemmenKennzeichen(auswahl.kennzeichenBuchstabe)
        ? naechstesFreiesKennzeichen(zeichnung, auswahl.kennzeichenBuchstabe)
        : undefined,
    betriebsmittelRolle: auswahl.betriebsmittelRolle,
    ...(auswahl.bauart === 'verteiler'
      ? {
          verteiler: {
            kennzeichen: naechstesVerteilerKennzeichen(
              zeichnung,
              umgebung.bekannteVerteilerKennzeichen ?? [],
            ),
            bestueckung: [],
          },
        }
      : {}),
    ...(hoeheCm !== null && mitHoehe ? { installationshoehe: hoeheCm / 100 } : {}),
    ...montageortBeimPlatzieren(auswahl, mitHoehe, hoeheCm),
  }
  let mitNummer = instanz
  if (istKlemmenKennzeichen(auswahl.kennzeichenBuchstabe)) {
    const leiste = umgebung.klemmenLeiste ?? STANDARD_KLEMMENLEISTE
    const belegt = belegteKlemmenNummern(zeichnung, leiste)
    mitNummer = klemmeNummeriert(instanz, leiste, naechsteKlemmenNummer(belegt.keys()))
  }
  return { ...mitNummer, position: positionFuerFangpunkt(mitNummer, fangZiel) }
}
