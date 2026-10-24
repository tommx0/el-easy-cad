import type {
  Blatt,
  HintergrundDxf,
  HintergrundPdf,
  Kalibrierung,
  Point,
} from '../../document-model'
import {
  berechneKalibrierAnpassung,
  distance,
  erkenneNormmassstab,
  meterProPdfPunkt,
  pdfMassstabNenner,
  istHintergrundGesperrt,
  hintergrundDrehungVon,
  hintergrundMassstab,
  istKalibrierbar,
  weltZuRoh,
  zeichenflaecheBoundingBox,
} from '../../document-model'
import { erzeugeBlattAendernCommand } from '../commands'
import type { Tool, ToolContext } from '../tool'
import type { Command } from '../command'
import { formatiereZahl, t } from '../../sprache'

export function erzeugeKalibrierenTool(): Tool {
  let punktA: Point | null = null

  return {
    id: 'kalibrieren',
    get bezeichnung() {
      return t('werkzeugnamen.kalibrieren')
    },
    kuerzel: 'K',
    onActivate(ctx) {
      punktA = null
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt?.hintergrund) {
        ctx.setStatus(t('werkzeuge.hintergrund.keiner'))
        return
      }
      if (!istKalibrierbar(blatt.hintergrund)) {
        ctx.setStatus(t('werkzeuge.kalibrieren.ifc'))
        return
      }
      if (istHintergrundGesperrt(blatt.ebenen)) {
        ctx.setStatus(t('werkzeuge.hintergrund.gesperrt'))
        return
      }
      ctx.setStatus(t('werkzeuge.kalibrieren.ersterPunkt'))
    },
    onDeactivate() {
      punktA = null
    },
    onPointerDown(info, ctx) {
      const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
      if (!blatt?.hintergrund || istHintergrundGesperrt(blatt.ebenen)) return
      const hintergrund = blatt.hintergrund
      if (!istKalibrierbar(hintergrund)) return
      if (!punktA) {
        punktA = info.raw
        ctx.setStatus(t('werkzeuge.kalibrieren.zweiterPunkt'))
        return
      }
      const punktB = info.raw
      const startPunkt = punktA
      let meldung: Meldung | null = null
      ctx.oeffneEingabeDialog(
        {
          titel: t('werkzeuge.kalibrieren.titel'),
          label: t('werkzeuge.kalibrieren.laenge'),
          hinweis: t('werkzeuge.kalibrieren.rohwert', {
            distanz: formatiereZahl(distance(startPunkt, punktB), {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          }),
          typ: 'zahl',
        },
        (wert) => {
          const realLaengeCm = wert ? Number(wert.replace(',', '.')) : null
          if (realLaengeCm && realLaengeCm > 0) {
            const rohA = weltZuRoh(blatt, startPunkt)
            const rohB = weltZuRoh(blatt, punktB)
            const rohAbstand = distance(rohA, rohB)
            if (rohAbstand > 0) {
              const geklickt = realLaengeCm / 100 / rohAbstand
              const norm =
                hintergrund.typ === 'pdf' ? erkenneNormmassstab(pdfMassstabNenner(geklickt)) : null
              const kalibrierung: Kalibrierung = {
                punktA: rohA,
                punktB: rohB,
                realLaengeMeter: realLaengeCm / 100,
                meterProEinheit: norm ? meterProPdfPunkt(norm) : geklickt,
                kalibriertAm: new Date().toISOString(),
                ...(norm ? { normmassstab: norm } : {}),
              }
              const { command, flaechenNenner } = erzeugeKalibrierCommand(
                ctx.doc,
                blatt,
                kalibrierung.meterProEinheit,
                { ...hintergrund, kalibrierung },
                norm,
              )
              ctx.commands.execute(command)
              zeigeZeichenflaeche(ctx)
              meldung = {
                breite: hintergrund.breiteRoh * kalibrierung.meterProEinheit,
                hoehe: hintergrund.hoeheRoh * kalibrierung.meterProEinheit,
                norm,
                flaechenNenner,
                papierformat: blatt.zeichenflaeche?.papierformat ?? null,
              }
            }
          }
          punktA = null
          ctx.zurueckZuAuswahl()
          if (meldung) {
            meldePlangroesse(ctx, meldung)
            meldung = null
          }
        },
      )
    },
    drawOverlay(g, ctx) {
      if (!punktA) return
      const p = ctx.view.worldToScreen(punktA)
      g.save()
      g.fillStyle = '#e0782f'
      g.beginPath()
      g.arc(p.x, p.y, 5, 0, Math.PI * 2)
      g.fill()
      g.restore()
    },
  }
}

interface Meldung {
  breite: number
  hoehe: number
  norm: number | null
  flaechenNenner: number | null
  papierformat: string | null
}

function meldePlangroesse(ctx: ToolContext, m: Meldung) {
  let massstab = ''
  if (m.norm !== null) {
    massstab =
      m.flaechenNenner === null || m.flaechenNenner === m.norm
        ? t(
            m.flaechenNenner === null
              ? 'werkzeuge.kalibrieren.erkannt'
              : 'werkzeuge.kalibrieren.erkanntDruck',
            { norm: String(m.norm) },
          )
        : t('werkzeuge.kalibrieren.erkanntPasstNicht', {
            norm: String(m.norm),
            papier: m.papierformat ?? '',
            nenner: String(m.flaechenNenner),
          })
  }
  ctx.setStatus(
    t('werkzeuge.kalibrieren.gesetzt', {
      massstab,
      breite: formatiereZahl(m.breite, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      hoehe: formatiereZahl(m.hoehe, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    }),
  )
}

function erzeugeKalibrierCommand(
  doc: ToolContext['doc'],
  blatt: Blatt,
  massstabNeu: number,
  hintergrund: HintergrundPdf | HintergrundDxf,
  norm: number | null,
): { command: Command; flaechenNenner: number | null } {
  if (!blatt.zeichenflaeche) {
    return {
      command: erzeugeBlattAendernCommand(doc, blatt.id, t('werkzeuge.kalibrieren.titel'), {
        hintergrund,
        massstab: massstabNeu,
      }),
      flaechenNenner: null,
    }
  }
  const anpassung = berechneKalibrierAnpassung(
    hintergrund,
    blatt.zeichenflaeche,
    hintergrundMassstab(blatt),
    massstabNeu,
    hintergrundDrehungVon(blatt),
    norm !== null && hintergrund.typ === 'pdf'
      ? { nenner: norm, inhaltRoh: hintergrund.inhaltRoh ?? null }
      : undefined,
  )
  return {
    command: erzeugeBlattAendernCommand(doc, blatt.id, t('werkzeuge.kalibrieren.titel'), {
      hintergrund,
      massstab: massstabNeu,
      ursprung: anpassung.ursprung,
      zeichenflaeche: anpassung.zeichenflaeche,
    }),
    flaechenNenner: anpassung.zeichenflaeche.massstabNenner,
  }
}

function zeigeZeichenflaeche(ctx: ToolContext) {
  const blatt = ctx.doc.getBlatt(ctx.aktivesBlattId())
  if (!blatt?.zeichenflaeche) return
  ctx.view.fitBoundingBox(zeichenflaecheBoundingBox(blatt.zeichenflaeche), ctx.getCanvasGroesse())
  ctx.requestOverlayRedraw()
}
