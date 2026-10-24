import type { KatalogTextElement } from './catalog'
import { typSlotDarstellung } from './geraete-regelwerk'
import { erzeugeSlot, normalisiereSlotMatrix, spaltenFuerZeile } from './geraetegruppe'
import type { KomponentenTyp, Slot, SlotMatrix, SlotVorlage } from './geraetegruppe'
import {
  ableiteSlotMatrix,
  passeSlotsAnMatrixAn,
  slotsAusVorlagen,
} from './geraetegruppen-ableitung'

export const SLOT_ANZAHL_MAX = 32

export const SLOT_RASTER_ZEILEN_MAX = 8

export function zahlAusText(text: string): number | null {
  const treffer = /\d+/.exec(text)
  if (!treffer) return null
  const zahl = Number(treffer[0])
  return zahl > 0 ? zahl : null
}

export function slotKopplungWirksam(
  typ: KomponentenTyp | undefined,
  slotAnzahlAus: string | undefined,
): boolean {
  return !!slotAnzahlAus && !!typ && typSlotDarstellung(typ) !== 'keine'
}

export function variablenWert(
  elemente: readonly KatalogTextElement[] | undefined,
  feldname: string,
): string | undefined {
  return elemente?.find((e) => e.variable === feldname)?.text
}

export function naechsterSlotName(vorgaenger: string | undefined, position: number): string {
  const treffer = vorgaenger ? /^(.*?)(\d+)(\D*)$/.exec(vorgaenger) : null
  if (!treffer) return `Slot ${position}`
  return `${treffer[1]}${Number(treffer[2]) + 1}${treffer[3]}`
}

export function slotsFuerAnzahl(
  slots: readonly Slot[],
  anzahl: number,
  vorlagen: readonly string[] = [],
): { slots: Slot[]; entfernteMitZielen: Slot[] } {
  if (anzahl <= slots.length) {
    return {
      slots: slots.slice(0, anzahl),
      entfernteMitZielen: slots.slice(anzahl).filter((s) => s.ziele.length > 0),
    }
  }
  const neu = [...slots]
  while (neu.length < anzahl) {
    const name =
      vorlagen[neu.length] ?? naechsterSlotName(neu[neu.length - 1]?.bezeichnung, neu.length + 1)
    neu.push(erzeugeSlot(name))
  }
  return { slots: neu, entfernteMitZielen: [] }
}

export function rasterMitZeilen(matrix: SlotMatrix, zeilen: number): SlotMatrix {
  if (!matrix.zeilenSpalten) return { ...matrix, zeilen }
  const letzte = spaltenFuerZeile(matrix, matrix.zeilen - 1)
  const zeilenSpalten = Array.from({ length: zeilen }, (_, i) =>
    i < matrix.zeilen ? spaltenFuerZeile(matrix, i) : letzte,
  )
  return normalisiereSlotMatrix({ ...matrix, zeilen, zeilenSpalten })
}

export interface SlotAnpassung {
  slots: Slot[]
  slotMatrix?: SlotMatrix
  entfernteMitZielen: Slot[]
  anzahl: number
  begrenzt: boolean
}

export function slotsNachText(
  typ: KomponentenTyp,
  stand: { slots: readonly Slot[]; slotMatrix?: SlotMatrix },
  text: string,
  vorlagen: readonly string[] = [],
): SlotAnpassung | null {
  const zahl = zahlAusText(text)
  if (zahl === null) return null
  if (typSlotDarstellung(typ) === 'matrix') {
    const zeilen = Math.min(zahl, SLOT_RASTER_ZEILEN_MAX)
    const alt = ableiteSlotMatrix(stand.slotMatrix, [...stand.slots])
    const slotMatrix = rasterMitZeilen(alt, zeilen)
    return {
      ...passeSlotsAnMatrixAn([...stand.slots], slotMatrix, alt),
      slotMatrix,
      anzahl: zeilen,
      begrenzt: zahl > SLOT_RASTER_ZEILEN_MAX,
    }
  }
  const anzahl = Math.min(zahl, SLOT_ANZAHL_MAX)
  return {
    ...slotsFuerAnzahl(stand.slots, anzahl, vorlagen),
    anzahl,
    begrenzt: zahl > SLOT_ANZAHL_MAX,
  }
}

export function wendeSlotKopplungAn(
  typ: KomponentenTyp | undefined,
  slotAnzahlAus: string | undefined,
  textElemente: readonly KatalogTextElement[] | undefined,
  stand: { slots?: Slot[]; slotMatrix?: SlotMatrix },
  vorlagen: readonly string[] = [],
): { slots?: Slot[]; slotMatrix?: SlotMatrix } {
  if (!slotKopplungWirksam(typ, slotAnzahlAus)) return stand
  const wert = variablenWert(textElemente, slotAnzahlAus!)
  const anpassung =
    wert === undefined
      ? null
      : slotsNachText(
          typ!,
          { slots: stand.slots ?? [], slotMatrix: stand.slotMatrix },
          wert,
          vorlagen,
        )
  if (!anpassung) return stand
  return {
    slots: anpassung.slots,
    slotMatrix: anpassung.slotMatrix ?? stand.slotMatrix,
  }
}

export function slotsBeimPlatzieren(eintrag: {
  typ?: KomponentenTyp
  slotVorlagen?: SlotVorlage[]
  slotMatrixVorlage?: SlotMatrix
  slotAnzahlAus?: string
  textElemente?: readonly KatalogTextElement[]
}): { slots?: Slot[]; slotMatrix?: SlotMatrix } {
  return wendeSlotKopplungAn(
    eintrag.typ,
    eintrag.slotAnzahlAus,
    eintrag.textElemente,
    {
      slots: slotsAusVorlagen(eintrag.slotVorlagen, eintrag.slotMatrixVorlage),
      slotMatrix: eintrag.slotMatrixVorlage,
    },
    eintrag.slotVorlagen?.map((v) => v.bezeichnung),
  )
}

export function slotKopplungNachziehen<
  K extends { slotAnzahlAus?: string; textElemente?: KatalogTextElement[] },
>(alt: K, neu: K): K {
  const feld = neu.slotAnzahlAus
  if (feld === undefined) return neu
  const hatFeld = (k: K) => (k.textElemente ?? []).some((t) => t.variable === feld)
  if (hatFeld(neu) || !hatFeld(alt)) return neu
  const index = (alt.textElemente ?? []).findIndex((t) => t.variable === feld)
  const umbenannt =
    alt.textElemente?.length === neu.textElemente?.length
      ? neu.textElemente?.[index]?.variable
      : undefined
  return { ...neu, slotAnzahlAus: umbenannt }
}

export interface SlotKopplungInstanz {
  typ?: KomponentenTyp
  gruppeId?: string
  slotAnzahlAus?: string
  slots?: Slot[]
  slotMatrix?: SlotMatrix
}

export function slotAenderungFuerWert(
  instanz: SlotKopplungInstanz,
  feldname: string,
  wert: string,
): SlotAnpassung | null {
  if (instanz.slotAnzahlAus !== feldname || instanz.gruppeId) return null
  if (!slotKopplungWirksam(instanz.typ, feldname)) return null
  return slotsNachText(
    instanz.typ!,
    { slots: instanz.slots ?? [], slotMatrix: instanz.slotMatrix },
    wert,
  )
}
