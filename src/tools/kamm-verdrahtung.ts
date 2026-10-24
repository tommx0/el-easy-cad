import type { Point } from '../document-model'

export interface KammAuftrag {
  id: string
  netz: string
  oben: Point
  unten: Point
  gruppe?: string
  leitung?: boolean
}

export interface KammKanal {
  obereKante: number
  untereKante: number
  auftraege: KammAuftrag[]
}

const GERADE_TOLERANZ = 1e-6

interface Netz {
  ids: string[]
  obenX: number[]
  untenX: number[]
  links: number
  rechts: number
  gerade: boolean
}

function bildeNetze(auftraege: readonly KammAuftrag[]): Netz[] {
  const nachNetz = new Map<string, KammAuftrag[]>()
  for (const a of auftraege) nachNetz.set(a.netz, [...(nachNetz.get(a.netz) ?? []), a])
  return [...nachNetz.values()].map((liste) => {
    const xs = liste.flatMap((a) => [a.oben.x, a.unten.x])
    return {
      ids: liste.map((a) => a.id),
      obenX: liste.map((a) => a.oben.x),
      untenX: liste.map((a) => a.unten.x),
      links: Math.min(...xs),
      rechts: Math.max(...xs),
      gerade: liste.length === 1 && Math.abs(liste[0].oben.x - liste[0].unten.x) <= GERADE_TOLERANZ,
    }
  })
}

const innerhalb = (x: number, n: Netz, rand: number) => x >= n.links - rand && x <= n.rechts + rand

function vorrang(netze: Netz[], rand: number): Map<Netz, Set<Netz>> {
  const unter = new Map<Netz, Set<Netz>>(netze.map((n) => [n, new Set()]))
  for (const a of netze) {
    if (a.gerade) continue
    for (const b of netze) {
      if (a === b) continue
      const bObenDrin = b.obenX.some((x) => innerhalb(x, a, rand))
      const bUntenDrin = b.untenX.some((x) => innerhalb(x, a, rand))
      if (bObenDrin === bUntenDrin) continue
      if (bObenDrin && !b.gerade) unter.get(b)!.add(a)
      if (bUntenDrin && !b.gerade) unter.get(a)!.add(b)
    }
  }
  return unter
}

function vergibBahnen(netze: Netz[], bahnabstand: number): Map<Netz, number> {
  const bahnNetze = netze.filter((n) => !n.gerade)
  const unter = vorrang(bahnNetze, bahnabstand / 2)
  const bahn = new Map<Netz, number>()
  const offen = new Set(bahnNetze)
  while (offen.size > 0) {
    const bereit = [...offen].filter((n) => [...unter.get(n)!].every((u) => !offen.has(u)))
    const naechstes =
      bereit.length > 0
        ? bereit.sort((p, q) => p.links - q.links)[0]
        : [...offen].sort(
            (p, q) =>
              [...unter.get(p)!].filter((u) => offen.has(u)).length -
              [...unter.get(q)!].filter((u) => offen.has(u)).length,
          )[0]
    offen.delete(naechstes)
    let stufe = 0
    for (const u of unter.get(naechstes)!) {
      const b = bahn.get(u)
      if (b !== undefined) stufe = Math.max(stufe, b + 1)
    }
    const belegt = (s: number) =>
      [...bahn].some(
        ([n, b]) =>
          b === s &&
          n.links <= naechstes.rechts + bahnabstand &&
          naechstes.links <= n.rechts + bahnabstand,
      )
    while (belegt(stufe)) stufe++
    bahn.set(naechstes, stufe)
  }
  return bahn
}

function faecherSpuren(
  auftraege: readonly KammAuftrag[],
  bahnabstand: number,
): Map<string, number> {
  const amKontakt = new Map<string, KammAuftrag[]>()
  for (const a of auftraege) {
    const schluessel = `${Math.round(a.oben.x * 1e6)},${Math.round(a.oben.y * 1e6)}`
    amKontakt.set(schluessel, [...(amKontakt.get(schluessel) ?? []), a])
  }
  const spuren = new Map<string, number>()
  for (const gruppe of amKontakt.values()) {
    const netze = new Map<string, KammAuftrag[]>()
    for (const a of gruppe) netze.set(a.netz, [...(netze.get(a.netz) ?? []), a])
    if (netze.size < 2) continue
    const mitte = (liste: KammAuftrag[]) => liste.reduce((s, a) => s + a.unten.x, 0) / liste.length
    const geordnet = [...netze.values()].sort((p, q) => mitte(p) - mitte(q))
    geordnet.forEach((liste, i) => {
      const x = gruppe[0].oben.x + (i - (geordnet.length - 1) / 2) * bahnabstand
      for (const a of liste) spuren.set(a.id, x)
    })
  }
  return spuren
}

function mitFaecher(auftraege: readonly KammAuftrag[], spuren: ReadonlyMap<string, number>) {
  return auftraege.map((a) => {
    const x = spuren.get(a.id)
    return x === undefined ? a : { ...a, oben: { x, y: a.oben.y } }
  })
}

function bereinige(punkte: Point[]): Point[] {
  const ergebnis: Point[] = []
  for (const p of punkte) {
    const n = ergebnis.length
    if (
      n > 0 &&
      Math.abs(ergebnis[n - 1].x - p.x) < 1e-9 &&
      Math.abs(ergebnis[n - 1].y - p.y) < 1e-9
    )
      continue
    if (n >= 2) {
      const a = ergebnis[n - 2]
      const b = ergebnis[n - 1]
      const gleichX = Math.abs(a.x - b.x) < 1e-9 && Math.abs(b.x - p.x) < 1e-9
      const gleichY = Math.abs(a.y - b.y) < 1e-9 && Math.abs(b.y - p.y) < 1e-9
      if (gleichX || gleichY) ergebnis.pop()
    }
    ergebnis.push(p)
  }
  return ergebnis
}

export function zaehleKammBahnen(auftraege: readonly KammAuftrag[], bahnabstand: number): number {
  const bahnen = vergibBahnen(
    bildeNetze(mitFaecher(auftraege, faecherSpuren(auftraege, bahnabstand))),
    bahnabstand,
  )
  return bahnen.size === 0 ? 0 : Math.max(...bahnen.values()) + 1
}

export function verlegeKammKanal(
  kanal: KammKanal,
  bahnabstand: number,
  mindestRand: number,
): Map<string, Point[]> | null {
  const spuren = faecherSpuren(kanal.auftraege, bahnabstand)
  const netze = bildeNetze(mitFaecher(kanal.auftraege, spuren))
  const bahnen = vergibBahnen(netze, bahnabstand)
  const anzahl = bahnen.size === 0 ? 0 : Math.max(...bahnen.values()) + 1
  const hoehe = kanal.obereKante - kanal.untereKante
  if (anzahl > 0 && hoehe - (anzahl - 1) * bahnabstand < 2 * mindestRand) return null
  const unterste = (kanal.obereKante + kanal.untereKante) / 2 - ((anzahl - 1) * bahnabstand) / 2

  const ergebnis = new Map<string, Point[]>()
  const nachId = new Map(kanal.auftraege.map((a) => [a.id, a]))
  for (const netz of netze) {
    for (const id of netz.ids) {
      const { oben, unten } = nachId.get(id)!
      const spur = spuren.get(id)
      const start =
        spur === undefined
          ? [oben]
          : [
              oben,
              { x: oben.x, y: oben.y - mindestRand / 2 },
              { x: spur, y: oben.y - mindestRand / 2 },
            ]
      const x = spur ?? oben.x
      if (netz.gerade || Math.abs(x - unten.x) <= GERADE_TOLERANZ) {
        ergebnis.set(id, bereinige([...start, { x, y: unten.y }, unten]))
        continue
      }
      const y = unterste + bahnen.get(netz)! * bahnabstand
      ergebnis.set(id, bereinige([...start, { x, y }, { x: unten.x, y }, unten]))
    }
  }
  return ergebnis
}
