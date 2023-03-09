import { useEffect, useState, useRef, type ChangeEventHandler } from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
import type { ColumnKeys } from 'src/constants'
import type { PlanDataItem } from 'src/schemas'
import { check } from 'src/util/helper'
import { usePlanContext } from './context'
import { DefaultInput } from './lib'
import type { PlanTableColumnDef } from './PlanTable'
import { focusStyle } from './styles'

export const renderCheckboxCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { updateCell, setFocus, getFocus } = usePlanContext()
  const prevValueRef = useRef(check(getValue() as string))
  const inputRef = useRef<HTMLInputElement>(null)
  const [checked, setChecked] = useState(() => prevValueRef.current)
  const [isFocus, setIsFocus] = useState(false)

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

  const handleBlur: JSXInternal.FocusEventHandler<HTMLTableCellElement> = (e) => {
    setIsFocus(false)
  }

  const handleFocus: JSXInternal.FocusEventHandler<HTMLTableCellElement> = (e) => {
    setIsFocus(true)
    setFocus(row.index, column.id as ColumnKeys)
  }

  useEffect(() => {
    const focus = getFocus()
    if (focus?.row === row.index && focus?.columnKey === column.id) {
      inputRef.current?.focus()
    }
  }, [])

  return (
    <td className={isFocus ? focusStyle : ''} onFocus={handleFocus} onBlur={handleBlur}>
      <input ref={inputRef} type="checkbox" checked={checked} onChange={handleChange} />
    </td>
  )
}

export const renderActivityCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { updateCell, setFocus, getFocus } = usePlanContext()
  const prevValueRef = useRef(getValue() as string)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState(() => prevValueRef.current)
  const [isFocus, setIsFocus] = useState(false)

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = (e.target as any).value
    setInput(value)
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLTableCellElement> = (e) => {
    setIsFocus(false)
    if (input !== prevValueRef.current) {
      updateCell(row.index, column.id as ColumnKeys, input)
      prevValueRef.current = input
    }
  }

  const handleFocus: JSXInternal.FocusEventHandler<HTMLTableCellElement> = (e) => {
    setIsFocus(true)
    setFocus(row.index, column.id as ColumnKeys)
  }

  useEffect(() => {
    const focus = getFocus()
    if (focus?.row === row.index && focus?.columnKey === column.id) {
      inputRef.current?.focus()
    }
  }, [])

  return (
    <td className={isFocus ? focusStyle : ''} onFocus={handleFocus} onBlur={handleBlur}>
      <DefaultInput ref={inputRef} type="text" value={input} onChange={handleChange} />
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
