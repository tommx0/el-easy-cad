export interface SymbolVorlage {
  name: string
  url: string
  vorausgewaehlt?: boolean
}

export const MAX_EINGEBETTETE_BILDKANTE = 1024

export function svgGroesse(svg: string): { breite: number; hoehe: number } | null {
  const kopf = /<svg\b[^>]*>/i.exec(svg)?.[0]
  if (!kopf) return null
  const viewBox = /\bviewBox\s*=\s*["']([^"']+)["']/i.exec(kopf)?.[1]
  if (viewBox) {
    const werte = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    if (werte.length === 4 && werte[2] > 0 && werte[3] > 0) {
      return { breite: werte[2], hoehe: werte[3] }
    }
  }
  const breite = parseFloat(/\bwidth\s*=\s*["']([^"']+)["']/i.exec(kopf)?.[1] ?? '')
  const hoehe = parseFloat(/\bheight\s*=\s*["']([^"']+)["']/i.exec(kopf)?.[1] ?? '')
  return breite > 0 && hoehe > 0 ? { breite, hoehe } : null
}

export function textAlsBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binaer = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binaer += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binaer)
}

export function ladeBild(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const bild = new Image()
    bild.onload = () => resolve(bild)
    bild.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'))
    bild.src = url
  })
}

function istSvg(blob: Blob, anfang: string): boolean {
  if (blob.type.includes('svg')) return true
  if (blob.type.startsWith('image/')) return false
  return /^\s*(<\?xml[^>]*>\s*)?<svg\b/i.test(anfang)
}

export async function vorlageAlsDatenUrl(
  url: string,
): Promise<{ datenUrl: string; breite: number; hoehe: number }> {
  const blob = await (await fetch(url)).blob()
  const anfang = blob.size < 20_000_000 ? await blob.slice(0, 512).text() : ''
  if (istSvg(blob, anfang)) {
    const text = await blob.text()
    const groesse = svgGroesse(text) ?? { breite: 100, hoehe: 100 }
    return { datenUrl: `data:image/svg+xml;base64,${textAlsBase64(text)}`, ...groesse }
  }
  const bild = await ladeBild(url)
  const faktor = Math.min(
    1,
    MAX_EINGEBETTETE_BILDKANTE / Math.max(bild.naturalWidth, bild.naturalHeight, 1),
  )
  const breite = Math.max(1, Math.round(bild.naturalWidth * faktor))
  const hoehe = Math.max(1, Math.round(bild.naturalHeight * faktor))
  const canvas = document.createElement('canvas')
  canvas.width = breite
  canvas.height = hoehe
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Bild konnte nicht umgerechnet werden.')
  ctx.drawImage(bild, 0, 0, breite, hoehe)
  return { datenUrl: canvas.toDataURL('image/png'), breite, hoehe }
}
