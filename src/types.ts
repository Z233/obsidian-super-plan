import type { Focus, Range, Table, TableCell, TableRow } from '@tgrosinger/md-advanced-tables'
import type { Editor, EditorRange, WorkspaceLeaf } from 'obsidian'
import type { UnionToIntersection } from 'type-fest'
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

export interface PlanRecord {
  F: string
  Start: string
  Activity: string
  Length: string
  R: string
}

export interface UserData {
  miniTracker: {
    position: {
      x: number
      y: number
    }
  }
}

export interface ScheduledActivity {
  id: string
  activity: string
  length: number
  start: number
  stop: number
  isFixed: boolean
  isRigid: boolean
  actLen: number
}

export interface Activity {
  id: string
  activity: string
  length: string
  start: string
  f: string
  r: string
  actLen: string
}

export type PlanCellType = keyof Activity
export interface PlanTableState {
  type: PlanCellType
  cell: TableCell
  row: TableRow
  table: Table
  focus: Focus
}

export interface PlanTableInfo {
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

type UnionLast<T> = UnionToIntersection<T extends T ? () => T : never> extends () => infer R
  ? R
  : never

export type UnionToTuple<T> = [T] extends [never]
  ? []
  : [...UnionToTuple<Exclude<T, UnionLast<T>>>, UnionLast<T>]

export type Maybe<T> = T | null | undefined

export type ValueOf<T> = T[keyof T]
