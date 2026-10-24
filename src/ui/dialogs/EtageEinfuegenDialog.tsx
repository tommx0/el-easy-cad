import { useState } from 'react'
import type { Blatt, EtagenRichtung } from '../../document-model'
import {
  aendereGeschoss,
  erzeugeEtage,
  etagenKopierteTypen,
  etagenVerschiebung,
  etagenVorschlag,
  koteDarunter,
  verschobeneEtagen,
} from '../../document-model'
import { erzeugeBlattEinfuegenCommand } from '../../tools'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { ZahlenFeld } from '../ZahlenFeld'
import type { Uebersetzer } from '../../sprache'
import { formatiereZahl } from '../../sprache'
import { useT } from '../sprache-anbindung'

const formatMeter = (m: number) =>
  `${formatiereZahl(m, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`

export function EtageEinfuegenDialog() {
  const richtung = useUiStore((s) => s.etageEinfuegen)
  const zeichnung = useProject()
  const vorlage = zeichnung.blaetter.find((b) => b.id === zeichnung.aktivesBlattId)
  if (!richtung || !vorlage) return null
  return <Inhalt key={`${vorlage.id}-${richtung}`} richtung={richtung} vorlage={vorlage} />
}

function Inhalt({ richtung, vorlage }: { richtung: EtagenRichtung; vorlage: Blatt }) {
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const t = useT()
  const schliessen = () => useUiStore.getState().setEtageEinfuegen(null)
  const vorschlag = etagenVorschlag(zeichnung, vorlage, richtung)
  const [name, setName] = useState(vorschlag.name)
  const [raumhoehe, setRaumhoehe] = useState(vorschlag.raumhoehe)
  const [deckeCm, setDeckeCm] = useState(Math.round(vorschlag.deckenstaerke * 100))
  const [eigeneKote, setEigeneKote] = useState<number | null>(null)
  const koteVorlage = vorlage.geschoss?.kote ?? 0
  const kote =
    eigeneKote ??
    (richtung === 'darueber'
      ? vorschlag.kote
      : Math.round(koteDarunter(koteVorlage, raumhoehe, deckeCm / 100) * 1000) / 1000)
  const verschiebung = etagenVerschiebung(zeichnung, vorlage, richtung, {
    kote,
    raumhoehe,
    deckenstaerke: deckeCm / 100,
  })
  const [mitfuehren, setMitfuehren] = useState(true)
  const kopierteTypen = etagenKopierteTypen(richtung)
  const kopiert = vorlage.objekte.filter((o) => kopierteTypen.includes(o.type)).length

  function einfuegen() {
    const titel = name.trim() || vorschlag.name
    const etage = erzeugeEtage(
      zeichnung,
      vorlage,
      {
        name: titel,
        kote,
        raumhoehe,
        deckenstaerke: deckeCm / 100,
      },
      richtung,
    )
    const index = zeichnung.blaetter.findIndex((b) => b.id === vorlage.id)
    const ersetzt = [
      ...(vorschlag.ohneKote
        ? [{ ...vorlage, geschoss: aendereGeschoss(vorlage.geschoss, { kote: 0 }) }]
        : []),
      ...(verschiebung && mitfuehren ? verschobeneEtagen(zeichnung.blaetter, verschiebung) : []),
    ]
    commands.execute(
      erzeugeBlattEinfuegenCommand(
        doc,
        etage,
        richtung === 'darueber' ? index + 1 : index,
        t('zeichendialoge.etageEinfuegen.rueckgaengig', { name: titel }),
        ersetzt,
      ),
    )
    schliessen()
    const ui = useUiStore.getState()
    if (!etage.zeichenflaeche) ui.setZeichenflaecheEinrichtenOffen(true)
    ui.zeigeToast(
      etage.objekte.length > 0
        ? t('zeichendialoge.etageEinfuegen.angelegtMitBauelementen', {
            name: titel,
            n: etage.objekte.length,
          })
        : t('zeichendialoge.etageEinfuegen.angelegt', { name: titel }),
    )
  }

  const darueber = richtung === 'darueber'
  const ueberschrift = darueber
    ? t('zeichendialoge.etageEinfuegen.titelDarueber')
    : t('zeichendialoge.etageEinfuegen.titelDarunter')
  const inhalt =
    kopiert > 0
      ? t(
          darueber
            ? 'zeichendialoge.etageEinfuegen.inhaltDarueber'
            : 'zeichendialoge.etageEinfuegen.inhaltDarunter',
          { n: kopiert },
        )
      : t('zeichendialoge.etageEinfuegen.keineBauelemente')
  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog"
        role="dialog"
        aria-label={ueberschrift}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>{ueberschrift}</h2>
        <p className="dialog-hinweis">
          {t(
            darueber
              ? 'zeichendialoge.etageEinfuegen.hinweisDarueber'
              : 'zeichendialoge.etageEinfuegen.hinweisDarunter',
            { name: vorlage.name, inhalt },
          )}
          {vorschlag.ohneKote &&
            ` ${t('zeichendialoge.etageEinfuegen.ohneKote', { name: vorlage.name, kote: formatMeter(0) })}`}
        </p>
        <label className="feld">
          {t('zeichendialoge.etageEinfuegen.name')}
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="feld">
          {t('zeichendialoge.etageEinfuegen.raumhoehe')}
          <ZahlenFeld min={0.5} step={0.05} value={raumhoehe} onCommit={setRaumhoehe} />
        </label>
        <label className="feld">
          {t('zeichendialoge.etageEinfuegen.decke')}
          <ZahlenFeld min={1} step={1} value={deckeCm} onCommit={setDeckeCm} />
        </label>
        <label className="feld">
          {t('zeichendialoge.etageEinfuegen.kote')}
          <ZahlenFeld step={0.05} value={kote} onCommit={setEigeneKote} />
        </label>
        <p className="feld-info">
          {t(
            darueber
              ? 'zeichendialoge.etageEinfuegen.vorschlagDarueber'
              : 'zeichendialoge.etageEinfuegen.vorschlagDarunter',
            { name: vorlage.name, kote: formatMeter(koteVorlage) },
          )}
          {eigeneKote !== null && (
            <>
              {' '}
              <button type="button" className="knopf-verlinkt" onClick={() => setEigeneKote(null)}>
                {t('zeichendialoge.etageEinfuegen.wiederBerechnen')}
              </button>
            </>
          )}
        </p>
        {verschiebung && (
          <>
            <label className="feld-checkbox">
              <input
                type="checkbox"
                checked={mitfuehren}
                onChange={(e) => setMitfuehren(e.target.checked)}
              />
              {t(
                darueber
                  ? 'zeichendialoge.etageEinfuegen.verschiebenNachOben'
                  : 'zeichendialoge.etageEinfuegen.verschiebenNachUnten',
                {
                  etagen: nachrueckenText(
                    t,
                    verschiebung.nachbar.name,
                    verschiebung.blattIds.length,
                    darueber,
                  ),
                  abstand: formatMeter(Math.abs(verschiebung.delta)),
                },
              )}
            </label>
            {!mitfuehren && (
              <p className="feld-info">
                {t('zeichendialoge.etageEinfuegen.ueberschneidung', {
                  name: verschiebung.nachbar.name,
                })}
              </p>
            )}
          </>
        )}
        <div className="dialog-aktionen">
          <button type="button" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button type="button" className="primaer" onClick={einfuegen}>
            {t('zeichendialoge.etageEinfuegen.einfuegen')}
          </button>
        </div>
      </div>
    </div>
  )
}

function nachrueckenText(
  t: Uebersetzer,
  nachbar: string,
  anzahl: number,
  darueber: boolean,
): string {
  const weitere = anzahl - 1
  if (weitere === 0) return t('zeichendialoge.etageEinfuegen.nachbar', { name: nachbar })
  if (weitere === 1)
    return t(
      darueber
        ? 'zeichendialoge.etageEinfuegen.nachbarUndEtageDarueber'
        : 'zeichendialoge.etageEinfuegen.nachbarUndEtageDarunter',
      { name: nachbar },
    )
  return t(
    darueber
      ? 'zeichendialoge.etageEinfuegen.nachbarUndEtagenDarueber'
      : 'zeichendialoge.etageEinfuegen.nachbarUndEtagenDarunter',
    { name: nachbar, n: weitere },
  )
}
