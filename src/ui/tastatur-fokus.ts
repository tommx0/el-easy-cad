const TASTEN_VERBRAUCHENDE_TYPEN = new Set([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
])

export function istEingabeFeldFokussiert(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if ((el as HTMLElement).isContentEditable) return true
  if (tag !== 'INPUT') return false
  const typ = (el as HTMLInputElement).type || 'text'
  return TASTEN_VERBRAUCHENDE_TYPEN.has(typ)
}
