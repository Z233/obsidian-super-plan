import { Scheduler } from 'src/scheduler'
import {
  Table,
  TableCell,
  TableRow,
  defaultOptions,
  formatTable,
} from '@tgrosinger/md-advanced-tables'
import { ColumnKeys } from 'src/constants'
import type { PlanData } from 'src/schemas'
import type { Activity, UnionToTuple } from 'src/types'

class Plan {
  private _data: PlanData = []

  constructor(activities: Activity[]) {
    const scheduler = new Scheduler(activities)
    scheduler.schedule()
    this._data = scheduler.getData()
  }

  private toTable() {
    const headerColumns = Object.keys(ColumnKeys) as UnionToTuple<keyof typeof ColumnKeys>

    const headerRow = new TableRow(
      headerColumns.map(col => new TableCell(col)),
      '',
      '',
    )

    const dividerRow = new TableRow(
      headerColumns.map(() => new TableCell('-')),
      '',
      '',
    )

    const activitiesRows = this._data.map((act) => {
      const cells = []
      for (const [, value] of Object.entries(act))
        cells.push(new TableCell(value))

      return new TableRow(cells, '', '')
    })

    const table = new Table([headerRow, dividerRow, ...activitiesRows])
    const { table: formattedTable } = formatTable(table, defaultOptions)

    return formattedTable
  }

  getLines() {
    const table = this.toTable()
    return table.toLines()
  }
}

export class PlanBuilder {
  private _activities: Activity[] = []

  addActivity(activity: Activity) {
    this._activities.push(activity)
    return this
  }

  build() {
    return new Plan(this._activities)
  }
}
