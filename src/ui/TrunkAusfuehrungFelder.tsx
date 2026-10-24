import { useState } from 'react'
import type { TrunkAbmessung, TrunkAusfuehrung, TrunkObjekt } from '../document-model'
import { erzeugeTrunkEigenschaftenSyncCommand } from '../tools/commands/trunk-commands'
import { useAppContext } from './use-app-context'
import { ZahlenFeldOptional } from './ZahlenFeld'
import { useT } from './sprache-anbindung'
import type { Schluessel } from '../sprache'

const AUSFUEHRUNGEN: { wert: TrunkAusfuehrung; text: Schluessel }[] = [
  { wert: 'buendel', text: 'eigenschaften.trunkAusfuehrung.buendel' },
  { wert: 'kanal', text: 'eigenschaften.trunkAusfuehrung.kanal' },
  { wert: 'trasse', text: 'eigenschaften.trunkAusfuehrung.trasse' },
  { wert: 'rohr', text: 'eigenschaften.trunkAusfuehrung.rohr' },
]

const cm = (meter: number | undefined) =>
  meter === undefined ? null : Math.round(meter * 1000) / 10

export interface AusfuehrungsWert {
  ausfuehrung?: TrunkAusfuehrung
  abmessung?: TrunkAbmessung
}

export function TrunkAusfuehrungFelder({
  blattId,
  trunk,
}: {
  blattId: string
  trunk: TrunkObjekt
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  return (
    <AusfuehrungEingabe
      wert={{ ausfuehrung: trunk.ausfuehrung, abmessung: trunk.abmessung }}
      hinweis={t('eigenschaften.trunkAusfuehrung.ganzeKette')}
      aendern={(patch, label) =>
        commands.execute(erzeugeTrunkEigenschaftenSyncCommand(doc, blattId, trunk.id, patch, label))
      }
    />
  )
}

export function AusfuehrungEingabe({
  wert,
  hinweis,
  aendern,
}: {
  wert: AusfuehrungsWert
  hinweis?: string
  aendern: (patch: AusfuehrungsWert, label: string) => void
}) {
  const t = useT()
  const ausfuehrung = wert.ausfuehrung ?? 'buendel'
  const abmessung = wert.abmessung
  const setze = aendern

  function ausfuehrungAendern(neu: TrunkAusfuehrung) {
    if (neu === 'buendel') {
      setze(
        { ausfuehrung: undefined, abmessung: undefined },
        t('eigenschaften.trunkAusfuehrung.ausfuehrungUndo'),
      )
      return
    }
    const passt = abmessung && (neu === 'rohr' ? 'durchmesser' in abmessung : 'breite' in abmessung)
    setze(
      { ausfuehrung: neu, abmessung: passt ? abmessung : undefined },
      t('eigenschaften.trunkAusfuehrung.ausfuehrungUndo'),
    )
  }

  const rechteck = abmessung && 'breite' in abmessung ? abmessung : undefined
  const rohr = abmessung && 'durchmesser' in abmessung ? abmessung : undefined
  const [entwurf, setEntwurf] = useState<{ breite?: number; hoehe?: number }>({})
  const breite = rechteck?.breite ?? entwurf.breite
  const hoehe = rechteck?.hoehe ?? entwurf.hoehe

  function rechteckAendern(feld: 'breite' | 'hoehe', wertCm: number | null) {
    const neu = { breite, hoehe, [feld]: wertCm === null ? undefined : wertCm / 100 }
    if (neu.breite !== undefined && neu.hoehe !== undefined) {
      setEntwurf({})
      setze(
        { ausfuehrung, abmessung: { breite: neu.breite, hoehe: neu.hoehe } },
        t('eigenschaften.trunkAusfuehrung.abmessungUndo'),
      )
      return
    }
    setEntwurf(neu)
    if (rechteck)
      setze(
        { ausfuehrung, abmessung: undefined },
        t('eigenschaften.trunkAusfuehrung.abmessungUndo'),
      )
  }

  return (
    <>
      <label className="feld">
        {t('eigenschaften.trunkAusfuehrung.ausfuehrung')}
        <select
          value={ausfuehrung}
          onChange={(e) => ausfuehrungAendern(e.target.value as TrunkAusfuehrung)}
        >
          {AUSFUEHRUNGEN.map((a) => (
            <option key={a.wert} value={a.wert}>
              {t(a.text)}
            </option>
          ))}
        </select>
        {hinweis && <span className="feld-info">{hinweis}</span>}
      </label>
      {(ausfuehrung === 'kanal' || ausfuehrung === 'trasse') && (
        <>
          <label className="feld">
            {t('eigenschaften.trunkAusfuehrung.breite')}
            <ZahlenFeldOptional
              min={0.1}
              step={1}
              value={cm(breite)}
              placeholder={t('eigenschaften.trunkAusfuehrung.keineAngabe')}
              onCommit={(w) => rechteckAendern('breite', w)}
            />
          </label>
          <label className="feld">
            {t('eigenschaften.trunkAusfuehrung.hoehe')}
            <ZahlenFeldOptional
              min={0.1}
              step={1}
              value={cm(hoehe)}
              placeholder={t('eigenschaften.trunkAusfuehrung.keineAngabe')}
              onCommit={(w) => rechteckAendern('hoehe', w)}
            />
          </label>
        </>
      )}
      {ausfuehrung === 'rohr' && (
        <label className="feld">
          {t('eigenschaften.trunkAusfuehrung.durchmesser')}
          <ZahlenFeldOptional
            min={0.1}
            step={0.5}
            value={cm(rohr?.durchmesser)}
            placeholder={t('eigenschaften.trunkAusfuehrung.keineAngabe')}
            onCommit={(w) =>
              setze(
                { ausfuehrung, abmessung: w === null ? undefined : { durchmesser: w / 100 } },
                t('eigenschaften.trunkAusfuehrung.abmessungUndo'),
              )
            }
          />
        </label>
      )}
    </>
  )
}
