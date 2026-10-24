import { typDefinition, typSlotDarstellung } from './geraete-regelwerk'
import { erzeugeId } from './id'

export type KomponentenTyp = string

export function typHatSlots(typ: KomponentenTyp): boolean {
  return typSlotDarstellung(typ) !== 'keine'
}

export function typHatSlotMatrix(typ: KomponentenTyp | undefined | null): boolean {
  return !!typ && typSlotDarstellung(typ) === 'matrix'
}

export function typHatAnsteuerung(typ: KomponentenTyp): boolean {
  return typDefinition(typ)?.ansteuerung ?? false
}

export function typVerbindungenGrau(typ: KomponentenTyp): boolean {
  return typDefinition(typ)?.verbindungenGrau ?? false
}

export type Ansteuerung = string

export type SlotZiel =
  { art: 'instanz'; blattId: string; objektId: string } | { art: 'gruppe'; gruppeId: string }

export interface Slot {
  id: string
  bezeichnung?: string
  ziele: SlotZiel[]
}

export function erzeugeSlot(bezeichnung?: string): Slot {
  return { id: erzeugeId('slot'), bezeichnung, ziele: [] }
}

export interface SlotVorlage {
  id: string
  bezeichnung: string
}

export function erzeugeSlotVorlage(bezeichnung = ''): SlotVorlage {
  return { id: erzeugeId('slotvorlage'), bezeichnung }
}

export interface SlotMatrix {
  spalten: 1 | 2
  zeilen: number
  zeilenSpalten?: (1 | 2)[]
}

export function spaltenFuerZeile(matrix: SlotMatrix, zeile0: number): 1 | 2 {
  return matrix.zeilenSpalten?.[zeile0] ?? matrix.spalten
}

export function matrixKapazitaet(matrix: SlotMatrix): number {
  let summe = 0
  for (let zeile0 = 0; zeile0 < matrix.zeilen; zeile0++) summe += spaltenFuerZeile(matrix, zeile0)
  return summe
}

export function normalisiereSlotMatrix(matrix: SlotMatrix): SlotMatrix {
  if (!matrix.zeilenSpalten) return matrix
  const relevant = matrix.zeilenSpalten.slice(0, matrix.zeilen)
  if (relevant.every((s) => s === matrix.spalten)) {
    const { zeilenSpalten: _entfernt, ...rest } = matrix
    return rest
  }
  if (relevant.length === matrix.zeilenSpalten.length) return matrix
  return { ...matrix, zeilenSpalten: relevant }
}

export function spanneJeSlot(matrix: SlotMatrix): (1 | 2)[] {
  const ergebnis: (1 | 2)[] = []
  for (let zeile0 = 0; zeile0 < matrix.zeilen; zeile0++) {
    const spalten = spaltenFuerZeile(matrix, zeile0)
    const spanne = (2 / spalten) as 1 | 2
    for (let s = 0; s < spalten; s++) ergebnis.push(spanne)
  }
  return ergebnis
}

export interface SlotZeilenGruppe {
  zeile0: number
  spalten: 1 | 2
  slots: { slot: Slot; index: number }[]
}

export function gruppiereSlotsNachZeile(slots: Slot[], matrix: SlotMatrix): SlotZeilenGruppe[] {
  const gruppen: SlotZeilenGruppe[] = []
  let offset = 0
  for (let zeile0 = 0; zeile0 < matrix.zeilen; zeile0++) {
    const breite = spaltenFuerZeile(matrix, zeile0)
    const zeilenSlots: { slot: Slot; index: number }[] = []
    for (let s = 0; s < breite; s++, offset++) {
      const slot = slots[offset]
      if (slot) zeilenSlots.push({ slot, index: offset })
    }
    gruppen.push({ zeile0, spalten: breite, slots: zeilenSlots })
  }
  return gruppen
}

export interface SlotVorlagenPosition {
  slotNummer: number
  zeile?: number
  spalte?: number
  ausserhalbDerMatrix: boolean
}

export function ermittleSlotVorlagenPosition(
  index: number,
  matrix: SlotMatrix | undefined,
): SlotVorlagenPosition {
  if (!matrix) return { slotNummer: index + 1, ausserhalbDerMatrix: false }
  let rest = index
  let zeile0 = 0
  while (rest >= spaltenFuerZeile(matrix, zeile0)) {
    rest -= spaltenFuerZeile(matrix, zeile0)
    zeile0++
  }
  return {
    slotNummer: index + 1,
    zeile: zeile0 + 1,
    spalte: rest + 1,
    ausserhalbDerMatrix: index >= matrixKapazitaet(matrix),
  }
}

export interface Geraetegruppe {
  id: string
  name?: string
  typ: KomponentenTyp
  slots: Slot[]
  slotMatrix?: SlotMatrix
  ansteuerung?: Ansteuerung
  knx?: boolean
}

export function erzeugeGeraetegruppe(typ: KomponentenTyp, name?: string): Geraetegruppe {
  return { id: erzeugeId('gruppe'), name, typ, slots: [] }
}
