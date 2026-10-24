import type * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import type { Point } from '../document-model'
import type {
  BegehenBlick,
  BegehenEingabe,
  Szene,
  SzenenInfo,
  SzenenPrisma,
  SzenenQuader,
} from '../dreid'
import {
  aussenNormalen,
  blickAusRichtung,
  blickRichtung,
  DREHPUNKT_ABSTAND_METER,
  dreheBlick,
  einstiegsStandpunkt,
  istBewegung,
  istVorne,
  KEINE_BEWEGUNG,
  radSchritt,
  schritt,
} from '../dreid'
import type { HuellenNetz, IfcHuelle, Punkt3 } from '../ifc'
import { holeKatalogBild } from './katalog-bild-cache'
import { holeEingefaerbtesSymbol } from './symbol-einfaerbung'

export interface DreidDeckkraft {
  vorne: number
  hinten: number
  decken: number
}

export const STANDARD_DREID_DECKKRAFT: DreidDeckkraft = { vorne: 0.15, hinten: 1, decken: 0 }

export const STANDARD_DREID_SYMBOLGROESSE = 0.5

export type DreidModus = 'umkreisen' | 'begehen'

export interface DreidKamera {
  position: [number, number, number]
  ziel: [number, number, number]
  modus?: DreidModus
}

export interface DreidViewer {
  zeigeSzene(szene: Szene, kamera?: DreidKamera | null): void
  setzeSichtbareGeschosse(blattIds: ReadonlySet<string>): void
  setzeDeckkraft(deckkraft: DreidDeckkraft): void
  setzeSymbolgroesse(anteil: number): void
  zeigeHuelle(blattId: string, huelle: IfcHuelle): void
  ursprung(): Point
  treffer(x: number, y: number): SzenenInfo | null
  einpassen(): void
  setzeModus(modus: DreidModus): void
  modus(): DreidModus
  setzeBewegung(eingabe: BegehenEingabe, schnell: boolean): void
  kamera(): DreidKamera
  groesseAnpassen(breite: number, hoehe: number): void
  freigeben(): void
}

const KANTEN_FARBE = '#3c4043'
const HUELLE_FARBE = '#cfcac2'
const HUELLE_DECKKRAFT = 0.3

export async function erzeugeDreidViewer(canvas: HTMLCanvasElement): Promise<DreidViewer> {
  const [
    three,
    { OrbitControls: Orbit },
    { Line2 },
    { LineGeometry },
    { LineMaterial: LinienMat },
  ] = await Promise.all([
    import('three'),
    import('three/examples/jsm/controls/OrbitControls.js'),
    import('three/examples/jsm/lines/Line2.js'),
    import('three/examples/jsm/lines/LineGeometry.js'),
    import('three/examples/jsm/lines/LineMaterial.js'),
  ])

  const renderer = new three.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x000000, 0)
  const welt = new three.Scene()
  welt.add(new three.HemisphereLight(0xffffff, 0xb0b4ba, 2.2))
  const sonne = new three.DirectionalLight(0xffffff, 1.4)
  sonne.position.set(1, 2, 1.5)
  welt.add(sonne)

  const kamera = new three.PerspectiveCamera(45, 1, 0.05, 2000)
  const steuerung: OrbitControls = new Orbit(kamera, canvas)
  steuerung.enableDamping = false
  steuerung.screenSpacePanning = true

  let modus: DreidModus = 'umkreisen'
  let standpunkt: Punkt3 = { x: 0, y: 0, z: 0 }
  let blick: BegehenBlick = { gier: 0, neigung: 0 }
  let eingabe: BegehenEingabe = KEINE_BEWEGUNG
  let schnell = false
  let laufId: number | null = null
  let letzteZeit = 0
  let blickZeiger: { id: number; x: number; y: number } | null = null
  let geschossKoten = new Map<string, number>()

  let geschossGruppen = new Map<string, THREE.Group>()
  let inhalt = new three.Group()
  welt.add(inhalt)
  const linienMaterialien: LineMaterial[] = []
  const infos = new Map<THREE.Object3D, SzenenInfo>()
  const gebaeude = new Set<THREE.Object3D>()
  let breite = 1
  let hoehe = 1
  let u: Point | null = null
  let teile: { mesh: THREE.Mesh; art: SzenenPrisma['art']; normalen: Point[]; mitte: Point }[] = []
  const huellen = new Map<string, THREE.Group>()
  const huellenTeile = new Map<string, typeof teile>()
  const huellenObjekte = new Set<THREE.Object3D>()

  let schilder: { sprite: THREE.Sprite; breite: number; hoehe: number }[] = []
  const SCHILD_MINDEST_PX = 28
  const SCHILD_VORZUG_METER = 0.15
  const schildBasis = new Map<THREE.Sprite, THREE.Vector3>()

  let deckkraft: DreidDeckkraft = STANDARD_DREID_DECKKRAFT
  let symbolgroesse = STANDARD_DREID_SYMBOLGROESSE

  function gruppeVon(t: (typeof teile)[number], kameraGrundriss: Point): keyof DreidDeckkraft {
    if (t.art === 'decke') return 'decken'
    if (
      (t.art === 'wand' || t.art === 'oeffnung') &&
      istVorne(t.normalen, t.mitte, kameraGrundriss)
    )
      return 'vorne'
    return 'hinten'
  }

  function wendeDeckkraftAn() {
    const kameraGrundriss = { x: kamera.position.x + ux(), y: -kamera.position.z + uy() }
    for (const t of [...teile, ...[...huellenTeile.values()].flat()]) {
      const wert = deckkraft[gruppeVon(t, kameraGrundriss)]
      const material = t.mesh.material as THREE.MeshLambertMaterial
      const durchsichtig = wert < 1
      if (material.transparent !== durchsichtig) material.needsUpdate = true
      material.transparent = durchsichtig
      material.opacity = wert
      material.depthWrite = !durchsichtig
      t.mesh.visible = wert > 0
    }
  }

  function passeSchilderAn() {
    const proPixel = (2 * Math.tan(((kamera.fov / 2) * Math.PI) / 180)) / Math.max(hoehe, 1)
    for (const { sprite, breite: b, hoehe: h } of schilder) {
      const basis = schildBasis.get(sprite)
      if (basis) {
        const zurKamera = kamera.position.clone().sub(basis)
        const abstand = zurKamera.length()
        sprite.position
          .copy(basis)
          .addScaledVector(
            zurKamera,
            abstand > 0 ? Math.min(SCHILD_VORZUG_METER, abstand / 2) / abstand : 0,
          )
      }
      const mindest =
        sprite.position.distanceTo(kamera.position) * proPixel * SCHILD_MINDEST_PX * symbolgroesse
      const faktor = Math.max(symbolgroesse, mindest / Math.min(b, h))
      sprite.scale.set(b * faktor, h * faktor, 1)
    }
  }

  const zeichnen = () => {
    passeSchilderAn()
    wendeDeckkraftAn()
    renderer.render(welt, kamera)
  }
  steuerung.addEventListener('change', zeichnen)

  const ux = () => u?.x ?? 0
  const uy = () => u?.y ?? 0
  const nachThree = (x: number, y: number, z: number) => new three.Vector3(x - ux(), z, -(y - uy()))
  const nachModell = (v: THREE.Vector3): Punkt3 => ({ x: v.x + ux(), y: -v.z + uy(), z: v.y })

  function setzeBegehenKamera() {
    const r = blickRichtung(blick)
    kamera.position.copy(nachThree(standpunkt.x, standpunkt.y, standpunkt.z))
    kamera.lookAt(nachThree(standpunkt.x + r.x, standpunkt.y + r.y, standpunkt.z + r.z))
    zeichnen()
  }

  function stoppeBewegung() {
    eingabe = KEINE_BEWEGUNG
    if (laufId !== null) cancelAnimationFrame(laufId)
    laufId = null
    blickZeiger = null
  }

  function bewegungsSchritt(zeit: number) {
    const sekunden = Math.min(Math.max(zeit - letzteZeit, 0) / 1000, 0.1)
    letzteZeit = zeit
    standpunkt = schritt(standpunkt, blick, eingabe, sekunden, schnell)
    setzeBegehenKamera()
    laufId =
      modus === 'begehen' && istBewegung(eingabe) ? requestAnimationFrame(bewegungsSchritt) : null
  }

  function beginneBegehen() {
    modus = 'begehen'
    steuerung.enabled = false
    kamera.near = 0.05
    kamera.far = Math.max(kamera.far, 2000)
    kamera.updateProjectionMatrix()
    setzeBegehenKamera()
  }

  function beendeBegehen() {
    stoppeBewegung()
    modus = 'umkreisen'
    steuerung.enabled = true
  }

  function beiZeigerDruck(e: PointerEvent) {
    if (modus !== 'begehen' || blickZeiger) return
    blickZeiger = { id: e.pointerId, x: e.clientX, y: e.clientY }
    canvas.setPointerCapture(e.pointerId)
  }
  function beiZeigerBewegung(e: PointerEvent) {
    if (modus !== 'begehen' || blickZeiger?.id !== e.pointerId) return
    blick = dreheBlick(blick, e.clientX - blickZeiger.x, e.clientY - blickZeiger.y)
    blickZeiger = { id: e.pointerId, x: e.clientX, y: e.clientY }
    setzeBegehenKamera()
  }
  function beiZeigerEnde(e: PointerEvent) {
    if (blickZeiger?.id === e.pointerId) blickZeiger = null
  }
  function beiRad(e: WheelEvent) {
    if (modus !== 'begehen') return
    e.preventDefault()
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX
    const raster = e.deltaMode === 1 ? -delta / 3 : -delta / 100
    standpunkt = radSchritt(standpunkt, blick, raster, e.shiftKey)
    setzeBegehenKamera()
  }
  canvas.addEventListener('pointerdown', beiZeigerDruck)
  canvas.addEventListener('pointermove', beiZeigerBewegung)
  canvas.addEventListener('pointerup', beiZeigerEnde)
  canvas.addEventListener('pointercancel', beiZeigerEnde)
  canvas.addEventListener('wheel', beiRad, { passive: false })

  function mitteVon(szene: Szene): Point {
    let [x1, y1, x2, y2] = [Infinity, Infinity, -Infinity, -Infinity]
    const nimm = (p: { x: number; y: number }) => {
      x1 = Math.min(x1, p.x)
      y1 = Math.min(y1, p.y)
      x2 = Math.max(x2, p.x)
      y2 = Math.max(y2, p.y)
    }
    szene.quader.forEach((q) => nimm(q.mitte))
    szene.linien.forEach((l) => l.punkte.forEach(nimm))
    szene.prismen.forEach((p) => p.grundriss.forEach(nimm))
    szene.texte.forEach((t) => nimm(t.position))
    return Number.isFinite(x1) ? { x: (x1 + x2) / 2, y: (y1 + y2) / 2 } : { x: 0, y: 0 }
  }

  function gibFrei(o: THREE.Object3D) {
    o.traverse((teil) => {
      const m = teil as THREE.Mesh
      m.geometry?.dispose()
      const material = m.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(material)) material.forEach((x) => x.dispose())
      else {
        ;(material as THREE.SpriteMaterial | undefined)?.map?.dispose()
        material?.dispose()
      }
    })
  }

  function leeren() {
    for (const h of huellen.values()) h.removeFromParent()
    welt.remove(inhalt)
    gibFrei(inhalt)
    inhalt = new three.Group()
    welt.add(inhalt)
    geschossGruppen = new Map()
    linienMaterialien.length = 0
    infos.clear()
    gebaeude.clear()
    schilder = []
    schildBasis.clear()
    teile = []
  }

  function prisma(p: SzenenPrisma): THREE.Mesh | null {
    if (p.grundriss.length < 3 || p.hoehe <= 0) return null
    const form = new three.Shape(p.grundriss.map((q) => new three.Vector2(q.x - ux(), q.y - uy())))
    for (const loch of p.loecher ?? [])
      form.holes.push(new three.Path(loch.map((q) => new three.Vector2(q.x - ux(), q.y - uy()))))
    const geometrie = new three.ExtrudeGeometry(form, { depth: p.hoehe, bevelEnabled: false })
    const durchsichtig = p.deckkraft < 1
    const mesh = new three.Mesh(
      geometrie,
      new three.MeshLambertMaterial({
        color: p.farbe,
        transparent: durchsichtig,
        opacity: p.deckkraft,
        depthWrite: !durchsichtig,
        side: three.DoubleSide,
      }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = p.z
    mesh.add(
      new three.LineSegments(
        new three.EdgesGeometry(geometrie, 20),
        new three.LineBasicMaterial({ color: KANTEN_FARBE, transparent: true, opacity: 0.25 }),
      ),
    )
    return mesh
  }

  function schild(text: string): THREE.Sprite {
    const leinwand = document.createElement('canvas')
    const ctx = leinwand.getContext('2d')!
    const schrift = '600 28px system-ui, sans-serif'
    ctx.font = schrift
    const breitePx = Math.ceil(ctx.measureText(text).width) + 20
    leinwand.width = breitePx
    leinwand.height = 44
    ctx.font = schrift
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.fillRect(0, 0, leinwand.width, leinwand.height)
    ctx.fillStyle = '#3c4043'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 10, leinwand.height / 2)
    const textur = new three.CanvasTexture(leinwand)
    textur.colorSpace = three.SRGBColorSpace
    const sprite = new three.Sprite(
      new three.SpriteMaterial({ map: textur, sizeAttenuation: false, depthTest: false }),
    )
    const hoeheAnteil = 0.035
    sprite.scale.set((hoeheAnteil * leinwand.width) / leinwand.height, hoeheAnteil, 1)
    sprite.renderOrder = 10
    return sprite
  }

  let wartendeSchilder: { sprite: THREE.Sprite; q: SzenenQuader }[] = []

  const SCHILD_PX = 160

  function maleSchild(sprite: THREE.Sprite, q: SzenenQuader): boolean {
    const grafik = q.grafik!
    const material = sprite.material
    const leinwand = (material.map as THREE.CanvasTexture).image as HTMLCanvasElement
    const ctx = leinwand.getContext('2d')!
    const { width: w, height: h } = leinwand
    ctx.clearRect(0, 0, w, h)
    const bild = holeKatalogBild(grafik.bild, () => {
      wartendeSchilder = wartendeSchilder.filter((s) => !maleSchild(s.sprite, s.q))
      zeichnen()
    })
    const fertig = bild !== null && bild.naturalWidth > 0
    if (fertig) {
      const quelle =
        grafik.art === 'symbol' && grafik.einfaerben !== null
          ? (holeEingefaerbtesSymbol(bild, grafik.bild.assetId, grafik.einfaerben, w, h) ?? bild)
          : bild
      const breite = 'naturalWidth' in quelle ? quelle.naturalWidth : quelle.width
      const hoeheQ = 'naturalHeight' in quelle ? quelle.naturalHeight : quelle.height
      const faktor = Math.min(w / breite, h / hoeheQ)
      const zb = breite * faktor
      const zh = hoeheQ * faktor
      ctx.drawImage(quelle, (w - zb) / 2, (h - zh) / 2, zb, zh)
    }
    material.map!.needsUpdate = true
    return fertig
  }

  function geraeteSchild(q: SzenenQuader): THREE.Sprite {
    const seitenverhaeltnis = Math.max(q.breite, 0.01) / Math.max(q.tiefe, 0.01)
    const leinwand = document.createElement('canvas')
    leinwand.width = Math.round(SCHILD_PX * Math.min(seitenverhaeltnis, 4))
    leinwand.height = SCHILD_PX
    const textur = new three.CanvasTexture(leinwand)
    textur.colorSpace = three.SRGBColorSpace
    const sprite = new three.Sprite(new three.SpriteMaterial({ map: textur, transparent: true }))
    sprite.renderOrder = 5
    const schildBreite = Math.max(q.breite, 0.05)
    const schildHoehe = Math.max(q.tiefe, 0.05)
    sprite.scale.set(schildBreite, schildHoehe, 1)
    schilder.push({ sprite, breite: schildBreite, hoehe: schildHoehe })
    sprite.position.copy(nachThree(q.mitte.x, q.mitte.y, q.z + q.hoehe / 2))
    schildBasis.set(sprite, sprite.position.clone())
    if (!maleSchild(sprite, q)) wartendeSchilder.push({ sprite, q })
    return sprite
  }

  function huellenMesh(netz: HuellenNetz): THREE.Mesh | null {
    if (netz.indizes.length === 0) return null
    const geometrie = new three.BufferGeometry()
    geometrie.setAttribute('position', new three.BufferAttribute(netz.positionen, 3))
    geometrie.setIndex(new three.BufferAttribute(netz.indizes, 1))
    geometrie.computeVertexNormals()
    return new three.Mesh(
      geometrie,
      new three.MeshLambertMaterial({
        color: HUELLE_FARBE,
        transparent: true,
        opacity: HUELLE_DECKKRAFT,
        depthWrite: false,
        side: three.DoubleSide,
      }),
    )
  }

  function gruppeFuer(blattId: string) {
    let g = geschossGruppen.get(blattId)
    if (!g) {
      g = new three.Group()
      geschossGruppen.set(blattId, g)
      inhalt.add(g)
    }
    return g
  }

  function einpassen() {
    if (modus === 'begehen') beendeBegehen()
    const box = new three.Box3()
    for (const g of geschossGruppen.values()) {
      if (!g.visible) continue
      g.updateWorldMatrix(true, true)
      g.traverseVisible((o) => {
        if (o instanceof three.Sprite) {
          box.expandByPoint(o.getWorldPosition(new three.Vector3()))
          return
        }
        const geometrie = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined
        if (!geometrie) return
        if (!geometrie.boundingBox) geometrie.computeBoundingBox()
        box.union(geometrie.boundingBox!.clone().applyMatrix4(o.matrixWorld))
      })
    }
    if (box.isEmpty()) box.set(new three.Vector3(-5, 0, -5), new three.Vector3(5, 3, 5))
    const mitte = box.getCenter(new three.Vector3())
    const radius = Math.max(box.getSize(new three.Vector3()).length() / 2, 1)
    const abstand = radius / Math.sin(((kamera.fov / 2) * Math.PI) / 180)
    const richtung = new three.Vector3(0.6, 0.7, 1).normalize()
    kamera.position.copy(mitte.clone().add(richtung.multiplyScalar(abstand)))
    kamera.near = Math.max(abstand / 1000, 0.01)
    kamera.far = abstand * 20
    kamera.updateProjectionMatrix()
    steuerung.target.copy(mitte)
    steuerung.update()
    zeichnen()
  }

  return {
    zeigeSzene(szene, gemerkt) {
      leeren()
      u ??= mitteVon(szene)
      geschossKoten = new Map(szene.geschosse.map((g) => [g.blattId, g.kote]))
      for (const g of szene.geschosse) gruppeFuer(g.blattId)
      for (const [blattId, h] of huellen) gruppeFuer(blattId).add(h)

      wartendeSchilder = []
      for (const q of szene.quader) {
        if (q.art === 'geraet' && q.grafik) {
          const sprite = geraeteSchild(q)
          infos.set(sprite, q.info)
          gruppeFuer(q.blattId).add(sprite)
          continue
        }
        const geometrie = new three.BoxGeometry(
          Math.max(q.breite, 0.005),
          Math.max(q.hoehe, 0.005),
          Math.max(q.tiefe, 0.005),
        )
        const durchsichtig = q.deckkraft < 1
        const mesh = new three.Mesh(
          geometrie,
          new three.MeshLambertMaterial({
            color: q.farbe,
            transparent: durchsichtig,
            opacity: q.deckkraft,
            depthWrite: !durchsichtig,
          }),
        )
        mesh.position.copy(nachThree(q.mitte.x, q.mitte.y, q.z + q.hoehe / 2))
        mesh.rotation.y = q.drehung
        const kanten = new three.LineSegments(
          new three.EdgesGeometry(geometrie),
          new three.LineBasicMaterial({
            color: KANTEN_FARBE,
            transparent: true,
            opacity: durchsichtig ? 0.25 : 0.5,
          }),
        )
        mesh.add(kanten)
        infos.set(mesh, q.info)
        gruppeFuer(q.blattId).add(mesh)
      }

      for (const l of szene.linien) {
        if (l.punkte.length < 2) continue
        const geometrie = new LineGeometry()
        geometrie.setPositions(
          l.punkte.flatMap((p) => {
            const v = nachThree(p.x, p.y, p.z)
            return [v.x, v.y, v.z]
          }),
        )
        const material = new LinienMat({ color: l.farbe, linewidth: l.breite })
        material.resolution.set(breite, hoehe)
        linienMaterialien.push(material)
        const linie = new Line2(geometrie, material)
        linie.computeLineDistances()
        infos.set(linie, l.info)
        gruppeFuer(l.blattId).add(linie)
      }

      for (const p of szene.prismen) {
        const mesh = prisma(p)
        if (!mesh) continue
        if (p.info) infos.set(mesh, p.info)
        gebaeude.add(mesh)
        const n = p.grundriss.length
        teile.push({
          mesh,
          art: p.art,
          normalen: p.aussenNormalen ?? [],
          mitte: {
            x: p.grundriss.reduce((s, q) => s + q.x, 0) / n,
            y: p.grundriss.reduce((s, q) => s + q.y, 0) / n,
          },
        })
        gruppeFuer(p.blattId).add(mesh)
      }

      for (const t of szene.texte) {
        const sprite = schild(t.text)
        sprite.position.copy(nachThree(t.position.x, t.position.y, t.position.z))
        gruppeFuer(t.blattId).add(sprite)
      }

      if (gemerkt?.modus === 'begehen') {
        const [x, y, z] = gemerkt.position
        standpunkt = { x, y, z }
        blick = blickAusRichtung(
          { x: gemerkt.ziel[0] - x, y: gemerkt.ziel[1] - y, z: gemerkt.ziel[2] - z },
          blick.gier,
        )
        beginneBegehen()
      } else if (gemerkt) {
        if (modus === 'begehen') beendeBegehen()
        kamera.position.copy(nachThree(...gemerkt.position))
        steuerung.target.copy(nachThree(...gemerkt.ziel))
        steuerung.update()
        zeichnen()
      } else {
        einpassen()
      }
    },

    zeigeHuelle(blattId, huelle) {
      const alt = huellen.get(blattId)
      if (alt) {
        alt.traverse((o) => huellenObjekte.delete(o))
        alt.removeFromParent()
        gibFrei(alt)
      }
      huellen.delete(blattId)
      huellenTeile.delete(blattId)
      const gruppe = new three.Group()
      gruppe.rotation.x = -Math.PI / 2
      const eigene: typeof teile = []

      const achsen = huelle.waende.map((w, i) =>
        w.achse
          ? { id: String(i), punkte: [w.achse.von, w.achse.bis], staerke: w.achse.staerke }
          : null,
      )
      const alleAchsen = achsen.filter((a): a is NonNullable<typeof a> => a !== null)
      huelle.waende.forEach((w, i) => {
        const mesh = huellenMesh(w.netz)
        if (!mesh) return
        const achse = achsen[i]
        eigene.push({
          mesh,
          art: 'wand',
          normalen: achse ? aussenNormalen(achse, alleAchsen) : [],
          mitte: w.achse
            ? {
                x: (w.achse.von.x + w.achse.bis.x) / 2 + ux(),
                y: (w.achse.von.y + w.achse.bis.y) / 2 + uy(),
              }
            : { x: ux(), y: uy() },
        })
        gruppe.add(mesh)
      })
      const decken = huellenMesh(huelle.decken)
      if (decken) {
        eigene.push({ mesh: decken, art: 'decke', normalen: [], mitte: { x: ux(), y: uy() } })
        gruppe.add(decken)
      }
      const uebriges = huellenMesh(huelle.uebriges)
      if (uebriges) gruppe.add(uebriges)

      if (gruppe.children.length > 0) {
        gruppe.traverse((o) => huellenObjekte.add(o))
        huellen.set(blattId, gruppe)
        huellenTeile.set(blattId, eigene)
        gruppeFuer(blattId).add(gruppe)
      }
      zeichnen()
    },

    ursprung() {
      return { x: ux(), y: uy() }
    },

    setzeSichtbareGeschosse(blattIds) {
      for (const [id, g] of geschossGruppen) g.visible = blattIds.has(id)
      zeichnen()
    },

    setzeDeckkraft(neu) {
      deckkraft = neu
      zeichnen()
    },

    setzeSymbolgroesse(anteil) {
      symbolgroesse = anteil
      zeichnen()
    },

    treffer(x, y) {
      const strahl = new three.Raycaster()
      strahl.params.Line2 = { threshold: 6 }
      strahl.setFromCamera(new three.Vector2((x / breite) * 2 - 1, -(y / hoehe) * 2 + 1), kamera)
      const sichtbar = [...geschossGruppen.values()].filter((g) => g.visible)
      let gebaeudeTreffer: SzenenInfo | null = null
      for (const t of strahl.intersectObjects(sichtbar, true)) {
        const objekt = t.object instanceof three.LineSegments ? t.object.parent : t.object
        if (!objekt?.visible) continue
        const info = infos.get(objekt)
        const istGebaeude = gebaeude.has(objekt) || huellenObjekte.has(objekt)
        const undurchsichtig =
          istGebaeude && !((objekt as THREE.Mesh).material as THREE.Material).transparent
        if (info && !istGebaeude) return info
        if (info) gebaeudeTreffer ??= info
        if (undurchsichtig) return gebaeudeTreffer
      }
      return gebaeudeTreffer
    },

    einpassen,

    setzeModus(neu) {
      if (neu === modus) return
      if (neu === 'begehen') {
        const drehpunkt = nachModell(steuerung.target)
        const auge = nachModell(kamera.position)
        const koten = [...geschossKoten]
          .filter(([id]) => geschossGruppen.get(id)?.visible !== false)
          .map(([, k]) => k)
        standpunkt = einstiegsStandpunkt(drehpunkt, koten)
        blick = blickAusRichtung({ x: drehpunkt.x - auge.x, y: drehpunkt.y - auge.y, z: 0 })
        beginneBegehen()
        return
      }
      beendeBegehen()
      const r = blickRichtung(blick)
      const d = DREHPUNKT_ABSTAND_METER
      steuerung.target.copy(
        nachThree(standpunkt.x + r.x * d, standpunkt.y + r.y * d, standpunkt.z + r.z * d),
      )
      steuerung.update()
      zeichnen()
    },

    modus: () => modus,

    setzeBewegung(neu, neuSchnell) {
      eingabe = neu
      schnell = neuSchnell
      if (modus !== 'begehen' || !istBewegung(neu) || laufId !== null) return
      letzteZeit = performance.now()
      laufId = requestAnimationFrame(bewegungsSchritt)
    },

    kamera() {
      if (modus === 'begehen') {
        const r = blickRichtung(blick)
        const { x, y, z } = standpunkt
        return { position: [x, y, z], ziel: [x + r.x, y + r.y, z + r.z], modus }
      }
      const p = nachModell(kamera.position)
      const z = nachModell(steuerung.target)
      return { position: [p.x, p.y, p.z], ziel: [z.x, z.y, z.z], modus }
    },

    groesseAnpassen(b, h) {
      breite = Math.max(1, b)
      hoehe = Math.max(1, h)
      renderer.setSize(breite, hoehe, false)
      kamera.aspect = breite / hoehe
      kamera.updateProjectionMatrix()
      for (const m of linienMaterialien) m.resolution.set(breite, hoehe)
      zeichnen()
    },

    freigeben() {
      stoppeBewegung()
      canvas.removeEventListener('pointerdown', beiZeigerDruck)
      canvas.removeEventListener('pointermove', beiZeigerBewegung)
      canvas.removeEventListener('pointerup', beiZeigerEnde)
      canvas.removeEventListener('pointercancel', beiZeigerEnde)
      canvas.removeEventListener('wheel', beiRad)
      steuerung.removeEventListener('change', zeichnen)
      steuerung.dispose()
      leeren()
      for (const h of huellen.values()) gibFrei(h)
      huellen.clear()
      huellenTeile.clear()
      huellenObjekte.clear()
      renderer.dispose()
    },
  }
}
