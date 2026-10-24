import { useMemo, useState } from 'react'
import { dupliziereKabeltyp, neuerKabeltyp, type Kabeltyp } from '../../document-model'
import { useAppContext, useProject } from '../use-app-context'
import { useKabeltypStore } from '../store/kabeltyp-store'
import { useUiStore } from '../store/ui-store'
import { gleicheKabeltypenAb, nichtImBestand } from '../kabeltyp-abgleich'
import { ZahlenFeldOptional } from '../ZahlenFeld'
import { useSprache, useT } from '../sprache-anbindung'
import {
  gruppiereKabeltypenAnzeige,
  kabeltypBemerkung,
  kabeltypPasstZuSuche,
} from '../kabeltyp-anzeige'

export function KabeltypenDialog() {
  const offen = useUiStore((s) => s.kabeltypenDialogOffen)
  const t = useT()
  const sprache = useSprache()
  const schliessen = () => {
    setSuche('')
    setGruppenFilter(null)
    setBearbeitet(null)
    useUiStore.getState().setKabeltypenDialogOffen(false)
  }
  const { kabeltypStore, doc } = useAppContext()
  const zeichnung = useProject()
  const typen = useKabeltypStore((s) => s.typen)
  const [suche, setSuche] = useState('')
  const [gruppenFilter, setGruppenFilter] = useState<string | null>(null)
  const [bearbeitet, setBearbeitet] = useState<Kabeltyp | null>(null)

  const alleGruppen = useMemo(() => gruppiereKabeltypenAnzeige(typen, sprache), [typen, sprache])
  const sichtbar = useMemo(
    () =>
      typen.filter(
        (typ) =>
          (!gruppenFilter || typ.gruppe === gruppenFilter) && kabeltypPasstZuSuche(typ, suche),
      ),
    [typen, gruppenFilter, suche],
  )
  const gruppen = useMemo(() => gruppiereKabeltypenAnzeige(sichtbar, sprache), [sichtbar, sprache])
  const fehlende = offen ? nichtImBestand(doc) : []

  if (!offen) return null

  async function nachAenderung() {
    await useKabeltypStore.getState().laden(kabeltypStore)
    gleicheKabeltypenAb(doc)
  }

  async function speichere(typ: Kabeltyp) {
    try {
      await kabeltypStore.speichern(typ)
      await nachAenderung()
      setBearbeitet(null)
    } catch (fehler) {
      useUiStore
        .getState()
        .zeigeToast(
          fehler instanceof Error
            ? fehler.message
            : t('katalogdialoge.gemeinsam.speichernFehlgeschlagen'),
        )
    }
  }

  async function loesche(typ: Kabeltyp) {
    const inBenutzung = zeichnung.kabeltypen.some((t) => t.id === typ.id)
    if (inBenutzung) {
      useUiStore
        .getState()
        .zeigeToast(t('katalogdialoge.kabeltypen.inBenutzung', { name: typ.bezeichnung }))
      return
    }
    try {
      await kabeltypStore.loeschen(typ.id)
      await nachAenderung()
    } catch (fehler) {
      useUiStore
        .getState()
        .zeigeToast(
          fehler instanceof Error
            ? fehler.message
            : t('katalogdialoge.gemeinsam.loeschenFehlgeschlagen'),
        )
    }
  }

  async function uebernehmeAusZeichnung() {
    for (const typ of fehlende) {
      await kabeltypStore.speichern({ ...typ, herkunft: 'benutzer', seedVersion: undefined })
    }
    await nachAenderung()
    useUiStore
      .getState()
      .zeigeToast(t('katalogdialoge.kabeltypen.uebernommen', { n: fehlende.length }))
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-gross" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('katalogdialoge.kabeltypen.titel')}</h2>
        <p className="dialog-hinweis">{t('katalogdialoge.kabeltypen.hinweis')}</p>

        {fehlende.length > 0 && (
          <p className="dialog-hinweis kabeltyp-uebernahme">
            {t('katalogdialoge.kabeltypen.nichtImBestand', { n: fehlende.length })}{' '}
            <button type="button" onClick={() => void uebernehmeAusZeichnung()}>
              {t('katalogdialoge.kabeltypen.inMeineUebernehmen')}
            </button>
          </p>
        )}

        <div className="kabeltyp-verwaltung">
          <div className="kabeltyp-gruppenspalte">
            <button
              type="button"
              className={gruppenFilter === null ? 'aktiv' : ''}
              onClick={() => setGruppenFilter(null)}
            >
              {t('katalogdialoge.kabeltypen.alle', { n: typen.length })}
            </button>
            {alleGruppen.map((gruppe) => (
              <button
                key={gruppe.gruppe}
                type="button"
                className={gruppenFilter === gruppe.gruppe ? 'aktiv' : ''}
                onClick={() => setGruppenFilter(gruppe.gruppe)}
              >
                {gruppe.text} ({gruppe.typen.length})
              </button>
            ))}
          </div>

          <div className="kabeltyp-tabellenspalte">
            <input
              className="kabeltyp-suchfeld"
              value={suche}
              placeholder={t('katalogdialoge.kabeltypen.suchen')}
              onChange={(e) => setSuche(e.target.value)}
            />
            <div className="kabeltyp-tabelle">
              {gruppen.map((gruppe) => (
                <div key={gruppe.gruppe}>
                  <div className="kabeltyp-gruppe">{gruppe.text}</div>
                  {gruppe.typen.map((typ) => (
                    <div key={typ.id} className={`kabeltyp-zeile${typ.aktiv ? '' : ' inaktiv'}`}>
                      <span className="kabeltyp-zeile-name">{typ.bezeichnung}</span>
                      <span className="kabeltyp-zeile-bemerkung">
                        {kabeltypBemerkung(typ, sprache)}
                      </span>
                      <span className="kabeltyp-zeile-herkunft">
                        {typ.herkunft === 'standard'
                          ? t('katalogdialoge.gemeinsam.standard')
                          : t('katalogdialoge.gemeinsam.eigen')}
                      </span>
                      <button
                        type="button"
                        title={
                          typ.aktiv
                            ? t('katalogdialoge.kabeltypen.ausAuswahl')
                            : t('katalogdialoge.gemeinsam.wiederAnbieten')
                        }
                        onClick={() => void speichere({ ...typ, aktiv: !typ.aktiv })}
                      >
                        {typ.aktiv
                          ? t('katalogdialoge.gemeinsam.aktiv')
                          : t('katalogdialoge.gemeinsam.inaktiv')}
                      </button>
                      <button
                        type="button"
                        disabled={typ.herkunft === 'standard'}
                        title={
                          typ.herkunft === 'standard'
                            ? t('katalogdialoge.kabeltypen.mitgeliefertDuplizieren')
                            : undefined
                        }
                        onClick={() => setBearbeitet(typ)}
                      >
                        {t('katalogdialoge.gemeinsam.bearbeiten')}
                      </button>
                      <button type="button" onClick={() => void speichere(dupliziereKabeltyp(typ))}>
                        {t('katalogdialoge.gemeinsam.duplizieren')}
                      </button>
                      <button
                        type="button"
                        disabled={typ.herkunft === 'standard'}
                        title={
                          typ.herkunft === 'standard'
                            ? t('katalogdialoge.kabeltypen.nurDeaktivieren')
                            : undefined
                        }
                        onClick={() => void loesche(typ)}
                      >
                        {t('katalogdialoge.gemeinsam.loeschen')}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              {sichtbar.length === 0 && (
                <p className="dialog-hinweis">{t('katalogdialoge.kabeltypen.keinGefunden')}</p>
              )}
            </div>
          </div>
        </div>

        {bearbeitet && (
          <KabeltypFormular
            key={bearbeitet.id}
            typ={bearbeitet}
            abbrechen={() => setBearbeitet(null)}
            speichern={(typ) => void speichere(typ)}
          />
        )}

        <div className="dialog-aktionen">
          <button
            type="button"
            onClick={() =>
              setBearbeitet(
                neuerKabeltyp({
                  bezeichnung: '',
                  gruppe: gruppenFilter ?? t('katalogdialoge.kabeltypen.eigeneGruppe'),
                }),
              )
            }
          >
            {t('katalogdialoge.kabeltypen.neu')}
          </button>
          <button type="button" onClick={schliessen}>
            {t('katalogdialoge.gemeinsam.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}

function KabeltypFormular({
  typ,
  abbrechen,
  speichern,
}: {
  typ: Kabeltyp
  abbrechen: () => void
  speichern: (typ: Kabeltyp) => void
}) {
  const [entwurf, setEntwurf] = useState(typ)
  const t = useT()

  return (
    <div className="kabeltyp-formular">
      <label className="dialog-feld">
        {t('katalogdialoge.kabeltypen.bezeichnung')}
        <input
          autoFocus
          value={entwurf.bezeichnung}
          onChange={(e) => setEntwurf({ ...entwurf, bezeichnung: e.target.value })}
        />
      </label>
      <label className="dialog-feld">
        {t('katalogdialoge.kabeltypen.gruppe')}
        <input
          value={entwurf.gruppe}
          onChange={(e) => setEntwurf({ ...entwurf, gruppe: e.target.value })}
        />
      </label>
      <label className="dialog-feld">
        {t('katalogdialoge.kabeltypen.bemerkung')}
        <input
          value={entwurf.bemerkung ?? ''}
          onChange={(e) => setEntwurf({ ...entwurf, bemerkung: e.target.value || undefined })}
        />
      </label>
      <label className="dialog-feld">
        {t('katalogdialoge.kabeltypen.aussendurchmesser')}
        <ZahlenFeldOptional
          min={0}
          step={0.1}
          value={entwurf.aussendurchmesserMm}
          onCommit={(wert) => setEntwurf({ ...entwurf, aussendurchmesserMm: wert ?? undefined })}
        />
      </label>
      <div className="dialog-aktionen">
        <button
          type="button"
          disabled={!entwurf.bezeichnung.trim() || !entwurf.gruppe.trim()}
          onClick={() =>
            speichern({
              ...entwurf,
              bezeichnung: entwurf.bezeichnung.trim(),
              gruppe: entwurf.gruppe.trim(),
            })
          }
        >
          {t('katalogdialoge.gemeinsam.uebernehmen')}
        </button>
        <button type="button" onClick={abbrechen}>
          {t('katalogdialoge.gemeinsam.abbrechen')}
        </button>
      </div>
    </div>
  )
}
