import { useRef, useState } from 'react'
import type { KiStatus } from '../../document-model'
import { aendereKiEinstellungen, erneuereKiToken } from '../../persistence'
import { useT } from '../sprache-anbindung'
import { useUiStore } from '../store/ui-store'
import { claudeCodeBefehl, claudeDesktopKonfiguration } from '../ki-eintraege'
import { formatiereDatum, formatiereUhrzeit, t as tAktuell } from '../../sprache'

function seit(iso: string, jetzt = Date.now()): string {
  const minuten = Math.round((jetzt - Date.parse(iso)) / 60_000)
  if (minuten < 1) return tAktuell('verwaltungsdialoge.kiAssistent.geradeEben')
  if (minuten < 60) return tAktuell('verwaltungsdialoge.kiAssistent.vorMinuten', { n: minuten })
  const stunden = Math.round(minuten / 60)
  return stunden < 24
    ? tAktuell('verwaltungsdialoge.kiAssistent.vorStunden', { n: stunden })
    : formatiereDatum(iso)
}

function Kopierfeld({ text, zeilen }: { text: string; zeilen: number }) {
  const t = useT()
  const zeigeToast = useUiStore((s) => s.zeigeToast)
  const feldRef = useRef<HTMLTextAreaElement | null>(null)
  async function kopieren() {
    try {
      await navigator.clipboard.writeText(text)
      zeigeToast(t('verwaltungsdialoge.kiAssistent.kopiert'))
    } catch {
      feldRef.current?.select()
      zeigeToast(t('verwaltungsdialoge.kiAssistent.selbstKopieren'))
    }
  }
  return (
    <div className="ki-kopierfeld">
      <textarea
        ref={feldRef}
        readOnly
        rows={zeilen}
        value={text}
        onFocus={(e) => e.currentTarget.select()}
        spellCheck={false}
      />
      <div className="dialog-knopfreihe">
        <button type="button" onClick={() => void kopieren()}>
          {t('verwaltungsdialoge.kiAssistent.kopieren')}
        </button>
      </div>
    </div>
  )
}

function uhrzeit(iso: string): string {
  return formatiereUhrzeit(iso)
}

function KiProtokoll() {
  const t = useT()
  const protokoll = useUiStore((s) => s.kiProtokoll)
  return (
    <>
      <h3>{t('verwaltungsdialoge.kiAssistent.protokoll')}</h3>
      {protokoll.length === 0 ? (
        <p className="dialog-hinweis">{t('verwaltungsdialoge.kiAssistent.protokollLeer')}</p>
      ) : (
        <ol className="ki-protokoll">
          {protokoll.map((eintrag, i) => (
            <li key={`${eintrag.zeit}-${i}`}>
              <time dateTime={eintrag.zeit}>{uhrzeit(eintrag.zeit)}</time>
              <span>{eintrag.text}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}

export function KiAssistentEinstellungen() {
  const t = useT()
  const status = useUiStore((s) => s.kiStatus)
  const verbunden = useUiStore((s) => s.kiBrueckeVerbunden)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)

  async function aendere(aktion: () => Promise<KiStatus>) {
    setLaeuft(true)
    setFehler(null)
    try {
      useUiStore.getState().setKiStatus(await aktion())
    } catch (ursache) {
      setFehler(
        ursache instanceof Error
          ? ursache.message
          : t('verwaltungsdialoge.kiAssistent.aendernFehlgeschlagen'),
      )
    } finally {
      setLaeuft(false)
    }
  }

  if (!status) {
    return (
      <>
        <h3>{t('verwaltungsdialoge.kiAssistent.titel')}</h3>
        <p className="dialog-hinweis">{t('verwaltungsdialoge.kiAssistent.keineSchnittstelle')}</p>
      </>
    )
  }

  return (
    <>
      <h3>{t('verwaltungsdialoge.kiAssistent.titel')}</h3>
      <p className="dialog-hinweis">{t('verwaltungsdialoge.kiAssistent.einleitung')}</p>

      {status.zustimmungAm === null ? (
        <div className="ki-zustimmung">
          <p>
            <strong>{t('verwaltungsdialoge.kiAssistent.datenweitergabe')}</strong>{' '}
            {t('verwaltungsdialoge.kiAssistent.datenweitergabeText')}
          </p>
          <div className="dialog-knopfreihe">
            <button
              type="button"
              disabled={laeuft}
              onClick={() =>
                void aendere(() => aendereKiEinstellungen({ aktiv: true, zustimmung: true }))
              }
            >
              {t('verwaltungsdialoge.kiAssistent.zustimmen')}
            </button>
          </div>
        </div>
      ) : (
        <label className="feld feld-checkbox">
          <input
            type="checkbox"
            checked={status.aktiv}
            disabled={laeuft}
            onChange={(e) =>
              void aendere(() => aendereKiEinstellungen({ aktiv: e.target.checked }))
            }
          />
          {t('verwaltungsdialoge.kiAssistent.eingeschaltet')}
        </label>
      )}

      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={status.nurLesen}
          disabled={laeuft}
          onChange={(e) =>
            void aendere(() => aendereKiEinstellungen({ nurLesen: e.target.checked }))
          }
        />
        {t('verwaltungsdialoge.kiAssistent.nurLesen')}
      </label>
      <p className="dialog-hinweis">{t('verwaltungsdialoge.kiAssistent.nurLesenHinweis')}</p>

      {fehler && <p className="produktlizenz-sperre-fehler">{fehler}</p>}

      {status.aktiv && status.token && (
        <>
          <p className="dialog-hinweis">
            {verbunden
              ? t('verwaltungsdialoge.kiAssistent.verbunden')
              : t('verwaltungsdialoge.kiAssistent.verbindet')}{' '}
            {status.client
              ? t('verwaltungsdialoge.kiAssistent.zuletztAngefragt', {
                  name: status.client.name,
                  seit: seit(status.client.zuletzt),
                })
              : t('verwaltungsdialoge.kiAssistent.nochNichtAngefragt')}
          </p>

          <KiProtokoll />

          <h3>Claude Code</h3>
          <p className="dialog-hinweis">{t('verwaltungsdialoge.kiAssistent.imTerminal')}</p>
          <Kopierfeld text={claudeCodeBefehl(status)} zeilen={3} />

          <h3>Claude Desktop</h3>
          <p className="dialog-hinweis">
            {t('verwaltungsdialoge.kiAssistent.desktopVor')} <code>claude_desktop_config.json</code>{' '}
            {t('verwaltungsdialoge.kiAssistent.desktopMitte')} <code>mcpServers</code>{' '}
            {t('verwaltungsdialoge.kiAssistent.desktopNach')}
          </p>
          <Kopierfeld text={claudeDesktopKonfiguration(status)} zeilen={10} />

          <h3>{t('verwaltungsdialoge.kiAssistent.zugangstoken')}</h3>
          <p className="dialog-hinweis">{t('verwaltungsdialoge.kiAssistent.tokenHinweis')}</p>
          <div className="dialog-knopfreihe">
            <button type="button" disabled={laeuft} onClick={() => void aendere(erneuereKiToken)}>
              {t('verwaltungsdialoge.kiAssistent.neuesToken')}
            </button>
          </div>
        </>
      )}
    </>
  )
}
