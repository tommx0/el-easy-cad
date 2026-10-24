import { useMemo, useState, type DragEvent, type ReactNode } from 'react'
import type {
  BestueckungsEintrag,
  CatalogComponent,
  EinhaengeZiel,
  KanalGeraet,
  KomponentenObjekt,
  Phase,
  VerteilerAuswahl,
  VerteilerBaum,
  VerteilerArt,
  VerteilerNetz,
  VerteilerBetriebsmittel,
  VerteilerKnoten,
  Zeichnung,
} from '../../document-model'
import {
  aufgeloesteVariante,
  baueVerteilerBaum,
  bestueckungAendern,
  bestueckungEinhaengen,
  bestueckungEntfernen,
  bestueckungUmbenennen,
  brauchtPhase,
  ermittleStromkreisZuordnungen,
  ermittleStromweg,
  ermittleVerteilerZuweisungen,
  geraeteZusammenfassung,
  istFehlerstromSchutzName,
  istKlemmenKennzeichen,
  istVerteiler,
  netzVon,
  artVon,
  VERTEILER_ARTEN,
  passtZumNetz,
  kanalEinordnen,
  type KlemmenOptionen,
  einzelklemmen,
  einzelklemmenInLeiste,
  erzeugeId,
  leisteNeuNummeriert,
  leistenKlemmeUmnummeriert,
  knotenZurZuweisung,
  leitungsKennzeichen,
  nachfahren,
  neueBestueckungsEintraege,
  neueStromkreise,
  PHASEN,
  planeKnxZuordnung,
  knxAktorArtVonKatalogId,
  komponentenText,
  knxAktorTitel,
  knxKanalFunktionsText,
  knxKanalIndexAusName,
  knxKanalName,
  knxPaarBeginn,
  naechstesBestueckungsKennzeichen,
  neueKnxAktorDaten,
  planGeraetAufnehmen,
  stromwegText,
  typText,
  verteilerKennzeichenText,
  zuweisungsText,
} from '../../document-model'
import { oberflaechensprache, type Uebersetzer } from '../../sprache'
import { erzeugeBestueckungCommand } from '../../tools'
import type { AppKontext } from '../app-context'
import { EntwurfsTextfeld } from '../EntwurfsTextfeld'
import { useKatalogStore } from '../store/katalog-store'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { useVerknuepfung } from '../use-verknuepfung'
import { verteilerplanZeichnungen, verteilerplanZu } from '../verknuepfung'
import { useT } from '../sprache-anbindung'

export function VerteilerDialog() {
  const t = useT()
  const dialog = useUiStore((s) => s.verteilerDialog)
  const katalog = useKatalogStore((s) => s.komponenten)
  const zeichnung = useProject()
  const [auswahl, setAuswahl] = useState<VerteilerAuswahl[] | null>(null)

  if (!dialog) return null
  const verteiler = zeichnung.blaetter
    .find((b) => b.id === dialog.blattId)
    ?.objekte.find((o) => o.id === dialog.objektId)
  const zuweisen = dialog.modus === 'zuweisen'
  const aktuelleAuswahl = auswahl ?? dialog.vorauswahl ?? []

  function schliessen(ergebnis: VerteilerAuswahl[] | null) {
    const callback = dialog!.callback
    setAuswahl(null)
    useUiStore.getState().schliesseVerteilerDialog()
    callback?.(ergebnis)
  }

  if (!verteiler || !istVerteiler(verteiler)) {
    return (
      <div className="dialog-overlay" onMouseDown={() => schliessen(null)}>
        <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
          <h2>{t('verteilerdialoge.verteiler.titel')}</h2>
          <p className="dialog-hinweis">{t('verteilerdialoge.knxZuordnen.verteilerFehlt')}</p>
          <div className="dialog-aktionen">
            <button onClick={() => schliessen(null)}>
              {t('verteilerdialoge.allgemein.schliessen')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dialog-overlay" onMouseDown={() => schliessen(null)}>
      <div className="dialog dialog-verteiler" onMouseDown={(e) => e.stopPropagation()}>
        <h2>
          {zuweisen
            ? t('verteilerdialoge.verteiler.titelAnschliessen', {
                was: dialog.fuer ?? t('verteilerdialoge.switchPort.leitung'),
                kennzeichen: verteilerKennzeichenText(verteiler.verteiler.kennzeichen),
              })
            : t('verteilerdialoge.verteiler.titelMit', {
                kennzeichen: verteilerKennzeichenText(verteiler.verteiler.kennzeichen),
              })}
        </h2>
        <VerteilerInhalt
          zeichnung={zeichnung}
          blattId={dialog.blattId}
          verteiler={verteiler}
          katalog={katalog}
          auswahl={zuweisen ? aktuelleAuswahl : null}
          onAuswahl={setAuswahl}
          bearbeitbar={!zuweisen}
        />
        <div className="dialog-aktionen">
          {zuweisen ? (
            <>
              <button onClick={() => schliessen(null)}>
                {t('verteilerdialoge.allgemein.abbrechen')}
              </button>
              <button className="primaer" onClick={() => schliessen(aktuelleAuswahl)}>
                {aktuelleAuswahl.length === 0
                  ? t('verteilerdialoge.verteiler.ohneAnschluss')
                  : t('verteilerdialoge.verteiler.zuweisen')}
              </button>
            </>
          ) : (
            <button className="primaer" onClick={() => schliessen(null)}>
              {t('verteilerdialoge.allgemein.schliessen')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type VerteilerMitDaten = KomponentenObjekt & {
  verteiler: NonNullable<KomponentenObjekt['verteiler']>
}

interface KnotenBelegung {
  leitungen: string[]
  geraete: string
}

function ermittleBelegung(
  zeichnung: Zeichnung,
  verteiler: KomponentenObjekt,
  baum: VerteilerBaum,
  katalog: readonly CatalogComponent[],
  verteilerplaene: readonly Zeichnung[],
  t: Uebersetzer,
): Map<string, KnotenBelegung> {
  const leitungen = new Map<string, Set<number>>()
  for (const z of ermittleVerteilerZuweisungen(zeichnung, verteiler.id)) {
    const knoten = knotenZurZuweisung(baum, z.anschluss.kennzeichen, z.anschluss.anschluss)
    const schluessel =
      knoten?.schluessel ?? zuweisungsText({ kennzeichen: z.anschluss.kennzeichen })
    leitungen.set(schluessel, (leitungen.get(schluessel) ?? new Set()).add(z.leitung.nummer))
  }
  const geraete = new Map<string, string[]>()
  const zuordnungen = ermittleStromkreisZuordnungen(zeichnung, katalog, verteilerplaene)
  for (const blatt of zeichnung.blaetter) {
    for (const o of blatt.objekte) {
      if (o.type !== 'komponente') continue
      for (const z of zuordnungen.komponenten.get(o.id) ?? []) {
        if (z.verteilerId !== verteiler.id) continue
        const k = katalog.find((x) => x.id === o.catalogComponentId)
        const name = k
          ? aufgeloesteVariante(k, o.variantId, oberflaechensprache()).name
          : t('verteilerdialoge.verteiler.komponente')
        geraete.set(z.knoten, [...(geraete.get(z.knoten) ?? []), name])
      }
    }
  }
  const ergebnis = new Map<string, KnotenBelegung>()
  for (const schluessel of new Set([...leitungen.keys(), ...geraete.keys()])) {
    ergebnis.set(schluessel, {
      leitungen: [...(leitungen.get(schluessel) ?? [])]
        .sort((a, b) => a - b)
        .map(leitungsKennzeichen),
      geraete: geraeteZusammenfassung(geraete.get(schluessel) ?? []),
    })
  }
  return ergebnis
}

export function VerteilerInhalt({
  zeichnung,
  blattId,
  verteiler,
  katalog,
  auswahl,
  onAuswahl,
  bearbeitbar,
}: {
  zeichnung: Zeichnung
  blattId: string
  verteiler: VerteilerMitDaten
  katalog: readonly CatalogComponent[]
  auswahl: VerteilerAuswahl[] | null
  onAuswahl?: (auswahl: VerteilerAuswahl[]) => void
  bearbeitbar: boolean
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const stand = useVerknuepfung()
  const treffer = verteilerplanZu(stand, verteiler.verteiler.kennzeichen)
  const plan = treffer?.plan.zeichnung ?? null
  const baum = useMemo(
    () => baueVerteilerBaum(verteiler, katalog, plan),
    [verteiler, katalog, plan],
  )
  const belegung = useMemo(
    () => ermittleBelegung(zeichnung, verteiler, baum, katalog, verteilerplanZeichnungen(stand), t),
    [zeichnung, verteiler, baum, katalog, stand, t],
  )
  const bekannt = new Set(baum.betriebsmittel.map((b) => b.kennzeichen))
  const ohneGegenstueck = [...belegung.keys()].filter(
    (s) => belegung.get(s)!.leitungen.length > 0 && !bekannt.has(s.split(':')[0]),
  )
  const nurBestueckung = plan ? baum.betriebsmittel.filter((b) => !b.imPlan).length : 0
  const planBaum = plan?.verteilerAssistent?.bestueckung.length
    ? plan.verteilerAssistent.bestueckung
    : null
  const belegt = baum.knoten.filter((k) => (belegung.get(k.schluessel)?.leitungen.length ?? 0) > 0)
  const knxOffen = useMemo(
    () =>
      bearbeitbar && !auswahl
        ? planeKnxZuordnung({ zeichnung, verteiler, katalog, plan }).zuweisungen.length
        : 0,
    [bearbeitbar, auswahl, zeichnung, verteiler, katalog, plan],
  )

  return (
    <>
      <VerteilerKopf
        verteiler={verteiler}
        blattId={blattId}
        zeichnung={zeichnung}
        katalog={katalog}
        planName={treffer?.plan.dokument.name ?? null}
        planDokumentId={treffer?.plan.dokument.id ?? null}
        weiterePlaene={treffer?.weitere ?? 0}
        laedt={stand.laedt}
        anzahl={baum.knoten.length}
        belegt={belegt.length}
        mitErzeugen={bearbeitbar}
      />
      {plan && nurBestueckung > 0 && (
        <p className="dialog-hinweis verteiler-hinweis">
          {t('verteilerdialoge.verteiler.nurBestueckung', { n: nurBestueckung })}
        </p>
      )}
      {ohneGegenstueck.length > 0 && (
        <p className="dialog-hinweis verteiler-warnung">
          {t('verteilerdialoge.verteiler.ohneGegenstueck', { liste: ohneGegenstueck.join(', ') })}
        </p>
      )}
      {bearbeitbar && verteiler.verteiler.bestueckung.length === 0 && planBaum && (
        <p className="dialog-hinweis verteiler-hinweis">
          {t('verteilerdialoge.verteiler.planBaum', {
            name: String(treffer?.plan.dokument.name ?? ''),
            n: planBaum.length,
          })}{' '}
          <button
            onClick={() =>
              commands.execute(
                erzeugeBestueckungCommand(
                  doc,
                  blattId,
                  verteiler.id,
                  t('verteilerdialoge.verteiler.planBaumUndo'),
                  planBaum.map((e) => ({ ...e })),
                  new Map(),
                  new Set(),
                  {
                    netz: plan?.verteilerAssistent?.netz ?? 'drehstrom',
                    ...(plan?.verteilerAssistent
                      ? { art: plan.verteilerAssistent.angaben.art }
                      : {}),
                  },
                ),
              )
            }
          >
            {t('verteilerdialoge.verteiler.planBaumUebernehmen')}
          </button>
        </p>
      )}
      {bearbeitbar && !auswahl && (
        <p className="dialog-hinweis verteiler-hinweis">
          {knxOffen > 0
            ? t('verteilerdialoge.verteiler.knxOffen', { n: knxOffen })
            : t('verteilerdialoge.verteiler.knxHinweis')}{' '}
          <button
            onClick={() =>
              useUiStore.getState().setKnxZuordnen({ blattId, objektId: verteiler.id })
            }
          >
            {t('verteilerdialoge.verteiler.knxZuordnenKnopf')}
          </button>
        </p>
      )}
      {bearbeitbar && !auswahl && (
        <p className="dialog-hinweis verteiler-hinweis">
          {plan
            ? t('verteilerdialoge.verteiler.raeumeMitPlan')
            : t('verteilerdialoge.verteiler.raeumeOhnePlan')}{' '}
          <button
            onClick={() =>
              useUiStore.getState().setRaeumeVorschlagen({ blattId, objektId: verteiler.id })
            }
          >
            {t('verteilerdialoge.verteiler.raeumeKnopf')}
          </button>
        </p>
      )}
      {auswahl ? (
        <BaumAuswahl
          baum={baum}
          belegung={belegung}
          auswahl={auswahl}
          onAuswahl={(a) => onAuswahl?.(a)}
        />
      ) : (
        <BaumBearbeiten
          quelle={verteilerQuelle(doc, commands, blattId, verteiler)}
          baum={baum}
          belegung={belegung}
          katalog={katalog}
          bearbeitbar={bearbeitbar}
          mitPlan={plan !== null}
          netz={netzVon(verteiler.verteiler)}
        />
      )}
    </>
  )
}

function VerteilerKopf({
  verteiler,
  blattId,
  zeichnung,
  katalog,
  planName,
  planDokumentId,
  weiterePlaene,
  laedt,
  anzahl,
  belegt,
  mitErzeugen,
}: {
  verteiler: KomponentenObjekt
  blattId: string
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  planName: string | null
  planDokumentId: string | null
  weiterePlaene: number
  laedt: boolean
  anzahl: number
  belegt: number
  mitErzeugen: boolean
}) {
  const t = useT()
  const { oeffneDokument, doc, commands } = useAppContext()
  const eintrag = katalog.find((k) => k.id === verteiler.catalogComponentId)
  const name = eintrag
    ? aufgeloesteVariante(eintrag, verteiler.variantId, oberflaechensprache()).name
    : t('verteilerdialoge.verteiler.titel')
  const blatt = zeichnung.blaetter.find((b) => b.id === blattId)
  const [planVor, planNach = ''] = t('verteilerdialoge.verteiler.plan', { name: '\u0000' }).split(
    '\u0000',
  )
  return (
    <div className="verteiler-kopf">
      <div className="verteiler-kopf-zeile">
        <span>
          {name} · {blatt?.name ?? ''}
        </span>
        <span className="switchport-kennzahlen">
          {t('verteilerdialoge.verteiler.knotenBelegt', { belegt, anzahl })}
        </span>
      </div>
      <div className="verteiler-kopf-zeile">
        <label className="dialog-feld">
          {t('verteilerdialoge.raeume.netz')}
          <select
            value={netzVon(verteiler.verteiler)}
            disabled={!mitErzeugen}
            onChange={(e) =>
              commands.execute(
                erzeugeBestueckungCommand(
                  doc,
                  blattId,
                  verteiler.id,
                  t('verteilerdialoge.verteiler.netzartUndo'),
                  verteiler.verteiler?.bestueckung ?? [],
                  new Map(),
                  new Set(),
                  { netz: e.target.value as VerteilerNetz },
                ),
              )
            }
          >
            <option value="drehstrom">{t('verteilerdialoge.verteiler.drehstrom')}</option>
            <option value="wechselstrom">{t('verteilerdialoge.verteiler.wechselstrom')}</option>
          </select>
        </label>
        <label className="dialog-feld">
          {t('verteilerdialoge.raeume.art')}
          <select
            value={artVon(verteiler.verteiler)}
            disabled={!mitErzeugen}
            onChange={(e) =>
              commands.execute(
                erzeugeBestueckungCommand(
                  doc,
                  blattId,
                  verteiler.id,
                  t('verteilerdialoge.verteiler.artUndo'),
                  verteiler.verteiler?.bestueckung ?? [],
                  new Map(),
                  new Set(),
                  { art: e.target.value as VerteilerArt },
                ),
              )
            }
          >
            {VERTEILER_ARTEN.map((a) => (
              <option key={a.art} value={a.art}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="verteiler-kopf-zeile verteiler-plan">
        {planName ? (
          <>
            <span>
              {planVor}
              <strong>{planName}</strong>
              {planNach}
              {weiterePlaene > 0 &&
                ` ${t('verteilerdialoge.verteiler.weiterePlaene', { n: weiterePlaene })}`}
            </span>
            <button
              onClick={() => {
                useUiStore.getState().schliesseVerteilerDialog()
                if (planDokumentId) void oeffneDokument(planDokumentId)
              }}
            >
              {t('verteilerdialoge.schaltplanZuordnen.oeffnen')}
            </button>
          </>
        ) : (
          <>
            <span>
              {laedt
                ? t('verteilerdialoge.verteiler.plaeneLesen')
                : t('verteilerdialoge.verteiler.keinPlan')}
            </span>
            {!laedt && mitErzeugen && (
              <>
                <button
                  onClick={() => {
                    useUiStore.getState().schliesseVerteilerDialog()
                    useUiStore.getState().setVerteilerplanErzeugen({
                      art: 'verteiler',
                      blattId,
                      objektId: verteiler.id,
                    })
                  }}
                >
                  {t('verteilerdialoge.verteiler.planErzeugenKnopf')}
                </button>
                <button
                  onClick={() => {
                    useUiStore.getState().schliesseVerteilerDialog()
                    useUiStore.getState().setSchaltplanZuordnen({ blattId, objektId: verteiler.id })
                  }}
                >
                  {t('verteilerdialoge.verteiler.schaltplanZuordnenKnopf')}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function geraeteName(
  t: Uebersetzer,
  katalog: readonly CatalogComponent[],
  geraet: VerteilerBetriebsmittel,
  kanal?: string,
): string {
  const name = geraet.knxAktor
    ? knxAktorTitel(geraet.knxAktor)
    : (katalog.find((k) => k.id === geraet.catalogComponentId)?.name ??
      t('verteilerdialoge.verteiler.katalogeintragFehlt'))
  if (!kanal) return name
  const index = geraet.knxAktor ? knxKanalIndexAusName(kanal) : null
  if (index === null || !geraet.knxAktor)
    return t('verteilerdialoge.verteiler.kanalName', { kanal, name })
  const { funktion, teil } = knxKanalFunktionsText(geraet.knxAktor, index)
  const paar = knxPaarBeginn(geraet.knxAktor, index) === index ? `/${knxKanalName(index + 1)}` : ''
  return t('verteilerdialoge.verteiler.kanalFunktion', {
    kanal: `${kanal}${paar}`,
    funktion: `${funktion}${teil && !paar ? ` (${teil})` : ''}`,
    name,
  })
}

function istLeiste(geraet: VerteilerBetriebsmittel): boolean {
  return geraet.buchstabe === 'X' && !geraet.eintragId && !geraet.imPlan
}

function knotenName(
  t: Uebersetzer,
  katalog: readonly CatalogComponent[],
  k: VerteilerKnoten,
): string {
  if (!k.kanal || !istLeiste(k.geraet)) return geraeteName(t, katalog, k.geraet, k.kanal)
  return (
    katalog.find((c) => c.id === k.eintrag.catalogComponentId)?.name ??
    t('verteilerdialoge.verteiler.katalogeintragFehlt')
  )
}

function zeilenInfo(k: VerteilerKnoten): string {
  return [k.kanal ? null : typText(k.geraet), k.eintrag.phase].filter(Boolean).join(' · ')
}

function BaumAuswahl({
  baum,
  belegung,
  auswahl,
  onAuswahl,
}: {
  baum: VerteilerBaum
  belegung: Map<string, KnotenBelegung>
  auswahl: VerteilerAuswahl[]
  onAuswahl: (auswahl: VerteilerAuswahl[]) => void
}) {
  const t = useT()
  const katalog = useKatalogStore((s) => s.komponenten)
  const [suche, setSuche] = useState('')
  const begriff = suche.trim().toLowerCase()
  const sichtbar = useMemo(() => {
    if (!begriff) return null
    const ergebnis = new Set<VerteilerKnoten>()
    for (const k of baum.knoten) {
      const text = [k.schluessel, k.eintrag.bezeichnung ?? '', typText(k.geraet)]
        .join(' ')
        .toLowerCase()
      if (!text.includes(begriff)) continue
      for (let v: VerteilerKnoten | null = k; v; v = v.eltern) ergebnis.add(v)
    }
    return ergebnis
  }, [baum, begriff])
  const gewaehlt = (k: VerteilerKnoten) =>
    auswahl.some((a) => knotenZurZuweisung(baum, a.kennzeichen, a.anschluss) === k)
  function umschalten(k: VerteilerKnoten) {
    onAuswahl(
      gewaehlt(k)
        ? auswahl.filter((a) => knotenZurZuweisung(baum, a.kennzeichen, a.anschluss) !== k)
        : [
            ...auswahl,
            k.kanal
              ? { kennzeichen: k.kennzeichen, anschluss: k.kanal }
              : { kennzeichen: k.kennzeichen },
          ],
    )
  }
  const ohnePlatz = baum.nichtEingeordnet
  const ganzGewaehlt = (b: VerteilerBetriebsmittel) =>
    auswahl.some((a) => a.kennzeichen === b.kennzeichen && !a.anschluss)
  const zeilen = baum.knoten.filter((k) => !sichtbar || sichtbar.has(k))

  if (baum.knoten.length === 0 && ohnePlatz.length === 0) {
    return (
      <p className="dialog-hinweis verteiler-leer">
        {t('verteilerdialoge.verteiler.nochLeerAuswahl')}
      </p>
    )
  }
  return (
    <>
      <div className="verteiler-suche">
        <input
          type="search"
          value={suche}
          placeholder={t('verteilerdialoge.verteiler.suchen')}
          onChange={(e) => setSuche(e.target.value)}
          autoFocus
        />
      </div>
      <p className="dialog-hinweis">{t('verteilerdialoge.verteiler.auswahlHinweis')}</p>
      <div className="verteiler-baum-rahmen">
        <table className="verteiler-baum verteiler-baum-auswahl">
          <tbody>
            {zeilen.map((k) => {
              const b = belegung.get(k.schluessel)
              const an = gewaehlt(k)
              return (
                <tr
                  key={k.schluessel}
                  className={`verteiler-baum-zeile waehlbar${an ? ' gewaehlt' : ''}${k.rolle === 'klemme' ? ' klemme' : ''}`}
                  onClick={() => umschalten(k)}
                  aria-selected={an}
                >
                  <td className="verteiler-baum-wahl">{an ? '☑' : '☐'}</td>
                  <td
                    className="verteiler-baum-kennzeichen"
                    style={{ paddingLeft: 6 + k.tiefe * 18 }}
                  >
                    -{k.schluessel}
                  </td>
                  <td className="verteiler-baum-beschriftung">{k.eintrag.bezeichnung ?? ''}</td>
                  <td className="verteiler-baum-info">
                    {[knotenName(t, katalog, k), zeilenInfo(k)].filter(Boolean).join(' · ')}
                  </td>
                  <td className="verteiler-baum-leitungen" title={b?.geraete || undefined}>
                    {b?.leitungen.join(', ') ?? ''}
                  </td>
                </tr>
              )
            })}
            {ohnePlatz.map((g) => {
              const an = ganzGewaehlt(g)
              return (
                <tr
                  key={`ohne-${g.kennzeichen}`}
                  className={`verteiler-baum-zeile waehlbar ohne-platz${an ? ' gewaehlt' : ''}`}
                  onClick={() =>
                    onAuswahl(
                      an
                        ? auswahl.filter((a) => !(a.kennzeichen === g.kennzeichen && !a.anschluss))
                        : [...auswahl, { kennzeichen: g.kennzeichen }],
                    )
                  }
                  aria-selected={an}
                >
                  <td className="verteiler-baum-wahl">{an ? '☑' : '☐'}</td>
                  <td className="verteiler-baum-kennzeichen">-{g.kennzeichen}</td>
                  <td className="verteiler-baum-beschriftung">{g.bezeichnung ?? ''}</td>
                  <td className="verteiler-baum-info">
                    {t('verteilerdialoge.verteiler.nochNichtEingeordnet', {
                      name: geraeteName(t, katalog, g),
                    })}
                  </td>
                  <td className="verteiler-baum-leitungen">
                    {belegung.get(g.kennzeichen)?.leitungen.join(', ') ?? ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {zeilen.length === 0 && ohnePlatz.length === 0 && (
          <p className="dialog-hinweis">{t('verteilerdialoge.verteiler.nichtsGefunden')}</p>
        )}
      </div>
      {auswahl.length > 0 && <AuswahlListe baum={baum} auswahl={auswahl} onAuswahl={onAuswahl} />}
    </>
  )
}

function AuswahlListe({
  baum,
  auswahl,
  onAuswahl,
}: {
  baum: VerteilerBaum
  auswahl: VerteilerAuswahl[]
  onAuswahl: (auswahl: VerteilerAuswahl[]) => void
}) {
  const t = useT()
  return (
    <table className="switchport-tabelle verteiler-auswahl">
      <thead>
        <tr>
          <th>{t('verteilerdialoge.verteiler.gewaehlt')}</th>
          <th>{t('verteilerdialoge.verteiler.ader')}</th>
          <th className="switchport-spalte-aktion" />
        </tr>
      </thead>
      <tbody>
        {auswahl.map((a, i) => {
          const knoten = knotenZurZuweisung(baum, a.kennzeichen, a.anschluss)
          return (
            <tr key={`${a.kennzeichen}:${a.anschluss ?? ''}`}>
              <td>
                {knoten
                  ? stromwegText(ermittleStromweg(knoten))
                  : zuweisungsText({ kennzeichen: a.kennzeichen, anschluss: a.anschluss })}
              </td>
              <td>
                <input
                  className="switchport-beschriftung"
                  value={a.ader ?? ''}
                  placeholder={t('verteilerdialoge.verteiler.aderBeispiel')}
                  onChange={(e) =>
                    onAuswahl(
                      auswahl.map((x, j) =>
                        j === i
                          ? { ...x, ader: e.target.value.trim() ? e.target.value : undefined }
                          : x,
                      ),
                    )
                  }
                />
              </td>
              <td className="switchport-spalte-aktion">
                <button
                  className="switchport-trennen"
                  onClick={() => onAuswahl(auswahl.filter((_, j) => j !== i))}
                >
                  {t('verteilerdialoge.verteiler.entfernen')}
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

type Gezogen = { art: 'knoten'; id: string } | { art: 'plan'; kennzeichen: string; kanal?: string }

type Offen =
  | { art: 'menue'; elternId: string | null }
  | { art: 'stromkreise'; elternId: string | null }
  | { art: 'kanal'; elternId: string | null }
  | { art: 'vorgeschaltet'; id: string }

const WURZEL = '__einspeisung__'

export interface BestueckungsQuelle {
  liste: BestueckungsEintrag[]
  aktuelleListe(): BestueckungsEintrag[] | null
  schreibe(
    label: string,
    neu: BestueckungsEintrag[],
    umbenannt?: ReadonlyMap<string, string>,
    entfernt?: ReadonlySet<string>,
  ): void
}

function verteilerQuelle(
  doc: AppKontext['doc'],
  commands: AppKontext['commands'],
  blattId: string,
  verteiler: VerteilerMitDaten,
): BestueckungsQuelle {
  return {
    liste: verteiler.verteiler.bestueckung,
    aktuelleListe() {
      const aktuell = doc.getBlatt(blattId)?.objekte.find((o) => o.id === verteiler.id)
      return aktuell && istVerteiler(aktuell) ? aktuell.verteiler.bestueckung : null
    },
    schreibe(label, neu, umbenannt, entfernt) {
      commands.execute(
        erzeugeBestueckungCommand(doc, blattId, verteiler.id, label, neu, umbenannt, entfernt),
      )
    },
  }
}

export function BaumBearbeiten({
  quelle,
  baum,
  belegung,
  katalog,
  bearbeitbar,
  mitPlan,
  netz,
}: {
  quelle: BestueckungsQuelle
  baum: VerteilerBaum
  belegung: ReadonlyMap<string, KnotenBelegung>
  katalog: readonly CatalogComponent[]
  bearbeitbar: boolean
  mitPlan: boolean
  netz: VerteilerNetz
}) {
  const t = useT()
  const liste = quelle.liste
  const [zu, setZu] = useState<ReadonlySet<string>>(new Set())
  const [offen, setOffen] = useState<Offen | null>(null)
  const [gezogen, setGezogen] = useState<Gezogen | null>(null)
  const [abwurf, setAbwurf] = useState<{ id: string; art: EinhaengeZiel['art'] } | null>(null)
  const aktuelleListe = () => quelle.aktuelleListe()
  const schreibe = quelle.schreibe

  const verborgen = new Set<string>()
  for (const id of zu) for (const n of nachfahren(liste, id)) verborgen.add(n)
  const zeilen = baum.knoten.filter((k) => !verborgen.has(k.eintrag.id))

  const alsGeraetAenderbar = (geraet: VerteilerBetriebsmittel) =>
    bearbeitbar && geraet.inBestueckung && !(mitPlan && geraet.imPlan)

  const klemmenOptionen = (): KlemmenOptionen => ({
    leiste: useUiStore.getState().klemmenLeiste,
    katalog,
  })

  function klemmeUmnummerieren(eintrag: BestueckungsEintrag, eingabe: string) {
    const r = leistenKlemmeUmnummeriert(liste, eintrag.id, eingabe, katalog)
    if (!r) return
    if ('fehler' in r) {
      useUiStore.getState().zeigeToast(r.fehler)
      return
    }
    const leiste = r.neu.split(':')[0]
    if (leiste !== eintrag.kennzeichen) useUiStore.getState().setKlemmenLeiste(leiste)
    schreibe(t('verteilerdialoge.verteiler.klemmeUndo'), r.liste, new Map([[r.alt, r.neu]]))
  }

  function leisteNummerieren(leiste: string) {
    const r = leisteNeuNummeriert(liste, leiste)
    if (r.umbenannt.size === 0) {
      useUiStore.getState().zeigeToast(t('verteilerdialoge.verteiler.schonNummeriert', { leiste }))
      return
    }
    schreibe(t('verteilerdialoge.verteiler.nummerierenUndo'), r.liste, r.umbenannt)
  }

  const alteKlemmen = bearbeitbar && !mitPlan ? einzelklemmen(liste) : []
  const klemmenLeiste = useUiStore((s) => s.klemmenLeiste)
  function inLeisteUeberfuehren() {
    const leiste = klemmenLeiste
    const r = einzelklemmenInLeiste(liste, katalog, leiste)
    if (r.umbenannt.size === 0) {
      useUiStore.getState().zeigeToast(t('verteilerdialoge.verteiler.leisteIstGeraet', { leiste }))
      return
    }
    schreibe(t('verteilerdialoge.verteiler.ueberfuehrenUndo'), r.liste, r.umbenannt)
  }

  function umbenennen(eintrag: BestueckungsEintrag, eingabe: string) {
    const neu = bestueckungUmbenennen(liste, eintrag.id, eingabe)
    if (!neu) {
      useUiStore
        .getState()
        .zeigeToast(
          t('verteilerdialoge.verteiler.kennzeichenVergeben', { kennzeichen: eingabe.trim() }),
        )
      return
    }
    const kennzeichen = eingabe.trim()
    if (kennzeichen === eintrag.kennzeichen) return
    schreibe(
      t('verteilerdialoge.verteiler.kennzeichenUndo'),
      neu,
      new Map([[eintrag.kennzeichen, kennzeichen]]),
    )
  }

  function entfernen(eintrag: BestueckungsEintrag, name: string) {
    const kinder = nachfahren(liste, eintrag.id).size > 0
    const nur = bestueckungEntfernen(liste, new Set([eintrag.id]), false)
    const alles = bestueckungEntfernen(liste, new Set([eintrag.id]), true)
    const loeseZaehlen = (entfernt: ReadonlySet<string>) =>
      [...belegung]
        .filter(
          ([s, b]) => (entfernt.has(s) || entfernt.has(s.split(':')[0])) && b.leitungen.length > 0,
        )
        .reduce((n, [, b]) => n + b.leitungen.length, 0)
    const ausfuehren = (r: typeof nur) =>
      schreibe(
        t('verteilerdialoge.verteiler.entfernenUndo'),
        r.liste,
        undefined,
        r.entfernteGeraete,
      )
    const geloest = loeseZaehlen(nur.entfernteGeraete)
    if (!kinder && geloest === 0) {
      ausfuehren(nur)
      return
    }
    const hinweis =
      geloest > 0 ? t('verteilerdialoge.verteiler.entfernenLeitungen', { name, n: geloest }) : ''
    useUiStore.getState().oeffneBestaetigung({
      titel: t('verteilerdialoge.verteiler.entfernenTitel', { name }),
      nachricht: kinder
        ? [t('verteilerdialoge.verteiler.entfernenKinder', { name }), hinweis]
            .filter(Boolean)
            .join(' ')
        : hinweis,
      bestaetigenText: kinder
        ? t('verteilerdialoge.verteiler.nurDiesen')
        : t('verteilerdialoge.verteiler.entfernen'),
      ...(kinder
        ? {
            alternative: {
              text: t('verteilerdialoge.verteiler.mitAllem'),
              callback: () => ausfuehren(alles),
            },
          }
        : {}),
      callback: (bestaetigt) => {
        if (bestaetigt) ausfuehren(nur)
      },
    })
  }

  function betriebsmittelDahinter(elternId: string | null) {
    setOffen(null)
    useUiStore.getState().oeffneKomponentenPicker(
      (gewaehlt) => {
        const eintrag = gewaehlt && katalog.find((k) => k.id === gewaehlt.catalogComponentId)
        if (!eintrag) return
        if (!passtZumNetz(eintrag, netz)) {
          meldeFalschesNetz(t, eintrag)
          return
        }
        if (knxAktorArtVonKatalogId(eintrag.id)) {
          const bestand = aktuelleListe()
          if (!bestand) return
          neuesKanalGeraet(t, bestand, eintrag, (neu) => {
            const eingeordnet = kanalEinordnen(
              [...bestand, neu],
              neu.id,
              knxKanalName(0),
              elternId ?? undefined,
            )
            if (eingeordnet)
              schreibe(t('verteilerdialoge.verteiler.knxHinzufuegenUndo'), eingeordnet)
          })
          return
        }
        useUiStore.getState().oeffneEingabeDialog(
          {
            titel: t('verteilerdialoge.verteiler.hinzufuegenTitel'),
            label: t('verteilerdialoge.verteiler.anzahl', {
              name: komponentenText(eintrag, 'name', oberflaechensprache()),
            }),
            anfangswert: '1',
            typ: 'zahl',
          },
          (wert) => {
            const anzahl = Math.min(96, Math.max(0, Math.round(Number(wert))))
            if (!wert || !Number.isFinite(anzahl) || anzahl < 1) return
            const bestand = aktuelleListe()
            if (!bestand) return
            schreibe(t('verteilerdialoge.verteiler.hinzufuegenTitel'), [
              ...bestand,
              ...neueBestueckungsEintraege(
                bestand,
                eintrag,
                anzahl,
                elternId ?? undefined,
                klemmenOptionen(),
              ),
            ])
          },
        )
      },
      {
        filter: 'betriebsmittel',
        titel: t('verteilerdialoge.verteiler.waehlenTitel'),
        bestaetigenText: t('verteilerdialoge.verteiler.weiter'),
      },
    )
  }

  function knxBearbeiten(eintrag: BestueckungsEintrag) {
    if (!eintrag.knxAktor) return
    useUiStore.getState().oeffneKnxAktorDialog({
      daten: eintrag.knxAktor,
      mitBeschriftung: false,
      titel: t('verteilerdialoge.verteiler.kanaeleBearbeiten', {
        kennzeichen: eintrag.kennzeichen,
      }),
      bestaetigenText: t('verteilerdialoge.allgemein.uebernehmen'),
      callback: (ergebnis) => {
        const bestand = aktuelleListe()
        if (!ergebnis || !bestand) return
        const daten = ergebnis.daten
        const blockiert = bestand
          .filter((e) => e.kennzeichen === eintrag.kennzeichen && e.kanal)
          .filter((e) => {
            const i = knxKanalIndexAusName(e.kanal!)
            if (i === null) return false
            const beginn = knxPaarBeginn(daten, i)
            return i >= daten.baugroesse || (beginn !== null && beginn !== i)
          })
        if (blockiert.length > 0) {
          useUiStore.getState().zeigeToast(
            t('verteilerdialoge.verteiler.kanalFieleWeg', {
              liste: blockiert.map((e) => `${e.kennzeichen}:${e.kanal}`).join(', '),
            }),
          )
          return
        }
        schreibe(
          t('verteilerdialoge.verteiler.knxAendernUndo'),
          bestand.map((e) => (e.id === eintrag.id ? { ...e, knxAktor: daten } : e)),
        )
      },
    })
  }

  function einhaengen(id: string, ziel: EinhaengeZiel) {
    const neu = bestueckungEinhaengen(liste, id, ziel)
    if (neu) schreibe(t('verteilerdialoge.verteiler.umhaengenUndo'), neu)
  }

  function erlaubt(ziel: string, art: EinhaengeZiel['art']): boolean {
    if (!gezogen) return false
    if (gezogen.art === 'plan') return true
    if (ziel === WURZEL) return art === 'kind'
    if (ziel === gezogen.id) return false
    return !nachfahren(liste, gezogen.id).has(ziel)
  }

  function zoneAus(e: DragEvent<HTMLElement>, ziel: string): EinhaengeZiel['art'] {
    if (ziel === WURZEL) return 'kind'
    const r = e.currentTarget.getBoundingClientRect()
    const anteil = (e.clientY - r.top) / Math.max(1, r.height)
    return anteil < 0.25 ? 'davor' : anteil > 0.75 ? 'dahinter' : 'kind'
  }

  function ueber(e: DragEvent<HTMLElement>, ziel: string) {
    const art = zoneAus(e, ziel)
    if (!erlaubt(ziel, art)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (abwurf?.id !== ziel || abwurf.art !== art) setAbwurf({ id: ziel, art })
  }

  function ablegen(e: DragEvent<HTMLElement>, ziel: string) {
    e.preventDefault()
    const art = zoneAus(e, ziel)
    const was = gezogen
    setGezogen(null)
    setAbwurf(null)
    if (!was || !erlaubt(ziel, art)) return
    const zielId = ziel === WURZEL ? null : ziel
    const einhaengeZiel: EinhaengeZiel = art === 'kind' ? { art, zielId } : { art, zielId: zielId! }
    if (was.art === 'knoten') {
      einhaengen(was.id, einhaengeZiel)
      return
    }
    const g = was.kanal
      ? baum.nichtEingeordneteKlemmen.find(
          (k) => k.kennzeichen === was.kennzeichen && k.kanal === was.kanal,
        )?.geraet
      : baum.nichtEingeordnet.find((b) => b.kennzeichen === was.kennzeichen)
    if (!g?.catalogComponentId) return
    const mitEintrag = planGeraetAufnehmen(liste, {
      kennzeichen: g.kennzeichen,
      catalogComponentId: g.catalogComponentId,
      ...(was.kanal ? { kanal: was.kanal } : {}),
    })
    const neu = mitEintrag[mitEintrag.length - 1]
    const eingehaengt = bestueckungEinhaengen(mitEintrag, neu.id, einhaengeZiel) ?? mitEintrag
    schreibe(t('verteilerdialoge.verteiler.einordnenUndo'), eingehaengt)
  }

  const abwurfKlasse = (id: string) => (abwurf?.id === id ? ` abwurf-${abwurf.art}` : '')

  const spalten = bearbeitbar ? 9 : 8
  const zusatzZeile = (elternId: string | null, ebene: number) => {
    if (!offen || offen.art === 'vorgeschaltet' || offen.elternId !== elternId) return null
    const einzug = { paddingLeft: 8 + ebene * 18 }
    return (
      <tr className="verteiler-baum-zusatz">
        <td colSpan={spalten} style={einzug}>
          {offen.art === 'menue' && (
            <div className="verteiler-menue">
              {!mitPlan && (
                <>
                  <button onClick={() => betriebsmittelDahinter(elternId)}>
                    {t('verteilerdialoge.verteiler.betriebsmittelDahinter')}
                  </button>
                  <button onClick={() => setOffen({ art: 'stromkreise', elternId })}>
                    {t('verteilerdialoge.verteiler.stromkreiseDahinter')}
                  </button>
                </>
              )}
              <button onClick={() => setOffen({ art: 'kanal', elternId })}>
                {t('verteilerdialoge.verteiler.kanalDahinter')}
              </button>
              <button className="verteiler-menue-abbrechen" onClick={() => setOffen(null)}>
                {t('verteilerdialoge.allgemein.abbrechen')}
              </button>
            </div>
          )}
          {offen.art === 'stromkreise' && (
            <StromkreiseFormular
              katalog={katalog.filter((k) => passtZumNetz(k, netz))}
              onAbbrechen={() => setOffen(null)}
              onAnlegen={(schutz, klemme, anzahl) => {
                setOffen(null)
                schreibe(t('verteilerdialoge.verteiler.stromkreiseUndo'), [
                  ...liste,
                  ...neueStromkreise(
                    liste,
                    schutz,
                    klemme,
                    anzahl,
                    elternId ?? undefined,
                    klemmenOptionen(),
                  ),
                ])
              }}
            />
          )}
          {offen.art === 'kanal' && (
            <KanalFormular
              baum={baum}
              liste={liste}
              katalog={katalog}
              onAbbrechen={() => setOffen(null)}
              onEinordnen={(neu, label) => {
                setOffen(null)
                schreibe(label, neu)
              }}
              elternId={elternId}
              aktuelleListe={aktuelleListe}
              klemmenOptionen={klemmenOptionen}
            />
          )}
        </td>
      </tr>
    )
  }

  return (
    <>
      {alteKlemmen.length > 0 && (
        <p className="dialog-hinweis verteiler-hinweis">
          {t('verteilerdialoge.verteiler.alteKlemmen', {
            n: alteKlemmen.length,
            liste: alteKlemmen.map((e) => e.kennzeichen).join(', '),
          })}{' '}
          <button onClick={inLeisteUeberfuehren}>
            {t('verteilerdialoge.verteiler.inLeisteKnopf', { leiste: klemmenLeiste })}
          </button>
        </p>
      )}
      <div className="verteiler-baum-rahmen">
        <table className="verteiler-baum">
          <thead>
            <tr>
              {bearbeitbar && <th className="verteiler-baum-griff" />}
              <th>{t('verteilerdialoge.verteiler.spalteKennzeichen')}</th>
              <th>{t('verteilerdialoge.switchPort.geraet')}</th>
              <th>{t('verteilerdialoge.verteiler.spalteTyp')}</th>
              <th>{t('verteilerdialoge.verteiler.spaltePhase')}</th>
              <th className="verteiler-baum-beschriftung">
                {t('verteilerdialoge.knxAktor.beschriftung')}
              </th>
              <th>{t('verteilerdialoge.verteiler.spalteLeitungen')}</th>
              <th>{t('verteilerdialoge.verteiler.spalteGeraete')}</th>
              <th className="switchport-spalte-aktion" />
            </tr>
          </thead>
          <tbody>
            <tr
              className={`verteiler-baum-zeile verteiler-einspeisung${abwurfKlasse(WURZEL)}`}
              onDragOver={(e) => ueber(e, WURZEL)}
              onDragLeave={() => setAbwurf(null)}
              onDrop={(e) => ablegen(e, WURZEL)}
            >
              {bearbeitbar && <td />}
              <td colSpan={7}>{t('verteilerdialoge.verteiler.einspeisung')}</td>
              <td className="switchport-spalte-aktion verteiler-aktionen">
                {bearbeitbar && (
                  <button
                    title={t('verteilerdialoge.verteiler.dahinterAnlegen')}
                    aria-label={t('verteilerdialoge.verteiler.hinterEinspeisung')}
                    onClick={() =>
                      setOffen(
                        offen?.art === 'menue' && offen.elternId === null
                          ? null
                          : { art: 'menue', elternId: null },
                      )
                    }
                  >
                    +
                  </button>
                )}
              </td>
            </tr>
            {zusatzZeile(null, 0)}
            {zeilen.map((k) => (
              <KnotenZeilen
                key={k.eintrag.id}
                k={k}
                baum={baum}
                liste={liste}
                katalog={katalog}
                belegung={belegung.get(k.schluessel)}
                bearbeitbar={bearbeitbar}
                mitPlan={mitPlan}
                zugeklappt={zu.has(k.eintrag.id)}
                onKlappen={() => {
                  const neu = new Set(zu)
                  if (neu.has(k.eintrag.id)) neu.delete(k.eintrag.id)
                  else neu.add(k.eintrag.id)
                  setZu(neu)
                }}
                alsGeraetAenderbar={alsGeraetAenderbar(k.geraet)}
                vorgeschaltetOffen={offen?.art === 'vorgeschaltet' && offen.id === k.eintrag.id}
                onGriffKlick={() =>
                  setOffen(
                    offen?.art === 'vorgeschaltet' && offen.id === k.eintrag.id
                      ? null
                      : { art: 'vorgeschaltet', id: k.eintrag.id },
                  )
                }
                onMenue={() =>
                  setOffen(
                    offen?.art === 'menue' && offen.elternId === k.eintrag.id
                      ? null
                      : { art: 'menue', elternId: k.eintrag.id },
                  )
                }
                onVorgeschaltet={(elternId) => {
                  setOffen(null)
                  einhaengen(k.eintrag.id, { art: 'kind', zielId: elternId })
                }}
                onUmbenennen={(w) =>
                  k.kanal ? klemmeUmnummerieren(k.eintrag, w) : umbenennen(k.eintrag, w)
                }
                onEntfernen={() => entfernen(k.eintrag, k.schluessel)}
                onAendern={(label, patch) =>
                  schreibe(label, bestueckungAendern(liste, k.eintrag.id, patch))
                }
                ziehen={{
                  start: (e) => {
                    e.dataTransfer.setData('text/plain', k.schluessel)
                    e.dataTransfer.effectAllowed = 'move'
                    setGezogen({ art: 'knoten', id: k.eintrag.id })
                  },
                  ende: () => {
                    setGezogen(null)
                    setAbwurf(null)
                  },
                  ueber: (e) => ueber(e, k.eintrag.id),
                  verlassen: () => setAbwurf(null),
                  ablegen: (e) => ablegen(e, k.eintrag.id),
                  klasse: abwurfKlasse(k.eintrag.id),
                }}
                zusatz={zusatzZeile(k.eintrag.id, k.tiefe + 1)}
              />
            ))}
          </tbody>
        </table>
        {baum.knoten.length === 0 && (
          <p className="dialog-hinweis verteiler-leer">
            {t('verteilerdialoge.verteiler.nochLeer')}
          </p>
        )}
      </div>
      <KanalGeraeteListe
        kanalGeraete={baum.kanalGeraete}
        katalog={katalog}
        bearbeitbar={bearbeitbar}
        aenderbar={(g) => alsGeraetAenderbar(g)}
        onUmbenennen={(eintrag, w) => umbenennen(eintrag, w)}
        onEntfernen={(eintrag) => entfernen(eintrag, eintrag.kennzeichen)}
        onNeuNummerieren={leisteNummerieren}
        onKnxBearbeiten={knxBearbeiten}
        onNeu={() =>
          useUiStore.getState().oeffneKomponentenPicker(
            (gewaehlt) => {
              const eintrag = gewaehlt && katalog.find((k) => k.id === gewaehlt.catalogComponentId)
              const bestand = aktuelleListe()
              if (!eintrag || !bestand) return
              if (istKlemmenKennzeichen(eintrag.kennzeichenBuchstabe)) {
                schreibe(t('verteilerdialoge.verteiler.klemmenUndo'), [
                  ...bestand,
                  ...neueBestueckungsEintraege(bestand, eintrag, 1, undefined, klemmenOptionen()),
                ])
                return
              }
              neuesKanalGeraet(t, bestand, eintrag, (neu) =>
                schreibe(t('verteilerdialoge.verteiler.kanalGeraetUndo'), [
                  ...bestand,
                  { ...neu, mitKanaelen: true },
                ]),
              )
            },
            {
              filter: 'betriebsmittel',
              titel: t('verteilerdialoge.verteiler.kanalGeraetWaehlen'),
              bestaetigenText: t('verteilerdialoge.verteiler.hinzufuegen'),
            },
          )
        }
        mitPlan={mitPlan}
      />
      {baum.nichtEingeordnet.length + baum.nichtEingeordneteKlemmen.length > 0 && (
        <div className="verteiler-abschnitt">
          <h3>{t('verteilerdialoge.verteiler.nichtEingeordnetTitel')}</h3>
          <p className="dialog-hinweis">
            {t('verteilerdialoge.verteiler.nichtEingeordnetHinweis')}
          </p>
          <div className="verteiler-chips-zeile">
            {baum.nichtEingeordnet.map((g) => (
              <span
                key={g.kennzeichen}
                className="verteiler-plan-chip"
                draggable={bearbeitbar}
                title={geraeteName(t, katalog, g)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', g.kennzeichen)
                  setGezogen({ art: 'plan', kennzeichen: g.kennzeichen })
                }}
                onDragEnd={() => {
                  setGezogen(null)
                  setAbwurf(null)
                }}
              >
                -{g.kennzeichen} {typText(g)}
              </span>
            ))}
            {baum.nichtEingeordneteKlemmen.map((k) => (
              <span
                key={`${k.kennzeichen}:${k.kanal}`}
                className="verteiler-plan-chip"
                draggable={bearbeitbar}
                title={geraeteName(t, katalog, k.geraet)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', `${k.kennzeichen}:${k.kanal}`)
                  setGezogen({ art: 'plan', kennzeichen: k.kennzeichen, kanal: k.kanal })
                }}
                onDragEnd={() => {
                  setGezogen(null)
                  setAbwurf(null)
                }}
              >
                -{k.kennzeichen}:{k.kanal}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

interface ZiehenHandler {
  start: (e: DragEvent<HTMLElement>) => void
  ende: () => void
  ueber: (e: DragEvent<HTMLElement>) => void
  verlassen: () => void
  ablegen: (e: DragEvent<HTMLElement>) => void
  klasse: string
}

function KnotenZeilen({
  k,
  baum,
  liste,
  katalog,
  belegung,
  bearbeitbar,
  mitPlan,
  zugeklappt,
  onKlappen,
  alsGeraetAenderbar,
  vorgeschaltetOffen,
  onGriffKlick,
  onMenue,
  onVorgeschaltet,
  onUmbenennen,
  onEntfernen,
  onAendern,
  ziehen,
  zusatz,
}: {
  k: VerteilerKnoten
  baum: VerteilerBaum
  liste: readonly BestueckungsEintrag[]
  katalog: readonly CatalogComponent[]
  belegung: KnotenBelegung | undefined
  bearbeitbar: boolean
  mitPlan: boolean
  zugeklappt: boolean
  onKlappen: () => void
  alsGeraetAenderbar: boolean
  vorgeschaltetOffen: boolean
  onGriffKlick: () => void
  onMenue: () => void
  onVorgeschaltet: (elternId: string | null) => void
  onUmbenennen: (wert: string) => void
  onEntfernen: () => void
  onAendern: (
    label: string,
    patch: Partial<Pick<BestueckungsEintrag, 'phase' | 'bezeichnung' | 'variablen'>>,
  ) => void
  ziehen: ZiehenHandler
  zusatz: ReactNode
}) {
  const t = useT()
  const katalogEintrag = katalog.find((c) => c.id === k.geraet.catalogComponentId)
  const mitTyp =
    !k.kanal && (katalogEintrag?.textElemente?.some((te) => te.variable === 'Typ') ?? false)
  const grau = mitPlan && !k.geraet.imPlan
  const klassen = [
    'verteiler-baum-zeile',
    k.rolle === 'klemme' ? 'klemme' : '',
    grau ? 'verteiler-grau' : '',
    ziehen.klasse.trim(),
  ]
    .filter(Boolean)
    .join(' ')
  const ausgeschlossen = nachfahren(liste, k.eintrag.id)
  const vorgeschaltetWahl = baum.knoten.filter((v) => v !== k && !ausgeschlossen.has(v.eintrag.id))
  const entfernbar = bearbeitbar && (k.kanal !== undefined || alsGeraetAenderbar)
  return (
    <>
      <tr
        className={klassen}
        onDragOver={ziehen.ueber}
        onDragLeave={ziehen.verlassen}
        onDrop={ziehen.ablegen}
        title={grau ? t('verteilerdialoge.verteiler.nichtImPlan') : undefined}
      >
        {bearbeitbar && (
          <td className="verteiler-baum-griff">
            <span
              className="verteiler-griff"
              draggable
              role="button"
              tabIndex={0}
              title={t('verteilerdialoge.verteiler.griffTitel')}
              onDragStart={ziehen.start}
              onDragEnd={ziehen.ende}
              onClick={onGriffKlick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onGriffKlick()
              }}
            >
              ⠿
            </span>
          </td>
        )}
        <td className="verteiler-baum-kennzeichen" style={{ paddingLeft: 4 + k.tiefe * 18 }}>
          <span className="verteiler-baum-kennzeichen-innen">
            {k.kinder.length > 0 ? (
              <button
                className="verteiler-klappe"
                aria-label={
                  zugeklappt
                    ? t('verteilerdialoge.verteiler.aufklappen')
                    : t('verteilerdialoge.verteiler.zuklappen')
                }
                onClick={onKlappen}
              >
                {zugeklappt ? '▸' : '▾'}
              </button>
            ) : (
              <span className="verteiler-klappe-platz" />
            )}
            {alsGeraetAenderbar && (!k.kanal || istLeiste(k.geraet)) ? (
              <EntwurfsTextfeld wert={k.schluessel} onUebernehmen={onUmbenennen} />
            ) : (
              <span className="verteiler-kennzeichen">-{k.schluessel}</span>
            )}
          </span>
        </td>
        <td className="verteiler-baum-geraet">{knotenName(t, katalog, k)}</td>
        <td className="verteiler-baum-typ">
          {alsGeraetAenderbar && mitTyp ? (
            <EntwurfsTextfeld
              wert={k.geraet.variablen.Typ ?? ''}
              onUebernehmen={(w) =>
                onAendern(t('verteilerdialoge.verteiler.typUndo'), {
                  variablen: { ...(k.eintrag.variablen ?? {}), Typ: w },
                })
              }
            />
          ) : k.kanal ? (
            ''
          ) : (
            typText(k.geraet)
          )}
        </td>
        <td className="verteiler-baum-phase">
          {bearbeitbar && !k.kanal && brauchtPhase(k.kennzeichen, k.geraet.anschluesse) ? (
            <select
              value={k.eintrag.phase ?? ''}
              onChange={(e) =>
                onAendern(t('verteilerdialoge.verteiler.phaseUndo'), {
                  phase: (e.target.value || undefined) as Phase | undefined,
                })
              }
            >
              <option value="">–</option>
              {PHASEN.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            (k.eintrag.phase ?? '')
          )}
        </td>
        <td className="verteiler-baum-beschriftung">
          {bearbeitbar ? (
            <EntwurfsTextfeld
              wert={k.eintrag.bezeichnung ?? ''}
              platzhalter={
                k.rolle === 'klemme'
                  ? t('verteilerdialoge.verteiler.beschriftungBeispiel')
                  : t('verteilerdialoge.knxAktor.beschriftung')
              }
              onUebernehmen={(w) =>
                onAendern(t('verteilerdialoge.verteiler.beschriftungUndo'), {
                  bezeichnung: w.trim(),
                })
              }
            />
          ) : (
            (k.eintrag.bezeichnung ?? '')
          )}
        </td>
        <td className="verteiler-baum-leitungen">{belegung?.leitungen.join(', ') ?? ''}</td>
        <td className="verteiler-baum-geraete" title={belegung?.geraete || undefined}>
          {belegung?.geraete ?? ''}
        </td>
        <td className="switchport-spalte-aktion verteiler-aktionen">
          {bearbeitbar && (
            <button
              title={t('verteilerdialoge.verteiler.dahinterAnlegen')}
              aria-label={t('verteilerdialoge.verteiler.hinterKnoten', { knoten: k.schluessel })}
              onClick={onMenue}
            >
              +
            </button>
          )}
          {entfernbar && (
            <button
              className="switchport-trennen"
              title={t('verteilerdialoge.verteiler.entfernen')}
              aria-label={t('verteilerdialoge.verteiler.knotenEntfernen', { name: k.schluessel })}
              onClick={onEntfernen}
            >
              ✕
            </button>
          )}
        </td>
      </tr>
      {vorgeschaltetOffen && (
        <tr className="verteiler-baum-zusatz">
          <td colSpan={9} style={{ paddingLeft: 8 + (k.tiefe + 1) * 18 }}>
            <label className="verteiler-vorgeschaltet">
              {t('verteilerdialoge.verteiler.vorgeschaltet')}{' '}
              <select
                value={k.eltern?.eintrag.id ?? ''}
                onChange={(e) => onVorgeschaltet(e.target.value || null)}
                autoFocus
              >
                <option value="">{t('verteilerdialoge.verteiler.einspeisung')}</option>
                {vorgeschaltetWahl.map((v) => (
                  <option key={v.eintrag.id} value={v.eintrag.id}>
                    {' '.repeat(v.tiefe * 2)}-{v.schluessel}
                    {v.eintrag.bezeichnung ? ` ${v.eintrag.bezeichnung}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </td>
        </tr>
      )}
      {zusatz}
    </>
  )
}

const STANDARD_SCHUTZ_ID = 'leitungsschutzschalter-1-polig'
const STANDARD_KLEMME_ID = 'abgangsklemme-1p-n-pe'

function meldeFalschesNetz(t: Uebersetzer, eintrag: CatalogComponent) {
  useUiStore.getState().oeffneBestaetigung({
    titel: t('verteilerdialoge.verteiler.falschesNetzTitel'),
    nachricht: t('verteilerdialoge.verteiler.falschesNetz', {
      name: komponentenText(eintrag, 'name', oberflaechensprache()),
    }),
    bestaetigenText: t('verteilerdialoge.verteiler.ok'),
    destruktiv: false,
    ohneAbbrechen: true,
    callback: () => {},
  })
}

function StromkreiseFormular({
  katalog,
  onAnlegen,
  onAbbrechen,
}: {
  katalog: readonly CatalogComponent[]
  onAnlegen: (schutz: CatalogComponent, klemme: CatalogComponent | null, anzahl: number) => void
  onAbbrechen: () => void
}) {
  const t = useT()
  const { settingsStore } = useAppContext()
  const gemerkt = useSettingsStore((s) => s.verteilerplanEinstellungen)
  const schutzListe = katalog.filter(
    (k) => k.kennzeichenBuchstabe?.trim() === 'F' && !istFehlerstromSchutzName(k.name),
  )
  const klemmenListe = katalog.filter((k) => k.kennzeichenBuchstabe?.trim() === 'X')
  const vorgabe = (ids: (string | null | undefined)[], liste: readonly CatalogComponent[]) =>
    ids.find((id) => id && liste.some((k) => k.id === id)) ?? liste[0]?.id ?? ''
  const [anzahl, setAnzahl] = useState('6')
  const [schutzId, setSchutzId] = useState(() =>
    vorgabe([gemerkt.stromkreisSchutzId, STANDARD_SCHUTZ_ID], schutzListe),
  )
  const [klemmeId, setKlemmeId] = useState(() =>
    gemerkt.stromkreisKlemmeId === null
      ? ''
      : vorgabe([gemerkt.stromkreisKlemmeId, STANDARD_KLEMME_ID], klemmenListe),
  )
  const n = Math.round(Number(anzahl))
  const schutz = schutzListe.find((k) => k.id === schutzId)
  return (
    <form
      className="verteiler-formular"
      onSubmit={(e) => {
        e.preventDefault()
        if (!schutz || !Number.isFinite(n) || n < 1) return
        const klemme = klemmenListe.find((k) => k.id === klemmeId) ?? null
        useSettingsStore.getState().setVerteilerplanEinstellungen(settingsStore, {
          ...gemerkt,
          stromkreisSchutzId: schutz.id,
          stromkreisKlemmeId: klemme?.id ?? null,
        })
        onAnlegen(schutz, klemme, Math.min(48, n))
      }}
    >
      <label>
        {t('verteilerdialoge.verteiler.anzahlFeld')}
        <input
          type="number"
          min={1}
          max={48}
          value={anzahl}
          onChange={(e) => setAnzahl(e.target.value)}
          autoFocus
        />
      </label>
      <label>
        {t('verteilerdialoge.verteiler.schutzgeraet')}
        <select value={schutzId} onChange={(e) => setSchutzId(e.target.value)}>
          {schutzListe.map((k) => (
            <option key={k.id} value={k.id}>
              {komponentenText(k, 'name', oberflaechensprache())}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t('verteilerdialoge.verteiler.klemmeDahinter')}
        <select value={klemmeId} onChange={(e) => setKlemmeId(e.target.value)}>
          <option value="">{t('verteilerdialoge.verteiler.ohneKlemme')}</option>
          {klemmenListe.map((k) => (
            <option key={k.id} value={k.id}>
              {komponentenText(k, 'name', oberflaechensprache())}
            </option>
          ))}
        </select>
      </label>
      <span className="verteiler-formular-knoepfe">
        <button type="button" onClick={onAbbrechen}>
          {t('verteilerdialoge.allgemein.abbrechen')}
        </button>
        <button type="submit" className="primaer" disabled={!schutz || !(n >= 1)}>
          {t('verteilerdialoge.verknuepfen.anlegen')}
        </button>
      </span>
    </form>
  )
}

function knxKanalWaehlbar(
  geraet: VerteilerBetriebsmittel | undefined,
  kanal: string,
  belegt: ReadonlySet<string>,
): boolean {
  if (!geraet?.knxAktor) return true
  const i = knxKanalIndexAusName(kanal)
  if (i === null) return true
  const beginn = knxPaarBeginn(geraet.knxAktor, i)
  if (beginn === null) return true
  return beginn === i && !belegt.has(knxKanalName(i + 1))
}

function neuesKanalGeraet(
  t: Uebersetzer,
  bestand: readonly BestueckungsEintrag[],
  k: CatalogComponent,
  weiter: (neu: BestueckungsEintrag) => void,
) {
  const art = knxAktorArtVonKatalogId(k.id)
  if (!art) {
    const [neu] = neueBestueckungsEintraege(bestand, k, 1)
    if (neu) weiter(neu)
    return
  }
  useUiStore.getState().oeffneKnxAktorDialog({
    daten: neueKnxAktorDaten(art, art === 'dimm' ? 4 : 8),
    mitBeschriftung: false,
    bestaetigenText: t('verteilerdialoge.verteiler.hinzufuegen'),
    callback: (ergebnis) => {
      if (!ergebnis) return
      weiter({
        id: erzeugeId('bestueckung'),
        catalogComponentId: k.id,
        kennzeichen: naechstesBestueckungsKennzeichen(
          bestand.map((e) => e.kennzeichen),
          'K',
        ),
        mitKanaelen: true,
        knxAktor: ergebnis.daten,
      })
    },
  })
}

function kanalArtig(name: string): boolean {
  return /^(A|K|C)?\d+$/i.test(name)
}

function KanalFormular({
  baum,
  liste,
  katalog,
  elternId,
  onEinordnen,
  onAbbrechen,
  aktuelleListe,
  klemmenOptionen,
}: {
  baum: VerteilerBaum
  liste: readonly BestueckungsEintrag[]
  katalog: readonly CatalogComponent[]
  elternId: string | null
  onEinordnen: (neu: BestueckungsEintrag[], label: string) => void
  onAbbrechen: () => void
  aktuelleListe: () => BestueckungsEintrag[] | null
  klemmenOptionen: () => KlemmenOptionen
}) {
  const t = useT()
  const kanalKz = new Set(baum.kanalGeraete.map((g) => g.geraet.kennzeichen))
  const kandidaten = [
    ...baum.kanalGeraete.map((g) => g.geraet),
    ...baum.betriebsmittel.filter(
      (b) =>
        !kanalKz.has(b.kennzeichen) &&
        b.anschluesse.filter(kanalArtig).length > 1 &&
        (b.buchstabe === 'K' || b.buchstabe === 'X'),
    ),
  ]
  const [kennzeichen, setKennzeichen] = useState(kandidaten[0]?.kennzeichen ?? '')
  const geraet = kandidaten.find((b) => b.kennzeichen === kennzeichen)
  const belegt = new Set(
    baum.knoten.filter((k) => k.kennzeichen === kennzeichen && k.kanal).map((k) => k.kanal!),
  )
  const alle = geraet?.anschluesse ?? []
  const kanaele = alle.some(kanalArtig) ? alle.filter(kanalArtig) : alle
  const frei = kanaele.filter((a) => !belegt.has(a) && knxKanalWaehlbar(geraet, a, belegt))
  const [kanal, setKanal] = useState('')
  const gewaehlterKanal = frei.includes(kanal) ? kanal : (frei[0] ?? '')

  function einordnen() {
    if (!geraet || !gewaehlterKanal) return
    let basis = [...liste]
    let eintrag = basis.find((e) => e.kennzeichen === geraet.kennzeichen && !e.kanal)
    if (!eintrag && geraet.catalogComponentId) {
      basis = planGeraetAufnehmen(basis, {
        kennzeichen: geraet.kennzeichen,
        catalogComponentId: geraet.catalogComponentId,
      })
      eintrag = basis[basis.length - 1]
    }
    if (!eintrag) return
    const neu = kanalEinordnen(basis, eintrag.id, gewaehlterKanal, elternId ?? undefined)
    if (neu) onEinordnen(neu, t('verteilerdialoge.verteiler.kanalEinordnenUndo'))
  }

  function neuesGeraet() {
    useUiStore.getState().oeffneKomponentenPicker(
      (gewaehlt) => {
        const k = gewaehlt && katalog.find((c) => c.id === gewaehlt.catalogComponentId)
        const bestand = aktuelleListe()
        if (!k || !bestand) return
        if (istKlemmenKennzeichen(k.kennzeichenBuchstabe)) {
          const klemmen = neueBestueckungsEintraege(
            bestand,
            k,
            1,
            elternId ?? undefined,
            klemmenOptionen(),
          )
          if (klemmen.length > 0)
            onEinordnen(
              [...bestand, ...klemmen],
              t('verteilerdialoge.verteiler.klemmeEinordnenUndo'),
            )
          return
        }
        neuesKanalGeraet(t, bestand, k, (neu) => {
          const erster = neu.knxAktor ? knxKanalName(0) : kanaeleVon(k)[0]
          const mit = [...bestand, neu]
          const eingeordnet = erster
            ? kanalEinordnen(mit, neu.id, erster, elternId ?? undefined)
            : null
          onEinordnen(
            eingeordnet ?? [...bestand, { ...neu, mitKanaelen: true }],
            t('verteilerdialoge.verteiler.kanalEinordnenUndo'),
          )
        })
      },
      {
        filter: 'betriebsmittel',
        titel: t('verteilerdialoge.verteiler.kanalGeraetWaehlen'),
        bestaetigenText: t('verteilerdialoge.verteiler.weiter'),
      },
    )
  }

  return (
    <form
      className="verteiler-formular"
      onSubmit={(e) => {
        e.preventDefault()
        einordnen()
      }}
    >
      {kandidaten.length > 0 ? (
        <>
          <label>
            {t('verteilerdialoge.switchPort.geraet')}
            <select value={kennzeichen} onChange={(e) => setKennzeichen(e.target.value)}>
              {kandidaten.map((b) => (
                <option key={b.kennzeichen} value={b.kennzeichen}>
                  -{b.kennzeichen} {geraeteName(t, katalog, b)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('verteilerdialoge.knxAktor.kanal')}
            <select value={gewaehlterKanal} onChange={(e) => setKanal(e.target.value)}>
              {frei.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <span className="dialog-hinweis">{t('verteilerdialoge.verteiler.keinKanalGeraet')}</span>
      )}
      <span className="verteiler-formular-knoepfe">
        <button type="button" onClick={neuesGeraet}>
          {t('verteilerdialoge.verteiler.neuesGeraet')}
        </button>
        <button type="button" onClick={onAbbrechen}>
          {t('verteilerdialoge.allgemein.abbrechen')}
        </button>
        {kandidaten.length > 0 && (
          <button type="submit" className="primaer" disabled={!gewaehlterKanal}>
            {t('verteilerdialoge.verteiler.einordnen')}
          </button>
        )}
      </span>
    </form>
  )
}

function kanaeleVon(k: CatalogComponent): string[] {
  const namen: string[] = []
  if (k.dockpunkte?.modus === 'frei')
    for (const p of k.dockpunkte.punkte) {
      const name = p.trunk ? '' : (p.bezeichnung?.trim() ?? '')
      if (name && !namen.includes(name)) namen.push(name)
    }
  return namen.some(kanalArtig) ? namen.filter(kanalArtig) : namen
}

function KanalGeraeteListe({
  kanalGeraete,
  katalog,
  bearbeitbar,
  aenderbar,
  onUmbenennen,
  onEntfernen,
  onNeuNummerieren,
  onKnxBearbeiten,
  onNeu,
  mitPlan,
}: {
  kanalGeraete: readonly KanalGeraet[]
  katalog: readonly CatalogComponent[]
  bearbeitbar: boolean
  aenderbar: (g: VerteilerBetriebsmittel) => boolean
  onUmbenennen: (eintrag: BestueckungsEintrag, wert: string) => void
  onEntfernen: (eintrag: BestueckungsEintrag) => void
  onNeuNummerieren: (leiste: string) => void
  onKnxBearbeiten: (eintrag: BestueckungsEintrag) => void
  onNeu: () => void
  mitPlan: boolean
}) {
  const t = useT()
  if (kanalGeraete.length === 0 && (!bearbeitbar || mitPlan)) return null
  return (
    <div className="verteiler-abschnitt">
      <h3>{t('verteilerdialoge.verteiler.kanalGeraeteTitel')}</h3>
      {kanalGeraete.length === 0 && (
        <p className="dialog-hinweis">{t('verteilerdialoge.verteiler.kanalGeraeteLeer')}</p>
      )}
      {kanalGeraete.map(({ geraet, eintrag, kanaele }) => {
        const eingeordnet = new Set(kanaele.map((k) => k.kanal))
        if (geraet.knxAktor)
          for (const k of kanaele) {
            const i = knxKanalIndexAusName(k.kanal ?? '')
            if (i !== null && knxPaarBeginn(geraet.knxAktor, i) === i)
              eingeordnet.add(knxKanalName(i + 1))
          }
        const alle = [...geraet.anschluesse].sort(
          (a, b) => Number(kanalArtig(b)) - Number(kanalArtig(a)),
        )
        const funktion = (a: string) => {
          const i = geraet.knxAktor ? knxKanalIndexAusName(a) : null
          if (i === null || !geraet.knxAktor) return ''
          const f = knxKanalFunktionsText(geraet.knxAktor, i)
          return ` · ${f.funktion}${f.teil ? ` ${f.teil}` : ''}`
        }
        return (
          <div key={geraet.kennzeichen} className="verteiler-kanalgeraet">
            <span className="verteiler-kanalgeraet-kopf">
              {eintrag && aenderbar(geraet) ? (
                <EntwurfsTextfeld
                  wert={geraet.kennzeichen}
                  onUebernehmen={(w) => onUmbenennen(eintrag, w)}
                />
              ) : (
                <span className="verteiler-kennzeichen">-{geraet.kennzeichen}</span>
              )}
              <span>
                {istLeiste(geraet)
                  ? t('verteilerdialoge.verteiler.klemmenleiste')
                  : geraeteName(t, katalog, geraet)}
              </span>
            </span>
            <span className="verteiler-chips-zeile">
              {alle.filter(kanalArtig).map((a) => (
                <span
                  key={a}
                  className={`verteiler-kanal${eingeordnet.has(a) ? ' eingeordnet' : ''}`}
                  title={
                    t(
                      eingeordnet.has(a)
                        ? 'verteilerdialoge.verteiler.kanalEingeordnet'
                        : 'verteilerdialoge.verteiler.kanalFrei',
                      {
                        name: `${geraet.kennzeichen}:${a}`,
                      },
                    ) + funktion(a)
                  }
                >
                  {a}
                </span>
              ))}
            </span>
            {eintrag?.knxAktor && aenderbar(geraet) && (
              <button onClick={() => onKnxBearbeiten(eintrag)}>
                {t('verteilerdialoge.verteiler.kanaeleBearbeitenKnopf')}
              </button>
            )}
            {eintrag && aenderbar(geraet) && (
              <button
                className="switchport-trennen"
                aria-label={t('verteilerdialoge.verteiler.knotenEntfernen', {
                  name: geraet.kennzeichen,
                })}
                onClick={() => onEntfernen(eintrag)}
              >
                ✕
              </button>
            )}
            {bearbeitbar && !mitPlan && istLeiste(geraet) && (
              <button
                title={t('verteilerdialoge.verteiler.neuNummerierenTitel')}
                onClick={() => onNeuNummerieren(geraet.kennzeichen)}
              >
                {t('verteilerdialoge.verteiler.neuNummerieren')}
              </button>
            )}
          </div>
        )
      })}
      {bearbeitbar && !mitPlan && (
        <div className="verteiler-werkzeuge">
          <button onClick={onNeu}>{t('verteilerdialoge.verteiler.kanalGeraetNeu')}</button>
        </div>
      )}
    </div>
  )
}
