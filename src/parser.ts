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

  extractPlanTables(content: string): Maybe<PlanTableInfo[]> {
    const re = new RegExp(`\`\`\`${CODE_BLOCK_LANG}\n([\\s\\S]+?)\n\`\`\``, 'g')

    const matches: RegExpExecArray [] = []
    let match: RegExpExecArray | null = null
    
    while ((match = re.exec(content)) !== null) {
      matches.push(match) 
    }

    if (!matches.length) return null
    
    const tableInfos = matches.map((m) => {
      const lines = m[1].split('\n')

      const matchStartLine = content.slice(0, m.index).split(/(?<=\n)/).length
      const matchEndLine = matchStartLine + lines.length + 1

      const table = readTable(lines, defaultOptions)
      
      return {
        range: new Range(new Point(matchStartLine + 1, 0), new Point(matchEndLine - 1, 0)),
        lines,
        table,
      }
    })

    return tableInfos;
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
