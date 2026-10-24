import type { Blatt, CatalogComponent } from '../../document-model'
import { findeRaumZuPunkt } from '../../document-model'
import type { KiErgebnis, KiKontext } from './kontext'
import { runde, waehleBlatt, zuBlatt } from './kontext'

interface Ausstattung {
  katalog: string
  anzahl: number
  ids?: string[]
}

function zusammengefasst(
  komponenten: readonly { id: string; katalog: string }[],
  mitIds: boolean,
): Ausstattung[] {
  const jeKatalog = new Map<string, string[]>()
  for (const k of komponenten) jeKatalog.set(k.katalog, [...(jeKatalog.get(k.katalog) ?? []), k.id])
  return [...jeKatalog]
    .map(([katalog, ids]) => ({ katalog, anzahl: ids.length, ...(mitIds ? { ids } : {}) }))
    .sort((a, b) => b.anzahl - a.anzahl || a.katalog.localeCompare(b.katalog, 'de'))
}

function raeumeAuf(blatt: Blatt, katalog: ReadonlyMap<string, CatalogComponent>, mitIds: boolean) {
  const komponentenJeRaum = new Map<string, { id: string; katalog: string }[]>()
  for (const o of blatt.objekte) {
    if (o.type !== 'komponente') continue
    const raum = findeRaumZuPunkt(blatt.objekte, o.position)
    if (!raum) continue
    const liste = komponentenJeRaum.get(raum.id) ?? []
    liste.push({ id: o.id, katalog: katalog.get(o.catalogComponentId)?.name ?? '?' })
    komponentenJeRaum.set(raum.id, liste)
  }
  return blatt.objekte.flatMap((o) =>
    o.type === 'raum'
      ? [
          {
            id: o.id,
            name: o.name,
            blattId: blatt.id,
            ...(blatt.geschoss?.name ? { etage: blatt.geschoss.name } : {}),
            flaecheM2: runde(o.flaeche, 2),
            ...(o.gueltig ? {} : { gueltig: false }),
            mittelpunkt: zuBlatt(o.mittelpunkt, blatt),
            umriss: o.umriss.map((p) => zuBlatt(p, blatt)),
            komponenten: zusammengefasst(komponentenJeRaum.get(o.id) ?? [], mitIds),
          },
        ]
      : [],
  )
}

export function raeumeLesen(
  eingabe: { blattId?: string; alleBlaetter?: boolean; mitIds?: boolean },
  kontext: KiKontext,
): KiErgebnis {
  const katalog = new Map(kontext.katalogKomponenten().map((k) => [k.id, k]))
  const blaetter = eingabe.alleBlaetter
    ? kontext.doc.getZeichnung().blaetter
    : [waehleBlatt(kontext, eingabe.blattId)]
  return {
    daten: { raeume: blaetter.flatMap((b) => raeumeAuf(b, katalog, eingabe.mitIds ?? false)) },
  }
}
