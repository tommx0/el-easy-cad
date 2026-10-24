import { useMemo, useState } from 'react'
import {
  beschreibeSchachtStraenge,
  ermittleSchachtStraenge,
  ermittleSchaechteAnKette,
  ermittleSwitchesAnKette,
  findeSchacht,
  naechsteFreieStrangNummer,
  pruefeStrangAnschluss,
  strangNamenImVerbund,
  strangTitelMitKlartext,
  trunkAnzeigeName,
  trunksAmSchacht,
} from '../../document-model'
import { useKatalogStore } from '../store/katalog-store'
import { useAppContext } from '../use-app-context'
import type { SchachtAnschlussDialogZustand, SchachtAnschlussErgebnis } from '../store/ui-store'
import { useUiStore } from '../store/ui-store'
import { useT } from '../sprache-anbindung'

export function SchachtAnschlussDialog() {
  const dialog = useUiStore((s) => s.schachtAnschlussDialog)
  if (!dialog) return null
  return <SchachtAnschlussDialogInhalt dialog={dialog} />
}

type Auswahl = number | 'neu' | { trunkId: string }

function SchachtAnschlussDialogInhalt({ dialog }: { dialog: SchachtAnschlussDialogZustand }) {
  const t = useT()
  const { doc } = useAppContext()
  const katalog = useKatalogStore((s) => s.komponenten)
  const [auswahl, setAuswahl] = useState<Auswahl>('neu')
  const [eingaben, setEingaben] = useState<Record<string, string>>({})

  const zeichnung = doc.getZeichnung()
  const schacht = findeSchacht(zeichnung, dialog.blattId, dialog.schachtId)

  const trunkZeilen = useMemo(() => {
    if (!schacht || dialog.art !== 'leitung' || !dialog.trunkErlaubt) return []
    return trunksAmSchacht(zeichnung, dialog.blattId, dialog.schachtId).map((trunk) => {
      const name = trunkAnzeigeName(zeichnung, dialog.blattId, trunk.id)
      const switches = ermittleSwitchesAnKette(zeichnung, dialog.blattId, trunk.id).length
      const schaechte = ermittleSchaechteAnKette(zeichnung, dialog.blattId, trunk.id).length
      const ziele = [
        switches > 0 ? t('verteilerdialoge.schachtAnschluss.zielSwitches', { n: switches }) : null,
        schaechte > 0
          ? t('verteilerdialoge.schachtAnschluss.zielSchaechte', { n: schaechte })
          : null,
      ].filter((s): s is string => s !== null)
      return {
        trunk,
        name,
        waehlbar: ziele.length > 0,
        beschreibung:
          ziele.length > 0
            ? t('verteilerdialoge.schachtAnschluss.erreicht', { ziele: ziele.join(', ') })
            : null,
      }
    })
  }, [dialog, schacht, zeichnung, t])

  const zeilen = useMemo(() => {
    if (!schacht) return []
    const anzeigen = new Map(
      beschreibeSchachtStraenge(zeichnung, schacht.verbundId, katalog).map((a) => [a.nummer, a]),
    )
    const beschreibe = (nummer: number): string => {
      const anzeige = anzeigen.get(nummer)
      if (!anzeige) return `S${nummer}`
      const etagen = [...new Set(anzeige.eintraege.map((e) => e.blattName))].join(', ')
      return strangTitelMitKlartext(nummer, anzeige.name, `${anzeige.kurz} (${etagen})`)
    }
    return ermittleSchachtStraenge(zeichnung, schacht.verbundId)
      .filter((strang) => strang.art === dialog.art)
      .map((strang) => {
        const pruefung = pruefeStrangAnschluss(
          strang,
          dialog.art,
          dialog.blattId,
          dialog.objektId ?? '',
        )
        return {
          strang,
          beschreibung: beschreibe(strang.nummer),
          waehlbar: pruefung.erlaubt,
          hinweis: pruefung.erlaubt
            ? pruefung.hinweisGleichesBlatt
              ? t('verteilerdialoge.schachtAnschluss.hinweisGleichesBlatt')
              : null
            : pruefung.grund === 'belegt'
              ? t('verteilerdialoge.schachtAnschluss.belegt')
              : t('verteilerdialoge.schachtAnschluss.schonAngeschlossen'),
        }
      })
  }, [dialog, schacht, zeichnung, katalog, t])

  if (!schacht) return null

  const neueNummer = naechsteFreieStrangNummer(zeichnung, schacht.verbundId)
  const gewaehlteZeile =
    typeof auswahl === 'number' ? zeilen.find((z) => z.strang.nummer === auswahl) : undefined
  const vorhandeneNamen = strangNamenImVerbund(zeichnung, schacht.verbundId)
  const nameSchluessel = typeof auswahl === 'object' ? null : String(auswahl)
  const vorhandenerName = typeof auswahl === 'number' ? (vorhandeneNamen[auswahl] ?? '') : ''
  const nameWert = nameSchluessel === null ? '' : (eingaben[nameSchluessel] ?? vorhandenerName)

  function schliessenMit(ergebnis: SchachtAnschlussErgebnis | null) {
    useUiStore.getState().schliesseSchachtAnschlussDialog()
    dialog.callback(ergebnis)
  }

  function bestaetigen() {
    if (typeof auswahl === 'object') {
      schliessenMit({ art: 'trunk', trunkId: auswahl.trunkId })
    } else if (auswahl === 'neu') {
      schliessenMit({ art: 'strang', strang: neueNummer, name: nameWert })
    } else {
      const geaendert = nameWert.trim() !== vorhandenerName
      schliessenMit({ art: 'strang', strang: auswahl, ...(geaendert ? { name: nameWert } : {}) })
    }
  }

  return (
    <div className="dialog-overlay" onMouseDown={() => schliessenMit(null)}>
      <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verteilerdialoge.schachtAnschluss.titel', { name: schacht.name })}</h2>
        <fieldset className="dialog-feld">
          <legend>
            {dialog.art === 'trunk'
              ? t('verteilerdialoge.schachtAnschluss.trunkAn')
              : t('verteilerdialoge.schachtAnschluss.leitungAn')}
          </legend>
          {zeilen.map((zeile) => (
            <label key={zeile.strang.nummer} className="dialog-radio-zeile">
              <input
                type="radio"
                name="schacht-strang"
                checked={auswahl === zeile.strang.nummer}
                disabled={!zeile.waehlbar}
                onChange={() => setAuswahl(zeile.strang.nummer)}
              />
              {zeile.beschreibung}
              {!zeile.waehlbar && <span className="dialog-hinweis"> ({zeile.hinweis})</span>}
            </label>
          ))}
          <label className="dialog-radio-zeile">
            <input
              type="radio"
              name="schacht-strang"
              checked={auswahl === 'neu'}
              onChange={() => setAuswahl('neu')}
            />
            {t('verteilerdialoge.schachtAnschluss.neuerStrang', { nummer: String(neueNummer) })}
          </label>
        </fieldset>
        {nameSchluessel !== null && (
          <label className="dialog-feld">
            <span>
              {t('verteilerdialoge.schachtAnschluss.strangName', {
                nummer: String(auswahl === 'neu' ? neueNummer : auswahl),
              })}
            </span>
            <input
              value={nameWert}
              placeholder={t('verteilerdialoge.schachtAnschluss.strangNameBeispiel')}
              onChange={(e) => {
                const wert = e.target.value
                setEingaben((alt) => ({ ...alt, [nameSchluessel]: wert }))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') bestaetigen()
              }}
            />
          </label>
        )}
        {trunkZeilen.length > 0 && (
          <fieldset className="dialog-feld">
            <legend>{t('verteilerdialoge.schachtAnschluss.oderTrunk')}</legend>
            {trunkZeilen.map((zeile) => (
              <label key={zeile.trunk.id} className="dialog-radio-zeile">
                <input
                  type="radio"
                  name="schacht-strang"
                  checked={typeof auswahl === 'object' && auswahl.trunkId === zeile.trunk.id}
                  disabled={!zeile.waehlbar}
                  onChange={() => setAuswahl({ trunkId: zeile.trunk.id })}
                />
                {t('verteilerdialoge.schachtAnschluss.inTrunk', { name: zeile.name })}
                {zeile.waehlbar ? (
                  <span className="dialog-hinweis"> ({zeile.beschreibung})</span>
                ) : (
                  <span className="dialog-hinweis">
                    {' '}
                    ({t('verteilerdialoge.schachtAnschluss.trunkOhneZiel')})
                  </span>
                )}
              </label>
            ))}
          </fieldset>
        )}
        {zeilen.length === 0 && trunkZeilen.length === 0 && (
          <p className="dialog-hinweis">{t('verteilerdialoge.schachtAnschluss.nochLeer')}</p>
        )}
        {gewaehlteZeile?.hinweis && <p className="dialog-hinweis">{gewaehlteZeile.hinweis}</p>}
        <div className="dialog-aktionen">
          <button type="button" onClick={() => schliessenMit(null)}>
            {t('verteilerdialoge.allgemein.abbrechen')}
          </button>
          <button type="button" className="primaer" onClick={bestaetigen}>
            {t('verteilerdialoge.schachtAnschluss.anschliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
