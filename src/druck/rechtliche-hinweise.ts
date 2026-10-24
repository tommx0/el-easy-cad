import type { Zeichnungsart } from '../document-model'
import { erzeugeUebersetzer, QUELLSPRACHE, type Uebersetzer } from '../sprache'

export interface HinweisAbschnitt {
  titel: string
  text: string
}

const DEUTSCH = erzeugeUebersetzer(QUELLSPRACHE)

export function planHinweis(zeichnungsart: Zeichnungsart, tp: Uebersetzer): HinweisAbschnitt {
  if (zeichnungsart === 'schaltplan') {
    return { titel: tp('druck.hinweis.schaltplanTitel'), text: tp('druck.hinweis.pruefpflicht') }
  }
  return {
    titel: tp('druck.hinweis.planTitel'),
    text: `${tp('druck.hinweis.planText')} ${tp('druck.hinweis.pruefpflicht')}`,
  }
}

export function planHinweisMitLizenznehmer(
  lizenznehmer: string | null,
  zeichnungsart: Zeichnungsart,
  tp: Uebersetzer,
): HinweisAbschnitt {
  const hinweis = planHinweis(zeichnungsart, tp)
  if (!lizenznehmer) return hinweis
  return {
    ...hinweis,
    text: `${hinweis.text} ${tp('druck.hinweis.lizenziertFuer', { name: lizenznehmer })}`,
  }
}

export function rechtlicheHinweise(tp: Uebersetzer = DEUTSCH): HinweisAbschnitt[] {
  return [
    {
      titel: tp('druck.rechtliches.uebersichtTitel'),
      text: tp('druck.rechtliches.uebersichtText'),
    },
    {
      titel: tp('druck.rechtliches.planungshilfeTitel'),
      text: tp('druck.rechtliches.planungshilfeText'),
    },
    { titel: tp('druck.rechtliches.pruefungTitel'), text: tp('druck.rechtliches.pruefungText') },
    {
      titel: tp('druck.rechtliches.herstellerTitel'),
      text: tp('druck.rechtliches.herstellerText'),
    },
  ]
}

export function excelFusszeile(lizenznehmer: string | null, tp: Uebersetzer = DEUTSCH): string {
  const blatt = tp('druck.rechtliches.blattName')
  const links = lizenznehmer
    ? tp('druck.excelFusszeile.linksMitLizenz', { blatt, name: lizenznehmer })
    : tp('druck.excelFusszeile.links', { blatt })
  return `&L&8${links}&R&8${tp('druck.excelFusszeile.seite')}`
}
