const BILD_ENDUNGEN = new Set(['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'])

export function istBilddatei(name: string): boolean {
  const endung = name.split('.').pop()?.toLowerCase() ?? ''
  return BILD_ENDUNGEN.has(endung)
}

export function istSvgDatei(datei: { name: string; type?: string }): boolean {
  return datei.type === 'image/svg+xml' || datei.name.toLowerCase().endsWith('.svg')
}

export type GrafikFeld = 'bild' | 'symbol'
export type ImportBlatt = 'komponenten' | 'varianten'

export function grafikSchluessel(blatt: ImportBlatt, zeile: number, feld: GrafikFeld): string {
  return `${blatt}:${zeile}:${feld}`
}

export interface ImportDateien {
  jeName: ReadonlyMap<string, File>
  gewaehlt: ReadonlyMap<string, File>
}

export const LEERE_IMPORT_DATEIEN: ImportDateien = { jeName: new Map(), gewaehlt: new Map() }

export function ergaenzeDateien(
  bisher: ReadonlyMap<string, File>,
  neu: Iterable<File>,
): Map<string, File> {
  const ergebnis = new Map(bisher)
  for (const datei of neu) {
    if (istBilddatei(datei.name)) ergebnis.set(datei.name.toLowerCase(), datei)
  }
  return ergebnis
}

export type GrafikStatus =
  | { art: 'leer' }
  | { art: 'bestehend' }
  | { art: 'gefunden'; name: string }
  | { art: 'gewaehlt'; name: string }
  | { art: 'fehlt'; name: string }

export interface GrafikAufloesung {
  datei: File | null
  status: GrafikStatus
}

export function loeseGrafikAuf(
  dateien: ImportDateien,
  blatt: ImportBlatt,
  zeile: number,
  feld: GrafikFeld,
  dateiname: string,
  bestehendVorhanden: boolean,
): GrafikAufloesung {
  const gewaehlt = dateien.gewaehlt.get(grafikSchluessel(blatt, zeile, feld))
  if (gewaehlt) return { datei: gewaehlt, status: { art: 'gewaehlt', name: gewaehlt.name } }
  if (dateiname) {
    const gefunden = dateien.jeName.get(dateiname.toLowerCase())
    if (gefunden) return { datei: gefunden, status: { art: 'gefunden', name: gefunden.name } }
    return { datei: null, status: { art: 'fehlt', name: dateiname } }
  }
  return { datei: null, status: bestehendVorhanden ? { art: 'bestehend' } : { art: 'leer' } }
}
