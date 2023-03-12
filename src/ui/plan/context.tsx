import { createContext, useContext, useEffect, useState, useRef, type FC } from 'preact/compat'
import { ColumnKeys, ColumnKeysMap, Columns } from 'src/constants'
import type { MdTableEditor } from 'src/editor/md-table-editor'
import { Scheduler } from 'src/scheduler'
import type { PlanData, PlanDataItem } from 'src/schemas'
import type { Maybe } from 'src/types'
import { useImmer } from 'use-immer'
import type { FocusPosition } from './PlanTable'

type PlanContextValue = {
  updateCell: (row: number, columnKey: ColumnKeys, value: string) => void
  setFocus: (pos: Maybe<FocusPosition>) => void
  getFocus: () => Maybe<FocusPosition>
}

const PlanContext = createContext<PlanContextValue>(null as unknown as PlanContextValue)

const shallowCompare = (obj1: Record<any, any>, obj2: Record<any, any>) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every((key) => obj2.hasOwnProperty(key) && obj1[key] === obj2[key])

const IGNORED_CELLS: ColumnKeys[] = [ColumnKeys.Activity]

export const PlanProvider: FC<{ mte: MdTableEditor; data: PlanData }> = (props) => {
  const { mte, data: initialData } = props
  const previousDataRef = useRef(initialData)
  const updatedCells = useRef(new Set<keyof PlanDataItem>())
  const [data, setData] = useImmer(initialData)

  const updateCell: PlanContextValue['updateCell'] = (row, columnKey, value) => {
    updatedCells.current.add(columnKey)

    if (IGNORED_CELLS.includes(columnKey)) {
      mte.setCellAt(row, ColumnKeysMap[columnKey], value)
    }

    setData((draft) => {
      previousDataRef.current = data
      draft[row][columnKey] = value
    })
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

  useEffect(() => {
    const updatedCellsArr = [...updatedCells.current]
    const shouldSchedule = !(
      updatedCellsArr.length && updatedCellsArr.every((key) => IGNORED_CELLS.includes(key))
    )

    if (!shouldSchedule) {
      mte.applyChanges()
      return
    }

    const scheduler = new Scheduler(data)
    scheduler.schedule()

    const scheduledData = scheduler.getData()

    if (!scheduledData.every((d, i) => shallowCompare(d, previousDataRef.current[i]))) {
      // Iterate over the scheduled data and compare it to the old data.
      // If there are any changes, get the row and column of the change.
      for (let row = 0; row < scheduledData.length; row++) {
        const oldItem = previousDataRef.current[row]
        const newItem = scheduledData[row]

        Object.entries(newItem).forEach(([k, value], col) => {
          const key = k as keyof PlanDataItem
          if (oldItem[key] !== value) {
            mte.setCellAt(row, col, value)
          }
        })
      }

      mte.applyChanges()
    }
  }, [data])

  return (
    <PlanContext.Provider value={{ updateCell, setFocus, getFocus }} children={props.children} />
  )
}

export function usePlanContext() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('useMteContext must be used within <MteProvider />')
  }
  return context
}
