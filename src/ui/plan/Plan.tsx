import { MdTableParser } from 'src/parser'
import { planDataSchema, type PlanData } from 'src/schemas'
import { render } from 'preact'
import type { FC } from 'preact/compat'
import { PlanTable } from './PlanTable'
import type { MdTableEditor } from 'src/editor/md-table-editor'
import type { Table } from '@tgrosinger/md-advanced-tables'
import { PlanProvider } from './context'
import { MarkdownRenderChild } from 'obsidian'
import 'windi.css'

const Plan: FC<{ data: PlanData; mte: MdTableEditor }> = (props) => {
  const { data, mte } = props

  return (
    <PlanProvider mte={mte} data={data}>
      <PlanTable initialData={data} />
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

export class MdPlan extends MarkdownRenderChild {
  constructor(
    private _container: HTMLElement,
    private _source: string,
    private _getMte: (table: Table) => MdTableEditor
  ) {
    super(_container)
  }

  onload() {
    try {
      const parsed = MdTableParser.parse(this._source)
      const records = parsed.toRecords()

      const validPlanData = planDataSchema.parse(records)

      const mte = this._getMte(parsed.table)

      render(<Plan data={validPlanData} mte={mte} />, this._container)
    } catch (e) {
      render(<Error message={e.message} />, this._container)
    }
  }

  onunload() {}
}
