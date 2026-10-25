import { oeffneAdresse } from '../persistence'

export function Verweis({ url, children }: { url: string; children: string }) {
  return (
    <a
      href={url}
      onClick={(e) => {
        e.preventDefault()
        void oeffneAdresse(url)
      }}
    >
      {children}
    </a>
  )
}
