import type { Blatt } from './blatt'
import { wirksameZone } from './hoehenfuehrung'
import { zonenDefinition, type ZonenVerlegung } from './installationszonen'
import type { KomponentenObjekt, Objekt } from './objekte'
import { raumquerungsUmgebung } from './raumquerung'
import { freieStuecke } from './teilstueck-zonen'
import { stehtAllein } from './wandstelle'
import type { Zeichnung } from './zeichnung'

export function verlegungVon(k: KomponentenObjekt): ZonenVerlegung {
  return k.verlegung ?? 'auf'
}

export function verlegungsKuerzel(verlegung: ZonenVerlegung): 'AP' | 'UP' {
  return verlegung === 'in' ? 'UP' : 'AP'
}

function kombinationsSchluessel(k: KomponentenObjekt): string | null {
  if (!k.wandstelle || !k.kombination || stehtAllein(k)) return null
  return `${k.wandstelle.id}|${k.kombination.hoeheCm}|${k.kombination.nr}`
}

export function setzeVerlegung(
  objekte: readonly Objekt[],
  ids: ReadonlySet<string>,
  verlegung: ZonenVerlegung,
): Objekt[] {
  const kombinationen = new Set<string>()
  for (const o of objekte) {
    if (o.type !== 'komponente' || !ids.has(o.id)) continue
    const schluessel = kombinationsSchluessel(o)
    if (schluessel) kombinationen.add(schluessel)
  }
  return objekte.map((o) => {
    if (o.type !== 'komponente') return o
    const schluessel = kombinationsSchluessel(o)
    if (!ids.has(o.id) && !(schluessel && kombinationen.has(schluessel))) return o
    if (verlegungVon(o) === verlegung) return o
    const { verlegung: _v, ...ohne } = o
    void _v
    return verlegung === 'in' ? { ...ohne, verlegung } : ohne
  })
}

export interface VerlegungsAbweichung {
  leitungId: string
  leitungNummer: number
  ende: 'start' | 'ziel'
  komponenteId: string
  komponente: ZonenVerlegung
  leitung: ZonenVerlegung
}

export function verlegungsAbweichungen(
  blatt: Blatt,
  zeichnung: Zeichnung,
  nurFuer?: ReadonlySet<string>,
): VerlegungsAbweichung[] {
  const eigene = zeichnung.installationszonen ?? []
  const komponenten = new Map<string, KomponentenObjekt>()
  for (const o of blatt.objekte) if (o.type === 'komponente') komponenten.set(o.id, o)
  let umgebung: ReturnType<typeof raumquerungsUmgebung> | undefined
  const ergebnis: VerlegungsAbweichung[] = []

  for (const leitung of blatt.objekte) {
    if (leitung.type !== 'leitung') continue
    const enden = (['start', 'ziel'] as const).flatMap((ende) => {
      const anschluss = leitung[ende]
      if (anschluss.art !== 'dock') return []
      const k = komponenten.get(anschluss.objektId)
      if (!k) return []
      if (nurFuer && !nurFuer.has(leitung.id) && !nurFuer.has(k.id)) return []
      return [{ ende, k }]
    })
    if (enden.length === 0) continue
    umgebung ??= raumquerungsUmgebung(blatt, eigene)
    const stuecke = freieStuecke(leitung, blatt.objekte, umgebung)
    for (const { ende, k } of enden) {
      const stueck = ende === 'start' ? stuecke[0] : stuecke[stuecke.length - 1]
      const zone = zonenDefinition(stueck?.zone ?? wirksameZone(leitung, blatt), eigene)
      if (!zone || zone.verlegung === verlegungVon(k)) continue
      ergebnis.push({
        leitungId: leitung.id,
        leitungNummer: leitung.nummer,
        ende,
        komponenteId: k.id,
        komponente: verlegungVon(k),
        leitung: zone.verlegung,
      })
    }
  }
  return ergebnis
}
