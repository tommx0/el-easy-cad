import { strToU8, zipSync } from 'fflate'
import { typBezeichnung, waehlbareTypen } from '../../document-model'
import {
  BLATT_ANLEITUNG,
  BLATT_KOMPONENTEN,
  BLATT_VARIANTEN,
  KOMPONENTEN_KOEPFE,
  KOMPONENTEN_KOEPFE_EN,
  ladeExcelJs,
  TECHNISCHE_DATEN_PRAEFIX,
  VARIANTEN_KOEPFE,
  VARIANTEN_KOPF_AUSFUEHRUNG_EN,
} from './lesen'

export const MUSTER_ZIP_NAME = 'el.easy.CAD-Katalogimport-Muster.zip'
const MUSTER_EXCEL_NAME = 'Katalogimport-Muster.xlsx'
const BILDER_ORDNER = 'Bilder'

const svg = (inhalt: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inhalt}</svg>\n`

const MUSTER_GRAFIKEN: Record<string, string> = {
  'access-point.svg': svg(
    '<rect x="10" y="30" width="80" height="40" rx="12" fill="#f4f6f8" stroke="#8a94a3" stroke-width="3"/>' +
      '<circle cx="50" cy="50" r="5" fill="#2f7dd1"/>',
  ),
  'access-point-schwarz.svg': svg(
    '<rect x="10" y="30" width="80" height="40" rx="12" fill="#2b2f36" stroke="#111" stroke-width="3"/>' +
      '<circle cx="50" cy="50" r="5" fill="#5fb0ff"/>',
  ),
  'access-point-symbol.svg': svg(
    '<circle cx="50" cy="50" r="40" fill="none" stroke="#000" stroke-width="4"/>' +
      '<text x="50" y="62" font-size="34" font-family="sans-serif" text-anchor="middle">AP</text>',
  ),
  'bewegungsmelder.svg': svg(
    '<circle cx="50" cy="50" r="38" fill="#f4f6f8" stroke="#8a94a3" stroke-width="3"/>' +
      '<circle cx="50" cy="50" r="16" fill="#d7dde5"/>',
  ),
  'bewegungsmelder-symbol.svg': svg(
    '<rect x="15" y="15" width="70" height="70" fill="none" stroke="#000" stroke-width="4"/>' +
      '<path d="M30 70 Q50 20 70 70" fill="none" stroke="#000" stroke-width="4"/>',
  ),
  'steckdose-symbol.svg': svg(
    '<path d="M20 60 A30 30 0 0 1 80 60" fill="none" stroke="#000" stroke-width="4"/>' +
      '<line x1="50" y1="30" x2="50" y2="90" stroke="#000" stroke-width="4"/>',
  ),
}

type Zelle = string | number | { text: string; hyperlink: string }
const link = (datei: string): Zelle => ({ text: datei, hyperlink: `${BILDER_ORDNER}/${datei}` })

const TD_MONTAGE = `${TECHNISCHE_DATEN_PRAEFIX} Montage`

const KOMPONENTEN_KOPF = [
  ...Object.values(KOMPONENTEN_KOEPFE),
  TD_MONTAGE,
  ...Object.values(KOMPONENTEN_KOEPFE_EN),
]
const KOMPONENTEN_BEISPIELE: Zelle[][] = [
  [
    'WLAN Access Point',
    'Muster GmbH',
    'MUS-AP-100',
    'Netzwerk',
    'Netzwerktechnik',
    'Access Point',
    typBezeichnung('systemgeraet'),
    '',
    12.5,
    '',
    '',
    '',
    'IP20',
    link('access-point.svg'),
    link('access-point-symbol.svg'),
    'Decke',
    'Wireless access point',
    'Network',
    'Network technology',
    'Access point',
  ],
  [
    'Bewegungsmelder',
    'Muster GmbH',
    'MUS-BM-200',
    'Sensorik',
    'Gebäudeautomation',
    'Präsenz',
    typBezeichnung('sensor'),
    0.5,
    '',
    '',
    230,
    '',
    'IP44',
    'bewegungsmelder.svg',
    'bewegungsmelder-symbol.svg',
    'Wand',
    'Motion detector',
    'Sensors',
    'Building automation',
    'Presence',
  ],
  [
    'Steckdose 230 V',
    'Muster GmbH',
    'MUS-SD-300',
    'Installation',
    'Elektroinstallation',
    'Steckdose',
    typBezeichnung('verbraucher'),
    '',
    '',
    16,
    230,
    3,
    'IP20',
    '',
    link('steckdose-symbol.svg'),
    'Unterputz',
  ],
]

const VARIANTEN_KOPF = [
  ...Object.values(VARIANTEN_KOEPFE),
  TD_MONTAGE,
  VARIANTEN_KOPF_AUSFUEHRUNG_EN,
]
const VARIANTEN_BEISPIELE: Zelle[][] = [
  ['MUS-AP-100', 'Weiß', '', 'MUS-AP-100-WS', '', '', '', '', '', '', '', 'White'],
  [
    'MUS-AP-100',
    'Schwarz',
    '',
    'MUS-AP-100-SW',
    '',
    '',
    '',
    '',
    link('access-point-schwarz.svg'),
    '',
    '',
    'Black',
  ],
]

const ENGLISCHE_SPALTEN = Object.values(KOMPONENTEN_KOEPFE_EN)
  .map((kopf) => `„${kopf}“`)
  .join(', ')

const anleitungZeilen = (): string[] => [
  'Katalog-Massenimport für el.easy.CAD',
  '',
  'So geht es',
  '1. Im Blatt „Komponenten“ je Zeile eine Komponente eintragen. Pflicht ist nur „Name“.',
  '2. Bild und Symbol: Dateiname der Grafik eintragen – oder in die Zelle klicken, Strg+K (Mac: ⌘K) drücken und die Datei mit der Maus auswählen (Link einfügen).',
  '   Mindestens Bild oder Symbol ist Pflicht. Erlaubt sind PNG, JPG, SVG, WebP und GIF.',
  '3. Alle Grafiken in einen Ordner legen (in dieser Vorlage: „Bilder“).',
  '4. In el.easy.CAD im Katalogdialog den eigenen Katalog wählen, „Aus Excel importieren…“, dann diese Datei und den Bilderordner auswählen.',
  '5. Die Vorschau zeigt je Zeile „neu“, „aktualisiert“ oder den Fehler. Fehlende Grafiken lassen sich dort auch direkt per Maus zuordnen.',
  '',
  'Aktualisieren',
  '• Gibt es im Katalog schon eine Komponente mit derselben Artikelnummer, wird sie aktualisiert statt neu angelegt.',
  '• Leere Zellen lassen den bisherigen Wert stehen – die Liste lässt sich also pflegen und immer wieder einspielen.',
  '• Zeilen ohne Artikelnummer werden immer neu angelegt.',
  '',
  'Spalten',
  `• Typ: ${waehlbareTypen()
    .map((t) => t.bezeichnung)
    .join(', ')} (Auswahlliste).`,
  '• Leistung (W) und PoE-Leistung (W): Zahlen, Komma oder Punkt.',
  '• Nennstrom (A), Nennspannung (V), Polzahl und IP-Schutzart (z. B. IP44): Bemessungswerte für den IFC-Export. Varianten können sie einzeln abweichend angeben.',
  `• Jede Spalte, deren Überschrift mit „${TECHNISCHE_DATEN_PRAEFIX}“ beginnt, wird ein Eintrag der technischen Daten (z. B. „${TD_MONTAGE}“). Beliebig viele solche Spalten sind möglich.`,
  '• Die Reihenfolge der Spalten ist egal, erkannt wird an der Überschrift in Zeile 1.',
  '',
  'Englische Texte (optional)',
  `• ${ENGLISCHE_SPALTEN} und im Blatt „Varianten“ „${VARIANTEN_KOPF_AUSFUEHRUNG_EN}“ (englischer Text zu „Farbe“): so erscheint die Komponente in der englischen Oberfläche und in englischen Plänen.`,
  '• Leer lassen, wo es keine englische Fassung gibt – dann gilt der deutsche Text. Die Spalten dürfen auch ganz fehlen.',
  '',
  'Varianten (Blatt „Varianten“)',
  '• Je Zeile eine Ausführung, z. B. eine Farbe mit eigener Artikelnummer und eigenem Bild.',
  '• „Komponente (Artikelnummer)“ verweist auf die Grundkomponente – im Blatt „Komponenten“ oder schon im Katalog.',
  '• Leere Felder erben von der Grundkomponente. Gleiche Varianten-Artikelnummer = Variante wird aktualisiert.',
  '• Nicht aufgeführte Varianten bleiben erhalten, der Import löscht nichts.',
]

function fuelleTabelle(
  blatt: import('exceljs').Worksheet,
  kopf: string[],
  zeilen: Zelle[][],
  breiten: number[],
) {
  blatt.addRow(kopf)
  for (const zeile of zeilen) blatt.addRow(zeile)
  const kopfZeile = blatt.getRow(1)
  kopfZeile.font = { bold: true }
  kopfZeile.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3E8EF' } }
  blatt.views = [{ state: 'frozen', ySplit: 1 }]
  blatt.columns.forEach((spalte, i) => {
    spalte.width = breiten[i] ?? 16
  })
  blatt.eachRow((reihe, nummer) => {
    if (nummer === 1) return
    reihe.eachCell((zelle) => {
      if (zelle.hyperlink) zelle.font = { color: { argb: 'FF1F5FBF' }, underline: true }
    })
  })
}

export async function erzeugeMusterExcel(): Promise<Uint8Array> {
  const ExcelJS = await ladeExcelJs()
  const mappe = new ExcelJS.Workbook()
  mappe.creator = 'el.easy.CAD'

  const komponenten = mappe.addWorksheet(BLATT_KOMPONENTEN)
  fuelleTabelle(
    komponenten,
    KOMPONENTEN_KOPF,
    KOMPONENTEN_BEISPIELE,
    [24, 16, 16, 14, 20, 16, 16, 13, 17, 14, 17, 9, 13, 26, 28, 14, 24, 16, 20, 18],
  )
  const typSpalte = KOMPONENTEN_KOPF.indexOf(KOMPONENTEN_KOEPFE.typ) + 1
  const typListe = waehlbareTypen()
    .map((t) => t.bezeichnung)
    .join(',')
  for (let z = 2; z <= 500; z++) {
    komponenten.getCell(z, typSpalte).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${typListe}"`],
      showErrorMessage: true,
      errorTitle: 'Unbekannter Typ',
      error: `Bitte einen dieser Typen wählen: ${typListe.replaceAll(',', ', ')}`,
    }
  }

  const varianten = mappe.addWorksheet(BLATT_VARIANTEN)
  fuelleTabelle(
    varianten,
    VARIANTEN_KOPF,
    VARIANTEN_BEISPIELE,
    [26, 14, 16, 18, 14, 17, 9, 13, 28, 20, 14, 18],
  )

  const anleitung = mappe.addWorksheet(BLATT_ANLEITUNG)
  anleitung.getColumn(1).width = 140
  const texte = anleitungZeilen()
  for (const text of texte) anleitung.addRow([text])
  anleitung.getRow(1).font = { bold: true, size: 14 }
  for (const ueberschrift of [
    'So geht es',
    'Aktualisieren',
    'Spalten',
    'Englische Texte (optional)',
  ]) {
    const nummer = texte.indexOf(ueberschrift) + 1
    anleitung.getRow(nummer).font = { bold: true }
  }
  anleitung.getRow(texte.indexOf('Varianten (Blatt „Varianten“)') + 1).font = { bold: true }

  return new Uint8Array(await mappe.xlsx.writeBuffer())
}

export async function erzeugeMusterZip(): Promise<Blob> {
  const dateien: Record<string, Uint8Array> = {
    [MUSTER_EXCEL_NAME]: await erzeugeMusterExcel(),
  }
  for (const [name, inhalt] of Object.entries(MUSTER_GRAFIKEN)) {
    dateien[`${BILDER_ORDNER}/${name}`] = strToU8(inhalt)
  }
  return new Blob([zipSync(dateien) as Uint8Array<ArrayBuffer>], { type: 'application/zip' })
}
