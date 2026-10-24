import type {
  DocumentStore,
  DokumentMeta,
  DokumentTyp,
  Zeichnung,
  Zeichnungsart,
} from '../document-model'
import {
  deserialisiereZeichnung,
  erzeugeZeichnung,
  FORMAT_VERSION,
  serialisiereZeichnung,
} from '../document-model'
import { oberflaechensprache, t } from '../sprache'
import type { Sprache } from '../sprache'
import type { CommandStack } from '../tools'
import type { DokumentStorePersistenz, GeleseneZeichnung, ProjektStore } from '../persistence'
import { ProjektZeichnungenLeser, ServerFehler, ServerNichtErreichbar } from '../persistence'

export interface OffenesDokument {
  projektId: string
  dokumentId: string
  typ: DokumentTyp
  name: string
  projektBezeichnung: string
  kunde: string
  version: number
}

export type SpeicherZustand =
  | { art: 'ruht' }
  | { art: 'schreibt' }
  | { art: 'gespeichert'; um: string }
  | { art: 'fehler'; nachricht: string }
  | { art: 'konflikt'; nachricht: string }

export const SPEICHER_VERZOEGERUNG_MS = 1000

const EINFACHE_FORMAT_VERSION = 1

type Beobachter = () => void

export class DokumentSitzung {
  private readonly doc: DocumentStore
  private readonly commands: CommandStack
  private readonly dokumente: DokumentStorePersistenz
  private readonly projekte: ProjektStore

  private offen: OffenesDokument | null = null
  private notizText = ''
  private pdfAssetId: string | null = null
  private zustand: SpeicherZustand = { art: 'ruht' }
  private timer: ReturnType<typeof setTimeout> | null = null
  private aktiv = false
  private beobachter = new Set<Beobachter>()

  constructor(
    doc: DocumentStore,
    commands: CommandStack,
    dokumente: DokumentStorePersistenz,
    projekte: ProjektStore,
  ) {
    this.doc = doc
    this.commands = commands
    this.dokumente = dokumente
    this.projekte = projekte
    this.doc.subscribe(() => this.planeSpeichern())
  }

  getOffenesDokument(): OffenesDokument | null {
    return this.offen
  }

  getZustand(): SpeicherZustand {
    return this.zustand
  }

  getNotizText(): string {
    return this.notizText
  }

  setzeNotizText(text: string) {
    if (this.offen?.typ !== 'notiz') return
    this.notizText = text
    this.melde()
    this.planeSpeichern()
  }

  getPdfAssetId(): string | null {
    return this.pdfAssetId
  }

  subscribe = (beobachter: Beobachter): (() => void) => {
    this.beobachter.add(beobachter)
    return () => {
      this.beobachter.delete(beobachter)
    }
  }

  private melde() {
    for (const b of this.beobachter) b()
  }

  private setzeZustand(zustand: SpeicherZustand) {
    this.zustand = zustand
    this.melde()
  }

  async oeffne(
    dokumentId: string,
    neueZeichnungsart?: Zeichnungsart,
    neuePlansprache: Sprache = oberflaechensprache(),
  ): Promise<void> {
    await this.speichereJetzt()

    const dokument = await this.dokumente.hole(dokumentId)
    if (!dokument) throw new Error(t('verwaltungsdialoge.dokumentSitzung.dokumentFehlt'))
    const projekt = await this.projekte.hole(dokument.projektId)

    this.aktiv = false
    this.notizText = ''
    this.pdfAssetId = null

    if (dokument.typ === 'zeichnung') {
      const zeichnung = dokument.inhalt.inhalt
        ? deserialisiereZeichnung(dokument.inhalt.inhalt)
        : erzeugeZeichnung(dokument.name, neueZeichnungsart, neuePlansprache)
      this.doc.ersetzeZeichnung(zeichnung)
      this.commands.clear()
    } else if (dokument.typ === 'notiz') {
      this.notizText = dokument.inhalt.inhalt ?? ''
    } else {
      this.pdfAssetId = dokument.inhalt.assetId
    }

    this.offen = {
      projektId: dokument.projektId,
      dokumentId: dokument.id,
      typ: dokument.typ,
      name: dokument.name,
      projektBezeichnung: projekt?.bezeichnung ?? '',
      kunde: projekt?.kunde ?? '',
      version: dokument.inhalt.version,
    }
    this.aktiv = true
    this.setzeZustand({ art: 'ruht' })
    if (dokument.typ === 'zeichnung' && !dokument.inhalt.inhalt && neueZeichnungsart) {
      await this.speichereJetzt()
    }
  }

  async legeZeichnungAn(projektId: string, zeichnung: Zeichnung): Promise<DokumentMeta> {
    const dokument = await this.dokumente.lege(projektId, {
      typ: 'zeichnung',
      name: zeichnung.name || t('verwaltungsdialoge.projekte.dokumentTyp.zeichnung'),
    })
    await this.dokumente.speichereInhalt(dokument.id, {
      formatVersion: FORMAT_VERSION,
      version: 0,
      inhalt: serialisiereZeichnung(zeichnung),
      assetId: null,
    })
    return dokument
  }

  async verteilerQuellen(
    projektId: string,
  ): Promise<{ bauplaene: GeleseneZeichnung[]; planKennzeichen: string[] }> {
    const leser = new ProjektZeichnungenLeser(this.dokumente)
    const offen = this.offen?.projektId === projektId ? this.offen : null
    const bauplaene = await leser.liesZeichnungen(projektId, {
      art: 'bauplan',
      ohneDokumentId: offen?.dokumentId,
    })
    const aktuell = this.doc.getZeichnung()
    if (offen?.typ === 'zeichnung' && aktuell.zeichnungsart === 'bauplan') {
      const dokument = (await this.dokumente.liste(projektId)).find(
        (d) => d.id === offen.dokumentId,
      )
      if (dokument) bauplaene.unshift({ dokument, zeichnung: aktuell })
    }
    const planKennzeichen = await leser.verteilerKennzeichen(projektId)
    return { bauplaene, planKennzeichen }
  }

  async schaltplaene(projektId: string): Promise<DokumentMeta[]> {
    const liste = await this.dokumente.liste(projektId)
    return liste.filter(
      (d) =>
        d.typ === 'zeichnung' &&
        d.zeichnungsart === 'schaltplan' &&
        d.id !== this.offen?.dokumentId,
    )
  }

  async ordneVerteilerplanZu(dokumentId: string, kennzeichen: string): Promise<void> {
    const dokument = await this.dokumente.hole(dokumentId)
    if (!dokument || dokument.typ !== 'zeichnung' || !dokument.inhalt.inhalt) {
      throw new Error(t('verwaltungsdialoge.dokumentSitzung.schaltplanFehlt'))
    }
    const zeichnung = deserialisiereZeichnung(dokument.inhalt.inhalt)
    if (zeichnung.zeichnungsart !== 'schaltplan') {
      throw new Error(
        t('verwaltungsdialoge.dokumentSitzung.keinSchaltplan', { name: dokument.name }),
      )
    }
    await this.dokumente.speichereInhalt(dokumentId, {
      formatVersion: FORMAT_VERSION,
      version: dokument.inhalt.version,
      inhalt: serialisiereZeichnung({ ...zeichnung, verteilerKennzeichen: kennzeichen }),
      assetId: null,
    })
  }

  async ersetzeVerteilerplan(dokumentId: string, zeichnung: Zeichnung): Promise<void> {
    const dokument = await this.dokumente.hole(dokumentId)
    if (!dokument || dokument.typ !== 'zeichnung' || !dokument.inhalt.inhalt) {
      throw new Error(t('verwaltungsdialoge.dokumentSitzung.verteilerplanFehlt'))
    }
    const alt = deserialisiereZeichnung(dokument.inhalt.inhalt)
    if (alt.zeichnungsart !== 'schaltplan') {
      throw new Error(
        t('verwaltungsdialoge.dokumentSitzung.keinSchaltplan', { name: dokument.name }),
      )
    }
    await this.dokumente.speichereInhalt(dokumentId, {
      formatVersion: FORMAT_VERSION,
      version: dokument.inhalt.version,
      inhalt: serialisiereZeichnung({
        ...zeichnung,
        verteilerKennzeichen: alt.verteilerKennzeichen ?? zeichnung.verteilerKennzeichen,
      }),
      assetId: null,
    })
  }

  benenneUm(name: string) {
    if (!this.offen) return
    this.offen = { ...this.offen, name }
    this.melde()
  }

  schliesse() {
    this.abbrechenGeplantes()
    this.aktiv = false
    this.offen = null
    this.notizText = ''
    this.pdfAssetId = null
    this.doc.ersetzeZeichnung(erzeugeZeichnung())
    this.commands.clear()
    this.setzeZustand({ art: 'ruht' })
  }

  private abbrechenGeplantes() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  planeSpeichern() {
    if (!this.aktiv || !this.offen) return
    if (this.zustand.art === 'konflikt') return
    this.abbrechenGeplantes()
    this.timer = setTimeout(() => void this.speichereJetzt(), SPEICHER_VERZOEGERUNG_MS)
  }

  async speichereJetzt(erzwingen = false): Promise<void> {
    this.abbrechenGeplantes()
    if (!this.aktiv || !this.offen) return
    if (this.zustand.art === 'konflikt' && !erzwingen) return

    const offen = this.offen
    const version = erzwingen ? await this.holeAktuelleVersion(offen.dokumentId) : offen.version
    const zuSchreiben =
      offen.typ === 'zeichnung'
        ? {
            formatVersion: FORMAT_VERSION,
            inhalt: serialisiereZeichnung(this.doc.getZeichnung()),
            assetId: null,
          }
        : offen.typ === 'notiz'
          ? { formatVersion: EINFACHE_FORMAT_VERSION, inhalt: this.notizText, assetId: null }
          : { formatVersion: EINFACHE_FORMAT_VERSION, inhalt: null, assetId: this.pdfAssetId }

    this.setzeZustand({ art: 'schreibt' })
    try {
      const ergebnis = await this.dokumente.speichereInhalt(offen.dokumentId, {
        ...zuSchreiben,
        version,
      })
      this.offen = { ...offen, version: ergebnis.version }
      this.setzeZustand({ art: 'gespeichert', um: new Date().toISOString() })
    } catch (fehler) {
      if (fehler instanceof ServerFehler && fehler.istKonflikt) {
        this.setzeZustand({
          art: 'konflikt',
          nachricht: t('verwaltungsdialoge.dokumentSitzung.konflikt'),
        })
        return
      }
      if (fehler instanceof ServerNichtErreichbar) {
        this.setzeZustand({
          art: 'fehler',
          nachricht: t('verwaltungsdialoge.dokumentSitzung.serverNichtErreichbar'),
        })
        return
      }
      this.setzeZustand({
        art: 'fehler',
        nachricht:
          fehler instanceof Error
            ? fehler.message
            : t('verwaltungsdialoge.dokumentSitzung.speichernFehlgeschlagen'),
      })
    }
  }

  private async holeAktuelleVersion(dokumentId: string): Promise<number> {
    const dokument = await this.dokumente.hole(dokumentId)
    return dokument?.inhalt.version ?? 0
  }
}
