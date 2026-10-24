import { useRef } from 'react'
import type { Objekt } from '../document-model'
import { istBearbeitbar, skalaAusGroessenFaktor } from '../document-model'
import { SetObjekteCommand, erzeugeObjektAendernCommand } from '../tools'
import { useAktivesBlatt, useAppContext } from './use-app-context'
import { useT } from './sprache-anbindung'
import type { Schluessel } from '../sprache'

type Faktorfeld = 'textGroessenFaktor' | 'symbolGroessenFaktor'

const TEXTE: Record<
  Faktorfeld,
  { titel: Schluessel; undo: Schluessel; eigen: Schluessel; global: Schluessel; aria: Schluessel }
> = {
  textGroessenFaktor: {
    titel: 'eigenschaften.groessenFaktor.text.titel',
    undo: 'eigenschaften.groessenFaktor.text.undo',
    eigen: 'eigenschaften.groessenFaktor.text.eigenUndo',
    global: 'eigenschaften.groessenFaktor.text.globalUndo',
    aria: 'eigenschaften.groessenFaktor.text.aria',
  },
  symbolGroessenFaktor: {
    titel: 'eigenschaften.groessenFaktor.symbol.titel',
    undo: 'eigenschaften.groessenFaktor.symbol.undo',
    eigen: 'eigenschaften.groessenFaktor.symbol.eigenUndo',
    global: 'eigenschaften.groessenFaktor.symbol.globalUndo',
    aria: 'eigenschaften.groessenFaktor.symbol.aria',
  },
}

export function GroessenFaktorFeld({
  objekte,
  feld,
}: {
  objekte: readonly Extract<Objekt, { type: 'komponente' }>[]
  feld: Faktorfeld
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const vorherRef = useRef<Objekt[] | null>(null)
  const texte = TEXTE[feld]
  const ids = objekte.filter((o) => istBearbeitbar(o, blatt.ebenen)).map((o) => o.id)

  const werte = new Set(objekte.map((o) => o[feld]))
  const hatEigenenWert = objekte.every((o) => o[feld] !== undefined)
  const einheitlich = werte.size === 1
  const wert = objekte[0][feld] ?? blatt[feld]
  const prozent = Math.round(skalaAusGroessenFaktor(wert) * 100)

  function waehrendZiehen(neu: number) {
    if (vorherRef.current === null) vorherRef.current = blatt.objekte
    doc.updateBlatt(blatt.id, {
      objekte: blatt.objekte.map((o) =>
        ids.includes(o.id) ? ({ ...o, [feld]: neu } as Objekt) : o,
      ),
    })
  }

  function uebernehmen() {
    const vorher = vorherRef.current
    vorherRef.current = null
    if (vorher === null || vorher === blatt.objekte) return
    commands.push(new SetObjekteCommand(doc, blatt.id, vorher, blatt.objekte, t(texte.undo)))
  }

  function eigenenWertUmschalten(an: boolean) {
    if (ids.length === 0) return
    commands.execute(
      erzeugeObjektAendernCommand(doc, blatt.id, t(an ? texte.eigen : texte.global), (alle) =>
        alle.map((o) => {
          if (!ids.includes(o.id) || o.type !== 'komponente') return o
          const neu = an ? (o[feld] ?? blatt[feld]) : undefined
          return { ...o, [feld]: neu } as Objekt
        }),
      ),
    )
  }

  function anzeigeText(): string {
    if (!einheitlich) return t('eigenschaften.panel.gemeinsam.verschieden')
    return hatEigenenWert
      ? `${wert.toFixed(2)} · ${prozent} %`
      : t('eigenschaften.groessenFaktor.wieGlobal', {
          wert: blatt[feld].toFixed(2),
          prozent,
        })
  }

  return (
    <label className="feld feld-groessenfaktor">
      {t(texte.titel)}
      <span className="feld-groessenfaktor-regler">
        <input
          type="checkbox"
          title={t('eigenschaften.groessenFaktor.eigenerWert')}
          checked={hatEigenenWert}
          onChange={(e) => eigenenWertUmschalten(e.target.checked)}
        />
        <input
          type="range"
          min={-5}
          max={5}
          step={0.01}
          value={wert}
          disabled={!hatEigenenWert}
          aria-label={t(texte.aria)}
          onChange={(e) => waehrendZiehen(Number(e.target.value))}
          onPointerUp={uebernehmen}
          onKeyUp={uebernehmen}
          onBlur={uebernehmen}
        />
        <span>{anzeigeText()}</span>
      </span>
    </label>
  )
}
