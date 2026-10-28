import { readFileSync, writeFileSync } from 'node:fs'
import { unzipSync } from 'fflate'
import { deserialisiereZeichnung, zeichnungZuJson } from '../src/document-model'
import { erzeugeUebersetzer } from '../src/sprache'
import { erzeugeEinfamilienhaus } from '../src/tools/beispielprojekt/einfamilienhaus'
import { ohneLeitungenUndTrunks } from '../src/tools/beispielprojekt/ohne-leitungen'
import { uebersetzeMuster } from '../src/tools/beispielprojekt/uebersetzen'

const ORDNER = 'src/persistence/seed-data/musterprojekte'
const SPRACHEN = ['de', 'en']
const datei = (muster, sprache) => `${ORDNER}/einfamilienhaus-${muster}.${sprache}.json`

const argumente = process.argv.slice(2)
const quelleIndex = argumente.indexOf('--elektro-aus')
if (quelleIndex >= 0) {
  const paket = unzipSync(new Uint8Array(readFileSync(argumente[quelleIndex + 1])))
  const inhalt = JSON.parse(new TextDecoder().decode(paket['projekt.json']))
  const zeichnung = deserialisiereZeichnung(inhalt.dokumente[0].inhalt.inhalt)
  if ((zeichnung.plansprache ?? 'de') !== 'de') {
    throw new Error('Die Quelle der Elektroplanung muss eine deutsche Zeichnung sein.')
  }
  const quelle = ohneLeitungenUndTrunks(zeichnung)
  writeFileSync(
    datei('elektro', 'de'),
    JSON.stringify({ zeichnung: zeichnungZuJson(quelle) }) + '\n',
  )
}

const elektroDe = deserialisiereZeichnung(
  JSON.stringify(JSON.parse(readFileSync(datei('elektro', 'de'), 'utf8')).zeichnung),
)
for (const sprache of SPRACHEN) {
  schreibe('bauplan', sprache, erzeugeEinfamilienhaus(sprache))
  schreibe('elektro', sprache, sprache === 'de' ? elektroDe : uebersetzeMuster(elektroDe, sprache))
}

function schreibe(muster, sprache, zeichnung) {
  const t = erzeugeUebersetzer(sprache)
  const gross = muster === 'bauplan' ? 'Bauplan' : 'Elektro'
  const daten = {
    kunde: t('plan.muster.projekt.kunde'),
    bezeichnung: t(`plan.muster.projekt.${muster}`),
    notiz: t(`plan.muster.projekt.notiz${gross}`),
    dokument: t(`plan.muster.projekt.dokument${gross}`),
    zeichnung: zeichnungZuJson(zeichnung),
  }
  deserialisiereZeichnung(JSON.stringify(daten.zeichnung))
  writeFileSync(datei(muster, sprache), JSON.stringify(daten) + '\n')
  const blaetter = zeichnung.blaetter.map((b) => {
    const zahl = (typ) => b.objekte.filter((o) => o.type === typ).length
    return `${b.name} ${zahl('raum')} Räume/${zahl('komponente')} Komp./${zahl('leitung')} Ltg.`
  })
  console.log(`${datei(muster, sprache)}: ${blaetter.join(', ')}`)
}
