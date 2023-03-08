import { defaultOptions, formatTable, Table, TableEditor } from '@tgrosinger/md-advanced-tables'
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

export class MdTableEditor {
  private _mte: Maybe<TableEditor>

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

  setCellAt(row: number, col: number, value: string) {
    const newTable = this._table.setCellAt(row + 2, col, value)
    this._updateTable(newTable)
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
