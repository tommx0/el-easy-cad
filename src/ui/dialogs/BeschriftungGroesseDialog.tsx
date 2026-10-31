import { useRef } from 'react'
import { skalaAusGroessenFaktor, type KomponentenDarstellung } from '../../document-model'
import { UpdateBlattCommand, erzeugeBlattAendernCommand } from '../../tools'
import { useAppContext, useAktivesBlatt } from '../use-app-context'
import { useUiStore } from '../store/ui-store'
import type { Schluessel } from '../../sprache'
import { useT } from '../sprache-anbindung'

type BlattFaktorFeld = 'textGroessenFaktor' | 'symbolGroessenFaktor'

const LABEL: Record<
  BlattFaktorFeld,
  { name: Schluessel; global: Schluessel; aendern: Schluessel }
> = {
  textGroessenFaktor: {
    name: 'zeichendialoge.beschriftungGroesse.textgroesse',
    global: 'zeichendialoge.beschriftungGroesse.textgroesseGlobal',
    aendern: 'zeichendialoge.beschriftungGroesse.textgroesseAendern',
  },
  symbolGroessenFaktor: {
    name: 'zeichendialoge.beschriftungGroesse.symbolgroesse',
    global: 'zeichendialoge.beschriftungGroesse.symbolgroesseGlobal',
    aendern: 'zeichendialoge.beschriftungGroesse.symbolgroesseAendern',
  },
}

export function BeschriftungGroesseDialog() {
  const offen = useUiStore((s) => s.beschriftungGroesseOffen)
  const schliessen = () => useUiStore.getState().setBeschriftungGroesseOffen(false)
  const t = useT()

  if (!offen) return null

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('zeichendialoge.beschriftungGroesse.titel')}</h2>
        <BeschriftungGroesseInhalt />
        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('zeichendialoge.gemeinsam.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function BeschriftungGroesseInhalt() {
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const t = useT()

  return (
    <>
      <p className="dialog-hinweis">
        {t('zeichendialoge.beschriftungGroesse.hinweis', { name: blatt.name })}
      </p>

      <label className="feld">
        {t('zeichendialoge.beschriftungGroesse.komponentenZeigen')}
        <select
          value={blatt.komponentenDarstellung}
          onChange={(e) =>
            commands.execute(
              erzeugeBlattAendernCommand(
                doc,
                blatt.id,
                t('zeichendialoge.beschriftungGroesse.darstellungAendern'),
                {
                  komponentenDarstellung: e.target.value as KomponentenDarstellung,
                },
              ),
            )
          }
        >
          <option value="symbol">{t('zeichendialoge.beschriftungGroesse.schaltplansymbol')}</option>
          <option value="bild">{t('zeichendialoge.beschriftungGroesse.produktbild')}</option>
        </select>
      </label>
      <p className="dialog-hinweis">{t('zeichendialoge.beschriftungGroesse.anzeigenHinweis')}</p>

      <BlattFaktorRegler feld="textGroessenFaktor" />
      <BlattFaktorRegler feld="symbolGroessenFaktor" />
    </>
  )
}

function BlattFaktorRegler({ feld }: { feld: BlattFaktorFeld }) {
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const vorherRef = useRef<number | null>(null)
  const t = useT()
  const texte = LABEL[feld]
  const wert = blatt[feld]
  const prozent = Math.round(skalaAusGroessenFaktor(wert) * 100)

  function waehrendZiehen(neu: number) {
    if (vorherRef.current === null) vorherRef.current = blatt[feld]
    doc.updateBlatt(blatt.id, { [feld]: neu })
  }

  function uebernehmen() {
    const vorher = vorherRef.current
    vorherRef.current = null
    if (vorher === null || vorher === blatt[feld]) return
    if (feld === 'textGroessenFaktor') {
      commands.push(
        new UpdateBlattCommand(
          doc,
          blatt.id,
          { textGroessenFaktor: vorher },
          { textGroessenFaktor: blatt.textGroessenFaktor },
          t(texte.aendern),
        ),
      )
    } else {
      commands.push(
        new UpdateBlattCommand(
          doc,
          blatt.id,
          { symbolGroessenFaktor: vorher },
          { symbolGroessenFaktor: blatt.symbolGroessenFaktor },
          t(texte.aendern),
        ),
      )
    }
  }

  return (
    <label className="feld">
      {t(texte.name)}
      <span className="feld-groessenfaktor-regler">
        <input
          type="range"
          min={-5}
          max={5}
          step={0.01}
          value={wert}
          aria-label={t(texte.global)}
          onChange={(e) => waehrendZiehen(Number(e.target.value))}
          onPointerUp={uebernehmen}
          onKeyUp={uebernehmen}
          onBlur={uebernehmen}
        />
        <span>
          {wert.toFixed(2)} · {prozent} %
        </span>
      </span>
    </label>
  )
}
