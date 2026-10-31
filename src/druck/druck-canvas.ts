import type { Blatt, TrunkKante, Zeichnung } from '../document-model'
import {
  gezeigtePfadSegmente,
  ermittlePortSchilder,
  istSchaltplan,
  inZeichenreihenfolge,
  sichtbareObjekteAufBlatt,
  treppenGeschosshoehe,
  trunkNachbarschaft,
} from '../document-model'
import {
  zeichneHintergrundBild,
  zeichneObjekt,
  zeichneTreppenDerEtageDarunter,
  zeichneFreieLeitungsNummer,
  zeichneTrunkNummernschilder,
  zeichneTrunkEnden,
  zeichneDemoWasserzeichen,
  zeichneKoordinatennetz,
  holeAbgangsRaeume,
  holeSwitchAnzeigeDaten,
  ermittleKomponentenFlaechen,
  ermittleLinienHindernisse,
  type KomponentenRenderKontext,
} from '../rendering'
import { zeichneHinweisStreifen } from './hinweis-streifen'
import type { AusgabeSeite, DruckSeite } from './layout'
import { mmZuPx } from './layout'
import { planspracheVon, planUebersetzer } from '../document-model'
import { planHinweisMitLizenznehmer } from './rechtliche-hinweise'

export type KomponentenRahmenBasis = Omit<
  KomponentenRenderKontext,
  'aufNeuZeichnenAnfordern' | 'tp'
>

const MAX_LADE_VERSUCHE = 25
const LADE_WARTE_MS = 150

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function zeichneSeiteEinmal(
  ctx: CanvasRenderingContext2D,
  seite: DruckSeite,
  blatt: Blatt,
  projekt: Zeichnung,
  komponentenRahmenBasis: KomponentenRahmenBasis,
  switchDaten: ReturnType<typeof holeSwitchAnzeigeDaten>,
  trunkKanten: Map<string, TrunkKante[]>,
): boolean {
  let nochNichtFertig = false
  const melden = () => {
    nochNichtFertig = true
  }
  const rahmen: KomponentenRenderKontext = {
    ...komponentenRahmenBasis,
    tp: planUebersetzer(projekt),
    plansprache: planspracheVon(projekt),
    aufNeuZeichnenAnfordern: melden,
    poeSummen: switchDaten.poeSummen,
    traegerMitModulen: switchDaten.traegerMitModulen,
    traegerVollBelegt: switchDaten.traegerVollBelegt,
    querverweisTexte: switchDaten.querverweisTexte,
    knxKanalVerweise: switchDaten.knxKanalVerweise,
    stromkreisTexte: switchDaten.stromkreisTexte,
    blattverweise: switchDaten.blattverweise,
    abgangsRaeume: komponentenRahmenBasis.abgangsTexte ? holeAbgangsRaeume(projekt) : undefined,
    blattAnzeige: blatt,
    alleObjekteAufBlatt: blatt.objekte,
    schaltplan: istSchaltplan(projekt),
    treppenGeschosshoehe: treppenGeschosshoehe(projekt, blatt),
    tabellenKontext: {
      zeichnung: projekt,
      blattId: blatt.id,
      katalog: komponentenRahmenBasis.katalogKomponenten,
      bauplaene: komponentenRahmenBasis.verknuepfteBauplaene,
      verteilerplaene: komponentenRahmenBasis.verknuepfteVerteilerplaene,
    },
  }

  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, seite.seiteBreitePx, seite.seiteHoehePx)

  ctx.beginPath()
  ctx.rect(
    seite.zeichenBereichPx.x,
    seite.zeichenBereichPx.y,
    seite.zeichenBereichPx.breite,
    seite.zeichenBereichPx.hoehe,
  )
  ctx.clip()

  if (blatt.hintergrund && blatt.hintergrundSichtbar) {
    zeichneHintergrundBild(ctx, seite.view, blatt, melden, komponentenRahmenBasis.assetQuelle)
  }

  const sichtbareBlattObjekte = sichtbareObjekteAufBlatt(
    blatt,
    blatt.objekte,
    komponentenRahmenBasis.leitungsverlegungAus ?? false,
  )
  zeichneTreppenDerEtageDarunter(ctx, seite.view, projekt, blatt)
  for (const objekt of inZeichenreihenfolge(sichtbareBlattObjekte, blatt.objekte)) {
    const gezeigt =
      objekt.type === 'leitung'
        ? gezeigtePfadSegmente(objekt, blatt, projekt.installationszonen)
        : null
    if (objekt.type === 'leitung' && gezeigt !== objekt.pfadSegmente) {
      zeichneObjekt(ctx, seite.view, { ...objekt, pfadSegmente: gezeigt! }, rahmen)
    } else {
      zeichneObjekt(ctx, seite.view, objekt, rahmen)
    }
  }

  const bezeichnerHindernisse = {
    flaechen: ermittleKomponentenFlaechen(ctx, seite.view, blatt.objekte, rahmen),
    linien: ermittleLinienHindernisse(seite.view, blatt.objekte),
  }
  for (const objekt of sichtbareBlattObjekte) {
    if (objekt.type === 'leitung') {
      zeichneFreieLeitungsNummer(
        ctx,
        seite.view,
        objekt,
        blatt,
        bezeichnerHindernisse,
        projekt.kabeltypen,
        komponentenRahmenBasis.katalogKomponenten,
      )
      continue
    }
    if (objekt.type !== 'trunk') continue
    zeichneTrunkNummernschilder(
      ctx,
      seite.view,
      objekt,
      blatt,
      blatt.objekte,
      ermittlePortSchilder(projekt, blatt.id, objekt, komponentenRahmenBasis.katalogKomponenten),
      bezeichnerHindernisse,
    )
    zeichneTrunkEnden(
      ctx,
      seite.view,
      projekt,
      blatt.id,
      objekt,
      blatt,
      bezeichnerHindernisse,
      trunkKanten,
    )
  }

  ctx.restore()
  return nochNichtFertig
}

export async function erzeugeDruckCanvas(
  seite: DruckSeite,
  blatt: Blatt,
  projekt: Zeichnung,
  komponentenRahmenBasis: KomponentenRahmenBasis,
  wasserzeichenAktiv = false,
  lizenznehmer: string | null = null,
  ausgabe: AusgabeSeite | null = null,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(ausgabe?.breitePx ?? seite.seiteBreitePx))
  canvas.height = Math.max(1, Math.round(ausgabe?.hoehePx ?? seite.seiteHoehePx))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Kein 2D-Context für Druck-/Export-Rendering.')
  if (ausgabe) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(...ausgabe.transform)
  }

  const switchDaten = holeSwitchAnzeigeDaten(
    projekt,
    komponentenRahmenBasis.katalogKomponenten,
    komponentenRahmenBasis.verknuepfteVerteilerplaene,
  )
  const trunkKanten = trunkNachbarschaft(projekt)

  for (let versuch = 0; versuch < MAX_LADE_VERSUCHE; versuch++) {
    const nochNichtFertig = zeichneSeiteEinmal(
      ctx,
      seite,
      blatt,
      projekt,
      komponentenRahmenBasis,
      switchDaten,
      trunkKanten,
    )
    if (!nochNichtFertig) break
    if (versuch < MAX_LADE_VERSUCHE - 1) await delay(LADE_WARTE_MS)
  }

  if (istSchaltplan(projekt) && blatt.zeichenflaeche) {
    zeichneKoordinatennetz(ctx, seite.view, blatt.zeichenflaeche, {
      farbe: '#000000',
      linienbreitePx: mmZuPx(0.25),
      feldlinien: null,
    })
  }

  const tp = planUebersetzer(projekt)
  zeichneHinweisStreifen(
    ctx,
    seite.hinweisBereichPx,
    planHinweisMitLizenznehmer(lizenznehmer, projekt.zeichnungsart, tp),
  )
  if (wasserzeichenAktiv) {
    zeichneDemoWasserzeichen(ctx, seite.seiteBreitePx, seite.seiteHoehePx, tp)
  }

  return canvas
}
