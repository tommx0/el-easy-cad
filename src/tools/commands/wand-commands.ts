import type { Command } from '../command'
import type { DocumentStore, WandObjekt } from '../../document-model'
import {
  erzeugeId,
  ermittleOeffnungsGeometrie,
  pfadGesamtLaenge,
  verschobenesT,
} from '../../document-model'
import type { WandTrimErgebnis } from '../trim-wand'
import type { WandTeilungErgebnis } from '../teile-wand'
import { erzeugeObjektAendernCommand } from './objekt-commands'

export function erzeugeWandTrimCommand(
  doc: DocumentStore,
  blattId: string,
  ziel: WandObjekt,
  ergebnis: WandTrimErgebnis,
  label: string,
): Command {
  const alteLaenge = pfadGesamtLaenge(ziel.punkte)
  const neueGesamtLaenge = pfadGesamtLaenge(ergebnis.punkte)
  const wandNeu: WandObjekt = { ...ziel, punkte: ergebnis.punkte }
  const versatzLaenge = ergebnis.seite === 'start' ? -ergebnis.bogenlaengeBisSchnitt : 0
  const grenze = ergebnis.bogenlaengeBisSchnitt

  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    objekte.flatMap((o) => {
      if (o.id === ziel.id) return [wandNeu]
      if (
        (o.type !== 'tuer' && o.type !== 'fenster' && o.type !== 'wanddurchbruch') ||
        o.wandId !== ziel.id
      )
        return [o]
      const absolutePosition = o.t * alteLaenge
      const entfernt =
        ergebnis.seite === 'start' ? absolutePosition < grenze : absolutePosition > grenze
      if (entfernt) return []
      const neuesT = verschobenesT(o.t, alteLaenge, versatzLaenge, false, neueGesamtLaenge)
      const geometrie = ermittleOeffnungsGeometrie(wandNeu, { t: neuesT })
      return [geometrie ? { ...o, t: neuesT, ...geometrie } : { ...o, t: neuesT }]
    }),
  )
}

export function erzeugeWandTeilenCommand(
  doc: DocumentStore,
  blattId: string,
  ziel: WandObjekt,
  ergebnis: WandTeilungErgebnis,
  label: string,
): Command {
  const alteLaenge = pfadGesamtLaenge(ziel.punkte)
  const grenzeVon = ergebnis.tVon * alteLaenge
  const grenzeBis = ergebnis.tBis * alteLaenge

  const ersteWand: WandObjekt | null = ergebnis.erstesStueck
    ? { ...ziel, punkte: ergebnis.erstesStueck }
    : null
  const ersteLaenge = ersteWand ? pfadGesamtLaenge(ersteWand.punkte) : 0

  const zweiteWand: WandObjekt | null = ergebnis.zweitesStueck
    ? { ...ziel, id: erzeugeId('objekt'), punkte: ergebnis.zweitesStueck }
    : null
  const zweiteLaenge = zweiteWand ? pfadGesamtLaenge(zweiteWand.punkte) : 0
  const versatzZweite = -grenzeBis

  return erzeugeObjektAendernCommand(doc, blattId, label, (objekte) =>
    objekte.flatMap((o) => {
      if (o.id === ziel.id) {
        const teile: WandObjekt[] = []
        if (ersteWand) teile.push(ersteWand)
        if (zweiteWand) teile.push(zweiteWand)
        return teile
      }
      if (
        (o.type !== 'tuer' && o.type !== 'fenster' && o.type !== 'wanddurchbruch') ||
        o.wandId !== ziel.id
      )
        return [o]

      const absolutePosition = o.t * alteLaenge
      if (absolutePosition >= grenzeVon && absolutePosition <= grenzeBis) return []

      if (absolutePosition < grenzeVon) {
        if (!ersteWand) return []
        const neuesT = verschobenesT(o.t, alteLaenge, 0, false, ersteLaenge)
        const geometrie = ermittleOeffnungsGeometrie(ersteWand, { t: neuesT })
        return [geometrie ? { ...o, t: neuesT, ...geometrie } : { ...o, t: neuesT }]
      }

      if (!zweiteWand) return []
      const neuesT = verschobenesT(o.t, alteLaenge, versatzZweite, false, zweiteLaenge)
      const geometrie = ermittleOeffnungsGeometrie(zweiteWand, { t: neuesT })
      return [
        geometrie
          ? { ...o, wandId: zweiteWand.id, t: neuesT, ...geometrie }
          : { ...o, wandId: zweiteWand.id, t: neuesT },
      ]
    }),
  )
}
