import { useEffect, useMemo, useRef, useState } from 'react'
import {
  blaetterDesselbenIfcModells,
  erzeugeBauteilObjekte,
  nurAnsichtGrund,
} from '../../document-model'
import { CompositeCommand, erzeugeObjektAendernCommand, type Command } from '../../tools'
import type { IfcBauteilArt, IfcBauteileErgebnis, IfcBauteileJeBlatt } from '../ifc-bauteile'
import {
  IFC_BAUTEIL_ARTEN,
  IN_DER_WAND,
  ifcBauteilHinweisTexte,
  summiereIfcBauteile,
  waehleIfcBauteile,
} from '../ifc-bauteile'
import { useFreigeschalteteModule } from '../lizenz-module'
import { useUiStore } from '../store/ui-store'
import { useAktivesBlatt, useAppContext } from '../use-app-context'
import { t as tOberflaeche } from '../../sprache'
import { useT } from '../sprache-anbindung'

type Stand =
  | { art: 'laedt' }
  | { art: 'fertig'; ergebnis: IfcBauteileErgebnis }
  | { art: 'fehler'; meldung: string }

type WeitereStand =
  | { art: 'aus' }
  | { art: 'laedt'; gelesen: number; gesamt: number }
  | { art: 'fertig'; jeBlatt: IfcBauteileJeBlatt[] }
  | { art: 'fehler'; meldung: string }

const fehlerText = (fehler: unknown) =>
  fehler instanceof Error ? fehler.message : tOberflaeche('zeichendialoge.ifcBauteile.nichtLesbar')

export function IfcBauteileDialog() {
  const dialog = useUiStore((s) => s.ifcBauteileDialog)
  if (!dialog) return null
  return <IfcBauteileInhalt key={dialog.blattId} blattId={dialog.blattId} />
}

function IfcBauteileInhalt({ blattId }: { blattId: string }) {
  const { doc, commands, overlaySignal, aktiviereTool, leseIfcBauteile } = useAppContext()
  const freigeschaltet = useFreigeschalteteModule()
  const aktiv = useAktivesBlatt()
  const t = useT()
  const blatt = doc.getBlatt(blattId)
  const [stand, setStand] = useState<Stand>({ art: 'laedt' })
  const [gewaehlt, setGewaehlt] = useState<Set<IfcBauteilArt>>(
    () => new Set(IFC_BAUTEIL_ARTEN.map((a) => a.art)),
  )
  const [weitereIds] = useState(() => {
    const zeichnung = doc.getZeichnung()
    const eigenes = zeichnung.blaetter.find((b) => b.id === blattId)
    if (!eigenes) return []
    return blaetterDesselbenIfcModells(zeichnung.blaetter, eigenes)
      .filter((b) => b.id !== blattId && nurAnsichtGrund(b, freigeschaltet) === null)
      .map((b) => b.id)
  })
  const [alle, setAlle] = useState(false)
  const [weitere, setWeitere] = useState<WeitereStand>({ art: 'aus' })
  const weitereAuftrag = useRef<{ abbrechen: () => void } | null>(null)
  useEffect(() => () => weitereAuftrag.current?.abbrechen(), [])

  const schliessen = () => {
    useUiStore.getState().setIfcBauteileDialog(null)
    aktiviereTool('auswahl')
    overlaySignal.request()
  }

  useEffect(() => {
    const auftrag = leseIfcBauteile([blattId])
    let verworfen = false
    auftrag.ergebnis.then(
      ([eigenes]) => {
        if (verworfen) return
        if (!eigenes || 'fehler' in eigenes) {
          setStand({ art: 'fehler', meldung: eigenes?.fehler ?? fehlerText(undefined) })
          return
        }
        setStand({ art: 'fertig', ergebnis: eigenes.ergebnis })
        aktiviereTool('ifc-bauteile-vorschau')
      },
      (fehler: unknown) => {
        if (verworfen) return
        setStand({ art: 'fehler', meldung: fehlerText(fehler) })
      },
    )
    return () => {
      verworfen = true
      auftrag.abbrechen()
    }
  }, [blattId, leseIfcBauteile, aktiviereTool])

  function waehleAlle() {
    setAlle(true)
    if (weitere.art !== 'aus') return
    setWeitere({ art: 'laedt', gelesen: 0, gesamt: weitereIds.length })
    const auftrag = leseIfcBauteile(weitereIds, (gelesen, gesamt) =>
      setWeitere((bisher) => (bisher.art === 'laedt' ? { art: 'laedt', gelesen, gesamt } : bisher)),
    )
    weitereAuftrag.current = auftrag
    auftrag.ergebnis.then(
      (jeBlatt) => setWeitere({ art: 'fertig', jeBlatt }),
      (fehler: unknown) => setWeitere({ art: 'fehler', meldung: fehlerText(fehler) }),
    )
  }

  const vorlagen = useMemo(
    () => (stand.art === 'fertig' ? waehleIfcBauteile(stand.ergebnis.vorlagen, gewaehlt) : null),
    [stand, gewaehlt],
  )
  useEffect(() => {
    if (!vorlagen) return
    useUiStore.getState().setIfcBauteileVorschau(vorlagen)
    overlaySignal.request()
  }, [vorlagen, overlaySignal])

  useEffect(() => {
    if (aktiv.id !== blattId) {
      useUiStore.getState().setIfcBauteileDialog(null)
      overlaySignal.request()
    }
  }, [aktiv.id, blattId, overlaySignal])

  const weitereGelesen =
    weitere.art === 'fertig' ? weitere.jeBlatt.flatMap((e) => ('ergebnis' in e ? [e] : [])) : []
  const uebersprungen =
    weitere.art === 'fertig' ? weitere.jeBlatt.flatMap((e) => ('fehler' in e ? [e] : [])) : []
  const ziele =
    stand.art === 'fertig'
      ? [{ blattId, ergebnis: stand.ergebnis }, ...(alle ? weitereGelesen : [])]
      : []
  const summe = ziele.length > 0 ? summiereIfcBauteile(ziele.map((z) => z.ergebnis)) : null
  const gewaehltGesamt = ziele.reduce(
    (n, z) => n + zaehleGesamt(waehleIfcBauteile(z.ergebnis.vorlagen, gewaehlt)),
    0,
  )
  const wartetAufWeitere = alle && weitere.art !== 'fertig'

  const uebernehmen = () => {
    if (stand.art !== 'fertig' || wartetAufWeitere) return
    const teile: Command[] = []
    let angelegt = 0
    let raeumeOffen = 0
    let raeumeDoppelt = 0
    for (const ziel of ziele) {
      const b = doc.getBlatt(ziel.blattId)
      if (!b) continue
      const r = erzeugeBauteilObjekte(
        waehleIfcBauteile(ziel.ergebnis.vorlagen, gewaehlt),
        b.aktiveEbeneId,
        b.objekte,
      )
      raeumeOffen += r.raeumeOffen
      raeumeDoppelt += r.raeumeDoppelt
      if (r.objekte.length === 0) continue
      angelegt += r.objekte.length
      teile.push(
        erzeugeObjektAendernCommand(
          doc,
          ziel.blattId,
          t('zeichendialoge.ifcBauteile.titel'),
          (objekte) => [...objekte, ...r.objekte],
        ),
      )
    }
    if (teile.length === 1) commands.execute(teile[0])
    else if (teile.length > 1)
      commands.execute(
        new CompositeCommand(
          t('zeichendialoge.ifcBauteile.titelMehrereBlaetter', { n: teile.length }),
          teile,
        ),
      )
    schliessen()
    const ausgefallen: string[] = []
    if (raeumeOffen > 0)
      ausgefallen.push(t('zeichendialoge.ifcBauteile.raeumeOffen', { n: raeumeOffen }))
    if (raeumeDoppelt > 0)
      ausgefallen.push(t('zeichendialoge.ifcBauteile.raeumeDoppelt', { n: raeumeDoppelt }))
    const kopf = alle
      ? t('zeichendialoge.ifcBauteile.uebernommenAufBlaettern', {
          n: teile.length,
          anzahl: angelegt,
        })
      : t('zeichendialoge.ifcBauteile.uebernommen')
    const meldung =
      ausgefallen.length > 0
        ? t('zeichendialoge.ifcBauteile.mitAusfall', {
            kopf,
            gruende: ausgefallen.join(', '),
            n: raeumeOffen + raeumeDoppelt,
          })
        : t('zeichendialoge.ifcBauteile.ohneAusfall', { kopf })
    const ohne =
      alle && uebersprungen.length > 0
        ? ` ${t('zeichendialoge.ifcBauteile.uebersprungen', {
            blaetter: uebersprungen.map((e) => doc.getBlatt(e.blattId)?.name ?? '?').join(', '),
          })}`
        : ''
    useUiStore.getState().zeigeToast(meldung + ohne)
  }

  const anzahl = summe?.anzahl ?? null
  const leer = gewaehltGesamt === 0

  return (
    <div
      className="erkennung-assistent ifc-bauteile-dialog"
      role="dialog"
      aria-label={t('zeichendialoge.ifcBauteile.titel')}
    >
      <h2>{t('zeichendialoge.ifcBauteile.titel')}</h2>
      <p className="dialog-hinweis">
        {t('zeichendialoge.ifcBauteile.blatt', { name: blatt?.name ?? '' })}
      </p>

      {weitereIds.length > 0 && stand.art !== 'fehler' && (
        <div
          className="erkennung-schalter-gruppe"
          role="radiogroup"
          aria-label={t('zeichendialoge.ifcBauteile.uebernehmenAuf')}
        >
          <label className="erkennung-schalter">
            <input
              type="radio"
              name="ifc-bauteile-umfang"
              checked={!alle}
              onChange={() => setAlle(false)}
            />
            <span>{t('zeichendialoge.ifcBauteile.nurDiesemBlatt')}</span>
          </label>
          <label className="erkennung-schalter">
            <input type="radio" name="ifc-bauteile-umfang" checked={alle} onChange={waehleAlle} />
            <span>
              {t('zeichendialoge.ifcBauteile.allenBlaettern', { n: weitereIds.length + 1 })}
            </span>
          </label>
        </div>
      )}

      {stand.art === 'laedt' && (
        <p className="erkennung-ergebnis">{t('zeichendialoge.ifcBauteile.liest')}</p>
      )}
      {stand.art === 'fehler' && <p className="erkennung-warnung">{stand.meldung}</p>}
      {alle && weitere.art === 'laedt' && (
        <p className="erkennung-ergebnis">
          {t('zeichendialoge.ifcBauteile.weitereGeschosse', {
            gelesen: weitere.gelesen,
            gesamt: weitere.gesamt,
          })}
        </p>
      )}
      {alle && weitere.art === 'fehler' && <p className="erkennung-warnung">{weitere.meldung}</p>}
      {stand.art === 'fertig' && anzahl && summe && (
        <>
          <p className="dialog-hinweis">{t('zeichendialoge.ifcBauteile.hinweis')}</p>
          <div className="erkennung-schalter-gruppe">
            {IFC_BAUTEIL_ARTEN.map(({ art, name }) => {
              const ohneWand = IN_DER_WAND.has(art) && !gewaehlt.has('waende')
              return (
                <label
                  key={art}
                  className="erkennung-schalter"
                  title={ohneWand ? t('zeichendialoge.ifcBauteile.brauchenWand') : undefined}
                >
                  <input
                    type="checkbox"
                    checked={gewaehlt.has(art) && !ohneWand}
                    disabled={ohneWand || anzahl[art] === 0}
                    onChange={(e) =>
                      setGewaehlt((bisher) => {
                        const neu = new Set(bisher)
                        if (e.target.checked) neu.add(art)
                        else neu.delete(art)
                        return neu
                      })
                    }
                  />
                  <span>
                    {name} ({anzahl[art]})
                  </span>
                </label>
              )
            })}
          </div>
          {ifcBauteilHinweisTexte(summe, ziele.length > 1).map((text) => (
            <p key={text} className="erkennung-warnung">
              {text}
            </p>
          ))}
          {alle && uebersprungen.length > 0 && (
            <ul className="dialog-liste">
              {uebersprungen.map((e) => (
                <li key={e.blattId}>
                  {t('zeichendialoge.ifcBauteile.wirdUebersprungen', {
                    name: doc.getBlatt(e.blattId)?.name ?? '?',
                    fehler: e.fehler,
                  })}
                </li>
              ))}
            </ul>
          )}
          {zaehleGesamt(stand.ergebnis.vorlagen) === 0 && !alle && (
            <p className="erkennung-ergebnis">{t('zeichendialoge.ifcBauteile.keineBauteile')}</p>
          )}
        </>
      )}

      <div className="dialog-aktionen">
        <button type="button" onClick={schliessen}>
          {stand.art === 'laedt' || (alle && weitere.art === 'laedt')
            ? t('zeichendialoge.gemeinsam.abbrechen')
            : t('zeichendialoge.gemeinsam.schliessen')}
        </button>
        <button
          type="button"
          className="primaer"
          onClick={uebernehmen}
          disabled={leer || wartetAufWeitere}
        >
          {t('zeichendialoge.gemeinsam.uebernehmen')}
        </button>
      </div>
    </div>
  )
}

function zaehleGesamt(vorlagen: {
  waende: readonly unknown[]
  oeffnungen: readonly unknown[]
  treppen: readonly unknown[]
  raeume?: readonly unknown[]
}): number {
  return (
    vorlagen.waende.length +
    vorlagen.oeffnungen.length +
    vorlagen.treppen.length +
    (vorlagen.raeume?.length ?? 0)
  )
}
