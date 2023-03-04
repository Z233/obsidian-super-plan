import { MdTableParser } from 'src/parser'
import { planRecordsSchema, type PlanRecord } from 'src/schemas'
import { render } from 'preact'
import type { FC } from 'preact/compat'
import { PlanTable } from './PlanTable'

const Plan: FC<{ records: PlanRecord[] }> = (props) => {
  return <PlanTable records={props.records} />
}

const Error: FC<{ message: string }> = (props) => {
  return (
    <div>
      <h1>Error</h1>
      <p>{props.message}</p>
    </div>
  )
}

export function renderPlan(el: HTMLElement, source: string) {
  try {
    const parsed = MdTableParser.parse(source)
    const records = parsed.toRecords()
    const validPlanRecords = planRecordsSchema.parse(records)

    render(<Plan records={validPlanRecords} />, el)
  } catch (e) {
    render(<Error message={e.message} />, el)
  }
}
