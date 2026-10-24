import { bereinigteBemessung, IP_SCHUTZART_MUSTER } from '../../document-model'
import { t } from '../../sprache'
import type { Schluessel } from '../../sprache'
import type {
  Ansteuerung,
  Bemessungswerte,
  DockpunkteKonfiguration,
  Fangpunkt,
  KatalogTextElement,
  KomponentenTyp,
  Montageort,
  SlotVorlage,
} from '../../document-model'

export interface BemessungEntwurf {
  nennstrom: string
  nennspannung: string
  polzahl: string
  ipSchutzart: string
}

export const LEERE_BEMESSUNG: BemessungEntwurf = {
  nennstrom: '',
  nennspannung: '',
  polzahl: '',
  ipSchutzart: '',
}

export function bemessungEntwurf(b: Bemessungswerte | undefined): BemessungEntwurf {
  const zahl = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','))
  return {
    nennstrom: zahl(b?.nennstrom),
    nennspannung: zahl(b?.nennspannung),
    polzahl: b?.polzahl === undefined ? '' : String(b.polzahl),
    ipSchutzart: b?.ipSchutzart ?? '',
  }
}

export function bemessungAusEntwurf(e: BemessungEntwurf): {
  bemessung: Bemessungswerte | undefined
  fehler: string | null
} {
  const b: Bemessungswerte = {}
  const zahl = (text: string, name: Schluessel, ganz: boolean): number | string | undefined => {
    const eingabe = text.trim()
    if (!eingabe) return undefined
    const n = Number(eingabe.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0 || (ganz && !Number.isInteger(n)))
      return t(
        ganz
          ? 'katalogdialoge.katalogEntwurf.keineGanzeZahl'
          : 'katalogdialoge.katalogEntwurf.keineZahl',
        { feld: t(name), wert: eingabe },
      )
    return n
  }
  const felder = [
    ['nennstrom', 'katalogdialoge.katalogEntwurf.nennstrom', false],
    ['nennspannung', 'katalogdialoge.katalogEntwurf.nennspannung', false],
    ['polzahl', 'katalogdialoge.katalogEntwurf.polzahl', true],
  ] as const
  for (const [feld, name, ganz] of felder) {
    const wert = zahl(e[feld], name, ganz)
    if (typeof wert === 'string') return { bemessung: undefined, fehler: wert }
    if (wert !== undefined) b[feld] = wert
  }
  const ip = e.ipSchutzart.replace(/\s+/g, '').toUpperCase()
  if (ip) {
    if (!IP_SCHUTZART_MUSTER.test(ip))
      return {
        bemessung: undefined,
        fehler: t('katalogdialoge.katalogEntwurf.keineSchutzart', { wert: e.ipSchutzart.trim() }),
      }
    b.ipSchutzart = ip
  }
  return { bemessung: bereinigteBemessung(b), fehler: null }
}

export interface VariantEntwurf {
  id: string
  name: string
  farbe: string
  artikelnummer: string
  bemessung: BemessungEntwurf
  bildAssetId: string | null
  symbolAssetId: string | null
}

export interface Entwurf {
  id: string | null
  katalogId: string
  name: string
  herkunft: 'standard' | 'benutzer'
  bildAssetId: string | null
  symbolAssetId: string | null
  hersteller: string
  artikelnummer: string
  wattzahl: string
  poeLeistungWatt: string
  bemessung: BemessungEntwurf
  kategorie: string
  typ: KomponentenTyp | ''
  ansteuerung: Ansteuerung | ''
  stromkreisVorgabe: 'kein' | 'raum' | 'eigen' | ''
  stromkreisPolzahl: 1 | 3
  ifcKlasse: string
  ifcTyp: string
  ifcTypName: string
  slotVorlagen: SlotVorlage[]
  slotMatrixSpalten: '' | '1' | '2'
  slotMatrixZeilen: string
  slotMatrixZeilenSpalten: ('' | '1' | '2')[]
  hauptgruppe: string
  untergruppe: string
  technischeDatenText: string
  varianten: VariantEntwurf[]
  breitenFaktor: string
  hoehenFaktor: string
  kombinierbar: boolean
  montageort: Montageort
  dockpunkte: DockpunkteKonfiguration | undefined
  fangpunkt: Fangpunkt | undefined
  textElemente: KatalogTextElement[]
  kennzeichenBuchstabe: string
  betriebsmittelRolle: '' | 'spule' | 'kontaktblock'
  bauart: '' | 'patchpanel' | 'verteiler'
}

export function leererEntwurf(katalogId: string): Entwurf {
  return {
    id: null,
    katalogId,
    name: '',
    herkunft: 'benutzer',
    bildAssetId: null,
    symbolAssetId: null,
    hersteller: '',
    artikelnummer: '',
    wattzahl: '',
    poeLeistungWatt: '',
    bemessung: LEERE_BEMESSUNG,
    kategorie: '',
    typ: '',
    ansteuerung: '',
    stromkreisVorgabe: '',
    stromkreisPolzahl: 1,
    ifcKlasse: '',
    ifcTyp: '',
    ifcTypName: '',
    slotVorlagen: [],
    slotMatrixSpalten: '',
    slotMatrixZeilen: '1',
    slotMatrixZeilenSpalten: [],
    hauptgruppe: '',
    untergruppe: '',
    technischeDatenText: '',
    varianten: [],
    breitenFaktor: '',
    hoehenFaktor: '',
    kombinierbar: true,
    montageort: 'wand',
    dockpunkte: undefined,
    fangpunkt: undefined,
    textElemente: [],
    kennzeichenBuchstabe: '',
    betriebsmittelRolle: '',
    bauart: '',
  }
}

export function serializeTechDaten(daten: Record<string, string>): string {
  return Object.entries(daten)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

export const BREITENFAKTOR_MIN = 0.5
export const BREITENFAKTOR_MAX = 4

export function breitenFaktorAusEingabe(text: string): number | undefined {
  const wert = Number(text.trim().replace(',', '.'))
  if (!text.trim() || !Number.isFinite(wert)) return undefined
  const begrenzt = Math.min(BREITENFAKTOR_MAX, Math.max(BREITENFAKTOR_MIN, wert))
  return begrenzt === 1 ? undefined : Math.round(begrenzt * 100) / 100
}

export function hoehenFaktorAusEingabe(text: string): number | undefined {
  return breitenFaktorAusEingabe(text)
}
