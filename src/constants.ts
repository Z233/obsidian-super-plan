import type { PlanCellType } from './types'

export const CODE_BLOCK_LANG = 'super-plan'

export const ACTIVITY_TR_ID_PREFIX = 'activity-tr-'

export const UpdateFlag: unique symbol = Symbol('super-plan-update-flag')

export enum Keys {
  Enter = 'Enter',
  B = 'b',
  ArrowDown = 'ArrowDown',
  ArrowUp = 'ArrowUp',
}

export enum Columns {
  ID = 0,
  F = 1,
  Start = 2,
  Activity = 3,
  Length = 4,
  R = 5,
  ActLen = 6,
}

export enum ColumnKeys {
  ID = 'id',
  F = 'f',
  Start = 'start',
  Activity = 'activity',
  Length = 'length',
  R = 'r',
  ActLen = 'actLen',
}

export const ColumnKeysMap = {
  // key to index
  [Columns.ID]: ColumnKeys.ID,
  [Columns.F]: ColumnKeys.F,
  [Columns.Start]: ColumnKeys.Start,
  [Columns.Activity]: ColumnKeys.Activity,
  [Columns.Length]: ColumnKeys.Length,
  [Columns.R]: ColumnKeys.R,
  [Columns.ActLen]: ColumnKeys.ActLen,
  // index to key
  [ColumnKeys.ID]: Columns.ID,
  [ColumnKeys.F]: Columns.F,
  [ColumnKeys.Start]: Columns.Start,
  [ColumnKeys.Activity]: Columns.Activity,
  [ColumnKeys.Length]: Columns.Length,
  [ColumnKeys.R]: Columns.R,
  [ColumnKeys.ActLen]: Columns.ActLen,
} as const

export const DEFAULT_NOTE_FORMAT = 'YYYY-MM-DD'
export const DEFAULT_CIRCLE_PROGRESS_SIZE = 16
export const NO_ACTIVITY_NAME_PLACEHOLDER = '[No Name]'

export const INVAlID_NUMBER_LITERAL = '##NUM!'

export const CURSOR_CH_AFTER_FOCUS = 3

export const TriggerScheduleColumn: PlanCellType[] = ['length', 'start', 'f', 'r']

export const HIGHLIGHT_CLASS_NAME = 'obsidian-super-plan highlight'

export enum ActivityDataColumn {
  f,
  start,
  activity,
  length,
  r,
  actLen,
}

export enum ProgressType {
  BAR = 'BAR',
  CIRCLE = 'CIRCLE',
}

// get the values by log ViewUpdate
export enum UnsafeViewUpdateFlags {
  TABLE_BLUR = 6,
  TABLE_FOCUS = 7,
}
