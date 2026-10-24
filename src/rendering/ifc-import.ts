import type { HintergrundIfc, IfcBauteilGruppe, IfcLage, Point } from '../document-model'
import type { Grundrisse, IfcBauteilfunde, IfcGruppenAnzahl } from '../ifc'
import { oberflaechensprache, t } from '../sprache'
import type { AssetHochladen } from './background-import'
import type {
  IfcAntwort,
  IfcAuftrag,
  IfcAuftragMitSprache,
  IfcGeschossInfo,
  IfcHuellenAuftrag,
  IfcHuellenErgebnis,
  IfcNachladeAuftrag,
} from './ifc-import.worker'

export type {
  IfcGeschossInfo,
  IfcHuellenAuftrag,
  IfcHuellenErgebnis,
  IfcNachladeAuftrag,
} from './ifc-import.worker'

export const IFC_GROESSE_MAX = 80 * 1024 * 1024

export const IFC_SCHNITTHOEHE_VORGABE = 1

export interface IfcImportSitzung {
  dateiname: string
  groesse: number
  assetId: string
  geschosse: IfcGeschossInfo[]
  gruppen: IfcGruppenAnzahl[]
  importiere(
    optionen: {
      geschossIds: number[]
      freieHoehen?: number[]
      schnitthoehe: number
      ausrichten: boolean
      lage?: IfcLage
    },
    onFortschritt: (erledigt: number, gesamt: number) => void,
  ): Promise<Grundrisse>
  vorschau(optionen: {
    ziel: { geschossId: number } | { freieHoehe: number }
    schnitthoehe: number
    ausrichten: boolean
    lage?: IfcLage
  }): Promise<Grundrisse>
  nachlade(
    eintraege: IfcNachladeAuftrag[],
    onFortschritt: (erledigt: number, gesamt: number) => void,
  ): Promise<Grundrisse['geschosse']>
  bauteile(optionen: {
    ziel: { geschossId: number } | { freieHoehe: number }
    schnitthoehe: number
  }): Promise<IfcBauteilfunde>
  huelle(
    eintraege: IfcHuellenAuftrag[],
    ursprung: Point,
    onFortschritt: (erledigt: number, gesamt: number) => void,
  ): Promise<IfcHuellenErgebnis[]>
  schliesse(): void
}

export function pruefeIfcGroesse(datei: { size: number }): void {
  if (datei.size > IFC_GROESSE_MAX) {
    const mb = Math.round(datei.size / (1024 * 1024))
    throw new Error(t('ifc.import.zuGross', { mb, max: IFC_GROESSE_MAX / (1024 * 1024) }))
  }
}

export async function oeffneIfcFuerImport(
  datei: File,
  ladeHoch: AssetHochladen,
): Promise<IfcImportSitzung> {
  pruefeIfcGroesse(datei)
  return starteIfcSitzung(datei, datei.name, ladeHoch(datei, datei.name))
}

export function oeffneGespeicherteIfc(
  daten: Blob,
  dateiname: string,
  assetId: string,
): Promise<IfcImportSitzung> {
  return starteIfcSitzung(daten, dateiname, Promise.resolve(assetId))
}

async function starteIfcSitzung(
  datei: Blob,
  dateiname: string,
  assetIdVersprechen: Promise<string>,
): Promise<IfcImportSitzung> {
  const worker = new Worker(new URL('./ifc-import.worker.ts', import.meta.url), {
    type: 'module',
  })
  let empfaenger: ((antwort: IfcAntwort) => void) | null = null
  let warteschlange: Promise<unknown> = Promise.resolve()
  let geschlossen = false
  const ablehnenBeiFehler: ((fehler: Error) => void)[] = []
  worker.onmessage = (nachricht: MessageEvent<IfcAntwort>) => empfaenger?.(nachricht.data)
  worker.onerror = (ereignis) => {
    const fehler = new Error(ereignis.message || t('ifc.import.abgebrochen'))
    for (const ablehnen of ablehnenBeiFehler.splice(0)) ablehnen(fehler)
  }

  function sende<T>(
    auftrag: IfcAuftrag,
    transfer: Transferable[],
    behandle: (antwort: IfcAntwort, fertig: (wert: T) => void) => void,
  ): Promise<T> {
    const lauf = warteschlange.then(() => sendeJetzt(auftrag, transfer, behandle))
    warteschlange = lauf.catch(() => undefined)
    return lauf
  }

  function sendeJetzt<T>(
    auftrag: IfcAuftrag,
    transfer: Transferable[],
    behandle: (antwort: IfcAntwort, fertig: (wert: T) => void) => void,
  ): Promise<T> {
    return new Promise<T>((aufloesen, ablehnen) => {
      if (geschlossen) {
        ablehnen(new Error(t('ifc.import.abgebrochen')))
        return
      }
      ablehnenBeiFehler.push(ablehnen)
      empfaenger = (antwort) => {
        if (antwort.art === 'fehler') {
          empfaenger = null
          ablehnen(new Error(antwort.meldung))
          return
        }
        behandle(antwort, (wert) => {
          empfaenger = null
          aufloesen(wert)
        })
      }
      const mitSprache: IfcAuftragMitSprache = { ...auftrag, sprache: oberflaechensprache() }
      worker.postMessage(mitSprache, transfer)
    })
  }

  const schliesse = () => {
    if (geschlossen) return
    geschlossen = true
    worker.terminate()
    for (const ablehnen of ablehnenBeiFehler.splice(0)) {
      ablehnen(new Error(t('ifc.import.abgebrochen')))
    }
  }

  try {
    const [{ geschosse, gruppen }, assetId] = await Promise.all([
      datei.arrayBuffer().then((daten) =>
        sende<{ geschosse: IfcGeschossInfo[]; gruppen: IfcGruppenAnzahl[] }>(
          { art: 'oeffnen', daten },
          [daten],
          (antwort, fertig) => {
            if (antwort.art === 'geoeffnet') {
              fertig({ geschosse: antwort.geschosse, gruppen: antwort.gruppen })
            }
          },
        ),
      ),
      assetIdVersprechen,
    ])
    return {
      dateiname,
      groesse: datei.size,
      assetId,
      geschosse,
      gruppen,
      importiere: (optionen, onFortschritt) =>
        sende<Grundrisse>({ art: 'importieren', ...optionen }, [], (antwort, fertig) => {
          if (antwort.art === 'fortschritt') onFortschritt(antwort.erledigt, antwort.gesamt)
          else if (antwort.art === 'ergebnis') fertig(antwort.grundrisse)
        }),
      nachlade: (eintraege, onFortschritt) =>
        sende<Grundrisse['geschosse']>({ art: 'nachladen', eintraege }, [], (antwort, fertig) => {
          if (antwort.art === 'fortschritt') onFortschritt(antwort.erledigt, antwort.gesamt)
          else if (antwort.art === 'nachgeladen') fertig(antwort.geschosse)
        }),
      vorschau: (optionen) =>
        sende<Grundrisse>({ art: 'vorschau', ...optionen }, [], (antwort, fertig) => {
          if (antwort.art === 'vorschau') fertig(antwort.grundrisse)
        }),
      huelle: (eintraege, ursprung, onFortschritt) =>
        sende<IfcHuellenErgebnis[]>(
          { art: 'huelle', eintraege, ursprung },
          [],
          (antwort, fertig) => {
            if (antwort.art === 'fortschritt') onFortschritt(antwort.erledigt, antwort.gesamt)
            else if (antwort.art === 'huelle') fertig(antwort.ergebnisse)
          },
        ),
      bauteile: (optionen) =>
        sende<IfcBauteilfunde>({ art: 'bauteile', ...optionen }, [], (antwort, fertig) => {
          if (antwort.art === 'bauteile') fertig(antwort.funde)
        }),
      schliesse,
    }
  } catch (fehler) {
    schliesse()
    throw fehler
  }
}

export function baueHintergrundIfc(
  sitzung: Pick<IfcImportSitzung, 'dateiname' | 'assetId'>,
  grundrisse: Grundrisse,
  index: number,
  schnitthoehe: number,
  freieHoehe?: number,
  ausgeblendeteGruppen: readonly IfcBauteilGruppe[] = [],
): HintergrundIfc {
  const geschoss = grundrisse.geschosse[index]
  return {
    typ: 'ifc',
    dateiname: sitzung.dateiname,
    assetId: sitzung.assetId,
    datenUrl: null,
    schnitthoehe: freieHoehe === undefined ? schnitthoehe : 0,
    ...(freieHoehe === undefined ? {} : { freieHoehe }),
    lage: grundrisse.lage,
    entities: geschoss.entities,
    breiteRoh: Math.max(geschoss.huelle?.max.x ?? 0, 1),
    hoeheRoh: Math.max(geschoss.huelle?.max.y ?? 0, 1),
    ausblendungen: [],
    ...(geschoss.bauteile ? { bauteile: geschoss.bauteile } : {}),
    ...(ausgeblendeteGruppen.length > 0 ? { ausgeblendeteGruppen: [...ausgeblendeteGruppen] } : {}),
  }
}
