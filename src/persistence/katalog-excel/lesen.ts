import type { Bemessungswerte, KomponentenTyp, KomponentenUebersetzung } from '../../document-model'
import { IP_SCHUTZART_MUSTER, waehlbareTypen } from '../../document-model'
import { t } from '../../sprache'

export const BLATT_KOMPONENTEN = 'Komponenten'
export const BLATT_VARIANTEN = 'Varianten'
export const BLATT_ANLEITUNG = 'Anleitung'

export const TECHNISCHE_DATEN_PRAEFIX = 'TD:'

export const BEMESSUNG_KOEPFE = {
  nennstrom: 'Nennstrom (A)',
  nennspannung: 'Nennspannung (V)',
  polzahl: 'Polzahl',
  ipSchutzart: 'IP-Schutzart',
} as const

export const KOMPONENTEN_KOEPFE = {
  name: 'Name',
  hersteller: 'Hersteller',
  artikelnummer: 'Artikelnummer',
  kategorie: 'Kategorie',
  hauptgruppe: 'Hauptgruppe',
  untergruppe: 'Untergruppe',
  typ: 'Typ',
  wattzahl: 'Leistung (W)',
  poeLeistungWatt: 'PoE-Leistung (W)',
  ...BEMESSUNG_KOEPFE,
  bild: 'Bild',
  symbol: 'Symbol',
} as const

export const KOMPONENTEN_KOEPFE_EN = {
  name: 'Name (en)',
  kategorie: 'Kategorie (en)',
  hauptgruppe: 'Hauptgruppe (en)',
  untergruppe: 'Untergruppe (en)',
} as const

export const VARIANTEN_KOEPFE = {
  komponente: 'Komponente (Artikelnummer)',
  farbe: 'Farbe',
  name: 'Name',
  artikelnummer: 'Artikelnummer',
  ...BEMESSUNG_KOEPFE,
  bild: 'Bild',
  symbol: 'Symbol',
} as const

export const VARIANTEN_KOPF_AUSFUEHRUNG_EN = 'Ausführung (en)'
const VARIANTEN_KOPF_FARBE_EN = 'Farbe (en)'

export type KomponentenTexteEn = Pick<
  KomponentenUebersetzung,
  'name' | 'kategorie' | 'hauptgruppe' | 'untergruppe'
>

export interface ExcelZelle {
  text: string
  linkZiel?: string
}

export interface KomponentenZeile {
  zeile: number
  name: string
  hersteller: string
  artikelnummer: string
  kategorie: string
  hauptgruppe: string
  untergruppe: string
  typ: KomponentenTyp | null
  wattzahl: number | null
  poeLeistungWatt: number | null
  bemessung: Bemessungswerte
  bild: string
  symbol: string
  technischeDaten: Record<string, string>
  englisch?: KomponentenTexteEn
  fehler: string[]
}

export interface VariantenZeile {
  zeile: number
  komponente: string
  farbe: string
  name: string
  artikelnummer: string
  bemessung: Bemessungswerte
  bild: string
  symbol: string
  technischeDaten: Record<string, string>
  farbeEnglisch?: string
  fehler: string[]
}

export interface KatalogExcelInhalt {
  komponenten: KomponentenZeile[]
  varianten: VariantenZeile[]
  fehler: string[]
}

function normalisiere(text: string): string {
  return text
    .trim()
    .toLocaleLowerCase('de')
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replace(/\s+/g, ' ')
}

export function dateinameAusZelle(zelle: ExcelZelle | undefined): string {
  if (!zelle) return ''
  const quelle = zelle.linkZiel?.trim() || zelle.text.trim()
  if (!quelle) return ''
  const ohneAnker = quelle.split(/[?#]/)[0]
  const letzterTeil = ohneAnker.split(/[/\\]/).pop() ?? ''
  try {
    return decodeURIComponent(letzterTeil).trim()
  } catch {
    return letzterTeil.trim()
  }
}

function leseZahl(text: string, spalte: string, fehler: string[]): number | null {
  const roh = text.trim()
  if (!roh) return null
  const zahl = Number(roh.replace(',', '.'))
  if (!Number.isFinite(zahl) || zahl < 0) {
    fehler.push(t('persistenz.katalogExcel.keineZahl', { spalte, wert: roh }))
    return null
  }
  return zahl
}

function leseBemessung(text: (kopf: string) => string, fehler: string[]): Bemessungswerte {
  const K = BEMESSUNG_KOEPFE
  const b: Bemessungswerte = {}
  for (const feld of ['nennstrom', 'nennspannung'] as const) {
    const wert = leseZahl(text(K[feld]), K[feld], fehler)
    if (wert === 0) fehler.push(t('persistenz.katalogExcel.nichtNull', { spalte: K[feld] }))
    else if (wert !== null) b[feld] = wert
  }
  const polzahl = leseZahl(text(K.polzahl), K.polzahl, fehler)
  if (polzahl !== null) {
    if (Number.isInteger(polzahl) && polzahl > 0) b.polzahl = polzahl
    else {
      fehler.push(
        t('persistenz.katalogExcel.keineGanzeZahl', { spalte: K.polzahl, wert: text(K.polzahl) }),
      )
    }
  }
  const ip = text(K.ipSchutzart).replace(/\s+/g, '').toUpperCase()
  if (ip) {
    if (IP_SCHUTZART_MUSTER.test(ip)) b.ipSchutzart = ip
    else {
      fehler.push(
        t('persistenz.katalogExcel.keineSchutzart', {
          spalte: K.ipSchutzart,
          wert: text(K.ipSchutzart),
        }),
      )
    }
  }
  return b
}

function leseTyp(text: string, fehler: string[]): KomponentenTyp | null {
  const roh = normalisiere(text)
  if (!roh) return null
  const typen = waehlbareTypen()
  const treffer = typen.find((t) => t.kennung === roh || normalisiere(t.bezeichnung) === roh)
  if (!treffer) {
    const erlaubt = typen.map((t) => t.bezeichnung).join(', ')
    fehler.push(
      t('persistenz.katalogExcel.typUnbekannt', {
        spalte: KOMPONENTEN_KOEPFE.typ,
        wert: text.trim(),
        erlaubt,
      }),
    )
  }
  return treffer?.kennung ?? null
}

export interface RohTabelle {
  kopf: string[]
  zeilen: { zeile: number; zellen: ExcelZelle[] }[]
}

interface Spaltenzugriff {
  zelle(zellen: ExcelZelle[], kopf: string): ExcelZelle | undefined
  text(zellen: ExcelZelle[], kopf: string): string
  technischeDaten(zellen: ExcelZelle[]): Record<string, string>
  hat(kopf: string): boolean
}

function spaltenzugriff(kopf: string[]): Spaltenzugriff {
  const index = new Map<string, number>()
  kopf.forEach((k, i) => {
    const schluessel = normalisiere(k)
    if (schluessel && !index.has(schluessel)) index.set(schluessel, i)
  })
  const tdSpalten = kopf
    .map((k, i) => ({ k: k.trim(), i }))
    .filter(({ k }) => normalisiere(k).startsWith(normalisiere(TECHNISCHE_DATEN_PRAEFIX)))
    .map(({ k, i }) => ({ bezeichnung: k.slice(TECHNISCHE_DATEN_PRAEFIX.length).trim(), i }))
    .filter(({ bezeichnung }) => bezeichnung)
  const zelle = (zellen: ExcelZelle[], k: string) => {
    const i = index.get(normalisiere(k))
    return i === undefined ? undefined : zellen[i]
  }
  return {
    zelle,
    text: (zellen, k) => zelle(zellen, k)?.text.trim() ?? '',
    technischeDaten: (zellen) => {
      const daten: Record<string, string> = {}
      for (const { bezeichnung, i } of tdSpalten) {
        const wert = zellen[i]?.text.trim()
        if (wert) daten[bezeichnung] = wert
      }
      return daten
    },
    hat: (k) => index.has(normalisiere(k)),
  }
}

function leseEnglisch(text: (kopf: string) => string): KomponentenTexteEn | undefined {
  const englisch: KomponentenTexteEn = {}
  for (const feld of Object.keys(KOMPONENTEN_KOEPFE_EN) as (keyof KomponentenTexteEn)[]) {
    const wert = text(KOMPONENTEN_KOEPFE_EN[feld])
    if (wert) englisch[feld] = wert
  }
  return Object.keys(englisch).length > 0 ? englisch : undefined
}

function zeileIstLeer(zellen: ExcelZelle[]): boolean {
  return zellen.every((z) => !z?.text.trim() && !z?.linkZiel?.trim())
}

export function werteKatalogTabellenAus(
  komponentenTabelle: RohTabelle | null,
  variantenTabelle: RohTabelle | null,
): KatalogExcelInhalt {
  const inhalt: KatalogExcelInhalt = { komponenten: [], varianten: [], fehler: [] }
  if (!komponentenTabelle) {
    inhalt.fehler.push(t('persistenz.katalogExcel.blattFehlt', { blatt: BLATT_KOMPONENTEN }))
    return inhalt
  }

  const k = spaltenzugriff(komponentenTabelle.kopf)
  if (!k.hat(KOMPONENTEN_KOEPFE.name)) {
    inhalt.fehler.push(
      t('persistenz.katalogExcel.spalteFehlt', {
        blatt: BLATT_KOMPONENTEN,
        spalte: KOMPONENTEN_KOEPFE.name,
      }),
    )
    return inhalt
  }
  for (const { zeile, zellen } of komponentenTabelle.zeilen) {
    if (zeileIstLeer(zellen)) continue
    const fehler: string[] = []
    const name = k.text(zellen, KOMPONENTEN_KOEPFE.name)
    if (!name)
      fehler.push(t('persistenz.katalogExcel.spalteLeer', { spalte: KOMPONENTEN_KOEPFE.name }))
    const englisch = leseEnglisch((kopf) => k.text(zellen, kopf))
    inhalt.komponenten.push({
      zeile,
      name,
      hersteller: k.text(zellen, KOMPONENTEN_KOEPFE.hersteller),
      artikelnummer: k.text(zellen, KOMPONENTEN_KOEPFE.artikelnummer),
      kategorie: k.text(zellen, KOMPONENTEN_KOEPFE.kategorie),
      hauptgruppe: k.text(zellen, KOMPONENTEN_KOEPFE.hauptgruppe),
      untergruppe: k.text(zellen, KOMPONENTEN_KOEPFE.untergruppe),
      typ: leseTyp(k.text(zellen, KOMPONENTEN_KOEPFE.typ), fehler),
      wattzahl: leseZahl(
        k.text(zellen, KOMPONENTEN_KOEPFE.wattzahl),
        KOMPONENTEN_KOEPFE.wattzahl,
        fehler,
      ),
      poeLeistungWatt: leseZahl(
        k.text(zellen, KOMPONENTEN_KOEPFE.poeLeistungWatt),
        KOMPONENTEN_KOEPFE.poeLeistungWatt,
        fehler,
      ),
      bemessung: leseBemessung((kopf) => k.text(zellen, kopf), fehler),
      bild: dateinameAusZelle(k.zelle(zellen, KOMPONENTEN_KOEPFE.bild)),
      symbol: dateinameAusZelle(k.zelle(zellen, KOMPONENTEN_KOEPFE.symbol)),
      technischeDaten: k.technischeDaten(zellen),
      ...(englisch ? { englisch } : {}),
      fehler,
    })
  }

  const jeNummer = new Map<string, KomponentenZeile[]>()
  for (const z of inhalt.komponenten) {
    if (!z.artikelnummer) continue
    const schluessel = normalisiere(z.artikelnummer)
    jeNummer.set(schluessel, [...(jeNummer.get(schluessel) ?? []), z])
  }
  for (const gruppe of jeNummer.values()) {
    if (gruppe.length < 2) continue
    const zeilen = gruppe.map((z) => z.zeile).join(', ')
    for (const z of gruppe) {
      z.fehler.push(t('persistenz.katalogExcel.artikelnummerMehrfach', { zeilen }))
    }
  }

  if (variantenTabelle) {
    const v = spaltenzugriff(variantenTabelle.kopf)
    if (!v.hat(VARIANTEN_KOEPFE.komponente)) {
      inhalt.fehler.push(
        t('persistenz.katalogExcel.variantenSpalteFehlt', {
          blatt: BLATT_VARIANTEN,
          spalte: VARIANTEN_KOEPFE.komponente,
        }),
      )
    } else {
      for (const { zeile, zellen } of variantenTabelle.zeilen) {
        if (zeileIstLeer(zellen)) continue
        const fehler: string[] = []
        const komponente = v.text(zellen, VARIANTEN_KOEPFE.komponente)
        if (!komponente) {
          fehler.push(
            t('persistenz.katalogExcel.spalteLeer', { spalte: VARIANTEN_KOEPFE.komponente }),
          )
        }
        const zeilenInhalt: VariantenZeile = {
          zeile,
          komponente,
          farbe: v.text(zellen, VARIANTEN_KOEPFE.farbe),
          name: v.text(zellen, VARIANTEN_KOEPFE.name),
          artikelnummer: v.text(zellen, VARIANTEN_KOEPFE.artikelnummer),
          bemessung: leseBemessung((kopf) => v.text(zellen, kopf), fehler),
          bild: dateinameAusZelle(v.zelle(zellen, VARIANTEN_KOEPFE.bild)),
          symbol: dateinameAusZelle(v.zelle(zellen, VARIANTEN_KOEPFE.symbol)),
          technischeDaten: v.technischeDaten(zellen),
          fehler,
        }
        const farbeEnglisch =
          v.text(zellen, VARIANTEN_KOPF_AUSFUEHRUNG_EN) || v.text(zellen, VARIANTEN_KOPF_FARBE_EN)
        if (farbeEnglisch) zeilenInhalt.farbeEnglisch = farbeEnglisch
        if (!zeilenInhalt.farbe && !zeilenInhalt.name && !zeilenInhalt.artikelnummer) {
          fehler.push(t('persistenz.katalogExcel.varianteOhneAngaben'))
        }
        inhalt.varianten.push(zeilenInhalt)
      }
    }
  }
  return inhalt
}

export function artikelnummerSchluessel(artikelnummer: string): string {
  return normalisiere(artikelnummer)
}

export function gleicheArtikelnummer(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false
  return normalisiere(a) === normalisiere(b)
}

type ExcelJsModul = typeof import('exceljs')

export async function ladeExcelJs(): Promise<ExcelJsModul> {
  const modul = await import('exceljs')
  return (modul as unknown as { default?: ExcelJsModul }).default ?? modul
}

function zellenText(wert: unknown): string {
  if (wert === null || wert === undefined) return ''
  if (typeof wert === 'string') return wert
  if (typeof wert === 'number' || typeof wert === 'boolean') return String(wert)
  if (wert instanceof Date) return wert.toISOString().slice(0, 10)
  if (typeof wert === 'object') {
    const o = wert as Record<string, unknown>
    if (Array.isArray(o.richText)) {
      return (o.richText as { text: string }[]).map((t) => t.text).join('')
    }
    if ('text' in o) return zellenText(o.text)
    if ('result' in o) return zellenText(o.result)
  }
  return ''
}

function leseBlatt(arbeitsblatt: import('exceljs').Worksheet): RohTabelle {
  const kopfZeile = arbeitsblatt.getRow(1)
  const kopf: string[] = []
  const spaltenzahl = Math.max(kopfZeile.cellCount, arbeitsblatt.columnCount)
  for (let s = 1; s <= spaltenzahl; s++) kopf.push(zellenText(kopfZeile.getCell(s).value).trim())
  const zeilen: RohTabelle['zeilen'] = []
  for (let z = 2; z <= arbeitsblatt.rowCount; z++) {
    const reihe = arbeitsblatt.getRow(z)
    const zellen: ExcelZelle[] = []
    for (let s = 1; s <= kopf.length; s++) {
      const zelle = reihe.getCell(s)
      const wert = zelle.value as unknown
      const linkAusWert =
        wert && typeof wert === 'object' && 'hyperlink' in (wert as object)
          ? String((wert as { hyperlink: unknown }).hyperlink ?? '')
          : undefined
      const linkZiel = linkAusWert || zelle.hyperlink || undefined
      zellen.push({ text: zellenText(wert), linkZiel })
    }
    zeilen.push({ zeile: z, zellen })
  }
  return { kopf, zeilen }
}

function findeBlatt(
  arbeitsmappe: import('exceljs').Workbook,
  name: string,
): import('exceljs').Worksheet | undefined {
  return arbeitsmappe.worksheets.find((b) => normalisiere(b.name) === normalisiere(name))
}

export async function liesKatalogExcel(daten: ArrayBuffer): Promise<KatalogExcelInhalt> {
  const ExcelJS = await ladeExcelJs()
  const arbeitsmappe = new ExcelJS.Workbook()
  try {
    await arbeitsmappe.xlsx.load(daten)
  } catch {
    return {
      komponenten: [],
      varianten: [],
      fehler: [t('persistenz.katalogExcel.keineArbeitsmappe')],
    }
  }
  const komponentenBlatt =
    findeBlatt(arbeitsmappe, BLATT_KOMPONENTEN) ??
    arbeitsmappe.worksheets.find((b) => normalisiere(b.name) !== normalisiere(BLATT_VARIANTEN))
  const variantenBlatt = findeBlatt(arbeitsmappe, BLATT_VARIANTEN)
  return werteKatalogTabellenAus(
    komponentenBlatt ? leseBlatt(komponentenBlatt) : null,
    variantenBlatt ? leseBlatt(variantenBlatt) : null,
  )
}
