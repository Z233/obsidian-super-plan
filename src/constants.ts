import type { PlanCellType } from './types'

export const PlanLinesLiteral = {
  header: `| F   | Start | Activity | Length | R   | ActLen |`,
  divider: `| --- | ----- | -------- | ------ | --- | ------ |`,
  newActivityRow: `| x   | 00:00 |          | 0      |     | 0      |`,
  endRow: `| x   | 00:00 | END      | 0      |     | 0      |`,
}

export const DEFAULT_NOTE_FORMAT = 'YYYY-MM-DD'
export const DEFAULT_CIRCLE_PROGRESS_SIZE = 16
export const NO_ACTIVITY_NAME_PLACEHOLDER = '[No Name]'

export const INVAlID_NUMBER_LITERAL = '##NUM!'

export const CURSOR_CH_AFTER_FOCUS = 3

export const TriggerScheduleColumn: PlanCellType[] = ['length', 'start', 'f', 'r']

export const HIGHLIGHT_CLASS_NAME = 'obsidian-super-plan highlight'

export enum ActivityDataColumn {
  'f',
  'start',
  'activity',
  'length',
  'r',
  'actLen',
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
