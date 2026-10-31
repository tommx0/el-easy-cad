import type { AppKontext } from './app-context'
import { oberflaechensprache, t } from '../sprache'
import { useUiStore } from './store/ui-store'
import { useSettingsStore } from './store/settings-store'
import { leitungsverlegungAusFuer } from './leitungsverlegung'
import { useKabeltypStore } from './store/kabeltyp-store'
import { gleicheKabeltypenAb } from './kabeltyp-abgleich'
import { gleicheInstallationszonenAb } from './installationszonen-abgleich'
import { useInstallationszonenStore } from './store/installationszonen-store'
import { useKatalogStore } from './store/katalog-store'
import {
  AUSRICHTEN_OPTIONEN,
  berechneAusrichtung,
  berechneVerteilungGrid,
  berechneVerteilungHorizontal,
  berechneVerteilungVertikal,
  ermittleGridStandardwerte,
  erzeugeGruppeAusAuswahlBildenCommand,
  erzeugeKlemmenleisteNummerierenCommand,
  erzeugeKomponentenTauschenCommand,
  erzeugeObjektAendernCommand,
  erzeugeObjekteEntfernenCommand,
  erzeugeSchachtLoesenCommand,
  erzeugeSwitchPortZuweisenCommand,
  erzeugeTrunkLoeschenCommand,
  frageLoeschung,
  erzeugeTrunkTrennenCommand,
  erzeugeTrunkMergeCommand,
  erzeugeTrunkVerbindenCommand,
  erzeugeVerschiebungMitRerouteCommand,
  erzeugeVerteilerZuweisenCommand,
  erzeugeWandAenderungCommand,
  kleinsterClusterAbstand,
} from '../tools'
import type {
  Installationszone,
  Kabeltyp,
  Teilstueck,
  KomponentenObjekt,
  KomponentenTyp,
  LeitungsObjekt,
  LeitungsbaumObjekt,
  Objekt,
  Point,
  SchaltverbindungObjekt,
  TrunkObjekt,
} from '../document-model'
import {
  dreheElemente,
  dreheKombinationen,
  ermittleLeitungsVerknuepfung,
  istKlemme,
  leitungsVerknuepfungsHinweis,
  nachbarImPlatz,
  verschiebePlatz,
  ermittleGemeinsamenTyp,
  gruppenVorgabe,
  istBearbeitbar,
  mitTeilstueckZonen,
  teilstueckZone,
  ermittleSwitchesAnKette,
  ermittleTypUndSlots,
  ermittleVerteilerAnKette,
  ermittleVerteilerZuweisungen,
  alleVerteiler,
  getBoundingBox,
  verteilerAmEnde,
  verteilerKennzeichenText,
  findeStrang,
  moeglicheFortsetzungen,
  nullpunktVon,
  pruefeStrangAnschluss,
  sortiereKabeltypen,
  strangName,
  strangTitel,
} from '../document-model'
import { fuerLeitung, routingHindernisse } from '../routing'
import { anordnenUmfang, starteAutomatischAnordnen } from './automatisch-anordnen'
import { zonenAnzeige, zonenAuswahl, zonenText } from './installationszonen'
import { gruppiereKabeltypenAnzeige } from './kabeltyp-anzeige'
import {
  NUR_IN_BAUTEILEN_WERTE,
  nurInBauteilenText,
  setzeNurInBauteilen,
  verlegeLeitungenNeuBefehl,
} from './nur-in-bauteilen'
import {
  LEITUNG_GRIFF_TOLERANZ_PX,
  findeLeitungsGriff,
  vorschauSegmentVerschieben,
  vorschauWegpunktEntfernen,
} from '../tools/leitung-editing'
import {
  type AusfuehrungsWahl,
  gleicheKetteAn,
  klaereAusfuehrung,
} from '../tools/trunk-ausfuehrung'

export interface KontextMenuEintrag {
  id: string
  label: string
  deaktiviert?: boolean
  hinweis?: string
  ausfuehren?: () => void
  untermenue?: KontextMenuEintrag[]
  gewaehlt?: boolean
}

export type KontextMenuAnlass =
  | { art: 'leer' }
  | { art: 'leitung'; objektId: string; weltPunkt?: Point }
  | { art: 'trunk'; objektId: string; weltPunkt?: Point }
  | { art: 'trunk-ende'; objektId: string; endeIndex: 0 | 1 }
  | { art: 'leitungsbaum'; objektId: string }
  | { art: 'mehrfachauswahl'; auswahlIds: readonly string[] }
  | { art: 'bauteil'; objektId: string }
  | { art: 'schaltverbindung'; objektId: string }
  | { art: 'kabelschacht'; objektId: string }
  | { art: 'teilstuecke' }
  | { art: 'klemme'; objektId: string }

export type KontextMenuUmgebung = Pick<
  AppKontext,
  'doc' | 'commands' | 'view' | 'toolContext' | 'toolManager' | 'fuegeEin' | 'hatKlemmbrettInhalt'
> &
  Partial<Pick<AppKontext, 'verknuepfung' | 'oeffneDokument'>>

interface Optionen {
  mitLoeschen?: boolean
}

const LEITUNGS_ANLAESSE: ReadonlySet<KontextMenuAnlass['art']> = new Set([
  'leitung',
  'trunk',
  'trunk-ende',
  'leitungsbaum',
  'kabelschacht',
  'teilstuecke',
])

const LEITUNGS_EINTRAEGE: ReadonlySet<string> = new Set([
  'leitungen-neu-verlegen',
  'gruppe-wirkverbindung',
  'verteiler-ueber-trunk',
  'kabeltyp',
  'installationszone',
  'nur-in-bauteilen',
  'teilstuecke-waehlen',
  'switchport',
  'switchport-loesen',
  'inhalt-anzeigen',
  'baum-trunks',
])
const LEITUNGS_EINTRAG_ANFAENGE = ['schacht-loesen', 'fortsetzen-', 'verteiler-']

function istLeitungsEintrag(id: string): boolean {
  return LEITUNGS_EINTRAEGE.has(id) || LEITUNGS_EINTRAG_ANFAENGE.some((a) => id.startsWith(a))
}

export function ermittleKontextMenuEintraege(
  anlass: KontextMenuAnlass,
  umgebung: KontextMenuUmgebung,
  optionen: Optionen = {},
): KontextMenuEintrag[] {
  const aus = leitungsverlegungAusFuer(umgebung.doc.getZeichnung())
  if (aus && LEITUNGS_ANLAESSE.has(anlass.art)) return []
  const ohneAbgaenge = !useSettingsStore.getState().leitungsverlegung
  const eintraege = ermittleEintraegeFuerAnlass(anlass, umgebung, optionen)
  if (!aus && !ohneAbgaenge) return eintraege
  return eintraege.filter(
    (e) => !(aus && istLeitungsEintrag(e.id)) && !(ohneAbgaenge && e.id.startsWith('abgaenge-')),
  )
}

function ermittleEintraegeFuerAnlass(
  anlass: KontextMenuAnlass,
  umgebung: KontextMenuUmgebung,
  { mitLoeschen = true }: Optionen,
): KontextMenuEintrag[] {
  const blattId = umgebung.toolContext.aktivesBlattId()
  const objekte = umgebung.doc.getBlatt(blattId)?.objekte ?? []
  const eintraege = (() => {
    switch (anlass.art) {
      case 'leer':
        return leerEintraege(umgebung)
      case 'leitung': {
        const leitung = objekte.find(
          (o): o is LeitungsObjekt => o.type === 'leitung' && o.id === anlass.objektId,
        )
        return leitung ? leitungEintraege(leitung, anlass.weltPunkt, blattId, umgebung) : []
      }
      case 'trunk': {
        const trunk = objekte.find(
          (o): o is TrunkObjekt => o.type === 'trunk' && o.id === anlass.objektId,
        )
        return trunk ? trunkEintraege(trunk, anlass.weltPunkt, blattId, umgebung) : []
      }
      case 'trunk-ende': {
        const trunk = objekte.find(
          (o): o is TrunkObjekt => o.type === 'trunk' && o.id === anlass.objektId,
        )
        return trunk ? trunkEndeEintraege(trunk, anlass.endeIndex, blattId, umgebung) : []
      }
      case 'leitungsbaum': {
        const baum = objekte.find(
          (o): o is LeitungsbaumObjekt => o.type === 'leitungsbaum' && o.id === anlass.objektId,
        )
        return baum ? leitungsbaumEintraege(baum, blattId, umgebung) : []
      }
      case 'mehrfachauswahl':
        return mehrfachauswahlEintraege(anlass.auswahlIds, blattId, umgebung)
      case 'klemme': {
        const objekt = objekte.find((o) => o.id === anlass.objektId)
        if (objekt?.type !== 'komponente') return []
        return [
          klemmenleisteNummerierenEintrag(objekt, umgebung),
          austauschenEintrag([objekt], blattId, umgebung),
          {
            id: 'loeschen',
            label: t('aktionen.kontextmenu.loeschen'),
            ausfuehren: () => {
              umgebung.commands.execute(
                erzeugeObjekteEntfernenCommand(
                  umgebung.doc,
                  blattId,
                  [objekt.id],
                  t('aktionen.kontextmenu.loeschen'),
                ),
              )
              useUiStore.getState().setAuswahlIds([])
            },
          },
        ]
      }
      case 'teilstuecke':
        return ermittleTeilstueckAktionen(useUiStore.getState().teilstueckAuswahl, umgebung)
      case 'schaltverbindung':
        return [
          automatischAnordnenEintrag([anlass.objektId], blattId, umgebung),
          blattverweisEintrag(blattId, [anlass.objektId], umgebung),
          {
            id: 'loeschen',
            label: t('aktionen.kontextmenu.loeschen'),
            ausfuehren: () => {
              umgebung.commands.execute(
                erzeugeObjekteEntfernenCommand(
                  umgebung.doc,
                  blattId,
                  [anlass.objektId],
                  t('aktionen.kontextmenu.schaltverbindungLoeschen'),
                ),
              )
              useUiStore.getState().setAuswahlIds([])
            },
          },
        ]
      case 'kabelschacht':
        return objekte.some((o) => o.type === 'kabelschacht' && o.id === anlass.objektId)
          ? [
              inhaltAnzeigenEintrag('schacht', anlass.objektId, blattId),
              {
                id: 'loeschen',
                label: t('aktionen.kontextmenu.loeschen'),
                ausfuehren: () =>
                  frageLoeschung(
                    useUiStore.getState().oeffneBestaetigung,
                    umgebung.doc,
                    blattId,
                    [anlass.objektId],
                    (bestaetigt) => {
                      if (!bestaetigt) return
                      umgebung.commands.execute(
                        erzeugeObjekteEntfernenCommand(
                          umgebung.doc,
                          blattId,
                          [anlass.objektId],
                          t('aktionen.kontextmenu.kabelschachtLoeschen'),
                        ),
                      )
                      useUiStore.getState().setAuswahlIds([])
                    },
                  ),
              },
            ]
          : []
      case 'bauteil': {
        const objekt = objekte.find((o) => o.id === anlass.objektId)
        if (!objekt) return []
        return [
          bauteilAuswaehlenEintrag([objekt.id], blattId, umgebung),
          {
            id: 'loeschen',
            label: t('aktionen.kontextmenu.loeschen'),
            ausfuehren: () => {
              umgebung.commands.execute(
                erzeugeObjekteEntfernenCommand(
                  umgebung.doc,
                  blattId,
                  [objekt.id],
                  t('aktionen.kontextmenu.loeschen'),
                ),
              )
              useUiStore.getState().setAuswahlIds([])
            },
          },
        ]
      }
    }
  })()
  return mitLoeschen ? eintraege : eintraege.filter((e) => e.id !== 'loeschen')
}

export function ermittleAuswahlAktionen(
  auswahlIds: readonly string[],
  umgebung: KontextMenuUmgebung,
): KontextMenuEintrag[] {
  if (auswahlIds.length === 0) return []
  const optionen = { mitLoeschen: false }
  if (auswahlIds.length > 1) {
    return nurWirksame(
      ermittleKontextMenuEintraege({ art: 'mehrfachauswahl', auswahlIds }, umgebung, optionen),
    )
  }
  const blattId = umgebung.toolContext.aktivesBlattId()
  const objekt = umgebung.doc.getBlatt(blattId)?.objekte.find((o) => o.id === auswahlIds[0])
  if (!objekt) return []
  switch (objekt.type) {
    case 'leitung':
    case 'leitungsbaum':
      return nurWirksame(
        ermittleKontextMenuEintraege({ art: objekt.type, objektId: objekt.id }, umgebung, optionen),
      )
    case 'trunk': {
      const enden = ([0, 1] as const).flatMap((endeIndex) =>
        ermittleKontextMenuEintraege(
          { art: 'trunk-ende', objektId: objekt.id, endeIndex },
          umgebung,
          optionen,
        ).map((e) => ({
          ...e,
          id: `ende-${endeIndex}-${e.id}`,
          label: t(
            endeIndex === 0 ? 'aktionen.kontextmenu.anfangVor' : 'aktionen.kontextmenu.endeVor',
            {
              label: e.label,
            },
          ),
        })),
      )
      return nurWirksame([
        ...ermittleKontextMenuEintraege({ art: 'trunk', objektId: objekt.id }, umgebung, optionen),
        ...enden,
      ])
    }
    case 'schaltverbindung':
      return nurWirksame([
        automatischAnordnenEintrag([objekt.id], blattId, umgebung),
        blattverweisEintrag(blattId, [objekt.id], umgebung),
      ])
    case 'kabelschacht':
      return nurWirksame(
        ermittleKontextMenuEintraege(
          { art: 'kabelschacht', objektId: objekt.id },
          umgebung,
          optionen,
        ),
      )
    case 'komponente':
      return nurWirksame([
        ...(istKlemme(objekt) ? [klemmenleisteNummerierenEintrag(objekt, umgebung)] : []),
        austauschenEintrag([objekt], blattId, umgebung),
        ...wandDrehenEintraege([objekt], blattId, umgebung),
      ])
    default:
      return objekt.ausBauteil
        ? nurWirksame([bauteilAuswaehlenEintrag([objekt.id], blattId, umgebung)])
        : []
  }
}

function klemmenleisteNummerierenEintrag(
  objekt: KomponentenObjekt,
  { doc, commands }: Pick<KontextMenuUmgebung, 'doc' | 'commands'>,
): KontextMenuEintrag {
  const leiste = objekt.geraeteKennzeichen?.trim() ?? ''
  const command = leiste ? erzeugeKlemmenleisteNummerierenCommand(doc, leiste) : null
  return {
    id: 'klemmenleiste-nummerieren',
    label: t('aktionen.kontextmenu.klemmenleisteNummerieren', { leiste }),
    deaktiviert: !command,
    hinweis: t('aktionen.kontextmenu.klemmenleisteFertig', { leiste }),
    ausfuehren: () => {
      if (command) commands.execute(command)
    },
  }
}

function inhaltAnzeigenEintrag(
  art: 'trunk' | 'schacht',
  objektId: string,
  blattId: string,
): KontextMenuEintrag {
  return {
    id: 'inhalt-anzeigen',
    label: t('aktionen.kontextmenu.inhaltAnzeigen'),
    ausfuehren: () => useUiStore.getState().oeffneInhaltDialog({ art, blattId, objektId }),
  }
}

function automatischAnordnenEintrag(
  auswahlIds: readonly string[],
  blattId: string,
  { doc }: Pick<KontextMenuUmgebung, 'doc'>,
): KontextMenuEintrag {
  const blatt = doc.getBlatt(blattId)
  const umfang = anordnenUmfang(blatt?.objekte ?? [], auswahlIds, blatt?.ebenen ?? [])
  return {
    id: 'automatisch-anordnen',
    label: t('aktionen.kontextmenu.automatischAnordnen'),
    deaktiviert: !umfang,
    hinweis: umfang ? undefined : t('aktionen.kontextmenu.anordnenHinweis'),
    ausfuehren: () => starteAutomatischAnordnen({ doc }, auswahlIds),
  }
}

function neuVerlegenEintrag(
  auswahlIds: readonly string[],
  blattId: string,
  { doc, commands }: Pick<KontextMenuUmgebung, 'doc' | 'commands'>,
): KontextMenuEintrag {
  return {
    id: 'leitungen-neu-verlegen',
    label: t('aktionen.kontextmenu.neuVerlegen'),
    ausfuehren: () => verlegeLeitungenNeuBefehl(doc, commands, blattId, auswahlIds),
  }
}

function bauteilAuswaehlenEintrag(
  auswahlIds: readonly string[],
  blattId: string,
  { doc }: Pick<KontextMenuUmgebung, 'doc'>,
): KontextMenuEintrag {
  const objekte = doc.getBlatt(blattId)?.objekte ?? []
  const auswahl = new Set(auswahlIds)
  const guids = new Set(
    objekte.filter((o) => auswahl.has(o.id) && o.ausBauteil).map((o) => o.ausBauteil),
  )
  const ids = objekte
    .filter((o) => auswahl.has(o.id) || (o.ausBauteil !== undefined && guids.has(o.ausBauteil)))
    .map((o) => o.id)
  return {
    id: 'bauteil-auswaehlen',
    label: t('aktionen.kontextmenu.bauteilAuswaehlen'),
    deaktiviert: guids.size === 0 || ids.length === auswahl.size,
    hinweis:
      guids.size === 0
        ? t('aktionen.kontextmenu.bauteilNurIfc')
        : t('aktionen.kontextmenu.bauteilSchonGewaehlt'),
    ausfuehren: () => useUiStore.getState().setAuswahlIds(ids),
  }
}

function austauschenEintrag(
  komponenten: readonly KomponentenObjekt[],
  blattId: string,
  { doc, commands, toolContext }: Pick<KontextMenuUmgebung, 'doc' | 'commands' | 'toolContext'>,
): KontextMenuEintrag {
  if (komponenten.some((k) => k.knxAktor)) {
    return {
      id: 'austauschen',
      label: t('aktionen.kontextmenu.austauschen'),
      deaktiviert: true,
      hinweis: t('aktionen.kontextmenu.austauschenKnx'),
    }
  }
  const katalog = useKatalogStore.getState().komponenten
  const katalogIds = new Set(
    komponenten.map((k) => katalog.find((e) => e.id === k.catalogComponentId)?.katalogId),
  )
  const [katalogId] = katalogIds
  if (katalogIds.size !== 1 || !katalogId) {
    return {
      id: 'austauschen',
      label: t('aktionen.kontextmenu.austauschen'),
      deaktiviert: true,
      hinweis: t('aktionen.kontextmenu.austauschenKatalog'),
    }
  }
  const ids = komponenten.map((k) => k.id)
  return {
    id: 'austauschen',
    label: t('aktionen.kontextmenu.austauschen'),
    ausfuehren: () =>
      toolContext.oeffneKomponentenPicker(
        (ergebnis) => {
          if (!ergebnis) return
          const { command, abgelehnt, fehlgeschlageneLeitungenAnzahl } =
            erzeugeKomponentenTauschenCommand(
              doc,
              blattId,
              ids,
              ergebnis,
              toolContext.routingSettings(),
              ids.length > 1
                ? t('aktionen.kontextmenu.austauschenTitelMehrere', { n: ids.length })
                : t('aktionen.kontextmenu.austauschenTitel'),
            )
          if (command) commands.execute(command)
          const hinweise: string[] = []
          const anzahl = (grund: string) => abgelehnt.filter((a) => a.grund === grund).length
          if (anzahl('anschluesse') > 0)
            hinweise.push(
              t('aktionen.kontextmenu.nichtGetauschtAnschluesse', { n: anzahl('anschluesse') }),
            )
          if (anzahl('ports') > 0)
            hinweise.push(t('aktionen.kontextmenu.nichtGetauschtPorts', { n: anzahl('ports') }))
          if (anzahl('modul') > 0)
            hinweise.push(t('aktionen.kontextmenu.nichtGetauschtModul', { n: anzahl('modul') }))
          if (fehlgeschlageneLeitungenAnzahl > 0)
            hinweise.push(
              t('aktionen.kontextmenu.tauschenNichtVerlegt', { n: fehlgeschlageneLeitungenAnzahl }),
            )
          if (hinweise.length > 0) useUiStore.getState().zeigeToast(hinweise.join(' '))
        },
        {
          titel:
            ids.length > 1
              ? t('aktionen.kontextmenu.austauschenTitelMehrere', { n: ids.length })
              : t('aktionen.kontextmenu.austauschenTitel'),
          bestaetigenText: t('aktionen.kontextmenu.austauschenKnopf'),
          nurKatalogId: katalogId,
        },
      ),
  }
}

function wandDrehenEintraege(
  komponenten: readonly KomponentenObjekt[],
  blattId: string,
  { doc, commands, toolContext }: Pick<KontextMenuUmgebung, 'doc' | 'commands' | 'toolContext'>,
): KontextMenuEintrag[] {
  const wandAenderung = (label: string, aendern: (objekte: Objekt[]) => Objekt[]) =>
    commands.execute(
      erzeugeWandAenderungCommand(doc, blattId, label, aendern, toolContext.routingSettings()),
    )
  const ebenen = doc.getBlatt(blattId)?.ebenen ?? []
  const ids = new Set(
    komponenten
      .filter((k) => k.wandstelle && k.kombination && istBearbeitbar(k, ebenen))
      .map((k) => k.id),
  )
  if (ids.size === 0) return []
  const objekte = doc.getBlatt(blattId)?.objekte ?? []
  const schluessel = (k: KomponentenObjekt) =>
    `${k.wandstelle?.id}|${k.kombination?.hoeheCm}|${k.kombination?.nr}`
  const gewaehlteKombis = new Set(
    komponenten.filter((k) => ids.has(k.id)).map((k) => schluessel(k)),
  )
  const kombiIds = objekte
    .filter(
      (o): o is KomponentenObjekt =>
        o.type === 'komponente' && !!o.kombination && gewaehlteKombis.has(schluessel(o)),
    )
    .map((o) => o.id)
  const auswahl = new Set(useUiStore.getState().auswahlIds)
  const schonAlle = kombiIds.every((id) => auswahl.has(id))
  return [
    ...(schonAlle
      ? []
      : [
          {
            id: 'kombination-auswaehlen',
            label: t('aktionen.kontextmenu.kombinationAuswaehlen'),
            ausfuehren: () =>
              useUiStore.getState().setAuswahlIds([...new Set([...auswahl, ...kombiIds])]),
          },
        ]),
    ...(ids.size === 1
      ? (
          [
            [-1, 'platz-vor', 'aktionen.kontextmenu.platzVor'],
            [1, 'platz-zurueck', 'aktionen.kontextmenu.platzZurueck'],
          ] as const
        ).flatMap(([richtung, id, schluesselText]) => {
          const k = komponenten.find((x) => ids.has(x.id))!
          return nachbarImPlatz(objekte, k, richtung)
            ? [
                {
                  id,
                  label: t(schluesselText),
                  ausfuehren: () =>
                    wandAenderung(t('aktionen.kontextmenu.reihenfolgeAendern'), (o) =>
                      verschiebePlatz(o, k.id, richtung),
                    ),
                },
              ]
            : []
        })
      : []),
    {
      id: 'kombination-drehen',
      label: t('aktionen.kontextmenu.kombinationDrehen90', { n: ids.size }),
      ausfuehren: () =>
        wandAenderung(t('aktionen.kontextmenu.kombinationDrehen'), (objekte) =>
          dreheKombinationen(objekte, ids),
        ),
    },
    {
      id: 'element-drehen',
      label: t('aktionen.kontextmenu.elementDrehen90', { n: ids.size }),
      ausfuehren: () =>
        wandAenderung(t('aktionen.kontextmenu.elementDrehen'), (objekte) =>
          dreheElemente(objekte, ids),
        ),
    },
  ]
}

function nurWirksame(eintraege: KontextMenuEintrag[]): KontextMenuEintrag[] {
  return eintraege
    .filter((e) => !e.deaktiviert)
    .map((e) => (e.untermenue ? { ...e, untermenue: nurWirksame(e.untermenue) } : e))
}

function leerEintraege({ fuegeEin, hatKlemmbrettInhalt }: KontextMenuUmgebung) {
  const ui = useUiStore.getState()
  return [
    {
      id: 'einfuegen',
      label: t('aktionen.kontextmenu.einfuegen'),
      deaktiviert: !hatKlemmbrettInhalt(),
      ausfuehren: fuegeEin,
    },
    {
      id: 'zoom-alles',
      label: t('aktionen.kontextmenu.zoomAlles'),
      ausfuehren: () => window.dispatchEvent(new CustomEvent('eleasycad:zoom-alles')),
    },
    {
      id: 'raster',
      label: t(
        ui.rasterSichtbar
          ? 'aktionen.kontextmenu.rasterAusblenden'
          : 'aktionen.kontextmenu.rasterEinblenden',
      ),
      ausfuehren: () => useUiStore.getState().toggleRaster(),
    },
  ] satisfies KontextMenuEintrag[]
}

function leitungEintraege(
  leitung: LeitungsObjekt,
  weltPunkt: Point | undefined,
  blattId: string,
  { doc, commands, view, toolContext, toolManager }: KontextMenuUmgebung,
): KontextMenuEintrag[] {
  const eintraege: KontextMenuEintrag[] = []
  const alleObjekte = doc.getBlatt(blattId)?.objekte ?? []
  const routing = () =>
    fuerLeitung(
      toolContext.routingSettings(),
      leitung,
      doc.getBlatt(blattId)?.geschoss,
      doc.getZeichnung().installationszonen,
    )
  const griff = weltPunkt
    ? findeLeitungsGriff(
        leitung.pfadSegmente,
        weltPunkt,
        view.laengeToWorld(LEITUNG_GRIFF_TOLERANZ_PX),
      )
    : null

  function ersetzeAbschnitt(segmentArrIndex: number, neuerAbschnitt: Point[], label: string) {
    commands.execute(
      erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
        objekte.map((o) => {
          if (o.id !== leitung.id || o.type !== 'leitung') return o
          const neuePfadSegmente = [...o.pfadSegmente]
          neuePfadSegmente[segmentArrIndex] = neuerAbschnitt
          return { ...o, pfadSegmente: neuePfadSegmente }
        }),
      ),
    )
  }

  if (griff?.art === 'segment' && weltPunkt) {
    eintraege.push({
      id: 'wegpunkt-hinzufuegen',
      label: t('aktionen.kontextmenu.wegpunktHinzufuegen'),
      ausfuehren: () => {
        const neuerAbschnitt = vorschauSegmentVerschieben(
          leitung.pfadSegmente[griff.segmentArrIndex],
          routingHindernisse(alleObjekte),
          routing(),
          griff.lokalerIndex,
          weltPunkt,
        )
        if (neuerAbschnitt)
          ersetzeAbschnitt(
            griff.segmentArrIndex,
            neuerAbschnitt,
            t('aktionen.kontextmenu.wegpunktHinzufuegen'),
          )
      },
    })
  }
  if (griff?.art === 'wegpunkt') {
    eintraege.push({
      id: 'wegpunkt-entfernen',
      label: t('aktionen.kontextmenu.wegpunktEntfernen'),
      ausfuehren: () => {
        const neuerAbschnitt = vorschauWegpunktEntfernen(
          leitung.pfadSegmente[griff.segmentArrIndex],
          routingHindernisse(alleObjekte),
          routing(),
          griff.lokalerIndex,
        )
        if (neuerAbschnitt)
          ersetzeAbschnitt(
            griff.segmentArrIndex,
            neuerAbschnitt,
            t('aktionen.kontextmenu.wegpunktEntfernen'),
          )
      },
    })
  }

  eintraege.push(kabeltypEintrag(blattId, [leitung.id], leitung.kabeltypId, { doc, commands }))
  eintraege.push(installationszoneEintrag(blattId, [leitung.id], { doc, commands }))
  eintraege.push(nurInBauteilenEintrag(blattId, [leitung.id], { doc, commands }))
  eintraege.push(teilstueckeWaehlenEintrag(toolManager))

  const letzterDurchgang = leitung.trunkDurchgaenge[leitung.trunkDurchgaenge.length - 1]
  if (
    letzterDurchgang &&
    ermittleSwitchesAnKette(doc.getZeichnung(), blattId, letzterDurchgang.trunkId).length > 0
  ) {
    const bestehend = leitung.ziel.art === 'switchport' ? leitung.ziel : null
    eintraege.push({
      id: 'switchport',
      label: bestehend
        ? t('aktionen.kontextmenu.portAendern')
        : t('aktionen.kontextmenu.portZuweisen'),
      ausfuehren: () =>
        toolContext.oeffneSwitchPortDialog(
          {
            quelle: { art: 'trunk', blattId, trunkId: letzterDurchgang.trunkId },
            vorauswahl: bestehend
              ? {
                  blattId: bestehend.blattId,
                  objektId: bestehend.objektId,
                  portIndex: bestehend.portIndex,
                }
              : null,
          },
          (ziel) => {
            if (!ziel || ziel.art !== 'port') return
            commands.execute(
              erzeugeSwitchPortZuweisenCommand(
                doc,
                blattId,
                leitung.id,
                { blattId: ziel.blattId, objektId: ziel.objektId, portIndex: ziel.portIndex },
                t('aktionen.kontextmenu.portZuweisenUndo'),
              ),
            )
          },
        ),
    })
    if (bestehend) {
      eintraege.push({
        id: 'switchport-loesen',
        label: t('aktionen.kontextmenu.portLoesen'),
        ausfuehren: () =>
          commands.execute(
            erzeugeSwitchPortZuweisenCommand(
              doc,
              blattId,
              leitung.id,
              null,
              t('aktionen.kontextmenu.portLoesen'),
            ),
          ),
      })
    }
  }

  eintraege.push(...verteilerEintraege(blattId, leitung, { doc, commands, toolContext }))

  for (const seite of [0, 1] as const) {
    const endpunkt = seite === 0 ? leitung.start : leitung.ziel
    if (endpunkt.art !== 'schacht') continue
    const schacht = alleObjekte.find((o) => o.id === endpunkt.objektId)
    if (!schacht || schacht.type !== 'kabelschacht') continue
    const strang = findeStrang(doc.getZeichnung(), schacht.verbundId, endpunkt.strang)
    if (!strang) continue
    for (const ziel of moeglicheFortsetzungen(doc.getZeichnung(), blattId, schacht.verbundId)) {
      if (!pruefeStrangAnschluss(strang, 'leitung', ziel.blattId, '').erlaubt) continue
      eintraege.push({
        id: `fortsetzen-${seite}-${ziel.blattId}`,
        label: t('aktionen.kontextmenu.fortsetzen', {
          ziel: ziel.blattName,
          kennung: strangTitel(
            endpunkt.strang,
            strangName(doc.getZeichnung(), schacht.verbundId, endpunkt.strang),
          ),
        }),
        ausfuehren: () => {
          window.dispatchEvent(
            new CustomEvent('eleasycad:sprung-zu-blatt', {
              detail: { blattId: ziel.blattId, objektId: ziel.schachtId },
            }),
          )
          toolManager.aktiviere('leitung', {
            art: 'leitung-am-schacht',
            schachtId: ziel.schachtId,
            strang: endpunkt.strang,
          })
        },
      })
    }
  }
  for (const seite of [0, 1] as const) {
    if ((seite === 0 ? leitung.start : leitung.ziel).art !== 'schacht') continue
    eintraege.push({
      id: `schacht-loesen-${seite}`,
      label: t(
        seite === 0
          ? 'aktionen.kontextmenu.anfangVomSchachtLoesen'
          : 'aktionen.kontextmenu.endeVomSchachtLoesen',
      ),
      ausfuehren: () =>
        commands.execute(
          erzeugeSchachtLoesenCommand(
            doc,
            blattId,
            leitung.id,
            seite,
            t('aktionen.kontextmenu.schachtAnschlussLoesen'),
          ),
        ),
    })
  }

  eintraege.push(automatischAnordnenEintrag([leitung.id], blattId, { doc }))
  eintraege.push(neuVerlegenEintrag([leitung.id], blattId, { doc, commands }))
  const katalog = useKatalogStore.getState().komponenten
  const verknuepfung = ermittleLeitungsVerknuepfung(
    doc.getZeichnung(),
    katalog,
    blattId,
    leitung.id,
  )
  eintraege.push({
    id: 'gruppe-wirkverbindung',
    label: t('aktionen.kontextmenu.gruppeWirkverbindung'),
    deaktiviert: !verknuepfung,
    hinweis:
      leitungsVerknuepfungsHinweis(doc.getZeichnung(), katalog, blattId, leitung.id) ??
      t('aktionen.kontextmenu.gruppeWirkverbindungHinweis'),
    ausfuehren: () =>
      useUiStore.getState().oeffneVerknuepfungDialog({ blattId, leitungId: leitung.id }),
  })
  eintraege.push({
    id: 'loeschen',
    label: t('aktionen.kontextmenu.loeschen'),
    ausfuehren: () => {
      commands.execute(
        erzeugeObjekteEntfernenCommand(
          doc,
          blattId,
          [leitung.id],
          t('aktionen.kontextmenu.leitungLoeschen'),
        ),
      )
      useUiStore.getState().setAuswahlIds([])
    },
  })
  return eintraege
}

function trunkEintraege(
  trunk: TrunkObjekt,
  weltPunkt: Point | undefined,
  blattId: string,
  { doc, commands, view, toolContext }: KontextMenuUmgebung,
): KontextMenuEintrag[] {
  const eintraege: KontextMenuEintrag[] = []
  const alleObjekte = doc.getBlatt(blattId)?.objekte ?? []
  const griff = weltPunkt
    ? findeLeitungsGriff(
        [trunk.wegpunkte],
        weltPunkt,
        view.laengeToWorld(LEITUNG_GRIFF_TOLERANZ_PX),
      )
    : null

  function ersetzePfad(neuerPfad: Point[], label: string) {
    commands.execute(
      erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
        objekte.map((o) =>
          o.id === trunk.id && o.type === 'trunk' ? { ...o, wegpunkte: neuerPfad } : o,
        ),
      ),
    )
  }

  if (griff?.art === 'segment' && weltPunkt) {
    eintraege.push({
      id: 'wegpunkt-hinzufuegen',
      label: t('aktionen.kontextmenu.wegpunktHinzufuegen'),
      ausfuehren: () => {
        const neuerPfad = vorschauSegmentVerschieben(
          trunk.wegpunkte,
          routingHindernisse(alleObjekte),
          toolContext.routingSettings(),
          griff.lokalerIndex,
          weltPunkt,
        )
        if (neuerPfad) ersetzePfad(neuerPfad, t('aktionen.kontextmenu.wegpunktHinzufuegen'))
      },
    })
  }
  if (griff?.art === 'wegpunkt') {
    eintraege.push({
      id: 'wegpunkt-entfernen',
      label: t('aktionen.kontextmenu.wegpunktEntfernen'),
      ausfuehren: () => {
        const neuerPfad = vorschauWegpunktEntfernen(
          trunk.wegpunkte,
          routingHindernisse(alleObjekte),
          toolContext.routingSettings(),
          griff.lokalerIndex,
        )
        if (neuerPfad) ersetzePfad(neuerPfad, t('aktionen.kontextmenu.wegpunktEntfernen'))
      },
    })
  }
  eintraege.push(inhaltAnzeigenEintrag('trunk', trunk.id, blattId))
  eintraege.push(installationszoneEintrag(blattId, [trunk.id], { doc, commands }))
  eintraege.push({
    id: 'loeschen',
    label: t('aktionen.kontextmenu.loeschen'),
    ausfuehren: () =>
      frageLoeschung(
        useUiStore.getState().oeffneBestaetigung,
        doc,
        blattId,
        [trunk.id],
        (bestaetigt) => {
          if (!bestaetigt) return
          const { command } = erzeugeTrunkLoeschenCommand(
            doc,
            blattId,
            trunk.id,
            t('aktionen.kontextmenu.trunkLoeschen'),
          )
          commands.execute(command)
          useUiStore.getState().setAuswahlIds([])
        },
      ),
  })
  return eintraege
}

function trunkEndeEintraege(
  trunk: TrunkObjekt,
  endeIndex: 0 | 1,
  blattId: string,
  { doc, commands, toolContext }: KontextMenuUmgebung,
): KontextMenuEintrag[] {
  const ende = trunk.enden[endeIndex]
  if (ende.schachtRef) {
    return [
      {
        id: 'schacht-loesen',
        label: t('aktionen.kontextmenu.vomSchachtLoesen'),
        ausfuehren: () =>
          commands.execute(
            erzeugeSchachtLoesenCommand(
              doc,
              blattId,
              trunk.id,
              endeIndex,
              t('aktionen.kontextmenu.schachtAnschlussLoesen'),
            ),
          ),
      },
    ]
  }
  if (ende.verbundenesEnde) {
    return [
      {
        id: 'trennen',
        label: t('aktionen.kontextmenu.verbindungTrennen'),
        ausfuehren: () => {
          const command = erzeugeTrunkTrennenCommand(
            doc,
            blattId,
            trunk.id,
            endeIndex,
            t('aktionen.kontextmenu.trunkVerbindungTrennen'),
          )
          if (command) commands.execute(command)
        },
      },
    ]
  }
  function verbindeTrunks(
    ziel: { blattId: string; trunkId: string; endeIndex: 0 | 1 },
    wahl: AusfuehrungsWahl,
  ) {
    if (ziel.blattId === blattId) {
      try {
        const ergebnis = erzeugeTrunkMergeCommand(
          doc,
          blattId,
          ziel.trunkId,
          ziel.endeIndex,
          trunk.id,
          endeIndex,
          toolContext.routingSettings(),
          t('aktionen.kontextmenu.trunksVerschmelzen'),
        )
        ergebnis.command.do()
        commands.push(gleicheKetteAn(doc, blattId, ziel.trunkId, wahl, ergebnis.command))
        if (ergebnis.fehlgeschlageneRerouteAnzahl > 0) {
          useUiStore.getState().zeigeToast(
            t('aktionen.kontextmenu.verschmelzenNichtVerlegt', {
              n: ergebnis.fehlgeschlageneRerouteAnzahl,
            }),
          )
        }
      } catch (fehler) {
        useUiStore
          .getState()
          .zeigeToast(
            fehler instanceof Error
              ? fehler.message
              : t('aktionen.kontextmenu.verschmelzenNichtMoeglich'),
          )
      }
      return
    }
    const command = erzeugeTrunkVerbindenCommand(
      doc,
      blattId,
      trunk.id,
      endeIndex,
      ziel.blattId,
      ziel.trunkId,
      ziel.endeIndex,
      t('aktionen.kontextmenu.trunksVerbinden'),
    )
    command.do()
    commands.push(gleicheKetteAn(doc, blattId, trunk.id, wahl, command))
  }
  return [
    {
      id: 'verbinden',
      label: t('aktionen.kontextmenu.trunkVerbinden'),
      ausfuehren: () =>
        toolContext.oeffneTrunkVerbindenDialog(
          { blattId, trunkId: trunk.id, endeIndex },
          (ziel) => {
            if (!ziel) return
            const zielTrunk = doc
              .getBlatt(ziel.blattId)
              ?.objekte.find((o): o is TrunkObjekt => o.type === 'trunk' && o.id === ziel.trunkId)
            if (!zielTrunk) return
            const gleicheBlatt = ziel.blattId === blattId
            const hier = { name: trunk.name, trunk }
            const dort = { name: zielTrunk.name, trunk: zielTrunk }
            klaereAusfuehrung(
              (optionen) => toolContext.oeffneBestaetigung(optionen),
              gleicheBlatt ? dort : hier,
              gleicheBlatt ? hier : dort,
              (wahl) => {
                if (wahl) verbindeTrunks(ziel, wahl)
              },
            )
          },
        ),
    },
  ]
}

function leitungsbaumEintraege(
  baum: LeitungsbaumObjekt,
  blattId: string,
  { doc, commands }: KontextMenuUmgebung,
): KontextMenuEintrag[] {
  const nurNetzsicht = baum.gliederung === 'verteiler'
  return [
    {
      id: 'baum-trunks',
      label: t(
        baum.trunksAnzeigen
          ? 'aktionen.kontextmenu.trunksAusblenden'
          : 'aktionen.kontextmenu.trunksEinblenden',
      ),
      deaktiviert: !nurNetzsicht,
      hinweis: nurNetzsicht ? undefined : t('aktionen.kontextmenu.baumTrunksHinweis'),
      ausfuehren: () => {
        const neu = !baum.trunksAnzeigen
        commands.execute(
          erzeugeObjektAendernCommand(
            doc,
            blattId,
            neu
              ? t('aktionen.kontextmenu.baumTrunksEinblenden')
              : t('aktionen.kontextmenu.baumTrunksAusblenden'),
            (objekte) =>
              objekte.map((o) =>
                o.id === baum.id && o.type === 'leitungsbaum' ? { ...o, trunksAnzeigen: neu } : o,
              ),
          ),
        )
      },
    },
  ]
}

function mehrfachauswahlEintraege(
  auswahlIds: readonly string[],
  blattId: string,
  umgebung: KontextMenuUmgebung,
): KontextMenuEintrag[] {
  const { doc, commands, toolContext, toolManager } = umgebung
  const ausgewaehlteObjekte = (doc.getBlatt(blattId)?.objekte ?? []).filter((o) =>
    auswahlIds.includes(o.id),
  )
  const ausgewaehlteKomponenten = ausgewaehlteObjekte.filter(
    (o): o is KomponentenObjekt => o.type === 'komponente',
  )
  const nurKomponenten =
    ausgewaehlteKomponenten.length === ausgewaehlteObjekte.length &&
    ausgewaehlteKomponenten.length > 1
  const ausgewaehlteLeitungen = ausgewaehlteObjekte.filter((o) => o.type === 'leitung')
  const nurLeitungen =
    ausgewaehlteLeitungen.length === ausgewaehlteObjekte.length && ausgewaehlteLeitungen.length > 1
  const nurKomponentenHinweis = nurKomponenten
    ? undefined
    : t('aktionen.kontextmenu.nurKomponenten')

  function wendeAn(positionen: Map<string, Point>, label: string) {
    const { command, fehlgeschlageneLeitungenAnzahl } = erzeugeVerschiebungMitRerouteCommand(
      doc,
      blattId,
      positionen,
      new Map(),
      toolContext.routingSettings(),
      label,
    )
    commands.execute(command)
    if (fehlgeschlageneLeitungenAnzahl > 0) {
      useUiStore
        .getState()
        .zeigeToast(
          t('aktionen.kontextmenu.verschiebenNichtVerlegt', { n: fehlgeschlageneLeitungenAnzahl }),
        )
    }
  }

  function gruppeBilden() {
    const zeichnung = doc.getZeichnung()
    const ermittelterTyp = ermittleGemeinsamenTyp(ausgewaehlteKomponenten, zeichnung)
    if (!ermittelterTyp) {
      useUiStore.getState().zeigeToast(t('aktionen.kontextmenu.gruppeOhneTyp'))
      return
    }
    const typ: KomponentenTyp = ermittelterTyp
    function ausfuehren() {
      useUiStore.getState().oeffneGruppeBildenDialog({
        titel: t('aktionen.kontextmenu.gruppeNeuTitel'),
        text: t('aktionen.kontextmenu.gruppeNeuText', { n: ausgewaehlteKomponenten.length }),
        vorgabe: gruppenVorgabe(
          zeichnung,
          typ,
          ausgewaehlteKomponenten.map((objekt) => ({ blattId, objekt })),
        ),
        callback: (angaben) => {
          if (!angaben) return
          commands.execute(
            erzeugeGruppeAusAuswahlBildenCommand(
              doc,
              blattId,
              ausgewaehlteKomponenten.map((o) => o.id),
              typ,
              angaben,
            ),
          )
        },
      })
    }
    const gehtEtwasVerloren = ausgewaehlteKomponenten.some(
      (o) => (ermittleTypUndSlots(o, zeichnung)?.slots.length ?? 0) > 0,
    )
    if (!gehtEtwasVerloren) {
      ausfuehren()
      return
    }
    useUiStore.getState().oeffneBestaetigung({
      titel: t('aktionen.kontextmenu.slotsVerlorenTitel'),
      nachricht: t('aktionen.kontextmenu.slotsVerlorenText'),
      bestaetigenText: t('aktionen.kontextmenu.gruppeBilden'),
      destruktiv: true,
      callback: (bestaetigt) => {
        if (bestaetigt) ausfuehren()
      },
    })
  }

  function verteilen(
    richtung: 'horizontalVerteilen' | 'vertikalVerteilen',
    berechne: typeof berechneVerteilungHorizontal,
  ) {
    const titel = t(`aktionen.kontextmenu.${richtung}`)
    const standardAbstand = kleinsterClusterAbstand(ausgewaehlteKomponenten) * 100
    useUiStore.getState().oeffneVerteilenAbstandDialog(titel, standardAbstand, (cm) => {
      if (cm === null) return
      wendeAn(berechne(ausgewaehlteKomponenten, cm / 100), titel)
    })
  }

  const eintraege: KontextMenuEintrag[] = []
  if (nurLeitungen) {
    eintraege.push(
      kabeltypEintrag(
        blattId,
        ausgewaehlteLeitungen.map((o) => o.id),
        undefined,
        { doc, commands },
      ),
    )
  }
  const mitZone = ausgewaehlteObjekte.filter((o) => o.type === 'leitung' || o.type === 'trunk')
  if (mitZone.length > 0)
    eintraege.push(
      installationszoneEintrag(
        blattId,
        mitZone.map((o) => o.id),
        { doc, commands },
      ),
    )
  if (ausgewaehlteLeitungen.length > 0) {
    eintraege.push(
      nurInBauteilenEintrag(
        blattId,
        ausgewaehlteLeitungen.map((o) => o.id),
        { doc, commands },
      ),
    )
    eintraege.push(teilstueckeWaehlenEintrag(toolManager))
  }
  const schaltverbindungen = ausgewaehlteObjekte.filter((o) => o.type === 'schaltverbindung')
  if (schaltverbindungen.length > 0)
    eintraege.push(
      blattverweisEintrag(
        blattId,
        schaltverbindungen.map((o) => o.id),
        { doc, commands },
      ),
    )
  eintraege.push(
    {
      id: 'ausrichten',
      label: t('aktionen.kontextmenu.ausrichten'),
      deaktiviert: !nurKomponenten,
      untermenue: AUSRICHTEN_OPTIONEN.map(({ modus, label }) => ({
        id: `ausrichten-${modus}`,
        label,
        ausfuehren: () =>
          wendeAn(
            berechneAusrichtung(ausgewaehlteKomponenten, modus),
            t('aktionen.kontextmenu.ausrichtenUndo', { label }),
          ),
      })),
    },
    {
      id: 'horizontal-verteilen',
      label: t('aktionen.kontextmenu.horizontalVerteilen'),
      deaktiviert: !nurKomponenten,
      hinweis: nurKomponentenHinweis,
      ausfuehren: () => verteilen('horizontalVerteilen', berechneVerteilungHorizontal),
    },
    {
      id: 'vertikal-verteilen',
      label: t('aktionen.kontextmenu.vertikalVerteilen'),
      deaktiviert: !nurKomponenten,
      hinweis: nurKomponentenHinweis,
      ausfuehren: () => verteilen('vertikalVerteilen', berechneVerteilungVertikal),
    },
    {
      id: 'grid-verteilen',
      label: t('aktionen.kontextmenu.gridVerteilen'),
      deaktiviert: !nurKomponenten,
      hinweis: nurKomponentenHinweis,
      ausfuehren: () => {
        const bezug = nullpunktVon(doc.getBlatt(blattId) ?? { nullpunkt: null })
        const standard = ermittleGridStandardwerte(ausgewaehlteKomponenten)
        useUiStore.getState().oeffneGridVerteilenDialog(
          {
            x: (standard.ursprung.x - bezug.x) * 100,
            y: (standard.ursprung.y - bezug.y) * 100,
            abstandX: standard.abstand * 100,
            abstandY: standard.abstand * 100,
          },
          (werte) => {
            if (!werte) return
            wendeAn(
              berechneVerteilungGrid(ausgewaehlteKomponenten, {
                ursprung: { x: werte.x / 100 + bezug.x, y: werte.y / 100 + bezug.y },
                abstandX: werte.abstandX / 100,
                abstandY: werte.abstandY / 100,
              }),
              t('aktionen.kontextmenu.gridVerteilen'),
            )
          },
        )
      },
    },
    automatischAnordnenEintrag(auswahlIds, blattId, { doc }),
    ...(ausgewaehlteObjekte.some((o) => o.type === 'leitung')
      ? [neuVerlegenEintrag(auswahlIds, blattId, { doc, commands })]
      : []),
    {
      id: 'geraetegruppe',
      label: t('aktionen.kontextmenu.gruppeAusAuswahl'),
      deaktiviert: !nurKomponenten,
      hinweis: nurKomponentenHinweis,
      ausfuehren: gruppeBilden,
    },
    nurKomponenten
      ? austauschenEintrag(ausgewaehlteKomponenten, blattId, { doc, commands, toolContext })
      : {
          id: 'austauschen',
          label: t('aktionen.kontextmenu.austauschen'),
          deaktiviert: true,
          hinweis: nurKomponentenHinweis,
        },
    ...wandDrehenEintraege(ausgewaehlteKomponenten, blattId, { doc, commands, toolContext }),
    ...(ausgewaehlteKomponenten.length === 1 && ausgewaehlteObjekte.length === 1
      ? abgaengeImBauplanEintraege(ausgewaehlteKomponenten[0], umgebung)
      : []),
    ...(ausgewaehlteObjekte.some((o) => o.ausBauteil)
      ? [bauteilAuswaehlenEintrag(auswahlIds, blattId, { doc })]
      : []),
    {
      id: 'loeschen',
      label: t('aktionen.kontextmenu.loeschen'),
      ausfuehren: () => {
        const ids = [...auswahlIds]
        frageLoeschung(
          useUiStore.getState().oeffneBestaetigung,
          doc,
          blattId,
          ids,
          (bestaetigt) => {
            if (!bestaetigt) return
            commands.execute(
              erzeugeObjekteEntfernenCommand(
                doc,
                blattId,
                ids,
                t('aktionen.kontextmenu.objekteLoeschen', { n: ids.length }),
              ),
            )
            useUiStore.getState().setAuswahlIds([])
          },
        )
      },
    },
  )
  return eintraege
}

function blattverweisEintrag(
  blattId: string,
  objektIds: readonly string[],
  { doc, commands }: Pick<KontextMenuUmgebung, 'doc' | 'commands'>,
): KontextMenuEintrag {
  const blatt = doc.getBlatt(blattId)
  const linien = (blatt?.objekte ?? []).filter(
    (o): o is SchaltverbindungObjekt => o.type === 'schaltverbindung' && objektIds.includes(o.id),
  )
  const alle = linien.length > 0 && linien.every((s) => s.blattverweis === true)
  const benannt = linien.some((s) => !!s.bezeichnung)
  return {
    id: 'blattverweis',
    label: t('aktionen.kontextmenu.blattverweis'),
    gewaehlt: alle,
    deaktiviert: !benannt,
    hinweis: benannt
      ? t('aktionen.kontextmenu.blattverweisHinweis')
      : t('aktionen.kontextmenu.blattverweisOhneName'),
    ausfuehren: () => {
      const ids = linien.filter((o) => istBearbeitbar(o, blatt?.ebenen ?? [])).map((o) => o.id)
      if (ids.length === 0) return
      commands.execute(
        erzeugeObjektAendernCommand(
          doc,
          blattId,
          t('aktionen.kontextmenu.blattverweisAendern'),
          (objekte) =>
            objekte.map((o) => {
              if (o.type !== 'schaltverbindung' || !ids.includes(o.id)) return o
              const { blattverweis: _alt, ...rest } = o
              return alle ? rest : { ...rest, blattverweis: true }
            }),
        ),
      )
    },
  }
}

function installationszoneEintrag(
  blattId: string,
  objektIds: readonly string[],
  { doc, commands }: Pick<KontextMenuUmgebung, 'doc' | 'commands'>,
): KontextMenuEintrag {
  const blatt = doc.getBlatt(blattId)
  const objekte = (blatt?.objekte ?? []).filter(
    (o): o is LeitungsObjekt | TrunkObjekt =>
      (o.type === 'leitung' || o.type === 'trunk') && objektIds.includes(o.id),
  )
  const werte = new Set(objekte.map((o) => o.installationszone))
  const gemeinsam = werte.size === 1 ? { zone: [...werte][0] } : null
  const eigeneZonen = doc.getZeichnung().installationszonen
  const blattZone = blatt?.geschoss?.installationszone

  function setze(zone: Installationszone | undefined) {
    const ids = objekte.filter((o) => istBearbeitbar(o, blatt?.ebenen ?? [])).map((o) => o.id)
    if (ids.length === 0) return
    const label =
      ids.length > 1
        ? t('aktionen.kontextmenu.zoneAendernMehrere', { n: ids.length })
        : t('aktionen.kontextmenu.zoneAendern')
    commands.execute(
      erzeugeObjektAendernCommand(doc, blattId, label, (alle) =>
        alle.map((o) => {
          if (o.type === 'leitung' && ids.includes(o.id)) {
            const { installationszone: _alt, teilstueckZonen: _teile, ...rest } = o
            return zone ? { ...rest, installationszone: zone } : rest
          }
          if (o.type !== 'trunk' || !ids.includes(o.id)) return o
          const { installationszone: _alt, ...rest } = o
          return zone ? { ...rest, installationszone: zone } : rest
        }),
      ),
    )
    gleicheInstallationszonenAb(doc)
  }

  return {
    id: 'installationszone',
    label: t('aktionen.kontextmenu.installationszone'),
    untermenue: [
      {
        id: 'zone-wie-blatt',
        label: t('aktionen.kontextmenu.wieBlattZone', { zone: zonenText(blattZone, eigeneZonen) }),
        gewaehlt: gemeinsam !== null && gemeinsam.zone === undefined,
        ausfuehren: () => setze(undefined),
      },
      ...zonenAuswahl(eigeneZonen, {
        bestand: useInstallationszonenStore.getState().zonen,
        aktuelle: [...werte],
      }).map((z) => ({
        id: `zone-${z.id}`,
        label: zonenAnzeige(z),
        gewaehlt: gemeinsam?.zone === z.id,
        ausfuehren: () => setze(z.id),
      })),
    ],
  }
}

function nurInBauteilenEintrag(
  blattId: string,
  leitungIds: readonly string[],
  { doc, commands }: Pick<KontextMenuUmgebung, 'doc' | 'commands'>,
): KontextMenuEintrag {
  const blatt = doc.getBlatt(blattId)
  const leitungen = (blatt?.objekte ?? []).filter(
    (o): o is LeitungsObjekt => o.type === 'leitung' && leitungIds.includes(o.id),
  )
  const werte = new Set(leitungen.map((l) => l.nurInBauteilen))
  const gemeinsam = werte.size === 1 ? { wert: [...werte][0] } : null
  const blattAn = blatt?.geschoss?.nurInBauteilen === true
  const ids = leitungen.filter((l) => istBearbeitbar(l, blatt?.ebenen ?? [])).map((l) => l.id)
  return {
    id: 'nur-in-bauteilen',
    label: t('aktionen.kontextmenu.nurInBauteilen'),
    untermenue: NUR_IN_BAUTEILEN_WERTE.map((w) => ({
      id: `nur-in-bauteilen-${w.schluessel}`,
      label: nurInBauteilenText(w.wert, blattAn),
      gewaehlt: gemeinsam !== null && gemeinsam.wert === w.wert,
      ausfuehren: () => setzeNurInBauteilen(doc, commands, blattId, ids, w.wert),
    })),
  }
}

function teilstueckeWaehlenEintrag(
  toolManager: KontextMenuUmgebung['toolManager'],
): KontextMenuEintrag {
  return {
    id: 'teilstuecke-waehlen',
    label: t('aktionen.kontextmenu.teilstueckeWaehlen'),
    hinweis: t('aktionen.kontextmenu.teilstueckeHinweis'),
    ausfuehren: () => {
      toolManager.aktiviere('teilstueck-zone')
      useUiStore.getState().setAktivesToolId('teilstueck-zone')
    },
  }
}

export function ermittleTeilstueckAktionen(
  stuecke: readonly Teilstueck[],
  { doc, commands, toolContext }: KontextMenuUmgebung,
): KontextMenuEintrag[] {
  if (stuecke.length === 0) return []
  const blattId = toolContext.aktivesBlattId()
  const blatt = doc.getBlatt(blattId)
  const leitungen = new Map(
    (blatt?.objekte ?? [])
      .filter((o): o is LeitungsObjekt => o.type === 'leitung')
      .map((o) => [o.id, o]),
  )
  const zonen = new Set(
    stuecke.map((s) => {
      const l = leitungen.get(s.leitungId)
      return l ? teilstueckZone(l, s.von, s.bis) : undefined
    }),
  )
  const gemeinsam = zonen.size === 1 ? { zone: [...zonen][0] } : null
  const leitungsZonen = new Set(stuecke.map((s) => leitungen.get(s.leitungId)?.installationszone))
  const blattZone = blatt?.geschoss?.installationszone
  const geltend = leitungsZonen.size === 1 ? ([...leitungsZonen][0] ?? blattZone) : undefined
  const eigeneZonen = doc.getZeichnung().installationszonen
  const geltendText = geltend ? zonenText(geltend, eigeneZonen) : undefined

  function setze(zone: Installationszone | undefined) {
    const jeLeitung = new Map<string, Teilstueck[]>()
    for (const s of stuecke) {
      const l = leitungen.get(s.leitungId)
      if (!l || !istBearbeitbar(l, blatt?.ebenen ?? [])) continue
      jeLeitung.set(s.leitungId, [...(jeLeitung.get(s.leitungId) ?? []), s])
    }
    if (jeLeitung.size === 0) return
    commands.execute(
      erzeugeObjektAendernCommand(
        doc,
        blattId,
        stuecke.length > 1
          ? t('aktionen.kontextmenu.teilstueckZoneAendernMehrere', { n: stuecke.length })
          : t('aktionen.kontextmenu.teilstueckZoneAendern'),
        (alle) =>
          alle.map((o) => {
            const eigene = o.type === 'leitung' ? jeLeitung.get(o.id) : undefined
            return eigene && o.type === 'leitung' ? mitTeilstueckZonen(o, eigene, zone) : o
          }),
      ),
    )
    gleicheInstallationszonenAb(doc)
  }

  return [
    {
      id: 'teilstueck-zone',
      label: t('aktionen.kontextmenu.installationszone'),
      untermenue: [
        {
          id: 'zone-wie-leitung',
          label: geltendText
            ? t('aktionen.kontextmenu.wieLeitungZone', { zone: geltendText })
            : t('aktionen.kontextmenu.wieLeitung'),
          gewaehlt: gemeinsam !== null && gemeinsam.zone === undefined,
          ausfuehren: () => setze(undefined),
        },
        ...zonenAuswahl(eigeneZonen, {
          bestand: useInstallationszonenStore.getState().zonen,
          aktuelle: [...zonen],
        }).map((z) => ({
          id: `zone-${z.id}`,
          label: zonenAnzeige(z),
          gewaehlt: gemeinsam?.zone === z.id,
          ausfuehren: () => setze(z.id),
        })),
      ],
    },
  ]
}

function kabeltypEintrag(
  blattId: string,
  leitungIds: readonly string[],
  aktuelleId: string | undefined,
  { doc, commands }: Pick<KontextMenuUmgebung, 'doc' | 'commands'>,
): KontextMenuEintrag {
  const { typen, zuletztBenutzt } = useKabeltypStore.getState()
  const bekannt = new Set(typen.map((typ) => typ.id))
  const alle = sortiereKabeltypen([
    ...typen,
    ...doc.getZeichnung().kabeltypen.filter((typ) => !bekannt.has(typ.id)),
  ]).filter((typ) => typ.aktiv || typ.id === aktuelleId)
  const zuletzt = zuletztBenutzt
    .map((id) => alle.find((typ) => typ.id === id))
    .filter((typ): typ is Kabeltyp => !!typ)

  function setze(typ: Kabeltyp | null) {
    if (typ) useKabeltypStore.getState().merkeBenutzt(typ.id)
    const label =
      leitungIds.length > 1
        ? t('aktionen.kontextmenu.kabeltypAendernMehrere', { n: leitungIds.length })
        : t('aktionen.kontextmenu.kabeltypAendern')
    commands.execute(
      erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
        objekte.map((o) =>
          o.type === 'leitung' && leitungIds.includes(o.id)
            ? { ...o, kabeltypId: typ?.id, typ: undefined }
            : o,
        ),
      ),
    )
    gleicheKabeltypenAb(doc)
  }

  return {
    id: 'kabeltyp',
    label: t('aktionen.kontextmenu.kabeltyp'),
    untermenue: [
      { id: 'kein-typ', label: t('aktionen.kontextmenu.keinTyp'), ausfuehren: () => setze(null) },
      ...zuletzt.map((typ) => ({
        id: `zuletzt-${typ.id}`,
        label: typ.bezeichnung,
        ausfuehren: () => setze(typ),
      })),
      ...gruppiereKabeltypenAnzeige(alle, oberflaechensprache()).map((gruppe) => ({
        id: `gruppe-${gruppe.gruppe}`,
        label: gruppe.text,
        untermenue: gruppe.typen.map((typ) => ({
          id: typ.id,
          label: typ.bezeichnung,
          ausfuehren: () => setze(typ),
        })),
      })),
    ],
  }
}

function verteilerEintraege(
  blattId: string,
  leitung: LeitungsObjekt,
  { doc, commands, toolContext }: Pick<KontextMenuUmgebung, 'doc' | 'commands' | 'toolContext'>,
): KontextMenuEintrag[] {
  const zeichnung = doc.getZeichnung()
  const ergebnis: KontextMenuEintrag[] = []
  const fuer = t('aktionen.kontextmenu.leitungNummer', { nummer: String(leitung.nummer) })
  for (const ende of ['ziel', 'start'] as const) {
    const am = verteilerAmEnde(zeichnung, blattId, leitung, ende)
    if (!am?.verteiler.verteiler) continue
    const bestehend = (leitung.verteilerAnschluesse ?? [])
      .filter((a) => a.ende === ende)
      .map(({ ende: _ende, ...rest }) => rest)
    const name = verteilerKennzeichenText(am.verteiler.verteiler.kennzeichen)
    ergebnis.push({
      id: `verteiler-${ende}`,
      label:
        bestehend.length > 0
          ? t('aktionen.kontextmenu.verteilerAendern', { name })
          : t('aktionen.kontextmenu.verteilerAnschliessenAn', { name }),
      ausfuehren: () =>
        toolContext.oeffneVerteilerDialog(
          { blattId: am.blattId, objektId: am.verteiler.id, fuer, vorauswahl: bestehend },
          (auswahl) => {
            if (!auswahl) return
            commands.execute(
              erzeugeVerteilerZuweisenCommand(
                doc,
                blattId,
                leitung.id,
                ende,
                auswahl,
                t('aktionen.kontextmenu.verteilerAnschliessenUndo'),
              ),
            )
          },
        ),
    })
    if (bestehend.length > 0) {
      ergebnis.push({
        id: `verteiler-${ende}-loesen`,
        label: t('aktionen.kontextmenu.verteilerLoesen', { name }),
        ausfuehren: () =>
          commands.execute(
            erzeugeVerteilerZuweisenCommand(
              doc,
              blattId,
              leitung.id,
              ende,
              [],
              t('aktionen.kontextmenu.verteilerLoesenUndo'),
            ),
          ),
      })
    }
  }
  const letzterDurchgang = leitung.trunkDurchgaenge[leitung.trunkDurchgaenge.length - 1]
  const zielAmVerteiler = verteilerAmEnde(zeichnung, blattId, leitung, 'ziel') !== null
  if (
    !zielAmVerteiler &&
    letzterDurchgang &&
    ermittleVerteilerAnKette(zeichnung, blattId, letzterDurchgang.trunkId).length > 0
  ) {
    ergebnis.push({
      id: 'verteiler-ueber-trunk',
      label: t('aktionen.kontextmenu.verteilerAnschliessen'),
      ausfuehren: () =>
        toolContext.oeffneSwitchPortDialog(
          { quelle: { art: 'trunk', blattId, trunkId: letzterDurchgang.trunkId } },
          (ziel) => {
            if (ziel?.art === 'verteiler') {
              commands.execute(
                erzeugeVerteilerZuweisenCommand(
                  doc,
                  blattId,
                  leitung.id,
                  'ziel',
                  ziel.anschluesse,
                  t('aktionen.kontextmenu.verteilerAnschliessenUndo'),
                  { blattId: ziel.blattId, objektId: ziel.objektId },
                ),
              )
            } else if (ziel?.art === 'port') {
              commands.execute(
                erzeugeSwitchPortZuweisenCommand(
                  doc,
                  blattId,
                  leitung.id,
                  { blattId: ziel.blattId, objektId: ziel.objektId, portIndex: ziel.portIndex },
                  t('aktionen.kontextmenu.portZuweisenUndo'),
                ),
              )
            }
          },
        ),
    })
  }
  return ergebnis
}

function abgaengeImBauplanEintraege(
  symbol: KomponentenObjekt,
  { doc, verknuepfung, oeffneDokument }: KontextMenuUmgebung,
): KontextMenuEintrag[] {
  const plan = doc.getZeichnung()
  const kennzeichen = symbol.geraeteKennzeichen?.trim()
  if (!verknuepfung || !oeffneDokument || !plan.verteilerKennzeichen || !kennzeichen) return []
  const eintraege: KontextMenuEintrag[] = []
  for (const { dokument, zeichnung } of verknuepfung.getStand().bauplaene) {
    const leitungen = alleVerteiler(zeichnung)
      .filter((v) => v.verteiler.verteiler?.kennzeichen === plan.verteilerKennzeichen)
      .flatMap((v) => ermittleVerteilerZuweisungen(zeichnung, v.verteiler.id))
      .filter((z) => z.anschluss.kennzeichen === kennzeichen)
    if (leitungen.length === 0) continue
    const jeBlatt = new Map<string, LeitungsObjekt[]>()
    for (const z of leitungen)
      jeBlatt.set(z.leitungBlattId, [...(jeBlatt.get(z.leitungBlattId) ?? []), z.leitung])
    const [blattId, aufBlatt] = [...jeBlatt].sort((a, b) => b[1].length - a[1].length)[0]
    const anzahl = new Set(leitungen.map((z) => z.leitung.id)).size
    eintraege.push({
      id: `abgaenge-${dokument.id}`,
      label: t('aktionen.kontextmenu.abgaengeZeigen', { n: anzahl, name: dokument.name }),
      ausfuehren: () =>
        void oeffneDokument(dokument.id).then(() => {
          const boxen = aufBlatt.map((l) => getBoundingBox(l))
          window.dispatchEvent(
            new CustomEvent('eleasycad:sprung-zu-blatt', {
              detail: {
                blattId,
                bereich: {
                  min: {
                    x: Math.min(...boxen.map((b) => b.min.x)),
                    y: Math.min(...boxen.map((b) => b.min.y)),
                  },
                  max: {
                    x: Math.max(...boxen.map((b) => b.max.x)),
                    y: Math.max(...boxen.map((b) => b.max.y)),
                  },
                },
                objektIds: aufBlatt.map((l) => l.id),
              },
            }),
          )
        }),
    })
  }
  return eintraege
}
