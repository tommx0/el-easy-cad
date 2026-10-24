import type { Zeichnung, ZeichnungsUebersicht } from '../document-model'
import { deserialisiereZeichnung, serialisiereZeichnung } from '../document-model'
import type { ZeichnungsDateiStore } from './zeichnungs-datei-store'
import {
  istFileSystemAccessVerfuegbar,
  liesAusHandle,
  loeseDownloadAus,
  oeffneUploadDialog,
  schreibeInHandle,
  stelleSchreibrechtSicher,
  waehleOeffnenDatei,
  waehleSpeicherort,
  type ElEasyCadFileHandle,
} from './file-system-access'
import { holeDateiEintrag, holeZuletztGeoeffnet, merkeDatei } from './recent-files'
import { t } from '../sprache'

function istAbbruch(fehler: unknown): boolean {
  return fehler instanceof DOMException && fehler.name === 'AbortError'
}

export class LokalerZeichnungsDateiStore implements ZeichnungsDateiStore {
  async save(zeichnung: Zeichnung): Promise<void> {
    const eintrag = await holeDateiEintrag(zeichnung.id)
    if (eintrag?.handle) {
      await this.schreibeInDatei(zeichnung, eintrag.handle, eintrag.name)
      return
    }
    if (!istFileSystemAccessVerfuegbar() && eintrag?.name) {
      await this.speichereMitDateiname(zeichnung, eintrag.name)
      return
    }
    const ok = await this.speichernUnter(zeichnung)
    if (!ok) throw new Error(t('persistenz.zeichnungsDatei.speichernAbgebrochen'))
  }

  async load(id: string): Promise<Zeichnung> {
    const eintrag = await holeDateiEintrag(id)
    if (!eintrag?.handle) {
      throw new Error(t('persistenz.zeichnungsDatei.nichtAutomatischLadbar'))
    }
    const berechtigt = await stelleSchreibrechtSicher(eintrag.handle)
    if (!berechtigt) throw new Error(t('persistenz.zeichnungsDatei.keineLeseberechtigung'))
    const text = await liesAusHandle(eintrag.handle)
    const zeichnung = deserialisiereZeichnung(text)
    await merkeDatei({
      id: zeichnung.id,
      name: eintrag.name,
      zuletztGeoeffnet: new Date().toISOString(),
      handle: eintrag.handle,
    })
    return zeichnung
  }

  async list(): Promise<ZeichnungsUebersicht[]> {
    const eintraege = await holeZuletztGeoeffnet()
    return eintraege.map((e) => ({
      id: e.id,
      name: e.name,
      zuletztGeaendertAm: e.zuletztGeoeffnet,
    }))
  }

  async speichernUnter(zeichnung: Zeichnung): Promise<boolean> {
    if (!istFileSystemAccessVerfuegbar()) {
      throw new DateinameErforderlichError(dateinameFuer(zeichnung))
    }
    const dateiname = dateinameFuer(zeichnung)
    try {
      const handle = await waehleSpeicherort(dateiname)
      if (!handle) return false
      await schreibeInHandle(handle, serialisiereZeichnung(zeichnung))
      await merkeDatei({
        id: zeichnung.id,
        name: handle.name,
        zuletztGeoeffnet: new Date().toISOString(),
        handle,
      })
      return true
    } catch (fehler) {
      if (istAbbruch(fehler)) return false
      throw fehler
    }
  }

  async speichereMitDateiname(zeichnung: Zeichnung, dateinameRoh: string): Promise<void> {
    const dateiname = normalisiereDateiname(dateinameRoh, dateinameFuer(zeichnung))
    loeseDownloadAus(serialisiereZeichnung(zeichnung), dateiname)
    await merkeDatei({
      id: zeichnung.id,
      name: dateiname,
      zuletztGeoeffnet: new Date().toISOString(),
    })
  }

  private async schreibeInDatei(
    zeichnung: Zeichnung,
    handle: ElEasyCadFileHandle,
    name: string,
  ): Promise<void> {
    const berechtigt = await stelleSchreibrechtSicher(handle)
    if (!berechtigt) throw new Error(t('persistenz.zeichnungsDatei.keineSchreibberechtigung'))
    await schreibeInHandle(handle, serialisiereZeichnung(zeichnung))
    await merkeDatei({ id: zeichnung.id, name, zuletztGeoeffnet: new Date().toISOString(), handle })
  }

  async aktuellerDateiname(id: string): Promise<string | null> {
    const eintrag = await holeDateiEintrag(id)
    return eintrag?.name ?? null
  }

  async oeffnenDialog(): Promise<Zeichnung | null> {
    if (istFileSystemAccessVerfuegbar()) {
      try {
        const handle = await waehleOeffnenDatei()
        if (!handle) return null
        const text = await liesAusHandle(handle)
        const zeichnung = deserialisiereZeichnung(text)
        await merkeDatei({
          id: zeichnung.id,
          name: handle.name,
          zuletztGeoeffnet: new Date().toISOString(),
          handle,
        })
        return zeichnung
      } catch (fehler) {
        if (istAbbruch(fehler)) return null
        throw fehler
      }
    }
    const ergebnis = await oeffneUploadDialog()
    if (!ergebnis) return null
    const zeichnung = deserialisiereZeichnung(ergebnis.text)
    await merkeDatei({
      id: zeichnung.id,
      name: ergebnis.name,
      zuletztGeoeffnet: new Date().toISOString(),
    })
    return zeichnung
  }

  async oeffneZuletztGeoeffnet(id: string): Promise<Zeichnung> {
    return this.load(id)
  }
}

export class DateinameErforderlichError extends Error {
  readonly vorschlag: string

  constructor(vorschlag: string) {
    super(t('persistenz.zeichnungsDatei.dateinameErforderlich'))
    this.name = 'DateinameErforderlichError'
    this.vorschlag = vorschlag
  }
}

export function dateinameFuer(zeichnung: Zeichnung): string {
  const sicher =
    zeichnung.name.trim().length > 0
      ? zeichnung.name.trim()
      : t('persistenz.zeichnungsDatei.dateinameVorgabe')
  return sicher.toLowerCase().endsWith('.json') ? sicher : `${sicher}.json`
}

function normalisiereDateiname(eingabe: string, fallback: string): string {
  const getrimmt = eingabe.trim()
  const basis = getrimmt.length > 0 ? getrimmt : fallback
  return basis.toLowerCase().endsWith('.json') ? basis : `${basis}.json`
}
