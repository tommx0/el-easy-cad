import { useRef } from 'react'
import {
  istSchaltplan,
  skalaAusGroessenFaktor,
  type KomponentenDarstellung,
} from '../../document-model'
import { UpdateBlattCommand, erzeugeBlattAendernCommand } from '../../tools'
import { useAppContext, useAktivesBlatt, useProject } from '../use-app-context'
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

type BlattSichtbarkeitFeld =
  | 'beschriftungSichtbar'
  | 'bezeichnungSichtbar'
  | 'leitungBezeichnungSichtbar'
  | 'leitungBeschreibungSichtbar'
  | 'leitungTypSichtbar'
  | 'trunkBezeichnungSichtbar'
  | 'trunkBeschreibungSichtbar'
  | 'raumNameSichtbar'
  | 'raumFlaecheSichtbar'
  | 'installationshoeheSichtbar'
  | 'schaltverbindungBezeichnungSichtbar'
  | 'kennzeichenSichtbar'
  | 'abgaengeSichtbar'
  | 'stromkreisSichtbar'
  | 'stromkreisSchildSichtbar'

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
  const schaltplan = istSchaltplan(useProject())
  const t = useT()

  function sichtbarkeitUmschalten(feld: BlattSichtbarkeitFeld) {
    const label = t(`aktionen.blattSichtbarkeit.${feld}`)
    switch (feld) {
      case 'beschriftungSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            beschriftungSichtbar: !blatt.beschriftungSichtbar,
          }),
        )
        return
      case 'bezeichnungSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            bezeichnungSichtbar: !blatt.bezeichnungSichtbar,
          }),
        )
        return
      case 'leitungBezeichnungSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            leitungBezeichnungSichtbar: !blatt.leitungBezeichnungSichtbar,
          }),
        )
        return
      case 'leitungBeschreibungSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            leitungBeschreibungSichtbar: !blatt.leitungBeschreibungSichtbar,
          }),
        )
        return
      case 'leitungTypSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            leitungTypSichtbar: !blatt.leitungTypSichtbar,
          }),
        )
        return
      case 'trunkBezeichnungSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            trunkBezeichnungSichtbar: !blatt.trunkBezeichnungSichtbar,
          }),
        )
        return
      case 'trunkBeschreibungSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            trunkBeschreibungSichtbar: !blatt.trunkBeschreibungSichtbar,
          }),
        )
        return
      case 'raumNameSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            raumNameSichtbar: !blatt.raumNameSichtbar,
          }),
        )
        return
      case 'raumFlaecheSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            raumFlaecheSichtbar: !blatt.raumFlaecheSichtbar,
          }),
        )
        return
      case 'installationshoeheSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            installationshoeheSichtbar: !blatt.installationshoeheSichtbar,
          }),
        )
        return
      case 'schaltverbindungBezeichnungSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            schaltverbindungBezeichnungSichtbar: !blatt.schaltverbindungBezeichnungSichtbar,
          }),
        )
        return
      case 'kennzeichenSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            kennzeichenSichtbar: !blatt.kennzeichenSichtbar,
          }),
        )
        return
      case 'abgaengeSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            abgaengeSichtbar: !blatt.abgaengeSichtbar,
          }),
        )
        return
      case 'stromkreisSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            stromkreisSichtbar: !blatt.stromkreisSichtbar,
          }),
        )
        return
      case 'stromkreisSchildSichtbar':
        commands.execute(
          erzeugeBlattAendernCommand(doc, blatt.id, label, {
            stromkreisSchildSichtbar: !blatt.stromkreisSchildSichtbar,
          }),
        )
        return
    }
  }

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
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.bezeichnungSichtbar}
          onChange={() => sichtbarkeitUmschalten('bezeichnungSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.bezeichnung')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.beschriftungSichtbar}
          onChange={() => sichtbarkeitUmschalten('beschriftungSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.beschriftung')}
      </label>
      {!schaltplan && (
        <label className="feld feld-checkbox">
          <input
            type="checkbox"
            checked={blatt.installationshoeheSichtbar}
            onChange={() => sichtbarkeitUmschalten('installationshoeheSichtbar')}
          />
          {t('zeichendialoge.beschriftungGroesse.installationshoehe')}
        </label>
      )}
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.leitungBezeichnungSichtbar}
          onChange={() => sichtbarkeitUmschalten('leitungBezeichnungSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.leitungsnummer')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.leitungTypSichtbar}
          onChange={() => sichtbarkeitUmschalten('leitungTypSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.leitungstyp')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.leitungBeschreibungSichtbar}
          onChange={() => sichtbarkeitUmschalten('leitungBeschreibungSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.leitungsbeschreibung')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.trunkBezeichnungSichtbar}
          onChange={() => sichtbarkeitUmschalten('trunkBezeichnungSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.trunkName')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.trunkBeschreibungSichtbar}
          onChange={() => sichtbarkeitUmschalten('trunkBeschreibungSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.trunkBeschreibung')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.raumNameSichtbar}
          onChange={() => sichtbarkeitUmschalten('raumNameSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.raumname')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.raumFlaecheSichtbar}
          onChange={() => sichtbarkeitUmschalten('raumFlaecheSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.raumflaeche')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.schaltverbindungBezeichnungSichtbar}
          onChange={() => sichtbarkeitUmschalten('schaltverbindungBezeichnungSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.potentialnamen')}
      </label>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={blatt.kennzeichenSichtbar}
          onChange={() => sichtbarkeitUmschalten('kennzeichenSichtbar')}
        />
        {t('zeichendialoge.beschriftungGroesse.kennzeichen')}
      </label>
      {schaltplan && (
        <label className="feld feld-checkbox">
          <input
            type="checkbox"
            checked={blatt.abgaengeSichtbar}
            onChange={() => sichtbarkeitUmschalten('abgaengeSichtbar')}
          />
          {t('zeichendialoge.beschriftungGroesse.abgaenge')}
        </label>
      )}
      {!schaltplan && (
        <>
          <label className="feld feld-checkbox">
            <input
              type="checkbox"
              checked={blatt.stromkreisSichtbar}
              onChange={() => sichtbarkeitUmschalten('stromkreisSichtbar')}
            />
            {t('zeichendialoge.beschriftungGroesse.stromkreis')}
          </label>
          <label className="feld feld-checkbox">
            <input
              type="checkbox"
              checked={blatt.stromkreisSchildSichtbar}
              onChange={() => sichtbarkeitUmschalten('stromkreisSchildSichtbar')}
            />
            {t('zeichendialoge.beschriftungGroesse.stromkreisSchild')}
          </label>
        </>
      )}

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
