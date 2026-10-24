import { useState } from 'react'
import type { IfcBauteilfunde } from '../../ifc'
import { schlageZuordnungVor } from '../../ifc'
import type { IfcNachladeAuftrag } from '../../rendering'
import { useUiStore } from '../store/ui-store'
import type { HintergrundIfcNachladenZustand, IfcNachladeErgebnis } from '../store/ui-store'
import { formatiereZahl } from '../../sprache'
import { useT } from '../sprache-anbindung'

type Wahl = string

const AUSLASSEN = 'aus'
const FREI_NEU = 'frei'

function anfangsWahl(zustand: HintergrundIfcNachladenZustand): Record<string, Wahl> {
  const vorschlag = schlageZuordnungVor(zustand.blaetter, zustand.sitzung.geschosse)
  const wahl: Record<string, Wahl> = {}
  for (const blatt of zustand.blaetter) {
    if (blatt.freieHoehe !== undefined) {
      wahl[blatt.blattId] = FREI_NEU
      continue
    }
    const id = vorschlag.get(blatt.blattId)
    wahl[blatt.blattId] = id === null || id === undefined ? AUSLASSEN : String(id)
  }
  return wahl
}

export function HintergrundIfcNachladenDialog() {
  const zustand = useUiStore((s) => s.hintergrundIfcNachladenDialog)
  const t = useT()
  const [wahl, setWahl] = useState<Record<string, Wahl>>({})
  const [fortschritt, setFortschritt] = useState<{ erledigt: number; gesamt: number } | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  const [vorherigerZustand, setVorherigerZustand] = useState(zustand)
  if (zustand !== vorherigerZustand) {
    setVorherigerZustand(zustand)
    setWahl(zustand ? anfangsWahl(zustand) : {})
    setFortschritt(null)
    setFehler(null)
  }

  if (!zustand) return null
  const { sitzung, blaetter, callback } = zustand
  const laeuft = fortschritt !== null
  const zuLaden = blaetter.filter((b) => (wahl[b.blattId] ?? AUSLASSEN) !== AUSLASSEN)
  const doppelt = (() => {
    const ids = zuLaden.map((b) => wahl[b.blattId]).filter((w) => w !== FREI_NEU)
    return ids.length !== new Set(ids).size
  })()

  function schliesse() {
    sitzung.schliesse()
    useUiStore.getState().schliesseHintergrundIfcNachladenDialog()
  }

  function abbrechen() {
    callback(null)
    schliesse()
  }

  async function uebernehmen() {
    if (zuLaden.length === 0 || doppelt) return
    const auftraege: IfcNachladeAuftrag[] = zuLaden.map((b) => ({
      ziel:
        wahl[b.blattId] === FREI_NEU && b.freieHoehe !== undefined
          ? { freieHoehe: b.freieHoehe }
          : { geschossId: Number(wahl[b.blattId]) },
      schnitthoehe: b.schnitthoehe,
      lage: b.lage,
    }))
    setFehler(null)
    setFortschritt({ erledigt: 0, gesamt: auftraege.length })
    try {
      const grundrisse = await sitzung.nachlade(auftraege, (erledigt, gesamt) =>
        setFortschritt({ erledigt, gesamt }),
      )
      const bauteile: (IfcBauteilfunde | undefined)[] = []
      for (const [i, b] of zuLaden.entries()) {
        bauteile.push(
          b.bauteileVergleichen
            ? await sitzung.bauteile({
                ziel: auftraege[i].ziel,
                schnitthoehe: auftraege[i].schnitthoehe,
              })
            : undefined,
        )
      }
      const ergebnis: IfcNachladeErgebnis = {
        blaetter: zuLaden.map((b, i) => ({
          blattId: b.blattId,
          geschoss:
            wahl[b.blattId] === FREI_NEU
              ? null
              : (sitzung.geschosse.find((g) => String(g.expressId) === wahl[b.blattId]) ?? null),
          grundriss: grundrisse[i],
          ...(bauteile[i] ? { bauteile: bauteile[i] } : {}),
        })),
      }
      callback(ergebnis)
      schliesse()
    } catch (e) {
      if (useUiStore.getState().hintergrundIfcNachladenDialog !== zustand) return
      setFortschritt(null)
      setFehler(e instanceof Error ? e.message : t('zeichendialoge.ifcNachladen.fehlgeschlagen'))
    }
  }

  return (
    <div className="dialog-overlay">
      <div className="dialog dialog-breit">
        <h2>{t('zeichendialoge.ifcNachladen.titel')}</h2>
        <p className="dialog-hinweis">
          {t('zeichendialoge.ifcNachladen.hinweis', { datei: sitzung.dateiname })}
        </p>

        <div className="ifc-nachladen-tabelle">
          {blaetter.map((b) => (
            <label key={b.blattId} className="ifc-nachladen-zeile">
              <span className="ifc-nachladen-blatt">
                <strong>{b.blattName}</strong>
                <span>
                  {b.freieHoehe !== undefined
                    ? t('zeichendialoge.ifcNachladen.eigenerSchnitt', {
                        hoehe: `${formatiereZahl(b.freieHoehe, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`,
                      })
                    : t('zeichendialoge.ifcNachladen.bisher', {
                        name: b.geschossName ?? t('zeichendialoge.ifcNachladen.unbekannt'),
                      })}
                </span>
              </span>
              <select
                aria-label={t('zeichendialoge.ifcNachladen.ariaGeschoss', { name: b.blattName })}
                value={wahl[b.blattId] ?? AUSLASSEN}
                disabled={laeuft}
                onChange={(e) => setWahl((bisher) => ({ ...bisher, [b.blattId]: e.target.value }))}
              >
                {b.freieHoehe !== undefined ? (
                  <option value={FREI_NEU}>{t('zeichendialoge.ifcNachladen.neuSchneiden')}</option>
                ) : (
                  sitzung.geschosse.map((g) => (
                    <option key={g.expressId} value={String(g.expressId)}>
                      {g.name}
                    </option>
                  ))
                )}
                <option value={AUSLASSEN}>{t('zeichendialoge.ifcNachladen.nichtNeuLaden')}</option>
              </select>
            </label>
          ))}
        </div>

        {doppelt && (
          <p className="dialog-hinweis ifc-fehler">{t('zeichendialoge.ifcNachladen.doppelt')}</p>
        )}
        {fortschritt && (
          <div className="ifc-fortschritt">
            <progress value={fortschritt.erledigt} max={fortschritt.gesamt} />
            <span>
              {fortschritt.erledigt < fortschritt.gesamt
                ? t('zeichendialoge.ifcNachladen.blattWirdGeschnitten', {
                    nr: fortschritt.erledigt + 1,
                    gesamt: fortschritt.gesamt,
                  })
                : t('zeichendialoge.ifcNachladen.grundrisseUebernehmen')}
            </span>
          </div>
        )}
        {fehler && <p className="dialog-hinweis ifc-fehler">{fehler}</p>}

        <div className="dialog-aktionen">
          <button type="button" onClick={abbrechen}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            onClick={() => void uebernehmen()}
            disabled={laeuft || zuLaden.length === 0 || doppelt}
          >
            {t('zeichendialoge.ifcNachladen.neuLaden', { n: zuLaden.length })}
          </button>
        </div>
      </div>
    </div>
  )
}
