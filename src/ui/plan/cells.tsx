import { useEffect, useState, type ChangeEventHandler, useRef } from 'preact/compat'
import type { PlanDataItem } from 'src/schemas'
import { check } from 'src/util/helper'
import { usePlanContext } from './context'
import { DefaultInput } from './lib'
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

  return (
    <td>
      <input type="checkbox" checked={checked} onChange={handleChange} />
    </td>
  )
}

export const renderActivityCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { updateCell } = usePlanContext()
  const prevValueRef = useRef(getValue() as string)
  const [input, setInput] = useState(() => prevValueRef.current)
  const [isFocus, setIsFocus] = useState(false)

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = (e.target as any).value
    setInput(value)
  }

  return (
    <td
      className={isFocus ? 'outline outline-2 outline-$interactive-accent' : ''}
      onFocus={() => setIsFocus(true)}
      onBlur={() => setIsFocus(false)}
    >
      <DefaultInput type="text" value={input} onChange={handleChange} />
    </td>
  )
}

export const renderStartCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  return <td>{getValue() as string}</td>
}

export const renderLengthCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  return <td>{getValue() as string}</td>
}

export const renderActLenCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  return <td>{getValue() as string}</td>
}
