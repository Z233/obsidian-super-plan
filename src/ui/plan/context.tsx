import { TableCell, TableRow } from '@tgrosinger/md-advanced-tables'
import { nanoid } from 'nanoid'
import type { App } from 'obsidian'
import { createContext, useContext, useRef, type FC } from 'preact/compat'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ColumnKeys, ColumnKeysMap, Columns } from 'src/constants'
import type { MdTableEditor } from 'src/editor/md-table-editor'
import type { PlanDataItem } from 'src/schemas'
import { generateId } from 'src/util/helper'

type PlanContextValue = {
  mte: MdTableEditor
  app: App
}

const PlanContext = createContext<PlanContextValue>(null as unknown as PlanContextValue)

const IGNORED_CELLS: ColumnKeys[] = [ColumnKeys.Activity]

export type FocusPosition = {
  rowIndex: number
  columnKey: ColumnKeys
}

export const PlanProvider: FC<{ mte: MdTableEditor; app: App }> = (props) => {
  const { mte } = props

  return (
    <PlanContext.Provider
      value={{
        mte,
        app,
      }}
    >
      <DndProvider backend={HTML5Backend}>{props.children}</DndProvider>
    </PlanContext.Provider>
  )
}

export function usePlanContext() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlanContext must be used within <PlanProvider />')
  }
  return context
}

type PlanActions = {
  updateCell: (row: number, columnKey: ColumnKeys, value: string) => void
  deleteRow: (row: number) => void
  insertRowBelow: (row: number) => void
  moveRow: (from: number, to: number) => void
  duplicateRow: (row: number) => void
}

export function usePlan() {
  const { mte } = usePlanContext()

  const updateCell: PlanActions['updateCell'] = (row, columnKey, value) => {
    mte.setCellAt(row, ColumnKeysMap[columnKey], value)
    mte.applyChanges()
  }

  const deleteRow: PlanActions['deleteRow'] = (row) => {
    mte.deleteRow(row)
    mte.applyChanges()
  }

  const insertRowBelow: PlanActions['insertRowBelow'] = (row) => {
    const cells = Array.from({ length: mte.getHeaderWidth() }, (_, i) =>
      i === 0 ? new TableCell(generateId()) : new TableCell(' ')
    )
    const tableRow = new TableRow(cells, '', '')
    mte.insertRow(tableRow, row + 1)
    mte.applyChanges()
  }

  const moveRow: PlanActions['moveRow'] = (from, to) => {
    mte.moveRow(from, to)
    mte.applyChanges()
  }

  const duplicateRow: PlanActions['duplicateRow'] = (row) => {
    const targetRow = mte.getRow(row + 2)
    const cells = targetRow
      .getCells()
      .map((cell, index) => new TableCell(index === Columns.ID ? nanoid(6) : cell.content))
    const duplicatedRow = new TableRow(cells, '', '')
    mte.insertRow(duplicatedRow, row + 1)
    mte.applyChanges()
  }

  return {
    updateCell,
    deleteRow,
    insertRowBelow,
    moveRow,
    duplicateRow,
  }
}
