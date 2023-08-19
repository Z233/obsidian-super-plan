import { MdTableParser } from 'src/parser'
import { planDataSchema, type PlanData } from 'src/schemas'
import { render } from 'preact'
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type FC,
  memo,
} from 'preact/compat'
import { PlanTable } from './PlanTable'
import { MdTableEditor } from 'src/editor/md-table-editor'
import type { Table } from '@tgrosinger/md-advanced-tables'
import { PlanProvider } from './context'
import type { App, TFile } from 'obsidian'
import 'uno.css'
import type { CodeBlockSync } from 'src/editor/code-block-sync'
import { Scheduler } from 'src/scheduler'
import type { ColumnKeys } from 'src/constants'
import { shallowCompare } from 'src/util/helper'
import { Events, GlobalMediator } from 'src/mediator'
import type { SuperPlanSettings } from 'src/setting/settings'

/**
 * Markdown Table Editor Loader
 */
type MteLoader = ({
  table,
  startRow,
  endRow,
}: {
  table: Table
  startRow: number
  endRow: number
}) => MdTableEditor

const MemorizedPlanTable = memo(
  PlanTable,
  (prev, next) => prev.data.every((d, i) => shallowCompare(d, next.data[i]))
)

const Plan: FC<{
  app: App
  settings: SuperPlanSettings
  sync: CodeBlockSync
  mteLoader: MteLoader
}> = (props) => {
  const { app, sync, mteLoader, settings } = props

  const { source, lineStart, lineEnd } = useSyncExternalStore(sync.subscribe.bind(sync), () => {
    return sync.getInfo()
  })

  const parsed = MdTableParser.parse(source)
  const records = parsed.toRecords()

  const result = planDataSchema.safeParse(records)

  if (!result.success) {
    return <Error message={result.error.message} />
  }

  const validData = result.data

  const scheduler = new Scheduler(validData)
  scheduler.schedule()

  const scheduledData = scheduler.getData()
  const mte = mteLoader({ table: parsed.table, startRow: lineStart + 1, endRow: lineEnd - 1 })

  const isFlushing = useRef(false)

  if (
    !isFlushing.current &&
    scheduledData.length === validData.length &&
    !scheduledData.every((d, i) => shallowCompare(d, validData[i]))
  ) {
    // Iterate over the scheduled data and compare it to the old data.
    // If there are any changes, get the row and column of the change.
    for (let i = 0; i < scheduledData.length; i++) {
      const oldItem = validData[i]
      const newItem = scheduledData[i]

      Object.entries(newItem).forEach(([k, value], col) => {
        const key = k as ColumnKeys
        if (oldItem[key] !== value) {
          mte.setCellAt(i, col, value)
        }
      })
    }

    isFlushing.current = true
    mte.applyChanges()
    isFlushing.current = false
  }

  return (
    <PlanProvider mte={mte} app={app} settings={settings}>
      <MemorizedPlanTable data={scheduledData} />
    </PlanProvider>
  )
}

const Error: FC<{ message: string }> = (props) => {
  return (
    <div>
      <h1>Error</h1>
      <p>{props.message}</p>
    </div>
  )
}

export const renderPlan = ({
  container,
  sync,
  app,
  file,
  settings,
}: {
  container: HTMLElement
  sync: CodeBlockSync
  app: App
  file: TFile
  settings: SuperPlanSettings
}) => {
  const mteLoader: MteLoader = ({ table, startRow, endRow }) =>
    new MdTableEditor({ app, file, table, startRow, endRow })

  render(<Plan app={app} sync={sync} mteLoader={mteLoader} settings={settings} />, container)
}
