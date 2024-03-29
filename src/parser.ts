import type {
  Table,
} from '@tgrosinger/md-advanced-tables'
import {
  Point,
  Range,
  defaultOptions,
  formatTable,
  readTable,
} from '@tgrosinger/md-advanced-tables'
import {
  _createIsTableRowRegex,
} from '@tgrosinger/md-advanced-tables/lib/table-editor'
import { isArray } from 'lodash-es'
import type { SuperPlanSettings } from './setting/settings'
import type { Activity, Maybe, PlanTableInfo } from './types'
import type {
  Columns,
} from './constants'
import {
  CODE_BLOCK_LANG,
  ColumnKeysMap,
} from './constants'
import { planRecordSchema } from './schemas'

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
      .map(cell => cell.content)

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

  findPlanTableV2(content: string): Maybe<PlanTableInfo> {
    // const re = /(?<=^```super-plan\n)[\s\S]*(?=```$)/gm
    const re = new RegExp(`(?<=^\`\`\`${CODE_BLOCK_LANG}\\n)[\\s\\S]*(?=\`\`\`$)`, 'gm')
    const match = re.exec(content)
    if (!match)
      return null

    const lines = match[0].split('\n')

    const posStart = match.index
    const lineStart = content.slice(0, posStart - 1).split('\n').length
    const lineEnd = lineStart + lines.length - 2

    const table = readTable(lines, defaultOptions)
    return {
      range: new Range(new Point(lineStart, 0), new Point(lineEnd, 0)),
      lines,
      table,
    }
  }

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
        }
        else if (i - endRow <= 1) {
          endRow = i
        }

        lines.push(row)
      }
    }

    const table = readTable(lines, this.settings.asOptions())
    const range = new Range(
      new Point(startRow!, 0),
      new Point(endRow, lines[lines.length - 1].length),
    )

    return {
      range,
      lines,
      table,
    }
  }

  transformTable(table: Table): Activity[] {
    const activitiesRows = table
      .getRows()
      .slice(2)
      .filter(row => row.getWidth() === (Object.keys(planRecordSchema.shape).length))
      .map(row => row.getCells().map(cell => cell.content))

    const activitiesData: Activity[] = activitiesRows.map(row =>
      row.reduce(
        (data, v, i) => ({
          ...data,
          [ColumnKeysMap[i as Columns]]: v,
        }),
        {} as Activity,
      ),
    )

    return activitiesData
  }
}
