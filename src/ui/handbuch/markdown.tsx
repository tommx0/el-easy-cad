import type { ReactNode } from 'react'
import { BEFEHL_NACH_ID, befehlName } from '../befehle/katalog'
import { anzeige } from '../befehle/kuerzel'
import { formatiereDauer, videoZuId } from './videos'

const BILD_PFAD = 'handbuch/'

export interface RenderOptionen {
  belegung: Record<string, string | null>
  aufAnker?: (anker: string) => void
  aufVideo?: (videoId: string) => void
}

const INLINE =
  /(\{\{(?:befehl|kuerzel|video):[a-z0-9.\-*]+\}\})|(\*\*[^*]+\*\*)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))/g

function kuerzelText(id: string, belegung: Record<string, string | null>): string | null {
  const kuerzel = belegung[id]
  if (kuerzel) return anzeige(kuerzel)
  return BEFEHL_NACH_ID[id]?.festeAnzeige ?? null
}

function marke(inhalt: string, opt: RenderOptionen, schluessel: number): ReactNode {
  const [art, id] = inhalt.slice(2, -2).split(':')
  if (art === 'video') {
    const video = videoZuId(id)
    if (!video) return null
    return (
      <button
        key={schluessel}
        type="button"
        className="handbuch-video"
        onClick={() => opt.aufVideo?.(video.id)}
      >
        ▶ {video.titel} ({formatiereDauer(video.dauerSekunden)})
      </button>
    )
  }
  const befehl = BEFEHL_NACH_ID[id]
  const kuerzel = kuerzelText(id, opt.belegung)
  if (art === 'kuerzel') {
    return kuerzel ? <kbd key={schluessel}>{kuerzel}</kbd> : <span key={schluessel}>–</span>
  }
  const label = befehl ? befehlName(befehl.id) : id
  return (
    <span key={schluessel} className="handbuch-befehl">
      „{label}“{kuerzel ? <kbd>{kuerzel}</kbd> : null}
    </span>
  )
}

export function inline(text: string, opt: RenderOptionen): ReactNode[] {
  const teile: ReactNode[] = []
  let zuletzt = 0
  let schluessel = 0
  for (const treffer of text.matchAll(INLINE)) {
    const start = treffer.index ?? 0
    if (start > zuletzt) teile.push(text.slice(zuletzt, start))
    const stueck = treffer[0]
    if (stueck.startsWith('{{')) {
      teile.push(marke(stueck, opt, schluessel++))
    } else if (stueck.startsWith('**')) {
      teile.push(<strong key={schluessel++}>{stueck.slice(2, -2)}</strong>)
    } else if (stueck.startsWith('`')) {
      teile.push(<code key={schluessel++}>{stueck.slice(1, -1)}</code>)
    } else {
      const ende = stueck.indexOf('](')
      const beschriftung = stueck.slice(1, ende)
      const ziel = stueck.slice(ende + 2, -1)
      teile.push(
        <a
          key={schluessel++}
          href={ziel}
          onClick={(e) => {
            if (!ziel.startsWith('#')) return
            e.preventDefault()
            opt.aufAnker?.(ziel.slice(1))
          }}
        >
          {beschriftung}
        </a>,
      )
    }
    zuletzt = start + stueck.length
  }
  if (zuletzt < text.length) teile.push(text.slice(zuletzt))
  return teile
}

const UEBERSCHRIFT = /^(#{1,3})\s+(.*?)(?:\s*\{#([a-z0-9-]+)\})?\s*$/
const BILD = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/
const AUFZAEHLUNG = /^[-*]\s+(.*)$/
const NUMMERIERT = /^\d+\.\s+(.*)$/

function zellen(zeile: string): string[] {
  return zeile
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((z) => z.trim())
}

export function rendereMarkdown(text: string, opt: RenderOptionen): ReactNode[] {
  const zeilen = text.split('\n')
  const knoten: ReactNode[] = []
  let i = 0
  let schluessel = 0

  while (i < zeilen.length) {
    const zeile = zeilen[i]

    if (zeile.trim() === '') {
      i++
      continue
    }

    const ueberschrift = UEBERSCHRIFT.exec(zeile)
    if (ueberschrift) {
      const stufe = ueberschrift[1].length
      const anker = ueberschrift[3]
      const inhalt = inline(ueberschrift[2], opt)
      if (stufe === 1) knoten.push(<h2 key={schluessel++}>{inhalt}</h2>)
      else if (stufe === 2)
        knoten.push(
          <h3 key={schluessel++} id={anker} className="handbuch-abschnitt">
            {inhalt}
          </h3>,
        )
      else knoten.push(<h4 key={schluessel++}>{inhalt}</h4>)
      i++
      continue
    }

    const bild = BILD.exec(zeile)
    if (bild) {
      knoten.push(
        <figure key={schluessel++} className="handbuch-bild">
          <img src={BILD_PFAD + bild[2]} alt={bild[1]} loading="lazy" />
          {bild[1] ? <figcaption>{bild[1]}</figcaption> : null}
        </figure>,
      )
      i++
      continue
    }

    if (zeile.startsWith('|')) {
      const kopf = zellen(zeile)
      i += zeilen[i + 1]?.startsWith('|') ? 2 : 1
      const reihen: string[][] = []
      while (i < zeilen.length && zeilen[i].startsWith('|')) {
        reihen.push(zellen(zeilen[i]))
        i++
      }
      knoten.push(
        <table key={schluessel++} className="handbuch-tabelle">
          <thead>
            <tr>
              {kopf.map((z, n) => (
                <th key={n}>{inline(z, opt)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reihen.map((reihe, n) => (
              <tr key={n}>
                {reihe.map((z, m) => (
                  <td key={m}>{inline(z, opt)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      )
      continue
    }

    if (zeile.startsWith('> ')) {
      const absaetze: string[] = []
      while (i < zeilen.length && zeilen[i].startsWith('> ')) {
        absaetze.push(zeilen[i].slice(2))
        i++
      }
      knoten.push(
        <aside key={schluessel++} className="handbuch-hinweis">
          {absaetze.map((a, n) => (
            <p key={n}>{inline(a, opt)}</p>
          ))}
        </aside>,
      )
      continue
    }

    if (AUFZAEHLUNG.test(zeile) || NUMMERIERT.test(zeile)) {
      const nummeriert = NUMMERIERT.test(zeile)
      const muster = nummeriert ? NUMMERIERT : AUFZAEHLUNG
      const punkte: string[] = []
      while (i < zeilen.length && muster.test(zeilen[i])) {
        punkte.push(muster.exec(zeilen[i])![1])
        i++
        while (i < zeilen.length && /^\s{2,}\S/.test(zeilen[i])) {
          punkte[punkte.length - 1] += ' ' + zeilen[i].trim()
          i++
        }
      }
      const kinder = punkte.map((p, n) => <li key={n}>{inline(p, opt)}</li>)
      knoten.push(
        nummeriert ? (
          <ol key={schluessel++} className="handbuch-schritte">
            {kinder}
          </ol>
        ) : (
          <ul key={schluessel++}>{kinder}</ul>
        ),
      )
      continue
    }

    const absatz: string[] = []
    while (
      i < zeilen.length &&
      zeilen[i].trim() !== '' &&
      !zeilen[i].startsWith('|') &&
      !zeilen[i].startsWith('> ') &&
      !zeilen[i].startsWith('#') &&
      !BILD.test(zeilen[i]) &&
      !AUFZAEHLUNG.test(zeilen[i]) &&
      !NUMMERIERT.test(zeilen[i])
    ) {
      absatz.push(zeilen[i].trim())
      i++
    }
    knoten.push(<p key={schluessel++}>{inline(absatz.join(' '), opt)}</p>)
  }

  return knoten
}
