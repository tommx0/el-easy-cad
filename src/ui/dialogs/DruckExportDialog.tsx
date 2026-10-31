import { useState } from 'react'
import type {
  Ausrichtung,
  Blatt,
  LizenzModul,
  Papierformat,
  Zeichenflaeche,
} from '../../document-model'
import { PAPIERFORMATE, istNurAnsicht, papierGroesseMm } from '../../document-model'
import type { PapierWahl } from '../../druck'
import {
  PAPIER_WIE_ZEICHENFLAECHE,
  berechneAusgabeSeite,
  druckeSeiten,
  exportiereAlsPdf,
} from '../../druck'
import { assetUrl, oeffneDruckdialog, speichereDatei } from '../../persistence'
import { holeAbgangsTexte, holeKnxBeschriftungen } from '../../rendering'
import { bauplanZeichnungen, verteilerplanZeichnungen } from '../verknuepfung'
import { useAppContext, useProject } from '../use-app-context'
import { useKatalogStore } from '../store/katalog-store'
import type { DruckExportModus } from '../store/ui-store'
import { useUiStore } from '../store/ui-store'
import { useFreigeschalteteModule } from '../lizenz-module'
import { erzeugeUebersetzer } from '../../sprache'
import type { Schluessel, Uebersetzer } from '../../sprache'
import { planspracheVon } from '../../document-model'
import { ausgabeZeile, hinweisAktiv } from '../community'
import { leitungsverlegungAusFuer } from '../leitungsverlegung'
import { useT } from '../sprache-anbindung'
import { befehlName, gruppenName } from '../befehle/katalog'

function istAusgebbar(blatt: Blatt, module: readonly LizenzModul[]): boolean {
  return blatt.zeichenflaeche !== null && !istNurAnsicht(blatt, module)
}

type Papier = Pick<Zeichenflaeche, 'papierformat' | 'ausrichtung'>

function papierText(t: Uebersetzer, p: Papier): string {
  return t(
    p.ausrichtung === 'hoch'
      ? 'zeichendialoge.druckExport.papierHoch'
      : 'zeichendialoge.druckExport.papierQuer',
    { format: p.papierformat },
  )
}

function anpassungsText(t: Uebersetzer, z: Papier, papier: Papier): string {
  const seite = papierGroesseMm(z.papierformat, z.ausrichtung)
  const ausgabe = berechneAusgabeSeite(
    { seiteBreiteMm: seite.breiteMm, seiteHoeheMm: seite.hoeheMm },
    papierGroesseMm(papier.papierformat, papier.ausrichtung),
  )
  if (!ausgabe.gedreht && Math.abs(ausgabe.skala - 1) < 0.005) return ''
  const werte = { papier: papierText(t, papier), prozent: Math.round(ausgabe.skala * 100) }
  return ` → ${t(
    ausgabe.gedreht
      ? 'zeichendialoge.druckExport.anpassungGedreht'
      : 'zeichendialoge.druckExport.anpassung',
    werte,
  )}`
}

const AUSRICHTUNGEN: { wert: Ausrichtung | null; text: Schluessel }[] = [
  { wert: null, text: 'zeichendialoge.druckExport.wieZeichenflaeche' },
  { wert: 'hoch', text: 'zeichendialoge.zeichenflaeche.hochformat' },
  { wert: 'quer', text: 'zeichendialoge.zeichenflaeche.querformat' },
]

export function DruckExportDialog() {
  const modus = useUiStore((s) => s.druckExportDialog)
  const schliessen = useUiStore((s) => s.schliesseDruckExportDialog)
  const zeigeToast = useUiStore((s) => s.zeigeToast)
  const zeichnung = useProject()
  const t = useT()
  const { catalogStore, verknuepfung } = useAppContext()
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const lizenzStatus = useUiStore((s) => s.produktlizenzStatus)
  const demoAktiv = hinweisAktiv(lizenzStatus)
  const lizenznehmer = ausgabeZeile(lizenzStatus, erzeugeUebersetzer(planspracheVon(zeichnung)))

  const module = useFreigeschalteteModule()

  const [ausgewaehlt, setAusgewaehlt] = useState<string[]>([])
  const [papierWahl, setPapierWahl] = useState<PapierWahl>(PAPIER_WIE_ZEICHENFLAECHE)
  const [laeuft, setLaeuft] = useState(false)

  const [vorherigerModus, setVorherigerModus] = useState<DruckExportModus | null>(null)
  if (modus !== vorherigerModus) {
    setVorherigerModus(modus)
    if (modus) {
      const aktivesBlatt = zeichnung.blaetter.find((b) => b.id === zeichnung.aktivesBlattId)
      setAusgewaehlt(aktivesBlatt && istAusgebbar(aktivesBlatt, module) ? [aktivesBlatt.id] : [])
      setPapierWahl(PAPIER_WIE_ZEICHENFLAECHE)
    }
  }

  if (!modus) return null

  const ausgewaehlteBlaetter = zeichnung.blaetter.filter(
    (b) => ausgewaehlt.includes(b.id) && istAusgebbar(b, module),
  )

  const erstesPapier = ausgewaehlteBlaetter[0]?.zeichenflaeche ?? null
  function papierFuer(z: Papier): Papier {
    const basis = modus === 'druck' && erstesPapier ? erstesPapier : z
    return {
      papierformat: papierWahl.papierformat ?? basis.papierformat,
      ausrichtung: papierWahl.ausrichtung ?? basis.ausrichtung,
    }
  }

  function toggleBlatt(id: string, hatZeichenflaeche: boolean) {
    if (!hatZeichenflaeche) return
    setAusgewaehlt((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function ausfuehren(aktion: 'export' | 'druck') {
    if (ausgewaehlteBlaetter.length === 0) {
      zeigeToast(t('zeichendialoge.druckExport.keinBlatt'))
      return
    }
    setLaeuft(true)
    try {
      const verknuepfteBauplaene = bauplanZeichnungen(verknuepfung.getStand())
      const abgangsTexte = holeAbgangsTexte(zeichnung, verknuepfteBauplaene, katalogKomponenten)
      const kontext = {
        katalogKomponenten,
        catalogStore,
        assetQuelle: assetUrl,
        abgangsTexte,
        knxBeschriftungen: holeKnxBeschriftungen(zeichnung, verknuepfteBauplaene),
        verknuepfteBauplaene,
        verknuepfteVerteilerplaene: verteilerplanZeichnungen(verknuepfung.getStand()),
        leitungsverlegungAus: leitungsverlegungAusFuer(zeichnung),
      }
      const blattIds = ausgewaehlteBlaetter.map((b) => b.id)
      if (aktion === 'export') {
        const blob = await exportiereAlsPdf(
          zeichnung,
          blattIds,
          kontext,
          demoAktiv,
          lizenznehmer,
          module,
          papierWahl,
        )
        if (blob) {
          const name = zeichnung.name || t('zeichendialoge.druckExport.dateiname')
          await speichereDatei(blob, `${name}.pdf`, {
            beschreibung: t('zeichendialoge.druckExport.pdfDokument'),
            erweiterungen: ['pdf'],
          })
          zeigeToast(t('zeichendialoge.druckExport.pdfExportiert'))
        }
      } else {
        await druckeSeiten(
          zeichnung,
          blattIds,
          kontext,
          demoAktiv,
          lizenznehmer,
          module,
          papierWahl,
          oeffneDruckdialog,
        )
      }
      schliessen()
    } catch (fehler) {
      zeigeToast(
        fehler instanceof Error ? fehler.message : t('zeichendialoge.druckExport.fehlgeschlagen'),
      )
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-gross" onMouseDown={(e) => e.stopPropagation()}>
        <h2>
          {modus === 'export'
            ? t('zeichendialoge.druckExport.titelExport')
            : t('zeichendialoge.druckExport.titelDruck')}
        </h2>

        <h3>{t('zeichendialoge.druckExport.blaetter')}</h3>
        <ul className="blatt-liste">
          {zeichnung.blaetter.map((blatt) => {
            const z = blatt.zeichenflaeche
            const ausgebbar = istAusgebbar(blatt, module)
            return (
              <li key={blatt.id}>
                <label
                  className={`druck-blatt-checkbox${ausgebbar ? '' : ' druck-blatt-checkbox-deaktiviert'}`}
                >
                  <input
                    type="checkbox"
                    checked={ausgewaehlt.includes(blatt.id)}
                    disabled={!ausgebbar}
                    onChange={() => toggleBlatt(blatt.id, ausgebbar)}
                  />
                  {blatt.name}
                  <span className="blatt-liste-info">
                    {istNurAnsicht(blatt, module)
                      ? t('zeichendialoge.druckExport.nurAnsehen')
                      : z
                        ? `${papierText(t, z)} · 1:${Math.round(z.massstabNenner)}${
                            ausgewaehlt.includes(blatt.id)
                              ? anpassungsText(t, z, papierFuer(z))
                              : ''
                          }`
                        : t('zeichendialoge.druckExport.keineZeichenflaeche')}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>

        <h3>{t('zeichendialoge.druckExport.papier')}</h3>
        <div className="druck-radiogruppe">
          <select
            aria-label={t('zeichendialoge.zeichenflaeche.papierformat')}
            value={papierWahl.papierformat ?? ''}
            onChange={(e) =>
              setPapierWahl((w) => ({
                ...w,
                papierformat: e.target.value === '' ? null : (e.target.value as Papierformat),
              }))
            }
          >
            <option value="">{t('zeichendialoge.druckExport.wieZeichenflaeche')}</option>
            {PAPIERFORMATE.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          {AUSRICHTUNGEN.map(({ wert, text }) => (
            <label key={text}>
              <input
                type="radio"
                name="druck-ausrichtung"
                checked={papierWahl.ausrichtung === wert}
                onChange={() => setPapierWahl((w) => ({ ...w, ausrichtung: wert }))}
              />
              {t(text)}
            </label>
          ))}
        </div>

        <p className="dialog-hinweis">
          {t('zeichendialoge.druckExport.hinweis', {
            pfad: `${gruppenName('blatt', t)} › ${befehlName('zeichenflaeche-einrichten', t)}`,
          })}
          {modus === 'druck' && ` ${t('zeichendialoge.druckExport.hinweisDruck')}`}
        </p>

        <div className="dialog-aktionen">
          <button type="button" onClick={schliessen} disabled={laeuft}>
            {t('zeichendialoge.gemeinsam.abbrechen')}
          </button>
          {modus === 'export' && (
            <button
              type="button"
              className="primaer"
              disabled={laeuft}
              onClick={() => void ausfuehren('export')}
            >
              {laeuft
                ? t('zeichendialoge.druckExport.wirdErstellt')
                : t('zeichendialoge.druckExport.alsPdf')}
            </button>
          )}
          {modus === 'druck' && (
            <button
              type="button"
              className="primaer"
              disabled={laeuft}
              onClick={() => void ausfuehren('druck')}
            >
              {laeuft
                ? t('zeichendialoge.druckExport.wirdVorbereitet')
                : t('zeichendialoge.druckExport.titelDruck')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
