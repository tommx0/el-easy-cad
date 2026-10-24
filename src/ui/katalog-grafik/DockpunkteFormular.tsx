import type { DockpunkteKonfiguration, PortsDockpunkteKonfiguration } from '../../document-model'
import { DockpunkteVorschau } from './DockpunkteVorschau'
import { standardDockpunkte } from './vorschau-geometrie'
import { PortRasterVorschau } from './PortRasterVorschau'
import { useT } from '../sprache-anbindung'

interface Props {
  dockpunkte: DockpunkteKonfiguration | undefined
  bildUrl: string | undefined
  breitenFaktor: number | undefined
  hoehenFaktor?: number
  onChange: (dockpunkte: DockpunkteKonfiguration | undefined) => void
}

export function DockpunkteFormular({
  dockpunkte,
  bildUrl,
  breitenFaktor,
  hoehenFaktor,
  onChange,
}: Props) {
  const t = useT()
  if (!dockpunkte) {
    return (
      <div className="abschnitt">
        <span className="feld-label">{t('katalogdialoge.dockpunkte.titel')}</span>
        <p className="hinweistext">{t('katalogdialoge.dockpunkte.standardHinweis')}</p>
        <div className="neu-form-knoepfe">
          <button
            type="button"
            className="knopf-klein"
            onClick={() => onChange({ modus: 'frei', punkte: standardDockpunkte() })}
          >
            {t('katalogdialoge.dockpunkte.freiPlatzieren')}
          </button>
          <button
            type="button"
            className="knopf-klein"
            onClick={() => onChange({ modus: 'ports', gruppen: [{ typ: 'RJ45', anzahl: 8 }] })}
          >
            {t('katalogdialoge.dockpunkte.portgruppen')}
          </button>
        </div>
      </div>
    )
  }

  if (dockpunkte.modus === 'frei') {
    return (
      <div className="abschnitt">
        <div className="abschnitt-kopf">
          <span className="feld-label">{t('katalogdialoge.dockpunkte.titelFrei')}</span>
          <button
            type="button"
            className="knopf-icon"
            title={t('katalogdialoge.dockpunkte.zurueckStandard')}
            onClick={() => onChange(undefined)}
          >
            ×
          </button>
        </div>
        <DockpunkteVorschau
          punkte={dockpunkte.punkte}
          bildUrl={bildUrl}
          breitenFaktor={breitenFaktor}
          hoehenFaktor={hoehenFaktor}
          onChange={(punkte) => onChange(punkte.length > 0 ? { modus: 'frei', punkte } : undefined)}
        />
      </div>
    )
  }

  const konfiguration: PortsDockpunkteKonfiguration = dockpunkte
  const gruppen = konfiguration.gruppen
  const trunkPunkte = konfiguration.trunkPunkte ?? []

  function aendereGruppe(index: number, patch: Partial<(typeof gruppen)[number]>) {
    onChange({
      ...konfiguration,
      gruppen: gruppen.map((g, i) => (i === index ? { ...g, ...patch } : g)),
    })
  }

  return (
    <div className="abschnitt">
      <div className="abschnitt-kopf">
        <span className="feld-label">{t('katalogdialoge.dockpunkte.titelPorts')}</span>
        <button
          type="button"
          className="knopf-icon"
          title={t('katalogdialoge.dockpunkte.zurueckStandard')}
          onClick={() => onChange(undefined)}
        >
          ×
        </button>
      </div>
      <PortRasterVorschau
        gruppen={gruppen}
        trunkPunkte={trunkPunkte}
        bildUrl={bildUrl}
        breitenFaktor={breitenFaktor}
        hoehenFaktor={hoehenFaktor}
      />
      {gruppen.map((gruppe, index) => (
        <div className="kv-zeile" key={index}>
          <input
            className="kv-schluessel"
            placeholder={t('katalogdialoge.dockpunkte.typPlatzhalter')}
            aria-label={t('katalogdialoge.dockpunkte.porttyp')}
            value={gruppe.typ}
            onChange={(e) => aendereGruppe(index, { typ: e.target.value })}
          />
          <input
            className="feld-zahl"
            type="number"
            min={1}
            placeholder={t('katalogdialoge.dockpunkte.anzahl')}
            aria-label={t('katalogdialoge.dockpunkte.anzahlPorts')}
            value={gruppe.anzahl}
            onChange={(e) => aendereGruppe(index, { anzahl: Number(e.target.value) })}
          />
          <input
            className="feld-zahl"
            type="number"
            min={1}
            placeholder={t('katalogdialoge.dockpunkte.reihen')}
            aria-label={t('katalogdialoge.dockpunkte.reihen')}
            value={gruppe.reihen ?? ''}
            onChange={(e) =>
              aendereGruppe(index, {
                reihen: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <button
            type="button"
            className="knopf-icon"
            title={t('katalogdialoge.dockpunkte.portgruppeEntfernen')}
            onClick={() =>
              onChange({ ...konfiguration, gruppen: gruppen.filter((_, i) => i !== index) })
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="knopf-klein"
        onClick={() =>
          onChange({ ...konfiguration, gruppen: [...gruppen, { typ: '', anzahl: 1 }] })
        }
      >
        {t('katalogdialoge.dockpunkte.portgruppe')}
      </button>

      <div className="feld-label" style={{ marginTop: '0.75rem' }}>
        {t('katalogdialoge.dockpunkte.trunkPunkte')}
      </div>
      {trunkPunkte.map((punkt, index) => (
        <div className="kv-zeile" key={index}>
          <input
            className="feld-zahl"
            type="number"
            min={0}
            max={1}
            step={0.01}
            aria-label={t('katalogdialoge.dockpunkte.lageOberkante')}
            value={punkt.xAnteil}
            onChange={(e) =>
              onChange({
                ...konfiguration,
                trunkPunkte: trunkPunkte.map((p, i) =>
                  i === index ? { xAnteil: Number(e.target.value) } : p,
                ),
              })
            }
          />
          <button
            type="button"
            className="knopf-icon"
            title={t('katalogdialoge.dockpunkte.trunkPunktEntfernen')}
            onClick={() =>
              onChange({
                ...konfiguration,
                trunkPunkte: trunkPunkte.filter((_, i) => i !== index),
              })
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="knopf-klein"
        onClick={() =>
          onChange({ ...konfiguration, trunkPunkte: [...trunkPunkte, { xAnteil: 0.5 }] })
        }
      >
        {t('katalogdialoge.dockpunkte.trunkPunkt')}
      </button>
    </div>
  )
}
