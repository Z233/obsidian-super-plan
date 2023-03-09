import { useEffect, useState, useRef, type ChangeEventHandler } from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
import type { ColumnKeys } from 'src/constants'
import type { PlanDataItem } from 'src/schemas'
import { check } from 'src/util/helper'
import { usePlanContext } from './context'
import { useCellFocus } from './hooks'
import { DefaultInput } from './lib'
import type { PlanTableColumnDef } from './PlanTable'
import { focusStyle } from './styles'

export const renderCheckboxCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { updateCell } = usePlanContext()
  const { focusElRef, onBlur, onFocus, isFocused } = useCellFocus(
    row.index,
    column.id as ColumnKeys
  )

  const prevValueRef = useRef(check(getValue() as string))
  const [checked, setChecked] = useState(() => prevValueRef.current)

  useEffect(() => {
    if (checked !== prevValueRef.current) {
      updateCell(row.index, column.id as ColumnKeys, checked ? 'x' : '')
      prevValueRef.current = checked
    }
  }, [checked])

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const checked = (e.target as any).checked
    setChecked(checked)
  }

  return (
    <td className={isFocused ? focusStyle : ''} onFocus={onFocus} onBlur={onBlur}>
      <input ref={focusElRef} type="checkbox" checked={checked} onChange={handleChange} />
    </td>
  )
}

export const renderActivityCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { updateCell } = usePlanContext()
  const { focusElRef, onBlur, onFocus, isFocused } = useCellFocus(
    row.index,
    column.id as ColumnKeys
  )

  const prevValueRef = useRef(getValue() as string)
  const [input, setInput] = useState(() => prevValueRef.current)

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = (e.target as any).value
    setInput(value)
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLTableCellElement> = (e) => {
    onBlur()
    if (input !== prevValueRef.current) {
      updateCell(row.index, column.id as ColumnKeys, input)
      prevValueRef.current = input
    }
  }

  const handleFocus: JSXInternal.FocusEventHandler<HTMLTableCellElement> = (e) => {
    onFocus()
  }

  return (
    <td className={isFocused ? focusStyle : ''} onFocus={handleFocus} onBlur={handleBlur}>
      <DefaultInput ref={focusElRef} type="text" value={input} onChange={handleChange} />
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
