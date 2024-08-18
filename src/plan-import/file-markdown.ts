import type { FileStats } from 'obsidian'
import { CODE_BLOCK_LANG, ColumnKeysMap, Columns } from 'src/constants'
import type { Activity, Maybe, PagePlanData, PlanTableInfo } from 'src/types'
import { defaultOptions, readTable, type Table, Range, Point } from '@tgrosinger/md-advanced-tables'
import moment from 'moment'
import { planRecordSchema } from 'src/schemas'
// import { getFileTitle } from 'src/util/helper'

function getFileTitle(path: string): string {
    if (path.includes("/")) path = path.substring(path.lastIndexOf("/") + 1);
    if (path.endsWith(".md")) path = path.substring(0, path.length - 3);
    return path;
}

export function parsePagePlanData(path: string, contents: string, stats: FileStats): PagePlanData {
  const tableInfos = parseTableInfos(contents)
  const activityGroups = tableInfos?.map((info) => parseActivities(info.table))

  return {
    day: extractDate(getFileTitle(path)) ?? moment.unix(stats.ctime),
    plans: activityGroups?.map((activities) => ({ activities })) ?? [],
  }
}

function parseTableInfos(content: string): Maybe<PlanTableInfo[]> {
  const re = new RegExp(`\`\`\`${CODE_BLOCK_LANG}\n([\\s\\S]+?)\n\`\`\``, 'g')

  const matches: RegExpExecArray[] = []
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

  return tableInfos
}

function parseActivities(table: Table): Activity[] {
  const activitiesRows = table
    .getRows()
    .slice(2)
    .filter((row) => row.getWidth() === Object.keys(planRecordSchema.shape).length)
    .map((row) => row.getCells().map((cell) => cell.content))

  const activitiesData: Activity[] = activitiesRows.map((row) =>
    row.reduce(
      (data, v, i) => ({
        ...data,
        [ColumnKeysMap[i as Columns]]: v,
      }),
      {} as Activity
    )
  )

  return activitiesData
}

function extractDate(str: string): moment.Moment | undefined {
  let dateMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(str)
  if (!dateMatch) dateMatch = /(\d{4})(\d{2})(\d{2})/.exec(str)
  if (dateMatch) {
    let year = Number.parseInt(dateMatch[1])
    let month = Number.parseInt(dateMatch[2])
    let day = Number.parseInt(dateMatch[3])
    return moment({ year, month, day })
  }

  return undefined
}
