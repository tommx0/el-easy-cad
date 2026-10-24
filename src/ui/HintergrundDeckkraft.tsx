import { useRef } from 'react'
import { istBekannterHintergrund } from '../document-model'
import { UpdateBlattCommand } from '../tools'
import { useAktivesBlatt, useAppContext } from './use-app-context'
import { useT } from './sprache-anbindung'

export function HintergrundDeckkraft() {
  const t = useT()
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const vorherRef = useRef<number | null>(null)

  if (!istBekannterHintergrund(blatt.hintergrund)) return null

  const prozent = Math.round(blatt.hintergrundDeckkraft * 100)

  function aendere(wertProzent: number) {
    if (vorherRef.current === null) vorherRef.current = blatt.hintergrundDeckkraft
    doc.updateBlatt(blatt.id, { hintergrundDeckkraft: wertProzent / 100 })
  }

  function uebernehmen() {
    const vorher = vorherRef.current
    vorherRef.current = null
    if (vorher === null || vorher === blatt.hintergrundDeckkraft) return
    commands.push(
      new UpdateBlattCommand(
        doc,
        blatt.id,
        { hintergrundDeckkraft: vorher },
        { hintergrundDeckkraft: blatt.hintergrundDeckkraft },
        t('eigenschaften.hintergrundDeckkraft.undo'),
      ),
    )
  }

  return (
    <label className="kopfzeile-deckkraft" title={t('eigenschaften.hintergrundDeckkraft.titel')}>
      <span className="kopfzeile-deckkraft-beschriftung">
        {t('eigenschaften.hintergrundDeckkraft.beschriftung')}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={prozent}
        aria-label={t('eigenschaften.hintergrundDeckkraft.aria')}
        onChange={(e) => aendere(Number(e.target.value))}
        onPointerUp={uebernehmen}
        onKeyUp={uebernehmen}
        onBlur={uebernehmen}
      />
      <span className="kopfzeile-deckkraft-wert">{prozent} %</span>
    </label>
  )
}
