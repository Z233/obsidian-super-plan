import { defaultOptions, formatTable, Table, TableEditor } from '@tgrosinger/md-advanced-tables'
import type { App, Editor, TFile } from 'obsidian'
import { ObsidianTextEditor } from './obsidian-text-editor'

type MdTableEditorOptions = {
  app: App
  file: TFile
  editor: Editor
  table: Table
  startRow: number
  endRow: number
}

export class MdTableEditor {
  private _mte: TableEditor
  private _table: Table
  private _startRow: number
  private _endRow: number

  constructor({ app, file, table, editor, startRow, endRow }: MdTableEditorOptions) {
    const ote = new ObsidianTextEditor(app, file, editor)
    this._mte = new TableEditor(ote)
    this._table = table
    this._startRow = startRow
    this._endRow = endRow
  }

  updateCell(row: number, col: number, value: string) {
    console.log({ row, col, value })
    const newTable = this._table.setCellAt(row + 2, col, value)
    this._updateTable(newTable)
  }

  private _updateTable(newTable: Table) {
    const formatted = formatTable(newTable, defaultOptions)
    this._table = formatted.table
    this._mte._updateLines(this._startRow, this._endRow, newTable.toLines())
  }
}
