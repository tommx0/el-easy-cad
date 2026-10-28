import { IconEbenen, IconLizenzsiegel, IconProjekte, LogoMarke } from './components/Icons'
import { t as tAktuell } from '../sprache'
import { useT } from './sprache-anbindung'
import { anzeige } from './befehle/kuerzel'
import { useBefehl } from './befehle/use-befehle'
import { useSettingsStore } from './store/settings-store'
import { HintergrundDeckkraft } from './HintergrundDeckkraft'
import { MenuBar } from './MenuBar'
import { Symbolleiste } from './Symbolleiste'
import { useAktivesBlatt } from './use-app-context'
import { useUiStore } from './store/ui-store'

function speicherText(zustand: ReturnType<typeof useUiStore.getState>['speicherZustand']): string {
  switch (zustand.art) {
    case 'schreibt':
      return tAktuell('kopfzeile.speichert')
    case 'gespeichert':
      return tAktuell('kopfzeile.gespeichert')
    case 'konflikt':
      return tAktuell('kopfzeile.konflikt')
    case 'fehler':
      return tAktuell('kopfzeile.nichtGespeichert')
    case 'ruht':
      return ''
  }
}

export function Kopfzeile() {
  const t = useT()
  const offenesDokument = useUiStore((s) => s.offenesDokument)
  const speicherZustand = useUiStore((s) => s.speicherZustand)
  const produktlizenzStatus = useUiStore((s) => s.produktlizenzStatus)
  const hintergrundLadefortschritt = useUiStore((s) => s.hintergrundLadefortschritt)
  const blatt = useAktivesBlatt()
  const pfadTeile = offenesDokument
    ? [offenesDokument.kunde, offenesDokument.projektBezeichnung, offenesDokument.name].filter(
        (teil): teil is string => Boolean(teil),
      )
    : []
  const pfadVorne = pfadTeile.slice(0, -1).join(' · ')
  const pfadEnde = pfadTeile.at(-1) ?? null
  const hinweis = speicherText(speicherZustand)
  const zeigeBlatt = !offenesDokument || offenesDokument.typ === 'zeichnung'
  const lizenz = produktlizenzStatus?.status === 'gueltig' ? produktlizenzStatus : null
  const projekteBefehl = useBefehl('datei.projekte')
  const projekteKuerzel = useSettingsStore((s) => s.belegung['datei.projekte'])
  const symbolleisteAnzeigen = useSettingsStore((s) => s.symbolleisteAnzeigen)

  return (
    <header className="kopfzeile">
      <div className="kopfzeile-band">
        <div
          className="kopfzeile-marke"
          title={`el.esy.CAD Community v${__APP_VERSION__} — © Thomas Marx 2026`}
        >
          <LogoMarke />
          <div className="kopfzeile-marke-text">
            <div className="kopfzeile-marke-titelzeile">
              <span className="kopfzeile-app">el.esy.CAD Community</span>
              <span className="kopfzeile-version">v{__APP_VERSION__}</span>
              <span className="kopfzeile-beta" title={t('kopfzeile.betaTitel')}>
                Beta
              </span>
            </div>
            <span className="kopfzeile-copyright">© Thomas Marx 2026</span>
          </div>
        </div>

        {lizenz?.lizenznehmer && (
          <div
            className="kopfzeile-lizenz"
            title={t('kopfzeile.lizenzTitel')}
            role="button"
            tabIndex={0}
            onClick={() => useUiStore.getState().setMeineLizenzDialogOffen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                useUiStore.getState().setMeineLizenzDialogOffen(true)
              }
            }}
          >
            <span className="kopfzeile-lizenz-chip">
              <IconLizenzsiegel />
              {t('kopfzeile.lizenziertFuer')}{' '}
              <b className="kopfzeile-lizenz-name">{lizenz.lizenznehmer}</b>
            </span>
          </div>
        )}

        <div className="kopfzeile-dokument">
          <span className={`kopfzeile-dateiname${pfadEnde ? '' : ' kopfzeile-dateiname-leer'}`}>
            {pfadEnde ? (
              <>
                {pfadVorne && `${pfadVorne} · `}
                <b className="kopfzeile-dokumentname">{pfadEnde}</b>
              </>
            ) : (
              t('kopfzeile.keinDokument')
            )}
          </span>
          {hinweis && (
            <span
              className={`kopfzeile-speicherstand${
                speicherZustand.art === 'konflikt' || speicherZustand.art === 'fehler'
                  ? ' kopfzeile-speicherstand-warnung'
                  : ''
              }`}
              title={
                speicherZustand.art === 'konflikt' || speicherZustand.art === 'fehler'
                  ? speicherZustand.nachricht
                  : undefined
              }
            >
              {hinweis}
            </span>
          )}
        </div>
      </div>

      <div className="kopfzeile-menuezeile">
        <button
          type="button"
          className="kopfzeile-projekte-knopf"
          onClick={() => projekteBefehl?.ausfuehren()}
          disabled={!projekteBefehl || projekteBefehl.deaktiviert}
          title={
            projekteKuerzel
              ? t('kopfzeile.projekteMitKuerzel', { kuerzel: anzeige(projekteKuerzel) })
              : t('kopfzeile.projekteTitel')
          }
          aria-label={t('kopfzeile.projekte')}
        >
          <IconProjekte />
          <span className="kopfzeile-projekte-text">{t('kopfzeile.projekte')}</span>
        </button>
        <MenuBar />
        <div className="kopfzeile-blattinfo">
          {hintergrundLadefortschritt && (
            <span className="kopfzeile-hintergrund-ladung" title={t('kopfzeile.hintergrundTitel')}>
              <span className="kopfzeile-ladebalken">
                <span
                  className="kopfzeile-ladebalken-fuellung"
                  style={{
                    width: `${Math.round(
                      (hintergrundLadefortschritt.erledigt / hintergrundLadefortschritt.gesamt) *
                        100,
                    )}%`,
                  }}
                />
              </span>
              {t('kopfzeile.hintergruende', {
                erledigt: hintergrundLadefortschritt.erledigt,
                gesamt: hintergrundLadefortschritt.gesamt,
              })}
            </span>
          )}
          {zeigeBlatt && <HintergrundDeckkraft />}
          {zeigeBlatt && (
            <button
              type="button"
              className="kopfzeile-ebenen-knopf"
              onClick={() => useUiStore.getState().setEbenenDialogOffen(true)}
              title={t('kopfzeile.ebenenVerwalten')}
            >
              <IconEbenen />
              <span>{t('kopfzeile.ebenen')}</span>
            </button>
          )}
          {zeigeBlatt && <span className="kopfzeile-blattname">{blatt.name}</span>}
        </div>
      </div>
      {symbolleisteAnzeigen && <Symbolleiste />}
    </header>
  )
}
