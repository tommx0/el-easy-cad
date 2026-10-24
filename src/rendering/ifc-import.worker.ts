import { IfcAPI } from 'web-ifc'
import wasmUrl from 'web-ifc/web-ifc.wasm?url'
import type {
  Grundrisse,
  HoehenIndex,
  IfcHuelle,
  IfcBauteilfunde,
  IfcGeschoss,
  IfcGruppenAnzahl,
  Schnittlinie,
} from '../ifc'
import {
  baueGrundrisse,
  baueHoehenIndex,
  deckenAusdehnungen,
  hoehenVersatz,
  lichteRaumhoehen,
  liesGeschosse,
  liesIfcBauteile,
  sammleHuelle,
  schneideAlles,
  schneideGeschoss,
  zaehleBauteilgruppen,
} from '../ifc'
import type { IfcBauteil, IfcLage, Point } from '../document-model'
import { setzeOberflaechensprache, t } from '../sprache'
import type { Sprache } from '../sprache'

export type IfcGeschossInfo = Omit<IfcGeschoss, 'schnittElemente'>

export type IfcAuftrag =
  | { art: 'oeffnen'; daten: ArrayBuffer }
  | {
      art: 'importieren'
      geschossIds: number[]
      freieHoehen?: number[]
      schnitthoehe: number
      ausrichten: boolean
      lage?: IfcLage
    }
  | { art: 'nachladen'; eintraege: IfcNachladeAuftrag[] }
  | {
      art: 'vorschau'
      ziel: { geschossId: number } | { freieHoehe: number }
      schnitthoehe: number
      ausrichten: boolean
      lage?: IfcLage
    }
  | { art: 'huelle'; eintraege: IfcHuellenAuftrag[]; ursprung: Point }
  | {
      art: 'bauteile'
      ziel: { geschossId: number } | { freieHoehe: number }
      schnitthoehe: number
    }

export type IfcAuftragMitSprache = IfcAuftrag & { sprache: Sprache }

export interface IfcHuellenAuftrag {
  schluessel: string
  geschossGuid?: string
  geschossName?: string
  kote: number
}

export type IfcHuellenErgebnis =
  { schluessel: string; huelle: IfcHuelle } | { schluessel: string; fehler: string }

export interface IfcNachladeAuftrag {
  ziel: { geschossId: number } | { freieHoehe: number }
  schnitthoehe: number
  lage: IfcLage
}

export type IfcAntwort =
  | { art: 'geoeffnet'; geschosse: IfcGeschossInfo[]; gruppen: IfcGruppenAnzahl[] }
  | { art: 'fortschritt'; erledigt: number; gesamt: number }
  | { art: 'ergebnis'; grundrisse: Grundrisse }
  | { art: 'vorschau'; grundrisse: Grundrisse }
  | { art: 'nachgeladen'; geschosse: Grundrisse['geschosse'] }
  | { art: 'bauteile'; funde: IfcBauteilfunde }
  | { art: 'huelle'; ergebnisse: IfcHuellenErgebnis[] }
  | { art: 'fehler'; meldung: string }

let api: IfcAPI | null = null
let modell = -1
let geschosse: IfcGeschoss[] = []
const schnitte = new Map<string, Schnitt>()

interface Schnitt {
  linien: Schnittlinie[]
  bauteile: IfcBauteil[]
}

function grundrisseAus(
  liste: Schnitt[],
  optionen: Parameters<typeof baueGrundrisse>[1],
): Grundrisse {
  const grundrisse = baueGrundrisse(
    liste.map((s) => s.linien),
    optionen,
  )
  return {
    ...grundrisse,
    geschosse: grundrisse.geschosse.map((g, i) => ({ ...g, bauteile: liste[i].bauteile })),
  }
}
let hoehenIndex: HoehenIndex | null = null

function index(): HoehenIndex {
  if (!api) throw new Error(t('ifc.import.keineDatei'))
  hoehenIndex ??= baueHoehenIndex(api, modell)
  return hoehenIndex
}

let raumhoehen: Map<number, number> | null = null

function raumhoeheVon(geschossId: number): number | undefined {
  if (!api) return undefined
  raumhoehen ??= lichteRaumhoehen(geschosse, deckenAusdehnungen(api, modell, index()))
  return raumhoehen.get(geschossId)
}

function mitRaumhoehe<T extends object>(geschoss: T, geschossId: number): T {
  const raumhoehe = raumhoeheVon(geschossId)
  return raumhoehe === undefined ? geschoss : { ...geschoss, raumhoehe }
}

function freierSchnitt(hoehe: number): Schnitt {
  if (!api) throw new Error(t('ifc.import.keineDatei'))
  const schluessel = `frei@${hoehe}`
  let ergebnis = schnitte.get(schluessel)
  if (!ergebnis) {
    const bauteile: IfcBauteil[] = []
    const linien = schneideAlles(api, modell, hoehe + hoehenVersatz(geschosse), index(), bauteile)
    ergebnis = { linien, bauteile }
    schnitte.set(schluessel, ergebnis)
  }
  return ergebnis
}

function schnitt(geschoss: IfcGeschoss, schnitthoehe: number): Schnitt {
  if (!api) throw new Error(t('ifc.import.keineDatei'))
  const schluessel = `${geschoss.expressId}@${schnitthoehe}`
  let ergebnis = schnitte.get(schluessel)
  if (!ergebnis) {
    const bauteile: IfcBauteil[] = []
    const linien = schneideGeschoss(api, modell, geschoss, schnitthoehe, index(), bauteile)
    ergebnis = { linien, bauteile }
    schnitte.set(schluessel, ergebnis)
  }
  return ergebnis
}

function antworte(antwort: IfcAntwort, transfer: Transferable[] = []) {
  self.postMessage(antwort, { transfer })
}

async function oeffne(daten: ArrayBuffer) {
  if (!api) {
    api = new IfcAPI()
    await api.Init((pfad) => (pfad.endsWith('.wasm') ? wasmUrl : pfad), true)
  }
  modell = api.OpenModel(new Uint8Array(daten))
  if (modell < 0) throw new Error(t('ifc.import.nichtLesbar'))
  geschosse = liesGeschosse(api, modell)
  schnitte.clear()
  hoehenIndex = null
  raumhoehen = null
  antworte({
    art: 'geoeffnet',
    geschosse: geschosse.map(({ schnittElemente: _, ...info }) => info),
    gruppen: zaehleBauteilgruppen(api, modell, geschosse),
  })
}

function importiere(auftrag: Extract<IfcAuftrag, { art: 'importieren' }>) {
  if (!api || modell < 0) throw new Error(t('ifc.import.keineDatei'))
  const gewaehlt = auftrag.geschossIds
    .map((id) => geschosse.find((g) => g.expressId === id))
    .filter((g): g is IfcGeschoss => g !== undefined)
  const freie = auftrag.freieHoehen ?? []
  const gesamt = gewaehlt.length + freie.length
  const linien: Schnitt[] = []
  for (let i = 0; i < gewaehlt.length; i++) {
    antworte({ art: 'fortschritt', erledigt: i, gesamt })
    linien.push(schnitt(gewaehlt[i], auftrag.schnitthoehe))
  }
  for (let i = 0; i < freie.length; i++) {
    antworte({ art: 'fortschritt', erledigt: gewaehlt.length + i, gesamt })
    linien.push(freierSchnitt(freie[i]))
  }
  antworte({ art: 'fortschritt', erledigt: gesamt, gesamt })
  const grundrisse = grundrisseAus(linien, { ausrichten: auftrag.ausrichten, lage: auftrag.lage })
  grundrisse.geschosse = grundrisse.geschosse.map((g, i) =>
    i < gewaehlt.length ? mitRaumhoehe(g, gewaehlt[i].expressId) : g,
  )
  antworte({ art: 'ergebnis', grundrisse })
}

function vorschau(auftrag: Extract<IfcAuftrag, { art: 'vorschau' }>) {
  let linien: Schnitt
  if ('freieHoehe' in auftrag.ziel) {
    linien = freierSchnitt(auftrag.ziel.freieHoehe)
  } else {
    const id = auftrag.ziel.geschossId
    const geschoss = geschosse.find((g) => g.expressId === id)
    if (!geschoss) throw new Error(t('ifc.import.geschossFehlt'))
    linien = schnitt(geschoss, auftrag.schnitthoehe)
  }
  const grundrisse = grundrisseAus([linien], {
    ausrichten: auftrag.ausrichten,
    lage: auftrag.lage,
  })
  antworte({ art: 'vorschau', grundrisse })
}

function nachladen(auftrag: Extract<IfcAuftrag, { art: 'nachladen' }>) {
  const ergebnis: Grundrisse['geschosse'] = []
  const gesamt = auftrag.eintraege.length
  auftrag.eintraege.forEach((eintrag, i) => {
    antworte({ art: 'fortschritt', erledigt: i, gesamt })
    let linien: Schnitt
    if ('freieHoehe' in eintrag.ziel) {
      linien = freierSchnitt(eintrag.ziel.freieHoehe)
    } else {
      const id = eintrag.ziel.geschossId
      const geschoss = geschosse.find((g) => g.expressId === id)
      if (!geschoss) throw new Error(t('ifc.import.geschossFehlt'))
      linien = schnitt(geschoss, eintrag.schnitthoehe)
    }
    const grundriss = grundrisseAus([linien], { ausrichten: false, lage: eintrag.lage })
      .geschosse[0]
    ergebnis.push(
      'geschossId' in eintrag.ziel ? mitRaumhoehe(grundriss, eintrag.ziel.geschossId) : grundriss,
    )
  })
  antworte({ art: 'fortschritt', erledigt: gesamt, gesamt })
  antworte({ art: 'nachgeladen', geschosse: ergebnis })
}

function bauteile(auftrag: Extract<IfcAuftrag, { art: 'bauteile' }>) {
  if (!api || modell < 0) throw new Error(t('ifc.import.keineDatei'))
  let hoehe: number
  if ('freieHoehe' in auftrag.ziel) {
    hoehe = auftrag.ziel.freieHoehe + hoehenVersatz(geschosse)
  } else {
    const id = auftrag.ziel.geschossId
    const geschoss = geschosse.find((g) => g.expressId === id)
    if (!geschoss) throw new Error(t('ifc.import.geschossFehlt'))
    hoehe = geschoss.basisHoehe + auftrag.schnitthoehe
  }
  antworte({ art: 'bauteile', funde: liesIfcBauteile(api, modell, hoehe, index()) })
}

function huelle(auftrag: Extract<IfcAuftrag, { art: 'huelle' }>) {
  if (!api || modell < 0) throw new Error(t('ifc.import.keineDatei'))
  const ergebnisse: IfcHuellenErgebnis[] = []
  const transfer: Transferable[] = []
  const gesamt = auftrag.eintraege.length
  auftrag.eintraege.forEach((eintrag, i) => {
    antworte({ art: 'fortschritt', erledigt: i, gesamt })
    const gleichnamig = geschosse.filter((g) => g.name === eintrag.geschossName)
    const geschoss =
      geschosse.find((g) => eintrag.geschossGuid && g.guid === eintrag.geschossGuid) ??
      (gleichnamig.length === 1 ? gleichnamig[0] : undefined)
    if (!geschoss) {
      ergebnisse.push({
        schluessel: eintrag.schluessel,
        fehler: t('ifc.import.geschossNichtImModell'),
      })
      return
    }
    const huelle = sammleHuelle(api!, modell, geschoss, auftrag.ursprung, eintrag.kote)
    ergebnisse.push({ schluessel: eintrag.schluessel, huelle })
    for (const netz of [huelle.decken, huelle.uebriges, ...huelle.waende.map((w) => w.netz)])
      transfer.push(netz.positionen.buffer, netz.indizes.buffer)
  })
  antworte({ art: 'fortschritt', erledigt: gesamt, gesamt })
  antworte({ art: 'huelle', ergebnisse }, transfer)
}

self.onmessage = (nachricht: MessageEvent<IfcAuftragMitSprache>) => {
  const auftrag = nachricht.data
  setzeOberflaechensprache(auftrag.sprache)
  const arbeit =
    auftrag.art === 'oeffnen'
      ? oeffne(auftrag.daten)
      : Promise.resolve().then(() =>
          auftrag.art === 'importieren'
            ? importiere(auftrag)
            : auftrag.art === 'nachladen'
              ? nachladen(auftrag)
              : auftrag.art === 'bauteile'
                ? bauteile(auftrag)
                : auftrag.art === 'huelle'
                  ? huelle(auftrag)
                  : vorschau(auftrag),
        )
  arbeit.catch((fehler: unknown) => {
    antworte({
      art: 'fehler',
      meldung: fehler instanceof Error ? fehler.message : t('ifc.import.fehlgeschlagen'),
    })
  })
}
