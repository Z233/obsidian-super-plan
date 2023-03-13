import {
  defaultOptions,
  formatTable,
  Table,
  TableEditor,
  readTable,
} from '@tgrosinger/md-advanced-tables'
import { MarkdownView, type App, type TFile } from 'obsidian'
import { UpdateFlag } from 'src/constants'
import type { Maybe } from 'src/types'
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
  private readonly _startRow: number
  private readonly _endRow: number

  constructor({ app, file, table, startRow, endRow }: MdTableEditorOptions) {
    this._app = app
    this._file = file
    this._table = table
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

  setFocusState(focusState: Maybe<{ row: number; col: number }>) {
    this._focusState = focusState ?? null
  }

  getFocusState() {
    return this._focusState
  }

  applyChanges() {
    this._ensureEditorLoaded()

    if (!this._mte) throw new Error('No active editor')

    const formatted = formatTable(this._table, defaultOptions)
    const newLines = formatted.table.toLines()

    window[UpdateFlag] = true
    this._mte._updateLines(this._startRow, this._endRow + 1, newLines)
    window[UpdateFlag] = false

    this._mte._updateLines(this._startRow, this._startRow + 1, [newLines[0] + ' '])
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
