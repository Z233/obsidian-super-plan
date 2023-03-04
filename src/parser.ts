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
  defaultOptions,
} from '@tgrosinger/md-advanced-tables'
import {
  _createIsTableFormulaRegex,
  _createIsTableRowRegex,
} from '@tgrosinger/md-advanced-tables/lib/table-editor'
import { ActivityDataColumn, PlanLinesLiteral } from './constants'
import { getActivityDataKey } from './util/helper'
import { isArray, isNumber } from 'lodash-es'

export class MdTableParser {
  static parse(markupOrLines: string | string[]) {
    const lines = isArray(markupOrLines) ? markupOrLines : markupOrLines.split('\n')
    const table = readTable(lines, defaultOptions)

    return {
      table,
      toRecords: () => MdTableParser._toRecords(table),
    }
  }

  static stringify(table: Table): string {
    return formatTable(table, defaultOptions).table.toLines().join('\n')
  }

  private static _toRecords(table: Table) {
    const headers = table
      .getRows()[0]
      .getCells()
      .map((cell) => cell.content)

    const records: Record<string, string>[] = []

    const rows = table.getRows()
    for (let rowIdx = 2; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx]
      const record: Record<string, string> = {}
      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const header = headers[colIdx]
        const cell = row.getCells()[colIdx]
        record[header] = cell.content
      }
      records.push(record)
    }

    return records
  }
}

export class Parser {
  private readonly settings: SuperPlanSettings

  constructor(settings: SuperPlanSettings) {
    this.settings = settings
  }

  checkIsTemplate() {}

  findPlanTable(contentOrLines: string | string[]): Maybe<PlanTableInfo> {
    const rows = isArray(contentOrLines) ? contentOrLines : contentOrLines.split('\n')
    const re = _createIsTableRowRegex(this.settings.asOptions().leftMarginChars)

    const lines: string[] = []

    let startRow: number | undefined
    let endRow = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      if (re.test(row)) {
        if (startRow === undefined) {
          startRow = i
          endRow = i
        } else if (i - endRow <= 1) {
          endRow = i
        }

        lines.push(row)
      }
    }

    const table = readTable(lines, this.settings.asOptions())
    const range = new Range(
      new Point(startRow!, 0),
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
