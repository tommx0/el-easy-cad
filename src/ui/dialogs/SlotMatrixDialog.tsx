import { useState } from 'react'
import type { KomponentenObjekt, SlotMatrix, SlotZiel, Zeichnung } from '../../document-model'
import {
  ermittleAlleKomponenten,
  ermittleTypUndSlots,
  ermittleUrsprung,
  erzeugtZyklus,
  gruppiereSlotsNachZeile,
  normalisiereSlotMatrix,
  passeSlotsAnMatrixAn,
  typHatSlotMatrix,
} from '../../document-model'
import { erzeugeSlotMatrixAendernCommand, erzeugeSlotsAendernCommand } from '../../tools'
import { SlotZielverwaltung } from '../components/SlotZielverwaltung'
import { uebernehmeSlots } from '../slots-uebernehmen'
import { useAppContext, useProject } from '../use-app-context'
import { useT } from '../sprache-anbindung'
import { useKatalogStore } from '../store/katalog-store'
import { useUiStore } from '../store/ui-store'
import { ZahlenFeld } from '../ZahlenFeld'
import { slotNameText, spracheDesUebersetzers } from '../../document-model'

export const MAX_SLOT_MATRIX_ZEILEN = 8

export function SlotMatrixDialog() {
  const dialog = useUiStore((s) => s.slotMatrixDialog)
  if (!dialog) return null
  return <SlotMatrixDialogInhalt blattId={dialog.blattId} objektId={dialog.objektId} />
}

function findeKomponente(
  zeichnung: Zeichnung,
  blattId: string,
  objektId: string,
): KomponentenObjekt | undefined {
  return zeichnung.blaetter
    .find((b) => b.id === blattId)
    ?.objekte.find((o): o is KomponentenObjekt => o.type === 'komponente' && o.id === objektId)
}

function SlotMatrixDialogInhalt({ blattId, objektId }: { blattId: string; objektId: string }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  const katalogKomponenten = useKatalogStore((s) => s.komponenten)
  const [aktiverIndex, setAktiverIndex] = useState<number | null>(null)
  const schliessen = () => useUiStore.getState().setSlotMatrixDialog(null)

  const objekt = findeKomponente(zeichnung, blattId, objektId)
  const aufgeloest = objekt ? ermittleTypUndSlots(objekt, zeichnung) : null
  if (!objekt || !aufgeloest || !typHatSlotMatrix(aufgeloest.typ)) return null

  const { slots, slotMatrix } = aufgeloest
  const quadratSeite = Math.max(240, slotMatrix.zeilen * 40 + (slotMatrix.zeilen - 1) * 6)
  const ursprung = ermittleUrsprung(objekt, blattId)
  const alleKomponenten = ermittleAlleKomponenten(zeichnung, katalogKomponenten).filter(
    (k) => !(k.blattId === blattId && k.objektId === objektId),
  )
  const alleGruppen = zeichnung.geraeteGruppen.filter(
    (g) => !(ursprung.art === 'gruppe' && g.id === ursprung.gruppeId),
  )
  const aktiverSlot = aktiverIndex !== null ? (slots[aktiverIndex] ?? null) : null

  function matrixAendern(neueMatrix: SlotMatrix) {
    neueMatrix = normalisiereSlotMatrix(neueMatrix)
    const { slots: neueSlots, entfernteMitZielen } = passeSlotsAnMatrixAn(
      slots,
      neueMatrix,
      slotMatrix,
    )
    function anwenden() {
      commands.execute(
        erzeugeSlotMatrixAendernCommand(doc, blattId, objektId, neueMatrix, neueSlots),
      )
      if (aktiverIndex !== null && aktiverIndex >= neueSlots.length) setAktiverIndex(null)
    }
    if (entfernteMitZielen.length > 0) {
      useUiStore.getState().oeffneBestaetigung({
        titel: t('verteilerdialoge.slotMatrix.entfernenTitel'),
        nachricht: t('verteilerdialoge.slotMatrix.entfernenNachricht', {
          n: entfernteMitZielen.length,
        }),
        bestaetigenText: t('verteilerdialoge.slotMatrix.verkleinern'),
        destruktiv: true,
        callback: (bestaetigt) => {
          if (bestaetigt) anwenden()
        },
      })
      return
    }
    anwenden()
  }

  function zeilenBreiteAendern(zeile0: number, breite: 1 | 2) {
    const bisher =
      slotMatrix.zeilenSpalten ??
      Array.from({ length: slotMatrix.zeilen }, () => slotMatrix.spalten)
    const neu = [...bisher]
    neu[zeile0] = breite
    matrixAendern({ ...slotMatrix, zeilenSpalten: neu })
  }

  function bezeichnungAendern(index: number, bezeichnung: string) {
    commands.execute(
      erzeugeSlotsAendernCommand(
        doc,
        blattId,
        objektId,
        slots.map((s, i) => (i === index ? { ...s, bezeichnung: bezeichnung || undefined } : s)),
      ),
    )
  }
  function zielHinzufuegen(index: number, ziel: SlotZiel) {
    if (erzeugtZyklus(zeichnung, ursprung, ziel)) {
      useUiStore.getState().zeigeToast(t('verteilerdialoge.slotMatrix.kreislauf'))
      return
    }
    uebernehmeSlots(
      doc,
      commands,
      { blattId, objektId },
      slots.map((s, i) => (i === index ? { ...s, ziele: [...s.ziele, ziel] } : s)),
    )
  }
  function zielEntfernen(index: number, zielIndex: number) {
    commands.execute(
      erzeugeSlotsAendernCommand(
        doc,
        blattId,
        objektId,
        slots.map((s, i) =>
          i === index ? { ...s, ziele: s.ziele.filter((_, zi) => zi !== zielIndex) } : s,
        ),
      ),
    )
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div
        className="dialog dialog-gross dialog-slotmatrix"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2>{t('verteilerdialoge.slotMatrix.titel')}</h2>
        <div className="slotmatrix-form">
          <label className="dialog-feld">
            {t('verteilerdialoge.slotMatrix.spaltenStandard')}
            <select
              value={slotMatrix.spalten}
              onChange={(e) =>
                matrixAendern({ ...slotMatrix, spalten: Number(e.target.value) as 1 | 2 })
              }
            >
              <option value={1}>{t('verteilerdialoge.slotMatrix.einBreit')}</option>
              <option value={2}>{t('verteilerdialoge.slotMatrix.zweiSchmal')}</option>
            </select>
          </label>
          <label className="dialog-feld">
            {t('verteilerdialoge.slotMatrix.zeilen')}
            <ZahlenFeld
              min={1}
              max={MAX_SLOT_MATRIX_ZEILEN}
              step={1}
              value={slotMatrix.zeilen}
              onCommit={(zeilen) => matrixAendern({ ...slotMatrix, zeilen: Math.round(zeilen) })}
            />
          </label>
        </div>
        <div className="slotmatrix-zeilen slotmatrix-quadrat" style={{ height: quadratSeite }}>
          {gruppiereSlotsNachZeile(slots, slotMatrix).map((zeilenGruppe) => (
            <div className="slotmatrix-zeile" key={zeilenGruppe.zeile0}>
              <select
                className="slotmatrix-zeile-breite"
                value={zeilenGruppe.spalten}
                title={t('verteilerdialoge.slotMatrix.spaltenInReihe', {
                  reihe: zeilenGruppe.zeile0 + 1,
                })}
                onChange={(e) =>
                  zeilenBreiteAendern(zeilenGruppe.zeile0, Number(e.target.value) as 1 | 2)
                }
              >
                <option value={1}>{t('verteilerdialoge.slotMatrix.spalten', { n: 1 })}</option>
                <option value={2}>{t('verteilerdialoge.slotMatrix.spalten', { n: 2 })}</option>
              </select>
              <div
                className="slotmatrix-zeile-zellen"
                style={{
                  gridTemplateColumns: `repeat(${zeilenGruppe.spalten}, 1fr)`,
                  width: quadratSeite,
                }}
              >
                {zeilenGruppe.slots.map(({ slot, index }) => (
                  <button
                    key={slot.id}
                    type="button"
                    className={
                      'slotmatrix-zelle' +
                      (index === aktiverIndex ? ' slotmatrix-zelle-aktiv' : '') +
                      (slot.ziele.length > 0 ? ' slotmatrix-zelle-belegt' : '')
                    }
                    onClick={() => setAktiverIndex(index)}
                    title={
                      slotNameText(slot.bezeichnung, spracheDesUebersetzers(t)) ||
                      t('verteilerdialoge.allgemein.slotNummer', { nummer: index + 1 })
                    }
                  >
                    <span>{t('verteilerdialoge.allgemein.slotNummer', { nummer: index + 1 })}</span>
                    {slot.ziele.length > 0 && (
                      <span className="slotmatrix-zelle-badge">{slot.ziele.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {aktiverSlot && aktiverIndex !== null && (
          <div className="slotmatrix-detail">
            <h3>{t('verteilerdialoge.allgemein.slotNummer', { nummer: aktiverIndex + 1 })}</h3>
            <label className="dialog-feld">
              {t('verteilerdialoge.slotMatrix.bezeichnung')}
              <input
                value={aktiverSlot.bezeichnung ?? ''}
                placeholder={t('verteilerdialoge.slotMatrix.bezeichnungOptional')}
                onChange={(e) => bezeichnungAendern(aktiverIndex, e.target.value)}
              />
            </label>
            <SlotZielverwaltung
              slot={aktiverSlot}
              quelleTyp="bediengeraet"
              onZielHinzufuegen={(ziel) => zielHinzufuegen(aktiverIndex, ziel)}
              onZielEntfernen={(zielIndex) => zielEntfernen(aktiverIndex, zielIndex)}
              zeichnung={zeichnung}
              katalogKomponenten={katalogKomponenten}
              alleKomponenten={alleKomponenten}
              alleGruppen={alleGruppen}
            />
          </div>
        )}
        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verteilerdialoge.slotMatrix.fertig')}
          </button>
        </div>
      </div>
    </div>
  )
}
