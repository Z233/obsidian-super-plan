import type { CellContext } from '@tanstack/react-table'
import {
  type ChangeEventHandler,
  type FC,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
import { type ColumnKeys, ColumnKeysMap, Columns, Keys } from 'src/constants'
import type { PlanDataItem } from 'src/schemas'
import { check } from 'src/util/helper'
import { useAtom } from 'jotai'
import { usePlan } from './context'
import { DefaultInput } from './lib'
import type { CellPosition } from './types'
import { ActivityInput } from './ActivityInput'
import { focusCellAtom } from './atoms'

export type CellProps = CellContext<PlanDataItem, unknown>

function useAutoFocus(position: CellPosition) {
  const [elRef, setElRef] = useState<HTMLElement | null>(null)
  const [focusCell] = useAtom(focusCellAtom)

  useLayoutEffect(() => {
    if (
      elRef !== null
      && focusCell !== null
      && focusCell.rowIndex === position.rowIndex
      && focusCell.columnKey === position.columnKey
    ) {
      requestAnimationFrame(() => {
        elRef.focus()
      })
    }
  }, [focusCell, elRef])

  return {
    setElRef,
  }
}

export const renderCheckboxCell: FC<CellProps> = ({ getValue, row, column }) => {
  const { updateCell } = usePlan()
  const { setElRef } = useAutoFocus({ rowIndex: row.index, columnKey: column.id as ColumnKeys })

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
    <div className="flex">
      <input
        className="m-auto"
        ref={setElRef}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
      />
    </div>
  )
}

export const renderActivityCell: FC<CellProps> = ({ getValue, row, column }) => {
  const { updateCell } = usePlan()
  const { setElRef } = useAutoFocus({ rowIndex: row.index, columnKey: column.id as ColumnKeys })

  const prevValueRef = useRef(getValue() as string)
  const [input, setInput] = useState(() => prevValueRef.current)

  const handleBlur = (value: string) => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value

      updateCell(row.index, column.id as ColumnKeys, value)
    }
  }

  return <ActivityInput ref={setElRef} value={input} onChange={setInput} onBlur={handleBlur} />
}

export const renderStartCell: FC<CellProps> = ({ getValue, row, column }) => {
  const { updateCell } = usePlan()
  const { setElRef } = useAutoFocus({ rowIndex: row.index, columnKey: column.id as ColumnKeys })

  const prevValueRef = useRef(getValue() as string)
  const [input, setInput] = useState(() => prevValueRef.current)

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = (e.target as any).value
    setInput(value)
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLInputElement> = () => {
    if (input !== prevValueRef.current) {
      prevValueRef.current = input

      updateCell(row.index, column.id as ColumnKeys, input)
      updateCell(row.index, ColumnKeysMap[Columns.F], 'x')
    }
  }

  return (
    <DefaultInput
      className="!w-full"
      ref={setElRef}
      type="text"
      value={input}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

export const renderLengthCell: FC<CellProps> = ({ getValue, row, column }) => {
  const { updateCell } = usePlan()
  const { setElRef } = useAutoFocus({ rowIndex: row.index, columnKey: column.id as ColumnKeys })

  const prevValueRef = useRef(getValue() as string)
  const [input, setInput] = useState(() => prevValueRef.current)

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = (e.target as any).value
    setInput(value)
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLInputElement> = () => {
    if (input !== prevValueRef.current) {
      prevValueRef.current = input

      updateCell(row.index, column.id as ColumnKeys, input)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if ([Keys.ArrowUp, Keys.ArrowDown].includes(e.key as Keys))
      e.preventDefault()
  }

  return (
    <DefaultInput
      ref={setElRef}
      type="number"
      className="!w-10"
      value={input}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  )
}

export const renderActLenCell: FC<CellProps> = ({ getValue }) => {
  return <>{getValue()}</>
}
