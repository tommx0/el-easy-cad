import type { InhaltsGruppe, InhaltsLeitung, TrunkAusfuehrung } from '../document-model'

export const KREIS_RADIUS = 13
const KREIS_ABSTAND = 6
const RAHMEN_RAND = 10
const GRUPPEN_ABSTAND = 28
const ZEILEN_ABSTAND = 22
const TEXT_HOEHE = 16
const ZEICHEN_BREITE = 6.6
const SCHACHT_RAND = 18

export type RahmenForm = 'rund' | 'eckig' | 'abgerundet'

export interface QuerschnittKreis {
  schluessel: string
  x: number
  y: number
  nummer: number
  farbe: string
  textFarbe: string
  blass: boolean
  strangNummer: number | null
}

export interface QuerschnittRahmen {
  schluessel: string
  form: RahmenForm
  x: number
  y: number
  breite: number
  hoehe: number
}

export interface QuerschnittText {
  x: number
  y: number
  text: string
  art: 'strang' | 'trunk'
}

export interface QuerschnittLayout {
  breite: number
  hoehe: number
  schacht: { x: number; y: number; breite: number; hoehe: number } | null
  rahmen: QuerschnittRahmen[]
  kreise: QuerschnittKreis[]
  texte: QuerschnittText[]
}

export function rahmenForm(ausfuehrung: TrunkAusfuehrung): RahmenForm {
  if (ausfuehrung === 'rohr') return 'rund'
  if (ausfuehrung === 'buendel') return 'abgerundet'
  return 'eckig'
}

export function lesbareTextFarbe(farbe: string): string {
  const hex = farbe.trim().replace(/^#/, '')
  const voll = hex.length === 3 ? [...hex].map((z) => z + z).join('') : hex
  if (!/^[0-9a-fA-F]{6}$/.test(voll)) return '#ffffff'
  const kanal = (i: number) => parseInt(voll.slice(i, i + 2), 16) / 255
  const helligkeit = 0.299 * kanal(0) + 0.587 * kanal(2) + 0.114 * kanal(4)
  return helligkeit > 0.6 ? '#1b1d21' : '#ffffff'
}

const textBreite = (text: string) => text.length * ZEICHEN_BREITE

interface Block {
  gruppe: InhaltsGruppe
  breite: number
  hoehe: number
  innenBreite: number
  innenHoehe: number
  spalten: number
}

function block(gruppe: InhaltsGruppe, mitStrangTitel: boolean): Block {
  const n = gruppe.leitungen.length
  const d = 2 * KREIS_RADIUS
  const spalten = Math.max(1, Math.ceil(Math.sqrt(n)))
  const zeilen = Math.max(1, Math.ceil(n / spalten))
  const kreiseBreite = spalten * d + (spalten - 1) * KREIS_ABSTAND
  const kreiseHoehe = zeilen * d + (zeilen - 1) * KREIS_ABSTAND
  let innenBreite = kreiseBreite
  let innenHoehe = kreiseHoehe
  if (gruppe.art === 'trunk') {
    if (rahmenForm(gruppe.ausfuehrung) === 'rund') {
      const durchmesser = Math.hypot(kreiseBreite, kreiseHoehe) + 2 * RAHMEN_RAND
      innenBreite = durchmesser
      innenHoehe = durchmesser
    } else {
      innenBreite += 2 * RAHMEN_RAND
      innenHoehe += 2 * RAHMEN_RAND
    }
  }
  const oben = mitStrangTitel && gruppe.strangTitel ? TEXT_HOEHE : 0
  const unten = gruppe.art === 'trunk' && gruppe.titel ? TEXT_HOEHE : 0
  const breite = Math.max(
    innenBreite,
    mitStrangTitel && gruppe.strangTitel ? textBreite(gruppe.strangTitel) : 0,
    gruppe.art === 'trunk' ? textBreite(gruppe.titel) : 0,
  )
  return { gruppe, breite, hoehe: oben + innenHoehe + unten, innenBreite, innenHoehe, spalten }
}

export function ordneQuerschnittAn(
  gruppen: readonly InhaltsGruppe[],
  leitungen: readonly InhaltsLeitung[],
  { mitSchacht, maxBreite = 640 }: { mitSchacht: boolean; maxBreite?: number },
): QuerschnittLayout {
  const nachSchluessel = new Map(leitungen.map((l) => [l.schluessel, l]))
  const bloecke = gruppen.map((g) => block(g, mitSchacht))
  const rand = mitSchacht ? SCHACHT_RAND : 0

  const zeilen: Block[][] = []
  let aktuelle: Block[] = []
  let breiteAktuell = 0
  for (const b of bloecke) {
    const noetig = (aktuelle.length > 0 ? GRUPPEN_ABSTAND : 0) + b.breite
    if (aktuelle.length > 0 && breiteAktuell + noetig > maxBreite - 2 * rand) {
      zeilen.push(aktuelle)
      aktuelle = []
      breiteAktuell = 0
    }
    breiteAktuell += aktuelle.length > 0 ? GRUPPEN_ABSTAND + b.breite : b.breite
    aktuelle.push(b)
  }
  if (aktuelle.length > 0) zeilen.push(aktuelle)

  const rahmen: QuerschnittRahmen[] = []
  const kreise: QuerschnittKreis[] = []
  const texte: QuerschnittText[] = []
  let y = rand
  let breite = 0
  for (const zeile of zeilen) {
    const zeilenHoehe = Math.max(...zeile.map((b) => b.hoehe))
    let x = rand
    for (const b of zeile) {
      const g = b.gruppe
      let oben = y
      if (mitSchacht && g.strangTitel) {
        texte.push({
          x: x + b.breite / 2,
          y: oben + TEXT_HOEHE - 4,
          text: g.strangTitel,
          art: 'strang',
        })
        oben += TEXT_HOEHE
      }
      const innenX = x + (b.breite - b.innenBreite) / 2
      if (g.art === 'trunk') {
        rahmen.push({
          schluessel: g.schluessel,
          form: rahmenForm(g.ausfuehrung),
          x: innenX,
          y: oben,
          breite: b.innenBreite,
          hoehe: b.innenHoehe,
        })
        if (g.titel) {
          texte.push({
            x: x + b.breite / 2,
            y: oben + b.innenHoehe + TEXT_HOEHE - 3,
            text: g.titel,
            art: 'trunk',
          })
        }
      }
      const d = 2 * KREIS_RADIUS
      const n = g.leitungen.length
      const zeilenAnzahl = Math.max(1, Math.ceil(n / b.spalten))
      const kreiseHoehe = zeilenAnzahl * d + (zeilenAnzahl - 1) * KREIS_ABSTAND
      const mitteY = oben + b.innenHoehe / 2
      g.leitungen.forEach((schluessel, index) => {
        const l = nachSchluessel.get(schluessel)
        if (!l) return
        const reihe = Math.floor(index / b.spalten)
        const inReihe = Math.min(b.spalten, n - reihe * b.spalten)
        const reiheBreite = inReihe * d + (inReihe - 1) * KREIS_ABSTAND
        const spalte = index % b.spalten
        kreise.push({
          schluessel,
          x:
            innenX +
            b.innenBreite / 2 -
            reiheBreite / 2 +
            KREIS_RADIUS +
            spalte * (d + KREIS_ABSTAND),
          y: mitteY - kreiseHoehe / 2 + KREIS_RADIUS + reihe * (d + KREIS_ABSTAND),
          nummer: l.leitung.nummer,
          farbe: l.leitung.farbe,
          textFarbe: lesbareTextFarbe(l.leitung.farbe),
          blass: !l.hier,
          strangNummer: l.eigenerStrang,
        })
      })
      x += b.breite + GRUPPEN_ABSTAND
    }
    breite = Math.max(breite, x - GRUPPEN_ABSTAND + rand)
    y += zeilenHoehe + ZEILEN_ABSTAND
  }
  const hoehe = zeilen.length > 0 ? y - ZEILEN_ABSTAND + rand : 2 * rand
  return {
    breite: Math.max(breite, mitSchacht ? 160 : 0),
    hoehe: Math.max(hoehe, mitSchacht ? 100 : 0),
    schacht: mitSchacht
      ? { x: 0, y: 0, breite: Math.max(breite, 160), hoehe: Math.max(hoehe, 100) }
      : null,
    rahmen,
    kreise,
    texte,
  }
}
