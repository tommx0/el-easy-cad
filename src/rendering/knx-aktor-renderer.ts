import type { KnxAktorDaten, KnxAktorGeometrie, KomponentenObjekt } from '../document-model'
import {
  KNX_RASTER,
  knxAktorGeometrie,
  knxAktorTitel,
  knxKanalFunktionsText,
  knxKanalName,
  knxKanalPaare,
  knxPaarBeginn,
} from '../document-model'
import { t as oberflaechenText } from '../sprache'
import type { Uebersetzer } from '../sprache'

const TEXT_GROESSEN = [0.08, 0.07, 0.06] as const
const TITEL_GROESSE = 0.1
const KANAL_GROESSE = 0.07
const ANSCHLUSS_GROESSE = 0.06
const PFEIL = 0.05
const LUFT = 0.03
const ZEILENABSTAND = 1.2
const MIN_TEXT_PX = 2.5

interface TextFeld {
  links: number
  rechts: number
  unten: number
  oben: number
  zeilen: string[]
}

export function zeichneKnxAktor(
  ctx: CanvasRenderingContext2D,
  objekt: KomponentenObjekt & { knxAktor: KnxAktorDaten },
  halbXPx: number,
  halbYPx: number,
  liveBeschriftungen?: readonly (string | undefined)[],
  verweise?: readonly (string | undefined)[],
  tp: Uebersetzer = oberflaechenText,
): void {
  const daten = objekt.knxAktor
  const g = knxAktorGeometrie(daten)
  const s = (halbXPx * 2) / g.breite
  const sy = (halbYPx * 2) / g.hoehe
  const px = (x: number) => (x - g.breite / 2) * s
  const py = (y: number) => -(y - g.hoehe / 2) * sy
  ctx.save()
  ctx.setLineDash([])
  ctx.strokeStyle = objekt.farbe
  ctx.fillStyle = objekt.farbe

  const geteilt = g.reihen.length > 1
  g.reihen.forEach((r, i) => {
    const bruchRechts = geteilt && i < g.reihen.length - 1
    const bruchLinks = geteilt && i > 0
    ctx.beginPath()
    ctx.moveTo(px(0), py(r.oben))
    ctx.lineTo(px(g.breite), py(r.oben))
    if (bruchRechts) bruchkante(ctx, px(g.breite), py(r.oben), py(r.unten), s)
    else ctx.lineTo(px(g.breite), py(r.unten))
    ctx.lineTo(px(0), py(r.unten))
    if (bruchLinks) bruchkante(ctx, px(0), py(r.unten), py(r.oben), s)
    else ctx.closePath()
    ctx.stroke()
  })
  zeichneAnschluesse(ctx, g, px, py, s)

  const textJeMeter = Math.min(s, sy)
  if (KANAL_GROESSE * textJeMeter >= MIN_TEXT_PX) {
    zeichneTitelUndBus(
      ctx,
      daten,
      g,
      px,
      py,
      textJeMeter,
      tp,
      objekt.geraeteKennzeichen ? `-${objekt.geraeteKennzeichen}` : undefined,
    )
    const felder = zeichneKanalUndKlammer(
      ctx,
      daten,
      g,
      px,
      py,
      textJeMeter,
      tp,
      liveBeschriftungen,
    )
    zeichneTextFelder(ctx, felder, px, py, textJeMeter)
    if (verweise) zeichneVerweise(ctx, g, px, py, textJeMeter, verweise)
  }
  ctx.restore()
}

const BRUCH_AUSSCHLAG = 0.1

function bruchkante(ctx: CanvasRenderingContext2D, x: number, y0: number, y1: number, s: number) {
  const a = BRUCH_AUSSCHLAG * s
  const h = (y1 - y0) / 2
  ctx.bezierCurveTo(x + a, y0 + h * 0.33, x + a, y0 + h * 0.67, x, y0 + h)
  ctx.bezierCurveTo(x - a, y0 + h * 1.33, x - a, y0 + h * 1.67, x, y1)
}

function zeichneVerweise(
  ctx: CanvasRenderingContext2D,
  g: KnxAktorGeometrie,
  px: (x: number) => number,
  py: (y: number) => number,
  t: number,
  verweise: readonly (string | undefined)[],
) {
  ctx.font = `${KANAL_GROESSE * t}px sans-serif`
  const breite = (2 * KNX_RASTER - 2 * LUFT) * t
  verweise.forEach((text, kanal) => {
    if (!text) return
    const enden = g.anschluesse.filter((a) => a.kanal === kanal)
    if (enden.length === 0) return
    const x = px(enden.reduce((summe, a) => summe + a.x, 0) / enden.length)
    const y = py(Math.min(...enden.map((a) => a.y)) - LUFT)
    if (ctx.measureText(text).width <= breite) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(text, x, y)
      return
    }
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 0, 0)
    ctx.restore()
  })
}

function zeichneAnschluesse(
  ctx: CanvasRenderingContext2D,
  g: KnxAktorGeometrie,
  px: (x: number) => number,
  py: (y: number) => number,
  s: number,
) {
  const pfeil = PFEIL * s
  for (const a of g.anschluesse) {
    const reihe =
      a.kanal === undefined ? g.reihen[0] : g.reihen.find((r) => r.kanaele.includes(a.kanal!))!
    const kante = a.kanal === undefined ? reihe.oben : reihe.unten
    const x = px(a.x)
    ctx.beginPath()
    ctx.moveTo(x, py(kante))
    ctx.lineTo(x, py(a.y))
    ctx.stroke()
    if (a.art !== 'eingang' && a.art !== 'ausgang') continue
    const mitte = py((kante + a.y) / 2)
    const richtung = a.art === 'eingang' ? -1 : 1
    ctx.beginPath()
    ctx.moveTo(x, mitte + (richtung * pfeil) / 2)
    ctx.lineTo(x - pfeil / 2, mitte - (richtung * pfeil) / 2)
    ctx.lineTo(x + pfeil / 2, mitte - (richtung * pfeil) / 2)
    ctx.closePath()
    ctx.fill()
  }
}

function zeichneTitelUndBus(
  ctx: CanvasRenderingContext2D,
  daten: KnxAktorDaten,
  g: KnxAktorGeometrie,
  px: (x: number) => number,
  py: (y: number) => number,
  t: number,
  tp: Uebersetzer,
  kennzeichenText?: string,
) {
  const oben = g.reihen[0].oben
  ctx.font = `${TITEL_GROESSE * t}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(knxAktorTitel(daten, tp), px(KNX_RASTER / 2), py(oben - 0.06))
  for (const reihe of g.reihen.slice(1)) {
    const kennzeichen = kennzeichenText ? `${kennzeichenText} ` : ''
    ctx.fillText(
      tp('beschriftung.knxAktor.fortsetzung', {
        titel: `${kennzeichen}${knxAktorTitel(daten, tp)}`,
      }),
      px(KNX_RASTER / 2),
      py(reihe.oben - 0.06),
    )
  }
  ctx.font = `${ANSCHLUSS_GROESSE * t}px sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const a of g.anschluesse) {
    if (a.kanal !== undefined) continue
    ctx.fillText(a.name, px(a.x - 0.02), py((oben + a.y) / 2))
  }
}

function zeichneKanalUndKlammer(
  ctx: CanvasRenderingContext2D,
  daten: KnxAktorDaten,
  g: KnxAktorGeometrie,
  px: (x: number) => number,
  py: (y: number) => number,
  t: number,
  tp: Uebersetzer,
  live?: readonly (string | undefined)[],
): TextFeld[] {
  const felder: TextFeld[] = []
  const paare = new Set(knxKanalPaare(daten).map((p) => p.beginn))
  for (const reihe of g.reihen) {
    const textOben = reihe.oben - 0.24
    reihe.kanaele.forEach((kanal, p) => {
      const mitte = (2 * p + 1.5) * KNX_RASTER
      ctx.font = `${KANAL_GROESSE * t}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(knxKanalName(kanal), px(mitte), py(reihe.unten + LUFT))
      const beginn = knxPaarBeginn(daten, kanal)
      const funktion = knxKanalFunktionsText(daten, kanal, tp)
      if (beginn !== null) {
        ctx.fillText(funktion.teil ?? '', px(mitte), py(reihe.unten + 0.13))
        if (kanal !== beginn || !paare.has(kanal)) return
        const links = 2 * p * KNX_RASTER + KNX_RASTER / 2
        const rechts = links + 4 * KNX_RASTER
        const hoehe = reihe.unten + 0.24
        ctx.beginPath()
        ctx.moveTo(px(links + LUFT), py(hoehe - 0.04))
        ctx.lineTo(px(links + LUFT), py(hoehe))
        ctx.lineTo(px(rechts - LUFT), py(hoehe))
        ctx.lineTo(px(rechts - LUFT), py(hoehe - 0.04))
        ctx.stroke()
        felder.push({
          links,
          rechts,
          unten: hoehe + LUFT,
          oben: textOben,
          zeilen: zeilenVon(funktion.funktion, daten.kanaele[kanal].beschriftung ?? live?.[kanal]),
        })
        return
      }
      felder.push({
        links: 2 * p * KNX_RASTER + KNX_RASTER / 2,
        rechts: 2 * p * KNX_RASTER + 2.5 * KNX_RASTER,
        unten: reihe.unten + 0.13,
        oben: textOben,
        zeilen: zeilenVon(funktion.funktion, daten.kanaele[kanal].beschriftung ?? live?.[kanal]),
      })
    })
  }
  return felder
}

function zeilenVon(funktion: string, beschriftung: string | undefined): string[] {
  const text = beschriftung?.trim()
  return text ? [funktion, text] : [funktion]
}

function zeichneTextFelder(
  ctx: CanvasRenderingContext2D,
  felder: TextFeld[],
  px: (x: number) => number,
  py: (y: number) => number,
  t: number,
) {
  const waagerecht = waehleSchrift(ctx, felder, t, 'waagerecht')
  const lage = waagerecht ??
    waehleSchrift(ctx, felder, t, 'senkrecht') ?? {
      groesse: TEXT_GROESSEN[TEXT_GROESSEN.length - 1],
      richtung: 'senkrecht' as const,
      umbrochen: felder.map((f) => f.zeilen),
    }
  ctx.font = `${lage.groesse * t}px sans-serif`
  const zeile = lage.groesse * ZEILENABSTAND * t
  felder.forEach((feld, i) => {
    const zeilen = lage.umbrochen[i]
    ctx.save()
    ctx.beginPath()
    ctx.rect(
      px(feld.links),
      py(feld.oben),
      (feld.rechts - feld.links) * t,
      (feld.oben - feld.unten) * t,
    )
    ctx.clip()
    if (lage.richtung === 'waagerecht') {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      const mitte = px((feld.links + feld.rechts) / 2)
      zeilen.forEach((text, k) => {
        ctx.fillText(text, mitte, py(feld.unten) - (zeilen.length - 1 - k) * zeile)
      })
    } else {
      ctx.translate(px(feld.links + LUFT), py(feld.unten))
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      zeilen.forEach((text, k) => ctx.fillText(text, 0, k * zeile))
    }
    ctx.restore()
  })
}

function waehleSchrift(
  ctx: CanvasRenderingContext2D,
  felder: TextFeld[],
  t: number,
  richtung: 'waagerecht' | 'senkrecht',
): { groesse: number; richtung: 'waagerecht' | 'senkrecht'; umbrochen: string[][] } | null {
  for (const groesse of TEXT_GROESSEN) {
    ctx.font = `${groesse * t}px sans-serif`
    const umbrochen: string[][] = []
    let passt = true
    for (const feld of felder) {
      const breite = feld.rechts - feld.links - 2 * LUFT
      const hoehe = feld.oben - feld.unten
      const laenge = (richtung === 'waagerecht' ? breite : hoehe) * t
      const quer = (richtung === 'waagerecht' ? hoehe : breite) * t
      const zeilen = umbreche(ctx, feld.zeilen, laenge)
      if (!zeilen || zeilen.length * groesse * ZEILENABSTAND * t > quer + 0.5) {
        passt = false
        break
      }
      umbrochen.push(zeilen)
    }
    if (passt) return { groesse, richtung, umbrochen }
  }
  return null
}

function umbreche(
  ctx: CanvasRenderingContext2D,
  absaetze: string[],
  laengePx: number,
): string[] | null {
  const zeilen: string[] = []
  for (const absatz of absaetze) {
    let aktuell = ''
    for (const wort of absatz.split(/\s+/).filter(Boolean)) {
      if (ctx.measureText(wort).width > laengePx) return null
      const versuch = aktuell ? `${aktuell} ${wort}` : wort
      if (ctx.measureText(versuch).width <= laengePx) aktuell = versuch
      else {
        zeilen.push(aktuell)
        aktuell = wort
      }
    }
    if (aktuell) zeilen.push(aktuell)
  }
  return zeilen
}
