import type {
  KiAntwort,
  KiAufruf,
  ZusatzmodulEintrag,
  ZusatzmodulManifest,
} from '../../document-model'
import {
  entferneZusatzmodul,
  installiereZusatzmodul,
  ladeZusatzmodulCode,
  ladeZusatzmodule,
  ladeZusatzmodulTexte,
  meldeFehlerAnProtokoll,
  setzeZusatzmodulAktiv,
  zusatzmodulDateiUrl,
} from '../../persistence'
import { QUELLSPRACHE, t, type Sprache } from '../../sprache'
import type { CommandStack } from '../../tools'
import { useZusatzmodulStore, zusatzmodulText } from '../store/zusatzmodul-store'
import {
  ZusatzmodulWerkzeugFehler,
  type Eec,
  type EecIntern,
  type ZusatzmodulBefehle,
} from './schnittstelle'

export interface WirtServer {
  lade(): Promise<ZusatzmodulEintrag[]>
  ladeTexte(kennung: string, version: string, sprache: string): Promise<Record<string, string>>
  ladeCode(kennung: string, version: string): Promise<unknown>
  setzeAktiv(kennung: string, aktiv: boolean, fehler: string | null): Promise<unknown>
  installiere(datei: Blob): Promise<ZusatzmodulEintrag>
  entferne(kennung: string): Promise<unknown>
  dateiUrl(kennung: string, version: string, pfad: string): string
  protokolliere(nachricht: string, stack: string | undefined, kontext: string): void
}

export const SERVER_STANDARD: WirtServer = {
  lade: ladeZusatzmodule,
  ladeTexte: ladeZusatzmodulTexte,
  ladeCode: ladeZusatzmodulCode,
  setzeAktiv: setzeZusatzmodulAktiv,
  installiere: installiereZusatzmodul,
  entferne: entferneZusatzmodul,
  dateiUrl: zusatzmodulDateiUrl,
  protokolliere: (nachricht, stack, kontext) => {
    void meldeFehlerAnProtokoll({ nachricht, stack, kontext }).catch(() => {})
  },
}

export interface WirtTeile {
  commands: CommandStack
  appVersion: string
  fuehreWerkzeugAus(aufruf: KiAufruf): Promise<KiAntwort>
  intern(): EecIntern
  melde(text: string): void
  auswahl(): string[]
  oberflaechensprache(): Sprache
  plansprache(): Sprache
  server?: WirtServer
}

interface GeladenesModul {
  version: string
  befehle: ZusatzmodulBefehle
  deaktivieren?: () => void
}

function fehlerText(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler)
}

function werkzeugDaten(antwort: Extract<KiAntwort, { ok: true }>): unknown {
  const [erster] = antwort.inhalt
  if (antwort.inhalt.length === 1 && erster?.art === 'text') {
    try {
      return JSON.parse(erster.text)
    } catch {
      return erster.text
    }
  }
  return antwort.inhalt
}

export class ZusatzmodulWirt {
  private readonly teile: WirtTeile
  private readonly server: WirtServer
  private readonly geladen = new Map<string, GeladenesModul>()
  private aufrufe = 0

  constructor(teile: WirtTeile) {
    this.teile = teile
    this.server = teile.server ?? SERVER_STANDARD
  }

  async laden(): Promise<void> {
    let eintraege: ZusatzmodulEintrag[]
    try {
      eintraege = await this.server.lade()
    } catch {
      eintraege = []
    }
    const sprache = this.teile.oberflaechensprache()
    const texte: Record<string, Record<string, string>> = {}
    await Promise.all(
      eintraege.map(async (e) => {
        const { kennung, version } = e.manifest
        const quelle = await this.server.ladeTexte(kennung, version, QUELLSPRACHE)
        const eigene =
          sprache === QUELLSPRACHE ? {} : await this.server.ladeTexte(kennung, version, sprache)
        texte[kennung] = { ...quelle, ...eigene }
      }),
    )
    useZusatzmodulStore.getState().setzeBestand(eintraege, texte)
  }

  befehlTitel(manifest: ZusatzmodulManifest, befehlId: string): string {
    const befehl = manifest.befehle.find((b) => b.id === befehlId)
    const texte = useZusatzmodulStore.getState().texte[manifest.kennung]
    return befehl ? zusatzmodulText(texte, befehl.titel) : befehlId
  }

  async fuehreAus(kennung: string, befehlId: string): Promise<void> {
    const store = useZusatzmodulStore.getState()
    if (store.laufend || this.teile.commands.sammeltGerade()) {
      this.teile.melde(t('aktionen.zusatzmodule.laeuftBereits'))
      return
    }
    const eintrag = store.eintraege.find((e) => e.manifest.kennung === kennung)
    if (!eintrag?.aktiv) return
    const { manifest } = eintrag

    store.setzeLaufend({ kennung, befehlId })
    try {
      const modul = await this.aktiviere(eintrag)
      if (!modul) return
      const befehl = modul.befehle[befehlId]
      if (typeof befehl !== 'function') {
        this.teile.melde(
          t('aktionen.zusatzmodule.befehlFehlt', { name: manifest.name, befehl: befehlId }),
        )
        return
      }
      const label = `${manifest.name}: ${this.befehlTitel(manifest, befehlId)}`
      const abbruch = new AbortController()
      this.teile.commands.beginneSammlung()
      try {
        await befehl(abbruch.signal)
        this.teile.commands.beendeSammlung(label)
      } catch (fehler) {
        this.teile.commands.verwirfSammlung()
        this.teile.melde(
          t('aktionen.zusatzmodule.befehlFehler', {
            name: manifest.name,
            fehler: fehlerText(fehler),
          }),
        )
        this.protokolliere(manifest, fehler, befehlId)
      }
    } finally {
      useZusatzmodulStore.getState().setzeLaufend(null)
    }
  }

  async installiere(datei: Blob): Promise<ZusatzmodulEintrag> {
    const eintrag = await this.server.installiere(datei)
    this.entlade(eintrag.manifest.kennung)
    await this.laden()
    return eintrag
  }

  async setzeAktiv(kennung: string, aktiv: boolean): Promise<void> {
    if (!aktiv) this.entlade(kennung)
    await this.server.setzeAktiv(kennung, aktiv, null)
    await this.laden()
  }

  async entferne(kennung: string): Promise<void> {
    this.entlade(kennung)
    await this.server.entferne(kennung)
    await this.laden()
  }

  private async aktiviere(eintrag: ZusatzmodulEintrag): Promise<GeladenesModul | null> {
    const { kennung, version } = eintrag.manifest
    const vorhanden = this.geladen.get(kennung)
    if (vorhanden?.version === version) return vorhanden
    this.entlade(kennung)
    try {
      const code = (await this.server.ladeCode(kennung, version)) as {
        aktivieren?: unknown
        deaktivieren?: unknown
      }
      if (typeof code?.aktivieren !== 'function') {
        throw new Error(t('aktionen.zusatzmodule.keinAktivieren'))
      }
      const aktivieren = code.aktivieren as (eec: Eec) => unknown
      const befehle = await aktivieren(this.baueEec(eintrag.manifest))
      if (typeof befehle !== 'object' || befehle === null) {
        throw new Error(t('aktionen.zusatzmodule.keineBefehle'))
      }
      const modul: GeladenesModul = {
        version,
        befehle: befehle as ZusatzmodulBefehle,
        deaktivieren:
          typeof code.deaktivieren === 'function' ? (code.deaktivieren as () => void) : undefined,
      }
      this.geladen.set(kennung, modul)
      return modul
    } catch (fehler) {
      const text = fehlerText(fehler)
      this.protokolliere(eintrag.manifest, fehler, 'aktivieren')
      this.teile.melde(
        t('aktionen.zusatzmodule.ladefehler', { name: eintrag.manifest.name, fehler: text }),
      )
      try {
        await this.server.setzeAktiv(kennung, false, text)
      } finally {
        await this.laden()
      }
      return null
    }
  }

  private entlade(kennung: string): void {
    const modul = this.geladen.get(kennung)
    if (!modul) return
    this.geladen.delete(kennung)
    try {
      modul.deaktivieren?.()
    } catch {}
  }

  private protokolliere(manifest: ZusatzmodulManifest, fehler: unknown, stelle: string): void {
    this.server.protokolliere(
      fehlerText(fehler),
      fehler instanceof Error ? fehler.stack : undefined,
      `Zusatzmodul ${manifest.kennung} ${manifest.version} (${stelle})`,
    )
  }

  private baueEec(manifest: ZusatzmodulManifest): Eec {
    const { kennung, version } = manifest
    const teile = this.teile
    const server = this.server
    const naechsteAufrufId = () => `modul-${++this.aufrufe}`
    return {
      schnittstelle: 1,
      appVersion: teile.appVersion,
      async werkzeug<T>(name: string, eingabe: Record<string, unknown> = {}): Promise<T> {
        const antwort = await teile.fuehreWerkzeugAus({
          aufrufId: naechsteAufrufId(),
          werkzeug: name,
          eingabe,
        })
        if (!antwort.ok) throw new ZusatzmodulWerkzeugFehler(name, antwort.fehler)
        return werkzeugDaten(antwort) as T
      },
      ui: {
        meldung: (text) => teile.melde(text),
        auswahl: () => teile.auswahl(),
      },
      modul: {
        kennung,
        version,
        t: (schluessel, werte) =>
          zusatzmodulText(useZusatzmodulStore.getState().texte[kennung], schluessel, werte),
        datei: (pfad) => server.dateiUrl(kennung, version, pfad),
      },
      sprache: {
        oberflaeche: () => teile.oberflaechensprache(),
        plan: () => teile.plansprache(),
      },
      get intern() {
        return teile.intern()
      },
    }
  }
}
