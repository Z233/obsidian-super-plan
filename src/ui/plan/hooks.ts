import { useEffect, useRef, useState, type Ref } from 'preact/compat'
import type { ColumnKeys } from 'src/constants'
import { usePlanContext } from './context'

export function useCellFocus(rowIndex: number, columnKey: ColumnKeys) {
  const { setFocus, getFocus } = usePlanContext()

  const focusElRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  const onBlur = () => {
    setIsFocused(false)
  }

  const onFocus = () => {
    setIsFocused(true)
    setFocus(rowIndex, columnKey)
  }

  useEffect(() => {
    const focus = getFocus()
    if (focus?.row === rowIndex && focus?.columnKey === columnKey) {
      focusElRef.current?.focus()
    }
  }, [])

  return { focusElRef, isFocused, onBlur, onFocus }
}
