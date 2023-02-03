import type { SuperPlanSettings } from './setting/settings'
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
import { getActivityDataKey } from './util/helper'
import { isArray, isNumber } from 'lodash-es'

export class Parser {
  private readonly settings: SuperPlanSettings

  constructor(settings: SuperPlanSettings) {
    this.settings = settings
  }

  checkIsTemplate() {

  }

  findPlanTable(contentOrLines: string | string[]): Maybe<PlanTableInfo> {
    const rows = isArray(contentOrLines) ? contentOrLines : contentOrLines.split('\n')
    const re = _createIsTableRowRegex(this.settings.asOptions().leftMarginChars)

    const lines: string[] = []

    let startRow,
      endRow = 0

    for (let i = 0; i < rows.length; i++) {
      const isTableRow = re.test(rows[i])
      if (!isTableRow) continue
      if (isNumber(startRow) && !isTableRow) break

      if (startRow === undefined) startRow = i
      else endRow++

      lines.push(rows[i])
    }

    if (startRow === undefined || !lines.length) return

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
