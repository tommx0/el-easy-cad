import { erzeugeUebersetzer, QUELLSPRACHE, type Uebersetzer } from '../sprache'

export function demoWasserzeichenText(tp: Uebersetzer): string {
  return tp('community.hinweis.ausgabe')
}

export const DEMO_WASSERZEICHEN_TEXT = demoWasserzeichenText(erzeugeUebersetzer(QUELLSPRACHE))

export function zeichneDemoWasserzeichen(
  ctx: CanvasRenderingContext2D,
  breitePx: number,
  hoehePx: number,
  tp: Uebersetzer,
): void {
  if (breitePx <= 0 || hoehePx <= 0) return
  const text = tp('community.hinweis.stempel')
  const kante = Math.min(breitePx, hoehePx)
  const schrift = Math.max(7, kante * 0.018)
  const rand = kante * 0.02
  ctx.save()
  ctx.font = `bold ${schrift}px sans-serif`
  const breite = ctx.measureText(text).width + schrift * 1.2
  const hoehe = schrift * 1.8
  const x = breitePx - rand - breite
  const y = rand
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = '#cc0000'
  ctx.fillStyle = '#cc0000'
  ctx.lineWidth = Math.max(1, schrift * 0.12)
  ctx.strokeRect(x, y, breite, hoehe)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + breite / 2, y + hoehe / 2)
  ctx.restore()
}
