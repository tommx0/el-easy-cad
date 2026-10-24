import type {
  KatalogImportErgebnis,
  KatalogStoreMitRegister,
  Konfliktbehandlung,
  StandardkatalogZahlen,
} from '../persistence'
import {
  ladeKatalogPaketHoch,
  ServerFehler,
  vorschauKatalogPaket,
  waehleKatalogPaket,
} from '../persistence'
import { useKatalogStore } from './store/katalog-store'
import { useUiStore } from './store/ui-store'
import { katalogText } from '../document-model'
import { oberflaechensprache, t } from '../sprache'

const katalogName = (name: string) => katalogText({ name }, 'name', oberflaechensprache())

export async function importiereKatalogMitRueckfrage(
  catalogStore: KatalogStoreMitRegister,
  nachImport?: (ergebnis: KatalogImportErgebnis) => void,
): Promise<void> {
  const datei = await waehleKatalogPaket()
  if (!datei) return

  const melde = (fehler: unknown) =>
    useUiStore
      .getState()
      .zeigeToast(
        fehler instanceof Error
          ? fehler.message
          : t('katalogdialoge.gemeinsam.importFehlgeschlagen'),
      )

  const fuehreAus = async (konflikt?: Konfliktbehandlung) => {
    const ergebnis = await ladeKatalogPaketHoch(datei, konflikt)
    await useKatalogStore.getState().laden(catalogStore)
    nachImport?.(ergebnis)
    useUiStore.getState().zeigeToast(
      ergebnis.standard
        ? t('katalogdialoge.katalogImport.eingespielt', {
            name: katalogName(ergebnis.name),
            zahlen: zahlenText(ergebnis.standard),
          })
        : t('katalogdialoge.katalogImport.importiert', {
            name: katalogName(ergebnis.name),
            komponenten: ergebnis.komponenten,
            bilder: ergebnis.assetsNeu,
          }),
    )
  }

  try {
    const vorschau = await vorschauKatalogPaket(datei)
    if (vorschau.art === 'standard') {
      if (
        !vorschau.katalogNeu &&
        !vorschau.zurueckgezogen &&
        vorschau.neu + vorschau.aktualisiert + vorschau.ausgemustert === 0
      ) {
        useUiStore
          .getState()
          .zeigeToast(
            t('katalogdialoge.katalogImport.aktuell', { name: katalogName(vorschau.name) }),
          )
        return
      }
      if (vorschau.zurueckgezogen) {
        useUiStore.getState().oeffneBestaetigung({
          titel: t('katalogdialoge.katalogImport.zurueckziehenTitel'),
          nachricht: t('katalogdialoge.katalogImport.zurueckziehenText', {
            name: katalogName(vorschau.name),
          }),
          bestaetigenText: t('katalogdialoge.katalogImport.zurueckziehen'),
          destruktiv: false,
          callback: (ja) => {
            if (ja) void fuehreAus().catch(melde)
          },
        })
        return
      }
      useUiStore.getState().oeffneBestaetigung({
        titel: vorschau.katalogNeu
          ? t('katalogdialoge.katalogImport.hinzufuegenTitel')
          : t('katalogdialoge.katalogImport.aktualisierenTitel'),
        nachricht: t('katalogdialoge.katalogImport.mitgeliefertText', {
          name: katalogName(vorschau.name),
          zahlen: zahlenText(vorschau),
        }),
        bestaetigenText: t('katalogdialoge.katalogImport.einspielen'),
        destruktiv: false,
        callback: (ja) => {
          if (ja) void fuehreAus().catch(melde)
        },
      })
      return
    }
    await fuehreAus()
  } catch (fehler) {
    if (fehler instanceof ServerFehler && fehler.code === 'nur-kopie') {
      useUiStore.getState().oeffneBestaetigung({
        titel: t('katalogdialoge.katalogImport.vorhandenTitel'),
        nachricht: t('katalogdialoge.katalogImport.alsKopieFrage', { meldung: fehler.message }),
        bestaetigenText: t('katalogdialoge.katalogImport.alsKopie'),
        destruktiv: false,
        callback: (ja) => {
          if (ja) void fuehreAus('kopie').catch(melde)
        },
      })
      return
    }
    if (fehler instanceof ServerFehler && fehler.istKonflikt) {
      useUiStore.getState().oeffneBestaetigung({
        titel: t('katalogdialoge.katalogImport.vorhandenTitel'),
        nachricht: t('katalogdialoge.katalogImport.ersetzenFrage', { meldung: fehler.message }),
        bestaetigenText: t('katalogdialoge.katalogImport.ersetzen'),
        callback: (ersetzen) => {
          void fuehreAus(ersetzen ? 'ersetzen' : 'kopie').catch(melde)
        },
      })
      return
    }
    melde(fehler)
  }
}

function zahlenText(z: StandardkatalogZahlen): string {
  if (z.zurueckgezogen) return t('katalogdialoge.paketZahlen.zurueckgezogen', { n: z.ausgemustert })
  const teile = [
    z.katalogNeu ? t('katalogdialoge.paketZahlen.katalogNeu') : null,
    t('katalogdialoge.paketZahlen.neu', { n: z.neu }),
    t('katalogdialoge.paketZahlen.aktualisiert', { n: z.aktualisiert }),
    t('katalogdialoge.paketZahlen.unveraendert', { n: z.unveraendert }),
    z.ausgemustert > 0 ? t('katalogdialoge.paketZahlen.ausgemustert', { n: z.ausgemustert }) : null,
    z.uebersprungen > 0
      ? t('katalogdialoge.paketZahlen.uebersprungen', { n: z.uebersprungen })
      : null,
  ]
  return teile.filter(Boolean).join(', ')
}
