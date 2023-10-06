import {
  forwardRef,
  useRef,
  useState,
} from 'preact/compat'
import type {
  type ChangeEventHandler,

  Component,
  type ForwardedRef,
} from 'preact/compat'
import { Combobox } from '@headlessui/react'
import { getAPI } from 'obsidian-dataview'
import { Keys } from 'src/constants'
import { ActivitySuggesterPopup } from './ActivitySuggesterPopup'
import { usePlanContext } from './context'

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
      () => settings.enableActivityAutoCompletion && Boolean(getAPI()),
    )

    const handleChange = (value: string) => {
      setValue(value)
      props.onChange(value)
    }

    const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      const value = e.currentTarget.value
      setValue(value)
    }

    const handleKeyDown = (e: KeyboardEvent, open: boolean) => {
      if (!open && [Keys.ArrowUp, Keys.ArrowDown].includes(e.key as Keys))
        e.preventDefault()
    }

    return (
      <Combobox ref={comboRef} value={value} onChange={handleChange}>
        {({ open }: { open: boolean }) => (
          <>
            <Combobox.Input
              ref={inputRef}
              className="!w-full"
              style={{
                all: 'unset',
              }}
              onBlur={() => props.onBlur(value)}
              onChange={handleInputChange}
              onKeyDown={(e: KeyboardEvent) => handleKeyDown(e, open)}
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
  },
)
