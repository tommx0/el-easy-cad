import type { Tool } from '../tool'
import { erzeugeAuswahlTool } from './select-tool'
import { erzeugePunktTool } from './point-tool'
import { erzeugeLinienTool } from './line-tool'
import { erzeugePolylinienTool } from './polyline-tool'
import { erzeugeRechteckTool } from './rectangle-tool'
import { erzeugeKreisTool } from './circle-tool'
import { erzeugeBogenTool } from './arc-tool'
import { erzeugeEllipseTool } from './ellipse-tool'
import { erzeugePolygonTool } from './polygon-tool'
import { erzeugeTextTool } from './text-tool'
import { erzeugeBemassungTool } from './dimension-tool'
import { erzeugeBemassungsreiheTool } from './bemassungsreihe-tool'
import { erzeugeSchraffurTool } from './hatch-tool'
import { erzeugeTrimTool } from './trim-tool'
import { erzeugeWandTeilenTool } from './wand-teilen-tool'
import { erzeugeTeilstueckZoneTool } from './teilstueck-zone-tool'
import { erzeugeKalibrierenTool } from './calibrate-tool'
import { erzeugeHintergrundAusblendenTool } from './hintergrund-ausblenden-tool'
import { erzeugeErkennungsProbeTool } from './erkennung-probe-tool'
import { erzeugeIfcAusrichtenTool } from './ifc-ausrichten-tool'
import { erzeugeIfcBauteileVorschauTool } from './ifc-bauteile-vorschau-tool'
import { erzeugeZeichenflaecheTool } from './zeichenflaeche-tool'
import { erzeugeZoomFensterTool } from './zoom-window-tool'
import { erzeugeZusatzmodulAbfrageTool } from './zusatzmodul-abfrage-tool'
import { erzeugeKomponentenTool } from './component-tool'
import { erzeugeLeitungTool } from './leitung-tool'
import { erzeugeSchaltverbindungTool } from './schaltverbindung-tool'
import { erzeugeTrunkTool } from './trunk-tool'
import { erzeugeWirkverbindungTool } from './wirkverbindung-tool'
import { erzeugeKabelschachtTool } from './kabelschacht-tool'
import { erzeugeStuecklistenTool } from './stueckliste-tool'
import { erzeugeLeitungslistenTool } from './leitungsliste-tool'
import { erzeugePatchpanelplanTool, erzeugeSwitchplanTool } from './switchplan-tool'
import { erzeugeTrunklistenTool } from './trunkliste-tool'
import { erzeugeRaumlistenTool } from './raumliste-tool'
import { erzeugeBetriebsmittellistenTool } from './betriebsmittelliste-tool'
import { erzeugeStromkreisverzeichnisTool } from './stromkreisverzeichnis-tool'
import { erzeugeAktorkanallistenTool } from './aktorkanalliste-tool'
import { erzeugePotentialTool } from './potential-tool'
import { erzeugePotentiallistenTool } from './potentialliste-tool'
import { erzeugeSteuerungslogikTool } from './steuerungslogik-tool'
import { erzeugeLeitungsbaumTool } from './leitungsbaum-tool'
import { erzeugePlankopfTool } from './plankopf-tool'
import { erzeugeNullpunktTool } from './nullpunkt-tool'
import { erzeugeWandTool } from './wand-tool'
import { erzeugeWandRechteckTool } from './wand-rechteck-tool'
import { erzeugeTuerTool } from './tuer-tool'
import { erzeugeFensterTool } from './fenster-tool'
import { erzeugeWanddurchbruchTool } from './wanddurchbruch-tool'
import { erzeugeRaumTool } from './raum-tool'
import { erzeugeTreppeTool } from './treppe-tool'
import { erzeugeBodenplatteRechteckTool, erzeugeBodenplatteTool } from './bodenplatte-tool'

export function erzeugeStandardWerkzeuge(): Tool[] {
  return [
    erzeugeAuswahlTool(),
    erzeugeLinienTool(),
    erzeugePolylinienTool(),
    erzeugeRechteckTool(),
    erzeugeWandTool(),
    erzeugeWandRechteckTool(),
    erzeugeTuerTool(),
    erzeugeFensterTool(),
    erzeugeWanddurchbruchTool(),
    erzeugeRaumTool(),
    erzeugeTreppeTool(),
    erzeugeBodenplatteTool(),
    erzeugeBodenplatteRechteckTool(),
    erzeugeKreisTool(),
    erzeugeBogenTool(),
    erzeugeEllipseTool(),
    erzeugePolygonTool(),
    erzeugePunktTool(),
    erzeugeKomponentenTool(),
    erzeugeKomponentenTool('knx-aktor'),
    erzeugeLeitungTool(),
    erzeugeSchaltverbindungTool(),
    erzeugePotentialTool(),
    erzeugeTrunkTool(),
    erzeugeWirkverbindungTool(),
    erzeugeKabelschachtTool(),
    erzeugeStuecklistenTool(),
    erzeugeLeitungslistenTool(),
    erzeugeTrunklistenTool(),
    erzeugeRaumlistenTool(),
    erzeugeBetriebsmittellistenTool(),
    erzeugeStromkreisverzeichnisTool(),
    erzeugeAktorkanallistenTool(),
    erzeugePotentiallistenTool(),
    erzeugeSteuerungslogikTool(),
    erzeugeLeitungsbaumTool(),
    erzeugePlankopfTool(),
    erzeugeSwitchplanTool(),
    erzeugePatchpanelplanTool(),
    erzeugeTextTool(),
    erzeugeBemassungTool(),
    erzeugeBemassungsreiheTool('kette'),
    erzeugeBemassungsreiheTool('parallel'),
    erzeugeSchraffurTool(),
    erzeugeTrimTool(),
    erzeugeWandTeilenTool(),
    erzeugeTeilstueckZoneTool(),
    erzeugeKalibrierenTool(),
    erzeugeHintergrundAusblendenTool(),
    erzeugeErkennungsProbeTool(),
    erzeugeIfcAusrichtenTool(),
    erzeugeIfcBauteileVorschauTool(),
    erzeugeZeichenflaecheTool(),
    erzeugeNullpunktTool(),
  ]
}

export {
  erzeugeAuswahlTool,
  erzeugePunktTool,
  erzeugeKomponentenTool,
  erzeugeLeitungTool,
  erzeugeSchaltverbindungTool,
  erzeugePotentialTool,
  erzeugePotentiallistenTool,
  erzeugeTrunkTool,
  erzeugeWirkverbindungTool,
  erzeugeKabelschachtTool,
  erzeugeLinienTool,
  erzeugePolylinienTool,
  erzeugeRechteckTool,
  erzeugeWandTool,
  erzeugeWandRechteckTool,
  erzeugeTuerTool,
  erzeugeFensterTool,
  erzeugeWanddurchbruchTool,
  erzeugeRaumTool,
  erzeugeTreppeTool,
  erzeugeBodenplatteTool,
  erzeugeBodenplatteRechteckTool,
  erzeugeKreisTool,
  erzeugeBogenTool,
  erzeugeEllipseTool,
  erzeugePolygonTool,
  erzeugeTextTool,
  erzeugeBemassungTool,
  erzeugeBemassungsreiheTool,
  erzeugeSchraffurTool,
  erzeugeTrimTool,
  erzeugeWandTeilenTool,
  erzeugeKalibrierenTool,
  erzeugeHintergrundAusblendenTool,
  erzeugeErkennungsProbeTool,
  erzeugeZeichenflaecheTool,
  erzeugeZoomFensterTool,
  erzeugeZusatzmodulAbfrageTool,
}
export {
  ZUSATZMODUL_ABFRAGE_TOOL_ID,
  type ZusatzmodulAbfrageAuftrag,
  type ZusatzmodulAbfrageErgebnis,
  type ZusatzmodulAbfrageTool,
} from './zusatzmodul-abfrage-tool'
