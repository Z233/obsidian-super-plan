import type { PlanCellType } from './types'

export const PlanLinesLiteral = {
  header: `| F   | Start | Activity | Length | R   | ActLen |`,
  divider: `| --- | ----- | -------- | ------ | --- | ------ |`,
  newActivityRow: `| x   | 00:00 |          | 0      |     | 0      |`,
  endRow: `| x   | 00:00 | END      | 0      |     | 0      |`,
}

export const DEFAULT_PLAN_NOTE_CONTENT = `## Plan\n${Object.values(PlanLinesLiteral).join('\n')}
`

export const DEFAULT_CIRCLE_PROGRESS_SIZE = 16
export const NO_ACTIVITY_NAME_PLACEHOLDER = '[No Name]'

export const CURSOR_CH_AFTER_FOCUS = 3

export const TriggerScheduleColumn: PlanCellType[] = ['length', 'start', 'f', 'r']

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
export enum ViewUpdateFlags {
  TABLE_BLUR = 6,
  TABLE_FOCUS = 7,
}
