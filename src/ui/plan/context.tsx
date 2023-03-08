import { createContext, useContext, useEffect, useRef, type FC } from 'preact/compat'
import type { MdTableEditor } from 'src/editor/md-table-editor'
import { Scheduler } from 'src/scheduler'
import type { PlanData, PlanDataItem } from 'src/schemas'
import { useImmer } from 'use-immer'

type PlanContextValue = {
  updateCell: (row: number, columnKey: keyof PlanDataItem, value: string) => void
}

const PlanContext = createContext<PlanContextValue>(null as unknown as PlanContextValue)

const shallowCompare = (obj1: Record<any, any>, obj2: Record<any, any>) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every((key) => obj2.hasOwnProperty(key) && obj1[key] === obj2[key])

export const PlanProvider: FC<{ mte: MdTableEditor; data: PlanData }> = (props) => {
  const { mte, data: initialData } = props
  const previousDataRef = useRef(initialData)
  const [data, setData] = useImmer(initialData)

  const updateCell: PlanContextValue['updateCell'] = (row, columnKey, value) => {
    setData((draft) => {
      previousDataRef.current = data
      draft[row][columnKey] = value
    })
  }

  useEffect(() => {
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

  return <PlanContext.Provider value={{ updateCell }} children={props.children} />
}

export function usePlanContext() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('useMteContext must be used within <MteProvider />')
  }
  return context
}
