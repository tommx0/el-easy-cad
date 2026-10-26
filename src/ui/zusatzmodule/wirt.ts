import {
  zusatzmodulKiWerkzeugName,
  zusatzmodulLadeVersion,
  type KiAntwort,
  type KiAufruf,
  type ZusatzmodulEintrag,
  type ZusatzmodulManifest,
} from '../../document-model'
import {
  entferneZusatzmodul,
  installiereZusatzmodul,
  ladeZusatzmodulCode,
  ladeZusatzmodule,
  ladeZusatzmodulTexte,
  leseZusatzmodulEinstellung,
  meldeFehlerAnProtokoll,
  schreibeZusatzmodulEinstellung,
  setzeZusatzmodulAktiv,
  setzeZusatzmodulKiFreigabe,
  zusatzmodulDateiUrl,
} from '../../persistence'
import { QUELLSPRACHE, t, type Sprache } from '../../sprache'
import { kiLabel, type Command, type CommandStack, type Tool } from '../../tools'
import { useZusatzmodulStore, zusatzmodulText } from '../store/zusatzmodul-store'
import {
  ZusatzmodulAbbruch,
  ZusatzmodulWerkzeugFehler,
  type Eec,
  type EecIntern,
  type ZusatzmodulBefehle,
  type ZusatzmodulBereich,
  type ZusatzmodulFeldWert,
  type ZusatzmodulFormular,
  type ZusatzmodulPanel,
  type ZusatzmodulPanelGriff,
  type ZusatzmodulPunkt,
} from './schnittstelle'

export interface WirtServer {
  lade(): Promise<ZusatzmodulEintrag[]>
  ladeTexte(kennung: string, version: string, sprache: string): Promise<Record<string, string>>
  ladeCode(kennung: string, version: string): Promise<unknown>
  setzeAktiv(kennung: string, aktiv: boolean, fehler: string | null): Promise<unknown>
  setzeKiFreigabe(kennung: string, freigabe: boolean): Promise<unknown>
  installiere(datei: Blob): Promise<ZusatzmodulEintrag>
  entferne(kennung: string, einstellungenLoeschen: boolean): Promise<unknown>
  dateiUrl(kennung: string, version: string, pfad: string): string
  leseEinstellung(kennung: string, schluessel: string): Promise<unknown>
  schreibeEinstellung(kennung: string, schluessel: string, wert: unknown): Promise<void>
  protokolliere(nachricht: string, stack: string | undefined, kontext: string): void
}

export const SERVER_STANDARD: WirtServer = {
  lade: ladeZusatzmodule,
  ladeTexte: ladeZusatzmodulTexte,
  ladeCode: ladeZusatzmodulCode,
  setzeAktiv: setzeZusatzmodulAktiv,
  setzeKiFreigabe: setzeZusatzmodulKiFreigabe,
  installiere: installiereZusatzmodul,
  entferne: entferneZusatzmodul,
  dateiUrl: zusatzmodulDateiUrl,
  leseEinstellung: leseZusatzmodulEinstellung,
  schreibeEinstellung: schreibeZusatzmodulEinstellung,
  protokolliere: (nachricht, stack, kontext) => {
    void meldeFehlerAnProtokoll({ nachricht, stack, kontext }).catch(() => {})
  },
}

export interface Warten<T> {
  ergebnis: Promise<T>
  schliesse(): void
}

export type AbfrageErgebnis =
  | { art: 'punkt'; punkt: ZusatzmodulPunkt }
  | { art: 'objekte'; ids: string[] }
  | { art: 'rechteck'; bereich: ZusatzmodulBereich }

export interface WirtTeile {
  commands: CommandStack
  appVersion: string
  fuehreWerkzeugAus(aufruf: KiAufruf): Promise<KiAntwort>
  intern(): Omit<EecIntern, 'werkzeuge'>
  melde(text: string): void
  auswahl(): string[]
  oberflaechensprache(): Sprache
  plansprache(): Sprache
  frage(text: string, optionen: { titel: string; ja?: string; nein?: string }): Warten<boolean>
  formular(
    kennung: string,
    formular: ZusatzmodulFormular,
  ): Warten<Record<string, ZusatzmodulFeldWert> | null>
  abfrage(auftrag: {
    art: 'punkt' | 'objekte' | 'rechteck'
    hinweis: string
    arten?: string[]
    einzeln?: boolean
  }): Warten<AbfrageErgebnis | null>
  zeigePanel(kennung: string, panel: ZusatzmodulPanel): ZusatzmodulPanelGriff
  registriereWerkzeug(werkzeug: Tool): void
  aktiviereWerkzeug(id: string): void
  entferneWerkzeug(id: string): void
  leseModulDaten(kennung: string, objektId: string): unknown
  modulDatenCommand(kennung: string, objektId: string, wert: unknown, label: string): Command | null
  nachBestand?(eintraege: readonly ZusatzmodulEintrag[]): void
  kiSchreibsperre?(): string | null
  meldeKiAenderung?(text: string): void
  server?: WirtServer
}

interface GeladenesModul {
  version: string
  befehle: ZusatzmodulBefehle
  deaktivieren?: () => void
}

interface Lauf {
  kennung: string
  abbruch: AbortController
  offen: Set<() => void>
  ki: { eingabe: Record<string, unknown>; meldungen: string[] } | null
}

function kiWert(
  feld: ZusatzmodulFormular['felder'][number],
  roh: unknown,
): ZusatzmodulFeldWert | undefined {
  switch (feld.art) {
    case 'zahl': {
      const zahl = typeof roh === 'string' ? Number(roh.replace(',', '.')) : roh
      return typeof zahl === 'number' && Number.isFinite(zahl) ? zahl : undefined
    }
    case 'haken':
      return typeof roh === 'boolean' ? roh : undefined
    case 'auswahl': {
      const wert = typeof roh === 'number' ? String(roh) : roh
      return typeof wert === 'string' && feld.optionen.some((o) => o.wert === wert)
        ? wert
        : undefined
    }
    default:
      return typeof roh === 'string' ? roh : roh === null ? null : undefined
  }
}

function vorgabeWert(feld: ZusatzmodulFormular['felder'][number]): ZusatzmodulFeldWert {
  switch (feld.art) {
    case 'zahl':
      return feld.wert ?? null
    case 'text':
      return feld.wert ?? ''
    case 'haken':
      return feld.wert ?? false
    case 'auswahl':
      return feld.wert ?? feld.optionen[0]?.wert ?? ''
    case 'katalog':
      return feld.wert ?? null
  }
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
  private readonly ladend = new Map<string, Promise<GeladenesModul | null>>()
  private readonly registrierungen = new Map<string, (() => void)[]>()
  private lauf: Lauf | null = null
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
        const kennung = e.manifest.kennung
        const version = zusatzmodulLadeVersion(e)
        const quelle = await this.server.ladeTexte(kennung, version, QUELLSPRACHE)
        const eigene =
          sprache === QUELLSPRACHE ? {} : await this.server.ladeTexte(kennung, version, sprache)
        texte[kennung] = { ...quelle, ...eigene }
      }),
    )
    for (const [kennung, modul] of this.geladen) {
      const eintrag = eintraege.find((e) => e.manifest.kennung === kennung)
      if (!eintrag?.aktiv || zusatzmodulLadeVersion(eintrag) !== modul.version)
        this.entlade(kennung)
    }
    useZusatzmodulStore.getState().setzeBestand(eintraege, texte)
    this.teile.nachBestand?.(eintraege)
    for (const eintrag of eintraege) {
      if (eintrag.aktiv && eintrag.manifest.beimStart) await this.aktiviere(eintrag)
    }
  }

  befehlTitel(manifest: ZusatzmodulManifest, befehlId: string): string {
    const befehl = manifest.befehle.find((b) => b.id === befehlId)
    const texte = useZusatzmodulStore.getState().texte[manifest.kennung]
    return befehl ? zusatzmodulText(texte, befehl.titel) : befehlId
  }

  laeuft(): boolean {
    return this.lauf !== null
  }

  abbrechen(): void {
    const lauf = this.lauf
    if (!lauf || lauf.abbruch.signal.aborted) return
    lauf.abbruch.abort()
    for (const schliesse of [...lauf.offen]) schliesse()
  }

  async fuehreAus(kennung: string, befehlId: string): Promise<void> {
    if (this.lauf || this.teile.commands.sammeltGerade()) {
      this.teile.melde(t('aktionen.zusatzmodule.laeuftBereits'))
      return
    }
    let eintrag = this.eintrag(kennung)
    if (eintrag?.entwicklung) {
      await this.laden()
      eintrag = this.eintrag(kennung)
    }
    if (!eintrag?.aktiv) return
    const { manifest } = eintrag
    const modul = await this.aktiviere(eintrag)
    if (!modul) return
    const befehl = modul.befehle[befehlId]
    if (typeof befehl !== 'function') {
      this.teile.melde(
        t('aktionen.zusatzmodule.befehlFehlt', { name: manifest.name, befehl: befehlId }),
      )
      return
    }
    await this.alsBefehl(manifest, this.befehlTitel(manifest, befehlId), befehlId, (signal) =>
      befehl(signal, { quelle: 'menue', eingabe: {} }),
    )
  }

  async fuehreFuerKiAus(aufruf: KiAufruf): Promise<KiAntwort> {
    const fund = useZusatzmodulStore
      .getState()
      .eintraege.filter((e) => e.aktiv && e.kiFreigabe)
      .flatMap((e) => e.manifest.befehle.map((b) => ({ eintrag: e, befehl: b })))
      .find(
        ({ eintrag, befehl }) =>
          befehl.ki &&
          zusatzmodulKiWerkzeugName(eintrag.manifest.kennung, befehl.id) === aufruf.werkzeug,
      )
    if (!fund) {
      return {
        ok: false,
        fehler: t('aktionen.zusatzmodule.kiUnbekannt', { werkzeug: aufruf.werkzeug }),
      }
    }
    const { manifest } = fund.eintrag
    if (fund.befehl.ki?.schreibt !== false) {
      const sperre = this.teile.kiSchreibsperre?.() ?? null
      if (sperre) return { ok: false, fehler: sperre }
    }
    if (this.lauf || this.teile.commands.sammeltGerade()) {
      return { ok: false, fehler: t('aktionen.zusatzmodule.laeuftBereits') }
    }
    const modul = await this.aktiviere(fund.eintrag)
    const befehl = modul?.befehle[fund.befehl.id]
    if (typeof befehl !== 'function') {
      return {
        ok: false,
        fehler: t('aktionen.zusatzmodule.befehlFehlt', {
          name: manifest.name,
          befehl: fund.befehl.id,
        }),
      }
    }
    const eingabe =
      typeof aufruf.eingabe === 'object' &&
      aufruf.eingabe !== null &&
      !Array.isArray(aufruf.eingabe)
        ? (aufruf.eingabe as Record<string, unknown>)
        : {}
    const ki = { eingabe, meldungen: [] as string[] }
    const titel = this.befehlTitel(manifest, fund.befehl.id)
    try {
      const ergebnis = await this.imLauf(
        manifest,
        titel,
        (signal) => befehl(signal, { quelle: 'ki', eingabe }),
        ki,
      )
      const label = kiLabel(`${manifest.name}: ${titel.replace(/\s*(…|\.\.\.)$/, '')}`)
      if (this.teile.commands.peekUndoLabel() === label) this.teile.meldeKiAenderung?.(label)
      return {
        ok: true,
        inhalt: [
          {
            art: 'text',
            text: JSON.stringify({
              ergebnis: ergebnis ?? null,
              meldungen: ki.meldungen,
              rueckgaengig: this.teile.commands.peekUndoLabel() === label ? label : null,
            }),
          },
        ],
      }
    } catch (fehler) {
      if (fehler instanceof ZusatzmodulAbbruch) {
        return {
          ok: false,
          fehler: t('aktionen.zusatzmodule.abgebrochen', { name: manifest.name }),
        }
      }
      this.protokolliere(manifest, fehler, `ki:${fund.befehl.id}`)
      return {
        ok: false,
        fehler: t('aktionen.zusatzmodule.befehlFehler', {
          name: manifest.name,
          fehler: fehlerText(fehler),
        }),
      }
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

  async setzeKiFreigabe(kennung: string, freigabe: boolean): Promise<void> {
    await this.server.setzeKiFreigabe(kennung, freigabe)
    await this.laden()
  }

  async entferne(kennung: string, einstellungenLoeschen = true): Promise<void> {
    this.entlade(kennung)
    await this.server.entferne(kennung, einstellungenLoeschen)
    await this.laden()
  }

  async ladeNeu(): Promise<void> {
    for (const kennung of [...this.geladen.keys()]) {
      if (this.eintrag(kennung)?.entwicklung) this.entlade(kennung)
    }
    await this.laden()
  }

  private eintrag(kennung: string): ZusatzmodulEintrag | undefined {
    return useZusatzmodulStore.getState().eintraege.find((e) => e.manifest.kennung === kennung)
  }

  private async alsBefehl(
    manifest: ZusatzmodulManifest,
    titel: string,
    stelle: string,
    aufgabe: (signal: AbortSignal) => unknown,
  ): Promise<void> {
    try {
      await this.imLauf(manifest, titel, aufgabe)
    } catch (fehler) {
      if (fehler instanceof ZusatzmodulAbbruch) {
        this.teile.melde(t('aktionen.zusatzmodule.abgebrochen', { name: manifest.name }))
        return
      }
      if (fehler instanceof LaeuftBereits) {
        this.teile.melde(t('aktionen.zusatzmodule.laeuftBereits'))
        return
      }
      this.teile.melde(
        t('aktionen.zusatzmodule.befehlFehler', {
          name: manifest.name,
          fehler: fehlerText(fehler),
        }),
      )
      this.protokolliere(manifest, fehler, stelle)
    }
  }

  private async imLauf<T>(
    manifest: ZusatzmodulManifest,
    titel: string,
    aufgabe: (signal: AbortSignal) => T | Promise<T>,
    ki: Lauf['ki'] = null,
  ): Promise<T> {
    const laufend = this.lauf
    if (laufend) {
      if (laufend.kennung !== manifest.kennung) throw new LaeuftBereits()
      this.pruefeAbbruch(manifest.kennung)
      return await aufgabe(laufend.abbruch.signal)
    }
    const lauf: Lauf = {
      kennung: manifest.kennung,
      abbruch: new AbortController(),
      offen: new Set(),
      ki,
    }
    this.lauf = lauf
    useZusatzmodulStore
      .getState()
      .setzeLaufend({ kennung: manifest.kennung, titel, fortschritt: null })
    this.teile.commands.beginneSammlung()
    try {
      const ergebnis = await aufgabe(lauf.abbruch.signal)
      if (lauf.abbruch.signal.aborted) throw new ZusatzmodulAbbruch()
      const text = `${manifest.name}: ${titel.replace(/\s*(…|\.\.\.)$/, '')}`
      this.teile.commands.beendeSammlung(ki ? kiLabel(text) : text)
      return ergebnis
    } catch (fehler) {
      this.teile.commands.verwirfSammlung()
      throw lauf.abbruch.signal.aborted ? new ZusatzmodulAbbruch() : fehler
    } finally {
      for (const schliesse of [...lauf.offen]) schliesse()
      this.lauf = null
      useZusatzmodulStore.getState().setzeLaufend(null)
    }
  }

  private pruefeAbbruch(kennung: string): void {
    const lauf = this.lauf
    if (lauf?.kennung === kennung && lauf.abbruch.signal.aborted) throw new ZusatzmodulAbbruch()
  }

  private async warte<T>(kennung: string, starte: () => Warten<T>): Promise<T> {
    this.pruefeAbbruch(kennung)
    const warten = starte()
    const lauf = this.lauf?.kennung === kennung ? this.lauf : null
    lauf?.offen.add(warten.schliesse)
    try {
      return await warten.ergebnis
    } finally {
      lauf?.offen.delete(warten.schliesse)
    }
  }

  private aktiviere(eintrag: ZusatzmodulEintrag): Promise<GeladenesModul | null> {
    const kennung = eintrag.manifest.kennung
    const version = zusatzmodulLadeVersion(eintrag)
    const vorhanden = this.geladen.get(kennung)
    if (vorhanden?.version === version) return Promise.resolve(vorhanden)
    const laeuft = this.ladend.get(kennung)
    if (laeuft) return laeuft
    const laden = this.ladeCode(eintrag, version).finally(() => this.ladend.delete(kennung))
    this.ladend.set(kennung, laden)
    return laden
  }

  private async ladeCode(
    eintrag: ZusatzmodulEintrag,
    version: string,
  ): Promise<GeladenesModul | null> {
    const { kennung } = eintrag.manifest
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
      const befehle = await aktivieren(this.baueEec(eintrag.manifest, version))
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
      this.raeumeAuf(kennung)
      const text = fehlerText(fehler)
      this.protokolliere(eintrag.manifest, fehler, 'aktivieren')
      this.teile.melde(
        t('aktionen.zusatzmodule.ladefehler', { name: eintrag.manifest.name, fehler: text }),
      )
      if (!eintrag.entwicklung) {
        try {
          await this.server.setzeAktiv(kennung, false, text)
        } finally {
          await this.laden()
        }
      }
      return null
    }
  }

  private entlade(kennung: string): void {
    const modul = this.geladen.get(kennung)
    this.geladen.delete(kennung)
    try {
      modul?.deaktivieren?.()
    } catch {}
    this.raeumeAuf(kennung)
  }

  private raeumeAuf(kennung: string): void {
    const liste = this.registrierungen.get(kennung) ?? []
    this.registrierungen.delete(kennung)
    for (const weg of liste.reverse()) {
      try {
        weg()
      } catch {}
    }
  }

  private merke(kennung: string, weg: () => void): void {
    const liste = this.registrierungen.get(kennung) ?? []
    liste.push(weg)
    this.registrierungen.set(kennung, liste)
  }

  private protokolliere(manifest: ZusatzmodulManifest, fehler: unknown, stelle: string): void {
    this.server.protokolliere(
      fehlerText(fehler),
      fehler instanceof Error ? fehler.stack : undefined,
      `Zusatzmodul ${manifest.kennung} ${manifest.version} (${stelle})`,
    )
  }

  private baueEec(manifest: ZusatzmodulManifest, ladeVersion: string): Eec {
    const { kennung, version } = manifest
    const teile = this.teile
    const server = this.server
    const wirt = {
      imLauf: this.imLauf.bind(this),
      alsBefehl: this.alsBefehl.bind(this),
      warte: this.warte.bind(this),
      pruefeAbbruch: this.pruefeAbbruch.bind(this),
      merke: this.merke.bind(this),
      ki: () => (this.lauf?.kennung === kennung ? this.lauf.ki : null),
    }
    const naechsteAufrufId = () => `modul-${++this.aufrufe}`
    const texte = () => useZusatzmodulStore.getState().texte[kennung]
    const werkzeugId = (id: string) =>
      id.startsWith(`modul.${kennung}.`) ? id : `modul.${kennung}.${id}`

    async function abfrage(auftrag: Parameters<WirtTeile['abfrage']>[0]) {
      if (wirt.ki()) return null
      return wirt.warte(kennung, () => teile.abfrage(auftrag))
    }

    return {
      schnittstelle: 1,
      appVersion: teile.appVersion,

      werkzeug<T>(name: string, eingabe: Record<string, unknown> = {}): Promise<T> {
        return wirt.imLauf(manifest, manifest.name, async () => {
          wirt.pruefeAbbruch(kennung)
          const antwort = await teile.fuehreWerkzeugAus({
            aufrufId: naechsteAufrufId(),
            werkzeug: name,
            eingabe,
          })
          if (!antwort.ok) throw new ZusatzmodulWerkzeugFehler(name, antwort.fehler)
          return werkzeugDaten(antwort) as T
        })
      },

      ausfuehren: (titel, aufgabe) =>
        wirt.alsBefehl(manifest, titel, titel, (signal) =>
          aufgabe(signal, { quelle: 'panel', eingabe: {} }),
        ),

      ui: {
        meldung(text) {
          wirt.ki()?.meldungen.push(text)
          teile.melde(text)
        },
        auswahl: () => teile.auswahl(),
        frage: async (text, optionen = {}) =>
          wirt.ki()
            ? false
            : wirt.warte(kennung, () => teile.frage(text, { titel: manifest.name, ...optionen })),
        async formular(formular) {
          const schluessel = formular.merken ? `formular:${formular.merken}` : null
          const gemerkt = schluessel
            ? ((await server.leseEinstellung(kennung, schluessel).catch(() => null)) as Record<
                string,
                ZusatzmodulFeldWert
              > | null)
            : null
          const vorbelegt: ZusatzmodulFormular = gemerkt
            ? {
                ...formular,
                felder: formular.felder.map((f) =>
                  f.id in gemerkt ? ({ ...f, wert: gemerkt[f.id] } as typeof f) : f,
                ),
              }
            : formular
          const ki = wirt.ki()
          if (ki) {
            const werte: Record<string, ZusatzmodulFeldWert> = {}
            for (const feld of vorbelegt.felder) {
              const ausKi = feld.id in ki.eingabe ? kiWert(feld, ki.eingabe[feld.id]) : undefined
              werte[feld.id] = ausKi !== undefined ? ausKi : vorgabeWert(feld)
              const leer = werte[feld.id] === null || werte[feld.id] === ''
              if (leer && (feld.art === 'katalog' || feld.art === 'zahl') && !feld.leerErlaubt) {
                throw new Error(t('aktionen.zusatzmodule.kiEingabeFehlt', { feld: feld.id }))
              }
            }
            return werte
          }
          const werte = await wirt.warte(kennung, () => teile.formular(kennung, vorbelegt))
          if (werte && schluessel) {
            await server.schreibeEinstellung(kennung, schluessel, werte).catch(() => {})
          }
          return werte
        },
        fortschritt(anteil, text) {
          const store = useZusatzmodulStore.getState()
          if (store.laufend?.kennung !== kennung) return
          store.setzeLaufend({
            ...store.laufend,
            fortschritt: {
              anteil: anteil === null ? null : Math.min(1, Math.max(0, anteil)),
              text: text ?? null,
            },
          })
        },
        async punktWaehlen(hinweis) {
          const e = await abfrage({ art: 'punkt', hinweis })
          return e?.art === 'punkt' ? e.punkt : null
        },
        async objekteWaehlen(hinweis, optionen = {}) {
          const e = await abfrage({ art: 'objekte', hinweis, ...optionen })
          return e?.art === 'objekte' ? e.ids : null
        },
        async rechteckWaehlen(hinweis) {
          const e = await abfrage({ art: 'rechteck', hinweis })
          return e?.art === 'rechteck' ? e.bereich : null
        },
        panel(panel) {
          const griff = teile.zeigePanel(kennung, panel)
          wirt.merke(kennung, () => griff.entferne())
          return griff
        },
      },

      modul: {
        kennung,
        version,
        t: (schluessel, werte) => zusatzmodulText(texte(), schluessel, werte),
        datei: (pfad) => server.dateiUrl(kennung, ladeVersion, pfad),
        einstellungen: {
          lesen: async <T>(schluessel: string) =>
            ((await server.leseEinstellung(kennung, schluessel)) as T | null) ?? null,
          schreiben: (schluessel, wert) => server.schreibeEinstellung(kennung, schluessel, wert),
        },
      },

      modulDaten: {
        lesen: <T>(objektId: string) => teile.leseModulDaten(kennung, objektId) as T | undefined,
        schreiben(objektId, wert) {
          wirt.pruefeAbbruch(kennung)
          const command = teile.modulDatenCommand(kennung, objektId, wert, manifest.name)
          if (!command) throw new Error(t('aktionen.zusatzmodule.objektFehlt', { id: objektId }))
          teile.commands.execute(command)
        },
      },

      sprache: {
        oberflaeche: () => teile.oberflaechensprache(),
        plan: () => teile.plansprache(),
      },

      get intern(): EecIntern {
        return {
          ...teile.intern(),
          werkzeuge: {
            registriere(werkzeug) {
              const id = werkzeugId(werkzeug.id)
              Object.defineProperty(werkzeug, 'id', { value: id, configurable: true })
              teile.registriereWerkzeug(werkzeug)
              wirt.merke(kennung, () => teile.entferneWerkzeug(id))
              return id
            },
            aktiviere: (id) => teile.aktiviereWerkzeug(werkzeugId(id)),
            entferne: (id) => teile.entferneWerkzeug(werkzeugId(id)),
          },
        }
      },
    }
  }
}

class LaeuftBereits extends Error {}
