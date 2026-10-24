import { useState } from 'react'
import type { Geraetegruppe, KomponenteInZeichnung, SlotZiel } from '../../document-model'
import { typBezeichnung } from '../../document-model'
import { t as tAktuell } from '../../sprache'
import { useT } from '../sprache-anbindung'

function gruppenBezeichnungFuerSuche(g: Geraetegruppe): string {
  return (
    g.name || tAktuell('eigenschaften.zielAuswahl.gruppeOhneName', { typ: typBezeichnung(g.typ) })
  )
}

export function ZielAuswahl({
  komponenten,
  gruppen,
  onWahl,
}: {
  komponenten: KomponenteInZeichnung[]
  gruppen: Geraetegruppe[]
  onWahl: (ziel: SlotZiel) => void
}) {
  const t = useT()
  const [suchtext, setSuchtext] = useState('')
  const [wert, setWert] = useState('')

  const suchtextKlein = suchtext.trim().toLowerCase()
  const gefilterteKomponenten = suchtextKlein
    ? komponenten.filter(
        (k) =>
          k.bezeichnung.toLowerCase().includes(suchtextKlein) ||
          k.blattName.toLowerCase().includes(suchtextKlein),
      )
    : komponenten
  const gefilterteGruppen = suchtextKlein
    ? gruppen.filter((g) => gruppenBezeichnungFuerSuche(g).toLowerCase().includes(suchtextKlein))
    : gruppen

  return (
    <div className="slot-ziel-hinzufuegen">
      <input
        type="text"
        className="slot-ziel-suche"
        placeholder={t('eigenschaften.zielAuswahl.suchen')}
        value={suchtext}
        onChange={(e) => {
          setSuchtext(e.target.value)
          setWert('')
        }}
      />
      <div className="slot-ziel-hinzufuegen-zeile">
        <select value={wert} onChange={(e) => setWert(e.target.value)}>
          <option value="">{t('eigenschaften.zielAuswahl.waehlen')}</option>
          {gefilterteKomponenten.length > 0 && (
            <optgroup label={t('eigenschaften.zielAuswahl.komponenten')}>
              {gefilterteKomponenten.map((k) => (
                <option
                  key={`${k.blattId}:${k.objektId}`}
                  value={JSON.stringify({
                    art: 'instanz',
                    blattId: k.blattId,
                    objektId: k.objektId,
                  })}
                >
                  {k.bezeichnung} ({k.blattName})
                </option>
              ))}
            </optgroup>
          )}
          {gefilterteGruppen.length > 0 && (
            <optgroup label={t('eigenschaften.zielAuswahl.gruppen')}>
              {gefilterteGruppen.map((g) => (
                <option key={g.id} value={JSON.stringify({ art: 'gruppe', gruppeId: g.id })}>
                  {gruppenBezeichnungFuerSuche(g)}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <button
          type="button"
          className="feld-button"
          disabled={!wert}
          onClick={() => {
            if (!wert) return
            onWahl(JSON.parse(wert) as SlotZiel)
            setWert('')
          }}
        >
          {t('eigenschaften.zielAuswahl.hinzufuegen')}
        </button>
      </div>
    </div>
  )
}
