import { useEffect, useState, useRef, type ChangeEventHandler } from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
import type { ColumnKeys } from 'src/constants'
import { check } from 'src/util/helper'
import { usePlanContext } from './context'
import { useFocusOnMount } from './hooks'
import { DefaultInput } from './lib'
import type { PlanTableColumnDef } from './PlanTable'

export const renderCheckboxCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { updateCell } = usePlanContext()
  const { focusElRef } = useFocusOnMount(row.index, column.id as ColumnKeys)

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
    <input
      className="relative top-[1.5px]"
      ref={focusElRef}
      type="checkbox"
      checked={checked}
      onChange={handleChange}
    />
  )
}

export const renderActivityCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { updateCell } = usePlanContext()
  const { focusElRef } = useFocusOnMount(row.index, column.id as ColumnKeys)

  const prevValueRef = useRef(getValue() as string)
  const [input, setInput] = useState(() => prevValueRef.current)

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = (e.target as any).value
    setInput(value)
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLInputElement> = (e) => {
    if (input !== prevValueRef.current) {
      updateCell(row.index, column.id as ColumnKeys, input)
      prevValueRef.current = input
    }
  }

  return (
    <DefaultInput
      ref={focusElRef}
      type="text"
      value={input}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

export const renderStartCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { focusElRef } = useFocusOnMount(row.index, column.id as ColumnKeys)
  const { updateCell } = usePlanContext()

  const prevValueRef = useRef(getValue() as string)
  const [input, setInput] = useState(() => prevValueRef.current)

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = (e.target as any).value
    setInput(value)
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLInputElement> = (e) => {
    if (input !== prevValueRef.current) {
      updateCell(row.index, column.id as ColumnKeys, input)
      prevValueRef.current = input
    }
  }

  return (
    <DefaultInput
      ref={focusElRef}
      type="text"
      className="!w-10"
      value={input}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

export const renderLengthCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { focusElRef } = useFocusOnMount(row.index, column.id as ColumnKeys)
  const { updateCell } = usePlanContext()

  const prevValueRef = useRef(getValue() as string)
  const [input, setInput] = useState(() => prevValueRef.current)

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = (e.target as any).value
    setInput(value)
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLInputElement> = (e) => {
    if (input !== prevValueRef.current) {
      updateCell(row.index, column.id as ColumnKeys, input)
      prevValueRef.current = input
    }
  }

  return (
    <DefaultInput
      ref={focusElRef}
      type="number"
      className="!w-10"
      value={input}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

export const renderActLenCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  return getValue()
}
