export interface VideoSchritt {
  sekunde: number
  text: string
}

interface VideoDatei {
  dauerSekunden: number
  schritte: VideoSchritt[]
}

export interface Video {
  id: string
  titel: string
  beschreibung: string
  anker: string | null
  dauerSekunden: number
  schritte: VideoSchritt[]
  datei: string
  vorschau: string
}

const GEPLANT: ReadonlyArray<Omit<Video, 'dauerSekunden' | 'schritte' | 'datei' | 'vorschau'>> = [
  {
    id: '00-lets-start',
    titel: "Let's start",
    beschreibung: 'Vom leeren Projekt zur fertigen Zeichnung - der ganze Weg in einem Durchgang.',
    anker: null,
  },
  {
    id: '01-hintergrundplan',
    titel: 'Hintergrundplan einlesen und kalibrieren',
    beschreibung:
      'PDF einlesen, Seite und Ausschnitt wählen, mit einer bekannten Strecke auf Maß bringen.',
    anker: 'plan-einlesen',
  },
  {
    id: '02-waende',
    titel: 'Wände zeichnen',
    beschreibung: 'Wandzug mit mehreren Ecken, Wandstärke einstellen, Ecken verschmelzen.',
    anker: 'waende-zeichnen',
  },
  {
    id: '03-tueren-fenster',
    titel: 'Türen und Fenster einsetzen',
    beschreibung: 'Öffnungen in eine vorhandene Wand setzen, Breite und Anschlag ändern.',
    anker: 'tueren-und-fenster',
  },
  {
    id: '04-bauteile',
    titel: 'Bauteile platzieren',
    beschreibung:
      'Komponente im Katalog suchen, auf dem Plan platzieren, Installationshöhe setzen.',
    anker: 'komponente-platzieren',
  },
  {
    id: '05-leitungen',
    titel: 'Leitungen verbinden',
    beschreibung: 'Zwei Komponenten verbinden, Autorouting nutzen, eigene Stützpunkte setzen.',
    anker: 'leitung-zeichnen',
  },
  {
    id: '06-trunk',
    titel: 'Trunk zeichnen',
    beschreibung: 'Kabelbündel anlegen, Nummer und Eigenschaften einstellen.',
    anker: 'trunk-anlegen',
  },
  {
    id: '07-leitung-in-trunk',
    titel: 'Leitung in einen Trunk legen',
    beschreibung: 'Eine Leitung auf den Trunk führen und einlegen, den Trunkinhalt prüfen.',
    anker: 'leitung-in-trunk',
  },
  {
    id: '08-ueber-trunk-weiter',
    titel: 'Über den Trunk zu einer anderen Komponente',
    beschreibung:
      'Vom Trunk weiter zum Ziel - eine Leitungsnummer, eine Länge über den ganzen Weg.',
    anker: 'leitung-in-trunk',
  },
  {
    id: '09-wirkverbindung',
    titel: 'Wirkverbindung herstellen',
    beschreibung: 'Tastsensor auf den Verbraucher wirken lassen und in der Steuerungslogik prüfen.',
    anker: 'wirkverbindungen',
  },
  {
    id: '10-listen',
    titel: 'Listen und Plan-Einlagen',
    beschreibung: 'Stückliste, Leitungsliste und Switchplan einsetzen und nach Excel geben.',
    anker: 'stueckliste',
  },
  {
    id: '11-drucken',
    titel: 'Drucken und als PDF ausgeben',
    beschreibung: 'Die Zeichenfläche als festen Druckbereich ausgeben, im Maßstab.',
    anker: 'drucken',
  },
  {
    id: '12-kabelschacht-leitung',
    titel: 'Leitung über den Kabelschacht auf eine andere Etage',
    beschreibung:
      'Eine Leitung endet am Kabelschacht und wird auf dem nächsten Blatt fortgesetzt - eine durchgehende Leitung über zwei Etagen.',
    anker: 'kabelschacht',
  },
  {
    id: '13-kabelschacht-trunk',
    titel: 'Trunk über Etagen samt Leitung im Bündel',
    beschreibung:
      'Zwei Trunks werden über denselben Kabelschacht zu einer Kette verbunden, eine Leitung bleibt dabei bis in den Schacht im Bündel.',
    anker: 'kabelschacht',
  },
]

export const VIDEO_DATEIEN: Record<string, VideoDatei> = {}

export function baueVideos(
  dateien: Record<string, VideoDatei> = VIDEO_DATEIEN,
  geplant: ReadonlyArray<
    Omit<Video, 'dauerSekunden' | 'schritte' | 'datei' | 'vorschau'>
  > = GEPLANT,
): Video[] {
  const videos: Video[] = []
  for (const eintrag of geplant) {
    const datei = dateien[eintrag.id]
    if (!datei) continue
    videos.push({
      ...eintrag,
      dauerSekunden: datei.dauerSekunden,
      schritte: datei.schritte,
      datei: `handbuch/videos/${eintrag.id}.webm`,
      vorschau: `handbuch/videos/${eintrag.id}.jpg`,
    })
  }
  return videos
}

export const VIDEOS: Video[] = baueVideos()

export const GEPLANTE_VIDEO_IDS: readonly string[] = GEPLANT.map((v) => v.id)

export function videoZuId(id: string, videos: Video[] = VIDEOS): Video | null {
  return videos.find((v) => v.id === id) ?? null
}

export function videoZuAnker(anker: string, videos: Video[] = VIDEOS): Video | null {
  return videos.find((v) => v.anker === anker) ?? null
}

export function formatiereDauer(sekunden: number): string {
  const ganz = Math.max(0, Math.round(sekunden))
  return `${Math.floor(ganz / 60)}:${String(ganz % 60).padStart(2, '0')}`
}
