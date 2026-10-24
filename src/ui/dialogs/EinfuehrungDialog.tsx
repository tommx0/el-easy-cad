import { useRef } from 'react'
import { useT } from '../sprache-anbindung'
import { useAppContext } from '../use-app-context'
import { useSettingsStore } from '../store/settings-store'
import { useUiStore } from '../store/ui-store'
import { formatiereDauer, VIDEOS, videoZuId, type Video } from '../handbuch/videos'

export function EinfuehrungDialog() {
  const t = useT()
  const dialog = useUiStore((s) => s.einfuehrungDialog)
  if (!dialog) return null
  const clip = videoZuId(dialog.clipId)
  const waehle = (clipId: string) => useUiStore.getState().setEinfuehrungDialog({ clipId })

  return (
    <div
      className="dialog-overlay"
      onMouseDown={() => useUiStore.getState().setEinfuehrungDialog(null)}
    >
      <div
        className="dialog dialog-einfuehrung"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('verwaltungsdialoge.einfuehrung.ersteSchritte')}
      >
        <h2>{t('verwaltungsdialoge.einfuehrung.titel')}</h2>
        {clip ? (
          <Abspieler clip={clip} zurueck={() => waehle('')} />
        ) : (
          <Kachelwand waehle={waehle} />
        )}
        <Fusszeile />
      </div>
    </div>
  )
}

function Kachelwand({ waehle }: { waehle: (id: string) => void }) {
  const t = useT()
  const [erster, ...weitere] = VIDEOS

  if (!erster) {
    return <p className="dialog-hinweis">{t('verwaltungsdialoge.einfuehrung.keineVideos')}</p>
  }

  return (
    <div className="einfuehrung-inhalt">
      <button type="button" className="einfuehrung-hauptkachel" onClick={() => waehle(erster.id)}>
        <img src={erster.vorschau} alt="" loading="lazy" />
        <span className="einfuehrung-hauptkachel-text">
          <b>{erster.titel}</b>
          <span>{erster.beschreibung}</span>
          <span className="einfuehrung-dauer">{formatiereDauer(erster.dauerSekunden)}</span>
        </span>
        <span className="einfuehrung-abspielen" aria-hidden="true" />
      </button>

      {weitere.length > 0 && (
        <>
          <h3>{t('verwaltungsdialoge.einfuehrung.handgriffe')}</h3>
          <ul className="einfuehrung-kacheln">
            {weitere.map((video) => (
              <li key={video.id}>
                <button type="button" onClick={() => waehle(video.id)}>
                  <img src={video.vorschau} alt="" loading="lazy" />
                  <b>{video.titel}</b>
                  <span className="einfuehrung-dauer">{formatiereDauer(video.dauerSekunden)}</span>
                  <span className="einfuehrung-abspielen" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function springe(element: HTMLVideoElement | null, clip: Video, sekunde: number): void {
  if (!element) return
  const vorlauf = Number.isFinite(element.duration) ? element.duration - clip.dauerSekunden : 0
  element.currentTime = Math.max(0, sekunde + Math.max(0, vorlauf))
  void element.play()
}

function Abspieler({ clip, zurueck }: { clip: Video; zurueck: () => void }) {
  const t = useT()
  const video = useRef<HTMLVideoElement>(null)

  return (
    <div className="einfuehrung-inhalt einfuehrung-abspieler">
      <div className="einfuehrung-buehne">
        <video
          ref={video}
          src={clip.datei}
          poster={clip.vorschau}
          controls
          preload="metadata"
          aria-label={clip.titel}
        />
        <div className="einfuehrung-schritte">
          <h3>{clip.titel}</h3>
          <ol>
            {clip.schritte.map((schritt) => (
              <li key={`${schritt.sekunde}-${schritt.text}`}>
                <button type="button" onClick={() => springe(video.current, clip, schritt.sekunde)}>
                  {schritt.text}
                </button>
              </li>
            ))}
          </ol>
          {clip.anker && <HandbuchVerweis anker={clip.anker} />}
        </div>
      </div>
      <button type="button" className="einfuehrung-zurueck" onClick={zurueck}>
        {t('verwaltungsdialoge.einfuehrung.alleVideos')}
      </button>
    </div>
  )
}

function HandbuchVerweis({ anker }: { anker: string }) {
  const t = useT()
  return (
    <button
      type="button"
      className="einfuehrung-handbuch-verweis"
      onClick={() => {
        useUiStore.getState().setEinfuehrungDialog(null)
        useUiStore.getState().setHandbuchDialog({ anker })
      }}
    >
      {t('verwaltungsdialoge.einfuehrung.ausfuehrlich')}
    </button>
  )
}

function Fusszeile() {
  const t = useT()
  const { settingsStore } = useAppContext()
  const beimStart = useSettingsStore((s) => s.einfuehrungBeimStartZeigen)
  const setBeimStart = useSettingsStore((s) => s.setEinfuehrungBeimStartZeigen)

  return (
    <div className="dialog-aktionen einfuehrung-fuss">
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={!beimStart}
          onChange={(e) => setBeimStart(settingsStore, !e.target.checked)}
        />
        {t('verwaltungsdialoge.einfuehrung.nichtMehrZeigen')}
      </label>
      <span className="einfuehrung-fuss-abstand" />
      <button
        type="button"
        onClick={() => {
          useUiStore.getState().setEinfuehrungDialog(null)
          useUiStore.getState().setHandbuchDialog({ anker: null })
        }}
      >
        {t('verwaltungsdialoge.handbuch.titel')}
      </button>
      <button
        type="button"
        className="primaer"
        onClick={() => useUiStore.getState().setEinfuehrungDialog(null)}
      >
        {t('verwaltungsdialoge.einfuehrung.weiter')}
      </button>
    </div>
  )
}
