import type { Focus, Table, TableCell, TableRow, Range } from '@tgrosinger/md-advanced-tables'

export type PlanTableInfo = {
  /**
   * The range of the table
   */
  range: Range

  /**
   * An array of lines in the range.
   */
  lines: string[]

  /**
   * A table object read from the text editor.
   */
  table: Table
}

export type ActivityData = {
  name: string
  length: string
  start: string
  f: string
  r: string
  actLen: string
}

export type ActivitiesData = ActivityData[]

export type PlanCellType = keyof ActivityData
export type PlanTableState = {
  type: PlanCellType
  cell: TableCell
  row: TableRow
  table: Table
  focus: Focus
}

export type Activity = {
  name: string
  length: number
  start: number
  stop: number
  isFixed: boolean
  isRigid: boolean
  actLen: number
}

export type StatisticsData = {
  name: string
  total: number
  children?: StatisticsData[]
}

export type Activities = Activity[]

// https://stackoverflow.com/a/52490977
export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>

export type Maybe<T> = T | null | undefined
