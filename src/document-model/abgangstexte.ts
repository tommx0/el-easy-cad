import type { CatalogComponent } from './catalog'
import { kabeltypText } from './kabeltyp-verwendung'
import type { KomponentenObjekt, LeitungsVerteilerAnschluss } from './objekte'
import { getBoundingBox } from './objekte'
import { istAufgesetztesModul } from './modul-traeger'
import { zeichenflaecheBoundingBox } from './zeichenflaeche'
import { switchBezeichnung } from './switch-ports'
import { istVerteiler } from './verteiler'
import { baueVerteilerBaum, knotenZurZuweisung, type VerteilerBaum } from './verteiler-baum'
import {
  ermittleVerteilerZuweisungen,
  gegenstelleDerZuweisung,
  kennbuchstabeVon,
  leitungsKennzeichen,
  type VerteilerZuweisung,
} from './verteiler-belegung'
import type { Zeichnung } from './zeichnung'
import { planUebersetzer } from './plansprache'
import type { Uebersetzer } from '../sprache'

export interface AbgangsText {
  dockpunktIndex: number | null
  zeilen: string[]
}

export function ermittleAbgangsTexte(
  plan: Zeichnung,
  bauplaene: readonly Zeichnung[],
  katalog: readonly CatalogComponent[],
): Map<string, AbgangsText[]> {
  const ergebnis = new Map<string, AbgangsText[]>()
  const kennzeichen = plan.verteilerKennzeichen
  if (!kennzeichen) return ergebnis
  const tp = planUebersetzer(plan)

  const symboleJeKennzeichen = new Map<string, KomponentenObjekt[]>()
  for (const blatt of plan.blaetter) {
    for (const o of blatt.objekte) {
      const k = o.type === 'komponente' ? o.geraeteKennzeichen?.trim() : undefined
      if (o.type !== 'komponente' || !k || o.knxAktor) continue
      symboleJeKennzeichen.set(k, [...(symboleJeKennzeichen.get(k) ?? []), o])
    }
  }
  const stelle = (anschluss: LeitungsVerteilerAnschluss) => {
    const symbole = [...(symboleJeKennzeichen.get(anschluss.kennzeichen) ?? [])].sort(
      (a, b) =>
        Number(b.betriebsmittelRolle === 'spule') - Number(a.betriebsmittelRolle === 'spule'),
    )
    if (anschluss.anschluss) {
      const satz = symbole.find((s) => s.klemmenNummer?.trim() === anschluss.anschluss)
      if (satz) return { objektId: satz.id, dockpunktIndex: null }
      const kontaktZuerst = [...symbole].sort(
        (a, b) =>
          Number(b.betriebsmittelRolle === 'kontaktblock') -
          Number(a.betriebsmittelRolle === 'kontaktblock'),
      )
      for (const s of kontaktZuerst) {
        const index =
          s.dockpunkte?.modus === 'frei'
            ? s.dockpunkte.punkte.findIndex((p) => p.bezeichnung?.trim() === anschluss.anschluss)
            : -1
        if (index >= 0) return { objektId: s.id, dockpunktIndex: index }
      }
    }
    return symbole[0] ? { objektId: symbole[0].id, dockpunktIndex: null } : null
  }

  const fuegeHinzu = (
    ziel: { objektId: string; dockpunktIndex: number | null },
    text: string,
    vorn = false,
  ) => {
    const liste = ergebnis.get(ziel.objektId) ?? []
    let eintrag = liste.find((e) => e.dockpunktIndex === ziel.dockpunktIndex)
    if (!eintrag) {
      eintrag = { dockpunktIndex: ziel.dockpunktIndex, zeilen: [] }
      liste.push(eintrag)
    }
    if (!eintrag.zeilen.includes(text)) {
      if (vorn) eintrag.zeilen.unshift(text)
      else eintrag.zeilen.push(text)
    }
    ergebnis.set(ziel.objektId, liste)
  }

  for (const bauplan of bauplaene) {
    for (const { verteiler } of alleVerteilerMit(bauplan, kennzeichen)) {
      const baum = baueVerteilerBaum(verteiler, katalog)
      const beschriftungen: [{ objektId: string; dockpunktIndex: number | null }, string][] = []
      for (const e of verteiler.verteiler?.bestueckung ?? []) {
        const text = e.bezeichnung?.trim()
        const ziel = text
          ? stelle({ ende: 'ziel', kennzeichen: e.kennzeichen, anschluss: e.kanal })
          : null
        if (ziel && text) beschriftungen.push([ziel, text])
      }
      const zuweisungen = ermittleVerteilerZuweisungen(bauplan, verteiler.id).map((z) => ({
        z,
        ziel: letzterKnoten(baum, z.anschluss),
      }))
      for (const { z, ziel: knoten } of naechsteAmKabel(zuweisungen)) {
        const ziel = stelle({ ...z.anschluss, ...knoten }) ?? stelle(z.anschluss)
        if (!ziel) continue
        const gegen = gegenstelleDerZuweisung(bauplan, z)
        const typ = kabeltypText(z.leitung, bauplan.kabeltypen)
        const leitungText = z.anschluss.ader
          ? `${leitungsKennzeichen(z.leitung.nummer)}/${z.anschluss.ader}`
          : leitungsKennzeichen(z.leitung.nummer)
        const text = [
          [leitungText, typ].filter(Boolean).join(' '),
          gegen ? zielName(bauplan, gegen.blattId, gegen.komponente.id, katalog, tp) : null,
        ]
          .filter(Boolean)
          .join(' · ')
        fuegeHinzu(ziel, text)
      }
      for (const [ziel, text] of beschriftungen.reverse()) fuegeHinzu(ziel, text, true)
    }
  }
  return ergebnis
}

function zielName(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
  katalog: readonly CatalogComponent[],
  tp: Uebersetzer,
): string {
  return (
    switchBezeichnung(zeichnung, { blattId, objektId }, katalog) ??
    tp('beschriftung.kabelschacht.komponente')
  )
}

function alleVerteilerMit(zeichnung: Zeichnung, kennzeichen: string) {
  const treffer: { blattId: string; verteiler: KomponentenObjekt }[] = []
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (istVerteiler(o) && o.verteiler.kennzeichen === kennzeichen)
        treffer.push({ blattId: blatt.id, verteiler: o })
    }
  }
  return treffer
}

function letzterKnoten(
  baum: Pick<VerteilerBaum, 'knoten'>,
  anschluss: Pick<LeitungsVerteilerAnschluss, 'kennzeichen' | 'anschluss'>,
): Pick<LeitungsVerteilerAnschluss, 'kennzeichen' | 'anschluss'> {
  let knoten = knotenZurZuweisung(baum, anschluss.kennzeichen, anschluss.anschluss)
  if (!knoten || knoten.kinder.length !== 1) return anschluss
  while (knoten.kinder.length === 1) knoten = knoten.kinder[0]
  return { kennzeichen: knoten.kennzeichen, anschluss: knoten.kanal }
}

function naechsteAmKabel<
  T extends {
    z: VerteilerZuweisung
    ziel: Pick<LeitungsVerteilerAnschluss, 'kennzeichen' | 'anschluss'>
  },
>(zuweisungen: readonly T[]): T[] {
  const rang = (e: T) => {
    const b = kennbuchstabeVon(e.ziel.kennzeichen)
    return b === 'X' ? 0 : b === 'K' ? 1 : 2
  }
  const schluessel = (e: T) => `${e.z.leitung.id}#${e.z.anschluss.ende}`
  const bester = new Map<string, number>()
  for (const e of zuweisungen)
    bester.set(schluessel(e), Math.min(bester.get(schluessel(e)) ?? 3, rang(e)))
  const gesehen = new Set<string>()
  return zuweisungen.filter((e) => {
    if (rang(e) !== bester.get(schluessel(e))) return false
    const ort = `${schluessel(e)}#${e.ziel.kennzeichen}:${e.ziel.anschluss ?? ''}`
    if (gesehen.has(ort)) return false
    gesehen.add(ort)
    return true
  })
}

export function mitAbgangstext(
  objekt: KomponentenObjekt,
  patch: Partial<NonNullable<KomponentenObjekt['abgangstext']>>,
): KomponentenObjekt {
  const neu: NonNullable<KomponentenObjekt['abgangstext']> = { ...objekt.abgangstext, ...patch }
  for (const feld of Object.keys(neu) as (keyof typeof neu)[])
    if (neu[feld] === undefined) delete neu[feld]
  if (Object.keys(neu).length > 0) return { ...objekt, abgangstext: neu }
  const { abgangstext: _weg, ...rest } = objekt
  return rest
}

export interface SenkrechterAbgangsRaum {
  unten: number
  oben: number
}

export const ABGANG_SENKRECHT_LUFT_METER = 0.08

export function senkrechteAbgangsRaeume(plan: Zeichnung): Map<string, SenkrechterAbgangsRaum> {
  const ergebnis = new Map<string, SenkrechterAbgangsRaum>()
  const luft = ABGANG_SENKRECHT_LUFT_METER
  for (const blatt of plan.blaetter) {
    if (!blatt.zeichenflaeche) continue
    const senkrecht = blatt.objekte.filter(
      (o): o is KomponentenObjekt =>
        o.type === 'komponente' && o.abgangstext?.ausrichtung === 'senkrecht',
    )
    if (senkrecht.length === 0) continue
    const unten = zeichenflaecheBoundingBox(blatt.zeichenflaeche).min.y + luft
    const symbole = blatt.objekte
      .filter((o): o is KomponentenObjekt => o.type === 'komponente' && !istAufgesetztesModul(o))
      .map((o) => ({ id: o.id, bb: getBoundingBox(o) }))
    for (const k of senkrecht) {
      const bb = getBoundingBox(k)
      let oben = bb.min.y - luft
      for (const s of symbole) {
        if (s.id === k.id) continue
        if (s.bb.max.x <= bb.min.x || s.bb.min.x >= bb.max.x) continue
        if (s.bb.max.y > bb.min.y || s.bb.max.y < unten) continue
        oben = Math.min(oben, s.bb.min.y - luft)
      }
      ergebnis.set(k.id, { unten, oben })
    }
  }
  return ergebnis
}
