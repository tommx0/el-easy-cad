import { useState } from 'react'
import type { KomponentenObjekt, Objekt } from '../document-model'
import { istBearbeitbar, mitAbgangstext } from '../document-model'
import {
  ABGANG_SCHRIFT_METER,
  abgangsVorgabeBreite,
  abgangsZeilen,
  holeAbgangsTexte,
} from '../rendering'
import { useKatalogStore } from './store/katalog-store'
import { erzeugeObjektAendernCommand } from '../tools'
import { useAktivesBlatt, useAppContext, useProject } from './use-app-context'
import { useVerknuepfung } from './use-verknuepfung'
import { bauplanZeichnungen } from './verknuepfung'
import { ZahlenFeld } from './ZahlenFeld'
import { useT } from './sprache-anbindung'

export function AbgangstextFelder({
  objekt,
  aktualisiere,
}: {
  objekt: KomponentenObjekt
  aktualisiere: (patch: Partial<Objekt>, label: string) => void
}) {
  const t = useT()
  const zeichnung = useProject()
  const stand = useVerknuepfung()
  const katalog = useKatalogStore((s) => s.komponenten)
  const [entwurf, setEntwurf] = useState<{ id: string; text: string } | null>(null)
  if (!zeichnung.verteilerKennzeichen) return null
  const texte = holeAbgangsTexte(zeichnung, bauplanZeichnungen(stand), katalog).get(objekt.id) ?? []
  const automatisch = abgangsZeilen({ dockpunkte: objekt.dockpunkte }, texte).join('\n')
  const anpassung = objekt.abgangstext
  if (!automatisch && !anpassung) return null

  function setze(patch: Partial<NonNullable<KomponentenObjekt['abgangstext']>>, label: string) {
    aktualisiere({ abgangstext: mitAbgangstext(objekt, patch).abgangstext }, label)
  }

  const eigener = anpassung?.text
  const wert = entwurf?.id === objekt.id ? entwurf.text : (eigener ?? '')
  return (
    <>
      <label className="feld">
        {t('eigenschaften.abgangstext.zielbezeichnungLeer')}
        <textarea
          rows={4}
          value={wert}
          placeholder={automatisch}
          onChange={(e) => setEntwurf({ id: objekt.id, text: e.target.value })}
          onBlur={() => {
            if (entwurf?.id !== objekt.id) return
            const text = entwurf.text.trim() ? entwurf.text : undefined
            setEntwurf(null)
            if (text !== eigener)
              setze({ text }, t('eigenschaften.abgangstext.zielbezeichnungUndo'))
          }}
        />
      </label>
      <label className="feld">
        {t('eigenschaften.abgangstext.schrifthoehe')}
        <ZahlenFeld
          min={1}
          step={1}
          value={Math.round((anpassung?.hoehe ?? ABGANG_SCHRIFT_METER) * 1000) / 10}
          onCommit={(cm) =>
            setze({ hoehe: cm / 100 }, t('eigenschaften.abgangstext.schrifthoeheUndo'))
          }
        />
      </label>
      <AbgangsAusrichtungFeld objekte={[objekt]} />
      {anpassung?.ausrichtung !== 'senkrecht' && (
        <label className="feld">
          {t('eigenschaften.abgangstext.breite')}
          <ZahlenFeld
            min={0.2}
            step={0.1}
            value={Math.round((anpassung?.breite ?? abgangsVorgabeBreite(objekt)) * 100) / 100}
            onCommit={(m) => setze({ breite: m }, t('eigenschaften.abgangstext.breiteUndo'))}
          />
        </label>
      )}
      {anpassung && (
        <div className="feld-knoepfe">
          {eigener !== undefined && (
            <button
              type="button"
              onClick={() =>
                setze({ text: undefined }, t('eigenschaften.abgangstext.automatischUndo'))
              }
            >
              {t('eigenschaften.abgangstext.wiederAutomatisch')}
            </button>
          )}
          {anpassung.versatz && (
            <button
              type="button"
              onClick={() =>
                setze({ versatz: undefined }, t('eigenschaften.abgangstext.zuruecksetzenUndo'))
              }
            >
              {t('eigenschaften.abgangstext.lageZuruecksetzen')}
            </button>
          )}
          {(anpassung.hoehe !== undefined || anpassung.breite !== undefined) && (
            <button
              type="button"
              onClick={() =>
                setze(
                  { hoehe: undefined, breite: undefined },
                  t('eigenschaften.abgangstext.zuruecksetzenUndo'),
                )
              }
            >
              {t('eigenschaften.abgangstext.groesseZuruecksetzen')}
            </button>
          )}
        </div>
      )}
    </>
  )
}

export function AbgangsAusrichtungFeld({ objekte }: { objekte: readonly KomponentenObjekt[] }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const blatt = useAktivesBlatt()
  const werte = new Set(objekte.map((o) => o.abgangstext?.ausrichtung ?? 'waagrecht'))
  const wert = werte.size === 1 ? [...werte][0] : ''
  return (
    <label className="feld">
      {t('eigenschaften.abgangstext.zielbezeichnung')}
      <select
        value={wert}
        onChange={(e) => {
          const neu = e.target.value as 'waagrecht' | 'senkrecht' | 'links' | ''
          if (!neu) return
          const ids = new Set(
            objekte.filter((o) => istBearbeitbar(o, blatt.ebenen)).map((o) => o.id),
          )
          if (ids.size === 0) return
          commands.execute(
            erzeugeObjektAendernCommand(
              doc,
              blatt.id,
              t('eigenschaften.abgangstext.ausrichtenUndo'),
              (alle) =>
                alle.map((o) =>
                  o.type === 'komponente' && ids.has(o.id)
                    ? mitAbgangstext(o, {
                        ausrichtung: neu === 'waagrecht' ? undefined : neu,
                      })
                    : o,
                ),
            ),
          )
        }}
      >
        {wert === '' && <option value="">{t('eigenschaften.panel.gemeinsam.verschieden')}</option>}
        <option value="waagrecht">{t('eigenschaften.abgangstext.waagrecht')}</option>
        <option value="senkrecht">{t('eigenschaften.abgangstext.senkrecht')}</option>
        <option value="links">{t('eigenschaften.abgangstext.links')}</option>
      </select>
    </label>
  )
}
