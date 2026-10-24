import { BEFEHL_NACH_ID, befehlName } from '../befehle/katalog'
import { KAPITEL, type Kapitel } from './kapitel'

export interface Treffer {
  kapitelId: string
  kapitelNummer: number
  kapitelTitel: string
  abschnittId: string | null
  abschnittTitel: string
  vor: string
  fund: string
  nach: string
}

export function normalisiere(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

export function klartext(markdown: string): string {
  return markdown
    .replace(/\{\{(?:befehl|kuerzel):([a-z0-9.-]+)\}\}/g, (_, id: string) =>
      BEFEHL_NACH_ID[id] ? befehlName(id) : id,
    )
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\{#[a-z0-9-]+\}/g, '')
    .replace(/[|*`#>]/g, ' ')
    .replace(/[ \t]+/g, ' ')
}

const UMGEBUNG = 70

function abschnittsTexte(kapitel: Kapitel) {
  const zeilen = kapitel.text.split('\n')
  const stuecke: { id: string | null; titel: string; text: string }[] = [
    { id: null, titel: kapitel.titel, text: '' },
  ]
  for (const zeile of zeilen) {
    const treffer = /^##\s+(.*?)\s*\{#([a-z0-9-]+)\}\s*$/.exec(zeile)
    if (treffer) {
      stuecke.push({ id: treffer[2], titel: treffer[1], text: treffer[1] + '\n' })
    } else {
      stuecke[stuecke.length - 1].text += zeile + '\n'
    }
  }
  return stuecke
}

export function suche(begriff: string, kapitel: Kapitel[] = KAPITEL, grenze = 40): Treffer[] {
  const gesucht = normalisiere(begriff.trim())
  if (gesucht.length < 2) return []
  const treffer: Treffer[] = []
  for (const k of kapitel) {
    for (const stueck of abschnittsTexte(k)) {
      const text = klartext(stueck.text)
      const stelle = normalisiere(text).indexOf(gesucht)
      if (stelle < 0) continue
      const roh = text.toLowerCase().indexOf(begriff.trim().toLowerCase())
      const von = roh >= 0 ? roh : stelle
      const bis = von + (roh >= 0 ? begriff.trim().length : gesucht.length)
      treffer.push({
        kapitelId: k.id,
        kapitelNummer: k.nummer,
        kapitelTitel: k.titel,
        abschnittId: stueck.id,
        abschnittTitel: stueck.titel,
        vor: (von > UMGEBUNG ? '… ' : '') + text.slice(Math.max(0, von - UMGEBUNG), von).trim(),
        fund: text.slice(von, bis),
        nach: text.slice(bis, bis + UMGEBUNG).trim() + (bis + UMGEBUNG < text.length ? ' …' : ''),
      })
      if (treffer.length >= grenze) return treffer
    }
  }
  return treffer
}
