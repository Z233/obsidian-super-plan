import { MdTableParser } from 'src/parser'
import {
  planDataSchema,
  planRecordSchema,
  planRecordsSchema,
  type PlanData,
  type PlanRecord,
} from 'src/schemas'
import { render } from 'preact'
import type { FC } from 'preact/compat'
import { PlanTable } from './PlanTable'
import type { TableEditor } from 'src/editor/table-editor'

const Plan: FC<{ data: PlanData; te: TableEditor }> = (props) => {
  return <PlanTable initialData={props.data} te={props.te} />
}

const Error: FC<{ message: string }> = (props) => {
  return (
    <div>
      <h1>Error</h1>
      <p>{props.message}</p>
    </div>
  )
}

export function renderPlan(el: HTMLElement, source: string, te: TableEditor) {
  try {
    const parsed = MdTableParser.parse(source)
    const records = parsed.toRecords()

    const validPlanData = planDataSchema.parse(records)

    render(<Plan data={validPlanData} te={te} />, el)
  } catch (e) {
    render(<Error message={e.message} />, el)
  }
}
