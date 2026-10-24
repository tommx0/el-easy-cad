import type { Fuellung, FuellbaresObjekt, Objekt, SchraffurMuster } from '../document-model'
import {
  istBearbeitbar,
  STANDARD_FUELL_DECKKRAFT,
  STANDARD_FUELL_FARBE,
  STANDARD_SCHRAFFUR_ABSTAND_M,
  STANDARD_SCHRAFFUR_MUSTER,
} from '../document-model'
import { useRef } from 'react'
import { SetObjekteCommand, erzeugeObjektAendernCommand } from '../tools'
import { useAktivesBlatt, useAppContext } from './use-app-context'
import { ZahlenFeld } from './ZahlenFeld'
import { useT } from './sprache-anbindung'
import type { Schluessel } from '../sprache'

type FuellArt = 'keine' | Fuellung['art']

const ART_LABELS: Record<FuellArt, Schluessel> = {
  keine: 'eigenschaften.fuellung.art.keine',
  farbe: 'eigenschaften.fuellung.art.farbe',
  schraffur: 'eigenschaften.fuellung.art.schraffur',
}

const MUSTER_LABELS: Record<SchraffurMuster, Schluessel> = {
  diagonal: 'eigenschaften.fuellung.muster.diagonal',
  kreuz: 'eigenschaften.fuellung.muster.kreuz',
  horizontal: 'eigenschaften.fuellung.muster.horizontal',
  vertikal: 'eigenschaften.fuellung.muster.vertikal',
}

export function FuellungFelder({ objekte }: { objekte: FuellbaresObjekt[] }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const vorherRef = useRef<Objekt[] | null>(null)

  const fuellung = objekte[0].fuellung
  const art: FuellArt = fuellung?.art ?? 'keine'
  const ids = objekte.filter((o) => istBearbeitbar(o, blatt.ebenen)).map((o) => o.id)

  function setzeFuellung(naechste: Fuellung | null, label: string) {
    if (ids.length === 0) return
    commands.execute(
      erzeugeObjektAendernCommand(doc, blatt.id, label, (alle) =>
        alle.map((o) => (ids.includes(o.id) ? ({ ...o, fuellung: naechste } as Objekt) : o)),
      ),
    )
  }

  function aendere(patch: Partial<Fuellung>, label: string) {
    if (!fuellung) return
    setzeFuellung({ ...fuellung, ...patch }, label)
  }

  function setzeArt(neu: FuellArt) {
    if (neu === 'keine') {
      setzeFuellung(null, t('eigenschaften.fuellung.entfernenUndo'))
      return
    }
    setzeFuellung(
      {
        art: neu,
        farbe: fuellung?.farbe ?? STANDARD_FUELL_FARBE,
        deckkraft: fuellung?.deckkraft ?? STANDARD_FUELL_DECKKRAFT,
        muster: fuellung?.muster ?? STANDARD_SCHRAFFUR_MUSTER,
        abstand: fuellung?.abstand ?? STANDARD_SCHRAFFUR_ABSTAND_M,
      },
      t('eigenschaften.fuellung.aendernUndo'),
    )
  }

  function deckkraftZiehen(prozent: number) {
    if (!fuellung) return
    if (vorherRef.current === null) vorherRef.current = blatt.objekte
    doc.updateBlatt(blatt.id, {
      objekte: blatt.objekte.map((o) =>
        ids.includes(o.id)
          ? ({ ...o, fuellung: { ...fuellung, deckkraft: prozent / 100 } } as Objekt)
          : o,
      ),
    })
  }

  function deckkraftUebernehmen() {
    const vorher = vorherRef.current
    vorherRef.current = null
    if (vorher === null || vorher === blatt.objekte) return
    commands.push(
      new SetObjekteCommand(
        doc,
        blatt.id,
        vorher,
        blatt.objekte,
        t('eigenschaften.fuellung.deckkraftUndo'),
      ),
    )
  }

  return (
    <>
      <label className="feld">
        {t('eigenschaften.fuellung.fuellung')}
        <select value={art} onChange={(e) => setzeArt(e.target.value as FuellArt)}>
          {(Object.keys(ART_LABELS) as FuellArt[]).map((wert) => (
            <option key={wert} value={wert}>
              {t(ART_LABELS[wert])}
            </option>
          ))}
        </select>
      </label>
      {fuellung && (
        <>
          <label className="feld">
            {fuellung.art === 'schraffur'
              ? t('eigenschaften.fuellung.schraffurfarbe')
              : t('eigenschaften.fuellung.fuellfarbe')}
            <input
              type="color"
              value={normFarbe(fuellung.farbe)}
              onChange={(e) =>
                aendere({ farbe: e.target.value }, t('eigenschaften.fuellung.fuellfarbeUndo'))
              }
            />
          </label>
          {fuellung.art === 'schraffur' && (
            <>
              <label className="feld">
                {t('eigenschaften.fuellung.musterTitel')}
                <select
                  value={fuellung.muster ?? STANDARD_SCHRAFFUR_MUSTER}
                  onChange={(e) =>
                    aendere(
                      { muster: e.target.value as SchraffurMuster },
                      t('eigenschaften.fuellung.musterUndo'),
                    )
                  }
                >
                  {(Object.keys(MUSTER_LABELS) as SchraffurMuster[]).map((wert) => (
                    <option key={wert} value={wert}>
                      {t(MUSTER_LABELS[wert])}
                    </option>
                  ))}
                </select>
              </label>
              <label className="feld">
                {t('eigenschaften.fuellung.abstand')}
                <ZahlenFeld
                  min={0.01}
                  step={0.01}
                  value={fuellung.abstand ?? STANDARD_SCHRAFFUR_ABSTAND_M}
                  onCommit={(wert) =>
                    aendere({ abstand: wert }, t('eigenschaften.fuellung.abstandUndo'))
                  }
                />
              </label>
            </>
          )}
          <label className="feld feld-groessenfaktor">
            {t('eigenschaften.fuellung.deckkraft')}
            <span className="feld-groessenfaktor-regler">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(fuellung.deckkraft * 100)}
                aria-label={t('eigenschaften.fuellung.deckkraftAria')}
                onChange={(e) => deckkraftZiehen(Number(e.target.value))}
                onPointerUp={deckkraftUebernehmen}
                onKeyUp={deckkraftUebernehmen}
                onBlur={deckkraftUebernehmen}
              />
              <span>{Math.round(fuellung.deckkraft * 100)} %</span>
            </span>
          </label>
        </>
      )}
    </>
  )
}

function normFarbe(farbe: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(farbe) ? farbe : STANDARD_FUELL_FARBE
}
