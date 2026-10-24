import { useUiStore } from '../store/ui-store'

export function Toast() {
  const toast = useUiStore((s) => s.toast)
  if (!toast) return null
  return (
    <div className="toast" role="status">
      {toast}
    </div>
  )
}
