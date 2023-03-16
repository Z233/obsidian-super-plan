import { TableCell, TableRow } from '@tgrosinger/md-advanced-tables'
import { nanoid } from 'nanoid'
import { createContext, useContext, useEffect, useReducer, useRef, type FC } from 'preact/compat'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ColumnKeys, ColumnKeysMap, Columns } from 'src/constants'
import type { MdTableEditor } from 'src/editor/md-table-editor'
import type { PlanDataItem } from 'src/schemas'
import type { Maybe } from 'src/types'
import type { FocusPosition } from './PlanTable'

type PlanContextValue = {
  updateCell: (row: number, columnKey: ColumnKeys, value: string) => void
  deleteRow: (row: number) => void
  insertRowBelow: (row: number) => void
  moveRow: (from: number, to: number) => void
  setFocus: (pos: Maybe<FocusPosition>) => void
  getFocus: () => Maybe<FocusPosition>
  rerender: (...args: any) => void
  seed: number
}

const PlanContext = createContext<PlanContextValue>(null as unknown as PlanContextValue)

const IGNORED_CELLS: ColumnKeys[] = [ColumnKeys.Activity]

export const PlanProvider: FC<{ mte: MdTableEditor }> = (props) => {
  const { mte } = props
  const updatedCells = useRef(new Set<keyof PlanDataItem>())

  const [seed, rerender] = useReducer((v) => v + 1, 0)

  const updateCell: PlanContextValue['updateCell'] = (row, columnKey, value) => {
    updatedCells.current.add(columnKey)

    mte.setCellAt(row, ColumnKeysMap[columnKey], value)
    mte.applyChanges()
  }

  const deleteRow: PlanContextValue['deleteRow'] = (row) => {
    mte.deleteRow(row)
    mte.applyChanges()
  }

  const insertRowBelow: PlanContextValue['insertRowBelow'] = (row) => {
    const cells = Array.from({ length: 7 }, (_, i) =>
      i === 0 ? new TableCell(nanoid(6)) : new TableCell(' ')
    )
    const tableRow = new TableRow(cells, '', '')
    mte.insertRow(tableRow, row + 1)
    mte.setFocusState({ row: row + 1, col: ColumnKeysMap[ColumnKeys.Activity] })
    mte.applyChanges()
  }

  const moveRow: PlanContextValue['moveRow'] = (from, to) => {
    mte.moveRow(from, to)
    mte.applyChanges()
  }

  const setFocus: PlanContextValue['setFocus'] = (pos) => {
    if (pos) {
      mte.setFocusState({ row: pos.rowIndex, col: ColumnKeysMap[pos.columnKey] })
    } else {
      mte.setFocusState(null)
    }
  }

  const getFocus: PlanContextValue['getFocus'] = () => {
    const focusState = mte.getFocusState()
    if (!focusState) return null
    const { row: rowIndex, col } = focusState
    return { rowIndex, columnKey: ColumnKeysMap[col as Columns] }
  }

  return (
    <PlanContext.Provider
      value={{
        updateCell,
        deleteRow,
        insertRowBelow,
        moveRow,
        setFocus,
        getFocus,
        rerender,
        seed,
      }}
    >
      <DndProvider backend={HTML5Backend}>{props.children}</DndProvider>
    </PlanContext.Provider>
  )
}

export function usePlanContext() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('useMteContext must be used within <MteProvider />')
  }
  return context
}
