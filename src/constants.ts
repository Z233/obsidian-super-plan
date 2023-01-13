export const PlanLinesLiteral = {
  header: `| F   | Activity | Length | Start | R   | ActLen |`,
  divider: `| --- | -------- | ------ | ----- | --- | ------ |`,
  newActivityRow: `| x   |          | 0      | 00:00 |     | 0      |`,
  endRow: `| x   | END      | 0      | 00:00 |     | 0      |`,
}

export const DEFAULT_PLAN_NOTE_CONTENT = `## Plan\n${Object.values(
  PlanLinesLiteral
).join('\n')}
`

export const DEFAULT_CIRCLE_PROGRESS_SIZE = 16
export const NO_ACTIVITY_NAME_PLACEHOLDER = '[No Name]'

export const CURSOR_CH_AFTER_FOCUS = 3

export enum ActivityDataColumn {
  'f',
  'activity',
  'length',
  'start',
  'r',
  'actLen',
}

export enum ProgressType {
  BAR = 'BAR',
  CIRCLE = 'CIRCLE',
}
