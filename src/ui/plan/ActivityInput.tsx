import {
  forwardRef,
  useRef,
  useState,
  Component,
  type ForwardedRef,
  type ChangeEventHandler,
} from 'preact/compat'
import { Combobox } from '@headlessui/react'
import { ActivitySuggesterPopup } from './ActivitySuggesterPopup'
import { usePlanContext } from './context'
import { getAPI } from 'obsidian-dataview'
interface IActivityInputProps {
  value: string
  onChange: (value: string) => void
  onBlur: (value: string) => void
}

export const ActivityInput = forwardRef(
  (props: IActivityInputProps, inputRef: ForwardedRef<HTMLInputElement>) => {
    const comboRef = useRef<Component>(null)
    const { settings } = usePlanContext()
    const [value, setValue] = useState(() => props.value)
    const [enableSuggester] = useState(
      () => settings.enableActivityAutoCompletion && Boolean(getAPI())
    )

    const handleChange = (value: string) => {
      setValue(value)
      props.onChange(value)
    }

    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      const value = e.currentTarget.value
      setValue(value)
    }

    return (
      <Combobox ref={comboRef} value={value} onChange={handleChange}>
        {({ open }: { open: boolean }) => (
          <>
            <Combobox.Input
              ref={inputRef}
              style={{
                all: 'unset',
              }}
              onBlur={() => props.onBlur(value)}
              onChange={handleInputChange}
            />
            {enableSuggester && open && comboRef.current?.base && (
              <ActivitySuggesterPopup
                anchor={comboRef.current.base as HTMLElement}
                keyword={value}
              />
            )}
          </>
        )}
      </Combobox>
    )
  }
)
