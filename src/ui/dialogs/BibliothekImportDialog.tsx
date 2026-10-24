import { useEffect, useState } from 'react'
import {
  type BibliothekPaketKatalog,
  KATALOG_EIGENE_ID,
  aktivesRegelwerk,
  katalogText,
  setzeAktivesRegelwerk,
} from '../../document-model'
import {
  bieteRegelwerkAn,
  type GeoeffnetesBibliothekPaket,
  type KatalogImportVorschau,
  ladeKatalogPaketHoch,
  vorschauKatalogPaket,
} from '../../persistence'
import { useKatalogStore } from '../store/katalog-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext } from '../use-app-context'
import { formatiereDatumUhrzeit, oberflaechensprache, t as text } from '../../sprache'
import type { Schluessel } from '../../sprache'
import { useT } from '../sprache-anbindung'

type Aktion = 'einspielen' | 'ersetzen' | 'kopie' | 'auslassen'

interface Zeile {
  katalog: BibliothekPaketKatalog
  vorschau: KatalogImportVorschau | null
  fehler?: string
  optionen: { wert: Aktion; text: Schluessel }[]
  aktion: Aktion
  hinweis: () => string
}

const AUSLASSEN = {
  wert: 'auslassen' as const,
  text: 'katalogdialoge.bibliothekImport.auslassen' as const,
}
const KOPIE = { wert: 'kopie' as const, text: 'katalogdialoge.bibliothekImport.alsKopie' as const }

function aenderungsText(vorschau: Extract<KatalogImportVorschau, { art: 'standard' }>): string {
  const teile = [
    vorschau.katalogNeu ? text('katalogdialoge.bibliothekImport.katalogNeu') : null,
    text('katalogdialoge.paketZahlen.neu', { n: vorschau.neu }),
    text('katalogdialoge.paketZahlen.aktualisiert', { n: vorschau.aktualisiert }),
    vorschau.ausgemustert > 0
      ? text('katalogdialoge.paketZahlen.ausgemustert', { n: vorschau.ausgemustert })
      : null,
  ]
  return teile.filter(Boolean).join(', ')
}

function zeileFuer(
  katalog: BibliothekPaketKatalog,
  vorschau: KatalogImportVorschau,
  vorhanden: { name: string; herkunft: string } | undefined,
): Omit<Zeile, 'katalog' | 'vorschau'> {
  if (katalog.id === KATALOG_EIGENE_ID)
    return {
      optionen: [AUSLASSEN, KOPIE],
      aktion: 'auslassen',
      hinweis: () => text('katalogdialoge.bibliothekImport.hinweisEigene'),
    }
  if (vorschau.art === 'standard' && vorschau.zurueckgezogen)
    return {
      optionen: [
        { wert: 'einspielen', text: 'katalogdialoge.bibliothekImport.zurueckziehen' },
        AUSLASSEN,
      ],
      aktion: 'einspielen',
      hinweis: () => text('katalogdialoge.bibliothekImport.hinweisZurueckgezogen'),
    }
  if (vorschau.art === 'standard') {
    const aenderungen =
      vorschau.katalogNeu || vorschau.neu + vorschau.aktualisiert + vorschau.ausgemustert > 0
    return {
      optionen: [
        { wert: 'einspielen', text: 'katalogdialoge.bibliothekImport.aktualisieren' },
        KOPIE,
        AUSLASSEN,
      ],
      aktion: aenderungen ? 'einspielen' : 'auslassen',
      hinweis: aenderungen
        ? () =>
            text('katalogdialoge.bibliothekImport.hinweisMitgeliefert', {
              zahlen: aenderungsText(vorschau),
            })
        : () => text('katalogdialoge.bibliothekImport.hinweisAktuell'),
    }
  }
  if (!vorhanden)
    return {
      optionen: [
        { wert: 'einspielen', text: 'katalogdialoge.bibliothekImport.importieren' },
        AUSLASSEN,
      ],
      aktion: 'einspielen',
      hinweis: () => text('katalogdialoge.bibliothekImport.hinweisNeu'),
    }
  if (vorhanden.herkunft === 'standard')
    return {
      optionen: [AUSLASSEN, KOPIE],
      aktion: 'auslassen',
      hinweis: () =>
        text('katalogdialoge.bibliothekImport.hinweisKennungStandard', { name: vorhanden.name }),
    }
  return {
    optionen: [
      AUSLASSEN,
      { wert: 'ersetzen', text: 'katalogdialoge.bibliothekImport.ersetzen' },
      KOPIE,
    ],
    aktion: 'auslassen',
    hinweis: () =>
      text('katalogdialoge.bibliothekImport.hinweisVorhanden', { name: vorhanden.name }),
  }
}

export function BibliothekImportDialog() {
  const paket = useUiStore((s) => s.bibliothekImportDialog)
  const { catalogStore } = useAppContext()
  const kataloge = useKatalogStore((s) => s.kataloge)
  const t = useT()
  const [geprueft, setGeprueft] = useState<{
    paket: GeoeffnetesBibliothekPaket
    zeilen: Zeile[]
  } | null>(null)
  const zeilen = geprueft && geprueft.paket === paket ? geprueft.zeilen : null
  const setZeilen = (aendern: (z: Zeile[]) => Zeile[]) =>
    setGeprueft((g) => g && { ...g, zeilen: aendern(g.zeilen) })
  const [regelwerkUebernehmen, setRegelwerkUebernehmen] = useState(true)
  const [laeuft, setLaeuft] = useState(false)

  useEffect(() => {
    if (!paket) return
    let abbruch = false
    void Promise.all(
      paket.inhalt.kataloge.map(async (katalog): Promise<Zeile> => {
        try {
          const vorschau = await vorschauKatalogPaket(paket.katalogPaket(katalog.datei))
          const vorhanden = kataloge.find((k) => k.id === katalog.id)
          return { katalog, vorschau, ...zeileFuer(katalog, vorschau, vorhanden) }
        } catch (fehler) {
          return {
            katalog,
            vorschau: null,
            fehler:
              fehler instanceof Error
                ? fehler.message
                : text('katalogdialoge.bibliothekImport.nichtLesbar'),
            optionen: [AUSLASSEN],
            aktion: 'auslassen',
            hinweis: () => '',
          }
        }
      }),
    ).then((z) => {
      if (!abbruch) setGeprueft({ paket, zeilen: z })
    })
    return () => {
      abbruch = true
    }
  }, [paket])

  if (!paket) return null
  const schliessen = () => useUiStore.getState().setBibliothekImportDialog(null)
  const neu = paket.inhalt.regelwerk
  const hier = aktivesRegelwerk()
  const regelwerkNeuer = neu.version > hier.version

  async function einspielen() {
    if (!paket || !zeilen) return
    setLaeuft(true)
    const erledigt: string[] = []
    const fehler: string[] = []
    for (const z of zeilen) {
      if (z.aktion === 'auslassen') continue
      try {
        await ladeKatalogPaketHoch(
          paket.katalogPaket(z.katalog.datei),
          z.aktion === 'einspielen' ? undefined : z.aktion,
        )
        erledigt.push(katalogText(z.katalog, 'name', oberflaechensprache()))
      } catch (e) {
        fehler.push(
          `${katalogText(z.katalog, 'name', oberflaechensprache())}: ${e instanceof Error ? e.message : t('katalogdialoge.bibliothekImport.fehlgeschlagen')}`,
        )
      }
    }
    let regelwerkText: string | null = null
    if (regelwerkNeuer && regelwerkUebernehmen) {
      try {
        const antwort = await bieteRegelwerkAn(neu)
        setzeAktivesRegelwerk(antwort.regelwerk)
        if (antwort.uebernommen)
          regelwerkText = t('katalogdialoge.bibliothekImport.regelwerkVersion', {
            version: String(neu.version),
          })
      } catch (e) {
        fehler.push(
          t('katalogdialoge.bibliothekImport.regelwerkFehler', {
            fehler:
              e instanceof Error ? e.message : t('katalogdialoge.bibliothekImport.fehlgeschlagen'),
          }),
        )
      }
    }
    await useKatalogStore.getState().laden(catalogStore)
    setLaeuft(false)
    schliessen()
    useUiStore
      .getState()
      .zeigeToast(
        [
          erledigt.length > 0
            ? t('katalogdialoge.bibliothekImport.eingespielt', { namen: erledigt.join(', ') })
            : t('katalogdialoge.bibliothekImport.keineEingespielt'),
          regelwerkText,
          fehler.length > 0
            ? t('katalogdialoge.bibliothekImport.fehlerListe', { liste: fehler.join('; ') })
            : null,
        ]
          .filter(Boolean)
          .join(' '),
      )
  }

  const setzeAktion = (index: number, aktion: Aktion) =>
    setZeilen((z) => z.map((zeile, i) => (i === index ? { ...zeile, aktion } : zeile)))

  return (
    <div className="dialog-overlay" onMouseDown={laeuft ? undefined : schliessen}>
      <div className="dialog dialog-bibliothek-import" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('katalogdialoge.bibliothekImport.titel')}</h2>
        <p className="dialog-hinweis">
          {t('katalogdialoge.bibliothekImport.hinweis', {
            datum: formatiereDatumUhrzeit(paket.inhalt.erzeugtAm),
            anwendung: paket.inhalt.anwendung,
          })}
        </p>
        {!zeilen ? (
          <p className="dialog-hinweis">{t('katalogdialoge.bibliothekImport.wirdGeprueft')}</p>
        ) : (
          <table className="bibliothek-import-tabelle">
            <thead>
              <tr>
                <th>{t('katalogdialoge.bibliothekImport.spalteKatalog')}</th>
                <th>{t('katalogdialoge.bibliothekImport.spalteKomponenten')}</th>
                <th>{t('katalogdialoge.bibliothekImport.spalteStand')}</th>
                <th>{t('katalogdialoge.bibliothekImport.spalteAktion')}</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((z, i) => (
                <tr key={z.katalog.datei}>
                  <td>{katalogText(z.katalog, 'name', oberflaechensprache())}</td>
                  <td className="zahl">{z.katalog.komponenten}</td>
                  <td className="hinweis">{z.fehler ?? z.hinweis()}</td>
                  <td>
                    <select
                      value={z.aktion}
                      disabled={laeuft || z.optionen.length < 2}
                      onChange={(e) => setzeAktion(i, e.target.value as Aktion)}
                    >
                      {z.optionen.map((o) => (
                        <option key={o.wert} value={o.wert}>
                          {t(o.text)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <label className="dialog-radio-zeile">
          <input
            type="checkbox"
            checked={regelwerkNeuer && regelwerkUebernehmen}
            disabled={!regelwerkNeuer || laeuft}
            onChange={(e) => setRegelwerkUebernehmen(e.target.checked)}
          />
          {regelwerkNeuer
            ? t('katalogdialoge.bibliothekImport.regelwerkUebernehmen', {
                neu: String(neu.version),
                hier: String(hier.version),
              })
            : t('katalogdialoge.bibliothekImport.regelwerkAktuell', { hier: String(hier.version) })}
        </label>
        <div className="dialog-aktionen">
          <button type="button" className="sekundaer" disabled={laeuft} onClick={schliessen}>
            {t('katalogdialoge.gemeinsam.abbrechen')}
          </button>
          <button
            type="button"
            className="primaer"
            disabled={!zeilen || laeuft}
            onClick={() => void einspielen()}
          >
            {laeuft
              ? t('katalogdialoge.bibliothekImport.wirdEingespielt')
              : t('katalogdialoge.bibliothekImport.einspielen')}
          </button>
        </div>
      </div>
    </div>
  )
}
