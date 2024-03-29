import { TableCell, TableRow, defaultOptions, readTable } from '@tgrosinger/md-advanced-tables'
import type { atom } from 'jotai'
import { nanoid } from 'nanoid'
import type { App } from 'obsidian'
import { type FC, createContext, useCallback, useContext } from 'preact/compat'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import type { ColumnKeys } from 'src/constants'
import { ColumnKeysMap, Columns } from 'src/constants'
import type { MdTableEditor } from 'src/editor/md-table-editor'
import type { SuperPlanSettings } from 'src/setting/settings'
import { generateId } from 'src/util/helper'
import type { CellPosition } from './types'

interface PlanContextValue {
  mte: MdTableEditor
  app: App
  settings: SuperPlanSettings
}

const PlanContext = createContext<PlanContextValue>(null as unknown as PlanContextValue)

export interface FocusPosition {
  rowIndex: number
  columnKey: ColumnKeys
}

export const PlanProvider: FC<{ mte: MdTableEditor; app: App; settings: SuperPlanSettings }> = (
  props,
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
  if (!context)
    throw new Error('usePlanContext must be used within <PlanProvider />')

  return context
}

type PlanActionReturnType = ReturnType<MdTableEditor['applyChanges']>

interface PlanActions {
  updateCell: (row: number, columnKey: ColumnKeys, value: string) => PlanActionReturnType
  deleteRow: (row: number) => PlanActionReturnType
  insertRowBelow: (row: number) => PlanActionReturnType
  moveRow: (from: number, to: number) => PlanActionReturnType
  duplicateRow: (row: number) => PlanActionReturnType
  cutRow: (row: number) => Promise<string>
  getRowText: (row: number) => string
  insertRawRowBelow: (row: number, line: string) => PlanActionReturnType
}

export function usePlan() {
  const { mte } = usePlanContext()

  const updateCell: PlanActions['updateCell'] = useCallback(
    (row, columnKey, value) => {
      mte.setCellAt(row, ColumnKeysMap[columnKey], value)
      return mte.applyChanges()
    },
    [mte],
  )

  const deleteRow: PlanActions['deleteRow'] = useCallback(
    (row) => {
      mte.deleteRow(row)
      return mte.applyChanges()
    },
    [mte],
  )

  const insertRowBelow: PlanActions['insertRowBelow'] = useCallback(
    (row) => {
      const cells = Array.from({ length: mte.getHeaderWidth() }, (_, i) => i === 0 ? new TableCell(generateId()) : new TableCell(' '))
      const tableRow = new TableRow(cells, '', '')
      mte.insertRow(tableRow, row + 1)
      return mte.applyChanges()
    },
    [mte],
  )

  const insertRawRowBelow: PlanActions['insertRawRowBelow'] = useCallback(
    (row, line) => {
      const table = readTable([line], defaultOptions)
      const tableRow = table.getRows()[0]
      mte.insertRow(tableRow.setCellAt(0, generateId()), row + 1)
      return mte.applyChanges()
    },
    [mte],
  )

  const moveRow: PlanActions['moveRow'] = useCallback(
    (from, to) => {
      mte.moveRow(from, to)
      return mte.applyChanges()
    },
    [mte],
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
    [mte],
  )

  const cutRow: PlanActions['cutRow'] = useCallback(
    async (row) => {
      const line = mte.getLine(row)
      mte.deleteRow(row)
      return mte.applyChanges().then(() => line)
    },
    [mte],
  )

  const getRowText = useCallback(
    (row: number) => {
      return mte.getLine(row)
    },
    [mte],
  )

  return {
    updateCell,
    deleteRow,
    insertRowBelow,
    moveRow,
    duplicateRow,
    cutRow,
    getRowText,
    insertRawRowBelow,
  }
}

interface PlanAtoms {
  highlightingRowIdAtom: ReturnType<typeof atom<string>>
  focusCellAtom: ReturnType<typeof atom<CellPosition | null>>
}

const AtomsContext = createContext<PlanAtoms>(null as unknown as PlanAtoms)

export const PlanAtomsProvider: FC<PlanAtoms> = (props) => {
  return <AtomsContext.Provider value={props}>{props.children}</AtomsContext.Provider>
}

export function usePlanAtoms() {
  const context = useContext(AtomsContext)
  if (!context)
    throw new Error('usePlanAtoms must be used within <PlanAtomsProvider />')

  return context
}
