import type { Objekt } from '../document-model'
import { t } from '../sprache'
import { zaehleAutomatischAnordnen } from '../tools'
import type { AppKontext } from './app-context'
import { useUiStore } from './store/ui-store'

export function anordnenUmfang(
  objekte: readonly Objekt[],
  auswahlIds: readonly string[],
  ebenen: Parameters<typeof zaehleAutomatischAnordnen>[2],
): ReturnType<typeof zaehleAutomatischAnordnen> | null {
  if (auswahlIds.length === 0) return null
  const umfang = zaehleAutomatischAnordnen(objekte, new Set(auswahlIds), ebenen)
  return umfang.komponenten >= 2 || umfang.verbindungen > 0 ? umfang : null
}

export function anordnenNachricht(
  umfang: { komponenten: number; verbindungen: number; vonHand: number },
  schaltplan: boolean,
): string {
  const werte = { n: umfang.verbindungen, komponenten: umfang.komponenten, vonHand: umfang.vonHand }
  const mitHand = umfang.vonHand > 0
  if (umfang.komponenten < 2) {
    return t(
      mitHand ? 'aktionen.anordnen.nurVerbindungenVonHand' : 'aktionen.anordnen.nurVerbindungen',
      werte,
    )
  }
  const satz = t(
    mitHand ? 'aktionen.anordnen.komponentenVonHand' : 'aktionen.anordnen.komponenten',
    werte,
  )
  return schaltplan ? satz : `${satz} ${t('aktionen.anordnen.einbauort')}`
}

export function anordnenMeldung(ergebnis: {
  fehlgeschlagen: number
  ueberlappungen: number
  passtNicht: boolean
}): string | null {
  const teile: string[] = []
  if (ergebnis.fehlgeschlagen > 0) {
    teile.push(t('aktionen.anordnen.fehlgeschlagen', { n: ergebnis.fehlgeschlagen }))
  }
  if (ergebnis.ueberlappungen > 0) {
    teile.push(t('aktionen.anordnen.ueberlappungen', { n: ergebnis.ueberlappungen }))
  }
  if (ergebnis.passtNicht) teile.push(t('aktionen.anordnen.passtNicht'))
  return teile.length > 0 ? teile.join(' ') : null
}

export function starteAutomatischAnordnen(
  { doc }: Pick<AppKontext, 'doc'>,
  auswahlIds: readonly string[],
): void {
  const blatt = doc.getAktivesBlatt()
  if (!anordnenUmfang(blatt.objekte, auswahlIds, blatt.ebenen)) {
    useUiStore.getState().zeigeToast(t('aktionen.anordnen.nichtsGewaehlt'))
    return
  }
  useUiStore.getState().oeffneAnordnenDialog(auswahlIds)
}
