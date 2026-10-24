import type { PlankopfObjekt, PlankopfQuelle, PlankopfZeile, Zeichnung } from '../../document-model'
import { erzeugeDinPlankopfZeilen, planspracheVon } from '../../document-model'
import { erzeugeObjektAendernCommand } from '../../tools'
import { assetUrl } from '../../persistence'
import { useAppContext, useProject } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import { useSettingsStore } from '../store/settings-store'
import { ZahlenFeld } from '../ZahlenFeld'
import type { Schluessel } from '../../sprache'
import { useT } from '../sprache-anbindung'

const QUELLEN: { wert: PlankopfQuelle | ''; label: Schluessel }[] = [
  { wert: '', label: 'zeichendialoge.plankopf.quelle.frei' },
  { wert: 'zeichnungName', label: 'zeichendialoge.plankopf.quelle.zeichnungName' },
  { wert: 'blattName', label: 'zeichendialoge.plankopf.quelle.blattName' },
  { wert: 'blattNummerVonAnzahl', label: 'zeichendialoge.plankopf.quelle.blattNummerVonAnzahl' },
  { wert: 'massstab', label: 'zeichendialoge.plankopf.quelle.massstab' },
  { wert: 'blattformat', label: 'zeichendialoge.plankopf.quelle.blattformat' },
  { wert: 'datumHeute', label: 'zeichendialoge.plankopf.quelle.datumHeute' },
]

export function PlankopfDialog() {
  const objektId = useUiStore((s) => s.plankopfDialogObjektId)
  if (!objektId) return null
  return <PlankopfDialogInhalt objektId={objektId} />
}

function PlankopfDialogInhalt({ objektId }: { objektId: string }) {
  const { doc, commands } = useAppContext()
  const t = useT()
  const zeichnung = useProject()
  const firmenlogoAssetId = useSettingsStore((s) => s.firmenlogoAssetId)
  const firmenlogoDateiname = useSettingsStore((s) => s.firmenlogoDateiname)
  const schliessen = () => useUiStore.getState().setPlankopfDialogObjektId(null)

  const treffer = findePlankopf(zeichnung, objektId)
  if (!treffer) return null
  const { objekt, blattId } = treffer

  function aendere(zeilen: PlankopfZeile[], beschreibung: string) {
    commands.execute(
      erzeugeObjektAendernCommand(doc, blattId, beschreibung, (objekte) =>
        objekte.map((o) => (o.id === objektId && o.type === 'plankopf' ? { ...o, zeilen } : o)),
      ),
    )
  }

  function setzeZelle(
    zeilenIndex: number,
    zellenIndex: number,
    patch: Partial<PlankopfObjekt['zeilen'][number]['zellen'][number]>,
    beschreibung: string,
  ) {
    aendere(
      objekt.zeilen.map((zeile, zi) =>
        zi !== zeilenIndex
          ? zeile
          : {
              ...zeile,
              zellen: zeile.zellen.map((zelle, ci) =>
                ci !== zellenIndex ? zelle : { ...zelle, ...patch },
              ),
            },
      ),
      beschreibung,
    )
  }

  function zeileAnfuegen() {
    aendere(
      [
        ...objekt.zeilen,
        {
          hoeheMm: 10,
          zellen: [{ beschriftung: '', wert: '', quelle: null, spanne: 1, logo: null }],
        },
      ],
      t('zeichendialoge.plankopf.zeileAnfuegenUndo'),
    )
  }

  function zeileLoeschen(zeilenIndex: number) {
    aendere(
      objekt.zeilen.filter((_, i) => i !== zeilenIndex),
      t('zeichendialoge.plankopf.zeileLoeschenUndo'),
    )
  }

  function zelleAnfuegen(zeilenIndex: number) {
    aendere(
      objekt.zeilen.map((zeile, i) =>
        i !== zeilenIndex
          ? zeile
          : {
              ...zeile,
              zellen: [
                ...zeile.zellen,
                { beschriftung: '', wert: '', quelle: null, spanne: 1, logo: null },
              ],
            },
      ),
      t('zeichendialoge.plankopf.feldAnfuegenUndo'),
    )
  }

  function logoEinfuegen(zeilenIndex: number, zellenIndex: number) {
    if (!firmenlogoAssetId) return
    setzeZelle(
      zeilenIndex,
      zellenIndex,
      {
        logo: {
          assetId: firmenlogoAssetId,
          dateiname: firmenlogoDateiname ?? t('zeichendialoge.plankopf.logoName'),
        },
      },
      t('zeichendialoge.plankopf.logoEinfuegenUndo'),
    )
  }

  function logoEntfernen(zeilenIndex: number, zellenIndex: number) {
    setzeZelle(
      zeilenIndex,
      zellenIndex,
      { logo: null },
      t('zeichendialoge.plankopf.logoEntfernenUndo'),
    )
  }

  function zelleLoeschen(zeilenIndex: number, zellenIndex: number) {
    aendere(
      objekt.zeilen.map((zeile, i) =>
        i !== zeilenIndex
          ? zeile
          : { ...zeile, zellen: zeile.zellen.filter((_, ci) => ci !== zellenIndex) },
      ),
      t('zeichendialoge.plankopf.feldLoeschenUndo'),
    )
  }

  function vorgabeWiederherstellen() {
    useUiStore.getState().oeffneBestaetigung({
      titel: t('zeichendialoge.plankopf.dinVorgabe'),
      nachricht: t('zeichendialoge.plankopf.dinFrage'),
      bestaetigenText: t('zeichendialoge.plankopf.zuruecksetzen'),
      callback: (ja) => {
        if (ja)
          aendere(
            erzeugeDinPlankopfZeilen(new Date(), planspracheVon(zeichnung)),
            t('zeichendialoge.plankopf.dinZuruecksetzenUndo'),
          )
      },
    })
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-breit" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('zeichendialoge.plankopf.titel')}</h2>
        <p className="dialog-hinweis">{t('zeichendialoge.plankopf.hinweis')}</p>

        <div className="plankopf-zeilen">
          {objekt.zeilen.map((zeile, zeilenIndex) => (
            <fieldset key={zeilenIndex} className="plankopf-zeile">
              <legend>
                {t('zeichendialoge.plankopf.zeile', { nr: zeilenIndex + 1 })}
                <label className="plankopf-zeilenhoehe">
                  {t('zeichendialoge.plankopf.hoehe')}
                  <ZahlenFeld
                    min={2}
                    step={1}
                    value={Math.round(zeile.hoeheMm * 10) / 10}
                    onCommit={(hoeheMm) =>
                      aendere(
                        objekt.zeilen.map((z, i) => (i === zeilenIndex ? { ...z, hoeheMm } : z)),
                        t('zeichendialoge.plankopf.zeilenhoeheUndo'),
                      )
                    }
                  />
                  mm
                </label>
                <button
                  type="button"
                  className="plankopf-knopf-klein"
                  onClick={() => zeileLoeschen(zeilenIndex)}
                  disabled={objekt.zeilen.length <= 1}
                  title={
                    objekt.zeilen.length <= 1
                      ? t('zeichendialoge.plankopf.letzteZeile')
                      : t('zeichendialoge.plankopf.dieseZeileLoeschen')
                  }
                >
                  {t('zeichendialoge.plankopf.zeileLoeschen')}
                </button>
              </legend>

              <table className="plankopf-tabelle">
                <thead>
                  <tr>
                    <th>{t('zeichendialoge.plankopf.spalteBeschriftung')}</th>
                    <th>{t('zeichendialoge.plankopf.spalteInhalt')}</th>
                    <th>{t('zeichendialoge.plankopf.spalteQuelle')}</th>
                    <th>{t('zeichendialoge.plankopf.spalteLogo')}</th>
                    <th>{t('zeichendialoge.plankopf.spalteAnteil')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {zeile.zellen.map((zelle, zellenIndex) => (
                    <tr key={zellenIndex}>
                      <td>
                        <input
                          value={zelle.beschriftung}
                          placeholder={t('zeichendialoge.plankopf.beschriftungPlatzhalter')}
                          onChange={(e) =>
                            setzeZelle(
                              zeilenIndex,
                              zellenIndex,
                              { beschriftung: e.target.value },
                              t('zeichendialoge.plankopf.feldbeschriftungUndo'),
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={zelle.wert}
                          disabled={zelle.quelle !== null || !!zelle.logo}
                          placeholder={
                            zelle.logo
                              ? t('zeichendialoge.plankopf.durchLogo')
                              : zelle.quelle
                                ? t('zeichendialoge.plankopf.automatisch')
                                : ''
                          }
                          onChange={(e) =>
                            setzeZelle(
                              zeilenIndex,
                              zellenIndex,
                              { wert: e.target.value },
                              t('zeichendialoge.plankopf.feldinhaltUndo'),
                            )
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={zelle.quelle ?? ''}
                          disabled={!!zelle.logo}
                          onChange={(e) =>
                            setzeZelle(
                              zeilenIndex,
                              zellenIndex,
                              { quelle: (e.target.value || null) as PlankopfQuelle | null },
                              t('zeichendialoge.plankopf.inhaltsquelleUndo'),
                            )
                          }
                        >
                          {QUELLEN.map((q) => (
                            <option key={q.wert} value={q.wert}>
                              {t(q.label)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="plankopf-logo-zelle">
                        {zelle.logo ? (
                          <>
                            <img
                              className="plankopf-logo-vorschau"
                              src={assetUrl(zelle.logo.assetId)}
                              alt={zelle.logo.dateiname}
                            />
                            <button
                              type="button"
                              className="plankopf-knopf-klein"
                              onClick={() => logoEntfernen(zeilenIndex, zellenIndex)}
                            >
                              {t('zeichendialoge.plankopf.entfernen')}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="plankopf-knopf-klein"
                            disabled={!firmenlogoAssetId}
                            title={
                              firmenlogoAssetId ? undefined : t('zeichendialoge.plankopf.logoFehlt')
                            }
                            onClick={() => logoEinfuegen(zeilenIndex, zellenIndex)}
                          >
                            {t('zeichendialoge.plankopf.einfuegen')}
                          </button>
                        )}
                      </td>
                      <td>
                        <ZahlenFeld
                          min={1}
                          step={1}
                          className="plankopf-spanne"
                          value={zelle.spanne}
                          onCommit={(spanne) =>
                            setzeZelle(
                              zeilenIndex,
                              zellenIndex,
                              { spanne: Math.round(spanne) },
                              t('zeichendialoge.plankopf.feldbreiteUndo'),
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="plankopf-knopf-klein"
                          onClick={() => zelleLoeschen(zeilenIndex, zellenIndex)}
                          disabled={zeile.zellen.length <= 1}
                          title={
                            zeile.zellen.length <= 1
                              ? t('zeichendialoge.plankopf.letztesFeld')
                              : t('zeichendialoge.plankopf.diesesFeldLoeschen')
                          }
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                className="plankopf-knopf-klein"
                onClick={() => zelleAnfuegen(zeilenIndex)}
              >
                {t('zeichendialoge.plankopf.feldAnfuegen')}
              </button>
            </fieldset>
          ))}
        </div>

        <div className="plankopf-aktionen">
          <button type="button" onClick={zeileAnfuegen}>
            {t('zeichendialoge.plankopf.zeileAnfuegen')}
          </button>
          <button type="button" onClick={vorgabeWiederherstellen}>
            {t('zeichendialoge.plankopf.dinVorgabe')}
          </button>
        </div>

        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}

function findePlankopf(
  zeichnung: Zeichnung,
  objektId: string,
): { objekt: PlankopfObjekt; blattId: string } | null {
  for (const blatt of zeichnung.blaetter) {
    const objekt = blatt.objekte.find((o) => o.id === objektId)
    if (objekt?.type === 'plankopf') return { objekt, blattId: blatt.id }
  }
  return null
}
