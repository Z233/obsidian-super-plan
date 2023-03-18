import {
  defaultOptions,
  formatTable,
  Table,
  TableEditor,
  readTable,
  TableRow,
} from '@tgrosinger/md-advanced-tables'
import { MarkdownView, type App, type TFile } from 'obsidian'
import type { Maybe } from 'src/types'
import { debounceRAF } from 'src/util/helper'
import { ObsidianTextEditor } from './obsidian-text-editor'

type MdTableEditorOptions = {
  app: App
  file: TFile
  table: Table
  startRow: number
  endRow: number
}

type FocusState = {
  row: number
  col: number
}

export class MdTableEditor {
  private _mte: Maybe<TableEditor>
  private _focusState: Maybe<FocusState>

  private _app: App
  private _file: TFile
  private _table: Table
  private _startRow: number
  private _endRow: number

  constructor({ app, file, table, startRow, endRow }: MdTableEditorOptions) {
    this._app = app
    this._file = file
    this._table = table
    this._startRow = startRow
    this._endRow = endRow
  }

  setRange(startRow: number, endRow: number) {
    this._startRow = startRow
    this._endRow = endRow
  }

  setCellAt(row: number, col: number, value: string) {
    const newTable = this._table.setCellAt(row + 2, col, value)
    this._updateTable(newTable)
  }

  deleteRow(row: number) {
    const lines = this._table.toLines()
    const newLines = lines.slice(0, row + 2).concat(lines.slice(row + 3))
    const newTable = readTable(newLines, defaultOptions)
    this._updateTable(newTable)
  }

  insertRow(tableRow: TableRow, targetRow: number) {
    const lines = this._table.toLines()
    const newLines = lines
      .slice(0, targetRow + 2)
      .concat([tableRow.toText()], lines.slice(targetRow + 2))
    const newTable = readTable(newLines, defaultOptions)
    this._updateTable(newTable)
  }

  moveRow(from: number, to: number) {
    const lines = this._table.toLines().concat()
    const row = lines.splice(from + 2, 1)[0]
    lines.splice(to + 2, 0, row)
    const newTable = readTable(lines, defaultOptions)
    this._updateTable(newTable)
  }

  setFocusState(focusState: Maybe<{ row: number; col: number }>) {
    this._focusState = focusState ?? null
  }

  getFocusState() {
    return this._focusState
  }

  applyChanges = debounceRAF(this._applyChangesOrigin.bind(this))

  private _applyChangesOrigin() {
    this._ensureEditorLoaded()

    if (!this._mte) throw new Error('No active editor')

    const formatted = formatTable(this._table, defaultOptions)
    const newLines = formatted.table.toLines()

    this._mte._updateLines(this._startRow, this._endRow + 1, newLines)
  }

  private _ensureEditorLoaded() {
    if (this._mte) return
    const editor = this._app.workspace.getActiveViewOfType(MarkdownView)?.editor

    if (!editor) throw new Error('No active editor')

    const ote = new ObsidianTextEditor(app, this._file, editor)
    this._mte = new TableEditor(ote)
  }

  private _updateTable(newTable: Table) {
    this._table = newTable
  }
}
