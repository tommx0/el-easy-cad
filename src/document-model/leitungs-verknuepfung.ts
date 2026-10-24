import { t } from '../sprache'
import type { CatalogComponent } from './catalog'
import type { KomponentenTyp, Slot, SlotZiel } from './geraetegruppe'
import { erzeugeSlot, typHatSlotMatrix, typHatSlots } from './geraetegruppe'
import {
  ermittleTypUndSlots,
  ermittleUrsprung,
  erzeugtZyklus,
  istUeblicheTypKombination,
  komponentenBezeichnung,
  zielSchluessel,
} from './geraetegruppen-ableitung'
import type { KomponentenObjekt, LeitungsObjekt } from './objekte'
import { ermittleDurchgehendeLeitung } from './kabelschacht'
import type {
  AutoGruppe,
  GruppenAngaben,
  GruppenVorgabe,
  KomponenteImBlatt,
  VerknuepfungsErgebnis,
} from './gruppe-bilden'
import {
  angabenAusVorgabe,
  ermittleAutoGruppe,
  erzeugeGruppeMitAngaben,
  gruppenVorgabe,
  lenkeSlotZieleUm,
  mitVerknuepfungsErgebnis,
  nameAusRaum,
  verbindeErgebnisse,
  wendeAutoGruppeAn,
} from './gruppe-bilden'
import type { Zeichnung } from './zeichnung'

export interface VerknuepfungsGeraet {
  blattId: string
  objekt: KomponentenObjekt
  name: string
  typ: KomponentenTyp
  slots: Slot[]
  matrix: boolean
  slotVorschlag: string
}

export interface GruppenInfo {
  id: string
  name: string
}

export type LeitungsVerknuepfung =
  | {
      art: 'wirkverbindung'
      leitungNummer: number
      quellen: VerknuepfungsGeraet[]
      ziel: VerknuepfungsGeraet
      gruppe: GruppenInfo | null
      nameVorschlag: string
    }
  | {
      art: 'abgleich'
      leitungNummer: number
      von: VerknuepfungsGeraet
      nach: VerknuepfungsGeraet
    }
  | {
      art: 'gruppe'
      leitungNummer: number
      a: VerknuepfungsGeraet
      b: VerknuepfungsGeraet
      bestehend: GruppenInfo | null
      nameVorschlag: string
      vorgabe: GruppenVorgabe
      umgelenkt: number
    }

export type VerknuepfungsAuswahl =
  | {
      art: 'wirkverbindung'
      quellen: { objektId: string; slotId: string }[]
      zielGruppe: boolean
      slotBezeichnung?: string
      gruppe?: GruppenAngaben
    }
  | { art: 'abgleich'; vonSlotId: string; nachSlotId: string; gruppe?: GruppenAngaben }
  | {
      art: 'gruppe'
      name?: string
      ansteuerung?: string
      knx?: boolean
    }

export const NEUER_SLOT = 'neu'

function komponenteAm(
  zeichnung: Zeichnung,
  blattId: string,
  ende: LeitungsObjekt['start'],
): KomponentenObjekt | null {
  if (ende.art !== 'dock') return null
  const o = zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((x) => x.id === ende.objektId)
  return o?.type === 'komponente' ? o : null
}

function geraet(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  blattId: string,
  objekt: KomponentenObjekt,
): VerknuepfungsGeraet | null {
  const t = ermittleTypUndSlots(objekt, zeichnung)
  if (!t) return null
  const matrix = typHatSlotMatrix(t.typ)
  const frei = t.slots.find((s) => s.ziele.length === 0)
  return {
    blattId,
    objekt,
    name: komponentenBezeichnung(objekt, katalog),
    typ: t.typ,
    slots: t.slots,
    matrix,
    slotVorschlag: frei?.id ?? (matrix ? (t.slots[0]?.id ?? NEUER_SLOT) : NEUER_SLOT),
  }
}

function gruppeVon(zeichnung: Zeichnung, objekt: KomponentenObjekt): GruppenInfo | null {
  const g = objekt.gruppeId
    ? zeichnung.geraeteGruppen.find((x) => x.id === objekt.gruppeId)
    : undefined
  return g ? { id: g.id, name: g.name?.trim() || t('generatoren.ersatz.geraetegruppe') } : null
}

function zielVon(g: VerknuepfungsGeraet, alsGruppe: boolean): SlotZiel {
  return alsGruppe && g.objekt.gruppeId
    ? { art: 'gruppe', gruppeId: g.objekt.gruppeId }
    : { art: 'instanz', blattId: g.blattId, objektId: g.objekt.id }
}

function wirktSchonAuf(quelle: VerknuepfungsGeraet, ziel: VerknuepfungsGeraet): boolean {
  const schluessel = new Set([
    zielSchluessel(zielVon(ziel, false)),
    zielSchluessel(zielVon(ziel, true)),
  ])
  return quelle.slots.some((s) => s.ziele.some((z) => schluessel.has(zielSchluessel(z))))
}

function verbundeneQuellen(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  blattId: string,
  start: KomponentenObjekt,
  ausser: ReadonlySet<string>,
): VerknuepfungsGeraet[] {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  if (!blatt) return []
  const hatSlots = (o: KomponentenObjekt) => {
    const t = ermittleTypUndSlots(o, zeichnung)
    return !!t && typHatSlots(t.typ)
  }
  const gesehen = new Set([start.id, ...ausser])
  const warteschlange = [start]
  const ergebnis: VerknuepfungsGeraet[] = []
  let aktuell: KomponentenObjekt | undefined
  while ((aktuell = warteschlange.shift())) {
    for (const l of blatt.objekte) {
      if (l.type !== 'leitung') continue
      const a = komponenteAm(zeichnung, blattId, l.start)
      const b = komponenteAm(zeichnung, blattId, l.ziel)
      const anderes = a?.id === aktuell.id ? b : b?.id === aktuell.id ? a : null
      if (!anderes || gesehen.has(anderes.id) || !hatSlots(anderes)) continue
      gesehen.add(anderes.id)
      const g = geraet(zeichnung, katalog, blattId, anderes)
      if (g) ergebnis.push(g)
      warteschlange.push(anderes)
    }
  }
  return ergebnis
}

function aufloesen(
  zeichnung: Zeichnung,
  blattId: string,
  ende: LeitungsObjekt['ziel'],
): KomponenteImBlatt | null {
  const ort =
    ende.art === 'dock'
      ? { blattId, objektId: ende.objektId }
      : ende.art === 'switchport' || ende.art === 'verteiler'
        ? { blattId: ende.blattId, objektId: ende.objektId }
        : null
  if (!ort) return null
  const o = zeichnung.blaetter
    .find((b) => b.id === ort.blattId)
    ?.objekte.find((x) => x.id === ort.objektId)
  return o?.type === 'komponente' ? { blattId: ort.blattId, objekt: o } : null
}

function kabelEndKomponenten(
  zeichnung: Zeichnung,
  blattId: string,
  leitungId: string,
): [KomponenteImBlatt | null, KomponenteImBlatt | null] | null {
  const kabel = ermittleDurchgehendeLeitung(zeichnung, blattId, leitungId)
  const glieder = kabel?.glieder ?? []
  if (glieder.length === 0) return null
  const erstes = glieder[0]
  const letztes = glieder[glieder.length - 1]
  return [
    aufloesen(zeichnung, erstes.blattId, erstes.leitung.start),
    aufloesen(zeichnung, letztes.blattId, letztes.leitung.ziel),
  ]
}

export function leitungsVerknuepfungsHinweis(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  blattId: string,
  leitungId: string,
): string | null {
  const enden = kabelEndKomponenten(zeichnung, blattId, leitungId)
  if (!enden?.[0] || !enden[1]) return null
  const [a, b] = enden
  const ga = gruppeVon(zeichnung, a.objekt)
  const gb = gruppeVon(zeichnung, b.objekt)
  if (!ga || !gb || ga.id === gb.id) return null
  const ta = ermittleTypUndSlots(a.objekt, zeichnung)?.typ
  if (!ta || ta !== ermittleTypUndSlots(b.objekt, zeichnung)?.typ || typHatSlots(ta)) return null
  return t('generatoren.leitungsVerknuepfung.verschiedeneGruppen', {
    a: komponentenBezeichnung(a.objekt, katalog),
    b: komponentenBezeichnung(b.objekt, katalog),
    gruppeA: ga.name,
    gruppeB: gb.name,
  })
}

export function ermittleLeitungsVerknuepfung(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  blattId: string,
  leitungId: string,
): LeitungsVerknuepfung | null {
  const leitung = zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o): o is LeitungsObjekt => o.type === 'leitung' && o.id === leitungId)
  if (!leitung) return null
  const enden = kabelEndKomponenten(zeichnung, blattId, leitungId)
  if (!enden?.[0] || !enden[1] || enden[0].objekt.id === enden[1].objekt.id) return null
  const [ka, kb] = enden
  const oa = ka.objekt
  const ob = kb.objekt
  const a = geraet(zeichnung, katalog, ka.blattId, oa)
  const b = geraet(zeichnung, katalog, kb.blattId, ob)
  if (!a || !b) return null
  const nummer = leitung.nummer

  for (const [quelle, ziel] of [
    [a, b],
    [b, a],
  ] as const) {
    if (!istUeblicheTypKombination(quelle.typ, ziel.typ)) continue
    const weitere = verbundeneQuellen(
      zeichnung,
      katalog,
      quelle.blattId,
      quelle.objekt,
      new Set([ziel.objekt.id]),
    )
    const quellen = [quelle, ...weitere].filter((q) => !wirktSchonAuf(q, ziel))
    if (quellen.length === 0 || quellen[0] !== quelle) return null
    const gruppe = gruppeVon(zeichnung, ziel.objekt)
    return {
      art: 'wirkverbindung',
      leitungNummer: nummer,
      quellen,
      ziel,
      gruppe,
      nameVorschlag: gruppe?.name ?? nameAusRaum(zeichnung, ziel.blattId, ziel.objekt),
    }
  }

  if (typHatSlots(a.typ) && typHatSlots(b.typ)) {
    const mitZielen = (g: VerknuepfungsGeraet) => g.slots.find((s) => s.ziele.length > 0)
    const [von, nach] = mitZielen(a) ? [a, b] : mitZielen(b) ? [b, a] : [null, null]
    if (!von || !nach) return null
    return {
      art: 'abgleich',
      leitungNummer: nummer,
      von: { ...von, slotVorschlag: mitZielen(von)!.id },
      nach,
    }
  }

  if (a.typ === b.typ && !typHatSlots(a.typ)) {
    const ga = gruppeVon(zeichnung, oa)
    const gb = gruppeVon(zeichnung, ob)
    if (ga && gb) return null
    const bestehend = ga ?? gb
    const betroffen = new Set(
      [a, b]
        .filter((g) => !bestehend || !g.objekt.gruppeId)
        .map((g) => zielSchluessel(zielVon(g, false))),
    )
    return {
      art: 'gruppe',
      leitungNummer: nummer,
      a,
      b,
      bestehend,
      nameVorschlag: bestehend?.name ?? nameAusRaum(zeichnung, a.blattId, oa),
      vorgabe: gruppenVorgabe(
        zeichnung,
        a.typ,
        [a, b].map((g) => ({ blattId: g.blattId, objekt: g.objekt })),
      ),
      umgelenkt: alleSlots(zeichnung).filter((s) =>
        s.ziele.some((z) => betroffen.has(zielSchluessel(z))),
      ).length,
    }
  }
  return null
}

function alleSlots(zeichnung: Zeichnung): Slot[] {
  return [
    ...zeichnung.geraeteGruppen.flatMap((g) => g.slots),
    ...zeichnung.blaetter.flatMap((b) =>
      b.objekte.flatMap((o) => (o.type === 'komponente' && !o.gruppeId ? (o.slots ?? []) : [])),
    ),
  ]
}

export function wendeLeitungsVerknuepfungAn(
  zeichnung: Zeichnung,
  v: LeitungsVerknuepfung,
  auswahl: VerknuepfungsAuswahl,
): VerknuepfungsErgebnis | null {
  const basis = wendeOhneAutoGruppeAn(zeichnung, v, auswahl)
  if (!basis || auswahl.art === 'gruppe') return basis
  let ergebnis = basis
  for (const { quelle, alt } of geaenderteQuellen(v)) {
    const stand = mitVerknuepfungsErgebnis(zeichnung, ergebnis)
    const slots = slotsIn(stand, quelle)
    if (!slots) continue
    const fall = ermittleAutoGruppe(stand, [], quelle, slots, alt)
    if (!fall) continue
    ergebnis = verbindeErgebnisse(
      ergebnis,
      wendeAutoGruppeAn(stand, quelle, slots, fall, auswahl.gruppe),
    )
  }
  return ergebnis
}

export function autoGruppeZurAuswahl(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  v: LeitungsVerknuepfung,
  auswahl: VerknuepfungsAuswahl,
): AutoGruppe | null {
  if (auswahl.art === 'gruppe') return null
  const basis = wendeOhneAutoGruppeAn(zeichnung, v, auswahl)
  if (!basis) return null
  const stand = mitVerknuepfungsErgebnis(zeichnung, basis)
  for (const { quelle, alt } of geaenderteQuellen(v)) {
    const slots = slotsIn(stand, quelle)
    const fall = slots ? ermittleAutoGruppe(stand, katalog, quelle, slots, alt) : null
    if (fall?.art === 'neu') return fall
  }
  return null
}

function geaenderteQuellen(
  v: LeitungsVerknuepfung,
): { quelle: { blattId: string; objektId: string }; alt: Slot[] }[] {
  const geraete = v.art === 'wirkverbindung' ? v.quellen : v.art === 'abgleich' ? [v.nach] : []
  return geraete.map((g) => ({
    quelle: { blattId: g.blattId, objektId: g.objekt.id },
    alt: g.slots,
  }))
}

function slotsIn(zeichnung: Zeichnung, ort: { blattId: string; objektId: string }): Slot[] | null {
  const o = zeichnung.blaetter
    .find((b) => b.id === ort.blattId)
    ?.objekte.find((x) => x.id === ort.objektId)
  return o?.type === 'komponente' ? (ermittleTypUndSlots(o, zeichnung)?.slots ?? null) : null
}

function wendeOhneAutoGruppeAn(
  zeichnung: Zeichnung,
  v: LeitungsVerknuepfung,
  auswahl: VerknuepfungsAuswahl,
): VerknuepfungsErgebnis | null {
  let gruppen = [...zeichnung.geraeteGruppen]
  const objekte = new Map<string, KomponenteImBlatt>()
  const aktuell = (g: VerknuepfungsGeraet) => objekte.get(g.objekt.id)?.objekt ?? g.objekt
  const setze = (blattId: string, objekt: KomponentenObjekt) =>
    objekte.set(objekt.id, { blattId, objekt })

  const slotsVon = (g: VerknuepfungsGeraet): Slot[] => {
    const o = aktuell(g)
    return o.gruppeId ? (gruppen.find((x) => x.id === o.gruppeId)?.slots ?? []) : (o.slots ?? [])
  }
  const setzeSlots = (g: VerknuepfungsGeraet, slots: Slot[]) => {
    const o = aktuell(g)
    if (o.gruppeId) gruppen = gruppen.map((x) => (x.id === o.gruppeId ? { ...x, slots } : x))
    else setze(g.blattId, { ...o, slots })
  }
  const fuegeHinzu = (
    g: VerknuepfungsGeraet,
    slotId: string,
    ziele: readonly SlotZiel[],
    bezeichnung: string | undefined,
  ): boolean => {
    const ursprung = ermittleUrsprung(g.objekt, g.blattId)
    let slots = slotsVon(g)
    let id = slotId
    if (slotId === NEUER_SLOT) {
      if (g.matrix) return false
      const neu = erzeugeSlot()
      slots = [...slots, neu]
      id = neu.id
    }
    const slot = slots.find((s) => s.id === id)
    if (!slot) return false
    const vorhanden = new Set(slot.ziele.map(zielSchluessel))
    const dazu = ziele.filter(
      (z) => !vorhanden.has(zielSchluessel(z)) && !erzeugtZyklus(zeichnung, ursprung, z),
    )
    if (dazu.length === 0) return false
    const name = bezeichnung?.trim()
    setzeSlots(
      g,
      slots.map((s) =>
        s.id === id
          ? {
              ...s,
              ziele: [...s.ziele, ...dazu],
              ...(!s.bezeichnung?.trim() && name ? { bezeichnung: name } : {}),
            }
          : s,
      ),
    )
    return true
  }

  let geaendert = false
  if (v.art === 'wirkverbindung' && auswahl.art === 'wirkverbindung') {
    const ziel = zielVon(v.ziel, auswahl.zielGruppe && v.gruppe !== null)
    for (const wahl of auswahl.quellen) {
      const q = v.quellen.find((x) => x.objekt.id === wahl.objektId)
      if (q && fuegeHinzu(q, wahl.slotId, [ziel], auswahl.slotBezeichnung)) geaendert = true
    }
  } else if (v.art === 'abgleich' && auswahl.art === 'abgleich') {
    const von = v.von.slots.find((s) => s.id === auswahl.vonSlotId)
    if (von) geaendert = fuegeHinzu(v.nach, auswahl.nachSlotId, von.ziele, von.bezeichnung)
  } else if (v.art === 'gruppe' && auswahl.art === 'gruppe') {
    const gruppe =
      v.bestehend ??
      (() => {
        const vorgabe = angabenAusVorgabe(v.vorgabe)
        const neu = erzeugeGruppeMitAngaben(v.a.typ, {
          name: auswahl.name,
          ansteuerung: 'ansteuerung' in auswahl ? auswahl.ansteuerung : vorgabe.ansteuerung,
          knx: auswahl.knx ?? vorgabe.knx,
        })
        gruppen = [...gruppen, neu]
        return { id: neu.id, name: neu.name ?? '' }
      })()
    const mitglieder = [v.a, v.b].filter((g) => !g.objekt.gruppeId)
    const umlenken = new Set(mitglieder.map((g) => zielSchluessel(zielVon(g, false))))
    for (const g of mitglieder)
      setze(g.blattId, { ...aktuell(g), gruppeId: gruppe.id, slots: undefined })
    lenkeSlotZieleUm(
      zeichnung,
      umlenken,
      { art: 'gruppe', gruppeId: gruppe.id },
      gruppen,
      objekte,
      (n) => {
        gruppen = n
      },
    )
    geaendert = true
  }
  return geaendert ? { geraeteGruppen: gruppen, objekte: [...objekte.values()] } : null
}
