export interface BlattDurchgang<W> {
  blattIds: readonly string[]
  index: number
  uebersprungen: ReadonlySet<string>
  wahl: Readonly<Record<string, W>>
}

export function starteDurchgang<W>(blattIds: readonly string[], ersteWahl: W): BlattDurchgang<W> {
  if (blattIds.length === 0) throw new Error('Durchgang ohne Blatt.')
  return { blattIds, index: 0, uebersprungen: new Set(), wahl: { [blattIds[0]]: ersteWahl } }
}

export function aktuellesBlatt<W>(d: BlattDurchgang<W>): string {
  return d.blattIds[d.index]
}

export function istLetztesBlatt<W>(d: BlattDurchgang<W>): boolean {
  return d.index === d.blattIds.length - 1
}

export function aktuelleWahl<W>(d: BlattDurchgang<W>): W {
  return d.wahl[aktuellesBlatt(d)]
}

export function setzeWahl<W>(d: BlattDurchgang<W>, wahl: W): BlattDurchgang<W> {
  return { ...d, wahl: { ...d.wahl, [aktuellesBlatt(d)]: wahl } }
}

export function springeZu<W>(d: BlattDurchgang<W>, index: number): BlattDurchgang<W> {
  const ziel = Math.max(0, Math.min(d.blattIds.length - 1, index))
  if (ziel === d.index) return d
  const id = d.blattIds[ziel]
  const wahl = id in d.wahl ? d.wahl : { ...d.wahl, [id]: aktuelleWahl(d) }
  return { ...d, index: ziel, wahl }
}

function markiere<W>(d: BlattDurchgang<W>, auslassen: boolean): BlattDurchgang<W> {
  const uebersprungen = new Set(d.uebersprungen)
  if (auslassen) uebersprungen.add(aktuellesBlatt(d))
  else uebersprungen.delete(aktuellesBlatt(d))
  return { ...d, uebersprungen }
}

export function weiter<W>(d: BlattDurchgang<W>): BlattDurchgang<W> {
  return springeZu(markiere(d, false), d.index + 1)
}

export function ueberspringe<W>(d: BlattDurchgang<W>): BlattDurchgang<W> {
  return springeZu(markiere(d, true), d.index + 1)
}

export function zurueck<W>(d: BlattDurchgang<W>): BlattDurchgang<W> {
  return springeZu(d, d.index - 1)
}

export function zuUebernehmen<W>(d: BlattDurchgang<W>): { blattId: string; wahl: W }[] {
  return d.blattIds
    .filter((id) => !d.uebersprungen.has(id) && id in d.wahl)
    .map((id) => ({ blattId: id, wahl: d.wahl[id] }))
}
