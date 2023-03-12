import { useEffect, useRef } from 'preact/compat'
import type { ColumnKeys } from 'src/constants'
import { usePlanContext } from './context'

export function useFocusOnMount(rowIndex: number, columnKey: ColumnKeys) {
  const { getFocus } = usePlanContext()

  const focusElRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focus = getFocus()
    if (focus?.rowIndex === rowIndex && focus?.columnKey === columnKey) {
      focusElRef.current?.focus()
    }
  }, [])

  return { focusElRef }
}
