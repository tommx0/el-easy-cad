export interface XmlElement {
  name: string
  attribute: Record<string, string>
  kinder: XmlKnoten[]
}

export type XmlKnoten = XmlElement | { text: string }

export function istElement(k: XmlKnoten): k is XmlElement {
  return 'name' in k
}

const ENTITAETEN: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }

export function entitaetenAufloesen(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (ganz, name: string) => {
    if (name.startsWith('#x')) return String.fromCodePoint(parseInt(name.slice(2), 16))
    if (name.startsWith('#')) return String.fromCodePoint(parseInt(name.slice(1), 10))
    return ENTITAETEN[name] ?? ganz
  })
}

export class XmlFehler extends Error {}

export function leseXml(quelle: string): XmlElement {
  let pos = 0
  const wurzel: XmlElement = { name: '#dokument', attribute: {}, kinder: [] }
  const stapel: XmlElement[] = [wurzel]

  const oben = () => stapel[stapel.length - 1]

  while (pos < quelle.length) {
    const lt = quelle.indexOf('<', pos)
    if (lt < 0) {
      oben().kinder.push({ text: entitaetenAufloesen(quelle.slice(pos)) })
      break
    }
    if (lt > pos) oben().kinder.push({ text: entitaetenAufloesen(quelle.slice(pos, lt)) })

    if (quelle.startsWith('<!--', lt)) {
      const ende = quelle.indexOf('-->', lt + 4)
      pos = ende < 0 ? quelle.length : ende + 3
      continue
    }
    if (quelle.startsWith('<![CDATA[', lt)) {
      const ende = quelle.indexOf(']]>', lt + 9)
      oben().kinder.push({ text: quelle.slice(lt + 9, ende < 0 ? quelle.length : ende) })
      pos = ende < 0 ? quelle.length : ende + 3
      continue
    }
    if (quelle.startsWith('<?', lt) || quelle.startsWith('<!', lt)) {
      const ende = quelle.indexOf('>', lt)
      pos = ende < 0 ? quelle.length : ende + 1
      continue
    }
    if (quelle.startsWith('</', lt)) {
      const ende = quelle.indexOf('>', lt)
      const name = quelle.slice(lt + 2, ende).trim()
      for (let i = stapel.length - 1; i > 0; i--) {
        if (stapel[i].name === name) {
          stapel.length = i
          break
        }
      }
      pos = ende + 1
      continue
    }

    const nameMuster = /^<([A-Za-z_][\w:.-]*)/y
    nameMuster.lastIndex = 0
    const nameTreffer = nameMuster.exec(quelle.slice(lt, lt + 200))
    if (!nameTreffer) throw new XmlFehler(`Ungültiges XML an Stelle ${lt}.`)
    const element: XmlElement = { name: nameTreffer[1], attribute: {}, kinder: [] }
    pos = lt + nameTreffer[0].length
    const attrMuster = /\s*([A-Za-z_][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/y
    for (;;) {
      attrMuster.lastIndex = pos
      const a = attrMuster.exec(quelle)
      if (!a) break
      element.attribute[a[1]] = entitaetenAufloesen(a[3] ?? a[4] ?? '')
      pos = attrMuster.lastIndex
    }
    while (pos < quelle.length && /\s/.test(quelle[pos])) pos++
    oben().kinder.push(element)
    if (quelle.startsWith('/>', pos)) {
      pos += 2
    } else if (quelle[pos] === '>') {
      pos += 1
      stapel.push(element)
    } else {
      throw new XmlFehler(`Ungültiges Attribut in <${element.name}> an Stelle ${pos}.`)
    }
  }

  const svg = wurzel.kinder.find(istElement)
  if (!svg) throw new XmlFehler('Kein Wurzelelement gefunden.')
  return svg
}

export function textInhalt(e: XmlElement): string {
  return e.kinder.map((k) => (istElement(k) ? textInhalt(k) : k.text)).join('')
}
