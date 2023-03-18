import { TableCell, TableRow } from '@tgrosinger/md-advanced-tables'
import { nanoid } from 'nanoid'
import { createContext, useContext, useRef, type FC } from 'preact/compat'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ColumnKeys, ColumnKeysMap } from 'src/constants'
import type { MdTableEditor } from 'src/editor/md-table-editor'
import type { PlanDataItem } from 'src/schemas'

type PlanContextValue = {
  mte: MdTableEditor
}

const PlanContext = createContext<PlanContextValue>(null as unknown as PlanContextValue)

const IGNORED_CELLS: ColumnKeys[] = [ColumnKeys.Activity]

export type FocusPosition = {
  rowIndex: number
  columnKey: ColumnKeys
}

export const PlanProvider: FC<{ mte: MdTableEditor }> = (props) => {
  const { mte } = props

  return (
    <PlanContext.Provider
      value={{
        mte,
      }}
    >
      <DndProvider backend={HTML5Backend}>{props.children}</DndProvider>
    </PlanContext.Provider>
  )
}

function usePlanContext() {
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
    const cells = Array.from({ length: 7 }, (_, i) =>
      i === 0 ? new TableCell(nanoid(6)) : new TableCell(' ')
    )
    const tableRow = new TableRow(cells, '', '')
    mte.insertRow(tableRow, row + 1)
    mte.applyChanges()
  }

  const moveRow: PlanActions['moveRow'] = (from, to) => {
    mte.moveRow(from, to)
    mte.applyChanges()
  }

  return {
    updateCell,
    deleteRow,
    insertRowBelow,
    moveRow,
  }
}
