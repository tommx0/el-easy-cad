import type { CatalogComponent } from '../../document-model'
import { niedrigsteArtikelnummerVariante } from '../../document-model'
import { t } from '../../sprache'
import {
  erzeugeKomponentenTauschenCommand,
  type TauschAblehnungsGrund,
  type TauschZiel,
} from '../komponenten-tauschen'
import type { KiErgebnis, KiKontext } from './kontext'
import { KiFehler } from './kontext'
import { blattText, fuehreAenderungAus, kiLabel, ordneObjekteNachBlatt } from './schreiben'

function grundText(grund: TauschAblehnungsGrund): string {
  return t(`kiMeldungen.komponenteAustauschen.gruende.${grund}`)
}

function tauschZiel(k: CatalogComponent, variantId: string | null): TauschZiel {
  return {
    catalogComponentId: k.id,
    variantId,
    dockpunkte: k.dockpunkte,
    fangpunkt: k.fangpunkt,
    textElemente: k.textElemente,
    breitenFaktor: k.breitenFaktor,
    hoehenFaktor: k.hoehenFaktor,
    kombinierbar: k.kombinierbar,
    modulTraeger: k.modulTraeger,
    modulSystem: k.modulSystem,
    typ: k.typ,
    slotVorlagen: k.slotVorlagen,
    slotMatrixVorlage: k.slotMatrixVorlage,
    slotAnzahlAus: k.slotAnzahlAus,
    ansteuerung: k.ansteuerung,
  }
}

export function komponenteAustauschen(
  eingabe: { objektIds: string[]; katalogId: string; varianteId?: string },
  kontext: KiKontext,
): KiErgebnis {
  const katalog = kontext.katalogKomponenten()
  const neu = katalog.find((k) => k.id === eingabe.katalogId)
  if (!neu) {
    throw new KiFehler(
      t('kiMeldungen.komponenteAustauschen.keinKatalogeintrag', { id: eingabe.katalogId }),
    )
  }
  if (neu.ausgemustert) {
    throw new KiFehler(t('kiMeldungen.gemeinsam.ausgemustert', { name: neu.name }))
  }
  let variantId: string | null
  if (eingabe.varianteId !== undefined) {
    if (!neu.varianten.some((v) => v.id === eingabe.varianteId)) {
      const werte = { name: neu.name, variante: eingabe.varianteId }
      throw new KiFehler(
        neu.varianten.length > 0
          ? t('kiMeldungen.komponenteAustauschen.keineVariante', {
              ...werte,
              liste: neu.varianten.map((v) => v.id).join(', '),
            })
          : t('kiMeldungen.komponenteAustauschen.keineVarianten', werte),
      )
    }
    variantId = eingabe.varianteId
  } else {
    variantId = niedrigsteArtikelnummerVariante(neu)?.id ?? null
  }

  const { jeBlatt, gesperrt } = ordneObjekteNachBlatt(kontext, eingabe.objektIds)
  const uebersprungen: { id: string; grund: string }[] = gesperrt.map((id) => ({
    id,
    grund: t('kiMeldungen.gemeinsam.ebeneGesperrt'),
  }))
  const katalogVon = new Map(katalog.map((k) => [k.id, k]))
  const kandidaten = [...jeBlatt.values()].flatMap(({ blatt, objekte }) => {
    const ids: string[] = []
    for (const o of objekte) {
      const grund =
        o.type !== 'komponente'
          ? t('kiMeldungen.komponenteAustauschen.keineKomponente')
          : o.knxAktor
            ? t('kiMeldungen.komponenteAustauschen.knxAktor')
            : katalogVon.get(o.catalogComponentId)?.katalogId !== neu.katalogId
              ? t('kiMeldungen.komponenteAustauschen.andererKatalog')
              : null
      if (grund) uebersprungen.push({ id: o.id, grund })
      else ids.push(o.id)
    }
    return ids.length > 0 ? [{ blatt, ids }] : []
  })

  const ziel = tauschZiel(neu, variantId)
  let getauscht = 0
  for (const { blatt, ids } of kandidaten) {
    const probe = erzeugeKomponentenTauschenCommand(
      kontext.doc,
      blatt.id,
      ids,
      ziel,
      kontext.routingSettings(),
      '',
    )
    getauscht += probe.getauscht.length
    for (const a of probe.abgelehnt)
      uebersprungen.push({ id: a.objektId, grund: grundText(a.grund) })
  }
  if (getauscht === 0) {
    const gruende = [...new Set(uebersprungen.map((u) => u.grund))].join('; ')
    throw new KiFehler(
      gruende
        ? t('kiMeldungen.komponenteAustauschen.nichtsGetauscht', { gruende })
        : t('kiMeldungen.komponenteAustauschen.nichtsPassend'),
    )
  }

  const varianteName = neu.varianten.find((v) => v.id === variantId)?.name
  const text = t('kiMeldungen.komponenteAustauschen.getauscht', {
    n: getauscht,
    name: varianteName ? `${neu.name}, ${varianteName}` : neu.name,
    blaetter: blattText(kandidaten.map((k) => k.blatt)),
  })
  const label = kiLabel(text)
  const fehlgeschlagen = new Map<string, number>()
  fuehreAenderungAus(
    kontext,
    text,
    kandidaten.map(({ blatt, ids }) => () => {
      const ergebnis = erzeugeKomponentenTauschenCommand(
        kontext.doc,
        blatt.id,
        ids,
        ziel,
        kontext.routingSettings(),
        label,
      )
      fehlgeschlagen.set(blatt.id, ergebnis.fehlgeschlageneLeitungenAnzahl)
      return ergebnis.command
    }),
  )

  const nichtVerlegt = [...fehlgeschlagen.values()].reduce((s, n) => s + n, 0)
  kontext.meldeAenderung(label)
  return {
    daten: {
      getauscht,
      ...(uebersprungen.length > 0 ? { nichtGetauscht: uebersprungen } : {}),
      ...(nichtVerlegt > 0
        ? {
            hinweis: t('kiMeldungen.gemeinsam.nichtNeuVerlegt', { n: nichtVerlegt }),
          }
        : {}),
      rueckgaengig: label,
    },
  }
}
