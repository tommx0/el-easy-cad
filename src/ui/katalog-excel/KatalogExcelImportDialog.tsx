import { useMemo, useRef, useState } from 'react'
import type {
  GrafikFeld,
  GrafikStatus,
  ImportBlatt,
  ImportDateien,
  ImportVorschau,
  ImportVorschauZeile,
  KatalogExcelInhalt,
} from '../../persistence/katalog-excel'
import {
  ergaenzeDateien,
  grafikSchluessel,
  liesKatalogExcel,
  zaehleStatus,
} from '../../persistence/katalog-excel'
import { t as text } from '../../sprache'
import type { Schluessel } from '../../sprache'
import { useT } from '../sprache-anbindung'
import './katalog-excel-import.css'

interface Props<P extends ImportVorschau> {
  zielName: string
  plane: (inhalt: KatalogExcelInhalt, dateien: ImportDateien) => P
  importieren: (plan: P) => Promise<string>
  musterHerunterladen: () => Promise<void>
  onFertig: (meldung: string) => void
  onSchliessen: () => void
}

function grafikText(status: GrafikStatus): string {
  switch (status.art) {
    case 'leer':
      return '–'
    case 'bestehend':
      return text('katalogdialoge.excelImport.grafikBleibt')
    case 'gefunden':
      return status.name
    case 'gewaehlt':
      return text('katalogdialoge.excelImport.grafikGewaehlt', { name: status.name })
    case 'fehlt':
      return text('katalogdialoge.excelImport.grafikFehlt', { name: status.name })
  }
}

const STATUS_TEXT: Record<ImportVorschauZeile['status'], Schluessel> = {
  neu: 'katalogdialoge.excelImport.statusNeu',
  aktualisiert: 'katalogdialoge.excelImport.statusAktualisiert',
  fehler: 'katalogdialoge.excelImport.statusFehler',
}

export function KatalogExcelImportDialog<P extends ImportVorschau>({
  zielName,
  plane,
  importieren,
  musterHerunterladen,
  onFertig,
  onSchliessen,
}: Props<P>) {
  const t = useT()
  const [inhalt, setInhalt] = useState<KatalogExcelInhalt | null>(null)
  const [excelName, setExcelName] = useState('')
  const [jeName, setJeName] = useState<Map<string, File>>(new Map())
  const [gewaehlt, setGewaehlt] = useState<Map<string, File>>(new Map())
  const [laeuft, setLaeuft] = useState(false)
  const [meldung, setMeldung] = useState<string | null>(null)

  const excelEingabe = useRef<HTMLInputElement>(null)
  const ordnerEingabe = useRef<HTMLInputElement>(null)
  const dateienEingabe = useRef<HTMLInputElement>(null)
  const einzelEingabe = useRef<HTMLInputElement>(null)
  const einzelZiel = useRef<string | null>(null)

  const plan = useMemo(
    () => (inhalt ? plane(inhalt, { jeName, gewaehlt }) : null),
    [inhalt, jeName, gewaehlt, plane],
  )
  const anzahl = plan ? zaehleStatus(plan) : { neu: 0, aktualisiert: 0, fehler: 0 }
  const importierbar = anzahl.neu + anzahl.aktualisiert

  async function excelGewaehlt(datei: File) {
    setMeldung(null)
    setGewaehlt(new Map())
    setExcelName(datei.name)
    setInhalt(await liesKatalogExcel(await datei.arrayBuffer()))
  }

  function einzelnWaehlen(blatt: ImportBlatt, zeile: number, feld: GrafikFeld) {
    einzelZiel.current = grafikSchluessel(blatt, zeile, feld)
    einzelEingabe.current?.click()
  }

  function einzelEntfernen(schluessel: string) {
    setGewaehlt((bisher) => {
      const neu = new Map(bisher)
      neu.delete(schluessel)
      return neu
    })
  }

  async function ausfuehren() {
    if (!plan) return
    setLaeuft(true)
    setMeldung(null)
    try {
      onFertig(await importieren(plan))
    } catch (fehler) {
      setMeldung(
        fehler instanceof Error
          ? fehler.message
          : t('katalogdialoge.gemeinsam.importFehlgeschlagen'),
      )
      setLaeuft(false)
    }
  }

  async function muster() {
    try {
      await musterHerunterladen()
    } catch (fehler) {
      setMeldung(
        fehler instanceof Error
          ? fehler.message
          : t('katalogdialoge.excelImport.downloadFehlgeschlagen'),
      )
    }
  }

  function grafikZelle(z: ImportVorschauZeile, feld: GrafikFeld) {
    const status = z[feld]
    const schluessel = grafikSchluessel(z.blatt, z.zeile, feld)
    return (
      <td className={`kxi-grafik kxi-grafik-${status.art}`}>
        <span className="kxi-grafik-name" title={grafikText(status)}>
          {grafikText(status)}
        </span>
        <button
          type="button"
          className="kxi-klein"
          onClick={() => einzelnWaehlen(z.blatt, z.zeile, feld)}
          title={
            feld === 'bild'
              ? t('katalogdialoge.excelImport.bildWaehlen')
              : t('katalogdialoge.excelImport.symbolWaehlen')
          }
        >
          {t('katalogdialoge.excelImport.waehlen')}
        </button>
        {status.art === 'gewaehlt' && (
          <button
            type="button"
            className="kxi-klein"
            onClick={() => einzelEntfernen(schluessel)}
            title={t('katalogdialoge.excelImport.auswahlZuruecknehmen')}
          >
            ×
          </button>
        )}
      </td>
    )
  }

  function tabelle(blatt: ImportBlatt, zeilen: ImportVorschauZeile[]) {
    if (zeilen.length === 0) return null
    return (
      <>
        <h3>
          {blatt === 'komponenten'
            ? t('katalogdialoge.excelImport.komponenten')
            : t('katalogdialoge.excelImport.varianten')}
        </h3>
        <table className="kxi-tabelle">
          <thead>
            <tr>
              <th>{t('katalogdialoge.excelImport.spalteZeile')}</th>
              <th>{t('katalogdialoge.excelImport.spalteStatus')}</th>
              {blatt === 'varianten' && <th>{t('katalogdialoge.excelImport.spalteKomponente')}</th>}
              <th>
                {blatt === 'komponenten'
                  ? t('katalogdialoge.excelImport.spalteName')
                  : t('katalogdialoge.excelImport.spalteFarbeName')}
              </th>
              <th>{t('katalogdialoge.excelImport.spalteArtikelnummer')}</th>
              <th>{t('katalogdialoge.excelImport.spalteBild')}</th>
              <th>{t('katalogdialoge.excelImport.spalteSymbol')}</th>
              <th>{t('katalogdialoge.excelImport.spalteHinweise')}</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={`${z.blatt}-${z.zeile}`} className={`kxi-zeile-${z.status}`}>
                <td>{z.zeile}</td>
                <td>
                  <span className={`kxi-status kxi-status-${z.status}`}>
                    {t(STATUS_TEXT[z.status])}
                  </span>
                </td>
                {blatt === 'varianten' && <td>{z.komponente}</td>}
                <td>{z.bezeichnung}</td>
                <td>{z.artikelnummer}</td>
                {grafikZelle(z, 'bild')}
                {grafikZelle(z, 'symbol')}
                <td className="kxi-meldungen">
                  {[...z.fehler, ...z.hinweise].map((m) => (
                    <div key={m} className={z.fehler.includes(m) ? 'kxi-fehler' : undefined}>
                      {m}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    )
  }

  return (
    <div
      className="kxi-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onSchliessen()}
    >
      <div className="kxi-dialog" role="dialog" aria-label={t('katalogdialoge.excelImport.titel')}>
        <h2>{t('katalogdialoge.excelImport.titelMitZiel', { ziel: zielName })}</h2>
        <p className="kxi-hinweis">{t('katalogdialoge.excelImport.hinweis')}</p>

        <div className="kxi-schritte">
          <div className="kxi-schritt">
            <span className="kxi-nummer">1</span>
            <button type="button" onClick={() => excelEingabe.current?.click()}>
              {t('katalogdialoge.excelImport.excelWaehlen')}
            </button>
            <span className="kxi-auswahl">
              {excelName || t('katalogdialoge.excelImport.nochKeineDatei')}
            </span>
          </div>
          <div className="kxi-schritt">
            <span className="kxi-nummer">2</span>
            <button type="button" onClick={() => ordnerEingabe.current?.click()}>
              {t('katalogdialoge.excelImport.ordnerWaehlen')}
            </button>
            <button type="button" onClick={() => dateienEingabe.current?.click()}>
              {t('katalogdialoge.excelImport.dateienWaehlen')}
            </button>
            <span className="kxi-auswahl">
              {jeName.size > 0
                ? t('katalogdialoge.excelImport.grafikenBereit', { n: jeName.size })
                : t('katalogdialoge.excelImport.optional')}
            </span>
            {jeName.size > 0 && (
              <button type="button" className="kxi-klein" onClick={() => setJeName(new Map())}>
                {t('katalogdialoge.excelImport.leeren')}
              </button>
            )}
          </div>
        </div>

        <input
          ref={excelEingabe}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={(e) => {
            const datei = e.target.files?.[0]
            e.target.value = ''
            if (datei) void excelGewaehlt(datei)
          }}
        />
        <input
          ref={(el) => {
            ordnerEingabe.current = el
            el?.setAttribute('webkitdirectory', '')
          }}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const dateien = Array.from(e.target.files ?? [])
            e.target.value = ''
            setJeName((bisher) => ergaenzeDateien(bisher, dateien))
          }}
        />
        <input
          ref={dateienEingabe}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const dateien = Array.from(e.target.files ?? [])
            e.target.value = ''
            setJeName((bisher) => ergaenzeDateien(bisher, dateien))
          }}
        />
        <input
          ref={einzelEingabe}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const datei = e.target.files?.[0]
            const schluessel = einzelZiel.current
            e.target.value = ''
            if (!datei || !schluessel) return
            setGewaehlt((bisher) => new Map(bisher).set(schluessel, datei))
          }}
        />

        <div className="kxi-vorschau">
          {!plan && <p className="kxi-leer">{t('katalogdialoge.excelImport.vorschauLeer')}</p>}
          {plan && plan.dateiFehler.length > 0 && (
            <div className="kxi-dateifehler">
              {plan.dateiFehler.map((f) => (
                <div key={f}>{f}</div>
              ))}
            </div>
          )}
          {plan && plan.zeilen.length === 0 && plan.dateiFehler.length === 0 && (
            <p className="kxi-leer">{t('katalogdialoge.excelImport.keineZeilen')}</p>
          )}
          {plan &&
            tabelle(
              'komponenten',
              plan.zeilen.filter((z) => z.blatt === 'komponenten'),
            )}
          {plan &&
            tabelle(
              'varianten',
              plan.zeilen.filter((z) => z.blatt === 'varianten'),
            )}
        </div>

        {meldung && <div className="kxi-dateifehler">{meldung}</div>}

        <div className="kxi-fuss">
          <button type="button" onClick={() => void muster()}>
            {t('katalogdialoge.excelImport.musterHerunterladen')}
          </button>
          <span className="kxi-zusammenfassung">
            {plan &&
              t(
                anzahl.fehler > 0
                  ? 'katalogdialoge.excelImport.zusammenfassungMitFehlern'
                  : 'katalogdialoge.excelImport.zusammenfassung',
                { neu: anzahl.neu, aktualisiert: anzahl.aktualisiert, fehler: anzahl.fehler },
              )}
          </span>
          <button type="button" onClick={onSchliessen} disabled={laeuft}>
            {t('katalogdialoge.gemeinsam.abbrechen')}
          </button>
          <button
            type="button"
            className="kxi-primaer"
            disabled={laeuft || importierbar === 0}
            onClick={() => void ausfuehren()}
          >
            {laeuft
              ? t('katalogdialoge.excelImport.importiere')
              : t('katalogdialoge.excelImport.zeilenImportieren', { n: importierbar })}
          </button>
        </div>
      </div>
    </div>
  )
}
