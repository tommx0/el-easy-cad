import type { KomponentenObjekt, Objekt } from '../document-model'
import {
  alleVerteiler,
  belegteKlemmenNummern,
  ersteKlemmenNummer,
  istKlemme,
  istKlemmenKennzeichen,
  kennzeichenTraeger,
  klemmeNummeriert,
  klemmenNummernAb,
  klemmenNummerVergeben,
  klemmenZahl,
  naechsteKlemmenNummer,
  normiereVerteilerKennzeichen,
  teiltKennzeichenOhneRueckfrage,
  verteilerKennzeichenText,
} from '../document-model'
import { erzeugeObjektAendernCommand, erzeugeZeichnungAendernCommand } from '../tools'
import { EntwurfsTextfeld } from './EntwurfsTextfeld'
import { useUiStore } from './store/ui-store'
import { useAppContext, useProject } from './use-app-context'
import { useVerknuepfung } from './use-verknuepfung'
import { useT } from './sprache-anbindung'

export function KennzeichenFeld({
  objekt,
  blattId,
}: {
  objekt: KomponentenObjekt
  blattId: string
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()

  function setze(kennzeichen: string) {
    commands.execute(
      erzeugeObjektAendernCommand(doc, blattId, t('eigenschaften.kennzeichen.undo'), (objekte) =>
        objekte.map((o) =>
          o.id === objekt.id
            ? ({ ...o, geraeteKennzeichen: kennzeichen || undefined } as Objekt)
            : o,
        ),
      ),
    )
  }

  function uebernehmen(eingabe: string) {
    const kennzeichen = eingabe.trim()
    if (istKlemmenKennzeichen(kennzeichen) && (istKlemme(objekt) || !objekt.geraeteKennzeichen)) {
      if (kennzeichen === objekt.geraeteKennzeichen?.trim()) return
      useUiStore.getState().setKlemmenLeiste(kennzeichen)
      const belegt = belegteKlemmenNummern(zeichnung, kennzeichen, new Set([objekt.id]))
      const neu = klemmeNummeriert(objekt, kennzeichen, naechsteKlemmenNummer(belegt.keys()))
      commands.execute(
        erzeugeObjektAendernCommand(
          doc,
          blattId,
          t('eigenschaften.kennzeichen.klemmenleisteUndo'),
          (objekte) => objekte.map((o) => (o.id === objekt.id ? neu : o)),
        ),
      )
      return
    }
    const andere = kennzeichen
      ? kennzeichenTraeger(zeichnung, kennzeichen).filter((t) => t.objekt.id !== objekt.id)
      : []
    if (
      andere.length === 0 ||
      teiltKennzeichenOhneRueckfrage(
        objekt,
        andere.map((t) => t.objekt),
      )
    ) {
      setze(kennzeichen)
      return
    }
    useUiStore.getState().oeffneBestaetigung({
      titel: t('eigenschaften.kennzeichen.vergebenTitel'),
      nachricht: t('eigenschaften.kennzeichen.vergebenFrage', {
        kennzeichen,
        n: andere.length,
        orte: [...new Set(andere.map((traeger) => traeger.blattName))].join(', '),
      }),
      bestaetigenText: t('eigenschaften.kennzeichen.trotzdemVergeben'),
      destruktiv: false,
      callback: (bestaetigt) => {
        if (bestaetigt) setze(kennzeichen)
      },
    })
  }

  return (
    <label className="feld">
      {t('eigenschaften.kennzeichen.kennzeichen')}
      <EntwurfsTextfeld
        wert={objekt.geraeteKennzeichen ?? ''}
        platzhalter={t('eigenschaften.kennzeichen.beispielF3')}
        onUebernehmen={uebernehmen}
      />
    </label>
  )
}

export function KlemmenNummerFeld({
  objekt,
  blattId,
}: {
  objekt: KomponentenObjekt
  blattId: string
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()

  function uebernehmen(eingabe: string) {
    const start = klemmenZahl(eingabe)
    if (start === null || start < 1) {
      useUiStore.getState().zeigeToast(t('eigenschaften.kennzeichen.ganzeZahl'))
      return
    }
    const nummern = klemmenNummernAb(objekt, start)
    const vergeben = klemmenNummerVergeben(zeichnung, objekt, nummern)
    if (vergeben) {
      useUiStore.getState().zeigeToast(vergeben)
      return
    }
    const neu = klemmeNummeriert(objekt, objekt.geraeteKennzeichen?.trim() ?? '', start)
    commands.execute(
      erzeugeObjektAendernCommand(
        doc,
        blattId,
        t('eigenschaften.kennzeichen.klemmennummerUndo'),
        (objekte) => objekte.map((o) => (o.id === objekt.id ? neu : o)),
      ),
    )
  }

  return (
    <label className="feld">
      {t('eigenschaften.kennzeichen.klemme')}
      <EntwurfsTextfeld
        wert={ersteKlemmenNummer(objekt) ?? ''}
        platzhalter={t('eigenschaften.kennzeichen.beispiel1')}
        onUebernehmen={uebernehmen}
      />
    </label>
  )
}

export function VerteilerKennzeichenFeld({
  objekt,
  blattId,
  vorschlaege = [],
}: {
  objekt: KomponentenObjekt
  blattId: string
  vorschlaege?: readonly string[]
}) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const aktuell = objekt.verteiler?.kennzeichen ?? ''

  function uebernehmen(eingabe: string) {
    const kennzeichen = normiereVerteilerKennzeichen(eingabe)
    if (!kennzeichen || kennzeichen === aktuell) return
    const vergeben = alleVerteiler(zeichnung).some(
      (v) => v.verteiler.id !== objekt.id && v.verteiler.verteiler?.kennzeichen === kennzeichen,
    )
    if (vergeben) {
      useUiStore.getState().zeigeToast(
        t('eigenschaften.kennzeichen.verteilerVergeben', {
          kennzeichen: verteilerKennzeichenText(kennzeichen),
        }),
      )
      return
    }
    commands.execute(
      erzeugeObjektAendernCommand(
        doc,
        blattId,
        t('eigenschaften.kennzeichen.verteilerUndo'),
        (objekte) =>
          objekte.map((o) =>
            o.id === objekt.id && o.type === 'komponente' && o.verteiler
              ? { ...o, verteiler: { ...o.verteiler, kennzeichen } }
              : o,
          ),
      ),
    )
  }

  const listenId = `verteiler-kennzeichen-${objekt.id}`
  return (
    <label className="feld">
      {t('eigenschaften.kennzeichen.verteiler')}
      <EntwurfsTextfeld
        wert={aktuell ? verteilerKennzeichenText(aktuell) : ''}
        platzhalter={t('eigenschaften.kennzeichen.beispielUv1')}
        liste={vorschlaege.length > 0 ? listenId : undefined}
        onUebernehmen={uebernehmen}
      />
      {vorschlaege.length > 0 && (
        <datalist id={listenId}>
          {vorschlaege.map((v) => (
            <option key={v} value={verteilerKennzeichenText(v)} />
          ))}
        </datalist>
      )}
    </label>
  )
}

export function VerteilerFelder({
  objekt,
  blattId,
}: {
  objekt: KomponentenObjekt
  blattId: string
}) {
  const t = useT()
  const { toolContext } = useAppContext()
  const zeichnung = useProject()
  const stand = useVerknuepfung()
  const eigene = new Set(alleVerteiler(zeichnung).map((v) => v.verteiler.verteiler?.kennzeichen))
  const plaene = stand.verteilerplaene
    .map((p) => p.zeichnung.verteilerKennzeichen)
    .filter((k): k is string => !!k)
  const vorschlaege = [...new Set(plaene)].filter((k) => !eigene.has(k))
  const kennzeichen = objekt.verteiler?.kennzeichen
  const plan = stand.verteilerplaene.find((p) => p.zeichnung.verteilerKennzeichen === kennzeichen)
  return (
    <>
      <VerteilerKennzeichenFeld objekt={objekt} blattId={blattId} vorschlaege={vorschlaege} />
      <p className="feld-info">
        {plan
          ? t('eigenschaften.kennzeichen.verteilerplan', { name: plan.dokument.name })
          : stand.laedt
            ? t('eigenschaften.kennzeichen.planWirdGelesen')
            : kennzeichen
              ? t('eigenschaften.kennzeichen.keinPlanMit', {
                  kennzeichen: verteilerKennzeichenText(kennzeichen),
                })
              : t('eigenschaften.kennzeichen.keinPlan')}
      </p>
      <button
        type="button"
        onClick={() =>
          toolContext.oeffneVerteilerDialog(
            { blattId, objektId: objekt.id, modus: 'uebersicht' },
            () => {},
          )
        }
      >
        {t('eigenschaften.kennzeichen.bestueckung')}
      </button>
    </>
  )
}

export function VerteilerplanFeld() {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const stand = useVerknuepfung()
  const aktuell = zeichnung.verteilerKennzeichen ?? ''
  const vorschlaege = [
    ...new Set(
      stand.bauplaene.flatMap((b) =>
        alleVerteiler(b.zeichnung).map((v) => v.verteiler.verteiler?.kennzeichen ?? ''),
      ),
    ),
  ]
    .filter(Boolean)
    .sort()
  const zuBauplaenen = stand.bauplaene.filter((b) =>
    alleVerteiler(b.zeichnung).some((v) => v.verteiler.verteiler?.kennzeichen === aktuell),
  )
  return (
    <>
      <label className="feld">
        {t('eigenschaften.kennzeichen.verteilerplanFuer')}
        <EntwurfsTextfeld
          wert={aktuell ? verteilerKennzeichenText(aktuell) : ''}
          platzhalter={t('eigenschaften.kennzeichen.beispielUv1')}
          liste={vorschlaege.length > 0 ? 'verteilerplan-vorschlaege' : undefined}
          onUebernehmen={(eingabe) => {
            const kennzeichen = normiereVerteilerKennzeichen(eingabe)
            if (kennzeichen === aktuell) return
            commands.execute(
              erzeugeZeichnungAendernCommand(doc, t('eigenschaften.kennzeichen.zuordnenUndo'), {
                verteilerKennzeichen: kennzeichen || undefined,
              }),
            )
          }}
        />
        {vorschlaege.length > 0 && (
          <datalist id="verteilerplan-vorschlaege">
            {vorschlaege.map((v) => (
              <option key={v} value={verteilerKennzeichenText(v)} />
            ))}
          </datalist>
        )}
      </label>
      {aktuell && (
        <p className="feld-info">
          {stand.laedt
            ? t('eigenschaften.kennzeichen.bauplaeneWerdenGelesen')
            : zuBauplaenen.length > 0
              ? t('eigenschaften.kennzeichen.verknuepft', {
                  namen: zuBauplaenen.map((b) => b.dokument.name).join(', '),
                })
              : t('eigenschaften.kennzeichen.keinVerteiler', {
                  kennzeichen: verteilerKennzeichenText(aktuell),
                })}
        </p>
      )}
    </>
  )
}
