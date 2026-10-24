import { useState } from 'react'
import type { SettingsStore } from '../../persistence'
import { BEFEHL_NACH_ID } from '../befehle/katalog'
import { BefehlIcon } from '../befehle/BefehlIcon'
import { IconPapierkorb, IconPfeilUnten, IconStift } from '../components/Icons'
import { useT } from '../sprache-anbindung'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { useFreigeschalteteModule } from '../lizenz-module'
import {
  BEREICH_LABELS,
  gruppenAnzeigeName,
  SYMBOLLEISTE_BEREICH,
} from '../symbolleiste-reihenfolge'
import type { SymbolleistenGruppe } from '../symbolleiste-reihenfolge'
import { befehlName } from '../befehle/katalog'

export function SymbolleisteEinstellungen({ settingsStore }: { settingsStore: SettingsStore }) {
  const module = useFreigeschalteteModule()
  const t = useT()
  const vollstaendig = useSettingsStore((s) => s.symbolleisteVollstaendig)
  const sichtbar = useSettingsStore((s) => s.symbolleiste)
  const eigeneReihenfolge = useSettingsStore((s) => s.symbolleisteReihenfolge)
  const eingeblendet = useSettingsStore((s) => s.symbolleisteEingeblendet)
  const anzeigen = useSettingsStore((s) => s.symbolleisteAnzeigen)
  const gruppen = useSettingsStore((s) => s.symbolleisteGruppen)
  const setReihenfolge = useSettingsStore((s) => s.setSymbolleisteReihenfolge)
  const toggleBefehl = useSettingsStore((s) => s.toggleSymbolleisteBefehl)
  const toggleAnzeigen = useSettingsStore((s) => s.toggleSymbolleisteAnzeigen)
  const zuruecksetzen = useSettingsStore((s) => s.symbolleisteZuruecksetzen)
  const erstelleGruppe = useSettingsStore((s) => s.erstelleSymbolleisteGruppe)
  const benenneGruppeUm = useSettingsStore((s) => s.benenneSymbolleisteGruppeUm)
  const loescheGruppe = useSettingsStore((s) => s.loescheSymbolleisteGruppe)
  const verschiebeBefehl = useSettingsStore((s) => s.verschiebeSymbolleisteBefehl)
  const setGruppenReihenfolge = useSettingsStore((s) => s.setSymbolleisteGruppenReihenfolge)

  const [ziehtId, setZiehtId] = useState<string | null>(null)
  const [zielIndex, setZielIndex] = useState<number | null>(null)
  const [aufgeklappt, setAufgeklappt] = useState<ReadonlySet<string>>(new Set())
  const [ziehtInGruppe, setZiehtInGruppe] = useState<{ gruppeId: string; befehlId: string } | null>(
    null,
  )
  const [zielIndexInGruppe, setZielIndexInGruppe] = useState<number | null>(null)

  function beendeZiehen() {
    setZiehtId(null)
    setZielIndex(null)
  }

  function ablegen(index: number) {
    const gezogen = ziehtId
    beendeZiehen()
    if (!gezogen) return
    const vonIndex = vollstaendig.indexOf(gezogen)
    if (vonIndex === -1) return
    const ziel = Math.max(0, Math.min(vollstaendig.length - 1, index))
    if (ziel === vonIndex) return
    const neu = [...vollstaendig]
    const [element] = neu.splice(vonIndex, 1)
    neu.splice(ziel, 0, element)
    setReihenfolge(settingsStore, neu)
  }

  function beendeZiehenInGruppe() {
    setZiehtInGruppe(null)
    setZielIndexInGruppe(null)
  }

  function ablegenInGruppe(gruppe: SymbolleistenGruppe, index: number) {
    const gezogen = ziehtInGruppe
    beendeZiehenInGruppe()
    if (!gezogen || gezogen.gruppeId !== gruppe.id) return
    const vonIndex = gruppe.befehle.indexOf(gezogen.befehlId)
    if (vonIndex === -1) return
    const ziel = Math.max(0, Math.min(gruppe.befehle.length - 1, index))
    if (ziel === vonIndex) return
    const neu = [...gruppe.befehle]
    const [element] = neu.splice(vonIndex, 1)
    neu.splice(ziel, 0, element)
    setGruppenReihenfolge(settingsStore, gruppe.id, neu)
  }

  function alleZuruecksetzen() {
    useUiStore.getState().oeffneBestaetigung({
      titel: t('verwaltungsdialoge.symbolleiste.zuruecksetzenTitel'),
      nachricht: t('verwaltungsdialoge.symbolleiste.zuruecksetzenFrage'),
      bestaetigenText: t('verwaltungsdialoge.werkzeugleiste.zuruecksetzen'),
      callback: (bestaetigt) => {
        if (bestaetigt) zuruecksetzen(settingsStore)
      },
    })
  }

  function neueGruppe() {
    useUiStore.getState().oeffneEingabeDialog(
      {
        titel: t('verwaltungsdialoge.symbolleiste.neueGruppeTitel'),
        label: t('verwaltungsdialoge.symbolleiste.name'),
      },
      (wert) => {
        const name = wert?.trim()
        if (!name) return
        const id = erstelleGruppe(settingsStore, name)
        setAufgeklappt((bisher) => new Set(bisher).add(id))
      },
    )
  }

  function gruppeUmbenennen(gruppe: SymbolleistenGruppe) {
    useUiStore.getState().oeffneEingabeDialog(
      {
        titel: t('verwaltungsdialoge.symbolleiste.umbenennen'),
        label: t('verwaltungsdialoge.symbolleiste.name'),
        anfangswert: gruppenAnzeigeName(gruppe, t),
      },
      (wert) => {
        const name = wert?.trim()
        if (!name || name === gruppenAnzeigeName(gruppe, t)) return
        benenneGruppeUm(settingsStore, gruppe.id, name)
      },
    )
  }

  function gruppeLoeschen(gruppe: SymbolleistenGruppe) {
    useUiStore.getState().oeffneBestaetigung({
      titel: t('verwaltungsdialoge.symbolleiste.loeschen'),
      nachricht: t('verwaltungsdialoge.symbolleiste.loeschenFrage', {
        name: gruppenAnzeigeName(gruppe, t),
      }),
      bestaetigenText: t('verwaltungsdialoge.symbolleiste.loeschenKnopf'),
      callback: (bestaetigt) => {
        if (bestaetigt) loescheGruppe(settingsStore, gruppe.id)
      },
    })
  }

  function toggleAufgeklappt(id: string) {
    setAufgeklappt((bisher) => {
      const neu = new Set(bisher)
      if (neu.has(id)) neu.delete(id)
      else neu.add(id)
      return neu
    })
  }

  const angepasst = eigeneReihenfolge.length > 0 || eingeblendet !== null || gruppen.length > 0
  const gruppeNachId = new Map(gruppen.map((gruppe) => [gruppe.id, gruppe]))

  function GruppenAuswahl({
    befehlId,
    aktuelleGruppeId,
  }: {
    befehlId: string
    aktuelleGruppeId: string | null
  }) {
    return (
      <select
        className="symbolleiste-gruppen-auswahl"
        value={aktuelleGruppeId ?? ''}
        onChange={(e) => verschiebeBefehl(settingsStore, befehlId, e.target.value || null)}
        title={t('verwaltungsdialoge.symbolleiste.gruppeZuweisen')}
      >
        <option value="">{t('verwaltungsdialoge.symbolleiste.keineGruppe')}</option>
        {gruppen.map((gruppe) => (
          <option key={gruppe.id} value={gruppe.id}>
            {gruppenAnzeigeName(gruppe, t)}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div className="werkzeugliste-einstellungen">
      <h3>{t('verwaltungsdialoge.symbolleiste.titel')}</h3>
      <label className="feld feld-checkbox">
        <input type="checkbox" checked={anzeigen} onChange={() => toggleAnzeigen(settingsStore)} />
        {t('verwaltungsdialoge.symbolleiste.anzeigen')}
      </label>
      <p className="dialog-hinweis">{t('verwaltungsdialoge.symbolleiste.hinweis')}</p>
      <button type="button" onClick={neueGruppe} className="symbolleiste-neue-gruppe">
        {t('verwaltungsdialoge.symbolleiste.neueGruppe')}
      </button>
      <div className="werkzeugliste-liste">
        {vollstaendig.map((id, index) => {
          const gruppe = gruppeNachId.get(id)
          if (gruppe) {
            const offen = aufgeklappt.has(gruppe.id)
            return (
              <div key={id} className="symbolleiste-gruppen-block">
                <div
                  className={
                    `werkzeugliste-zeile werkzeugliste-zeile-gruppe` +
                    (id === ziehtId ? ' zieht' : '') +
                    (zielIndex === index && ziehtId !== null && id !== ziehtId ? ' ablegeziel' : '')
                  }
                  draggable
                  onDragStart={(e) => {
                    setZiehtId(id)
                    e.dataTransfer.setData('text/plain', id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    if (!ziehtId) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setZielIndex(index)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    ablegen(index)
                  }}
                  onDragEnd={beendeZiehen}
                >
                  <span className="werkzeugliste-griff" aria-hidden="true">
                    ☰
                  </span>
                  <button
                    type="button"
                    className="symbolleiste-gruppen-aufklappen"
                    onClick={() => toggleAufgeklappt(gruppe.id)}
                    aria-expanded={offen}
                    title={
                      offen
                        ? t('verwaltungsdialoge.symbolleiste.zuklappen')
                        : t('verwaltungsdialoge.symbolleiste.aufklappen')
                    }
                  >
                    <IconPfeilUnten offen={offen} />
                  </button>
                  <span className="werkzeugliste-zeile-label symbolleiste-gruppen-name">
                    {gruppenAnzeigeName(gruppe, t)}
                    <span className="symbolleiste-gruppen-anzahl">
                      {t('verwaltungsdialoge.symbolleiste.befehle', { n: gruppe.befehle.length })}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="symbolleiste-gruppen-knopf"
                    onClick={() => gruppeUmbenennen(gruppe)}
                    title={t('verwaltungsdialoge.symbolleiste.umbenennen')}
                  >
                    <IconStift />
                  </button>
                  <button
                    type="button"
                    className="symbolleiste-gruppen-knopf"
                    onClick={() => gruppeLoeschen(gruppe)}
                    title={t('verwaltungsdialoge.symbolleiste.loeschen')}
                  >
                    <IconPapierkorb />
                  </button>
                </div>
                {offen && (
                  <div className="symbolleiste-gruppen-mitglieder">
                    {gruppe.befehle.length === 0 && (
                      <p className="dialog-hinweis symbolleiste-gruppen-leer">
                        {t('verwaltungsdialoge.symbolleiste.gruppeLeer', {
                          name: gruppenAnzeigeName(gruppe, t),
                        })}
                      </p>
                    )}
                    {gruppe.befehle.map((befehlId, mitgliedIndex) => {
                      const befehl = BEFEHL_NACH_ID[befehlId]
                      if (befehl?.modul && !module.includes(befehl.modul)) return null
                      return (
                        <div
                          key={befehlId}
                          className={
                            `werkzeugliste-zeile symbolleiste-gruppen-mitglied` +
                            (ziehtInGruppe?.befehlId === befehlId ? ' zieht' : '') +
                            (zielIndexInGruppe === mitgliedIndex &&
                            ziehtInGruppe?.gruppeId === gruppe.id &&
                            ziehtInGruppe.befehlId !== befehlId
                              ? ' ablegeziel'
                              : '')
                          }
                          draggable
                          onDragStart={(e) => {
                            setZiehtInGruppe({ gruppeId: gruppe.id, befehlId })
                            e.dataTransfer.setData('text/plain', befehlId)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragOver={(e) => {
                            if (!ziehtInGruppe || ziehtInGruppe.gruppeId !== gruppe.id) return
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            setZielIndexInGruppe(mitgliedIndex)
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            ablegenInGruppe(gruppe, mitgliedIndex)
                          }}
                          onDragEnd={beendeZiehenInGruppe}
                        >
                          <span className="werkzeugliste-griff" aria-hidden="true">
                            ☰
                          </span>
                          <span className="werkzeugliste-zeile-label">
                            <span className="symbolleiste-liste-icon">
                              <BefehlIcon id={befehlId} />
                            </span>
                            {befehl ? befehlName(befehl.id) : befehlId}
                          </span>
                          <GruppenAuswahl befehlId={befehlId} aktuelleGruppeId={gruppe.id} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const befehl = BEFEHL_NACH_ID[id]
          if (befehl?.modul && !module.includes(befehl.modul)) return null
          const versteckt = !sichtbar.includes(id)
          const bereich = SYMBOLLEISTE_BEREICH[id]
          return (
            <div
              key={id}
              className={
                `werkzeugliste-zeile${versteckt ? ' ausgeblendet' : ''}` +
                (id === ziehtId ? ' zieht' : '') +
                (zielIndex === index && ziehtId !== null && id !== ziehtId ? ' ablegeziel' : '')
              }
              draggable
              onDragStart={(e) => {
                setZiehtId(id)
                e.dataTransfer.setData('text/plain', id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                if (!ziehtId) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                setZielIndex(index)
              }}
              onDrop={(e) => {
                e.preventDefault()
                ablegen(index)
              }}
              onDragEnd={beendeZiehen}
            >
              <span className="werkzeugliste-griff" aria-hidden="true">
                ☰
              </span>
              <label className="werkzeugliste-zeile-label">
                <input
                  type="checkbox"
                  checked={!versteckt}
                  onChange={() => toggleBefehl(settingsStore, id)}
                />
                <span className="symbolleiste-liste-icon">
                  <BefehlIcon id={id} />
                </span>
                {befehl ? befehlName(befehl.id) : id}
              </label>
              {bereich && (
                <span className="symbolleiste-liste-bereich">{BEREICH_LABELS[bereich]}</span>
              )}
              {gruppen.length > 0 && <GruppenAuswahl befehlId={id} aktuelleGruppeId={null} />}
            </div>
          )
        })}
      </div>
      <button type="button" onClick={alleZuruecksetzen} disabled={!angepasst}>
        {t('verwaltungsdialoge.werkzeugleiste.aufStandard')}
      </button>
    </div>
  )
}
