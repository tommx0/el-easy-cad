import {
  aendereGeschoss,
  deckenstaerkeMitQuelle,
  type Blatt,
  type BlattGeschoss,
  type Installationszone,
} from '../document-model'
import { erzeugeBlattAendernCommand } from '../tools/commands/blatt-commands'
import {
  erzeugeBlattNurInBauteilenCommand,
  erzeugeRaumquerungCommand,
} from '../tools/commands/nur-in-bauteilen-commands'
import { meldeNeuVerlegung } from './nur-in-bauteilen'
import { useSettingsStore } from './store/settings-store'
import { useAppContext, useProject } from './use-app-context'
import { zoneBrauchtRaumhoehe, zonenAnzeige, zonenAuswahl } from './installationszonen'
import { gleicheInstallationszonenAb } from './installationszonen-abgleich'
import { useInstallationszonenStore } from './store/installationszonen-store'
import { ZahlenFeldOptional } from './ZahlenFeld'
import { useSprache, useT } from './sprache-anbindung'

export function GeschossFelder({ blatt }: { blatt: Blatt }) {
  const t = useT()
  const sprache = useSprache()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const g = blatt.geschoss
  const ohneFeld = deckenstaerkeMitQuelle(zeichnung, {
    ...blatt,
    geschoss: aendereGeschoss(g, { deckenstaerke: undefined }),
  })
  const ohneFeldCm = Math.round(ohneFeld.meter * 100)

  function setze(patch: Partial<BlattGeschoss>, label: string) {
    commands.execute(
      erzeugeBlattAendernCommand(doc, blatt.id, label, {
        geschoss: aendereGeschoss(blatt.geschoss, patch),
      }),
    )
    if ('installationszone' in patch) gleicheInstallationszonenAb(doc)
  }

  function nurInBauteilenSetzen(an: boolean) {
    const ergebnis = erzeugeBlattNurInBauteilenCommand(
      doc,
      blatt.id,
      an,
      useSettingsStore.getState().routing,
    )
    commands.execute(ergebnis.command)
    meldeNeuVerlegung(ergebnis.fehlgeschlagen)
  }

  const eigene = zeichnung.installationszonen
  const bestand = useInstallationszonenStore((s) => s.zonen)
  const obenOhneHoehe =
    zoneBrauchtRaumhoehe(g?.installationszone, eigene) && g?.raumhoehe === undefined
  return (
    <div className="feld-gruppe">
      <h3>
        {g?.name
          ? t('eigenschaften.geschoss.titelMitName', { name: g.name })
          : t('eigenschaften.geschoss.titel')}
      </h3>
      <label className="feld">
        {t('eigenschaften.geschoss.kote')}
        <ZahlenFeldOptional
          step={0.05}
          value={g?.kote}
          placeholder={t('eigenschaften.geschoss.keineAngabe')}
          onCommit={(wert) =>
            setze({ kote: wert ?? undefined }, t('eigenschaften.geschoss.koteUndo'))
          }
        />
      </label>
      <label className="feld">
        {t('eigenschaften.geschoss.raumhoehe')}
        <ZahlenFeldOptional
          min={0.5}
          step={0.05}
          value={g?.raumhoehe}
          placeholder={t('eigenschaften.geschoss.keineAngabe')}
          onCommit={(wert) =>
            setze({ raumhoehe: wert ?? undefined }, t('eigenschaften.geschoss.raumhoeheUndo'))
          }
        />
      </label>
      <label className="feld">
        {t('eigenschaften.geschoss.deckenstaerke')}
        <ZahlenFeldOptional
          min={1}
          step={1}
          value={g?.deckenstaerke !== undefined ? Math.round(g.deckenstaerke * 100) : undefined}
          placeholder={
            ohneFeld.quelle === 'koten'
              ? t('eigenschaften.geschoss.ausKoten', { cm: ohneFeldCm })
              : t('eigenschaften.geschoss.annahme', { cm: ohneFeldCm })
          }
          onCommit={(cm) =>
            setze(
              { deckenstaerke: cm !== null && cm > 0 ? cm / 100 : undefined },
              t('eigenschaften.geschoss.deckenstaerkeUndo'),
            )
          }
        />
      </label>
      <label className="feld">
        {t('eigenschaften.geschoss.installationszone')}
        <select
          value={g?.installationszone ?? ''}
          onChange={(e) =>
            setze(
              { installationszone: (e.target.value || undefined) as Installationszone | undefined },
              t('eigenschaften.geschoss.installationszoneUndo'),
            )
          }
        >
          <option value="">{t('eigenschaften.geschoss.keineAngabe')}</option>
          {zonenAuswahl(eigene, { bestand, aktuelle: [g?.installationszone] }).map((z) => (
            <option key={z.id} value={z.id}>
              {zonenAnzeige(z, sprache)}
            </option>
          ))}
        </select>
      </label>
      <p className="feld-info">
        {obenOhneHoehe
          ? t('eigenschaften.geschoss.raumhoeheFehlt')
          : g?.installationszone
            ? t('eigenschaften.geschoss.mitZone')
            : t('eigenschaften.geschoss.ohneZone')}{' '}
        {t('eigenschaften.geschoss.zoneVorgabe')}
      </p>
      <label className="feld feld-checkbox">
        <input
          type="checkbox"
          checked={g?.nurInBauteilen === true}
          onChange={(e) => nurInBauteilenSetzen(e.target.checked)}
        />
        {t('eigenschaften.geschoss.nurInBauteilen')}
      </label>
      {g?.nurInBauteilen && (
        <>
          <label className="feld">
            {t('eigenschaften.geschoss.raumquerung')}
            <select
              value={g.raumquerung ?? 'decke'}
              onChange={(e) => {
                commands.execute(erzeugeRaumquerungCommand(doc, blatt.id, e.target.value))
                gleicheInstallationszonenAb(doc)
              }}
            >
              {zonenAuswahl(eigene, {
                bestand,
                bauteile: ['decke', 'boden'],
                aktuelle: [g.raumquerung ?? 'decke'],
              }).map((z) => (
                <option key={z.id} value={z.id}>
                  {zonenAnzeige(z, sprache)}
                </option>
              ))}
            </select>
          </label>
          <p className="feld-info">{t('eigenschaften.geschoss.raumquerungHinweis')}</p>
        </>
      )}
    </div>
  )
}
