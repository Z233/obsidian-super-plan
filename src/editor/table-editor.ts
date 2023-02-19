import {
  TableEditor as MdTableEditor,
  Point,
  Table,
  TableCell,
  TableRow,
  formatTable,
  readTable,
  completeTable,
  insertRow,
} from '@tgrosinger/md-advanced-tables'
import { deleteRow } from '@tgrosinger/md-advanced-tables/lib/formatter'
import { isEqual } from 'lodash-es'
import type { App, Editor, TFile, EditorRange } from 'obsidian'
import { PlanLinesLiteral, TriggerScheduleColumn } from '../constants'
import { ObsidianTextEditor } from './obsidian-text-editor'
import type { SuperPlanSettings } from '../setting/settings'
import type {
  ActivitiesData,
  PlanTableState,
  ActivityData,
  Maybe,
  PlanCellType,
  PlanTableInfo,
  UnsafeEditor,
} from '../types'
import {
  check,
  getActivityDataIndex,
  getActivityDataKey,
  getNowMins,
  parseMins2Time,
  removeSpacing,
  transformTable,
} from '../util/helper'
import { Scheduler } from 'src/scheduler'

export class TableEditor {
  private readonly settings: SuperPlanSettings
  private readonly mte: MdTableEditor
  private readonly ote: ObsidianTextEditor

  constructor(file: TFile, private editor: Editor, settings: SuperPlanSettings) {
    this.settings = settings

    this.ote = new ObsidianTextEditor(app, file, editor, settings)
    this.mte = new MdTableEditor(this.ote)
  }

  private getActivitiesData(): ActivitiesData {
    if (!this.tableInfo) return []
    return transformTable(this.tableInfo.table)
  }

  private get tableInfo() {
    return this.mte._findTable(this.settings.asOptions())
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

    const scheduler = new Scheduler(activitiesData)
    scheduler.schedule()
    const scheduledActivitiesData = scheduler.getData()

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

    this.mte._updateLines(range.start.row, range.end.row + 1, formatted.table.toLines(), lines)
    this.mte._moveToFocus(range.start.row, formatted.table, focus)
    if (shouldSelectCell) {
      this.mte.selectCell(this.settings.asOptions())
    }

    return formatted.table
  }

  getState(): PlanTableState | null {
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

  cursorIsInPlan(): boolean {
    if (!this.tableInfo) return false
    const headerLine = this.tableInfo.lines[0]
    return removeSpacing(headerLine) === removeSpacing(PlanLinesLiteral.header)
  }

  cursorIsInTable(): boolean {
    return this.mte.cursorIsInTable(this.settings.asOptions())
  }

  insertActivityBelow() {
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

      this.mte._moveToFocus(range.start.row, updatedTable, newFocus)
      this.mte.resetSmartCursor()
    } else {
      console.error('Insertion failed')
    }
  }

  insertActivityAbove() {
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
      this.mte._moveToFocus(range.start.row, updatedTable, newFocus)
      this.mte.resetSmartCursor()
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

  beginCursorActivity() {
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

  toggleFixCursorActivity() {
    const cursor = this.getCursorActivityData()
    if (!cursor) return
    const { data: cursorActivityData, index } = cursor
    const activitiesData = this.getActivitiesData()

    const updatedActivityData: ActivityData = {
      ...cursorActivityData,
      f: check(cursorActivityData.f) ? '' : 'x',
    }
    activitiesData[index] = updatedActivityData

    this.schedule(activitiesData)
  }

  ignoreActivity() {
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

  splitActivity(firstLength: number, secondLength: number) {
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

    this.mte._updateLines(range.start.row, range.end.row + 1, formatted.table.toLines(), lines)
    this.mte._moveToFocus(
      range.start.row,
      formatted.table,
      focus.setRow(firstIndex + 1).setColumn(getActivityDataIndex('activity'))
    )

    this.schedule(this.getActivitiesData())
  }

  unfixAllActivities() {
    const activitiesData = this.getActivitiesData()
    const updatedActivityData = activitiesData.map((a, i) =>
      // Do not alter the first and last activity
      i === 0 || i === activitiesData.length - 1
        ? a
        : {
            ...a,
            f: '',
          }
    )

    this.schedule(updatedActivityData)
  }

  insertPlanTable() {
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
      this.mte._selectFocus(
        row,
        completedTable,

        focus.setRow(2).setColumn(getActivityDataIndex('start')).setOffset(1)
      )
    }
  }

  deleteRow() {
    this.mte.deleteRow(this.settings.asOptions())
  }

  executeScheduleOutside(tableInfo: PlanTableInfo, lastState: PlanTableState) {
    const { table, range, lines } = tableInfo

    const activitiesData = transformTable(table)

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

    const scheduler = new Scheduler(activitiesData)
    scheduler.schedule()
    const scheduledActivitiesData = scheduler.getData()

    const rows = scheduledActivitiesData.map((data) => this.createActivityRow(data, table))

    const [header, delimiter] = table.getRows()
    const newTable = new Table([header, delimiter, ...rows])

    const formatted = formatTable(newTable, this.settings.asOptions())

    this.mte._updateLines(range.start.row, range.end.row + 1, formatted.table.toLines(), lines)
  }

  executeSchedule(
    lastState: Maybe<PlanTableState>,
    shouldSetFixed = false,
    force = false
  ): Maybe<PlanTableState> {
    if (!this.tableInfo || !lastState || (!force && !this.shouldSchedule(lastState.type))) return

    const activitiesData = this.getActivitiesData()
    const { cell: lastCell, row: lastRow, table: lastTable } = lastState
    const rows = lastTable.getRows()
    const rowIndex = rows.findIndex((r) => r === lastRow)
    const columnIndex = rows[rowIndex].getCells().findIndex((c) => c === lastCell)

    const { table, range, lines, focus } = this.tableInfo

    if (lastState.type === 'start' && shouldSetFixed) {
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

      this.mte._updateLines(range.start.row, range.end.row + 1, formatted.table.toLines(), lines)
      this.mte._moveToFocus(range.start.row, formatted.table, focus)
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

  moveLeft() {
    if (!this.tableInfo) return

    const columnCount = this.tableInfo.table.getRows()[0].getCells().length
    const isFirstColumn = this.tableInfo.focus.column === 0

    if (isFirstColumn) {
      this.moveFocus(0, columnCount - 1)
    } else {
      this.moveFocus(0, -1)
    }
  }

  moveUp() {
    if (!this.tableInfo) return

    const { table, focus } = this.tableInfo

    const rowCount = table.getRows().length
    const isFirstRow = focus.row === 0

    if (isFirstRow) {
      this.moveFocus(rowCount - 1, 0)
    } else {
      this.moveFocus(-1, 0)
    }
  }

  moveRight() {
    if (!this.tableInfo) return

    const columnCount = this.tableInfo.table.getRows()[0].getCells().length
    const isLastColumn = this.tableInfo.focus.column === columnCount - 1

    if (isLastColumn) {
      this.moveFocus(0, -columnCount + 1)
    } else {
      this.moveFocus(0, 1)
    }
  }

  moveDown() {
    if (!this.tableInfo) return

    const { table, focus } = this.tableInfo

    const rowCount = table.getRows().length
    const isLastRow = focus.row === rowCount - 1

    if (isLastRow) {
      this.moveFocus(-rowCount + 1, 0)
    } else {
      this.moveFocus(1, 0)
    }
  }

  moveToNextRow() {
    this.mte.nextRow(this.settings.asOptions())
  }

  moveToPreviousRow() {}

  moveToNextCell() {
    if (!this.tableInfo) return

    const columnCount = this.tableInfo.table.getRows()[0].getCells().length
    const isLastColumn = this.tableInfo.focus.column === columnCount - 1

    this.moveFocus(isLastColumn ? 1 : 0, isLastColumn ? -columnCount + 1 : 1)
  }

  moveToPreviousCell() {
    this.mte.previousCell(this.settings.asOptions())
  }

  moveFocus(rowOffset: number, columnOffset: number) {
    this.mte.moveFocus(rowOffset, columnOffset, this.settings.asOptions())
  }

  clearHighlights() {
    const editor = this.editor as UnsafeEditor

    if (editor.hasHighlight()) {
      editor.removeHighlights()
    }
  }
}
