import { TableCell, TableRow } from '@tgrosinger/md-advanced-tables'
import { nanoid } from 'nanoid'
import type { App } from 'obsidian'
import { createContext, useContext, useRef, type FC, useCallback } from 'preact/compat'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ColumnKeys, ColumnKeysMap, Columns } from 'src/constants'
import type { MdTableEditor } from 'src/editor/md-table-editor'
import type { SuperPlanSettings } from 'src/setting/settings'
import { generateId } from 'src/util/helper'

type PlanContextValue = {
  mte: MdTableEditor
  app: App
  settings: SuperPlanSettings
}

const PlanContext = createContext<PlanContextValue>(null as unknown as PlanContextValue)

const IGNORED_CELLS: ColumnKeys[] = [ColumnKeys.Activity]

export type FocusPosition = {
  rowIndex: number
  columnKey: ColumnKeys
}

export const PlanProvider: FC<{ mte: MdTableEditor; app: App; settings: SuperPlanSettings }> = (
  props
) => {
  const { mte, app, settings } = props

  return (
    <PlanContext.Provider
      value={{
        mte,
        app,
        settings,
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

type PlanActionReturnType = ReturnType<MdTableEditor['applyChanges']>

type PlanActions = {
  updateCell: (row: number, columnKey: ColumnKeys, value: string) => PlanActionReturnType
  deleteRow: (row: number) => PlanActionReturnType
  insertRowBelow: (row: number) => PlanActionReturnType
  moveRow: (from: number, to: number) => PlanActionReturnType
  duplicateRow: (row: number) => PlanActionReturnType
}

export function usePlan() {
  const { mte } = usePlanContext()

  const updateCell: PlanActions['updateCell'] = useCallback(
    (row, columnKey, value) => {
      mte.setCellAt(row, ColumnKeysMap[columnKey], value)
      return mte.applyChanges()
    },
    [mte]
  )

  const deleteRow: PlanActions['deleteRow'] = useCallback(
    (row) => {
      mte.deleteRow(row)
      return mte.applyChanges()
    },
    [mte]
  )

  const insertRowBelow: PlanActions['insertRowBelow'] = useCallback(
    (row) => {
      const cells = Array.from({ length: mte.getHeaderWidth() }, (_, i) =>
        i === 0 ? new TableCell(generateId()) : new TableCell(' ')
      )
      const tableRow = new TableRow(cells, '', '')
      mte.insertRow(tableRow, row + 1)
      return mte.applyChanges()
    },
    [mte]
  )

  const moveRow: PlanActions['moveRow'] = useCallback(
    (from, to) => {
      mte.moveRow(from, to)
      return mte.applyChanges()
    },
    [mte]
  )

  const duplicateRow: PlanActions['duplicateRow'] = useCallback(
    (row) => {
      const targetRow = mte.getRow(row + 2)
      const cells = targetRow
        .getCells()
        .map((cell, index) => new TableCell(index === Columns.ID ? nanoid(6) : cell.content))
      const duplicatedRow = new TableRow(cells, '', '')
      mte.insertRow(duplicatedRow, row + 1)
      return mte.applyChanges()
    },
    [mte]
  )

  return {
    updateCell,
    deleteRow,
    insertRowBelow,
    moveRow,
    duplicateRow,
    isApplying: mte.isApplying,
  }
}
