import { erzeugeUebersetzer, QUELLSPRACHE, type Uebersetzer } from '../sprache'

export function demoWasserzeichenText(tp: Uebersetzer): string {
  return tp('druck.wasserzeichen')
}

export const DEMO_WASSERZEICHEN_TEXT = demoWasserzeichenText(erzeugeUebersetzer(QUELLSPRACHE))

export function zeichneDemoWasserzeichen(
  ctx: CanvasRenderingContext2D,
  breitePx: number,
  hoehePx: number,
  tp: Uebersetzer,
): void {
  if (breitePx <= 0 || hoehePx <= 0) return
  const text = demoWasserzeichenText(tp)

  ctx.save()
  ctx.globalAlpha = 0.14
  ctx.fillStyle = '#cc0000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const diagonale = Math.hypot(breitePx, hoehePx)
  let schriftgroesse = Math.max(10, Math.min(breitePx, hoehePx) * 0.07)
  ctx.font = `bold ${schriftgroesse}px sans-serif`
  const gemesseneBreite = ctx.measureText(text).width
  const zielBreite = diagonale * 0.8
  if (gemesseneBreite > zielBreite) {
    schriftgroesse = Math.max(8, schriftgroesse * (zielBreite / gemesseneBreite))
    ctx.font = `bold ${schriftgroesse}px sans-serif`
  }

  ctx.translate(breitePx / 2, hoehePx / 2)
  ctx.rotate(-Math.PI / 6)

  const zeilenAbstand = schriftgroesse * 3.5
  for (let y = -diagonale; y <= diagonale; y += zeilenAbstand) {
    ctx.fillText(text, 0, y)
  }
  ctx.restore()
}
