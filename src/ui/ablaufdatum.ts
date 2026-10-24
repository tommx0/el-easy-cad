export function formatiereAblaufdatum(isoDatum: string): string {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDatum)
  if (!treffer) return isoDatum
  const [, jahr, monat, tag] = treffer
  return `${tag}.${monat}.${jahr}`
}
