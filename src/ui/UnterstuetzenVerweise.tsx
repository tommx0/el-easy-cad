import { oeffneAdresse } from '../persistence'
import { GITHUB_SPONSORS_URL, PATREON_URL } from './community'
import { useT } from './sprache-anbindung'

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

export function UnterstuetzenVerweise() {
  const t = useT()
  return (
    <p className="dialog-hinweis">
      <b>{t('community.unterstuetzen.titel')}:</b>{' '}
      <Verweis url={GITHUB_SPONSORS_URL}>{t('community.unterstuetzen.githubSponsors')}</Verweis>
      {PATREON_URL && (
        <>
          {' · '}
          <Verweis url={PATREON_URL}>{t('community.unterstuetzen.patreon')}</Verweis>
        </>
      )}
    </p>
  )
}
