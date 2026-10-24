import { useState, type ReactNode } from 'react'
import type {
  AutoGruppe,
  CatalogComponent,
  GruppenAngaben,
  LeitungsVerknuepfung,
  Slot,
  VerknuepfungsAuswahl,
  VerknuepfungsGeraet,
  Zeichnung,
} from '../../document-model'
import {
  angabenAusVorgabe,
  autoGruppeZurAuswahl,
  ermittleLeitungsVerknuepfung,
  NEUER_SLOT,
  wendeLeitungsVerknuepfungAn,
  zielBezeichnung,
} from '../../document-model'
import type { Uebersetzer } from '../../sprache'
import { erzeugeLeitungsVerknuepfungCommand } from '../../tools'
import { autoGruppenHinweise } from '../slots-uebernehmen'
import { GruppenFelder } from './GruppeBildenDialog'
import { useKatalogStore } from '../store/katalog-store'
import type { VerknuepfungDialogZustand } from '../store/ui-store'
import { useUiStore } from '../store/ui-store'
import { useAppContext, useProject } from '../use-app-context'
import { useT } from '../sprache-anbindung'
import { slotNameText, spracheDesUebersetzers } from '../../document-model'

export function LeitungVerknuepfenDialog() {
  const dialog = useUiStore((s) => s.verknuepfungDialog)
  if (!dialog) return null
  return <DialogInhalt key={`${dialog.blattId}:${dialog.leitungId}`} dialog={dialog} />
}

function DialogInhalt({ dialog }: { dialog: VerknuepfungDialogZustand }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const katalog = useKatalogStore((s) => s.komponenten)
  const [vorschlag] = useState(() =>
    ermittleLeitungsVerknuepfung(zeichnung, katalog, dialog.blattId, dialog.leitungId),
  )
  const schliessen = () => useUiStore.getState().schliesseVerknuepfungDialog()

  function anlegen(auswahl: VerknuepfungsAuswahl) {
    if (!vorschlag) return
    const ergebnis = wendeLeitungsVerknuepfungAn(doc.getZeichnung(), vorschlag, auswahl)
    if (ergebnis) commands.execute(erzeugeLeitungsVerknuepfungCommand(doc, ergebnis))
    schliessen()
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-verknuepfen" onMouseDown={(e) => e.stopPropagation()}>
        {!vorschlag ? (
          <>
            <h2>{t('verteilerdialoge.verknuepfen.titel')}</h2>
            <p className="dialog-hinweis">{t('verteilerdialoge.verknuepfen.nichtsAnzulegen')}</p>
            <div className="dialog-aktionen">
              <button onClick={schliessen}>{t('verteilerdialoge.allgemein.schliessen')}</button>
            </div>
          </>
        ) : vorschlag.art === 'wirkverbindung' ? (
          <Wirkverbindung
            v={vorschlag}
            zeichnung={zeichnung}
            katalog={katalog}
            onAnlegen={anlegen}
            onAbbrechen={schliessen}
          />
        ) : vorschlag.art === 'abgleich' ? (
          <Abgleich
            v={vorschlag}
            zeichnung={zeichnung}
            katalog={katalog}
            onAnlegen={anlegen}
            onAbbrechen={schliessen}
          />
        ) : (
          <Gruppe v={vorschlag} onAnlegen={anlegen} onAbbrechen={schliessen} />
        )}
      </div>
    </div>
  )
}

function slotText(t: Uebersetzer, slot: Slot, index: number): string {
  const name =
    slotNameText(slot.bezeichnung, spracheDesUebersetzers(t)) ||
    t('verteilerdialoge.allgemein.slotNummer', { nummer: index + 1 })
  return slot.ziele.length === 0
    ? t('verteilerdialoge.verknuepfen.slotFrei', { name })
    : t('verteilerdialoge.verknuepfen.slotMitZielen', { name, n: slot.ziele.length })
}

function useAutoGruppe(
  zeichnung: Zeichnung,
  katalog: readonly CatalogComponent[],
  v: LeitungsVerknuepfung,
  auswahl: VerknuepfungsAuswahl,
): { fall: AutoGruppe | null; angaben: GruppenAngaben | undefined; abschnitt: ReactNode } {
  const t = useT()
  const [eigene, setEigene] = useState<GruppenAngaben | null>(null)
  const fall = autoGruppeZurAuswahl(zeichnung, katalog, v, auswahl)
  const angaben = fall ? (eigene ?? angabenAusVorgabe(fall.vorgabe)) : undefined
  const abschnitt =
    fall && angaben ? (
      <fieldset className="verknuepfen-ziel">
        <legend>{t('verteilerdialoge.verknuepfen.geraetegruppe')}</legend>
        <p className="dialog-hinweis">
          {t('verteilerdialoge.verknuepfen.autoGruppe', {
            slot: fall.slotName,
            quelle: fall.quelleName,
            mitglieder: fall.mitgliederNamen.join(', '),
          })}
        </p>
        <GruppenFelder vorgabe={fall.vorgabe} angaben={angaben} onAngaben={setEigene} />
        {autoGruppenHinweise(fall).map((h) => (
          <p key={h} className="dialog-hinweis">
            {h}
          </p>
        ))}
      </fieldset>
    ) : null
  return { fall, angaben, abschnitt }
}

function SlotAuswahl({
  geraet,
  wert,
  onWahl,
  nurMitZielen = false,
  deaktiviert = false,
}: {
  geraet: VerknuepfungsGeraet
  wert: string
  onWahl: (slotId: string) => void
  nurMitZielen?: boolean
  deaktiviert?: boolean
}) {
  const t = useT()
  return (
    <select value={wert} disabled={deaktiviert} onChange={(e) => onWahl(e.target.value)}>
      {geraet.slots.map((s, i) =>
        nurMitZielen && s.ziele.length === 0 ? null : (
          <option key={s.id} value={s.id}>
            {slotText(t, s, i)}
          </option>
        ),
      )}
      {!geraet.matrix && !nurMitZielen && (
        <option value={NEUER_SLOT}>{t('verteilerdialoge.verknuepfen.neuerSlot')}</option>
      )}
    </select>
  )
}

function Wirkverbindung({
  v,
  zeichnung,
  katalog,
  onAnlegen,
  onAbbrechen,
}: {
  v: Extract<LeitungsVerknuepfung, { art: 'wirkverbindung' }>
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  onAnlegen: (a: VerknuepfungsAuswahl) => void
  onAbbrechen: () => void
}) {
  const t = useT()
  const [wahl, setWahl] = useState(() =>
    v.quellen.map((q) => ({ objektId: q.objekt.id, slotId: q.slotVorschlag, an: true })),
  )
  const [zielGruppe, setZielGruppe] = useState(v.gruppe !== null)
  const [bezeichnung, setBezeichnung] = useState(v.nameVorschlag)
  const angehakt = wahl.filter((w) => w.an)
  const auswahl: VerknuepfungsAuswahl = {
    art: 'wirkverbindung',
    quellen: angehakt.map(({ objektId, slotId }) => ({ objektId, slotId })),
    zielGruppe,
    slotBezeichnung: bezeichnung,
  }
  const gruppe = useAutoGruppe(zeichnung, katalog, v, auswahl)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onAnlegen({ ...auswahl, gruppe: gruppe.angaben })
      }}
    >
      <h2>{t('verteilerdialoge.verknuepfen.wirkTitel')}</h2>
      <p className="dialog-hinweis">
        {t('verteilerdialoge.verknuepfen.wirkFrage', {
          nummer: String(v.leitungNummer),
          quelle: v.quellen[0].name,
          ziel: v.ziel.name,
        })}
      </p>
      <table className="verknuepfen-tabelle">
        <tbody>
          {v.quellen.map((q, i) => (
            <tr key={q.objekt.id}>
              <td>
                <label className="feld-checkbox">
                  <input
                    type="checkbox"
                    checked={wahl[i].an}
                    onChange={(e) =>
                      setWahl(wahl.map((w, j) => (j === i ? { ...w, an: e.target.checked } : w)))
                    }
                  />
                  {q.name}
                </label>
                {i > 0 && (
                  <div className="dialog-hinweis">
                    {t('verteilerdialoge.verknuepfen.perLeitung')}
                  </div>
                )}
              </td>
              <td>
                <SlotAuswahl
                  geraet={q}
                  wert={wahl[i].slotId}
                  deaktiviert={!wahl[i].an}
                  onWahl={(slotId) => setWahl(wahl.map((w, j) => (j === i ? { ...w, slotId } : w)))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {v.gruppe && (
        <fieldset className="verknuepfen-ziel">
          <legend>{t('verteilerdialoge.verknuepfen.ziel')}</legend>
          <label className="feld-checkbox">
            <input type="radio" checked={zielGruppe} onChange={() => setZielGruppe(true)} />
            {t('verteilerdialoge.verknuepfen.zielGruppe', { name: v.gruppe.name })}
          </label>
          <label className="feld-checkbox">
            <input type="radio" checked={!zielGruppe} onChange={() => setZielGruppe(false)} />
            {t('verteilerdialoge.verknuepfen.zielNur', { name: v.ziel.name })}
          </label>
        </fieldset>
      )}
      <label className="dialog-feld">
        {t('verteilerdialoge.verknuepfen.slotBezeichnung')}
        <input
          value={bezeichnung}
          placeholder={t('verteilerdialoge.gruppeBilden.nameBeispiel')}
          onChange={(e) => setBezeichnung(e.target.value)}
        />
      </label>
      {gruppe.abschnitt}
      <div className="dialog-aktionen">
        <button type="button" onClick={onAbbrechen}>
          {t('verteilerdialoge.allgemein.abbrechen')}
        </button>
        <button type="submit" className="primaer" disabled={angehakt.length === 0}>
          {t('verteilerdialoge.verknuepfen.anlegen')}
        </button>
      </div>
    </form>
  )
}

function Abgleich({
  v,
  zeichnung,
  katalog,
  onAnlegen,
  onAbbrechen,
}: {
  v: Extract<LeitungsVerknuepfung, { art: 'abgleich' }>
  zeichnung: Zeichnung
  katalog: readonly CatalogComponent[]
  onAnlegen: (a: VerknuepfungsAuswahl) => void
  onAbbrechen: () => void
}) {
  const t = useT()
  const [vonSlotId, setVonSlotId] = useState(v.von.slotVorschlag)
  const [nachSlotId, setNachSlotId] = useState(v.nach.slotVorschlag)
  const von = v.von.slots.find((s) => s.id === vonSlotId)
  const ziele = (von?.ziele ?? []).map((z) => zielBezeichnung(z, zeichnung, katalog)).join(', ')
  const auswahl: VerknuepfungsAuswahl = { art: 'abgleich', vonSlotId, nachSlotId }
  const gruppe = useAutoGruppe(zeichnung, katalog, v, auswahl)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onAnlegen({ ...auswahl, gruppe: gruppe.angaben })
      }}
    >
      <h2>{t('verteilerdialoge.verknuepfen.abgleichTitel')}</h2>
      <p className="dialog-hinweis">
        {t('verteilerdialoge.verknuepfen.abgleichText', {
          nummer: String(v.leitungNummer),
          von: v.von.name,
          nach: v.nach.name,
        })}
      </p>
      <label className="dialog-feld">
        {t('verteilerdialoge.verknuepfen.slotVon', { name: v.von.name })}
        <SlotAuswahl geraet={v.von} wert={vonSlotId} onWahl={setVonSlotId} nurMitZielen />
      </label>
      {ziele && (
        <p className="dialog-hinweis">{t('verteilerdialoge.verknuepfen.wirktAuf', { ziele })}</p>
      )}
      <label className="dialog-feld">
        {t('verteilerdialoge.verknuepfen.uebernimmtAuf', { name: v.nach.name })}
        <SlotAuswahl geraet={v.nach} wert={nachSlotId} onWahl={setNachSlotId} />
      </label>
      {gruppe.abschnitt}
      <div className="dialog-aktionen">
        <button type="button" onClick={onAbbrechen}>
          {t('verteilerdialoge.allgemein.abbrechen')}
        </button>
        <button type="submit" className="primaer">
          {t('verteilerdialoge.allgemein.uebernehmen')}
        </button>
      </div>
    </form>
  )
}

function Gruppe({
  v,
  onAnlegen,
  onAbbrechen,
}: {
  v: Extract<LeitungsVerknuepfung, { art: 'gruppe' }>
  onAnlegen: (a: VerknuepfungsAuswahl) => void
  onAbbrechen: () => void
}) {
  const t = useT()
  const [angaben, setAngaben] = useState<GruppenAngaben>(() => ({
    ...angabenAusVorgabe(v.vorgabe),
    name: v.nameVorschlag,
  }))
  const beitretend = v.bestehend ? (v.a.objekt.gruppeId ? v.b : v.a) : null
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onAnlegen({
          art: 'gruppe',
          name: angaben.name,
          ansteuerung: angaben.ansteuerung,
          knx: angaben.knx ?? false,
        })
      }}
    >
      <h2>
        {v.bestehend
          ? t('verteilerdialoge.verknuepfen.beitretenTitel')
          : t('verteilerdialoge.verknuepfen.bildenTitel')}
      </h2>
      {v.bestehend && beitretend ? (
        <p className="dialog-hinweis">
          {t('verteilerdialoge.verknuepfen.beitretenText', {
            nummer: String(v.leitungNummer),
            name: beitretend.name,
            gruppe: v.bestehend.name,
          })}
        </p>
      ) : (
        <>
          <p className="dialog-hinweis">
            {t('verteilerdialoge.verknuepfen.bildenText', {
              nummer: String(v.leitungNummer),
              a: v.a.name,
              b: v.b.name,
            })}
          </p>
          <GruppenFelder vorgabe={v.vorgabe} angaben={angaben} onAngaben={setAngaben} />
        </>
      )}
      {v.umgelenkt > 0 && (
        <p className="dialog-hinweis">
          {t('verteilerdialoge.verknuepfen.umgelenkt', { n: v.umgelenkt })}
        </p>
      )}
      <div className="dialog-aktionen">
        <button type="button" onClick={onAbbrechen}>
          {t('verteilerdialoge.allgemein.abbrechen')}
        </button>
        <button type="submit" className="primaer">
          {v.bestehend
            ? t('verteilerdialoge.verknuepfen.beitreten')
            : t('verteilerdialoge.gruppeBilden.bilden')}
        </button>
      </div>
    </form>
  )
}
