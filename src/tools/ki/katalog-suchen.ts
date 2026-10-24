import type { CatalogComponent } from '../../document-model'
import {
  katalogText,
  komponentenSuchtexte,
  komponentenText,
  sichtbareKomponenten,
  variantenText,
} from '../../document-model'
import { oberflaechensprache, SPRACHEN } from '../../sprache'
import type { KiErgebnis, KiKontext } from './kontext'

export interface KatalogSuchenEingabe {
  text?: string
  geraetetyp?: string
  katalogId?: string
  maxAnzahl?: number
}

const STANDARD_MAX_ANZAHL = 30

function suchtext(k: CatalogComponent): string {
  return [
    ...komponentenSuchtexte(k, SPRACHEN),
    k.hersteller,
    k.artikelnummer,
    k.typ,
    ...k.varianten.flatMap((v) => [
      ...SPRACHEN.flatMap((s) => [variantenText(k, v, 'name', s), variantenText(k, v, 'farbe', s)]),
      v.artikelnummer,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function dockpunktAnzahl(k: CatalogComponent): number | undefined {
  const d = k.dockpunkte
  if (!d) return undefined
  if (d.modus === 'frei') return d.punkte.length
  return d.gruppen.reduce((summe, g) => summe + g.anzahl, 0)
}

export function katalogSuchen(eingabe: KatalogSuchenEingabe, kontext: KiKontext): KiErgebnis {
  const kataloge = kontext.kataloge()
  const sprache = oberflaechensprache()
  const katalogName = new Map(kataloge.map((k) => [k.id, katalogText(k, 'name', sprache)]))
  const woerter = (eingabe.text ?? '').toLowerCase().split(/\s+/).filter(Boolean)
  const treffer = sichtbareKomponenten(kontext.katalogKomponenten(), kataloge).filter((k) => {
    if (eingabe.katalogId && k.katalogId !== eingabe.katalogId) return false
    if (eingabe.geraetetyp && k.typ !== eingabe.geraetetyp) return false
    if (woerter.length === 0) return true
    const text = suchtext(k)
    return woerter.every((w) => text.includes(w))
  })
  const max = eingabe.maxAnzahl ?? STANDARD_MAX_ANZAHL
  return {
    daten: {
      anzahl: treffer.length,
      ...(treffer.length > max ? { abgeschnittenAuf: max } : {}),
      treffer: treffer.slice(0, max).map((k) => ({
        id: k.id,
        name: komponentenText(k, 'name', sprache),
        katalog: katalogName.get(k.katalogId) ?? k.katalogId,
        ...(k.hersteller ? { hersteller: k.hersteller } : {}),
        ...(k.artikelnummer ? { artikelnummer: k.artikelnummer } : {}),
        ...(k.kategorie ? { kategorie: komponentenText(k, 'kategorie', sprache) } : {}),
        ...(k.typ ? { geraetetyp: k.typ } : {}),
        ...(k.montageort ? { montageort: k.montageort } : {}),
        ...(k.bauart ? { bauart: k.bauart } : {}),
        ...(dockpunktAnzahl(k) !== undefined ? { dockpunkte: dockpunktAnzahl(k) } : {}),
        ...(k.varianten.length > 0
          ? {
              varianten: k.varianten.map((v) => ({
                id: v.id,
                name:
                  (v.name && variantenText(k, v, 'name', sprache)) ||
                  (v.farbe && variantenText(k, v, 'farbe', sprache)) ||
                  v.id,
                ...(v.artikelnummer ? { artikelnummer: v.artikelnummer } : {}),
              })),
            }
          : {}),
      })),
    },
  }
}
