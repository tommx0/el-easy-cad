import type { Blatt, Installationszone } from '../document-model'
import { gleicheInstallationszonenAb } from './installationszonen-abgleich'
import { useInstallationszonenStore } from './store/installationszonen-store'
import { useAppContext, useProject } from './use-app-context'
import { zoneBrauchtRaumhoehe, zonenAnzeige, zonenAuswahl, zonenText } from './installationszonen'
import { useSprache, useT } from './sprache-anbindung'

const VERSCHIEDEN = '(verschieden)'

export function InstallationszoneFeld({
  objekte,
  blatt,
  hinweis,
  aendern,
}: {
  objekte: readonly { installationszone?: Installationszone }[]
  blatt: Blatt
  hinweis?: string
  aendern: (zone: Installationszone | undefined) => void
}) {
  const t = useT()
  const sprache = useSprache()
  const { doc } = useAppContext()
  const eigene = useProject().installationszonen
  const bestand = useInstallationszonenStore((s) => s.zonen)
  const werte = new Set(objekte.map((o) => o.installationszone ?? ''))
  const gemeinsam = werte.size === 1 ? [...werte][0] : VERSCHIEDEN
  const blattZone = blatt.geschoss?.installationszone
  const obenOhneHoehe =
    blatt.geschoss?.raumhoehe === undefined &&
    objekte.some((o) =>
      zoneBrauchtRaumhoehe(o.installationszone ?? blatt.geschoss?.installationszone, eigene),
    )
  return (
    <>
      <label className="feld">
        {t('eigenschaften.installationszone.titel')}
        <select
          value={gemeinsam}
          onChange={(e) => {
            if (e.target.value === VERSCHIEDEN) return
            aendern((e.target.value || undefined) as Installationszone | undefined)
            gleicheInstallationszonenAb(doc)
          }}
        >
          {gemeinsam === VERSCHIEDEN && (
            <option value={VERSCHIEDEN} disabled>
              {t('eigenschaften.panel.gemeinsam.verschieden')}
            </option>
          )}
          <option value="">
            {t('eigenschaften.installationszone.wieBlatt', {
              zone: zonenText(blattZone, eigene, sprache),
            })}
          </option>
          {zonenAuswahl(eigene, {
            bestand,
            aktuelle: objekte.map((o) => o.installationszone),
          }).map((z) => (
            <option key={z.id} value={z.id}>
              {zonenAnzeige(z, sprache)}
            </option>
          ))}
        </select>
      </label>
      {hinweis && <p className="feld-info">{hinweis}</p>}
      {obenOhneHoehe && (
        <p className="feld-info">{t('eigenschaften.installationszone.raumhoeheFehlt')}</p>
      )}
    </>
  )
}
