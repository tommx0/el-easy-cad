import type { Command } from '../command'
import { ohneBlattsperre } from '../command'
import type {
  Blatt,
  DocumentStore,
  PlanLinie,
  UmwandelnAuftrag,
  UmwandelnMehrereErgebnis,
  Zeichnung,
} from '../../document-model'
import {
  kombinationsFaktor,
  ordneWandstellen,
  planUebersetzer,
  setzeKombinationsFaktor,
  uebernimmEbenen,
  wandleHintergrundUm,
  wandleHintergruendeUm,
  zeichnungsEbenen,
} from '../../document-model'
import { t } from '../../sprache'

export class UpdateBlattCommand<K extends keyof Blatt> implements Command {
  readonly label: string
  private doc: DocumentStore
  private blattId: string
  private vorher: Pick<Blatt, K>
  private nachher: Pick<Blatt, K>

  constructor(
    doc: DocumentStore,
    blattId: string,
    vorher: Pick<Blatt, K>,
    nachher: Pick<Blatt, K>,
    label: string,
  ) {
    this.doc = doc
    this.blattId = blattId
    this.vorher = vorher
    this.nachher = nachher
    this.label = label
  }

  do() {
    this.doc.updateBlatt(this.blattId, this.nachher)
  }

  undo() {
    this.doc.updateBlatt(this.blattId, this.vorher)
  }
}

export function erzeugeBlattAendernCommand<K extends keyof Blatt>(
  doc: DocumentStore,
  blattId: string,
  label: string,
  nachher: Pick<Blatt, K>,
): Command {
  const blatt = doc.getBlatt(blattId)
  if (!blatt) throw new Error(`Blatt ${blattId} nicht gefunden`)
  const vorher = {} as Pick<Blatt, K>
  for (const key of Object.keys(nachher) as K[]) {
    vorher[key] = blatt[key]
  }
  return new UpdateBlattCommand(doc, blattId, vorher, nachher, label)
}

export class UpdateZeichnungCommand<K extends keyof Zeichnung> implements Command {
  readonly label: string
  private doc: DocumentStore
  private vorher: Pick<Zeichnung, K>
  private nachher: Pick<Zeichnung, K>

  constructor(
    doc: DocumentStore,
    vorher: Pick<Zeichnung, K>,
    nachher: Pick<Zeichnung, K>,
    label: string,
  ) {
    this.doc = doc
    this.vorher = vorher
    this.nachher = nachher
    this.label = label
  }

  do() {
    this.doc.updateZeichnung(this.nachher)
  }

  undo() {
    this.doc.updateZeichnung(this.vorher)
  }
}

export function erzeugeZeichnungAendernCommand<
  K extends Exclude<keyof Zeichnung, 'blaetter' | 'aktivesBlattId' | 'zeichnungsart'>,
>(doc: DocumentStore, label: string, nachher: Pick<Zeichnung, K>): Command {
  const zeichnung = doc.getZeichnung()
  const vorher = {} as Pick<Zeichnung, K>
  for (const key of Object.keys(nachher) as K[]) {
    vorher[key] = zeichnung[key]
  }
  return new UpdateZeichnungCommand(doc, vorher, nachher, label)
}

export class SetBlaetterCommand implements Command {
  readonly label: string
  private doc: DocumentStore
  private vorher: { blaetter: Blatt[]; aktivesBlattId: string }
  private nachher: { blaetter: Blatt[]; aktivesBlattId: string }

  constructor(
    doc: DocumentStore,
    vorher: { blaetter: Blatt[]; aktivesBlattId: string },
    nachher: { blaetter: Blatt[]; aktivesBlattId: string },
    label: string,
  ) {
    this.doc = doc
    this.vorher = vorher
    this.nachher = nachher
    this.label = label
  }

  do() {
    this.doc.setBlaetter(this.nachher.blaetter, this.nachher.aktivesBlattId)
  }

  undo() {
    this.doc.setBlaetter(this.vorher.blaetter, this.vorher.aktivesBlattId)
  }
}

export function erzeugeBlattHinzufuegenCommand(doc: DocumentStore, neuesBlatt: Blatt): Command {
  const zeichnung = doc.getZeichnung()
  const vorher = { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId }
  const blatt = uebernimmEbenen(neuesBlatt, zeichnungsEbenen(zeichnung.blaetter))
  const nachher = { blaetter: [...zeichnung.blaetter, blatt], aktivesBlattId: blatt.id }
  return new SetBlaetterCommand(
    doc,
    vorher,
    nachher,
    t('werkzeuge.commands.blattAnlegen', { name: blatt.name }),
  )
}

export function erzeugeBlattEinfuegenCommand(
  doc: DocumentStore,
  neuesBlatt: Blatt,
  index: number,
  label: string,
  ersetzt: readonly Blatt[] = [],
): Command {
  const zeichnung = doc.getZeichnung()
  const vorher = { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId }
  const blatt = uebernimmEbenen(neuesBlatt, zeichnungsEbenen(zeichnung.blaetter))
  const neu = new Map(ersetzt.map((b) => [b.id, b]))
  const blaetter = zeichnung.blaetter.map((b) => neu.get(b.id) ?? b)
  blaetter.splice(Math.max(0, Math.min(index, blaetter.length)), 0, blatt)
  return new SetBlaetterCommand(doc, vorher, { blaetter, aktivesBlattId: blatt.id }, label)
}

export function erzeugeBlaetterHinzufuegenCommand(
  doc: DocumentStore,
  neueBlaetter: Blatt[],
  label: string,
): Command | null {
  if (neueBlaetter.length === 0) return null
  const zeichnung = doc.getZeichnung()
  const vorher = { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId }
  const ebenen = zeichnungsEbenen(zeichnung.blaetter)
  const blaetter = neueBlaetter.map((b) => uebernimmEbenen(b, ebenen))
  const nachher = {
    blaetter: [...zeichnung.blaetter, ...blaetter],
    aktivesBlattId: blaetter[0].id,
  }
  return new SetBlaetterCommand(doc, vorher, nachher, label)
}

export function erzeugeBlattLoeschenCommand(doc: DocumentStore, blattId: string): Command | null {
  const zeichnung = doc.getZeichnung()
  if (zeichnung.blaetter.length <= 1) return null
  const index = zeichnung.blaetter.findIndex((b) => b.id === blattId)
  if (index === -1) return null
  const vorher = { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId }
  const blaetter = zeichnung.blaetter.filter((b) => b.id !== blattId)
  let aktivesBlattId = zeichnung.aktivesBlattId
  if (aktivesBlattId === blattId) aktivesBlattId = blaetter[Math.max(0, index - 1)].id
  const nachher = { blaetter, aktivesBlattId }
  const name = zeichnung.blaetter[index].name
  return new SetBlaetterCommand(
    doc,
    vorher,
    nachher,
    t('werkzeuge.commands.blattLoeschen', { name }),
  )
}

export function erzeugeBlattVerschiebenCommand(
  doc: DocumentStore,
  blattId: string,
  zielIndex: number,
): Command | null {
  const zeichnung = doc.getZeichnung()
  const vonIndex = zeichnung.blaetter.findIndex((b) => b.id === blattId)
  if (vonIndex === -1) return null

  const ziel = Math.max(0, Math.min(zeichnung.blaetter.length - 1, zielIndex))
  if (ziel === vonIndex) return null

  const blaetter = [...zeichnung.blaetter]
  const [blatt] = blaetter.splice(vonIndex, 1)
  blaetter.splice(ziel, 0, blatt)

  return ohneBlattsperre(
    new SetBlaetterCommand(
      doc,
      { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId },
      { blaetter, aktivesBlattId: zeichnung.aktivesBlattId },
      t('werkzeuge.commands.blattVerschieben', { name: blatt.name }),
    ),
  )
}

export function erzeugeHintergrundUmwandelnCommand(
  doc: DocumentStore,
  blattId: string,
  optionen: { pdfLinien?: readonly PlanLinie[]; ersetzen?: boolean } = {},
): { command: Command; anzahl: number; ersetzt: number } | null {
  const zeichnung = doc.getZeichnung()
  const ergebnis = wandleHintergrundUm(zeichnung.blaetter, blattId, {
    ...optionen,
    tp: planUebersetzer(zeichnung),
  })
  if (!ergebnis) return null
  return {
    command: new SetBlaetterCommand(
      doc,
      { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId },
      { blaetter: ergebnis.blaetter, aktivesBlattId: zeichnung.aktivesBlattId },
      t('werkzeuge.commands.umwandeln'),
    ),
    anzahl: ergebnis.anzahl,
    ersetzt: ergebnis.ersetzt,
  }
}

export function erzeugeHintergruendeUmwandelnCommand(
  doc: DocumentStore,
  auftraege: readonly UmwandelnAuftrag[],
): ({ command: Command } & Omit<UmwandelnMehrereErgebnis, 'blaetter'>) | null {
  const zeichnung = doc.getZeichnung()
  const ergebnis = wandleHintergruendeUm(zeichnung.blaetter, auftraege, planUebersetzer(zeichnung))
  if (!ergebnis) return null
  return {
    command: new SetBlaetterCommand(
      doc,
      { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId },
      { blaetter: ergebnis.blaetter, aktivesBlattId: zeichnung.aktivesBlattId },
      t('werkzeuge.commands.umwandelnBlaetter', { n: ergebnis.jeBlatt.length }),
    ),
    anzahl: ergebnis.anzahl,
    jeBlatt: ergebnis.jeBlatt,
  }
}

export class UmgewandeltErsetzenCommand implements Command {
  readonly label = t('werkzeuge.commands.umgewandeltErsetzen')
  private doc: DocumentStore
  private blattIds: readonly string[]
  private vorher: { blaetter: Blatt[]; aktivesBlattId: string } | null = null
  private nachher: { blaetter: Blatt[]; aktivesBlattId: string } | null = null

  constructor(doc: DocumentStore, blattIds: readonly string[]) {
    this.doc = doc
    this.blattIds = blattIds
  }

  do() {
    if (!this.nachher) {
      const zeichnung = this.doc.getZeichnung()
      let blaetter = zeichnung.blaetter
      for (const blattId of this.blattIds) {
        blaetter =
          wandleHintergrundUm(blaetter, blattId, { ersetzen: true, tp: planUebersetzer(zeichnung) })
            ?.blaetter ?? blaetter
      }
      this.vorher = { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId }
      this.nachher = { blaetter, aktivesBlattId: zeichnung.aktivesBlattId }
    }
    this.doc.setBlaetter(this.nachher.blaetter, this.nachher.aktivesBlattId)
  }

  undo() {
    if (this.vorher) this.doc.setBlaetter(this.vorher.blaetter, this.vorher.aktivesBlattId)
  }
}

export function erzeugeKombinationsFaktorCommand(
  doc: DocumentStore,
  alt: number,
  uebernehmen: (faktor: number) => void,
): Command | null {
  const neu = kombinationsFaktor()
  const zeichnung = doc.getZeichnung()
  let geaendert = false
  const blaetter = zeichnung.blaetter.map((blatt) => {
    const objekte = ordneWandstellen(blatt.objekte, zeichnung)
    if (objekte === blatt.objekte) return blatt
    geaendert = true
    return { ...blatt, objekte }
  })
  if (!geaendert) return null
  const vorher = { blaetter: zeichnung.blaetter, aktivesBlattId: zeichnung.aktivesBlattId }
  const nachher = { blaetter, aktivesBlattId: zeichnung.aktivesBlattId }
  const setzen = (faktor: number) => {
    setzeKombinationsFaktor(faktor)
    uebernehmen(faktor)
  }
  return ohneBlattsperre({
    label: t('werkzeuge.commands.symbolgroesse'),
    do() {
      setzen(neu)
      doc.setBlaetter(nachher.blaetter, nachher.aktivesBlattId)
    },
    undo() {
      setzen(alt)
      doc.setBlaetter(vorher.blaetter, vorher.aktivesBlattId)
    },
  })
}
