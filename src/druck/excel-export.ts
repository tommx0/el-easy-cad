import type { Workbook, Worksheet, RichText } from 'exceljs'
import type { Uebersetzer } from '../sprache'
import type { CatalogComponent, SlotMatrixGrafik, Zeichnung } from '../document-model'
import {
  alleGeraetePortRohdaten,
  geraetePortSpalten,
  LEITUNGSLISTEN_SPALTEN,
  leitungslistenRohdaten,
  RAUMLISTEN_SPALTEN,
  raumlistenRohdaten,
  STEUERUNGSLOGIK_SPALTEN,
  steuerungslogikRohdaten,
  STUECKLISTEN_SPALTEN,
  stuecklistenRohdaten,
  TRUNKLISTEN_SPALTEN,
  trunklistenRohdaten,
  STROMKREISVERZEICHNIS_SPALTEN,
  stromkreisverzeichnisRohdaten,
  aktorkanallisteRohdaten,
  AKTORKANALLISTE_SPALTEN,
  alleVerteiler,
  istSchaltplan,
  planUebersetzer,
  spaltenKoepfe,
  verteilerKennzeichenText,
  type TabellenRohdaten,
} from '../document-model'
import { demoWasserzeichenText, SLOT_MATRIX_GRAU, SLOT_MATRIX_ROT } from '../rendering'
import { excelFusszeile, rechtlicheHinweise } from './rechtliche-hinweise'

const MATRIX_SCHRIFT = 'Consolas'
const MATRIX_ZEICHEN = '█'
const ZEILEN_HOEHE_EM = 1.17
const MATRIX_FELD_PT = 40
const MATRIX_SPALT_PT = 2
const halbePunkte = (pt: number) => Math.round(pt * 2) / 2

function argb(farbe: string): { argb: string } {
  return { argb: `FF${farbe.slice(1).toUpperCase()}` }
}

export function slotMatrixAlsRichText(matrix: SlotMatrixGrafik): RichText[] {
  const reihen = matrix.reihen.length
  const zeichenJeReihe = 2 * reihen
  const groesse = halbePunkte(MATRIX_FELD_PT / (reihen * ZEILEN_HOEHE_EM))
  const breiteGroesse = halbePunkte(groesse + MATRIX_SPALT_PT / zeichenJeReihe)
  const spalt = { name: MATRIX_SCHRIFT, size: MATRIX_SPALT_PT }

  const teile: RichText[] = []
  let slotIndex = 0
  const slot = (anzahlZeichen: number, size: number): RichText => {
    const farbe = slotIndex === matrix.hervorgehoben ? SLOT_MATRIX_ROT : SLOT_MATRIX_GRAU
    slotIndex++
    return {
      text: MATRIX_ZEICHEN.repeat(anzahlZeichen),
      font: { name: MATRIX_SCHRIFT, size, color: argb(farbe) },
    }
  }
  matrix.reihen.forEach((spalten, reihe) => {
    if (spalten === 1) {
      teile.push(slot(zeichenJeReihe, breiteGroesse))
    } else {
      teile.push(slot(zeichenJeReihe / 2, groesse))
      teile.push({ text: ' ', font: spalt })
      teile.push(slot(zeichenJeReihe / 2, groesse))
    }
    if (reihe < reihen - 1)
      teile.push({ text: '\n', font: { name: MATRIX_SCHRIFT, size: groesse } })
  })
  return teile
}

function spaltenBreite(titel: string, zellen: string[]): number {
  const breiteste = zellen.reduce((breite, text) => Math.max(breite, text.length), titel.length)
  return Math.min(Math.max(breiteste + 2, 10), 40)
}

function fuegeBlattHinzu(
  arbeitsmappe: Workbook,
  name: string,
  kopf: string[],
  rohdaten: TabellenRohdaten,
  tp: Uebersetzer,
  wasserzeichenAktiv = false,
  lizenznehmer: string | null = null,
): Worksheet {
  const ws = arbeitsmappe.addWorksheet(name)
  if (wasserzeichenAktiv) {
    const hinweis = ws.addRow([demoWasserzeichenText(tp)])
    hinweis.font = { bold: true, color: { argb: DEMO_ROT } }
    hinweis.alignment = { horizontal: 'center' }
    ws.mergeCells(1, 1, 1, Math.max(kopf.length, 1))
    ws.headerFooter.oddHeader = `&C&B${demoWasserzeichenText(tp)}`
  }
  const kopfZeile = ws.rowCount + 1
  ws.addRow(kopf).font = { bold: true }
  const grafik = rohdaten.slotGrafik

  rohdaten.zeilen.forEach((zeile, index) => {
    const excelZeile = ws.addRow(zeile)
    const matrix = grafik?.jeZeile[index]
    if (!grafik || !matrix) return
    excelZeile.height = MATRIX_FELD_PT + 8
    excelZeile.alignment = { vertical: 'middle' }
    const zelle = excelZeile.getCell(grafik.spalte + 1)
    zelle.value = { richText: slotMatrixAlsRichText(matrix) }
    zelle.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' }
  })
  ws.addRow(rohdaten.summe).font = { bold: true }
  ws.headerFooter.oddFooter = excelFusszeile(lizenznehmer, tp)

  ws.autoFilter = {
    from: { row: kopfZeile, column: 1 },
    to: { row: kopfZeile, column: kopf.length },
  }
  ws.columns = kopf.map((titel, spalte) => {
    if (grafik?.spalte === spalte) {
      return { width: Math.max(titel.length + 2, Math.ceil((MATRIX_FELD_PT + 10) / 5.5)) }
    }
    return {
      width: spaltenBreite(
        titel,
        rohdaten.zeilen.map((z) => z[spalte] ?? ''),
      ),
    }
  })
  return ws
}

export function rechtlichesBlatt(tp: Uebersetzer): string {
  return tp('druck.rechtliches.blattName')
}

const AKZENT = 'FF2F7DD1'
const AKZENT_DUNKEL = 'FF2569B3'
const AKZENT_RAND = 'FFBCD8F4'
const DEMO_ROT = 'FFCC0000'
const TEXT_GRAU = 'FF3A3A3A'
const LEISE_GRAU = 'FF7A7A7A'
const HINWEIS_SPALTE_BREITE = 95
const ZEICHEN_JE_ZEILE = Math.floor(HINWEIS_SPALTE_BREITE * 1.15)
const TEXT_ZEILENHOEHE_PT = 14.5

function fuegeRechtlichesBlattHinzu(
  arbeitsmappe: Workbook,
  tp: Uebersetzer,
  wasserzeichenAktiv = false,
): Worksheet {
  const ws = arbeitsmappe.addWorksheet(rechtlichesBlatt(tp), {
    properties: { tabColor: { argb: AKZENT } },
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.7, right: 0.7, top: 0.8, bottom: 0.8, header: 0.3, footer: 0.3 },
    },
  })
  ws.columns = [{ width: 1.5 }, { width: 2.5 }, { width: HINWEIS_SPALTE_BREITE }, { width: 2 }]
  const akzentLeiste = (zeile: number) => {
    ws.getCell(zeile, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AKZENT } }
  }

  ws.getRow(1).height = 10
  const titel = ws.getCell('C2')
  titel.value = tp('planlisten.excel.rechtlichesTitel')
  titel.font = { name: 'Calibri', size: 20, bold: true, color: { argb: TEXT_GRAU } }
  ws.getRow(2).height = 30
  const unterzeile = ws.getCell('C3')
  unterzeile.value = tp('planlisten.excel.rechtlichesUnterzeile')
  unterzeile.font = { name: 'Calibri', size: 11, italic: true, color: { argb: LEISE_GRAU } }
  ws.getRow(3).height = 18
  akzentLeiste(2)
  akzentLeiste(3)
  ws.getCell('C3').border = { bottom: { style: 'medium', color: { argb: AKZENT } } }
  ws.getRow(4).height = 14

  let zeile = 5
  if (wasserzeichenAktiv) {
    const demo = ws.getCell(zeile, 3)
    demo.value = demoWasserzeichenText(tp)
    demo.font = { name: 'Calibri', size: 12.5, bold: true, color: { argb: DEMO_ROT } }
    demo.alignment = { wrapText: true, vertical: 'top' }
    ws.getRow(zeile).height = 22
    zeile++
    const demoText = ws.getCell(zeile, 3)
    demoText.value = tp('planlisten.excel.demoText')
    demoText.font = { name: 'Calibri', size: 10.5, color: { argb: TEXT_GRAU } }
    demoText.alignment = { wrapText: true, vertical: 'top' }
    ws.getRow(zeile).height = TEXT_ZEILENHOEHE_PT + 6
    zeile++
    ws.getRow(zeile).height = 10
    zeile++
  }
  rechtlicheHinweise(tp).forEach((abschnitt, index) => {
    const kopf = ws.getCell(zeile, 3)
    kopf.value = `${index + 1}  ${abschnitt.titel}`
    kopf.font = { name: 'Calibri', size: 12.5, bold: true, color: { argb: AKZENT_DUNKEL } }
    kopf.border = { bottom: { style: 'thin', color: { argb: AKZENT_RAND } } }
    kopf.alignment = { vertical: 'bottom' }
    ws.getRow(zeile).height = 22
    zeile++

    const text = ws.getCell(zeile, 3)
    text.value = abschnitt.text
    text.font = { name: 'Calibri', size: 10.5, color: { argb: TEXT_GRAU } }
    text.alignment = { wrapText: true, vertical: 'top' }
    const zeilen = Math.ceil(abschnitt.text.length / ZEICHEN_JE_ZEILE)
    ws.getRow(zeile).height = zeilen * TEXT_ZEILENHOEHE_PT + 6
    zeile++

    ws.getRow(zeile).height = 10
    zeile++
  })

  const schluss = ws.getCell(zeile, 3)
  schluss.value = tp('planlisten.excel.schluss')
  schluss.font = { name: 'Calibri', size: 9, italic: true, color: { argb: LEISE_GRAU } }
  schluss.alignment = { wrapText: true, vertical: 'top' }
  schluss.border = { top: { style: 'thin', color: { argb: AKZENT_RAND } } }
  ws.getRow(zeile).height = 28
  return ws
}

export async function exportiereAlsExcel(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  wasserzeichenAktiv = false,
  lizenznehmer: string | null = null,
  verknuepft: { bauplaene: readonly Zeichnung[]; verteilerplaene: readonly Zeichnung[] } = {
    bauplaene: [],
    verteilerplaene: [],
  },
): Promise<Blob> {
  const modul = await import('exceljs')
  const ExcelJS = (modul as unknown as { default?: typeof modul }).default ?? modul

  const blattId = ''
  const tp = planUebersetzer(zeichnung)

  const arbeitsmappe = new ExcelJS.Workbook()
  const stueckliste = stuecklistenRohdaten(zeichnung, blattId, 'projekt', katalog, tp)
  fuegeBlattHinzu(
    arbeitsmappe,
    tp('planlisten.excel.blaetter.stueckliste'),
    spaltenKoepfe(stueckliste.spalten ?? STUECKLISTEN_SPALTEN, tp),
    stueckliste,
    tp,
    wasserzeichenAktiv,
    lizenznehmer,
  )
  fuegeBlattHinzu(
    arbeitsmappe,
    tp('planlisten.excel.blaetter.switche'),
    geraetePortSpalten('switch', tp),
    alleGeraetePortRohdaten(zeichnung, katalog, 'switch', tp),
    tp,
    wasserzeichenAktiv,
    lizenznehmer,
  )
  fuegeBlattHinzu(
    arbeitsmappe,
    tp('planlisten.excel.blaetter.patchfelder'),
    geraetePortSpalten('patchpanel', tp),
    alleGeraetePortRohdaten(zeichnung, katalog, 'patchpanel', tp),
    tp,
    wasserzeichenAktiv,
    lizenznehmer,
  )
  const leitungsliste = leitungslistenRohdaten(
    zeichnung,
    blattId,
    'projekt',
    katalog,
    !zeichnung.blaetter.some((blatt) =>
      blatt.objekte.some((o) => o.type === 'leitungsliste' && o.stromkreisSpalte === false),
    ),
    verknuepft.verteilerplaene,
    tp,
  )
  fuegeBlattHinzu(
    arbeitsmappe,
    tp('planlisten.excel.blaetter.leitungsliste'),
    spaltenKoepfe(leitungsliste.spalten ?? LEITUNGSLISTEN_SPALTEN, tp),
    leitungsliste,
    tp,
    wasserzeichenAktiv,
    lizenznehmer,
  )
  fuegeBlattHinzu(
    arbeitsmappe,
    tp('planlisten.excel.blaetter.trunkliste'),
    spaltenKoepfe(TRUNKLISTEN_SPALTEN, tp),
    trunklistenRohdaten(zeichnung, blattId, 'projekt', tp),
    tp,
    wasserzeichenAktiv,
    lizenznehmer,
  )
  fuegeBlattHinzu(
    arbeitsmappe,
    tp('planlisten.excel.blaetter.raumliste'),
    spaltenKoepfe(RAUMLISTEN_SPALTEN, tp),
    raumlistenRohdaten(zeichnung, blattId, 'projekt', tp),
    tp,
    wasserzeichenAktiv,
    lizenznehmer,
  )
  fuegeBlattHinzu(
    arbeitsmappe,
    tp('planlisten.excel.blaetter.steuerungslogik'),
    spaltenKoepfe(STEUERUNGSLOGIK_SPALTEN, tp),
    steuerungslogikRohdaten(
      zeichnung,
      blattId,
      'projekt',
      katalog,
      zeichnung.blaetter.some((blatt) =>
        blatt.objekte.some((o) => o.type === 'steuerungslogik' && o.unbelegteSlotsAusblenden),
      ),
      tp,
    ),
    tp,
    wasserzeichenAktiv,
    lizenznehmer,
  )
  const verteilerKennzeichen = istSchaltplan(zeichnung)
    ? [zeichnung.verteilerKennzeichen].filter((k): k is string => !!k)
    : alleVerteiler(zeichnung).map((v) => v.verteiler.verteiler?.kennzeichen ?? '')
  for (const kennzeichen of [...new Set(verteilerKennzeichen)].filter(Boolean)) {
    fuegeBlattHinzu(
      arbeitsmappe,
      tp('planlisten.excel.blaetter.stromkreise', {
        verteiler: verteilerKennzeichenText(kennzeichen),
      }).slice(0, 31),
      spaltenKoepfe(STROMKREISVERZEICHNIS_SPALTEN, tp),
      stromkreisverzeichnisRohdaten(
        zeichnung,
        katalog,
        kennzeichen,
        verknuepft.bauplaene,
        verknuepft.verteilerplaene,
        tp,
      ),
      tp,
      wasserzeichenAktiv,
      lizenznehmer,
    )
  }
  for (const kennzeichen of istSchaltplan(zeichnung) && verteilerKennzeichen.length === 0
    ? [null]
    : [...new Set(verteilerKennzeichen)].filter(Boolean)) {
    const daten = aktorkanallisteRohdaten(
      zeichnung,
      katalog,
      kennzeichen,
      verknuepft.bauplaene,
      verknuepft.verteilerplaene,
      tp,
    )
    if (daten.zeilen.length === 0) continue
    fuegeBlattHinzu(
      arbeitsmappe,
      (kennzeichen
        ? tp('planlisten.excel.blaetter.aktorkanaeleMitVerteiler', {
            verteiler: verteilerKennzeichenText(kennzeichen),
          })
        : tp('planlisten.excel.blaetter.aktorkanaele')
      ).slice(0, 31),
      spaltenKoepfe(AKTORKANALLISTE_SPALTEN, tp),
      daten,
      tp,
      wasserzeichenAktiv,
      lizenznehmer,
    )
  }
  fuegeRechtlichesBlattHinzu(arbeitsmappe, tp, wasserzeichenAktiv)

  const daten = await arbeitsmappe.xlsx.writeBuffer()
  return new Blob([daten], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
