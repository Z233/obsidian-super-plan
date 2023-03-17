import { useEffect, useRef } from 'preact/compat'
import type { ColumnKeys } from 'src/constants'
import { usePlanContext } from './context'

export function useFocusOnMount(rowIndex: number, columnKey: ColumnKeys) {
  const { focusedPosition } = usePlanContext()

  const focusElRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusedPosition?.rowIndex === rowIndex && focusedPosition?.columnKey === columnKey) {
      focusElRef.current?.focus()
    }
  }, [focusedPosition])

  return { focusElRef }
}
