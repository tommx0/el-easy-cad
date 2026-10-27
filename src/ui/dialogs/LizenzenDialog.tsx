import { useState } from 'react'
import { useT } from '../sprache-anbindung'
import { useUiStore } from '../store/ui-store'

export function LizenzenDialog() {
  const t = useT()
  const offen = useUiStore((s) => s.lizenzenDialogOffen)
  const [texte, setTexte] = useState<string | null>(null)
  const [ladeFehler, setLadeFehler] = useState(false)
  const schliessen = () => useUiStore.getState().setLizenzenDialogOffen(false)
  if (!offen) return null

  const texteAnzeigen = () => {
    setLadeFehler(false)
    import('../../../THIRD-PARTY-NOTICES.txt?raw')
      .then((modul) => setTexte(modul.default))
      .catch(() => setLadeFehler(true))
  }

  return (
    <div className="dialog-overlay" onMouseDown={schliessen}>
      <div className="dialog dialog-lizenzen" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{t('verwaltungsdialoge.lizenzen.titel')}</h2>

        <div className="lizenzen-content">
          <h3>el.easy.CAD</h3>
          <p>© 2026 Thomas Marx</p>

          <h4>{t('verwaltungsdialoge.lizenzen.abhaengigkeiten')}</h4>
          <p>{t('verwaltungsdialoge.lizenzen.komponenten')}</p>

          <div className="lizenz-liste">
            <div className="lizenz-item">
              <strong>React &amp; React DOM</strong>
              <span className="lizenz-badge">MIT</span>
              <p>
                Facebook, Inc. •{' '}
                <a
                  href="https://github.com/facebook/react"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/facebook/react
                </a>
              </p>
            </div>

            <div className="lizenz-item">
              <strong>Zod</strong>
              <span className="lizenz-badge">MIT</span>
              <p>
                Colin McDonnell •{' '}
                <a
                  href="https://github.com/colinhacks/zod"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/colinhacks/zod
                </a>
              </p>
              <small>TypeScript-first schema validation</small>
            </div>

            <div className="lizenz-item">
              <strong>Zustand</strong>
              <span className="lizenz-badge">MIT</span>
              <p>
                Paul Henschel •{' '}
                <a
                  href="https://github.com/pmndrs/zustand"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/pmndrs/zustand
                </a>
              </p>
              <small>State management</small>
            </div>

            <div className="lizenz-item">
              <strong>IDB</strong>
              <span className="lizenz-badge">MIT</span>
              <p>
                Google, Inc. •{' '}
                <a
                  href="https://github.com/jakearchibald/idb"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/jakearchibald/idb
                </a>
              </p>
              <small>IndexedDB wrapper</small>
            </div>

            <div className="lizenz-item">
              <strong>PDF.js</strong>
              <span className="lizenz-badge">Apache 2.0</span>
              <p>
                Mozilla Foundation •{' '}
                <a
                  href="https://github.com/mozilla/pdf.js"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/mozilla/pdf.js
                </a>
              </p>
              <small>PDF rendering</small>
            </div>

            <div className="lizenz-item">
              <strong>jsPDF</strong>
              <span className="lizenz-badge">MIT/Apache</span>
              <p>
                <a
                  href="https://github.com/parallax/jsPDF"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/parallax/jsPDF
                </a>
              </p>
              <small>PDF generation</small>
            </div>

            <div className="lizenz-item">
              <strong>DXF Parser</strong>
              <span className="lizenz-badge">Apache 2.0</span>
              <p>
                gdsCAD •{' '}
                <a
                  href="https://github.com/gdsCAD/dxf-parser"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/gdsCAD/dxf-parser
                </a>
              </p>
              <small>DXF file parsing</small>
            </div>

            <div className="lizenz-item">
              <strong>web-ifc</strong>
              <span className="lizenz-badge">MPL 2.0</span>
              <p>
                That Open Company •{' '}
                <a
                  href="https://github.com/ThatOpen/engine_web-ifc"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/ThatOpen/engine_web-ifc
                </a>
              </p>
              <small>IFC file parsing (unmodified)</small>
            </div>

            <div className="lizenz-item">
              <strong>three.js</strong>
              <span className="lizenz-badge">MIT</span>
              <p>
                three.js authors •{' '}
                <a
                  href="https://github.com/mrdoob/three.js"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/mrdoob/three.js
                </a>
              </p>
              <small>3D view</small>
            </div>

            <div className="lizenz-item">
              <strong>Node.js</strong>
              <span className="lizenz-badge">MIT</span>
              <p>
                Node.js contributors •{' '}
                <a href="https://github.com/nodejs/node" target="_blank" rel="noopener noreferrer">
                  github.com/nodejs/node
                </a>
              </p>
              <small>{t('verwaltungsdialoge.lizenzen.nodeZweck')}</small>
            </div>

            <div className="lizenz-item">
              <strong>Tauri</strong>
              <span className="lizenz-badge">MIT/Apache</span>
              <p>
                Tauri Programme •{' '}
                <a
                  href="https://github.com/tauri-apps/tauri"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/tauri-apps/tauri
                </a>
              </p>
              <small>{t('verwaltungsdialoge.lizenzen.tauriZweck')}</small>
            </div>
          </div>

          <h4>{t('verwaltungsdialoge.lizenzen.bestimmungen')}</h4>
          <p>{t('verwaltungsdialoge.lizenzen.bestimmungenText')}</p>
          <p>{t('verwaltungsdialoge.lizenzen.vollstaendig')}</p>
          {texte === null ? (
            <p>
              <button type="button" onClick={texteAnzeigen}>
                {t('verwaltungsdialoge.lizenzen.texteAnzeigen')}
              </button>
            </p>
          ) : (
            <pre className="lizenztexte">{texte}</pre>
          )}
          {ladeFehler && <p role="alert">{t('verwaltungsdialoge.lizenzen.texteFehler')}</p>}
        </div>

        <div className="dialog-aktionen">
          <button type="button" className="primaer" onClick={schliessen}>
            {t('verwaltungsdialoge.allgemein.schliessen')}
          </button>
        </div>
      </div>
    </div>
  )
}
