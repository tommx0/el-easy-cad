function ausgeschrieben(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function grundbuchstaben(text: string): string {
  return text.toLocaleLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/\p{M}/gu, '')
}

export function sucheTrifft(suche: string, texte: readonly (string | undefined)[]): boolean {
  const woerter = suche.split(/\s+/).filter(Boolean)
  if (woerter.length === 0) return true
  const text = texte.filter(Boolean).join(' ')
  const lang = ausgeschrieben(text)
  const kurz = grundbuchstaben(text)
  return woerter.every(
    (wort) => lang.includes(ausgeschrieben(wort)) || kurz.includes(grundbuchstaben(wort)),
  )
}
