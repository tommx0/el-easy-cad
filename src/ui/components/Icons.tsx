import type { ReactNode } from 'react'
import type { Fangart } from '../../tools'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

const WERKZEUG_ICONS: Record<string, ReactNode> = {
  auswahl: <path d="M6 3.2v14.4l3.7-3.6 2.2 5.6 2.6-1-2.3-5.5h5.1z" />,
  komponente: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5" />
    </>
  ),
  leitung: (
    <>
      <path d="M4.5 17.5h5l5-11h5" />
      <circle cx="4.5" cy="17.5" r="1.9" />
      <circle cx="19.5" cy="6.5" r="1.9" />
    </>
  ),
  schaltverbindung: (
    <>
      <path d="M4.5 17.5h5l5-11h5" />
      <circle cx="4.5" cy="17.5" r="1.9" />
      <circle cx="19.5" cy="6.5" r="1.9" />
      <path d="M9.7 13.5 13.5 15.7" />
    </>
  ),
  'knx-aktor': (
    <>
      <rect x="3.5" y="6.5" width="17" height="10" rx="1" />
      <path d="M7 3.5v3M10 3.5v3M7 16.5v4M10 16.5v4M14 16.5v4M17 16.5v4" />
    </>
  ),
  potential: (
    <>
      <path d="M12 3.5v10" />
      <path d="M12 13.5 7.5 18h9z" />
      <path d="M6 20.5h12" />
    </>
  ),
  trunk: (
    <>
      <path d="M2.5 8.5h19M2.5 15.5h19" />
      <rect x="9.5" y="5.5" width="5" height="13" rx="1.4" />
    </>
  ),
  wirkverbindung: (
    <>
      <path d="M4.5 19.5 19.5 4.5" strokeDasharray="2.5 2.2" />
      <circle cx="4.5" cy="19.5" r="1.9" />
      <circle cx="19.5" cy="4.5" r="1.9" />
    </>
  ),
  linie: <path d="M4.5 19.5 19.5 4.5" />,
  rechteck: <rect x="3.5" y="6" width="17" height="12" rx="1.2" />,
  wand: <path d="M3 8.5h18M3 15.5h18" />,
  wandrechteck: <path d="M3.5 4.5h17v15h-17zM7.5 8.5h9v7h-9z" />,
  tuer: (
    <>
      <path d="M3.5 20.5h4M15.5 20.5h5" />
      <path d="M8.5 20.5V10.5" />
      <path d="M8.5 10.5A10 10 0 0 1 18.5 20.5" />
    </>
  ),
  fenster: (
    <>
      <path d="M3.5 9.5h4M16.5 9.5h4M3.5 15.5h4M16.5 15.5h4" />
      <path d="M7.5 9.5v6M16.5 9.5v6" />
      <path d="M7.5 11h9M7.5 14h9" />
    </>
  ),
  wanddurchbruch: (
    <>
      <path d="M3.5 9.5h4M16.5 9.5h4M3.5 15.5h4M16.5 15.5h4" />
      <path d="M7.5 9.5v6M16.5 9.5v6" />
    </>
  ),
  raum: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.2" />
      <path d="M3.5 4.5 20.5 19.5M20.5 4.5 3.5 19.5" strokeDasharray="2 2.5" />
    </>
  ),
  treppe: <path d="M3.5 19.5h4v-4h3v-4h3v-4h3v-4h3.5" />,
  bodenplatte: <path d="M3.5 13.5 9 8.5h11.5L15 13.5zM3.5 13.5v3h11.5l5.5-5v-3M15 13.5v3" />,
  bodenplatterechteck: (
    <path d="M3.5 5.5h3M9 5.5h6M17.5 5.5h3v3M20.5 11v2M20.5 15.5v3h-3M15 18.5H9M6.5 18.5h-3v-3M3.5 13v-2M3.5 8.5v-3" />
  ),
  kreis: <circle cx="12" cy="12" r="8.5" />,
  polylinie: (
    <>
      <path d="M3.5 18.5 8.5 9.5l4.5 5 7-9" />
      <circle cx="3.5" cy="18.5" r="1.4" />
      <circle cx="20" cy="5.5" r="1.4" />
    </>
  ),
  bogen: (
    <>
      <path d="M3.5 18a8.5 8.5 0 0 1 17 0" />
      <path d="M3.5 18h17" strokeDasharray="2 2.5" />
    </>
  ),
  ellipse: <ellipse cx="12" cy="12" rx="9" ry="6" />,
  polygon: <path d="M12 3.2 20 7.8v9.2L12 20.8 4 17V7.8z" />,
  punkt: (
    <>
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
      <path d="M12 3.5v3.5M12 17v3.5M3.5 12H7M17 12h3.5" />
    </>
  ),
  text: <path d="M5 6.5V5h14v1.5M12 5v14M8.5 19h7" />,
  bemassung: (
    <>
      <path d="M4 7.5v9M20 7.5v9M4 12h16" />
      <path d="M7 9.5 4.5 12 7 14.5M17 9.5 19.5 12 17 14.5" />
    </>
  ),
  kettenbemassung: (
    <>
      <path d="M3 8v9M11 8v9M21 8v9M3 12.5h18" />
      <path d="M5.5 10.5 3.5 12.5l2 2M8.5 10.5l2 2-2 2M13.5 10.5l-2 2 2 2M18.5 10.5l2 2-2 2" />
    </>
  ),
  parallelbemassung: (
    <>
      <path d="M3.5 5v15M11 13v7M20.5 5v15M3.5 16.5H11M3.5 8.5h17" />
      <path d="M5.5 14.5l-2 2 2 2M9 14.5l2 2-2 2M5.5 6.5l-2 2 2 2M18.5 6.5l2 2-2 2" />
    </>
  ),
  schraffur: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.2" />
      <path d="M7 18.5 12 5.5M11.5 18.5 16.5 5.5M16 18.5 20.5 6.9" />
    </>
  ),
  trimmen: (
    <>
      <path d="M3 16.5h17" />
      <path d="M14 4v15" />
      <path d="M16.5 6.5 20.5 10.5M20.5 6.5 16.5 10.5" />
    </>
  ),
  wandteilen: (
    <>
      <path d="M3.5 9.5h6M14.5 9.5h6M3.5 14.5h6M14.5 14.5h6" />
      <path d="M9.5 7v10M14.5 7v10" />
    </>
  ),
  stueckliste: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9h17M9.5 9v10.5M12.5 13.5h5M12.5 16.5h5" />
    </>
  ),
  leitungsliste: (
    <>
      <path d="M3 5.5v13" />
      <rect x="7.5" y="4.5" width="13" height="15" rx="1.5" />
      <path d="M7.5 9h13M11 12.5h6M11 15.5h6" />
    </>
  ),
  switchplan: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="1.5" />
      <path d="M5.5 11.5v2M8 11.5v2M10.5 11.5v2M13 11.5v2M15.5 11.5v2M18 11.5v2" />
    </>
  ),
  trunkliste: (
    <>
      <path d="M3 5.5v13" strokeWidth="3" />
      <rect x="7.5" y="4.5" width="13" height="15" rx="1.5" />
      <path d="M7.5 9h13M11 12.5h6M11 15.5h6" />
    </>
  ),
  raumliste: (
    <>
      <rect x="2.5" y="8" width="6" height="6" rx="0.8" />
      <path d="M2.5 8 8.5 14M8.5 8 2.5 14" strokeDasharray="1.5 1.8" />
      <rect x="10.5" y="4.5" width="11" height="15" rx="1.2" />
      <path d="M10.5 9h11M13.5 13h6M13.5 16h6" />
    </>
  ),
  betriebsmittelliste: (
    <>
      <path d="M2.5 8.5 6 8.5 8.5 11 6 13.5 2.5 13.5Z" />
      <circle cx="4.6" cy="11" r="0.7" fill="currentColor" stroke="none" />
      <rect x="10.5" y="4.5" width="11" height="15" rx="1.2" />
      <path d="M10.5 9h11M13.5 13h6M13.5 16h6" />
    </>
  ),
  stromkreisverzeichnis: (
    <>
      <rect x="3" y="6" width="5" height="10" rx="0.8" />
      <path d="M5.5 4v2M5.5 16v2M4.5 9.5l2 3" />
      <rect x="10.5" y="4.5" width="11" height="15" rx="1.2" />
      <path d="M10.5 9h11M13.5 13h6M13.5 16h6" />
    </>
  ),
  aktorkanalliste: (
    <>
      <rect x="2.5" y="7" width="6" height="7" rx="0.8" />
      <path d="M4 14v3M7 14v3" />
      <rect x="10.5" y="4.5" width="11" height="15" rx="1.2" />
      <path d="M10.5 9h11M13.5 13h6M13.5 16h6" />
    </>
  ),
  potentialliste: (
    <>
      <path d="M5.5 5v4" />
      <path d="M5.5 9 3.2 12h4.6z" />
      <path d="M2 13.5h7" />
      <rect x="10.5" y="4.5" width="11" height="15" rx="1.2" />
      <path d="M10.5 9h11M13.5 13h6M13.5 16h6" />
    </>
  ),
  steuerungslogik: (
    <>
      <circle cx="4.5" cy="11" r="2" />
      <path d="M6.5 11h3" />
      <path d="M9.5 11 8 9.7M9.5 11 8 12.3" />
      <rect x="10.5" y="4.5" width="11" height="15" rx="1.2" />
      <path d="M10.5 9h11M13.5 13h6M13.5 16h6" />
    </>
  ),
  leitungsbaum: (
    <>
      <rect x="8.5" y="3" width="7" height="4" rx="1" />
      <path d="M12 7v3.5M5.5 10.5h13M5.5 10.5v2.5M18.5 10.5v2.5" />
      <rect x="2.5" y="13" width="6" height="4" rx="1" />
      <rect x="15.5" y="13" width="6" height="4" rx="1" />
    </>
  ),
  plankopf: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
      <path d="M2.5 12h19M13 12v7.5M17.5 12v7.5M2.5 8h19" />
    </>
  ),
  nullpunkt: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 6.5A5.5 5.5 0 0 1 17.5 12H12z" fill="currentColor" stroke="none" />
      <path d="M12 17.5A5.5 5.5 0 0 1 6.5 12H12z" fill="currentColor" stroke="none" />
      <path d="M12 2.5v19M2.5 12h19" />
    </>
  ),
  kalibrieren: (
    <>
      <path d="M4 20 20 4" />
      <path d="M4 16v4h4" />
      <path d="M8.5 15.5 10.5 17.5M12 12l2 2M15.5 8.5l2 2" />
    </>
  ),
  'hintergrund-ausblenden': (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="1.4" />
      <rect x="9" y="9" width="7" height="6" rx="0.8" strokeDasharray="2 2" />
      <path d="M9 15 16 9" />
    </>
  ),
  kabelschacht: (
    <>
      <path d="M2.5 6.5h6M15.5 6.5h6M2.5 17.5h6M15.5 17.5h6" />
      <rect x="8.5" y="3" width="7" height="18" rx="1.4" />
      <path d="M12 17.5V7M9.5 9.5 12 7l2.5 2.5" />
    </>
  ),
  patchpanelplan: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
      <path d="M5.5 9.5v2M8 9.5v2M10.5 9.5v2M13 9.5v2M15.5 9.5v2M18 9.5v2" />
      <path d="M5.5 14v1.5M8 14v1.5M10.5 14v1.5M13 14v1.5M15.5 14v1.5M18 14v1.5" />
    </>
  ),
  'zoom-fenster': (
    <>
      <path d="M3 7V4.5h3M18 4.5h3V7M21 17v2.5h-3M6 19.5H3V17" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M14.6 14.6 17 17" />
    </>
  ),
  'zeichenflaeche-verschieben': (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="1.4" strokeDasharray="2.5 2.5" />
      <path d="M12 8.2v7.6M8.2 12h7.6" />
      <path
        d="M12 6.6 10.6 8.2h2.8zM12 17.4l1.4-1.6h-2.8zM6.6 12l1.6-1.4v2.8zM17.4 12l-1.6 1.4v-2.8z"
        fill="currentColor"
      />
    </>
  ),
}

export function WerkzeugIcon({ id }: { id: string }) {
  const pfad = WERKZEUG_ICONS[id]
  return pfad ? <Icon>{pfad}</Icon> : null
}

export const IconRueckgaengig = () => (
  <Icon>
    <path d="M4 10h10a5 5 0 0 1 0 10h-3" />
    <path d="M8 6 4 10l4 4" />
  </Icon>
)

export const IconWiederholen = () => (
  <Icon>
    <path d="M20 10H10a5 5 0 0 0 0 10h3" />
    <path d="M16 6l4 4-4 4" />
  </Icon>
)

export const IconAktualisieren = () => (
  <Icon>
    <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5" />
    <path d="M20 4.5v4h-4" />
    <path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5" />
    <path d="M4 19.5v-4h4" />
  </Icon>
)

export const IconRaster = () => (
  <Icon>
    <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />
    <path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" />
  </Icon>
)

export const IconFang = () => (
  <Icon>
    <path d="M6.5 4.5v7a5.5 5.5 0 0 0 11 0v-7" />
    <path d="M6.5 10.5h11" />
    <path d="M4.5 4.5h4M15.5 4.5h4" />
  </Icon>
)

export const IconObjektfang = () => (
  <Icon>
    <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
    <rect x="10.7" y="10.7" width="2.6" height="2.6" />
  </Icon>
)

export const IconSpurfang = () => (
  <Icon>
    <path d="M2.5 12h6M15.5 12h6" strokeDasharray="2.2 2.2" />
    <path d="M12 2.5v6M12 15.5v6" strokeDasharray="2.2 2.2" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </Icon>
)

export const IconHintergrundfang = () => (
  <Icon>
    <path d="M3 20h11M3 16.5h7.5V5M14 20V5" strokeDasharray="2.4 1.6" />
    <rect x="12" y="18" width="4" height="4" />
  </Icon>
)

export const IconWandfang = () => (
  <Icon>
    <path d="M3 20.5h18M3 17.5h18" />
    <rect x="5" y="11" width="5" height="5" />
    <rect x="10" y="11" width="5" height="5" />
    <path d="M18.5 6v6M16 9.5l2.5 2.5 2.5-2.5" />
  </Icon>
)

export const IconHintergrund = () => (
  <Icon>
    <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
    <path d="M3.5 15.5 8.5 11l3.5 3 4-3.5 4.5 4" />
    <circle cx="8.5" cy="9" r="1.3" />
  </Icon>
)

export const IconMehr = ({ offen }: { offen: boolean }) => (
  <Icon>{offen ? <path d="M6 14.5 12 8.5l6 6" /> : <path d="M6 9.5 12 15.5l6-6" />}</Icon>
)

export const IconPfeilUnten = ({ offen }: { offen: boolean }) => (
  <Icon>{offen ? <path d="M6 14.5 12 8.5l6 6" /> : <path d="M8.5 10 12 13.5 15.5 10" />}</Icon>
)

const FANGART_ICONS: Record<Fangart, ReactNode> = {
  endpunkt: <rect x="7" y="7" width="10" height="10" />,
  mitte: <path d="M12 6 18 17H6z" />,
  zentrum: <circle cx="12" cy="12" r="6" />,
  quadrant: <path d="M12 5 19 12 12 19 5 12z" />,
  dock: (
    <>
      <rect x="7" y="7" width="10" height="10" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  schnitt: <path d="M7 7 17 17M17 7 7 17" />,
  naechster: <path d="M7 6h10l-5 6zM7 18h10l-5-6z" />,
}

export function FangartIcon({ art }: { art: Fangart }) {
  return <Icon>{FANGART_ICONS[art]}</Icon>
}

export const IconSchliessen = () => (
  <Icon>
    <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
  </Icon>
)

export const IconPlus = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const IconWinkelLinks = () => (
  <Icon>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Icon>
)

export const IconHaken = () => (
  <Icon>
    <path d="M5 12.5 10 17.5 19 6.5" />
  </Icon>
)

export const IconPfeilRechts = () => (
  <Icon>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </Icon>
)

export const IconProjekte = () => (
  <Icon>
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2l2 2.4h8.8A1.5 1.5 0 0 1 21 9.9v8.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
  </Icon>
)

export const IconNeu = () => (
  <Icon>
    <path d="M13.5 3.5H6.8c-.7 0-1.3.6-1.3 1.3v14.4c0 .7.6 1.3 1.3 1.3h10.4c.7 0 1.3-.6 1.3-1.3V8.5z" />
    <path d="M13.5 3.5v5h5" />
    <path d="M12 11.5v6M9 14.5h6" />
  </Icon>
)

export const IconSpeichern = () => (
  <Icon>
    <path d="M4.5 6.3c0-1 .8-1.8 1.8-1.8h9l4.2 4.2v9c0 1-.8 1.8-1.8 1.8H6.3c-1 0-1.8-.8-1.8-1.8z" />
    <path d="M8 4.5v5h6.5v-5" />
    <rect x="8" y="13" width="8" height="6.5" rx="1" />
  </Icon>
)

export const IconUhr = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.3l3.4 2" />
  </Icon>
)

export const IconDrucken = () => (
  <Icon>
    <path d="M7.5 8.5v-4h9v4" />
    <path d="M7.5 17.5h-2A1.5 1.5 0 0 1 4 16v-4.5A1.5 1.5 0 0 1 5.5 10h13a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 1-1.5 1.5h-2" />
    <rect x="7.5" y="14" width="9" height="6" rx="1" />
  </Icon>
)

export const IconSicherung = () => (
  <Icon>
    <path d="M12 3.5 19.5 6v6c0 4.2-3 7.3-7.5 8.5C7.5 19.3 4.5 16.2 4.5 12V6z" />
    <path d="M9 12.2 11.3 14.5 15.5 10" />
  </Icon>
)

export const IconSchere = () => (
  <Icon>
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="18" r="2.5" />
    <path d="M8.3 16.2 18 4M15.7 16.2 6 4" />
  </Icon>
)

export const IconKopieren = () => (
  <Icon>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
    <path d="M15.5 5.5v-1a1 1 0 0 0-1-1H5.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h1" />
  </Icon>
)

export const IconEinfuegen = () => (
  <Icon>
    <path d="M9 5H7a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 17 5h-2" />
    <rect x="9" y="3" width="6" height="3.5" rx="1" />
    <path d="M9 12.5h6M9 16h4" />
  </Icon>
)

export const IconAllesAuswaehlen = () => (
  <Icon>
    <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
    <rect x="8" y="8" width="8" height="8" rx="1" />
  </Icon>
)

export const IconAuswahlAufheben = () => (
  <Icon>
    <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
    <path d="M9.5 9.5 14.5 14.5M14.5 9.5 9.5 14.5" />
  </Icon>
)

export const IconAutomatischAnordnen = () => (
  <Icon>
    <rect x="9" y="3.5" width="6" height="4.5" rx="1" />
    <rect x="3.5" y="16" width="6" height="4.5" rx="1" />
    <rect x="14.5" y="16" width="6" height="4.5" rx="1" />
    <path d="M12 8v4M6.5 16v-4h11v4" />
  </Icon>
)

export const IconZeichenflaeche = () => (
  <Icon>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.4" />
    <rect x="6.5" y="7.5" width="11" height="9" rx="0.8" strokeDasharray="2.5 2.5" />
    <path d="M6.5 11.5h-3M17.5 11.5h3" strokeDasharray="2 2" />
  </Icon>
)

export const IconHintergrundLaden = () => (
  <Icon>
    <path d="M20.5 10.5V6a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 6v12A1.5 1.5 0 0 0 5 19.5h6" />
    <path d="M3.5 13.5 8 9.5l3 2.6" />
    <path d="M17.5 13v7M14.5 17l3 3 3-3" />
  </Icon>
)

export const IconBeschriftung = () => (
  <Icon>
    <path d="M3.5 17.5 8 6.5l4.5 11" />
    <path d="M5.2 13.8h5.6" />
    <path d="M15.5 17.5V9.5M15.5 9.5h5M15.5 13.5h4" />
  </Icon>
)

const MiniKomponente = () => (
  <>
    <rect x="3" y="9" width="8" height="8" rx="1.2" />
    <path d="M5.5 6.5V9M8.5 6.5V9M5.5 17v2.5M8.5 17v2.5" />
  </>
)
const MiniLeitung = () => (
  <>
    <path d="M3.5 18h2.5l4-11h2" />
    <circle cx="3.5" cy="18" r="1.2" />
  </>
)
const MiniTrunk = () => (
  <>
    <path d="M2.5 9.5h10M2.5 15.5h10" />
    <rect x="5.5" y="7" width="4" height="11" rx="1" />
  </>
)
const MarkeA = () => <path d="M13.8 17.5 17.25 8.5l3.45 9M15.1 14.3h4.3" />
const MarkeAuge = () => (
  <>
    <path d="M13.5 12.5c1.6-2.6 3.1-3.8 4-3.8s2.4 1.2 4 3.8c-1.6 2.6-3.1 3.8-4 3.8s-2.4-1.2-4-3.8z" />
    <circle cx="17.5" cy="12.5" r="1.2" />
  </>
)
const MarkeText = () => <path d="M14.5 8.5h6.5M14.5 12h6.5M14.5 15.5h4.5" />

export const IconAnzeigeBezeichnung = () => (
  <Icon>
    <MiniKomponente />
    <MarkeA />
  </Icon>
)

export const IconAnzeigeBeschriftung = () => (
  <Icon>
    <MiniKomponente />
    <MarkeText />
  </Icon>
)

export const IconAnzeigeInstallationshoehe = () => (
  <Icon>
    <MiniKomponente />
    <path d="M17.5 5.5v13M15.8 7.2l1.7-1.7 1.7 1.7M15.8 16.8l1.7 1.7 1.7-1.7M14.5 20.5h6" />
  </Icon>
)

export const IconAnzeigeLeitungsnummer = () => (
  <Icon>
    <MiniLeitung />
    <path d="M16.5 8l-1 9.5M20 8l-1 9.5M14.2 11h7M13.8 14.5h7" />
  </Icon>
)

export const IconAnzeigeLeitungstyp = () => (
  <Icon>
    <MiniLeitung />
    <circle cx="17.5" cy="12.5" r="4" />
    <circle cx="16" cy="11.6" r="0.7" />
    <circle cx="19" cy="11.6" r="0.7" />
    <circle cx="17.5" cy="14.2" r="0.7" />
  </Icon>
)

export const IconAnzeigeLeitungsbeschreibung = () => (
  <Icon>
    <MiniLeitung />
    <MarkeText />
  </Icon>
)

export const IconAnzeigeTrunkname = () => (
  <Icon>
    <MiniTrunk />
    <MarkeA />
  </Icon>
)

export const IconAnzeigeTrunkbeschreibung = () => (
  <Icon>
    <MiniTrunk />
    <MarkeText />
  </Icon>
)

export const IconAnzeigeRaumname = () => (
  <Icon>
    <path d="M9 20H3V4h18v16h-6" />
    <path d="M8.5 16.5 12 7.5l3.5 9M9.8 13.3h4.4" />
  </Icon>
)

export const IconAnzeigeRaumflaeche = () => (
  <Icon>
    <path d="M9 20H3V4h18v16h-6" />
    <path d="M4.5 9.5l4-4M4.5 15.5l10-10M7.5 18.5l12-12M13.5 18.5l6-6" />
  </Icon>
)

export const IconAnzeigePotentialname = () => (
  <Icon>
    <path d="M3 21v-8h8" />
    <path d="M13 3.5v6.5h3.5M19.5 4.8l1.5-1.3v6.5" />
  </Icon>
)

export const IconAnzeigeKennzeichen = () => (
  <Icon>
    <rect x="3" y="7" width="5" height="10" rx="0.8" />
    <path d="M10.5 12h3M16 7v10M16 7h5M16 12h4" />
  </Icon>
)

export const IconAnzeigeAbgaenge = () => (
  <Icon>
    <path d="M7 3v11M4.5 11.5 7 14l2.5-2.5" />
    <path d="M11 16h10M11 20h7M4 20h3" />
  </Icon>
)

export const IconAnzeigeStromkreis = () => (
  <Icon>
    <rect x="3" y="3" width="8" height="8" rx="0.8" />
    <path d="M7 11v3M15 4v16M13 8h4v8h-4z" />
  </Icon>
)

export const IconAnzeigeStromkreisSchild = () => (
  <Icon>
    <path d="M3 18h6M9 15h6v6H9z" />
    <path d="M19 3v18M17 8h4v8h-4z" />
  </Icon>
)

export const IconAnzeigeLeitungen = () => (
  <Icon>
    <MiniLeitung />
    <MarkeAuge />
  </Icon>
)

export const IconAnzeigeTrunks = () => (
  <Icon>
    <MiniTrunk />
    <MarkeAuge />
  </Icon>
)

export const IconAnzeigeWirkverbindungen = () => (
  <Icon>
    <rect x="3" y="15" width="6" height="6" rx="1.1" />
    <rect x="15" y="3" width="6" height="6" rx="1.1" />
    <path d="M9.4 14.6 14.6 9.4" strokeDasharray="2.4 2.2" />
  </Icon>
)

export const IconBlattverwaltung = () => (
  <Icon>
    <rect x="3.5" y="6.5" width="12" height="13" rx="1.4" />
    <path d="M7 4.5h10.5a1.5 1.5 0 0 1 1.5 1.5v10.5" />
  </Icon>
)

export const IconEbenen = () => (
  <Icon>
    <path d="M12 3 4 8l8 5 8-5z" />
    <path d="M4 12l8 5 8-5" />
    <path d="M4 16l8 5 8-5" />
  </Icon>
)

export const IconSchlossOffen = () => (
  <Icon>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 7-3.5" />
  </Icon>
)

export const IconSchlossZu = () => (
  <Icon>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
)

export const IconZoomRein = () => (
  <Icon>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 20.5 20.5" />
    <path d="M10.5 7.8v5.4M7.8 10.5h5.4" />
  </Icon>
)

export const IconZoomRaus = () => (
  <Icon>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 20.5 20.5" />
    <path d="M7.8 10.5h5.4" />
  </Icon>
)

export const IconZoomAlles = () => (
  <Icon>
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
    <path d="M9.5 14.5 14.5 9.5M14.5 9.5h-3M14.5 9.5v3" />
  </Icon>
)

export const IconZoom100 = () => (
  <Icon>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 20.5 20.5" />
    <path d="M8 9.2 9.3 8.3v4.6M12 12.9V8.3h1.9" strokeWidth="1.3" />
  </Icon>
)

export const IconVollbild = () => (
  <Icon>
    <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
  </Icon>
)

export const IconDreid = () => (
  <Icon>
    <path d="M12 3.5l7.5 4.25v8.5L12 20.5l-7.5-4.25v-8.5z" />
    <path d="M4.5 7.75L12 12l7.5-4.25M12 12v8.5" />
  </Icon>
)

export const IconSeitenleiste = () => (
  <Icon>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M9.5 4.5v15" />
  </Icon>
)

export const IconEigenschaftenPanel = () => (
  <Icon>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M14.5 4.5v15" />
  </Icon>
)

export const IconKontextleiste = () => (
  <Icon>
    <rect x="3.5" y="6.5" width="13" height="10" rx="2" />
    <path d="M7 11.5h6" />
    <path d="m14 14 6 2.5-2.6 1 -1 2.6z" />
  </Icon>
)

export const IconAbdocken = () => (
  <Icon>
    <path d="M14 4h6v6" />
    <path d="M20 4 12 12" />
    <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
  </Icon>
)

export const IconExternOeffnen = () => (
  <Icon>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </Icon>
)

export const IconAndocken = () => (
  <Icon>
    <path d="M10 20H4v-6" />
    <path d="M4 20 12 12" />
    <path d="M6 11V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
  </Icon>
)

export const IconKatalog = () => (
  <Icon>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.8 1.8 0 0 0-1.8-1.5H4z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.8 1.8 0 0 1 1.8-1.5H20z" />
  </Icon>
)

export const IconKomponenteNeu = () => (
  <Icon>
    <rect x="4" y="4" width="8.5" height="8.5" rx="1.3" />
    <path d="M4 16.5h8.5M8.25 12.5v8" />
    <path d="M17.5 13.5v7M14 17h7" />
  </Icon>
)

export const IconEinstellungen = () => (
  <Icon>
    <path d="M9.93 5.31 10.44 2.93h3.12l.51 2.38 1.2.5 2.04-1.32 2.2 2.2-1.32 2.04.5 1.2 2.38.51v3.12l-2.38.51-.5 1.2 1.32 2.04-2.2 2.2-2.04-1.32-1.2.5-.51 2.38h-3.12l-.51-2.38-1.2-.5-2.04 1.32-2.2-2.2 1.32-2.04-.5-1.2-2.38-.51v-3.12l2.38-.51.5-1.2-1.32-2.04 2.2-2.2 2.04 1.32z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const IconTastatur = () => (
  <Icon>
    <rect x="2.5" y="6.5" width="19" height="11" rx="1.6" />
    <path d="M6 10h.01M9.2 10h.01M12.4 10h.01M15.6 10h.01M18.8 10h.01M6 13h.01M18.8 13h.01" />
    <path d="M8.5 14.5h7" />
  </Icon>
)

export const IconAbspielen = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10.2 8.8l5.4 3.2-5.4 3.2z" />
  </Icon>
)

export const IconBuch = () => (
  <Icon>
    <path d="M12 6.5C10.4 5.2 8.4 4.5 6 4.5H3.5v13H6c2.4 0 4.4.7 6 2" />
    <path d="M12 6.5c1.6-1.3 3.6-2 6-2h2.5v13H18c-2.4 0-4.4.7-6 2z" />
    <path d="M12 6.5v13" />
  </Icon>
)

export const IconInfo = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <path d="M12 7.8h.01" />
  </Icon>
)

export const IconParagraf = () => (
  <Icon>
    <path d="M13.5 3.5H6.8c-.7 0-1.3.6-1.3 1.3v14.4c0 .7.6 1.3 1.3 1.3h10.4c.7 0 1.3-.6 1.3-1.3V8.5z" />
    <path d="M13.5 3.5v5h5" />
    <path d="M8.5 12.5h7M8.5 16h4.5" />
  </Icon>
)

export const IconFehlerprotokoll = () => (
  <Icon>
    <path d="M13.5 3.5H6.8c-.7 0-1.3.6-1.3 1.3v14.4c0 .7.6 1.3 1.3 1.3h10.4c.7 0 1.3-.6 1.3-1.3V8.5z" />
    <path d="M13.5 3.5v5h5" />
    <path d="M12 11v3.2" />
    <path d="M12 16.8h.01" />
  </Icon>
)

export const IconLizenzsiegel = () => (
  <Icon>
    <circle cx="12" cy="9" r="5.5" />
    <path d="M9.9 9.1 11.3 10.5 14.1 7.7" />
    <path d="M8.7 13.6 7.6 20.5 12 18.3l4.4 2.2-1.1-6.9" />
  </Icon>
)

export const IconFeedback = () => (
  <Icon>
    <path d="M4 5.5h16v10.5H9.5L5.5 20v-4H4z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </Icon>
)

export const LogoMarke = () => (
  <svg
    className="kopfzeile-logo"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--akzent)" />
    <path
      d="M6.5 16.5h4l3-7h4"
      stroke="var(--akzent-kontrast)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6.5" cy="16.5" r="1.8" fill="var(--akzent-kontrast)" />
    <circle cx="17.5" cy="9.5" r="1.8" fill="var(--akzent-kontrast)" />
  </svg>
)

export const IconSuche = () => (
  <Icon>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 20.5 20.5" />
  </Icon>
)

export const IconPapierkorb = () => (
  <Icon>
    <path d="M4.5 6.5h15" />
    <path d="M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 19c.05.8.7 1.4 1.5 1.4h6.2c.8 0 1.45-.6 1.5-1.4l.9-12.5" />
    <path d="M10.3 10v6.5M13.7 10v6.5" />
  </Icon>
)

export const IconImport = () => (
  <Icon>
    <path d="M12 3.5v10.5" />
    <path d="M8 10.5 12 14.5l4-4" />
    <path d="M4.5 16v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
  </Icon>
)

export const IconExport = () => (
  <Icon>
    <path d="M12 14.5V4" />
    <path d="M8 8 12 4l4 4" />
    <path d="M4.5 16v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3" />
  </Icon>
)

export const IconArchiv = () => (
  <Icon>
    <rect x="3.5" y="4" width="17" height="4.5" rx="1.2" />
    <path d="M5.5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5" />
    <path d="M10 12h4" />
  </Icon>
)

export const IconStift = () => (
  <Icon>
    <path d="M4.5 19.5h3.2L18.4 8.8a1.7 1.7 0 0 0 0-2.4l-.8-.8a1.7 1.7 0 0 0-2.4 0L4.5 16.3z" />
    <path d="M14 7.2 16.8 10" />
  </Icon>
)

export const IconWiederherstellen = () => (
  <Icon>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" />
    <path d="M4 4v4h4" />
  </Icon>
)

export const IconDokZeichnung = () => (
  <Icon>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M3.5 12.5h6.5V19.5" />
    <path d="M14 4.5V9h6.5" />
  </Icon>
)

export const IconDokPdf = () => (
  <Icon>
    <path d="M13.5 3.5H6.8c-.7 0-1.3.6-1.3 1.3v14.4c0 .7.6 1.3 1.3 1.3h10.4c.7 0 1.3-.6 1.3-1.3V8.5z" />
    <path d="M13.5 3.5v5h5" />
    <path d="M8.5 13.5h7M8.5 16.5h4.5" />
  </Icon>
)

export const IconDokNotiz = () => (
  <Icon>
    <rect x="4.5" y="4" width="15" height="16" rx="1.6" />
    <path d="M8 8.5h8M8 12h8M8 15.5h4.5" />
  </Icon>
)

export const IconDokExcel = () => (
  <Icon>
    <rect x="4.5" y="4" width="15" height="16" rx="1.6" />
    <path d="M4.5 9.5h15M9.7 9.5v10.5M14.3 9.5v10.5" />
  </Icon>
)

export const IconLeereListe = () => (
  <svg
    className="icon"
    viewBox="0 0 24 24"
    width="40"
    height="40"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5h4.2l2 2.4h8.8A1.5 1.5 0 0 1 21 9.9v8.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
    <path d="M7.5 16h3l2-4h4" strokeDasharray="2 2" />
  </svg>
)

export const IconSymbolleiste = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="16" rx="1.6" />
    <path d="M3 8h18" />
    <path d="M6 11.5h2.5M10.8 11.5h2.5M15.5 11.5h2.5" strokeWidth="2.2" />
  </Icon>
)

export const IconAnpassen = () => (
  <Icon>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Icon>
)

export const IconZeichnungImport = () => (
  <Icon>
    <path d="M11 4.5H5A1.5 1.5 0 0 0 3.5 6v12A1.5 1.5 0 0 0 5 19.5h14a1.5 1.5 0 0 0 1.5-1.5v-6" />
    <path d="M3.5 13h6v6.5" />
    <path d="M20.5 3.5 14 10M14 5.5V10h4.5" />
  </Icon>
)

export const IconZeichnungExport = () => (
  <Icon>
    <path d="M11 4.5H5A1.5 1.5 0 0 0 3.5 6v12A1.5 1.5 0 0 0 5 19.5h14a1.5 1.5 0 0 0 1.5-1.5v-6" />
    <path d="M3.5 13h6v6.5" />
    <path d="M14 10l6.5-6.5M16 3.5h4.5V8" />
  </Icon>
)

export const IconPlanExport = () => (
  <Icon>
    <path d="M17 10V8.5l-5-5H5.8c-.7 0-1.3.6-1.3 1.3v14.4c0 .7.6 1.3 1.3 1.3h9.9c.7 0 1.3-.6 1.3-1.3v-1.2" />
    <path d="M12 3.5v5h5" />
    <path d="M9.5 14h11M17.5 11l3 3-3 3" />
  </Icon>
)

export const IconExcelExport = () => (
  <Icon>
    <path d="M14 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4h11A1.5 1.5 0 0 1 18 5.5V11" />
    <path d="M4 9h14M9 9v11M13.5 9v5" />
    <path d="M16 18h5.5M19 15.5l2.5 2.5-2.5 2.5" />
  </Icon>
)

export const IconKatalogImport = () => (
  <Icon>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.8 1.8 0 0 0-1.8-1.5H4z" />
    <path d="M12 6a2 2 0 0 1 2-2h1.5M20 13.5v4H13.8A1.8 1.8 0 0 0 12 19" />
    <path d="M19 3v7M16.5 7.5 19 10l2.5-2.5" />
  </Icon>
)

export const IconKabeltypen = () => (
  <Icon>
    <circle cx="10" cy="11" r="7" />
    <circle cx="10" cy="11" r="2" />
    <path d="M10 4a7 7 0 0 1 7 7" strokeDasharray="1.5 2" />
    <path d="M17 11v5.5a2.5 2.5 0 0 0 2.5 2.5H21" />
  </Icon>
)

export const IconInstallationszonen = () => (
  <Icon>
    <path d="M4 3.5h16M4 20.5h16" />
    <path d="M6 7h12M6 12h12M6 17h12" strokeDasharray="2 2" />
  </Icon>
)

export const IconHintergrundLoeschen = () => (
  <Icon>
    <path d="M13 19H5a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5V12" />
    <path d="M3.5 15 8.5 10.5l3.5 3 2.5-2.2" />
    <path d="M16 15.5l5 5M21 15.5l-5 5" />
  </Icon>
)

export const IconHintergrundUmwandeln = () => (
  <Icon>
    <path d="M3.5 13V5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v3" strokeDasharray="2.2 1.8" />
    <path d="M6 10.5h5M11 8l2.5 2.5L11 13" />
    <path d="M9 20.5l11-6" />
    <rect x="7.5" y="19" width="3" height="3" />
    <rect x="18.5" y="13" width="3" height="3" />
  </Icon>
)

export const IconAusblendungenListe = () => (
  <Icon>
    <path d="M13 19H4a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4 5h13a1.5 1.5 0 0 1 1.5 1.5V11" />
    <rect x="6" y="8.5" width="6.5" height="6" rx="0.8" strokeDasharray="2 2" />
    <path d="M15.5 14.5h6M15.5 17.5h6M15.5 20.5h6" />
  </Icon>
)

export const IconNullpunktAlle = () => (
  <Icon>
    <path d="M7.5 3.5h12a1 1 0 0 1 1 1v12" />
    <rect x="3.5" y="7.5" width="13" height="13" rx="1.2" />
    <circle cx="10" cy="14" r="3" />
    <path d="M10 11a3 3 0 0 1 3 3h-3z" fill="currentColor" stroke="none" />
    <path d="M10 17a3 3 0 0 1-3-3h3z" fill="currentColor" stroke="none" />
  </Icon>
)

export const IconNullpunktAufheben = () => (
  <Icon>
    <circle cx="12" cy="12" r="5.5" />
    <path d="M12 6.5A5.5 5.5 0 0 1 17.5 12H12z" fill="currentColor" stroke="none" />
    <path d="M12 17.5A5.5 5.5 0 0 1 6.5 12H12z" fill="currentColor" stroke="none" />
    <path d="M4 4l16 16" strokeWidth="2" />
  </Icon>
)

export const IconWerkzeugSchluessel = () => (
  <Icon>
    <path d="M14.5 4.2a4.5 4.5 0 0 0-4.8 6.1L3.8 16.2a1.6 1.6 0 0 0 0 2.3l1.7 1.7a1.6 1.6 0 0 0 2.3 0l5.9-5.9a4.5 4.5 0 0 0 6.1-4.8l-2.9 2.9-2.8-.6-.6-2.8z" />
  </Icon>
)

export const IconEinstellungenSichern = () => (
  <Icon>
    <path d="M3.5 13h4.5M12 13h3.5M3.5 19h2M9.5 19h6" />
    <circle cx="10" cy="13" r="2" />
    <circle cx="7.5" cy="19" r="2" />
    <path d="M14 10l6.5-6.5M16 3.5h4.5V8" />
  </Icon>
)

export const IconEinstellungenEinspielen = () => (
  <Icon>
    <path d="M3.5 13h4.5M12 13h3.5M3.5 19h2M9.5 19h6" />
    <circle cx="10" cy="13" r="2" />
    <circle cx="7.5" cy="19" r="2" />
    <path d="M20.5 3.5 14 10M14 5.5V10h4.5" />
  </Icon>
)

export const IconZusatzmodul = () => (
  <Icon>
    <path d="M5 8h3.5a2 2 0 1 1 4 0H16v3.5a2 2 0 1 1 0 4V19H12.5a2 2 0 1 0-4 0H5v-3.5a2 2 0 1 0 0-4z" />
  </Icon>
)
