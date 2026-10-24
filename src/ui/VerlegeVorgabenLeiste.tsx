import type { Blatt, Installationszone, ZonenVerlegung } from '../document-model'
import { gegenstueckZone } from '../document-model'
import { KabeltypFeld } from './components/KabeltypFeld'
import { InstallationszoneFeld } from './InstallationszoneFeld'
import { geltendeZonen, zonenAuswahl } from './installationszonen'
import { setzeStandardKabeltyp } from './kabeltyp-abgleich'
import { useT } from './sprache-anbindung'
import { useInstallationszonenStore } from './store/installationszonen-store'
import { useUiStore } from './store/ui-store'
import { AusfuehrungEingabe } from './TrunkAusfuehrungFelder'
import { useAppContext, useProject } from './use-app-context'

export function VerlegeVorgabenLeiste({
  werkzeug,
  blatt,
}: {
  werkzeug: 'leitung' | 'trunk'
  blatt: Blatt
}) {
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const vorgaben = useUiStore((s) => s.verlegeVorgaben)
  const setze = useUiStore((s) => s.setVerlegeVorgaben)
  const t = useT()

  if (werkzeug === 'leitung')
    return (
      <div className="canvas-kabeltyp-leiste canvas-bauteil-leiste">
        <KabeltypFeld
          titel={t('aktionen.verlegeVorgaben.kabeltyp')}
          wertId={zeichnung.standardKabeltypId}
          zusatzTypen={zeichnung.kabeltypen}
          freierTextErlaubt={false}
          leerText={t('aktionen.verlegeVorgaben.keinStandard')}
          aendern={(wahl) => setzeStandardKabeltyp(doc, commands, wahl)}
        />
        <ZonenVorgabe
          blatt={blatt}
          wert={vorgaben.leitungZone}
          aendern={(zone) => setze({ leitungZone: zone })}
        />
      </div>
    )

  return (
    <div className="canvas-kabeltyp-leiste canvas-bauteil-leiste">
      <span className="canvas-leiste-titel">{t('aktionen.verlegeVorgaben.neueTrunks')}</span>
      <AusfuehrungEingabe
        wert={{ ausfuehrung: vorgaben.trunkAusfuehrung, abmessung: vorgaben.trunkAbmessung }}
        aendern={(patch) =>
          setze({ trunkAusfuehrung: patch.ausfuehrung, trunkAbmessung: patch.abmessung })
        }
      />
      <ZonenVorgabe
        blatt={blatt}
        wert={vorgaben.trunkZone}
        aendern={(zone) => setze({ trunkZone: zone })}
      />
    </div>
  )
}

function ZonenVorgabe({
  blatt,
  wert,
  aendern,
}: {
  blatt: Blatt
  wert: Installationszone | undefined
  aendern: (zone: Installationszone | undefined) => void
}) {
  const t = useT()
  const eigene = useProject().installationszonen
  const bestand = useInstallationszonenStore((s) => s.zonen)
  const blattZone = blatt.geschoss?.installationszone
  const wirksam = geltendeZonen(eigene, bestand).find((z) => z.id === (wert ?? blattZone))
  const kandidaten = zonenAuswahl(eigene, { bestand })
  const ziel = (verlegung: ZonenVerlegung) =>
    wirksam ? gegenstueckZone(wirksam, verlegung, kandidaten) : undefined

  function umschalten(verlegung: ZonenVerlegung) {
    const neu = ziel(verlegung)
    if (!neu || neu.id === wirksam?.id) return
    aendern(neu.id === blattZone ? undefined : neu.id)
  }

  const knopf = (verlegung: ZonenVerlegung, text: string, lang: string) => {
    const moeglich = ziel(verlegung) !== undefined
    return (
      <button
        type="button"
        aria-pressed={wirksam?.verlegung === verlegung}
        disabled={!moeglich}
        title={
          moeglich
            ? lang
            : wirksam
              ? t('aktionen.verlegeVorgaben.keineZone', { zone: lang })
              : t('aktionen.verlegeVorgaben.ersteZone')
        }
        onClick={() => umschalten(verlegung)}
      >
        {text}
      </button>
    )
  }

  return (
    <>
      <InstallationszoneFeld
        objekte={[{ installationszone: wert }]}
        blatt={blatt}
        aendern={aendern}
      />
      <div
        className="verlegeart-umschalter"
        role="group"
        aria-label={t('aktionen.verlegeVorgaben.aufOderUnterPutz')}
      >
        {knopf('auf', t('aktionen.verlegeVorgaben.ap'), t('aktionen.verlegeVorgaben.aufPutz'))}
        {knopf('in', t('aktionen.verlegeVorgaben.up'), t('aktionen.verlegeVorgaben.unterPutz'))}
      </div>
    </>
  )
}
