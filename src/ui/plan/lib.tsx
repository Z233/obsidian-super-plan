import { forwardRef, useEffect, useRef, type ForwardedRef } from 'preact/compat'
import type { JSX } from 'preact/jsx-runtime'
import { getIcon } from 'obsidian'

export const DefaultInput = forwardRef(
  (props: JSX.HTMLAttributes<HTMLInputElement>, ref: ForwardedRef<HTMLInputElement>) => {
    const { ref: unused, ...rest } = props

    return (
      <input
        ref={ref}
        style={{
          all: 'unset',
        }}
        {...rest}
      />
    )
  }
)

export const DefaultButton = forwardRef(
  (props: JSX.HTMLAttributes<HTMLButtonElement>, ref: ForwardedRef<HTMLButtonElement>) => {
    const { ref: unused, ...rest } = props

    return (
      <button
        ref={ref}
        style={{
          all: 'unset',
        }}
        {...rest}
      />
    )
  }
)

export const PlusIcon = () => {
  const wrapperRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.appendChild(getIcon('plus')!)
    }
  }, [])

  return <span ref={wrapperRef} className="flex [&>svg]:m-auto"></span>
}
