import type { Focus, Table, TableCell, TableRow, Range } from '@tgrosinger/md-advanced-tables'
import type { Editor, EditorRange, WorkspaceLeaf } from 'obsidian'
import type { UpdateFlag } from './constants'

// Extend global
declare global {
  interface Window {
    [UpdateFlag]?: boolean
  }
}

export interface UnsafeWorkspaceLeaf extends WorkspaceLeaf {
  id: string
  parent?: UnsafeWorkspaceLeaf
  children?: UnsafeWorkspaceLeaf[]
}

export interface UnsafeEditor extends Editor {
  addHighlights: (
    range: EditorRange[],
    className: string,
    unknownFlag1: boolean,
    unknownFlag2: boolean
  ) => void
  hasHighlight: (unknownArg?: any) => boolean
  removeHighlights: (unknownArg?: any) => void
}

export type PlanRecord = {
  F: string
  Start: string
  Activity: string
  Length: string
  R: string
}

export type UserData = {
  miniTracker: {
    position: {
      x: number
      y: number
    }
  }
}

export type Activity = {
  id: string
  activity: string
  length: number
  start: number
  stop: number
  isFixed: boolean
  isRigid: boolean
  actLen: number
}

export type ActivityData = {
  id: string
  activity: string
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

export type ValueOf<T> = T[keyof T]
