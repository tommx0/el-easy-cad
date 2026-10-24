import type { Command } from '../command'
import { CompositeCommand } from '../command'
import type {
  Ansteuerung,
  DocumentStore,
  Geraetegruppe,
  GruppenAngaben,
  KomponentenTyp,
  Objekt,
  Slot,
  SlotMatrix,
  SlotZiel,
  VerknuepfungsErgebnis,
} from '../../document-model'
import { bereinigeSlots, erzeugeGruppeMitAngaben, typHatSlots } from '../../document-model'
import {
  buendleProBlatt,
  erzeugeObjektAendernCommand,
  erzeugeObjektAktualisierenCommand,
} from './objekt-commands'
import { erzeugeZeichnungAendernCommand } from './blatt-commands'
import { t } from '../../sprache'

function findeInstanz(doc: DocumentStore, blattId: string, objektId: string) {
  const instanz = doc.getBlatt(blattId)?.objekte.find((o) => o.id === objektId)
  if (!instanz || instanz.type !== 'komponente') {
    throw new Error(`Komponenten-Instanz ${objektId} auf Blatt ${blattId} nicht gefunden`)
  }
  return instanz
}

function patcheTypUndSlots(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  patch: {
    typ?: KomponentenTyp
    slots?: Slot[]
    slotMatrix?: SlotMatrix
    ansteuerung?: Ansteuerung
    knx?: boolean
  },
  label: string,
): Command {
  const instanz = findeInstanz(doc, blattId, objektId)
  if (instanz.gruppeId) {
    const zeichnung = doc.getZeichnung()
    const gruppen = zeichnung.geraeteGruppen.map((g) =>
      g.id === instanz.gruppeId ? { ...g, ...patch } : g,
    )
    return erzeugeZeichnungAendernCommand(doc, label, { geraeteGruppen: gruppen })
  }
  return erzeugeObjektAktualisierenCommand(doc, blattId, objektId, patch, label)
}

export function erzeugeTypAendernCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  typ: KomponentenTyp,
): Command {
  const patch: { typ: KomponentenTyp; slots?: Slot[] } = { typ }
  if (!typHatSlots(typ)) patch.slots = []
  return patcheTypUndSlots(doc, blattId, objektId, patch, t('werkzeuge.commands.typAendern'))
}

export function erzeugeSlotsAendernCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  slots: Slot[],
): Command {
  return patcheTypUndSlots(doc, blattId, objektId, { slots }, t('werkzeuge.commands.slotsAendern'))
}

export function erzeugeSlotMatrixAendernCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  slotMatrix: SlotMatrix,
  slots: Slot[],
): Command {
  return patcheTypUndSlots(
    doc,
    blattId,
    objektId,
    { slotMatrix, slots },
    t('werkzeuge.commands.slotMatrixAendern'),
  )
}

export function erzeugeAnsteuerungAendernCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  ansteuerung: Ansteuerung | undefined,
): Command {
  return patcheTypUndSlots(
    doc,
    blattId,
    objektId,
    { ansteuerung },
    t('werkzeuge.commands.ansteuerungAendern'),
  )
}

export function erzeugeKnxAendernCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  knx: boolean,
): Command {
  return patcheTypUndSlots(
    doc,
    blattId,
    objektId,
    { knx: knx || undefined },
    t('werkzeuge.commands.knxAendern'),
  )
}

export function erzeugeGruppeErstellenCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  typ: KomponentenTyp,
  angaben: GruppenAngaben = {},
): Command {
  const instanz = findeInstanz(doc, blattId, objektId)
  const gruppe: Geraetegruppe = erzeugeGruppeMitAngaben(typ, angaben, instanz.slots ?? [])
  const label = t('werkzeuge.commands.gruppeErstellen')
  const zeichnungCommand = erzeugeZeichnungAendernCommand(doc, label, {
    geraeteGruppen: [...doc.getZeichnung().geraeteGruppen, gruppe],
  })
  const objektCommand = erzeugeObjektAktualisierenCommand(
    doc,
    blattId,
    objektId,
    { gruppeId: gruppe.id, slots: undefined },
    label,
  )
  return new CompositeCommand(label, [zeichnungCommand, objektCommand])
}

export function erzeugeGruppeBeitretenCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
  gruppeId: string,
): Command {
  return erzeugeObjektAktualisierenCommand(
    doc,
    blattId,
    objektId,
    { gruppeId, slots: undefined },
    t('werkzeuge.commands.gruppeBeitreten'),
  )
}

export function erzeugeGruppeVerlassenCommand(
  doc: DocumentStore,
  blattId: string,
  objektId: string,
): Command {
  return erzeugeObjektAktualisierenCommand(
    doc,
    blattId,
    objektId,
    { gruppeId: undefined, slots: undefined },
    t('werkzeuge.commands.gruppeVerlassen'),
  )
}

export function erzeugeGruppeLoeschenCommand(doc: DocumentStore, gruppeId: string): Command {
  const label = t('werkzeuge.commands.gruppeLoeschen')
  const zeichnung = doc.getZeichnung()
  const istZielAufGruppe = (ziel: SlotZiel): boolean =>
    ziel.art === 'gruppe' && ziel.gruppeId === gruppeId

  const geraeteGruppenNeu = zeichnung.geraeteGruppen
    .filter((g) => g.id !== gruppeId)
    .map((g) => {
      const slots = bereinigeSlots(g.slots, istZielAufGruppe)
      return slots === g.slots ? g : { ...g, slots }
    })
  const zeichnungCommand = erzeugeZeichnungAendernCommand(doc, label, {
    geraeteGruppen: geraeteGruppenNeu,
  })

  const eintraege = zeichnung.blaetter
    .filter((blatt) =>
      blatt.objekte.some(
        (o) =>
          o.type === 'komponente' &&
          (o.gruppeId === gruppeId || o.slots?.some((s) => s.ziele.some(istZielAufGruppe))),
      ),
    )
    .map((blatt) => ({
      blattId: blatt.id,
      aendern: (objekte: Objekt[]) =>
        objekte.map((o) => {
          if (o.type !== 'komponente') return o
          let neu = o
          if (neu.gruppeId === gruppeId) {
            neu = { ...neu, gruppeId: undefined, slots: undefined }
          }
          if (neu.slots) {
            const slots = bereinigeSlots(neu.slots, istZielAufGruppe)
            if (slots !== neu.slots) neu = { ...neu, slots }
          }
          return neu
        }),
    }))
  const objektCommands = buendleProBlatt(doc, eintraege, label)
  return objektCommands.length === 0
    ? zeichnungCommand
    : new CompositeCommand(label, [zeichnungCommand, ...objektCommands])
}

export function erzeugeGruppeAusAuswahlBildenCommand(
  doc: DocumentStore,
  blattId: string,
  objektIds: readonly string[],
  typ: KomponentenTyp,
  angaben: GruppenAngaben = {},
): Command {
  const label = t('werkzeuge.commands.gruppeAusAuswahl')
  const gruppe = erzeugeGruppeMitAngaben(typ, angaben)
  const zeichnungCommand = erzeugeZeichnungAendernCommand(doc, label, {
    geraeteGruppen: [...doc.getZeichnung().geraeteGruppen, gruppe],
  })
  const idSet = new Set(objektIds)
  const objektCommand = erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    objekte.map((o) =>
      o.type === 'komponente' && idSet.has(o.id)
        ? { ...o, gruppeId: gruppe.id, slots: undefined }
        : o,
    ),
  )
  return new CompositeCommand(label, [zeichnungCommand, objektCommand])
}

export function erzeugeLeitungsVerknuepfungCommand(
  doc: DocumentStore,
  ergebnis: VerknuepfungsErgebnis,
): Command {
  return erzeugeGruppenErgebnisCommand(
    doc,
    ergebnis,
    t('werkzeuge.commands.gruppeUndWirkverbindung'),
  )
}

export function erzeugeGruppenErgebnisCommand(
  doc: DocumentStore,
  ergebnis: VerknuepfungsErgebnis,
  label: string,
): Command {
  const zeichnungCommand = erzeugeZeichnungAendernCommand(doc, label, {
    geraeteGruppen: ergebnis.geraeteGruppen,
  })
  const ersatz = new Map(ergebnis.objekte.map((e) => [e.objekt.id, e.objekt]))
  const blaetter = [...new Set(ergebnis.objekte.map((e) => e.blattId))]
  const objektCommands = buendleProBlatt(
    doc,
    blaetter.map((blattId) => ({
      blattId,
      aendern: (objekte: Objekt[]) => objekte.map((o) => ersatz.get(o.id) ?? o),
    })),
    label,
  )
  return new CompositeCommand(label, [zeichnungCommand, ...objektCommands])
}
