import { ladeExcelJs, zellenText } from './katalog-excel/lesen'

export interface ModulExcelBlattGelesen {
  name: string
  zeilen: string[][]
}

export interface ModulExcelSpalte {
  titel: string
  breite?: number
  auswahl?: string[]
}

export interface ModulExcelBlatt {
  name: string
  spalten: ModulExcelSpalte[]
  zeilen: (string | number | null)[][]
}

const AUSWAHL_ZEILEN = 2000

export async function leseModulExcel(inhalt: Uint8Array): Promise<ModulExcelBlattGelesen[]> {
  const ExcelJs = await ladeExcelJs()
  const mappe = new ExcelJs.Workbook()
  await mappe.xlsx.load(
    inhalt.buffer.slice(inhalt.byteOffset, inhalt.byteOffset + inhalt.byteLength) as ArrayBuffer,
  )
  return mappe.worksheets.map((blatt) => {
    const zeilen: string[][] = []
    blatt.eachRow({ includeEmpty: true }, (zeile, nr) => {
      const werte: string[] = []
      zeile.eachCell({ includeEmpty: true }, (zelle, spalte) => {
        werte[spalte - 1] = zellenText(zelle.value).trim()
      })
      zeilen[nr - 1] = Array.from(werte, (w) => w ?? '')
    })
    const dicht = Array.from(zeilen, (z) => z ?? [])
    while (dicht.length > 0 && dicht[dicht.length - 1]!.every((w) => w === '')) dicht.pop()
    return { name: blatt.name, zeilen: dicht }
  })
}

function spaltenBuchstabe(nr: number): string {
  let s = ''
  for (let n = nr; n > 0; n = Math.floor((n - 1) / 26))
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

export async function schreibeModulExcel(blaetter: readonly ModulExcelBlatt[]): Promise<Blob> {
  const ExcelJs = await ladeExcelJs()
  const mappe = new ExcelJs.Workbook()
  for (const b of blaetter) {
    const blatt = mappe.addWorksheet(b.name.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31) || 'Blatt')
    blatt.columns = b.spalten.map((s) => ({ header: s.titel, width: s.breite ?? 14 }))
    blatt.getRow(1).font = { bold: true }
    blatt.views = [{ state: 'frozen', ySplit: 1 }]
    for (const zeile of b.zeilen) blatt.addRow(zeile.map((w) => (w === null ? '' : w)))
    b.spalten.forEach((s, i) => {
      if (!s.auswahl || s.auswahl.length === 0) return
      const liste = `"${s.auswahl.map((w) => w.replace(/"/g, '""')).join(',')}"`
      const buchstabe = spaltenBuchstabe(i + 1)
      for (let z = 2; z <= AUSWAHL_ZEILEN; z++)
        blatt.getCell(`${buchstabe}${z}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [liste],
        }
    })
  }
  const puffer = await mappe.xlsx.writeBuffer()
  return new Blob([puffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
