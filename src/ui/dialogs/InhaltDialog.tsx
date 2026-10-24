import { useMemo, useRef, useState } from 'react'
import type {
  InhaltsLeitung,
  Kabeltyp,
  LeitungsObjekt,
  SchachtInhalt,
  TrunkInhalt,
} from '../../document-model'
import { inhaltVonSchacht, inhaltVonTrunkKette } from '../../document-model'
import { KREIS_RADIUS, ordneQuerschnittAn, type QuerschnittLayout } from '../../rendering'
import { erzeugeObjektAendernCommand, erzeugeTrunkEigenschaftenSyncCommand } from '../../tools'
import { KabeltypFeld } from '../components/KabeltypFeld'
import { TextFeldBeimVerlassen } from '../components/TextFeldBeimVerlassen'
import { gleicheKabeltypenAb } from '../kabeltyp-abgleich'
import { StrangNameFeld } from '../StrangNameFeld'
import { useKabeltypStore } from '../store/kabeltyp-store'
import { useKatalogStore } from '../store/katalog-store'
import type { InhaltDialogZustand } from '../store/ui-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { useT } from '../sprache-anbindung'

export function InhaltDialog() {
  const dialog = useUiStore((s) => s.inhaltDialog)
  if (!dialog) return null
  return <InhaltDialogInhalt key={`${dialog.blattId}:${dialog.objektId}`} dialog={dialog} />
}

const MINDEST_MASSSTAB = 0.6
const HOECHST_MASSSTAB = 1.5

function InhaltDialogInhalt({ dialog }: { dialog: InhaltDialogZustand }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const katalog = useKatalogStore((s) => s.komponenten)
  const globaleTypen = useKabeltypStore((s) => s.typen)
  const [markiert, setMarkiert] = useState<string | null>(null)
  const zeilenRefs = useRef(new Map<string, HTMLTableRowElement>())

  const kabeltypen = useMemo<Kabeltyp[]>(() => {
    const bekannt = new Set(globaleTypen.map((typ) => typ.id))
    return [...globaleTypen, ...(zeichnung.kabeltypen ?? []).filter((typ) => !bekannt.has(typ.id))]
  }, [globaleTypen, zeichnung.kabeltypen])

  const inhalt = useMemo<TrunkInhalt | SchachtInhalt | null>(() => {
    const kontext = { katalog, kabeltypen }
    return dialog.art === 'trunk'
      ? inhaltVonTrunkKette(zeichnung, dialog.blattId, dialog.objektId, kontext)
      : inhaltVonSchacht(zeichnung, dialog.blattId, dialog.objektId, kontext)
  }, [dialog, zeichnung, katalog, kabeltypen])

  const layout = useMemo(
    () =>
      inhalt
        ? ordneQuerschnittAn(inhalt.gruppen, inhalt.leitungen, {
            mitSchacht: inhalt.art === 'schacht',
          })
        : null,
    [inhalt],
  )

  function schliessen() {
    useUiStore.getState().schliesseInhaltDialog()
  }

  function markiereKreis(schluessel: string) {
    setMarkiert(schluessel)
    zeilenRefs.current.get(schluessel)?.scrollIntoView({ block: 'nearest' })
  }

  function aendereLeitung(zeile: InhaltsLeitung, patch: Partial<LeitungsObjekt>, label: string) {
    commands.execute(
      erzeugeObjektAendernCommand(doc, zeile.blattId, label, (objekte) =>
        objekte.map((o) =>
          o.id === zeile.leitung.id && o.type === 'leitung' ? { ...o, ...patch } : o,
        ),
      ),
    )
  }

  function zeigen(zeile: InhaltsLeitung) {
    schliessen()
    window.dispatchEvent(
      new CustomEvent('eleasycad:sprung-zu-blatt', {
        detail: { blattId: zeile.blattId, objektId: zeile.leitung.id },
      }),
    )
  }

  const titel = !inhalt
    ? t('verteilerdialoge.inhalt.titel')
    : inhalt.art === 'trunk'
      ? t('verteilerdialoge.inhalt.titelTrunk', { name: inhalt.kettenName })
      : t('verteilerdialoge.inhalt.titelSchacht', { name: inhalt.schachtName })

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog dialog-inhalt"
        role="dialog"
        aria-label={titel}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>{titel}</h2>
        {!inhalt ? (
          <p className="dialog-hinweis">{t('verteilerdialoge.inhalt.objektFehlt')}</p>
        ) : (
          <>
            {inhalt.art === 'trunk' ? (
              <TrunkKopf
                inhalt={inhalt}
                umbenennen={(name) =>
                  commands.execute(
                    erzeugeTrunkEigenschaftenSyncCommand(
                      doc,
                      inhalt.blattId,
                      inhalt.trunkId,
                      { name },
                      t('verteilerdialoge.inhalt.trunkUmbenennen'),
                    ),
                  )
                }
              />
            ) : (
              <SchachtKopf inhalt={inhalt} />
            )}
            {layout && layout.kreise.length + layout.rahmen.length > 0 && (
              <Querschnitt layout={layout} markiert={markiert} onKreis={markiereKreis} />
            )}
            {inhalt.leitungen.length === 0 ? (
              <p className="dialog-hinweis">
                {inhalt.art === 'trunk'
                  ? t('verteilerdialoge.inhalt.trunkLeer')
                  : t('verteilerdialoge.inhalt.schachtLeer')}
              </p>
            ) : (
              <div className="inhalt-tabelle-huelle">
                <table className="inhalt-tabelle">
                  <thead>
                    <tr>
                      <th>{t('verteilerdialoge.inhalt.nummer')}</th>
                      <th>{t('verteilerdialoge.inhalt.beschreibung')}</th>
                      <th>{t('verteilerdialoge.inhalt.vonNach')}</th>
                      <th>{t('verteilerdialoge.inhalt.kabeltyp')}</th>
                      <th>{t('verteilerdialoge.inhalt.laenge')}</th>
                      <th>
                        {inhalt.art === 'trunk'
                          ? t('verteilerdialoge.inhalt.teilstuecke')
                          : t('verteilerdialoge.inhalt.strang')}
                      </th>
                      <th aria-label={t('verteilerdialoge.inhalt.zeigen')} />
                    </tr>
                  </thead>
                  <tbody>
                    {inhalt.leitungen.map((zeile) => (
                      <tr
                        key={zeile.schluessel}
                        ref={(el) => {
                          if (el) zeilenRefs.current.set(zeile.schluessel, el)
                          else zeilenRefs.current.delete(zeile.schluessel)
                        }}
                        className={[
                          markiert === zeile.schluessel ? 'markiert' : '',
                          zeile.hier ? '' : 'blass',
                        ].join(' ')}
                        onClick={() => setMarkiert(zeile.schluessel)}
                      >
                        <td className="inhalt-nummer">
                          <span
                            className="inhalt-farbpunkt"
                            style={{ background: zeile.leitung.farbe }}
                            aria-hidden
                          />
                          {zeile.leitung.nummer}
                        </td>
                        <td>
                          <TextFeldBeimVerlassen
                            aria-label={t('verteilerdialoge.inhalt.beschreibungVon', {
                              nummer: String(zeile.leitung.nummer),
                            })}
                            placeholder={t('verteilerdialoge.inhalt.beschreibung')}
                            wert={zeile.leitung.beschreibung ?? ''}
                            onUebernehmen={(wert) =>
                              aendereLeitung(
                                zeile,
                                { beschreibung: wert.trim() || undefined },
                                t('verteilerdialoge.inhalt.beschreibungAendern'),
                              )
                            }
                          />
                        </td>
                        <td className="inhalt-enden">{zeile.vonNach}</td>
                        <td className="inhalt-kabeltyp">
                          <KabeltypFeld
                            titel=""
                            wertId={zeile.leitung.kabeltypId}
                            freierText={zeile.leitung.typ}
                            zusatzTypen={zeichnung.kabeltypen}
                            aendern={(wahl) => {
                              aendereLeitung(zeile, wahl, t('verteilerdialoge.kabeltyp.titel'))
                              gleicheKabeltypenAb(doc)
                            }}
                          />
                        </td>
                        <td className="inhalt-laenge">
                          {zeile.laengeMeter === null ? '–' : `${zeile.laengeMeter.toFixed(2)} m`}
                        </td>
                        <td className="inhalt-ort">
                          {inhalt.art === 'trunk' ? zeile.teilstuecke.join(', ') : zeile.strang}
                        </td>
                        <td>
                          <button type="button" className="verweis" onClick={() => zeigen(zeile)}>
                            {t('verteilerdialoge.inhalt.zeigen')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verteilerdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}

function TrunkKopf({
  inhalt,
  umbenennen,
}: {
  inhalt: TrunkInhalt
  umbenennen: (name: string) => void
}) {
  const t = useT()
  return (
    <div className="inhalt-kopf">
      <div className="inhalt-straenge">
        <label className="dialog-feld">
          <span>{t('verteilerdialoge.inhalt.name')}</span>
          <TextFeldBeimVerlassen
            wert={inhalt.kettenName}
            onUebernehmen={(name) => {
              if (name.trim()) umbenennen(name.trim())
            }}
          />
        </label>
        {inhalt.straenge.map((s) => (
          <label key={`${s.verbundId}:${s.nummer}`} className="dialog-feld">
            <span>
              {t('verteilerdialoge.inhalt.strangImSchacht', {
                nummer: String(s.nummer),
                schacht: s.schachtName,
              })}
            </span>
            <StrangNameFeld verbundId={s.verbundId} nummer={s.nummer} />
          </label>
        ))}
      </div>
      <p className="feld-info">
        {t(
          inhalt.teilstuecke.length > 1
            ? 'verteilerdialoge.inhalt.teilstueckeListe'
            : 'verteilerdialoge.inhalt.blattListe',
          {
            liste: inhalt.teilstuecke
              .map((teil) =>
                inhalt.teilstuecke.length > 1 ? `${teil.name} · ${teil.blattName}` : teil.blattName,
              )
              .join(', '),
          },
        )}
        {inhalt.leitungen.some((l) => !l.hier) && ` – ${t('verteilerdialoge.inhalt.blassHinweis')}`}
      </p>
    </div>
  )
}

function SchachtKopf({ inhalt }: { inhalt: SchachtInhalt }) {
  const t = useT()
  const nummern = [
    ...new Set([
      ...inhalt.gruppen.flatMap((g) => (g.strangNummer === null ? [] : [g.strangNummer])),
      ...inhalt.leitungen.flatMap((l) => (l.eigenerStrang === null ? [] : [l.eigenerStrang])),
    ]),
  ].sort((a, b) => a - b)
  const weiter = [
    ...inhalt.nachOben.map((n) => `↑ ${n}`),
    ...inhalt.nachUnten.map((n) => `↓ ${n}`),
  ].join('  ')
  return (
    <div className="inhalt-kopf">
      <p className="feld-info">
        {weiter
          ? t('verteilerdialoge.inhalt.durchbruchWeiter', { ort: inhalt.blattName, weiter })
          : t('verteilerdialoge.inhalt.durchbruch', { ort: inhalt.blattName })}
      </p>
      {nummern.length > 0 && (
        <div className="inhalt-straenge">
          {nummern.map((nummer) => (
            <label key={nummer} className="dialog-feld">
              <span>{t('verteilerdialoge.inhalt.strangNummer', { nummer: String(nummer) })}</span>
              <StrangNameFeld verbundId={inhalt.verbundId} nummer={nummer} />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function Querschnitt({
  layout,
  markiert,
  onKreis,
}: {
  layout: QuerschnittLayout
  markiert: string | null
  onKreis: (schluessel: string) => void
}) {
  const t = useT()
  const { breite, hoehe } = layout
  return (
    <div className="inhalt-querschnitt">
      <svg
        viewBox={`0 0 ${breite} ${hoehe}`}
        width="100%"
        style={{ maxWidth: breite * HOECHST_MASSSTAB, minWidth: breite * MINDEST_MASSSTAB }}
        role="img"
        aria-label={t('verteilerdialoge.inhalt.querschnitt')}
      >
        {layout.schacht && (
          <g className="querschnitt-schacht">
            <rect
              x={layout.schacht.x + 1}
              y={layout.schacht.y + 1}
              width={layout.schacht.breite - 2}
              height={layout.schacht.hoehe - 2}
            />
            <line x1={1} y1={1} x2={breite - 1} y2={hoehe - 1} />
            <line x1={breite - 1} y1={1} x2={1} y2={hoehe - 1} />
          </g>
        )}
        {layout.rahmen.map((r) =>
          r.form === 'rund' ? (
            <ellipse
              key={r.schluessel}
              className="querschnitt-rahmen"
              cx={r.x + r.breite / 2}
              cy={r.y + r.hoehe / 2}
              rx={r.breite / 2}
              ry={r.hoehe / 2}
            />
          ) : (
            <rect
              key={r.schluessel}
              className="querschnitt-rahmen"
              x={r.x}
              y={r.y}
              width={r.breite}
              height={r.hoehe}
              rx={r.form === 'abgerundet' ? Math.min(r.breite, r.hoehe) / 3 : 2}
            />
          ),
        )}
        {layout.texte.map((eintrag, i) => (
          <text
            key={i}
            className={`querschnitt-text querschnitt-text-${eintrag.art}`}
            x={eintrag.x}
            y={eintrag.y}
            textAnchor="middle"
          >
            {eintrag.text}
          </text>
        ))}
        {layout.kreise.map((k) => (
          <g
            key={k.schluessel}
            className={`querschnitt-kreis${k.blass ? ' blass' : ''}${markiert === k.schluessel ? ' markiert' : ''}`}
            onClick={() => onKreis(k.schluessel)}
          >
            <circle cx={k.x} cy={k.y} r={KREIS_RADIUS} fill={k.farbe} />
            <text x={k.x} y={k.y} fill={k.textFarbe} textAnchor="middle" dominantBaseline="central">
              {k.nummer}
            </text>
            {k.strangNummer !== null && (
              <text
                className="querschnitt-strangmarke"
                x={k.x + KREIS_RADIUS}
                y={k.y - KREIS_RADIUS}
                textAnchor="start"
              >
                S{k.strangNummer}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
