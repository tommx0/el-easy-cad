import type { LeitungsObjekt, TrunkObjekt } from '../document-model'
import { findeSchacht, strangName } from '../document-model'
import { erzeugeStrangUmbenennenCommand } from '../tools'
import { useAktivesBlatt, useAppContext, useProject } from './use-app-context'
import { TextFeldBeimVerlassen } from './components/TextFeldBeimVerlassen'
import { useT } from './sprache-anbindung'

export function StrangNameFeld({ verbundId, nummer }: { verbundId: string; nummer: number }) {
  const t = useT()
  const { doc, commands } = useAppContext()
  const zeichnung = useProject()
  return (
    <TextFeldBeimVerlassen
      aria-label={t('eigenschaften.strangName.aria', { nummer: String(nummer) })}
      placeholder={t('eigenschaften.strangName.platzhalter')}
      wert={strangName(zeichnung, verbundId, nummer) ?? ''}
      onUebernehmen={(name) => {
        const command = erzeugeStrangUmbenennenCommand(
          doc,
          verbundId,
          nummer,
          name,
          t('eigenschaften.strangName.umbenennenUndo'),
        )
        if (command) commands.execute(command)
      }}
    />
  )
}

export function StrangNamenAnObjekt({ objekt }: { objekt: LeitungsObjekt | TrunkObjekt }) {
  const t = useT()
  const zeichnung = useProject()
  const blatt = useAktivesBlatt()
  const refs =
    objekt.type === 'leitung'
      ? [objekt.start, objekt.ziel].flatMap((e) =>
          e.art === 'schacht' ? [{ schachtId: e.objektId, strang: e.strang }] : [],
        )
      : objekt.enden.flatMap((e) =>
          e.schachtRef ? [{ schachtId: e.schachtRef.objektId, strang: e.schachtRef.strang }] : [],
        )
  return refs.map(({ schachtId, strang }) => {
    const schacht = findeSchacht(zeichnung, blatt.id, schachtId)
    if (!schacht) return null
    return (
      <label key={`${schachtId}-${strang}`} className="feld">
        {t('eigenschaften.strangName.strang', { nummer: String(strang), schacht: schacht.name })}
        <StrangNameFeld verbundId={schacht.verbundId} nummer={strang} />
      </label>
    )
  })
}
