import { portRasterLayout, type PortGruppe, type TrunkDockpunkt } from '../../document-model'
import { SymbolVorschau } from './SymbolVorschau'
import { symbolVorschauBreite, symbolVorschauHoehe } from './vorschau-geometrie'
import { useT } from '../sprache-anbindung'

interface Props {
  gruppen: PortGruppe[]
  trunkPunkte: TrunkDockpunkt[]
  bildUrl: string | undefined
  breitenFaktor: number | undefined
  hoehenFaktor?: number
}

export function PortRasterVorschau({
  gruppen,
  trunkPunkte,
  bildUrl,
  breitenFaktor,
  hoehenFaktor,
}: Props) {
  const t = useT()
  const breite = symbolVorschauBreite(breitenFaktor)
  const hoehe = symbolVorschauHoehe(hoehenFaktor)
  const raster = portRasterLayout({
    modus: 'ports',
    gruppen: gruppen.filter((g) => g.typ.trim() !== '' && g.anzahl > 0),
    trunkPunkte,
  })
  const punkte = [
    ...raster.ports.map((p) => ({ ...p, trunk: false })),
    ...raster.trunkPunkte.map((p) => ({ ...p, trunk: true })),
  ]

  return (
    <div className="dockpunkte-vorschau">
      <SymbolVorschau bildUrl={bildUrl} breitenFaktor={breitenFaktor} hoehenFaktor={hoehenFaktor}>
        {punkte.map((punkt, index) => (
          <circle
            key={index}
            cx={punkt.xAnteil * breite}
            cy={hoehe - punkt.yAnteil * hoehe}
            r={4}
            className={punkt.trunk ? 'dockpunkt-marker dockpunkt-marker-trunk' : 'dockpunkt-marker'}
          />
        ))}
      </SymbolVorschau>
      <p className="hinweistext">{t('katalogdialoge.dockpunkte.portVorschau')}</p>
    </div>
  )
}
