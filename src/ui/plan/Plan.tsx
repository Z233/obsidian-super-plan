import { MdTableParser } from 'src/parser'
import { planDataSchema, type PlanData } from 'src/schemas'
import { render } from 'preact'
import type { FC } from 'preact/compat'
import { PlanTable } from './PlanTable'
import type { MdTableEditor } from 'src/editor/md-table-editor'
import type { Table } from '@tgrosinger/md-advanced-tables'

const Plan: FC<{ table: Table; data: PlanData; mte: MdTableEditor }> = (props) => {
  const { table, data, mte } = props

  function patch(newData: PlanData) {
  }

  return <PlanTable initialData={data} mte={mte} />
}

const Error: FC<{ message: string }> = (props) => {
  return (
    <div>
      <h1>Error</h1>
      <p>{props.message}</p>
    </div>
  )
}

export function renderPlan(
  el: HTMLElement,
  source: string,
  getMte: (table: Table) => MdTableEditor
) {
  try {
    const parsed = MdTableParser.parse(source)
    const records = parsed.toRecords()

    const validPlanData = planDataSchema.parse(records)

    const mte = getMte(parsed.table)

    render(<Plan table={parsed.table} data={validPlanData} mte={mte} />, el)
  } catch (e) {
    render(<Error message={e.message} />, el)
  }
}
