import { istBearbeitbar, type Blatt, type LeitungsObjekt } from '../document-model'
import { NUR_IN_BAUTEILEN_WERTE, nurInBauteilenText, setzeNurInBauteilen } from './nur-in-bauteilen'
import { useAppContext } from './use-app-context'
import { useT } from './sprache-anbindung'

const VERSCHIEDEN = '(verschieden)'

export function NurInBauteilenFeld({
  leitungen,
  blatt,
}: {
  leitungen: readonly LeitungsObjekt[]
  blatt: Blatt
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const schluessel = (wert: boolean | undefined) =>
    NUR_IN_BAUTEILEN_WERTE.find((w) => w.wert === wert)!.schluessel
  const werte = new Set(leitungen.map((l) => schluessel(l.nurInBauteilen)))
  const gemeinsam = werte.size === 1 ? [...werte][0] : VERSCHIEDEN
  const blattAn = blatt.geschoss?.nurInBauteilen === true
  return (
    <label className="feld">
      {t('eigenschaften.nurInBauteilen.titel')}
      <select
        value={gemeinsam}
        onChange={(e) => {
          const gewaehlt = NUR_IN_BAUTEILEN_WERTE.find((w) => w.schluessel === e.target.value)
          if (!gewaehlt) return
          const ids = leitungen.filter((l) => istBearbeitbar(l, blatt.ebenen)).map((l) => l.id)
          setzeNurInBauteilen(doc, commands, blatt.id, ids, gewaehlt.wert)
        }}
      >
        {gemeinsam === VERSCHIEDEN && (
          <option value={VERSCHIEDEN} disabled>
            {t('eigenschaften.panel.gemeinsam.verschieden')}
          </option>
        )}
        {NUR_IN_BAUTEILEN_WERTE.map((w) => (
          <option key={w.schluessel} value={w.schluessel}>
            {nurInBauteilenText(w.wert, blattAn)}
          </option>
        ))}
      </select>
    </label>
  )
}
