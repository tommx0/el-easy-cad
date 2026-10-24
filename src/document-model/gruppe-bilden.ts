import { t } from '../sprache'
import type { Schluessel } from '../sprache'
import type { CatalogComponent } from './catalog'
import type { Ansteuerung, Geraetegruppe, KomponentenTyp, Slot, SlotZiel } from './geraetegruppe'
import { erzeugeGeraetegruppe, typHatAnsteuerung } from './geraetegruppe'
import {
  ermittleAnsteuerung,
  ermittleTypUndSlots,
  komponentenBezeichnung,
  zielSchluessel,
} from './geraetegruppen-ableitung'
import type { KomponentenObjekt } from './objekte'
import { planUebersetzer } from './plansprache'
import { findeRaumZuPunkt } from './raum'
import { knxHaken } from './stromkreis-eigenschaft'
import type { Zeichnung } from './zeichnung'
import { slotNameText } from './katalog-uebersetzung'
import { oberflaechensprache } from '../sprache'

export interface KomponenteImBlatt {
  blattId: string
  objekt: KomponentenObjekt
}

export interface GruppenAngaben {
  name?: string
  ansteuerung?: Ansteuerung
  knx?: boolean
}

export interface GruppenVorgabe {
  name: string
  ansteuerung?: Ansteuerung
  knx: boolean
  mitAnsteuerung: boolean
  mitKnx: boolean
}

const VORSILBE: Record<string, Schluessel> = {
  schalten: 'generatoren.gruppe.licht',
  dimmen: 'generatoren.gruppe.licht',
  dali: 'generatoren.gruppe.licht',
  rgb: 'generatoren.gruppe.licht',
  rgbw: 'generatoren.gruppe.licht',
  rgbww: 'generatoren.gruppe.licht',
  rollo: 'generatoren.gruppe.rollo',
  jalousie: 'generatoren.gruppe.rollo',
}

export function nameAusRaum(
  zeichnung: Zeichnung,
  blattId: string,
  objekt: KomponentenObjekt,
): string {
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  const raum = blatt ? findeRaumZuPunkt(blatt.objekte, objekt.position)?.name.trim() : undefined
  if (!raum) return ''
  const vorlage = VORSILBE[ermittleAnsteuerung(objekt, zeichnung) ?? '']
  return vorlage ? planUebersetzer(zeichnung)(vorlage, { raum }) : raum
}

export function gruppenVorgabe(
  zeichnung: Zeichnung,
  typ: KomponentenTyp,
  mitglieder: readonly KomponenteImBlatt[],
  name?: string,
): GruppenVorgabe {
  const mitAnsteuerung = typHatAnsteuerung(typ)
  const erstes = mitglieder[0]
  const ansteuerung = mitAnsteuerung
    ? mitglieder.map((m) => ermittleAnsteuerung(m.objekt, zeichnung)).find((a) => !!a)
    : undefined
  return {
    name: name ?? (erstes ? nameAusRaum(zeichnung, erstes.blattId, erstes.objekt) : ''),
    ...(ansteuerung ? { ansteuerung } : {}),
    knx: mitglieder.some((m) => knxHaken(m.objekt, zeichnung)),
    mitAnsteuerung,
    mitKnx: mitAnsteuerung || typ === 'anschlussdose',
  }
}

export function angabenAusVorgabe(v: GruppenVorgabe): GruppenAngaben {
  return { name: v.name, ansteuerung: v.ansteuerung, knx: v.knx }
}

export function erzeugeGruppeMitAngaben(
  typ: KomponentenTyp,
  angaben: GruppenAngaben,
  slots: Slot[] = [],
): Geraetegruppe {
  const gruppe = erzeugeGeraetegruppe(typ, angaben.name?.trim() || undefined)
  return {
    ...gruppe,
    slots,
    ...(angaben.ansteuerung && typHatAnsteuerung(typ) ? { ansteuerung: angaben.ansteuerung } : {}),
    ...(angaben.knx ? { knx: true } : {}),
  }
}

export function lenkeSlotZieleUm(
  zeichnung: Zeichnung,
  alt: ReadonlySet<string>,
  neu: SlotZiel,
  gruppen: Geraetegruppe[],
  objekte: Map<string, KomponenteImBlatt>,
  setzeGruppen: (g: Geraetegruppe[]) => void,
) {
  const ziel = zielSchluessel(neu)
  const umgelenkt = (slots: Slot[]): Slot[] | null => {
    let anders = false
    const ergebnis = slots.map((s) => {
      if (!s.ziele.some((z) => alt.has(zielSchluessel(z)))) return s
      anders = true
      const rest = s.ziele.filter((z) => !alt.has(zielSchluessel(z)))
      return { ...s, ziele: rest.some((z) => zielSchluessel(z) === ziel) ? rest : [...rest, neu] }
    })
    return anders ? ergebnis : null
  }
  setzeGruppen(
    gruppen.map((g) => {
      const s = umgelenkt(g.slots)
      return s ? { ...g, slots: s } : g
    }),
  )
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente') continue
      const stand = objekte.get(o.id)?.objekt ?? o
      if (stand.gruppeId || !stand.slots) continue
      const s = umgelenkt(stand.slots)
      if (s) objekte.set(o.id, { blattId: blatt.id, objekt: { ...stand, slots: s } })
    }
  }
}

export interface VerknuepfungsErgebnis {
  geraeteGruppen: Geraetegruppe[]
  objekte: KomponenteImBlatt[]
}

export interface SlotQuelle {
  blattId: string
  objektId: string
}

export interface AutoGruppe {
  art: 'neu' | 'beitreten'
  slotId: string
  slotName: string
  quelleName: string
  mitglieder: KomponenteImBlatt[]
  mitgliederNamen: string[]
  gruppe: { id: string; name: string } | null
  typ: KomponentenTyp
  vorgabe: GruppenVorgabe
  umgelenkt: number
  slotsVerloren: string[]
}

function findeKomponente(
  zeichnung: Zeichnung,
  ort: { blattId: string; objektId: string },
): KomponentenObjekt | undefined {
  const o = zeichnung.blaetter
    .find((b) => b.id === ort.blattId)
    ?.objekte.find((x) => x.id === ort.objektId)
  return o?.type === 'komponente' ? o : undefined
}

function alleSlots(zeichnung: Zeichnung): Slot[] {
  return [
    ...zeichnung.geraeteGruppen.flatMap((g) => g.slots),
    ...zeichnung.blaetter.flatMap((b) =>
      b.objekte.flatMap((o) => (o.type === 'komponente' && !o.gruppeId ? (o.slots ?? []) : [])),
    ),
  ]
}

export function ermittleAutoGruppe(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  quelle: SlotQuelle,
  slotsNeu: readonly Slot[],
  alteSlots?: readonly Slot[],
): AutoGruppe | null {
  const objekt = findeKomponente(zeichnung, quelle)
  if (!objekt) return null
  const alt = alteSlots ?? ermittleTypUndSlots(objekt, zeichnung)?.slots ?? []
  for (const [index, slot] of slotsNeu.entries()) {
    const vorher = new Set((alt.find((s) => s.id === slot.id)?.ziele ?? []).map(zielSchluessel))
    if (slot.ziele.length < 2 || slot.ziele.every((z) => vorher.has(zielSchluessel(z)))) continue
    const gruppenZiele = slot.ziele.filter((z) => z.art === 'gruppe')
    const mitglieder: KomponenteImBlatt[] = []
    for (const z of slot.ziele) {
      if (z.art !== 'instanz') continue
      const o = findeKomponente(zeichnung, z)
      if (o && !o.gruppeId && o.id !== objekt.id) mitglieder.push({ blattId: z.blattId, objekt: o })
    }
    let art: AutoGruppe['art']
    let gruppe: AutoGruppe['gruppe'] = null
    let typ: KomponentenTyp
    if (gruppenZiele.length === 1 && mitglieder.length >= 1) {
      const id = (gruppenZiele[0] as Extract<SlotZiel, { art: 'gruppe' }>).gruppeId
      const g = zeichnung.geraeteGruppen.find((x) => x.id === id)
      if (!g) continue
      art = 'beitreten'
      gruppe = { id: g.id, name: g.name?.trim() || t('generatoren.ersatz.geraetegruppe') }
      typ = g.typ
    } else if (gruppenZiele.length === 0 && mitglieder.length >= 2) {
      art = 'neu'
      typ = ermittleTypUndSlots(mitglieder[0].objekt, zeichnung)?.typ ?? 'verbraucher'
    } else continue
    const betroffen = new Set(
      mitglieder.map((m) => zielSchluessel({ art: 'instanz', ...ortVon(m) })),
    )
    const umgelenkt = alleSlots(zeichnung).filter(
      (s) => s.id !== slot.id && s.ziele.some((z) => betroffen.has(zielSchluessel(z))),
    ).length
    return {
      art,
      slotId: slot.id,
      slotName:
        slotNameText(slot.bezeichnung, oberflaechensprache()) ||
        t('generatoren.ersatz.slot', { nr: String(index + 1) }),
      quelleName: komponentenBezeichnung(objekt, katalog),
      mitglieder,
      mitgliederNamen: mitglieder.map((m) => komponentenBezeichnung(m.objekt, katalog)),
      gruppe,
      typ,
      vorgabe: gruppenVorgabe(zeichnung, typ, mitglieder, gruppe?.name),
      umgelenkt,
      slotsVerloren: mitglieder
        .filter((m) => m.objekt.slots?.some((s) => s.ziele.length > 0))
        .map((m) => komponentenBezeichnung(m.objekt, katalog)),
    }
  }
  return null
}

function ortVon(m: KomponenteImBlatt): { blattId: string; objektId: string } {
  return { blattId: m.blattId, objektId: m.objekt.id }
}

export function wendeAutoGruppeAn(
  zeichnung: Zeichnung,
  quelle: SlotQuelle,
  slotsNeu: readonly Slot[],
  fall: AutoGruppe | null,
  angaben?: GruppenAngaben,
): VerknuepfungsErgebnis {
  const objekt = findeKomponente(zeichnung, quelle)
  if (!objekt) throw new Error(`Komponente ${quelle.objektId} nicht gefunden`)
  let gruppen = [...zeichnung.geraeteGruppen]
  const objekte = new Map<string, KomponenteImBlatt>()
  if (objekt.gruppeId)
    gruppen = gruppen.map((g) => (g.id === objekt.gruppeId ? { ...g, slots: [...slotsNeu] } : g))
  else
    objekte.set(objekt.id, { blattId: quelle.blattId, objekt: { ...objekt, slots: [...slotsNeu] } })
  if (fall) {
    let gruppeId: string
    if (fall.art === 'neu') {
      const neu = erzeugeGruppeMitAngaben(fall.typ, angaben ?? angabenAusVorgabe(fall.vorgabe))
      gruppen = [...gruppen, neu]
      gruppeId = neu.id
    } else gruppeId = fall.gruppe!.id
    for (const m of fall.mitglieder) {
      const stand = objekte.get(m.objekt.id)?.objekt ?? m.objekt
      objekte.set(m.objekt.id, {
        blattId: m.blattId,
        objekt: { ...stand, gruppeId, slots: undefined },
      })
    }
    lenkeSlotZieleUm(
      zeichnung,
      new Set(fall.mitglieder.map((m) => zielSchluessel({ art: 'instanz', ...ortVon(m) }))),
      { art: 'gruppe', gruppeId },
      gruppen,
      objekte,
      (n) => {
        gruppen = n
      },
    )
  }
  return { geraeteGruppen: gruppen, objekte: [...objekte.values()] }
}

export function mitVerknuepfungsErgebnis(
  zeichnung: Zeichnung,
  ergebnis: VerknuepfungsErgebnis,
): Zeichnung {
  const ersatz = new Map(ergebnis.objekte.map((e) => [e.objekt.id, e.objekt]))
  return {
    ...zeichnung,
    geraeteGruppen: ergebnis.geraeteGruppen,
    blaetter: zeichnung.blaetter.map((b) =>
      b.objekte.some((o) => ersatz.has(o.id))
        ? { ...b, objekte: b.objekte.map((o) => ersatz.get(o.id) ?? o) }
        : b,
    ),
  }
}

export function verbindeErgebnisse(
  a: VerknuepfungsErgebnis,
  b: VerknuepfungsErgebnis,
): VerknuepfungsErgebnis {
  const objekte = new Map(a.objekte.map((e) => [e.objekt.id, e]))
  for (const e of b.objekte) objekte.set(e.objekt.id, e)
  return { geraeteGruppen: b.geraeteGruppen, objekte: [...objekte.values()] }
}
