import type { SuperPlanSettings } from './settings'
import type { ActivitiesData, ActivityData, Maybe, PlanTableInfo } from './types'
import {
  readTable,
  Table,
  TableCell,
  TableRow,
  insertRow,
  formatTable,
  Range,
  Point,
} from '@tgrosinger/md-advanced-tables'
import {
  _createIsTableFormulaRegex,
  _createIsTableRowRegex,
} from '@tgrosinger/md-advanced-tables/lib/table-editor'
import { ActivityDataColumn, PlanLinesLiteral } from './constants'
import { getActivityDataKey } from './utils/helper'

export class Parser {
  private readonly settings: SuperPlanSettings

  constructor(settings: SuperPlanSettings) {
    this.settings = settings
  }

  findPlanTable(content: string): Maybe<PlanTableInfo> {
    const re = _createIsTableRowRegex(this.settings.asOptions().leftMarginChars)
    const rows = content.split('\n')
    let startRow = 0
    let endRow

    const lines: string[] = []

    let index = 0
    while (index < rows.length) {
      const row = rows[index]
      if (re.test(row)) {
        if (lines.length === 0) {
          startRow = index
        }
        lines.push(row)
      }
      index++
    }
    endRow = index

    if (!lines.length) return

    const table = readTable(lines, this.settings.asOptions())
    const range = new Range(
      new Point(startRow, 0),
      new Point(endRow, lines[lines.length - 1].length)
    )

    return {
      range,
      lines,
      table,
    }
  }

  transformTable(table: Table): ActivitiesData {
    const activitiesRows = table
      .getRows()
      .slice(2)
      .map((row) => row.getCells().map((cell) => cell.content))

    const activitiesData: ActivitiesData = activitiesRows.map((row) =>
      row.reduce(
        (data, v, i) => ({
          ...data,
          [ActivityDataColumn[i]]: v,
        }),
        {} as ActivityData
      )
    )

    return activitiesData
  }

  transformActivitiesData(activitiesData: ActivitiesData): Table {
    const emptyTable = readTable(
      [PlanLinesLiteral.header, PlanLinesLiteral.divider],
      this.settings.asOptions()
    )

    const activitiesRows = activitiesData.map(
      (data) =>
        new TableRow(
          Array.from(
            { length: emptyTable.getHeaderWidth() },
            (_, i) => new TableCell(data[getActivityDataKey(i) ?? ''])
          ),
          '',
          ''
        )
    )

    const table = activitiesRows.reduce((t, row, i) => insertRow(t, 2 + i, row), emptyTable)

    const formatted = formatTable(table, this.settings.asOptions())

    return formatted.table
  }
}
