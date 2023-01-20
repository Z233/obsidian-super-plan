import {
  TableEditor,
  Point,
  Table,
  TableCell,
  TableRow,
  formatTable,
  readTable,
  completeTable,
  insertRow,
  Focus,
} from '@tgrosinger/md-advanced-tables'
import { deleteRow } from '@tgrosinger/md-advanced-tables/lib/formatter'
import type { FormattedTable } from '@tgrosinger/md-advanced-tables/lib/formatter'
import { isEqual } from 'lodash-es'
import type { App, Editor, TFile } from 'obsidian'
import { PlanLinesLiteral, TriggerScheduleColumn } from './constants'
import { ObsidianTextEditor } from './obsidian-text-editor'
import type { Parser } from './parser'
import { Plan } from './plan'
import type { SuperPlanSettings } from './settings'
import type {
  ActivitiesData,
  PlanTableState,
  ActivityData,
  Maybe,
  PlanCellType,
  PlanTableInfo,
} from './types'
import {
  check,
  getActivityDataIndex,
  getActivityDataKey,
  getNowMins,
  parseMins2Time,
  removeSpacing,
} from './utils/helper'
import type { EditorView } from '@codemirror/view'

export class PlanEditor {
  private readonly app: App
  private readonly settings: SuperPlanSettings
  private readonly te: TableEditor
  private readonly ote: ObsidianTextEditor
  private readonly parser: Parser

  // private readonly plan: Plan | null = null;

  constructor(app: App, file: TFile, editor: Editor, parser: Parser, settings: SuperPlanSettings) {
    this.app = app
    this.settings = settings
    this.parser = parser

    this.ote = new ObsidianTextEditor(app, file, editor, settings)
    this.te = new TableEditor(this.ote)
  }

  private getActivitiesData(): ActivitiesData {
    if (!this.tableInfo) return []
    return this.parser.transformTable(this.tableInfo.table)
  }

  private get tableInfo() {
    return this.te._findTable(this.settings.asOptions())
  }

  private createActivityCells(activityData: Partial<ActivityData>, table: Table) {
    return Array.from(
      { length: table.getHeaderWidth() },
      (v, i) => new TableCell(activityData[getActivityDataKey(i)] ?? '')
    )
  }

  private createActivityRow(activityData: Partial<ActivityData>, table: Table) {
    return new TableRow(this.createActivityCells(activityData, table), '', '')
  }

  private shouldSchedule(type: PlanCellType) {
    return TriggerScheduleColumn.contains(type)
  }

  private schedule(activitiesData: ActivitiesData) {
    if (!this.tableInfo || activitiesData.length < 2) return

    const plan = new Plan(activitiesData)
    plan.schedule()
    const scheduledActivitiesData = plan.getData()

    const shouldUpdate = !isEqual(this.getActivitiesData(), scheduledActivitiesData)
    if (!shouldUpdate) return

    const { table, range, lines, focus } = this.tableInfo

    const selection = window.getSelection()
    const selectionRange = selection && selection.rangeCount > 0 && selection.getRangeAt(0)
    const shouldSelectCell =
      !!selectionRange && selectionRange.endOffset > selectionRange.startOffset

    const rows = scheduledActivitiesData.map((data) => this.createActivityRow(data, table))

    const [header, delimiter] = table.getRows()

    const newTable = new Table([header, delimiter, ...rows])

    // format
    const formatted = formatTable(newTable, this.settings.asOptions())

    this.te._updateLines(range.start.row, range.end.row + 1, formatted.table.toLines(), lines)
    this.te._moveToFocus(range.start.row, formatted.table, focus)
    if (shouldSelectCell) {
      this.te.selectCell(this.settings.asOptions())
    }

    return formatted.table
  }

  public readonly getState = (): PlanTableState | null => {
    if (!this.tableInfo) return null
    const table = this.tableInfo.table
    const cursor = this.ote.getCursorPosition()
    const rowOffset = this.tableInfo!.range.start.row

    const focus = table.focusOfPosition(cursor, rowOffset)

    if (focus) {
      const focusedRow = table.getRows()[focus.row]
      const focusedCell = table.getFocusedCell(focus)
      const focusedCellIndex = focusedRow.getCells().findIndex((c) => c === focusedCell)
      return {
        type: getActivityDataKey(focusedCellIndex),
        cell: focusedCell!,
        row: focusedRow,
        table,
        focus,
      }
    }

    return null
  }

  getFocusInTable() {
    return this.tableInfo?.focus
  }

  public readonly cursorIsInPlan = (): boolean => {
    if (!this.tableInfo) return false
    const headerLine = this.tableInfo.lines[0]
    return removeSpacing(headerLine) === removeSpacing(PlanLinesLiteral.header)
  }

  public readonly cursorIsInTable = (): boolean =>
    this.te.cursorIsInTable(this.settings.asOptions())

  public readonly insertActivityBelow = (): void => {
    if (!this.tableInfo) return

    const { table, range, lines, focus } = this.tableInfo

    const activitiesData = this.getActivitiesData()
    const currentIndex = focus.row - 2
    const current = activitiesData[currentIndex]
    const next = activitiesData[currentIndex + 1]

    const isLast = focus.row === lines.length - 1

    // if the focus item is the first activity, change its status to unfixed
    if (isLast) {
      activitiesData[currentIndex] = {
        ...current,
        f: '',
      }
    }

    const newActivityData: ActivityData = {
      f: isLast ? 'x' : '',
      activity: '',
      start: next ? next.start : current.start,
      length: '0',
      r: '',
      actLen: '0',
    }
    activitiesData.splice(currentIndex + 1, 0, newActivityData)

    const updatedTable = this.schedule(activitiesData)

    // move focus
    if (updatedTable) {
      let newFocus = focus
      if (focus.row <= 1) {
        newFocus = focus.setRow(2)
      } else {
        newFocus = focus.setRow(focus.row + 1)
      }
      newFocus = newFocus.setColumn(getActivityDataIndex('activity')).setOffset(1)

      this.te._moveToFocus(range.start.row, updatedTable, newFocus)
      this.te.resetSmartCursor()
    } else {
      console.error('Insertion failed')
    }
  }

  public readonly insertActivityAbove = (): void => {
    if (!this.tableInfo) return

    const { range, focus } = this.tableInfo

    const activitiesData = this.getActivitiesData()
    const currentIndex = focus.row - 2
    const current = activitiesData[currentIndex]

    const isFirst = currentIndex === 0

    // if the focus item is the first activity, change its status to unfixed
    if (isFirst) {
      activitiesData[currentIndex] = {
        ...current,
        f: '',
      }
    }

    const newActivityData: ActivityData = {
      f: isFirst ? 'x' : '',
      activity: '',
      start: current.start,
      length: '0',
      r: '',
      actLen: '0',
    }
    activitiesData.splice(currentIndex, 0, newActivityData)

    const updatedTable = this.schedule(activitiesData)

    if (updatedTable) {
      // shift focus to activity column
      const newFocus = focus.setColumn(getActivityDataIndex('activity')).setOffset(1)
      this.te._moveToFocus(range.start.row, updatedTable, newFocus)
      this.te.resetSmartCursor()
    } else {
      console.error('Insertion failed')
    }
  }

  getCursorActivityData(): Maybe<{
    index: number
    data: ActivityData
  }> {
    const focus = this.tableInfo?.focus
    if (!focus) return null
    const index = focus.row - 2
    const activitiesData = this.getActivitiesData()
    const cursorActivityData = activitiesData[index]

    return {
      index,
      data: cursorActivityData,
    }
  }

  public readonly beginCursorActivity = (): void => {
    const cursor = this.getCursorActivityData()
    if (!cursor) return
    const { data: cursorActivityData, index } = cursor
    const activitiesData = this.getActivitiesData()

    const updatedActivityData: ActivityData = {
      ...cursorActivityData,
      start: parseMins2Time(getNowMins()),
      f: 'x',
    }
    activitiesData[index] = updatedActivityData

    this.schedule(activitiesData)
  }

  public readonly fixCursorActivity = () => {
    const cursor = this.getCursorActivityData()
    if (!cursor) return
    const { data: cursorActivityData, index } = cursor
    const activitiesData = this.getActivitiesData()

    const updatedActivityData: ActivityData = {
      ...cursorActivityData,
      f: 'x',
    }
    activitiesData[index] = updatedActivityData

    this.schedule(activitiesData)
  }

  readonly ignoreActivity = () => {
    const cursor = this.getCursorActivityData()
    if (!cursor) return

    const { data: cursorActivityData, index } = cursor
    const activitiesData = this.getActivitiesData()

    const updatedActivityData: ActivityData = {
      ...cursorActivityData,
      length: '0',
      f: '',
    }
    activitiesData[index] = updatedActivityData

    this.schedule(activitiesData)
  }

  public readonly splitActivity = (firstLength: number, secondLength: number) => {
    const cursor = this.getCursorActivityData()
    if (!cursor) return
    const { data, index: rowIndex } = cursor

    const firstActivityData: ActivityData = {
      ...data,
      activity: `${data.activity} (#1)`,
      length: firstLength.toString(),
    }

    const secondActivityData: ActivityData = {
      ...data,
      activity: `${data.activity} (#2)`,
      length: secondLength.toString(),
      f: '',
      r: '',
    }

    const { table, range, lines, focus } = this.tableInfo!
    const firstIndex = rowIndex + 2
    let altered = table
    altered = deleteRow(altered, firstIndex)
    altered = insertRow(altered, firstIndex, this.createActivityRow(firstActivityData, table))
    altered = insertRow(altered, firstIndex + 1, this.createActivityRow(secondActivityData, table))

    const formatted = formatTable(altered, this.settings.asOptions())

    this.te._updateLines(range.start.row, range.end.row + 1, formatted.table.toLines(), lines)
    this.te._moveToFocus(
      range.start.row,
      formatted.table,
      focus.setRow(firstIndex + 1).setColumn(getActivityDataIndex('activity'))
    )

    this.schedule(this.getActivitiesData())
  }

  public readonly nextRow = (): void => {
    this.te.nextRow(this.settings.asOptions())
  }

  public readonly nextCell = (): void => {
    if (!this.tableInfo) return

    const columnCount = this.tableInfo.table.getRows()[0].getCells().length
    const isLastColumn = this.tableInfo.focus.column === columnCount - 1

    this.te.moveFocus(
      isLastColumn ? 1 : 0,
      isLastColumn ? -columnCount + 1 : 1,
      this.settings.asOptions()
    )
  }

  public readonly previousCell = (): void => {
    this.te.previousCell(this.settings.asOptions())
  }

  public readonly insertPlanTable = () => {
    const table = readTable(
      [
        PlanLinesLiteral.header,
        PlanLinesLiteral.divider,
        PlanLinesLiteral.newActivityRow,
        PlanLinesLiteral.endRow,
      ],
      this.settings.asOptions()
    )
    const { table: completedTable } = completeTable(table, this.settings.asOptions())
    const cursor = this.ote.getCursorPosition()
    const { row } = cursor
    this.ote.replaceLines(row, row + 1, table.toLines())
    this.ote.setCursorPosition(new Point(row, 0))

    const focus = completedTable.focusOfPosition(cursor, row)
    if (focus) {
      this.te._selectFocus(
        row,
        completedTable,

        focus.setRow(2).setColumn(getActivityDataIndex('start')).setOffset(1)
      )
    }
  }

  public readonly deleteRow = (): void => {
    this.te.deleteRow(this.settings.asOptions())
  }

  readonly executeBackgroundSchedule = (tableInfo: PlanTableInfo, lastState: PlanTableState) => {
    const { table, range, lines } = tableInfo

    const activitiesData = this.parser.transformTable(table)

    if (lastState.type === 'start') {
      const { cell, focus } = lastState
      const currentData = activitiesData[focus.row - 2]
      if (currentData.start !== cell.content) {
        activitiesData[focus.row - 2] = {
          ...currentData,
          f: 'x',
        }
      }
    }

    const plan = new Plan(activitiesData)
    plan.schedule()
    const scheduledActivitiesData = plan.getData()

    const rows = scheduledActivitiesData.map((data) => this.createActivityRow(data, table))

    const [header, delimiter] = table.getRows()
    const newTable = new Table([header, delimiter, ...rows])

    const formatted = formatTable(newTable, this.settings.asOptions())

    this.te._updateLines(range.start.row, range.end.row + 1, formatted.table.toLines(), lines)
  }

  readonly executeSchedule = (
    lastState: Maybe<PlanTableState>,
    setFixed = false,
    force = false
  ): Maybe<PlanTableState> => {
    if (!this.tableInfo || !lastState || (!force && !this.shouldSchedule(lastState.type))) return

    const activitiesData = this.getActivitiesData()
    const { cell: lastCell, row: lastRow, table: lastTable } = lastState
    const rows = lastTable.getRows()
    const rowIndex = rows.findIndex((r) => r === lastRow)
    const columnIndex = rows[rowIndex].getCells().findIndex((c) => c === lastCell)

    const { table, range, lines, focus } = this.tableInfo

    if (lastState.type === 'start' && setFixed) {
      const updatedActivityData = {
        ...activitiesData[rowIndex - 2],
        f: 'x',
        start: lastCell.content,
      }
      activitiesData[rowIndex - 2] = updatedActivityData
      const newRow = this.createActivityRow(updatedActivityData, table)

      let altered = table
      altered = deleteRow(altered, rowIndex)
      altered = insertRow(altered, rowIndex, newRow)

      // format
      const formatted = formatTable(altered, this.settings.asOptions())

      this.te._updateLines(range.start.row, range.end.row + 1, formatted.table.toLines(), lines)
      this.te._moveToFocus(range.start.row, formatted.table, focus)
    }

    const scheduledTable = this.schedule(activitiesData)
    if (!scheduledTable) return

    const scheduledRow = scheduledTable.getRows()[rowIndex]
    const scheduledCell = scheduledTable.getCellAt(rowIndex, columnIndex)!

    return {
      cell: scheduledCell,
      focus,
      row: scheduledRow,
      table: scheduledTable,
      type: getActivityDataKey(columnIndex),
    }
  }

  readonly moveFocus = (rowOffset: number, columnOffset: number) => {
    this.te.moveFocus(rowOffset, columnOffset, this.settings.asOptions())
  }
}
