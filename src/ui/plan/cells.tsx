import { useEffect, useState, useRef, type ChangeEventHandler } from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
import { ColumnKeysMap, Columns, type ColumnKeys } from 'src/constants'
import { check } from 'src/util/helper'
import { usePlanContext } from './context'
import { useFocusOnMount } from './hooks'
import { DefaultInput } from './lib'
import type { PlanTableColumnDef } from './PlanTable'

export const renderCheckboxCell: PlanTableColumnDef['cell'] = ({ getValue, row, column }) => {
  const { updateCell, setFocusedPosition } = usePlanContext()
  const { focusElRef } = useFocusOnMount(row.index, column.id as ColumnKeys)

  const prevValueRef = useRef(check(getValue() as string))
  const [checked, setChecked] = useState(() => prevValueRef.current)

  useEffect(() => {
    if (checked !== prevValueRef.current) {
      setFocusedPosition({ rowIndex: row.index, columnKey: column.id as ColumnKeys })
      updateCell(row.index, column.id as ColumnKeys, checked ? 'x' : '')
      prevValueRef.current = checked
    }
  }, [checked])

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const checked = (e.target as any).checked
    setChecked(checked)
  }

  return (
    <div className="flex">
      <input
        className="m-auto"
        ref={focusElRef}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
      />
    </div>
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
      prevValueRef.current = input

      setImmediate(() => {
        updateCell(row.index, column.id as ColumnKeys, input)
      })
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
      prevValueRef.current = input

      setImmediate(() => {
        updateCell(row.index, column.id as ColumnKeys, input)
        updateCell(row.index, ColumnKeysMap[Columns.F], 'x')
      })
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
      prevValueRef.current = input

      setImmediate(() => {
        updateCell(row.index, column.id as ColumnKeys, input)
      })
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
