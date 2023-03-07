import { useEffect, useState, type ChangeEventHandler, useRef } from 'preact/compat'
import type { PlanDataItem } from 'src/schemas'
import { check } from 'src/util/helper'
import { usePlanContext } from './context'
import type { PlanTableColumnDef } from './PlanTable'

export const renderCheckboxCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { updateCell } = usePlanContext()
  const prevValueRef = useRef(check(getValue() as string))
  const [checked, setChecked] = useState(() => prevValueRef.current)

  useEffect(() => {
    if (checked !== prevValueRef.current) {
      updateCell(row.index, column.id as keyof PlanDataItem, checked ? 'x' : '')
      prevValueRef.current = checked
    }
  }, [checked])

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const checked = (e.target as any).checked
    setChecked(checked)
  }

  return <input type="checkbox" checked={checked} onChange={handleChange} />
}
