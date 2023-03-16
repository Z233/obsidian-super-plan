import { MdTableParser } from 'src/parser'
import { planDataSchema, type PlanData } from 'src/schemas'
import { render } from 'preact'
import { useSyncExternalStore, type FC } from 'preact/compat'
import { PlanTable } from './PlanTable'
import { MdTableEditor } from 'src/editor/md-table-editor'
import type { Table } from '@tgrosinger/md-advanced-tables'
import { PlanProvider } from './context'
import type { App, TFile } from 'obsidian'
import 'uno.css'
import type { CodeBlockSync } from 'src/editor/code-block-sync'
import { Scheduler } from 'src/scheduler'

type MteLoader = ({
  table,
  startRow,
  endRow,
}: {
  table: Table
  startRow: number
  endRow: number
}) => MdTableEditor

const Plan: FC<{
  sync: CodeBlockSync
  mteLoader: MteLoader
}> = (props) => {
  const { sync, mteLoader } = props

  const { source, lineStart, lineEnd } = useSyncExternalStore(sync.subscribe.bind(sync), () => {
    return sync.getInfo()
  })

  const parsed = MdTableParser.parse(source)
  const records = parsed.toRecords()

  const validData = planDataSchema.parse(records)

  const scheduler = new Scheduler(validData)
  scheduler.schedule()

  const data = scheduler.getData()
  const mte = mteLoader({ table: parsed.table, startRow: lineStart + 1, endRow: lineEnd - 1 })

  return (
    <PlanProvider mte={mte}>
      <PlanTable data={data} />
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

export const renderPlan = (container: HTMLElement, sync: CodeBlockSync, app: App, file: TFile) => {
  const mteLoader: MteLoader = ({ table, startRow, endRow }) =>
    new MdTableEditor({ app, file, table, startRow, endRow })

  render(<Plan sync={sync} mteLoader={mteLoader} />, container)
}
